// What search did around a fixed finding, and which search landing pages lead
// to a Site's goals. SiteDomainAdminClient sends them. A number Custd could
// not measure is absent, never 0.
/** getFindingSearchImpact compares this many days before and after the fix when days is omitted. */
export const SITE_FINDING_IMPACT_DEFAULT_DAYS = 28;
export const SITE_FINDING_IMPACT_MIN_DAYS = 7;
export const SITE_FINDING_IMPACT_MAX_DAYS = 90;
/** getSearchValue reads this many days when days is omitted. */
export const SITE_SEARCH_VALUE_DEFAULT_DAYS = 28;
export const SITE_SEARCH_VALUE_MAX_DAYS = 90;
/** The most goal event types one getSearchValue call names. */
export const SITE_SEARCH_VALUE_MAX_GOALS = 5;
/** The most pages a search value read returns. */
export const SITE_SEARCH_VALUE_MAX_PAGES = 50;
/**
 * Whether a finding's impact could be measured. A source and each of its periods
 * are measured or insufficient; the impact itself is open while the finding is.
 */
export const SiteFindingImpactStatus = {
    Open: "open",
    Measured: "measured",
    Insufficient: "insufficient",
};
/** How much of the goal data could be read; newer values may appear. */
export const SiteSearchGoalStatus = {
    Measured: "measured",
    Partial: "partial",
    Unavailable: "unavailable",
};
