/** A 404 on deleteKeywordList or getKeywordClusters: the Site has no list of that name. */
export declare const SITE_KEYWORD_LIST_NOT_FOUND_CODE = "site_keyword_list_not_found";
/** A 409 on saveKeywordList: the Site keeps the most lists; delete one first. */
export declare const SITE_KEYWORD_LIST_LIMIT_CODE = "site_keyword_list_limit";
/** Where keyword demand and related keywords come from. */
export declare const SITE_KEYWORD_DEMAND_SOURCE_BING = "bing_keyword_research";
/** Why a keyword list has demand numbers or not. */
export declare const SiteKeywordDemandState: {
    readonly Available: "available";
    readonly NoMarket: "no_market";
    readonly NoBing: "no_bing";
};
export type SiteKeywordDemandState = (typeof SiteKeywordDemandState)[keyof typeof SiteKeywordDemandState];
/** Whether an inventoried domain is the Site's own or a named competitor. */
export declare const SiteWebDomainRole: {
    readonly Own: "own";
    readonly Competitor: "competitor";
};
export type SiteWebDomainRole = (typeof SiteWebDomainRole)[keyof typeof SiteWebDomainRole];
/** Where a page was found; newer sources may appear. */
export declare const SiteWebPageSource: {
    readonly Sitemap: "sitemap";
    readonly Wayback: "wayback";
};
/** The state of one inventory source for a domain. */
export declare const SiteWebInventoryStatus: {
    readonly Pending: "pending";
    readonly Done: "done";
    readonly Partial: "partial";
    readonly Unavailable: "unavailable";
    readonly Failed: "failed";
};
export type SiteWebInventoryStatus = (typeof SiteWebInventoryStatus)[keyof typeof SiteWebInventoryStatus];
/** A domain's band in the Tranco top-sites list. */
export declare const SiteTrancoBand: {
    readonly Top1K: "top-1k";
    readonly Top10K: "top-10k";
    readonly Top100K: "top-100k";
    readonly Top1M: "top-1m";
    readonly Unranked: "unranked";
    readonly Unknown: "unknown";
};
export type SiteTrancoBand = (typeof SiteTrancoBand)[keyof typeof SiteTrancoBand];
/** Whether a term's Wikipedia article was found. */
export declare const SiteTopicTrendStatus: {
    readonly Pending: "pending";
    readonly Found: "found";
    readonly NoArticle: "no_article";
    readonly Failed: "failed";
};
export type SiteTopicTrendStatus = (typeof SiteTopicTrendStatus)[keyof typeof SiteTopicTrendStatus];
/** Where a trend term came from: a brand name or the content-gap seed. */
export declare const SiteTopicTrendSource: {
    readonly Brand: "brand";
    readonly Seed: "seed";
};
export type SiteTopicTrendSource = (typeof SiteTopicTrendSource)[keyof typeof SiteTopicTrendSource];
/** Whether the Site's own pages and queries could be read for a content gap. */
export declare const SiteContentGapCoverage: {
    readonly Available: "available";
    readonly Unavailable: "unavailable";
};
export type SiteContentGapCoverage = (typeof SiteContentGapCoverage)[keyof typeof SiteContentGapCoverage];
/** One inventoried domain. trancoRank, trancoListDay and inventoryAt are absent until known. */
export type SiteWebDomain = {
    domain: string;
    /** A SiteWebDomainRole value. */
    role: SiteWebDomainRole;
    /** A SiteTrancoBand value. */
    trancoBand: SiteTrancoBand;
    trancoRank?: number;
    trancoListDay?: string;
    /** A SiteWebInventoryStatus value. */
    sitemapStatus: SiteWebInventoryStatus;
    /** A SiteWebInventoryStatus value. */
    waybackStatus: SiteWebInventoryStatus;
    pageCount: number;
    lastFailure?: string;
    inventoryAt?: string;
    nextInventoryAt: string;
};
export type SiteWebDomains = {
    siteUuid: string;
    domains: SiteWebDomain[];
};
export type SiteWebPage = {
    url: string;
    /** SiteWebPageSource values. */
    sources: string[];
    firstSeen: string;
    lastSeen: string;
};
/** listWebPages' options; `after` is the previous page's `next`. */
export type SiteWebPagesQuery = {
    siteUuid?: string;
    after?: string;
    limit?: number;
};
/** One page of a domain's URLs; `next` is absent on the last page. */
export type SiteWebPages = {
    siteUuid: string;
    domain: string;
    pages: SiteWebPage[];
    next?: string;
};
export type SiteTopicTrendMonth = {
    /** YYYY-MM. */
    month: string;
    views: number;
};
/** One term's Wikipedia page views; checkedAt is absent until first checked. */
export type SiteTopicTrend = {
    term: string;
    /** A SiteTopicTrendSource value. */
    source: SiteTopicTrendSource;
    project: string;
    article: string;
    /** A SiteTopicTrendStatus value. */
    status: SiteTopicTrendStatus;
    lastFailure?: string;
    checkedAt?: string;
    months: SiteTopicTrendMonth[];
};
export type SiteTopicTrends = {
    siteUuid: string;
    trends: SiteTopicTrend[];
};
export type SiteContentGapCompetitor = {
    domain: string;
    /** A SiteWebInventoryStatus value. */
    sitemapStatus: string;
    /** A SiteWebInventoryStatus value. */
    waybackStatus: string;
    pageCount: number;
};
export type SiteContentGapPage = SiteWebPage & {
    domain: string;
};
/** A topic competitors cover and the Site does not. */
export type SiteContentGapTopic = {
    topic: string;
    label: string;
    competitors: string[];
    pageCount: number;
    pages: SiteContentGapPage[];
};
/** partial is true while a competitor's inventory is incomplete. */
export type SiteContentGap = {
    siteUuid: string;
    seed?: string;
    /** A SiteContentGapCoverage value. */
    ownCoverage: SiteContentGapCoverage;
    ownPages: number;
    ownQueries: number;
    partial: boolean;
    competitors: SiteContentGapCompetitor[];
    topics: SiteContentGapTopic[];
};
/** One keyword Bing relates to a list's seed term, with its searches over the period. */
export type SiteRelatedKeyword = {
    keyword: string;
    impressions: number;
    broadImpressions: number;
};
/** What Bing relates to a list's seed term in the Site's first market, from..to (YYYY-MM-DD). */
export type SiteRelatedKeywords = {
    /** SITE_KEYWORD_DEMAND_SOURCE_BING. */
    source: string;
    market: string;
    from: string;
    to: string;
    checkedAt: string;
    keywords: SiteRelatedKeyword[];
};
/** One search result Custd sampled for a keyword list's market. */
export type SiteMarketSearchHit = {
    title: string;
    url: string;
    authority: number;
    date?: string;
};
export type SiteMarketSample = {
    observedAt: string;
    hits: SiteMarketSearchHit[] | null;
};
export type SiteKeywordList = {
    name: string;
    seedTerm?: string;
    keywords: string[];
    /** Whether Custd samples the seed term's search market for this list. */
    marketSampleEnabled: boolean;
    /** The latest market sample; absent until one is taken. */
    marketSample?: SiteMarketSample;
    createdAt: string;
    updatedAt: string;
    /** Absent until Bing has been asked about the seed term, without a seed, or from an older server. */
    related?: SiteRelatedKeywords;
};
export type SiteKeywordLists = {
    siteUuid: string;
    lists: SiteKeywordList[];
};
/** Replaces the named list, or creates it. */
export type SiteKeywordListRequest = {
    name: string;
    seedTerm?: string;
    keywords: string[];
    /** Samples the seed term's search market for this list. */
    marketSampleEnabled?: boolean;
};
/** clicks, impressions and avgPosition are absent when no keyword in the cluster has search numbers. */
export type SiteKeywordCluster = {
    cluster: string;
    keywords: string[];
    keywordCount: number;
    measuredKeywords: number;
    clicks?: number;
    impressions?: number;
    avgPosition?: number;
    /** Bing's latest weekly searches for the cluster's keywords, summed; absent when Bing reported none. */
    bingWeeklyImpressions?: number;
};
export type SiteStrikingKeyword = {
    keyword: string;
    clicks: number;
    impressions: number;
    position: number;
};
export type SiteKeywordClusters = {
    siteUuid: string;
    name: string;
    metricsSource: string;
    metricsDays: number;
    totalKeywords: number;
    clusters: SiteKeywordCluster[];
    strikingDistance: SiteStrikingKeyword[];
    /** Bing demand for the list's keywords; absent from an older server. */
    demand?: SiteKeywordDemandSet;
};
/** One keyword's Bing searches in the latest week Bing reported. A number Bing did not report is absent, never 0. */
export type SiteKeywordDemand = {
    keyword: string;
    weeklyImpressions?: number;
    broadImpressions?: number;
    /** YYYY-MM-DD. */
    weekOf?: string;
    checkedAt: string;
    lastFailure?: string;
};
/** Holds only keywords Bing has been asked about; state says why it is empty. */
export type SiteKeywordDemandSet = {
    /** A SiteKeywordDemandState value. */
    state: SiteKeywordDemandState;
    /** SITE_KEYWORD_DEMAND_SOURCE_BING. */
    source: string;
    market?: string;
    keywords: SiteKeywordDemand[];
};
