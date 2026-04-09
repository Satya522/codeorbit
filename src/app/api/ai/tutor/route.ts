import { createOpenAI, openai } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  tool,
  type ModelMessage,
  type UIMessage,
} from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { buildRateLimitHeaders, requireSignedInRouteAccess } from "@/lib/api-guard";
import { readJsonBody } from "@/lib/api-request";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 30;

const inputMessageSchema = z
  .object({
    content: z.string().max(4_000).optional(),
    parts: z.array(z.record(z.string(), z.unknown())).optional(),
    role: z.enum(["system", "user", "assistant"]),
  })
  .passthrough();

const requestSchema = z.object({
  currentCode: z.string().max(20_000).optional(),
  language: z.string().trim().min(1).max(40).default("javascript"),
  messages: z.array(inputMessageSchema).max(20).default([]),
  questionId: z.string().trim().min(1).max(120).optional(),
});

type TutorInputMessage = z.infer<typeof inputMessageSchema>;

type QuestionContext = Awaited<ReturnType<typeof getQuestionContext>>;

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

function getTutorModel() {
  const openAiKey = process.env.OPENAI_API_KEY?.trim();

  if (openAiKey) {
    return {
      label: "openai",
      model: openai(process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini"),
    } as const;
  }

  if (process.env.GEMINI_API_KEY?.trim()) {
    return null;
  }

  const deepSeekKey = process.env.DEEPSEEK_API_KEY?.trim();

  if (deepSeekKey) {
    const deepseek = createOpenAI({
      apiKey: deepSeekKey,
      baseURL: "https://api.deepseek.com/v1",
    });

    return {
      label: "deepseek",
      model: deepseek(process.env.DEEPSEEK_MODEL?.trim() || "deepseek-chat"),
    } as const;
  }

  return null;
}

function extractTextFromMessage(message: TutorInputMessage) {
  if (typeof message.content === "string" && message.content.trim().length > 0) {
    return message.content.trim();
  }

  if (!message.parts?.length) {
    return "";
  }

  return message.parts
    .map((part) => {
      if (typeof part === "object" && part && "type" in part && "text" in part && part.type === "text") {
        return typeof part.text === "string" ? part.text : "";
      }

      return "";
    })
    .join("\n")
    .trim();
}

function attachRateLimitHeaders(response: Response, headers: Record<string, string>) {
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }

  return response;
}

function normalizeGeminiMessages(messages: TutorInputMessage[]) {
  return messages
    .map((message) => {
      const text = extractTextFromMessage(message);

      if (!text || message.role === "system") {
        return null;
      }

      return {
        parts: [{ text }],
        role: message.role === "assistant" ? "model" : "user",
      } satisfies GeminiContent;
    })
    .filter((message): message is GeminiContent => Boolean(message));
}

function extractGeminiReply(payload: GeminiResponse) {
  const parts = payload.candidates?.[0]?.content?.parts ?? [];

  return (
    parts
      .map((part) => part.text?.trim())
      .filter((value): value is string => Boolean(value))
      .join("\n")
      .trim() || null
  );
}

async function createGeminiTutorResponse({
  body,
  systemPrompt,
}: {
  body: z.infer<typeof requestSchema>;
  systemPrompt: string;
}) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("Gemini API key missing.");
  }

  const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const contents = normalizeGeminiMessages(body.messages);
  const payload = {
    contents:
      contents.length > 0
        ? contents
        : [
            {
              parts: [
                {
                  text: "Start with a gentle hint based on the current question context and ask one clarifying question.",
                },
              ],
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
          text: systemPrompt,
        },
      ],
    },
  };

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
    throw new Error(result.error?.message || "Gemini tutor request failed.");
  }

  const reply = extractGeminiReply(result);

  if (!reply) {
    throw new Error("Gemini returned an empty tutor response.");
  }

  return createUIMessageStreamResponse({
    headers: {
      "X-AI-Provider": "gemini",
    },
    stream: createUIMessageStream({
      execute: ({ writer }) => {
        const textId = "gemini-tutor-text";
        writer.write({ type: "text-start", id: textId });
        writer.write({ type: "text-delta", id: textId, delta: reply });
        writer.write({ type: "text-end", id: textId });
      },
    }),
  });
}

