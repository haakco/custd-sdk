// SiteDomainAdminClient claims, verifies, audits and checks the domains a Site
// serves, and reads their findings, outages, alert address and search numbers.
// The routes live on the top-level /api/v1/site-domains surface, not under
// /api/v1/admin. A system administrator names the tenant with `companySlug`;
// a site-bound credential (site_domains.manage) reaches its own Site only.

import type {
  SiteAuditDelta,
  SiteAuditPageList,
  SiteLighthousePages,
  SiteLighthouseRequestOptions,
} from "./admin-site-audit-pages.js";
import type {
  IndexNowState,
  IndexNowSubmission,
  IndexNowSubmissionRequest,
  SiteLighthouseHistory,
  SitePageCheckRequest,
  SitePageCheckResponse,
  SitePageFacts,
  SitePageRecheck,
  SiteProjectContext,
  SiteProjectContextRequest,
  SiteRemedy,
  SiteReport,
  SiteReportShareCreated,
  SiteReportShareList,
  SiteReportShareRequest,
  SiteRobotsTestRequest,
  SiteRobotsTestResponse,
  SiteSearchInspection,
  SiteSearchInspectionList,
  SiteSearchRowPage,
  SiteSearchRowsQuery,
  SiteUptimeHistory,
} from "./admin-site-insights.js";
import type {
  SiteRankings,
  SiteTrackedKeyword,
  SiteTrackedKeywordUpdate,
  SiteTrackKeywordRequest,
} from "./admin-site-rankings.js";
import type {
  SavedSiteReport,
  SavedSiteReportList,
  SavedSiteReportRequest,
  SiteReportRequestOptions,
} from "./admin-site-saved-reports.js";
import type { AccessLogHourReplay, SiteAIVisibility, SiteTraffic } from "./admin-site-traffic.js";
import type {
  SiteContentGap,
  SiteKeywordClusters,
  SiteKeywordList,
  SiteKeywordListRequest,
  SiteKeywordLists,
  SiteTopicTrends,
  SiteWebDomains,
  SiteWebPages,
  SiteWebPagesQuery,
} from "./admin-site-web-data.js";
import type { RequestOptions } from "./index.js";

/** A 409 on requestAudit: the tenant has not proven control of the domain yet. */
export const SITE_DOMAIN_NOT_VERIFIED_CODE = "site_domain_not_verified";
/** A 409 on connectSearch: this Custd deployment has no account or key for the provider. */
export const SITE_SEARCH_NOT_CONFIGURED_CODE = "site_search_not_configured";
/** A 404 on disconnectSearch: the domain is not connected to that provider. */
export const SITE_SEARCH_CONNECTION_NOT_FOUND_CODE = "site_search_connection_not_found";

/**
 * The stable rule IDs a SiteFinding carries in `rule`, from Custd's siteaudit
 * rule catalogue. Key a client-side fix or display on these, never on the title.
 * New rules can appear in findings before an SDK release names them.
 */
export const SiteRule = {
  PageStatus: "crawl.page-status",
  RedirectChain: "crawl.redirect-chain",
  Soft404: "crawl.soft-404",
  HTTPSRedirect: "host.https-redirect",
  CanonicalHost: "host.canonical-host",
  RobotsMissing: "robots.missing",
  RobotsInvalid: "robots.invalid",
  RobotsNoSitemap: "robots.no-sitemap",
  SitemapMissing: "sitemap.missing",
  SitemapInvalid: "sitemap.invalid",
  SitemapURLStatus: "sitemap.url-not-ok",
  SitemapNoindex: "sitemap.noindex-url",
  SitemapLastmod: "sitemap.lastmod-missing",
  CanonicalMissing: "canonical.missing",
  CanonicalInvalid: "canonical.invalid",
  CanonicalNotOK: "canonical.not-ok",
  TitleMissing: "title.missing",
  TitleLength: "title.length",
  TitleDuplicate: "title.duplicate",
  DescMissing: "description.missing",
  DescLength: "description.length",
  DescDuplicate: "description.duplicate",
  HeadingH1: "heading.h1",
  LangMissing: "html.lang-missing",
  HTMLTooLarge: "html.too-large",
  OpenGraphMissing: "og.missing",
  OpenGraphImageMissing: "og.image-missing",
  TwitterCardMissing: "twitter.card-missing",
  ImageAltMissing: "image.alt-missing",
  ImageTooLarge: "image.too-large",
  ImageLegacyFormat: "image.legacy-format",
  ImageDimensions: "image.missing-dimensions",
  ImageNotLazy: "image.not-lazy",
  NoCompression: "http.no-compression",
  StaticCache: "cache.static-assets",
  JSRequired: "ai.js-required",
  AnswerBotBlocked: "ai.answer-bot-blocked",
  TrainingBlocked: "ai.training-bot-blocked",
  BotRefused: "ai.bot-refused",
  JSONLDMissing: "jsonld.missing",
  JSONLDInvalid: "jsonld.invalid",
  JSONLDNoEntity: "jsonld.no-entity",
  LLMSMissing: "llms.missing",
  LLMSInvalid: "llms.invalid",
  RedirectLoop: "crawl.redirect-loop",
  OrphanPage: "crawl.orphan-page",
  DeepPage: "crawl.deep-page",
  NoInternalLinks: "crawl.no-internal-links",
  NoindexPage: "crawl.noindex-page",
  HomeNoindex: "crawl.home-noindex",
  NofollowPage: "robots.nofollow",
  CanonicalElsewhere: "canonical.points-elsewhere",
  CanonicalConflict: "canonical.conflict",
  HeadingSkip: "heading.order-skip",
  ThinContent: "content.thin",
  DuplicateContent: "content.duplicate",
  HreflangInvalidCode: "hreflang.invalid-code",
  HreflangMissingSelf: "hreflang.missing-self-reference",
  HreflangMissingReturn: "hreflang.missing-return-link",
  HreflangMissingXDefault: "hreflang.missing-x-default",
  HreflangTargetNotIndexable: "hreflang.target-not-indexable",
  SlowResponse: "http.slow-response",
  UptimeDown: "uptime.down",
  UptimeSlow: "uptime.slow",
  TLSInvalid: "tls.invalid",
  TLSExpiring: "tls.expiring",
  TLSExpiringSoon: "tls.expiring-soon",
  LighthouseDesktopDrop: "lighthouse.desktop-score-drop",
  LighthouseMobileDrop: "lighthouse.mobile-score-drop",
  SearchLowCTR: "search.low-ctr",
  SearchPositionDrop: "search.position-drop",
  BrokenFragment: "crawl.broken-fragment",
  SitemapBlockedURL: "sitemap.blocked-url",
  LogsCrawlerNotFound: "logs.crawler-not-found",
} as const;

