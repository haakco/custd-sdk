// What to do next: one domain's status and its most important actions, and the
// tenant's portfolio of domains, worst first. Custd ranks them once, in a fixed
// order that never depends on AI, so every product shows the same first action.
// SiteDomainAdminClient sends the calls. A site-bound credential reads only its
// own Site; a site_insights.read credential reads these two calls for every Site
// and nothing else.

/** A next-actions read returns at most this many actions. */
export const SITE_NEXT_ACTIONS_MAX = 3;

/**
 * The kinds of SiteNextAction, in the order Custd ranks them. Custd may add kinds;
 * show one this SDK does not name by its title and why.
 */
export const SiteNextActionKind = {
  Verify: "verify",
  Outage: "outage",
  Certificate: "certificate",
  ReconnectSearch: "reconnect-search",
  Finding: "finding",
  FirstAuditPending: "first-audit-pending",
  ConnectSearch: "connect-search",
} as const;

/** Where an action is done. Custd may add places. */
export const SiteNextActionPlace = {
  Ownership: "ownership",
  Uptime: "uptime",
  SearchSettings: "search-settings",
  Audit: "audit",
  Finding: "finding",
  Page: "page",
} as const;

/** What Custd cannot check yet. */
export const SiteNotChecked = {
  Uptime: "uptime",
  Audit: "audit",
  Search: "search",
} as const;

export type SiteNextActionTarget = {
  /** A SiteNextActionPlace value. */
  place: string;
  /** A finding action's first finding. */
  findingUuid?: string;
  /** A finding action's first page; opens Page detail when place is page. */
  pageUrl?: string;
};

export type SiteNextAction = {
  /** A SiteNextActionKind value. */
  kind: string;
  title: string;
  why: string;
  /** high, medium, low or info. */
  severity: string;
  /** The pages a finding affects; 0 for an action about the whole site. */
  affectedCount: number;
  /** The rule of a finding action. */
  rule?: string;
  target: SiteNextActionTarget;
  /** Check again (Verify now, or a one-page recheck) can confirm the fix at once. */
  recheckable: boolean;
};

export type SiteNextActions = {
  domainUuid: string;
  host: string;
  /** unknown, up, failing, down or paused. */
  status: string;
  /** One plain sentence: whether the site works and how much is left to do. */
  headline: string;
  /** The latest uptime check. */
  checkedAt?: string;
  /** SiteNotChecked values. */
  notChecked: string[];
  /** Every action the domain has; at most SITE_NEXT_ACTIONS_MAX are in actions. */
  actionCount: number;
  /** Most important first. */
  actions: SiteNextAction[];
};

export type SiteFindingCounts = {
  high: number;
  medium: number;
  low: number;
  info: number;
};

export type SitePortfolioDomain = {
  domainUuid: string;
  siteUuid: string;
  host: string;
  status: string;
  headline: string;
  checkedAt?: string;
  actionCount: number;
  openFindings: SiteFindingCounts;
  /** Absent when there is nothing to do. */
  firstAction?: SiteNextAction;
};

export type SitePortfolioSummary = {
  /** Worst first: by the first action's rank, then by host. */
  domains: SitePortfolioDomain[];
};
