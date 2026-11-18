/** Public feed evidence that matched a saved Site term. */
export type SiteRegionalTrendMatch = {
    topic: string;
    sourceUrl: string;
    publishedAt: string;
    discussionUrl?: string;
    matchedTerm: string;
};
/** Evidence for one configured Site market. */
export type SiteRegionalTrendMarket = {
    supported: boolean;
    country: string;
    checkedAt?: string;
    stale: boolean;
    matches: SiteRegionalTrendMatch[];
};
/** Global technical discussion evidence for a Site that opted in. */
export type SiteTechnicalTrends = {
    source: string;
    checkedAt?: string;
    stale: boolean;
    matches: SiteRegionalTrendMatch[];
};
export type SiteRegionalTrends = {
    siteUuid: string;
    source: string;
    hasSavedTerms: boolean;
    markets: SiteRegionalTrendMarket[];
    technical?: SiteTechnicalTrends;
};
