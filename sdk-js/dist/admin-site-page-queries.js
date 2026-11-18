// The searches one page shows for (Search Console's page and query dimensions
// together), with title options and pages to link from built from them.
// SiteDomainAdminClient.getPageSearchQueries sends the read.
/** Why a page has ranking queries to show or not; newer values may appear. */
export const SitePageQueriesState = {
    Available: "available",
    NotConnected: "not_connected",
    NotImported: "not_imported",
    NoQueries: "no_queries",
};
/** The shape a suggested title takes; newer values may appear. */
export const SiteTitleTemplate = {
    General: "general",
    Guide: "guide",
};
/** Where a page to link from mentions the query; newer values may appear. */
export const SitePageLinkSourceWhere = {
    Title: "title",
    Heading: "heading",
};
