"use client";

import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BookOpen, Dumbbell, Network, FolderDot, Info, TerminalSquare, ChevronDown } from "lucide-react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";

const marketingNavLinks = [
  { href: "/learn", label: "Curriculum", icon: BookOpen },
  { href: "/practice", label: "Practice", icon: Dumbbell },
  { href: "/dsa", label: "DSA", icon: Network },
  { href: "/projects", label: "Projects", icon: FolderDot },
  { href: "/about", label: "About", icon: Info },
];

const platformPrefixes = ["/dashboard", "/learn", "/dsa", "/practice", "/playground", "/projects", "/interview-prep", "/ai-assistant"];

/* ============================================ */
/*  BRAND LOCKUP                                */
/* ============================================ */
function BrandLockup() {
  return (
    <Link href="/" className="group flex items-center shrink-0 gap-2 rounded-full py-1 pr-2 sm:pr-4 pl-1 hover:bg-white/[0.04] transition-all duration-500">
      <div className="relative flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-gradient-to-b from-[#1a1a24] to-[#0d0d12] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_4px_10px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden">
        <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-md" />
        <Image
          src="/codeorbit-logo-mark-cropped.png"
          alt="CodeOrbit"
          width={526}
          height={394}
          priority
          className="relative z-10 h-4 w-4 sm:h-6 sm:w-6 object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.1)] transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12"
        />
      </div>
      <span className="text-[1.1rem] sm:text-[1.25rem] font-bold tracking-tight text-white/90 group-hover:text-white transition-colors duration-300 flex items-center gap-0.5">
        Code<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-violet-400 to-cyan-400 font-extrabold group-hover:drop-shadow-[0_0_12px_rgba(139,92,246,0.6)] transition-all">Orbit</span>
      </span>
    </Link>
  );
}

/* ============================================ */
/*  MAIN NAVBAR COMPONENT                      */
/* ============================================ */
import { usePlatformShell } from "./PlatformShell";

export const Navbar = () => {
  const { isSidebarCollapsed } = usePlatformShell();
  const { isSignedIn, user } = useUser();
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();

  const pathname = usePathname();
  const isPlatformNavbar = platformPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  const isAiAssistantRoute = pathname === "/ai-assistant" || pathname.startsWith("/ai-assistant/");
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const profileInitials = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .map((part) => part?.trim()?.[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase() || user?.username?.slice(0, 2).toUpperCase() || "CO";

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 30);
  });

  const clearHideTimer = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  useEffect(() => {
    clearHideTimer();
    return () => clearHideTimer();
  }, [isAiAssistantRoute, pathname, isSidebarCollapsed]);

  return (
    <>
      <div className="sticky top-0 z-50 w-full flex justify-center border-b border-white/[0.04]">
        <motion.header
          onMouseLeave={() => { if(isAiAssistantRoute) clearHideTimer(); }}
          className={`pointer-events-auto flex w-full items-center justify-between transition-all duration-500 ease-out px-4 md:px-6 py-2 ${
            isScrolled 
              ? "bg-[#050508]/85 backdrop-blur-3xl shadow-[0_16px_40px_-5px_rgba(0,0,0,0.5)]" 
              : "bg-[#09090b]/95 backdrop-blur-xl"
          }`}
        >
          {/* Background Ambient Glow inside Island */}
          <div className="absolute inset-0 z-0 overflow-hidden rounded-full pointer-events-none">
            <div className="absolute -inset-[100px] bg-gradient-to-r from-primary/5 via-cyan-500/5 to-violet-500/5 blur-3xl opacity-50" />
          </div>

          <div className="relative z-10 flex items-center pr-2">
            <BrandLockup />
          </div>

          {/* Persistent Inline Navigation Links */}
          <nav className="relative z-10 flex flex-1 overflow-x-auto no-scrollbar items-center gap-1 sm:gap-2 px-2 shrink-0">
            <div className="flex items-center gap-1 bg-white/[0.02] border border-white/[0.03] p-1 rounded-full shadow-inner mx-auto">
              {marketingNavLinks.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`group relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 text-[12px] sm:text-[14px] font-semibold tracking-[0.01em] transition-all duration-300 rounded-full shrink-0 ${
                      isActive ? "text-white" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="magic-nav-pill"
                        className="absolute inset-0 z-0 rounded-full bg-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                    )}
                    {isActive && (
                      <motion.div 
                        layoutId="magic-nav-glow"
                        className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 h-[2px] w-1/2 bg-gradient-to-r from-transparent via-primary to-transparent blur-sm"
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                    )}
                    {isActive && (
                      <motion.div 
                        layoutId="magic-nav-glow-core"
                        className="absolute -bottom-[2px] left-1/2 -translate-x-1/2 h-[1px] w-1/3 bg-cyan-300"
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                    )}
                    
                    <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
                      <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 transition-transform duration-300 ${isActive ? "text-primary scale-110" : "group-hover:text-primary/70 group-hover:scale-110"}`} />
                      <span className="hidden min-[1000px]:block">{link.label}</span>
                      <span className="block min-[1000px]:hidden">{link.label}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="relative z-10 flex shrink-0 items-center justify-end gap-1 sm:gap-2 pl-2">
            <Link
              href="/playground"
              className="hidden min-[1150px]:flex group shrink-0 items-center justify-center gap-2 rounded-full border border-white/[0.05] bg-white/[0.02] px-3 sm:px-5 py-2 sm:py-2.5 text-[12px] sm:text-[14px] font-semibold text-zinc-300 transition-all hover:bg-white/[0.06] hover:text-white hover:border-white/10 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]"
            >
              <TerminalSquare className="h-4 w-4 text-cyan-400 group-hover:text-cyan-300 shrink-0" />
              <span className="hidden sm:inline">Playground</span>
            </Link>

            <Link
              href={isSignedIn ? "/dashboard" : "/sign-in"}
              className="group relative flex shrink-0 items-center justify-center gap-1 sm:gap-2 overflow-hidden rounded-full bg-white px-4 sm:px-6 py-2 sm:py-2.5 text-[12px] sm:text-[14px] font-bold text-black transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_30px_rgba(255,255,255,0.1)]"
            >
              <span className="pointer-events-none absolute inset-[-10px] rounded-full bg-gradient-to-r from-transparent via-white/50 to-transparent blur-md transition-opacity duration-300 opacity-0 group-hover:opacity-100 animate-slide-right" />
              <span className="relative z-10 flex items-center gap-1.5">
                {isSignedIn ? "Workspace" : "Sign In"}
                <ChevronDown className="h-3.5 w-3.5 -rotate-90 transition-transform group-hover:translate-x-1 shrink-0" />
              </span>
            </Link>

            {isPlatformNavbar && isSignedIn ? (
              <Link
                aria-label="Profile"
                href="/profile"
                className="hidden lg:flex shrink-0 ml-1 sm:ml-2 h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-[#121217] to-[#1a1a24] text-[10px] sm:text-xs font-bold text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] transition-all hover:scale-105 hover:border-primary/40 hover:shadow-[0_0_15px_rgba(139,92,246,0.3)]"
              >
                {profileInitials}
              </Link>
            ) : null}
          </div>
        </motion.header>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slide-right {
          0% { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(200%) skewX(-15deg); }
        }
        .animate-slide-right {
          animation: slide-right 2s infinite;
        }
        /* Hide scrollbar for inline scrolling navigation just in case of tiny screens */
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none; /* IE and Edge */
          scrollbar-width: none; /* Firefox */
        }
      `}} />
    </>
  );
};
