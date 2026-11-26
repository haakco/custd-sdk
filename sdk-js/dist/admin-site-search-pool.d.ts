/** A 403 on listSearchPoolQueries: the tenant has not joined the pool. */
export declare const SITE_SEARCH_POOL_NOT_JOINED_CODE = "site_search_pool_not_joined";
/** A 403 on any pool call: a credential bound to one Site cannot read or change the tenant's pool. */
export declare const SITE_SEARCH_POOL_SITE_BOUND_CODE = "site_search_pool_site_bound";
/** A 400 on setSearchPool: joined must be true or false. */
export declare const SITE_SEARCH_POOL_SETTING_INVALID_CODE = "site_search_pool_setting_invalid";
/**
 * The shared search pool terms version current at this SDK release. Joining is consent the
 * caller gives: read the live version from SearchPoolSetting.termsVersion, show those terms,
 * and pass the version accepted to setSearchPool. A missing or stale version is a plain 400.
 */
export declare const SEARCH_POOL_TERMS_VERSION = "2026-11-18";
/** A 400 on listSearchPoolQueries: search or limit is out of range. */
export declare const SITE_SEARCH_POOL_QUERY_INVALID_CODE = "site_search_pool_query_invalid";
/** listSearchPoolQueries returns this many queries when limit is omitted. */
export declare const SEARCH_POOL_QUERIES_DEFAULT_LIMIT = 50;
export declare const SEARCH_POOL_QUERIES_MAX_LIMIT = 200;
/** The longest listSearchPoolQueries search text. */
export declare const SEARCH_POOL_SEARCH_MAX_LENGTH = 100;
/** Distinct tenants a query needs before it is pooled. */
export declare const SEARCH_POOL_MIN_CONTRIBUTORS = 5;
/** Pooled impressions a query needs over the window. */
export declare const SEARCH_POOL_MIN_IMPRESSIONS = 100;
/** The days the pool covers. */
export declare const SEARCH_POOL_WINDOW_DAYS = 28;
/** A pooled query's impressions over the window. */
export declare const SearchPoolDemandBand: {
    readonly Hundreds: "100_999";
    readonly Thousands: "1k_10k";
    readonly TensOfThousands: "10k_100k";
    readonly HundredThousandPlus: "100k_plus";
};
export type SearchPoolDemandBand = (typeof SearchPoolDemandBand)[keyof typeof SearchPoolDemandBand];
/** Whether the tenant takes part in the pool, as SiteRankings.pool reports it. */
export declare const SearchPoolAccess: {
    readonly Joined: "joined";
    readonly NotJoined: "not_joined";
};
export type SearchPoolAccess = (typeof SearchPoolAccess)[keyof typeof SearchPoolAccess];
export type SearchPoolSetting = {
    /** true while the tenant contributes to and may read the pool. */
    joined: boolean;
    /** Absent while not joined. */
    joinedAt?: string;
    /** The terms version joining needs now. Absent from an older server. */
    termsVersion?: string;
    /** The terms version the tenant accepted when it joined; absent while not joined. */
    acceptedTermsVersion?: string;
    minContributors: number;
    minImpressions: number;
    windowDays: number;
};
/** Percent of pooled impressions at each position range, rounded to 5. */
export type SearchPoolPositions = {
    top3: number;
    top10: number;
    top20: number;
    beyond20: number;
};
export type SearchPoolBand = {
    /** A SearchPoolDemandBand value. */
    demandBand: SearchPoolDemandBand;
    positions: SearchPoolPositions;
};
export type SearchPoolQuery = SearchPoolBand & {
    query: string;
};
/** from, to and computedAt are absent before the first rollup. */
export type SearchPoolQueryPage = {
    /** YYYY-MM-DD. */
    from?: string;
    /** YYYY-MM-DD. */
    to?: string;
    computedAt?: string;
    /** Busiest demand band first, then by query. */
    queries: SearchPoolQuery[];
};
