import { NextResponse } from "next/server";

const DEFAULT_ALLOWED_HEADERS = [
  "Authorization",
  "Content-Type",
  "Origin",
  "X-Requested-With",
];

const DEFAULT_ALLOWED_METHODS = ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"];
const DEFAULT_MAX_AGE_SECONDS = 60 * 60 * 24;

function normalizeOrigin(origin: string) {
  return origin.trim().replace(/\/+$/, "");
}

function parseConfiguredOrigins(value?: string) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((entry) => normalizeOrigin(entry))
    .filter(Boolean);
}

function resolveAllowedOrigins() {
  const origins = new Set<string>();

  parseConfiguredOrigins(process.env.CORS_ALLOWED_ORIGINS).forEach((origin) => origins.add(origin));
  parseConfiguredOrigins(process.env.ALLOWED_ORIGINS).forEach((origin) => origins.add(origin));

  if (process.env.NEXT_PUBLIC_APP_URL?.trim()) {
    origins.add(normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL));
  }

  if (process.env.VERCEL_URL?.trim()) {
    origins.add(normalizeOrigin(`https://${process.env.VERCEL_URL}`));
  }

  if (process.env.NODE_ENV !== "production") {
    [
      "http://127.0.0.1:3000",
      "http://localhost:3000",
      "http://127.0.0.1:3001",
      "http://localhost:3001",
      "http://127.0.0.1:4173",
      "http://localhost:4173",
    ].forEach((origin) => origins.add(origin));
  }

  return origins;
}

export function getCorsRequestOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return origin ? normalizeOrigin(origin) : null;
}

export function isCorsOriginAllowed(request: Request) {
  const requestOrigin = getCorsRequestOrigin(request);

  if (!requestOrigin) {
    return true;
  }

  const currentOrigin = normalizeOrigin(new URL(request.url).origin);
  if (requestOrigin === currentOrigin) {
    return true;
  }

  return resolveAllowedOrigins().has(requestOrigin);
}

function mergeVaryHeader(currentValue: string | null, additions: string[]) {
  const varyValues = new Set(
    (currentValue ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );

  additions.forEach((value) => varyValues.add(value));

  return Array.from(varyValues).join(", ");
}

export function withCorsHeaders(
  request: Request,
  response: NextResponse,
  methods: string[] = DEFAULT_ALLOWED_METHODS,
) {
  const requestOrigin = getCorsRequestOrigin(request);

  response.headers.set(
    "Vary",
    mergeVaryHeader(response.headers.get("Vary"), ["Origin", "Access-Control-Request-Headers"]),
  );

  if (!requestOrigin || !isCorsOriginAllowed(request)) {
    return response;
  }

  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Allow-Methods", methods.join(", "));
  response.headers.set(
    "Access-Control-Allow-Headers",
    request.headers.get("access-control-request-headers") || DEFAULT_ALLOWED_HEADERS.join(", "),
  );
  response.headers.set("Access-Control-Allow-Origin", requestOrigin);
  response.headers.set("Access-Control-Max-Age", String(DEFAULT_MAX_AGE_SECONDS));

  return response;
}

export function createCorsPreflightResponse(
  request: Request,
  methods: string[] = DEFAULT_ALLOWED_METHODS,
) {
  if (!isCorsOriginAllowed(request)) {
    const response = NextResponse.json(
      { error: "Origin not allowed by CORS policy." },
      { status: 403 },
    );
    response.headers.set(
      "Vary",
      mergeVaryHeader(response.headers.get("Vary"), ["Origin", "Access-Control-Request-Headers"]),
    );
    return response;
  }

  return withCorsHeaders(request, new NextResponse(null, { status: 204 }), methods);
}

export function createCorsDeniedResponse() {
  const response = NextResponse.json(
    { error: "Origin not allowed by CORS policy." },
    { status: 403 },
  );
  response.headers.set(
    "Vary",
    mergeVaryHeader(response.headers.get("Vary"), ["Origin", "Access-Control-Request-Headers"]),
  );
  return response;
}
