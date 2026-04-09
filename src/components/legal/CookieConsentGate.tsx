"use client";

import Link from "next/link";
import { ChevronUp, Cookie, Settings2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { setBrowserCookie } from "@/lib/cookies/client";
import {
  COOKIE_CONSENT_ACCEPT_ALL_VALUE,
  COOKIE_CONSENT_ACCEPTED_VALUES,
  COOKIE_CONSENT_COOKIE_NAME,
  COOKIE_CONSENT_NECESSARY_ONLY_VALUE,
} from "@/lib/cookie-consent";

export function CookieConsentGate({ initialHasConsent = false }: { initialHasConsent?: boolean }) {
  const [hasConsent, setHasConsent] = useState(initialHasConsent);
  const [showPreferences, setShowPreferences] = useState(false);

  if (hasConsent) {
    return null;
  }

  const acceptCookies = (value: typeof COOKIE_CONSENT_ACCEPTED_VALUES[number]) => {
    setBrowserCookie(COOKIE_CONSENT_COOKIE_NAME, value, {
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      sameSite: "lax",
      secure: window.location.protocol === "https:",
    });
    setHasConsent(true);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[120] flex justify-center sm:bottom-6 sm:left-auto sm:right-6">
      <div className="relative w-full max-w-[760px] overflow-hidden rounded-[30px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,12,20,0.96),rgba(5,7,14,0.94))] shadow-[0_30px_90px_rgba(0,0,0,0.42)] backdrop-blur-2xl">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
          <div className="absolute -left-8 top-4 h-24 w-24 rounded-full bg-primary/18 blur-3xl" />
          <div className="absolute -right-10 bottom-0 h-28 w-28 rounded-full bg-cyan-500/12 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.03),transparent_45%)]" />
        </div>

        <div className="relative flex flex-col gap-4 px-4 py-4 sm:px-5 sm:py-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <Cookie className="h-4.5 w-4.5" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold tracking-tight text-white">Cookies and browser storage</p>
              <p className="mt-1 text-sm leading-6 text-zinc-400">
                We use essential storage for sign-in, security, and basic product behavior. You can reject optional
                preferences, review details, or accept all.
              </p>
            </div>
          </div>

          {showPreferences ? (
            <div className="rounded-[22px] border border-white/[0.08] bg-black/20 p-4 text-sm text-zinc-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4.5 w-4.5 shrink-0 text-cyan-400" />
                <div className="space-y-2">
                  <p className="font-semibold text-white">Preferences</p>
                  <p className="leading-6">
                    Essential storage stays on because CodeOrbit needs it for sessions, abuse protection, and core
                    reliability. `Reject All` means only essential storage. `Accept All` also allows broader preference
                    storage for richer saved settings later.
                  </p>
                  <p className="leading-6">
                    Read more in the{" "}
                    <Link href="/cookies-policy" className="font-semibold text-primary transition-colors hover:text-cyan-300">
                      Cookies Policy
                    </Link>
                    {" "}and{" "}
                    <Link href="/privacy-policy" className="font-semibold text-primary transition-colors hover:text-cyan-300">
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <button
              className="inline-flex items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] px-5 py-3 text-sm font-semibold text-zinc-300 transition-all duration-200 hover:border-white/[0.16] hover:bg-white/[0.06] hover:text-white"
              onClick={() => acceptCookies(COOKIE_CONSENT_NECESSARY_ONLY_VALUE)}
              type="button"
            >
              Reject All
            </button>

            <button
              className="inline-flex items-center justify-center gap-2 rounded-full border border-primary/25 bg-primary/[0.08] px-5 py-3 text-sm font-semibold text-primary transition-all duration-200 hover:border-primary/40 hover:bg-primary/[0.14] hover:text-white"
              onClick={() => setShowPreferences((current) => !current)}
              type="button"
            >
              <Settings2 className="h-4 w-4" />
              Preferences
              <ChevronUp className={`h-4 w-4 transition-transform duration-200 ${showPreferences ? "rotate-0" : "rotate-180"}`} />
            </button>

            <button
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white px-5 py-3 text-sm font-semibold text-black shadow-[0_0_30px_rgba(255,255,255,0.12)] transition-all duration-200 hover:translate-y-[-1px] hover:shadow-[0_0_36px_rgba(255,255,255,0.18)]"
              onClick={() => acceptCookies(COOKIE_CONSENT_ACCEPT_ALL_VALUE)}
              type="button"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
