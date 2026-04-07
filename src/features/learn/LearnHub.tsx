"use client";

import Link from "next/link";
import {
  useDeferredValue,
  useEffect,
  useRef,
  useState,
  startTransition,
  type MouseEvent as ReactMouseEvent,
} from "react";
import {
  motion,
  AnimatePresence,
  useMotionTemplate,
  useMotionValue,
} from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Command,
  Database,
  LayoutGrid,
  Search,
  Server,
  Sparkles,
  X,
} from "lucide-react";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import {
  BracketsCurly,
  ChartLineUp,
  ChartDonut,
  CheckSquareOffset,
  Circuitry,
  CloudArrowUp,
  CodeSimple,
  Database as PhosphorDatabase,
  FileMagnifyingGlass,
  GitBranch,
  Layout,
  Lightning,
  Medal,
  Palette as PhosphorPalette,
  PlugsConnected,
  RocketLaunch,
  ShieldCheck,
  Sparkle,
  FireSimple,
  SealCheck,
  Target,
  Timer,
} from "@phosphor-icons/react";
import { TechCard3D } from "@/components/TechCard3D";
import { getCurriculumTrack, getTrackStatusMeta, resolveCurriculumProgress } from "@/data";
import { technologies } from "@/config/technologies";

import {
  ArcElement,
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip as ChartTooltip,
  Filler,
  Legend as ChartLegend,
  type ScriptableContext,
} from "chart.js";
import { Doughnut, Line } from "react-chartjs-2";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  curriculumProgressUpdatedEvent,
  getCurriculumActivityStreak,
  readSavedTrackProgressMap,
  type StoredTrackProgress,
} from "./curriculum-progress";

gsap.registerPlugin(ScrollTrigger);

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTooltip,
  Filler,
  ChartLegend
);

const TAB_ITEMS = [
  { id: "Overview", Icon: ChartLineUp },
  { id: "Courses", Icon: Layout },
  { id: "Achievements", Icon: Medal },
  { id: "Leaderboard", Icon: Target },
] as const;
type TabKey = (typeof TAB_ITEMS)[number]["id"];

type LeaderboardEntry = {
  rank: number;
  name: string;
  score: number;
  avatar: string;
  color: string;
  streak: number;
  delta: string;
  focus: string;
  badge: string;
};
const LEADERBOARD = [
  {
    rank: 1,
    name: "Alex Chen",
    score: 9850,
    avatar: "AC",
    color: "text-amber-400",
    streak: 29,
    delta: "+180",
    focus: "UI Systems",
    badge: "Orbit Captain",
  },
  {
    rank: 2,
    name: "Sarah Jenkins",
    score: 9420,
    avatar: "SJ",
    color: "text-zinc-300",
    streak: 26,
    delta: "+140",
    focus: "Motion Polish",
    badge: "Layout Sage",
  },
  {
    rank: 3,
    name: "Miguel Rivera",
    score: 9100,
    avatar: "MR",
    color: "text-orange-500",
    streak: 24,
    delta: "+96",
    focus: "API Delivery",
    badge: "Flow Builder",
  },
  {
    rank: 4,
    name: "You",
    score: 8840,
    avatar: "You",
    color: "text-cyan-400",
    streak: 18,
    delta: "+72",
    focus: "Frontend Path",
    badge: "Rising Signal",
  },
  {
    rank: 5,
    name: "Elena Rostova",
    score: 8650,
    avatar: "ER",
    color: "text-white",
    streak: 16,
    delta: "+51",
    focus: "Data Patterns",
    badge: "Signal Runner",
  },
];

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      mode: 'index' as const,
      intersect: false,
      backgroundColor: 'rgba(9, 13, 22, 0.95)',
      titleColor: '#fff',
      bodyColor: '#a1a1aa',
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      padding: 12,
      displayColors: true,
      cornerRadius: 12,
    },
  },
  scales: {
    x: { grid: { color: 'rgba(255, 255, 255, 0)' }, ticks: { color: '#71717a', font: { family: 'inherit' } } },
    y: { grid: { color: 'rgba(255, 255, 255, 0.05)', borderDash: [4, 4] }, border: { dash: [4, 4] }, ticks: { color: '#71717a', font: { family: 'inherit' } } },
  },
  interaction: { mode: 'nearest' as const, axis: 'x' as const, intersect: false },
};

