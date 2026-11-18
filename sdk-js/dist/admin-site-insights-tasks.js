// The Site Insights background tasks' state for operators: whether each is
// registered and enabled, its last and next run, and its backlog. A system
// administrator reads it platform-wide through client.admin.siteInsights.
/** The Site Insights task names; newer tasks may appear. */
export const SiteInsightsTaskName = {
    SiteChecks: "site-checks",
    SiteAudits: "site-audits",
    SiteSearchImports: "site-search-imports",
    SiteWebData: "site-web-data",
    SiteWebGraph: "site-web-graph",
    SiteAccessLogs: "site-access-logs",
    SiteSearchPool: "site-search-pool",
};
export class SiteInsightsAdminClient {
    constructor(request) {
        this.request = request;
    }
    /** Reads every Site Insights task's schedule, last outcome and backlog. System administrators only. */
    listTasks(options) {
        return this.request("GET", "/site-insights/tasks", undefined, options);
    }
}
