import { NextResponse } from "next/server";
import type { AIChatMessage, AIChatMode } from "@/services/ai.service";

type AIProvider = "deepseek" | "gemini";

type ChatRequestBody = {
  history?: AIChatMessage[];
  message?: string;
  mode?: AIChatMode;
};

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

function getConfiguredProvider(): AIProvider {
  const explicitProvider = process.env.AI_PROVIDER?.trim().toLowerCase();

  if (explicitProvider === "gemini" || explicitProvider === "deepseek") {
    return explicitProvider;
  }

  if (process.env.GEMINI_API_KEY?.trim()) {
    return "gemini";
  }

  return "deepseek";
}

function normalizeGeminiHistory(history: AIChatMessage[]) {
  return history
    .filter((message) => Boolean(message?.content) && (message.role === "assistant" || message.role === "user"))
    .slice(-12)
    .map(
      (message): GeminiContent => ({
        parts: [{ text: message.content.trim() }],
        role: message.role === "assistant" ? "model" : "user",
      })
    );
}

function normalizeDeepSeekHistory(history: AIChatMessage[], systemPrompt: string) {
  const messages: DeepSeekMessage[] = [
    {
      role: "system",
      content: systemPrompt,
    },
  ];

  const historyMessages = history
    .filter(
      (message): message is DeepSeekMessage =>
        Boolean(message?.content) &&
        (message.role === "assistant" || message.role === "system" || message.role === "user")
    )
    .slice(-12)
    .map((message) => ({
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

async function requestGemini(body: ChatRequestBody, message: string) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    return NextResponse.json(
      {
        error: "Gemini API key missing. Add GEMINI_API_KEY to .env and restart the dev server.",
      },
      { status: 500 }
    );
  }

  const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const payload = {
    contents: [
      ...normalizeGeminiHistory(body.history ?? []),
      {
        parts: [{ text: message }],
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
          text: buildSystemPrompt(body.mode ?? null),
        },
      ],
    },
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(payload),
    });

    const result = (await response.json()) as GeminiResponse;

    if (!response.ok) {
      return NextResponse.json(
        {
          error: result.error?.message || "Gemini request failed.",
        },
        { status: response.status }
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
      { status: 502 }
    );
  }
}

async function requestDeepSeek(body: ChatRequestBody, message: string) {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();

  if (!apiKey) {
    return NextResponse.json(
      {
        error: "DeepSeek API key missing. Add DEEPSEEK_API_KEY to .env and restart the dev server.",
      },
      { status: 500 }
    );
  }

  const model = process.env.DEEPSEEK_MODEL?.trim() || "deepseek-chat";
  const systemPrompt = buildSystemPrompt(body.mode ?? null);
  const messages: DeepSeekMessage[] = [
    ...normalizeDeepSeekHistory(body.history ?? [], systemPrompt),
    {
      role: "user",
      content: message,
    },
  ];

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        max_tokens: 900,
        messages,
        model,
        stream: false,
        temperature: 0.4,
      }),
    });

    const result = (await response.json()) as DeepSeekResponse;

    if (!response.ok) {
      return NextResponse.json(
        {
          error: result.error?.message || "DeepSeek request failed.",
        },
        { status: response.status }
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
      { status: 502 }
    );
  }
}

export async function POST(request: Request) {
  let body: ChatRequestBody;

  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const message = body.message?.trim();

  if (!message) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  const provider = getConfiguredProvider();

  if (provider === "gemini") {
    return requestGemini(body, message);
  }

  return requestDeepSeek(body, message);
}
