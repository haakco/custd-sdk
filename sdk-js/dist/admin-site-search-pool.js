// The tenant's opt-in shared search pool: Search Console queries pooled across
// contributing tenants into demand bands and position shares, never a
// tenant's own numbers. SiteDomainAdminClient sends the calls; they are
// tenant-wide, and a site-bound credential is refused.
/** A 403 on listSearchPoolQueries: the tenant has not joined the pool. */
export const SITE_SEARCH_POOL_NOT_JOINED_CODE = "site_search_pool_not_joined";
/** A 403 on any pool call: a credential bound to one Site cannot read or change the tenant's pool. */
export const SITE_SEARCH_POOL_SITE_BOUND_CODE = "site_search_pool_site_bound";
/** A 400 on setSearchPool: joined must be true or false. */
export const SITE_SEARCH_POOL_SETTING_INVALID_CODE = "site_search_pool_setting_invalid";
/**
 * The shared search pool terms version current at this SDK release. Joining is consent the
 * caller gives: read the live version from SearchPoolSetting.termsVersion, show those terms,
 * and pass the version accepted to setSearchPool. A missing or stale version is a plain 400.
 */
export const SEARCH_POOL_TERMS_VERSION = "2026-11-18";
/** A 400 on listSearchPoolQueries: search or limit is out of range. */
export const SITE_SEARCH_POOL_QUERY_INVALID_CODE = "site_search_pool_query_invalid";
/** listSearchPoolQueries returns this many queries when limit is omitted. */
export const SEARCH_POOL_QUERIES_DEFAULT_LIMIT = 50;
export const SEARCH_POOL_QUERIES_MAX_LIMIT = 200;
/** The longest listSearchPoolQueries search text. */
export const SEARCH_POOL_SEARCH_MAX_LENGTH = 100;
/** Distinct tenants a query needs before it is pooled. */
export const SEARCH_POOL_MIN_CONTRIBUTORS = 5;
/** Pooled impressions a query needs over the window. */
export const SEARCH_POOL_MIN_IMPRESSIONS = 100;
/** The days the pool covers. */
export const SEARCH_POOL_WINDOW_DAYS = 28;
/** A pooled query's impressions over the window; newer bands may appear. */
export const SearchPoolDemandBand = {
    Hundreds: "100_999",
    Thousands: "1k_10k",
    TensOfThousands: "10k_100k",
    HundredThousandPlus: "100k_plus",
};
/** Whether the tenant takes part in the pool, as SiteRankings.pool reports it. */
export const SearchPoolAccess = {
    Joined: "joined",
    NotJoined: "not_joined",
};
