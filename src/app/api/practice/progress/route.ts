import { ProgressStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { normalizeDifficultyLabel } from "@/lib/practice-prisma";
import { resolveAuthenticatedDatabaseUser } from "@/lib/resolve-authenticated-user";

const progressEntrySchema = z.object({
  difficulty: z.enum(["Easy", "Medium", "Hard"]).nullable(),
  primaryTopic: z.string().trim().nullable(),
  slug: z.string().trim().min(1),
  status: z.enum(["attempted", "solved"]),
  title: z.string().trim().min(1),
  topics: z.array(z.string().trim().min(1)).max(16),
  updatedAt: z.string().datetime().optional(),
});

const syncBodySchema = z.object({
  entries: z.array(progressEntrySchema).max(500),
});

const deleteBodySchema = z.object({
  slugs: z.array(z.string().trim().min(1)).max(500),
});

function splitTopics(topic: string | null) {
  if (!topic) {
    return [];
  }

  return Array.from(
    new Set(
      topic
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function mapStatus(status: ProgressStatus) {
  return status === "SOLVED" || status === "OPTIMIZED" ? "solved" : "attempted";
}

async function readUserPracticeProgress(dbUserId: string) {
  const rows = await prisma.userQuestionProgress.findMany({
    where: {
      status: {
        in: ["IN_PROGRESS", "SOLVED", "OPTIMIZED"],
      },
      userId: dbUserId,
    },
    include: {
      question: {
        select: {
          canonicalSlug: true,
          difficulty: true,
          title: true,
          topic: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return rows.map((row) => ({
    difficulty: normalizeDifficultyLabel(row.question.difficulty),
    primaryTopic: row.question.topic || null,
    slug: row.question.canonicalSlug,
    status: mapStatus(row.status),
    title: row.question.title,
    topics: splitTopics(row.question.topic),
    updatedAt: row.updatedAt.toISOString(),
  }));
}

export async function GET() {
  const dbUser = await resolveAuthenticatedDatabaseUser();

  if (!dbUser) {
    return NextResponse.json({
      authenticated: false,
      progress: [],
    });
  }

  try {
    const progress = await readUserPracticeProgress(dbUser.dbUserId);

    return NextResponse.json({
      authenticated: true,
      progress,
    });
  } catch (error) {
    console.error("Unable to read synced practice progress.", error);
    return NextResponse.json(
      {
        authenticated: true,
        error: "Unable to read synced practice progress.",
        progress: [],
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  let body: z.infer<typeof syncBodySchema>;

  try {
    body = syncBodySchema.parse(await request.json());
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid progress payload.",
          issues: error.flatten(),
        },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Invalid progress payload." }, { status: 400 });
  }

  const dbUser = await resolveAuthenticatedDatabaseUser();

  if (!dbUser) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const questionRows = await prisma.externalQuestionRef.findMany({
      where: {
        canonicalSlug: {
          in: body.entries.map((entry) => entry.slug),
        },
      },
      select: {
        canonicalSlug: true,
        id: true,
      },
    });

    const questionBySlug = new Map(questionRows.map((row) => [row.canonicalSlug, row.id]));

    await prisma.$transaction(
      body.entries.flatMap((entry) => {
        const questionId = questionBySlug.get(entry.slug);
        if (!questionId) {
          return [];
        }

        const nextStatus = entry.status === "solved" ? ProgressStatus.SOLVED : ProgressStatus.IN_PROGRESS;
        const solvedAt = entry.status === "solved" ? new Date(entry.updatedAt ?? new Date().toISOString()) : null;

        return [
          prisma.userQuestionProgress.upsert({
            where: {
              userId_questionId: {
                questionId,
                userId: dbUser.dbUserId,
              },
            },
            update: {
              attempts: {
                increment: nextStatus === ProgressStatus.IN_PROGRESS ? 1 : 0,
              },
              solvedAt,
              status: nextStatus,
            },
            create: {
              attempts: nextStatus === ProgressStatus.IN_PROGRESS ? 1 : 0,
              questionId,
              solvedAt,
              status: nextStatus,
              userId: dbUser.dbUserId,
            },
          }),
        ];
      }),
    );

    const progress = await readUserPracticeProgress(dbUser.dbUserId);

    return NextResponse.json({
      authenticated: true,
      progress,
    });
  } catch (error) {
    console.error("Unable to sync practice progress.", error);
    return NextResponse.json(
      { error: "Unable to sync practice progress." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  let body: z.infer<typeof deleteBodySchema>;

  try {
    body = deleteBodySchema.parse(await request.json());
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

  try {
    const questionRows = await prisma.externalQuestionRef.findMany({
      where: {
        canonicalSlug: {
          in: body.slugs,
        },
      },
      select: {
        id: true,
      },
    });

    await prisma.userQuestionProgress.deleteMany({
      where: {
        questionId: {
          in: questionRows.map((row) => row.id),
        },
        userId: dbUser.dbUserId,
      },
    });

    const progress = await readUserPracticeProgress(dbUser.dbUserId);

    return NextResponse.json({
      authenticated: true,
      progress,
    });
  } catch (error) {
    console.error("Unable to clear synced practice progress.", error);
    return NextResponse.json(
      { error: "Unable to clear synced practice progress." },
      { status: 500 },
    );
  }
}
