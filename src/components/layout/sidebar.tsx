"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePlatformShell } from "./PlatformShell";
import { SidebarCodeBuddyLauncher } from "./SidebarCodeBuddy";

import {
  LayoutDashboard,
  BookOpen,
  GitBranch,
  Code2,
  Terminal,
  Rocket,
  Briefcase,
  Sparkles,
  Menu,
  ChevronsLeft,
} from "lucide-react";

const sidebarLinks = [
  { href: "/dashboard", label: "Workspace", Icon: LayoutDashboard, hoverColor: "group-hover:text-blue-400", activeColor: "text-blue-400", activeGlow: "shadow-[0_0_15px_rgba(59,130,246,0.6)]", activeBg: "bg-blue-500/10", indicatorColor: "bg-blue-400" },
  { href: "/playground", label: "Sandbox", Icon: Terminal, hoverColor: "group-hover:text-emerald-400", activeColor: "text-emerald-400", activeGlow: "shadow-[0_0_15px_rgba(16,185,129,0.6)]", activeBg: "bg-emerald-500/10", indicatorColor: "bg-emerald-400" },
  { href: "/learn", label: "Curriculum", Icon: BookOpen, hoverColor: "group-hover:text-amber-400", activeColor: "text-amber-400", activeGlow: "shadow-[0_0_15px_rgba(245,158,11,0.6)]", activeBg: "bg-amber-500/10", indicatorColor: "bg-amber-400" },
  { href: "/dsa", label: "Core CS", Icon: GitBranch, hoverColor: "group-hover:text-rose-400", activeColor: "text-rose-400", activeGlow: "shadow-[0_0_15px_rgba(244,63,94,0.6)]", activeBg: "bg-rose-500/10", indicatorColor: "bg-rose-400" },
  { href: "/practice", label: "Practice", Icon: Code2, hoverColor: "group-hover:text-cyan-400", activeColor: "text-cyan-400", activeGlow: "shadow-[0_0_15px_rgba(34,211,238,0.6)]", activeBg: "bg-cyan-500/10", indicatorColor: "bg-cyan-400" },
  { href: "/projects", label: "Projects", Icon: Rocket, hoverColor: "group-hover:text-indigo-400", activeColor: "text-indigo-400", activeGlow: "shadow-[0_0_15px_rgba(99,102,241,0.6)]", activeBg: "bg-indigo-500/10", indicatorColor: "bg-indigo-400" },
  { href: "/interview-prep", label: "Mock Teck", Icon: Briefcase, hoverColor: "group-hover:text-orange-400", activeColor: "text-orange-400", activeGlow: "shadow-[0_0_15px_rgba(249,115,22,0.6)]", activeBg: "bg-orange-500/10", indicatorColor: "bg-orange-400" },
  { href: "/ai-assistant", label: "Code Buddy", Icon: Sparkles, hoverColor: "group-hover:text-violet-400", activeColor: "text-violet-400", activeGlow: "shadow-[0_0_15px_rgba(139,92,246,0.6)]", activeBg: "bg-violet-500/10", indicatorColor: "bg-violet-400" },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const { isSidebarCollapsed, toggleSidebar } = usePlatformShell();
  const isPlaygroundRoute = pathname === "/playground" || pathname.startsWith("/playground/");
  const isAiAssistantRoute = pathname === "/ai-assistant" || pathname.startsWith("/ai-assistant/");

  return (
    <>
      {/* ── Floating Toggle (Hamburger) ── */}
      {!isPlaygroundRoute && (
        <button
          className={`fixed z-50 flex h-[40px] w-[40px] items-center justify-center rounded-xl border border-white/10 bg-[#09090b]/90 text-zinc-300 shadow-[0_0_20px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-105 hover:border-white/20 hover:bg-zinc-800 hover:text-white top-20 ${
            isSidebarCollapsed
              ? "left-4 opacity-100"
              : "-left-16 opacity-0 pointer-events-none"
          }`}
          onClick={toggleSidebar}
          type="button"
          title="Open sidebar"
        >
          <Menu className="h-[18px] w-[18px]" />
        </button>
      )}

      {/* ── Overlay (mobile) ── */}
      {!isSidebarCollapsed && (
        <div
          className="fixed inset-0 z-30 bg-black/45 backdrop-blur-sm lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* ── Sidebar panel ── */}
      <aside
        className={`fixed left-0 top-16 mt-0 z-40 flex h-[calc(100vh-4rem)] w-[236px] self-start flex-col bg-[#09090b]/95 backdrop-blur-2xl transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] lg:sticky lg:top-16 lg:z-10 ${
          isSidebarCollapsed ? "-translate-x-full lg:-ml-[236px]" : "translate-x-0 lg:ml-0"
        }`}
      >
        <div className="pointer-events-none absolute inset-y-4 right-3 w-px bg-gradient-to-b from-transparent via-white/8 to-transparent" />

        <button
          className={`absolute right-3 top-5 z-10 flex h-7 w-7 translate-x-1/2 items-center justify-center rounded-full border border-white/8 bg-[#111114]/95 text-zinc-500 shadow-[0_10px_24px_rgba(0,0,0,0.35)] transition-all duration-300 hover:border-white/16 hover:bg-zinc-900 hover:text-white ${
            isSidebarCollapsed ? "pointer-events-none scale-90 opacity-0" : "scale-100 opacity-100 delay-100"
          }`}
          onClick={toggleSidebar}
          type="button"
          title="Collapse sidebar"
        >
          <ChevronsLeft className="h-3.5 w-3.5" />
        </button>

        <div className="flex flex-col items-start overflow-y-auto px-4 py-5 [&::-webkit-scrollbar]:hidden">
          <nav className="flex w-full flex-col items-start space-y-1.5">
            {sidebarLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`group relative flex w-[176px] items-center gap-3 rounded-full px-3 py-2.5 text-[14px] font-medium transition-all duration-300 ${
                    isActive
                      ? "text-white"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <div className={`absolute inset-0 rounded-full bg-white/5 opacity-0 transition-opacity duration-300 ${isActive ? "hidden" : "group-hover:opacity-100"}`} />

                  {isActive && (
                    <div className={`absolute inset-0 rounded-full ${link.activeBg} border border-white/[0.08] shadow-[0_0_15px_rgba(0,0,0,0.2)_inset] backdrop-blur-sm`} />
                  )}

                  {isActive && (
                    <div className={`absolute left-2.5 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full ${link.indicatorColor} ${link.activeGlow}`} />
                  )}

                  <link.Icon
                    size={18}
                    className={`relative z-10 shrink-0 transition-all duration-300 ${
                      isActive
                        ? `scale-110 stroke-[2.5] ${link.activeColor} drop-shadow-[0_0_8px_currentColor]`
                        : `stroke-[2] text-zinc-500 group-hover:scale-110 group-hover:rotate-[-4deg] ${link.hoverColor}`
                    }`}
                  />

                  <span className="relative z-10 tracking-normal">{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {!isAiAssistantRoute ? (
            <div className="w-full">
              <SidebarCodeBuddyLauncher key={`${pathname}-${isSidebarCollapsed ? "closed" : "open"}`} />
            </div>
          ) : null}
        </div>
      </aside>
    </>
  );
};
