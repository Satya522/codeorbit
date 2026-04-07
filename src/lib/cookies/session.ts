import "server-only";

import { CookieOptions, CookieMutationResult } from "@/lib/cookies/types";
import { deleteServerCookie, getServerCookie, setServerCookie, updateServerCookie } from "@/lib/cookies/server";

export type SessionCookiePayload = {
  expiresAt: string;
  issuedAt: string;
  token: string;
  userId?: string | null;
};

const DEFAULT_SESSION_COOKIE_NAME = "codeorbit_session";
const DEFAULT_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function resolveSessionCookieName() {
  return process.env.SESSION_COOKIE_NAME?.trim() || DEFAULT_SESSION_COOKIE_NAME;
}

function resolveSessionMaxAgeSeconds() {
  const value = Number(process.env.SESSION_MAX_AGE_SECONDS);

  if (!Number.isFinite(value) || value <= 0) {
    return DEFAULT_SESSION_MAX_AGE_SECONDS;
  }

  return Math.floor(value);
}

function buildSessionCookieOptions(overrides: CookieOptions = {}, maxAgeSeconds = resolveSessionMaxAgeSeconds()) {
  const expires = new Date(Date.now() + maxAgeSeconds * 1000);
  const defaultSecure = process.env.NODE_ENV === "production";

  const mergedOptions: CookieOptions = {
    expires: overrides.expires ?? expires,
    httpOnly: overrides.httpOnly ?? true,
    maxAge: overrides.maxAge ?? maxAgeSeconds,
    path: overrides.path ?? "/",
    sameSite: overrides.sameSite ?? "lax",
    secure: overrides.secure ?? defaultSecure,
  };

  if (overrides.domain) {
    mergedOptions.domain = overrides.domain;
  }

  if (overrides.partitioned !== undefined) {
    mergedOptions.partitioned = overrides.partitioned;
  }

  if (overrides.priority) {
    mergedOptions.priority = overrides.priority;
  }

  return mergedOptions;
}

function parseSessionCookieValue(value: string | null): SessionCookiePayload | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as SessionCookiePayload;

    if (
      typeof parsed?.token !== "string" ||
      typeof parsed?.issuedAt !== "string" ||
      typeof parsed?.expiresAt !== "string"
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function isSessionExpired(session: SessionCookiePayload | null) {
  if (!session) {
    return true;
  }

  const expiresAt = new Date(session.expiresAt);
  return Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now();
}

export async function getSessionCookie(name = resolveSessionCookieName()) {
  const cookie = await getServerCookie(name);
  const session = parseSessionCookieValue(cookie?.value ?? null);

  return {
    cookie,
    expired: isSessionExpired(session),
    name,
    session,
  };
}

export async function setSessionCookie(
  payload: {
    token: string;
    userId?: string | null;
  },
  options: CookieOptions = {},
  name = resolveSessionCookieName(),
): Promise<CookieMutationResult & { session: SessionCookiePayload }> {
  const maxAgeSeconds = options.maxAge ?? resolveSessionMaxAgeSeconds();
  const now = new Date();
  const session: SessionCookiePayload = {
    expiresAt: new Date(now.getTime() + maxAgeSeconds * 1000).toISOString(),
    issuedAt: now.toISOString(),
    token: payload.token,
    userId: payload.userId ?? null,
  };

  const result = await setServerCookie(
    name,
    JSON.stringify(session),
    buildSessionCookieOptions(options, maxAgeSeconds),
  );

  return {
    ...result,
    session,
  };
}

export async function updateSessionCookie(
  payload: {
    token: string;
    userId?: string | null;
  },
  options: CookieOptions = {},
  name = resolveSessionCookieName(),
) {
  const maxAgeSeconds = options.maxAge ?? resolveSessionMaxAgeSeconds();
  const now = new Date();
  const session: SessionCookiePayload = {
    expiresAt: new Date(now.getTime() + maxAgeSeconds * 1000).toISOString(),
    issuedAt: now.toISOString(),
    token: payload.token,
    userId: payload.userId ?? null,
  };

  const result = await updateServerCookie(
    name,
    JSON.stringify(session),
    buildSessionCookieOptions(options, maxAgeSeconds),
  );

  return {
    ...result,
    session,
  };
}

export async function deleteSessionCookie(name = resolveSessionCookieName()) {
  return deleteServerCookie(name);
}
