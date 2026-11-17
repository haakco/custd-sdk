// A domain's client report in a chosen template and window, and the saved
// copies a tenant keeps and shares. SiteDomainAdminClient sends them.
/** A 409 on saveReport or replaceSavedReport: the domain already has a report with this name. */
export const SAVED_SITE_REPORT_NAME_TAKEN_CODE = "saved_site_report_name_taken";
/** A 409 on saveReport: the domain already keeps the most saved reports; delete or replace one. */
export const SAVED_SITE_REPORT_LIMIT_CODE = "saved_site_report_limit";
/** How many saved reports one domain keeps. */
export const SITE_SAVED_REPORTS_MAX = 20;
/** Which sections a report carries; executive is the summary a client reads first. */
export const SiteReportTemplate = {
    Executive: "executive",
    Full: "full",
};
