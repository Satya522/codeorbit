import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, Shield, FileText, Code2 } from "lucide-react";

type LegalSection = {
  body: string[];
  title: string;
};

const legalLinks = [
  { href: "/privacy-policy", label: "Privacy Policy", icon: Shield },
  { href: "/terms-of-service", label: "Terms of Service", icon: FileText },
  { href: "/open-source", label: "Open Source", icon: Code2 },
];

export function LegalPageShell({
  description,
  eyebrow,
  lastUpdated,
  sections,
  title,
  activePath,
  footerNote,
}: {
  activePath: string;
  description: string;
  eyebrow: string;
  footerNote: ReactNode;
  lastUpdated: string;
  sections: LegalSection[];
  title: string;
}) {
  return (
    <div className="relative overflow-hidden bg-[#04050a] px-4 py-16 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <div className="absolute left-[12%] top-[6%] h-64 w-64 rounded-full bg-primary/12 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[8%] h-72 w-72 rounded-full bg-cyan-500/10 blur-[140px]" />
      </div>

      <div className="relative mx-auto flex w-full max-w-[1220px] flex-col gap-8">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-zinc-300 transition-colors hover:border-white/20 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to CodeOrbit
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.72fr)_320px]">
          <section className="rounded-[32px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.28)] backdrop-blur-2xl sm:p-8 lg:p-10">
            <div className="max-w-3xl">
              <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.28em] text-primary/80">{eyebrow}</p>
              <h1 className="font-display text-[clamp(2.6rem,7vw,4.8rem)] font-black tracking-[-0.045em] text-white">
                {title}
              </h1>
              <p className="mt-4 max-w-2xl text-[15px] leading-8 text-zinc-400 sm:text-base">
                {description}
              </p>
              <div className="mt-6 inline-flex rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                Last updated: {lastUpdated}
              </div>
            </div>

            <div className="mt-10 space-y-5">
              {sections.map((section) => (
                <article
                  key={section.title}
                  className="rounded-[24px] border border-white/[0.08] bg-black/20 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:p-6"
                >
                  <h2 className="text-lg font-semibold tracking-tight text-white sm:text-xl">{section.title}</h2>
                  <div className="mt-3 space-y-3 text-sm leading-7 text-zinc-400 sm:text-[15px]">
                    {section.body.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-8 rounded-[24px] border border-white/[0.08] bg-white/[0.02] p-5 text-sm leading-7 text-zinc-400 sm:p-6">
              {footerNote}
            </div>
          </section>

          <aside className="h-fit rounded-[28px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.24)] backdrop-blur-2xl sm:p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-zinc-500">Legal</p>
            <div className="mt-4 space-y-2">
              {legalLinks.map((item) => {
                const isActive = item.href === activePath;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all ${
                      isActive
                        ? "border-primary/25 bg-primary/[0.08] text-white"
                        : "border-white/[0.08] bg-white/[0.02] text-zinc-300 hover:border-white/16 hover:text-white"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                        isActive ? "bg-primary/20 text-primary" : "bg-white/[0.04] text-zinc-400"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="mt-6 rounded-2xl border border-white/[0.08] bg-black/20 p-4">
              <p className="text-sm font-semibold text-white">Need help?</p>
              <p className="mt-2 text-sm leading-7 text-zinc-400">
                If you need clarification about legal or account-related information, contact the CodeOrbit team before relying on assumptions.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
