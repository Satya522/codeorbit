import { Prisma, type SocialProvider, type UserSocialConnection } from "@prisma/client";

const GITHUB_API_BASE_URL = "https://api.github.com";
const LINKEDIN_USERINFO_URL = "https://api.linkedin.com/v2/userinfo";
const LINKEDIN_ROOT_PROFILE_URL = "https://www.linkedin.com/";
const GITHUB_USERNAME_PATTERN = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
const GITHUB_REFRESH_WINDOW_MS = 1000 * 60 * 60 * 6;
const GITHUB_PROVIDER: SocialProvider = "GITHUB";
const LINKEDIN_PROVIDER: SocialProvider = "LINKEDIN";

type GitHubUserResponse = {
  avatar_url: string;
  bio: string | null;
  blog: string;
  company: string | null;
  followers: number;
  following: number;
  html_url: string;
  location: string | null;
  login: string;
  name: string | null;
  public_repos: number;
};

type GitHubRepoResponse = {
  description: string | null;
  fork: boolean;
  forks_count: number;
  homepage: string | null;
  html_url: string;
  language: string | null;
  name: string;
  stargazers_count: number;
  topics?: string[];
  updated_at: string;
};

type LinkedInUserInfoResponse = {
  email?: string;
  email_verified?: boolean;
  family_name?: string;
  given_name?: string;
  locale?: string | {
    country?: string;
    language?: string;
  };
  name?: string;
  picture?: string;
  sub: string;
};

export type ClerkExternalAccountSnapshot = {
  emailAddress: string;
  firstName: string;
  imageUrl: string;
  lastName: string;
  provider: string;
  providerUserId: string;
  username: string | null;
};

