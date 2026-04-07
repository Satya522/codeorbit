"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Lock, RotateCcw } from "lucide-react";
import { buildRoadmapSyncProgress } from "@/features/dsa/roadmap-practice-sync";
import {
  getPracticeActivityStreak,
} from "@/features/practice/practice-progress";
import { usePracticeProgressSync } from "@/features/practice/usePracticeProgressSync";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import {
  BracketsCurly,
  ChartLineUp,
  CheckSquareOffset,
  Circuitry,
  CodeSimple,
  FireSimple,
  GitBranch,
  Lightning,
  Medal,
  PlugsConnected,
  RocketLaunch,
  SealCheck,
  Sparkle,
  Target,
  Timer,
} from "@phosphor-icons/react";

type RoadmapNode = {
  id: string;
  step: string;
  title: string;
  subtitle: string;
  description: string;
  modules: string[];
  checkpoints: string[];
  interviewSignals: string[];
  practice: string;
  sprint: string;
  difficulty: "Foundation" | "Core" | "Advanced";
  Icon: PhosphorIcon;
  gradient: string;
  glow: string;
  ringColor: string;
};

type StoredRoadmapState = {
  activeNodeId: string;
};

type NodeState = "completed" | "current" | "unlocked" | "locked";

const storageKey = "codeorbit:dsa-roadmap:focus:v3";

