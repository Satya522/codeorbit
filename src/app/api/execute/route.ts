import { NextResponse } from "next/server";
import { z } from "zod";
import { allowSignedOutRouteAccess, buildRateLimitHeaders } from "@/lib/api-guard";
import { readJsonBody } from "@/lib/api-request";
import { formatExecutionFeedback } from "@/lib/playgroundExecutionFeedback";
import { prepareJavaForExecution } from "@/lib/playgroundJavaRuntime";
import {
  buildUnsupportedJavaScriptRuntimeMessage,
  getUnsupportedJavaScriptBrowserApi,
  prepareJavaScriptForExecution,
} from "@/lib/playgroundJavascriptRuntime";

const executeRequestSchema = z.object({
  code: z.string().trim().min(1).max(20_000),
  language: z.enum(["cpp", "go", "java", "javascript", "python"]).default("javascript"),
  stdin: z.string().max(4_000).optional().default(""),
});

/**
 * Ordered list of Piston-compatible execution engines.
 * The handler tries each in sequence and falls back to the next on failure.
 */
const PISTON_ENDPOINTS = [
  "https://sk7312-codeorbit-piston-engine.hf.space/api/v2/execute",
  "https://emkc.org/api/v2/piston/execute",
];

const ENGINE_TIMEOUT_MS = 12_000;

type PistonRunResult = {
  code?: number;
  output?: string;
  signal?: string | null;
  stderr?: string;
  stdout?: string;
};

type PistonResponse = {
  compile?: PistonRunResult;
  message?: string;
  run?: PistonRunResult;
};

function buildPistonPayload(language: string, code: string, stdin: string) {
  return {
    files: [{ content: code }],
    language,
    stdin,
    version: "*",
  };
}

function jsonWithHeaders(
  payload: Record<string, unknown>,
  status: number,
  headers?: Record<string, string>,
) {
  return NextResponse.json(payload, {
    headers,
    status,
  });
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
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
      method: "POST",
      signal: controller.signal,
    });

    clearTimeout(timer);

    const contentType = response.headers.get("content-type") ?? "";

    if (!contentType.includes("application/json")) {
      console.warn(`Piston engine at ${url} returned non-JSON (${contentType}). Skipping.`);
      return null;
    }

    if (!response.ok) {
      const text = await response.text().catch(() => "");
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
  const access = await allowSignedOutRouteAccess({
    bucket: "execute",
    guestLimit: 10,
    limit: 20,
    request: req,
    windowSeconds: 60,
  });

  if (!access.ok) {
    return access.response;
  }

  const bodyResult = await readJsonBody({
    invalidMessage: "Invalid execution payload.",
    maxBytes: 32_000,
    request: req,
    schema: executeRequestSchema,
    tooLargeMessage: "Execution payload is too large. Keep code and stdin smaller and try again.",
  });

  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  const headers = buildRateLimitHeaders(access.rateLimit);
  const { code, language, stdin } = bodyResult.data;
  const unsupportedJavaScriptApi =
    language === "javascript" ? getUnsupportedJavaScriptBrowserApi(code) : null;
  const preparedCode =
    language === "javascript"
      ? prepareJavaScriptForExecution(code)
      : language === "java"
        ? prepareJavaForExecution(code)
        : code;

  if (unsupportedJavaScriptApi) {
    return jsonWithHeaders(
      {
        error: buildUnsupportedJavaScriptRuntimeMessage(unsupportedJavaScriptApi),
        output: null,
      },
      400,
      headers,
    );
  }

  const payload = buildPistonPayload(language, preparedCode, stdin);
  let result: PistonResponse | null = null;

  for (const endpoint of PISTON_ENDPOINTS) {
    result = await tryEngine(endpoint, payload);

    if (result) {
      break;
    }
  }

  if (!result) {
    return jsonWithHeaders(
      {
        error:
          "All code execution engines are currently unavailable. This may be temporary. Please try again in a few seconds.",
        output: null,
      },
      503,
      headers,
    );
  }

  if (result.message) {
    return jsonWithHeaders(
      {
        error: result.message,
        output: null,
      },
      400,
      headers,
    );
  }

  const compileError = result.compile?.stderr?.trim();
  const runStdout = result.run?.stdout ?? "";
  const runStderr = result.run?.stderr?.trim() ?? "";

  if (compileError) {
    return jsonWithHeaders(
      {
        error: formatExecutionFeedback(language, compileError),
        output: null,
      },
      200,
      headers,
    );
  }

  return jsonWithHeaders(
    {
      error: runStderr ? formatExecutionFeedback(language, runStderr) : null,
      output: runStdout || null,
    },
    200,
    headers,
  );
}
