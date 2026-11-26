import type { SearchPoolAccess, SearchPoolBand } from "./admin-site-search-pool.js";
/** A 400 on trackKeyword or updateTrackedKeyword: keyword, country, device or notifyPosition is out of range. */
export declare const SITE_TRACKED_KEYWORD_INVALID_CODE = "site_tracked_keyword_invalid";
/** A 409 on trackKeyword: the Site tracks the most keywords; remove one first. */
export declare const SITE_TRACKED_KEYWORD_LIMIT_CODE = "site_tracked_keyword_limit";
/** A 409 on trackKeyword: the domain already tracks this keyword in this country and device. */
export declare const SITE_TRACKED_KEYWORD_DUPLICATE_CODE = "site_tracked_keyword_duplicate";
/** A 404 on updateTrackedKeyword or untrackKeyword: the domain does not track this keyword. */
export declare const SITE_TRACKED_KEYWORD_NOT_FOUND_CODE = "site_tracked_keyword_not_found";
/** A 400 on getRankings: days must be 1 to 90. */
export declare const SITE_RANKINGS_DAYS_INVALID_CODE = "site_rankings_days_invalid";
/** How many keywords one Site tracks. */
export declare const SITE_TRACKED_KEYWORDS_MAX = 50;
/** The alert position a keyword gets when trackKeyword omits notifyPosition. */
export declare const SITE_TRACKED_KEYWORD_DEFAULT_NOTIFY_POSITION = 10;
/** getRankings reads this many days when days is omitted. */
export declare const SITE_RANKINGS_DEFAULT_DAYS = 28;
/** The longest getRankings window. */
export declare const SITE_RANKINGS_MAX_DAYS = 90;
/** The country and device value that tracks every country or every device. */
export declare const SITE_TRACKED_KEYWORD_ALL = "all";
/** One day's rank state; newer values may appear. */
export declare const SiteRankState: {
    readonly Ranking: "ranking";
    readonly NotRanking: "not_ranking";
    readonly NoData: "no_data";
};
export declare const SiteTrackedKeywordStatus: {
    readonly Active: "active";
    readonly Paused: "paused";
};
/** The devices a keyword can be tracked on, beside SITE_TRACKED_KEYWORD_ALL. */
export declare const SiteRankDevice: {
    readonly Desktop: "desktop";
    readonly Mobile: "mobile";
    readonly Tablet: "tablet";
};
/** The state of the Search Console connection the ranks come from. */
export declare const SiteRankingsSource: {
    readonly NotConnected: "not_connected";
    readonly Pending: "pending";
    readonly Active: "active";
    readonly Failing: "failing";
    readonly Revoked: "revoked";
};
export type SiteRankingsSource = (typeof SiteRankingsSource)[keyof typeof SiteRankingsSource];
/** One day of a keyword. rankingUrl and position are absent unless the state is ranking. */
export type SiteRankObservation = {
    /** YYYY-MM-DD. */
    day: string;
    /** A SiteRankState value. */
    state: string;
    rankingUrl?: string;
    position?: number;
    clicks: number;
    impressions: number;
};
export type SiteTrackedKeyword = {
    keywordUuid: string;
    keyword: string;
    /** An ISO 3166-1 alpha-3 code such as zaf, or SITE_TRACKED_KEYWORD_ALL. */
    country: string;
    /** A SiteRankDevice value or SITE_TRACKED_KEYWORD_ALL. */
    device: string;
    /** A SiteTrackedKeywordStatus value. */
    status: string;
    notifyPosition: number;
    createdAt: string;
    /** The newest day in the window; no_data when nothing was read. */
    latest: SiteRankObservation;
    /** Every day of the window, oldest first. */
    observations: SiteRankObservation[];
    /** The shared search pool's band for the keyword; absent when not joined or below the pool's threshold. */
    pool?: SearchPoolBand;
};
export type SiteRankings = {
    /** A SiteRankingsSource value. */
    source: SiteRankingsSource;
    sourceFailure?: string;
    /** A SearchPoolAccess value; absent from servers before the shared search pool. */
    pool?: SearchPoolAccess;
    from: string;
    to: string;
    maxKeywords: number;
    keywords: SiteTrackedKeyword[];
};
/** country and device default to all, notifyPosition to SITE_TRACKED_KEYWORD_DEFAULT_NOTIFY_POSITION. */
export type SiteTrackKeywordRequest = {
    keyword: string;
    country?: string;
    device?: string;
    notifyPosition?: number;
};
/** paused is always sent (true stops tracking until resumed); an omitted notifyPosition keeps the stored one. */
export type SiteTrackedKeywordUpdate = {
    paused: boolean;
    notifyPosition?: number;
};
