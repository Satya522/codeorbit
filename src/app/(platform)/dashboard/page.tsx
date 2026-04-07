"use client";

import Link from "next/link";
import React from "react";
import { ProfileConnectionsPanel } from "@/features/dashboard/ProfileConnectionsPanel";

/* ─── Mock data ─── */
const stats = [
  { label: "Current Streak", value: "14", unit: "Days", icon: "🔥", trend: "+3 from last week", href: "/practice" },
  { label: "Problems Solved", value: "42", unit: "", icon: "🧠", trend: "8 this week", href: "/dsa" },
  { label: "Global Rank", value: "Top 5%", unit: "", icon: "🏆", trend: "↑ 12 positions", href: "/practice" },
  { label: "Projects Built", value: "3", unit: "Apps", icon: "🚀", trend: "1 in progress", href: "/projects" },
];

const recentActivity = [
  { type: "solved", title: "Two Sum", tag: "Easy", language: "Python", time: "2 hours ago", href: "/dsa" },
  { type: "solved", title: "Valid Parentheses", tag: "Easy", language: "JavaScript", time: "5 hours ago", href: "/dsa" },
  { type: "project", title: "Portfolio Website", tag: "React", language: "TypeScript", time: "Yesterday", href: "/projects" },
  { type: "solved", title: "Reverse Linked List", tag: "Medium", language: "Java", time: "2 days ago", href: "/dsa" },
  { type: "module", title: "React Hooks Deep Dive", tag: "Advanced", language: "", time: "3 days ago", href: "/learn" },
];

const upNext = [
  { category: "DSA Daily", title: "Reverse Linked List II", difficulty: "Medium", time: "15 mins", href: "/dsa" },
  { category: "Module", title: "React Server Components", difficulty: "Advanced", time: "45 mins", href: "/learn" },
  { category: "Project", title: "E-Commerce Dashboard", difficulty: "Intermediate", time: "2 hours", href: "/projects" },
];

const quickActions = [
  { label: "Sandbox", icon: "💻", desc: "Write & test code", href: "/playground" },
  { label: "Code Buddy", icon: "🤖", desc: "Get instant AI help", href: "/ai-assistant" },
  { label: "Core CS", icon: "🧠", desc: "Solve problems", href: "/dsa" },
  { label: "Mock Teck", icon: "🎤", desc: "Practice interviews", href: "/interview-prep" },
];

const skillProgress = [
  { name: "Arrays & Hashing", solved: 12, total: 20 },
  { name: "Linked Lists", solved: 8, total: 15 },
  { name: "Trees & Graphs", solved: 5, total: 18 },
  { name: "Dynamic Programming", solved: 3, total: 22 },
  { name: "Binary Search", solved: 6, total: 10 },
];

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const heatmapData = [
  [3, 5, 2, 0, 4, 1, 3],
  [2, 4, 6, 3, 1, 0, 2],
  [1, 3, 5, 7, 2, 4, 1],
  [4, 2, 3, 5, 6, 2, 3],
];

function getHeatColor(val: number) {
  if (val === 0) return "rgba(168,85,247,0.03)";
  if (val <= 2) return "rgba(168,85,247,0.15)";
  if (val <= 4) return "rgba(168,85,247,0.3)";
  if (val <= 6) return "rgba(168,85,247,0.5)";
  return "rgba(168,85,247,0.8)";
}

function getDifficultyColor(d: string) {
  if (d === "Easy") return "text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
  if (d === "Medium") return "text-amber-500 dark:text-amber-400 bg-amber-500/10 border-amber-500/20";
  if (d === "Hard") return "text-red-500 dark:text-red-400 bg-red-500/10 border-red-500/20";
  return "text-purple-500 dark:text-purple-400 bg-purple-500/10 border-purple-500/20";
}

const premiumCardClass = "relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/30 hover:shadow-[0_15px_40px_rgba(168,85,247,0.15)] dark:border-white/10 dark:bg-white/[0.02] dark:shadow-none dark:hover:border-purple-500/30 dark:hover:shadow-[0_15px_40px_rgba(168,85,247,0.15)]";
const iconGradientClass = "bg-gradient-to-br from-purple-400 to-pink-500 bg-clip-text text-transparent";

