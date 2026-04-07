import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPracticeQuestionBySlug } from "@/lib/question-catalog";
import { toPracticeDetail } from "@/lib/practice-prisma";
import { resolveAuthenticatedDatabaseUser } from "@/lib/resolve-authenticated-user";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

function getDifficultyCountWhere(difficulty: "easy" | "medium" | "hard"): Prisma.ExternalQuestionRefWhereInput {
  return {
    difficulty: {
      equals: difficulty,
      mode: "insensitive",
    },
  };
}

export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const { slug } = await context.params;
    const decodedSlug = decodeURIComponent(slug);

    try {
      const question = await prisma.externalQuestionRef.findUnique({
        where: { canonicalSlug: decodedSlug },
        include: {
          _count: {
            select: { solutions: true },
          },
          occurrences: {
            orderBy: {
              frequency: "desc",
            },
            take: 5,
          },
          solutions: {
            where: {
              status: {
                equals: "approved",
                mode: "insensitive",
              },
            },
            select: {
              code: true,
              id: true,
              language: true,
              shortExplanation: true,
              solutionKind: true,
              spaceComplexity: true,
              timeComplexity: true,
            },
          },
        },
      });

      if (question) {
        const dbUser = await resolveAuthenticatedDatabaseUser();
        const [userProgress, similarQuestions, easyCount, mediumCount, hardCount] = await Promise.all([
          dbUser
            ? prisma.userQuestionProgress.findUnique({
                where: {
                  userId_questionId: {
                    questionId: question.id,
                    userId: dbUser.dbUserId,
                  },
                },
              })
            : Promise.resolve(null),
          prisma.externalQuestionRef.findMany({
            where: {
              ...(question.topic
                ? {
                    topic: {
                      contains: question.topic,
                      mode: "insensitive",
                    },
                  }
                : {}),
              id: {
                not: question.id,
              },
            },
            take: 3,
            select: {
              canonicalSlug: true,
              difficulty: true,
              id: true,
              title: true,
            },
          }),
          prisma.externalQuestionRef.count({ where: getDifficultyCountWhere("easy") }),
          prisma.externalQuestionRef.count({ where: getDifficultyCountWhere("medium") }),
          prisma.externalQuestionRef.count({ where: getDifficultyCountWhere("hard") }),
        ]);

        return NextResponse.json(
          {
            question: {
              ...toPracticeDetail(question),
              companies: question.companies,
              constraints: question.constraints,
              description: question.description,
              difficultyDistribution: {
                easy: easyCount,
                hard: hardCount,
                medium: mediumCount,
              },
              externalUrl: question.externalUrl,
              leetcodeAcceptance: question.leetcodeAcceptance,
              leetcodeFreqMax: question.leetcodeFreqMax,
              occurrences: question.occurrences,
              similarQuestions,
              solutions: question.solutions,
              userProgress,
            },
          },
          {
            headers: {
              "X-Data-Source": "DATABASE",
            },
          },
        );
      }
    } catch (error) {
      console.error("Database-backed practice detail fetch failed, using static fallback.", error);
    }

    const question = await getPracticeQuestionBySlug(decodedSlug);

    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        question: {
          ...question,
          difficultyDistribution: null,
          occurrences: [],
          similarQuestions: [],
          solutions: [],
          userProgress: null,
        },
      },
      {
        headers: {
          "X-Data-Source": "STATIC",
        },
      },
    );
  } catch (error) {
    console.error("Error fetching question:", error);
    return NextResponse.json(
      { error: "Failed to fetch question" },
      { status: 500 },
    );
  }
}
