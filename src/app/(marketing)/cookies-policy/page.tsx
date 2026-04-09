import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Cookies Policy | CodeOrbit",
  description: "A simple explanation of how CodeOrbit uses cookies and browser storage.",
};

const sections = [
  {
    title: "What this page covers",
    points: [
      "This page explains how CodeOrbit uses cookies, local storage, and similar browser-side storage.",
      "It is written in simple language so users can understand what stays in the browser and what does not.",
    ],
  },
  {
    title: "Essential cookies",
    points: [
      "If you choose to sign in, CodeOrbit and its authentication provider may use essential cookies to keep your session active and secure.",
      "These cookies help basic account flows work correctly, such as sign-in, sign-out, and protected account actions.",
      "The consent modal now lets users choose between Necessary Only and Accept All on a per-browser basis.",
    ],
  },
  {
    title: "Browser storage for product state",
    points: [
      "Some signed-in experiences may use browser storage to remember editor preferences or restore synced workflows faster.",
      "Guest playground sessions are intentionally treated as temporary, so refreshing the page without being signed in should reset that local coding state instead of restoring old work.",
    ],
  },
  {
    title: "What we do not promise",
    points: [
      "Third-party services such as authentication, hosting, analytics, or AI providers may have their own cookie behavior.",
      "If you deploy CodeOrbit publicly, you should review all connected services and update this policy for your exact setup.",
    ],
  },
  {
    title: "Your control",
    points: [
      "If you choose Necessary Only, CodeOrbit should only rely on essential storage needed for the product to function correctly.",
      "If you choose Accept All, CodeOrbit can remember the broader consent preference for future optional browser-side features.",
      "You can clear cookies and browser storage through your browser settings at any time.",
      "If you clear storage, signed-out temporary state and some saved browser-side preferences may disappear.",
    ],
  },
];

export default function CookiesPolicyPage() {
  return (
    <div className="bg-[#04050a] px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-zinc-300 transition-colors hover:border-white/20 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to CodeOrbit
        </Link>

        <div className="mt-8">
          <h1 className="font-display text-[clamp(2.3rem,6vw,4.2rem)] font-black tracking-[-0.045em] text-white">
            Cookies Policy
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-8 text-zinc-400">
            This page explains how CodeOrbit uses cookies and browser-side storage, especially for sign-in and temporary coding sessions.
          </p>
          <p className="mt-3 text-sm font-medium text-zinc-500">Last updated: April 9, 2026</p>

          <div className="mt-10 space-y-8">
            {sections.map((section) => (
              <section key={section.title} className="border-t border-white/[0.08] pt-6 first:border-t-0 first:pt-0">
                <h2 className="text-xl font-semibold tracking-tight text-white">{section.title}</h2>
                <ul className="mt-3 space-y-3 text-[15px] leading-8 text-zinc-400">
                  {section.points.map((point) => (
                    <li key={point} className="flex gap-3">
                      <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary/80" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <div className="mt-10 border-t border-white/[0.08] pt-6 text-[15px] leading-8 text-zinc-400">
            <p>
              If you run CodeOrbit as a public product, review this cookies policy together with your privacy policy and the exact behavior of every connected service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
