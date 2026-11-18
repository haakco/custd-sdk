import type { SiteAuditSummary, SiteFindingSeverity, SiteSearchProvider, SiteSearchRow, SiteSearchSource, SiteUptimeStatus } from "./admin-site-domains.js";
import type { SiteNextAction } from "./admin-site-next-actions.js";
/** A 400 on page tools: the URL is not on the domain's own host. */
export declare const SITE_PAGE_NOT_ON_DOMAIN_CODE = "site_page_not_on_domain";
/** A 429 on requestPageRecheck: the domain's hourly page rechecks are used up. */
export declare const SITE_PAGE_RECHECK_LIMIT_CODE = "site_page_recheck_limit";
/** A 400 on requestSearchInspection: the URL is not an http(s) URL on the domain's host. */
export declare const SITE_SEARCH_INSPECTION_URL_INVALID_CODE = "site_search_inspection_url_invalid";
/** A 409 on requestSearchInspection: the domain is not verified and connected to Google. */
export declare const SITE_SEARCH_INSPECTION_NOT_CONNECTED_CODE = "site_search_inspection_not_connected";
/** A 429 on requestSearchInspection: the tenant's daily URL inspections are used up. */
export declare const SITE_SEARCH_INSPECTION_LIMIT_CODE = "site_search_inspection_limit";
/** What a fix changes. An unknown rule carries an empty kind; newer kinds may appear. */
export declare const SiteRemedyKind: {
    readonly Markup: "markup";
    readonly Setting: "setting";
    readonly Content: "content";
    readonly Server: "server";
};
/** The formats generated fix code comes in; newer formats may appear. */
export declare const SiteGeneratedFormat: {
    readonly HTML: "html";
    readonly RobotsTxt: "robots.txt";
    /** One Apache line and one nginx line. */
    readonly Redirect: "redirect";
};
/** Ready-to-copy code for one finding. It is never a published change. */
export type SiteGeneratedFix = {
    format: string;
    code: string;
};
/** What a finding's fix changes; the recommendation itself is the finding's `fix` text. */
export type SiteRemedy = {
    /** A SiteRemedyKind value, or empty for a rule without a remedy shape. */
    kind: string;
    /** The element, file or setting the fix changes. */
    element: string;
    /** Present only for rules with a generator that saw enough to fill it in. */
    generated?: SiteGeneratedFix;
};
/** One finding of a one-page check: no UUID or history, because nothing is stored. */
export type SitePageFinding = {
    rule: string;
    severity: SiteFindingSeverity;
    title: string;
    url: string;
    evidence: string;
    fix: string;
    source: string;
    remedy: SiteRemedy;
};
export type SitePageRobots = {
    noindex: boolean;
    nofollow: boolean;
    /** The X-Robots-Tag response header, empty when absent. */
    header: string;
};
export type SitePageOpenGraph = {
    title: string;
    description: string;
    image: string;
    url: string;
    type: string;
    siteName: string;
};
export type SitePageTwitter = {
    card: string;
    title: string;
    description: string;
    image: string;
    site: string;
};
export type SiteHreflangLink = {
    code: string;
    href: string;
};
export type SitePageHeading = {
    level: number;
    text: string;
};
/** fleschReadingEase is absent for a page that is not in English. */
export type SitePageReadability = {
    sentences: number;
    wordsPerSentence: number;
    readingTimeSeconds: number;
    fleschReadingEase?: number;
};
/** What the latest audit, recheck or draft check read from one page. */
export type SitePageFacts = {
    url: string;
    observedAt: string;
    /** The page's HTTP status; 200 for a draft. */
    status: number;
    lang: string;
    title: string;
    description: string;
    canonical: string;
    robots: SitePageRobots;
    openGraph: SitePageOpenGraph;
    twitter: SitePageTwitter;
    hreflang: SiteHreflangLink[];
    headings: SitePageHeading[];
    wordCount: number;
    readability: SitePageReadability;
    /** The og:image a fix would name: the largest declared image, else the first unsized one; never fetched. */
    shareImage?: string;
    /** FAQPage JSON-LD from the page's question headings; Google shows no FAQ rich results since 7 May 2026. */
    faqSchema?: SiteGeneratedFix;
};
export declare const SitePageRecheckState: {
    readonly Queued: "queued";
    readonly Checked: "checked";
    readonly Failed: "failed";
};
export type SitePageRecheckState = (typeof SitePageRecheckState)[keyof typeof SitePageRecheckState];
/** One queued page recheck; checkedAt is absent while queued. */
export type SitePageRecheck = {
    recheckUuid: string;
    url: string;
    state: SitePageRecheckState;
    requestedAt: string;
    checkedAt?: string;
    failure?: string;
    openRules: string[];
    fixedRules: string[];
};
export type SitePageCheckRequest = {
    /** The address the draft will be published at, on the domain's host. */
    url: string;
    /** The page's full HTML, at most 512 KiB. */
    html: string;
    /** The page's current address on the same host, when publishing moves it; asks for the redirect. */
    previousUrl?: string;
    /** A search phrase, at most 100 characters, to find in the draft. */
    phrase?: string;
};
/** Where one phrase appears in a draft and how often, with no target or verdict. */
export type SitePhraseUse = {
    phrase: string;
    inTitle: boolean;
    inDescription: boolean;
    inH1: boolean;
    count: number;
    /** Words of visible text the count is out of. */
    wordCount: number;
    /** count over wordCount as a percentage; absent when the draft has no words. */
    densityPercent?: number;
};
/** What the page checks found on one page, without the rest of the site. The draft tools are absent unless asked for. */
export type SitePageCheckResponse = {
    page: SitePageFacts;
    findings: SitePageFinding[];
    /** A URL slug from the draft's first h1, else its title. */
    slug?: string;
    /** The permanent redirect from previousUrl, format SiteGeneratedFormat.Redirect. */
    redirect?: SiteGeneratedFix;
    phrase?: SitePhraseUse;
};
/** Two drafts, as HTML or plain text (each at most 512 KiB), to compare. Nothing is stored. */
export type SiteWordingCompareRequest = {
    first: string;
    second: string;
};
/**
 * How much wording two drafts share, measured as the content.near-duplicate rule does; wording
 * overlap, not plagiarism. Texts under minWords are not compared: compared is false and
 * sharedPercent absent.
 */
