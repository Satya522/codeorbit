"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  Bookmark,
  CheckCircle2,
  Clock3,
  Layers3,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import {
  behavioralCompanySignals,
  behavioralPrompts,
  companySignals,
  interviewLaneMeta,
  lowLevelDesignPrompts,
  systemDesignPrompts,
  type BehavioralPrompt,
  type InterviewLane,
  type InterviewPrompt,
  type LowLevelPrompt,
} from "@/data/interview-prep";

type PrepFilter = "all" | InterviewLane;
type PromptKind = "system" | "lld" | "behavioral";
type StoredInterviewPrepState = {
  savedIds: string[];
  completedIds: string[];
};

const prepFilters: PrepFilter[] = [
  "all",
  "core-infra",
  "product-systems",
  "realtime",
  "data-search",
  "ai-systems",
];

const promptTone: Record<InterviewPrompt["frequency"], string> = {
  "Very common": "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
  Common: "border-cyan-400/20 bg-cyan-500/10 text-cyan-100",
  "2026 trend": "border-amber-300/20 bg-amber-500/10 text-amber-100",
};

const behavioralThemeTone: Record<BehavioralPrompt["theme"], string> = {
  Ownership: "border-violet-400/20 bg-violet-500/10 text-violet-100",
  Leadership: "border-cyan-400/20 bg-cyan-500/10 text-cyan-100",
  Conflict: "border-rose-400/20 bg-rose-500/10 text-rose-100",
  Execution: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
  Growth: "border-amber-300/20 bg-amber-500/10 text-amber-100",
  Culture: "border-indigo-400/20 bg-indigo-500/10 text-indigo-100",
};

const interviewPrepStorageKey = "codeorbit:interview-prep:status:v1";

function getPromptStorageId(kind: PromptKind, id: string) {
  return `${kind}:${id}`;
}

function getFilterLabel(filter: PrepFilter) {
  if (filter === "all") {
    return "All Prompts";
  }

  return interviewLaneMeta[filter].label;
}

function getFilterCount(filter: PrepFilter) {
  if (filter === "all") {
    return systemDesignPrompts.length;
  }

  return systemDesignPrompts.filter((prompt) => prompt.lane === filter).length;
}

