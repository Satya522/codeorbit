import "server-only";

import { readdir, readFile } from "fs/promises";
import path from "path";
import type {
  PracticeCatalogFilters,
  PracticeCatalogQuery,
  PracticeDifficulty,
  PracticePlatform,
  PracticePlatformInfo,
  PracticeQuestionDetail,
  PracticeQuestionLink,
  PracticeQuestionLinkRecord,
  PracticeQuestionSummary,
} from "@/lib/types/question-catalog";

export const CANONICAL_DSA_TOPICS = [
  "Array",
  "String",
  "Hash Table",
  "Math",
  "Dynamic Programming",
  "Sorting",
  "Greedy",
  "Binary Search",
  "Depth-First Search",
  "Breadth-First Search",
  "Tree",
  "Binary Tree",
  "Binary Search Tree",
  "Graph",
  "Graph Theory",
  "Shortest Path",
  "Topological Sort",
  "Union-Find",
  "Heap",
  "Stack",
  "Queue",
  "Monotonic Stack",
  "Monotonic Queue",
  "Linked List",
  "Doubly-Linked List",
  "Two Pointers",
  "Sliding Window",
  "Prefix Sum",
  "Matrix",
  "Simulation",
  "Counting",
  "Backtracking",
  "Recursion",
  "Divide and Conquer",
  "Trie",
  "Bit Manipulation",
  "Bitmask",
  "Segment Tree",
  "Binary Indexed Tree",
  "Ordered Set",
  "Enumeration",
  "Memoization",
  "Combinatorics",
  "Number Theory",
  "Geometry",
  "String Matching",
  "Rolling Hash",
  "Design",
  "Database",
  "Interactive",
  "Data Stream",
  "Game Theory",
  "Randomized",
  "Counting Sort",
  "Merge Sort",
  "Iterator",
] as const;

const PLATFORM_ORDER: Record<string, number> = {
  leetcode: 0,
  hackerrank: 1,
  gfg: 2,
  codingninjas: 3,
  code360: 4,
};

const DIFFICULTY_ORDER: Record<PracticeDifficulty, number> = {
  Easy: 0,
  Medium: 1,
  Hard: 2,
};

const PLATFORM_META: Record<string, { displayName: string; fallbackLabel: string }> = {
  code360: { displayName: "Code360", fallbackLabel: "C360" },
  codingninjas: { displayName: "Coding Ninjas", fallbackLabel: "CN" },
  gfg: { displayName: "GeeksforGeeks", fallbackLabel: "GFG" },
  hackerrank: { displayName: "HackerRank", fallbackLabel: "HR" },
  leetcode: { displayName: "LeetCode", fallbackLabel: "LC" },
};

