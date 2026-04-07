"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { PlatformIcon, PlatformIconStack } from "@/lib/utils/platform-icons";
import type {
  PracticeCatalogDetailResponse,
  PracticeCatalogFilters,
  PracticeCatalogListResponse,
  PracticeDifficulty,
  PracticePlatformInfo,
  PracticeQuestionDetail,
  PracticeQuestionSummary,
} from "@/lib/types/question-catalog";
import {
  getPracticeActivityStreak,
  getRecentPracticeProgress,
  type PracticeProgressStatus,
} from "@/features/practice/practice-progress";
import { usePracticeProgressSync } from "@/features/practice/usePracticeProgressSync";
import { AlertCircle, CheckCircle2, ChevronDown, Circle, ExternalLink, Flame, LoaderCircle, RotateCcw, Search, XCircle } from "lucide-react";

const PAGE_SIZE = 12;

const initialFilters: PracticeCatalogFilters = {
  difficulties: ["Easy", "Medium", "Hard"],
  platforms: [],
  topics: [],
};

function getDifficultyClassName(difficulty: PracticeDifficulty | null) {
  if (!difficulty) return "";
  if (difficulty === "Easy") return "text-emerald-400";
  if (difficulty === "Medium") return "text-amber-400";
  return "text-rose-400";
}

function getDifficultyBadgeVariant(difficulty: PracticeDifficulty | null) {
  if (difficulty === "Easy") return "success";
  if (difficulty === "Medium") return "warning";
  if (difficulty === "Hard") return "outline";
  return "secondary";
}

function formatPlatformName(platform: PracticePlatformInfo) {
  return platform.displayName;
}

function getProgressTone(status: PracticeProgressStatus | null) {
  if (status === "solved") {
    return "border-emerald-400/20 bg-emerald-500/10 text-emerald-200";
  }

  if (status === "attempted") {
    return "border-amber-400/20 bg-amber-500/10 text-amber-200";
  }

  return "border-white/10 bg-white/[0.04] text-zinc-400";
}

function formatProgressTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Just now";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  }).format(date);
}

function getPaginationItems(currentPage: number, totalPages: number) {
  if (totalPages <= 9) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 5) {
    return [1, 2, 3, 4, 5, 6, 7, "ellipsis", totalPages];
  }

  if (currentPage >= totalPages - 4) {
    return [1, "ellipsis", totalPages - 6, totalPages - 5, totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, "ellipsis", currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2, "ellipsis", totalPages];
}

