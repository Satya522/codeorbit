import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({
  auth: authMock,
}));

async function loadRoute() {
  vi.resetModules();
  const { resetRedisMemoryStoreForTests } = await import("@/lib/redis");
  resetRedisMemoryStoreForTests();
  return import("@/app/api/ai-assistant/route");
}

describe("POST /api/ai-assistant", () => {
  beforeEach(() => {
    authMock.mockResolvedValue({ userId: "user_test_123" });
    delete process.env.AI_PROVIDER;
    delete process.env.DEEPSEEK_API_KEY;
    delete process.env.DEEPSEEK_MODEL;
    delete process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_MODEL;
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    delete process.env.AI_PROVIDER;
    delete process.env.DEEPSEEK_API_KEY;
    delete process.env.DEEPSEEK_MODEL;
    delete process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_MODEL;
  });

  it("rejects unauthenticated requests", async () => {
    authMock.mockResolvedValue({ userId: null });
    const { POST } = await loadRoute();

    const response = await POST(
      new Request("http://localhost/api/ai-assistant", {
        body: JSON.stringify({ message: "Explain binary search" }),
        method: "POST",
      }),
    );

    expect(response.status).toBe(401);
  });

  it("falls back to Gemini when explicit DeepSeek config is unavailable", async () => {
    process.env.AI_PROVIDER = "deepseek";
    process.env.GEMINI_API_KEY = "gem-key";

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [{ text: "Use a low/high pointer pair." }],
              },
            },
          ],
        }),
        {
          headers: {
            "content-type": "application/json",
          },
          status: 200,
        },
      ),
    );

    vi.stubGlobal("fetch", fetchMock);

    const { POST } = await loadRoute();
    const response = await POST(
      new Request("http://localhost/api/ai-assistant", {
        body: JSON.stringify({
          history: [],
          message: "How should I start binary search?",
        }),
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("generativelanguage.googleapis.com");
    await expect(response.json()).resolves.toMatchObject({
      provider: "gemini",
      reply: "Use a low/high pointer pair.",
    });
  });

  it("rejects oversized assistant payloads", async () => {
    process.env.GEMINI_API_KEY = "gem-key";
    const { POST } = await loadRoute();

    const response = await POST(
      new Request("http://localhost/api/ai-assistant", {
        body: JSON.stringify({
          message: "x".repeat(40_000),
        }),
        method: "POST",
      }),
    );

    expect(response.status).toBe(413);
  });
});
