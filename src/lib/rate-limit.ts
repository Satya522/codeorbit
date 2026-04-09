import { redis } from "@/lib/redis";

type StoredRateLimitWindow = {
  count: number;
  expiresAt: number;
};

type RateLimitInput = {
  bucket: string;
  identifier: string;
  limit: number;
  windowSeconds: number;
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
};

function parseStoredWindow(raw: string | null) {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StoredRateLimitWindow>;

    if (typeof parsed.count !== "number" || typeof parsed.expiresAt !== "number") {
      return null;
    }

    return parsed as StoredRateLimitWindow;
  } catch {
    return null;
  }
}

export async function takeRateLimitHit({
  bucket,
  identifier,
  limit,
  windowSeconds,
}: RateLimitInput): Promise<RateLimitResult> {
  const key = `ratelimit:${bucket}:${identifier}`;
  const now = Date.now();
  const existingWindow = parseStoredWindow(await redis.get(key));
  const nextWindow: StoredRateLimitWindow =
    existingWindow && existingWindow.expiresAt > now
      ? {
          count: existingWindow.count + 1,
          expiresAt: existingWindow.expiresAt,
        }
      : {
          count: 1,
          expiresAt: now + windowSeconds * 1000,
        };
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((nextWindow.expiresAt - now) / 1000),
  );

  await redis.setex(key, retryAfterSeconds, JSON.stringify(nextWindow));

  return {
    allowed: nextWindow.count <= limit,
    limit,
    remaining: Math.max(0, limit - nextWindow.count),
    resetAt: nextWindow.expiresAt,
    retryAfterSeconds,
  };
}
