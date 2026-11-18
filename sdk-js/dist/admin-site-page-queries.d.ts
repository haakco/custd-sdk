/** Why a page has ranking queries to show or not; newer values may appear. */
export declare const SitePageQueriesState: {
    readonly Available: "available";
    readonly NotConnected: "not_connected";
    readonly NotImported: "not_imported";
    readonly NoQueries: "no_queries";
};
/** The shape a suggested title takes; newer values may appear. */
export declare const SiteTitleTemplate: {
    readonly General: "general";
    readonly Guide: "guide";
};
/** Where a page to link from mentions the query; newer values may appear. */
export declare const SitePageLinkSourceWhere: {
    readonly Title: "title";
    readonly Heading: "heading";
};
/** One query the page shows for, and whether the page's title, description or h1 contains it. */
export type SitePageQuery = {
    query: string;
    clicks: number;
    impressions: number;
    position: number;
    inTitle: boolean;
    inDescription: boolean;
    inH1: boolean;
};
export type SiteTitleOption = {
    title: string;
    /** A SiteTitleTemplate value. */
    template: string;
    query: string;
    impressions: number;
};
/** A page on the site that mentions the query and could link to this one. */
export type SitePageLinkSource = {
    url: string;
    title: string;
    query: string;
    /** A SitePageLinkSourceWhere value. */
    where: string;
};
/** The imported window the queries cover; from and to are YYYY-MM-DD. */
export type SitePageQueryWindow = {
    provider: string;
    from: string;
    to: string;
    importedAt: string;
};
export type SitePageSearchQueries = {
    domainUuid: string;
    url: string;
    /** A SitePageQueriesState value. */
    state: string;
    /** Absent until a search import has covered the page. */
    window?: SitePageQueryWindow;
    maxQueries: number;
    queries: SitePageQuery[];
    titleOptions: SiteTitleOption[];
    linkSources: SitePageLinkSource[];
};
