// A domain's traffic and AI visibility read from its web server access logs,
// and the platform operator's replay of one access-log hour.
// SiteDomainAdminClient sends them. A count Custd did not read is absent, never 0.
/** A 400 on replayAccessLogHour: hourStart must start a finished UTC hour within the last 28 days. */
export const ACCESS_LOG_HOUR_INVALID_CODE = "access_log_hour_invalid";
/** The key that collects the rows beyond each day's top rows. */
export const TRAFFIC_OTHER_KEY = "(other)";
/** How much of one day was read; newer values may appear. */
export const SiteTrafficDayCoverage = {
    Complete: "complete",
    Partial: "partial",
    Missing: "missing",
};
/** Whether DNS confirmed a crawler or its User-Agent only claims to be it. */
export const SiteCrawlerIdentity = {
    Verified: "verified",
    ClaimsToBe: "claims_to_be",
};
/** The kind of site that referred a request; newer values may appear. */
export const SiteReferrerClass = {
    Search: "search",
    AI: "ai",
    Social: "social",
    Other: "other",
};
/** How a replayed hour stood before the replay; missing when it was never read. */
export const AccessLogHourStatus = {
    Done: "done",
    Partial: "partial",
    Failed: "failed",
    Missing: "missing",
};
