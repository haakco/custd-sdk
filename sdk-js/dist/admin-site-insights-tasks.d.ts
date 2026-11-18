import type { RequestOptions } from "./index.js";
/** The Site Insights task names; newer tasks may appear. */
export declare const SiteInsightsTaskName: {
    readonly SiteChecks: "site-checks";
    readonly SiteAudits: "site-audits";
    readonly SiteSearchImports: "site-search-imports";
    readonly SiteWebData: "site-web-data";
    readonly SiteWebGraph: "site-web-graph";
    readonly SiteAccessLogs: "site-access-logs";
    readonly SiteSearchPool: "site-search-pool";
};
/** One count of work a task has waiting, with what it means. */
export type SiteInsightsBacklog = {
    name: string;
    count: number;
    meaning: string;
};
export type SiteInsightsTaskStatus = {
    /** A SiteInsightsTaskName value. */
    taskName: string;
    registered: boolean;
    enabled: boolean;
    nextRunAt?: string;
    lastRunAt?: string;
    lastRunStatus?: string;
    lastFailureAt?: string;
    lastFailure?: string;
    backlog: SiteInsightsBacklog[];
};
export type SiteInsightsTaskList = {
    generatedAt: string;
    tasks: SiteInsightsTaskStatus[];
};
type AdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;
export declare class SiteInsightsAdminClient {
    private readonly request;
    constructor(request: AdminRequester);
    /** Reads every Site Insights task's schedule, last outcome and backlog. System administrators only. */
    listTasks(options?: RequestOptions): Promise<SiteInsightsTaskList>;
}
export {};
