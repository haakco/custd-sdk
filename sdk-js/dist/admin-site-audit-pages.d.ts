import type { SiteDomainRequestOptions, SiteFinding } from "./admin-site-domains.js";
/** A 400 on setLighthousePages: each URL must be on the domain's host and not its home page. */
export declare const SITE_LIGHTHOUSE_PAGE_NOT_EXTRA_CODE = "site_lighthouse_page_not_extra";
/** listAuditPages returns this many pages when no limit is given. */
export declare const SITE_AUDIT_PAGES_DEFAULT_LIMIT = 50;
/** The most pages one listAuditPages call returns. */
export declare const SITE_AUDIT_PAGES_MAX_LIMIT = 200;
/** How many extra pages beside the home page Lighthouse may measure. */
export declare const SITE_LIGHTHOUSE_MAX_EXTRA_PAGES = 5;
/** Whether a crawled page can be indexed. */
export declare const SiteAuditPageIndexability: {
    readonly Indexable: "indexable";
    readonly Noindex: "noindex";
    readonly Canonicalized: "canonicalized";
    readonly Redirected: "redirected";
    readonly Error: "error";
    readonly NotHTML: "not_html";
};
export type SiteAuditPageIndexability = (typeof SiteAuditPageIndexability)[keyof typeof SiteAuditPageIndexability];
/** How the latest audit run ended. */
export declare const SiteAuditRun: {
    readonly NotAudited: "not_audited";
    readonly Failed: "failed";
    readonly Truncated: "truncated";
    readonly Complete: "complete";
};
export type SiteAuditRun = (typeof SiteAuditRun)[keyof typeof SiteAuditRun];
/** One crawled URL. depth and inboundLinks are absent when unknown; a present 0 is a real 0. */
export type SiteAuditPage = {
    url: string;
    /** Where the URL redirected to; absent when it did not redirect. */
    finalUrl?: string;
    /** HTTP status of the first response; 0 when the request failed. */
    status: number;
    /** A SiteAuditPageIndexability value. */
    indexability: SiteAuditPageIndexability;
    /** Clicks from the home page. */
    depth?: number;
    /** Crawled pages that link here; absent on a truncated crawl. */
    inboundLinks?: number;
    openFindings: number;
};
/** One page of the latest crawl's URLs; auditedAt is absent before the first audit. */
export type SiteAuditPageList = {
    domainUuid: string;
    auditedAt?: string;
    /** The crawl stopped at its bound; depth and inbound links are left out. */
    truncated: boolean;
    offset: number;
    limit: number;
    total: number;
    pages: SiteAuditPage[];
};
/** Findings the latest audit opened, reopened and fixed against the audit before it. */
export type SiteAuditDelta = {
    domainUuid: string;
    /** A SiteAuditRun value. */
    run: SiteAuditRun;
    auditedAt?: string;
    failure?: string;
    new: SiteFinding[];
    reopened: SiteFinding[];
    fixed: SiteFinding[];
};
/** The extra pages Lighthouse measures; the home page is always measured. */
export type SiteLighthousePages = {
    domainUuid: string;
    homePage: string;
    /** The extra pages, in the order they were set. */
    urls: string[];
    maxPages: number;
};
/** getLighthouseHistory's options: `url` names an extra page to read instead of the home page. */
export type SiteLighthouseRequestOptions = SiteDomainRequestOptions & {
    url?: string;
};
