import { CookieEntry, CookieOptions } from "@/lib/cookies/types";

function decodeCookiePart(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function normalizeCookieOptions(options: CookieOptions = {}): CookieOptions {
  return {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    ...options,
  };
}

export function parseCookieHeader(cookieHeader: string): CookieEntry[] {
  if (!cookieHeader.trim()) {
    return [];
  }

  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const separatorIndex = part.indexOf("=");
      const rawName = separatorIndex === -1 ? part : part.slice(0, separatorIndex);
      const rawValue = separatorIndex === -1 ? "" : part.slice(separatorIndex + 1);

      return {
        name: decodeCookiePart(rawName.trim()),
        value: decodeCookiePart(rawValue.trim()),
      };
    });
}

export function serializeCookie(name: string, value: string, options: CookieOptions = {}) {
  const normalizedOptions = normalizeCookieOptions(options);
  const segments = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`];

  if (normalizedOptions.maxAge !== undefined) {
    segments.push(`Max-Age=${Math.floor(normalizedOptions.maxAge)}`);
  }

  if (normalizedOptions.domain) {
    segments.push(`Domain=${normalizedOptions.domain}`);
  }

  if (normalizedOptions.path) {
    segments.push(`Path=${normalizedOptions.path}`);
  }

  if (normalizedOptions.expires) {
    segments.push(`Expires=${normalizedOptions.expires.toUTCString()}`);
  }

  if (normalizedOptions.httpOnly) {
    segments.push("HttpOnly");
  }

  if (normalizedOptions.secure) {
    segments.push("Secure");
  }

  if (normalizedOptions.sameSite) {
    segments.push(`SameSite=${capitalize(normalizedOptions.sameSite)}`);
  }

  if (normalizedOptions.priority) {
    segments.push(`Priority=${capitalize(normalizedOptions.priority)}`);
  }

  if (normalizedOptions.partitioned) {
    segments.push("Partitioned");
  }

  return segments.join("; ");
}
