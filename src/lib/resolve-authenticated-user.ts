import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export type AuthenticatedDatabaseUser = {
  clerkUserId: string;
  dbUserId: string;
  email: string;
  image: string | null;
  name: string | null;
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

export async function resolveAuthenticatedDatabaseUser(): Promise<AuthenticatedDatabaseUser | null> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return null;
    }

    const clerkUser = await currentUser();
    const email = resolveEmail(clerkUser, userId);
    const name = buildDisplayName(clerkUser);
    const image = clerkUser?.imageUrl ?? null;
    const now = new Date();

    const dbUser = await prisma.user.upsert({
      where: { email },
      update: {
        image,
        lastActive: now,
        name,
      },
      create: {
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

    return {
      clerkUserId: userId,
      dbUserId: dbUser.id,
      email: dbUser.email,
      image: dbUser.image,
      name: dbUser.name,
    };
  } catch (error) {
    console.error("Unable to resolve authenticated database user.", error);
    return null;
  }
}
