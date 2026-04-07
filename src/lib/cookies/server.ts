import "server-only";

import { cookies } from "next/headers";
import { CookieDeleteResult, CookieEntry, CookieMutationResult, CookieOptions } from "@/lib/cookies/types";
import { normalizeCookieOptions } from "@/lib/cookies/shared";

export async function getServerCookie(name: string): Promise<CookieEntry | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(name);

  if (!cookie) {
    return null;
  }

  return {
    name: cookie.name,
    value: cookie.value,
  };
}

export async function getAllServerCookies(): Promise<CookieEntry[]> {
  const cookieStore = await cookies();

  return cookieStore.getAll().map((cookie) => ({
    name: cookie.name,
    value: cookie.value,
  }));
}

export async function hasServerCookie(name: string) {
  const cookieStore = await cookies();
  return cookieStore.has(name);
}

export async function setServerCookie(
  name: string,
  value: string,
  options: CookieOptions = {},
): Promise<CookieMutationResult> {
  const cookieStore = await cookies();
  const previousValue = cookieStore.get(name)?.value ?? null;

  cookieStore.set(name, value, normalizeCookieOptions(options));

  return {
    cookie: { name, value },
    previousValue,
    updated: previousValue !== null,
  };
}

export async function updateServerCookie(name: string, value: string, options: CookieOptions = {}) {
  return setServerCookie(name, value, options);
}

export async function deleteServerCookie(name: string): Promise<CookieDeleteResult> {
  const cookieStore = await cookies();
  const previousValue = cookieStore.get(name)?.value ?? null;

  cookieStore.delete(name);

  return {
    deleted: previousValue !== null,
    name,
    previousValue,
  };
}
