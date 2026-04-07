import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Blocks,
  BrainCircuit,
  Code2,
  LayoutPanelTop,
  Sparkles,
  Target,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Case Study | CodeOrbit",
  description: "A product and engineering case study covering why CodeOrbit was built, how it is structured, and what it aims to solve.",
};

const summaryCards = [
  {
    label: "Product type",
    value: "Integrated learning platform",
  },
  {
    label: "Core promise",
    value: "Learn, practice, and build in one flow",
  },
  {
    label: "Primary users",
    value: "Developers trying to become job-ready faster",
  },
  {
    label: "Main edge",
    value: "Premium UX with modular product architecture",
  },
];

const visualSlots = [
  {
    title: "Platform overview",
    caption: "Use this slot for a full product hero screenshot that shows the main CodeOrbit visual language.",
    tag: "Hero screenshot",
    accent: "from-primary/25 via-violet-400/12 to-transparent",
    imagePath: "/case-study/platform-overview.svg",
  },
  {
    title: "Curriculum and learning flow",
    caption: "Best for the curriculum hub, progress view, or course detail page.",
    tag: "Learning UI",
    accent: "from-cyan-400/22 via-blue-400/10 to-transparent",
    imagePath: "/case-study/curriculum-flow.svg",
  },
  {
    title: "Practice and DSA flow",
    caption: "Best for problem solving, roadmap tracking, or synced practice progress.",
    tag: "Problem solving",
    accent: "from-emerald-400/22 via-teal-400/10 to-transparent",
    imagePath: "/case-study/practice-dsa-flow.svg",
  },
  {
    title: "Projects or AI workspace",
    caption: "Best for project discovery, drawer details, or the AI assistant workspace.",
    tag: "Feature surface",
    accent: "from-amber-400/22 via-orange-400/10 to-transparent",
    imagePath: "/case-study/projects-ai-workspace.svg",
  },
];

const sections = [
  {
    icon: Target,
    title: "The problem",
    body: [
      "Most coding journeys feel broken because the work is split across too many disconnected tools. A learner studies from one place, writes code in another, practices DSA somewhere else, and still has to figure out how to build projects that look serious enough for hiring managers.",
      "That fragmentation creates context switching, weak momentum, and shallow progress. People spend energy moving between tools instead of getting better at actual engineering.",
    ],
  },
  {
    icon: Sparkles,
    title: "Who the product is for",
    body: [
      "CodeOrbit is aimed at learners who want more than a course platform. The real target user is someone trying to turn study time into practical output: stronger problem solving, better projects, and a portfolio that feels real.",
      "That includes students, self-taught developers, career switchers, and junior engineers who need structure but also want a product that feels modern and serious.",
    ],
  },
  {
    icon: LayoutPanelTop,
    title: "What CodeOrbit tries to fix",
    body: [
      "CodeOrbit brings curriculum, playground, DSA, practice, interview prep, projects, profile, and AI help into one product flow. The goal is not to add more features for the sake of it. The goal is to remove friction between learning and doing.",
      "A user should be able to learn a concept, try code, ask for help, practice questions, and move into a project without feeling like they left the product.",
    ],
  },
  {
    icon: Sparkles,
    title: "Experience decisions",
    body: [
      "The interface is intentionally dark, focused, and premium. It is designed to feel more like a serious developer workspace than a generic course site. Typography, spacing, animation, and panel hierarchy all try to support that feeling.",
      "The product direction avoids noisy dashboards and cheap gamification. The better default is clarity, confidence, and momentum.",
    ],
  },
  {
    icon: LayoutPanelTop,
    title: "How the product is structured",
    body: [
      "The platform is organized around product areas that map directly to user goals: learn a topic, solve problems, build projects, prepare for interviews, and get help when blocked.",
      "That structure matters because it keeps navigation understandable. Users do not have to guess where something lives, and the product reads more like a connected workflow than a collection of unrelated screens.",
    ],
  },
  {
    icon: Blocks,
    title: "Architecture decisions",
    body: [
      "The codebase follows a feature-driven structure so that major product areas can evolve independently. Routes stay thin, while domain-level UI and logic live inside feature folders.",
      "That keeps the project easier to scale. New work usually means extending a focused module instead of bloating shared files.",
    ],
  },
  {
    icon: Code2,
    title: "Why the platform matters technically",
    body: [
      "CodeOrbit is not only a UI exercise. It demonstrates product thinking, information architecture, and the ability to organize a complex frontend around real user workflows.",
      "The project also shows how to build for iteration: AI providers can change, data sources can evolve, and sections can become more dynamic without rewriting the whole app from scratch.",
    ],
  },
  {
    icon: Blocks,
    title: "What makes the build credible",
    body: [
      "The important part is not that the product has many pages. The important part is that those pages are aligned around a product story, backed by reusable structure, and designed to evolve without collapsing under their own weight.",
      "That makes CodeOrbit a stronger case study than a typical static portfolio project. It shows UI craft, feature planning, and engineering judgment at the same time.",
    ],
  },
  {
    icon: BrainCircuit,
    title: "What it says about the builder",
    body: [
      "This project signals more than the ability to style a page. It shows judgment about what developers actually need, how to reduce friction, and how to structure a product that can grow beyond a demo.",
      "That is the real case study value: not just what features were built, but why they were chosen and how they fit together.",
    ],
  },
  {
    icon: BrainCircuit,
    title: "Where it can grow next",
    body: [
      "The current version is already structured to support deeper backend work, richer syncing, stronger personalization, and more serious user state over time.",
      "That gives the case study a useful second layer: it is not only a finished interface, it is also a product foundation that can keep expanding in a believable way.",
    ],
  },
];

