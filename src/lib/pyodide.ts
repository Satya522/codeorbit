const PYODIDE_VERSION = "0.29.3";
const PYODIDE_BASE_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
const PYODIDE_SCRIPT_URL = `${PYODIDE_BASE_URL}pyodide.js`;
const PYODIDE_SCRIPT_ID = "codeorbit-pyodide-runtime";

type StreamWriter = {
  batched: (text: string) => void;
};

type PyodideLoaderOptions = {
  indexURL?: string;
  stdout?: (text: string) => void;
  stderr?: (text: string) => void;
};

type PyodideRuntime = {
  loadPackagesFromImports: (code: string) => Promise<void>;
  runPythonAsync: (code: string) => Promise<unknown>;
  setStdin: (options?: PyodideStdinOptions) => void;
  setStdout: (writer: StreamWriter) => void;
  setStderr: (writer: StreamWriter) => void;
};

type PyodideStdinOptions = {
  stdin?: () => string | number | Uint8Array | ArrayBuffer | null | undefined;
  autoEOF?: boolean;
  error?: boolean;
  isatty?: boolean;
};

type PyodideWindow = Window &
  typeof globalThis & {
    define?: unknown;
    require?: unknown;
    loadPyodide?: (options?: PyodideLoaderOptions) => Promise<PyodideRuntime>;
  };

export type PythonRunResult = {
  output: string;
  error: string;
};

let pyodideScriptPromise: Promise<void> | null = null;
let pyodideReadyPromise: Promise<PyodideRuntime> | null = null;
let pythonExecutionQueue: Promise<void> = Promise.resolve();

function ensureBrowserContext() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("Python execution is only available in the browser.");
  }
}

function appendChunk(chunks: string[], text: string) {
  if (!text) {
    return;
  }

  chunks.push(text.endsWith("\n") ? text : `${text}\n`);
}

function normalizeError(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return String(error);
}

function suspendAmdGlobals(win: PyodideWindow) {
  const globals = win as unknown as Record<"define" | "require", unknown>;
  const hadDefine = Object.prototype.hasOwnProperty.call(globals, "define");
  const hadRequire = Object.prototype.hasOwnProperty.call(globals, "require");
  const originalDefine = globals.define;
  const originalRequire = globals.require;

  try {
    delete globals.define;
  } catch {
    globals.define = undefined;
  }

  try {
    delete globals.require;
  } catch {
    globals.require = undefined;
  }

  return () => {
    try {
      if (hadDefine) {
        globals.define = originalDefine;
      } else {
        delete globals.define;
      }
    } catch {
      // Ignore non-configurable globals.
    }

    try {
      if (hadRequire) {
        globals.require = originalRequire;
      } else {
        delete globals.require;
      }
    } catch {
      // Ignore non-configurable globals.
    }
  };
}

async function ensurePyodideScriptLoaded() {
  ensureBrowserContext();

  const win = window as PyodideWindow;

  if (typeof win.loadPyodide === "function") {
    return;
  }

  if (pyodideScriptPromise) {
    return pyodideScriptPromise;
  }

  pyodideScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(PYODIDE_SCRIPT_ID) as HTMLScriptElement | null;

    const finish = () => {
      if (typeof win.loadPyodide !== "function") {
        pyodideScriptPromise = null;
        reject(new Error("Pyodide loaded, but loadPyodide is unavailable on window."));
        return;
      }

      resolve();
    };

    if (existingScript) {
      if (existingScript.dataset.loaded === "true") {
        finish();
        return;
      }

      existingScript.addEventListener("load", finish, { once: true });
      existingScript.addEventListener(
        "error",
        () => {
          pyodideScriptPromise = null;
          reject(new Error("Failed to load the Pyodide runtime script."));
        },
        { once: true }
      );

      return;
    }

    const restoreAmdGlobals = suspendAmdGlobals(win);
    const script = document.createElement("script");

    script.id = PYODIDE_SCRIPT_ID;
    script.src = PYODIDE_SCRIPT_URL;
    script.async = true;
    script.crossOrigin = "anonymous";

    const cleanup = () => {
      restoreAmdGlobals();
    };

    script.addEventListener(
      "load",
      () => {
        script.dataset.loaded = "true";
        cleanup();
        finish();
      },
      { once: true }
    );

    script.addEventListener(
      "error",
      () => {
        cleanup();
        pyodideScriptPromise = null;
        reject(new Error("Failed to load the Pyodide runtime script."));
      },
      { once: true }
    );

    document.head.appendChild(script);
  });

  return pyodideScriptPromise;
}

async function getPyodide() {
  ensureBrowserContext();

  if (pyodideReadyPromise) {
    return pyodideReadyPromise;
  }

  pyodideReadyPromise = ensurePyodideScriptLoaded()
    .then(async () => {
      const win = window as PyodideWindow;

      if (typeof win.loadPyodide !== "function") {
        throw new Error("Pyodide is unavailable after the runtime script loaded.");
      }

      return win.loadPyodide({
        indexURL: PYODIDE_BASE_URL,
        stdout: () => {},
        stderr: () => {},
      });
    })
    .catch((error) => {
      pyodideReadyPromise = null;
      throw error;
    });

  return pyodideReadyPromise;
}

function queuePythonRun<T>(task: () => Promise<T>) {
  const run = pythonExecutionQueue.then(task, task);
  pythonExecutionQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

function createStdinReader(input: string) {
  const normalizedInput = input.replace(/\r\n/g, "\n");
  const chunks = normalizedInput.match(/[^\n]*\n|[^\n]+/g) ?? [];
  let cursor = 0;

  return () => {
    if (cursor >= chunks.length) {
      return undefined;
    }

    const chunk = chunks[cursor];
    cursor += 1;
    return chunk;
  };
}

export async function runPythonCode(code: string, stdin = ""): Promise<PythonRunResult> {
  return queuePythonRun(async () => {
    const pyodide = await getPyodide();
    const stdoutChunks: string[] = [];
    const stderrChunks: string[] = [];
    const readStdin = createStdinReader(stdin);

    pyodide.setStdin({
      stdin: readStdin,
      autoEOF: false,
    });

    pyodide.setStdout({
      batched: (text) => appendChunk(stdoutChunks, text),
    });

    pyodide.setStderr({
      batched: (text) => appendChunk(stderrChunks, text),
    });

    try {
      await pyodide.loadPackagesFromImports(code);
      const result = await pyodide.runPythonAsync(code);

      if (result !== undefined && stdoutChunks.length === 0) {
        appendChunk(stdoutChunks, String(result));
      }
    } catch (error) {
      appendChunk(stderrChunks, normalizeError(error));
    } finally {
      pyodide.setStdin({ error: true });
      pyodide.setStdout({ batched: () => {} });
      pyodide.setStderr({ batched: () => {} });
    }

    return {
      output: stdoutChunks.join(""),
      error: stderrChunks.join(""),
    };
  });
}