export type SyncedProjectSnapshot = {
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

export type SocialConnectionSnapshot = {
  avatarUrl: string | null;
  displayName: string | null;
  handle: string | null;
  headline: string | null;
  metadata: Prisma.JsonObject | null;
  profileUrl: string;
  provider: SocialProvider;
  syncedProjects: SyncedProjectSnapshot[];
};

function buildGitHubHeaders() {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "CodeOrbit",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
}

function normalizeUrlCandidate(input: string) {
  const trimmed = input.trim();

  if (!trimmed) {
    throw new Error("A profile link or username is required.");
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  if (trimmed.includes("/")) {
    return `https://${trimmed}`;
  }

  return trimmed;
}

export function parseGitHubHandle(input: string) {
  const normalizedInput = normalizeUrlCandidate(input);

  let candidate = normalizedInput;

  if (normalizedInput.startsWith("http://") || normalizedInput.startsWith("https://")) {
    const url = new URL(normalizedInput);

    if (!url.hostname.toLowerCase().endsWith("github.com")) {
      throw new Error("Please enter a valid GitHub username or GitHub profile link.");
    }

    candidate = url.pathname
      .split("/")
      .filter(Boolean)[0] ?? "";
  }

  candidate = candidate
    .replace(/^@/, "")
    .replace(/^github\.com\//i, "")
    .replace(/\/+$/, "")
    .trim();

  if (!GITHUB_USERNAME_PATTERN.test(candidate)) {
    throw new Error("Please enter a valid GitHub username.");
  }

  return candidate;
}

export function normalizeLinkedInProfileUrl(input: string) {
  const normalizedInput = normalizeUrlCandidate(input);
  const url = new URL(
    normalizedInput.startsWith("http://") || normalizedInput.startsWith("https://")
      ? normalizedInput
      : `https://${normalizedInput}`,
  );

  if (!url.hostname.toLowerCase().endsWith("linkedin.com")) {
    throw new Error("Please enter a valid LinkedIn profile URL.");
  }

  const segments = url.pathname.split("/").filter(Boolean);

  if (segments.length < 2 || !["in", "company", "school"].includes(segments[0] ?? "")) {
    throw new Error("Use a public LinkedIn profile link like linkedin.com/in/your-name.");
  }

  url.hash = "";
  url.search = "";

  return url.toString().replace(/\/+$/, "");
}

export function extractLinkedInHandle(profileUrl: string) {
  const url = new URL(profileUrl);
  const segments = url.pathname.split("/").filter(Boolean);
  return segments[1] ?? null;
}

function toSyncedProjectSnapshot(repo: GitHubRepoResponse): SyncedProjectSnapshot {
  return {
    description: repo.description,
    forks: repo.forks_count,
    homepage: repo.homepage,
    language: repo.language,
    name: repo.name,
    stars: repo.stargazers_count,
    topics: repo.topics ?? [],
    updatedAt: repo.updated_at,
    url: repo.html_url,
  };
}

function buildDisplayNameFromClerkAccount(account: ClerkExternalAccountSnapshot) {
  const fullName = [account.firstName, account.lastName].filter(Boolean).join(" ").trim();
  return fullName || account.username || account.emailAddress || null;
}

function appendMetadataSource(
  metadata: Prisma.JsonObject | null,
  source: string,
  extras?: Prisma.JsonObject,
) {
  return {
    ...(metadata ?? {}),
    ...(extras ?? {}),
    source,
  } satisfies Prisma.JsonObject;
}

function guessLinkedInProfileUrl(account: ClerkExternalAccountSnapshot, existingProfileUrl?: string | null) {
  if (existingProfileUrl?.trim()) {
    return existingProfileUrl;
  }

  if (account.username?.trim()) {
    return `https://www.linkedin.com/in/${account.username.trim()}`;
  }

  return LINKEDIN_ROOT_PROFILE_URL;
}

function normalizeLocale(locale: LinkedInUserInfoResponse["locale"]) {
  if (!locale) {
    return null;
  }

  if (typeof locale === "string") {
    return locale;
  }

  const parts = [locale.language, locale.country].filter(Boolean);
  return parts.length > 0 ? parts.join("-") : null;
}

async function fetchGitHubJson<T>(pathname: string) {
  const response = await fetch(`${GITHUB_API_BASE_URL}${pathname}`, {
    headers: buildGitHubHeaders(),
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("GitHub profile not found.");
    }

    if (response.status === 403) {
      throw new Error("GitHub sync is rate-limited right now. Add GITHUB_TOKEN or try again shortly.");
    }

    throw new Error("GitHub sync failed. Please try again.");
  }

  return response.json() as Promise<T>;
}

export async function syncGitHubConnection(input: string): Promise<SocialConnectionSnapshot> {
  const handle = parseGitHubHandle(input);
  const [profile, repos] = await Promise.all([
    fetchGitHubJson<GitHubUserResponse>(`/users/${handle}`),
    fetchGitHubJson<GitHubRepoResponse[]>(`/users/${handle}/repos?sort=updated&per_page=8&type=owner`),
  ]);

  const ownedRepos = repos.filter((repo) => !repo.fork);
  const selectedRepos = (ownedRepos.length > 0 ? ownedRepos : repos)
    .slice(0, 6)
    .map(toSyncedProjectSnapshot);

  return {
    avatarUrl: profile.avatar_url,
    displayName: profile.name ?? profile.login,
    handle: profile.login,
    headline: profile.bio || `${profile.public_repos} public repositories synced from GitHub.`,
    metadata: {
      blog: profile.blog || null,
      company: profile.company || null,
      followers: profile.followers,
      following: profile.following,
      location: profile.location || null,
      publicRepos: profile.public_repos,
      source: "github-public-api",
    } satisfies Prisma.JsonObject,
    profileUrl: profile.html_url,
    provider: GITHUB_PROVIDER,
    syncedProjects: selectedRepos,
  };
}

export function buildGitHubConnectionFromClerk(account: ClerkExternalAccountSnapshot): SocialConnectionSnapshot {
  const displayName = buildDisplayNameFromClerkAccount(account);
  const handle = account.username?.trim() || account.providerUserId;
  const profileUrl = account.username?.trim() ? `https://github.com/${account.username.trim()}` : "https://github.com/";

  return {
    avatarUrl: account.imageUrl || null,
    displayName,
    handle,
    headline: "GitHub account imported from your Clerk social connection.",
    metadata: {
      email: account.emailAddress || null,
      provider: account.provider,
      source: "clerk-oauth-github",
    } satisfies Prisma.JsonObject,
    profileUrl,
    provider: GITHUB_PROVIDER,
    syncedProjects: [],
  };
}

export async function syncGitHubConnectionFromClerk(account: ClerkExternalAccountSnapshot) {
  if (!account.username?.trim()) {
    return buildGitHubConnectionFromClerk(account);
  }

  const snapshot = await syncGitHubConnection(account.username);

  return {
    ...snapshot,
    avatarUrl: snapshot.avatarUrl || account.imageUrl || null,
    displayName: snapshot.displayName || buildDisplayNameFromClerkAccount(account),
    metadata: appendMetadataSource(snapshot.metadata, "clerk-oauth-github", {
      clerkEmail: account.emailAddress || null,
      clerkProvider: account.provider,
    }),
  } satisfies SocialConnectionSnapshot;
}

export function buildLinkedInConnection(input: {
  displayName?: string;
  headline?: string;
  profileUrl: string;
}): SocialConnectionSnapshot {
  const profileUrl = normalizeLinkedInProfileUrl(input.profileUrl);
  const handle = extractLinkedInHandle(profileUrl);
  const headline = input.headline?.trim() || "Public LinkedIn profile connected to your CodeOrbit profile.";
  const displayName = input.displayName?.trim() || null;

  return {
    avatarUrl: null,
    displayName,
    handle,
    headline,
    metadata: {
      source: "linkedin-public-profile",
    } satisfies Prisma.JsonObject,
    profileUrl,
    provider: LINKEDIN_PROVIDER,
    syncedProjects: [],
  };
}

export function buildLinkedInConnectionFromClerk(
  account: ClerkExternalAccountSnapshot,
  existingProfileUrl?: string | null,
): SocialConnectionSnapshot {
  const displayName = buildDisplayNameFromClerkAccount(account);

  return {
    avatarUrl: account.imageUrl || null,
    displayName,
    handle: account.username?.trim() || account.providerUserId,
    headline: "LinkedIn account imported from your Clerk social connection.",
    metadata: {
      email: account.emailAddress || null,
      provider: account.provider,
      source: "clerk-oauth-linkedin",
    } satisfies Prisma.JsonObject,
    profileUrl: guessLinkedInProfileUrl(account, existingProfileUrl),
    provider: LINKEDIN_PROVIDER,
    syncedProjects: [],
  };
}

export async function syncLinkedInConnectionFromClerk(params: {
  accessToken?: string | null;
  account: ClerkExternalAccountSnapshot;
  existingProfileUrl?: string | null;
}): Promise<SocialConnectionSnapshot> {
  if (!params.accessToken) {
    return buildLinkedInConnectionFromClerk(params.account, params.existingProfileUrl);
  }

  const response = await fetch(LINKEDIN_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
    },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error("LinkedIn OAuth import failed. Please reconnect LinkedIn in Clerk and try again.");
  }

  const profile = (await response.json()) as LinkedInUserInfoResponse;
  const displayName =
    profile.name ||
    [profile.given_name, profile.family_name].filter(Boolean).join(" ").trim() ||
    buildDisplayNameFromClerkAccount(params.account);

  return {
    avatarUrl: profile.picture || params.account.imageUrl || null,
    displayName,
    handle: params.account.username?.trim() || profile.sub,
    headline: "LinkedIn identity imported through Clerk OAuth.",
    metadata: {
      clerkEmail: params.account.emailAddress || null,
      email: profile.email || params.account.emailAddress || null,
      emailVerified: profile.email_verified ?? null,
      locale: normalizeLocale(profile.locale),
      provider: params.account.provider,
      source: "clerk-oauth-linkedin",
    } satisfies Prisma.JsonObject,
    profileUrl: guessLinkedInProfileUrl(params.account, params.existingProfileUrl),
    provider: LINKEDIN_PROVIDER,
    syncedProjects: [],
  };
}

export function shouldRefreshGitHubConnection(
  connection: Pick<UserSocialConnection, "lastSyncedAt" | "provider">,
) {
  if (connection.provider !== GITHUB_PROVIDER) {
    return false;
  }

  if (!connection.lastSyncedAt) {
    return true;
  }

  return Date.now() - connection.lastSyncedAt.getTime() > GITHUB_REFRESH_WINDOW_MS;
}

export async function refreshStoredGitHubConnection(
  connection: Pick<UserSocialConnection, "handle" | "profileUrl">,
) {
  return syncGitHubConnection(connection.handle || connection.profileUrl);
}
