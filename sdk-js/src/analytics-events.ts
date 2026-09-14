// AnalyticsEventClient owns the tenant event query: POST /api/v1/analytics/query.
//
// It reads a tenant's own ingested events, including payloads, behind the dedicated
// `events.read` scope. Effective-tenant authority is enforced server-side, so the caller
// never supplies a tenant slug — the credential already names the tenant.

import type { RequestOptions } from "./index.js";

/** Sources the server may answer a query from. */
export type AnalyticsQuerySource = "auto" | "postgres" | "duckdb" | "rollup" | "materialized";

/**
 * One exact tenant-vocabulary key/value filter.
 *
 * The server accepts at most ANALYTICS_MAX_LABEL_FILTERS of these; more is a request
 * error, so the client rejects the overflow before it leaves the process.
 */
export type AnalyticsLabelFilter = {
  key: string;
  value: string;
};

export type AnalyticsEventQueryRequest = {
  /** UTC day to query, formatted YYYY-MM-DD. The server requires this. */
  date: string;
  /** Exact event-type slug to match. */
  eventType?: string;
  /** Maximum rows to return. The server clamps this and reports the applied count. */
  limit?: number;
  source?: AnalyticsQuerySource;
  labelFilters?: AnalyticsLabelFilter[];
};

/**
 * One tenant event.
 *
 * The wire shape is a column bag taken from the underlying parquet schema rather than a
 * fixed struct: the analytics service serialises whatever the writer produced. Naming
 * individual columns here would silently drop any column added later, so the row is
 * surfaced verbatim and callers read the columns they need.
 */
export type AnalyticsEventRow = Record<string, unknown>;

/**
 * How one source contributed to a query.
 *
 * `complete` and `fresh` are the server's own assessment of whether that source answered
 * the whole request and whether its data sat inside the freshness window. They are the
 * authority for how far a result may be trusted, so they are surfaced unchanged; the
 * client must not substitute its own confidence heuristic.
 */
export type AnalyticsEventSourceSummary = {
  name: AnalyticsQuerySource;
  count: number;
  parquetUriCount?: number;
  complete: boolean;
  fresh: boolean;
  queryDurationMs: number;
  freshnessLagMs: number;
  message?: string;
};

/** Server-measured lag and coverage for a query. */
export type AnalyticsEventTiming = {
  eventLagP50Ms: number;
  eventLagP95Ms: number;
  eventLagMaxMs: number;
  queryDurationMs: number;
  oldestEventTimestamp?: string;
  newestEventTimestamp?: string;
  snapshotAgeMs: number;
};

export type AnalyticsEventQueryResponse = {
  results: AnalyticsEventRow[];
  count: number;
  sources: AnalyticsEventSourceSummary[];
  timing: AnalyticsEventTiming;
};

/** The server accepts at most this many label filters on one query. */
export const ANALYTICS_MAX_LABEL_FILTERS = 4;

type AnalyticsRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;

export class AnalyticsEventClient {
  constructor(private readonly request: AnalyticsRequester) {}

  /**
   * Query this tenant's own events.
   *
   * Only the documented public fields are serialised. The service also accepts an
   * internal `anonymousId` exact-subject predicate and a `countOnly` flag, but both are
   * deliberately absent from its public JSON contract, so this client must not transmit
   * them even when a caller passes extra properties.
   */
  query(request: AnalyticsEventQueryRequest, options?: RequestOptions): Promise<AnalyticsEventQueryResponse> {
    const labelFilters = request.labelFilters ?? [];
    if (labelFilters.length > ANALYTICS_MAX_LABEL_FILTERS) {
      return Promise.reject(
        new RangeError(
          `custd: analytics query accepts at most ${ANALYTICS_MAX_LABEL_FILTERS} label filters, received ${labelFilters.length}`,
        ),
      );
    }

    const body: Record<string, unknown> = { date: request.date };
    if (request.eventType !== undefined) {
      body.eventType = request.eventType;
    }
    if (request.limit !== undefined) {
      body.limit = request.limit;
    }
    if (request.source !== undefined) {
      body.source = request.source;
    }
    if (labelFilters.length > 0) {
      body.labelFilters = labelFilters;
    }

    return this.request("POST", "/analytics/query", body, options);
  }
}