export type SiteRuleId = (typeof SiteRule)[keyof typeof SiteRule];

/** Per-call options. `companySlug` names the tenant when a system administrator acts for one. */
export type SiteDomainRequestOptions = RequestOptions & { companySlug?: string };

export type SiteDomainCreateRequest = {
  /** The Site the host belongs to; a site-bound credential may omit it. */
  siteUuid?: string;
  host: string;
};

/** How to prove control: publish either the DNS TXT record or the well-known file. */
export type SiteDomainVerification = {
  dnsRecordName: string;
  dnsRecordValue: string;
  fileUrl: string;
  fileContent: string;
};

export type SiteDomainVerifiedBy = "dns" | "file" | "attested" | "parent" | "operator";

/** The credential that vouched for a domain, and when. */
export type SiteDomainAttestation = {
  clientId: string;
  attestedAt: string;
};

export type SiteDomainOwnership = {
  verified: boolean;
  verifiedAt?: string;
  verifiedBy?: SiteDomainVerifiedBy;
  lastCheckedAt?: string;
  lastCheckFailure?: string;
  instructions: SiteDomainVerification;
  /** The parent domain whose verification covers this one; set only when verifiedBy is "parent". */
  verifiedViaDomainUuid?: string;
  attestation?: SiteDomainAttestation;
};

/** One audit run's findings counted by severity. */
export type SiteAuditSummary = {
  high: number;
  medium: number;
  low: number;
  info: number;
  pagesChecked: number;
  requests: number;
  truncated: boolean;
};

export type SiteDomainAudit = {
  requestedAt?: string;
  lastAuditedAt?: string;
  lastSummary?: SiteAuditSummary;
  lastFailure?: string;
};

/**
 * paused sends no requests; uptime (the default) checks the home page every
 * five minutes and the certificate every six hours; warm adds one anonymous
 * home page GET every minute.
 */
export type SiteCheckMode = "paused" | "uptime" | "warm";

/** failing is one failed check; down is an open incident (two or more in a row). */
export type SiteUptimeStatus = "unknown" | "up" | "failing" | "down" | "paused";

export type SiteUptime = {
  status: SiteUptimeStatus;
  lastCheckedAt?: string;
  statusCode?: number;
  responseMs?: number;
  lastFailure?: string;
  consecutiveFailures: number;
};

export type SiteTLS = {
  lastCheckedAt?: string;
  validTo?: string;
  issuer?: string;
  lastFailure?: string;
};

/** Average home page response time with warming off and on; each is absent until measured. */
export type SiteWarming = {
  lastWarmedAt?: string;
  unwarmedResponseMs?: number;
  warmedResponseMs?: number;
};

/** One outage, from the first failed check to the first passing one. resolvedAt is absent while open. */
export type SiteIncident = {
  incidentUuid: string;
  startedAt: string;
  openedAt: string;
  resolvedAt?: string;
  cause: string;
  failedChecks: number;
};

export type SiteIncidentList = {
  incidents: SiteIncident[];
};

export type SiteDomainChecks = {
  mode: SiteCheckMode;
  uptime: SiteUptime;
  tls: SiteTLS;
  warming: SiteWarming;
  openIncident?: SiteIncident;
};

