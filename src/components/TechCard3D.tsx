"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { useRef, type ComponentType, type CSSProperties, type MouseEvent } from "react";

type TechCardIcon = ComponentType<{
  className?: string;
  style?: CSSProperties;
}>;

type TechCard3DProps = {
  title: string;
  description: string;
  color: string;
  progress: number;
  slug: string;
  href?: string;
  icon?: TechCardIcon;
  iconClassName?: string;
  ctaLabel?: string;
  orbitLabel?: string;
  focusLabel?: string;
  lessonCount?: number;
  difficulty?: string;
  estimatedHours?: number;
  durationLabel?: string;
  statusLabel?: string;
  statusTone?: string;
  currentLesson?: string;
};

function clampProgress(progress: number) {
  return Math.max(0, Math.min(100, progress));
}

function getMomentumLabel(progress: number) {
  if (progress >= 80) {
    return "High momentum";
  }

  if (progress >= 55) {
    return "Steady growth";
  }

  return "Fresh track";
}

export function TechCard3D({
  title,
  description,
  color,
  progress,
  slug,
  href,
  icon: Icon,
  iconClassName,
  ctaLabel,
  orbitLabel,
  focusLabel,
  lessonCount,
  difficulty,
  estimatedHours,
  durationLabel,
  statusLabel,
  statusTone,
  currentLesson,
}: TechCard3DProps) {
  const ref = useRef<HTMLDivElement>(null);
  const pointerX = useMotionValue(50);
  const pointerY = useMotionValue(50);
  const glowBackground = useMotionTemplate`radial-gradient(circle at ${pointerX}% ${pointerY}%, rgba(56,189,248,0.10), transparent 48%)`;

  const safeProgress = clampProgress(progress);
  const destination = href ?? `/learn/${slug}`;

  function handleMouseMove(event: MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    pointerX.set(((event.clientX - rect.left) / rect.width) * 100);
    pointerY.set(((event.clientY - rect.top) / rect.height) * 100);
  }

  function handleMouseLeave() {
    pointerX.set(50);
    pointerY.set(50);
  }

  return (
    <Link href={destination} className="block h-full focus:outline-none">
      <motion.article
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        whileHover={{ y: -6 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="group relative h-full"
      >
        <div className="relative flex h-full min-h-[18.75rem] flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(8,11,22,0.96),rgba(5,7,16,0.94))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl transition-all duration-300 group-hover:border-white/20 group-hover:shadow-[0_28px_90px_rgba(0,0,0,0.35)] sm:p-6">
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            style={{ background: glowBackground }}
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-70" />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[1.75rem] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            style={{
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 0 24px rgba(56,189,248,0.12)",
            }}
          />

          <div className="relative z-10 flex h-full flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 space-y-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                  style={{
                    background: `color-mix(in srgb, ${color} 14%, rgba(255,255,255,0.02))`,
                    borderColor: `color-mix(in srgb, ${color} 28%, rgba(255,255,255,0.08))`,
                  }}
                >
                  {Icon ? (
                    <Icon className="h-6 w-6" style={{ color }} />
                  ) : iconClassName ? (
                    <i className={`${iconClassName} text-[1.2rem]`} style={{ color }} aria-hidden="true" />
                  ) : null}
                </div>

                <div className="min-w-0">
                  {orbitLabel ? (
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                      {orbitLabel}
                    </p>
                  ) : null}
                  <h3 className="mt-1 text-xl font-bold tracking-tight text-white transition-colors duration-300 group-hover:text-white/95">
                    {title}
                  </h3>
                </div>
              </div>

              <div className="shrink-0 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-right backdrop-blur-xl">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">Progress</p>
                <p className="mt-1 text-lg font-bold text-white">{safeProgress}%</p>
              </div>
            </div>

            <p className="line-clamp-3 text-sm leading-6 text-slate-400">{description}</p>

            {currentLesson ? (
              <div className="rounded-2xl border border-white/8 bg-black/20 px-3 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Current lesson</p>
                <p className="mt-1 line-clamp-2 text-sm font-medium text-zinc-200">{currentLesson}</p>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              {focusLabel ? (
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-zinc-200">
                  {focusLabel}
                </span>
              ) : null}
              {difficulty ? (
                <span
                  className="rounded-full border px-3 py-1 text-xs font-medium"
                  style={{
                    borderColor: `color-mix(in srgb, ${color} 28%, rgba(255,255,255,0.1))`,
                    background: `color-mix(in srgb, ${color} 12%, rgba(255,255,255,0.02))`,
                    color,
                  }}
                >
                  {difficulty}
                </span>
              ) : null}
              {lessonCount !== undefined ? (
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-zinc-300">
                  {lessonCount} lessons
                </span>
              ) : null}
              {estimatedHours !== undefined ? (
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-zinc-300">
                  {estimatedHours}h
                </span>
              ) : null}
              {durationLabel ? (
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-zinc-300">
                  {durationLabel}
                </span>
              ) : null}
              {statusLabel ? (
                <span className={`rounded-full border px-3 py-1 text-xs font-medium ${statusTone ?? "border-white/10 bg-white/[0.04] text-zinc-300"}`}>
                  {statusLabel}
                </span>
              ) : null}
            </div>

            <div className="mt-auto space-y-3">
              <div className="h-2 overflow-hidden rounded-full bg-white/6">
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${safeProgress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  style={{
                    background: `linear-gradient(90deg, color-mix(in srgb, ${color} 65%, white), ${color})`,
                    boxShadow: `0 0 14px color-mix(in srgb, ${color} 35%, transparent)`,
                  }}
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-zinc-500">{getMomentumLabel(safeProgress)}</p>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white transition-colors duration-300 group-hover:border-white/20 group-hover:bg-white/[0.08]">
                  {ctaLabel ?? (safeProgress > 0 ? "Continue track" : "Start track")}
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}
