import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Open Source | CodeOrbit",
  description: "A simple overview of the open source tools used by CodeOrbit.",
};

const sections = [
  {
    title: "What powers CodeOrbit",
    points: [
      "CodeOrbit is built with open source tools across the frontend, editor, auth, database, animation, and collaboration stack.",
      "That includes tools like Next.js, React, Tailwind CSS, Prisma, Monaco Editor, Chart.js, Framer Motion, GSAP, Yjs, Lucide, and related libraries.",
      "These libraries help the product move faster without rebuilding common engineering foundations from scratch.",
    ],
  },
  {
    title: "How those tools are used",
    points: [
      "These libraries help with routing, rendering, styling, animation, authentication, persistence, code editing, charts, and collaboration features.",
      "They make development faster and help the product stay modular.",
      "Different tools are used in different layers, from product UI to editor tooling and data handling.",
    ],
  },
  {
    title: "Ownership and licenses",
    points: [
      "CodeOrbit does not own those libraries.",
      "Each open source package keeps its own license and attribution requirements.",
      "If you deploy or distribute CodeOrbit, you are responsible for following those licenses correctly.",
      "That can include keeping copyright notices, preserving attribution, and shipping required license text where needed.",
    ],
  },
  {
    title: "Why this matters",
    points: [
      "Open source makes CodeOrbit possible, but it also creates responsibility when the product is shared, hosted, or commercialized.",
      "Using open source software does not remove the need to understand what licenses apply to your final build.",
    ],
  },
  {
    title: "What this page means",
    points: [
      "This page is a simple overview, not a full legal license report.",
      "If you need an exact inventory for deployment or company review, generate a dependency license report from the packages you are shipping.",
      "The exact dependency list may change over time as the project evolves.",
    ],
  },
];

export default function OpenSourcePage() {
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
            Open Source
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-8 text-zinc-400">
            CodeOrbit uses strong open source tools. This page gives a simple overview of what they do and what that means if you use or deploy the project.
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
              If you need a release-grade license inventory, create it from the exact dependency tree used in your deployment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
