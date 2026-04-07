"use client";

import { createContext, useContext, useState, useCallback, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "./navbar";
import { Sidebar } from "./sidebar";
import { Footer } from "./footer";

type PlatformShellContextValue = {
  isPlaygroundRoute: boolean;
  isPlaygroundSidebarOpen: boolean;
  togglePlaygroundSidebar: () => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
};

const PlatformShellContext = createContext<PlatformShellContextValue>({
  isPlaygroundRoute: false,
  isPlaygroundSidebarOpen: true,
  togglePlaygroundSidebar: () => {},
  isSidebarCollapsed: false,
  toggleSidebar: () => {},
  setSidebarCollapsed: () => {},
});

function useMediaQuery(query: string) {
  const subscribe = useCallback((onStoreChange: () => void) => {
    const mediaQuery = window.matchMedia(query);
    mediaQuery.addEventListener("change", onStoreChange);
    return () => mediaQuery.removeEventListener("change", onStoreChange);
  }, [query]);

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

export function PlatformShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPlaygroundRoute = pathname === "/playground" || pathname.startsWith("/playground/");
  /* Hide global sidebar when inside a specific course (e.g. /learn/java) */
  const isCourseDetailRoute = /^\/(?:learn|curriculum)\/[^/]+(?:\/|$)/.test(pathname);
  const [isPlaygroundSidebarOpen, setIsPlaygroundSidebarOpen] = useState(true);
  const isCompactViewport = useMediaQuery("(max-width: 1023px)");
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const isSidebarCollapsed = isCompactViewport ? !isMobileSidebarOpen : isDesktopSidebarCollapsed;

  const toggleSidebar = useCallback(() => {
    if (isCompactViewport) {
      setIsMobileSidebarOpen((open) => !open);
      return;
    }

    setIsDesktopSidebarCollapsed((collapsed) => !collapsed);
  }, [isCompactViewport]);

  const setSidebarCollapsedSafe = useCallback((v: boolean) => {
    if (isCompactViewport) {
      setIsMobileSidebarOpen(!v);
      return;
    }

    setIsDesktopSidebarCollapsed(v);
  }, [isCompactViewport]);

  const shouldShowSidebar = (!isPlaygroundRoute || isPlaygroundSidebarOpen) && !isCourseDetailRoute;

  return (
    <PlatformShellContext.Provider
      value={{
        isPlaygroundRoute,
        isPlaygroundSidebarOpen,
        togglePlaygroundSidebar: () => setIsPlaygroundSidebarOpen((c) => !c),
        isSidebarCollapsed,
        toggleSidebar,
        setSidebarCollapsed: setSidebarCollapsedSafe,
      }}
    >
      <div className="relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 grid-pattern opacity-25" />
          <div className="absolute -left-24 top-0 h-[420px] w-[420px] rounded-full bg-primary/12 blur-[140px]" />
          <div className="absolute right-[-120px] top-12 h-[340px] w-[340px] rounded-full bg-cyan-400/8 blur-[120px]" />
          <div className="absolute bottom-[-120px] left-1/3 h-[320px] w-[320px] rounded-full bg-violet-500/10 blur-[140px]" />
        </div>
        <Navbar />
        <div className="relative z-10 mt-0 flex min-h-0 flex-1 pt-0">
          {shouldShowSidebar ? <Sidebar /> : null}
          <main className={`relative transition-all duration-300 ${isPlaygroundRoute ? "min-h-0 min-w-0 flex-1 overflow-hidden" : "min-h-0 min-w-0 flex-1 overflow-y-auto"} ${shouldShowSidebar && isSidebarCollapsed && !isPlaygroundRoute ? 'lg:pl-[4.5rem]' : ''}`}>
            {children}
          </main>
        </div>
        <div className="relative z-10">
          <Footer />
        </div>
      </div>
    </PlatformShellContext.Provider>
  );
}

export function usePlatformShell() {
  return useContext(PlatformShellContext);
}
