import { ProgressStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readJsonBody } from "@/lib/api-request";
import { prisma } from "@/lib/db";
import { normalizeDifficultyLabel } from "@/lib/practice-prisma";
import { resolveAuthenticatedDatabaseUserState } from "@/lib/resolve-authenticated-user";

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

function unavailableProgressResponse(message: string) {
  return NextResponse.json(
    {
      authenticated: true,
      error: message,
      progress: [],
    },
    { status: 503 },
  );
}

export async function GET() {
  const authState = await resolveAuthenticatedDatabaseUserState();

  if (authState.status === "unauthenticated") {
    return NextResponse.json({
      authenticated: false,
      progress: [],
    });
  }

  if (authState.status === "unavailable") {
    return unavailableProgressResponse(authState.message);
  }

  try {
    const progress = await readUserPracticeProgress(authState.user.dbUserId);

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
  const bodyResult = await readJsonBody({
    invalidMessage: "Invalid progress payload.",
    maxBytes: 256_000,
    request,
    schema: syncBodySchema,
    tooLargeMessage: "Progress payload is too large. Split the sync into smaller batches and try again.",
  });

  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  const authState = await resolveAuthenticatedDatabaseUserState();

  if (authState.status === "unauthenticated") {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (authState.status === "unavailable") {
    return NextResponse.json({ error: authState.message }, { status: 503 });
  }

  const body = bodyResult.data;

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
                userId: authState.user.dbUserId,
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
              userId: authState.user.dbUserId,
            },
          }),
        ];
      }),
    );

    const progress = await readUserPracticeProgress(authState.user.dbUserId);

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
  const bodyResult = await readJsonBody({
    invalidMessage: "Invalid delete payload.",
    maxBytes: 32_000,
    request,
    schema: deleteBodySchema,
    tooLargeMessage: "Delete payload is too large. Split the request into smaller batches and try again.",
  });

  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  const authState = await resolveAuthenticatedDatabaseUserState();

  if (authState.status === "unauthenticated") {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (authState.status === "unavailable") {
    return NextResponse.json({ error: authState.message }, { status: 503 });
  }

  const body = bodyResult.data;

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
        userId: authState.user.dbUserId,
      },
    });

    const progress = await readUserPracticeProgress(authState.user.dbUserId);

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
