import { spawn, spawnSync, type ChildProcessWithoutNullStreams } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export type PlaygroundLspLanguage = "cpp" | "css" | "html" | "java" | "javascript" | "python";

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

type CompletionItemLike = {
  kind?: number;
  label?: string | { label?: string };
};

type CompletionResultLike =
  | CompletionItemLike[]
  | {
      items?: CompletionItemLike[];
      isIncomplete?: boolean;
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
  launchWithNode?: boolean;
  rootUri: string;
  serverKind: PlaygroundLspLanguage;
};

const virtualWorkspaceRootUri = "file:///codeorbit-playground";
const writableTempRoot = process.env.TMPDIR || process.env.TEMP || process.env.TMP || "/tmp";
const resolvedWorkspaceRootPath = path.join(writableTempRoot, "codeorbit-playground-workspace");
const resolvedWorkspaceRootUri = pathToFileURL(resolvedWorkspaceRootPath).toString();
const compileCommandsPath = path.join(resolvedWorkspaceRootPath, "compile_commands.json");
const cppFallbackIncludePath = path.join(resolvedWorkspaceRootPath, "codeorbit-cpp-headers");
const javaWorkspaceDataPath = path.join(resolvedWorkspaceRootPath, "codeorbit-java-workspace");
const nodeModulesRoot = path.join(process.cwd(), "node_modules");
const vendoredJavaRuntimeRoot = path.join(
  process.cwd(),
  "vendor",
  "java",
  `${process.platform}-${process.arch}`,
);
const cppFallbackHeaders: Record<string, string> = {
  string: `#pragma once
namespace std {
using size_t = decltype(sizeof(0));

class string {
public:
  string();
  string(const char *);
  const char *c_str() const;
  bool empty() const;
  char &front();
  char &back();
  string &append(const string &);
  string &clear();
  size_t find(const string &) const;
  void push_back(char);
  size_t size() const;
  string substr(size_t, size_t = static_cast<size_t>(-1)) const;
};
} // namespace std
`,
  vector: `#pragma once
namespace std {
using size_t = decltype(sizeof(0));

template <typename T> class initializer_list;
template <typename T> class allocator;

template <typename T, typename Allocator = allocator<T>>
class vector {
public:
  using value_type = T;
  using size_type = size_t;
  using reference = T &;
  using const_reference = const T &;
  using pointer = T *;
  using iterator = T *;
  using const_iterator = const T *;
  using reverse_iterator = T *;
  using const_reverse_iterator = const T *;

  vector();
  void assign(initializer_list<value_type>);
  void assign(size_type, const value_type &);
  reference at(size_type);
  reference back();
  iterator begin();
  size_type capacity() const;
  const_iterator cbegin() const;
  const_iterator cend() const;
  void clear();
  const_reverse_iterator crbegin() const;
  const_reverse_iterator crend() const;
  pointer data();
  template <typename... Args> iterator emplace(const_iterator, Args &&...);
  template <typename... Args> void emplace_back(Args &&...);
  bool empty() const;
  iterator end();
  iterator erase(const_iterator);
  iterator erase(const_iterator, const_iterator);
  reference front();
  Allocator get_allocator() const;
  iterator insert(const_iterator, const value_type &);
  size_type max_size() const;
  void pop_back();
  void push_back(const value_type &);
  reverse_iterator rbegin();
  reverse_iterator rend();
  void reserve(size_type);
  void resize(size_type);
  void resize(size_type, const value_type &);
  void shrink_to_fit();
  size_type size() const;
  void swap(vector &);
};
} // namespace std
`,
};

function ensureResolvedWorkspaceRoot() {
  mkdirSync(resolvedWorkspaceRootPath, { recursive: true });
}

function ensureCppFallbackHeaders() {
  mkdirSync(cppFallbackIncludePath, { recursive: true });

  for (const [headerName, headerContents] of Object.entries(cppFallbackHeaders)) {
    writeFileSync(path.join(cppFallbackIncludePath, headerName), headerContents, "utf8");
  }
}

function ensureJavaWorkspaceRoot() {
  mkdirSync(javaWorkspaceDataPath, { recursive: true });
}