const roadmapNodes: RoadmapNode[] = [
  {
    id: "base-layer",
    step: "01",
    title: "Language and Complexity Base",
    subtitle: "Lock one language first",
    description:
      "Pick one language, sharpen dry runs, and learn how brute force becomes optimized logic before patterns start flying at you.",
    modules: ["Language Basics", "Time Complexity", "Space Complexity", "Dry Runs"],
    checkpoints: [
      "Explain time and space tradeoffs before you code.",
      "Write clean loops, functions, and recursion skeletons without hesitation.",
      "Finish 15 to 20 warmups with perfect trace clarity.",
    ],
    interviewSignals: ["One language only", "Big O clarity", "Trace discipline"],
    practice: "18 starter problems",
    sprint: "6 day base sprint",
    difficulty: "Foundation",
    Icon: CodeSimple,
    gradient: "from-amber-300/80 via-orange-400/70 to-yellow-200/70",
    glow: "from-amber-500/18 via-orange-500/12 to-transparent",
    ringColor: "#f59e0b",
  },
  {
    id: "linear-patterns",
    step: "02",
    title: "Arrays and Strings",
    subtitle: "Where real problem solving starts",
    description:
      "Build intuition for traversal, prefix sums, hashing basics, Kadane, two pointers, and sliding windows across classic interview questions.",
    modules: ["Arrays", "Strings", "Two Pointers", "Sliding Window", "Prefix Sum"],
    checkpoints: [
      "Recognize when brute force can collapse into a linear scan.",
      "Spot sliding window and two-pointer cues in under one minute.",
      "Solve easy to medium arrays and strings without pattern confusion.",
    ],
    interviewSignals: ["Pattern spotting", "Window control", "Index discipline"],
    practice: "32 pattern problems",
    sprint: "1 week pattern sprint",
    difficulty: "Foundation",
    Icon: BracketsCurly,
    gradient: "from-sky-300/80 via-cyan-400/70 to-blue-300/70",
    glow: "from-sky-500/18 via-cyan-500/10 to-transparent",
    ringColor: "#38bdf8",
  },
  {
    id: "recursion-links",
    step: "03",
    title: "Recursion and Linked Lists",
    subtitle: "Shift from loops to state thinking",
    description:
      "Move into recursive state transitions, backtracking basics, pointer manipulation, and linked list operations that sharpen low-level control.",
    modules: ["Recursion", "Backtracking Basics", "Singly Linked List", "Fast and Slow Pointers"],
    checkpoints: [
      "Trace recursion trees without losing call-stack context.",
      "Reverse, merge, and detect cycles in linked structures confidently.",
      "Know when recursion is elegant and when iteration is safer.",
    ],
    interviewSignals: ["Stack frame awareness", "Pointer control", "Cycle reasoning"],
    practice: "26 depth problems",
    sprint: "5 day logic sprint",
    difficulty: "Core",
    Icon: Circuitry,
    gradient: "from-violet-300/80 via-fuchsia-400/70 to-indigo-300/70",
    glow: "from-violet-500/18 via-fuchsia-500/10 to-transparent",
    ringColor: "#a855f7",
  },
  {
    id: "core-structures",
    step: "04",
    title: "Stack, Queue, and Hashing",
    subtitle: "The interview core stack",
    description:
      "This layer teaches ordered processing, monotonic patterns, queue simulations, hash-based lookups, and constant-time thinking under pressure.",
    modules: ["Stack", "Monotonic Stack", "Queue", "Deque", "Hashing"],
    checkpoints: [
      "Choose stack, queue, or hashing without second-guessing.",
      "Understand how lookup tables change complexity instantly.",
      "Solve classic next greater, bracket, and frequency problems smoothly.",
    ],
    interviewSignals: ["Monotonic instinct", "O(1) lookup", "Process ordering"],
    practice: "28 core structure problems",
    sprint: "1 week structure sprint",
    difficulty: "Core",
    Icon: CheckSquareOffset,
    gradient: "from-emerald-300/80 via-teal-400/70 to-cyan-300/70",
    glow: "from-emerald-500/18 via-teal-500/10 to-transparent",
    ringColor: "#34d399",
  },
  {
    id: "search-sort",
    step: "05",
    title: "Search, Sort, and Divide Strategy",
    subtitle: "Optimization begins here",
    description:
      "Master binary search patterns, sorting behavior, partition logic, and divide-and-conquer decisions that show up everywhere in interviews.",
    modules: ["Binary Search", "Sorting", "Custom Comparator Thinking", "Divide and Conquer"],
    checkpoints: [
      "Convert vague monotonic problems into binary search safely.",
      "Know sorting tradeoffs and when ordering unlocks the solution.",
      "Handle lower bound, upper bound, and answer-space search clearly.",
    ],
    interviewSignals: ["Monotonic logic", "Answer search", "Ordering intuition"],
    practice: "24 optimization problems",
    sprint: "4 day optimization sprint",
    difficulty: "Core",
    Icon: ChartLineUp,
    gradient: "from-cyan-300/80 via-sky-400/70 to-violet-300/70",
    glow: "from-cyan-500/18 via-sky-500/10 to-transparent",
    ringColor: "#22d3ee",
  },
  {
    id: "trees-heaps",
    step: "06",
    title: "Trees, BST, Heap, and Trie",
    subtitle: "Structure depth with branching logic",
    description:
      "Push into recursive traversals, tree properties, heaps, priority queues, and prefix-oriented data structures that raise the interview ceiling fast.",
    modules: ["Tree Traversal", "BST", "Heap", "Priority Queue", "Trie"],
    checkpoints: [
      "Switch between DFS and BFS because the problem demands it.",
      "Use heap or priority queue when best-next decisions matter.",
      "Solve tree traversal variants without memorizing blindly.",
    ],
    interviewSignals: ["Traversal control", "Heap instinct", "Branch-state mapping"],
    practice: "34 branching problems",
    sprint: "8 day depth sprint",
    difficulty: "Core",
    Icon: GitBranch,
    gradient: "from-indigo-300/80 via-blue-400/70 to-sky-300/70",
    glow: "from-indigo-500/18 via-blue-500/10 to-transparent",
    ringColor: "#818cf8",
  },
  {
    id: "graphs",
    step: "07",
    title: "Graphs and Traversal Systems",
    subtitle: "Move from trees to networks",
    description:
      "Represent graphs correctly, run BFS and DFS with confidence, and grow into shortest paths, topological sort, DSU, and connectivity logic.",
    modules: ["Graph Representation", "BFS", "DFS", "Topological Sort", "Shortest Path", "DSU"],
    checkpoints: [
      "Translate matrix or edge-list input into a clean graph model fast.",
      "Differentiate traversal, connectivity, and path-cost questions instantly.",
      "Handle cycle detection, components, and shortest paths with structure.",
    ],
    interviewSignals: ["Traversal expansion", "Connectivity logic", "Path cost control"],
    practice: "36 network problems",
    sprint: "9 day graph sprint",
    difficulty: "Advanced",
    Icon: PlugsConnected,
    gradient: "from-fuchsia-300/80 via-violet-400/70 to-pink-300/70",
    glow: "from-fuchsia-500/18 via-violet-500/10 to-transparent",
    ringColor: "#d946ef",
  },
  {
    id: "optimization-layer",
    step: "08",
    title: "Dynamic Programming and Greedy",
    subtitle: "The hard-value interview layer",
    description:
      "This is where interview separation happens. Build state transitions, subproblem thinking, greedy proof instinct, and optimization discipline.",
    modules: ["Greedy", "1D DP", "2D DP", "Subsequence DP", "Knapsack Patterns", "Bit Tricks"],
    checkpoints: [
      "Write states and transitions before touching implementation.",
      "Know when greedy needs proof and when DP is unavoidable.",
      "Break scary questions into repeatable pattern buckets.",
    ],
    interviewSignals: ["State design", "Greedy proof", "Optimization control"],
    practice: "42 high-value problems",
    sprint: "10 day mastery sprint",
    difficulty: "Advanced",
    Icon: Lightning,
    gradient: "from-rose-300/80 via-fuchsia-400/70 to-orange-300/70",
    glow: "from-rose-500/18 via-fuchsia-500/10 to-transparent",
    ringColor: "#fb7185",
  },
  {
    id: "revision-loop",
    step: "09",
    title: "Revision, Mixed Sets, and Mock Interviews",
    subtitle: "Turn preparation into delivery",
    description:
      "Close the loop with pattern revision, timed mixed rounds, mock interviews, and post-solve analysis so knowledge becomes interview performance.",
    modules: ["Mixed Sheets", "Timed Sets", "Mock Interviews", "Revision Loops", "Weak-topic Repair"],
    checkpoints: [
      "Solve mixed sets without relying on topic labels.",
      "Review mistakes by pattern, not by random memory.",
      "Build a repeatable mock loop for interview week execution.",
    ],
    interviewSignals: ["Recall under pressure", "Mixed pattern control", "Interview calm"],
    practice: "30 revision problems",
    sprint: "Final 7 day loop",
    difficulty: "Advanced",
    Icon: Medal,
    gradient: "from-yellow-200/80 via-amber-300/70 to-orange-300/70",
    glow: "from-yellow-400/18 via-amber-500/10 to-transparent",
    ringColor: "#facc15",
  },
];

