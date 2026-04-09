"use client";

import Link from "next/link";
import { Badge } from "@/components/ui";
import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import {
  Blocks,
  BrainCircuit,
  Code2,
  Cpu,
  Globe,
  Layers3,
  Rocket,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";

/* ============================================ */
/*  DATA                                        */
/* ============================================ */

const techPillars = [
  { icon: Zap, title: "Next.js 15+ App Router", desc: "React Server Components for zero-JS initial payloads. Route groups separate marketing from platform. Dynamic routes with async params.", gradient: "from-amber-500/20 via-orange-500/10 to-transparent", accent: "text-amber-400", iconShell: "from-amber-500/20 to-orange-500/10", iconGlow: "bg-amber-500/20", ring: "hover:shadow-[0_24px_60px_rgba(245,158,11,0.18),0_0_24px_rgba(245,158,11,0.2)] hover:border-amber-500/30" },
  { icon: Sparkles, title: "Tailwind CSS v4 + PostCSS", desc: "Custom design tokens via @theme inline. Glass morphism utility system. 12 custom keyframe animations. Noise texture and grid overlays.", gradient: "from-cyan-500/20 via-blue-500/10 to-transparent", accent: "text-cyan-400", iconShell: "from-cyan-500/20 to-blue-500/10", iconGlow: "bg-cyan-500/20", ring: "hover:shadow-[0_24px_60px_rgba(6,182,212,0.18),0_0_24px_rgba(6,182,212,0.2)] hover:border-cyan-500/30" },
  { icon: Blocks, title: "Feature-Driven Design", desc: "Domain logic lives in src/features/*. Each module owns its components, engines, and providers. Route files stay thin — under 10 lines.", gradient: "from-violet-500/20 via-purple-500/10 to-transparent", accent: "text-violet-400", iconShell: "from-violet-500/20 to-purple-500/10", iconGlow: "bg-violet-500/20", ring: "hover:shadow-[0_24px_60px_rgba(139,92,246,0.18),0_0_24px_rgba(139,92,246,0.2)] hover:border-violet-500/30" },
  { icon: Layers3, title: "Modular Service Layer", desc: "Placeholder services (CompilerService, AIService) designed for drop-in replacement. Interface-first architecture for future backends.", gradient: "from-emerald-500/20 via-green-500/10 to-transparent", accent: "text-emerald-400", iconShell: "from-emerald-500/20 to-green-500/10", iconGlow: "bg-emerald-500/20", ring: "hover:shadow-[0_24px_60px_rgba(16,185,129,0.18),0_0_24px_rgba(16,185,129,0.2)] hover:border-emerald-500/30" },
];

const modules = [
  { name: "Curriculum Hub", desc: "13 tech stacks with search, filters, category sidebar, progress tracking, and deep-link course detail pages", icon: Globe, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  { name: "Code Playground", desc: "Split-pane IDE with language selector, toolbar, editor panel, output/error/input consoles", icon: Code2, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  { name: "DSA Engine", desc: "6 algorithm pattern tracks with progress bars, daily challenges, and circular progress visualization", icon: BrainCircuit, color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
  { name: "Practice Arena", desc: "Filterable question table with difficulty badges, acceptance rates, pagination, and submission history", icon: Target, color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
  { name: "AI Assistant", desc: "Chat interface with suggestion chips, context provider, hint/explain/fix engines, and streaming responses", icon: Cpu, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
  { name: "Interview Prep", desc: "System design cards, company-specific question banks, behavioral cheat sheets, and mock scheduling", icon: Rocket, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  { name: "Projects Vault", desc: "4 guided enterprise projects with tech stack tags, difficulty badges, and hover-reveal CTAs", icon: Blocks, color: "text-fuchsia-400", bg: "bg-fuchsia-500/10", border: "border-fuchsia-500/20" },
  { name: "Dashboard", desc: "Stats grid, activity heatmap, streak counter, global ranking, and personalized recommendations", icon: Layers3, color: "text-teal-400", bg: "bg-teal-500/10", border: "border-teal-500/20" },
];

const painPoints = ["Fragmented disjointed tooling", "Stuck in 'Tutorial Hell'", "Generic cheap UI/UX", "No real project context", "Missing AI inline assistance"];

const personas = [
  { persona: "🎓 CS Undergrads", desc: "Bridging the gap between university theory and production code." },
  { persona: "💼 Career Switchers", desc: "Building an undeniable portfolio of enterprise-grade projects." },
  { persona: "🚀 Junior to Mid", desc: "Looking to level up architectural thinking and system design." },
  { persona: "🎯 Interview Preppers", desc: "Targeting FAANG-level technical rounds with supreme confidence." },
];

/* ============================================ */
/*  ANIMATION VARIANTS                          */
/* ============================================ */

const FADE_UP: Variants = {
  hidden: { opacity: 0, y: 50 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 20, mass: 1 },
  },
};

const STAGGER_CONTAINER: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

const CARD_HOVER: Variants = {
  rest: { y: 0, scale: 1 },
  hover: { y: -8, scale: 1.02, transition: { type: "spring", stiffness: 400, damping: 25 } },
};

/* ============================================ */
/*  COMPONENTS                                  */
/* ============================================ */

function AnimatedCounter({ end, suffix, label }: { end: number; suffix: string; label: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setInView(true);
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const stepTime = 16;
    const step = end / (duration / stepTime);
    
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, stepTime);
    return () => clearInterval(timer);
  }, [inView, end]);

  return (
    <motion.div
      ref={ref}
      variants={FADE_UP}
      whileHover={{ y: -5, boxShadow: "0 25px 50px -12px rgba(139, 92, 246, 0.25)" }}
      className="group relative overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.02] px-6 py-10 text-center shadow-[0_14px_40px_rgba(0,0,0,0.2)] backdrop-blur-2xl transition-all duration-300"
    >
      <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/12 blur-[40px] opacity-70 transition-all duration-500 group-hover:scale-150 group-hover:opacity-100 animate-glow-pulse" />
      
      <div className="relative">
        <div className="text-4xl font-black tracking-tighter text-white tabular-nums md:text-5xl lg:text-6xl">
          {count}
          {suffix && <span className="ml-1 text-2xl font-extrabold text-primary/90 md:text-3xl lg:text-4xl">{suffix}</span>}
        </div>
      </div>
      <div className="mt-3 text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500 transition-colors duration-300 group-hover:text-zinc-300">{label}</div>
    </motion.div>
  );
}

/* ============================================ */
/*  PAGE OVERHAUL                               */
/* ============================================ */

export default function AboutPage() {
  const { scrollYProgress } = useScroll();
  const yParallax = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const opacityFade = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  return (
    <div className="flex flex-col items-center overflow-x-hidden bg-[#020204] relative noise-bg w-full">
      {/* Background Ambience */}
      <div className="fixed inset-0 grid-pattern opacity-30 pointer-events-none z-0" />
      
      {/* ===========================================  */}
      {/*  HERO SECTION (Framer Motion Enhanced)      */}
      {/* ===========================================  */}
      <section className="relative w-full min-h-[90vh] flex flex-col items-center justify-center pt-24 pb-16 px-4 xl:px-8">
        <motion.div style={{ y: yParallax, opacity: opacityFade }} className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center">
          <div className="w-[80vw] h-[80vw] max-w-[1000px] max-h-[1000px] bg-primary/20 blur-[200px] rounded-full opacity-60 animate-glow-pulse" />
          <div className="absolute w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] bg-cyan-600/15 blur-[180px] rounded-full translate-x-1/3 -translate-y-1/4 animate-glow-pulse" style={{ animationDelay: "1s" }} />
          <div className="absolute w-[70vw] h-[70vw] max-w-[900px] max-h-[900px] bg-violet-600/15 blur-[150px] rounded-full -translate-x-1/3 translate-y-1/4 animate-glow-pulse" style={{ animationDelay: "2s" }} />
        </motion.div>

        <motion.div 
          initial="hidden" animate="show" variants={STAGGER_CONTAINER}
          className="relative z-10 mx-auto flex w-full max-w-[1600px] flex-col items-center text-center"
        >
          <motion.div variants={FADE_UP} className="mb-8 flex items-center gap-2.5 rounded-full border border-primary/20 bg-primary/[0.06] px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.25em] text-primary/80 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(139,92,246,0.8)]" />
            Platform Architecture & Case Study
          </motion.div>

          <motion.h1 variants={FADE_UP} className="font-display text-[clamp(3.5rem,10vw,8.5rem)] font-black tracking-[-0.04em] leading-[0.88] text-white w-full max-w-[1400px] mb-8 relative">
            <span className="block drop-shadow-2xl">Engineering</span>
            <span className="block text-gradient bg-gradient-to-r from-primary via-violet-300 to-cyan-400 animate-gradient-x mt-2 pb-2">
              CodeOrbit.
            </span>
          </motion.h1>

          <motion.p variants={FADE_UP} className="mx-auto mb-12 w-full max-w-4xl text-base font-medium leading-[1.8] text-zinc-400 sm:text-lg md:text-2xl">
            A deep technical dive into the product philosophy, system architecture, and UI/UX engineering details behind building a <strong className="text-white">next-generation developer platform.</strong>
          </motion.p>

          <motion.div variants={FADE_UP} className="relative z-20 flex w-full flex-col items-center justify-center gap-4 sm:w-auto sm:flex-row sm:gap-6">
            <Link href="/learn" className="group relative w-full sm:w-auto px-10 py-[20px] rounded-full font-bold text-base text-white transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] text-center overflow-hidden bg-gradient-to-r from-primary via-violet-500 to-blue-500 animate-gradient-x shadow-[0_0_50px_rgba(139,92,246,0.3)] hover:shadow-[0_0_80px_rgba(139,92,246,0.5)]">
              <span className="relative z-10 flex items-center justify-center gap-2">Explore Platform <span className="group-hover:translate-x-1 transition-transform">→</span></span>
            </Link>
            <Link href="/playground" className="w-full sm:w-auto px-10 py-[20px] rounded-full border border-white/10 bg-white/[0.03] text-white font-bold text-base hover:bg-white/[0.08] transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] text-center backdrop-blur-md hover:border-white/25">
              Launch Code Playground
            </Link>
          </motion.div>
        </motion.div>

        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent z-10" />
      </section>

      {/* ===========================================  */}
      {/*  WIDE STATS GRID                             */}
      {/* ===========================================  */}
      <section className="relative w-full z-10 px-4 xl:px-8 py-20 pb-32">
        <motion.div 
          initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} variants={STAGGER_CONTAINER}
          className="mx-auto w-full max-w-[1800px]"
        >
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
            <AnimatedCounter end={8} suffix="" label="Core Feature Modules" />
            <AnimatedCounter end={25} suffix="+" label="Tech Stacks Supported" />
            <AnimatedCounter end={3200} suffix="+" label="DSA & Practice Questions" />
            <AnimatedCounter end={12} suffix="+" label="Custom GSAP/Framer Animations" />
          </div>
        </motion.div>
      </section>

      {/* ===========================================  */}
      {/*  PROBLEM TO USERS (ULTRA WIDE)              */}
      {/* ===========================================  */}
      <section className="relative w-full z-10 px-4 xl:px-8 py-24 bg-gradient-to-b from-transparent to-[#04050a]">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} variants={STAGGER_CONTAINER} className="mx-auto w-full max-w-[1600px]">
          
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Side: The Problem */}
            <motion.div variants={FADE_UP} className="lg:col-span-5 space-y-8">
              <Badge variant="outline" className="px-5 py-2 border-red-500/20 bg-red-500/[0.05] text-red-400 tracking-[0.25em] text-[10px] uppercase font-bold">The Problem Frame</Badge>
              <h2 className="font-display text-4xl md:text-5xl lg:text-7xl font-black text-white tracking-[-0.03em] leading-[1.05]">
                Tutorial Hell <br/>is <span className="text-gradient bg-gradient-to-r from-red-400 to-orange-500">fractured.</span>
              </h2>
              <p className="text-zinc-400 text-lg md:text-xl leading-relaxed">
                Developers bounce between disparate tools: docs, code runners, LeetCode, and YouTube. Progress is lost. Momentum dies. Context switching kills learning velocity.
              </p>
              
              <div className="flex flex-wrap gap-3">
                {painPoints.map(tag => (
                  <span key={tag} className="px-4 py-2 text-xs font-bold text-red-300 bg-red-950/30 border border-red-500/20 rounded-full">{tag}</span>
                ))}
              </div>
            </motion.div>

            {/* Right Side: Target Users Grid */}
            <motion.div variants={FADE_UP} className="lg:col-span-7 grid sm:grid-cols-2 gap-4 md:gap-6">
              {personas.map((u, i) => (
                <motion.div 
                  key={i} variants={CARD_HOVER} initial="rest" whileHover="hover"
                  className="group relative overflow-hidden rounded-[24px] border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-transparent p-8 shadow-2xl backdrop-blur-xl"
                >
                  <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                  <div className="text-3xl mb-4">{u.persona.split(" ")[0]}</div>
                  <h3 className="text-xl font-bold text-white mb-2">{u.persona.replace(/^[^\s]+\s/, "")}</h3>
                  <p className="text-sm font-medium text-zinc-500 leading-relaxed">{u.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>

        </motion.div>
      </section>

      {/* Divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* ===========================================  */}
      {/*  ARCHITECTURE & SYNTAX HIGHLIGHTING         */}
      {/* ===========================================  */}
      <section className="relative w-full z-10 px-4 xl:px-8 py-24 md:py-32 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-primary/[0.03] blur-[250px] rounded-full pointer-events-none" />
        
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} variants={STAGGER_CONTAINER} className="mx-auto w-full max-w-[1600px]">
          
          <motion.div variants={FADE_UP} className="mb-16 text-center max-w-4xl mx-auto">
            <Badge variant="outline" className="px-5 py-2 border-white/10 bg-white/[0.02] text-zinc-400 tracking-[0.25em] text-[10px] uppercase font-bold mb-6">Technical Implementation</Badge>
            <h2 className="font-display text-4xl md:text-6xl lg:text-[5rem] font-black text-white tracking-[-0.03em] leading-[1]">
              Engineered <span className="text-zinc-600">for</span> <br />
              <span className="text-gradient bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400">Scale & Velocity.</span>
            </h2>
          </motion.div>

          <div className="grid xl:grid-cols-12 gap-8 items-start">
            
            {/* Pillars Grid */}
            <motion.div variants={STAGGER_CONTAINER} className="xl:col-span-5 grid sm:grid-cols-2 gap-4">
              {techPillars.map((f, i) => (
                <motion.div
                  key={i} variants={FADE_UP}
                  className={`group relative flex flex-col justify-between overflow-hidden rounded-[28px] border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-2xl transition-all duration-300 ${f.ring}`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
                  <div className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full ${f.iconGlow} opacity-30 blur-[40px] transition-all duration-700 group-hover:scale-150 group-hover:opacity-60`} />
                  
                  <div className="relative z-10">
                    <div className={`mb-6 flex h-[52px] w-[52px] items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br ${f.iconShell} shadow-xl`}>
                      <f.icon className={`h-6 w-6 ${f.accent}`} />
                    </div>
                    <h3 className="text-lg font-bold text-white tracking-tight mb-2">{f.title}</h3>
                    <p className="text-[13px] font-medium text-zinc-500 leading-relaxed group-hover:text-zinc-300 transition-colors">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Code Editor Style Project Structure */}
            <motion.div variants={FADE_UP} className="xl:col-span-7 w-full h-full">
              <div className="relative w-full h-full min-h-[500px] overflow-hidden rounded-[32px] border border-white/[0.08] bg-[#0c0d12] shadow-2xl">
                {/* Mac OS Window Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.05] bg-[#0a0a0f]">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <div className="text-[11px] font-mono tracking-wider text-zinc-500 font-semibold bg-white/[0.03] px-3 py-1 rounded-md border border-white/[0.02]">codeorbit/project-tree</div>
                  <div className="w-10" />
                </div>
                
                {/* Code Body - Syntax Highlighted */}
                <div className="p-6 md:p-8 overflow-x-auto text-[13px] sm:text-[14px] md:text-[15px] font-mono leading-[1.8] tracking-tight">
                  <pre>
                    <span className="text-blue-400 font-bold hover:underline cursor-pointer">src/</span><br />
                    <span className="text-zinc-700">├──</span> <span className="text-blue-400 font-semibold hover:underline cursor-pointer">app/</span>                    <span className="text-emerald-500/80 italic">{"// Next.js 15+ App Router Root"}</span><br />
                    <span className="text-zinc-700">│   ├──</span> <span className="text-blue-400 font-semibold hover:underline cursor-pointer">(marketing)/</span>        <span className="text-emerald-500/80 italic">{"// Public routes (home, about, features)"}</span><br />
                    <span className="text-zinc-700">│   └──</span> <span className="text-blue-400 font-semibold hover:underline cursor-pointer">(platform)/</span>         <span className="text-emerald-500/80 italic">{"// Protected dashboard routes (learn, playground)"}</span><br />
                    <span className="text-zinc-700">├──</span> <span className="text-blue-400 font-semibold hover:underline cursor-pointer">components/</span><br />
                    <span className="text-zinc-700">│   ├──</span> <span className="text-blue-400 font-semibold hover:underline cursor-pointer">layout/</span>             <span className="text-emerald-500/80 italic">{"// Global UI (Navbar, Sidebars, Framer Motion layouts)"}</span><br />
                    <span className="text-zinc-700">│   └──</span> <span className="text-blue-400 font-semibold hover:underline cursor-pointer">ui/</span>                 <span className="text-emerald-500/80 italic">{"// Reusable primitives (Buttons, Cards, Inputs)"}</span><br />
                    <span className="text-zinc-700">├──</span> <span className="text-blue-400 font-semibold hover:underline cursor-pointer">features/</span>               <span className="text-emerald-500/80 italic">{"// Feature-Driven Design domain logic"}</span><br />
                    <span className="text-zinc-700">│   ├──</span> <span className="text-violet-400 font-semibold hover:underline cursor-pointer">learn/</span>              <span className="text-emerald-500/80 italic">{"// Course hub, interactive lessons, curriculum"}</span><br />
                    <span className="text-zinc-700">│   ├──</span> <span className="text-violet-400 font-semibold hover:underline cursor-pointer">playground/</span>         <span className="text-emerald-500/80 italic">{"// Monaco Editor, terminal, multi-engine execution"}</span><br />
                    <span className="text-zinc-700">│   ├──</span> <span className="text-violet-400 font-semibold hover:underline cursor-pointer">ai-assistant/</span>       <span className="text-emerald-500/80 italic">{"// Providers, streaming chunk parsing, chat UI"}</span><br />
                    <span className="text-zinc-700">│   ├──</span> <span className="text-violet-400 font-semibold hover:underline cursor-pointer">dsa/</span>                <span className="text-emerald-500/80 italic">{"// Algorithmic roadmap tracks, stats engines"}</span><br />
                    <span className="text-zinc-700">│   ├──</span> <span className="text-violet-400 font-semibold hover:underline cursor-pointer">practice/</span>           <span className="text-emerald-500/80 italic">{"// Filterable data grids, problem viewports"}</span><br />
                  <span className="text-zinc-700">│   └──</span> <span className="text-violet-400 font-semibold hover:underline cursor-pointer">projects/</span>           <span className="text-emerald-500/80 italic">{"// System design playground, vault grids"}</span><br />
                    <span className="text-zinc-700">├──</span> <span className="text-cyan-400 font-semibold hover:underline cursor-pointer">services/</span>               <span className="text-emerald-500/80 italic">{"// Backend abstraction layer (drop-in API configs)"}</span><br />
                    <span className="text-zinc-700">├──</span> <span className="text-cyan-400 font-semibold hover:underline cursor-pointer">types/</span>                  <span className="text-emerald-500/80 italic">{"// Strict TypeScript platform interfaces"}</span><br />
                    <span className="text-zinc-700">└──</span> <span className="text-cyan-400 font-semibold hover:underline cursor-pointer">utils/</span>                  <span className="text-emerald-500/80 italic">{"// Core helpers, styling variants (clsx/tailwind)"}</span>
                  </pre>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* ===========================================  */}
      {/*  PLATFORM MODULES (ULTRA WIDE GRID)         */}
      {/* ===========================================  */}
      <section className="relative w-full z-10 px-4 xl:px-8 py-24 md:py-32">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} variants={STAGGER_CONTAINER} className="mx-auto w-full max-w-[1600px]">
          
          <motion.div variants={FADE_UP} className="mb-16 text-center max-w-4xl mx-auto">
            <h2 className="font-display text-4xl md:text-6xl lg:text-[5rem] font-black text-white tracking-[-0.03em] leading-[1.05]">
              Massive Surface Area.<br />
              <span className="text-gradient bg-gradient-to-r from-cyan-400 to-primary">Zero technical debt.</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {modules.map((m, i) => (
              <motion.div key={i} variants={FADE_UP} whileHover={{ y: -8 }} className="group relative overflow-hidden rounded-[28px] border border-white/[0.06] bg-white/[0.02] p-7 shadow-2xl backdrop-blur-2xl transition-all duration-300">
                <div className={`absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-${m.color.split('-')[1]}-400/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${m.border} ${m.bg} ${m.color} transition-all duration-500 group-hover:scale-110 shadow-lg`}>
                      <m.icon className="h-6 w-6" />
                    </div>
                    <div className="flex flex-col">
                      <h4 className="font-bold text-white text-base md:text-lg tracking-tight group-hover:text-white/80">{m.name}</h4>
                      <span className={`self-start mt-1 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest ${m.color} ${m.bg} rounded-md border ${m.border}`}>Active</span>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-zinc-400 group-hover:text-zinc-300 transition-colors leading-[1.6]">
                    {m.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ===========================================  */}
      {/*  FINAL CTA (Full screen immersive)          */}
      {/* ===========================================  */}
      <section className="relative w-full z-10 px-4 xl:px-8 py-24 mb-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.05] to-transparent pointer-events-none" />
        
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} variants={STAGGER_CONTAINER} className="relative z-10 mx-auto w-full max-w-[1400px]">
          <div className="relative overflow-hidden rounded-[40px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] px-6 py-16 sm:p-20 md:p-24 text-center shadow-[0_40px_150px_rgba(0,0,0,0.3)] backdrop-blur-3xl">
            {/* Glossy Lines */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            
            {/* Sub-orb */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[1000px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.3),rgba(56,189,248,0.1),transparent_70%)] blur-[100px]" />

            <div className="relative mx-auto max-w-4xl">
              <motion.div variants={FADE_UP} className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/10 bg-black/40 px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-300 backdrop-blur-md">
                <span className="inline-flex h-2 w-2 rounded-full bg-primary shadow-[0_0_12px_rgba(139,92,246,0.9)] animate-pulse" />
                See It In Action
              </motion.div>

              <motion.h2 variants={FADE_UP} className="font-display text-5xl font-black leading-[0.9] tracking-[-0.03em] text-white sm:text-6xl md:text-7xl lg:text-[6rem]">
                Experience the
                <br />
                <span className="bg-gradient-to-r from-primary via-violet-300 to-cyan-300 bg-clip-text text-transparent">
                  live platform
                </span>
              </motion.h2>

              <motion.p variants={FADE_UP} className="mx-auto mt-8 w-full max-w-2xl text-lg md:text-xl leading-8 text-zinc-400 font-medium">
                Every feature, every module, fully interactive. No mocks. Just real code execution and intelligent guidance.
              </motion.p>

              <motion.div variants={FADE_UP} className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/learn"
                  className="group relative inline-flex w-full sm:w-auto items-center justify-center gap-3 overflow-hidden rounded-full bg-white px-10 py-[22px] text-base font-black text-black transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] sm:text-lg shadow-[0_0_40px_rgba(255,255,255,0.2)]"
                >
                  <span className="pointer-events-none absolute inset-[-6px] rounded-full bg-gradient-to-r from-primary/30 via-cyan-400/30 to-primary/30 blur-xl animate-glow-pulse" />
                  <span className="relative z-10 flex items-center justify-center gap-2">Explore Platform <span className="group-hover:translate-x-1 transition-transform">→</span></span>
                </Link>

                <Link
                  href="/playground"
                  className="inline-flex w-full sm:w-auto items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-10 py-[22px] text-base font-bold text-white transition-all duration-300 hover:bg-white/[0.08] hover:border-white/25 sm:text-lg backdrop-blur-md hover:scale-[1.03] active:scale-[0.97]"
                >
                  Fire up the Playground
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