/** A host a Site has claimed. Only a verified domain is audited or checked. */
export type SiteDomain = {
  domainUuid: string;
  siteUuid: string;
  host: string;
  ownership: SiteDomainOwnership;
  audit: SiteDomainAudit;
  checks: SiteDomainChecks;
  createdAt: string;
};

export type SiteDomainList = {
  domains: SiteDomain[];
};

export type SiteFindingState = "open" | "fixed" | "all";

export type SiteFindingSeverity = "high" | "medium" | "low" | "info";

export type SiteFindingHistory = {
  firstSeenAt: string;
  lastSeenAt: string;
  fixed: boolean;
  fixedAt?: string;
};

/** One problem found on a verified domain, with the advice to fix it. `rule` is a SiteRule ID. */
export type SiteFinding = {
  findingUuid: string;
  rule: string;
  severity: SiteFindingSeverity;
  title: string;
  url: string;
  evidence: string;
  fix: string;
  source: string;
  remedy: SiteRemedy;
  history: SiteFindingHistory;
};

/** A domain's findings, most severe first. */
export type SiteFindingList = {
  findings: SiteFinding[];
};

/** Where one Site's alerts go. An absent emailRecipient means the tenant's own alert destinations. */
export type SiteAlertDestination = {
  siteUuid: string;
  emailRecipient?: string;
};

export type SiteAlertDestinationRequest = {
  /** A site-bound credential may omit it for its own Site. */
  siteUuid?: string;
  /** An empty string sends the Site's alerts to the tenant's destinations again. */
  emailRecipient: string;
};

export type SiteSearchProvider = "google" | "bing";

export type SiteSearchConnectionStatus = "pending" | "active" | "failing" | "revoked";

/** Which providers this deployment imports from, and the Google account to add to a property. */
export type SiteSearchAccount = {
  googleConfigured: boolean;
  googleServiceAccountEmail?: string;
  bingConfigured: boolean;
};

/**
 * property is "sc-domain:example.com" or a URL prefix ending in "/" for Google,
 * and a URL prefix ending in "/" for Bing. apiKey is Bing only and write-only.
 */
export type SiteSearchConnectionRequest = {
  property: string;
  apiKey?: string;
};

export type SiteSearchConnection = {
  provider: SiteSearchProvider;
  property: string;
  status: SiteSearchConnectionStatus;
  /** The last day imported, YYYY-MM-DD. */
  importedThrough?: string;
  lastImportedAt?: string;
  lastFailure?: string;
};

/** Summed search numbers. ctr is 0..1; position is absent when unknown. */
export type SiteSearchTotals = {
  clicks: number;
  impressions: number;
  ctr: number;
  position?: number;
};

export type SiteSearchDay = {
  day: string;
  clicks: number;
  impressions: number;
};

export type SiteSearchSource = {
  provider: SiteSearchProvider;
  source: string;
  granularity: "daily" | "weekly";
  from?: string;
  to?: string;
  /** Days with data inside the window. */
  days: number;
  importedAt?: string;
  totals: SiteSearchTotals;
  /** Totals for the same number of days before the window, if any. */
  previous?: SiteSearchTotals;
  /** Each imported day's totals, oldest first; Bing's are week buckets. */
  daily: SiteSearchDay[];
};

/** One page URL or query text and its totals. */
export type SiteSearchRow = {
  provider: SiteSearchProvider;
  key: string;
  totals: SiteSearchTotals;
};

export type SiteSearchPerformance = {
  domainUuid: string;
  days: number;
  connections: SiteSearchConnection[];
  sources: SiteSearchSource[];
  topPages: SiteSearchRow[];
  topQueries: SiteSearchRow[];
  strikingDistance: SiteSearchRow[];
};

type NonAdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;

type QueryValues = Record<string, string | undefined>;

const siteDomainsPath = "/site-domains";
const keywordListsPath = `${siteDomainsPath}/keyword-lists`;

export class SiteDomainAdminClient {
  constructor(private readonly request: NonAdminRequester) {}

  /** Claims a host for a Site and returns the verification instructions. */
  create(body: SiteDomainCreateRequest, options?: SiteDomainRequestOptions): Promise<SiteDomain> {
    return this.send("POST", siteDomainsPath, {}, body, options);
  }

  /** Lists one Site's domains. A site-bound credential may omit siteUuid for its own Site. */
  list(siteUuid?: string, options?: SiteDomainRequestOptions): Promise<SiteDomainList> {
    return this.send("GET", siteDomainsPath, { siteUuid }, undefined, options);
  }

  get(domainUuid: string, options?: SiteDomainRequestOptions): Promise<SiteDomain> {
    return this.send("GET", domainPath(domainUuid), {}, undefined, options);
  }

