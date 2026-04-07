export type AIChatRole = "assistant" | "system" | "user";

export type AIChatMessage = {
  content: string;
  role: AIChatRole;
};

export type AIChatMode =
  | "explain"
  | "fix"
  | "hint"
  | "interview"
  | "optimize"
  | "simplify"
  | null;

export class AIService {
  static async streamResponse(prompt: string, context?: { history?: AIChatMessage[]; mode?: AIChatMode }) {
    const response = await fetch("/api/ai-assistant", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        history: context?.history ?? [],
        message: prompt,
        mode: context?.mode ?? null,
      }),
    });

    const payload = (await response.json()) as { error?: string; reply?: string };

    if (!response.ok || !payload.reply) {
      throw new Error(payload.error || "AI assistant request failed.");
    }

    return payload.reply;
  }
}
