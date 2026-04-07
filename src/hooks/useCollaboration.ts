"use client";

import type { MutableRefObject } from "react";
import { useEffect, useRef, useState } from "react";
import type { EditorProps } from "@monaco-editor/react";
import { MonacoBinding } from "y-monaco";
import YPartyKitProvider from "y-partykit/provider";
import * as Y from "yjs";

type MonacoEditorInstance = Parameters<NonNullable<EditorProps["onMount"]>>[0];

type CollaborationUser = {
  color: string;
  id: string;
  name: string;
};

type UseCollaborationOptions = {
  editorRef: MutableRefObject<MonacoEditorInstance | null>;
  roomId: string;
  userId: string;
  userName: string;
};

function buildUserColor(userId: string) {
  let hash = 0;

  for (let index = 0; index < userId.length; index += 1) {
    hash = userId.charCodeAt(index) + ((hash << 5) - hash);
  }

  const color = (hash & 0x00ffffff).toString(16).toUpperCase();
  return `#${color.padStart(6, "0")}`;
}

function normalizePartyKitHost(host?: string) {
  return (host ?? "localhost:1999")
    .replace(/^https?:\/\//, "")
    .replace(/^wss?:\/\//, "")
    .replace(/\/+$/, "");
}

export function useCollaboration({
  roomId,
  userId,
  userName,
  editorRef,
}: UseCollaborationOptions) {
  const [connected, setConnected] = useState(false);
  const [users, setUsers] = useState<CollaborationUser[]>([]);
  const [editor, setEditor] = useState<MonacoEditorInstance | null>(null);
  const [provider, setProvider] = useState<YPartyKitProvider | null>(null);
  const providerRef = useRef<YPartyKitProvider | null>(null);
  const ydocRef = useRef<Y.Doc | null>(null);

  useEffect(() => {
    if (editorRef.current) {
      setEditor(editorRef.current);
      return;
    }

    let frameId = 0;

    const syncEditor = () => {
      const instance = editorRef.current;

      if (instance) {
        setEditor((current) => (current === instance ? current : instance));
        return;
      }

      frameId = window.requestAnimationFrame(syncEditor);
    };

    frameId = window.requestAnimationFrame(syncEditor);

    return () => window.cancelAnimationFrame(frameId);
  }, [editorRef]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const model = editor.getModel();

    if (!model) {
      return;
    }

    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    const nextProvider = new YPartyKitProvider(
      normalizePartyKitHost(process.env.NEXT_PUBLIC_PARTYKIT_HOST),
      roomId,
      ydoc,
    );

    providerRef.current = nextProvider;
    queueMicrotask(() => {
      setProvider(nextProvider);
    });

    const yText = ydoc.getText("codemirror");
    const binding = new MonacoBinding(
      yText,
      model,
      new Set([editor]),
      nextProvider.awareness,
    );

    nextProvider.awareness.setLocalStateField("user", {
      color: buildUserColor(userId),
      id: userId,
      name: userName,
    });

    const handleStatus = (event: { status: string }) => {
      setConnected(event.status === "connected");
    };

    const handleAwarenessChange = () => {
      const nextUsers = Array.from(nextProvider.awareness.getStates().values())
        .map((state) => {
          if (!state || typeof state !== "object") {
            return undefined;
          }

          return (state as { user?: CollaborationUser }).user;
        })
        .filter((value): value is CollaborationUser => Boolean(value));

      setUsers(nextUsers);
    };

    nextProvider.on("status", handleStatus);
    nextProvider.awareness.on("change", handleAwarenessChange);
    handleAwarenessChange();

    return () => {
      nextProvider.off("status", handleStatus);
      nextProvider.awareness.off("change", handleAwarenessChange);
      nextProvider.awareness.setLocalState(null);
      binding.destroy();
      nextProvider.destroy();
      ydoc.destroy();
      providerRef.current = null;
      ydocRef.current = null;
      setProvider((current) => (current === nextProvider ? null : current));
      setConnected(false);
      setUsers([]);
    };
  }, [editor, roomId, userId, userName]);

  return {
    connected,
    provider,
    users,
  };
}