function LeaderboardList({
  entries,
  topScore,
}: {
  entries: LeaderboardEntry[];
  topScore: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const items = containerRef.current.children;
    gsap.fromTo(items, { opacity: 0, x: 50 }, { opacity: 1, x: 0, stagger: 0.08, duration: 0.8, ease: "back.out(1.2)" });
  }, []);

  return (
    <div ref={containerRef} className="space-y-3">
      {entries.map((user) => (
        <div
          key={user.rank}
          className={`rounded-[1.35rem] border p-4 backdrop-blur-3xl transition-all ${
            user.name === "You"
              ? "border-cyan-400/20 bg-cyan-500/[0.06] shadow-[0_18px_40px_rgba(6,182,212,0.12)]"
              : "border-white/5 bg-white/[0.01] hover:bg-white/[0.04]"
          }`}
        >
          <div className="flex items-center gap-4">
            <span className={`w-8 text-center text-xl font-black ${user.color}`}>#{user.rank}</span>
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl border font-bold ${
                user.name === "You"
                  ? "border-cyan-400/30 bg-cyan-500/20 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                  : "border-white/5 bg-black/30 text-zinc-300"
              }`}
            >
              {user.avatar}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className={`truncate font-semibold ${user.name === "You" ? "text-cyan-300" : "text-zinc-200"}`}>
                  {user.name}
                </p>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
                  {user.badge}
                </span>
              </div>
              <p className="mt-1 truncate text-xs text-zinc-400">
                {user.focus} · {user.streak} day streak
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-sm tracking-widest text-white">{user.score} pt</p>
              <p className="mt-1 text-xs font-semibold text-emerald-300">{user.delta} this week</p>
            </div>
          </div>

          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className={`h-full rounded-full ${user.name === "You" ? "bg-gradient-to-r from-cyan-400 to-sky-400" : "bg-gradient-to-r from-white/60 to-white/20"}`}
              initial={{ width: 0 }}
              animate={{ width: `${(user.score / topScore) * 100}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function HeroStatCard({
  Icon,
  label,
  note,
  value,
  glowClass,
}: {
  Icon: PhosphorIcon;
  label: string;
  note: string;
  value: string;
  glowClass: string;
}) {
  return (
    <motion.div
      data-hero-card
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 240, damping: 18 }}
      className="group relative overflow-hidden rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur-xl"
    >
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${glowClass} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div className="relative flex items-center justify-between gap-4">
        <div>
          <p className="text-[1.95rem] font-black tracking-tight text-white">{value}</p>
          <p className="mt-1 text-[15px] font-semibold text-zinc-100">{label}</p>
          <p className="mt-1 text-xs leading-5 text-zinc-400">{note}</p>
        </div>
        <div className="rounded-[1.1rem] border border-white/10 bg-black/20 p-2 text-zinc-200">
          <Icon size={18} weight="duotone" className="text-white" />
        </div>
      </div>
    </motion.div>
  );
}

const categories = ["Frontend", "Backend", "Database"] as const;
type Category = (typeof categories)[number];

const categoryConfig: Record<
  Category,
  {
    Icon: LucideIcon;
    eyebrow: string;
    title: string;
    description: string;
    accent: string;
    pill: string;
    panelGlow: string;
    statLabel: string;
  }
> = {
  Frontend: {
    Icon: LayoutGrid,
    eyebrow: "Frontend Curriculum",
    title: "Frontend, without the clutter.",
    description: "Move from fundamentals to React, Next.js, and modern UI architecture with a path that stays clear from start to finish.",
    accent: "from-fuchsia-500/90 via-violet-300 to-cyan-300",
    pill: "border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-200",
    panelGlow: "from-fuchsia-500/18 via-violet-500/12 to-cyan-400/10",
    statLabel: "Client-side development",
  },
  Backend: {
    Icon: Server,
    eyebrow: "Backend Curriculum",
    title: "Backend, with a cleaner roadmap.",
    description: "Learn APIs, services, auth, and delivery-ready backend patterns without getting lost in too much noise.",
    accent: "from-emerald-400/90 via-cyan-300 to-blue-300",
    pill: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
    panelGlow: "from-emerald-400/16 via-cyan-500/10 to-blue-400/12",
    statLabel: "Server-side architecture",
  },
  Database: {
    Icon: Database,
    eyebrow: "Database Curriculum",
    title: "Data skills, made more practical.",
    description: "Build confidence with queries, schema design, indexing, and real-world data workflows in a simpler progression.",
    accent: "from-sky-400/90 via-indigo-300 to-violet-300",
    pill: "border-sky-400/30 bg-sky-500/10 text-sky-200",
    panelGlow: "from-sky-400/18 via-indigo-500/12 to-violet-400/10",
    statLabel: "Storage and querying",
  },
};

const focusLabels: Record<Category, string[]> = {
  Frontend: [
    "Design systems",
    "Responsive patterns",
    "State orchestration",
    "Animation polish",
    "App architecture",
    "Browser APIs",
  ],
  Backend: [
    "API contracts",
    "Concurrency flows",
    "Deployment habits",
    "Security basics",
    "Observability",
    "Fault tolerance",
  ],
  Database: [
    "Modeling discipline",
    "Index strategy",
    "Caching patterns",
    "Relational queries",
    "Consistency tradeoffs",
    "Realtime sync",
  ],
};

type AchievementBadge = {
  id: string;
  title: string;
  desc: string;
  requirement: string;
  threshold: number;
  Icon: PhosphorIcon;
  gradient: string;
};

const achievementRoadmap: Record<Category, AchievementBadge[]> = {
  Frontend: [
    {
      id: "frontend-markup-foundation",
      title: "Markup Foundation",
      desc: "Lock in semantic HTML and resilient CSS before touching the larger UI stack.",
      requirement: "Reach 8% path progress",
      threshold: 8,
      Icon: BracketsCurly,
      gradient: "from-orange-400/85 via-pink-500/70 to-fuchsia-500/65",
    },
    {
      id: "frontend-interaction-builder",
      title: "Interaction Builder",
      desc: "Ship JavaScript behavior that feels clean, reactive, and intentional.",
      requirement: "Reach 20% path progress",
      threshold: 20,
      Icon: CodeSimple,
      gradient: "from-amber-300/80 via-yellow-400/70 to-orange-500/65",
    },
    {
      id: "frontend-component-crafter",
      title: "Typed Interface",
      desc: "Start writing safer UI logic with clearer types, props, and reusable component contracts.",
      requirement: "Reach 34% path progress",
      threshold: 34,
      Icon: Layout,
      gradient: "from-cyan-400/85 via-sky-400/70 to-blue-500/65",
    },
    {
      id: "frontend-design-system",
      title: "Design System Pulse",
      desc: "Start thinking in tokens, consistency, and scalable visual language.",
      requirement: "Reach 48% path progress",
      threshold: 48,
      Icon: PhosphorPalette,
      gradient: "from-violet-400/85 via-fuchsia-400/70 to-rose-500/65",
    },
    {
      id: "frontend-motion-layer",
      title: "Motion Layer",
      desc: "Add polish with animation choices that support clarity instead of noise.",
      requirement: "Reach 62% path progress",
      threshold: 62,
      Icon: Sparkle,
      gradient: "from-sky-300/80 via-cyan-400/70 to-indigo-500/65",
    },
    {
      id: "frontend-app-architecture",
      title: "App Architecture",
      desc: "Organize layouts, routes, and state so the product scales without chaos.",
      requirement: "Reach 78% path progress",
      threshold: 78,
      Icon: ChartDonut,
      gradient: "from-indigo-400/85 via-violet-400/70 to-fuchsia-500/65",
    },
    {
      id: "frontend-orbit-ready",
      title: "Frontend Orbit Ready",
      desc: "Finish the path with production-grade UI instincts and shippable confidence.",
      requirement: "Reach 92% path progress",
      threshold: 92,
      Icon: ShieldCheck,
      gradient: "from-cyan-300/80 via-violet-400/70 to-fuchsia-500/70",
    },
  ],
  Backend: [
    {
      id: "backend-runtime-ready",
      title: "Runtime Ready",
      desc: "Get comfortable with the server environment and how requests move through it.",
      requirement: "Reach 8% path progress",
      threshold: 8,
      Icon: Layout,
      gradient: "from-emerald-300/85 via-green-400/70 to-teal-500/65",
    },
    {
      id: "backend-api-wiring",
      title: "API Wiring",
      desc: "Design endpoints that are predictable, testable, and easy to evolve.",
      requirement: "Reach 20% path progress",
      threshold: 20,
      Icon: PlugsConnected,
      gradient: "from-cyan-400/80 via-sky-400/70 to-blue-500/65",
    },
    {
      id: "backend-contract-discipline",
      title: "Contract Discipline",
      desc: "Lock in input validation, response shape, and healthier API habits.",
      requirement: "Reach 34% path progress",
      threshold: 34,
      Icon: CheckSquareOffset,
      gradient: "from-blue-400/85 via-cyan-400/70 to-emerald-500/65",
    },
    {
      id: "backend-service-flow",
      title: "Service Flow",
      desc: "Break logic into services, workflows, and maintainable internal boundaries.",
      requirement: "Reach 48% path progress",
      threshold: 48,
      Icon: GitBranch,
      gradient: "from-teal-300/80 via-emerald-400/70 to-cyan-500/65",
    },
    {
      id: "backend-auth-gate",
      title: "Auth Gate",
      desc: "Ship access control and security rules that protect the system by default.",
      requirement: "Reach 62% path progress",
      threshold: 62,
      Icon: ShieldCheck,
      gradient: "from-lime-300/75 via-emerald-400/65 to-green-500/60",
    },
    {
      id: "backend-package-delivery",
      title: "Package Delivery",
      desc: "Prepare the codebase for cleaner releases, packaging, and service ownership.",
      requirement: "Reach 78% path progress",
      threshold: 78,
      Icon: CloudArrowUp,
      gradient: "from-sky-300/80 via-blue-400/70 to-indigo-500/65",
    },
    {
      id: "backend-launch-sequence",
      title: "Backend Launch Sequence",
      desc: "Deploy with calm confidence and production-aware backend instincts.",
      requirement: "Reach 92% path progress",
      threshold: 92,
      Icon: RocketLaunch,
      gradient: "from-emerald-300/80 via-cyan-400/70 to-blue-500/70",
    },
  ],
  Database: [
    {
      id: "database-query-fluent",
      title: "Query Fluent",
      desc: "Learn to ask the database better questions with confidence and precision.",
      requirement: "Reach 8% path progress",
      threshold: 8,
      Icon: FileMagnifyingGlass,
      gradient: "from-sky-300/80 via-blue-400/70 to-indigo-500/65",
    },
    {
      id: "database-schema-frame",
      title: "Schema Frame",
      desc: "Structure tables and collections so your data model stays understandable.",
      requirement: "Reach 20% path progress",
      threshold: 20,
      Icon: PhosphorDatabase,
      gradient: "from-cyan-400/80 via-sky-400/70 to-blue-500/65",
    },
    {
      id: "database-index-logic",
      title: "Index Logic",
      desc: "Use indexing intentionally instead of guessing why a query feels slow.",
      requirement: "Reach 34% path progress",
      threshold: 34,
      Icon: Circuitry,
      gradient: "from-indigo-400/85 via-violet-400/70 to-sky-500/65",
    },
    {
      id: "database-cache-layer",
      title: "Cache Layer",
      desc: "Start treating data access as a system that can be accelerated thoughtfully.",
      requirement: "Reach 48% path progress",
      threshold: 48,
      Icon: Lightning,
      gradient: "from-amber-300/75 via-orange-400/65 to-red-500/60",
    },
    {
      id: "database-data-contract",
      title: "Data Contract",
      desc: "Create safer migrations and stronger guarantees around what the app expects.",
      requirement: "Reach 62% path progress",
      threshold: 62,
      Icon: CheckSquareOffset,
      gradient: "from-blue-300/80 via-indigo-400/70 to-violet-500/65",
    },
    {
      id: "database-pipeline-flow",
      title: "Pipeline Flow",
      desc: "Connect reads, writes, sync jobs, and reporting into a reliable workflow.",
      requirement: "Reach 78% path progress",
      threshold: 78,
      Icon: GitBranch,
      gradient: "from-sky-300/80 via-cyan-400/70 to-emerald-500/65",
    },
    {
      id: "database-orbit-core",
      title: "Storage Orbit Core",
      desc: "Finish the path with sharper query instincts and real-world data confidence.",
      requirement: "Reach 92% path progress",
      threshold: 92,
      Icon: Medal,
      gradient: "from-violet-300/80 via-indigo-400/70 to-sky-500/70",
    },
  ],
};

const paletteByCategory: Record<
  Category,
  Array<{
    border: string;
    glow: string;
    ring: string;
    chip: string;
  }>
> = {
  Frontend: [
    {
      border: "border-fuchsia-400/25",
      glow: "from-fuchsia-500/20 via-violet-500/10 to-transparent",
      ring: "#d946ef",
      chip: "bg-fuchsia-500/12 text-fuchsia-100 border-fuchsia-400/25",
    },
    {
      border: "border-cyan-400/25",
      glow: "from-cyan-400/18 via-sky-500/10 to-transparent",
      ring: "#22d3ee",
      chip: "bg-cyan-500/12 text-cyan-100 border-cyan-400/25",
    },
    {
      border: "border-violet-400/25",
      glow: "from-violet-500/20 via-purple-500/10 to-transparent",
      ring: "#8b5cf6",
      chip: "bg-violet-500/12 text-violet-100 border-violet-400/25",
    },
  ],
  Backend: [
    {
      border: "border-emerald-400/25",
      glow: "from-emerald-400/18 via-cyan-500/8 to-transparent",
      ring: "#34d399",
      chip: "bg-emerald-500/12 text-emerald-100 border-emerald-400/25",
    },
    {
      border: "border-sky-400/25",
      glow: "from-sky-400/18 via-blue-500/10 to-transparent",
      ring: "#38bdf8",
      chip: "bg-sky-500/12 text-sky-100 border-sky-400/25",
    },
    {
      border: "border-teal-400/25",
      glow: "from-teal-400/18 via-emerald-500/10 to-transparent",
      ring: "#2dd4bf",
      chip: "bg-teal-500/12 text-teal-100 border-teal-400/25",
    },
  ],
  Database: [
    {
      border: "border-sky-400/25",
      glow: "from-sky-400/18 via-indigo-500/10 to-transparent",
      ring: "#60a5fa",
      chip: "bg-sky-500/12 text-sky-100 border-sky-400/25",
    },
    {
      border: "border-indigo-400/25",
      glow: "from-indigo-400/20 via-violet-500/10 to-transparent",
      ring: "#818cf8",
      chip: "bg-indigo-500/12 text-indigo-100 border-indigo-400/25",
    },
    {
      border: "border-violet-400/25",
      glow: "from-violet-400/20 via-sky-500/10 to-transparent",
      ring: "#a78bfa",
      chip: "bg-violet-500/12 text-violet-100 border-violet-400/25",
    },
  ],
};

type CourseProfile = {
  ctaLabel: string;
  completedLessons: number;
  currentLesson: string;
  durationLabel: string;
  estimatedHours: number;
  level: string;
  progress: number;
  lessons: number;
  focus: string;
  orbit: string;
  ring: string;
  sprintLabel: string;
  statusLabel: string;
  statusTone: string;
};

function getCourseProfile(
  category: Category,
  techId: string,
  index: number,
  savedProgress?: StoredTrackProgress,
): CourseProfile {
  const palette = paletteByCategory[category][index % paletteByCategory[category].length];
  const track = getCurriculumTrack(techId);
  const progressState = resolveCurriculumProgress(track, savedProgress);
  const resolvedStatus =
    progressState.progressPercent >= 100
      ? "completed"
      : progressState.progressPercent > 0
        ? "in-progress"
        : "planned";
  const statusMeta = getTrackStatusMeta(resolvedStatus);
  const currentLesson = track.lessons[progressState.activeIndex]?.title ?? track.lessons[0]?.title ?? "Curriculum lesson";

  return {
    ctaLabel:
      progressState.progressPercent >= 100
        ? "Review track"
        : progressState.progressPercent > 0
          ? "Resume track"
          : "Start track",
    completedLessons: progressState.completedCount,
    currentLesson,
    durationLabel: track.durationLabel,
    estimatedHours: track.estimatedHours,
    level: track.level,
    progress: progressState.progressPercent,
    lessons: track.lessonCount,
    focus: track.currentFocus,
    orbit: track.orbitLabel,
    ring: palette.ring,
    sprintLabel: track.sprintLabel,
    statusLabel: statusMeta.label,
    statusTone: statusMeta.tone,
  };
}

export function LearnHub() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = useState<Category>("Frontend");
  const [activeTab, setActiveTab] = useState<TabKey>("Overview");
  const [activeAchievementId, setActiveAchievementId] = useState<string | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [isHeroSearchActive, setIsHeroSearchActive] = useState(false);
  const heroGlowX = useMotionValue(78);
  const heroGlowY = useMotionValue(24);
  const heroGlow = useMotionTemplate`radial-gradient(220px circle at ${heroGlowX}% ${heroGlowY}%, rgba(56,189,248,0.07), transparent 54%)`;

  useEffect(() => {
    if (activeTab === "Overview" && chartContainerRef.current) {
      gsap.fromTo(chartContainerRef.current, { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.8, ease: "back.out(1.5)", delay: 0.1 });
    }
  }, [activeTab]);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [savedTrackProgress, setSavedTrackProgress] = useState<Record<string, StoredTrackProgress>>({});
  const searchInputRef = useRef<HTMLInputElement>(null);
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const activeCategoryData = categoryConfig[activeCategory];
  const curriculumTechnologies = technologies.filter((tech) => categories.includes(tech.category as Category));
  const activeTechnologies = curriculumTechnologies.filter((tech) => tech.category === activeCategory);
  const visibleTechnologies = activeTechnologies.filter((tech) => {
    if (!deferredQuery) {
      return true;
    }

    return tech.name.toLowerCase().includes(deferredQuery) || tech.desc.toLowerCase().includes(deferredQuery);
  });

  const commandResults = curriculumTechnologies
    .filter((tech) => {
      if (!deferredQuery) {
        return false;
      }

      return (
        tech.name.toLowerCase().includes(deferredQuery) ||
        tech.category.toLowerCase().includes(deferredQuery) ||
        tech.desc.toLowerCase().includes(deferredQuery)
      );
    })
    .sort((left, right) => {
      const getSearchRank = (value: (typeof curriculumTechnologies)[number]) => {
        const name = value.name.toLowerCase();
        const category = value.category.toLowerCase();
        const description = value.desc.toLowerCase();

        if (name === deferredQuery) return 0;
        if (name.startsWith(deferredQuery)) return 1;
        if (name.includes(deferredQuery)) return 2;
        if (category.startsWith(deferredQuery)) return 3;
        if (category.includes(deferredQuery)) return 4;
        if (description.includes(deferredQuery)) return 5;
        return 6;
      };

      return getSearchRank(left) - getSearchRank(right) || left.name.localeCompare(right.name);
    });
  const heroSuggestions = commandResults.slice(0, 6);
  const showHeroSuggestions = isHeroSearchActive && deferredQuery.length > 0;
  const activeCourseProfiles = activeTechnologies.map((tech, index) => ({
    tech,
    profile: getCourseProfile(activeCategory, tech.id, index, savedTrackProgress[tech.id]),
  }));
  const averageProgress = Math.round(
    activeCourseProfiles.reduce((sum, { profile }) => sum + profile.progress, 0) /
      Math.max(activeCourseProfiles.length, 1),
  );
  const totalEstimatedHours = activeCourseProfiles.reduce(
    (sum, { profile }) => sum + profile.estimatedHours,
    0,
  );
  const totalLessons = activeCourseProfiles.reduce((sum, { profile }) => sum + profile.lessons, 0);
  const totalCompletedLessons = activeCourseProfiles.reduce(
    (sum, { profile }) => sum + profile.completedLessons,
    0,
  );
  const completedTracks = activeCourseProfiles.filter(({ profile }) => profile.progress >= 100).length;
  const completedLearningHours = Math.round(
    activeCourseProfiles.reduce(
      (sum, { profile }) => sum + (profile.estimatedHours * profile.progress) / 100,
      0,
    ),
  );
  const dayStreak = getCurriculumActivityStreak(savedTrackProgress);
  const featuredNames = activeTechnologies.slice(0, 4).map((tech) => tech.name);
  const focusHighlights = focusLabels[activeCategory].slice(0, 4);
  const activeBadges = achievementRoadmap[activeCategory];
  const unlockedBadgeCount = activeBadges.filter((badge) => averageProgress >= badge.threshold).length;
  const nextBadge = activeBadges.find((badge) => averageProgress < badge.threshold) ?? null;
  const nextBadgeCount = nextBadge ? 1 : 0;
  const lockedBadgeCount = Math.max(activeBadges.length - unlockedBadgeCount - nextBadgeCount, 0);
  const activeAchievement =
    activeBadges.find((badge) => badge.id === activeAchievementId) ??
    nextBadge ??
    activeBadges[Math.max(unlockedBadgeCount - 1, 0)] ??
    activeBadges[0];
  const activeAchievementIndex = activeBadges.findIndex((badge) => badge.id === activeAchievement?.id);
  const activeAchievementProgress = activeAchievement
    ? Math.min(Math.round((averageProgress / activeAchievement.threshold) * 100), 100)
    : 0;
  const timelineProgress = Math.min(Math.max(averageProgress, 0), 100);
  const finalBadgeThreshold = activeBadges[activeBadges.length - 1]?.threshold ?? 100;
  const achievementChartPalette = {
    Frontend: ["rgba(232,121,249,0.9)", "rgba(34,211,238,0.95)", "rgba(255,255,255,0.10)"],
    Backend: ["rgba(52,211,153,0.9)", "rgba(56,189,248,0.95)", "rgba(255,255,255,0.10)"],
    Database: ["rgba(96,165,250,0.9)", "rgba(167,139,250,0.95)", "rgba(255,255,255,0.10)"],
  }[activeCategory];
  const achievementChartData = {
    labels: ["Unlocked", "Next unlock", "Locked"],
    datasets: [
      {
        data: [unlockedBadgeCount, nextBadgeCount, lockedBadgeCount],
        backgroundColor: achievementChartPalette,
        borderColor: "rgba(9, 13, 22, 0.92)",
        borderWidth: 4,
        hoverOffset: 6,
        spacing: 2,
      },
    ],
  };
  const achievementChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "74%",
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(9, 13, 22, 0.96)",
        titleColor: "#fff",
        bodyColor: "#d4d4d8",
        borderColor: "rgba(255,255,255,0.08)",
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        cornerRadius: 12,
      },
    },
  };
  const achievementSegments = [
    {
      label: "Unlocked",
      value: unlockedBadgeCount,
      tone: achievementChartPalette[0],
      note: "Milestones already earned in this path",
    },
    {
      label: "Next unlock",
      value: nextBadgeCount,
      tone: achievementChartPalette[1],
      note: nextBadge ? `${nextBadge.title} is the current target` : "Every reward is already unlocked",
    },
    {
      label: "Locked",
      value: lockedBadgeCount,
      tone: achievementChartPalette[2],
      note: "Milestones still waiting ahead",
    },
  ];
  const userScore = Math.round(
    5400 +
      averageProgress * 28 +
      totalCompletedLessons * 22 +
      completedTracks * 180 +
      unlockedBadgeCount * 140 +
      dayStreak * 35,
  );
  const leaderboardEntries = LEADERBOARD.map((user) =>
    user.name === "You"
      ? {
          ...user,
          score: userScore,
          streak: Math.max(dayStreak, Object.keys(savedTrackProgress).length > 0 ? 1 : 0),
          delta: `+${Math.max(18, Math.round((averageProgress + totalCompletedLessons) / 2.4))}`,
          focus: nextBadge ? `Chasing ${nextBadge.title}` : `${activeCategory} path completed`,
          badge:
            averageProgress >= 90
              ? "Orbit Captain"
              : averageProgress >= 75
                ? "Path Dominator"
                : averageProgress >= 55
                  ? "Rising Signal"
                  : "Path Climber",
        }
      : user,
  )
    .sort((left, right) => right.score - left.score)
    .map((user, index) => ({
      ...user,
      rank: index + 1,
      color:
        user.name === "You"
          ? "text-cyan-400"
          : index === 0
            ? "text-amber-400"
            : index === 1
              ? "text-zinc-300"
              : index === 2
              ? "text-orange-500"
                : "text-white",
    }));
  const fallbackLeaderboardUser: LeaderboardEntry = {
    rank: 1,
    name: "You",
    score: 0,
    avatar: "You",
    color: "text-cyan-400",
    streak: 0,
    delta: "+0",
    focus: `${activeCategory} path starting point`,
    badge: "Starter",
  };
  const leaderboardTopScore = leaderboardEntries[0]?.score ?? 0;
  const leaderboardCurrentUser =
    leaderboardEntries.find((user) => user.name === "You") ?? leaderboardEntries[0] ?? fallbackLeaderboardUser;
  const podiumCutoffScore = leaderboardEntries[2]?.score ?? leaderboardTopScore;
  const leaderboardGapToPodium = Math.max(podiumCutoffScore - leaderboardCurrentUser.score, 0);
  const leaderboardAverageScore = Math.round(
    leaderboardEntries.reduce((sum, user) => sum + user.score, 0) /
      Math.max(leaderboardEntries.length, 1),
  );
  const leaderboardPodium = [leaderboardEntries[1], leaderboardEntries[0], leaderboardEntries[2]].filter(
    Boolean,
  ) as LeaderboardEntry[];
  const leaderboardProgressToTop = Math.round(
    (leaderboardCurrentUser.score / Math.max(leaderboardTopScore, 1)) * 100,
  );
  const leaderboardBeatCount = Math.max(leaderboardEntries.length - leaderboardCurrentUser.rank, 0);
  const leaderboardNextTarget = leaderboardEntries.find(
    (user) => user.rank === Math.max(leaderboardCurrentUser.rank - 1, 1) && user.name !== leaderboardCurrentUser.name,
  );
  const leaderboardTargetName = leaderboardNextTarget?.name ?? leaderboardPodium[2]?.name ?? "the podium";
  const overviewChartAccent = {
    Frontend: "#22d3ee",
    Backend: "#34d399",
    Database: "#60a5fa",
  }[activeCategory];
  const overviewChartData = {
    labels: activeCourseProfiles.map(({ tech }) =>
      tech.name.length > 9 ? `${tech.name.slice(0, 8)}.` : tech.name,
    ),
    datasets: [
      {
        label: "Track progress",
        data: activeCourseProfiles.map(({ profile }) => profile.progress),
        borderColor: overviewChartAccent,
        backgroundColor: (context: ScriptableContext<"line">) => {
          if (!context.chart.chartArea) return;

          const {
            ctx,
            chartArea: { top, bottom },
          } = context.chart;
          const gradient = ctx.createLinearGradient(0, top, 0, bottom);

          if (activeCategory === "Frontend") {
            gradient.addColorStop(0, "rgba(34, 211, 238, 0.28)");
          } else if (activeCategory === "Backend") {
            gradient.addColorStop(0, "rgba(52, 211, 153, 0.28)");
          } else {
            gradient.addColorStop(0, "rgba(96, 165, 250, 0.28)");
          }

          gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
          return gradient;
        },
        borderWidth: 3,
        pointBackgroundColor: "#060912",
        pointBorderColor: overviewChartAccent,
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.4,
      },
    ],
  };
  const tabMeta: Record<
    TabKey,
    {
      label: string;
      detail: string;
      metric: string;
    }
  > = {
    Overview: {
      label: "Path pulse",
      detail: `${averageProgress}% average progress across ${activeTechnologies.length} active tracks`,
      metric: `${totalCompletedLessons}/${totalLessons} lessons completed`,
    },
    Courses: {
      label: "Course library",
      detail: `${visibleTechnologies.length} focused course${visibleTechnologies.length === 1 ? "" : "s"} ready in this path`,
      metric: `${completedLearningHours}/${totalEstimatedHours}h live`,
    },
    Achievements: {
      label: "Milestones",
      detail: `${unlockedBadgeCount}/${activeBadges.length} path rewards unlocked for this track`,
      metric: nextBadge ? `Next at ${nextBadge.threshold}%` : "All unlocked",
    },
    Leaderboard: {
      label: "Orbit board",
      detail: `You are holding rank #${leaderboardCurrentUser.rank} inside this curated learning orbit`,
      metric: `${leaderboardEntries.length} ranked learners`,
    },
  };
  const activeTabMeta = tabMeta[activeTab];
  const activeTabItem = TAB_ITEMS.find((item) => item.id === activeTab) ?? TAB_ITEMS[0];
  const heroStats = [
    {
      Icon: FireSimple,
      label: "Day streak",
      note: dayStreak > 0 ? "Tracked from live lesson activity" : "Start a lesson to begin your streak",
      value: String(dayStreak),
      glowClass: "from-orange-400/18 via-orange-500/10 to-transparent",
    },
    {
      Icon: SealCheck,
      label: "Completed nodes",
      note: `${totalCompletedLessons}/${totalLessons} lessons completed`,
      value: `${completedTracks}/${activeTechnologies.length}`,
      glowClass: "from-emerald-400/18 via-emerald-500/10 to-transparent",
    },
    {
      Icon: Timer,
      label: "Learning hours",
      note: `of ${totalEstimatedHours}h mapped across this path`,
      value: `${completedLearningHours}h`,
      glowClass: "from-cyan-400/18 via-sky-500/10 to-transparent",
    },
    {
      Icon: Target,
      label: "Orbit rank",
      note: `${leaderboardCurrentUser.score.toLocaleString()} live points in this orbit`,
      value: `#${leaderboardCurrentUser.rank}`,
      glowClass: "from-fuchsia-400/18 via-violet-500/10 to-transparent",
    },
  ] satisfies Array<{
    Icon: PhosphorIcon;
    label: string;
    note: string;
    value: string;
    glowClass: string;
  }>;

  const handleHeroPointerMove = (event: ReactMouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    heroGlowX.set(((event.clientX - rect.left) / rect.width) * 100);
    heroGlowY.set(((event.clientY - rect.top) / rect.height) * 100);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsPaletteOpen((open) => !open);
      }

      if (event.key === "Escape") {
        setIsPaletteOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!rootRef.current) {
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-hero-reveal]",
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.85,
          stagger: 0.08,
          ease: "power3.out",
        },
      );

      gsap.fromTo(
        "[data-hero-card]",
        { opacity: 0, y: 22 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.08,
          ease: "power3.out",
          delay: 0.18,
        },
      );

      gsap.utils.toArray<HTMLElement>("[data-learn-panel]").forEach((panel) => {
        gsap.fromTo(
          panel,
          { opacity: 0, y: 28 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: {
              trigger: panel,
              start: "top 82%",
              once: true,
            },
          },
        );
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const syncSavedTrackProgress = () => {
      setSavedTrackProgress(readSavedTrackProgressMap(technologies.map((tech) => tech.id)));
    };

    syncSavedTrackProgress();
    window.addEventListener("focus", syncSavedTrackProgress);
    window.addEventListener("storage", syncSavedTrackProgress);
    window.addEventListener(curriculumProgressUpdatedEvent, syncSavedTrackProgress as EventListener);

    return () => {
      window.removeEventListener("focus", syncSavedTrackProgress);
      window.removeEventListener("storage", syncSavedTrackProgress);
      window.removeEventListener(curriculumProgressUpdatedEvent, syncSavedTrackProgress as EventListener);
    };
  }, []);

  useEffect(() => {
    if (isPaletteOpen) {
      searchInputRef.current?.focus();
    }
  }, [isPaletteOpen]);

  useEffect(() => {
    if (!activeBadges.some((badge) => badge.id === activeAchievementId)) {
      setActiveAchievementId(nextBadge?.id ?? activeBadges[0]?.id ?? null);
    }
  }, [activeAchievementId, activeBadges, nextBadge]);

  return (
    <>
      <div
        ref={rootRef}
        className="mx-auto max-w-[1380px] space-y-5 px-4 py-4 sm:px-6 lg:px-8"
      >
        <section
          className="relative overflow-hidden rounded-[1.8rem] border border-white/10 bg-[#09090b]/90 p-4 shadow-[0_36px_120px_rgba(0,0,0,0.42)] backdrop-blur-2xl sm:p-6"
          onMouseLeave={() => {
            heroGlowX.set(78);
            heroGlowY.set(24);
          }}
          onMouseMove={handleHeroPointerMove}
        >
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-90"
            style={{ background: heroGlow }}
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_42%),radial-gradient(circle_at_top_left,rgba(255,255,255,0.05),transparent_28%)]" />
          <div className={`pointer-events-none absolute -left-16 top-0 h-44 w-44 rounded-full bg-gradient-to-br ${activeCategoryData.panelGlow} blur-3xl`} />
          <div className="pointer-events-none absolute bottom-0 right-0 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

          <div className="relative space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-[43.5rem] space-y-3">
                <div
                  data-hero-reveal
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-100"
                >
                  <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
                  {activeCategoryData.eyebrow}
                </div>

                <div className="space-y-2">
                  <h1
                    data-hero-reveal
                    className="font-display text-[clamp(1.8rem,2.9vw,2.85rem)] font-black leading-[0.93] tracking-[-0.045em] text-white"
                  >
                    <motion.span
                      className={`inline-block bg-gradient-to-r ${activeCategoryData.accent} bg-[length:200%_200%] bg-clip-text text-transparent`}
                      animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                      transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    >
                      Turn Data into Mastery
                    </motion.span>
                  </h1>
                  <p
                    data-hero-reveal
                    className="max-w-[40rem] text-[14px] leading-6 text-zinc-200/90 sm:text-[15px]"
                  >
                    {activeCategoryData.description}
                  </p>
                </div>

                <div data-hero-reveal className="flex flex-wrap items-center gap-1.5">
                  {featuredNames.map((name) => (
                    <span
                      key={name}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[12px] font-medium text-zinc-100"
                    >
                      {name}
                    </span>
                  ))}
                  <div className="relative w-[202px] shrink-0 space-y-1.5">
                    <label className="flex h-9 w-full items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 backdrop-blur-xl transition-colors focus-within:border-white/20">
                      <Search className="h-3 w-3 text-zinc-500" />
                      <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        onFocus={() => setIsHeroSearchActive(true)}
                        onBlur={() => {
                          window.setTimeout(() => setIsHeroSearchActive(false), 120);
                        }}
                        spellCheck={false}
                        suppressHydrationWarning
                        placeholder="Search tracks..."
                        className="min-w-0 flex-1 bg-transparent text-[12px] text-white outline-none placeholder:text-[11px] placeholder:text-zinc-400"
                      />
                      <button
                        type="button"
                        onClick={() => setIsPaletteOpen(true)}
                        className="inline-flex shrink-0 items-center gap-0.5 rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-1 text-[8px] font-semibold text-zinc-400 transition-colors hover:text-white"
                      >
                        <Command className="h-3 w-3" />
                        K
                      </button>
                    </label>

                    {showHeroSuggestions ? (
                      <div className="w-full overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#090d16]/96 shadow-[0_28px_70px_rgba(0,0,0,0.48)] backdrop-blur-2xl">
                        {heroSuggestions.length > 0 ? (
                          <div className="p-2">
                            {heroSuggestions.map((tech) => (
                              <Link
                                href={`/learn/${tech.id}`}
                                key={tech.id}
                                onClick={() => {
                                  startTransition(() => {
                                    setActiveCategory(tech.category as Category);
                                    setActiveTab("Courses");
                                  });
                                  setIsHeroSearchActive(false);
                                  setIsPaletteOpen(false);
                                }}
                                className="flex items-center gap-3 rounded-[1rem] px-3 py-2.5 transition-colors hover:bg-white/[0.05]"
                              >
                                <div className={`flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 ${tech.bg} text-base`}>
                                  <i className={`${tech.icon} ${tech.color}`} aria-hidden="true" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold text-white">{tech.name}</p>
                                  <p className="truncate text-xs text-zinc-400">{tech.category}</p>
                                </div>
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <div className="px-4 py-4">
                            <p className="text-sm font-semibold text-white">No matching tracks found.</p>
                            <p className="mt-1 text-xs leading-5 text-zinc-400">
                              Try searching by technology name, path, or keyword.
                            </p>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="relative z-20 w-full max-w-xl space-y-2.5 lg:max-w-[390px]">
                <div
                  data-hero-reveal
                  className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-3 backdrop-blur-xl"
                >
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                    Career Path
                  </p>
                  <div className="mt-2.5 grid grid-cols-3 gap-2">
                    {categories.map((category) => {
                      const categoryInfo = categoryConfig[category];
                      const isActive = activeCategory === category;

                      return (
                        <button
                          key={category}
                          type="button"
                          onClick={() => {
                            startTransition(() => setActiveCategory(category));
                            setQuery("");
                          }}
                          className={`flex items-center justify-center gap-2 rounded-[0.95rem] border px-3 py-2 text-[13px] font-semibold transition-colors ${
                            isActive
                              ? "border-white/20 bg-white/[0.10] text-white shadow-[0_10px_30px_rgba(255,255,255,0.04)]"
                              : "border-white/10 bg-black/20 text-zinc-300 hover:border-white/15 hover:bg-white/[0.05] hover:text-zinc-100"
                          }`}
                        >
                          <categoryInfo.Icon className="h-4 w-4" />
                          <span>{category}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div
                  data-hero-reveal
                  className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-3.5 backdrop-blur-xl"
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                    Path snapshot
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {focusHighlights.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1.5 text-[12px] text-zinc-200"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-[14px] leading-6 text-zinc-300">
                    {totalLessons} lessons mapped, {totalEstimatedHours}h of content, and{" "}
                    <span className="font-semibold text-white">{averageProgress}%</span> average progress in
                    this path.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-2.5 md:grid-cols-2 lg:grid-cols-4">
              {heroStats.map((stat) => (
                <HeroStatCard key={stat.label} {...stat} />
              ))}
            </div>
          </div>
        </section>

        {/* Interactive Tabs System */}
        <section data-learn-panel className="pt-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="inline-flex w-fit items-center gap-1.5 overflow-x-auto rounded-full border border-white/10 bg-white/[0.03] p-1.5 backdrop-blur-xl no-scrollbar">
              {TAB_ITEMS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <motion.button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    whileTap={{ scale: 0.98 }}
                    className={`group relative flex items-center gap-2 overflow-hidden whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-semibold transition-all duration-300 ${
                      isActive ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <motion.span
                      aria-hidden="true"
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-white/[0.12] to-white/[0.04]"
                      animate={{
                        opacity: isActive ? 1 : 0,
                        scale: isActive ? 1 : 0.92,
                      }}
                      transition={{ type: "spring", stiffness: 320, damping: 24 }}
                    />
                    <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <span className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-xl" />
                    </span>
                    <tab.Icon
                      size={16}
                      weight={isActive ? "duotone" : "regular"}
                      className="relative z-10"
                    />
                    <span className="relative z-10">{tab.id}</span>
                  </motion.button>
                );
              })}
            </div>

            <div className="flex min-h-[64px] items-center justify-between gap-3 rounded-[1.2rem] border border-white/10 bg-white/[0.03] px-3.5 py-2.5 backdrop-blur-xl lg:min-w-[330px]">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                  {activeTabMeta.label}
                </p>
                <div className="mt-1 flex items-start gap-2">
                  <activeTabItem.Icon size={16} weight="duotone" className="mt-0.5 shrink-0 text-white" />
                  <p className="text-[13px] text-zinc-300">{activeTabMeta.detail}</p>
                </div>
              </div>
              <div className="shrink-0 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] font-semibold text-white">
                {activeTabMeta.metric}
              </div>
            </div>
          </div>
        </section>

        {/* Tab Content Section */}
        <div className="relative min-h-[360px] pt-3">
          <AnimatePresence mode="wait">
            {activeTab === "Overview" && (
              <motion.div
                key="Overview"
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -10 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-full space-y-5"
              >
                <div ref={chartContainerRef} className="w-full rounded-[1.7rem] border border-white/5 bg-[#0a0e17]/80 p-5 backdrop-blur-xl shadow-2xl">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white">Learning Velocity</h3>
                      <p className="text-[13px] text-zinc-400">Your engagement over the past week</p>
                    </div>
                    <div className="flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[11px] font-bold text-cyan-400">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500"></span>
                      </span>
                      +24% vs last week
                    </div>
                  </div>
                  <div className="h-[250px] w-full">
                    <Line data={overviewChartData} options={chartOptions} />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "Courses" && (
              <motion.div
                key="Courses"
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -10 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-full space-y-5"
              >
                <div className="flex flex-col gap-3 px-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.28em] text-cyan-400">
                      <LayoutGrid className="h-3.5 w-3.5" />
                      Available Courses
                    </p>
                    <h2 className="mt-2 text-[1.85rem] font-black tracking-tight text-white sm:text-[2.4rem]">
                      Start Learning
                    </h2>
                  </div>
                  <div className="rounded-full border border-white/5 bg-white/[0.02] px-4 py-1.5 text-[13px] font-medium text-zinc-400 backdrop-blur-xl">
                    Showing <span className="font-bold text-white">{visibleTechnologies.length}</span> course
                    {visibleTechnologies.length === 1 ? "" : "s"}
                  </div>
                </div>

                {visibleTechnologies.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {visibleTechnologies.map((tech, index) => {
                      const profile = getCourseProfile(activeCategory, tech.id, index, savedTrackProgress[tech.id]);
                      return (
                        <div key={tech.id} className="relative group">
                          {profile.progress > 0 && profile.progress < 100 && (
                            <div className="absolute -top-3 inset-x-4 h-1.5 overflow-hidden rounded-t-full bg-white/5 z-0">
                              <motion.div 
                                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]" 
                                initial={{ width: 0 }}
                                animate={{ width: `${profile.progress}%` }}
                                transition={{ type: "spring", stiffness: 50, damping: 15, delay: 0.2 }}
                              />
                            </div>
                          )}
                          <TechCard3D
                            title={tech.name}
                            description={tech.desc}
                            iconClassName={tech.icon}
                            color={profile.ring}
                            progress={profile.progress}
                            slug={tech.id}
                            href={`/learn/${tech.id}`}
                            ctaLabel={profile.ctaLabel}
                            orbitLabel={profile.orbit}
                            focusLabel={profile.focus}
                            lessonCount={profile.lessons}
                            difficulty={profile.level}
                            estimatedHours={profile.estimatedHours}
                            durationLabel={profile.durationLabel}
                            statusLabel={profile.statusLabel}
                            statusTone={profile.statusTone}
                            currentLesson={profile.currentLesson}
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-[1.6rem] border border-dashed border-white/15 bg-white/[0.03] p-8 text-center backdrop-blur-xl">
                    <p className="text-lg font-semibold text-white">No technologies matched &quot;{query}&quot;.</p>
                    <p className="mt-2 text-sm text-zinc-400">
                      Try a different keyword or open quick search with Ctrl/Cmd + K.
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "Achievements" && (
              <motion.div
                key="Achievements"
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -10 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="space-y-5"
              >
                <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr_0.8fr]">
                  <div className="rounded-[1.7rem] border border-white/5 bg-[#0a0e17]/70 p-5 backdrop-blur-xl shadow-2xl">
                    <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-zinc-500">
                      {activeCategory} reward path
                    </p>
                    <h3 className="font-display mt-3 text-[1.9rem] font-black tracking-[-0.035em] text-white sm:text-[2.15rem]">
                      Badges that actually match the curriculum.
                    </h3>
                    <p className="mt-3 max-w-2xl text-[13px] leading-6 text-zinc-300">
                      These unlocks are now tied to the active path, so every milestone reflects what you are
                      learning next instead of random generic trophies.
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white">
                        {unlockedBadgeCount}/{activeBadges.length} unlocked
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-zinc-300">
                        {averageProgress}% path progress
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-zinc-300">
                        {completedTracks} completed tracks
                      </span>
                    </div>
                  </div>

                  <div className="rounded-[1.7rem] border border-white/5 bg-[#0a0e17]/70 p-5 backdrop-blur-xl shadow-2xl">
                    <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-zinc-500">
                      Unlock radar
                    </p>
                    <div className="mt-4 grid gap-4 sm:grid-cols-[156px_1fr] sm:items-center">
                      <div className="relative mx-auto h-[156px] w-[156px]">
                        <Doughnut data={achievementChartData} options={achievementChartOptions} />
                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                          <p className="text-[1.8rem] font-black text-white">{unlockedBadgeCount}</p>
                          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                            unlocked
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {achievementSegments.map((segment) => (
                          <div
                            key={segment.label}
                            className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] px-4 py-3"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <span
                                  className="h-2.5 w-2.5 rounded-full"
                                  style={{ backgroundColor: segment.tone }}
                                />
                                <p className="text-sm font-semibold text-white">{segment.label}</p>
                              </div>
                              <span className="text-sm font-bold text-white">{segment.value}</span>
                            </div>
                            <p className="mt-2 text-xs leading-5 text-zinc-400">{segment.note}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.7rem] border border-white/5 bg-[#0a0e17]/70 p-5 backdrop-blur-xl shadow-2xl">
                    <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-zinc-500">
                      Next unlock
                    </p>
                    {nextBadge ? (
                      <div className="mt-4">
                        <div className={`flex h-14 w-14 items-center justify-center rounded-[1.2rem] bg-gradient-to-br ${nextBadge.gradient} shadow-[0_18px_45px_rgba(0,0,0,0.28)]`}>
                          <nextBadge.Icon size={26} weight="duotone" className="text-white" />
                        </div>
                        <h4 className="mt-4 text-lg font-bold text-white">{nextBadge.title}</h4>
                        <p className="mt-2 text-[13px] leading-6 text-zinc-300">{nextBadge.desc}</p>
                        <div className="mt-4 flex items-center justify-between rounded-[1.1rem] border border-white/10 bg-white/[0.03] px-4 py-3">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                              Unlock rule
                            </p>
                            <p className="mt-1 text-sm font-semibold text-white">{nextBadge.requirement}</p>
                          </div>
                          <div className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300">
                            {Math.max(nextBadge.threshold - averageProgress, 0)}% left
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 rounded-[1.5rem] border border-emerald-400/20 bg-emerald-500/10 p-5">
                        <p className="text-sm font-semibold text-emerald-200">Every badge in this path is unlocked.</p>
                        <p className="mt-2 text-sm leading-6 text-emerald-100/80">
                          You have already cleared the full reward ladder for {activeCategory.toLowerCase()}.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-[1.7rem] border border-white/5 bg-[#0a0e17]/70 p-5 backdrop-blur-xl shadow-2xl">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-zinc-500">
                        Progress timeline
                      </p>
                      <h4 className="mt-2 text-[1.35rem] font-bold tracking-tight text-white">
                        Unlock flow across the {activeCategory} path
                      </h4>
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-zinc-300">
                      {timelineProgress}% overall unlock momentum
                    </div>
                  </div>

                  <div className="mt-6 overflow-x-auto pb-2 no-scrollbar">
                    <div className="relative h-[9.5rem] min-w-[860px] px-6 py-4">
                      {activeBadges.slice(0, -1).map((badge, index) => {
                        const nextTimelineBadge = activeBadges[index + 1];
                        const startRatio = badge.threshold / finalBadgeThreshold;
                        const endRatio = nextTimelineBadge.threshold / finalBadgeThreshold;
                        const segmentProgress = Math.max(
                          Math.min(
                            (timelineProgress - badge.threshold) /
                              (nextTimelineBadge.threshold - badge.threshold),
                            1,
                          ),
                          0,
                        );

                        return (
                          <div
                            key={`${badge.id}-segment`}
                            className="absolute top-6 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-white/10"
                            style={{
                              left: `calc(3rem + (100% - 3rem) * ${startRatio})`,
                              width: `calc((100% - 3rem) * ${endRatio - startRatio} - 3rem)`,
                            }}
                          >
                            <motion.div
                              className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400"
                              initial={{ width: 0 }}
                              animate={{ width: `${segmentProgress * 100}%` }}
                              transition={{ type: "spring", stiffness: 80, damping: 18 }}
                            />
                          </div>
                        );
                      })}

                      {activeBadges.map((badge) => {
                          const isUnlocked = averageProgress >= badge.threshold;
                          const isNext = nextBadge?.id === badge.id;
                          const isActive = activeAchievement?.id === badge.id;

                          return (
                            <button
                              key={`${badge.id}-timeline`}
                              type="button"
                              onMouseEnter={() => setActiveAchievementId(badge.id)}
                              onFocus={() => setActiveAchievementId(badge.id)}
                              className="group absolute top-0 w-32 -translate-x-1/2 text-left"
                              style={{
                                left: `calc(1.5rem + (100% - 3rem) * ${badge.threshold / finalBadgeThreshold})`,
                              }}
                            >
                              <div className="flex flex-col items-center">
                                <div className="relative">
                                  {(isUnlocked || isActive) ? (
                                    <>
                                      <motion.span
                                        aria-hidden="true"
                                        className="pointer-events-none absolute inset-0 rounded-full border border-white/20"
                                        animate={{ scale: [1, 1.45], opacity: [0.34, 0] }}
                                        transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY, ease: "easeOut" }}
                                      />
                                      <motion.span
                                        aria-hidden="true"
                                        className="pointer-events-none absolute inset-0 rounded-full border border-white/15"
                                        animate={{ scale: [1, 1.7], opacity: [0.28, 0] }}
                                        transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY, ease: "easeOut", delay: 0.7 }}
                                      />
                                    </>
                                  ) : null}
                                  <div
                                    className={`relative flex h-12 w-12 items-center justify-center rounded-full border transition-all ${
                                      isUnlocked
                                        ? "border-white/20 bg-white/[0.10] text-white"
                                        : isNext
                                          ? "border-cyan-400/25 bg-cyan-500/10 text-cyan-200"
                                          : "border-white/10 bg-white/[0.03] text-zinc-400"
                                    } ${isActive ? "scale-110 shadow-[0_0_24px_rgba(255,255,255,0.12)]" : ""}`}
                                  >
                                    <badge.Icon
                                      size={18}
                                      weight={isUnlocked || isActive ? "duotone" : "regular"}
                                      className="relative z-10"
                                    />
                                  </div>
                                </div>
                                <div className="mt-4 text-center">
                                  <p className="text-[11px] font-semibold text-white">{badge.title}</p>
                                  <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                                    {badge.threshold}%
                                  </p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                  <div className="rounded-[1.7rem] border border-white/5 bg-[#0a0e17]/70 p-5 backdrop-blur-xl shadow-2xl">
                    <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-zinc-500">
                      Hover detail drawer
                    </p>
                    <AnimatePresence mode="wait">
                      {activeAchievement ? (
                        <motion.div
                          key={activeAchievement.id}
                          initial={{ opacity: 0, y: 14 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -12 }}
                          transition={{ duration: 0.26, ease: "easeOut" }}
                          className="mt-4 overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-4"
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex items-start gap-4">
                              <div className={`relative flex h-16 w-16 items-center justify-center rounded-[1.3rem] bg-gradient-to-br ${activeAchievement.gradient} shadow-[0_18px_40px_rgba(0,0,0,0.28)]`}>
                                <div
                                  className={`pointer-events-none absolute inset-[-10%] rounded-[1.5rem] bg-gradient-to-br ${activeAchievement.gradient} opacity-35 blur-xl`}
                                />
                                <motion.span
                                  aria-hidden="true"
                                  className="pointer-events-none absolute inset-0 rounded-[1.3rem] border border-white/25"
                                  animate={{ scale: [1, 1.15, 1], opacity: [0.55, 0.15, 0.55] }}
                                  transition={{ duration: 2.1, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                                />
                                <activeAchievement.Icon size={30} weight="duotone" className="relative z-10 text-white" />
                              </div>
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                                  Detail focus
                                </p>
                                <h4 className="mt-2 text-[1.35rem] font-bold text-white">{activeAchievement.title}</h4>
                                <p className="mt-2 max-w-xl text-[13px] leading-6 text-zinc-300">
                                  {activeAchievement.desc}
                                </p>
                              </div>
                            </div>

                            <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] font-semibold text-white">
                              Step {String(activeAchievementIndex + 1).padStart(2, "0")}
                            </div>
                          </div>

                          <div className="mt-4 grid gap-3 sm:grid-cols-3">
                            <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] px-4 py-3">
                              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                                Unlock target
                              </p>
                              <p className="mt-2 text-[13px] font-semibold text-white">{activeAchievement.requirement}</p>
                            </div>
                            <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] px-4 py-3">
                              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                                Progress to badge
                              </p>
                              <p className="mt-2 text-[13px] font-semibold text-white">{activeAchievementProgress}% ready</p>
                            </div>
                            <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] px-4 py-3">
                              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                                Current focus
                              </p>
                              <p className="mt-2 text-[13px] font-semibold text-white">
                                {focusHighlights[activeAchievementIndex % focusHighlights.length]}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>

                  <div className="rounded-[1.7rem] border border-white/5 bg-[#0a0e17]/70 p-5 backdrop-blur-xl shadow-2xl">
                    <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-zinc-500">
                      Reward momentum
                    </p>
                    <div className="mt-4 space-y-4">
                      <div>
                        <div className="mb-2 flex items-center justify-between text-xs font-semibold text-zinc-300">
                          <span>Path completion</span>
                          <span>{averageProgress}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/10">
                          <motion.div
                            className="h-full bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${averageProgress}%` }}
                            transition={{ type: "spring", stiffness: 70, damping: 18 }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="mb-2 flex items-center justify-between text-xs font-semibold text-zinc-300">
                          <span>Badge ladder progress</span>
                          <span>{unlockedBadgeCount}/{activeBadges.length}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/10">
                          <motion.div
                            className="h-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-sky-400"
                            initial={{ width: 0 }}
                            animate={{ width: `${(unlockedBadgeCount / activeBadges.length) * 100}%` }}
                            transition={{ type: "spring", stiffness: 70, damping: 18, delay: 0.05 }}
                          />
                        </div>
                      </div>
                      <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4">
                        <p className="text-[13px] font-semibold text-white">Active hover sync</p>
                        <p className="mt-2 text-[13px] leading-6 text-zinc-400">
                          Hover any badge or timeline step to open its live detail drawer and preview the next reward layer.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {activeBadges.map((badge, i) => {
                    const isUnlocked = averageProgress >= badge.threshold;
                    const isNext = nextBadge?.id === badge.id;
                    const isActive = activeAchievement?.id === badge.id;

                    return (
                      <motion.div
                        key={badge.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08, type: "spring", stiffness: 280, damping: 22 }}
                        whileHover={{ y: -6, scale: 1.02 }}
                        onHoverStart={() => setActiveAchievementId(badge.id)}
                        onFocusCapture={() => setActiveAchievementId(badge.id)}
                        className={`group relative overflow-hidden rounded-[1.8rem] border p-5 backdrop-blur-xl transition-all ${
                          isUnlocked
                            ? "border-white/10 bg-[#0b101a]/80 shadow-[0_18px_40px_rgba(0,0,0,0.24)]"
                            : isNext
                              ? "border-cyan-400/20 bg-cyan-500/[0.06] shadow-[0_18px_40px_rgba(6,182,212,0.12)]"
                              : "border-white/5 bg-[#0a0e17]/55"
                        }`}
                      >
                        <div
                          className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${badge.gradient} transition-opacity duration-300 ${
                            isUnlocked ? "opacity-[0.16]" : isNext ? "opacity-[0.12]" : "opacity-[0.06]"
                          }`}
                        />
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

                        <div className="relative flex items-start justify-between gap-4">
                          <div className={`relative flex h-14 w-14 items-center justify-center rounded-[1.2rem] border border-white/10 bg-gradient-to-br ${badge.gradient} shadow-[0_14px_30px_rgba(0,0,0,0.24)]`}>
                            {(isUnlocked || isActive) ? (
                              <>
                                <motion.span
                                  aria-hidden="true"
                                  className="pointer-events-none absolute inset-0 rounded-[1.2rem] border border-white/25"
                                  animate={{ scale: [1, 1.25], opacity: [0.4, 0] }}
                                  transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "easeOut" }}
                                />
                                <motion.span
                                  aria-hidden="true"
                                  className="pointer-events-none absolute inset-0 rounded-[1.2rem] border border-white/15"
                                  animate={{ scale: [1, 1.45], opacity: [0.24, 0] }}
                                  transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "easeOut", delay: 0.6 }}
                                />
                              </>
                            ) : null}
                            <badge.Icon size={26} weight={isUnlocked ? "duotone" : isNext ? "fill" : "regular"} className="relative z-10 text-white" />
                          </div>
                          <span
                            className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] ${
                              isUnlocked
                                ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
                                : isNext
                                  ? "border-cyan-400/20 bg-cyan-500/10 text-cyan-200"
                                  : "border-white/10 bg-white/[0.03] text-zinc-400"
                            }`}
                          >
                            {isUnlocked ? "Unlocked" : isNext ? "Next" : "Locked"}
                          </span>
                        </div>

                        <div className="relative mt-5">
                          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                            Step {String(i + 1).padStart(2, "0")}
                          </p>
                          <h4 className="mt-2 text-lg font-bold text-white">{badge.title}</h4>
                          <p className="mt-2 text-sm leading-6 text-zinc-300">{badge.desc}</p>
                        </div>

                        <div className="relative mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                          <span className="text-xs leading-5 text-zinc-400">{badge.requirement}</span>
                          <span className="shrink-0 text-xs font-semibold text-white">{badge.threshold}%</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {activeTab === "Leaderboard" && (
              <motion.div
                key="Leaderboard"
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -10 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="space-y-5"
              >
                <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
                  <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0a0f18]/88 p-5 backdrop-blur-2xl lg:p-6">
                    <div className={`pointer-events-none absolute -left-10 top-0 h-40 w-40 rounded-full bg-gradient-to-br ${activeCategoryData.panelGlow} blur-3xl`} />
                    <div className="pointer-events-none absolute bottom-0 right-0 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

                    <div className="relative space-y-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="max-w-2xl space-y-3">
                          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.26em] text-zinc-300">
                            <Target size={13} weight="duotone" className="text-cyan-300" />
                            Live Orbit Board
                          </div>
                          <div className="space-y-2">
                            <h3 className="font-display text-[1.9rem] font-black tracking-[-0.04em] text-white sm:text-[2.15rem]">
                              {activeCategory} leaderboard with real climb signals
                            </h3>
                            <p className="max-w-xl text-[13px] leading-6 text-zinc-300">
                              Every completed node, focused sprint, and unlocked badge pushes your {activeCategory.toLowerCase()} profile higher inside the CodeOrbit board.
                            </p>
                          </div>
                        </div>

                        <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] px-4 py-3">
                          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                            Current orbit rank
                          </p>
                          <p className="mt-2 text-[2rem] font-black tracking-tight text-white">
                            #{leaderboardCurrentUser.rank}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-cyan-200">
                            {leaderboardCurrentUser.delta} this week
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        {[
                          {
                            Icon: RocketLaunch,
                            label: "Gap to podium",
                            value: leaderboardGapToPodium === 0 ? "On podium" : `${leaderboardGapToPodium.toLocaleString()} pts`,
                            detail: `Targeting ${leaderboardTargetName}`,
                          },
                          {
                            Icon: ChartLineUp,
                            label: "Orbit sync",
                            value: `${leaderboardProgressToTop}%`,
                            detail: "Current score vs top signal",
                          },
                          {
                            Icon: Lightning,
                            label: "Field average",
                            value: leaderboardAverageScore.toLocaleString(),
                            detail: `${leaderboardBeatCount} learners already behind you`,
                          },
                        ].map((metric) => (
                          <div
                            key={metric.label}
                            className="rounded-[1.3rem] border border-white/10 bg-white/[0.03] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.22)]"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                                  {metric.label}
                                </p>
                                <p className="mt-3 text-[1.55rem] font-black tracking-tight text-white">
                                  {metric.value}
                                </p>
                              </div>
                              <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-zinc-100">
                                <metric.Icon size={18} weight="duotone" />
                              </div>
                            </div>
                            <p className="mt-3 text-xs leading-5 text-zinc-400">{metric.detail}</p>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-[1.45rem] border border-white/10 bg-white/[0.03] p-4">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-500">
                              Rank momentum
                            </p>
                            <p className="text-[13px] leading-6 text-zinc-300">
                              You are building momentum through {leaderboardCurrentUser.focus.toLowerCase()} while the next leap comes from shipping deeper {activeCategory.toLowerCase()} work.
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {focusHighlights.slice(0, 3).map((focus) => (
                              <span
                                key={focus}
                                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-zinc-200"
                              >
                                {focus}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0a0e17]/85 p-5 backdrop-blur-2xl lg:p-6">
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    <div className="pointer-events-none absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-cyan-500/8 to-transparent blur-3xl" />

                    <div className="relative space-y-5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                            Podium pulse
                          </p>
                          <h4 className="mt-2 text-[1.4rem] font-black tracking-tight text-white">
                            Top signals this week
                          </h4>
                        </div>
                        <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-zinc-300">
                          {leaderboardTopScore.toLocaleString()} top score
                        </div>
                      </div>

                      <div className="grid grid-cols-3 items-end gap-2.5">
                        {leaderboardPodium.map((user) => {
                          const isWinner = user.rank === 1;
                          const cardHeight = isWinner ? "min-h-[19rem]" : user.rank === 2 ? "min-h-[16.5rem]" : "min-h-[15.5rem]";

                          return (
                            <motion.div
                              key={user.rank}
                              initial={{ opacity: 0, y: 28 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.55, ease: "easeOut", delay: isWinner ? 0.06 : 0.12 }}
                              className={`${isWinner ? "-translate-y-4" : ""}`}
                            >
                              <div
                                className={`relative flex ${cardHeight} flex-col justify-between overflow-hidden rounded-[1.7rem] border px-4 py-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)] ${
                                  isWinner
                                    ? "border-cyan-400/25 bg-cyan-500/[0.08]"
                                    : "border-white/10 bg-white/[0.03]"
                                }`}
                              >
                                <div
                                  className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${
                                    isWinner
                                      ? "from-cyan-400/16 via-violet-500/12 to-transparent"
                                      : user.rank === 2
                                        ? "from-zinc-300/12 via-white/4 to-transparent"
                                        : "from-amber-400/12 via-orange-400/8 to-transparent"
                                  }`}
                                />

                                <div className="relative flex items-start justify-between gap-3">
                                  <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${
                                    isWinner
                                      ? "border-cyan-400/25 bg-cyan-500/10 text-cyan-200"
                                      : "border-white/10 bg-white/[0.03] text-zinc-300"
                                  }`}>
                                    #{user.rank}
                                  </span>
                                  <Medal
                                    size={20}
                                    weight={isWinner ? "fill" : "duotone"}
                                    className={isWinner ? "text-cyan-300" : user.rank === 2 ? "text-zinc-200" : "text-amber-300"}
                                  />
                                </div>

                                <div className="relative space-y-4">
                                  <div className={`flex h-14 w-14 items-center justify-center rounded-[1.2rem] border text-base font-black ${
                                    isWinner
                                      ? "border-cyan-400/30 bg-cyan-500/15 text-cyan-200"
                                      : "border-white/10 bg-black/25 text-zinc-100"
                                  }`}>
                                    {user.avatar}
                                  </div>

                                  <div>
                                    <p className="text-lg font-black tracking-tight text-white">{user.name}</p>
                                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                                      {user.badge}
                                    </p>
                                  </div>
                                </div>

                                <div className="relative space-y-3">
                                  <div className="flex items-center justify-between gap-3 text-xs text-zinc-400">
                                    <span>{user.focus}</span>
                                    <span className="font-semibold text-white">{user.streak}d streak</span>
                                  </div>
                                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                                    <motion.div
                                      className={`h-full rounded-full ${
                                        isWinner
                                          ? "bg-gradient-to-r from-cyan-400 via-sky-400 to-violet-400"
                                          : "bg-gradient-to-r from-white/70 to-white/25"
                                      }`}
                                      initial={{ width: 0 }}
                                      animate={{ width: `${(user.score / leaderboardTopScore) * 100}%` }}
                                      transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                                    />
                                  </div>
                                  <div className="flex items-center justify-between gap-3">
                                    <p className="text-lg font-black tracking-tight text-white">
                                      {user.score.toLocaleString()}
                                    </p>
                                    <span className="text-xs font-semibold text-emerald-300">
                                      {user.delta} this week
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
                  <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0a0e17]/85 p-5 backdrop-blur-2xl lg:p-6">
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    <div className="pointer-events-none absolute left-0 top-16 h-36 w-36 rounded-full bg-cyan-500/8 blur-3xl" />

                    <div className="relative space-y-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                            Live rankings
                          </p>
                          <h4 className="mt-2 text-[1.4rem] font-black tracking-tight text-white">
                            Active learners in the orbit
                          </h4>
                        </div>
                        <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-zinc-300">
                          Updated with recent sprints
                        </div>
                      </div>

                      <LeaderboardList entries={leaderboardEntries} topScore={leaderboardTopScore} />
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0b101a]/88 p-5 backdrop-blur-2xl">
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-400/8 via-transparent to-violet-500/10" />
                      <div className="relative space-y-5">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                              Climb forecast
                            </p>
                            <h4 className="mt-2 text-[1.15rem] font-black tracking-tight text-white">
                              What gets you into the top lane
                            </h4>
                          </div>
                          <RocketLaunch size={22} weight="duotone" className="text-cyan-300" />
                        </div>

                        <div className="space-y-4">
                          {[
                            {
                              label: "Top-score proximity",
                              value: `${leaderboardProgressToTop}%`,
                              width: leaderboardProgressToTop,
                              color: "from-cyan-400 via-sky-400 to-violet-400",
                            },
                            {
                              label: "Weekly climb rate",
                              value: `${leaderboardCurrentUser.delta} gain`,
                              width: Math.min(Math.max(Number.parseInt(leaderboardCurrentUser.delta, 10), 0), 180) / 1.8,
                              color: "from-emerald-400 via-cyan-400 to-sky-400",
                            },
                            {
                              label: "Consistency streak",
                              value: `${leaderboardCurrentUser.streak} days`,
                              width: Math.min((leaderboardCurrentUser.streak / 30) * 100, 100),
                              color: "from-orange-400 via-amber-300 to-yellow-200",
                            },
                          ].map((item) => (
                            <div key={item.label}>
                              <div className="mb-2 flex items-center justify-between gap-3 text-xs font-semibold text-zinc-300">
                                <span>{item.label}</span>
                                <span>{item.value}</span>
                              </div>
                              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                                <motion.div
                                  className={`h-full rounded-full bg-gradient-to-r ${item.color}`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${item.width}%` }}
                                  transition={{ type: "spring", stiffness: 80, damping: 18 }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0a0e17]/88 p-5 backdrop-blur-2xl">
                      <div className="pointer-events-none absolute bottom-0 right-0 h-36 w-36 rounded-full bg-violet-500/8 blur-3xl" />
                      <div className="relative space-y-5">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                              Move-up checklist
                            </p>
                            <h4 className="mt-2 text-[1.15rem] font-black tracking-tight text-white">
                              Signals that raise your rank
                            </h4>
                          </div>
                          <ShieldCheck size={22} weight="duotone" className="text-zinc-100" />
                        </div>

                        <div className="space-y-3">
                          {[
                            `Finish the next ${activeCategory.toLowerCase()} milestone to unlock ${nextBadge?.title ?? "the next badge"}.`,
                            `Push beyond ${leaderboardTargetName} by closing the ${leaderboardGapToPodium.toLocaleString()} point podium gap.`,
                            `Keep your ${leaderboardCurrentUser.streak}-day streak alive while doubling down on ${focusHighlights[0]?.toLowerCase() ?? "path projects"}.`,
                          ].map((item, index) => (
                            <div
                              key={item}
                              className="flex items-start gap-3 rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4"
                            >
                              <div className="mt-0.5 rounded-full border border-white/10 bg-black/20 p-2 text-zinc-100">
                                {index === 0 ? (
                                  <Sparkle size={16} weight="duotone" />
                                ) : index === 1 ? (
                                  <Target size={16} weight="duotone" />
                                ) : (
                                  <FireSimple size={16} weight="duotone" />
                                )}
                              </div>
                              <p className="text-[13px] leading-6 text-zinc-300">{item}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {isPaletteOpen ? (
        <div
          className="fixed inset-0 z-[70] flex items-start justify-center bg-black/70 px-4 pt-24 backdrop-blur-md"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsPaletteOpen(false);
            }
          }}
        >
          <div className="w-full max-w-3xl overflow-hidden rounded-[1.8rem] border border-white/10 bg-[#090d16]/95 shadow-[0_40px_120px_rgba(0,0,0,0.55)]">
            <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
              <Search className="h-5 w-5 text-zinc-500" />
              <input
                ref={searchInputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                spellCheck={false}
                suppressHydrationWarning
                placeholder="Search technologies, categories, or descriptions..."
                className="w-full bg-transparent text-base text-white outline-none placeholder:text-zinc-500"
              />
              <button
                type="button"
                onClick={() => setIsPaletteOpen(false)}
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-zinc-400 transition-colors hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[28rem] overflow-y-auto p-3">
              {commandResults.length > 0 ? (
                <div className="space-y-2">
                  {commandResults.map((tech) => (
                    <Link
                      href={`/learn/${tech.id}`}
                      key={tech.id}
                      onClick={() => {
                        startTransition(() => setActiveCategory(tech.category as Category));
                        setIsPaletteOpen(false);
                      }}
                      className="flex items-center gap-4 rounded-2xl border border-transparent bg-white/[0.03] px-4 py-3 transition-all duration-200 hover:border-white/10 hover:bg-white/[0.05]"
                    >
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 ${tech.bg} text-[1.2rem]`}>
                        <i className={`${tech.icon} ${tech.color}`} aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-white">{tech.name}</p>
                        <p className="truncate text-sm text-zinc-400">{tech.desc}</p>
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.22em] text-zinc-500">
                        {tech.category}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-10 text-center">
                  <p className="text-white">Start typing to search the curriculum deck.</p>
                  <p className="mt-2 text-sm text-zinc-500">
                    Search by tech name, category, or topic description.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