function mapWorkspaceUriToServerUri(uri: string) {
  if (!uri.startsWith(virtualWorkspaceRootUri)) {
    return uri;
  }

  return `${resolvedWorkspaceRootUri}${uri.slice(virtualWorkspaceRootUri.length)}`;
}

function mapServerUriToWorkspacePath(uri: string) {
  try {
    const workspacePath = fileURLToPath(uri);

    if (!workspacePath.startsWith(resolvedWorkspaceRootPath)) {
      return null;
    }

    return workspacePath;
  } catch {
    return null;
  }
}

function syncWorkspaceFilesToDisk(files: PlaygroundLspWorkspaceFile[]) {
  for (const file of files) {
    const workspacePath = mapServerUriToWorkspacePath(file.uri);

    if (!workspacePath) {
      continue;
    }

    mkdirSync(path.dirname(workspacePath), { recursive: true });
    writeFileSync(workspacePath, file.text, "utf8");
  }
}

function resolveExistingPath(absolutePath: string) {
  return existsSync(absolutePath) ? absolutePath : null;
}

function findFirstAvailableCommand(candidates: string[]) {
  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    const probe = spawnSync(candidate, ["--version"], {
      stdio: "ignore",
      windowsHide: true,
    });

    if (!probe.error && probe.status !== null) {
      return candidate;
    }
  }

  return null;
}

function resolveCppCompiler() {
  const candidates =
    process.platform === "win32"
      ? ["C:\\MinGW\\bin\\g++.exe", "g++.exe", "clang++.exe"]
      : ["g++", "clang++", "c++"];

  return findFirstAvailableCommand(candidates);
}

function normalizeCommandPath(command: string) {
  return process.platform === "win32" ? command.replace(/\\/g, "/") : command;
}

function resolveVendoredJavaExecutable() {
  return resolveExistingPath(
    path.join(vendoredJavaRuntimeRoot, "jre", "bin", process.platform === "win32" ? "java.exe" : "java"),
  );
}

function resolveJavaExecutable() {
  const vendoredJava = resolveVendoredJavaExecutable();

  if (vendoredJava) {
    return vendoredJava;
  }

  return findFirstAvailableCommand(process.platform === "win32" ? ["java.exe", "java"] : ["java"]);
}

function resolveJavaLanguageServerPackageRoot() {
  return path.join(nodeModulesRoot, "@vscjava", "java-language-server");
}

function resolveJavaLanguageServerConfigDir() {
  const configPackageRoot =
    process.platform === "win32"
      ? path.join(nodeModulesRoot, "@vscjava", "java-ls-config-win32", "config_win")
      : process.platform === "linux"
        ? path.join(nodeModulesRoot, "@vscjava", "java-ls-config-linux", "config_linux")
        : path.join(nodeModulesRoot, "@vscjava", "java-ls-config-darwin", "config_mac");

  return resolveExistingPath(configPackageRoot);
}

function resolveJavaLanguageServerLauncherJar() {
  const pluginsDirectory = path.join(resolveJavaLanguageServerPackageRoot(), "server", "plugins");

  if (!existsSync(pluginsDirectory)) {
    return null;
  }

  const launcherName = readdirSync(pluginsDirectory).find(
    (entry) => entry.startsWith("org.eclipse.equinox.launcher_") && entry.endsWith(".jar"),
  );

  return launcherName ? path.join(pluginsDirectory, launcherName) : null;
}

function resolveClangdBinary() {
  const packagedBinary =
    process.platform === "win32"
      ? resolveExistingPath(path.join(nodeModulesRoot, "clangd-windows", "bin", "clangd.exe"))
      : resolveExistingPath(path.join(nodeModulesRoot, "clangd-linux", "bin", "clangd"));

  if (packagedBinary) {
    return packagedBinary;
  }

  return findFirstAvailableCommand(
    process.platform === "win32" ? ["clangd.exe", "clangd"] : ["clangd"],
  );
}