function buildSystemPrompt({
  currentCode,
  language,
  question,
}: {
  currentCode?: string;
  language: string;
  question: QuestionContext;
}) {
  const fallbackQuestionContext = [
    "Current Question: Not provided",
    "Difficulty: Unknown",
    "Topic: General problem solving",
  ];

  const questionContext = question
    ? [
        `Current Question: ${question.title}`,
        `Difficulty: ${question.difficulty}`,
        `Topic: ${question.topic}`,
        question.description ? `Description: ${question.description}` : null,
        question.constraints ? `Constraints: ${question.constraints}` : null,
        question.solutions[0]?.shortExplanation
          ? `Reference Insight: ${question.solutions[0].shortExplanation}`
          : null,
      ].filter(Boolean)
    : fallbackQuestionContext;

  return [
    "You are CodeOrbit AI, an expert coding interview coach inside a learning platform.",
    "IMPORTANT: Under no circumstances should you ever mention that you are an AI model created by OpenAI, Google, DeepSeek, Anthropic, or any other company. If asked about your origin or identity, firmly state that you are the CodeOrbit intelligent assistant crafted by the dedicated CodeOrbit team and nothing else.",
    "",
    ...questionContext,
    "",
    "Guidelines:",
    "- Do not reveal the full solution immediately.",
    "- Start with the smallest helpful nudge and increase detail only when needed.",
    "- Ask guiding questions that help the learner reason about edge cases and tradeoffs.",
    "- If the user shares code, review it for correctness, edge cases, and optimization opportunities.",
    "- Reference time and space complexity when it helps the learner understand a decision.",
    "- Keep replies crisp, supportive, and practical.",
    "",
    `Current user code (${language}):`,
    currentCode?.trim() || "// No code yet",
  ].join("\n");
}

function buildHint({
  currentCode,
  level,
  question,
}: {
  currentCode?: string;
  level: "gentle" | "specific" | "detailed";
  question: QuestionContext;
}) {
  const topic = question?.topic || "the core data structure or algorithm";
  const title = question?.title ? ` for "${question.title}"` : "";
  const hasCode = Boolean(currentCode?.trim());
  const referenceInsight = question?.solutions[0]?.shortExplanation?.trim();

  switch (level) {
    case "gentle":
      return `Start by identifying the minimum state you need to track${title}. For a ${topic} problem, ask what information lets you answer each step without recomputing everything.`;
    case "specific":
      return hasCode
        ? `Read through your current approach and look for repeated work. If a value is being searched or recomputed often, a more direct lookup structure may help.`
        : `Break the problem into input, state, and update rules. Once you know what must be checked on each step, the right ${topic} pattern usually becomes clearer.`;
    case "detailed":
      return (
        referenceInsight ||
        `Write down the brute-force idea first, then ask how to avoid rescanning prior work. That usually leads you toward the optimized ${topic} solution without jumping straight to full code.`
      );
  }
}

