import { NextResponse } from "next/server";
import { z } from "zod";
import { buildRateLimitHeaders, requireSignedInRouteAccess } from "@/lib/api-guard";
import { readJsonBody } from "@/lib/api-request";
import type { AIChatMode } from "@/services/ai.service";

type AIProvider = "deepseek" | "gemini";

type GeminiRole = "model" | "user";

type GeminiContent = {
  parts: Array<{
    text: string;
  }>;
  role: GeminiRole;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

type DeepSeekMessage = {
  content: string;
  role: "assistant" | "system" | "user";
};

type DeepSeekResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

const assistantMessageSchema = z.object({
  content: z.string().trim().min(1).max(4_000),
  role: z.enum(["assistant", "system", "user"]),
});

const requestSchema = z.object({
  history: z.array(assistantMessageSchema).max(12).default([]),
  message: z.string().trim().min(1).max(4_000),
  mode: z
    .enum(["explain", "fix", "hint", "interview", "optimize", "simplify"])
    .nullable()
    .optional()
    .default(null),
});

const modeInstructions: Record<Exclude<AIChatMode, null>, string> = {
  explain: "Explain code clearly with simple steps, key ideas, and when useful, include a small example.",
  fix: "Focus on debugging. Identify the root cause, explain why it broke, and provide the cleanest fix first.",
  hint: "Give only progressive hints. Do not reveal the full solution unless the user explicitly asks for it.",
  interview: "Act like a coding interviewer. Ask sharp follow-up questions and evaluate the user's reasoning.",
  optimize: "Focus on performance, complexity, and code quality improvements with concrete tradeoffs.",
  simplify: "Explain complex concepts in beginner-friendly language using short examples and analogies when helpful.",
};

function buildSystemPrompt(mode: AIChatMode) {
  const basePrompt =
    "You are CodeOrbit AI, a supportive coding assistant inside a learning platform. Keep responses concise, practical, and accurate. When code is helpful, prefer short examples. Use markdown lightly. If the user shares an error, explain the root cause and fix. If the user asks for learning help, teach step by step without sounding robotic. IMPORTANT: Under no circumstances should you ever mention that you are an AI model created by OpenAI, Google, DeepSeek, Anthropic, or any other company. If asked about your origin or identity, firmly state that you are the CodeOrbit intelligent assistant crafted by the dedicated CodeOrbit team and nothing else.";

  if (!mode) {
    return basePrompt;
  }

  return `${basePrompt} ${modeInstructions[mode]}`;
}

function hasGeminiConfig() {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

function hasDeepSeekConfig() {
  return Boolean(process.env.DEEPSEEK_API_KEY?.trim());
}

function getConfiguredProvider(): AIProvider | null {
  const explicitProvider = process.env.AI_PROVIDER?.trim().toLowerCase();

  if (explicitProvider === "gemini" && hasGeminiConfig()) {
    return "gemini";
  }

  if (explicitProvider === "deepseek" && hasDeepSeekConfig()) {
    return "deepseek";
  }

  if (hasGeminiConfig()) {
    return "gemini";
  }

  if (hasDeepSeekConfig()) {
    return "deepseek";
  }

  return null;
}

function normalizeGeminiHistory(history: z.infer<typeof assistantMessageSchema>[]) {
  return history
    .filter((message) => message.role === "assistant" || message.role === "user")
    .map(
      (message): GeminiContent => ({
        parts: [{ text: message.content.trim() }],
        role: message.role === "assistant" ? "model" : "user",
      }),
    );
}

function normalizeDeepSeekHistory(
  history: z.infer<typeof assistantMessageSchema>[],
  systemPrompt: string,
) {
  const messages: DeepSeekMessage[] = [
    {
      content: systemPrompt,
      role: "system",
    },
  ];

  const historyMessages = history.map((message) => ({
    content: message.content.trim(),
    role: message.role,
  }));

  return messages.concat(historyMessages);
}

function extractGeminiReply(payload: GeminiResponse) {
  const parts = payload.candidates?.[0]?.content?.parts ?? [];
  const text = parts
    .map((part) => part.text?.trim())
    .filter((value): value is string => Boolean(value))
    .join("\n")
    .trim();

  return text || null;
}

function attachRateLimitHeaders(response: NextResponse, headers: Record<string, string>) {
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }

  return response;
}

async function requestGemini(body: z.infer<typeof requestSchema>) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    return NextResponse.json(
      {
        error: "Gemini API key missing. Add GEMINI_API_KEY to .env and restart the dev server.",
      },
      { status: 500 },
    );
  }

  const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const payload = {
    contents: [
      ...normalizeGeminiHistory(body.history),
      {
        parts: [{ text: body.message }],
        role: "user" as const,
      },
    ],
    generationConfig: {
      maxOutputTokens: 900,
      temperature: 0.4,
    },
    system_instruction: {
      parts: [
        {
          text: buildSystemPrompt(body.mode),
        },
      ],
    },
  };

  try {
    const response = await fetch(endpoint, {
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      method: "POST",
    });

    const result = (await response.json()) as GeminiResponse;

    if (!response.ok) {
      return NextResponse.json(
        {
          error: result.error?.message || "Gemini request failed.",
        },
        { status: response.status },
      );
    }

    const reply = extractGeminiReply(result);

    if (!reply) {
      return NextResponse.json({ error: "Gemini returned an empty response." }, { status: 502 });
    }

    return NextResponse.json({
      model,
      provider: "gemini",
      reply,
    });
  } catch {
    return NextResponse.json(
      {
        error: "Unable to reach Gemini right now. Check your API key, network, or model configuration.",
      },
      { status: 502 },
    );
  }
}

