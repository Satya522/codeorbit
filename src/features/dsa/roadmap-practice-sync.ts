"use client";

import type { StoredPracticeProgressMap } from "@/features/practice/practice-progress";

export type RoadmapNodeSyncInput = {
  id: string;
  modules: string[];
};

export type RoadmapModuleSyncProgress = {
  attemptedCount: number;
  hasSolved: boolean;
  hasTracked: boolean;
  label: string;
  solvedCount: number;
};

export type RoadmapNodeSyncProgress = {
  attemptedCount: number;
  completionPercent: number;
  meetsCompletion: boolean;
  moduleStates: RoadmapModuleSyncProgress[];
  solveTarget: number;
  solvedCount: number;
  solvedModuleCount: number;
  trackedCount: number;
  trackedModuleCount: number;
};

type RoadmapNodePracticeMatcher = {
  moduleMatchers: string[][];
  solveTarget: number;
};

const roadmapPracticeMatchers: Record<string, RoadmapNodePracticeMatcher> = {
  "base-layer": {
    solveTarget: 4,
    moduleMatchers: [
      ["java", "python", "sql", "implementation", "fundamentals", "tutorials", "basic"],
      ["math", "algorithms", "sorting", "searching", "search"],
      ["bit manipulation", "simulation", "matrix", "geometry"],
      ["arrays", "strings", "warmup", "datastructures", "data structures"],
    ],
  },
  "linear-patterns": {
    solveTarget: 6,
    moduleMatchers: [
      ["array", "arrays"],
      ["string", "strings"],
      ["two pointers", "two pointer"],
      ["sliding window"],
      ["prefix sum", "counting"],
    ],
  },
  "recursion-links": {
    solveTarget: 5,
    moduleMatchers: [
      ["recursion"],
      ["backtracking"],
      ["linked list", "linkedlist", "linkedlists", "doubly-linked list"],
      ["fast and slow", "cycle", "pointer"],
    ],
  },
  "core-structures": {
    solveTarget: 6,
    moduleMatchers: [
      ["stack", "stacks"],
      ["monotonic stack"],
      ["queue"],
      ["deque"],
      ["hash table", "hashing", "hash map", "hashmap"],
    ],
  },
  "search-sort": {
    solveTarget: 5,
    moduleMatchers: [
      ["binary search"],
      ["sorting", "sort"],
      ["comparator"],
      ["divide and conquer"],
    ],
  },
  "trees-heaps": {
    solveTarget: 7,
    moduleMatchers: [
      ["tree", "binary tree"],
      ["binary search tree", "bst"],
      ["heap"],
      ["priority queue"],
      ["trie", "tries"],
    ],
  },
  graphs: {
    solveTarget: 7,
    moduleMatchers: [
      ["graph", "graphtheory"],
      ["breadth-first search", "bfs"],
      ["depth-first search", "dfs"],
      ["topological sort", "topological"],
      ["shortest path", "dijkstra"],
      ["union find", "dsu", "disjoint set"],
    ],
  },
  "optimization-layer": {
    solveTarget: 8,
    moduleMatchers: [
      ["greedy"],
      ["dynamic programming", "1d dp"],
      ["2d dp", "matrix dp"],
      ["subsequence dp", "memoization"],
      ["knapsack"],
      ["bit manipulation", "bitmask", "bit tricks"],
    ],
  },
  "revision-loop": {
    solveTarget: 10,
    moduleMatchers: [
      ["array", "string", "linked list", "stack", "queue"],
      ["binary search", "sliding window", "heap", "dynamic programming"],
      ["design", "simulation", "implementation"],
      ["recursion", "tree", "graph"],
      ["greedy", "bit manipulation", "union find", "backtracking"],
    ],
  },
};

function normalizeText(value: string) {
  return value.toLowerCase();
}

function buildEntrySearchText(entry: {
  primaryTopic: string | null;
  title: string;
  topics: string[];
}) {
  return normalizeText([entry.title, entry.primaryTopic ?? "", ...entry.topics].join(" "));
}

function getMatcherConfig(node: RoadmapNodeSyncInput): RoadmapNodePracticeMatcher {
  return (
    roadmapPracticeMatchers[node.id] ?? {
      solveTarget: Math.max(4, node.modules.length + 1),
      moduleMatchers: node.modules.map((module) => [normalizeText(module)]),
    }
  );
}

export function buildRoadmapSyncProgress(
  nodes: RoadmapNodeSyncInput[],
  progressMap: StoredPracticeProgressMap,
) {
  const entries = Object.values(progressMap).map((entry) => ({
    ...entry,
    searchText: buildEntrySearchText(entry),
  }));

  return nodes.reduce<Record<string, RoadmapNodeSyncProgress>>((acc, node) => {
    const config = getMatcherConfig(node);
    const matchedEntriesBySlug = new Map<string, (typeof entries)[number]>();

    const moduleStates = node.modules.map((label, index) => {
      const keywords = config.moduleMatchers[index] ?? [normalizeText(label)];
      const matches = entries.filter((entry) => keywords.some((keyword) => entry.searchText.includes(keyword)));

      matches.forEach((entry) => {
        matchedEntriesBySlug.set(entry.slug, entry);
      });

      const solvedCount = matches.filter((entry) => entry.status === "solved").length;
      const attemptedCount = matches.filter((entry) => entry.status === "attempted").length;

      return {
        attemptedCount,
        hasSolved: solvedCount > 0,
        hasTracked: matches.length > 0,
        label,
        solvedCount,
      } satisfies RoadmapModuleSyncProgress;
    });

    const matchedEntries = Array.from(matchedEntriesBySlug.values());
    const solvedCount = matchedEntries.filter((entry) => entry.status === "solved").length;
    const attemptedCount = matchedEntries.filter((entry) => entry.status === "attempted").length;
    const trackedCount = matchedEntries.length;
    const solvedModuleCount = moduleStates.filter((module) => module.hasSolved).length;
    const trackedModuleCount = moduleStates.filter((module) => module.hasTracked).length;
    const moduleTarget = Math.min(node.modules.length, Math.max(2, Math.ceil(node.modules.length * 0.6)));
    const solveRatio = Math.min(solvedCount / Math.max(config.solveTarget, 1), 1);
    const solvedModuleRatio = node.modules.length > 0 ? solvedModuleCount / node.modules.length : 1;
    const trackedModuleRatio = node.modules.length > 0 ? trackedModuleCount / node.modules.length : 1;
    const completionPercent = Math.round(
      Math.min(1, solveRatio * 0.7 + solvedModuleRatio * 0.25 + trackedModuleRatio * 0.05) * 100,
    );

    acc[node.id] = {
      attemptedCount,
      completionPercent,
      meetsCompletion: solvedCount >= config.solveTarget && solvedModuleCount >= moduleTarget,
      moduleStates,
      solveTarget: config.solveTarget,
      solvedCount,
      solvedModuleCount,
      trackedCount,
      trackedModuleCount,
    };

    return acc;
  }, {});
}
