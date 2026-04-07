export type PracticePlatform = "geeksforgeeks" | "hackerrank" | "leetcode" | string;

export type PracticeDifficulty = "Easy" | "Medium" | "Hard";

export interface PracticePlatformInfo {
  displayName: string;
  fallbackLabel: string;
  iconSrc: string | null;
  slug: string;
}

export interface PracticeQuestionLinkRecord {
  platform: PracticePlatform;
  title: string;
  external_url: string;
  difficulty: string | null;
  topic: string | null;
  subtopic: string | null;
  language: string | null;
  source_count: number | null;
  company_count: number | null;
  companies: string | null;
  time_buckets: string | null;
  source_repos: string | null;
  leetcode_frequency_max: number | null;
  leetcode_acceptance_rate_avg: number | null;
  canonical_slug: string;
}

export interface PracticeQuestionLink {
  canonicalSlug: string;
  companies: string[];
  difficulty: PracticeDifficulty | null;
  externalUrl: string;
  language: string | null;
  platform: PracticePlatformInfo;
  sourceCount: number | null;
  sourceRepos: string[];
  subtopic: string | null;
  timeBuckets: string[];
  title: string;
  topic: string | null;
}

export interface PracticeQuestionSummary {
  difficulty: PracticeDifficulty | null;
  linkCount: number;
  platforms: PracticePlatformInfo[];
  primaryTopic: string | null;
  slug: string;
  title: string;
  topics: string[];
}

export interface PracticeQuestionDetail extends PracticeQuestionSummary {
  links: PracticeQuestionLink[];
}

export interface PracticeCatalogFilters {
  difficulties: PracticeDifficulty[];
  platforms: PracticePlatformInfo[];
  topics: string[];
}

export interface PracticeCatalogListResponse {
  data?: unknown[];
  filters: PracticeCatalogFilters;
  meta?: {
    timestamp: string;
    total: number;
  };
  nextCursor?: string | null;
  questions: PracticeQuestionSummary[];
  total: number;
}

export interface PracticeCatalogDetailResponse {
  question: PracticeQuestionDetail | null;
}

export interface PracticeCatalogQuery {
  difficulty?: string | null;
  platform?: string | null;
  search?: string | null;
  topic?: string | null;
}
