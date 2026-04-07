import { currentUser } from "@clerk/nextjs/server";
import { Prisma, type SocialProvider, type UserSocialConnection } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { resolveAuthenticatedDatabaseUser } from "@/lib/resolve-authenticated-user";
import {
  refreshStoredGitHubConnection,
  shouldRefreshGitHubConnection,
  syncGitHubConnection,
  syncGitHubConnectionFromClerk,
  type ClerkExternalAccountSnapshot,
  type SocialConnectionSnapshot,
  type SyncedProjectSnapshot,
} from "@/lib/social-profile-sync";

const connectionSchema = z.object({
  identifier: z.string().trim().min(1).optional(),
  provider: z.enum(["GITHUB"]),
  useClerkAccount: z.boolean().optional(),
});

const deleteSchema = z.object({
  provider: z.enum(["GITHUB"]),
});

const GITHUB_PROVIDER: SocialProvider = "GITHUB";

type ClerkSocialSuggestion = {
  avatarUrl: string | null;
  displayName: string | null;
  handle: string | null;
  headline: string | null;
  profileUrl: string | null;
  provider: SocialProvider;
};

type ConnectionResponse = {
  authenticated: boolean;
  clerkSuggestions: ClerkSocialSuggestion[];
  connections: Array<{
    avatarUrl: string | null;
    connectedAt: string;
    displayName: string | null;
    handle: string | null;
    headline: string | null;
    lastSyncedAt: string | null;
    metadata: Record<string, unknown> | null;
    profileUrl: string;
    provider: SocialProvider;
    syncedProjects: SyncedProjectSnapshot[];
    updatedAt: string;
  }>;
  error?: string;
  setupRequired?: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSyncedProjectSnapshot(value: unknown): value is SyncedProjectSnapshot {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.name === "string" &&
    typeof value.url === "string" &&
    typeof value.updatedAt === "string"
  );
}

function metadataSource(connection: Pick<UserSocialConnection, "metadata">) {
  if (!isRecord(connection.metadata)) {
    return "";
  }

  return typeof connection.metadata.source === "string" ? connection.metadata.source : "";
}

function toResponseConnection(connection: UserSocialConnection): ConnectionResponse["connections"][number] {
  const metadata = isRecord(connection.metadata) ? connection.metadata : null;
  const syncedProjects = Array.isArray(connection.syncedProjects)
    ? connection.syncedProjects.filter(isSyncedProjectSnapshot)
    : [];

  return {
    avatarUrl: connection.avatarUrl,
    connectedAt: connection.connectedAt.toISOString(),
    displayName: connection.displayName,
    handle: connection.handle,
    headline: connection.headline,
    lastSyncedAt: connection.lastSyncedAt?.toISOString() ?? null,
    metadata,
    profileUrl: connection.profileUrl,
    provider: connection.provider,
    syncedProjects,
    updatedAt: connection.updatedAt.toISOString(),
  };
}

function isSetupRequiredError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "P2021";
  }

  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message.includes("user_social_connections") ||
    error.message.includes("does not exist") ||
    error.message.includes("doesn't exist")
  );
}

function setupRequiredResponse(clerkSuggestions: ClerkSocialSuggestion[] = []) {
  return NextResponse.json(
    {
      authenticated: true,
      clerkSuggestions,
      connections: [],
      error: "Profile connections need a database sync before they can be used.",
      setupRequired: true,
    },
    { status: 503 },
  );
}

function matchExternalAccountProvider(provider: string, socialProvider: SocialProvider) {
  const normalizedProvider = provider.toLowerCase();

  return socialProvider === GITHUB_PROVIDER && normalizedProvider.includes("github");
}

function formatClerkDisplayName(account: ClerkExternalAccountSnapshot) {
  const fullName = [account.firstName, account.lastName].filter(Boolean).join(" ").trim();
  return fullName || account.username || account.emailAddress || null;
}

