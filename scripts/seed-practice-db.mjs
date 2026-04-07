import "dotenv/config";

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const seedSourcePath = path.join(repoRoot, "src", "data", "practice-links.json");

function readEnv(key) {
  const value = process.env[key]?.trim();
  return value ? value : undefined;
}

function encodePart(value) {
  return encodeURIComponent(value);
}

function resolveDatabaseUrl() {
  const directUrl = readEnv("DATABASE_URL");

  if (directUrl) {
    return directUrl;
  }

  const host = readEnv("POSTGRES_HOST");
  const port = readEnv("POSTGRES_PORT");
  const database = readEnv("POSTGRES_DB");
  const user = readEnv("POSTGRES_USER");
  const password = readEnv("POSTGRES_PASSWORD");

  const hasParts = Boolean(host || port || database || user || password);

  if (!hasParts) {
    return undefined;
  }

  const resolvedHost = host ?? "127.0.0.1";
  const resolvedPort = port ?? "5432";
  const resolvedDatabase = database ?? "codeorbit";
  const resolvedUser = user ?? "postgres";
  const resolvedPassword = password ?? "";
  const credentials = resolvedPassword
    ? `${encodePart(resolvedUser)}:${encodePart(resolvedPassword)}`
    : encodePart(resolvedUser);

  return `postgresql://${credentials}@${resolvedHost}:${resolvedPort}/${encodePart(resolvedDatabase)}`;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizePlatform(value) {
  const platform = String(value ?? "")
    .trim()
    .toLowerCase();

  if (!platform) {
    return "unknown";
  }

  const aliases = new Map([
    ["gfg", "geeksforgeeks"],
    ["geeks-for-geeks", "geeksforgeeks"],
    ["leetcode.com", "leetcode"],
  ]);

  return aliases.get(platform) ?? platform;
}

function cleanupTitle(value) {
  const title = String(value ?? "").trim().replace(/\s+/g, " ");
  return title || "Untitled Practice Problem";
}

function normalizeDifficulty(value) {
  const difficulty = String(value ?? "")
    .trim()
    .toLowerCase();

  if (difficulty.includes("easy")) {
    return "easy";
  }

  if (difficulty.includes("medium")) {
    return "medium";
  }

  if (difficulty.includes("hard")) {
    return "hard";
  }

  return "unknown";
}

function normalizeTopic(value, fallback) {
  const topic = String(value ?? "").trim().replace(/\s+/g, " ");

  if (topic) {
    return topic;
  }

  const derived = String(fallback ?? "").trim().replace(/\s+/g, " ");
  return derived || "General";
}

function cleanupList(value) {
  const items = Array.isArray(value)
    ? value
    : String(value ?? "")
        .split(/[|,;/]+/)
        .map((entry) => entry.trim());

  return [...new Set(items.filter(Boolean))];
}

function parseNullableNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function chunk(items, size) {
  const output = [];

  for (let index = 0; index < items.length; index += size) {
    output.push(items.slice(index, index + size));
  }

  return output;
}

async function main() {
  const databaseUrl = resolveDatabaseUrl();

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL or POSTGRES_HOST/PORT/DB/USER/PASSWORD is required to seed practice questions.",
    );
  }

  const raw = await fs.readFile(seedSourcePath, "utf8");
  const records = JSON.parse(raw);

  if (!Array.isArray(records)) {
    throw new Error("practice-links.json must contain an array.");
  }

  const dedupedRows = new Map();

  for (const record of records) {
    const platform = normalizePlatform(record.platform);
    const title = cleanupTitle(record.title);
    const canonicalSlug =
      String(record.canonical_slug ?? "").trim() || `${platform}-${slugify(title)}`;

    dedupedRows.set(canonicalSlug, {
      canonicalSlug,
      companies: cleanupList(record.companies),
      difficulty: normalizeDifficulty(record.difficulty),
      externalUrl: String(record.external_url ?? "").trim() || null,
      leetcodeAcceptance: parseNullableNumber(record.leetcode_acceptance_rate_avg),
      leetcodeFreqMax: parseNullableNumber(record.leetcode_frequency_max),
      platform,
      title,
      topic: normalizeTopic(record.topic, record.subtopic),
    });
  }

  const adapter = new PrismaPg({
    connectionString: databaseUrl,
  });

  const prisma = new PrismaClient({ adapter });

  try {
    await prisma.$transaction([
      prisma.externalQuestionOccurrence.deleteMany(),
      prisma.internalSolutionCache.deleteMany(),
      prisma.userQuestionProgress.deleteMany(),
      prisma.externalQuestionRef.deleteMany(),
    ]);

    for (const batch of chunk([...dedupedRows.values()], 1000)) {
      await prisma.externalQuestionRef.createMany({
        data: batch,
      });
    }

    console.log(`Seeded ${dedupedRows.size} practice questions into PostgreSQL.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
