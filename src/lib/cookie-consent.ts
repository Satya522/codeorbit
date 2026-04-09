export const COOKIE_CONSENT_COOKIE_NAME = "codeorbit_cookie_consent";
export const COOKIE_CONSENT_ACCEPT_ALL_VALUE = "all";
export const COOKIE_CONSENT_NECESSARY_ONLY_VALUE = "necessary";
export const COOKIE_CONSENT_LEGACY_ACCEPTED_VALUE = "accepted";
export const COOKIE_CONSENT_ACCEPTED_VALUES = [
  COOKIE_CONSENT_ACCEPT_ALL_VALUE,
  COOKIE_CONSENT_NECESSARY_ONLY_VALUE,
  COOKIE_CONSENT_LEGACY_ACCEPTED_VALUE,
] as const;

export function isCookieConsentAccepted(value: string | null | undefined) {
  return COOKIE_CONSENT_ACCEPTED_VALUES.includes(
    (value ?? "") as (typeof COOKIE_CONSENT_ACCEPTED_VALUES)[number],
  );
}
