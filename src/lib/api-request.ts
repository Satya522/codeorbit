import { NextResponse } from "next/server";
import { z } from "zod";

const textEncoder = new TextEncoder();

type ReadJsonBodySuccess<T> = {
  data: T;
  ok: true;
  raw: string;
};

type ReadJsonBodyFailure = {
  ok: false;
  response: NextResponse;
};

function resolveDeclaredLength(request: Request) {
  const rawLength = request.headers.get("content-length");

  if (!rawLength) {
    return null;
  }

  const parsed = Number.parseInt(rawLength, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getRequestIp(request: Request) {
  const headers = request.headers;
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = headers.get("x-real-ip")?.trim();
  const cloudflareIp = headers.get("cf-connecting-ip")?.trim();

  return cloudflareIp || realIp || forwarded || "unknown";
}

export function jsonError(
  error: string,
  status: number,
  extras?: Record<string, unknown>,
) {
  return NextResponse.json(
    {
      error,
      ...(extras ?? {}),
    },
    { status },
  );
}

export async function readJsonBody<T>({
  invalidMessage = "Invalid request body.",
  maxBytes,
  request,
  schema,
  tooLargeMessage = "Request body is too large.",
}: {
  invalidMessage?: string;
  maxBytes: number;
  request: Request;
  schema: z.ZodType<T>;
  tooLargeMessage?: string;
}): Promise<ReadJsonBodyFailure | ReadJsonBodySuccess<T>> {
  const declaredLength = resolveDeclaredLength(request);

  if (declaredLength !== null && declaredLength > maxBytes) {
    return {
      ok: false,
      response: jsonError(tooLargeMessage, 413),
    };
  }

  const raw = await request.text();
  const actualBytes = textEncoder.encode(raw).byteLength;

  if (actualBytes > maxBytes) {
    return {
      ok: false,
      response: jsonError(tooLargeMessage, 413),
    };
  }

  let parsed: unknown;

  try {
    parsed = raw.trim() ? JSON.parse(raw) : {};
  } catch {
    return {
      ok: false,
      response: jsonError(invalidMessage, 400),
    };
  }

  const result = schema.safeParse(parsed);

  if (!result.success) {
    return {
      ok: false,
      response: jsonError(invalidMessage, 400, {
        issues: result.error.flatten(),
      }),
    };
  }

  return {
    data: result.data,
    ok: true,
    raw,
  };
}
