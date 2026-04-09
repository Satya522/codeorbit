import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getRequestIp, jsonError } from "@/lib/api-request";
import { takeRateLimitHit, type RateLimitResult } from "@/lib/rate-limit";

type RouteAccessOptions = {
  bucket: string;
  limit: number;
  unauthenticatedMessage?: string;
  windowSeconds: number;
};

type RouteAccessSuccess = {
  ok: true;
  identifier: string;
  isAuthenticated: boolean;
  rateLimit: RateLimitResult;
  userId: string | null;
};

type RouteAccessFailure = {
  ok: false;
  response: NextResponse;
};

export function buildRateLimitHeaders(result: RateLimitResult) {
  return {
    "Retry-After": String(result.retryAfterSeconds),
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };
}

export async function requireSignedInRouteAccess({
  bucket,
  limit,
  unauthenticatedMessage = "Sign in is required to use this feature.",
  windowSeconds,
}: RouteAccessOptions): Promise<RouteAccessFailure | RouteAccessSuccess> {
  const { userId } = await auth();

  if (!userId) {
    return {
      ok: false,
      response: jsonError(unauthenticatedMessage, 401),
    };
  }

  const rateLimit = await takeRateLimitHit({
    bucket,
    identifier: userId,
    limit,
    windowSeconds,
  });

  if (!rateLimit.allowed) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Too many requests right now. Please wait a moment and try again.",
        },
        {
          headers: buildRateLimitHeaders(rateLimit),
          status: 429,
        },
      ),
    };
  }

  return {
    ok: true,
    identifier: userId,
    isAuthenticated: true,
    rateLimit,
    userId,
  };
}

type OptionalRouteAccessOptions = {
  bucket: string;
  guestLimit?: number;
  limit: number;
  request: Request;
  windowSeconds: number;
};

export async function allowSignedOutRouteAccess({
  bucket,
  guestLimit,
  limit,
  request,
  windowSeconds,
}: OptionalRouteAccessOptions): Promise<RouteAccessFailure | RouteAccessSuccess> {
  const { userId } = await auth();
  const isAuthenticated = Boolean(userId);
  const identifier = isAuthenticated ? `user:${userId}` : `guest:${getRequestIp(request)}`;
  const appliedGuestLimit = guestLimit ?? Math.max(1, Math.floor(limit / 2));
  const appliedLimit = isAuthenticated ? limit : appliedGuestLimit;
  const rateLimit = await takeRateLimitHit({
    bucket,
    identifier,
    limit: appliedLimit,
    windowSeconds,
  });

  if (!rateLimit.allowed) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Too many requests right now. Please wait a moment and try again.",
        },
        {
          headers: buildRateLimitHeaders(rateLimit),
          status: 429,
        },
      ),
    };
  }

  return {
    ok: true,
    identifier,
    isAuthenticated,
    rateLimit,
    userId: userId ?? null,
  };
}