export function PracticeBoard() {
  const [search, setSearch] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [questions, setQuestions] = useState<PracticeQuestionSummary[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<PracticeCatalogFilters>(initialFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const [detailCache, setDetailCache] = useState<Record<string, PracticeQuestionDetail>>({});
  const [detailLoading, setDetailLoading] = useState<Record<string, boolean>>({});
  const [detailErrors, setDetailErrors] = useState<Record<string, string>>({});
  const {
    clearQuestionProgress,
    isSignedIn,
    isSyncing,
    progressMap,
    syncError,
    updateQuestionProgress,
  } = usePracticeProgressSync();
  const deferredSearch = useDeferredValue(search);
  const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));
  const paginatedQuestions = questions.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const paginationItems = getPaginationItems(currentPage, totalPages);
  const progressEntries = useMemo(
    () => Object.values(progressMap).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
    [progressMap],
  );
  const solvedCount = progressEntries.filter((entry) => entry.status === "solved").length;
  const attemptedCount = progressEntries.filter((entry) => entry.status === "attempted").length;
  const trackedCount = progressEntries.length;
  const practiceStreak = getPracticeActivityStreak(progressMap);
  const recentSubmissions = getRecentPracticeProgress(progressMap);

  useEffect(() => {
    setCurrentPage(1);
    setExpandedSlug(null);
  }, [deferredSearch, selectedDifficulty, selectedPlatform, selectedTopic]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();

    if (deferredSearch.trim()) params.set("search", deferredSearch.trim());
    if (selectedDifficulty) params.set("difficulty", selectedDifficulty);
    if (selectedTopic) params.set("topic", selectedTopic);
    if (selectedPlatform) params.set("platform", selectedPlatform);

    async function loadQuestions() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/practice/questions?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Unable to load the practice catalog.");
        }

        const payload = (await response.json()) as PracticeCatalogListResponse;
        setQuestions(payload.questions);
        setFilters(payload.filters);
        setTotalResults(payload.total);
      } catch (loadError: unknown) {
        if (controller.signal.aborted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Unable to load the practice catalog.");
        setTotalResults(0);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadQuestions();

    return () => controller.abort();
  }, [deferredSearch, selectedDifficulty, selectedPlatform, selectedTopic]);

  async function toggleQuestion(slug: string) {
    if (expandedSlug === slug) {
      setExpandedSlug(null);
      return;
    }

    setExpandedSlug(slug);

    if (detailCache[slug] || detailLoading[slug]) {
      return;
    }

    setDetailLoading((current) => ({ ...current, [slug]: true }));
    setDetailErrors((current) => ({ ...current, [slug]: "" }));

    try {
      const response = await fetch(`/api/practice/questions/${encodeURIComponent(slug)}`);

      if (!response.ok) {
        throw new Error("Unable to load practice links.");
      }

      const payload = (await response.json()) as PracticeCatalogDetailResponse;

      if (!payload.question) {
        throw new Error("Practice links are unavailable for this problem.");
      }

      setDetailCache((current) => ({ ...current, [slug]: payload.question! }));
    } catch (loadError: unknown) {
      setDetailErrors((current) => ({
        ...current,
        [slug]: loadError instanceof Error ? loadError.message : "Unable to load practice links.",
      }));
    } finally {
      setDetailLoading((current) => ({ ...current, [slug]: false }));
    }
  }

  function resetFilters() {
    setSearch("");
    setSelectedDifficulty("");
    setSelectedTopic("");
    setSelectedPlatform("");
  }

  return (
    <div className="min-h-full bg-transparent">
      <div className="mx-auto flex h-full w-full max-w-[1400px] min-w-0 flex-col space-y-6 px-5 pb-5 pt-2 sm:px-6 sm:pb-6 sm:pt-3 lg:px-7 lg:pb-7 lg:pt-3">
        <header>
          <h1 className="text-3xl font-bold text-white">Practice Arena</h1>
        </header>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              Icon: CheckCircle2,
              label: "Solved sync",
              note: "Accepted problems tracked for roadmap unlocks",
              value: solvedCount,
            },
            {
              Icon: RotateCcw,
              label: "Attempted sync",
              note: "Questions you touched but have not cleared yet",
              value: attemptedCount,
            },
            {
              Icon: Circle,
              label: "Tracked set",
              note: "Problems currently feeding your DSA roadmap",
              value: trackedCount,
            },
            {
              Icon: Flame,
              label: "Practice streak",
              note: "Consecutive active days from live practice marks",
              value: `${practiceStreak}d`,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(24,24,27,0.92),rgba(12,12,18,0.92))] p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-2xl font-black tracking-tight text-white">{stat.value}</p>
                  <p className="mt-1 text-sm font-semibold text-zinc-100">{stat.label}</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-400">{stat.note}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2 text-zinc-200">
                  <stat.Icon className="h-4 w-4" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {isSignedIn ? (
          <div className="rounded-2xl border border-cyan-400/15 bg-cyan-500/[0.06] px-4 py-3 text-sm text-cyan-100">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span>
                {isSyncing ? "Syncing your practice progress across devices..." : "Cross-device sync is active for your practice progress."}
              </span>
              <span className="text-xs text-cyan-200/80">Signed in sync mode</span>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-400">
            Sign in to sync solved problems across devices. Until then, practice progress stays in this browser.
          </div>
        )}

        {syncError ? (
          <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {syncError}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
          <label className="group flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(24,24,27,0.92),rgba(12,12,18,0.92))] px-4 py-2.5 text-sm text-zinc-300 shadow-[0_0_0_rgba(139,92,246,0)] transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:shadow-[0_18px_40px_rgba(0,0,0,0.2)] focus-within:-translate-y-0.5 focus-within:border-violet-400/40 focus-within:shadow-[0_0_0_1px_rgba(139,92,246,0.16),0_18px_40px_rgba(0,0,0,0.24)] lg:min-w-[320px] lg:max-w-xl">
            <Search className="h-4 w-4 text-zinc-500 transition-colors duration-300 group-hover:text-zinc-300 group-focus-within:text-violet-300" />
            <input
              className="w-full bg-transparent text-zinc-100 outline-none placeholder:text-zinc-500"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search problems, topics, or platforms"
              type="search"
              value={search}
            />
          </label>

          <div className="group relative w-full lg:min-w-[180px] lg:w-auto">
            <select
              className="w-full appearance-none rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(24,24,27,0.92),rgba(12,12,18,0.92))] px-4 py-2.5 pr-11 text-sm text-zinc-200 outline-none shadow-[0_0_0_rgba(139,92,246,0)] transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:shadow-[0_18px_40px_rgba(0,0,0,0.2)] focus:-translate-y-0.5 focus:border-violet-400/40 focus:shadow-[0_0_0_1px_rgba(139,92,246,0.16),0_18px_40px_rgba(0,0,0,0.24)] lg:min-w-[180px]"
              onChange={(event) => setSelectedDifficulty(event.target.value)}
              value={selectedDifficulty}
            >
              <option value="">All Problems</option>
              {filters.difficulties.map((difficulty) => (
                <option key={difficulty} value={difficulty}>
                  {difficulty}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 transition-colors duration-300 group-hover:text-zinc-300 group-focus-within:text-violet-300" />
          </div>

          <div className="group relative w-full lg:min-w-[180px] lg:w-auto">
            <select
              className="w-full appearance-none rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(24,24,27,0.92),rgba(12,12,18,0.92))] px-4 py-2.5 pr-11 text-sm text-zinc-200 outline-none shadow-[0_0_0_rgba(139,92,246,0)] transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:shadow-[0_18px_40px_rgba(0,0,0,0.2)] focus:-translate-y-0.5 focus:border-violet-400/40 focus:shadow-[0_0_0_1px_rgba(139,92,246,0.16),0_18px_40px_rgba(0,0,0,0.24)] lg:min-w-[180px]"
              onChange={(event) => setSelectedTopic(event.target.value)}
              value={selectedTopic}
            >
              <option value="">All topics</option>
              {filters.topics.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 transition-colors duration-300 group-hover:text-zinc-300 group-focus-within:text-violet-300" />
          </div>

          <div className="group relative w-full lg:min-w-[180px] lg:w-auto">
            <select
              className="w-full appearance-none rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(24,24,27,0.92),rgba(12,12,18,0.92))] px-4 py-2.5 pr-11 text-sm text-zinc-200 outline-none shadow-[0_0_0_rgba(139,92,246,0)] transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:shadow-[0_18px_40px_rgba(0,0,0,0.2)] focus:-translate-y-0.5 focus:border-violet-400/40 focus:shadow-[0_0_0_1px_rgba(139,92,246,0.16),0_18px_40px_rgba(0,0,0,0.24)] lg:min-w-[180px]"
              onChange={(event) => setSelectedPlatform(event.target.value)}
              value={selectedPlatform}
            >
              <option value="">All platforms</option>
              {filters.platforms.map((platform) => (
                <option key={platform.slug} value={platform.slug}>
                  {formatPlatformName(platform)}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 transition-colors duration-300 group-hover:text-zinc-300 group-focus-within:text-violet-300" />
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-6 xl:flex-row">
          <div className="min-w-0 flex-1">
            <Card className="border border-white/10 bg-white/[0.03]">
              <CardHeader className="border-b border-white/10 px-5 pb-3 pt-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="text-xl text-white">External Question Catalog</CardTitle>
                    <p className="text-sm text-zinc-400">
                      Grouped by normalized title across LeetCode, HackerRank, and GeeksforGeeks.
                    </p>
                  </div>
                  <span className="text-xs font-medium text-zinc-500">
                    {isLoading ? "Loading..." : `${totalResults} results`}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 px-5 pb-5 pt-4">
                {isLoading ? (
                  <div className="flex min-h-48 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-zinc-900/40 text-zinc-400">
                    <LoaderCircle className="mr-3 h-5 w-5 animate-spin" />
                    Loading practice catalog...
                  </div>
                ) : error ? (
                  <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-sm text-rose-200">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-5 w-5" />
                      <span>{error}</span>
                    </div>
                    <button
                      className="mt-4 rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-white/15"
                      onClick={resetFilters}
                      type="button"
                    >
                      Reset filters
                    </button>
                  </div>
                ) : questions.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-zinc-900/40 p-8 text-center">
                    <p className="text-base font-medium text-zinc-100">No problems matched these filters.</p>
                    <p className="mt-2 text-sm text-zinc-500">Try a broader search or clear the active filters.</p>
                    <button
                      className="mt-5 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/15"
                      onClick={resetFilters}
                      type="button"
                    >
                      Clear filters
                    </button>
                  </div>
                ) : (
                  paginatedQuestions.map((question) => {
                    const isExpanded = expandedSlug === question.slug;
                    const detail = detailCache[question.slug];
                    const isDetailLoading = Boolean(detailLoading[question.slug]);
                    const detailError = detailErrors[question.slug];
                    const progressStatus = progressMap[question.slug]?.status ?? null;

                    return (
                      <div
                        key={question.slug}
                        className="overflow-hidden rounded-xl border border-white/10 bg-zinc-900/50 transition-colors hover:border-white/20"
                      >
                        <button
                          className="flex w-full flex-col gap-3 px-4 py-3 text-left md:flex-row md:items-start md:justify-between"
                          onClick={() => toggleQuestion(question.slug)}
                          type="button"
                        >
                          <div className="min-w-0 space-y-2">
                            <div className="flex items-start gap-3">
                              <ChevronDown
                                className={`mt-0.5 h-4 w-4 shrink-0 text-zinc-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                              />
                              <div className="min-w-0">
                                <h3 className="truncate text-[15px] font-semibold text-zinc-100">{question.title}</h3>
                                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                  {question.difficulty ? (
                                    <Badge variant={getDifficultyBadgeVariant(question.difficulty)}>{question.difficulty}</Badge>
                                  ) : null}
                                  {question.primaryTopic ? (
                                    <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-zinc-300">
                                      {question.primaryTopic}
                                    </span>
                                  ) : null}
                                  <span className="text-xs text-zinc-500">{question.linkCount} external links</span>
                                  <span
                                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getProgressTone(progressStatus)}`}
                                  >
                                    {progressStatus === "solved"
                                      ? "Solved"
                                      : progressStatus === "attempted"
                                        ? "Attempted"
                                        : "Not tracked"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex shrink-0 flex-col items-start gap-2 md:items-end">
                            <PlatformIconStack platforms={question.platforms} />
                            {question.difficulty ? (
                              <span className={`text-xs font-medium ${getDifficultyClassName(question.difficulty)}`}>
                                {question.difficulty}
                              </span>
                            ) : null}
                          </div>
                        </button>

                        {isExpanded ? (
                          <div className="border-t border-white/10 bg-black/10 px-4 py-3">
                            <div className="mb-3 rounded-xl border border-white/10 bg-zinc-950/70 p-3">
                              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Solve Sync</p>
                                  <p className="mt-1 text-sm font-semibold text-zinc-100">
                                    {progressStatus === "solved"
                                      ? "This problem is currently counted as solved."
                                      : progressStatus === "attempted"
                                        ? "This problem is currently tracked as attempted."
                                        : "Mark your actual practice state to feed the DSA roadmap."}
                                  </p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  <button
                                    className={`rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${
                                      progressStatus === "attempted"
                                        ? "border-amber-400/25 bg-amber-500/12 text-amber-100"
                                        : "border-white/10 bg-white/[0.04] text-zinc-200 hover:border-white/20"
                                    }`}
                                    onClick={() => updateQuestionProgress(question, "attempted")}
                                    type="button"
                                  >
                                    Mark attempted
                                  </button>
                                  <button
                                    className={`rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${
                                      progressStatus === "solved"
                                        ? "border-emerald-400/25 bg-emerald-500/12 text-emerald-100"
                                        : "border-white/10 bg-white/[0.04] text-zinc-200 hover:border-white/20"
                                    }`}
                                    onClick={() => updateQuestionProgress(question, "solved")}
                                    type="button"
                                  >
                                    Mark solved
                                  </button>
                                  <button
                                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-zinc-300 transition-colors hover:border-white/20"
                                    onClick={() => clearQuestionProgress(question.slug)}
                                    type="button"
                                  >
                                    Clear
                                  </button>
                                </div>
                              </div>
                            </div>

                            {isDetailLoading ? (
                              <div className="flex items-center gap-3 text-sm text-zinc-400">
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                                Loading platform links...
                              </div>
                            ) : detailError ? (
                              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
                                {detailError}
                              </div>
                            ) : detail ? (
                              <div className="space-y-2.5">
                                {detail.links.map((link) => (
                                  <a
                                    key={`${link.platform.slug}-${link.canonicalSlug}-${link.externalUrl}`}
                                    className="flex flex-col gap-2.5 rounded-xl border border-white/10 bg-zinc-950/70 px-3.5 py-3 transition-colors hover:border-white/20 hover:bg-white/[0.03] md:flex-row md:items-center md:justify-between"
                                    href={link.externalUrl}
                                    rel="noreferrer"
                                    target="_blank"
                                  >
                                    <div className="min-w-0 space-y-1.5">
                                      <div className="flex items-center gap-3">
                                        <PlatformIcon platform={link.platform} />
                                        <div className="min-w-0">
                                          <p className="truncate text-sm font-medium text-zinc-100">{link.title}</p>
                                          <p className="text-xs text-zinc-500">{formatPlatformName(link.platform)}</p>
                                        </div>
                                      </div>
                                      <div className="flex flex-wrap gap-2">
                                        {link.difficulty ? (
                                          <span className={`text-xs font-medium ${getDifficultyClassName(link.difficulty)}`}>
                                            {link.difficulty}
                                          </span>
                                        ) : null}
                                        {link.topic ? (
                                          <span className="rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-300">{link.topic}</span>
                                        ) : null}
                                        {link.subtopic ? (
                                          <span className="rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-300">{link.subtopic}</span>
                                        ) : null}
                                      </div>
                                    </div>

                                    <span className="inline-flex items-center gap-2 text-sm font-medium text-zinc-200">
                                      Open link
                                      <ExternalLink className="h-4 w-4" />
                                    </span>
                                  </a>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    );
                  })
                )}

                {!isLoading && !error && totalResults > PAGE_SIZE ? (
                  <div className="flex flex-col gap-3 border-t border-white/10 pt-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {paginationItems.map((item, index) =>
                        item === "ellipsis" ? (
                          <span key={`ellipsis-${index}`} className="px-1 text-xs text-zinc-600">
                            ...
                          </span>
                        ) : typeof item === "number" ? (
                          <button
                            key={item}
                            className={`h-9 min-w-9 rounded-lg px-3 text-sm font-semibold transition-colors ${
                              currentPage === item
                                ? "bg-white/10 text-white"
                                : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                            }`}
                            onClick={() => {
                              setCurrentPage(item);
                              setExpandedSlug(null);
                            }}
                            type="button"
                          >
                            {item}
                          </button>
                        ) : null
                      )}
                    </div>

                    <button
                      className={`rounded-lg px-3.5 py-2 text-xs font-medium transition-colors ${
                        currentPage < totalPages
                          ? "bg-white/10 text-white hover:bg-white/15"
                          : "cursor-not-allowed bg-white/[0.04] text-zinc-600"
                      }`}
                      disabled={currentPage >= totalPages}
                      onClick={() => {
                        if (currentPage < totalPages) {
                          setCurrentPage((page) => page + 1);
                          setExpandedSlug(null);
                        }
                      }}
                      type="button"
                    >
                      Next
                    </button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <div className="w-full space-y-6 xl:w-72 xl:shrink-0">
            <Card className="border border-white/10 bg-white/[0.03]">
              <CardHeader className="border-b border-white/10 pb-3">
                <CardTitle className="text-lg text-white">Recent Submissions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 pt-4">
                {recentSubmissions.length > 0 ? (
                  recentSubmissions.map((problem) => (
                    <div
                      key={problem.slug}
                      className="flex flex-col gap-1 border-b border-zinc-800/50 pb-3 last:border-0 last:pb-0"
                    >
                      <span className="truncate text-sm font-semibold text-zinc-100">{problem.title}</span>
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className={problem.status === "solved" ? "text-emerald-400" : "text-amber-400"}>
                          {problem.status === "solved" ? "Solved" : "Attempted"}
                        </span>
                        <span className="truncate text-zinc-500">
                          {problem.difficulty ?? problem.primaryTopic ?? "Tracked"} . {formatProgressTime(problem.updatedAt)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-white/10 bg-zinc-900/40 p-4 text-sm text-zinc-500">
                    Start marking questions as solved or attempted. Your recent practice feed will appear here.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border border-white/10 bg-white/[0.03]">
              <CardHeader className="border-b border-white/10 pb-3">
                <CardTitle className="text-lg text-white">Progress Legend</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4 text-sm text-zinc-400">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Solved problems feed the DSA roadmap automatically</span>
                </div>
                <div className="flex items-center gap-3">
                  <RotateCcw className="h-4 w-4 text-orange-400" />
                  <span>Attempted problems stay visible but unlock less momentum</span>
                </div>
                <div className="flex items-center gap-3">
                  <XCircle className="h-4 w-4 text-zinc-600" />
                  <span>Clear removes a problem from the synced practice feed</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
