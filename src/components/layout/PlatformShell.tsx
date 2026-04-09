"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef, useSyncExternalStore } from "react";
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
  isPlaygroundChromeVisible: boolean;
  showPlaygroundChrome: () => void;
  schedulePlaygroundChromeHide: () => void;
  cancelPlaygroundChromeHide: () => void;
};

const PlatformShellContext = createContext<PlatformShellContextValue>({
  isPlaygroundRoute: false,
  isPlaygroundSidebarOpen: true,
  togglePlaygroundSidebar: () => {},
  isSidebarCollapsed: false,
  toggleSidebar: () => {},
  setSidebarCollapsed: () => {},
  isPlaygroundChromeVisible: true,
  showPlaygroundChrome: () => {},
  schedulePlaygroundChromeHide: () => {},
  cancelPlaygroundChromeHide: () => {},
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
  const [playgroundChromeState, setPlaygroundChromeState] = useState({
    path: "",
    visible: false,
  });
  const playgroundChromeHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSidebarCollapsed = isCompactViewport ? !isMobileSidebarOpen : isDesktopSidebarCollapsed;
  const shouldShowFooter = !isPlaygroundRoute;
  const shouldAutoHidePlaygroundChrome = isPlaygroundRoute && !isCompactViewport;
  const isPlaygroundChromeVisible = shouldAutoHidePlaygroundChrome
    ? (playgroundChromeState.path === pathname ? playgroundChromeState.visible : false)
    : true;

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

  const cancelPlaygroundChromeHide = useCallback(() => {
    if (playgroundChromeHideTimerRef.current) {
      clearTimeout(playgroundChromeHideTimerRef.current);
      playgroundChromeHideTimerRef.current = null;
    }
  }, []);

  const showPlaygroundChrome = useCallback(() => {
    cancelPlaygroundChromeHide();
    setPlaygroundChromeState({
      path: pathname,
      visible: true,
    });
  }, [cancelPlaygroundChromeHide, pathname]);

  const schedulePlaygroundChromeHide = useCallback(() => {
    if (!shouldAutoHidePlaygroundChrome) {
      return;
    }

    cancelPlaygroundChromeHide();
    playgroundChromeHideTimerRef.current = setTimeout(() => {
      setPlaygroundChromeState({
        path: pathname,
        visible: false,
      });
      playgroundChromeHideTimerRef.current = null;
    }, 160);
  }, [cancelPlaygroundChromeHide, pathname, shouldAutoHidePlaygroundChrome]);

  useEffect(() => cancelPlaygroundChromeHide, [cancelPlaygroundChromeHide]);

  const shouldRenderInlineNavbar = !shouldAutoHidePlaygroundChrome;
  const shouldRenderOverlayNavbar = shouldAutoHidePlaygroundChrome && isPlaygroundChromeVisible;
  const shouldShowSidebar = (
    !isPlaygroundRoute ||
    (shouldAutoHidePlaygroundChrome ? isPlaygroundChromeVisible : isPlaygroundSidebarOpen)
  ) && !isCourseDetailRoute;

  return (
    <PlatformShellContext.Provider
      value={{
        isPlaygroundRoute,
        isPlaygroundSidebarOpen,
        togglePlaygroundSidebar: () => setIsPlaygroundSidebarOpen((c) => !c),
        isSidebarCollapsed,
        toggleSidebar,
        setSidebarCollapsed: setSidebarCollapsedSafe,
        isPlaygroundChromeVisible,
        showPlaygroundChrome,
        schedulePlaygroundChromeHide,
        cancelPlaygroundChromeHide,
      }}
    >
      <div className="relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 grid-pattern opacity-25" />
          <div className="absolute -left-24 top-0 h-[420px] w-[420px] rounded-full bg-primary/12 blur-[140px]" />
          <div className="absolute right-[-120px] top-12 h-[340px] w-[340px] rounded-full bg-cyan-400/8 blur-[120px]" />
          <div className="absolute bottom-[-120px] left-1/3 h-[320px] w-[320px] rounded-full bg-violet-500/10 blur-[140px]" />
        </div>
        {shouldAutoHidePlaygroundChrome ? (
          <>
            <div
              aria-hidden="true"
              className="fixed inset-x-0 top-0 z-40 h-5"
              onMouseEnter={showPlaygroundChrome}
            />
            <div
              aria-hidden="true"
              className="fixed left-0 top-0 z-40 h-full w-5"
              onMouseEnter={showPlaygroundChrome}
            />
          </>
        ) : null}
        {shouldRenderInlineNavbar ? <Navbar /> : null}
        {shouldRenderOverlayNavbar ? (
          <div
            className="fixed inset-x-0 top-0 z-50"
            onMouseEnter={cancelPlaygroundChromeHide}
            onMouseLeave={schedulePlaygroundChromeHide}
          >
            <Navbar />
          </div>
        ) : null}
        <div className="relative z-10 mt-0 flex min-h-0 flex-1 pt-0">
          {shouldShowSidebar ? <Sidebar /> : null}
          <main className={`relative transition-all duration-300 ${isPlaygroundRoute ? "min-h-0 min-w-0 flex-1 overflow-hidden" : "min-h-0 min-w-0 flex-1 overflow-y-auto"} ${shouldShowSidebar && isSidebarCollapsed && !isPlaygroundRoute ? 'lg:pl-[4.5rem]' : ''}`}>
            {children}
          </main>
        </div>
        {shouldShowFooter ? (
          <div className="relative z-10">
            <Footer />
          </div>
        ) : null}
      </div>
    </PlatformShellContext.Provider>
  );
}

export function usePlatformShell() {
  return useContext(PlatformShellContext);
}
