// The domains linking to one of a Site's web domains, from Bing, Common Crawl's
// domain graph and Custd's own crawl. SiteDomainAdminClient sends the read. A
// count or rank a source did not report is absent, never 0.
/** Where a referring domain was seen; newer sources may appear. */
export const SiteLinkSource = {
    Bing: "bing",
    CommonCrawl: "commoncrawl",
    Crawl: "crawl",
};
/** The state of one link source for the domain; newer values may appear. */
export const SiteLinkSourceStatus = {
    Available: "available",
    Pending: "pending",
    Failed: "failed",
    Unavailable: "unavailable",
};