const executionRules = [
  "Stick to one primary language until the roadmap is fully stable in your head.",
  "Do not unlock the next heavy node until the current one has at least one strong solved set.",
  "After every sprint, spend one session only on mistakes, patterns, and rewrite speed.",
  "Mix revision into the plan early so the later interview loop does not become panic-driven.",
];

function isStoredRoadmapState(value: unknown): value is StoredRoadmapState {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<StoredRoadmapState>;
  return typeof candidate.activeNodeId === "string";
}

function getDifficultyTone(difficulty: RoadmapNode["difficulty"]) {
  switch (difficulty) {
    case "Foundation":
      return "border-amber-400/20 bg-amber-500/10 text-amber-100";
    case "Core":
      return "border-cyan-400/20 bg-cyan-500/10 text-cyan-100";
    default:
      return "border-fuchsia-400/20 bg-fuchsia-500/10 text-fuchsia-100";
  }
}

function getNodeState(
  nodeId: string,
  index: number,
  activeIndex: number,
  unlockedUntil: number,
  completedSet: Set<string>,
): NodeState {
  if (completedSet.has(nodeId)) {
    return "completed";
  }

  if (index === activeIndex) {
    return "current";
  }

  if (index <= unlockedUntil) {
    return "unlocked";
  }

  return "locked";
}

function getInitialRoadmapState(): StoredRoadmapState {
  const fallbackState = {
    activeNodeId: roadmapNodes[0]?.id ?? "",
  } satisfies StoredRoadmapState;

  if (typeof window === "undefined") {
    return fallbackState;
  }

  try {
    const rawState = window.localStorage.getItem(storageKey);
    if (!rawState) {
      return fallbackState;
    }

    const parsedState = JSON.parse(rawState);
    if (!isStoredRoadmapState(parsedState)) {
      return fallbackState;
    }

    const validIds = new Set(roadmapNodes.map((node) => node.id));
    const safeActiveNodeId = validIds.has(parsedState.activeNodeId)
      ? parsedState.activeNodeId
      : fallbackState.activeNodeId;

    return {
      activeNodeId: safeActiveNodeId,
    };
  } catch (error) {
    console.warn("Unable to restore DSA roadmap progress", error);
    return fallbackState;
  }
}

