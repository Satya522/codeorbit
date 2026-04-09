import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export type PlaygroundLspLanguage = "css" | "html" | "javascript";

export type PlaygroundLspWorkspaceFile = {
  language: string;
  text: string;
  uri: string;
};

type LspCompletionContext = {
  triggerCharacter?: string;
  triggerKind?: number;
};

type LspCompletionRequest = {
  documentUri: string;
  files: PlaygroundLspWorkspaceFile[];
  language: PlaygroundLspLanguage;
  position: {
    column: number;
    line: number;
  };
  requestContext?: LspCompletionContext;
};

type JsonRpcRequest = {
  id: number;
  jsonrpc: "2.0";
  method: string;
  params?: unknown;
};

type JsonRpcMessage = {
  error?: {
    code: number;
    message: string;
  };
  id?: number;
  jsonrpc: "2.0";
  method?: string;
  params?: unknown;
  result?: unknown;
};

type ManagedDocument = {
  language: string;
  text: string;
  version: number;
};

type LspServerOptions = {
  args: string[];
  bin: string;
  configuration?: Record<string, unknown>;
  rootUri: string;
  serverKind: PlaygroundLspLanguage;
};

const virtualWorkspaceRootUri = "file:///codeorbit-playground";
const writableTempRoot =
  process.env.TMPDIR || process.env.TEMP || process.env.TMP || "/tmp";
const resolvedWorkspaceRootPath = path.join(writableTempRoot, "codeorbit-playground-workspace");
const resolvedWorkspaceRootUri = pathToFileURL(resolvedWorkspaceRootPath).toString();

function ensureResolvedWorkspaceRoot() {
  mkdirSync(resolvedWorkspaceRootPath, { recursive: true });
}

function mapWorkspaceUriToServerUri(uri: string) {
  if (!uri.startsWith(virtualWorkspaceRootUri)) {
    return uri;
  }

  return `${resolvedWorkspaceRootUri}${uri.slice(virtualWorkspaceRootUri.length)}`;
}

function resolvePackageBin(
  packageName: "typescript-language-server" | "vscode-langservers-extracted",
  binName: string,
) {
  const packageJsonPath = path.join(process.cwd(), "node_modules", packageName, "package.json");
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
    bin?: Record<string, string> | string;
  };

  const binRelativePath =
    typeof packageJson.bin === "string" ? packageJson.bin : packageJson.bin?.[binName];

  if (!binRelativePath) {
    throw new Error(`Unable to resolve ${binName} from ${packageName}.`);
  }

  return path.join(path.dirname(packageJsonPath), binRelativePath);
}

class LspServerManager {
  private buffer = Buffer.alloc(0);
  private documents = new Map<string, ManagedDocument>();
  private initializePromise: Promise<void> | null = null;
  private nextRequestId = 1;
  private pendingRequests = new Map<number, { reject(error: Error): void; resolve(value: unknown): void }>();
  private process: ChildProcessWithoutNullStreams | null = null;
  private queue = Promise.resolve();

  constructor(private readonly options: LspServerOptions) {}

