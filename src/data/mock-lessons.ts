import { technologies } from "@/config/technologies";

export type CurriculumTrackStatus = "completed" | "in-progress" | "planned";
export type CurriculumLessonState = "completed" | "unlocked" | "locked";

export type CurriculumLesson = {
  id: string;
  kind: "lab" | "lesson" | "project";
  minutes: number;
  section: string;
  title: string;
};

export type CurriculumTrack = {
  techId: string;
  name: string;
  category: string;
  currentFocus: string;
  currentLessonId: string;
  durationLabel: string;
  estimatedHours: number;
  lessonCount: number;
  lessons: CurriculumLesson[];
  level: "Beginner" | "Intermediate" | "Advanced";
  orbitLabel: string;
  progress: number;
  sprintLabel: string;
  status: CurriculumTrackStatus;
};

export type CurriculumProgressState = {
  activeIndex: number;
  completedCount: number;
  progressPercent: number;
  resumeLessonId: string;
  unlockedCount: number;
  unlockedLimit: number;
};

type LessonSeed = {
  id: string;
  kind?: CurriculumLesson["kind"];
  minutes: number;
  section: string;
  title: string;
};

type TrackSeed = {
  currentFocus: string;
  estimatedHours: number;
  extraLessons?: LessonSeed[];
  level: CurriculumTrack["level"];
  orbitLabel: string;
  progress: number;
  sprintLabel: string;
  status: CurriculumTrackStatus;
};

const categoryBaseLessons: Record<string, (name: string) => LessonSeed[]> = {
  Backend: (name) => [
    { id: "runtime-core", title: `${name} runtime foundations`, section: "Core Runtime", minutes: 45 },
    { id: "api-design", title: "HTTP boundaries and API design", section: "Application Layer", minutes: 52 },
    { id: "data-flow", title: "Persistence, validation, and request flow", section: "Application Layer", minutes: 58 },
    { id: "testing", title: "Testing, logging, and observability", section: "Reliability", minutes: 49 },
    { id: "auth", title: "Security guardrails and auth patterns", section: "Reliability", minutes: 55 },
    { id: "ship", title: `Ship a production ${name} service`, section: "Delivery", minutes: 72, kind: "project" },
  ],
  Database: (name) => [
    { id: "data-models", title: `${name} data modeling essentials`, section: "Foundations", minutes: 44 },
    { id: "querying", title: "Query patterns and access paths", section: "Query Design", minutes: 54 },
    { id: "performance", title: "Indexes, performance, and execution plans", section: "Optimization", minutes: 61 },
    { id: "consistency", title: "Consistency, caching, and replication", section: "Optimization", minutes: 57 },
    { id: "ops", title: "Backups, migrations, and production safety", section: "Operations", minutes: 48 },
    { id: "warehouse", title: `Design a resilient ${name} data workflow`, section: "Delivery", minutes: 70, kind: "project" },
  ],
  Frontend: (name) => [
    { id: "rendering-core", title: `${name} fundamentals and rendering model`, section: "Foundations", minutes: 42 },
    { id: "layout", title: "Layout systems and component composition", section: "UI Patterns", minutes: 50 },
    { id: "state", title: "State, events, and data flow", section: "UI Patterns", minutes: 56 },
    { id: "tooling", title: "Tooling, testing, and developer workflow", section: "Tooling", minutes: 47 },
    { id: "accessibility", title: "Accessibility, polish, and UX quality", section: "Quality", minutes: 45 },
    { id: "ship", title: `Ship a production ${name} interface`, section: "Delivery", minutes: 74, kind: "project" },
  ],
};

