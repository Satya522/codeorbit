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
      <div className="relative w-full max-w-[720px] overflow-hidden rounded-[24px] border border-[#d9dde8] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.22)]">
        <div className="flex flex-col gap-4 px-4 py-4 sm:px-5 sm:py-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#eef4ff] text-[#2f6df6]">
              <Cookie className="h-4.5 w-4.5" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold tracking-tight text-[#111827]">Cookies and browser storage</p>
              <p className="mt-1 text-sm leading-6 text-[#5b6475]">
                We use essential storage for sign-in, security, and basic product behavior. You can reject optional
                preferences, review details, or accept all.
              </p>
            </div>
          </div>

          {showPreferences ? (
            <div className="rounded-[18px] border border-[#e4e7ef] bg-[#f8faff] p-4 text-sm text-[#4b5565]">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4.5 w-4.5 shrink-0 text-[#2f6df6]" />
                <div className="space-y-2">
                  <p className="font-semibold text-[#111827]">Preferences</p>
                  <p className="leading-6">
                    Essential storage stays on because CodeOrbit needs it for sessions, abuse protection, and core
                    reliability. `Reject All` means only essential storage. `Accept All` also allows broader preference
                    storage for richer saved settings later.
                  </p>
                  <p className="leading-6">
                    Read more in the{" "}
                    <Link href="/cookies-policy" className="font-semibold text-[#2f6df6] hover:text-[#1f57d6]">
                      Cookies Policy
                    </Link>
                    {" "}and{" "}
                    <Link href="/privacy-policy" className="font-semibold text-[#2f6df6] hover:text-[#1f57d6]">
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
              className="inline-flex items-center justify-center rounded-[12px] border border-[#d7dbe6] bg-[#f6f7fb] px-5 py-3 text-sm font-semibold text-[#1f2937] transition-all duration-200 hover:border-[#c7cedd] hover:bg-[#eef1f7]"
              onClick={() => acceptCookies(COOKIE_CONSENT_NECESSARY_ONLY_VALUE)}
              type="button"
            >
              Reject All
            </button>

            <button
              className="inline-flex items-center justify-center gap-2 rounded-[12px] border border-[#2f6df6] bg-white px-5 py-3 text-sm font-semibold text-[#2f6df6] transition-all duration-200 hover:bg-[#eef4ff]"
              onClick={() => setShowPreferences((current) => !current)}
              type="button"
            >
              <Settings2 className="h-4 w-4" />
              Preferences
              <ChevronUp className={`h-4 w-4 transition-transform duration-200 ${showPreferences ? "rotate-0" : "rotate-180"}`} />
            </button>

            <button
              className="inline-flex items-center justify-center rounded-[12px] bg-[#2f6df6] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(47,109,246,0.24)] transition-all duration-200 hover:translate-y-[-1px] hover:bg-[#1f57d6]"
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