export const TOPIC_ALIAS_MAP: Record<string, string> = {
  "array": "Array",
  "arrays": "Array",
  "array and string": "Array",
  "array/string": "Array",
  "string": "String",
  "strings": "String",
  "string algorithms": "String",
  "text": "String",
  "hash table": "Hash Table",
  "hash tables": "Hash Table",
  "hashing": "Hash Table",
  "map": "Hash Table",
  "maps": "Hash Table",
  "dictionary": "Hash Table",
  "unordered map": "Hash Table",
  "math": "Math",
  "mathematics": "Math",
  "basic math": "Math",
  "algebra": "Math",
  "dp": "Dynamic Programming",
  "dynamic programming": "Dynamic Programming",
  "dynamic-programming": "Dynamic Programming",
  "sorting": "Sorting",
  "sort": "Sorting",
  "sorted": "Sorting",
  "greedy": "Greedy",
  "greedy algorithms": "Greedy",
  "greedy algorithm": "Greedy",
  "binary search": "Binary Search",
  "binary-search": "Binary Search",
  "bs": "Binary Search",
  "dfs": "Depth-First Search",
  "depth first search": "Depth-First Search",
  "depth-first search": "Depth-First Search",
  "bfs": "Breadth-First Search",
  "breadth first search": "Breadth-First Search",
  "breadth-first search": "Breadth-First Search",
  "tree": "Tree",
  "trees": "Tree",
  "binary tree": "Binary Tree",
  "binary trees": "Binary Tree",
  "bt": "Binary Tree",
  "binary search tree": "Binary Search Tree",
  "binary search trees": "Binary Search Tree",
  "bst": "Binary Search Tree",
  "graph": "Graph",
  "graphs": "Graph",
  "graph theory": "Graph Theory",
  "shortest path": "Shortest Path",
  "shortest paths": "Shortest Path",
  "dijkstra": "Shortest Path",
  "bellman ford": "Shortest Path",
  "floyd warshall": "Shortest Path",
  "topological sort": "Topological Sort",
  "toposort": "Topological Sort",
  "topological sorting": "Topological Sort",
  "union find": "Union-Find",
  "union-find": "Union-Find",
  "disjoint set": "Union-Find",
  "disjoint set union": "Union-Find",
  "dsu": "Union-Find",
  "heap": "Heap",
  "heaps": "Heap",
  "priority queue": "Heap",
  "priority queues": "Heap",
  "heap (priority queue)": "Heap",
  "stack": "Stack",
  "stacks": "Stack",
  "queue": "Queue",
  "queues": "Queue",
  "monotonic stack": "Monotonic Stack",
  "monotonic queue": "Monotonic Queue",
  "linked list": "Linked List",
  "linked lists": "Linked List",
  "linkedlist": "Linked List",
  "ll": "Linked List",
  "singly linked list": "Linked List",
  "doubly linked list": "Doubly-Linked List",
  "doubly-linked list": "Doubly-Linked List",
  "dll": "Doubly-Linked List",
  "two pointers": "Two Pointers",
  "two pointer": "Two Pointers",
  "2 pointers": "Two Pointers",
  "sliding window": "Sliding Window",
  "window": "Sliding Window",
  "prefix sum": "Prefix Sum",
  "prefix sums": "Prefix Sum",
  "prefix-sum": "Prefix Sum",
  "cumulative sum": "Prefix Sum",
  "matrix": "Matrix",
  "matrices": "Matrix",
  "2d array": "Matrix",
  "grid": "Matrix",
  "grids": "Matrix",
  "simulation": "Simulation",
  "simulate": "Simulation",
  "counting": "Counting",
  "frequency counting": "Counting",
  "backtracking": "Backtracking",
  "backtrack": "Backtracking",
  "recursion": "Recursion",
  "recursive": "Recursion",
  "divide and conquer": "Divide and Conquer",
  "divide-and-conquer": "Divide and Conquer",
  "trie": "Trie",
  "prefix tree": "Trie",
  "bit manipulation": "Bit Manipulation",
  "bitwise": "Bit Manipulation",
  "bitwise operations": "Bit Manipulation",
  "bit magic": "Bit Manipulation",
  "bitmask": "Bitmask",
  "bitmasks": "Bitmask",
  "segment tree": "Segment Tree",
  "segment trees": "Segment Tree",
  "binary indexed tree": "Binary Indexed Tree",
  "fenwick tree": "Binary Indexed Tree",
  "bit": "Binary Indexed Tree",
  "ordered set": "Ordered Set",
  "ordered sets": "Ordered Set",
  "balanced bst": "Ordered Set",
  "enumeration": "Enumeration",
  "bruteforce": "Enumeration",
  "brute force": "Enumeration",
  "memoization": "Memoization",
  "memoisation": "Memoization",
  "combinatorics": "Combinatorics",
  "ncr": "Combinatorics",
  "permutations and combinations": "Combinatorics",
  "number theory": "Number Theory",
  "prime": "Number Theory",
  "gcd": "Number Theory",
  "lcm": "Number Theory",
  "modular arithmetic": "Number Theory",
  "geometry": "Geometry",
  "computational geometry": "Geometry",
  "string matching": "String Matching",
  "pattern matching": "String Matching",
  "kmp": "String Matching",
  "z algorithm": "String Matching",
  "rolling hash": "Rolling Hash",
  "rabin karp": "Rolling Hash",
  "design": "Design",
  "system design": "Design",
  "data structure design": "Design",
  "database": "Database",
  "sql": "Database",
  "db": "Database",
  "interactive": "Interactive",
  "data stream": "Data Stream",
  "stream": "Data Stream",
  "game theory": "Game Theory",
  "randomized": "Randomized",
  "randomised": "Randomized",
  "random": "Randomized",
  "counting sort": "Counting Sort",
  "merge sort": "Merge Sort",
  "iterator": "Iterator",
  "iterators": "Iterator",
};