const trackSeeds: Record<string, TrackSeed> = {
  html: {
    status: "completed",
    progress: 90,
    estimatedHours: 18,
    level: "Beginner",
    orbitLabel: "Semantic Structure",
    currentFocus: "Accessibility-first markup",
    sprintLabel: "Launch-ready fundamentals",
    extraLessons: [
      { id: "forms", title: "Forms, validation, and input ergonomics", section: "Foundations", minutes: 41 },
      { id: "seo", title: "Metadata, SEO, and document semantics", section: "Quality", minutes: 34 },
    ],
  },
  css: {
    status: "in-progress",
    progress: 77,
    estimatedHours: 24,
    level: "Beginner",
    orbitLabel: "Layout Systems",
    currentFocus: "Responsive layout architecture",
    sprintLabel: "Interface foundations sprint",
    extraLessons: [
      { id: "cascade", title: "Cascade strategy and specificity control", section: "Foundations", minutes: 38 },
      { id: "animation", title: "Motion systems and transitions", section: "Quality", minutes: 46 },
    ],
  },
  javascript: {
    status: "in-progress",
    progress: 76,
    estimatedHours: 42,
    level: "Intermediate",
    orbitLabel: "Interaction Mesh",
    currentFocus: "Async control flow and browser APIs",
    sprintLabel: "Language depth sprint",
    extraLessons: [
      { id: "dom", title: "DOM orchestration and event delegation", section: "Application Layer", minutes: 53 },
      { id: "async-runtime", title: "Promises, async flows, and error surfaces", section: "Application Layer", minutes: 58 },
      { id: "patterns", title: "Reusable patterns for real product code", section: "Delivery", minutes: 49 },
    ],
  },
  typescript: {
    status: "in-progress",
    progress: 63,
    estimatedHours: 28,
    level: "Intermediate",
    orbitLabel: "Type Safety Grid",
    currentFocus: "Modeling component and API contracts",
    sprintLabel: "Static confidence sprint",
    extraLessons: [
      { id: "types", title: "Type inference, narrowing, and utility types", section: "Foundations", minutes: 51 },
      { id: "app-types", title: "App-scale typing for UI and services", section: "Delivery", minutes: 63 },
    ],
  },
  react: {
    status: "in-progress",
    progress: 62,
    estimatedHours: 46,
    level: "Intermediate",
    orbitLabel: "State Fabric",
    currentFocus: "State boundaries and reusable composition",
    sprintLabel: "Component systems sprint",
    extraLessons: [
      { id: "hooks", title: "Hooks, effects, and async UI updates", section: "Application Layer", minutes: 61 },
      { id: "performance", title: "Performance and rendering diagnostics", section: "Quality", minutes: 56 },
      { id: "testing", title: "Component testing and confidence loops", section: "Quality", minutes: 42 },
    ],
  },
  nextjs: {
    status: "planned",
    progress: 49,
    estimatedHours: 38,
    level: "Advanced",
    orbitLabel: "Server Boundaries",
    currentFocus: "App Router and hybrid rendering",
    sprintLabel: "Full-stack delivery sprint",
    extraLessons: [
      { id: "routing", title: "App Router, layouts, and nested flows", section: "Framework Core", minutes: 56 },
      { id: "server", title: "Server components, actions, and data loading", section: "Framework Core", minutes: 64 },
      { id: "deploy", title: "Caching, deployment, and edge decisions", section: "Delivery", minutes: 54 },
    ],
  },
  tailwind: {
    status: "completed",
    progress: 84,
    estimatedHours: 16,
    level: "Beginner",
    orbitLabel: "Utility System",
    currentFocus: "Scalable design tokens and composition",
    sprintLabel: "Design system acceleration",
    extraLessons: [
      { id: "tokens", title: "Theme tokens and design primitives", section: "Design System", minutes: 36 },
      { id: "patterns", title: "Reusable utility patterns and abstractions", section: "Design System", minutes: 39 },
    ],
  },
  bootstrap: {
    status: "in-progress",
    progress: 68,
    estimatedHours: 12,
    level: "Beginner",
    orbitLabel: "Component Assembly",
    currentFocus: "Rapid layout systems and component reuse",
    sprintLabel: "Fast prototype sprint",
    extraLessons: [
      { id: "grid", title: "Grid system and responsive scaffolding", section: "Framework Core", minutes: 31 },
    ],
  },
  vue: {
    status: "planned",
    progress: 44,
    estimatedHours: 34,
    level: "Intermediate",
    orbitLabel: "Reactive Surface",
    currentFocus: "Single-file component architecture",
    sprintLabel: "Reactive UI sprint",
    extraLessons: [
      { id: "composables", title: "Composables and reactive state patterns", section: "Application Layer", minutes: 52 },
      { id: "pinia", title: "State orchestration with Pinia", section: "Application Layer", minutes: 43 },
    ],
  },
  angular: {
    status: "planned",
    progress: 37,
    estimatedHours: 48,
    level: "Advanced",
    orbitLabel: "Enterprise Shell",
    currentFocus: "Module architecture and strongly typed apps",
    sprintLabel: "Enterprise frontend sprint",
    extraLessons: [
      { id: "signals", title: "Signals, templates, and reactive UI", section: "Framework Core", minutes: 55 },
      { id: "forms", title: "Typed forms and validation flows", section: "Application Layer", minutes: 51 },
      { id: "testing", title: "Test harnesses and maintainable modules", section: "Quality", minutes: 49 },
    ],
  },
  nodejs: {
    status: "in-progress",
    progress: 72,
    estimatedHours: 40,
    level: "Intermediate",
    orbitLabel: "Runtime Flow",
    currentFocus: "Service structure and event loop reasoning",
    sprintLabel: "Backend foundations sprint",
    extraLessons: [
      { id: "event-loop", title: "Event loop, streams, and concurrency", section: "Core Runtime", minutes: 58 },
      { id: "jobs", title: "Background jobs and queue-driven workflows", section: "Delivery", minutes: 46 },
    ],
  },
  express: {
    status: "in-progress",
    progress: 66,
    estimatedHours: 24,
    level: "Intermediate",
    orbitLabel: "API Command",
    currentFocus: "REST boundaries and middleware pipelines",
    sprintLabel: "API delivery sprint",
    extraLessons: [
      { id: "middleware", title: "Middleware composition and route layering", section: "Application Layer", minutes: 44 },
      { id: "contracts", title: "Validation, auth, and API contracts", section: "Reliability", minutes: 47 },
    ],
  },
  java: {
    status: "in-progress",
    progress: 58,
    estimatedHours: 52,
    level: "Advanced",
    orbitLabel: "OOP Core",
    currentFocus: "Service architecture and strong abstractions",
    sprintLabel: "Enterprise runtime sprint",
    extraLessons: [
      { id: "collections", title: "Collections, streams, and memory discipline", section: "Core Runtime", minutes: 63 },
      { id: "spring-ready", title: "Preparing for framework-scale architecture", section: "Delivery", minutes: 57 },
      { id: "testing", title: "Unit testing and CI-ready structure", section: "Reliability", minutes: 48 },
    ],
  },
  python: {
    status: "completed",
    progress: 81,
    estimatedHours: 36,
    level: "Intermediate",
    orbitLabel: "Automation Core",
    currentFocus: "Readable services and scripting workflows",
    sprintLabel: "Automation and backend sprint",
    extraLessons: [
      { id: "asyncio", title: "Asyncio, task orchestration, and I/O", section: "Application Layer", minutes: 54 },
      { id: "packaging", title: "Environments, packaging, and release flow", section: "Delivery", minutes: 42 },
    ],
  },
  php: {
    status: "planned",
    progress: 43,
    estimatedHours: 28,
    level: "Intermediate",
    orbitLabel: "Request Lifecycle",
    currentFocus: "Web request flow and app organization",
    sprintLabel: "Legacy-to-modern sprint",
    extraLessons: [
      { id: "laravel-ready", title: "Modern app patterns and framework prep", section: "Delivery", minutes: 46 },
    ],
  },
  golang: {
    status: "planned",
    progress: 39,
    estimatedHours: 30,
    level: "Intermediate",
    orbitLabel: "Concurrency Grid",
    currentFocus: "Goroutines, channels, and service clarity",
    sprintLabel: "Systems sprint",
    extraLessons: [
      { id: "concurrency", title: "Goroutines, channels, and structured concurrency", section: "Core Runtime", minutes: 58 },
      { id: "profiling", title: "Profiling and high-throughput service tuning", section: "Reliability", minutes: 45 },
    ],
  },
  csharp: {
    status: "planned",
    progress: 41,
    estimatedHours: 44,
    level: "Advanced",
    orbitLabel: ".NET Service Layer",
    currentFocus: "Domain modeling and API delivery",
    sprintLabel: "Typed backend sprint",
    extraLessons: [
      { id: "linq", title: "LINQ, records, and expressive domain code", section: "Core Runtime", minutes: 50 },
      { id: "aspnet", title: "API endpoints and app configuration", section: "Application Layer", minutes: 59 },
    ],
  },
  ruby: {
    status: "planned",
    progress: 29,
    estimatedHours: 22,
    level: "Beginner",
    orbitLabel: "Developer Velocity",
    currentFocus: "Readable application code and conventions",
    sprintLabel: "Rails-ready sprint",
    extraLessons: [
      { id: "rails-ready", title: "Convention-driven architecture patterns", section: "Delivery", minutes: 41 },
    ],
  },
  sql: {
    status: "completed",
    progress: 88,
    estimatedHours: 20,
    level: "Beginner",
    orbitLabel: "Query Pulse",
    currentFocus: "Query fluency and reporting patterns",
    sprintLabel: "Data fluency sprint",
    extraLessons: [
      { id: "joins", title: "Joins, aggregates, and reporting logic", section: "Query Design", minutes: 48 },
      { id: "window-functions", title: "Window functions and analytical queries", section: "Optimization", minutes: 44 },
    ],
  },
  postgres: {
    status: "in-progress",
    progress: 71,
    estimatedHours: 32,
    level: "Intermediate",
    orbitLabel: "Schema Vault",
    currentFocus: "Schema design, indexes, and migrations",
    sprintLabel: "Relational mastery sprint",
    extraLessons: [
      { id: "indexes", title: "Index strategy and explain plans", section: "Optimization", minutes: 56 },
      { id: "migrations", title: "Migrations, roles, and production safety", section: "Operations", minutes: 47 },
    ],
  },
  mysql: {
    status: "in-progress",
    progress: 64,
    estimatedHours: 26,
    level: "Intermediate",
    orbitLabel: "Transaction Layer",
    currentFocus: "Relational performance and operational safety",
    sprintLabel: "Operational SQL sprint",
    extraLessons: [
      { id: "tuning", title: "Query tuning and transaction behavior", section: "Optimization", minutes: 51 },
    ],
  },
  mongodb: {
    status: "in-progress",
    progress: 54,
    estimatedHours: 28,
    level: "Intermediate",
    orbitLabel: "Document Flow",
    currentFocus: "Schema flexibility with predictable query access",
    sprintLabel: "Document data sprint",
    extraLessons: [
      { id: "aggregation", title: "Aggregation pipelines and document shaping", section: "Query Design", minutes: 57 },
      { id: "indexes", title: "Indexes and write/read tradeoffs", section: "Optimization", minutes: 45 },
    ],
  },
  redis: {
    status: "planned",
    progress: 47,
    estimatedHours: 14,
    level: "Beginner",
    orbitLabel: "Cache Grid",
    currentFocus: "Caching strategy and ephemeral data flow",
    sprintLabel: "Performance sprint",
    extraLessons: [
      { id: "patterns", title: "Caching, sessions, queues, and invalidation", section: "Application Layer", minutes: 39 },
    ],
  },
  firebase: {
    status: "in-progress",
    progress: 61,
    estimatedHours: 22,
    level: "Intermediate",
    orbitLabel: "Realtime Sync",
    currentFocus: "Realtime data and product velocity",
    sprintLabel: "Realtime delivery sprint",
    extraLessons: [
      { id: "auth", title: "Auth, rules, and client-safe access", section: "Reliability", minutes: 43 },
      { id: "functions", title: "Cloud functions and event automation", section: "Delivery", minutes: 46 },
    ],
  },
};

