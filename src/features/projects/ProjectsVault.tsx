"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  Boxes,
  Database,
  Layers3,
  LayoutGrid,
  Search,
  ServerCog,
  Sparkles,
  Workflow,
  X,
} from "lucide-react";
import {
  mockProjects,
  projectCategoryMeta,
  type MockProject,
  type ProjectCategory,
} from "@/data/mock-projects";

type ProjectFilter = "all" | ProjectCategory;
type DifficultyFilter = "all" | MockProject["difficulty"];

const projectFilters: ProjectFilter[] = [
  "all",
  "frontend",
  "backend",
  "database",
  "frontend-backend",
  "full-stack",
];

const filterLabels: Record<ProjectFilter, string> = {
  all: "All Projects",
  frontend: "Frontend",
  backend: "Backend",
  database: "Database",
  "frontend-backend": "Frontend + Backend",
  "full-stack": "Full Stack",
};

const filterIcons = {
  all: Layers3,
  frontend: LayoutGrid,
  backend: ServerCog,
  database: Database,
  "frontend-backend": Workflow,
  "full-stack": Sparkles,
} satisfies Record<ProjectFilter, typeof Layers3>;

const difficultyTone: Record<MockProject["difficulty"], string> = {
  Easy: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
  Intermediate: "border-cyan-400/20 bg-cyan-500/10 text-cyan-100",
  Advanced: "border-violet-400/20 bg-violet-500/10 text-violet-100",
  Signature: "border-amber-300/25 bg-amber-500/10 text-amber-100",
};

const difficultyFilters: DifficultyFilter[] = ["all", "Easy", "Intermediate", "Advanced", "Signature"];

function getProjectSearchText(project: MockProject) {
  return [
    project.title,
    project.summary,
    project.outcome,
    projectCategoryMeta[project.category].label,
    ...project.stack,
  ]
    .join(" ")
    .toLowerCase();
}

function getProjectChecklist(project: MockProject) {
  return [
    `Build the core ${project.title.toLowerCase()} flow without leaving placeholder screens behind.`,
    `Keep the ${project.stack.slice(0, 2).join(" + ")} foundation clean enough to explain in an interview.`,
    `Finish with a polished demo state so the project feels shipped, not half-built.`,
  ];
}

function getProjectSequenceNote(project: MockProject) {
  if (project.featured) {
    return "This is one of the stronger signature projects in its track.";
  }

  if (project.difficulty === "Easy") {
    return "Good starting build if you want something practical without too much system overhead.";
  }

  if (project.difficulty === "Intermediate") {
    return "Best once you already understand the basics and want a more realistic product flow.";
  }

  return "Use this when you want a harder build that shows stronger engineering depth.";
}

function getProjectsForFilter(activeFilter: ProjectFilter) {
  if (activeFilter === "all") {
    return mockProjects;
  }

  return mockProjects.filter((project) => project.category === activeFilter);
}

function getFilterCount(activeFilter: ProjectFilter) {
  if (activeFilter === "all") {
    return mockProjects.length;
  }

  return mockProjects.filter((project) => project.category === activeFilter).length;
}