export const INVALID_TOPIC_PATTERNS = [
  /gfg solution/i,
  /potd/i,
  /problem of the day/i,
  /^\d{4}$/i,
  /^[A-Za-z]+\s+\d{4}$/i,
  /^\d+\s*\([A-Za-z]+\)/i,
  /january|february|march|april|may|june|july|august|september|october|november|december/i,
];

let catalogCache: PracticeQuestionDetail[] | null = null;
let platformIconCache: Map<string, string> | null = null;

function compactKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

const CANONICAL_TOPIC_MAP = new Map<string, string>(
  CANONICAL_DSA_TOPICS.map((topic) => [compactKey(topic), topic])
);

function cleanupListField(value: string | null | undefined) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeDifficulty(raw?: string | null): PracticeDifficulty | null {
  if (!raw) return null;

  const value = raw.trim().toLowerCase();

  if (value === "easy") return "Easy";
  if (value === "medium") return "Medium";
  if (value === "hard") return "Hard";

  return null;
}

function stripTitleNoise(title: string) {
  return title
    .replace(/^\d{1,2}\([^)]+\)\s*/i, "")
    .replace(/^\d{1,2}\s*[-.)]\s*/i, "")
    .replace(/^_+|_+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTitleKey(title: string) {
  return stripTitleNoise(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function slugifyTitle(title: string) {
  return normalizeTitleKey(title).replace(/\s+/g, "-");
}

function normalizePlatformSlug(platform: string) {
  const normalized = platform.trim().toLowerCase().replace(/\s+/g, "");

  if (normalized === "geeksforgeeks" || normalized === "gfg") return "gfg";
  if (normalized === "hackerrank") return "hackerrank";
  if (normalized === "leetcode") return "leetcode";
  if (
    normalized === "codingninjas" ||
    normalized === "codingninja" ||
    normalized === "codingninjasstudio"
  ) {
    return "codingninjas";
  }
  if (normalized === "code360") return "code360";

  return normalized;
}

function buildFallbackLabel(slug: string) {
  const meta = PLATFORM_META[slug];
  if (meta) {
    return meta.fallbackLabel;
  }

  return (
    slug
      .split(/[^a-z0-9]+/i)
      .filter(Boolean)
      .map((chunk) => chunk.slice(0, 1).toUpperCase())
      .join("")
      .slice(0, 3) || "PLT"
  );
}

async function loadPlatformIconMap() {
  if (platformIconCache) {
    return platformIconCache;
  }

  const directoryPath = path.join(process.cwd(), "public", "platforms");
  const files = await readdir(directoryPath, { withFileTypes: true }).catch(() => []);
  const iconMap = new Map<string, string>();

  for (const file of files) {
    if (!file.isFile()) {
      continue;
    }

    const parsed = path.parse(file.name);
    iconMap.set(parsed.name.toLowerCase(), `/platforms/${file.name}`);
  }

  platformIconCache = iconMap;
  return iconMap;
}

async function resolvePlatformInfo(platform: PracticePlatform): Promise<PracticePlatformInfo> {
  const rawSlug = normalizePlatformSlug(platform);
  const iconMap = await loadPlatformIconMap();
  const candidates =
    rawSlug === "gfg"
      ? ["gfg", "geeksforgeeks"]
      : rawSlug === "codingninjas"
        ? ["codingninjas", "codingninja"]
        : rawSlug === "code360"
          ? ["code360", "codingninjas", "codingninja"]
          : [rawSlug];

  let resolvedSlug = rawSlug;
  let iconSrc: string | null = null;

  for (const candidate of candidates) {
    const matched = iconMap.get(candidate);
    if (matched) {
      iconSrc = matched;
      resolvedSlug = candidate === "codingninja" ? "codingninjas" : candidate;
      break;
    }
  }

  if (rawSlug === "code360" && !iconSrc) {
    resolvedSlug = "codingninjas";
  }

  const meta = PLATFORM_META[resolvedSlug] ?? {
    displayName: platform,
    fallbackLabel: buildFallbackLabel(resolvedSlug),
  };

  return {
    displayName: meta.displayName,
    fallbackLabel: meta.fallbackLabel,
    iconSrc,
    slug: rawSlug === "code360" ? "code360" : resolvedSlug,
  };
}

export function normalizeTopic(raw?: string | null): string | null {
  if (!raw) return null;

  const value = raw
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

  for (const pattern of INVALID_TOPIC_PATTERNS) {
    if (pattern.test(value)) return null;
  }

  if (TOPIC_ALIAS_MAP[value]) {
    return TOPIC_ALIAS_MAP[value];
  }

  return CANONICAL_TOPIC_MAP.get(compactKey(value)) ?? null;
}

export function normalizeTopics(rawTopics: Array<string | null | undefined>): string[] {
  const out = new Set<string>();

  for (const raw of rawTopics) {
    if (!raw) continue;

    const parts = raw
      .split(/[|,/>&]+/)
      .map((part) => part.trim())
      .filter(Boolean);

    for (const part of parts) {
      const normalized = normalizeTopic(part);
      if (normalized) out.add(normalized);
    }
  }

  return Array.from(out);
}

export const TITLE_KEYWORD_TOPIC_MAP: Array<[RegExp, string]> = [
  [/\barray|subarray|prefix\b/i, "Array"],
  [/\bstring|substring|palindrome|anagram\b/i, "String"],
  [/\bhash|map|dictionary|frequency\b/i, "Hash Table"],
  [/\bdp|dynamic programming\b/i, "Dynamic Programming"],
  [/\bsort|sorted|merge sort|counting sort\b/i, "Sorting"],
  [/\bgreedy\b/i, "Greedy"],
  [/\bbinary search\b/i, "Binary Search"],
  [/\bdfs|depth first\b/i, "Depth-First Search"],
  [/\bbfs|breadth first\b/i, "Breadth-First Search"],
  [/\btree\b/i, "Tree"],
  [/\bbinary tree\b/i, "Binary Tree"],
  [/\bbst|binary search tree\b/i, "Binary Search Tree"],
  [/\bgraph|graphs\b/i, "Graph"],
  [/\bshortest path|dijkstra|bellman|floyd\b/i, "Shortest Path"],
  [/\btopological\b/i, "Topological Sort"],
  [/\bunion find|disjoint set|dsu\b/i, "Union-Find"],
  [/\bheap|priority queue\b/i, "Heap"],
  [/\bstack\b/i, "Stack"],
  [/\bqueue\b/i, "Queue"],
  [/\bmonotonic stack\b/i, "Monotonic Stack"],
  [/\bmonotonic queue\b/i, "Monotonic Queue"],
  [/\blinked list\b/i, "Linked List"],
  [/\bdoubly linked list\b/i, "Doubly-Linked List"],
  [/\btwo pointers|two pointer\b/i, "Two Pointers"],
  [/\bsliding window\b/i, "Sliding Window"],
  [/\bprefix sum\b/i, "Prefix Sum"],
  [/\bmatrix|grid\b/i, "Matrix"],
  [/\bsimulat/i, "Simulation"],
  [/\bcount\b/i, "Counting"],
  [/\bbacktracking|backtrack\b/i, "Backtracking"],
  [/\brecursion|recursive\b/i, "Recursion"],
  [/\bdivide and conquer\b/i, "Divide and Conquer"],
  [/\btrie|prefix tree\b/i, "Trie"],
  [/\bbit\b/i, "Bit Manipulation"],
  [/\bbitmask\b/i, "Bitmask"],
  [/\bsegment tree\b/i, "Segment Tree"],
  [/\bfenwick|binary indexed tree\b/i, "Binary Indexed Tree"],
  [/\bordered set\b/i, "Ordered Set"],
  [/\benumeration|brute force|bruteforce\b/i, "Enumeration"],
  [/\bmemoization|memoisation\b/i, "Memoization"],
  [/\bcombinatorics|ncr|permutation|combination\b/i, "Combinatorics"],
  [/\bprime|gcd|lcm|mod\b/i, "Number Theory"],
  [/\bgeometry\b/i, "Geometry"],
  [/\bkmp|z algorithm|pattern matching|string matching\b/i, "String Matching"],
  [/\brolling hash|rabin karp\b/i, "Rolling Hash"],
  [/\bdesign\b/i, "Design"],
  [/\bsql|database\b/i, "Database"],
  [/\binteractive\b/i, "Interactive"],
  [/\bdata stream|stream\b/i, "Data Stream"],
  [/\bgame\b/i, "Game Theory"],
  [/\brandom\b/i, "Randomized"],
  [/\biterator\b/i, "Iterator"],
];

export function inferTopicsFromTitle(title: string): string[] {
  const out = new Set<string>();

  for (const [pattern, topic] of TITLE_KEYWORD_TOPIC_MAP) {
    if (pattern.test(title)) out.add(topic);
  }

  return Array.from(out);
}

export function resolveTopics(params: {
  rawTopics?: Array<string | null | undefined>;
  title: string;
}): string[] {
  const normalized = normalizeTopics(params.rawTopics ?? []);

  if (normalized.length > 0) return normalized;

  const inferred = inferTopicsFromTitle(params.title);
  if (inferred.length > 0) return inferred;

  return [];
}

async function normalizeLink(record: PracticeQuestionLinkRecord): Promise<PracticeQuestionLink> {
  const normalizedTitle = stripTitleNoise(record.title);
  const topics = resolveTopics({
    rawTopics: [record.topic, record.subtopic],
    title: normalizedTitle,
  });

  return {
    canonicalSlug: record.canonical_slug,
    companies: cleanupListField(record.companies),
    difficulty: normalizeDifficulty(record.difficulty),
    externalUrl: record.external_url,
    language: record.language?.trim() || null,
    platform: await resolvePlatformInfo(record.platform),
    sourceCount: record.source_count ?? null,
    sourceRepos: cleanupListField(record.source_repos),
    subtopic: topics[1] ?? null,
    timeBuckets: cleanupListField(record.time_buckets),
    title: normalizedTitle,
    topic: topics[0] ?? null,
  };
}

function pickDisplayTitle(records: PracticeQuestionLinkRecord[]) {
  return [...records]
    .sort((left, right) => {
      const leftPlatform = normalizePlatformSlug(left.platform);
      const rightPlatform = normalizePlatformSlug(right.platform);
      const platformDelta = (PLATFORM_ORDER[leftPlatform] ?? 99) - (PLATFORM_ORDER[rightPlatform] ?? 99);
      if (platformDelta !== 0) return platformDelta;

      const leftTitle = stripTitleNoise(left.title);
      const rightTitle = stripTitleNoise(right.title);
      return leftTitle.length - rightTitle.length || leftTitle.localeCompare(rightTitle);
    })[0];
}

function pickDifficulty(links: PracticeQuestionLink[]): PracticeDifficulty | null {
  const known = links
    .map((link) => link.difficulty)
    .filter((difficulty): difficulty is PracticeDifficulty => Boolean(difficulty))
    .sort((left, right) => DIFFICULTY_ORDER[left] - DIFFICULTY_ORDER[right]);

  return known[0] ?? null;
}

function sortPlatforms(platforms: PracticePlatformInfo[]) {
  return [...platforms].sort((left, right) => {
    const orderDelta = (PLATFORM_ORDER[left.slug] ?? 99) - (PLATFORM_ORDER[right.slug] ?? 99);
    if (orderDelta !== 0) return orderDelta;
    return left.displayName.localeCompare(right.displayName);
  });
}

function toSummary(detail: PracticeQuestionDetail): PracticeQuestionSummary {
  return {
    difficulty: detail.difficulty,
    linkCount: detail.linkCount,
    platforms: detail.platforms,
    primaryTopic: detail.primaryTopic,
    slug: detail.slug,
    title: detail.title,
    topics: detail.topics,
  };
}

async function readPracticeCatalogFile() {
  const filePath = path.join(process.cwd(), "src", "data", "practice-links.json");
  const fileContents = await readFile(filePath, "utf8");
  return JSON.parse(fileContents) as PracticeQuestionLinkRecord[];
}

async function loadPracticeCatalog() {
  if (catalogCache) {
    return catalogCache;
  }

  const records = await readPracticeCatalogFile();
  const groups = new Map<string, PracticeQuestionLinkRecord[]>();

  for (const record of records) {
    const key = normalizeTitleKey(record.title);
    const existing = groups.get(key);

    if (existing) {
      existing.push(record);
    } else {
      groups.set(key, [record]);
    }
  }

  const catalog = await Promise.all(
    [...groups.entries()].map(async ([key, groupRecords]) => {
      const preferredRecord = pickDisplayTitle(groupRecords);
      const normalizedLinks = await Promise.all(groupRecords.map((record) => normalizeLink(record)));
      const links = normalizedLinks.sort((left, right) => {
        const platformDelta = (PLATFORM_ORDER[left.platform.slug] ?? 99) - (PLATFORM_ORDER[right.platform.slug] ?? 99);
        if (platformDelta !== 0) return platformDelta;
        return left.externalUrl.localeCompare(right.externalUrl);
      });

      const uniqueTopics = Array.from(
        new Set(links.flatMap((link) => [link.topic, link.subtopic]).filter((value): value is string => Boolean(value)))
      ).sort((left, right) => left.localeCompare(right));

      const uniquePlatforms = sortPlatforms(
        Array.from(new Map(links.map((link) => [link.platform.slug, link.platform])).values())
      );

      return {
        difficulty: pickDifficulty(links),
        linkCount: links.length,
        links,
        platforms: uniquePlatforms,
        primaryTopic: uniqueTopics[0] ?? null,
        slug: slugifyTitle(preferredRecord.title) || key,
        title: stripTitleNoise(preferredRecord.title),
        topics: uniqueTopics,
      } satisfies PracticeQuestionDetail;
    })
  );

  catalogCache = catalog.sort((left, right) => {
    const titleDelta = left.title.localeCompare(right.title);
    if (titleDelta !== 0) return titleDelta;
    return left.slug.localeCompare(right.slug);
  });

  return catalogCache;
}

export async function getPracticeCatalogFilters(): Promise<PracticeCatalogFilters> {
  const catalog = await loadPracticeCatalog();

  return {
    difficulties: Array.from(
      new Set(
        catalog
          .map((question) => question.difficulty)
          .filter((difficulty): difficulty is PracticeDifficulty => Boolean(difficulty))
      )
    ).sort((left, right) => DIFFICULTY_ORDER[left] - DIFFICULTY_ORDER[right]),
    platforms: sortPlatforms(
      Array.from(
        new Map(catalog.flatMap((question) => question.platforms).map((platform) => [platform.slug, platform])).values()
      )
    ),
    topics: Array.from(new Set(catalog.flatMap((question) => question.topics))).sort((left, right) => left.localeCompare(right)),
  };
}

export async function listPracticeQuestions(query: PracticeCatalogQuery = {}) {
  const catalog = await loadPracticeCatalog();
  const filters = await getPracticeCatalogFilters();
  const search = query.search?.trim().toLowerCase() || "";
  const difficulty = query.difficulty?.trim() || "";
  const topic = query.topic?.trim() || "";
  const platform = query.platform?.trim() || "";

  const questions = catalog.filter((question) => {
    const matchesSearch =
      !search ||
      question.title.toLowerCase().includes(search) ||
      question.topics.some((item) => item.toLowerCase().includes(search)) ||
      question.platforms.some(
        (item) => item.displayName.toLowerCase().includes(search) || item.slug.toLowerCase().includes(search)
      );

    const matchesDifficulty = !difficulty || difficulty === "All" || question.difficulty === difficulty;
    const matchesTopic = !topic || topic === "All" || question.topics.includes(topic);
    const matchesPlatform = !platform || platform === "All" || question.platforms.some((item) => item.slug === platform);

    return matchesSearch && matchesDifficulty && matchesTopic && matchesPlatform;
  });

  return {
    filters,
    questions: questions.map(toSummary),
    total: questions.length,
  };
}

export async function getPracticeQuestionBySlug(slug: string) {
  const catalog = await loadPracticeCatalog();
  return catalog.find((question) => question.slug === slug) ?? null;
}
