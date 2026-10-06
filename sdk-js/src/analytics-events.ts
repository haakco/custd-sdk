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
 * The wire shape is an extensible column bag, but the canonical event payload is always
 * a JSON object. Custd normalises its internal Parquet representation at the API boundary
 * so consumers never need to parse an escaped JSON string.
 */
export type AnalyticsEventRow = {
  payload?: Record<string, unknown>;
  [column: string]: unknown;
};

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

/** The longest inclusive range the service accepts, in days. */
export const ANALYTICS_MAX_RANGE_DAYS = 120;

/** The only bucket granularity the service supports today. */
export const ANALYTICS_RANGE_GROUP_BY = "day";

export type AnalyticsEventRangeQueryRequest = {
  /** Inclusive range start, formatted YYYY-MM-DD. The server requires this. */
  from: string;
  /** Inclusive range end, formatted YYYY-MM-DD. The server requires this. */
  to: string;
  /** Exact event-type slug to match. */
  eventType?: string;
  /** Maximum rows across the whole range. The server clamps this and reports the applied count. */
  limit?: number;
  source?: AnalyticsQuerySource;
  /** Bucket granularity. Omit, or set to {@link ANALYTICS_RANGE_GROUP_BY}. */
  groupBy?: typeof ANALYTICS_RANGE_GROUP_BY;
  labelFilters?: AnalyticsLabelFilter[];
};

/**
 * One day's coverage inside a range query.
 *
 * `complete` is the server's own assessment of whether that day's source answered the
 * whole request, so it is surfaced unchanged; the client must not substitute its own
 * confidence heuristic.
 */
export type AnalyticsEventRangeBucket = {
  date: string;
  count: number;
  source: AnalyticsQuerySource;
  complete: boolean;
  queryDurationMs: number;
  parquetUriCount?: number;
  message?: string;
};

export type AnalyticsEventRangeQueryResponse = {
  rows: AnalyticsEventRow[];
  count: number;
  buckets: AnalyticsEventRangeBucket[];
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

  /**
   * Query this tenant's own events across an inclusive date range.
   *
   * Only the documented public fields are serialised. As with {@link query}, the internal
   * `anonymousId` predicate and `countOnly` flag are absent from the service's public JSON
   * contract and cannot be transmitted by a caller passing extra properties.
   */
  async queryRange(
    request: AnalyticsEventRangeQueryRequest,
    options?: RequestOptions,
  ): Promise<AnalyticsEventRangeQueryResponse> {
    const labelFilters = request.labelFilters ?? [];
    if (labelFilters.length > ANALYTICS_MAX_LABEL_FILTERS) {
      throw new RangeError(
        `custd: analytics range query accepts at most ${ANALYTICS_MAX_LABEL_FILTERS} label filters, received ${labelFilters.length}`,
      );
    }
    if (request.groupBy !== undefined && request.groupBy !== ANALYTICS_RANGE_GROUP_BY) {
      throw new RangeError(`custd: analytics range query groupBy must be "${ANALYTICS_RANGE_GROUP_BY}"`);
    }
    assertRangeWithinLimit(request.from, request.to);

    const body: Record<string, unknown> = { from: request.from, to: request.to };
    if (request.eventType !== undefined) {
      body.eventType = request.eventType;
    }
    if (request.limit !== undefined) {
      body.limit = request.limit;
    }
    if (request.source !== undefined) {
      body.source = request.source;
    }
    if (request.groupBy !== undefined) {
      body.groupBy = request.groupBy;
    }
    if (labelFilters.length > 0) {
      body.labelFilters = labelFilters;
    }

    return this.request("POST", "/analytics/query-range", body, options);
  }
}

/** Reject locally what the service would reject anyway, so it never costs a round trip. */
function assertRangeWithinLimit(from: string, to: string): void {
  const fromMs = parseUTCDay(from, "from");
  const toMs = parseUTCDay(to, "to");
  if (toMs < fromMs) {
    throw new RangeError("custd: analytics range query to must not be before from");
  }
  const days = Math.round((toMs - fromMs) / 86_400_000) + 1;
  if (days > ANALYTICS_MAX_RANGE_DAYS) {
    throw new RangeError(`custd: analytics range query spans ${days} days, the maximum is ${ANALYTICS_MAX_RANGE_DAYS}`);
  }
}

function parseUTCDay(value: string, field: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match === null) {
    throw new RangeError(`custd: analytics range query ${field} must be YYYY-MM-DD`);
  }
  const ms = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (new Date(ms).toISOString().slice(0, 10) !== value) {
    throw new RangeError(`custd: analytics range query ${field} must be YYYY-MM-DD`);
  }
  return ms;
}