export function DSARoadmap() {
  const [roadmapState, setRoadmapState] = useState<StoredRoadmapState>(() => getInitialRoadmapState());
  const { isSignedIn, isSyncing, progressMap: practiceProgressMap, syncError } = usePracticeProgressSync();
  const activeNodeId = roadmapState.activeNodeId;

  useEffect(() => {
    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify(roadmapState satisfies StoredRoadmapState),
      );
    } catch (error) {
      console.warn("Unable to persist DSA roadmap progress", error);
    }
  }, [roadmapState]);

  const practiceEntries = Object.values(practiceProgressMap).sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
  );
  const syncedRoadmapProgress = buildRoadmapSyncProgress(
    roadmapNodes.map((node) => ({ id: node.id, modules: node.modules })),
    practiceProgressMap,
  );
  const completedNodeIds: string[] = [];
  for (const node of roadmapNodes) {
    if (syncedRoadmapProgress[node.id]?.meetsCompletion) {
      completedNodeIds.push(node.id);
      continue;
    }
    break;
  }
  const completedSet = new Set(completedNodeIds);
  const completedCount = completedNodeIds.length;
  const highestCompletedIndex = completedCount - 1;
  const unlockedUntil =
    completedCount >= roadmapNodes.length ? roadmapNodes.length - 1 : Math.min(roadmapNodes.length - 1, completedCount);
  const recommendedActiveIndex = Math.min(
    roadmapNodes.length - 1,
    completedCount >= roadmapNodes.length ? roadmapNodes.length - 1 : completedCount,
  );
  const storedActiveIndex = roadmapNodes.findIndex((node) => node.id === activeNodeId);
  const activeIndex =
    storedActiveIndex >= 0 && storedActiveIndex <= unlockedUntil ? storedActiveIndex : recommendedActiveIndex;
  const activeNode = roadmapNodes[activeIndex] ?? roadmapNodes[0];
  const activeNodeSync = syncedRoadmapProgress[activeNode.id];
  const unlockedCount = unlockedUntil + 1;
  const practiceSolvedCount = practiceEntries.filter((entry) => entry.status === "solved").length;
  const practiceAttemptedCount = practiceEntries.filter((entry) => entry.status === "attempted").length;
  const practiceStreak = getPracticeActivityStreak(practiceProgressMap);
  const totalModules = roadmapNodes.reduce((sum, node) => sum + node.modules.length, 0);
  const completedModules = roadmapNodes.reduce(
    (sum, node) => sum + (syncedRoadmapProgress[node.id]?.solvedModuleCount ?? 0),
    0,
  );
  const trackedModules = roadmapNodes.reduce(
    (sum, node) => sum + (syncedRoadmapProgress[node.id]?.trackedModuleCount ?? 0),
    0,
  );
  const progressPercent = Math.round((completedCount / Math.max(roadmapNodes.length, 1)) * 100);
  const moduleCoverage = Math.round((completedModules / Math.max(totalModules, 1)) * 100);
  const interviewReadiness = Math.min(
    97,
    Math.round(10 + progressPercent * 0.34 + moduleCoverage * 0.24 + practiceSolvedCount * 1.5 + practiceStreak * 4),
  );
  const currentMomentum = Math.min(
    100,
    Math.round(18 + activeNodeSync.completionPercent * 0.62 + practiceStreak * 5 + activeNodeSync.solvedCount * 3),
  );
  const reviewPower = Math.min(
    100,
    Math.round(14 + completedCount * 9 + practiceAttemptedCount * 1.4 + trackedModules * 0.8),
  );
  const activeSolveTarget = activeNodeSync.solveTarget;
  const activeNodeState = getNodeState(
    activeNode.id,
    activeIndex,
    activeIndex,
    unlockedUntil,
    completedSet,
  );
  const activeNodeStateLabel =
    activeNodeState === "completed"
      ? "Completed"
      : activeNodeState === "current"
        ? "Current node"
        : activeNodeState === "unlocked"
          ? "Unlocked"
          : "Locked";
  const nextNode = activeIndex < roadmapNodes.length - 1 ? roadmapNodes[activeIndex + 1] : null;
  const recentCompletedNode =
    highestCompletedIndex >= 0 ? roadmapNodes[highestCompletedIndex] ?? null : null;
  const recentSolvedEntry = practiceEntries.find((entry) => entry.status === "solved") ?? null;
  const weeklySprint = activeNodeSync.moduleStates.slice(0, 4).map((module, index) => ({
    label: `Day 0${index + 1}`,
    title: module.label,
    note:
      module.hasSolved
        ? "Already cleared through synced practice. Run one timed revision set."
        : module.hasTracked
          ? "You have attempts here. Push this module from attempt to solved."
          : index === 0
            ? "Start your next focused solve block here."
            : index === 1
              ? "Build pattern reps and edge-case confidence."
              : index === 2
                ? "Convert this into a medium timed set."
                : "Close the loop with one revision and recap run.",
  }));
  const signalBars = [
    {
      label: "Foundation coverage",
      value: moduleCoverage,
      tone: "from-cyan-400 via-sky-400 to-violet-400",
      detail: `${completedModules}/${totalModules} modules cleared from synced solved practice`,
    },
    {
      label: "Interview tempo",
      value: currentMomentum,
      tone: "from-emerald-400 via-teal-400 to-cyan-400",
      detail: `${practiceSolvedCount} solved and ${practiceAttemptedCount} attempted questions are feeding this roadmap`,
    },
    {
      label: "Revision power",
      value: reviewPower,
      tone: "from-amber-300 via-orange-400 to-rose-400",
      detail: recentSolvedEntry
        ? `${recentSolvedEntry.title} is your latest synced solved problem`
        : "No synced solve yet, start in Practice Arena to unlock the roadmap",
    },
  ];
  const solvesRemainingForNode = Math.max(activeSolveTarget - activeNodeSync.solvedCount, 0);
  const syncStatusLabel = !isSignedIn
    ? "Local memory"
    : isSyncing
      ? "Syncing now"
      : syncError
        ? "Needs retry"
        : "Cloud synced";
  const signalSnapshotCards = [
    {
      label: "Unlocked path",
      value: `${unlockedCount}/${roadmapNodes.length}`,
      note: nextNode
        ? `${nextNode.step} opens after ${Math.max(1, solvesRemainingForNode)} more solved reps`
        : "Every roadmap layer is already open now",
    },
    {
      label: "Focus node",
      value: activeNode.step,
      note: activeNode.title,
    },
    {
      label: "Sync rail",
      value: syncStatusLabel,
      note: syncError ? "Practice sync needs one more pass." : "Progress is feeding the roadmap live.",
    },
  ];
  const weeklySupportCards = [
    {
      label: "Solve target",
      value: `${activeNodeSync.solvedCount}/${activeSolveTarget}`,
      note:
        solvesRemainingForNode > 0
          ? `${solvesRemainingForNode} more solved questions unlock the next layer`
          : "Target cleared. You can push the next unlocked node now.",
    },
    {
      label: "Streak rhythm",
      value: `${practiceStreak}d`,
      note:
        practiceStreak > 0
          ? "Keep the chain alive with one deliberate solved set today."
          : "Start a small daily solve rhythm to build recall speed.",
    },
    {
      label: "Next unlock",
      value: nextNode ? nextNode.step : "Done",
      note: nextNode ? nextNode.title : "The roadmap is fully unlocked now.",
    },
  ];

  const selectNode = (index: number) => {
    if (index > unlockedUntil) {
      return;
    }

    setRoadmapState((current) => ({
      ...current,
      activeNodeId: roadmapNodes[index]?.id ?? roadmapNodes[0]?.id ?? "",
    }));
  };

  const focusRecommendedNode = () => {
    setRoadmapState((current) => {
      const nextRecommendedId = roadmapNodes[recommendedActiveIndex]?.id ?? roadmapNodes[0]?.id ?? "";
      if (current.activeNodeId === nextRecommendedId) {
        return current;
      }

      return {
        activeNodeId: nextRecommendedId,
      };
    });
  };

  const resetRoadmap = () => {
    try {
      window.localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn("Unable to clear DSA roadmap progress", error);
    }

    setRoadmapState({
      activeNodeId: roadmapNodes[0]?.id ?? "",
    });
  };

  return (
    <div className="relative min-h-full bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-6rem] top-0 h-[28rem] w-[28rem] rounded-full bg-fuchsia-500/10 blur-[170px]" />
        <div className="absolute right-[-4rem] top-[8rem] h-[24rem] w-[24rem] rounded-full bg-cyan-500/10 blur-[160px]" />
        <div className="absolute bottom-[-8rem] left-1/3 h-[22rem] w-[22rem] rounded-full bg-amber-400/8 blur-[150px]" />
      </div>

      <div className="relative mx-auto max-w-[1520px] space-y-5 px-4 py-4 sm:px-5 lg:px-6">
        <section className="relative overflow-hidden rounded-[1.85rem] border border-white/10 bg-[#090d16]/88 p-5 shadow-[0_28px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl lg:p-6">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent_34%),radial-gradient(circle_at_top_left,rgba(255,255,255,0.05),transparent_30%)]" />
          <div className={`pointer-events-none absolute -left-16 top-0 h-48 w-48 rounded-full bg-gradient-to-br ${activeNode.glow} blur-3xl`} />
          <div className="pointer-events-none absolute right-0 top-0 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

          <div className="relative grid gap-4 lg:grid-cols-[minmax(0,1fr)_270px]">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-200">
                  <Sparkle size={13} weight="duotone" className="text-cyan-300" />
                  DSA Roadmap
                </div>
                <span className="rounded-full border border-cyan-400/15 bg-cyan-500/[0.08] px-3 py-1.5 text-[10px] font-semibold text-cyan-100">
                  {isSignedIn
                    ? isSyncing
                      ? "Syncing"
                      : syncError
                        ? "Sync issue"
                        : "Cloud synced"
                    : "Saved in browser"}
                </span>
              </div>

              <div className="space-y-2.5">
                <h1 className="font-display text-[clamp(1.85rem,3vw,2.85rem)] font-black leading-[0.96] tracking-[-0.05em] text-white">
                  DSA roadmap
                </h1>
                <p className="max-w-2xl text-[14px] leading-6 text-zinc-300">
                  See what to study now, how much is done, and what opens next.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  {
                    label: "Completed",
                    value: `${completedCount}/${roadmapNodes.length}`,
                    note: `${progressPercent}% roadmap`,
                  },
                  {
                    label: "Solved",
                    value: `${practiceSolvedCount}`,
                    note: `${practiceAttemptedCount} attempts`,
                  },
                  {
                    label: "Modules",
                    value: `${completedModules}/${totalModules}`,
                    note: `${trackedModules} touched`,
                  },
                  {
                    label: "Streak",
                    value: `${practiceStreak}d`,
                    note: `${interviewReadiness}% ready`,
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-[1.2rem] border border-white/10 bg-white/[0.04] p-4"
                  >
                    <p className="text-[1.6rem] font-black tracking-tight text-white">{stat.value}</p>
                    <p className="mt-1.5 text-sm font-semibold text-zinc-100">{stat.label}</p>
                    <p className="mt-1 text-xs leading-5 text-zinc-400">{stat.note}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">Current step</p>
              <p className="mt-2 text-[1.2rem] font-black leading-[1.12] tracking-tight text-white">{activeNode.title}</p>
              <p className="mt-2 text-sm leading-6 text-zinc-300">{activeNode.subtitle}</p>

              <div className="mt-4 space-y-3 rounded-[1.1rem] border border-white/10 bg-black/20 p-3.5">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-zinc-400">State</span>
                  <span className="font-semibold text-white">{activeNodeStateLabel}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-zinc-400">Progress</span>
                  <span className="font-semibold text-white">
                    {activeNodeSync.solvedCount}/{activeSolveTarget}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-zinc-400">Next unlock</span>
                  <span className="font-semibold text-right text-white">
                    {nextNode ? nextNode.step : "Done"}
                  </span>
                </div>
              </div>

              <Link
                href="/practice"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition-all hover:-translate-y-0.5 hover:bg-zinc-100"
              >
                Open Practice
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.12fr)_400px]">
          <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#090d16]/84 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <div className="pointer-events-none absolute left-0 top-24 h-48 w-48 rounded-full bg-cyan-500/8 blur-3xl" />

            <div className="relative space-y-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-500">Roadmap flight deck</p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight text-white">Unlock the path in the right order</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                    Every node is built to feel like a real stage, not a random topic list. Move forward only when the current layer feels stable enough to solve under pressure.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "Completed", tone: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200" },
                    { label: "Current", tone: "border-violet-400/20 bg-violet-500/10 text-violet-100" },
                    { label: "Unlocked", tone: "border-cyan-400/20 bg-cyan-500/10 text-cyan-100" },
                    { label: "Locked", tone: "border-white/10 bg-white/[0.03] text-zinc-400" },
                  ].map((item) => (
                    <span
                      key={item.label}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${item.tone}`}
                    >
                      {item.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-5">
                {roadmapNodes.map((node, index) => {
                  const nodeSync = syncedRoadmapProgress[node.id];
                  const state = getNodeState(node.id, index, activeIndex, unlockedUntil, completedSet);
                  const isCompleted = state === "completed";
                  const isCurrent = state === "current";
                  const isLocked = state === "locked";
                  const bottomFill =
                    index < highestCompletedIndex ? "100%" : index === activeIndex ? "56%" : "0%";
                  const stateLabel =
                    state === "completed"
                      ? "Completed"
                      : state === "current"
                        ? "Current node"
                        : state === "unlocked"
                          ? "Unlocked"
                          : "Locked";

                  return (
                    <motion.button
                      key={node.id}
                      type="button"
                      onClick={() => selectNode(index)}
                      whileHover={isLocked ? undefined : { y: -4, scale: 1.005 }}
                      transition={{ type: "spring", stiffness: 240, damping: 20 }}
                      className={`group relative w-full rounded-[1.8rem] border p-4 text-left transition-all duration-300 md:p-5 ${
                        isCurrent
                          ? "border-violet-400/25 bg-violet-500/[0.08] shadow-[0_18px_55px_rgba(88,28,135,0.25)]"
                          : isCompleted
                            ? "border-emerald-400/20 bg-emerald-500/[0.06]"
                            : isLocked
                              ? "border-white/8 bg-white/[0.02] opacity-75"
                              : "border-white/10 bg-white/[0.035] hover:border-cyan-400/20 hover:bg-white/[0.05]"
                      }`}
                    >
                      <div
                        className={`pointer-events-none absolute inset-0 rounded-[1.8rem] bg-gradient-to-br ${node.glow} opacity-0 transition-opacity duration-500 ${
                          isCurrent || isCompleted ? "opacity-100" : "group-hover:opacity-100"
                        }`}
                      />
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                      <div className="relative flex gap-4 md:gap-5">
                        <div className="relative flex w-14 shrink-0 justify-center pt-2">
                          {index > 0 ? (
                            <div className="absolute left-1/2 top-0 h-4 w-[4px] -translate-x-1/2 rounded-full bg-white/8" />
                          ) : null}
                          {index < roadmapNodes.length - 1 ? (
                            <div className="absolute bottom-0 left-1/2 top-[4.4rem] w-[4px] -translate-x-1/2 rounded-full bg-white/8">
                              <div
                                className="absolute inset-x-0 top-0 rounded-full bg-gradient-to-b from-cyan-400 via-violet-400 to-fuchsia-400 transition-all duration-500"
                                style={{ height: bottomFill }}
                              />
                            </div>
                          ) : null}

                          <div
                            className={`relative mt-1 flex h-14 w-14 items-center justify-center rounded-[1.35rem] border backdrop-blur-xl transition-all duration-300 ${
                              isCompleted
                                ? "border-emerald-400/25 bg-emerald-500/12 text-emerald-100 shadow-[0_0_35px_rgba(16,185,129,0.18)]"
                                : isCurrent
                                  ? "border-violet-400/30 bg-violet-500/14 text-violet-50 shadow-[0_0_35px_rgba(139,92,246,0.22)]"
                                  : isLocked
                                    ? "border-white/10 bg-black/20 text-zinc-500"
                                    : "border-cyan-400/20 bg-cyan-500/10 text-cyan-100"
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="h-6 w-6" />
                            ) : isLocked ? (
                              <Lock className="h-5 w-5" />
                            ) : (
                              <node.Icon size={24} weight={isCurrent ? "duotone" : "regular"} />
                            )}
                            <span className="absolute -bottom-2 rounded-full border border-white/10 bg-[#0a0f19] px-2 py-0.5 text-[10px] font-bold tracking-[0.18em] text-zinc-400">
                              {node.step}
                            </span>
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="max-w-2xl">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${getDifficultyTone(node.difficulty)}`}
                                >
                                  {node.difficulty}
                                </span>
                                <span
                                  className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${
                                    isCompleted
                                      ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
                                      : isCurrent
                                        ? "border-violet-400/20 bg-violet-500/10 text-violet-100"
                                        : isLocked
                                          ? "border-white/10 bg-white/[0.03] text-zinc-500"
                                          : "border-cyan-400/20 bg-cyan-500/10 text-cyan-100"
                                  }`}
                                >
                                  {stateLabel}
                                </span>
                                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-semibold text-zinc-400">
                                  {nodeSync.solvedCount}/{nodeSync.solveTarget} solved
                                </span>
                              </div>

                              <h3 className="mt-4 text-2xl font-black tracking-tight text-white md:text-[1.75rem]">
                                {node.title}
                              </h3>
                              <p className="mt-2 text-sm font-semibold text-zinc-200">{node.subtitle}</p>
                              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
                                {node.description}
                              </p>
                            </div>

                            <div className="rounded-[1.3rem] border border-white/10 bg-black/20 px-4 py-3">
                              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                                Sprint frame
                              </p>
                              <p className="mt-2 text-sm font-semibold text-white">{node.sprint}</p>
                              <p className="mt-1 text-xs leading-5 text-zinc-400">
                                {nodeSync.solvedModuleCount}/{node.modules.length} modules solved from live practice
                              </p>
                            </div>
                          </div>

                          <div className="mt-5 flex flex-wrap gap-2.5">
                            {node.modules.map((module) => (
                              <span
                                key={module}
                                className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                                  isLocked
                                    ? "border-white/8 bg-white/[0.02] text-zinc-500"
                                    : "border-white/10 bg-white/[0.05] text-zinc-200"
                                }`}
                              >
                                {module}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </section>

          <aside className="space-y-6 xl:sticky xl:top-5 xl:self-start">
            <AnimatePresence mode="wait">
              <motion.section
                key={activeNode.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#090d16]/84 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl"
              >
                <div className={`pointer-events-none absolute -right-10 top-0 h-40 w-40 rounded-full bg-gradient-to-br ${activeNode.glow} blur-3xl`} />
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                <div className="relative">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-400">
                        <RocketLaunch size={14} weight="duotone" />
                        Node command center
                      </div>
                      <h3 className="mt-4 text-2xl font-black tracking-tight text-white">{activeNode.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-zinc-400">{activeNode.description}</p>
                    </div>

                    <div
                      className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full border border-white/10 p-2"
                      style={{
                        background: `conic-gradient(${activeNode.ringColor} 0% ${currentMomentum}%, rgba(255,255,255,0.08) ${currentMomentum}% 100%)`,
                      }}
                    >
                      <div className="flex h-full w-full flex-col items-center justify-center rounded-full border border-white/10 bg-[#090d16]">
                        <p className="text-xl font-black tracking-tight text-white">{currentMomentum}%</p>
                        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-500">Sync</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[1.3rem] border border-white/10 bg-black/20 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Stage</p>
                      <p className="mt-2 text-sm font-semibold text-white">{activeNode.step}</p>
                      <p className="mt-1 text-xs text-zinc-400">{activeNodeStateLabel}</p>
                    </div>
                    <div className="rounded-[1.3rem] border border-white/10 bg-black/20 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Difficulty</p>
                      <p className="mt-2 text-sm font-semibold text-white">{activeNode.difficulty}</p>
                      <p className="mt-1 text-xs text-zinc-400">{activeNode.sprint}</p>
                    </div>
                    <div className="rounded-[1.3rem] border border-white/10 bg-black/20 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Solve load</p>
                      <p className="mt-2 text-sm font-semibold text-white">{activeNode.practice}</p>
                      <p className="mt-1 text-xs text-zinc-400">{activeNode.modules.length} focused modules</p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Module stack</p>
                        <p className="mt-2 text-sm font-semibold text-white">What you should touch inside this node</p>
                      </div>
                      <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-zinc-300">
                        {activeNodeSync.solvedModuleCount}/{activeNode.modules.length} solved
                      </div>
                    </div>

                    <div className="mt-4 space-y-2.5">
                      {activeNodeSync.moduleStates.map((moduleState, index) => {
                        const isSolved = moduleState.hasSolved;
                        const isTracked = moduleState.hasTracked;

                        return (
                          <div
                            key={moduleState.label}
                            className={`flex items-center justify-between gap-3 rounded-[1.15rem] border px-3 py-3 ${
                              isSolved
                                ? "border-emerald-400/15 bg-emerald-500/[0.06]"
                                : isTracked
                                  ? "border-amber-400/15 bg-amber-500/[0.06]"
                                  : "border-white/8 bg-white/[0.02]"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
                                  isSolved
                                    ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
                                    : isTracked
                                      ? "border-amber-400/20 bg-amber-500/10 text-amber-100"
                                      : "border-white/10 bg-black/20 text-zinc-500"
                                }`}
                              >
                                {isSolved ? (
                                  <CheckCircle2 className="h-4 w-4" />
                                ) : isTracked ? (
                                  <RotateCcw className="h-4 w-4" />
                                ) : (
                                  <Lock className="h-4 w-4" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-white">{moduleState.label}</p>
                                <p className="text-xs text-zinc-400">
                                  {isSolved
                                    ? "Solved questions are already mapped here"
                                    : isTracked
                                      ? "Attempts are synced here, now convert them into solves"
                                      : "Still waiting for its first synced practice hit"}
                                </p>
                              </div>
                            </div>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                              {isSolved
                                ? `${moduleState.solvedCount} solved`
                                : isTracked
                                  ? `${moduleState.attemptedCount} attempts`
                                  : `0${index + 1}`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      href="/practice"
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition-all hover:-translate-y-0.5 hover:bg-zinc-100"
                    >
                      Open practice and sync solves
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={focusRecommendedNode}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-zinc-200 transition-all hover:border-white/20 hover:bg-white/[0.06]"
                    >
                      Focus next unlocked
                    </button>
                    <button
                      type="button"
                      onClick={resetRoadmap}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-zinc-200 transition-all hover:border-white/20 hover:bg-white/[0.06]"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Reset focus
                    </button>
                  </div>
                </div>
              </motion.section>
            </AnimatePresence>

            <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#090d16]/84 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] border border-white/10 bg-white/[0.04] text-cyan-100">
                  <Sparkle size={20} weight="duotone" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">Mastery checklist</p>
                  <h3 className="mt-1 text-xl font-black tracking-tight text-white">What makes this node truly done</h3>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {activeNode.checkpoints.map((checkpoint, index) => (
                  <motion.div
                    key={checkpoint}
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="rounded-[1.3rem] border border-white/10 bg-white/[0.03] p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-cyan-100">
                        <Target size={18} weight="duotone" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Checkpoint {index + 1}</p>
                        <p className="mt-1 text-sm leading-6 text-zinc-400">{checkpoint}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Link
                  href="/practice"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-zinc-100 transition-all hover:border-cyan-400/20 hover:text-cyan-200"
                >
                  Practice set
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/ai-assistant"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-zinc-100 transition-all hover:border-violet-400/20 hover:text-violet-100"
                >
                  Ask AI
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </section>
          </aside>
        </div>

        <section className="grid items-start gap-6 xl:grid-cols-[1.15fr_0.95fr_0.9fr]">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#090d16]/84 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] border border-white/10 bg-white/[0.04] text-cyan-100">
                <ChartLineUp size={20} weight="duotone" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">Signal board</p>
                <h3 className="mt-1 text-xl font-black tracking-tight text-white">Interview confidence by layer</h3>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {signalBars.map((signal, index) => (
                <motion.div
                  key={signal.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                  className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-white">{signal.label}</p>
                      <p className="mt-1 text-xs leading-5 text-zinc-400">{signal.detail}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black tracking-tight text-white">{signal.value}%</p>
                    </div>
                  </div>

                  <div className="mt-4 h-3 rounded-full bg-white/8">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${signal.value}%` }}
                      transition={{ duration: 0.7, ease: "easeOut", delay: index * 0.05 }}
                      className={`h-full rounded-full bg-gradient-to-r ${signal.tone}`}
                    />
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-5">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Orbit snapshot</p>
                    <p className="mt-2 text-sm font-semibold text-white">Keep the lower lane dense and readable</p>
                  </div>
                  <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-zinc-300">
                    {interviewReadiness}% ready
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
                  {signalSnapshotCards.map((card) => (
                    <div
                      key={card.label}
                      className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4"
                    >
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">{card.label}</p>
                      <p className="mt-2 text-lg font-black tracking-tight text-white">{card.value}</p>
                      <p className="mt-2 text-xs leading-5 text-zinc-400">{card.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#090d16]/84 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] border border-white/10 bg-white/[0.04] text-violet-100">
                <RocketLaunch size={20} weight="duotone" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">Weekly execution lane</p>
                <h3 className="mt-1 text-xl font-black tracking-tight text-white">How to attack this node this week</h3>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {weeklySprint.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.06 }}
                  className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">{item.label}</p>
                      <p className="mt-2 text-base font-semibold text-white">{item.title}</p>
                      <p className="mt-2 text-sm leading-6 text-zinc-400">{item.note}</p>
                    </div>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-zinc-200">
                      <Timer size={18} weight="duotone" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-5">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-amber-100">
                    <FireSimple size={18} weight="duotone" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Week support</p>
                    <p className="mt-1 text-sm font-semibold text-white">Three cues that keep this sprint moving</p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {weeklySupportCards.map((card) => (
                    <div
                      key={card.label}
                      className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">{card.label}</p>
                          <p className="mt-2 text-lg font-black tracking-tight text-white">{card.value}</p>
                          <p className="mt-2 text-xs leading-5 text-zinc-400">{card.note}</p>
                        </div>
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-200">
                          {card.label === "Solve target" ? (
                            <Target size={17} weight="duotone" />
                          ) : card.label === "Streak rhythm" ? (
                            <FireSimple size={17} weight="duotone" />
                          ) : (
                            <Lightning size={17} weight="duotone" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#090d16]/84 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] border border-white/10 bg-white/[0.04] text-amber-100">
                  <SealCheck size={20} weight="duotone" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">Execution rules</p>
                  <h3 className="mt-1 text-xl font-black tracking-tight text-white">What keeps the roadmap honest</h3>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {executionRules.map((rule, index) => (
                  <div
                    key={rule}
                    className="rounded-[1.3rem] border border-white/10 bg-white/[0.03] p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-amber-100">
                        <span className="text-sm font-black">{index + 1}</span>
                      </div>
                      <p className="text-sm leading-6 text-zinc-300">{rule}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#090d16]/84 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] border border-white/10 bg-white/[0.04] text-fuchsia-100">
                  <Sparkle size={20} weight="duotone" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">Recent unlock</p>
                  <h3 className="mt-1 text-xl font-black tracking-tight text-white">
                    {recentCompletedNode ? recentCompletedNode.title : "No node cleared yet"}
                  </h3>
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-zinc-400">
                {recentCompletedNode
                  ? `${recentCompletedNode.practice} moved into your permanent orbit. Keep one revision loop alive while you push the next node.`
                  : "Start with the first node, clear the base, and the roadmap will begin unlocking itself in a clean order."}
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Unlocked band</p>
                  <p className="mt-2 text-2xl font-black tracking-tight text-white">{unlockedCount}</p>
                  <p className="mt-1 text-xs text-zinc-400">Nodes now open for focus</p>
                </div>
                <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Revision power</p>
                  <p className="mt-2 text-2xl font-black tracking-tight text-white">{reviewPower}%</p>
                  <p className="mt-1 text-xs text-zinc-400">Memory hold across solved layers</p>
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </div>
  );
}
