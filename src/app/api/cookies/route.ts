import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  deleteServerCookie,
  getAllServerCookies,
  getServerCookie,
  hasServerCookie,
  setServerCookie,
  updateServerCookie,
} from "@/lib/cookies/server";
import { CookieOptions } from "@/lib/cookies/types";

const cookieOptionsSchema = z.object({
  domain: z.string().min(1).optional(),
  expires: z.string().min(1).optional(),
  httpOnly: z.boolean().optional(),
  maxAge: z.number().int().nonnegative().optional(),
  partitioned: z.boolean().optional(),
  path: z.string().min(1).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  sameSite: z.enum(["lax", "strict", "none"]).optional(),
  secure: z.boolean().optional(),
});

const cookiePayloadSchema = z.object({
  name: z.string().min(1, "Cookie name is required."),
  options: cookieOptionsSchema.optional(),
  value: z.string(),
});

const deletePayloadSchema = z.object({
  name: z.string().min(1, "Cookie name is required."),
});

type CookiePayload = z.infer<typeof cookiePayloadSchema>;
type CookieOptionsInput = z.infer<typeof cookieOptionsSchema>;

function buildCookieOptions(options?: CookieOptionsInput): CookieOptions | undefined {
  if (!options) {
    return undefined;
  }

  const { expires, ...restOptions } = options;

  if (!expires) {
    return restOptions;
  }

  const parsedDate = new Date(expires);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error("Cookie expires must be a valid date string.");
  }

  return {
    ...restOptions,
    expires: parsedDate,
  };
}

async function readJsonBody(request: NextRequest) {
  const text = await request.text();
  if (!text.trim()) {
    return null;
  }

  return JSON.parse(text) as unknown;
}

function handleZodError(error: z.ZodError) {
  return NextResponse.json(
    {
      error: "Invalid cookie payload.",
      issues: error.flatten(),
    },
    { status: 400 },
  );
}

function handleUnknownError(error: unknown) {
  return NextResponse.json(
    {
      error: error instanceof Error ? error.message : "Unable to process cookie request.",
    },
    { status: 500 },
  );
}

export async function GET(request: NextRequest) {
  try {
    const name = request.nextUrl.searchParams.get("name");

    if (!name) {
      const cookies = await getAllServerCookies();
      return NextResponse.json({
        cookies,
        count: cookies.length,
      });
    }

    const cookie = await getServerCookie(name);
    return NextResponse.json({
      cookie,
      exists: await hasServerCookie(name),
    });
  } catch (error) {
    return handleUnknownError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody(request);
    const payload = cookiePayloadSchema.parse(body) as CookiePayload;
    const result = await setServerCookie(
      payload.name,
      payload.value,
      buildCookieOptions(payload.options),
    );

    return NextResponse.json(
      {
        action: "set",
        ...result,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error);
    }

    return handleUnknownError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await readJsonBody(request);
    const payload = cookiePayloadSchema.parse(body) as CookiePayload;
    const result = await updateServerCookie(
      payload.name,
      payload.value,
      buildCookieOptions(payload.options),
    );

    return NextResponse.json({
      action: "update",
      ...result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error);
    }

    return handleUnknownError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const nameFromQuery = request.nextUrl.searchParams.get("name");
    const body = nameFromQuery ? null : await readJsonBody(request);
    const payload = deletePayloadSchema.parse(nameFromQuery ? { name: nameFromQuery } : body);
    const result = await deleteServerCookie(payload.name);

    return NextResponse.json({
      action: "delete",
      ...result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error);
    }

    return handleUnknownError(error);
  }
}