/* ═══════════════════════════════════════════ */
export default function DashboardPage() {
  return (
    <div className="relative min-h-full bg-background text-foreground transition-colors duration-[800ms] ease-in-out">
      <div className="mx-auto max-w-[1400px] space-y-6 p-5 sm:p-6 lg:p-7">

        {/* ═══════ HEADER ═══════ */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between pb-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Overview
            </h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Welcome back. You&apos;re in the top <span className="font-medium text-zinc-900 dark:text-zinc-200">5%</span> of learners this week.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/profile"
              className="rounded-lg border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/[0.03] px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-colors hover:bg-black/10 dark:hover:bg-white/[0.08]"
            >
              View Profile
            </Link>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/10 dark:bg-white/10 text-sm font-semibold text-foreground">
              D
            </div>
          </div>
        </header>

        <ProfileConnectionsPanel />

        {/* ═══════ STAT CARDS ═══════ */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <Link key={i} href={s.href} className="group block h-full">
              <div className={`${premiumCardClass} h-full`}>
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{s.label}</span>
                  <span className={`text-xl opacity-90 ${iconGradientClass} drop-shadow-sm group-hover:scale-110 transition-transform`}>{s.icon}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-semibold tracking-tight text-foreground">{s.value}</span>
                  {s.unit && <span className="text-sm font-medium text-zinc-500">{s.unit}</span>}
                </div>
                <p className="mt-2 text-xs text-zinc-500">{s.trend}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* ═══════ QUICK ACTIONS ═══════ */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((a, i) => (
            <Link key={i} href={a.href} className="group block h-full">
              <div className={`${premiumCardClass} flex h-full items-center gap-4`}>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-black/10 bg-white dark:border-white/10 dark:bg-white/5 text-lg transition-transform group-hover:scale-110 shadow-sm">
                  <span className={iconGradientClass}>{a.icon}</span>
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">{a.label}</p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{a.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* ═══════ MAIN GRID ═══════ */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">

          {/* ── Activity Heatmap ── */}
          <div className={`${premiumCardClass} lg:col-span-2`}>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-base font-medium text-foreground">Activity</h3>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Last 4 weeks of contributions</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex gap-2 pl-12">
                {weekDays.map((d) => (
                  <div key={d} className="flex-1 text-center text-xs font-medium text-zinc-500">{d}</div>
                ))}
              </div>
              {heatmapData.map((week, wi) => (
                <div key={wi} className="flex items-center gap-2">
                  <span className="w-10 text-right text-xs font-medium text-zinc-500">W{wi + 1}</span>
                  {week.map((val, di) => (
                    <div
                      key={di}
                      className="flex-1 rounded border border-black/5 dark:border-white/5 transition-colors hover:border-purple-500/50"
                      style={{ background: getHeatColor(val), aspectRatio: "1" }}
                      title={`${val} contributions`}
                    />
                  ))}
                </div>
              ))}
              <div className="flex items-center justify-end gap-2 pt-4">
                <span className="text-xs font-medium text-zinc-500">Less</span>
                {[0, 2, 4, 6, 7].map((v) => (
                  <div key={v} className="h-3 w-3 rounded-sm" style={{ background: getHeatColor(v) }} />
                ))}
                <span className="text-xs font-medium text-zinc-500">More</span>
              </div>
            </div>
          </div>

          {/* ── Skill Progress ── */}
          <div className={premiumCardClass}>
            <div className="mb-6">
              <h3 className="text-base font-medium text-foreground">Skills</h3>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">DSA topic breakdown</p>
            </div>
            <div className="space-y-5">
              {skillProgress.map((s, i) => {
                const pct = Math.round((s.solved / s.total) * 100);
                return (
                  <div key={i} className="group/skill block">
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="font-medium text-zinc-700 dark:text-zinc-300 transition-colors group-hover/skill:text-purple-500">{s.name}</span>
                      <span className="font-medium text-zinc-500">{s.solved}/{s.total}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                      <div className="h-full rounded-full bg-gradient-to-r from-purple-400 to-pink-500 transition-all duration-1000 ease-out" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Up Next ── */}
          <div className={premiumCardClass}>
            <div className="mb-6">
              <h3 className="text-base font-medium text-foreground">Up Next</h3>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Continue learning</p>
            </div>
            <div className="space-y-4">
              {upNext.map((item, i) => (
                <Link key={i} href={item.href} className="group block">
                  <div className="rounded-lg border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] p-4 transition-all hover:bg-black/[0.04] dark:hover:bg-white/[0.04] hover:border-purple-500/30">
                    <div className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-purple-600 dark:text-purple-400">
                      {item.category}
                    </div>
                    <h4 className="text-sm font-medium text-zinc-800 dark:text-zinc-200 transition-colors group-hover:text-purple-600 dark:group-hover:text-purple-400">
                      {item.title}
                    </h4>
                    <div className="mt-3 flex items-center gap-3">
                      <span className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${getDifficultyColor(item.difficulty)}`}>
                        {item.difficulty}
                      </span>
                      <span className="text-xs font-medium text-zinc-500">{item.time}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

        </div>

        {/* ═══════ RECENT ACTIVITY ═══════ */}
        <div className={premiumCardClass}>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-base font-medium text-foreground">Recent Activity</h3>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Your latest coding sessions</p>
            </div>
            <Link href="/practice" className="text-sm font-medium text-zinc-500 dark:text-zinc-400 transition-colors hover:text-purple-600 dark:hover:text-purple-400">
              View History →
            </Link>
          </div>
          <div className="divide-y divide-black/5 dark:divide-white/5">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0 group">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 text-sm transition-transform group-hover:scale-110 shadow-sm">
                  <span className={iconGradientClass}>{a.type === "solved" ? "✅" : a.type === "project" ? "🚀" : "📚"}</span>
                </span>
                <div className="flex flex-1 flex-col justify-between gap-2 sm:flex-row sm:items-center">
                  <div>
                    <h4 className="text-sm font-medium text-zinc-800 dark:text-zinc-200 transition-colors group-hover:text-purple-600 dark:group-hover:text-purple-400">{a.title}</h4>
                    <div className="mt-1 flex items-center gap-2">
                       <span className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${getDifficultyColor(a.tag)}`}>{a.tag}</span>
                       {a.language && <span className="text-xs font-medium text-zinc-500">{a.language}</span>}
                    </div>
                  </div>
                  <span className="text-sm font-medium text-zinc-500">{a.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
