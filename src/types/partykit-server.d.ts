declare module "partykit/server" {
  export interface Connection {
    id: string;
  }

  export interface Room {
    id: string;
    env: unknown;
    broadcast(message: string, except?: string[]): void;
  }

  export interface Server {
    onConnect?(conn: Connection): unknown;
    onMessage?(message: string | ArrayBuffer | ArrayBufferView, sender: Connection): unknown;
  }
}
