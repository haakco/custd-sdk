// The keywords a domain tracks and each day's Search Console rank for them.
// SiteDomainAdminClient sends them. A day the keyword did not rank has no position, never 0.
/** A 400 on trackKeyword or updateTrackedKeyword: keyword, country, device or notifyPosition is out of range. */
export const SITE_TRACKED_KEYWORD_INVALID_CODE = "site_tracked_keyword_invalid";
/** A 409 on trackKeyword: the Site tracks the most keywords; remove one first. */
export const SITE_TRACKED_KEYWORD_LIMIT_CODE = "site_tracked_keyword_limit";
/** A 409 on trackKeyword: the domain already tracks this keyword in this country and device. */
export const SITE_TRACKED_KEYWORD_DUPLICATE_CODE = "site_tracked_keyword_duplicate";
/** A 404 on updateTrackedKeyword or untrackKeyword: the domain does not track this keyword. */
export const SITE_TRACKED_KEYWORD_NOT_FOUND_CODE = "site_tracked_keyword_not_found";
/** A 400 on getRankings: days must be 1 to 90. */
export const SITE_RANKINGS_DAYS_INVALID_CODE = "site_rankings_days_invalid";
/** How many keywords one Site tracks. */
export const SITE_TRACKED_KEYWORDS_MAX = 50;
/** The alert position a keyword gets when trackKeyword omits notifyPosition. */
export const SITE_TRACKED_KEYWORD_DEFAULT_NOTIFY_POSITION = 10;
/** getRankings reads this many days when days is omitted. */
export const SITE_RANKINGS_DEFAULT_DAYS = 28;
/** The longest getRankings window. */
export const SITE_RANKINGS_MAX_DAYS = 90;
/** The country and device value that tracks every country or every device. */
export const SITE_TRACKED_KEYWORD_ALL = "all";
/** One day's rank state; newer values may appear. */
export const SiteRankState = {
    Ranking: "ranking",
    NotRanking: "not_ranking",
    NoData: "no_data",
};
export const SiteTrackedKeywordStatus = {
    Active: "active",
    Paused: "paused",
};
/** The devices a keyword can be tracked on, beside SITE_TRACKED_KEYWORD_ALL. */
export const SiteRankDevice = {
    Desktop: "desktop",
    Mobile: "mobile",
    Tablet: "tablet",
};
/** The state of the Search Console connection the ranks come from; newer values may appear. */
export const SiteRankingsSource = {
    NotConnected: "not_connected",
    Pending: "pending",
    Active: "active",
    Failing: "failing",
    Revoked: "revoked",
};
