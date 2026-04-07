import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import {
  createCorsDeniedResponse,
  createCorsPreflightResponse,
  withCorsHeaders,
} from "@/lib/http/cors";

function isApiRequest(request: NextRequest) {
  return request.nextUrl.pathname.startsWith("/api");
}

export default clerkMiddleware(async (_auth, request) => {
  if (!isApiRequest(request)) {
    return NextResponse.next();
  }

  if (request.method === "OPTIONS") {
    return createCorsPreflightResponse(request);
  }

  const response = withCorsHeaders(request, NextResponse.next());

  if (!response.headers.get("Access-Control-Allow-Origin") && request.headers.get("origin")) {
    return createCorsDeniedResponse();
  }

  return response;
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