  /**
   * Checks the DNS record or well-known file now. An unproven domain comes back
   * with ownership.verified false and the reason in ownership.lastCheckFailure.
   */
  verify(domainUuid: string, options?: SiteDomainRequestOptions): Promise<SiteDomain> {
    return this.send("POST", `${domainPath(domainUuid)}/verify`, {}, undefined, options);
  }

  /**
   * Attests that this credential has proven the tenant controls the domain,
   * which verifies it (verifiedBy "attested") and its subdomains. Only a
   * site-bound credential holding site_domains.attest may attest its own Site's domains.
   */
  attest(domainUuid: string, options?: RequestOptions): Promise<SiteDomain> {
    return this.send("POST", `${domainPath(domainUuid)}/attestation`, {}, undefined, options);
  }

  /** Withdraws this credential's attestation; the domain stays verified only by its own proof or a verified parent. */
  unattest(domainUuid: string, options?: RequestOptions): Promise<SiteDomain> {
    return this.send("DELETE", `${domainPath(domainUuid)}/attestation`, {}, undefined, options);
  }

  /** Queues an audit for the scheduler's next tick. An unverified domain is refused with SITE_DOMAIN_NOT_VERIFIED_CODE. */
  requestAudit(domainUuid: string, options?: SiteDomainRequestOptions): Promise<SiteDomain> {
    return this.send("POST", `${domainPath(domainUuid)}/audit`, {}, undefined, options);
  }

  /** Lists a domain's findings, most severe first. An omitted state lets the server default to open. */
  listFindings(
    domainUuid: string,
    state?: SiteFindingState,
    options?: SiteDomainRequestOptions,
  ): Promise<SiteFindingList> {
    return this.send("GET", `${domainPath(domainUuid)}/findings`, { state }, undefined, options);
  }

  /** Removes a domain and its findings. */
  delete(domainUuid: string, options?: SiteDomainRequestOptions): Promise<void> {
    return this.send("DELETE", domainPath(domainUuid), {}, undefined, options);
  }

  /** Chooses how a domain is checked. It works before verification, so a domain can be paused before its first check. */
  setCheckMode(domainUuid: string, mode: SiteCheckMode, options?: SiteDomainRequestOptions): Promise<SiteDomain> {
    return this.send("PUT", `${domainPath(domainUuid)}/checks`, {}, { mode }, options);
  }

  /** Lists a domain's recent outages, newest first (at most twenty). */
  listIncidents(domainUuid: string, options?: SiteDomainRequestOptions): Promise<SiteIncidentList> {
    return this.send("GET", `${domainPath(domainUuid)}/incidents`, {}, undefined, options);
  }

  /** Reads a Site's alert address. A site-bound credential may omit siteUuid. */
  getAlertDestination(siteUuid?: string, options?: SiteDomainRequestOptions): Promise<SiteAlertDestination> {
    return this.send("GET", `${siteDomainsPath}/alert-destination`, { siteUuid }, undefined, options);
  }

  /** Emails a Site's alerts to emailRecipient, or back to the tenant's destinations when it is empty. */
  setAlertDestination(
    body: SiteAlertDestinationRequest,
    options?: SiteDomainRequestOptions,
  ): Promise<SiteAlertDestination> {
    return this.send(
      "PUT",
      `${siteDomainsPath}/alert-destination`,
      { siteUuid: body.siteUuid },
      { emailRecipient: body.emailRecipient },
      options,
    );
  }

  /** Reads which search providers this Custd deployment can import from. */
  getSearchAccount(options?: SiteDomainRequestOptions): Promise<SiteSearchAccount> {
    return this.send("GET", `${siteDomainsPath}/search-account`, {}, undefined, options);
  }

  /** Reads a domain's search numbers over the last `days` days (1..90); omitted, the server uses 28. */
  getSearchPerformance(
    domainUuid: string,
    days?: number,
    options?: SiteDomainRequestOptions,
  ): Promise<SiteSearchPerformance> {
    return this.send("GET", `${domainPath(domainUuid)}/search`, { days: days?.toString() }, undefined, options);
  }

  /** Connects a domain to a provider, or replaces its property or key. Refused with SITE_SEARCH_NOT_CONFIGURED_CODE when the deployment lacks the provider. */
  connectSearch(
    domainUuid: string,
    provider: SiteSearchProvider,
    body: SiteSearchConnectionRequest,
    options?: SiteDomainRequestOptions,
  ): Promise<SiteSearchConnection> {
    return this.send("PUT", searchConnectionPath(domainUuid, provider), {}, body, options);
  }

  /** Removes a provider connection and the numbers imported through it. */
  disconnectSearch(
    domainUuid: string,
    provider: SiteSearchProvider,
    options?: SiteDomainRequestOptions,
  ): Promise<void> {
    return this.send("DELETE", searchConnectionPath(domainUuid, provider), {}, undefined, options);
  }

  /** Reads what the latest audit or recheck read from one page of the domain. */
  getPageFacts(domainUuid: string, url: string, options?: SiteDomainRequestOptions): Promise<SitePageFacts> {
    return this.send("GET", `${domainPath(domainUuid)}/page-facts`, { url }, undefined, options);
  }

