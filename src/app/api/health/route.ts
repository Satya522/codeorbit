import { NextResponse } from "next/server";
import { hasDatabaseConfig } from "@/lib/database-url";

type ServiceStatus = "configured" | "fallback" | "missing";

function hasEnv(key: string) {
  return Boolean(process.env[key]?.trim());
}

function getConfiguredAssistantProvider() {
  if (hasEnv("GEMINI_API_KEY")) {
    return "Gemini";
  }

  if (hasEnv("DEEPSEEK_API_KEY")) {
    return "DeepSeek";
  }

  return null;
}

function getConfiguredTutorProvider() {
  if (hasEnv("OPENAI_API_KEY")) {
    return "OpenAI";
  }

  if (hasEnv("GEMINI_API_KEY")) {
    return "Gemini";
  }

  if (hasEnv("DEEPSEEK_API_KEY")) {
    return "DeepSeek";
  }

  return null;
}

function getOverallStatus(services: Record<string, { status: ServiceStatus }>) {
  const statuses = Object.values(services).map((service) => service.status);

  if (statuses.every((status) => status === "configured")) {
    return "ready";
  }

  if (statuses.some((status) => status === "configured" || status === "fallback")) {
    return "degraded";
  }

  return "down";
}

export async function GET() {
  const assistantProvider = getConfiguredAssistantProvider();
  const tutorProvider = getConfiguredTutorProvider();

  const services = {
    aiAssistant: {
      status: assistantProvider ? "configured" : "missing",
      summary: assistantProvider
        ? `Legacy AI assistant provider (${assistantProvider})`
        : "Legacy AI assistant provider keys",
    },
    aiTutor: {
      status: tutorProvider ? "configured" : "missing",
      summary: tutorProvider
        ? `Streaming tutor model provider (${tutorProvider})`
        : "Streaming tutor model provider (OpenAI, Gemini, or DeepSeek)",
    },
    database: {
      status: hasDatabaseConfig() ? "configured" : "missing",
      summary: "Prisma PostgreSQL connection",
    },
    execution: {
      status: "configured",
      summary: "Remote HF Space execution engine",
    },
    realtime: {
      status:
        hasEnv("NEXT_PUBLIC_APP_URL") && hasEnv("NEXT_PUBLIC_PARTYKIT_HOST")
          ? "configured"
          : "missing",
      summary: "PartyKit collaboration host + app URL",
    },
    redis: {
      status: hasEnv("REDIS_URL") ? "configured" : "fallback",
      summary: "Redis cache, falls back to in-memory cache when missing",
    },
  } satisfies Record<string, { status: ServiceStatus; summary: string }>;

  const requirements = [
    {
      key: "DATABASE_URL or POSTGRES_HOST/PORT/DB/USER/PASSWORD",
      requiredFor: "Real database-backed practice and user data",
    },
    {
      key: "REDIS_URL",
      requiredFor: "Shared cache across restarts and multi-instance deployments",
    },
    {
      key: "OPENAI_API_KEY or GEMINI_API_KEY or DEEPSEEK_API_KEY",
      requiredFor: "AI tutor responses",
    },
    {
      key: "NEXT_PUBLIC_APP_URL",
      requiredFor: "PartyKit code execution callback routing",
    },
    {
      key: "NEXT_PUBLIC_PARTYKIT_HOST",
      requiredFor: "Realtime collaboration client connectivity",
    },
  ];

  return NextResponse.json({
    mode: process.env.NODE_ENV || "development",
    overall: getOverallStatus(services),
    requirements,
    services,
    timestamp: new Date().toISOString(),
  });
}