function writeCppCompileCommands(files: PlaygroundLspWorkspaceFile[]) {
  const compilerPath = resolveCppCompiler();
  const compiler = normalizeCommandPath(compilerPath ?? "clang++");
  const cppFiles = files.filter((file) => file.language === "cpp");
  const commands = cppFiles
    .map((file) => {
      const workspacePath = mapServerUriToWorkspacePath(file.uri);

      if (!workspacePath) {
        return null;
      }

      const argumentsList = [compiler, "-std=c++20", "-xc++"];

      if (!compilerPath) {
        argumentsList.push(`-I${cppFallbackIncludePath}`);
      }

      argumentsList.push(workspacePath);

      return {
        arguments: argumentsList,
        directory: resolvedWorkspaceRootPath,
        file: workspacePath,
      };
    })
    .filter(Boolean);

  writeFileSync(compileCommandsPath, JSON.stringify(commands, null, 2), "utf8");
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getCompletionItems(result: unknown) {
  if (Array.isArray(result)) {
    return result as CompletionItemLike[];
  }

  if (result && typeof result === "object" && !Array.isArray(result)) {
    const maybeResult = result as { items?: unknown };

    if (Array.isArray(maybeResult.items)) {
      return maybeResult.items as CompletionItemLike[];
    }
  }

  return [];
}

function getCompletionLabel(item: CompletionItemLike) {
  return typeof item.label === "string" ? item.label : item.label?.label ?? "";
}

function looksLikeWeakCppCompletion(result: unknown) {
  const items = getCompletionItems(result).slice(0, 8);

  if (items.length === 0) {
    return true;
  }

  return !items.some((item) => item.kind === 2 || getCompletionLabel(item).includes("("));
}

function shouldRetryJavaCompletion(result: unknown, request: LspCompletionRequest) {
  if (request.requestContext?.triggerCharacter !== ".") {
    return false;
  }

  return getCompletionItems(result).length === 0;
}

function resolvePackageBin(
  packageName: "pyright" | "typescript-language-server" | "vscode-langservers-extracted",
  binName: string,
) {
  const packageJsonPath =
    packageName === "pyright"
      ? path.join(nodeModulesRoot, "pyright", "package.json")
      : packageName === "typescript-language-server"
        ? path.join(nodeModulesRoot, "typescript-language-server", "package.json")
        : path.join(nodeModulesRoot, "vscode-langservers-extracted", "package.json");
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
      ensureResolvedWorkspaceRoot();
      syncWorkspaceFilesToDisk(request.files);

      if (this.options.serverKind === "cpp") {
        ensureCppFallbackHeaders();
        writeCppCompileCommands(request.files);
      }

      if (this.options.serverKind === "java") {
        ensureJavaWorkspaceRoot();
      }

      await this.ensureInitialized();
      this.syncDocuments(request.files);

      const completionParams = {
        context: {
          triggerCharacter: request.requestContext?.triggerCharacter,
          triggerKind: request.requestContext?.triggerKind ?? (request.requestContext?.triggerCharacter ? 2 : 1),
        },
        position: {
          character: Math.max(0, request.position.column - 1),
          line: Math.max(0, request.position.line - 1),
        },
        textDocument: {
          uri: request.documentUri,
        },
      };
      let completionResult = await this.sendRequest("textDocument/completion", completionParams);

      if (this.options.serverKind === "cpp" && looksLikeWeakCppCompletion(completionResult)) {
        await sleep(1000);
        return this.sendRequest("textDocument/completion", completionParams);
      }

      if (this.options.serverKind === "java" && shouldRetryJavaCompletion(completionResult, request)) {
        for (const delayMs of [1200, 1800, 2400]) {
          await sleep(delayMs);
          completionResult = await this.sendRequest("textDocument/completion", completionParams);

          if (!shouldRetryJavaCompletion(completionResult, request)) {
            break;
          }
        }
      }

      return completionResult;
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

    const command = this.options.launchWithNode === false ? this.options.bin : process.execPath;
    const args =
      this.options.launchWithNode === false
        ? this.options.args
        : [this.options.bin, ...this.options.args];
    const spawned = spawn(command, args, {
      env: process.env,
      stdio: "pipe",
      windowsHide: true,
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
let pythonServerManager: LspServerManager | null = null;
let cppServerManager: LspServerManager | null = null;
let javaServerManager: LspServerManager | null = null;

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

function getPythonServerManager() {
  if (!pythonServerManager) {
    pythonServerManager = new LspServerManager({
      args: ["--stdio"],
      bin: resolvePackageBin("pyright", "pyright-langserver"),
      configuration: {
        python: {
          analysis: {
            autoImportCompletions: true,
            diagnosticMode: "workspace",
            indexing: true,
            typeCheckingMode: "basic",
            useLibraryCodeForTypes: true,
          },
        },
      },
      rootUri: resolvedWorkspaceRootUri,
      serverKind: "python",
    });
  }

  return pythonServerManager;
}

function getCppServerManager() {
  if (cppServerManager) {
    return cppServerManager;
  }

  const clangdBinary = resolveClangdBinary();

  if (!clangdBinary) {
    return null;
  }

  const compiler = resolveCppCompiler();
  const args = [
    `--compile-commands-dir=${resolvedWorkspaceRootPath}`,
    "--header-insertion=never",
    "--completion-style=detailed",
    "--limit-results=80",
    "--log=error",
  ];

  if (compiler) {
    args.splice(1, 0, `--query-driver=${normalizeCommandPath(compiler)}`);
  }

  cppServerManager = new LspServerManager({
    args,
    bin: clangdBinary,
    launchWithNode: false,
    rootUri: resolvedWorkspaceRootUri,
    serverKind: "cpp",
  });

  return cppServerManager;
}

function getJavaServerManager() {
  if (javaServerManager) {
    return javaServerManager;
  }

  const javaBinary = resolveJavaExecutable();
  const configDirectory = resolveJavaLanguageServerConfigDir();
  const launcherJar = resolveJavaLanguageServerLauncherJar();

  if (!javaBinary || !configDirectory || !launcherJar) {
    return null;
  }

  javaServerManager = new LspServerManager({
    args: [
      "-Xmx768m",
      "-Declipse.application=org.eclipse.jdt.ls.core.id1",
      "-Dosgi.bundles.defaultStartLevel=4",
      "-Dosgi.checkConfiguration=true",
      "-Declipse.product=org.eclipse.jdt.ls.core.product",
      "-Dlog.level=ERROR",
      "--add-modules=ALL-SYSTEM",
      "--add-opens",
      "java.base/java.util=ALL-UNNAMED",
      "--add-opens",
      "java.base/java.lang=ALL-UNNAMED",
      "-jar",
      launcherJar,
      "-configuration",
      configDirectory,
      "-data",
      javaWorkspaceDataPath,
      "--stdio",
    ],
    bin: javaBinary,
    configuration: {
      java: {
        autobuild: {
          enabled: false,
        },
        completion: {
          guessMethodArguments: true,
          importOrder: ["java", "javax", "org", "com"],
        },
        configuration: {
          updateBuildConfiguration: "disabled",
        },
        import: {
          exclusions: ["**/node_modules/**", "**/.git/**"],
          gradle: {
            enabled: false,
          },
          maven: {
            enabled: false,
          },
        },
      },
    },
    launchWithNode: false,
    rootUri: resolvedWorkspaceRootUri,
    serverKind: "java",
  });

  return javaServerManager;
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

  if (language === "css") {
    return files.filter((file) => file.language === "css");
  }

  if (language === "python") {
    return files.filter((file) => file.language === "python");
  }

  if (language === "java") {
    return files.filter((file) => file.language === "java");
  }

  return files.filter((file) => file.language === "cpp");
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

  if (normalizedRequest.language === "css") {
    return getCssServerManager().complete(normalizedRequest);
  }

  if (normalizedRequest.language === "python") {
    return getPythonServerManager().complete(normalizedRequest);
  }

  if (normalizedRequest.language === "java") {
    const manager = getJavaServerManager();
    return manager ? manager.complete(normalizedRequest) : [];
  }

  const manager = getCppServerManager();
  return manager ? manager.complete(normalizedRequest) : [];
}