export function InterviewPrepBoard() {
  const [activeFilter, setActiveFilter] = useState<PrepFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedPrompt, setSelectedPrompt] = useState<InterviewPrompt | null>(null);
  const [selectedLowLevelPrompt, setSelectedLowLevelPrompt] = useState<LowLevelPrompt | null>(null);
  const [selectedBehavioralPrompt, setSelectedBehavioralPrompt] = useState<BehavioralPrompt | null>(null);
  const [prepState, setPrepState] = useState<StoredInterviewPrepState>({
    savedIds: [],
    completedIds: [],
  });

  const visiblePrompts = systemDesignPrompts.filter((prompt) => {
    const matchesFilter = activeFilter === "all" ? true : prompt.lane === activeFilter;
    const matchesQuery =
      query.trim().length === 0
        ? true
        : [
            prompt.title,
            prompt.summary,
            prompt.frequency,
            interviewLaneMeta[prompt.lane].label,
            ...prompt.companies,
            ...prompt.bullets,
          ]
            .join(" ")
            .toLowerCase()
            .includes(query.trim().toLowerCase());

    return matchesFilter && matchesQuery;
  });

  const savedCount = prepState.savedIds.length;
  const completedCount = prepState.completedIds.length;

  const isSaved = (kind: PromptKind, id: string) =>
    prepState.savedIds.includes(getPromptStorageId(kind, id));
  const isCompleted = (kind: PromptKind, id: string) =>
    prepState.completedIds.includes(getPromptStorageId(kind, id));

  const toggleSaved = (kind: PromptKind, id: string) => {
    const promptId = getPromptStorageId(kind, id);

    setPrepState((current) => ({
      ...current,
      savedIds: current.savedIds.includes(promptId)
        ? current.savedIds.filter((item) => item !== promptId)
        : [...current.savedIds, promptId],
    }));
  };

  const toggleCompleted = (kind: PromptKind, id: string) => {
    const promptId = getPromptStorageId(kind, id);

    setPrepState((current) => ({
      ...current,
      completedIds: current.completedIds.includes(promptId)
        ? current.completedIds.filter((item) => item !== promptId)
        : [...current.completedIds, promptId],
    }));
  };

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(interviewPrepStorageKey);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as Partial<StoredInterviewPrepState>;
      const nextState = {
        savedIds: Array.isArray(parsed.savedIds) ? parsed.savedIds : [],
        completedIds: Array.isArray(parsed.completedIds) ? parsed.completedIds : [],
      };
      const timeoutId = window.setTimeout(() => {
        setPrepState(nextState);
      }, 0);

      return () => {
        window.clearTimeout(timeoutId);
      };
    } catch (error) {
      console.warn("Unable to restore interview prep state", error);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(interviewPrepStorageKey, JSON.stringify(prepState));
    } catch (error) {
      console.warn("Unable to persist interview prep state", error);
    }
  }, [prepState]);

  useEffect(() => {
    if (!selectedPrompt && !selectedLowLevelPrompt && !selectedBehavioralPrompt) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedPrompt(null);
        setSelectedLowLevelPrompt(null);
        setSelectedBehavioralPrompt(null);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedPrompt, selectedLowLevelPrompt, selectedBehavioralPrompt]);

  return (
    <div className="relative mx-auto max-w-[1520px] space-y-6 px-4 py-4 sm:px-5 lg:px-6">
      <section className="relative overflow-hidden rounded-[1.9rem] border border-white/10 bg-[#090d16]/88 p-5 shadow-[0_28px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl lg:p-6">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent_34%),radial-gradient(circle_at_top_left,rgba(168,85,247,0.12),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(34,211,238,0.1),transparent_24%)]" />
        <div className="pointer-events-none absolute -left-16 top-0 h-52 w-52 rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-0 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

        <div className="relative grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-200">
              <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
              Mock Teck
            </div>

            <div className="space-y-2.5">
              <h1 className="font-display text-[clamp(2rem,4vw,4.1rem)] font-black leading-[0.92] tracking-[-0.05em] text-white">
                Mock Teck
                <span className="bg-gradient-to-r from-fuchsia-200 via-violet-200 to-cyan-200 bg-clip-text text-transparent">
                  {" "}
                  that feels real
                </span>
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-zinc-300 sm:text-[15px]">
                Practice the questions that still come up most often: system design, low-level design, and behavioral rounds. The goal here is simple: fewer random prompts, better prep.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-zinc-100">
                22 system design prompts
              </span>
              <span className="rounded-full border border-emerald-400/15 bg-emerald-500/[0.08] px-3 py-1.5 text-xs font-semibold text-emerald-100">
                {savedCount} saved
              </span>
              <span className="rounded-full border border-violet-400/15 bg-violet-500/[0.08] px-3 py-1.5 text-xs font-semibold text-violet-100">
                {completedCount} completed
              </span>
              <span className="rounded-full border border-cyan-400/15 bg-cyan-500/[0.08] px-3 py-1.5 text-xs font-semibold text-cyan-100">
                realistic round length
              </span>
              <span className="rounded-full border border-amber-300/15 bg-amber-500/[0.08] px-3 py-1.5 text-xs font-semibold text-amber-100">
                updated for 2026
              </span>
            </div>
          </div>

          <div className="rounded-[1.45rem] border border-white/10 bg-white/[0.04] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">Company signals</p>
            <h2 className="mt-2 text-[1.35rem] font-black leading-[1.1] tracking-tight text-white">
              What interviewers still ask a lot
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-300">
              Most loops still lean on the basics: infra, product thinking, realtime systems, and a few newer AI questions.
            </p>

            <div className="mt-4 space-y-3">
              {companySignals.map((signal) => (
                <div
                  key={signal.company}
                  className="rounded-[1.05rem] border border-white/10 bg-black/20 p-3.5"
                >
                  <p className="text-sm font-semibold text-white">{signal.company}</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    {signal.prompts.join(" • ")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[1.6rem] border border-white/10 bg-[#090d16]/82 p-4 shadow-[0_22px_70px_rgba(0,0,0,0.24)] backdrop-blur-2xl">
        <div className="flex flex-wrap gap-2">
          {prepFilters.map((filter) => {
            const isActive = filter === activeFilter;

            return (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition-all ${
                  isActive
                    ? "border-white/15 bg-white/[0.08] text-white shadow-[0_12px_30px_rgba(255,255,255,0.06)]"
                    : "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/15 hover:bg-white/[0.05] hover:text-zinc-100"
                }`}
              >
                <Layers3 className={`h-4 w-4 ${isActive ? "text-cyan-300" : "text-zinc-500"}`} />
                <span>{getFilterLabel(filter)}</span>
                <span className="rounded-full bg-black/20 px-2 py-0.5 text-[11px] text-zinc-300">
                  {getFilterCount(filter)}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_280px] xl:items-center">
          <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
            <span>{visiblePrompts.length} prompts showing</span>
            <span className="h-1 w-1 rounded-full bg-zinc-600" />
            <span>Pick one lane and stay focused</span>
            <span className="h-1 w-1 rounded-full bg-zinc-600" />
            <span>Open any card for the talking points</span>
          </div>

          <label className="flex h-10 w-full items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5">
            <Search className="h-3.5 w-3.5 text-zinc-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search prompts..."
              spellCheck={false}
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
            />
          </label>
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-500">Core System Design</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-[2rem]">
              System design rounds
            </h2>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {visiblePrompts.map((prompt) => (
            <button
              key={prompt.id}
              type="button"
              onClick={() => setSelectedPrompt(prompt)}
              className="group relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#0b111c]/88 p-5 text-left shadow-[0_20px_70px_rgba(0,0,0,0.24)] transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/20"
            >
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${prompt.accent} opacity-80`} />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

              <div className="relative flex h-full flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-semibold text-zinc-100">
                      {interviewLaneMeta[prompt.lane].label}
                    </span>
                    {isCompleted("system", prompt.id) ? (
                      <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-100">
                        Completed
                      </span>
                    ) : null}
                    {isSaved("system", prompt.id) ? (
                      <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                        Saved
                      </span>
                    ) : null}
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                    <Clock3 className="h-3.5 w-3.5 text-zinc-500" />
                    {prompt.duration}
                  </span>
                </div>

                <h3 className="mt-4 text-[1.7rem] font-black leading-[1.05] tracking-tight text-white">
                  {prompt.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-zinc-300">{prompt.summary}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${promptTone[prompt.frequency]}`}>
                    {prompt.frequency}
                  </span>
                  {prompt.companies.slice(0, 2).map((company) => (
                    <span
                      key={`${prompt.id}-${company}`}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-zinc-300"
                    >
                      {company}
                    </span>
                  ))}
                </div>

                <div className="mt-6 border-t border-white/10 pt-4">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-white">
                    Open brief
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-500">Behavioral Prep</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-[2rem]">
              Behavioral rounds
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
              These are the stories that usually decide how senior and clear-headed you sound in the room.
            </p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-zinc-200">
            {behavioralPrompts.length} behavioral prompts
          </span>
        </div>

        <div className="mb-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {behavioralPrompts.map((prompt) => (
              <button
                key={prompt.id}
                type="button"
                onClick={() => setSelectedBehavioralPrompt(prompt)}
                className="group relative overflow-hidden rounded-[1.45rem] border border-white/10 bg-[#0b111c]/88 p-5 text-left shadow-[0_20px_70px_rgba(0,0,0,0.24)] transition-all duration-300 hover:-translate-y-1 hover:border-fuchsia-400/20"
              >
                <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${prompt.accent} opacity-80`} />
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                <div className="relative flex h-full flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${behavioralThemeTone[prompt.theme]}`}>
                        {prompt.theme}
                      </span>
                      {isCompleted("behavioral", prompt.id) ? (
                        <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-100">
                          Completed
                        </span>
                      ) : null}
                      {isSaved("behavioral", prompt.id) ? (
                        <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                          Saved
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <h3 className="mt-4 text-[1.35rem] font-black leading-[1.08] tracking-tight text-white">
                    {prompt.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-zinc-300">{prompt.summary}</p>

                  <div className="mt-6 border-t border-white/10 pt-4">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-white">
                      Open answer frame
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="rounded-[1.45rem] border border-white/10 bg-white/[0.04] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">Company themes</p>
            <h3 className="mt-2 text-[1.3rem] font-black leading-[1.1] tracking-tight text-white">
              What panels usually care about
            </h3>
            <div className="mt-4 space-y-3">
              {behavioralCompanySignals.map((signal) => (
                <div
                  key={signal.company}
                  className="rounded-[1.05rem] border border-white/10 bg-black/20 p-3.5"
                >
                  <p className="text-sm font-semibold text-white">{signal.company}</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    {signal.themes.join(" • ")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-500">LLD / OOP</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-[2rem]">
              Low-level design rounds
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
              Keep these separate from system design. Here the interviewer usually wants clean classes, sensible responsibilities, and sharp object modeling across {lowLevelDesignPrompts.length} common prompts.
            </p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-zinc-200">
            {lowLevelDesignPrompts.length} LLD prompts
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          {lowLevelDesignPrompts.map((prompt) => (
            <button
              key={prompt.id}
              type="button"
              onClick={() => setSelectedLowLevelPrompt(prompt)}
              className="group relative overflow-hidden rounded-[1.45rem] border border-white/10 bg-[#0b111c]/88 p-5 text-left shadow-[0_20px_70px_rgba(0,0,0,0.24)] transition-all duration-300 hover:-translate-y-1 hover:border-violet-400/20"
            >
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${prompt.accent} opacity-80`} />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

              <div className="relative flex h-full flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-semibold text-zinc-100">
                      {prompt.focus}
                    </span>
                    {isCompleted("lld", prompt.id) ? (
                      <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-100">
                        Completed
                      </span>
                    ) : null}
                    {isSaved("lld", prompt.id) ? (
                      <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                        Saved
                      </span>
                    ) : null}
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                    <Clock3 className="h-3.5 w-3.5 text-zinc-500" />
                    {prompt.duration}
                  </span>
                </div>

                <h3 className="mt-4 text-[1.45rem] font-black leading-[1.08] tracking-tight text-white">
                  {prompt.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-zinc-300">{prompt.summary}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {prompt.bullets.map((item) => (
                    <span
                      key={`${prompt.id}-${item}`}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-zinc-300"
                    >
                      {item}
                    </span>
                  ))}
                </div>

                <div className="mt-6 border-t border-white/10 pt-4">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-white">
                    Open brief
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {visiblePrompts.length === 0 ? (
        <section className="rounded-[1.5rem] border border-white/10 bg-[#090d16]/82 p-8 text-center shadow-[0_22px_70px_rgba(0,0,0,0.24)] backdrop-blur-2xl">
          <p className="text-lg font-semibold text-white">No prompts matched this search.</p>
          <p className="mt-2 text-sm text-zinc-400">Try another keyword or switch back to all lanes.</p>
        </section>
      ) : null}

      {selectedPrompt ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Close prompt brief"
            className="absolute inset-0 cursor-default"
            onClick={() => setSelectedPrompt(null)}
          />

          <aside className="relative h-full w-full max-w-[520px] overflow-y-auto border-l border-white/10 bg-[#09111c]/96 p-5 shadow-[-20px_0_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-300">
                    {interviewLaneMeta[selectedPrompt.lane].label}
                  </span>
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${promptTone[selectedPrompt.frequency]}`}>
                    {selectedPrompt.frequency}
                  </span>
                </div>

                <h2 className="text-[1.8rem] font-black leading-[1.05] tracking-tight text-white">
                  {selectedPrompt.title}
                </h2>
                <p className="text-sm leading-6 text-zinc-300">{selectedPrompt.summary}</p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPrompt(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-300 transition-colors hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className={`mt-5 rounded-[1.4rem] border border-white/10 bg-gradient-to-br ${selectedPrompt.accent} p-[1px]`}>
              <div className="rounded-[1.35rem] bg-[#0b111c]/94 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1rem] border border-white/10 bg-black/20 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Drill time</p>
                    <p className="mt-2 text-sm font-semibold text-white">{selectedPrompt.duration}</p>
                  </div>
                  <div className="rounded-[1rem] border border-white/10 bg-black/20 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Asked by</p>
                    <p className="mt-2 text-sm font-semibold text-white">
                      {selectedPrompt.companies.join(", ")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => toggleSaved("system", selectedPrompt.id)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-zinc-100 transition-all hover:border-white/20 hover:bg-white/[0.06]"
                >
                  <Bookmark className="h-4 w-4" />
                  {isSaved("system", selectedPrompt.id) ? "Saved" : "Save prompt"}
                </button>
                <button
                  type="button"
                  onClick={() => toggleCompleted("system", selectedPrompt.id)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-violet-400/20 bg-violet-500/10 px-4 py-3 text-sm font-semibold text-violet-100 transition-all hover:border-violet-400/30 hover:bg-violet-500/15"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {isCompleted("system", selectedPrompt.id) ? "Completed" : "Mark complete"}
                </button>
              </div>

              <section className="rounded-[1.3rem] border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">What to cover</p>
                <div className="mt-3 space-y-3">
                  {selectedPrompt.bullets.map((item) => (
                    <div
                      key={item}
                      className="rounded-[1rem] border border-white/10 bg-black/20 px-3.5 py-3 text-sm leading-6 text-zinc-300"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[1.3rem] border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">Key tradeoff</p>
                <p className="mt-3 text-sm leading-6 text-zinc-300">{selectedPrompt.tradeoff}</p>
              </section>

              <button
                type="button"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition-all hover:-translate-y-0.5 hover:bg-zinc-100"
              >
                Start mock session
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </aside>
        </div>
      ) : null}

      {selectedLowLevelPrompt ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Close low level design brief"
            className="absolute inset-0 cursor-default"
            onClick={() => setSelectedLowLevelPrompt(null)}
          />

          <aside className="relative h-full w-full max-w-[520px] overflow-y-auto border-l border-white/10 bg-[#09111c]/96 p-5 shadow-[-20px_0_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-300">
                    {selectedLowLevelPrompt.focus}
                  </span>
                </div>

                <h2 className="text-[1.8rem] font-black leading-[1.05] tracking-tight text-white">
                  {selectedLowLevelPrompt.title}
                </h2>
                <p className="text-sm leading-6 text-zinc-300">{selectedLowLevelPrompt.summary}</p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLowLevelPrompt(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-300 transition-colors hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className={`mt-5 rounded-[1.4rem] border border-white/10 bg-gradient-to-br ${selectedLowLevelPrompt.accent} p-[1px]`}>
              <div className="rounded-[1.35rem] bg-[#0b111c]/94 p-4">
                <div className="rounded-[1rem] border border-white/10 bg-black/20 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Drill time</p>
                  <p className="mt-2 text-sm font-semibold text-white">{selectedLowLevelPrompt.duration}</p>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => toggleSaved("lld", selectedLowLevelPrompt.id)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-zinc-100 transition-all hover:border-white/20 hover:bg-white/[0.06]"
                >
                  <Bookmark className="h-4 w-4" />
                  {isSaved("lld", selectedLowLevelPrompt.id) ? "Saved" : "Save prompt"}
                </button>
                <button
                  type="button"
                  onClick={() => toggleCompleted("lld", selectedLowLevelPrompt.id)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-violet-400/20 bg-violet-500/10 px-4 py-3 text-sm font-semibold text-violet-100 transition-all hover:border-violet-400/30 hover:bg-violet-500/15"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {isCompleted("lld", selectedLowLevelPrompt.id) ? "Completed" : "Mark complete"}
                </button>
              </div>

              <section className="rounded-[1.3rem] border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">What to model</p>
                <div className="mt-3 space-y-3">
                  {selectedLowLevelPrompt.bullets.map((item) => (
                    <div
                      key={item}
                      className="rounded-[1rem] border border-white/10 bg-black/20 px-3.5 py-3 text-sm leading-6 text-zinc-300"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[1.3rem] border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">Design goal</p>
                <p className="mt-3 text-sm leading-6 text-zinc-300">{selectedLowLevelPrompt.designGoal}</p>
              </section>

              <button
                type="button"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition-all hover:-translate-y-0.5 hover:bg-zinc-100"
              >
                Start LLD drill
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </aside>
        </div>
      ) : null}

      {selectedBehavioralPrompt ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Close behavioral prompt brief"
            className="absolute inset-0 cursor-default"
            onClick={() => setSelectedBehavioralPrompt(null)}
          />

          <aside className="relative h-full w-full max-w-[520px] overflow-y-auto border-l border-white/10 bg-[#09111c]/96 p-5 shadow-[-20px_0_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${behavioralThemeTone[selectedBehavioralPrompt.theme]}`}>
                    {selectedBehavioralPrompt.theme}
                  </span>
                </div>

                <h2 className="text-[1.8rem] font-black leading-[1.05] tracking-tight text-white">
                  {selectedBehavioralPrompt.title}
                </h2>
                <p className="text-sm leading-6 text-zinc-300">{selectedBehavioralPrompt.summary}</p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedBehavioralPrompt(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-300 transition-colors hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className={`mt-5 rounded-[1.4rem] border border-white/10 bg-gradient-to-br ${selectedBehavioralPrompt.accent} p-[1px]`}>
              <div className="rounded-[1.35rem] bg-[#0b111c]/94 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Prompt framing</p>
                <p className="mt-3 text-sm leading-6 text-zinc-300">{selectedBehavioralPrompt.ask}</p>
              </div>
            </div>

            <div className="mt-5 space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => toggleSaved("behavioral", selectedBehavioralPrompt.id)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-zinc-100 transition-all hover:border-white/20 hover:bg-white/[0.06]"
                >
                  <Bookmark className="h-4 w-4" />
                  {isSaved("behavioral", selectedBehavioralPrompt.id) ? "Saved" : "Save prompt"}
                </button>
                <button
                  type="button"
                  onClick={() => toggleCompleted("behavioral", selectedBehavioralPrompt.id)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-violet-400/20 bg-violet-500/10 px-4 py-3 text-sm font-semibold text-violet-100 transition-all hover:border-violet-400/30 hover:bg-violet-500/15"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {isCompleted("behavioral", selectedBehavioralPrompt.id) ? "Completed" : "Mark complete"}
                </button>
              </div>

              <section className="rounded-[1.3rem] border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">Strong answer signal</p>
                <p className="mt-3 text-sm leading-6 text-zinc-300">{selectedBehavioralPrompt.signal}</p>
              </section>

              <section className="rounded-[1.3rem] border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">Avoid these mistakes</p>
                <div className="mt-3 space-y-3">
                  {selectedBehavioralPrompt.pitfalls.map((item) => (
                    <div
                      key={item}
                      className="rounded-[1rem] border border-white/10 bg-black/20 px-3.5 py-3 text-sm leading-6 text-zinc-300"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </section>

              <button
                type="button"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition-all hover:-translate-y-0.5 hover:bg-zinc-100"
              >
                Start behavioral drill
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
