import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const currentUserMock = vi.fn();
const resolveAuthenticatedDatabaseUserStateMock = vi.fn();
const buildLinkedInConnectionMock = vi.fn();

const prismaMock = {
  userSocialConnection: {
    deleteMany: vi.fn(),
    findMany: vi.fn(),
    upsert: vi.fn(),
  },
};

vi.mock("@clerk/nextjs/server", () => ({
  currentUser: currentUserMock,
}));

vi.mock("@/lib/resolve-authenticated-user", () => ({
  resolveAuthenticatedDatabaseUserState: resolveAuthenticatedDatabaseUserStateMock,
}));

vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/social-profile-sync", () => ({
  buildLinkedInConnection: buildLinkedInConnectionMock,
  buildLinkedInConnectionFromClerk: vi.fn((account) => ({
    avatarUrl: account.imageUrl || null,
    displayName: account.firstName || null,
    handle: account.username || account.providerUserId,
    headline: "LinkedIn account imported from your Clerk social connection.",
    metadata: { source: "clerk-oauth-linkedin" },
    profileUrl: "https://www.linkedin.com/in/test-user",
    provider: "LINKEDIN",
    syncedProjects: [],
  })),
  refreshStoredGitHubConnection: vi.fn(),
  shouldRefreshGitHubConnection: vi.fn(() => false),
  syncGitHubConnection: vi.fn(),
  syncGitHubConnectionFromClerk: vi.fn(),
}));

async function loadRoute() {
  vi.resetModules();
  return import("@/app/api/profile/connections/route");
}

describe("Profile connections route", () => {
  beforeEach(() => {
    currentUserMock.mockReset();
    resolveAuthenticatedDatabaseUserStateMock.mockReset();
    buildLinkedInConnectionMock.mockReset();
    prismaMock.userSocialConnection.deleteMany.mockReset();
    prismaMock.userSocialConnection.findMany.mockReset();
    prismaMock.userSocialConnection.upsert.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns a service-unavailable response when the database is down", async () => {
    resolveAuthenticatedDatabaseUserStateMock.mockResolvedValue({
      message: "Database temporarily unavailable.",
      status: "unavailable",
    });
    currentUserMock.mockResolvedValue({ externalAccounts: [] });

    const { GET } = await loadRoute();
    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      authenticated: true,
      error: "Database temporarily unavailable.",
    });
  });

  it("stores a manual LinkedIn connection", async () => {
    resolveAuthenticatedDatabaseUserStateMock.mockResolvedValue({
      status: "authenticated",
      user: {
        clerkUserId: "user_test_123",
        dbUserId: "db_user_123",
        email: "test@example.com",
        image: null,
        name: "Test User",
      },
    });
    currentUserMock.mockResolvedValue({ externalAccounts: [] });
    buildLinkedInConnectionMock.mockReturnValue({
      avatarUrl: null,
      displayName: "Test User",
      handle: "test-user",
      headline: "Public LinkedIn profile connected to your CodeOrbit profile.",
      metadata: { source: "linkedin-public-profile" },
      profileUrl: "https://www.linkedin.com/in/test-user",
      provider: "LINKEDIN",
      syncedProjects: [],
    });
    prismaMock.userSocialConnection.upsert.mockResolvedValue(undefined);
    prismaMock.userSocialConnection.findMany.mockResolvedValue([
      {
        avatarUrl: null,
        connectedAt: new Date("2026-04-07T10:00:00.000Z"),
        displayName: "Test User",
        handle: "test-user",
        headline: "Public LinkedIn profile connected to your CodeOrbit profile.",
        id: "conn_123",
        lastSyncedAt: new Date("2026-04-07T10:00:00.000Z"),
        metadata: { source: "linkedin-public-profile" },
        profileUrl: "https://www.linkedin.com/in/test-user",
        provider: "LINKEDIN",
        syncedProjects: [],
        updatedAt: new Date("2026-04-07T10:00:00.000Z"),
        userId: "db_user_123",
      },
    ]);

    const { POST } = await loadRoute();
    const response = await POST(
      new Request("http://localhost/api/profile/connections", {
        body: JSON.stringify({
          identifier: "https://www.linkedin.com/in/test-user",
          provider: "LINKEDIN",
        }),
        method: "POST",
      }) as never,
    );

    expect(response.status).toBe(200);
    expect(buildLinkedInConnectionMock).toHaveBeenCalledWith({
      profileUrl: "https://www.linkedin.com/in/test-user",
    });
    await expect(response.json()).resolves.toMatchObject({
      authenticated: true,
      connections: [
        {
          provider: "LINKEDIN",
          profileUrl: "https://www.linkedin.com/in/test-user",
        },
      ],
    });
  });
});