  /**
   * Queues one page of a verified domain for recheck (202). A page already queued comes back as it is;
   * past the hourly allowance the server refuses with SITE_PAGE_RECHECK_LIMIT_CODE, and a page of
   * another host with SITE_PAGE_NOT_ON_DOMAIN_CODE.
   */
  requestPageRecheck(domainUuid: string, url: string, options?: SiteDomainRequestOptions): Promise<SitePageRecheck> {
    return this.send("POST", `${domainPath(domainUuid)}/page-rechecks`, {}, { url }, options);
  }

  getPageRecheck(
    domainUuid: string,
    recheckUuid: string,
    options?: SiteDomainRequestOptions,
  ): Promise<SitePageRecheck> {
    const path = `${domainPath(domainUuid)}/page-rechecks/${encodeURIComponent(recheckUuid)}`;
    return this.send("GET", path, {}, undefined, options);
  }

  /** Runs the one-page checks on draft HTML; nothing is fetched or stored. */
  checkPage(
    domainUuid: string,
    body: SitePageCheckRequest,
    options?: SiteDomainRequestOptions,
  ): Promise<SitePageCheckResponse> {
    return this.send("POST", `${domainPath(domainUuid)}/page-check`, {}, { url: body.url, html: body.html }, options);
  }

  /** Tests a URL against a pasted robots.txt, or the domain's live file when robotsTxt is omitted. */
  testRobots(
    domainUuid: string,
    body: SiteRobotsTestRequest,
    options?: SiteDomainRequestOptions,
  ): Promise<SiteRobotsTestResponse> {
    const request: SiteRobotsTestRequest = { url: body.url, userAgent: body.userAgent };
    if (body.robotsTxt !== undefined) request.robotsTxt = body.robotsTxt;
    return this.send("POST", `${domainPath(domainUuid)}/robots-test`, {}, request, options);
  }

  /** Pages through one dimension of the domain's imported search rows; `unavailable` names providers without it. */
  listSearchRows(
    domainUuid: string,
    query: SiteSearchRowsQuery = {},
    options?: SiteDomainRequestOptions,
  ): Promise<SiteSearchRowPage> {
    const values = {
      dimension: query.dimension,
      provider: query.provider,
      days: query.days?.toString(),
      offset: query.offset?.toString(),
      limit: query.limit?.toString(),
    };
    return this.send("GET", `${domainPath(domainUuid)}/search/rows`, values, undefined, options);
  }

  /** Lists the domain's latest URL inspections and the tenant's daily use. */
  listSearchInspections(domainUuid: string, options?: SiteDomainRequestOptions): Promise<SiteSearchInspectionList> {
    return this.send("GET", `${domainPath(domainUuid)}/search/inspections`, {}, undefined, options);
  }

  /**
   * Queues a Search Console URL Inspection (202). Refusals carry SITE_SEARCH_INSPECTION_URL_INVALID_CODE,
   * SITE_SEARCH_INSPECTION_NOT_CONNECTED_CODE or SITE_SEARCH_INSPECTION_LIMIT_CODE.
   */
  requestSearchInspection(
    domainUuid: string,
    url: string,
    options?: SiteDomainRequestOptions,
  ): Promise<SiteSearchInspection> {
    return this.send("POST", `${domainPath(domainUuid)}/search/inspections`, {}, { url }, options);
  }

  /** Reads a Site's brands, competitors and markets. A site-bound credential may omit siteUuid. */
  getProjectContext(siteUuid?: string, options?: SiteDomainRequestOptions): Promise<SiteProjectContext> {
    return this.send("GET", `${siteDomainsPath}/project-context`, { siteUuid }, undefined, options);
  }

  /** Replaces a Site's project context; an omitted list is sent empty and clears it. */
  setProjectContext(body: SiteProjectContextRequest, options?: SiteDomainRequestOptions): Promise<SiteProjectContext> {
    const request = {
      brandNames: body.brandNames ?? [],
      competitorDomains: body.competitorDomains ?? [],
      markets: body.markets ?? [],
    };
    return this.send("PUT", `${siteDomainsPath}/project-context`, { siteUuid: body.siteUuid }, request, options);
  }

  /** Reads the client report without private verification or connection details, in options.template over options.days. */
  getReport(domainUuid: string, options?: SiteReportRequestOptions): Promise<SiteReport> {
    const { template, days, ...requestOptions } = options ?? {};
    const query = { template, days: days?.toString() };
    return this.send("GET", `${domainPath(domainUuid)}/report`, query, undefined, requestOptions);
  }

  /** Reads uptime windows, ninety daily bars and hourly response times over `responseDays` (1..90). */
  getUptimeHistory(
    domainUuid: string,
    responseDays?: number,
    options?: SiteDomainRequestOptions,
  ): Promise<SiteUptimeHistory> {
    const query = { responseDays: responseDays?.toString() };
    return this.send("GET", `${domainPath(domainUuid)}/uptime-history`, query, undefined, options);
  }

