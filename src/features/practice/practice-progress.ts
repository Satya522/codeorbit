"use client";

import type { PracticeDifficulty, PracticeQuestionSummary } from "@/lib/types/question-catalog";

export const practiceProgressStorageKey = "codeorbit:practice:progress:v1";
export const practiceProgressUpdatedEvent = "codeorbit:practice-progress-updated";

export type PracticeProgressStatus = "attempted" | "solved";

export type StoredPracticeQuestionProgress = {
  difficulty: PracticeDifficulty | null;
  primaryTopic: string | null;
  slug: string;
  status: PracticeProgressStatus;
  title: string;
  topics: string[];
  updatedAt: string;
};

export type StoredPracticeProgressMap = Record<string, StoredPracticeQuestionProgress>;

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isStoredPracticeQuestionProgress(value: unknown): value is StoredPracticeQuestionProgress {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<StoredPracticeQuestionProgress>;
  return (
    typeof candidate.slug === "string" &&
    typeof candidate.title === "string" &&
    (candidate.difficulty === null ||
      candidate.difficulty === undefined ||
      candidate.difficulty === "Easy" ||
      candidate.difficulty === "Medium" ||
      candidate.difficulty === "Hard") &&
    (candidate.primaryTopic === null ||
      candidate.primaryTopic === undefined ||
      typeof candidate.primaryTopic === "string") &&
    (candidate.status === "attempted" || candidate.status === "solved") &&
    typeof candidate.updatedAt === "string" &&
    isStringArray(candidate.topics)
  );
}

function isStoredPracticeProgressMap(value: unknown): value is StoredPracticeProgressMap {
  if (!value || typeof value !== "object") {
    return false;
  }

  return Object.values(value).every((entry) => isStoredPracticeQuestionProgress(entry));
}

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeTopics(topics: string[]) {
  return Array.from(
    new Set(
      topics
        .map((topic) => topic.trim())
        .filter(Boolean),
    ),
  );
}

export function readStoredPracticeProgress(): StoredPracticeProgressMap {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const rawProgress = window.localStorage.getItem(practiceProgressStorageKey);
    if (!rawProgress) {
      return {};
    }

    const parsedProgress = JSON.parse(rawProgress);
    return isStoredPracticeProgressMap(parsedProgress) ? parsedProgress : {};
  } catch (error) {
    console.warn("Unable to read stored practice progress", error);
    return {};
  }
}

function persistProgressMap(nextMap: StoredPracticeProgressMap) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(practiceProgressStorageKey, JSON.stringify(nextMap));
  window.dispatchEvent(
    new CustomEvent(practiceProgressUpdatedEvent, {
      detail: { progressMap: nextMap },
    }),
  );
}

export function replaceStoredPracticeProgress(nextMap: StoredPracticeProgressMap) {
  if (typeof window === "undefined") {
    return;
  }

  persistProgressMap(nextMap);
}

export function mergePracticeProgressMaps(...maps: StoredPracticeProgressMap[]) {
  return maps.reduce<StoredPracticeProgressMap>((acc, currentMap) => {
    Object.values(currentMap).forEach((entry) => {
      const existingEntry = acc[entry.slug];

      if (!existingEntry || existingEntry.updatedAt.localeCompare(entry.updatedAt) < 0) {
        acc[entry.slug] = {
          ...entry,
          topics: normalizeTopics(entry.topics),
        };
      }
    });

    return acc;
  }, {});
}

export function practiceProgressMapsEqual(
  left: StoredPracticeProgressMap,
  right: StoredPracticeProgressMap,
) {
  const leftEntries = Object.values(left).sort((a, b) => a.slug.localeCompare(b.slug));
  const rightEntries = Object.values(right).sort((a, b) => a.slug.localeCompare(b.slug));

  if (leftEntries.length !== rightEntries.length) {
    return false;
  }

  return leftEntries.every((entry, index) => {
    const other = rightEntries[index];
    return (
      entry.slug === other.slug &&
      entry.status === other.status &&
      entry.updatedAt === other.updatedAt &&
      entry.title === other.title &&
      entry.primaryTopic === other.primaryTopic &&
      entry.difficulty === other.difficulty &&
      entry.topics.join("|") === other.topics.join("|")
    );
  });
}

export function persistPracticeQuestionProgress(
  question: Pick<PracticeQuestionSummary, "difficulty" | "primaryTopic" | "slug" | "title" | "topics">,
  status: PracticeProgressStatus,
) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const currentProgress = readStoredPracticeProgress();
    const nextEntry: StoredPracticeQuestionProgress = {
      difficulty: question.difficulty,
      primaryTopic: question.primaryTopic,
      slug: question.slug,
      status,
      title: question.title,
      topics: normalizeTopics(question.topics),
      updatedAt: new Date().toISOString(),
    };

    persistProgressMap({
      ...currentProgress,
      [question.slug]: nextEntry,
    });
  } catch (error) {
    console.warn(`Unable to persist practice progress for ${question.slug}`, error);
  }
}

export function clearPracticeQuestionProgress(slug: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const currentProgress = readStoredPracticeProgress();
    if (!currentProgress[slug]) {
      return;
    }

    const nextProgress = { ...currentProgress };
    delete nextProgress[slug];
    persistProgressMap(nextProgress);
  } catch (error) {
    console.warn(`Unable to clear practice progress for ${slug}`, error);
  }
}

export function getPracticeActivityStreak(progressMap: StoredPracticeProgressMap) {
  const activitySet = new Set(
    Object.values(progressMap).map((progress) => progress.updatedAt.slice(0, 10)),
  );

  if (activitySet.size === 0) {
    return 0;
  }

  let streak = 0;
  const cursor = new Date();

  while (activitySet.has(getLocalDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function getRecentPracticeProgress(progressMap: StoredPracticeProgressMap, limit = 6) {
  return Object.values(progressMap)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .slice(0, limit);
}
