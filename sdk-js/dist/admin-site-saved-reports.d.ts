import type { SiteDomainRequestOptions } from "./admin-site-domains.js";
import type { SiteReport } from "./admin-site-insights.js";
/** A 409 on saveReport or replaceSavedReport: the domain already has a report with this name. */
export declare const SAVED_SITE_REPORT_NAME_TAKEN_CODE = "saved_site_report_name_taken";
/** A 409 on saveReport: the domain already keeps the most saved reports; delete or replace one. */
export declare const SAVED_SITE_REPORT_LIMIT_CODE = "saved_site_report_limit";
/** How many saved reports one domain keeps. */
export declare const SITE_SAVED_REPORTS_MAX = 20;
/** Which sections a report carries; executive is the summary a client reads first. */
export declare const SiteReportTemplate: {
    readonly Executive: "executive";
    readonly Full: "full";
};
/** getReport's options: the template (default full) and the search window in days (1..90, default 28). */
export type SiteReportRequestOptions = SiteDomainRequestOptions & {
    template?: string;
    days?: number;
};
/** The server defaults template to full and days to 28 (1..90). */
export type SavedSiteReportRequest = {
    name: string;
    /** A SiteReportTemplate value. */
    template?: string;
    days?: number;
};
export type SavedSiteReportSummary = {
    reportUuid: string;
    name: string;
    /** A SiteReportTemplate value. */
    template: string;
    days: number;
    generatedAt: string;
    createdAt: string;
    /** Unexpired shares that open this report. */
    liveShares: number;
};
/** A saved report: its summary fields and the report as it was generated. */
export type SavedSiteReport = SavedSiteReportSummary & {
    report: SiteReport;
};
export type SavedSiteReportList = {
    reports: SavedSiteReportSummary[];
    maxReports: number;
};
