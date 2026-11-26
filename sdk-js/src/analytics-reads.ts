/**
 * Tenant analytics reads beside the event query: the realtime active-visitor count, the
 * stored-event dashboard summary and the per-day event count. The credential names the tenant.
 */

/** How many sessions were active on one site within the window. */
export type AnalyticsActiveNow = { activeNow: number; windowSeconds: number };

export type AnalyticsDashboardTenant = { companySlug: string };

/** The tenant's stored events. The timestamps are null while nothing is stored. */
export type AnalyticsDashboardEvents = {
  total: number;
  oldestEventAt: string | null;
  latestEventAt: string | null;
  latestReceivedAt: string | null;
  loadedDayCount: number;
};

/** The span of days with stored events. */
export type AnalyticsDashboardCoverage = { firstDay: string; lastDay: string; loadedDayCount: number };

/** One stored day and its archive state. */
export type AnalyticsDashboardLoadedDay = {
  date: string;
  eventCount: number;
  archiveStatus: string;
  archiveVerifiedAt: string | null;
  queryHref: string;
};

/** One internal source's delivery health. */
export type AnalyticsDashboardDogfoodSource = {
  sourceSystem: string;
  sourceCompany: string;
  environment: string;
  eventCount: number;
  latestEventAt: string | null;
  latestEventType: string;
  failureCount: number;
  rejectionCount: number;
  status: string;
};

/** One internal operational metric. */
export type AnalyticsDashboardDogfoodMetric = {
  sourceSystem: string;
  service: string;
  metricName: string;
  metricKind: string;
  value: number;
  unit: string;
  windowStart: string | null;
  windowEnd: string | null;
  route?: string;
  status?: string;
};

/** The internal dogfood view; empty for client tenants. */
export type AnalyticsDashboardDogfood = {
  sources: AnalyticsDashboardDogfoodSource[];
  metrics: AnalyticsDashboardDogfoodMetric[];
};

/** The tenant's stored-event overview. */
export type AnalyticsDashboardSummary = {
  tenant: AnalyticsDashboardTenant;
  events: AnalyticsDashboardEvents;
  coverage: AnalyticsDashboardCoverage;
  loadedDays: AnalyticsDashboardLoadedDay[];
  dogfood: AnalyticsDashboardDogfood;
  generatedAt: string;
};

/** Counts the tenant's events on one UTC day (YYYY-MM-DD), optionally of one event type. */
export type AnalyticsEventCountQuery = { date: string; eventType?: string };

export type AnalyticsEventCount = { count: number };
