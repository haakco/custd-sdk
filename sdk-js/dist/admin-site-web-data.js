// Public web data about a Site and its competitors: the domains Custd
// inventories, their pages, topic interest, the content gap, and the Site's
// keyword lists with their search clusters. SiteDomainAdminClient sends them.
// A site-bound credential may omit siteUuid for its own Site.
/** A 404 on deleteKeywordList or getKeywordClusters: the Site has no list of that name. */
export const SITE_KEYWORD_LIST_NOT_FOUND_CODE = "site_keyword_list_not_found";
/** A 409 on saveKeywordList: the Site keeps the most lists; delete one first. */
export const SITE_KEYWORD_LIST_LIMIT_CODE = "site_keyword_list_limit";
/** Where keyword demand and related keywords come from. */
export const SITE_KEYWORD_DEMAND_SOURCE_BING = "bing_keyword_research";
/** Why a keyword list has demand numbers or not; newer values may appear. */
export const SiteKeywordDemandState = {
    Available: "available",
    NoMarket: "no_market",
    NoBing: "no_bing",
};
/** Whether an inventoried domain is the Site's own or a named competitor; newer values may appear. */
export const SiteWebDomainRole = {
    Own: "own",
    Competitor: "competitor",
};
/** Where a page was found; newer sources may appear. */
export const SiteWebPageSource = {
    Sitemap: "sitemap",
    Wayback: "wayback",
};
/** The state of one inventory source for a domain; newer values may appear. */
export const SiteWebInventoryStatus = {
    Pending: "pending",
    Done: "done",
    Partial: "partial",
    Unavailable: "unavailable",
    Failed: "failed",
};
/** A domain's band in the Tranco top-sites list; newer values may appear. */
export const SiteTrancoBand = {
    Top1K: "top-1k",
    Top10K: "top-10k",
    Top100K: "top-100k",
    Top1M: "top-1m",
    Unranked: "unranked",
    Unknown: "unknown",
};
/** Whether a term's Wikipedia article was found; newer values may appear. */
export const SiteTopicTrendStatus = {
    Pending: "pending",
    Found: "found",
    NoArticle: "no_article",
    Failed: "failed",
};
/** Where a trend term came from: a brand name or the content-gap seed. */
export const SiteTopicTrendSource = {
    Brand: "brand",
    Seed: "seed",
};
/** Whether the Site's own pages and queries could be read for a content gap. */
export const SiteContentGapCoverage = {
    Available: "available",
    Unavailable: "unavailable",
};
