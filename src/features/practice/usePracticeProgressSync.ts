"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import type { PracticeQuestionSummary } from "@/lib/types/question-catalog";
import {
  clearPracticeQuestionProgress,
  mergePracticeProgressMaps,
  persistPracticeQuestionProgress,
  practiceProgressMapsEqual,
  practiceProgressUpdatedEvent,
  readStoredPracticeProgress,
  replaceStoredPracticeProgress,
  type PracticeProgressStatus,
  type StoredPracticeProgressMap,
  type StoredPracticeQuestionProgress,
} from "@/features/practice/practice-progress";

type ProgressResponse = {
  authenticated?: boolean;
  error?: string;
  progress?: StoredPracticeQuestionProgress[];
};

function toProgressMap(entries: StoredPracticeQuestionProgress[] | undefined) {
  return (entries ?? []).reduce<StoredPracticeProgressMap>((acc, entry) => {
    acc[entry.slug] = entry;
    return acc;
  }, {});
}

async function readRemotePracticeProgress() {
  const response = await fetch("/api/practice/progress", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to fetch synced practice progress.");
  }

  const payload = (await response.json()) as ProgressResponse;
  return toProgressMap(payload.progress);
}

async function syncEntriesToServer(entries: StoredPracticeQuestionProgress[]) {
  const response = await fetch("/api/practice/progress", {
    body: JSON.stringify({ entries }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Unable to sync practice progress to the server.");
  }

  const payload = (await response.json()) as ProgressResponse;
  return toProgressMap(payload.progress);
}

async function removeEntriesFromServer(slugs: string[]) {
  const response = await fetch("/api/practice/progress", {
    body: JSON.stringify({ slugs }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Unable to clear synced practice progress.");
  }

  const payload = (await response.json()) as ProgressResponse;
  return toProgressMap(payload.progress);
}

export function usePracticeProgressSync() {
  const { isLoaded, isSignedIn } = useAuth();
  const [progressMap, setProgressMap] = useState<StoredPracticeProgressMap>(() => readStoredPracticeProgress());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncLocalState = () => {
      setProgressMap(readStoredPracticeProgress());
    };

    window.addEventListener(practiceProgressUpdatedEvent, syncLocalState as EventListener);
    window.addEventListener("storage", syncLocalState);
    window.addEventListener("focus", syncLocalState);

    return () => {
      window.removeEventListener(practiceProgressUpdatedEvent, syncLocalState as EventListener);
      window.removeEventListener("storage", syncLocalState);
      window.removeEventListener("focus", syncLocalState);
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return;
    }

    let cancelled = false;

    async function syncRemote() {
      setIsSyncing(true);
      setSyncError("");

      try {
        const localMap = readStoredPracticeProgress();
        const remoteMap = await readRemotePracticeProgress();
        const mergedMap = mergePracticeProgressMaps(remoteMap, localMap);
        const nextMap = practiceProgressMapsEqual(mergedMap, remoteMap)
          ? remoteMap
          : await syncEntriesToServer(Object.values(mergedMap));

        if (!cancelled) {
          replaceStoredPracticeProgress(nextMap);
          setProgressMap(nextMap);
        }
      } catch (error) {
        if (!cancelled) {
          setSyncError(error instanceof Error ? error.message : "Unable to sync progress.");
        }
      } finally {
        if (!cancelled) {
          setIsSyncing(false);
        }
      }
    }

    syncRemote();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn]);

  async function updateQuestionProgress(
    question: Pick<PracticeQuestionSummary, "difficulty" | "primaryTopic" | "slug" | "title" | "topics">,
    status: PracticeProgressStatus,
  ) {
    persistPracticeQuestionProgress(question, status);
    const optimisticMap = readStoredPracticeProgress();
    setProgressMap(optimisticMap);

    if (!isSignedIn) {
      return;
    }

    setIsSyncing(true);
    setSyncError("");

    try {
      const nextMap = await syncEntriesToServer(Object.values(optimisticMap));
      replaceStoredPracticeProgress(nextMap);
      setProgressMap(nextMap);
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "Unable to sync progress.");
    } finally {
      setIsSyncing(false);
    }
  }

  async function clearQuestionProgress(slug: string) {
    clearPracticeQuestionProgress(slug);
    const optimisticMap = readStoredPracticeProgress();
    setProgressMap(optimisticMap);

    if (!isSignedIn) {
      return;
    }

    setIsSyncing(true);
    setSyncError("");

    try {
      const nextMap = await removeEntriesFromServer([slug]);
      replaceStoredPracticeProgress(nextMap);
      setProgressMap(nextMap);
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "Unable to clear synced progress.");
    } finally {
      setIsSyncing(false);
    }
  }

  return {
    clearQuestionProgress,
    isSignedIn,
    isSyncing,
    progressMap,
    syncError,
    updateQuestionProgress,
  };
}