  /**
   * Reads scheduled desktop and mobile lab runs over `days` (1..30); omitted, the server uses seven.
   * options.url reads one extra page's runs instead of the home page's.
   */
  getLighthouseHistory(
    domainUuid: string,
    days?: number,
    options?: SiteLighthouseRequestOptions,
  ): Promise<SiteLighthouseHistory> {
    const { url, ...requestOptions } = options ?? {};
    const query = { days: days?.toString(), url };
    return this.send("GET", `${domainPath(domainUuid)}/lighthouse`, query, undefined, requestOptions);
  }

  /** Reads the extra pages Lighthouse measures beside the home page. */
  getLighthousePages(domainUuid: string, options?: SiteDomainRequestOptions): Promise<SiteLighthousePages> {
    return this.send("GET", `${domainPath(domainUuid)}/lighthouse/pages`, {}, undefined, options);
  }

  /** Replaces the extra pages (at most five); an empty list clears them. Refused with SITE_LIGHTHOUSE_PAGE_NOT_EXTRA_CODE. */
  setLighthousePages(
    domainUuid: string,
    urls: string[],
    options?: SiteDomainRequestOptions,
  ): Promise<SiteLighthousePages> {
    return this.send("PUT", `${domainPath(domainUuid)}/lighthouse/pages`, {}, { urls: [...urls] }, options);
  }

  /** Pages through the URLs the latest audit crawled; the server defaults limit to 50 (at most 200). */
  listAuditPages(
    domainUuid: string,
    offset?: number,
    limit?: number,
    options?: SiteDomainRequestOptions,
  ): Promise<SiteAuditPageList> {
    const query = { offset: offset?.toString(), limit: limit?.toString() };
    return this.send("GET", `${domainPath(domainUuid)}/audit-pages`, query, undefined, options);
  }

  /** Reads the findings the latest audit opened, reopened and fixed. */
  getAuditDelta(domainUuid: string, options?: SiteDomainRequestOptions): Promise<SiteAuditDelta> {
    return this.send("GET", `${domainPath(domainUuid)}/audit-delta`, {}, undefined, options);
  }

  /** Lists the domain's saved reports, newest content first. */
  listSavedReports(domainUuid: string, options?: SiteDomainRequestOptions): Promise<SavedSiteReportList> {
    return this.send("GET", savedReportsPath(domainUuid), {}, undefined, options);
  }

  /** Generates and saves a report. Refused with SAVED_SITE_REPORT_NAME_TAKEN_CODE or SAVED_SITE_REPORT_LIMIT_CODE. */
  saveReport(
    domainUuid: string,
    body: SavedSiteReportRequest,
    options?: SiteDomainRequestOptions,
  ): Promise<SavedSiteReport> {
    return this.send("POST", savedReportsPath(domainUuid), {}, savedReportBody(body), options);
  }

  getSavedReport(domainUuid: string, reportUuid: string, options?: SiteDomainRequestOptions): Promise<SavedSiteReport> {
    return this.send("GET", savedReportPath(domainUuid, reportUuid), {}, undefined, options);
  }

  /** Renames or regenerates a saved report; its shares open the new content. */
  replaceSavedReport(
    domainUuid: string,
    reportUuid: string,
    body: SavedSiteReportRequest,
    options?: SiteDomainRequestOptions,
  ): Promise<SavedSiteReport> {
    return this.send("PUT", savedReportPath(domainUuid, reportUuid), {}, savedReportBody(body), options);
  }

  /** Deletes a saved report. */
  deleteSavedReport(domainUuid: string, reportUuid: string, options?: SiteDomainRequestOptions): Promise<void> {
    return this.send("DELETE", savedReportPath(domainUuid, reportUuid), {}, undefined, options);
  }

  /** Lists live report shares. Tokens are returned only on creation. */
  listReportShares(domainUuid: string, options?: SiteDomainRequestOptions): Promise<SiteReportShareList> {
    return this.send("GET", `${domainPath(domainUuid)}/report-shares`, {}, undefined, options);
  }

  /** Creates a public report share. Copy the token once; creation is never retried automatically. */
  createReportShare(
    domainUuid: string,
    body: SiteReportShareRequest = {},
    options?: SiteDomainRequestOptions,
  ): Promise<SiteReportShareCreated> {
    const request: SiteReportShareRequest = { expiresInDays: body.expiresInDays ?? 30 };
    if (body.reportUuid) request.reportUuid = body.reportUuid;
    return this.send("POST", `${domainPath(domainUuid)}/report-shares`, {}, request, options);
  }

  /** Revokes a share; later public reads fail. */
  revokeReportShare(domainUuid: string, shareUuid: string, options?: SiteDomainRequestOptions): Promise<void> {
    const path = `${domainPath(domainUuid)}/report-shares/${encodeURIComponent(shareUuid)}`;
    return this.send("DELETE", path, {}, undefined, options);
  }

