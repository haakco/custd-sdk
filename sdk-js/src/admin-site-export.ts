// Everything Site Insights holds for one domain and its Site, as the tenant's
// own typed reads return it. Daily search metrics are paged separately.
// SiteDomainAdminClient sends the calls.

import type { SiteCampaignLinkList } from "./admin-site-campaign-links.js";
import type { SiteDomain, SiteFindingList, SiteIncidentList, SiteSearchProvider } from "./admin-site-domains.js";
import type {
  IndexNowState,
  SiteLighthouseHistory,
  SiteProjectContext,
  SiteSearchInspectionList,
  SiteUptimeHistory,
} from "./admin-site-insights.js";
import type { SiteRankings } from "./admin-site-rankings.js";
import type { SavedSiteReport } from "./admin-site-saved-reports.js";
import type { SiteKeywordLists, SiteTopicTrends, SiteWebDomains } from "./admin-site-web-data.js";

/** The schema an export names; a different value is a different shape. */
export const SITE_INSIGHTS_EXPORT_SCHEMA = "custd.site-insights-export.v1";
/** The most search metric rows one listExportSearchMetrics page returns. */
export const SITE_INSIGHTS_EXPORT_SEARCH_METRICS_MAX_LIMIT = 10000;

/** The search metric dimension a row is cut by; newer values may appear. */
export const SiteSearchMetricDimension = {
  Total: "total",
  Page: "page",
  Query: "query",
  Country: "country",
  Device: "device",
} as const;

export type SiteInsightsMonitoringExport = {
  findings: SiteFindingList;
  findingRows: number;
  incidents: SiteIncidentList;
  uptime: SiteUptimeHistory;
  lighthouse: SiteLighthouseHistory[];
};

/** metricRows is how many rows listExportSearchMetrics pages through. */
export type SiteInsightsSearchExport = {
  rankings: SiteRankings;
  inspections: SiteSearchInspectionList;
  indexNow: IndexNowState;
  metricRows: number;
};

export type SiteInsightsReportsExport = {
  savedReports: SavedSiteReport[];
  campaignLinks: SiteCampaignLinkList;
};

export type SiteInsightsSiteExport = {
  projectContext: SiteProjectContext;
  keywordLists: SiteKeywordLists;
  webDomains: SiteWebDomains;
  topicTrends: SiteTopicTrends;
};

export type SiteInsightsExport = {
  /** SITE_INSIGHTS_EXPORT_SCHEMA. */
  schema: string;
  exportedAt: string;
  domain: SiteDomain;
  monitoring: SiteInsightsMonitoringExport;
  search: SiteInsightsSearchExport;
  reports: SiteInsightsReportsExport;
  site: SiteInsightsSiteExport;
};

/** One day's search numbers for one dimension key; key is empty for the total. */
export type SiteSearchMetricDay = {
  provider: SiteSearchProvider;
  /** YYYY-MM-DD. */
  day: string;
  /** A SiteSearchMetricDimension value. */
  dimension: string;
  key: string;
  clicks: number;
  impressions: number;
  avgPosition: number;
};

export type SiteSearchMetricPage = {
  domainUuid: string;
  offset: number;
  limit: number;
  total: number;
  rows: SiteSearchMetricDay[];
};

/** listExportSearchMetrics' page; limit is 1..SITE_INSIGHTS_EXPORT_SEARCH_METRICS_MAX_LIMIT. */
export type SiteSearchMetricsQuery = {
  offset?: number;
  limit?: number;
};
