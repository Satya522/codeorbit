import type * as Party from "partykit/server";
import { onConnect, type YPartyKitOptions } from "y-partykit";
import * as Y from "yjs";

type IncomingMessage =
  | {
      type: "cursor";
      color?: string;
      cursor: unknown;
      userId: string;
    }
  | {
      type: "run-code";
      code: string;
      language: string;
      userId: string;
    };

export default class CodeServer implements Party.Server {
  constructor(readonly room: Party.Room) {}

  private readonly yjsOptions: YPartyKitOptions = {
    persist: true,
  };

  onConnect(conn: Party.Connection) {
    return onConnect(conn, this.room, {
      ...this.yjsOptions,
      callback: {
        debounceMaxWait: 30_000,
        debounceWait: 30_000,
        handler: (doc) => this.onYDocUpdate(doc),
      },
    });
  }

  async onYDocUpdate(doc: Y.Doc) {
    const code = doc.getText("codemirror").toString();

    this.room.broadcast(
      JSON.stringify({
        codeLength: code.length,
        roomId: this.room.id,
        timestamp: Date.now(),
        type: "sync",
      }),
    );
  }

  async onMessage(message: string | ArrayBuffer | ArrayBufferView, sender: Party.Connection) {
    if (typeof message !== "string") {
      return;
    }

    let data: IncomingMessage;

    try {
      data = JSON.parse(message) as IncomingMessage;
    } catch {
      this.room.broadcast(
        JSON.stringify({
          message: "Invalid realtime payload.",
          type: "error",
        }),
        [sender.id],
      );
      return;
    }

    switch (data.type) {
      case "cursor":
        this.room.broadcast(
          JSON.stringify({
            color: data.color,
            cursor: data.cursor,
            type: "cursor",
            userId: data.userId,
          }),
          [sender.id],
        );
        break;

      case "run-code":
        await this.handleRunCode(data);
        break;
    }
  }

  private getAppUrl() {
    const env = this.room.env as Record<string, unknown>;
    const url = env.NEXT_PUBLIC_URL ?? env.NEXT_PUBLIC_APP_URL ?? "http://127.0.0.1:3000";

    return String(url).replace(/\/+$/, "");
  }

  private async handleRunCode(data: Extract<IncomingMessage, { type: "run-code" }>) {
    this.room.broadcast(
      JSON.stringify({
        language: data.language,
        type: "execution-start",
        userId: data.userId,
      }),
    );

    try {
      const response = await fetch(`${this.getAppUrl()}/api/execute`, {
        body: JSON.stringify({
          code: data.code,
          language: data.language,
          roomId: this.room.id,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      const result = (await response.json()) as unknown;

      this.room.broadcast(
        JSON.stringify({
          result,
          type: "execution-result",
        }),
      );
    } catch (error) {
      this.room.broadcast(
        JSON.stringify({
          result: {
            error: error instanceof Error ? error.message : "Execution failed.",
            output: null,
          },
          type: "execution-result",
        }),
      );
    }
  }
}
