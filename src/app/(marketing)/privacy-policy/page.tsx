import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | CodeOrbit",
  description: "A simple explanation of what CodeOrbit stores and how that data is used.",
};

const sections = [
  {
    title: "What we collect",
    points: [
      "Basic account details such as your name, email address, profile image, and sign-in provider when you log in.",
      "Your product activity, such as learning progress, saved items, prompt history, practice status, and profile settings.",
      "Optional connected data, such as GitHub information, only when you choose to connect it.",
      "Technical details such as browser type, device information, or request metadata may also be processed to keep the platform stable and secure.",
    ],
  },
  {
    title: "Why we use it",
    points: [
      "To run the product and keep your account working.",
      "To save your progress, preferences, and connected profile information.",
      "To improve features and fix issues using product usage patterns in a general way.",
      "To protect the platform from misuse, suspicious activity, and reliability problems.",
    ],
  },
  {
    title: "AI features",
    points: [
      "If you use AI tools inside CodeOrbit, your prompt and the context needed to answer it may be sent to the configured AI provider.",
      "Do not paste secrets, private keys, or sensitive production data into AI prompts unless you are okay sending that information to an external provider.",
      "AI responses are meant to help you move faster, but you should still review them before relying on them in important work.",
    ],
  },
  {
    title: "Cookies and browser storage",
    points: [
      "CodeOrbit may use cookies or browser storage to keep you signed in and remember your local state.",
      "If you clear browser storage, some saved state may disappear unless it has already been synced to your account.",
      "Some features may also rely on local browser storage to preserve temporary work between page refreshes.",
    ],
  },
  {
    title: "Sharing",
    points: [
      "CodeOrbit does not sell your personal data.",
      "Some data may be processed by services needed to run the platform, such as hosting, auth, database, analytics, or AI providers.",
      "We may disclose information if required by law or needed to protect the platform from abuse or fraud.",
      "Access to personal information should be limited to the services and people who need it to operate or support the product.",
    ],
  },
  {
    title: "Your choices",
    points: [
      "You can decide whether to connect optional accounts and whether to keep using AI features.",
      "If you need help with account data or removal requests, contact the CodeOrbit team.",
      "You can also stop using specific optional features if you no longer want them linked to your workflow.",
    ],
  },
  {
    title: "Data retention",
    points: [
      "Some information may stay in the system for as long as it is needed to operate your account, preserve progress, or meet platform and legal requirements.",
      "Temporary or cached data may be removed sooner depending on how a feature stores it.",
    ],
  },
];

export default function PrivacyPolicyPage() {
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
            Privacy Policy
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-8 text-zinc-400">
            This page explains in simple language what CodeOrbit stores, why it is used, and what happens when you use features like sign-in, progress sync, and AI tools.
          </p>
          <p className="mt-3 text-sm font-medium text-zinc-500">Last updated: March 30, 2026</p>

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
              If you use CodeOrbit in a real production environment for public users, you should review this policy with proper legal guidance and adjust it for your exact setup.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
