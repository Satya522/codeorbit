"use client";

import Link from "next/link";
import { Badge } from "@/components/ui";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  BarChart3,
  Bot,
  BrainCircuit,
  BriefcaseBusiness,
  Code2,
  Compass,
  FolderKanban,
  Rocket,
  SquareTerminal,
} from "lucide-react";

/* ============================================ */
/*  DATA                                        */
/* ============================================ */

const features = [
  { icon: SquareTerminal, title: "Browser-Native IDE", desc: "Full Node.js, Python & Java execution inside WebContainers. Zero local setup. Write, run, debug — instantly.", gradient: "from-amber-500/20 via-orange-500/10 to-transparent", accent: "text-amber-400", ring: "group-hover:shadow-amber-500/10", iconShell: "from-amber-500/20 to-orange-500/10", iconGlow: "bg-amber-500/20" },
  { icon: BrainCircuit, title: "DSA Mastery Engine", desc: "3,000+ curated problems organized by algorithmic pattern. Structured roadmaps track your progression from arrays to advanced graphs.", gradient: "from-violet-500/20 via-purple-500/10 to-transparent", accent: "text-violet-400", ring: "group-hover:shadow-violet-500/10", iconShell: "from-violet-500/20 to-purple-500/10", iconGlow: "bg-violet-500/20" },
  { icon: Bot, title: "AI Code Mentor", desc: "GPT-4 Turbo powered assistant that explains code line-by-line, fixes errors contextually, and gives progressive hints.", gradient: "from-cyan-500/20 via-blue-500/10 to-transparent", accent: "text-cyan-400", ring: "group-hover:shadow-cyan-500/10", iconShell: "from-cyan-500/20 to-blue-500/10", iconGlow: "bg-cyan-500/20" },
  { icon: FolderKanban, title: "Enterprise Projects", desc: "Build production-grade apps — collaborative editors, microservices, AI UIs — guided step-by-step with scaffolding.", gradient: "from-emerald-500/20 via-green-500/10 to-transparent", accent: "text-emerald-400", ring: "group-hover:shadow-emerald-500/10", iconShell: "from-emerald-500/20 to-green-500/10", iconGlow: "bg-emerald-500/20" },
  { icon: BriefcaseBusiness, title: "Mock Interviews", desc: "Company-specific prep for Google, Meta & Amazon. System design walkthroughs and behavioral prep with live AI feedback.", gradient: "from-rose-500/20 via-red-500/10 to-transparent", accent: "text-rose-400", ring: "group-hover:shadow-rose-500/10", iconShell: "from-rose-500/20 to-red-500/10", iconGlow: "bg-rose-500/20" },
  { icon: BarChart3, title: "Progress Analytics", desc: "GitHub-style heatmaps, streak counters, global rankings, and granular breakdowns of your strengths and blind spots.", gradient: "from-indigo-500/20 via-blue-500/10 to-transparent", accent: "text-indigo-400", ring: "group-hover:shadow-indigo-500/10", iconShell: "from-indigo-500/20 to-blue-500/10", iconGlow: "bg-indigo-500/20" },
];

const stats = [
  { end: 25, suffix: "+", label: "Tech Stacks" },
  { end: 3267, suffix: "+", label: "DSA Questions" },
  { end: 5, suffix: "", label: "Coding Platforms" },
  { end: 4, suffix: "", label: "Enterprise Projects" },
];

const roadmap = [
  {
    num: "01",
    title: "Choose Your Domain",
    desc: "Frontend, Backend, Databases, or Core CS — pick a track tailored to your goals.",
    color: "from-cyan-400 to-blue-500",
    icon: Compass,
    panelEyebrow: "Personalized Start",
    panelTitle: "Choose the path that matches your ambition.",
    panelCopy: "Pick a focused engineering track and get a clean sequence of modules, projects, and milestones instead of random tutorials.",
    snippet: [
      "track: frontend",
      "timeline: 12 weeks",
      "modules: html -> css -> react",
    ],
  },
  {
    num: "02",
    title: "Learn by Building",
    desc: "Interactive modules with embedded editors, quizzes, and real-time feedback loops.",
    color: "from-violet-400 to-purple-500",
    icon: Code2,
    panelEyebrow: "Interactive Learning",
    panelTitle: "Every lesson moves inside a working playground.",
    panelCopy: "Read less, build more. The editor, lesson flow, and module checkpoints all work together so momentum never drops.",
    snippet: [
      "lesson.open('React State')",
      "editor.run() -> success",
      "checkpoint.complete('Hooks Basics')",
    ],
  },
  {
    num: "03",
    title: "Practice Relentlessly",
    desc: "Curated DSA problems mapped to real interview patterns. Track acceptance rates.",
    color: "from-amber-400 to-orange-500",
    icon: BrainCircuit,
    panelEyebrow: "Pattern Mastery",
    panelTitle: "Practice with structure, not with guesswork.",
    panelCopy: "Problem sets are grouped by pattern, difficulty, and platform so revision feels deliberate and interview prep stays sharp.",
    snippet: [
      "pattern: Sliding Window",
      "solved: 18/25",
      "acceptance: +14.2%",
    ],
  },
  {
    num: "04",
    title: "Ship & Get Hired",
    desc: "Complete guided projects that double as portfolio pieces recruiters actually care about.",
    color: "from-emerald-400 to-green-500",
    icon: Rocket,
    panelEyebrow: "Career Layer",
    panelTitle: "Turn skill into proof recruiters can actually scan.",
    panelCopy: "Guided portfolio projects, practice metrics, and interview prep all compound into one polished story when it is time to apply.",
    snippet: [
      "project: ship-ai-dashboard",
      "status: deployed",
      "outcome: interview ready",
    ],
  },
];

