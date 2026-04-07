"use client";

export const curriculumProgressStoragePrefix = "codeorbit:curriculum:progress:";
export const curriculumProgressUpdatedEvent = "codeorbit:curriculum-progress-updated";

export type StoredTrackProgress = {
  activeLessonId: string;
  furthestLessonId: string;
  activityDates?: string[];
  updatedAt?: string;
};

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function isStoredTrackProgress(value: unknown): value is StoredTrackProgress {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<StoredTrackProgress>;
  return (
    typeof candidate.activeLessonId === "string" &&
    typeof candidate.furthestLessonId === "string" &&
    (candidate.updatedAt === undefined || typeof candidate.updatedAt === "string") &&
    (candidate.activityDates === undefined || isStringArray(candidate.activityDates))
  );
}

function getStorageKey(techId: string) {
  return `${curriculumProgressStoragePrefix}${techId}`;
}

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildStoredProgress(
  previous: StoredTrackProgress | undefined,
  next: Pick<StoredTrackProgress, "activeLessonId" | "furthestLessonId">,
): StoredTrackProgress {
  const today = getLocalDateKey();
  const activityDates = Array.from(
    new Set([...(previous?.activityDates ?? []), today]),
  ).slice(-21);

  return {
    activeLessonId: next.activeLessonId,
    furthestLessonId: next.furthestLessonId,
    activityDates,
    updatedAt: new Date().toISOString(),
  };
}

export function readStoredTrackProgress(techId: string): StoredTrackProgress | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  try {
    const rawProgress = window.localStorage.getItem(getStorageKey(techId));
    if (!rawProgress) {
      return undefined;
    }

    const parsedProgress = JSON.parse(rawProgress);
    return isStoredTrackProgress(parsedProgress) ? parsedProgress : undefined;
  } catch (error) {
    console.warn(`Unable to read saved curriculum progress for ${techId}`, error);
    return undefined;
  }
}

export function readSavedTrackProgressMap(techIds: string[]) {
  return techIds.reduce<Record<string, StoredTrackProgress>>((acc, techId) => {
    const storedProgress = readStoredTrackProgress(techId);
    if (storedProgress) {
      acc[techId] = storedProgress;
    }
    return acc;
  }, {});
}

export function persistTrackProgress(
  techId: string,
  next: Pick<StoredTrackProgress, "activeLessonId" | "furthestLessonId">,
) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const previous = readStoredTrackProgress(techId);
    const storedProgress = buildStoredProgress(previous, next);

    window.localStorage.setItem(getStorageKey(techId), JSON.stringify(storedProgress));
    window.dispatchEvent(
      new CustomEvent(curriculumProgressUpdatedEvent, {
        detail: { techId, progress: storedProgress },
      }),
    );
  } catch (error) {
    console.warn(`Unable to persist curriculum progress for ${techId}`, error);
  }
}

export function getCurriculumActivityStreak(progressMap: Record<string, StoredTrackProgress>) {
  const activitySet = new Set(
    Object.values(progressMap).flatMap((progress) => {
      if (progress.activityDates?.length) {
        return progress.activityDates;
      }

      return progress.updatedAt ? [progress.updatedAt.slice(0, 10)] : [];
    }),
  );

  if (activitySet.size === 0) {
    return Object.keys(progressMap).length > 0 ? 1 : 0;
  }

  let streak = 0;
  const cursor = new Date();

  while (activitySet.has(getLocalDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}