const outcomes = [
  "A learner can move from concept to code without leaving the product.",
  "Interview prep, DSA, projects, and playground now feel like one system instead of separate pages.",
  "The UI is premium enough to feel intentional, but practical enough to stay usable.",
  "The architecture is modular enough to support future backend and sync work without major rewrites.",
  "The product feels closer to a real developer platform than a portfolio made of isolated pages.",
  "The case study now explains both the product logic and the engineering logic behind the build.",
];

export default function CaseStudyPage() {
  return (
    <div className="relative overflow-hidden bg-[#04050a] px-4 py-16 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <div className="absolute left-[10%] top-[8%] h-72 w-72 rounded-full bg-primary/12 blur-[130px]" />
        <div className="absolute bottom-[8%] right-[8%] h-72 w-72 rounded-full bg-cyan-500/10 blur-[140px]" />
      </div>

      <div className="relative mx-auto flex w-full max-w-[1280px] flex-col gap-8">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-zinc-300 transition-colors hover:border-white/20 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-zinc-300 transition-colors hover:border-white/20 hover:text-white"
          >
            About page
          </Link>
        </div>

        <section className="rounded-[34px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.28)] backdrop-blur-2xl sm:p-8 lg:p-10">
          <div className="max-w-4xl">
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.28em] text-primary/80">Case Study</p>
            <h1 className="font-display text-[clamp(2.8rem,8vw,5.6rem)] font-black tracking-[-0.05em] text-white">
              Why CodeOrbit was built
            </h1>
            <p className="mt-5 max-w-3xl text-[15px] leading-8 text-zinc-400 sm:text-lg">
              CodeOrbit is a product case study about reducing friction in the developer journey. It combines learning, practice, projects, interview prep, and AI help into one focused platform experience.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <div
                key={card.label}
                className="rounded-[24px] border border-white/[0.08] bg-black/20 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-500">{card.label}</p>
                <p className="mt-3 text-base font-semibold leading-7 text-white">{card.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-[28px] border border-white/[0.08] bg-black/20 p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-zinc-500">Visual blocks</p>
                <p className="mt-2 text-sm leading-7 text-zinc-400">
                  Screenshot-ready slots for the final case study presentation.
                </p>
              </div>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold text-zinc-400">
                Replace with real product captures later
              </span>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.95fr)]">
              <div className="rounded-[24px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))] p-4">
                <div className="relative overflow-hidden rounded-[20px] border border-white/12 bg-[#080910]">
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <Image
                      alt={visualSlots[0].title}
                      className="object-cover"
                      fill
                      priority
                      sizes="(max-width: 1280px) 100vw, 780px"
                      src={visualSlots[0].imagePath}
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,5,10,0.06),rgba(4,5,10,0.68))]" />
                    <div className="absolute left-4 top-4">
                      <span className="rounded-full border border-white/12 bg-black/30 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-200">
                        {visualSlots[0].tag}
                      </span>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 p-5">
                      <p className="text-lg font-semibold text-white">{visualSlots[0].title}</p>
                      <p className="mt-2 max-w-lg text-sm leading-7 text-zinc-300">
                        {visualSlots[0].caption}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                {visualSlots.slice(1).map((slot) => (
                  <div
                    key={slot.title}
                    className="rounded-[24px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-4"
                  >
                    <div className="relative overflow-hidden rounded-[18px] border border-white/12 bg-[#080910]">
                      <div className="relative aspect-[5/4] overflow-hidden">
                        <Image
                          alt={slot.title}
                          className="object-cover"
                          fill
                          sizes="(max-width: 1280px) 100vw, 360px"
                          src={slot.imagePath}
                        />
                        <div className={`absolute inset-0 bg-gradient-to-br ${slot.accent}`} />
                        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,5,10,0.1),rgba(4,5,10,0.82))]" />
                        <div className="relative flex h-full flex-col justify-between p-4">
                          <span className="self-start rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-200">
                            {slot.tag}
                          </span>
                          <div>
                            <p className="text-base font-semibold text-white">{slot.title}</p>
                            <p className="mt-2 text-sm leading-7 text-zinc-300">{slot.caption}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,0.72fr)_340px]">
          <section className="space-y-5">
            {sections.map((section) => {
              const Icon = section.icon;

              return (
                <article
                  key={section.title}
                  className="rounded-[28px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-2xl sm:p-7"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/[0.08] text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">{section.title}</h2>
                      <div className="mt-3 space-y-3 text-sm leading-7 text-zinc-400 sm:text-[15px]">
                        {section.body.map((paragraph) => (
                          <p key={paragraph}>{paragraph}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          <aside className="h-fit rounded-[30px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.24)] backdrop-blur-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-zinc-500">Key outcomes</p>
            <div className="mt-5 space-y-3">
              {outcomes.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-4 text-sm leading-7 text-zinc-300"
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-[24px] border border-white/[0.08] bg-white/[0.02] p-5">
              <p className="text-sm font-semibold text-white">Next step</p>
              <p className="mt-2 text-sm leading-7 text-zinc-400">
                If you want the deeper architecture walk-through, the about page still covers the broader technical implementation in more detail.
              </p>
              <Link
                href="/about"
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-zinc-200 transition-colors hover:border-white/20 hover:text-white"
              >
                Open about page
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-6 rounded-[24px] border border-white/[0.08] bg-black/20 p-5">
              <p className="text-sm font-semibold text-white">Case study summary</p>
              <p className="mt-2 text-sm leading-7 text-zinc-400">
                CodeOrbit is less about showing isolated screens and more about proving product judgment, visual discipline, and scalable frontend structure in one system.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
