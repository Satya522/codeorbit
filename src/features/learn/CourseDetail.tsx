"use client";

import { useEffect, useState } from "react";
import {
  BookOpenCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Gauge,
  Layers3,
  Lock,
  PlayCircle,
  Sparkles,
  Target,
} from "lucide-react";
import { Badge } from "@/components/ui";
import { technologies } from "@/config/technologies";
import {
  getCurriculumLessonState,
  getCurriculumTrack,
  getTrackStatusMeta,
  resolveCurriculumProgress,
  type CurriculumLesson,
  type CurriculumLessonState,
} from "@/data";
import {
  persistTrackProgress,
  readStoredTrackProgress,
} from "./curriculum-progress";

function buildSnippet(name: string, chapterTitle: string) {
  const safeName = name.replace(/[^a-zA-Z]/g, "") || "Stack";

  return `// ${chapterTitle}
type ${safeName}Config = {
  strict: boolean;
  workspace: string;
};

export async function initialize${safeName}(config: ${safeName}Config) {
  const workspace = await bootstrapWorkspace(config.workspace);

  return {
    workspace,
    strictMode: config.strict,
    start() {
      console.log("${name} runtime ready");
    },
  };
}`;
}

function getLessonVisualState(state: CurriculumLessonState, isCurrent: boolean) {
  if (isCurrent) {
    return {
      Icon: PlayCircle,
      badge: "Now",
      badgeTone: "border-fuchsia-400/25 bg-fuchsia-500/12 text-fuchsia-200",
      shell:
        "border-fuchsia-400/25 bg-fuchsia-500/10 text-white shadow-[0_10px_30px_rgba(217,70,239,0.12)]",
      iconTone: "text-fuchsia-200",
      metaTone: "text-fuchsia-100/80",
    };
  }

  if (state === "completed") {
    return {
      Icon: CheckCircle2,
      badge: "Done",
      badgeTone: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
      shell: "border-emerald-400/12 bg-emerald-500/[0.06] text-zinc-100 hover:bg-emerald-500/[0.08]",
      iconTone: "text-emerald-300",
      metaTone: "text-emerald-100/70",
    };
  }

  if (state === "unlocked") {
    return {
      Icon: CircleDot,
      badge: "Open",
      badgeTone: "border-cyan-400/20 bg-cyan-500/10 text-cyan-200",
      shell: "border-white/10 bg-white/[0.04] text-zinc-200 hover:bg-white/[0.06]",
      iconTone: "text-cyan-300",
      metaTone: "text-zinc-500",
    };
  }

  return {
    Icon: Lock,
    badge: "Locked",
    badgeTone: "border-white/10 bg-white/[0.04] text-zinc-500",
    shell: "border-white/5 bg-black/10 text-zinc-500",
    iconTone: "text-zinc-600",
    metaTone: "text-zinc-700",
  };
}

