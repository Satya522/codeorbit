import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const resolveAuthenticatedDatabaseUserStateMock = vi.fn();

const prismaMock = {
  $transaction: vi.fn(),
  externalQuestionRef: {
    findMany: vi.fn(),
  },
  userQuestionProgress: {
    deleteMany: vi.fn(),
    findMany: vi.fn(),
    upsert: vi.fn(),
  },
};

vi.mock("@/lib/resolve-authenticated-user", () => ({
  resolveAuthenticatedDatabaseUserState: resolveAuthenticatedDatabaseUserStateMock,
}));

vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

async function loadRoute() {
  vi.resetModules();
  return import("@/app/api/practice/progress/route");
}

describe("Practice progress route", () => {
  beforeEach(() => {
    resolveAuthenticatedDatabaseUserStateMock.mockReset();
    prismaMock.$transaction.mockReset();
    prismaMock.externalQuestionRef.findMany.mockReset();
    prismaMock.userQuestionProgress.deleteMany.mockReset();
    prismaMock.userQuestionProgress.findMany.mockReset();
    prismaMock.userQuestionProgress.upsert.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns a service-unavailable response when the database is down", async () => {
    resolveAuthenticatedDatabaseUserStateMock.mockResolvedValue({
      message: "Database temporarily unavailable.",
      status: "unavailable",
    });

    const { GET } = await loadRoute();
    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      authenticated: true,
      error: "Database temporarily unavailable.",
      progress: [],
    });
  });

  it("returns authentication required for unsigned-in writes", async () => {
    resolveAuthenticatedDatabaseUserStateMock.mockResolvedValue({
      status: "unauthenticated",
    });

    const { POST } = await loadRoute();
    const response = await POST(
      new Request("http://localhost/api/practice/progress", {
        body: JSON.stringify({
          entries: [],
        }),
        method: "POST",
      }) as never,
    );

    expect(response.status).toBe(401);
  });
});
