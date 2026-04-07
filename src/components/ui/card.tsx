import * as React from "react"

export function Card({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return <div className={`rounded-2xl overflow-hidden transition-all duration-300 ${className}`}>{children}</div>
}

export function CardHeader({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return <div className={`p-6 pb-4 flex flex-col space-y-2 ${className}`}>{children}</div>
}

export function CardTitle({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return <h3 className={`font-bold text-xl tracking-tight text-zinc-900 dark:text-white ${className}`}>{children}</h3>
}

export function CardDescription({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return <p className={`text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed ${className}`}>{children}</p>
}

export function CardContent({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return <div className={`p-6 pt-0 ${className}`}>{children}</div>
}

export function CardFooter({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return <div className={`flex items-center p-6 pt-0 ${className}`}>{children}</div>
}