function mapClerkAccount(account: {
  emailAddress: string;
  firstName: string;
  imageUrl: string;
  lastName: string;
  provider: string;
  providerUserId: string;
  username: string | null;
}): ClerkExternalAccountSnapshot {
  return {
    emailAddress: account.emailAddress,
    firstName: account.firstName,
    imageUrl: account.imageUrl,
    lastName: account.lastName,
    provider: account.provider,
    providerUserId: account.providerUserId,
    username: account.username,
  };
}

function findClerkAccount(
  clerkUser: Awaited<ReturnType<typeof currentUser>>,
  provider: SocialProvider,
) {
  return (
    clerkUser?.externalAccounts.find((account) => matchExternalAccountProvider(account.provider, provider)) ?? null
  );
}

function buildClerkSuggestions(
  clerkUser: Awaited<ReturnType<typeof currentUser>>,
): ClerkSocialSuggestion[] {
  if (!clerkUser) {
    return [];
  }

  const suggestions: ClerkSocialSuggestion[] = [];
  const account = findClerkAccount(clerkUser, GITHUB_PROVIDER);

  if (account) {
    const snapshot = mapClerkAccount(account);
    suggestions.push({
      avatarUrl: snapshot.imageUrl || null,
      displayName: formatClerkDisplayName(snapshot),
      handle: snapshot.username?.trim() || snapshot.providerUserId,
      headline: "Import your Clerk-connected GitHub account and sync repos in one click.",
      profileUrl: snapshot.username?.trim() ? `https://github.com/${snapshot.username.trim()}` : "https://github.com/",
      provider: GITHUB_PROVIDER,
    });
  }

  return suggestions;
}

async function upsertConnection(dbUserId: string, snapshot: SocialConnectionSnapshot) {
  return prisma.userSocialConnection.upsert({
    where: {
      userId_provider: {
        provider: snapshot.provider,
        userId: dbUserId,
      },
    },
    update: {
      avatarUrl: snapshot.avatarUrl,
      displayName: snapshot.displayName,
      handle: snapshot.handle,
      headline: snapshot.headline,
      lastSyncedAt: new Date(),
      metadata: snapshot.metadata ?? Prisma.JsonNull,
      profileUrl: snapshot.profileUrl,
      syncedProjects: snapshot.syncedProjects,
    },
    create: {
      avatarUrl: snapshot.avatarUrl,
      displayName: snapshot.displayName,
      handle: snapshot.handle,
      headline: snapshot.headline,
      lastSyncedAt: new Date(),
      metadata: snapshot.metadata ?? Prisma.JsonNull,
      profileUrl: snapshot.profileUrl,
      provider: snapshot.provider,
      syncedProjects: snapshot.syncedProjects,
      userId: dbUserId,
    },
  });
}

async function readConnections(dbUserId: string) {
  return prisma.userSocialConnection.findMany({
    orderBy: {
      connectedAt: "asc",
    },
    where: {
      userId: dbUserId,
    },
  });
}

async function maybeRefreshConnections(dbUserId: string, connections: UserSocialConnection[]) {
  const refreshedConnections = [...connections];

  for (const connection of connections) {
    if (!shouldRefreshGitHubConnection(connection) || metadataSource(connection).startsWith("clerk-oauth")) {
      continue;
    }

    try {
      const snapshot = await refreshStoredGitHubConnection(connection);
      const refreshed = await upsertConnection(dbUserId, snapshot);
      const currentIndex = refreshedConnections.findIndex((item) => item.id === connection.id);

      if (currentIndex >= 0) {
        refreshedConnections[currentIndex] = refreshed;
      }
    } catch (error) {
      console.warn("Unable to refresh stored GitHub connection.", error);
    }
  }

  return refreshedConnections;
}

async function resolveClerkSnapshot(
  body: z.infer<typeof connectionSchema>,
  clerkUser: Awaited<ReturnType<typeof currentUser>>,
) {
  const account = findClerkAccount(clerkUser, body.provider as SocialProvider);

  if (!account) {
    throw new Error("No connected GitHub account was found in Clerk.");
  }

  const snapshot = mapClerkAccount(account);
  return syncGitHubConnectionFromClerk(snapshot);
}