const techStack = ["React", "TypeScript", "Node.js", "Python", "Java", "PostgreSQL", "MongoDB", "Express", "DSA", "SQL", "HTML", "CSS", "JavaScript"];

const faqs = [
  { q: "Is CodeOrbit completely free?", a: "Yes. The entire core platform — curriculum, playground, DSA engine, and practice problems — is free forever. Premium AI-powered mock interviews will be available as an optional subscription in a future release." },
  { q: "Do I need to install anything on my machine?", a: "Nothing at all. WebCore runs right in your browser for frontend work, and the secure remote runners handle Java, Python, Go, C++, and Node-style execution without making you install a local toolchain." },
  { q: "How is this different from LeetCode or Codecademy?", a: "CodeOrbit is a unified platform. Instead of bouncing between 5 different tools, you get curriculum + IDE + DSA practice + mock interviews + AI assistant + project builder in one distraction-free, premium experience." },
  { q: "Can I use this for FAANG interview prep?", a: "Absolutely. The DSA engine now spans 3,000+ curated questions organized by pattern, topic, difficulty, and platform, so prep feels structured instead of random. On top of that, the Interview Prep layer adds company-focused practice, system design thinking, and mock-interview style workflows aligned with the kind of rounds you would expect from teams like Google, Meta, and Amazon." },
  { q: "Who built this and why?", a: "CodeOrbit was built as a product-first engineering project to solve a real frustration: serious learners are forced to jump between too many disconnected tools. The goal was to create one focused environment where learning, coding, DSA practice, AI guidance, and interview prep work together as a single premium experience. If you want the full story behind the product thinking and architecture, the About page breaks it down in detail." },
];

const testimonials = [
  {
    name: "Arjun Menon",
    role: "Full-Stack Engineer · Hired via CodeOrbit Prep",
    quote:
      "I stopped bouncing between LeetCode, YouTube, and random GitHub repos. CodeOrbit consolidated my entire engineering prep into one crafted platform. Landed my offer at a Series B startup within 8 weeks of focused practice.",
    initial: "A",
  },
  {
    name: "Riya Sharma",
    role: "Frontend Developer · React Track Graduate",
    quote:
      "The biggest difference was momentum. I used to watch tutorials endlessly. Here, the curriculum, playground, and project flow kept me shipping every week.",
    initial: "R",
  },
  {
    name: "Nikhil Soni",
    role: "Backend Engineer · Cracked Product Interviews",
    quote:
      "The DSA roadmap finally made practice feel structured. I stopped guessing what to solve next and started seeing real improvement in contests and interviews.",
    initial: "N",
  },
  {
    name: "Pooja Iyer",
    role: "SDE Intern · Offer in Final Year",
    quote:
      "I used the AI mentor almost daily for hints and debugging. It felt like having a calm senior beside me without the noise of switching tools.",
    initial: "P",
  },
  {
    name: "Kabir Jain",
    role: "Career Switcher · From Support to Dev",
    quote:
      "What I loved was the clarity. Instead of 10 tabs open, I had one place to learn, practice, and build. That changed how consistently I studied.",
    initial: "K",
  },
  {
    name: "Sneha Patel",
    role: "University Student · DSA Focused",
    quote:
      "The pattern-based approach helped me understand why a problem belongs to a category, not just memorize a solution. That made revision much faster.",
    initial: "S",
  },
  {
    name: "Vikram Rao",
    role: "Software Engineer · Promotion Prep",
    quote:
      "The premium feel is real. Even small things like the editor, practice flow, and progress view made me want to come back every night and keep going.",
    initial: "V",
  },
];

/* ============================================ */
/*  HOOKS                                       */
/* ============================================ */

function useInView(threshold = 0.15): [React.RefCallback<HTMLElement>, boolean] {
  const [visible, setVisible] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const callbackRef = useCallback((node: HTMLElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    if (node) {
      observerRef.current = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setVisible(true); },
        { threshold }
      );
      observerRef.current.observe(node);
    }
  }, [threshold]);

  return [callbackRef, visible];
}

function useCounter(end: number, visible: boolean, duration = 2000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [visible, end, duration]);
  return count;
}