  /** Reads the domain's IndexNow setup, today's use and its recent submissions. */
  getIndexNow(domainUuid: string, options?: SiteDomainRequestOptions): Promise<IndexNowState> {
    return this.send("GET", indexNowPath(domainUuid), {}, undefined, options);
  }

  /** Enables IndexNow and returns the key to host at keyLocation. An unverified domain is refused with SITE_INDEXNOW_DOMAIN_UNVERIFIED_CODE. */
  enableIndexNow(domainUuid: string, options?: SiteDomainRequestOptions): Promise<IndexNowState> {
    return this.send("PUT", indexNowPath(domainUuid), {}, undefined, options);
  }

  /** Disables IndexNow for the domain. */
  disableIndexNow(domainUuid: string, options?: SiteDomainRequestOptions): Promise<void> {
    return this.send("DELETE", indexNowPath(domainUuid), {}, undefined, options);
  }

  /** Checks the hosted key file now. A failed check is not an error: it comes back in lastCheckFailure. */
  verifyIndexNowKey(domainUuid: string, options?: SiteDomainRequestOptions): Promise<IndexNowState> {
    return this.send("POST", `${indexNowPath(domainUuid)}/verify`, {}, undefined, options);
  }

  /**
   * Queues URLs for IndexNow (202). Refusals carry SITE_INDEXNOW_NOT_ENABLED_CODE,
   * SITE_INDEXNOW_KEY_UNVERIFIED_CODE, SITE_INDEXNOW_URLS_INVALID_CODE or SITE_INDEXNOW_LIMIT_CODE.
   */
  submitIndexNow(
    domainUuid: string,
    body: IndexNowSubmissionRequest,
    options?: SiteDomainRequestOptions,
  ): Promise<IndexNowSubmission> {
    return this.send("POST", `${indexNowPath(domainUuid)}/submissions`, {}, { urls: body.urls }, options);
  }

  /** Reads the Site's own and competitor domains and their inventory state. */
  getWebDomains(siteUuid?: string, options?: SiteDomainRequestOptions): Promise<SiteWebDomains> {
    return this.send("GET", `${siteDomainsPath}/web-domains`, { siteUuid }, undefined, options);
  }

  /** Pages through one inventoried domain's URLs; pass the previous page's `next` as `after`. */
  listWebPages(
    domain: string,
    query: SiteWebPagesQuery = {},
    options?: SiteDomainRequestOptions,
  ): Promise<SiteWebPages> {
    const values = { siteUuid: query.siteUuid, domain, after: query.after, limit: query.limit?.toString() };
    return this.send("GET", `${siteDomainsPath}/web-pages`, values, undefined, options);
  }

  /** Reads monthly Wikipedia interest in the Site's brands and seed term. */
  getTopicTrends(siteUuid?: string, options?: SiteDomainRequestOptions): Promise<SiteTopicTrends> {
    return this.send("GET", `${siteDomainsPath}/topic-trends`, { siteUuid }, undefined, options);
  }

  /** Reads the topics competitors cover and the Site does not, optionally around a seed term. */
  getContentGap(siteUuid?: string, seed?: string, options?: SiteDomainRequestOptions): Promise<SiteContentGap> {
    return this.send("GET", `${siteDomainsPath}/content-gap`, { siteUuid, seed }, undefined, options);
  }

  listKeywordLists(siteUuid?: string, options?: SiteDomainRequestOptions): Promise<SiteKeywordLists> {
    return this.send("GET", keywordListsPath, { siteUuid }, undefined, options);
  }

  /** Creates or replaces the named list. A new list past the limit is refused with SITE_KEYWORD_LIST_LIMIT_CODE. */
  saveKeywordList(
    body: SiteKeywordListRequest,
    siteUuid?: string,
    options?: SiteDomainRequestOptions,
  ): Promise<SiteKeywordList> {
    const request: SiteKeywordListRequest = { name: body.name, keywords: [...body.keywords] };
    if (body.seedTerm) request.seedTerm = body.seedTerm;
    return this.send("PUT", keywordListsPath, { siteUuid }, request, options);
  }

  /** Deletes the named list. An unknown name is refused with SITE_KEYWORD_LIST_NOT_FOUND_CODE. */
  deleteKeywordList(name: string, siteUuid?: string, options?: SiteDomainRequestOptions): Promise<void> {
    return this.send("DELETE", keywordListsPath, { siteUuid, name }, undefined, options);
  }

  /** Groups the named list's keywords by shared stem with the Site's own search numbers. */
  getKeywordClusters(
    name: string,
    siteUuid?: string,
    options?: SiteDomainRequestOptions,
  ): Promise<SiteKeywordClusters> {
    return this.send("GET", `${siteDomainsPath}/keyword-clusters`, { siteUuid, name }, undefined, options);
  }