function analyzeComplexity(code: string) {
  const normalized = code.toLowerCase();
  const hasSort = /sort\s*\(/.test(normalized);
  const loopMatches = normalized.match(/\b(for|while)\b/g)?.length ?? 0;
  const nestedLoops = /for[\s\S]*for|while[\s\S]*while|for[\s\S]*while|while[\s\S]*for/.test(
    normalized,
  );
  const recursiveCalls =
    (normalized.match(/\breturn\s+\w+\(/g)?.length ?? 0) > 0 ||
    /\bfunction\b[\s\S]*\breturn\b[\s\S]*\w+\(/.test(normalized);
  const usesLinearMemory =
    /\b(map|set|dict|dictionary|object|array|vector|list)\b/.test(normalized);

  let time = "O(n)";
  const space = usesLinearMemory ? "O(n)" : "O(1)";
  let explanation =
    "This looks like a single-pass solution where the main cost grows with the input size.";

  if (!code.trim()) {
    return {
      explanation: "No code was provided, so complexity cannot be estimated yet.",
      space: "Unknown",
      time: "Unknown",
    };
  }

  if (hasSort) {
    time = "O(n log n)";
    explanation =
      "The dominant operation appears to be sorting, which usually drives the overall runtime.";
  }

  if (nestedLoops || loopMatches >= 2) {
    time = "O(n^2)";
    explanation =
      "There are multiple loops that appear to depend on the input, so the runtime likely grows quadratically in the common case.";
  }

  if (recursiveCalls && time === "O(n)") {
    explanation =
      "This appears recursive or divide-and-conquer based. The exact complexity depends on how the input size changes between calls.";
  }

  return { explanation, space, time };
}

async function getQuestionContext(questionId?: string) {
  if (!questionId) {
    return null;
  }

  try {
    return await prisma.externalQuestionRef.findUnique({
      where: { id: questionId },
      select: {
        constraints: true,
        description: true,
        difficulty: true,
        id: true,
        solutions: {
          orderBy: { createdAt: "desc" },
          select: {
            language: true,
            shortExplanation: true,
            solutionKind: true,
          },
          take: 1,
          where: { status: "approved" },
        },
        title: true,
        topic: true,
      },
    });
  } catch (error) {
    console.warn("AI tutor question lookup unavailable:", error);
    return null;
  }
}

async function normalizeMessages(messages: TutorInputMessage[]) {
  if (messages.length === 0) {
    return [] as ModelMessage[];
  }

  const uiMessages: Array<Omit<UIMessage, "id">> = messages
    .map((message) => {
      const fallbackText = message.content?.trim();
      const parts =
        message.parts && message.parts.length > 0
          ? (message.parts as UIMessage["parts"])
          : fallbackText
            ? ([{ type: "text", text: fallbackText }] as UIMessage["parts"])
            : [];

      return {
        parts,
        role: message.role,
      };
    })
    .filter((message) => message.parts.length > 0);

  return convertToModelMessages(uiMessages);
}

export async function POST(request: Request) {
  const access = await requireSignedInRouteAccess({
    bucket: "ai-tutor",
    limit: 15,
    unauthenticatedMessage: "Sign in to use the CodeOrbit AI tutor.",
    windowSeconds: 60,
  });

  if (!access.ok) {
    return access.response;
  }

  const bodyResult = await readJsonBody({
    invalidMessage: "Invalid tutor payload.",
    maxBytes: 96_000,
    request,
    schema: requestSchema,
    tooLargeMessage: "Tutor payload is too large. Shorten the code or chat history and try again.",
  });

  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  try {
    const body = bodyResult.data;
    const question = await getQuestionContext(body.questionId);
    const modelMessages = await normalizeMessages(body.messages);
    const systemPrompt = buildSystemPrompt({
      currentCode: body.currentCode,
      language: body.language,
      question,
    });
    const provider = getTutorModel();

    if (!provider && !process.env.GEMINI_API_KEY?.trim()) {
      return attachRateLimitHeaders(
        NextResponse.json(
          {
            error:
              "No tutor AI provider configured. Add OPENAI_API_KEY, GEMINI_API_KEY, or DEEPSEEK_API_KEY to .env and restart the dev server.",
          },
          { status: 500 },
        ),
        buildRateLimitHeaders(access.rateLimit),
      );
    }

    if (!provider) {
      const response = await createGeminiTutorResponse({
        body,
        systemPrompt,
      });

      return attachRateLimitHeaders(response, buildRateLimitHeaders(access.rateLimit));
    }

    const result = streamText({
      model: provider.model,
      system: systemPrompt,
      ...(modelMessages.length > 0
        ? { messages: modelMessages }
        : {
            prompt:
              "Start with a gentle hint based on the current question context and ask one clarifying question.",
          }),
      stopWhen: stepCountIs(3),
      tools: {
        analyzeComplexity: tool({
          description: "Analyze time and space complexity for the provided code.",
          execute: async ({ code }) => analyzeComplexity(code),
          inputSchema: z.object({ code: z.string() }),
        }),
        getHint: tool({
          description: "Get a progressive hint for the current interview question.",
          execute: async ({ level }) => ({
            hint: buildHint({
              currentCode: body.currentCode,
              level,
              question,
            }),
          }),
          inputSchema: z.object({
            level: z.enum(["gentle", "specific", "detailed"]),
          }),
        }),
      },
    });

    const response = result.toUIMessageStreamResponse({
      headers: {
        "X-AI-Provider": provider.label,
      },
    });

    return attachRateLimitHeaders(response, buildRateLimitHeaders(access.rateLimit));
  } catch (error) {
    console.error("Error streaming AI tutor response:", error);

    return attachRateLimitHeaders(
      NextResponse.json(
        { error: "Failed to start AI tutor stream." },
        { status: 500 },
      ),
      buildRateLimitHeaders(access.rateLimit),
    );
  }
}
