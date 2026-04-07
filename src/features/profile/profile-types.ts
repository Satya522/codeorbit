export type SocialProvider = "GITHUB" | "LINKEDIN";

export type SyncedProject = {
  description: string | null;
  forks: number;
  homepage: string | null;
  language: string | null;
  name: string;
  stars: number;
  topics: string[];
  updatedAt: string;
  url: string;
};

export type SocialConnection = {
  avatarUrl: string | null;
  connectedAt: string;
  displayName: string | null;
  handle: string | null;
  headline: string | null;
  lastSyncedAt: string | null;
  metadata: Record<string, unknown> | null;
  profileUrl: string;
  provider: SocialProvider;
  syncedProjects: SyncedProject[];
  updatedAt: string;
};

export type ClerkConnectionSuggestion = {
  avatarUrl: string | null;
  displayName: string | null;
  handle: string | null;
  headline: string | null;
  profileUrl: string | null;
  provider: SocialProvider;
};

export type ConnectionsPayload = {
  authenticated?: boolean;
  clerkSuggestions?: ClerkConnectionSuggestion[];
  connections?: SocialConnection[];
  error?: string;
  setupRequired?: boolean;
};

export function formatRelativeTime(value: string | null) {
  if (!value) {
    return "Not synced yet";
  }

  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) {
    return "Not synced yet";
  }

  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.max(1, Math.round(diffMs / (1000 * 60)));

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part.trim()[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function readNumericMetadata(metadata: Record<string, unknown> | null, key: string) {
  const value = metadata?.[key];
  return typeof value === "number" ? value : 0;
}

export function readTextMetadata(metadata: Record<string, unknown> | null, key: string) {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value : null;
}

export function isClerkManagedConnection(connection: SocialConnection | null) {
  const source = readTextMetadata(connection?.metadata ?? null, "source");
  return Boolean(source?.startsWith("clerk-oauth"));
}

export function hasMeaningfulProfileUrl(connection: SocialConnection | null) {
  if (!connection?.profileUrl) {
    return false;
  }

  const normalized = connection.profileUrl.replace(/\/+$/, "");
  return normalized !== "https://www.linkedin.com" && normalized !== "https://github.com";
}