  /** Reads the domain's access-log traffic over UTC days `from`..`to` (YYYY-MM-DD); omitted, the server picks them. */
  getTraffic(domainUuid: string, from?: string, to?: string, options?: SiteDomainRequestOptions): Promise<SiteTraffic> {
    return this.send("GET", `${domainPath(domainUuid)}/traffic`, { from, to }, undefined, options);
  }

  /** Reads AI crawler requests and AI-assistant referrals over UTC days `from`..`to`. */
  getAIVisibility(
    domainUuid: string,
    from?: string,
    to?: string,
    options?: SiteDomainRequestOptions,
  ): Promise<SiteAIVisibility> {
    return this.send("GET", `${domainPath(domainUuid)}/ai-visibility`, { from, to }, undefined, options);
  }

  /**
   * Has the access-log task read one UTC hour again (202). System administrators only; the route is
   * platform-wide. A bad hour is refused with ACCESS_LOG_HOUR_INVALID_CODE.
   */
  replayAccessLogHour(hourStart: Date | string, options?: RequestOptions): Promise<AccessLogHourReplay> {
    const body = { hourStart: typeof hourStart === "string" ? hourStart : utcSeconds(hourStart) };
    return this.send("POST", "/admin/access-log-hours/replay", {}, body, options);
  }

  /** Reads tracked keywords and each day's rank over `days` (1..90); omitted, the server uses 28. */
  getRankings(domainUuid: string, days?: number, options?: SiteDomainRequestOptions): Promise<SiteRankings> {
    return this.send("GET", `${domainPath(domainUuid)}/rankings`, { days: days?.toString() }, undefined, options);
  }

  /**
   * Starts tracking a keyword (201). Refusals carry SITE_TRACKED_KEYWORD_INVALID_CODE,
   * SITE_TRACKED_KEYWORD_LIMIT_CODE or SITE_TRACKED_KEYWORD_DUPLICATE_CODE.
   */
  trackKeyword(
    domainUuid: string,
    body: SiteTrackKeywordRequest,
    options?: SiteDomainRequestOptions,
  ): Promise<SiteTrackedKeyword> {
    const request: SiteTrackKeywordRequest = { keyword: body.keyword };
    if (body.country) request.country = body.country;
    if (body.device) request.device = body.device;
    if (body.notifyPosition !== undefined) request.notifyPosition = body.notifyPosition;
    return this.send("POST", rankingKeywordsPath(domainUuid), {}, request, options);
  }

  /** Pauses or resumes a keyword and sets its alert position. */
  updateTrackedKeyword(
    domainUuid: string,
    keywordUuid: string,
    body: SiteTrackedKeywordUpdate,
    options?: SiteDomainRequestOptions,
  ): Promise<SiteTrackedKeyword> {
    const request = { paused: body.paused, notifyPosition: body.notifyPosition };
    return this.send("PUT", rankingKeywordPath(domainUuid, keywordUuid), {}, request, options);
  }

  /** Stops tracking a keyword and removes its observations. */
  untrackKeyword(domainUuid: string, keywordUuid: string, options?: SiteDomainRequestOptions): Promise<void> {
    return this.send("DELETE", rankingKeywordPath(domainUuid, keywordUuid), {}, undefined, options);
  }

  private send<T>(
    method: string,
    path: string,
    query: QueryValues,
    body: unknown,
    options?: SiteDomainRequestOptions,
  ): Promise<T> {
    const { companySlug, ...requestOptions } = options ?? {};
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...query, companySlug })) {
      if (value) params.set(key, value);
    }
    const search = params.toString();
    return this.request(method, search ? `${path}?${search}` : path, body, requestOptions);
  }
}

function domainPath(domainUuid: string): string {
  return `${siteDomainsPath}/${encodeURIComponent(domainUuid)}`;
}

function savedReportsPath(domainUuid: string): string {
  return `${domainPath(domainUuid)}/saved-reports`;
}

function savedReportPath(domainUuid: string, reportUuid: string): string {
  return `${savedReportsPath(domainUuid)}/${encodeURIComponent(reportUuid)}`;
}

function savedReportBody(body: SavedSiteReportRequest): SavedSiteReportRequest {
  const request: SavedSiteReportRequest = { name: body.name };
  if (body.template) request.template = body.template;
  if (body.days !== undefined) request.days = body.days;
  return request;
}

function rankingKeywordsPath(domainUuid: string): string {
  return `${domainPath(domainUuid)}/rankings/keywords`;
}

function rankingKeywordPath(domainUuid: string, keywordUuid: string): string {
  return `${rankingKeywordsPath(domainUuid)}/${encodeURIComponent(keywordUuid)}`;
}

/** RFC 3339 UTC to the second, as the server documents hour starts. */
function utcSeconds(value: Date): string {
  return value.toISOString().replace(/\.\d{3}Z$/, "Z");
}

function indexNowPath(domainUuid: string): string {
  return `${domainPath(domainUuid)}/indexnow`;
}

function searchConnectionPath(domainUuid: string, provider: SiteSearchProvider): string {
  return `${domainPath(domainUuid)}/search/${encodeURIComponent(provider)}`;
}
