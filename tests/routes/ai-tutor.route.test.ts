import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({
  auth: authMock,
}));

async function loadRoute() {
  vi.resetModules();
  const { resetRedisMemoryStoreForTests } = await import("@/lib/redis");
  resetRedisMemoryStoreForTests();
  return import("@/app/api/ai/tutor/route");
}

describe("POST /api/ai/tutor", () => {
  beforeEach(() => {
    authMock.mockResolvedValue({ userId: "user_test_123" });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("rejects unauthenticated tutor requests", async () => {
    authMock.mockResolvedValue({ userId: null });
    const { POST } = await loadRoute();

    const response = await POST(
      new Request("http://localhost/api/ai/tutor", {
        body: JSON.stringify({
          messages: [],
        }),
        method: "POST",
      }),
    );

    expect(response.status).toBe(401);
  });

  it("rejects oversized tutor payloads", async () => {
    const { POST } = await loadRoute();

    const response = await POST(
      new Request("http://localhost/api/ai/tutor", {
        body: JSON.stringify({
          currentCode: "x".repeat(120_000),
          language: "javascript",
          messages: [],
        }),
        method: "POST",
      }),
    );

    expect(response.status).toBe(413);
  });
});
