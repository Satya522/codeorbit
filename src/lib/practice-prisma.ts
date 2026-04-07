import type { PracticeCatalogFilters, PracticeDifficulty, PracticePlatformInfo, PracticeQuestionDetail, PracticeQuestionLink, PracticeQuestionSummary } from "@/lib/types/question-catalog";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

const PLATFORM_META: Record<string, { displayName: string; fallbackLabel: string; iconSrc: string | null }> = {
  code360: {
    displayName: "Code360",
    fallbackLabel: "C360",
    iconSrc: "/platforms/codingNinja.svg",
  },
  codingninjas: {
    displayName: "Coding Ninjas",
    fallbackLabel: "CN",
    iconSrc: "/platforms/codingNinja.svg",
  },
  gfg: {
    displayName: "GeeksforGeeks",
    fallbackLabel: "GFG",
    iconSrc: "/platforms/gfg.png",
  },
  hackerrank: {
    displayName: "HackerRank",
    fallbackLabel: "HR",
    iconSrc: "/platforms/hackerrank.png",
  },
  leetcode: {
    displayName: "LeetCode",
    fallbackLabel: "LC",
    iconSrc: "/platforms/leetcode.png",
  },
};

export type PracticeQuestionRow = Prisma.ExternalQuestionRefGetPayload<{
  include: {
    _count: {
      select: {
        solutions: true;
      };
    };
  };
}>;

function normalizePlatformSlug(platform: string) {
  const normalized = platform.trim().toLowerCase().replace(/\s+/g, "");

  if (normalized === "geeksforgeeks" || normalized === "gfg") return "gfg";
  if (normalized === "codingninja" || normalized === "codingninjasstudio") return "codingninjas";

  return normalized;
}

function buildFallbackLabel(slug: string) {
  return (
    slug
      .split(/[^a-z0-9]+/i)
      .filter(Boolean)
      .map((chunk) => chunk.slice(0, 1).toUpperCase())
      .join("")
      .slice(0, 3) || "PLT"
  );
}

export function normalizeDifficultyLabel(value?: string | null): PracticeDifficulty | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === "easy") return "Easy";
  if (normalized === "medium") return "Medium";
  if (normalized === "hard") return "Hard";

  return null;
}

function splitTopics(topic?: string | null) {
  if (!topic) {
    return [];
  }

  return Array.from(
    new Set(
      topic
        .split(/[|,/>&]+/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

export function getPlatformInfo(platform: string): PracticePlatformInfo {
  const slug = normalizePlatformSlug(platform);
  const meta = PLATFORM_META[slug] ?? {
    displayName: platform,
    fallbackLabel: buildFallbackLabel(slug),
    iconSrc: null,
  };

  return {
    displayName: meta.displayName,
    fallbackLabel: meta.fallbackLabel,
    iconSrc: meta.iconSrc,
    slug,
  };
}

export function toPracticeSummary(question: PracticeQuestionRow): PracticeQuestionSummary {
  const topics = splitTopics(question.topic);
  const platform = getPlatformInfo(question.platform);

  return {
    difficulty: normalizeDifficultyLabel(question.difficulty),
    linkCount: 1,
    platforms: [platform],
    primaryTopic: topics[0] ?? null,
    slug: question.canonicalSlug,
    title: question.title,
    topics,
  };
}

export function toPracticeDetail(question: PracticeQuestionRow): PracticeQuestionDetail {
  const summary = toPracticeSummary(question);
  const link: PracticeQuestionLink = {
    canonicalSlug: question.canonicalSlug,
    companies: question.companies,
    difficulty: normalizeDifficultyLabel(question.difficulty),
    externalUrl: question.externalUrl ?? "#",
    language: null,
    platform: getPlatformInfo(question.platform),
    sourceCount: null,
    sourceRepos: [],
    subtopic: null,
    timeBuckets: [],
    title: question.title,
    topic: summary.primaryTopic,
  };

  return {
    ...summary,
    links: [link],
  };
}

export async function getDatabasePracticeFilters(): Promise<PracticeCatalogFilters> {
  const [difficultyRows, platformRows, topicRows] = await Promise.all([
    prisma.externalQuestionRef.findMany({
      distinct: ["difficulty"],
      select: { difficulty: true },
    }),
    prisma.externalQuestionRef.findMany({
      distinct: ["platform"],
      select: { platform: true },
    }),
    prisma.externalQuestionRef.findMany({
      distinct: ["topic"],
      select: { topic: true },
    }),
  ]);

  const difficultyOrder: Record<PracticeDifficulty, number> = {
    Easy: 0,
    Medium: 1,
    Hard: 2,
  };

  const difficulties = Array.from(
    new Set(
      difficultyRows
        .map((row) => normalizeDifficultyLabel(row.difficulty))
        .filter((value): value is PracticeDifficulty => Boolean(value)),
    ),
  ).sort((left, right) => difficultyOrder[left] - difficultyOrder[right]);

  const platforms = Array.from(
    new Map(platformRows.map((row) => {
      const info = getPlatformInfo(row.platform);
      return [info.slug, info] as const;
    })).values(),
  ).sort((left, right) => left.displayName.localeCompare(right.displayName));

  const topics = Array.from(
    new Set(
      topicRows.flatMap((row) => splitTopics(row.topic)),
    ),
  ).sort((left, right) => left.localeCompare(right));

  return {
    difficulties,
    platforms,
    topics,
  };
}
