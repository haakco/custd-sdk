// What search did around a fixed finding, and which search landing pages lead
// to a Site's goals. SiteDomainAdminClient sends them. A number Custd could
// not measure is absent, never 0.

import type { SiteSearchProvider, SiteSearchTotals } from "./admin-site-domains.js";

/** getFindingSearchImpact compares this many days before and after the fix when days is omitted. */
export const SITE_FINDING_IMPACT_DEFAULT_DAYS = 28;
export const SITE_FINDING_IMPACT_MIN_DAYS = 7;
export const SITE_FINDING_IMPACT_MAX_DAYS = 90;
/** getSearchValue reads this many days when days is omitted. */
export const SITE_SEARCH_VALUE_DEFAULT_DAYS = 28;
export const SITE_SEARCH_VALUE_MAX_DAYS = 90;
/** The most goal event types one getSearchValue call names. */
export const SITE_SEARCH_VALUE_MAX_GOALS = 5;
/** The most pages a search value read returns. */
export const SITE_SEARCH_VALUE_MAX_PAGES = 50;

/**
 * Whether a finding's impact could be measured. A source and each of its periods
 * are measured or insufficient; the impact itself is open while the finding is.
 */
export const SiteFindingImpactStatus = {
  Open: "open",
  Measured: "measured",
  Insufficient: "insufficient",
} as const;

export type SiteFindingImpactStatus = (typeof SiteFindingImpactStatus)[keyof typeof SiteFindingImpactStatus];

/** How much of the goal data could be read. */
export const SiteSearchGoalStatus = {
  Measured: "measured",
  Partial: "partial",
  Unavailable: "unavailable",
} as const;

export type SiteSearchGoalStatus = (typeof SiteSearchGoalStatus)[keyof typeof SiteSearchGoalStatus];

/** UTC days, YYYY-MM-DD. */
export type SiteFindingImpactWindow = {
  from: string;
  to: string;
};

/** One side of the comparison. clicks, impressions and ctr are absent while insufficient. */
export type SiteFindingImpactPeriod = {
  /** A SiteFindingImpactStatus value: measured or insufficient. */
  status: string;
  coveredDays: number;
  expectedDays: number;
  reason?: string;
  clicks?: number;
  impressions?: number;
  ctr?: number;
};

export type SiteFindingImpactSource = {
  provider: SiteSearchProvider;
  source: string;
  /** daily or weekly. */
  granularity: "daily" | "weekly";
  /** A SiteFindingImpactStatus value: measured or insufficient. */
  status: "measured" | "insufficient";
  before: SiteFindingImpactPeriod;
  after: SiteFindingImpactPeriod;
};

/** The finding's page in search before and after it was fixed. An observation, not a measured effect of the fix. */
export type SiteFindingImpact = {
  findingUuid: string;
  rule: string;
  url: string;
  /** The finding's URL without its fragment, as search providers report it. */
  pageUrl: string;
  /** A SiteFindingImpactStatus value. */
  status: SiteFindingImpactStatus;
  /** Absent while the finding is open, as are before and after. */
  fixedAt?: string;
  windowDays: number;
  before?: SiteFindingImpactWindow;
  after?: SiteFindingImpactWindow;
  sources: SiteFindingImpactSource[];
  note: string;
};

/** landings and goalConversions are absent when goals could not be matched to the page. */
export type SiteSearchValuePage = {
  provider: SiteSearchProvider;
  source: string;
  pageUrl: string;
  path: string;
  search: SiteSearchTotals;
  landings?: number;
  goalConversions?: number;
};

export type SiteSearchValue = {
  domainUuid: string;
  siteUuid: string;
  days: number;
  from: string;
  to: string;
  /** The goal event types the read named. */
  goals: string[];
  /** A SiteSearchGoalStatus value. */
  goalStatus: SiteSearchGoalStatus;
  goalReason?: string;
  /** How goals are credited to pages; show it beside the numbers. */
  attribution: string;
  pages: SiteSearchValuePage[];
};
