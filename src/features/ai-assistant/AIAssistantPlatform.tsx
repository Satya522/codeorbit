"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUp,
  BookOpenText,
  Brain,
  Bug,
  Check,
  Copy,
  GraduationCap,
  Lightbulb,
  RotateCcw,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { AIService, type AIChatMessage, type AIChatMode } from "@/services/ai.service";

type Message = {
  role: "user" | "ai";
  content: string;
  codeBlock?: string;
  timestamp?: number;
};

type AssistantMode = {
  icon: ReactNode;
  key: AIChatMode;
  label: string;
};

const assistantModes: AssistantMode[] = [
  { key: "explain", label: "Explain", icon: <BookOpenText className="h-3.5 w-3.5" /> },
  { key: "fix", label: "Fix error", icon: <Bug className="h-3.5 w-3.5" /> },
  { key: "hint", label: "Hint", icon: <Lightbulb className="h-3.5 w-3.5" /> },
  { key: "interview", label: "Interview", icon: <GraduationCap className="h-3.5 w-3.5" /> },
  { key: "optimize", label: "Optimize", icon: <Sparkles className="h-3.5 w-3.5" /> },
  { key: "simplify", label: "Simplify", icon: <Brain className="h-3.5 w-3.5" /> },
];

function extractCodeBlock(content: string) {
  const match = content.match(/```(?:[\w+-]+)?\n?([\s\S]*?)```/);

  if (!match) {
    return { codeBlock: undefined, content };
  }

  const cleanedContent = content.replace(match[0], "").trim();

  return {
    codeBlock: match[1].trim(),
    content: cleanedContent || "Code example attached below.",
  };
}

function renderFormattedParagraph(content: string) {
  const segments = content.split(/(\*\*.*?\*\*|`.*?`|\*.*?\*)/g).filter(Boolean);

  return segments.map((segment, index): ReactNode => {
    if (segment.startsWith("**") && segment.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-white">
          {segment.slice(2, -2)}
        </strong>
      );
    }

    if (segment.startsWith("`") && segment.endsWith("`")) {
      return (
        <code
          key={index}
          className="rounded-md border border-cyan-400/15 bg-cyan-400/[0.08] px-1.5 py-0.5 font-mono text-[11px] text-cyan-200"
        >
          {segment.slice(1, -1)}
        </code>
      );
    }

    if (segment.startsWith("*") && segment.endsWith("*")) {
      return (
        <em key={index} className="text-zinc-300">
          {segment.slice(1, -1)}
        </em>
      );
    }

    return <span key={index}>{segment}</span>;
  });
}