async function requestDeepSeek(body: z.infer<typeof requestSchema>) {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();

  if (!apiKey) {
    return NextResponse.json(
      {
        error: "DeepSeek API key missing. Add DEEPSEEK_API_KEY to .env and restart the dev server.",
      },
      { status: 500 },
    );
  }

  const model = process.env.DEEPSEEK_MODEL?.trim() || "deepseek-chat";
  const systemPrompt = buildSystemPrompt(body.mode);
  const messages: DeepSeekMessage[] = [
    ...normalizeDeepSeekHistory(body.history, systemPrompt),
    {
      content: body.message,
      role: "user",
    },
  ];

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      body: JSON.stringify({
        max_tokens: 900,
        messages,
        model,
        stream: false,
        temperature: 0.4,
      }),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    const result = (await response.json()) as DeepSeekResponse;

    if (!response.ok) {
      return NextResponse.json(
        {
          error: result.error?.message || "DeepSeek request failed.",
        },
        { status: response.status },
      );
    }

    const reply = result.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return NextResponse.json({ error: "DeepSeek returned an empty response." }, { status: 502 });
    }

    return NextResponse.json({
      model,
      provider: "deepseek",
      reply,
    });
  } catch {
    return NextResponse.json(
      {
        error: "Unable to reach DeepSeek right now. Check your API key, network, or model configuration.",
      },
      { status: 502 },
    );
  }
}

export async function POST(request: Request) {
  const access = await requireSignedInRouteAccess({
    bucket: "ai-assistant",
    limit: 18,
    unauthenticatedMessage: "Sign in to use the CodeOrbit AI assistant.",
    windowSeconds: 60,
  });

  if (!access.ok) {
    return access.response;
  }

  const bodyResult = await readJsonBody({
    invalidMessage: "Invalid AI assistant payload.",
    maxBytes: 32_000,
    request,
    schema: requestSchema,
    tooLargeMessage: "AI assistant payload is too large. Shorten the message or history and try again.",
  });

  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  const provider = getConfiguredProvider();

  if (!provider) {
    return attachRateLimitHeaders(
      NextResponse.json(
        {
          error: "No AI assistant provider is configured. Add GEMINI_API_KEY or DEEPSEEK_API_KEY to continue.",
        },
        { status: 500 },
      ),
      buildRateLimitHeaders(access.rateLimit),
    );
  }

  const response =
    provider === "gemini"
      ? await requestGemini(bodyResult.data)
      : await requestDeepSeek(bodyResult.data);

  return attachRateLimitHeaders(response, buildRateLimitHeaders(access.rateLimit));
}
