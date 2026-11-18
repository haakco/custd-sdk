// Site Insights shapes served beside the site-domain routes: finding remedies,
// page facts and tools, search rows and URL inspections, a Site's project
// context, and the client report reads. SiteDomainAdminClient sends them.
// A measurement Custd did not take is absent, never 0.
/** A 400 on page tools: the URL is not on the domain's own host. */
export const SITE_PAGE_NOT_ON_DOMAIN_CODE = "site_page_not_on_domain";
/** A 429 on requestPageRecheck: the domain's hourly page rechecks are used up. */
export const SITE_PAGE_RECHECK_LIMIT_CODE = "site_page_recheck_limit";
/** A 400 on requestSearchInspection: the URL is not an http(s) URL on the domain's host. */
export const SITE_SEARCH_INSPECTION_URL_INVALID_CODE = "site_search_inspection_url_invalid";
/** A 409 on requestSearchInspection: the domain is not verified and connected to Google. */
export const SITE_SEARCH_INSPECTION_NOT_CONNECTED_CODE = "site_search_inspection_not_connected";
/** A 429 on requestSearchInspection: the tenant's daily URL inspections are used up. */
export const SITE_SEARCH_INSPECTION_LIMIT_CODE = "site_search_inspection_limit";
/** What a fix changes. An unknown rule carries an empty kind; newer kinds may appear. */
export const SiteRemedyKind = {
    Markup: "markup",
    Setting: "setting",
    Content: "content",
    Server: "server",
};
/** The formats generated fix code comes in; newer formats may appear. */
export const SiteGeneratedFormat = {
    HTML: "html",
    RobotsTxt: "robots.txt",
};
export const SitePageRecheckState = {
    Queued: "queued",
    Checked: "checked",
    Failed: "failed",
};
/** A 409 on enableIndexNow: verify the domain first. */
export const SITE_INDEXNOW_DOMAIN_UNVERIFIED_CODE = "site_indexnow_domain_unverified";
/** A 409 on verifyIndexNowKey or submitIndexNow: enable IndexNow for the domain first. */
export const SITE_INDEXNOW_NOT_ENABLED_CODE = "site_indexnow_not_enabled";
/** A 409 on submitIndexNow: host the key file and verify it first. */
export const SITE_INDEXNOW_KEY_UNVERIFIED_CODE = "site_indexnow_key_unverified";
/** A 400 on submitIndexNow: urls must be 1 to 100 distinct http(s) URLs on the domain's host. */
export const SITE_INDEXNOW_URLS_INVALID_CODE = "site_indexnow_urls_invalid";
/** A 429 on submitIndexNow: the tenant's daily IndexNow URLs are used up. */
export const SITE_INDEXNOW_LIMIT_CODE = "site_indexnow_limit";
/** An IndexNow submission's status; newer statuses may appear. */
export const IndexNowSubmissionStatus = {
    Queued: "queued",
    Accepted: "accepted",
    Rejected: "rejected",
    Failed: "failed",
};