export type SiteWordingCompare = {
    firstWords: number;
    secondWords: number;
    minWords: number;
    compared: boolean;
    sharedPercent?: number;
    thresholdPercent: number;
    nearDuplicate: boolean;
};
export type SiteRobotsTestRequest = {
    /** A path such as /blog/post?id=1, or an http(s) URL. */
    url: string;
    /** The crawler's product token, such as Googlebot or GPTBot. */
    userAgent: string;
    /** A robots.txt to test; omit to read the domain's live file. */
    robotsTxt?: string;
};
export type SiteRobotsRule = {
    line: number;
    directive: "allow" | "disallow";
    pattern: string;
};
/** robotsStatus is absent for a pasted file or an unreachable live one; rule is absent when no rule decided. */
export type SiteRobotsTestResponse = {
    allowed: boolean;
    userAgent: string;
    path: string;
    source: "pasted" | "live";
    robotsStatus?: number;
    groups: string[];
    rule?: SiteRobotsRule;
    note?: string;
};
export type SiteSearchDimension = "page" | "query" | "country" | "device";
export type SiteSearchRowsQuery = {
    /** Defaults to query on the server. */
    dimension?: SiteSearchDimension;
    provider?: SiteSearchProvider;
    /** 1..90; the server defaults to 28. */
    days?: number;
    offset?: number;
    /** 1..1000; the server defaults to 100. */
    limit?: number;
};
/** A provider that cannot report the dimension: no data, not zero traffic. */
export type SiteSearchUnavailable = {
    provider: SiteSearchProvider;
    reason: string;
};
export type SiteSearchRowPage = {
    domainUuid: string;
    dimension: SiteSearchDimension;
    /** Absent when the read spans every provider. */
    provider?: SiteSearchProvider;
    days: number;
    offset: number;
    limit: number;
    /** Rows matching the read before paging. */
    total: number;
    rows: SiteSearchRow[];
    unavailable: SiteSearchUnavailable[];
};
export type SiteSearchInspectionStatus = "queued" | "done" | "failed";
/** One URL inspection. Every result field is Google's own value and is absent when Google did not report it. */
export type SiteSearchInspection = {
    inspectionUuid: string;
    url: string;
    status: SiteSearchInspectionStatus;
    requestedAt: string;
    inspectedAt?: string;
    failure?: string;
    /** PASS, PARTIAL, FAIL or NEUTRAL. */
    verdict?: string;
    coverageState?: string;
    indexingState?: string;
    robotsTxtState?: string;
    pageFetchState?: string;
    lastCrawlAt?: string;
    googleCanonical?: string;
    userCanonical?: string;
    /** DESKTOP or MOBILE. */
    crawledAs?: string;
    mobileUsabilityVerdict?: string;
    resultLink?: string;
};
export type SiteSearchInspectionList = {
    inspections: SiteSearchInspection[];
    dailyLimit: number;
    /** Inspections the tenant requested in the last 24 hours. */
    usedToday: number;
};
export type SiteMarket = {
    /** ISO 3166-1 alpha-2, such as ZA. */
    country: string;
    /** ISO 639, such as en. */
    language: string;
};
/** A Site's brands, named competitors and markets; updatedAt is absent until first set. */
export type SiteProjectContext = {
    siteUuid: string;
    brandNames: string[];
    competitorDomains: string[];
    markets: SiteMarket[];
    updatedAt?: string;
};
export type SiteProjectContextRequest = {
    /** A site-bound credential may omit it for its own Site. */
    siteUuid?: string;
    brandNames?: string[];
    competitorDomains?: string[];
    markets?: SiteMarket[];
};
/** upPercent is absent for a window without checks. */
export type SiteUptimeWindow = {
    checks: number;
    upChecks: number;
    upPercent?: number;
};
export type SiteUptimeWindows = {
    last24h: SiteUptimeWindow;
    last7d: SiteUptimeWindow;
    last30d: SiteUptimeWindow;
};
export type SiteUptimeDay = SiteUptimeWindow & {
    /** UTC day, YYYY-MM-DD. */
    date: string;
};
export type SiteResponseHour = {
    hourStart: string;
    checks: number;
    upChecks: number;
    avgMs?: number;
    maxMs?: number;
};
export type SiteUptimeHistory = {
    domainUuid: string;
    monitoredSince?: string;
    generatedAt: string;
    responseDays: number;
    windows: SiteUptimeWindows;
    /** Ninety UTC days, oldest first, ending today. */
    days: SiteUptimeDay[];
    /** Each hour with a check in the response window, oldest first. */
    hours: SiteResponseHour[];
};
export type SiteLighthouseProfile = "desktop" | "mobile";
/** Each score is absent when the run did not produce it. */
export type SiteLighthouseScores = {
    performance?: number;
    accessibility?: number;
    bestPractices?: number;
    seo?: number;
};
export type SiteLighthouseMetrics = {
    firstContentfulPaintMs?: number;
    largestContentfulPaintMs?: number;
    totalBlockingTimeMs?: number;
    speedIndexMs?: number;
    cumulativeLayoutShift?: number;
};
export type SiteLighthouseRun = {
    profile: SiteLighthouseProfile;
    observedAt: string;
    outcome: "success" | "failed";
    failure?: string;
    url: string;
    durationMs: number;
    toolVersion?: string;
    scores: SiteLighthouseScores;
    metrics: SiteLighthouseMetrics;
};
/** The latest two successful runs of one measured page in one profile; previous* is absent after one run. */
export type SiteLighthousePageComparison = {
    url: string;
    profile: SiteLighthouseProfile;
    latestAt: string;
    latestScore: number;
    previousAt?: string;
    previousScore?: number;
    /** A lighthouse.* regression finding is open on this page and profile. */
    regressionOpen: boolean;
};
export type SiteLighthouseHistory = {
    domainUuid: string;
    days: number;
    /**
     * The page the runs measured: the home page unless the read named an extra page.
     * Absent on servers before per-page Lighthouse.
     */
    url?: string;
    runs: SiteLighthouseRun[];
    /** Every measured page compared per profile. Absent on servers before per-page Lighthouse, which means none. */
    pages?: SiteLighthousePageComparison[];
};
export type SiteReportUptime = {
    status: SiteUptimeStatus;
    responseMs?: number;
    downSince?: string;
    monitoredSince?: string;
    windows: SiteUptimeWindows;
    days: SiteUptimeDay[];
};
export type SiteReportCertificate = {
    validTo?: string;
    issuer?: string;
    /** The last certificate check failed. */
    problem: boolean;
};
/** The latest successful Lighthouse run of one profile in the last 30 days. */
export type SiteReportSpeed = {
    profile: SiteLighthouseProfile;
    observedAt: string;
    scores: SiteLighthouseScores;
    metrics: SiteLighthouseMetrics;
};
export type SiteReportSearch = {
    days: number;
    /** Google or Bing is connected for this domain. */
    connected: boolean;
    sources: SiteSearchSource[];
    topQueries: SiteSearchRow[];
    topPages: SiteSearchRow[];
    strikingDistance: SiteSearchRow[];
};
export type SiteReportFinding = {
    severity: SiteFindingSeverity;
    title: string;
    url: string;
    fix: string;
    firstSeenAt: string;
};
export type SiteReportAudit = {
    auditedAt?: string;
    summary?: SiteAuditSummary;
    findings: SiteReportFinding[];
};
/** One domain's client report, without verification, Site or search connection details. */
export type SiteReport = {
    host: string;
    generatedAt: string;
    /**
     * A SiteReportTemplate value; executive leaves out the technical appendix. Absent on servers
     * before the template field; the server's default template is full.
     */
    template?: string;
    uptime: SiteReportUptime;
    certificate: SiteReportCertificate;
    speed: SiteReportSpeed[];
    search: SiteReportSearch;
    audit: SiteReportAudit;
    /** The first three next actions, as getNextActions ranks them; absent from reports built or saved before servers sent them. */
    nextActions?: SiteNextAction[];
};
export type SiteReportShare = {
    shareUuid: string;
    /** The saved report the share opens; absent for a share of the live report. */
    reportUuid?: string;
    createdAt: string;
    expiresAt: string;
};
export type SiteReportShareList = {
    shares: SiteReportShare[];
};
/** The server defaults to 30 days and accepts 1..90. */
export type SiteReportShareRequest = {
    expiresInDays?: number;
    /** Shares a saved report instead of the live one. */
    reportUuid?: string;
};
/** The token opens the report at /shared-report#<token> and is shown only once. */
export type SiteReportShareCreated = {
    share: SiteReportShare;
    token: string;
};
/** A 409 on enableIndexNow: verify the domain first. */
export declare const SITE_INDEXNOW_DOMAIN_UNVERIFIED_CODE = "site_indexnow_domain_unverified";
/** A 409 on verifyIndexNowKey or submitIndexNow: enable IndexNow for the domain first. */
export declare const SITE_INDEXNOW_NOT_ENABLED_CODE = "site_indexnow_not_enabled";
/** A 409 on submitIndexNow: host the key file and verify it first. */
export declare const SITE_INDEXNOW_KEY_UNVERIFIED_CODE = "site_indexnow_key_unverified";
/** A 400 on submitIndexNow: urls must be 1 to 100 distinct http(s) URLs on the domain's host. */
export declare const SITE_INDEXNOW_URLS_INVALID_CODE = "site_indexnow_urls_invalid";
/** A 429 on submitIndexNow: the tenant's daily IndexNow URLs are used up. */
export declare const SITE_INDEXNOW_LIMIT_CODE = "site_indexnow_limit";
/** An IndexNow submission's status; newer statuses may appear. */
export declare const IndexNowSubmissionStatus: {
    readonly Queued: "queued";
    readonly Accepted: "accepted";
    readonly Rejected: "rejected";
    readonly Failed: "failed";
};
export type IndexNowSubmissionRequest = {
    /** 1 to 100 URLs on the domain's own host. */
    urls: string[];
};
/** One submission; providerStatus and submittedAt are absent until IndexNow answers. */
export type IndexNowSubmission = {
    submissionUuid: string;
    /** An IndexNowSubmissionStatus value. */
    status: string;
    urls: string[];
    /** IndexNow's HTTP status; 202 means received while the key is validated. */
    providerStatus?: number;
    failure?: string;
    requestedAt: string;
    submittedAt?: string;
};
/** A domain's IndexNow setup; key and keyLocation are absent while disabled. */
export type IndexNowState = {
    enabled: boolean;
    key?: string;
    /** Serve a text file here that holds only the key. */
    keyLocation?: string;
    verified: boolean;
    verifiedAt?: string;
    lastCheckFailure?: string;
    dailyUrlLimit: number;
    /** URLs the tenant submitted in the last 24 hours. */
    urlsToday: number;
    submissions: IndexNowSubmission[];
};
