import { NextResponse } from "next/server";
import { z } from "zod";
import { allowSignedOutRouteAccess, buildRateLimitHeaders } from "@/lib/api-guard";
import { readJsonBody } from "@/lib/api-request";
import { requestPlaygroundLspCompletion } from "@/lib/lsp/languageServerManager";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const lspWorkspaceFileSchema = z.object({
  language: z.string().trim().min(1).max(40),
  text: z.string().max(200_000),
  uri: z.string().trim().startsWith("file://").max(500),
});

const completionRequestSchema = z.object({
  documentUri: z.string().trim().startsWith("file://").max(500),
  files: z.array(lspWorkspaceFileSchema).min(1).max(40),
  language: z.enum(["css", "cpp", "html", "java", "javascript", "python"]),
  position: z.object({
    column: z.number().int().min(1).max(10_000),
    line: z.number().int().min(1).max(10_000),
  }),
  requestContext: z
    .object({
      triggerCharacter: z.string().max(1).optional(),
      triggerKind: z.number().int().min(1).max(3).optional(),
    })
    .optional(),
});

function jsonResponse(payload: Record<string, unknown>, status: number, headers?: Record<string, string>) {
  return NextResponse.json(payload, {
    headers,
    status,
  });
}

export async function POST(req: Request) {
  const access = await allowSignedOutRouteAccess({
    bucket: "playground-lsp",
    guestLimit: 90,
    limit: 180,
    request: req,
    windowSeconds: 60,
  });

  if (!access.ok) {
    return access.response;
  }

  const bodyResult = await readJsonBody({
    invalidMessage: "Invalid playground completion payload.",
    maxBytes: 500_000,
    request: req,
    schema: completionRequestSchema,
    tooLargeMessage: "Completion request is too large. Reduce the playground workspace size and try again.",
  });

  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  const headers = buildRateLimitHeaders(access.rateLimit);

  try {
    const result = await requestPlaygroundLspCompletion(bodyResult.data);

    return jsonResponse(
      {
        items: result,
      },
      200,
      headers,
    );
  } catch (error) {
    console.error("Playground LSP completion failed", error);

    return jsonResponse(
      {
        error: error instanceof Error ? error.message : "Unable to fetch language server completions.",
        items: null,
      },
      500,
      headers,
    );
  }
}