  enqueue<T>(task: () => Promise<T>) {
    const run = this.queue.then(task, task);
    this.queue = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  async complete(request: LspCompletionRequest) {
    return this.enqueue(async () => {
      await this.ensureInitialized();
      this.syncDocuments(request.files);

      return this.sendRequest("textDocument/completion", {
        context: {
          triggerCharacter: request.requestContext?.triggerCharacter,
          triggerKind: request.requestContext?.triggerCharacter ? 2 : 1,
        },
        position: {
          character: Math.max(0, request.position.column - 1),
          line: Math.max(0, request.position.line - 1),
        },
        textDocument: {
          uri: request.documentUri,
        },
      });
    });
  }

  private async ensureInitialized() {
    if (this.initializePromise) {
      return this.initializePromise;
    }

    this.initializePromise = (async () => {
      ensureResolvedWorkspaceRoot();
      this.ensureProcess();

      const initializeResult = await this.sendRequest("initialize", {
        capabilities: {
          textDocument: {
            completion: {
              completionItem: {
                commitCharactersSupport: true,
                documentationFormat: ["markdown", "plaintext"],
                insertReplaceSupport: true,
                labelDetailsSupport: true,
                snippetSupport: true,
              },
            },
          },
          workspace: {
            configuration: true,
            workspaceFolders: true,
          },
        },
        clientInfo: {
          name: "CodeOrbit",
          version: "0.1.3",
        },
        processId: process.pid,
        rootUri: this.options.rootUri,
        workspaceFolders: [
          {
            name: "codeorbit-playground",
            uri: this.options.rootUri,
          },
        ],
      });

      if (!initializeResult) {
        throw new Error(`${this.options.serverKind} LSP failed to initialize.`);
      }

      this.sendNotification("initialized", {});

      if (this.options.configuration) {
        this.sendNotification("workspace/didChangeConfiguration", {
          settings: this.options.configuration,
        });
      }
    })();

    return this.initializePromise;
  }

  private ensureProcess() {
    if (this.process) {
      return this.process;
    }

    const spawned = spawn(process.execPath, [this.options.bin, ...this.options.args], {
      env: process.env,
      stdio: "pipe",
    });

    spawned.stdout.on("data", (chunk: Buffer) => {
      this.buffer = Buffer.concat([this.buffer, chunk]);
      this.processBuffer();
    });

    spawned.stderr.on("data", (chunk: Buffer) => {
      const output = chunk.toString("utf8").trim();

      if (output) {
        console.warn(`[CodeOrbit:${this.options.serverKind}:stderr] ${output}`);
      }
    });

    const resetState = (reason: string) => {
      for (const pending of this.pendingRequests.values()) {
        pending.reject(new Error(reason));
      }

      this.pendingRequests.clear();
      this.documents.clear();
      this.initializePromise = null;
      this.process = null;
      this.buffer = Buffer.alloc(0);
    };

    spawned.on("error", (error) => {
      resetState(`${this.options.serverKind} LSP process error: ${error.message}`);
    });

    spawned.on("exit", (code, signal) => {
      resetState(
        `${this.options.serverKind} LSP exited unexpectedly (code=${code ?? "null"}, signal=${signal ?? "null"}).`,
      );
    });

    this.process = spawned;
    return spawned;
  }

  private processBuffer() {
    while (true) {
      const headerBoundary = this.buffer.indexOf("\r\n\r\n");

      if (headerBoundary === -1) {
        return;
      }

      const header = this.buffer.subarray(0, headerBoundary).toString("utf8");
      const match = header.match(/Content-Length:\s*(\d+)/i);

      if (!match) {
        this.buffer = this.buffer.subarray(headerBoundary + 4);
        continue;
      }

      const messageLength = Number.parseInt(match[1] ?? "0", 10);
      const messageStart = headerBoundary + 4;
      const messageEnd = messageStart + messageLength;

      if (this.buffer.length < messageEnd) {
        return;
      }

      const payload = this.buffer.subarray(messageStart, messageEnd).toString("utf8");
      this.buffer = this.buffer.subarray(messageEnd);

      try {
        this.handleMessage(JSON.parse(payload) as JsonRpcMessage);
      } catch (error) {
        console.warn(
          `[CodeOrbit:${this.options.serverKind}] Unable to parse LSP payload.`,
          error instanceof Error ? error.message : error,
        );
      }
    }
  }

  private getConfigurationValue(section?: string) {
    if (!section) {
      return this.options.configuration ?? {};
    }

    const sectionPath = section.split(".");
    let currentValue: unknown = this.options.configuration ?? {};

    for (const part of sectionPath) {
      if (!currentValue || typeof currentValue !== "object") {
        return null;
      }

      currentValue = (currentValue as Record<string, unknown>)[part];
    }

    return currentValue ?? null;
  }

  private respondToServerRequest(id: number, method: string, params?: unknown) {
    if (method === "workspace/configuration") {
      const items =
        params &&
        typeof params === "object" &&
        "items" in params &&
        Array.isArray((params as { items?: unknown[] }).items)
          ? (params as { items: Array<{ section?: string }> }).items
          : [];

      this.send({
        id,
        jsonrpc: "2.0",
        result: items.map((item) => this.getConfigurationValue(item.section)),
      });
      return;
    }

    if (method === "workspace/workspaceFolders") {
      this.send({
        id,
        jsonrpc: "2.0",
        result: [
          {
            name: "codeorbit-playground",
            uri: this.options.rootUri,
          },
        ],
      });
      return;
    }

    this.send({
      id,
      jsonrpc: "2.0",
      result: null,
    });
  }

  private handleMessage(message: JsonRpcMessage) {
    if (message.method) {
      if (typeof message.id === "number") {
        this.respondToServerRequest(message.id, message.method, message.params);
      }

      return;
    }

    if (typeof message.id !== "number") {
      return;
    }

    const pending = this.pendingRequests.get(message.id);

    if (!pending) {
      return;
    }

    this.pendingRequests.delete(message.id);

    if (message.error) {
      pending.reject(new Error(message.error.message));
      return;
    }

    pending.resolve(message.result);
  }

  private send(message: JsonRpcMessage | JsonRpcRequest | Omit<JsonRpcRequest, "id">) {
    const processRef = this.ensureProcess();
    const payload = JSON.stringify(message);
    processRef.stdin.write(`Content-Length: ${Buffer.byteLength(payload, "utf8")}\r\n\r\n${payload}`);
  }

  private sendNotification(method: string, params?: unknown) {
    this.send({
      jsonrpc: "2.0",
      method,
      params,
    });
  }

  private sendRequest(method: string, params?: unknown) {
    const id = this.nextRequestId;
    this.nextRequestId += 1;

    const promise = new Promise<unknown>((resolve, reject) => {
      this.pendingRequests.set(id, { reject, resolve });
    });

    this.send({
      id,
      jsonrpc: "2.0",
      method,
      params,
    });

    return promise;
  }

  private syncDocuments(nextFiles: PlaygroundLspWorkspaceFile[]) {
    const nextUris = new Set(nextFiles.map((file) => file.uri));

    for (const existingUri of this.documents.keys()) {
      if (nextUris.has(existingUri)) {
        continue;
      }

      this.sendNotification("textDocument/didClose", {
        textDocument: {
          uri: existingUri,
        },
      });
      this.documents.delete(existingUri);
    }

    for (const file of nextFiles) {
      const existing = this.documents.get(file.uri);

      if (!existing) {
        this.documents.set(file.uri, {
          language: file.language,
          text: file.text,
          version: 1,
        });
        this.sendNotification("textDocument/didOpen", {
          textDocument: {
            languageId: file.language,
            text: file.text,
            uri: file.uri,
            version: 1,
          },
        });
        continue;
      }

      if (existing.text === file.text && existing.language === file.language) {
        continue;
      }

      const nextVersion = existing.version + 1;
      this.documents.set(file.uri, {
        language: file.language,
        text: file.text,
        version: nextVersion,
      });
      this.sendNotification("textDocument/didChange", {
        contentChanges: [{ text: file.text }],
        textDocument: {
          uri: file.uri,
          version: nextVersion,
        },
      });
    }
  }
}

let javascriptServerManager: LspServerManager | null = null;
let htmlServerManager: LspServerManager | null = null;
let cssServerManager: LspServerManager | null = null;

function getJavascriptServerManager() {
  if (!javascriptServerManager) {
    javascriptServerManager = new LspServerManager({
      args: ["--stdio"],
      bin: resolvePackageBin("typescript-language-server", "typescript-language-server"),
      configuration: {
        javascript: {
          format: {
            semicolons: "insert",
          },
          implicitProjectConfiguration: {
            checkJs: true,
            module: "ESNext",
            target: "ES2022",
          },
          preferences: {
            includeAutomaticOptionalChainCompletions: true,
            includeCompletionsForImportStatements: true,
            includeCompletionsForModuleExports: true,
            includeCompletionsWithInsertText: true,
            includePackageJsonAutoImports: "on",
            quotePreference: "auto",
          },
          suggest: {
            completeFunctionCalls: true,
          },
        },
        typescript: {
          preferences: {
            includeAutomaticOptionalChainCompletions: true,
            includeCompletionsForImportStatements: true,
            includeCompletionsForModuleExports: true,
            includeCompletionsWithInsertText: true,
            includePackageJsonAutoImports: "on",
            quotePreference: "auto",
          },
          suggest: {
            completeFunctionCalls: true,
          },
        },
      },
      rootUri: resolvedWorkspaceRootUri,
      serverKind: "javascript",
    });
  }

  return javascriptServerManager;
}

function getHtmlServerManager() {
  if (!htmlServerManager) {
    htmlServerManager = new LspServerManager({
      args: ["--stdio"],
      bin: resolvePackageBin("vscode-langservers-extracted", "vscode-html-language-server"),
      rootUri: resolvedWorkspaceRootUri,
      serverKind: "html",
    });
  }

  return htmlServerManager;
}

function getCssServerManager() {
  if (!cssServerManager) {
    cssServerManager = new LspServerManager({
      args: ["--stdio"],
      bin: resolvePackageBin("vscode-langservers-extracted", "vscode-css-language-server"),
      rootUri: resolvedWorkspaceRootUri,
      serverKind: "css",
    });
  }

  return cssServerManager;
}

function filterFilesForLanguage(language: PlaygroundLspLanguage, files: PlaygroundLspWorkspaceFile[]) {
  if (language === "javascript") {
    return files.filter((file) =>
      ["javascript", "javascriptreact", "typescript", "typescriptreact"].includes(file.language) ||
      file.uri.endsWith(".d.ts") ||
      file.uri.endsWith("jsconfig.json"),
    );
  }

  if (language === "html") {
    return files.filter((file) => file.language === "html");
  }

  return files.filter((file) => file.language === "css");
}

export async function requestPlaygroundLspCompletion(request: LspCompletionRequest) {
  const normalizedRequest = {
    ...request,
    documentUri: mapWorkspaceUriToServerUri(request.documentUri),
    files: filterFilesForLanguage(request.language, request.files).map((file) => ({
      ...file,
      uri: mapWorkspaceUriToServerUri(file.uri),
    })),
  };

  if (normalizedRequest.language === "javascript") {
    return getJavascriptServerManager().complete(normalizedRequest);
  }

  if (normalizedRequest.language === "html") {
    return getHtmlServerManager().complete(normalizedRequest);
  }

  return getCssServerManager().complete(normalizedRequest);
}