async function resolveSnapshotFromBody(
  body: z.infer<typeof connectionSchema>,
  clerkUser: Awaited<ReturnType<typeof currentUser>>,
) {
  if (body.useClerkAccount) {
    return resolveClerkSnapshot(body, clerkUser);
  }

  if (!body.identifier?.trim()) {
    throw new Error("GitHub username or profile URL is required.");
  }

  return syncGitHubConnection(body.identifier);
}

export async function GET() {
  const dbUser = await resolveAuthenticatedDatabaseUser();

  if (!dbUser) {
    return NextResponse.json<ConnectionResponse>({
      authenticated: false,
      clerkSuggestions: [],
      connections: [],
    });
  }

  const clerkUser = await currentUser();
  const clerkSuggestions = buildClerkSuggestions(clerkUser);

  try {
    const connections = await readConnections(dbUser.dbUserId);
    const githubConnections = connections.filter((connection) => connection.provider === GITHUB_PROVIDER);
    const refreshedConnections = await maybeRefreshConnections(dbUser.dbUserId, githubConnections);

    return NextResponse.json<ConnectionResponse>({
      authenticated: true,
      clerkSuggestions,
      connections: refreshedConnections.map(toResponseConnection),
    });
  } catch (error) {
    console.error("Unable to read social connections.", error);

    if (isSetupRequiredError(error)) {
      return setupRequiredResponse(clerkSuggestions);
    }

    return NextResponse.json(
      {
        authenticated: true,
        clerkSuggestions,
        connections: [],
        error: "Unable to load social connections right now.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  let body: z.infer<typeof connectionSchema>;

  try {
    body = connectionSchema.parse(await request.json());
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid social connection payload.",
          issues: error.flatten(),
        },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Invalid social connection payload." }, { status: 400 });
  }

  const dbUser = await resolveAuthenticatedDatabaseUser();

  if (!dbUser) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const clerkUser = await currentUser();
  const clerkSuggestions = buildClerkSuggestions(clerkUser);

  try {
    const snapshot = await resolveSnapshotFromBody(body, clerkUser);

    await upsertConnection(dbUser.dbUserId, snapshot);
    const connections = (await readConnections(dbUser.dbUserId)).filter(
      (connection) => connection.provider === GITHUB_PROVIDER,
    );

    return NextResponse.json<ConnectionResponse>({
      authenticated: true,
      clerkSuggestions,
      connections: connections.map(toResponseConnection),
    });
  } catch (error) {
    console.error("Unable to save social connection.", error);

    if (isSetupRequiredError(error)) {
      return setupRequiredResponse(clerkSuggestions);
    }

    const message = error instanceof Error ? error.message : "Unable to save social connection.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  let body: z.infer<typeof deleteSchema>;

  try {
    body = deleteSchema.parse(await request.json());
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid delete payload.",
          issues: error.flatten(),
        },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Invalid delete payload." }, { status: 400 });
  }

  const dbUser = await resolveAuthenticatedDatabaseUser();

  if (!dbUser) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const clerkUser = await currentUser();
  const clerkSuggestions = buildClerkSuggestions(clerkUser);

  try {
    await prisma.userSocialConnection.deleteMany({
      where: {
        provider: body.provider,
        userId: dbUser.dbUserId,
      },
    });

    const connections = (await readConnections(dbUser.dbUserId)).filter(
      (connection) => connection.provider === GITHUB_PROVIDER,
    );

    return NextResponse.json<ConnectionResponse>({
      authenticated: true,
      clerkSuggestions,
      connections: connections.map(toResponseConnection),
    });
  } catch (error) {
    console.error("Unable to delete social connection.", error);

    if (isSetupRequiredError(error)) {
      return setupRequiredResponse(clerkSuggestions);
    }

    return NextResponse.json({ error: "Unable to delete social connection." }, { status: 500 });
  }
}
