// The pages a domain's latest audit crawled, what changed since the audit
// before it, and the extra pages Lighthouse measures beside the home page.
// SiteDomainAdminClient sends them. A measurement Custd did not take is absent, never 0.
/** A 400 on setLighthousePages: each URL must be on the domain's host and not its home page. */
export const SITE_LIGHTHOUSE_PAGE_NOT_EXTRA_CODE = "site_lighthouse_page_not_extra";
/** listAuditPages returns this many pages when no limit is given. */
export const SITE_AUDIT_PAGES_DEFAULT_LIMIT = 50;
/** The most pages one listAuditPages call returns. */
export const SITE_AUDIT_PAGES_MAX_LIMIT = 200;
/** How many extra pages beside the home page Lighthouse may measure. */
export const SITE_LIGHTHOUSE_MAX_EXTRA_PAGES = 5;
/** Whether a crawled page can be indexed; newer values may appear. */
export const SiteAuditPageIndexability = {
    Indexable: "indexable",
    Noindex: "noindex",
    Canonicalized: "canonicalized",
    Redirected: "redirected",
    Error: "error",
    NotHTML: "not_html",
};
/** How the latest audit run ended; newer values may appear. */
export const SiteAuditRun = {
    NotAudited: "not_audited",
    Failed: "failed",
    Truncated: "truncated",
    Complete: "complete",
};
