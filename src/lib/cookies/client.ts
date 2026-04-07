import { CookieDeleteResult, CookieEntry, CookieMutationResult, CookieOptions } from "@/lib/cookies/types";
import { normalizeCookieOptions, parseCookieHeader, serializeCookie } from "@/lib/cookies/shared";

function canUseDocument() {
  return typeof document !== "undefined";
}

export function getBrowserCookie(name: string): string | null {
  if (!canUseDocument()) {
    return null;
  }

  return parseCookieHeader(document.cookie).find((cookie) => cookie.name === name)?.value ?? null;
}

export function getAllBrowserCookies(): CookieEntry[] {
  if (!canUseDocument()) {
    return [];
  }

  return parseCookieHeader(document.cookie);
}

export function hasBrowserCookie(name: string) {
  return getBrowserCookie(name) !== null;
}

export function setBrowserCookie(name: string, value: string, options: CookieOptions = {}): CookieMutationResult {
  const previousValue = getBrowserCookie(name);
  const normalizedOptions = normalizeCookieOptions(options);

  if (canUseDocument()) {
    document.cookie = serializeCookie(name, value, normalizedOptions);
  }

  return {
    cookie: { name, value },
    previousValue,
    updated: previousValue !== null,
  };
}

export function updateBrowserCookie(name: string, value: string, options: CookieOptions = {}) {
  return setBrowserCookie(name, value, options);
}

export function deleteBrowserCookie(name: string, options: CookieOptions = {}): CookieDeleteResult {
  const previousValue = getBrowserCookie(name);

  if (canUseDocument()) {
    document.cookie = serializeCookie(name, "", {
      ...normalizeCookieOptions(options),
      expires: new Date(0),
      maxAge: 0,
    });
  }

  return {
    deleted: previousValue !== null,
    name,
    previousValue,
  };
}