function StatCard({ end, suffix, label, visible, delay }: { end: number; suffix: string; label: string; visible: boolean; delay: number }) {
  const count = useCounter(end, visible, 2000 + delay);
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-8 text-center shadow-[0_14px_40px_rgba(0,0,0,0.16)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_0_30px_rgba(139,92,246,0.14)] ${
        visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="absolute inset-x-[18%] bottom-[-26px] h-16 rounded-full bg-primary/15 blur-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/12 blur-3xl opacity-70 transition-all duration-500 group-hover:scale-110 group-hover:opacity-100 animate-glow-pulse" />
      <div className="relative">
        <div className="text-4xl font-black tracking-tight text-white tabular-nums md:text-5xl">
          {count}
          {suffix ? <span className="ml-1 align-top text-2xl font-extrabold text-primary/90 md:text-3xl">{suffix}</span> : null}
        </div>
      </div>
      <div className="mt-2 text-sm font-semibold text-zinc-500 transition-colors duration-300 group-hover:text-zinc-300">{label}</div>
    </div>
  );
}

function TestimonialCard({
  testimonial,
}: {
  testimonial: { name: string; role: string; quote: string; initial: string };
}) {
  return (
    <div className="group relative w-[280px] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_12px_34px_rgba(0,0,0,0.16)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:border-white/15 hover:shadow-[0_24px_60px_rgba(0,0,0,0.22),0_0_22px_rgba(139,92,246,0.08)] sm:w-[320px] sm:p-6">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="pointer-events-none absolute left-6 top-6 h-16 w-16 rounded-full bg-primary/15 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="mb-5 flex items-center justify-between">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <span key={star} className="text-sm text-yellow-400">
              ★
            </span>
          ))}
        </div>
        <span className="text-4xl leading-none text-zinc-900">&ldquo;</span>
      </div>

      <p className="min-h-[132px] text-sm leading-7 text-zinc-300">
        &ldquo;{testimonial.quote}&rdquo;
      </p>

      <div className="mt-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary via-violet-500 to-blue-500 text-sm font-black text-white shadow-lg shadow-primary/20">
          {testimonial.initial}
        </div>
        <div>
          <p className="text-sm font-bold text-white">{testimonial.name}</p>
          <p className="text-xs leading-relaxed text-zinc-500">{testimonial.role}</p>
        </div>
      </div>
    </div>
  );
}

