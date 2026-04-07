"use client";

import { DefaultChatTransport, type UIMessage } from "ai";
import { useChat } from "@ai-sdk/react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, CircleAlert, LoaderCircle, Sparkles, User } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";

type AIChatProps = {
  questionId?: string | null;
  currentCode?: string;
  language?: string;
};

type ToolPart = {
  errorText?: string;
  input?: unknown;
  output?: unknown;
  state?: string;
  title?: string;
  toolCallId?: string;
  toolName?: string;
  type: string;
};

const transport = new DefaultChatTransport({
  api: "/api/ai/tutor",
});

function stringifyToolValue(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (value == null) {
    return "";
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function renderMessageParts(message: UIMessage) {
  return message.parts.map((part, index) => {
    if (part.type === "text") {
      return (
        <p key={`${message.id}-text-${index}`} className="whitespace-pre-wrap leading-7">
          {part.text}
        </p>
      );
    }

    if (part.type === "reasoning") {
      return (
        <div
          key={`${message.id}-reasoning-${index}`}
          className="rounded-xl border border-amber-400/15 bg-amber-400/5 px-3 py-2 text-xs text-amber-100/80"
        >
          {part.text}
        </div>
      );
    }

    if (part.type === "dynamic-tool" || part.type.startsWith("tool-")) {
      const toolPart = part as ToolPart;
      const toolName =
        toolPart.type === "dynamic-tool"
          ? toolPart.toolName || "tool"
          : toolPart.type.replace(/^tool-/, "");
      const output = stringifyToolValue(toolPart.output);
      const input = stringifyToolValue(toolPart.input);

      return (
        <div
          key={`${message.id}-tool-${toolName}-${index}`}
          className="rounded-xl border border-cyan-400/15 bg-cyan-400/[0.08] px-3 py-2.5 text-xs text-cyan-50/90"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold uppercase tracking-[0.12em] text-cyan-200/80">
              {toolPart.title || toolName}
            </span>
            <span className="rounded-full border border-cyan-300/15 px-2 py-0.5 text-[10px] text-cyan-100/70">
              {toolPart.state || "done"}
            </span>
          </div>
          {input ? (
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-lg bg-black/20 p-2 text-[11px] text-cyan-100/70">
              {input}
            </pre>
          ) : null}
          {output ? (
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-lg bg-black/20 p-2 text-[11px] text-cyan-50">
              {output}
            </pre>
          ) : null}
          {toolPart.errorText ? (
            <p className="mt-2 text-[11px] text-rose-200">{toolPart.errorText}</p>
          ) : null}
        </div>
      );
    }

    return null;
  });
}

export function AIChat({
  questionId,
  currentCode,
  language = "javascript",
}: AIChatProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { error, messages, sendMessage, status, stop } = useChat({
    transport,
  });

  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const text = input.trim();
    if (!text || isLoading) {
      return;
    }

    setInput("");

    await sendMessage(
      { text },
      {
        body: {
          currentCode,
          language,
          questionId: questionId ?? undefined,
        },
      },
    );
  }

  return (
    <aside className="relative flex h-full min-h-0 flex-col overflow-hidden border-l border-white/10 bg-slate-950/70 backdrop-blur-2xl">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-16 h-40 w-40 -translate-x-1/2 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-32 w-32 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <header className="relative z-10 border-b border-white/10 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 shadow-[0_0_24px_rgba(168,85,247,0.3)]">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white">AI Tutor</h3>
            <p className="text-xs text-zinc-400">
              Interview hints, code review, and complexity coaching
            </p>
          </div>
        </div>
      </header>

      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-3 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-white/[0.04] shadow-[0_0_30px_rgba(168,85,247,0.12)]">
              <Bot className="h-7 w-7 text-purple-300" />
            </div>
            <h4 className="text-lg font-semibold text-white">Ask the tutor for a nudge</h4>
            <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-400">
              Try asking for a gentle hint, a complexity check, or feedback on your current approach.
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            <div className="space-y-4">
              {messages.map((message) => {
                const isUser = message.role === "user";

                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
                  >
                    <div
                      className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${
                        isUser
                          ? "bg-blue-500/80 text-white shadow-[0_0_18px_rgba(59,130,246,0.3)]"
                          : "bg-purple-500/80 text-white shadow-[0_0_18px_rgba(168,85,247,0.28)]"
                      }`}
                    >
                      {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>

                    <div
                      className={`max-w-[85%] rounded-3xl border px-4 py-3 ${
                        isUser
                          ? "rounded-tr-md border-blue-400/20 bg-blue-500/15 text-blue-50"
                          : "rounded-tl-md border-white/10 bg-white/[0.04] text-zinc-100"
                      }`}
                    >
                      <div className="space-y-3">{renderMessageParts(message)}</div>
                    </div>
                  </motion.div>
                );
              })}

              {isLoading ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-purple-500/80 text-white shadow-[0_0_18px_rgba(168,85,247,0.28)]">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-3xl rounded-tl-md border border-white/10 bg-white/[0.04] px-4 py-3 text-zinc-200">
                    <div className="flex items-center gap-2 text-sm">
                      <LoaderCircle className="h-4 w-4 animate-spin text-purple-300" />
                      <span>Thinking through your solution...</span>
                    </div>
                  </div>
                </motion.div>
              ) : null}

              {error ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100"
                >
                  <div className="flex items-start gap-2">
                    <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
                    <p>{error.message}</p>
                  </div>
                </motion.div>
              ) : null}
            </div>
          </AnimatePresence>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="relative z-10 border-t border-white/10 px-4 py-4">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-2 shadow-[0_10px_30px_rgba(2,6,23,0.35)]">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void handleSubmit(event as unknown as FormEvent<HTMLFormElement>);
              }
            }}
            placeholder="Ask for a hint, explain your approach, or request a complexity review..."
            className="min-h-[88px] w-full resize-none bg-transparent px-3 py-2 text-sm leading-6 text-white outline-none placeholder:text-zinc-500"
          />

          <div className="flex items-center justify-between gap-3 border-t border-white/5 px-2 pt-2">
            <p className="text-[11px] text-zinc-500">
              {language.toUpperCase()} context {questionId ? "loaded" : "ready"}
            </p>

            <div className="flex items-center gap-2">
              {isLoading ? (
                <button
                  type="button"
                  onClick={() => stop()}
                  className="rounded-xl border border-white/10 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.05] hover:text-white"
                >
                  Stop
                </button>
              ) : null}

              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 px-4 py-2 text-sm font-medium text-white shadow-[0_0_20px_rgba(168,85,247,0.25)] transition hover:shadow-[0_0_28px_rgba(6,182,212,0.3)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Send
              </button>
            </div>
          </div>
        </div>
      </form>
    </aside>
  );
}
