// SiteDomainAdminClient claims, verifies, audits and checks the domains a Site
// serves, and reads their findings, outages, alert address and search numbers.
// The routes live on the top-level /api/v1/site-domains surface, not under
// /api/v1/admin. A system administrator names the tenant with `companySlug`;
// a site-bound credential (site_domains.manage) reaches its own Site only.

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
  CanonicalElsewhere: "canonical.points-elsewhere",
  CanonicalConflict: "canonical.conflict",
  HeadingSkip: "heading.order-skip",
  ThinContent: "content.thin",
  DuplicateContent: "content.duplicate",
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

function searchConnectionPath(domainUuid: string, provider: SiteSearchProvider): string {
  return `${domainPath(domainUuid)}/search/${encodeURIComponent(provider)}`;
}