/* ============================================ */
/*  PAGE                                        */
/* ============================================ */

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeRoadmapStep, setActiveRoadmapStep] = useState(0);
  const roadmapStepRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [heroRef, heroVisible] = useInView(0.1);
  const [statsRef, statsVisible] = useInView(0.2);
  const [featRef, featVisible] = useInView(0.1);
  const [roadRef, roadVisible] = useInView(0.1);
  const [proofRef, proofVisible] = useInView(0.1);
  const [faqRef, faqVisible] = useInView(0.1);
  const [ctaRef, ctaVisible] = useInView(0.1);
  const activeRoadmap = roadmap[activeRoadmapStep] ?? roadmap[0];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visibleEntries[0]) {
          const nextIndex = Number((visibleEntries[0].target as HTMLElement).dataset.stepIndex);
          if (!Number.isNaN(nextIndex)) {
            setActiveRoadmapStep(nextIndex);
          }
        }
      },
      {
        threshold: [0.35, 0.55, 0.75],
        rootMargin: "-12% 0px -22% 0px",
      }
    );

    roadmapStepRefs.current.forEach((node) => {
      if (node) observer.observe(node);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex flex-col items-center overflow-hidden bg-[#020204] relative noise-bg">

      {/* ===========================================  */}
      {/*  HERO                                       */}
      {/* ===========================================  */}
      <section className="relative w-full flex flex-col items-center">
        {/* Grid overlay */}
        <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />

        {/* Ambient orbs */}
        <div className="absolute top-[-25%] left-[-10%] w-[55%] h-[55%] bg-primary/20 blur-[200px] rounded-full pointer-events-none animate-glow-pulse" />
        <div className="absolute top-[5%] right-[-15%] w-[45%] h-[45%] bg-blue-600/15 blur-[180px] rounded-full pointer-events-none animate-glow-pulse" style={{ animationDelay: "1.5s" }} />
        <div className="absolute bottom-[10%] left-[20%] w-[30%] h-[30%] bg-violet-600/10 blur-[150px] rounded-full pointer-events-none animate-glow-pulse" style={{ animationDelay: "3s" }} />

        {/* Bottom edge glow line */}
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/25 to-transparent" />

        <div
          ref={heroRef}
          className={`relative z-10 mx-auto flex w-full max-w-[1400px] flex-col items-center px-5 pt-20 pb-7 text-center transition-all duration-1000 sm:pt-24 md:px-6 md:pt-32 md:pb-10 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          {/* Pill badge */}
          <div className="mb-7 flex items-center gap-2.5 rounded-full border border-primary/20 bg-primary/[0.06] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-primary/90 sm:px-5 sm:text-[11px] sm:tracking-[0.2em]">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Public Beta — 2,400+ Engineers Onboarded
          </div>

          {/* Headline */}
          <h1 className="font-display text-[clamp(2.9rem,8vw,7rem)] font-black tracking-[-0.04em] leading-[0.92] text-white max-w-5xl mb-8 relative">
            <span className="block">Where Engineers</span>
            <span className="block text-gradient bg-gradient-to-r from-primary via-violet-400 via-50% to-cyan-400 animate-gradient-x mt-1">
              Become Unstoppable.
            </span>
            {/* Cursor blink */}
            <span className="inline-block w-[4px] h-[0.8em] bg-primary/80 ml-2 align-middle" style={{ animation: "typing-cursor 1s steps(1) infinite" }} />
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mb-8 max-w-2xl text-sm font-medium leading-[1.75] text-zinc-400 sm:text-lg md:mb-10 md:text-xl">
                Curriculum. Playground IDE. DSA engine. Mock interviews. AI mentor. Enterprise projects.<br className="hidden sm:block" />
            <span className="text-zinc-300 font-semibold">One platform. Zero distractions.</span>
          </p>

          {/* CTA Buttons */}
          <div className="mb-4 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4">
            <Link
              href="/learn"
              className="group relative px-10 py-[18px] rounded-full font-bold text-base text-white transition-all duration-300 hover:scale-[1.04] active:scale-[0.96] text-center overflow-hidden bg-gradient-to-r from-primary via-violet-500 to-blue-500 animate-gradient-x shadow-[0_0_50px_rgba(139,92,246,0.3)] hover:shadow-[0_0_80px_rgba(139,92,246,0.5)]"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">Start Learning — Free <span className="group-hover:translate-x-1 transition-transform">→</span></span>
            </Link>
            <Link
              href="/about"
              className="px-10 py-[18px] rounded-full border border-white/10 bg-white/[0.02] text-white font-bold text-base hover:bg-white/[0.06] transition-all duration-300 hover:scale-[1.02] active:scale-[0.96] text-center backdrop-blur-sm hover:border-white/20"
            >
              Read the Case Study
            </Link>
          </div>
          <p className="text-zinc-600 text-[11px] tracking-[0.15em] uppercase font-semibold">No signup required · Instant access · Free forever</p>
        </div>

        {/* ---- Browser Mockup ---- */}
        <div className={`relative z-10 mx-auto block w-full max-w-[1400px] px-4 pb-10 transition-all duration-1000 delay-300 md:-mt-2 md:px-6 md:pb-14 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
          <div className="relative mx-auto w-full max-w-6xl">
            <div
              className={`pointer-events-none absolute left-1/2 top-1/2 h-[280px] w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/20 blur-[100px] transition-all duration-1000 ${
                heroVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
              }`}
            />
            <div
              className={`pointer-events-none absolute inset-x-[12%] bottom-[-36px] h-28 rounded-full bg-cyan-500/10 blur-[70px] transition-all duration-1000 delay-150 ${
                heroVisible ? "opacity-100" : "opacity-0"
              }`}
            />
            <div className="glass-card-strong relative overflow-hidden rounded-2xl border border-white/[0.07] shadow-[0_30px_100px_-25px_rgba(139,92,246,0.15),0_0_0_1px_rgba(255,255,255,0.03)]">
              {/* Title bar */}
              <div className="h-10 border-b border-white/5 bg-white/[0.015] flex items-center px-4 gap-2.5">
                <div className="flex gap-1.5">
                  <div className="w-[10px] h-[10px] rounded-full bg-[#ff5f57]" />
                  <div className="w-[10px] h-[10px] rounded-full bg-[#febc2e]" />
                  <div className="w-[10px] h-[10px] rounded-full bg-[#28c840]" />
                </div>
                <div className="ml-4 flex-1 max-w-xs h-[22px] bg-white/[0.03] rounded-md border border-white/5 flex items-center px-3 gap-1.5">
                  <svg className="w-3 h-3 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  <span className="text-[10px] text-zinc-500 font-mono">codeorbit.dev/playground</span>
                </div>
              </div>

              {/* Content */}
              <div className="flex min-h-[380px] flex-col md:h-[300px] md:min-h-0 md:flex-row">
                {/* Editor pane */}
                <div className="relative flex-1 overflow-hidden border-b border-white/[0.04] bg-[#0c0c0f] p-4 font-mono text-[10px] leading-[1.7] md:border-b-0 md:border-r md:p-5 md:text-[11px]">
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-zinc-800/80 text-[9px] text-zinc-500 font-sans font-bold uppercase tracking-widest">JavaScript</div>
                  <div className="flex gap-4">
                    <div className="text-zinc-700 text-right select-none w-5 flex flex-col">
                      {Array.from({length: 12}, (_, i) => <div key={i}>{i + 1}</div>)}
                    </div>
                    <div className="flex flex-col text-zinc-300 flex-1 min-w-0">
                      <div className="text-zinc-600">{"// Two Sum — O(n) Hash Map Pattern"}</div>
                      <div><span className="text-violet-400">const</span> <span className="text-cyan-300">twoSum</span> = <span className="text-yellow-300">(</span><span className="text-orange-300">nums</span>, <span className="text-orange-300">target</span><span className="text-yellow-300">)</span> <span className="text-violet-400">=&gt;</span> <span className="text-yellow-300">{"{"}</span></div>
                      <div className="pl-4"><span className="text-violet-400">const</span> <span className="text-cyan-300">map</span> = <span className="text-violet-400">new</span> <span className="text-green-300">Map</span>();</div>
                      <div className="pl-4"><span className="text-violet-400">for</span> (<span className="text-violet-400">let</span> i = <span className="text-green-400">0</span>; i &lt; nums.<span className="text-cyan-300">length</span>; i++) <span className="text-yellow-300">{"{"}</span></div>
                      <div className="pl-8"><span className="text-violet-400">const</span> complement = target - nums[i];</div>
                      <div className="pl-8"><span className="text-violet-400">if</span> (map.<span className="text-cyan-300">has</span>(complement))</div>
                      <div className="pl-12"><span className="text-violet-400">return</span> [map.<span className="text-cyan-300">get</span>(complement), i];</div>
                      <div className="pl-8">map.<span className="text-cyan-300">set</span>(nums[i], i);</div>
                      <div className="pl-4"><span className="text-yellow-300">{"}"}</span></div>
                      <div><span className="text-yellow-300">{"}"}</span>;</div>
                      <div>&nbsp;</div>
                      <div className="text-zinc-600">{"// Runtime: O(n) · Space: O(n)"}</div>
                    </div>
                  </div>
                </div>

                {/* Output pane */}
                <div className="flex w-full flex-col bg-[#060609] p-4 md:w-[38%] md:p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[9px] text-zinc-500 uppercase tracking-[0.2em] font-bold">Output</span>
                  </div>
                  <div className="font-mono text-[11px] text-zinc-400 flex-1 flex flex-col justify-center gap-1.5">
                    <p className="text-zinc-600">$ Executing solution...</p>
                    <p className="text-emerald-400">✓ Test 1: nums=[2,7,11], target=9 → [0,1] <span className="text-zinc-600">2ms</span></p>
                    <p className="text-emerald-400">✓ Test 2: nums=[3,2,4], target=6 → [1,2] <span className="text-zinc-600">1ms</span></p>
                    <p className="text-emerald-400">✓ Test 3: nums=[3,3], target=6 → [0,1] <span className="text-zinc-600">0ms</span></p>
                    <div className="mt-4 pt-3 border-t border-white/5">
                      <p className="text-emerald-400 font-bold text-xs">All tests passed ✓</p>
                      <p className="text-zinc-600 text-[10px] mt-1">Runtime: 2ms — Beats 95.4%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===========================================  */}
      {/*  SCROLLING TECH MARQUEE                     */}
      {/* ===========================================  */}
      <div className="w-full border-y border-white/[0.04] bg-white/[0.01] overflow-hidden py-5 relative">
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#020204] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#020204] to-transparent z-10 pointer-events-none" />
        <div className="animate-marquee flex items-center gap-10 whitespace-nowrap w-max">
          {[...techStack, ...techStack].map((t, i) => (
            <span key={i} className="text-sm font-bold text-zinc-600 tracking-wide flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-zinc-700" />
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* ===========================================  */}
      {/*  STATS                                      */}
      {/* ===========================================  */}
      <section className="w-full" ref={statsRef}>
        <div className={`mx-auto w-full max-w-[1400px] px-5 py-14 transition-all duration-1000 md:px-6 md:py-18 ${statsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((s, i) => (
              <StatCard key={i} end={s.end} suffix={s.suffix} label={s.label} visible={statsVisible} delay={i * 300} />
            ))}
          </div>
        </div>
      </section>

      {/* ===========================================  */}
      {/*  FEATURES                                   */}
      {/* ===========================================  */}
      <section className="w-full relative" ref={featRef}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] bg-primary/[0.04] blur-[200px] rounded-full pointer-events-none" />

        <div className={`relative z-10 mx-auto w-full max-w-[1400px] px-5 py-16 transition-all duration-1000 md:px-6 md:py-20 ${featVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <Badge variant="outline" className="px-4 py-1.5 border-white/10 bg-white/[0.02] text-zinc-500 tracking-[0.2em] text-[10px] uppercase font-bold mb-6">
              Platform Architecture
            </Badge>
            <h2 className="font-display text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-[-0.03em] mb-6 leading-tight">
              Everything you need.<br className="hidden sm:block" />
              <span className="text-gradient bg-gradient-to-r from-zinc-400 to-zinc-600">Nothing you don&apos;t.</span>
            </h2>
            <p className="text-zinc-500 text-base md:text-lg leading-relaxed max-w-xl mx-auto">
              Six deeply integrated modules engineered to take you from syntax to shipping — and acing the interview.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <div
                key={i}
                className={`group relative h-full min-h-[280px] cursor-default overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-1.5 hover:border-primary/25 hover:shadow-[0_24px_60px_rgba(0,0,0,0.24),0_0_24px_rgba(139,92,246,0.14)] ${
                  featVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                } ${f.ring}`}
                style={{ transitionDelay: `${120 + i * 90}ms` }}
              >
                {/* Gradient overlay on hover */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${f.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
                <div className={`pointer-events-none absolute left-6 top-6 h-20 w-20 rounded-full ${f.iconGlow} opacity-40 blur-3xl transition-all duration-500 group-hover:scale-125 group-hover:opacity-80`} />
                <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="relative z-10 flex h-full flex-col pb-8">
                  <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br ${f.iconShell} shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_10px_30px_rgba(0,0,0,0.18)] transition-all duration-500 group-hover:-translate-y-1 group-hover:scale-110 group-hover:border-white/15 group-hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_16px_36px_rgba(0,0,0,0.22)]`}>
                    <f.icon className={`h-6 w-6 ${f.accent} transition-all duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:scale-110`} />
                  </div>
                  <div className="mb-3">
                    <h3 className="text-lg font-bold text-white tracking-tight">{f.title}</h3>
                    <div className={`mt-2 h-px w-12 bg-gradient-to-r ${f.iconShell} opacity-40 transition-all duration-500 group-hover:w-24 group-hover:opacity-100 group-hover:shadow-[0_0_16px_rgba(139,92,246,0.25)]`} />
                  </div>
                  <p className="text-sm text-zinc-500 leading-relaxed transition-colors group-hover:text-zinc-300">{f.desc}</p>
                  <div className={`pointer-events-none absolute bottom-0 left-0 flex items-center gap-1 text-xs font-bold ${f.accent} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}>
                    Explore Module <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===========================================  */}
      {/*  ROADMAP                                    */}
      {/* ===========================================  */}
      <section className="w-full border-y border-white/[0.04] relative overflow-hidden" ref={roadRef}>
        <div className="absolute top-0 right-0 w-[40%] h-full bg-gradient-to-l from-primary/[0.03] to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[30%] h-[50%] bg-gradient-to-tr from-blue-600/[0.03] to-transparent pointer-events-none" />

        <div className={`relative z-10 mx-auto w-full max-w-[1400px] px-5 py-16 transition-all duration-1000 md:px-6 md:py-20 ${roadVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
            <div className="lg:sticky lg:top-32">
              <Badge variant="outline" className="px-4 py-1.5 border-white/10 bg-white/[0.02] text-zinc-500 tracking-[0.2em] text-[10px] uppercase font-bold mb-6">
                The Path
              </Badge>
              <h2 className="font-display text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-[-0.03em] mb-6 leading-tight">
                From absolute zero<br />to <span className="text-gradient bg-gradient-to-r from-emerald-400 to-cyan-400">job-ready</span>.
              </h2>
              <p className="text-zinc-500 text-base md:text-lg leading-relaxed max-w-md">
                No aimless tutorial hopping. A structured 4-phase path from your first line of code to a portfolio that stops recruiters mid-scroll.
              </p>
              <div className="relative mt-8 overflow-hidden rounded-[28px] border border-white/[0.07] bg-white/[0.03] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.2)] backdrop-blur-xl md:p-6">
                <div className={`pointer-events-none absolute inset-x-[18%] top-[-18px] h-24 rounded-full bg-gradient-to-r ${activeRoadmap.color} opacity-20 blur-3xl transition-all duration-700`} />
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                    <span className="inline-flex h-2 w-2 rounded-full bg-primary/80 shadow-[0_0_14px_rgba(139,92,246,0.8)]" />
                    Active Preview
                  </div>
                  <div className="text-xs font-semibold text-zinc-500">
                    {activeRoadmap.num} / {String(roadmap.length).padStart(2, "0")}
                  </div>
                </div>
                {roadmap.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = index === activeRoadmapStep;

                  return (
                    <div
                      key={step.num}
                      className={`absolute inset-x-5 bottom-5 top-[60px] flex h-auto flex-col transition-all duration-700 md:inset-x-6 md:bottom-6 ${
                        isActive ? "translate-y-0 scale-100 opacity-100 blur-0" : "pointer-events-none translate-y-6 scale-[0.985] opacity-0 blur-[6px]"
                      }`}
                    >
                      <div className={`pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full ${step.color} opacity-10 blur-3xl`} />
                      <div className="relative z-10 flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">{step.panelEyebrow}</p>
                          <h3 className="font-display mt-3 max-w-md text-xl font-black tracking-tight text-white md:text-2xl">{step.panelTitle}</h3>
                        </div>
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${step.color} text-white shadow-[0_12px_30px_rgba(0,0,0,0.25)]`}>
                          <Icon className="h-5 w-5" />
                        </div>
                      </div>
                      <p className="relative z-10 mt-4 max-w-lg text-sm leading-7 text-zinc-400">{step.panelCopy}</p>
                      <div className="relative z-10 mt-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#070910]">
                        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full bg-gradient-to-r ${step.color}`} />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Orbit Preview</span>
                          </div>
                          <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] font-semibold text-zinc-400">
                            Live
                          </span>
                        </div>
                        <div className="space-y-3 p-4">
                          {step.snippet.map((line, lineIndex) => (
                            <div key={line} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-3 transition-all duration-500">
                              <span className={`h-8 w-1 rounded-full bg-gradient-to-b ${step.color}`} />
                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-600">Signal {lineIndex + 1}</p>
                                <p className="mt-1 truncate font-mono text-[11px] text-zinc-300">{line}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-2 border-t border-white/[0.06] px-4 py-3">
                          {["Guided", "Interactive", "Focused"].map((chip) => (
                            <span key={chip} className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] font-semibold text-zinc-400">
                              {chip}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div className="pointer-events-none absolute bottom-0 left-5 right-5 h-px bg-white/[0.05] md:left-6 md:right-6" />
                <div
                  className="pointer-events-none absolute bottom-0 left-5 h-px bg-gradient-to-r from-primary via-violet-400 to-cyan-400 transition-all duration-700 md:left-6"
                  style={{ width: `calc((100% - 2.5rem) * ${(activeRoadmapStep + 1) / roadmap.length})` }}
                />
                <div
                  className="pointer-events-none absolute bottom-0 h-2 w-2 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_18px_rgba(139,92,246,0.9)] transition-all duration-700"
                  style={{ left: `calc(1.25rem + (100% - 2.5rem) * ${(activeRoadmapStep + 1) / roadmap.length})` }}
                />
                <div className="invisible flex h-[360px] flex-col p-6 md:h-[320px]" aria-hidden="true" />
              </div>
            </div>

            <div className="space-y-2 md:space-y-1.5">
              {roadmap.map((s, i) => (
                <div
                  key={i}
                  ref={(node) => {
                    roadmapStepRefs.current[i] = node;
                  }}
                  data-step-index={i}
                  onMouseEnter={() => setActiveRoadmapStep(i)}
                  className={`group relative scroll-mt-28 flex cursor-default gap-4 rounded-2xl border p-4 transition-all duration-500 md:gap-5 md:p-5 ${
                    activeRoadmapStep === i
                      ? "translate-x-1 border-primary/25 bg-white/[0.05] shadow-[0_18px_40px_rgba(139,92,246,0.08)]"
                      : "border-transparent hover:bg-white/[0.02] hover:translate-x-0.5"
                  }`}
                  style={{ transitionDelay: `${i * 50}ms` }}
                >
                  <div className={`pointer-events-none absolute inset-y-4 left-0 w-px rounded-full bg-gradient-to-b transition-all duration-500 ${
                    activeRoadmapStep === i ? "from-primary/0 via-primary/80 to-primary/0 opacity-100" : "from-transparent to-transparent opacity-0"
                  }`} />
                  <div className="flex flex-shrink-0 flex-col items-center">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-black text-white shadow-lg transition-all duration-500 md:h-12 md:w-12 ${
                      activeRoadmapStep === i
                        ? `bg-gradient-to-br ${s.color} scale-[1.05] shadow-[0_0_28px_rgba(96,165,250,0.2)]`
                        : "bg-white/[0.05] text-zinc-400 shadow-none"
                    }`}>
                      {s.num}
                    </div>
                    {i < roadmap.length - 1 && (
                      <div className="relative mt-3 flex min-h-[24px] flex-1 items-start">
                        <div className={`h-full w-[2px] bg-gradient-to-b transition-all duration-500 ${
                          i < activeRoadmapStep
                            ? "from-primary/80 to-primary/10"
                            : activeRoadmapStep === i
                              ? "from-primary/40 to-transparent"
                              : "from-zinc-700 to-transparent"
                        }`} />
                        {activeRoadmapStep === i && (
                          <span className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_16px_rgba(139,92,246,0.9)]" />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="pt-1 pb-3 md:pb-4">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600">Phase {s.num}</p>
                    <h4 className={`mb-2 text-lg font-bold tracking-tight transition-colors md:text-xl ${
                      activeRoadmapStep === i ? "text-primary" : "text-white group-hover:text-primary"
                    }`}>{s.title}</h4>
                    <p className="text-sm leading-relaxed text-zinc-500">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===========================================  */}
      {/*  SOCIAL PROOF                               */}
      {/* ===========================================  */}
      <section className="w-full" ref={proofRef}>
        <div className={`mx-auto max-w-3xl px-5 py-16 text-center transition-all duration-1000 md:px-6 md:py-20 ${proofVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="mb-10">
            <h2 className="font-display text-3xl md:text-5xl font-black text-white tracking-[-0.03em] mb-4">
              Loved By Focused Builders
            </h2>
            <p className="text-zinc-500 text-base md:text-lg leading-relaxed">
              Seven voices. One pattern. Less tab-switching, more real progress.
            </p>
          </div>
        </div>

        <div className={`w-[100vw] relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] overflow-hidden transition-all duration-1000 ${proofVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="group relative overflow-hidden py-4 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
            <div
              className="animate-marquee flex min-w-max items-stretch gap-4 will-change-transform group-hover:[animation-play-state:paused]"
              style={{ animationDuration: "56s" }}
            >
              {[...testimonials, ...testimonials].map((testimonial, index) => (
                <TestimonialCard key={`${testimonial.name}-${index}`} testimonial={testimonial} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===========================================  */}
      {/*  FAQ                                        */}
      {/* ===========================================  */}
      <section className="w-full border-t border-white/[0.04]" ref={faqRef}>
        <div className={`mx-auto w-full max-w-[1400px] px-5 py-16 transition-all duration-1000 md:px-6 md:py-20 ${faqVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <h2 className="font-display text-3xl md:text-5xl font-black text-white tracking-[-0.03em] mb-4">
              Questions? Answered.
            </h2>
            <p className="text-zinc-500 text-base leading-relaxed">
              Everything you need to know before jumping in.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className={`glass-card-strong rounded-2xl border transition-all duration-300 overflow-hidden cursor-pointer ${openFaq === i ? "border-primary/20 shadow-lg shadow-primary/5" : "border-white/[0.04] hover:border-white/[0.08]"}`}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <div className="flex items-center justify-between p-6 md:p-7">
                  <h3 className="text-white font-bold text-sm md:text-base pr-4">{faq.q}</h3>
                  <div className={`w-8 h-8 rounded-full border border-white/10 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${openFaq === i ? "bg-primary border-primary/30 rotate-45" : "bg-white/[0.02]"}`}>
                    <span className="text-white text-lg leading-none">+</span>
                  </div>
                </div>
                <div className={`overflow-hidden transition-all duration-500 ${openFaq === i ? "max-h-60 opacity-100" : "max-h-0 opacity-0"}`}>
                  <p className="px-6 md:px-7 pb-6 md:pb-7 text-zinc-400 text-sm md:text-base leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===========================================  */}
      {/*  FINAL CTA                                  */}
      {/* ===========================================  */}
      <section className="relative w-full overflow-hidden" ref={ctaRef}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(139,92,246,0.14),transparent_28%),linear-gradient(to_top,rgba(139,92,246,0.08),transparent_45%)]" />
        <div className="pointer-events-none absolute left-1/2 top-[18%] h-[420px] w-[82%] max-w-6xl -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.34),rgba(59,130,246,0.16),transparent_70%)] blur-[140px]" />
        <div className="pointer-events-none absolute left-[22%] top-[28%] h-52 w-52 rounded-full bg-fuchsia-500/16 blur-[120px] animate-glow-pulse" />
        <div className="pointer-events-none absolute right-[20%] top-[32%] h-56 w-56 rounded-full bg-cyan-500/14 blur-[130px] animate-glow-pulse" style={{ animationDelay: "1.2s" }} />

        {/* Orbiting elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] h-[240px] pointer-events-none hidden md:block">
          <div className="animate-orbit"><div className="w-2 h-2 rounded-full bg-primary/40" /></div>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] h-[360px] pointer-events-none hidden md:block">
          <div className="animate-orbit" style={{ animationDuration: "30s", animationDirection: "reverse" }}><div className="w-1.5 h-1.5 rounded-full bg-cyan-400/30" /></div>
        </div>

        <div className={`relative z-10 mx-auto w-full max-w-[1400px] px-5 py-10 transition-all duration-1000 md:px-6 md:py-12 ${ctaVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="relative overflow-hidden rounded-[32px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-6 py-9 text-center shadow-[0_40px_120px_rgba(0,0,0,0.28)] backdrop-blur-2xl sm:px-8 sm:py-10 md:px-10 md:py-12">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="pointer-events-none absolute left-1/2 top-[22%] h-[320px] w-[75%] max-w-5xl -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.40),rgba(99,102,241,0.22),rgba(56,189,248,0.10),transparent_72%)] blur-[120px]" />
            <div className="pointer-events-none absolute left-[14%] top-[18%] h-32 w-32 rounded-full bg-violet-500/20 blur-[90px]" />
            <div className="pointer-events-none absolute right-[14%] top-[24%] h-36 w-36 rounded-full bg-cyan-500/16 blur-[100px]" />

            <div className="relative mx-auto max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-300">
                <span className="inline-flex h-2 w-2 rounded-full bg-primary shadow-[0_0_12px_rgba(139,92,246,0.9)]" />
                Built For Relentless Engineers
              </div>

              <h2 className="font-display text-4xl font-black leading-[0.92] tracking-[-0.045em] text-white sm:text-5xl md:text-6xl lg:text-[4.5rem]">
                Ready to become the
                <br />
                <span className="bg-gradient-to-r from-white via-violet-200 to-cyan-200 bg-clip-text text-transparent">
                  engineer you admire?
                </span>
              </h2>

              <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-zinc-400 sm:text-base md:text-lg">
                Stop juggling tutorials, tabs, and half-finished plans. Step into one premium system designed to help you learn faster, practice deeper, and ship with confidence.
              </p>

              <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/learn"
                  className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-gradient-to-r from-white via-violet-50 to-cyan-50 px-10 py-4 text-base font-black text-[#05060d] transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] sm:px-12 sm:py-5 sm:text-lg"
                >
                  <span className="pointer-events-none absolute inset-[-6px] rounded-full bg-gradient-to-r from-primary/45 via-violet-400/35 to-cyan-400/35 blur-xl animate-glow-pulse" />
                  <span className="pointer-events-none absolute inset-0 rounded-full bg-[linear-gradient(110deg,transparent_12%,rgba(255,255,255,0.95)_35%,transparent_58%)] opacity-90 animate-shimmer" />
                  <span className="pointer-events-none absolute inset-[1px] rounded-full border border-black/5" />
                  <span className="relative z-10">Launch Your Journey</span>
                  <span className="relative z-10 transition-transform duration-300 group-hover:translate-x-1">→</span>
                </Link>

                <Link
                  href="/about"
                  className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-7 py-4 text-sm font-bold text-white transition-all duration-300 hover:bg-white/[0.07] hover:border-white/20 sm:text-base"
                >
                  Explore the Story
                </Link>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                <span>No credit card</span>
                <span className="h-1 w-1 rounded-full bg-zinc-700" />
                <span>Instant access</span>
                <span className="h-1 w-1 rounded-full bg-zinc-700" />
                <span>Full platform preview</span>
              </div>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent via-[#05060d]/60 to-[#04050a]" />
      </section>
    </div>
  );
}
