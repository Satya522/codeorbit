import { NextResponse } from 'next/server';

/**
 * Ordered list of Piston-compatible execution engines.
 * The handler tries each in sequence and falls back to the next on failure.
 */
const PISTON_ENDPOINTS = [
  'https://sk7312-codeorbit-piston-engine.hf.space/api/v2/execute',
  'https://emkc.org/api/v2/piston/execute',
];

const ENGINE_TIMEOUT_MS = 12_000;

type ExecuteRequestBody = {
  code?: string;
  language?: string;
  stdin?: string;
};

type PistonRunResult = {
  stderr?: string;
  stdout?: string;
  code?: number;
  signal?: string | null;
  output?: string;
};

type PistonResponse = {
  run?: PistonRunResult;
  compile?: PistonRunResult;
  message?: string;
};

const browserOnlyJavaScriptPatterns = [
  /\bdocument\./,
  /\bwindow\./,
  /\balert\s*\(/,
  /\bconfirm\s*\(/,
  /\bprompt\s*\(/,
  /\blocalStorage\b/,
  /\bsessionStorage\b/,
  /\bnavigator\./,
];

function buildPistonPayload(language: string, code: string, stdin: string) {
  return {
    language,
    version: '*',
    files: [{ content: code }],
    stdin,
  };
}

function containsBrowserOnlyJavaScript(code: string) {
  return browserOnlyJavaScriptPatterns.some((pattern) => pattern.test(code));
}

/**
 * Attempt execution against a single Piston endpoint.
 * Returns the parsed JSON result or `null` if the endpoint is unreachable / unhealthy.
 */
async function tryEngine(
  url: string,
  payload: ReturnType<typeof buildPistonPayload>,
): Promise<PistonResponse | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ENGINE_TIMEOUT_MS);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timer);

    // If the response is not JSON (e.g. HF space returning HTML splash page), skip this engine.
    const contentType = response.headers.get('content-type') ?? '';

    if (!contentType.includes('application/json')) {
      console.warn(`Piston engine at ${url} returned non-JSON (${contentType}). Skipping.`);
      return null;
    }

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      console.warn(`Piston engine at ${url} returned ${response.status}: ${text.slice(0, 200)}`);
      return null;
    }

    return (await response.json()) as PistonResponse;
  } catch (error) {
    console.warn(`Piston engine at ${url} failed:`, error instanceof Error ? error.message : error);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const { language, code, stdin } = (await req.json()) as ExecuteRequestBody;

    if (!code?.trim()) {
      return NextResponse.json({ output: null, error: 'No code provided' }, { status: 400 });
    }

    if ((language ?? 'javascript') === 'javascript' && containsBrowserOnlyJavaScript(code)) {
      return NextResponse.json(
        {
          output: null,
          error:
            'This JavaScript runner uses a Node-style runtime, so browser APIs like alert, window, and document will not work here. For DOM-based code, switch to the HTML/CSS preview and place your JavaScript inside a <script> tag.',
        },
        { status: 400 },
      );
    }

    const payload = buildPistonPayload(language ?? 'javascript', code, stdin ?? '');

    // Try each engine in order until one succeeds.
    let result: PistonResponse | null = null;

    for (const endpoint of PISTON_ENDPOINTS) {
      result = await tryEngine(endpoint, payload);
      if (result) break;
    }

    if (!result) {
      return NextResponse.json(
        {
          output: null,
          error:
            'All code execution engines are currently unavailable. This may be temporary — please try again in a few seconds.',
        },
        { status: 503 },
      );
    }

    // Handle Piston-level errors (e.g. unknown language)
    if (result.message) {
      return NextResponse.json(
        { output: null, error: result.message },
        { status: 400 },
      );
    }

    const compileError = result.compile?.stderr?.trim();
    const runStdout = result.run?.stdout ?? '';
    const runStderr = result.run?.stderr?.trim() ?? '';

    // Compilation errors take priority.
    if (compileError) {
      return NextResponse.json({
        output: null,
        error: compileError,
      });
    }

    return NextResponse.json({
      output: runStdout || null,
      error: runStderr || null,
    });
  } catch (error: unknown) {
    console.error('Universal RCE Error:', error);
    return NextResponse.json(
      {
        output: null,
        error:
          error instanceof Error
            ? `Execution Error: ${error.message}`
            : 'Execution Error: Unknown failure',
      },
      { status: 500 },
    );
  }
}
