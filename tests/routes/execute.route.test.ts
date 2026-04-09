import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({
  auth: authMock,
}));

async function loadRoute() {
  vi.resetModules();
  const { resetRedisMemoryStoreForTests } = await import("@/lib/redis");
  resetRedisMemoryStoreForTests();
  return import("@/app/api/execute/route");
}

describe("POST /api/execute", () => {
  beforeEach(() => {
    authMock.mockResolvedValue({ userId: "user_test_123" });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("allows guest execution requests", async () => {
    authMock.mockResolvedValue({ userId: null });
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          run: {
            stdout: "guest ok\n",
          },
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
      new Request("http://localhost/api/execute", {
        body: JSON.stringify({
          code: 'console.log("hi")',
          language: "javascript",
        }),
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await expect(response.json()).resolves.toMatchObject({
      error: null,
      output: "guest ok\n",
    });
  });

  it("rejects oversized payloads", async () => {
    const { POST } = await loadRoute();

    const response = await POST(
      new Request("http://localhost/api/execute", {
        body: JSON.stringify({
          code: "x".repeat(40_000),
          language: "python",
        }),
        method: "POST",
      }),
    );

    expect(response.status).toBe(413);
  });

  it("returns execution output for supported code", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          run: {
            stdout: "Hello CodeOrbit\n",
          },
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
      new Request("http://localhost/api/execute", {
        body: JSON.stringify({
          code: 'print("Hello CodeOrbit")',
          language: "python",
        }),
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await expect(response.json()).resolves.toMatchObject({
      error: null,
      output: "Hello CodeOrbit\n",
    });
  });
});
