"use client";

import { Moon } from "lucide-react";

export function ThemeToggle() {
  return (
    <div
      aria-label="Dark theme active"
      className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-zinc-200 shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-xl"
      title="Dark theme active"
    >
      <Moon className="h-5 w-5" />
    </div>
  );
}
