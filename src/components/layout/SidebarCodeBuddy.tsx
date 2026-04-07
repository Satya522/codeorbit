"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, ExternalLink, Loader2, Sparkles, X } from "lucide-react";
import { AIService, type AIChatMessage } from "@/services/ai.service";

type QuickMessage = {
  role: "assistant" | "user";
  content: string;
};

function toHistory(messages: QuickMessage[]): AIChatMessage[] {
  return messages.map((message) => ({
    content: message.content,
    role: message.role,
  }));
}

type SidebarCodeBuddyProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function SidebarCodeBuddyLauncher() {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isOpen]);

  return (
    <div ref={wrapperRef} className="relative mt-4 w-full">
      <button
        type="button"
        onClick={() => setIsOpen((previous) => !previous)}
        className="group relative flex w-[176px] items-center gap-3 rounded-full px-3 py-2.5 text-[14px] font-medium text-zinc-200 transition-all duration-300"
      >
        <div className="absolute inset-0 rounded-full border border-violet-500/18 bg-violet-500/10 shadow-[0_0_18px_rgba(139,92,246,0.12)] transition-colors duration-300 group-hover:border-violet-400/30 group-hover:bg-violet-500/14" />
        <Sparkles
          size={18}
          className="relative z-10 shrink-0 stroke-[2.25] text-violet-300 transition-transform duration-300 group-hover:scale-110"
        />
        <span className="relative z-10 tracking-normal">Code Buddy</span>
      </button>

      <SidebarCodeBuddy isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
}

export function SidebarCodeBuddy({ isOpen, onClose }: SidebarCodeBuddyProps) {
  const [messages, setMessages] = useState<QuickMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    messagesRef.current?.scrollTo({
      top: messagesRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isSending]);

  useEffect(() => {
    if (!inputRef.current) {
      return;
    }

    inputRef.current.style.height = "auto";
    inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 96)}px`;
  }, [input]);

  const canSend = useMemo(() => input.trim().length > 0 && !isSending, [input, isSending]);

  const handleSend = async () => {
    const nextPrompt = input.trim();

    if (!nextPrompt || isSending) {
      return;
    }

    const nextMessages: QuickMessage[] = [...messages, { role: "user", content: nextPrompt }];

    setMessages(nextMessages);
    setInput("");
    setIsSending(true);

    try {
      const reply = await AIService.streamResponse(nextPrompt, {
        history: toHistory(nextMessages),
        mode: null,
      });

      setMessages((previous) => [...previous, { role: "assistant", content: reply }]);
    } catch (error) {
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content:
            error instanceof Error ? error.message : "Code Buddy is unavailable right now.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="absolute bottom-0 left-[calc(100%+12px)] z-50 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-white/10 bg-[#09090d]/96 shadow-[0_24px_80px_rgba(0,0,0,0.48)] backdrop-blur-2xl">
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-violet-400/25 bg-violet-500/12 text-violet-200">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Code Buddy</p>
            <p className="text-[11px] text-zinc-500">Quick help while you code</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/ai-assistant"
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium text-zinc-400 transition-colors hover:text-white"
          >
            Open
            <ExternalLink className="h-3 w-3" />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-white/5 hover:text-white"
            title="Close chat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={messagesRef}
        className="max-h-[280px] space-y-3 overflow-y-auto px-4 py-4 text-sm leading-6 text-zinc-200"
      >
        {messages.length === 0 ? (
          <p className="text-sm text-zinc-500">Ask about code, errors, logic, or frontend bugs.</p>
        ) : (
          messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                {message.role === "user" ? "You" : "Code Buddy"}
              </p>
              <p className="whitespace-pre-wrap break-words text-sm leading-6 text-zinc-200">
                {message.content}
              </p>
            </div>
          ))
        )}

        {isSending ? (
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Thinking...
          </div>
        ) : null}
      </div>

      <div className="border-t border-white/8 px-4 py-3">
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void handleSend();
              }
            }}
            placeholder="Ask Code Buddy..."
            className="max-h-24 min-h-[24px] w-full resize-none bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
            rows={1}
          />
          <div className="mt-2 flex items-center justify-end">
            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={!canSend}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-violet-500 text-white transition-colors hover:bg-violet-400 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-zinc-500"
              title="Send"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
