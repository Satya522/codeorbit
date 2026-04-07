export type CookieSameSite = "lax" | "strict" | "none";
export type CookiePriority = "low" | "medium" | "high";

export type CookieOptions = {
  path?: string;
  domain?: string;
  expires?: Date;
  httpOnly?: boolean;
  maxAge?: number;
  partitioned?: boolean;
  priority?: CookiePriority;
  sameSite?: CookieSameSite;
  secure?: boolean;
};

export type CookieEntry = {
  name: string;
  value: string;
};

export type CookieMutationResult = {
  cookie: CookieEntry;
  previousValue: string | null;
  updated: boolean;
};

export type CookieDeleteResult = {
  deleted: boolean;
  name: string;
  previousValue: string | null;
};
