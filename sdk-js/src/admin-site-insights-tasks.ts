// The Site Insights background tasks' state for operators: whether each is
// registered and enabled, its last and next run, and its backlog. A system
// administrator reads it platform-wide through client.admin.siteInsights.

import type { SiteAIPlatformUsage, SiteAIUsagePeriod } from "./admin-site-ai.js";
import type { RequestOptions } from "./index.js";

/** The Site Insights task names; newer tasks may appear. */
export const SiteInsightsTaskName = {
  SiteChecks: "site-checks",
  SiteAudits: "site-audits",
  SiteSearchImports: "site-search-imports",
  SiteWebData: "site-web-data",
  SiteWebGraph: "site-web-graph",
  SiteAccessLogs: "site-access-logs",
  SiteSearchPool: "site-search-pool",
} as const;

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

export class SiteInsightsAdminClient {
  constructor(private readonly request: AdminRequester) {}

  /** Reads every Site Insights task's schedule, last outcome and backlog. System administrators only. */
  listTasks(options?: RequestOptions): Promise<SiteInsightsTaskList> {
    return this.request("GET", "/site-insights/tasks", undefined, options);
  }

  /** Reads AI usage across tenants. System administrators only. */
  getAIUsage(period?: SiteAIUsagePeriod, options?: RequestOptions): Promise<SiteAIPlatformUsage> {
    const path = "/site-insights/ai-usage";
    const query = period ? `?${new URLSearchParams({ period })}` : "";
    return this.request("GET", path + query, undefined, options);
  }
}
