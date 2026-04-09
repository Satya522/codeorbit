import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const currentUserMock = vi.fn();
const hasDatabaseConfigMock = vi.fn();

const prismaMock = {
  user: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
};

vi.mock("@clerk/nextjs/server", () => ({
  auth: authMock,
  currentUser: currentUserMock,
}));

vi.mock("@/lib/database-url", () => ({
  hasDatabaseConfig: hasDatabaseConfigMock,
}));

vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

async function loadModule() {
  vi.resetModules();
  return import("@/lib/resolve-authenticated-user");
}

describe("resolveAuthenticatedDatabaseUserState", () => {
  beforeEach(() => {
    authMock.mockReset();
    currentUserMock.mockReset();
    hasDatabaseConfigMock.mockReset();
    prismaMock.user.create.mockReset();
    prismaMock.user.findUnique.mockReset();
    prismaMock.user.update.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("backfills an existing legacy Clerk placeholder user", async () => {
    authMock.mockResolvedValue({ userId: "user_123" });
    currentUserMock.mockResolvedValue({
      emailAddresses: [],
      imageUrl: "https://example.com/avatar.png",
      primaryEmailAddress: {
        emailAddress: "real@example.com",
      },
      username: "orbit-user",
    });
    hasDatabaseConfigMock.mockReturnValue(true);
    prismaMock.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: "db_user_123",
      });
    prismaMock.user.update.mockResolvedValue({
      email: "real@example.com",
      id: "db_user_123",
      image: "https://example.com/avatar.png",
      name: "orbit-user",
    });

    const { resolveAuthenticatedDatabaseUserState } = await loadModule();
    const state = await resolveAuthenticatedDatabaseUserState();

    expect(state.status).toBe("authenticated");
    if (state.status !== "authenticated") {
      throw new Error("Expected authenticated state.");
    }

    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clerkUserId: "user_123",
          email: "real@example.com",
        }),
        where: {
          id: "db_user_123",
        },
      }),
    );
    expect(state.user.dbUserId).toBe("db_user_123");
  });
});
