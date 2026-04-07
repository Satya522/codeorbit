import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service | CodeOrbit",
  description: "Simple terms for using the CodeOrbit platform.",
};

const sections = [
  {
    title: "Using CodeOrbit",
    points: [
      "You may use CodeOrbit for learning, practice, project work, and interview preparation.",
      "You should use the platform in a lawful and responsible way.",
      "Do not use CodeOrbit to harm the service, other users, or connected systems.",
      "You are expected to respect the intent of the platform and avoid abusive or dishonest use.",
    ],
  },
  {
    title: "Accounts",
    points: [
      "Some features require you to sign in.",
      "You are responsible for keeping your account safe and for activity that happens under it.",
      "CodeOrbit may limit or suspend access if an account is used for abuse, fraud, scraping, attacks, or policy evasion.",
      "You should keep your sign-in details and linked accounts secure.",
    ],
  },
  {
    title: "Acceptable use",
    points: [
      "Do not try to break platform security or misuse AI tools.",
      "Do not upload harmful code or use the platform for illegal, abusive, or malicious content.",
      "Do not interfere with the experience of other users.",
      "Do not attempt to scrape protected data, automate abusive traffic, or bypass platform limits.",
    ],
  },
  {
    title: "AI responses",
    points: [
      "AI-generated help inside CodeOrbit is provided for learning and support.",
      "Those answers may sometimes be incomplete or wrong.",
      "You are responsible for reviewing code and technical advice before using it in production or other high-risk situations.",
      "CodeOrbit is not responsible for damage caused by blindly relying on AI-generated output.",
    ],
  },
  {
    title: "Ownership",
    points: [
      "The CodeOrbit product, design, and platform-specific content remain the property of their respective owners unless clearly stated otherwise.",
      "Open source libraries used in the product still follow their own licenses.",
      "Your own work and content remain yours, but you are responsible for making sure you have the right to upload or use them.",
    ],
  },
  {
    title: "Changes and availability",
    points: [
      "CodeOrbit may update, remove, or improve features at any time.",
      "We do not promise perfect uptime or that every feature will stay exactly the same forever.",
      "Some experiences may depend on third-party services such as authentication, hosting, AI, or database providers.",
    ],
  },
  {
    title: "Responsibility limits",
    points: [
      "CodeOrbit is provided as available.",
      "The platform is not responsible for losses caused by downtime, incomplete AI output, or reliance on generated guidance.",
      "If you run CodeOrbit as a public or commercial product, you should review these terms properly for your own use case.",
      "Nothing on the platform should be treated as legal, financial, or other regulated professional advice.",
    ],
  },
  {
    title: "Ending access",
    points: [
      "CodeOrbit may suspend or end access when the platform is misused or when continuing access would create risk for the service or other users.",
      "You can also stop using the platform at any time.",
    ],
  },
];

export default function TermsOfServicePage() {
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
            Terms of Service
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-8 text-zinc-400">
            These are the simple ground rules for using CodeOrbit.
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
              If you plan to use CodeOrbit in a real production or commercial setting, review these terms properly for your own legal needs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
