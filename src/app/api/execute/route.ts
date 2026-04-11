import { createHash } from "node:crypto";
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
  warmup: z.boolean().optional().default(false),
});

const DEFAULT_PISTON_ENDPOINTS = ["https://sk7312-codeorbit-piston-engine.hf.space/api/v2/execute"];
const ENGINE_TIMEOUT_MS = 12_000;
const ENGINE_FAILURE_COOLDOWN_MS = 45_000;
const EXECUTION_RESULT_CACHE_TTL_MS = 5 * 60_000;
const MAX_CACHED_EXECUTION_RESULTS = 60;

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

type ExecutionResponsePayload = {
  cached?: boolean;
  error: string | null;
  output: string | null;
  warmed?: boolean;
};

type CachedExecutionResult = {
  expiresAt: number;
  payload: ExecutionResponsePayload;
};

type EngineExecutionResult = {
  engineUrl: string;
  result: PistonResponse;
};

const executionResultCache = new Map<string, CachedExecutionResult>();
const engineCooldowns = new Map<string, number>();
const preferredExecutionEngineByLanguage = new Map<string, string>();

function getConfiguredPistonEndpoints() {
  const configuredEndpoints = (process.env.CODEORBIT_EXECUTION_ENGINES ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return configuredEndpoints.length > 0 ? configuredEndpoints : DEFAULT_PISTON_ENDPOINTS;
}

function getExecutionCacheKey(language: string, code: string, stdin: string) {
  return createHash("sha256")
    .update(language)
    .update("\u0000")
    .update(stdin)
    .update("\u0000")
    .update(code)
    .digest("hex");
}

function trimExecutionResultCache() {
  const now = Date.now();

  for (const [cacheKey, entry] of executionResultCache) {
    if (entry.expiresAt <= now) {
      executionResultCache.delete(cacheKey);
    }
  }

  while (executionResultCache.size > MAX_CACHED_EXECUTION_RESULTS) {
    const oldestCacheKey = executionResultCache.keys().next().value;

    if (!oldestCacheKey) {
      break;
    }

    executionResultCache.delete(oldestCacheKey);
  }
}

function readCachedExecutionResult(cacheKey: string) {
  trimExecutionResultCache();

  const cachedEntry = executionResultCache.get(cacheKey);

  if (!cachedEntry) {
    return null;
  }

  if (cachedEntry.expiresAt <= Date.now()) {
    executionResultCache.delete(cacheKey);
    return null;
  }

  executionResultCache.delete(cacheKey);
  executionResultCache.set(cacheKey, cachedEntry);

  return cachedEntry.payload;
}

function writeCachedExecutionResult(cacheKey: string, payload: ExecutionResponsePayload) {
  executionResultCache.set(cacheKey, {
    expiresAt: Date.now() + EXECUTION_RESULT_CACHE_TTL_MS,
    payload,
  });
  trimExecutionResultCache();
}

function getOrderedExecutionEngines(language: string) {
  const now = Date.now();
  const preferredEngineUrl = preferredExecutionEngineByLanguage.get(language);
  const orderedEngines = getConfiguredPistonEndpoints()
    .filter((engineUrl) => (engineCooldowns.get(engineUrl) ?? 0) <= now);

  if (!preferredEngineUrl) {
    return orderedEngines;
  }

  const withoutPreferredEngine = orderedEngines.filter((engineUrl) => engineUrl !== preferredEngineUrl);
  return [preferredEngineUrl, ...withoutPreferredEngine];
}

function markEngineSuccess(language: string, engineUrl: string) {
  preferredExecutionEngineByLanguage.set(language, engineUrl);
  engineCooldowns.delete(engineUrl);
}

function markEngineFailure(engineUrl: string) {
  engineCooldowns.set(engineUrl, Date.now() + ENGINE_FAILURE_COOLDOWN_MS);
}

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

async function executeWithPreferredEngine(
  language: string,
  payload: ReturnType<typeof buildPistonPayload>,
): Promise<EngineExecutionResult | null> {
  const executionEngines = getOrderedExecutionEngines(language);

  for (const engineUrl of executionEngines) {
    const result = await tryEngine(engineUrl, payload);

    if (result) {
      markEngineSuccess(language, engineUrl);
      return {
        engineUrl,
        result,
      };
    }

    markEngineFailure(engineUrl);
  }

  return null;
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
  const { code, language, stdin, warmup } = bodyResult.data;
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

  const executionCacheKey = getExecutionCacheKey(language, preparedCode, stdin);

  if (!warmup) {
    const cachedResult = readCachedExecutionResult(executionCacheKey);

    if (cachedResult) {
      return jsonWithHeaders(
        {
          ...cachedResult,
          cached: true,
        },
        200,
        headers,
      );
    }
  }

  const payload = buildPistonPayload(language, preparedCode, stdin);
  const executionResult = await executeWithPreferredEngine(language, payload);
  const result = executionResult?.result ?? null;

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
    const payloadForClient = {
      error: result.message,
      output: null,
      warmed: warmup || undefined,
    } satisfies ExecutionResponsePayload;

    if (!warmup) {
      writeCachedExecutionResult(executionCacheKey, payloadForClient);
    }

    return jsonWithHeaders(
      payloadForClient,
      400,
      headers,
    );
  }

  const compileError = result.compile?.stderr?.trim();
  const runStdout = result.run?.stdout ?? "";
  const runStderr = result.run?.stderr?.trim() ?? "";
  const payloadForClient = compileError
    ? {
        error: formatExecutionFeedback(language, compileError),
        output: null,
        warmed: warmup || undefined,
      }
    : {
        error: runStderr ? formatExecutionFeedback(language, runStderr) : null,
        output: warmup ? null : runStdout || null,
        warmed: warmup || undefined,
      } satisfies ExecutionResponsePayload;

  if (!warmup) {
    writeCachedExecutionResult(executionCacheKey, payloadForClient);
  }

  return jsonWithHeaders(payloadForClient, 200, headers);
}
