// A domain's traffic and AI visibility read from its web server access logs,
// and the platform operator's replay of one access-log hour.
// SiteDomainAdminClient sends them. A count Custd did not read is absent, never 0.

/** A 400 on replayAccessLogHour: hourStart must start a finished UTC hour within the last 28 days. */
export const ACCESS_LOG_HOUR_INVALID_CODE = "access_log_hour_invalid";

/** The key that collects the rows beyond each day's top rows. */
export const TRAFFIC_OTHER_KEY = "(other)";

/** How much of one day was read; newer values may appear. */
export const SiteTrafficDayCoverage = {
  Complete: "complete",
  Partial: "partial",
  Missing: "missing",
} as const;

/** Whether DNS confirmed a crawler or its User-Agent only claims to be it. */
export const SiteCrawlerIdentity = {
  Verified: "verified",
  ClaimsToBe: "claims_to_be",
} as const;

/** The kind of site that referred a request; newer values may appear. */
export const SiteReferrerClass = {
  Search: "search",
  AI: "ai",
  Social: "social",
  Other: "other",
} as const;

/** How a replayed hour stood before the replay; missing when it was never read. */
export const AccessLogHourStatus = {
  Done: "done",
  Partial: "partial",
  Failed: "failed",
  Missing: "missing",
} as const;

/** Hours of the range by how they were read; partial hours are a lower bound. */
export type SiteTrafficCoverage = {
  hoursExpected: number;
  hoursRead: number;
  hoursPartial: number;
  hoursFailed: number;
  hoursMissing: number;
  /** Every expected hour was read whole. */
  complete: boolean;
};

/** p95Ms is absent without a request. */
export type SiteTrafficTotals = {
  requests: number;
  bytes: number;
  notFound: number;
  p95Ms?: number;
};

/** One UTC day; requests, bytes and notFound are absent when nothing of the day was read. */
export type SiteTrafficDay = {
  date: string;
  /** A SiteTrafficDayCoverage value. */
  coverage: string;
  hoursRead: number;
  hoursPartial: number;
  hoursFailed: number;
  hoursMissing: number;
  requests?: number;
  bytes?: number;
  notFound?: number;
};

/** Requests for one key; TRAFFIC_OTHER_KEY collects the rest. */
export type SiteTrafficCount = {
  key: string;
  requests: number;
};

export type SiteTrafficSlowPath = {
  path: string;
  requests: number;
  p95Ms: number;
  maxMs: number;
};

export type SiteTrafficReferrerClass = {
  /** A SiteReferrerClass value. */
  class: string;
  requests: number;
};

export type SiteTrafficReferrer = {
  /** A SiteReferrerClass value. */
  class: string;
  domain: string;
  requests: number;
};

export type SiteTrafficCrawler = {
  /** A crawler slug such as googlebot or gptbot. */
  crawler: string;
  /** A SiteCrawlerIdentity value. */
  identity: string;
  /** The crawler fetches pages for an AI assistant or its training. */
  ai: boolean;
  requests: number;
  notFound: number;
};

/** totals is absent when no hour of the range was read. */
export type SiteTraffic = {
  domainUuid: string;
  from: string;
  to: string;
  generatedAt: string;
  coverage: SiteTrafficCoverage;
  totals?: SiteTrafficTotals;
  /** Every day of the range, oldest first. */
  days: SiteTrafficDay[];
  statusClasses: SiteTrafficCount[];
  notFoundPaths: SiteTrafficCount[];
  slowPaths: SiteTrafficSlowPath[];
  countries: SiteTrafficCount[];
  referrerClasses: SiteTrafficReferrerClass[];
  referrers: SiteTrafficReferrer[];
  crawlers: SiteTrafficCrawler[];
};

export type SiteAIPage = {
  /** TRAFFIC_OTHER_KEY collects the pages beyond each day's top rows. */
  path: string;
  verifiedCrawlerHits: number;
  claimedCrawlerHits: number;
  referralVisits: number;
};

export type SiteAIVisibility = {
  domainUuid: string;
  siteUuid: string;
  from: string;
  to: string;
  generatedAt: string;
  coverage: SiteTrafficCoverage;
  crawlers: SiteTrafficCrawler[];
  /** Referral visits by AI-assistant domain. */
  assistants: SiteTrafficCount[];
  pages: SiteAIPage[];
  /** The latest provider answer sample, independent of the date range. */
  answerSample?: SiteAIAnswerSample;
};

export type SiteAIAnswerSample = {
  product: "hosting" | "custd" | "cb" | "awthy";
  answer?: string;
  observedAt: string;
};

export type AccessLogHourReplay = {
  hourStart: string;
  /** An AccessLogHourStatus value. */
  previousStatus: string;
  requestedAt: string;
};
