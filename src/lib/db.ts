import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { resolveDatabaseUrl } from "@/lib/database-url";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createUnavailableClient() {
  return new Proxy(
    {},
    {
      get() {
        throw new Error(
          "DATABASE_URL is not configured. Prisma-backed routes are unavailable until PostgreSQL is configured.",
        );
      },
    },
  ) as PrismaClient;
}

function createPrismaClient() {
  const databaseUrl = resolveDatabaseUrl();

  if (!databaseUrl) {
    return createUnavailableClient();
  }

  const adapter = new PrismaPg({
    connectionString: databaseUrl,
  });

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production" && resolveDatabaseUrl()) {
  globalForPrisma.prisma = prisma;
}