export function ProjectsVault() {
  const [activeFilter, setActiveFilter] = useState<ProjectFilter>("all");
  const [activeDifficulty, setActiveDifficulty] = useState<DifficultyFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<MockProject | null>(null);
  const totalProjectCount = mockProjects.length;

  const visibleProjects = getProjectsForFilter(activeFilter).filter((project) => {
    const matchesDifficulty =
      activeDifficulty === "all" ? true : project.difficulty === activeDifficulty;
    const matchesQuery =
      query.trim().length === 0 ? true : getProjectSearchText(project).includes(query.trim().toLowerCase());

    return matchesDifficulty && matchesQuery;
  });
  const featuredCount = visibleProjects.filter((project) => project.featured).length;
  const easyCount = visibleProjects.filter((project) => project.difficulty === "Easy").length;
  const activeHeadline =
    activeFilter === "all" ? "Project roadmap built for real work" : `${filterLabels[activeFilter]} projects`;
  const activeDescription =
    activeFilter === "all"
      ? `${totalProjectCount} guided builds across frontend, backend, database, connected apps, and full stack. The earlier four original projects are now mixed directly into the main roadmap flow.`
      : projectCategoryMeta[activeFilter].description;

  useEffect(() => {
    if (!selectedProject) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedProject(null);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedProject]);

  return (
    <div className="relative mx-auto max-w-[1520px] space-y-6 px-4 py-4 sm:px-5 lg:px-6">
      <section className="relative overflow-hidden rounded-[1.9rem] border border-white/10 bg-[#090d16]/88 p-5 shadow-[0_28px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl lg:p-6">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent_35%),radial-gradient(circle_at_top_left,rgba(168,85,247,0.12),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(34,211,238,0.1),transparent_24%)]" />
        <div className="pointer-events-none absolute -left-16 top-0 h-52 w-52 rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-0 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

        <div className="relative grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-200">
              <Boxes className="h-3.5 w-3.5 text-cyan-300" />
              Projects Vault
            </div>

            <div className="space-y-2.5">
              <h1 className="font-display text-[clamp(2rem,4vw,4.3rem)] font-black leading-[0.92] tracking-[-0.05em] text-white">
                Build projects
                <span className="bg-gradient-to-r from-fuchsia-200 via-violet-200 to-cyan-200 bg-clip-text text-transparent">
                  {" "}
                  that actually stand out
                </span>
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-zinc-300 sm:text-[15px]">
                {activeDescription}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-zinc-100">
                {totalProjectCount} projects total
              </span>
              <span className="rounded-full border border-cyan-400/15 bg-cyan-500/[0.08] px-3 py-1.5 text-xs font-semibold text-cyan-100">
                Starts easy
              </span>
              <span className="rounded-full border border-violet-400/15 bg-violet-500/[0.08] px-3 py-1.5 text-xs font-semibold text-violet-100">
                Gets harder
              </span>
              <span className="rounded-full border border-amber-300/15 bg-amber-500/[0.08] px-3 py-1.5 text-xs font-semibold text-amber-100">
                Ends with 2 signature builds
              </span>
            </div>
          </div>

          <div className="rounded-[1.45rem] border border-white/10 bg-white/[0.04] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">Current track</p>
            <h2 className="mt-2 text-[1.35rem] font-black leading-[1.1] tracking-tight text-white">
              {activeHeadline}
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-300">
              {activeFilter === "all"
                ? "Filter by track and pick the next build based on your current level."
                : "This track is ordered from simpler builds to stronger portfolio-level projects."}
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <div className="rounded-[1.1rem] border border-white/10 bg-black/20 p-3.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Projects</p>
                <p className="mt-2 text-[1.6rem] font-black tracking-tight text-white">
                  {getFilterCount(activeFilter)}
                </p>
              </div>
              <div className="rounded-[1.1rem] border border-white/10 bg-black/20 p-3.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Easy starts</p>
                <p className="mt-2 text-[1.6rem] font-black tracking-tight text-white">{easyCount}</p>
              </div>
              <div className="rounded-[1.1rem] border border-white/10 bg-black/20 p-3.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Signature builds</p>
                <p className="mt-2 text-[1.6rem] font-black tracking-tight text-white">{featuredCount}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[1.6rem] border border-white/10 bg-[#090d16]/82 p-4 shadow-[0_22px_70px_rgba(0,0,0,0.24)] backdrop-blur-2xl">
        <div className="flex flex-wrap gap-2">
          {projectFilters.map((filter) => {
            const Icon = filterIcons[filter];
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
                <Icon className={`h-4 w-4 ${isActive ? "text-cyan-300" : "text-zinc-500"}`} />
                <span>{filterLabels[filter]}</span>
                <span className="rounded-full bg-black/20 px-2 py-0.5 text-[11px] text-zinc-300">
                  {getFilterCount(filter)}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
          <div className="flex flex-wrap gap-2">
            {difficultyFilters.map((difficulty) => {
              const isActive = difficulty === activeDifficulty;
              const label = difficulty === "all" ? "All Levels" : difficulty;
              const tone =
                difficulty === "all"
                  ? "border-white/10 bg-white/[0.04] text-zinc-200"
                  : difficultyTone[difficulty];

              return (
                <button
                  key={difficulty}
                  type="button"
                  onClick={() => setActiveDifficulty(difficulty)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                    isActive
                      ? tone
                      : "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/15 hover:text-zinc-100"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <label className="flex h-10 w-full items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 xl:w-[280px]">
            <Search className="h-3.5 w-3.5 text-zinc-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search projects..."
              spellCheck={false}
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-zinc-400">
          <span>{visibleProjects.length} projects showing</span>
          <span className="h-1 w-1 rounded-full bg-zinc-600" />
          <span>Ordered from easier builds to stronger ones</span>
          <span className="h-1 w-1 rounded-full bg-zinc-600" />
          <span>{featuredCount} standout projects in this view</span>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {visibleProjects.map((project) => (
          <button
            key={project.id}
            type="button"
            onClick={() => setSelectedProject(project)}
            className="group relative overflow-hidden rounded-[1.55rem] border border-white/10 bg-[#0b111c]/88 p-5 text-left shadow-[0_20px_70px_rgba(0,0,0,0.26)] transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/20"
          >
            <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${project.accent} opacity-80`} />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <div className="relative space-y-4">
              <div className="relative h-44 overflow-hidden rounded-[1.2rem] border border-white/10 bg-black/30">
                <div className={`absolute inset-0 bg-gradient-to-br ${project.accent}`} />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.14),transparent_30%),linear-gradient(180deg,rgba(0,0,0,0.02),rgba(0,0,0,0.55))]" />
                <div className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-200">
                  Cover slot
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-lg font-black leading-tight text-white">{project.title}</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-200/80">
                    Replace this frame with your generated project thumbnail later.
                  </p>
                </div>
              </div>

              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-300">
                      {filterLabels[project.category]}
                    </span>
                    {project.featured ? (
                      <span className="rounded-full border border-amber-300/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-100">
                        Top build
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2 text-zinc-500">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Project {String(project.order).padStart(2, "0")}</span>
                  </div>
                </div>

                <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${difficultyTone[project.difficulty]}`}>
                  {project.difficulty}
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-[1.35rem] font-black leading-[1.15] tracking-tight text-white">
                  {project.title}
                </h3>
                <p className="text-sm leading-6 text-zinc-300">{project.summary}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1rem] border border-white/10 bg-black/20 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Duration</p>
                  <p className="mt-2 text-sm font-semibold text-white">{project.duration}</p>
                </div>
                <div className="rounded-[1rem] border border-white/10 bg-black/20 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Why this matters</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">{project.outcome}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {project.stack.map((item) => (
                  <span
                    key={`${project.id}-${item}`}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-zinc-300"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-4">
                <p className="text-xs text-zinc-400">
                  {project.featured ? "Strong portfolio capstone" : "Good next build in this track"}
                </p>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-white transition-all hover:border-white/20 hover:bg-white/[0.08]">
                  View brief
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                </span>
              </div>
            </div>
          </button>
        ))}
      </section>

      {visibleProjects.length === 0 ? (
        <section className="rounded-[1.5rem] border border-white/10 bg-[#090d16]/82 p-8 text-center shadow-[0_22px_70px_rgba(0,0,0,0.24)] backdrop-blur-2xl">
          <p className="text-lg font-semibold text-white">No projects matched this filter.</p>
          <p className="mt-2 text-sm text-zinc-400">Try another track, another difficulty, or a shorter search term.</p>
        </section>
      ) : null}

      {selectedProject ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Close project brief"
            className="absolute inset-0 cursor-default"
            onClick={() => setSelectedProject(null)}
          />
          <aside className="relative h-full w-full max-w-[520px] overflow-y-auto border-l border-white/10 bg-[#09111c]/96 p-5 shadow-[-20px_0_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-300">
                    {filterLabels[selectedProject.category]}
                  </span>
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${difficultyTone[selectedProject.difficulty]}`}>
                    {selectedProject.difficulty}
                  </span>
                </div>
                <h2 className="text-[1.8rem] font-black leading-[1.05] tracking-tight text-white">
                  {selectedProject.title}
                </h2>
                <p className="text-sm leading-6 text-zinc-300">{selectedProject.summary}</p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-300 transition-colors hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className={`mt-5 rounded-[1.4rem] border border-white/10 bg-gradient-to-br ${selectedProject.accent} p-[1px]`}>
              <div className="rounded-[1.35rem] bg-[#0b111c]/94 p-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[1rem] border border-white/10 bg-black/20 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Track order</p>
                    <p className="mt-2 text-sm font-semibold text-white">
                      Project {String(selectedProject.order).padStart(2, "0")}
                    </p>
                  </div>
                  <div className="rounded-[1rem] border border-white/10 bg-black/20 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Duration</p>
                    <p className="mt-2 text-sm font-semibold text-white">{selectedProject.duration}</p>
                  </div>
                  <div className="rounded-[1rem] border border-white/10 bg-black/20 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Level</p>
                    <p className="mt-2 text-sm font-semibold text-white">{selectedProject.difficulty}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-5">
              <section className="relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-black/20 p-4">
                <div className={`absolute inset-0 bg-gradient-to-br ${selectedProject.accent}`} />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.14),transparent_28%),linear-gradient(180deg,rgba(0,0,0,0.04),rgba(0,0,0,0.58))]" />
                <div className="relative">
                  <span className="inline-flex rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-100">
                    Thumbnail frame
                  </span>
                  <div className="mt-16">
                    <p className="text-[1.5rem] font-black leading-[1.05] tracking-tight text-white">
                      {selectedProject.title}
                    </p>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-200/85">
                      Keep this slot ready for the final generated preview so every project card feels complete.
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-[1.3rem] border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">Project brief</p>
                <p className="mt-3 text-sm leading-6 text-zinc-300">{selectedProject.outcome}</p>
                <p className="mt-3 text-sm leading-6 text-zinc-400">{getProjectSequenceNote(selectedProject)}</p>
              </section>

              <section className="rounded-[1.3rem] border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">What to ship</p>
                <div className="mt-3 space-y-3">
                  {getProjectChecklist(selectedProject).map((item) => (
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
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">Core stack</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedProject.stack.map((item) => (
                    <span
                      key={`${selectedProject.id}-${item}-drawer`}
                      className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-medium text-zinc-200"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </section>

              <button
                type="button"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition-all hover:-translate-y-0.5 hover:bg-zinc-100"
              >
                Start with this project
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
