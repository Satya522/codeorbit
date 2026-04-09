import { auth, currentUser } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { hasDatabaseConfig } from "@/lib/database-url";

export type AuthenticatedDatabaseUser = {
  clerkUserId: string;
  dbUserId: string;
  email: string;
  image: string | null;
  name: string | null;
};

export type AuthenticatedDatabaseUserState =
  | {
      status: "authenticated";
      user: AuthenticatedDatabaseUser;
    }
  | {
      status: "unauthenticated";
    }
  | {
      message: string;
      status: "unavailable";
    };

function buildDisplayName(user: Awaited<ReturnType<typeof currentUser>>) {
  if (!user) {
    return null;
  }

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return fullName || user.username || null;
}

function resolveEmail(user: Awaited<ReturnType<typeof currentUser>>, clerkUserId: string) {
  return (
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    `${clerkUserId}@clerk.local`
  );
}

function buildUnavailableState(message: string): AuthenticatedDatabaseUserState {
  return {
    message,
    status: "unavailable",
  };
}

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

async function findExistingUserId(clerkUserId: string, candidateEmails: string[]) {
  const byClerkUserId = await prisma.user.findUnique({
    where: {
      clerkUserId,
    },
    select: {
      id: true,
    },
  });

  if (byClerkUserId) {
    return byClerkUserId.id;
  }

  for (const email of candidateEmails) {
    const byEmail = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
      },
    });

    if (byEmail) {
      return byEmail.id;
    }
  }

  return null;
}

async function persistDatabaseUser(params: {
  candidateEmails: string[];
  clerkUserId: string;
  email: string;
  existingUserId: string | null;
  image: string | null;
  name: string | null;
  now: Date;
}) {
  const { candidateEmails, clerkUserId, email, existingUserId, image, name, now } = params;
  const baseData = {
    clerkUserId,
    image,
    lastActive: now,
    name,
  };

  if (existingUserId) {
    try {
      return await prisma.user.update({
        where: {
          id: existingUserId,
        },
        data: {
          ...baseData,
          email,
        },
        select: {
          email: true,
          id: true,
          image: true,
          name: true,
        },
      });
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }

      return prisma.user.update({
        where: {
          id: existingUserId,
        },
        data: baseData,
        select: {
          email: true,
          id: true,
          image: true,
          name: true,
        },
      });
    }
  }

  try {
    return await prisma.user.create({
      data: {
        ...baseData,
        email,
      },
      select: {
        email: true,
        id: true,
        image: true,
        name: true,
      },
    });
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error;
    }

    const fallbackUserId = await findExistingUserId(clerkUserId, candidateEmails);

    if (!fallbackUserId) {
      throw error;
    }

    return prisma.user.update({
      where: {
        id: fallbackUserId,
      },
      data: {
        clerkUserId,
        email,
        image,
        lastActive: now,
        name,
      },
      select: {
        email: true,
        id: true,
        image: true,
        name: true,
      },
    });
  }
}

export async function resolveAuthenticatedDatabaseUserState(): Promise<AuthenticatedDatabaseUserState> {
  const { userId } = await auth();

  if (!userId) {
    return {
      status: "unauthenticated",
    };
  }

  if (!hasDatabaseConfig()) {
    return buildUnavailableState(
      "You are signed in, but the database is not configured yet. Add a PostgreSQL connection to enable cloud sync.",
    );
  }

  try {
    const clerkUser = await currentUser();
    const email = resolveEmail(clerkUser, userId);
    const legacyFallbackEmail = `${userId}@clerk.local`;
    const candidateEmails = Array.from(new Set([email, legacyFallbackEmail]));
    const name = buildDisplayName(clerkUser);
    const image = clerkUser?.imageUrl ?? null;
    const now = new Date();
    const existingUserId = await findExistingUserId(userId, candidateEmails);
    const dbUser = await persistDatabaseUser({
      candidateEmails,
      clerkUserId: userId,
      email,
      existingUserId,
      image,
      name,
      now,
    });

    return {
      status: "authenticated",
      user: {
        clerkUserId: userId,
        dbUserId: dbUser.id,
        email: dbUser.email,
        image: dbUser.image,
        name: dbUser.name,
      },
    };
  } catch (error) {
    console.error("Unable to resolve authenticated database user.", error);
    return buildUnavailableState(
      "You are signed in, but the database is temporarily unavailable. Please try again shortly.",
    );
  }
}

export async function resolveAuthenticatedDatabaseUser(): Promise<AuthenticatedDatabaseUser | null> {
  const state = await resolveAuthenticatedDatabaseUserState();
  return state.status === "authenticated" ? state.user : null;
}
