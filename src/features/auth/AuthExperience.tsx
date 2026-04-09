"use client";

import { SignIn, SignUp } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Sparkle } from "@phosphor-icons/react";
import { useMemo, useRef } from "react";

type AuthMode = "sign-in" | "sign-up";

const clerkAppearance = {
  baseTheme: dark,
  elements: {
    card: "w-full rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(9,9,11,0.9))] shadow-[0_28px_100px_rgba(2,6,23,0.45)] backdrop-blur-2xl",
    cardBox: "w-full shadow-none",
    dividerLine: "bg-white/10",
    dividerText: "text-zinc-500 text-xs uppercase tracking-[0.28em]",
    footerActionLink: "text-cyan-300 hover:text-cyan-200 font-medium",
    footerActionText: "text-zinc-400",
    formButtonPrimary:
      "h-12 rounded-2xl border-0 bg-[linear-gradient(135deg,#67e8f9,#7c3aed)] text-sm font-semibold text-slate-950 shadow-[0_18px_40px_rgba(103,232,249,0.28)] transition-transform duration-300 hover:scale-[1.01] hover:shadow-[0_22px_48px_rgba(124,58,237,0.28)]",
    formFieldInput:
      "h-12 rounded-2xl border border-white/10 bg-black/30 text-white placeholder:text-zinc-500 focus:border-cyan-400/50 focus:bg-black/40",
    formFieldLabel: "text-sm font-medium text-zinc-200",
    formFieldAction: "text-cyan-300 hover:text-cyan-200",
    formHeaderTitle: "text-2xl font-semibold text-white",
    formHeaderSubtitle: "text-sm leading-6 text-zinc-400",
    identityPreviewEditButton: "text-cyan-300 hover:text-cyan-200",
    identityPreviewText: "text-white",
    otpCodeFieldInput:
      "h-12 rounded-2xl border border-white/10 bg-black/30 text-white focus:border-cyan-400/50",
    rootBox: "w-full",
    socialButtonsBlockButton:
      "h-12 rounded-2xl border border-white/10 bg-white/[0.04] text-zinc-100 transition-all duration-300 hover:border-cyan-400/30 hover:bg-cyan-400/10",
    socialButtonsBlockButtonArrow: "text-zinc-500",
    socialButtonsBlockButtonText: "font-medium text-zinc-100",
  },
  variables: {
    colorBackground: "transparent",
    colorDanger: "#f87171",
    colorInputBackground: "rgba(0, 0, 0, 0.28)",
    colorInputText: "#f8fafc",
    colorPrimary: "#67e8f9",
    colorText: "#f8fafc",
    colorTextSecondary: "#a1a1aa",
    borderRadius: "1rem",
  },
} as const;

export function AuthExperience({ mode }: { mode: AuthMode }) {
  const shellRef = useRef<HTMLDivElement>(null);
  const isSignIn = mode === "sign-in";

  const hero = useMemo(
    () =>
      isSignIn
        ? {
            badge: "CodeOrbit Access",
            subtitle:
              "GitHub, LinkedIn, Google, email, and phone are available here.",
            title: "Sign in to continue",
          }
        : {
            badge: "Launch Your Orbit",
            subtitle:
              "Create one account for practice, roadmap progress, and social sync.",
            title: "Create your account",
          },
    [isSignIn],
  );

  return (
    <div
      ref={shellRef}
      className="codeorbit-auth-shell relative min-h-screen overflow-hidden bg-[#040507] text-white"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10%] top-[-8%] h-[30rem] w-[30rem] rounded-full bg-cyan-500/10 blur-[140px]" />
        <div className="absolute right-[-8%] top-[14%] h-[26rem] w-[26rem] rounded-full bg-violet-500/10 blur-[150px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:88px_88px] opacity-[0.06]" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-[520px] flex-col items-center justify-center px-5 py-10 sm:px-6">
        <section className="w-full text-center">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-200">
            <Sparkle size={14} weight="fill" className="text-cyan-300" />
            {hero.badge}
          </div>

          <h1 className="mt-6 font-display text-[clamp(2.6rem,4vw,3.4rem)] leading-[0.94] tracking-[-0.04em] text-white">
            {hero.title}
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-zinc-400 sm:text-base">
            {hero.subtitle}
          </p>
        </section>

        <section className="relative mt-8 w-full">
          <div className="absolute inset-x-10 top-5 h-24 rounded-full bg-cyan-400/12 blur-[80px]" />
          {isSignIn ? (
            <SignIn
              appearance={clerkAppearance}
              signUpUrl="/sign-up"
            />
          ) : (
            <SignUp
              appearance={clerkAppearance}
              signInUrl="/sign-in"
            />
          )}
        </section>
      </div>

      <style jsx global>{`
        .codeorbit-auth-shell .cl-cardBox,
        .codeorbit-auth-shell .cl-rootBox {
          width: 100%;
        }
      `}</style>
    </div>
  );
}
