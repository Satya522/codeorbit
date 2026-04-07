import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { listPracticeQuestions } from "@/lib/question-catalog";
import { getDatabasePracticeFilters, normalizeDifficultyLabel, toPracticeSummary } from "@/lib/practice-prisma";
import { redis } from "@/lib/redis";

const optionalString = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().optional());

const optionalDifficulty = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : undefined;
}, z.enum(["easy", "medium", "hard"]).optional());

const limitSchema = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  return value;
}, z.coerce.number().int().min(1).max(100).default(20));

const querySchema = z.object({
  company: optionalString,
  cursor: optionalString,
  difficulty: optionalDifficulty,
  limit: limitSchema,
  platform: optionalString,
  search: optionalString,
  topic: optionalString,
});

function buildWhere(params: z.infer<typeof querySchema>): Prisma.ExternalQuestionRefWhereInput {
  return {
    ...(params.difficulty && {
      difficulty: {
        equals: params.difficulty,
        mode: "insensitive",
      },
    }),
    ...(params.platform && {
      platform: {
        equals: params.platform,
        mode: "insensitive",
      },
    }),
    ...(params.topic && {
      topic: {
        contains: params.topic,
        mode: "insensitive",
      },
    }),
    ...(params.company && {
      companies: {
        has: params.company,
      },
    }),
    ...(params.search && {
      OR: [
        {
          title: {
            contains: params.search,
            mode: "insensitive",
          },
        },
        {
          topic: {
            contains: params.search,
            mode: "insensitive",
          },
        },
      ],
    }),
  };
}

function toFallbackDifficulty(value?: string) {
  const normalized = normalizeDifficultyLabel(value);
  return normalized ?? null;
}

export async function GET(request: NextRequest) {
  let params: z.infer<typeof querySchema>;

  try {
    params = querySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid query parameters.",
          issues: error.flatten(),
        },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Invalid query parameters." }, { status: 400 });
  }

  const cacheKey = `questions:${JSON.stringify(params)}`;

  try {
    const cached = await redis.get(cacheKey);

    if (cached) {
      return NextResponse.json(JSON.parse(cached), {
        headers: {
          "X-Cache": "HIT",
          "X-Data-Source": "DATABASE",
        },
      });
    }
  } catch (error) {
    console.error("Practice questions cache read failed.", error);
  }

  const where = buildWhere(params);

  try {
    const [data, total, filters] = await Promise.all([
      prisma.externalQuestionRef.findMany({
        where,
        take: params.limit,
        skip: params.cursor ? 1 : 0,
        cursor: params.cursor ? { id: params.cursor } : undefined,
        orderBy: [
          { leetcodeFreqMax: "desc" },
          { createdAt: "desc" },
        ],
        include: {
          _count: {
            select: { solutions: true },
          },
        },
      }),
      prisma.externalQuestionRef.count({ where }),
      getDatabasePracticeFilters(),
    ]);

    const questions = data.map(toPracticeSummary);
    const nextCursor = data.length === params.limit ? data[data.length - 1]?.id ?? null : null;
    const response = {
      data,
      filters,
      meta: {
        timestamp: new Date().toISOString(),
        total,
      },
      nextCursor,
      questions,
      total,
    };

    try {
      await redis.setex(cacheKey, 300, JSON.stringify(response));
    } catch (error) {
      console.error("Practice questions cache write failed.", error);
    }

    return NextResponse.json(response, {
      headers: {
        "X-Cache": "MISS",
        "X-Data-Source": "DATABASE",
      },
    });
  } catch (error) {
    console.error("Database-backed question fetch failed, using static catalog fallback.", error);
  }

  try {
    const fallback = await listPracticeQuestions({
      difficulty: toFallbackDifficulty(params.difficulty) ?? undefined,
      platform: params.platform,
      search: params.search,
      topic: params.topic,
    });

    const response = {
      data: fallback.questions,
      filters: fallback.filters,
      meta: {
        timestamp: new Date().toISOString(),
        total: fallback.total,
      },
      nextCursor: null,
      questions: fallback.questions,
      total: fallback.total,
    };

    return NextResponse.json(response, {
      headers: {
        "X-Cache": "SKIP",
        "X-Data-Source": "STATIC",
      },
    });
  } catch (error) {
    console.error("Error fetching questions:", error);
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 },
    );
  }
}