export function CourseDetail({ slug }: { slug: string }) {
  const tech = technologies.find((item) => item.id === slug) || {
    id: slug,
    name: "Unknown Tech",
    icon: "bi bi-question-circle",
    category: "General",
    desc: "No description available",
    color: "text-zinc-500",
    bg: "bg-surface",
  };

  const track = getCurriculumTrack(tech.id);
  const chapters = track.lessons;
  const statusMeta = getTrackStatusMeta(track.status);
  const [activeChapter, setActiveChapter] = useState(track.currentLessonId);
  const [furthestLessonId, setFurthestLessonId] = useState(track.currentLessonId);
  const [hasLoadedStoredProgress, setHasLoadedStoredProgress] = useState(false);

  useEffect(() => {
    setActiveChapter(track.currentLessonId);
    setFurthestLessonId(track.currentLessonId);
    setHasLoadedStoredProgress(false);
  }, [tech.id, track.currentLessonId]);

  useEffect(() => {
    try {
      const storedProgress = readStoredTrackProgress(tech.id);
      if (storedProgress) {
        if (chapters.some((chapter) => chapter.id === storedProgress.activeLessonId)) {
          setActiveChapter(storedProgress.activeLessonId);
        }
        if (chapters.some((chapter) => chapter.id === storedProgress.furthestLessonId)) {
          setFurthestLessonId(storedProgress.furthestLessonId);
        }
      }
    } catch (error) {
      console.warn("Unable to restore curriculum progress", error);
    } finally {
      setHasLoadedStoredProgress(true);
    }
  }, [chapters, tech.id]);

  useEffect(() => {
    const activeIndex = chapters.findIndex((chapter) => chapter.id === activeChapter);
    const furthestIndex = chapters.findIndex((chapter) => chapter.id === furthestLessonId);
    const resolvedFurthestLessonId =
      chapters[Math.max(0, activeIndex, furthestIndex)]?.id ?? track.currentLessonId;

    if (resolvedFurthestLessonId !== furthestLessonId) {
      setFurthestLessonId(resolvedFurthestLessonId);
      return;
    }

    if (!hasLoadedStoredProgress) {
      return;
    }

    persistTrackProgress(tech.id, {
      activeLessonId: activeChapter,
      furthestLessonId: resolvedFurthestLessonId,
    });
  }, [activeChapter, chapters, furthestLessonId, hasLoadedStoredProgress, tech.id, track.currentLessonId]);

  const progressState = resolveCurriculumProgress(track, {
    activeLessonId: activeChapter,
    furthestLessonId,
  });
  const currentIndex = progressState.activeIndex;
  const currentChapter = chapters[currentIndex] ?? chapters[0];
  const activeLessonNumber = currentIndex + 1;
  const completedLessons = progressState.completedCount;
  const progressPercent = progressState.progressPercent;
  const previousChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;
  const sections = chapters.reduce<Record<string, CurriculumLesson[]>>((acc, chapter) => {
    if (!acc[chapter.section]) {
      acc[chapter.section] = [];
    }
    acc[chapter.section].push(chapter);
    return acc;
  }, {});

  const lessonObjectives = [
    `Understand how ${tech.name} fits into a production workflow with focus on ${track.currentFocus.toLowerCase()}.`,
    `Recognize the key decisions behind ${currentChapter.title.toLowerCase()} in this ${track.durationLabel} sprint.`,
    `Use this ${currentChapter.minutes}-minute lesson to leave with a clean mental model and practical implementation path.`,
  ];

  const selectChapter = (chapterId: string) => {
    const chapterIndex = chapters.findIndex((chapter) => chapter.id === chapterId);
    if (chapterIndex < 0 || chapterIndex > progressState.unlockedLimit) {
      return;
    }
    setActiveChapter(chapterId);
  };

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-0 h-[26rem] w-[26rem] rounded-full bg-fuchsia-500/10 blur-[150px]" />
        <div className="absolute bottom-0 right-0 h-[22rem] w-[22rem] rounded-full bg-cyan-500/10 blur-[140px]" />
      </div>

      <div className="relative mx-auto flex w-full max-w-[1560px] gap-0 px-0 lg:gap-8 lg:px-6">
        <aside className="sticky top-[4.5rem] hidden h-[calc(100vh-5rem)] w-[320px] shrink-0 overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#080c16]/90 lg:flex lg:flex-col">
          <div className="border-b border-white/10 px-5 py-5">
            <div className="flex items-center gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 ${tech.bg}`}>
                <i className={`${tech.icon} ${tech.color} text-xl`} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-base font-bold text-white">{tech.name}</h2>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">{chapters.length} chapters</p>
              </div>
            </div>

            <div className="mt-5 rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Course progress</span>
                <span className="font-semibold text-white">{completedLessons}/{chapters.length}</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.08]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-400 to-cyan-400"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/[0.08] bg-black/20 px-3 py-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Unlocked</p>
                  <p className="mt-1 text-sm font-semibold text-zinc-200">{progressState.unlockedCount}/{chapters.length}</p>
                </div>
                <div className="rounded-2xl border border-cyan-400/15 bg-cyan-500/[0.08] px-3 py-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-200/70">Resume</p>
                  <p className="mt-1 text-sm font-semibold text-cyan-50">Lesson {activeLessonNumber}</p>
                </div>
              </div>
              <p className="mt-4 text-xs leading-6 text-zinc-400">
                This track now remembers your last open lesson and restores it on the next visit.
              </p>
            </div>
          </div>

          <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
            <div className="space-y-6">
              {Object.entries(sections).map(([section, items]) => {
                const sectionCompletedCount = items.filter(
                  (chapter) =>
                    getCurriculumLessonState(track, chapter.id, {
                      activeLessonId: activeChapter,
                      furthestLessonId,
                    }) === "completed",
                ).length;

                return (
                  <div key={section}>
                    <div className="mb-2 flex items-center justify-between gap-3 px-2">
                      <h3 className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">{section}</h3>
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-semibold text-zinc-400">
                        {sectionCompletedCount}/{items.length}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {items.map((chapter) => {
                        const lessonState = getCurriculumLessonState(track, chapter.id, {
                          activeLessonId: activeChapter,
                          furthestLessonId,
                        });
                        const chapterIndex = chapters.findIndex((item) => item.id === chapter.id);
                        const isCurrent = chapter.id === currentChapter.id;
                        const visualState = getLessonVisualState(lessonState, isCurrent);
                        const isLocked = lessonState === "locked";

                        return (
                          <button
                            key={chapter.id}
                            type="button"
                            onClick={() => selectChapter(chapter.id)}
                            disabled={isLocked}
                            className={`w-full rounded-2xl border px-3 py-3 text-left transition-all duration-200 ${visualState.shell} ${isLocked ? "cursor-not-allowed opacity-65" : ""}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="rounded-xl border border-white/10 bg-black/20 p-2">
                                <visualState.Icon className={`h-4 w-4 ${visualState.iconTone}`} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="line-clamp-2 text-sm font-semibold">{chapter.title}</p>
                                    <p className={`mt-1 text-[11px] ${visualState.metaTone}`}>
                                      Lesson {chapterIndex + 1} · {chapter.minutes} min · {chapter.kind}
                                    </p>
                                  </div>
                                  <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold ${visualState.badgeTone}`}>
                                    {visualState.badge}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-5xl px-4 pb-20 pt-6 sm:px-6 lg:px-0">
            <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#070b15]/90 shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-2xl">
              <div className="border-b border-white/10 px-5 py-5 sm:px-8 sm:py-7">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="outline" className="border-fuchsia-400/20 bg-fuchsia-500/10 text-fuchsia-200">
                    <Sparkles className="mr-1 h-3.5 w-3.5" />
                    Learning track
                  </Badge>
                  <Badge variant="outline">{tech.category}</Badge>
                  <Badge variant="outline">Lesson {activeLessonNumber} of {chapters.length}</Badge>
                  <Badge variant="outline" className={statusMeta.tone}>{statusMeta.label}</Badge>
                </div>

                <div className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,1.18fr)_minmax(300px,0.82fr)]">
                  <div className="min-w-0">
                    <div className="flex items-start gap-4">
                      <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.35rem] border border-white/10 ${tech.bg}`}>
                        <i className={`${tech.icon} ${tech.color} text-[1.7rem]`} aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">{tech.name} Mastery</h1>
                        <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400 sm:text-base">
                          {tech.desc} This track now includes saved resume state, lesson locks, and section counts instead of generic placeholder progression.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">Resume where you left off</p>
                    <p className="mt-2 text-lg font-semibold text-white">{currentChapter.title}</p>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">
                      Lesson {activeLessonNumber} is auto-saved, so the next visit opens right here.
                    </p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/[0.08] bg-black/20 px-3 py-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Track scope</p>
                        <p className="mt-1 text-sm font-medium text-zinc-200">{track.estimatedHours}h · {track.durationLabel}</p>
                      </div>
                      <div className="rounded-2xl border border-white/[0.08] bg-black/20 px-3 py-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Unlocked path</p>
                        <p className="mt-1 text-sm font-medium text-zinc-200">{progressState.unlockedCount}/{chapters.length} lessons open</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 lg:hidden">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">Jump to chapter</p>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {chapters.map((chapter) => {
                      const lessonState = getCurriculumLessonState(track, chapter.id, {
                        activeLessonId: activeChapter,
                        furthestLessonId,
                      });
                      const isActive = chapter.id === currentChapter.id;
                      const isLocked = lessonState === "locked";

                      return (
                        <button
                          key={chapter.id}
                          type="button"
                          onClick={() => selectChapter(chapter.id)}
                          disabled={isLocked}
                          className={`shrink-0 rounded-full border px-3 py-2 text-sm transition-colors ${
                            isActive
                              ? "border-fuchsia-400/25 bg-fuchsia-500/10 text-white"
                              : isLocked
                                ? "border-white/8 bg-black/20 text-zinc-600"
                                : "border-white/10 bg-white/[0.03] text-zinc-400"
                          } ${isLocked ? "cursor-not-allowed" : ""}`}
                        >
                          {isLocked ? "Locked" : chapter.title}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { Icon: Gauge, label: "Progress sync", value: `${progressPercent}%`, tone: "border-cyan-400/20 bg-cyan-500/10 text-cyan-200" },
                { Icon: Layers3, label: "Current focus", value: track.currentFocus, tone: "border-violet-400/20 bg-violet-500/10 text-violet-200" },
                { Icon: BookOpenCheck, label: "Unlocked lessons", value: `${progressState.unlockedCount}/${chapters.length}`, tone: "border-sky-400/20 bg-sky-500/10 text-sky-200" },
                { Icon: CheckCircle2, label: "Completed lessons", value: `${completedLessons}/${chapters.length}`, tone: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200" },
              ].map(({ Icon, label, value, tone }) => (
                <div key={label} className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-2xl border p-3 ${tone}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{label}</p>
                      <p className="truncate text-base font-semibold text-white">{value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </section>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => previousChapter && selectChapter(previousChapter.id)}
                disabled={!previousChapter}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-zinc-300 transition-colors hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto"
              >
                <ChevronLeft className="h-4 w-4" />
                {previousChapter ? previousChapter.title : "Previous Chapter"}
              </button>

              <button
                type="button"
                onClick={() => nextChapter && selectChapter(nextChapter.id)}
                disabled={!nextChapter}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-violet-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(168,85,247,0.28)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto"
              >
                {nextChapter ? nextChapter.title : "Track complete"}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <article className="mt-6 overflow-hidden rounded-[2rem] border border-white/10 bg-[#070b15]/90 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
              <div className="border-b border-white/10 px-5 py-5 sm:px-8">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="outline">{currentChapter.section}</Badge>
                  <Badge variant="outline">Lesson {activeLessonNumber}</Badge>
                  <Badge variant="outline">{currentChapter.minutes} min</Badge>
                </div>
                <h2 className="mt-4 text-3xl font-black tracking-tight text-white">{currentChapter.title}</h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400 sm:text-base">
                  This lesson sharpens the practical side of {tech.name}. It sits inside the <span className="font-medium text-zinc-200">{track.sprintLabel}</span> plan and stays aligned with the same saved progress state you see inside the syllabus sidebar.
                </p>
              </div>

              <div className="grid gap-6 border-b border-white/10 px-5 py-6 sm:px-8 lg:grid-cols-[minmax(0,1.18fr)_minmax(250px,0.82fr)]">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">Learning objectives</p>
                  <div className="mt-4 space-y-3">
                    {lessonObjectives.map((objective) => (
                      <div key={objective} className="flex items-start gap-3 rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-3">
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,0.9)]" />
                        <p className="text-sm leading-6 text-zinc-300">{objective}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">Lesson radar</p>
                  <div className="mt-4 space-y-2">
                    {[tech.category, currentChapter.section, track.currentFocus, track.sprintLabel].map((item) => (
                      <div key={item} className="rounded-2xl border border-white/[0.08] bg-black/20 px-3 py-2 text-sm text-zinc-200">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="prose prose-invert max-w-none px-5 py-8 prose-headings:tracking-tight prose-p:text-zinc-300 prose-li:text-zinc-400 sm:px-8">
                <h3>Understanding the Core Paradigm</h3>
                <p>
                  {tech.name} becomes easier when the lesson flow is predictable. Start with the mental model, identify where this chapter fits in a real product, then move into implementation patterns you can actually reuse.
                </p>
                <p>
                  For {currentChapter.title.toLowerCase()}, the goal is to reduce noise: understand the essentials, spot the common traps, and keep your learning loop moving instead of getting lost in theory. This specific track is currently prioritizing <strong className="text-white">{track.currentFocus.toLowerCase()}</strong>.
                </p>

                <div className="not-prose my-8 rounded-[1.5rem] border border-fuchsia-400/20 bg-fuchsia-500/[0.08] p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-fuchsia-200">
                    <Sparkles className="h-4 w-4" />
                    Pro insight
                  </div>
                  <p className="mt-3 text-sm leading-6 text-fuchsia-100/80">
                    Strong engineers do not just memorize APIs. They build a stable internal map of how the system behaves when requirements, scale, or failure conditions change.
                  </p>
                </div>

                <h3>Code Snippet Example</h3>
                <div className="not-prose my-6 overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#05070f]">
                  <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">Implementation sketch</span>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] text-zinc-400">{currentChapter.minutes} min lab</span>
                  </div>
                  <div className="overflow-x-auto px-4 py-4">
                    <pre className="min-w-[38rem] text-sm leading-7 text-zinc-300">
                      <code>{buildSnippet(tech.name, currentChapter.title)}</code>
                    </pre>
                  </div>
                </div>

                <h3>Common Pitfalls</h3>
                <ul>
                  <li>Jumping into syntax before understanding the role of this chapter in the bigger system.</li>
                  <li>Letting setup, naming, or file structure get messy early and slow down later lessons.</li>
                  <li>Copying patterns without checking why they fit this chapter&apos;s problem shape.</li>
                </ul>

                <div className="not-prose mt-10 rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <Target className="h-5 w-5 text-cyan-300" />
                    <h3 className="text-lg font-bold text-white">Knowledge Check</h3>
                  </div>
                  <p className="mb-4 text-sm leading-6 text-zinc-400">Which outcome best reflects the goal of this lesson?</p>
                  <div className="space-y-3">
                    {[
                      "Memorize syntax without context.",
                      "Build a reusable mental model plus implementation direction.",
                      "Skip straight to deployment before understanding the foundations.",
                    ].map((option) => (
                      <label key={option} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-zinc-300 transition-colors hover:bg-white/[0.04]">
                        <input type="radio" name="quiz" className="accent-fuchsia-500" />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="mt-6 rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-500 px-5 py-2.5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(168,85,247,0.26)] transition-transform hover:-translate-y-0.5"
                  >
                    Submit Answer
                  </button>
                </div>
              </div>
            </article>
          </div>
        </main>
      </div>
    </div>
  );
}