function toHistory(messages: Message[]): AIChatMessage[] {
  return messages.map((message) => ({
    content: message.content,
    role: message.role === "ai" ? ("assistant" as const) : ("user" as const),
  }));
}

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AIAssistantPlatform() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const [activeMode, setActiveMode] = useState<AIChatMode>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (!textareaRef.current) {
      return;
    }

    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 168)}px`;
  }, [input]);

  const copyCode = useCallback((code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopied(index);
    setTimeout(() => setCopied(null), 1800);
  }, []);

  const appendAssistantMessage = useCallback((content: string) => {
    const parsed = extractCodeBlock(content);

    setMessages((previous) => [
      ...previous,
      {
        role: "ai",
        content: parsed.content,
        codeBlock: parsed.codeBlock,
        timestamp: Date.now(),
      },
    ]);
  }, []);

  const handleSend = useCallback(
    async (text?: string) => {
      const messageText = (text || input).trim();

      if (!messageText || isTyping) {
        return;
      }

      const nextUserMessage: Message = {
        role: "user",
        content: messageText,
        timestamp: Date.now(),
      };

      const nextHistory = [...messages, nextUserMessage];

      setMessages(nextHistory);
      setInput("");
      setIsTyping(true);

      try {
        const reply = await AIService.streamResponse(messageText, {
          history: toHistory(nextHistory),
          mode: activeMode,
        });

        appendAssistantMessage(reply);
      } catch (error: unknown) {
        appendAssistantMessage(
          error instanceof Error ? error.message : "AI request failed. Check your provider configuration."
        );
      } finally {
        setIsTyping(false);
      }
    },
    [activeMode, appendAssistantMessage, input, isTyping, messages]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  const activeModeMeta = assistantModes.find((mode) => mode.key === activeMode) ?? null;

  return (
    <div className="relative min-h-[calc(100dvh-4rem)] overflow-hidden bg-[#06070d] px-4 py-5 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8%] top-[-8%] h-[320px] w-[320px] rounded-full bg-cyan-400/[0.08] blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-5%] h-[360px] w-[360px] rounded-full bg-violet-400/[0.08] blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-[1200px] flex-col rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.02))] shadow-[0_24px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <div className="border-b border-white/8 px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 3.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.1] text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.08)]"
                >
                  <WandSparkles className="h-4.5 w-4.5" />
                </motion.div>
                <div>
                  <h1 className="text-lg font-semibold tracking-tight text-white">Code Buddy</h1>
                  <p className="text-sm text-zinc-400">Ask about code, bugs, concepts, or interviews.</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-white/6 pt-3">
              {assistantModes.map((mode) => {
                const isActive = activeMode === mode.key;

                return (
                  <motion.button
                    key={mode.label}
                    whileHover={{ y: -1, scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      isActive
                        ? "border-cyan-400/35 bg-cyan-400/[0.12] text-white"
                        : "border-white/10 bg-white/[0.03] text-zinc-300 hover:border-white/20 hover:text-white"
                    }`}
                    onClick={() => setActiveMode(mode.key)}
                    type="button"
                  >
                    {mode.icon}
                    {mode.label}
                  </motion.button>
                );
              })}

              <motion.button
                whileHover={{ y: -1, scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-zinc-400 transition-colors hover:text-white"
                onClick={() => {
                  setActiveMode(null);
                  clearChat();
                }}
                type="button"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Clear
              </motion.button>
            </div>
          </div>
        </div>

        <div ref={chatRef} className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          {messages.length === 0 ? (
            <div className="flex h-full min-h-[320px] items-center justify-center">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="max-w-md rounded-[28px] border border-white/8 bg-white/[0.02] px-10 py-10 text-center"
              >
                <motion.div
                  animate={{ scale: [1, 1.035, 1] }}
                  transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                  className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl border border-cyan-400/20 bg-cyan-400/[0.08] text-cyan-100 shadow-[0_0_28px_rgba(34,211,238,0.08)]"
                >
                  <WandSparkles className="h-6 w-6" />
                </motion.div>
                <p className="text-base font-semibold text-white">Start a conversation</p>
                <p className="mt-2 text-sm leading-7 text-zinc-400">
                  Paste code, share an error, or ask for a hint.
                </p>
              </motion.div>
            </div>
          ) : (
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
              <AnimatePresence initial={false}>
                {messages.map((message, index) => (
                  <motion.div
                  key={`${message.role}-${index}`}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                  className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                  {message.role === "ai" && (
                    <div className="mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.1] text-cyan-100 shadow-[0_0_20px_rgba(34,211,238,0.06)]">
                      <WandSparkles className="h-4 w-4" />
                    </div>
                  )}

                  <div className={`max-w-[90%] sm:max-w-[78%] ${message.role === "user" ? "order-first" : ""}`}>
                    <div
                      className={`rounded-3xl px-4 py-3.5 text-sm leading-7 ${
                        message.role === "user"
                          ? "rounded-br-xl border border-cyan-400/18 bg-cyan-400/[0.1] text-white"
                          : "rounded-bl-xl border border-white/8 bg-white/[0.03] text-zinc-200"
                      }`}
                    >
                      {message.content.split("\n\n").map((paragraph, paragraphIndex) => (
                        <p key={`${index}-${paragraphIndex}`} className={paragraphIndex > 0 ? "mt-2.5" : ""}>
                          {renderFormattedParagraph(paragraph)}
                        </p>
                      ))}
                    </div>

                    {message.codeBlock && (
                      <div className="mt-3 overflow-hidden rounded-2xl border border-white/8 bg-[#090b12]">
                        <div className="flex items-center justify-between border-b border-white/8 px-3 py-2">
                          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                            Code
                          </span>
                          <button
                            className="inline-flex items-center gap-1.5 rounded-full border border-white/8 px-2.5 py-1 text-[10px] font-semibold text-zinc-300 transition-colors hover:text-white"
                            onClick={() => copyCode(message.codeBlock!, index)}
                            type="button"
                          >
                            {copied === index ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                            {copied === index ? "Copied" : "Copy"}
                          </button>
                        </div>
                        <pre className="overflow-x-auto p-4 font-mono text-[12px] leading-7 text-zinc-300">
                          {message.codeBlock}
                        </pre>
                      </div>
                    )}

                    <div className="mt-1.5 text-[10px] text-zinc-500">
                      {message.timestamp ? formatTime(message.timestamp) : null}
                    </div>
                  </div>

                  {message.role === "user" && (
                    <div className="mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-[11px] font-semibold text-zinc-300">
                      You
                    </div>
                  )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <div className="mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.1] text-cyan-100">
                    <WandSparkles className="h-4 w-4" />
                  </div>
                  <div className="rounded-3xl rounded-bl-xl border border-white/8 bg-white/[0.03] px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300/70" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300/70 [animation-delay:120ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300/70 [animation-delay:240ms]" />
                      <span className="ml-1 text-xs text-zinc-400">Thinking...</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-white/8 px-4 py-4 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <AnimatePresence mode="wait">
              {activeModeMeta ? (
                <motion.div
                  key={activeModeMeta.label}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="mb-2 text-[11px] font-medium text-zinc-400"
                >
                  Mode: <span className="text-cyan-100">{activeModeMeta.label}</span>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <motion.div
              whileFocus={{ scale: 1 }}
              className="rounded-[24px] border border-white/10 bg-black/20 p-2 shadow-[0_14px_40px_rgba(0,0,0,0.18)]"
            >
              <div className="flex items-end gap-2">
                <textarea
                  ref={textareaRef}
                  className="min-h-[60px] w-full resize-none bg-transparent px-4 py-3.5 text-sm leading-7 text-white outline-none placeholder:text-zinc-500"
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void handleSend();
                    }
                  }}
                  placeholder="Ask anything about your code..."
                  rows={1}
                  value={input}
                />
                <motion.button
                  whileHover={input.trim() && !isTyping ? { scale: 1.04, y: -1 } : undefined}
                  whileTap={input.trim() && !isTyping ? { scale: 0.97 } : undefined}
                  className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl transition-all ${
                    input.trim() && !isTyping
                      ? "bg-cyan-300 text-black hover:bg-cyan-200"
                      : "bg-white/[0.06] text-zinc-500"
                  }`}
                  disabled={isTyping || !input.trim()}
                  onClick={() => void handleSend()}
                  type="button"
                >
                  <ArrowUp className="h-4 w-4" />
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
