import * as React from "react"

export function Badge({ children, variant = "default", className = "" }: { children: React.ReactNode, variant?: "default" | "outline" | "secondary" | "success" | "warning", className?: string }) {
  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors";
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/80",
    secondary: "bg-zinc-800 text-zinc-100 hover:bg-zinc-700",
    outline: "border border-border text-foreground hover:bg-zinc-800 text-zinc-300",
    success: "bg-green-500/20 text-green-500 border border-green-500/30",
    warning: "bg-orange-500/20 text-orange-500 border border-orange-500/30",
  };
  return (
    <div className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </div>
  )
}