function normalizeSlugPart(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildLessons(techId: string, category: string, name: string, extraLessons: LessonSeed[] = []) {
  const baseBuilder = categoryBaseLessons[category] ?? categoryBaseLessons.Frontend;
  const baseLessons = baseBuilder(name);

  return [...baseLessons, ...extraLessons].map((lesson, index) => ({
    id: lesson.id || `${techId}-${normalizeSlugPart(lesson.title)}-${index + 1}`,
    kind: lesson.kind ?? "lesson",
    minutes: lesson.minutes,
    section: lesson.section,
    title: lesson.title,
  }));
}

function getDefaultSeed(category: string): TrackSeed {
  if (category === "Backend") {
    return {
      status: "planned",
      progress: 45,
      estimatedHours: 30,
      level: "Intermediate",
      orbitLabel: "Runtime Flow",
      currentFocus: "Delivery-ready service patterns",
      sprintLabel: "Backend momentum sprint",
    };
  }

  if (category === "Database") {
    return {
      status: "planned",
      progress: 42,
      estimatedHours: 24,
      level: "Intermediate",
      orbitLabel: "Data Relay",
      currentFocus: "Reliable query and modeling habits",
      sprintLabel: "Data systems sprint",
    };
  }

  return {
    status: "planned",
    progress: 48,
    estimatedHours: 24,
    level: "Beginner",
    orbitLabel: "Interface Deck",
    currentFocus: "Component and layout fluency",
    sprintLabel: "UI foundations sprint",
  };
}

function pickCurrentLessonId(lessons: CurriculumLesson[], progress: number) {
  const targetIndex = Math.max(0, Math.min(lessons.length - 1, Math.floor((progress / 100) * lessons.length)));
  return lessons[targetIndex]?.id ?? lessons[0]?.id ?? "lesson-1";
}

function findLessonIndex(track: CurriculumTrack, lessonId?: string) {
  if (!lessonId) {
    return Math.max(0, track.lessons.findIndex((lesson) => lesson.id === track.currentLessonId));
  }

  const lessonIndex = track.lessons.findIndex((lesson) => lesson.id === lessonId);
  return lessonIndex >= 0 ? lessonIndex : Math.max(0, track.lessons.findIndex((lesson) => lesson.id === track.currentLessonId));
}

export function getCurriculumTrack(techId: string): CurriculumTrack {
  const tech = technologies.find((item) => item.id === techId);

  if (!tech) {
    const lessons = buildLessons(techId, "Frontend", techId, []);
    return {
      techId,
      name: techId,
      category: "Frontend",
      currentFocus: "Core platform foundations",
      currentLessonId: pickCurrentLessonId(lessons, 40),
      durationLabel: "3 weeks",
      estimatedHours: 18,
      lessonCount: lessons.length,
      lessons,
      level: "Beginner",
      orbitLabel: "Foundations",
      progress: 40,
      sprintLabel: "Starter sprint",
      status: "planned",
    };
  }

  const seed = trackSeeds[tech.id] ?? getDefaultSeed(tech.category);
  const lessons = buildLessons(tech.id, tech.category, tech.name, seed.extraLessons);

  return {
    techId: tech.id,
    name: tech.name,
    category: tech.category,
    currentFocus: seed.currentFocus,
    currentLessonId: pickCurrentLessonId(lessons, seed.progress),
    durationLabel: `${Math.max(2, Math.round(seed.estimatedHours / 6))} weeks`,
    estimatedHours: seed.estimatedHours,
    lessonCount: lessons.length,
    lessons,
    level: seed.level,
    orbitLabel: seed.orbitLabel,
    progress: seed.progress,
    sprintLabel: seed.sprintLabel,
    status: seed.status,
  };
}

export function resolveCurriculumProgress(
  track: CurriculumTrack,
  options?: {
    activeLessonId?: string;
    furthestLessonId?: string;
  },
): CurriculumProgressState {
  const lessonCount = track.lessons.length;

  if (lessonCount === 0) {
    return {
      activeIndex: 0,
      completedCount: 0,
      progressPercent: 0,
      resumeLessonId: "lesson-1",
      unlockedCount: 0,
      unlockedLimit: 0,
    };
  }

  const baseResumeIndex = findLessonIndex(track, track.currentLessonId);
  const activeIndex = findLessonIndex(track, options?.activeLessonId ?? track.currentLessonId);
  const furthestVisitedIndex = Math.max(
    baseResumeIndex,
    activeIndex,
    findLessonIndex(track, options?.furthestLessonId ?? track.currentLessonId),
  );

  const completedCount =
    track.status === "completed" ? lessonCount : Math.min(lessonCount, Math.max(baseResumeIndex, furthestVisitedIndex));
  const unlockedLimit =
    track.status === "completed"
      ? lessonCount - 1
      : Math.min(lessonCount - 1, Math.max(baseResumeIndex + 1, furthestVisitedIndex + 1));
  const progressPercent =
    track.status === "completed"
      ? 100
      : Math.max(track.progress, Math.round((completedCount / Math.max(lessonCount, 1)) * 100));

  return {
    activeIndex,
    completedCount,
    progressPercent,
    resumeLessonId: track.lessons[activeIndex]?.id ?? track.currentLessonId,
    unlockedCount: unlockedLimit + 1,
    unlockedLimit,
  };
}

export function getCurriculumLessonState(
  track: CurriculumTrack,
  lessonId: string,
  options?: {
    activeLessonId?: string;
    furthestLessonId?: string;
  },
): CurriculumLessonState {
  const progressState = resolveCurriculumProgress(track, options);
  const lessonIndex = findLessonIndex(track, lessonId);

  if (track.status === "completed" || lessonIndex < progressState.completedCount) {
    return "completed";
  }

  if (lessonIndex <= progressState.unlockedLimit) {
    return "unlocked";
  }

  return "locked";
}

export function getTrackStatusMeta(status: CurriculumTrackStatus) {
  switch (status) {
    case "completed":
      return {
        label: "Completed",
        tone:
          "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
      };
    case "in-progress":
      return {
        label: "In Progress",
        tone:
          "border-cyan-400/20 bg-cyan-500/10 text-cyan-200",
      };
    default:
      return {
        label: "Planned",
        tone:
          "border-zinc-400/20 bg-white/[0.06] text-zinc-300",
      };
  }
}

export const mockLessons = technologies
  .filter((tech) => ["Frontend", "Backend", "Database"].includes(tech.category))
  .map((tech) => getCurriculumTrack(tech.id));
