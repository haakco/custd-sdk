// AnalyticsEventClient owns the tenant event query: POST /api/v1/analytics/query.
//
// It reads a tenant's own ingested events, including payloads, behind the dedicated
// `events.read` scope. Effective-tenant authority is enforced server-side, so the caller
// never supplies a tenant slug — the credential already names the tenant.
import { optionalInteger, optionalRecord, optionalString, requireBoolean, requireInteger, requireObjectList, requireRecord, requireString, } from "./response-validation.js";
const ANALYTICS_RANGE_QUERY_SOURCES = ["", "auto", "duckdb"];
/** The longest inclusive range the service accepts, in days. */
export const ANALYTICS_MAX_RANGE_DAYS = 120;
/** The only bucket granularity the service supports today. */
export const ANALYTICS_RANGE_GROUP_BY = "day";
/** The server accepts at most this many label filters on one query. */
export const ANALYTICS_MAX_LABEL_FILTERS = 4;
export class AnalyticsEventClient {
    constructor(request) {
        this.request = request;
    }
    /**
     * Query this tenant's own events.
     *
     * Only the documented public fields are serialised. The service also accepts an
     * internal `anonymousId` exact-subject predicate and a `countOnly` flag, but both are
     * deliberately absent from its public JSON contract, so this client must not transmit
     * them even when a caller passes extra properties.
     */
    query(request, options) {
        const labelFilters = request.labelFilters ?? [];
        if (labelFilters.length > ANALYTICS_MAX_LABEL_FILTERS) {
            return Promise.reject(new RangeError(`custd: analytics query accepts at most ${ANALYTICS_MAX_LABEL_FILTERS} label filters, received ${labelFilters.length}`));
        }
        const body = { date: request.date };
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
    async queryRange(request, options) {
        const labelFilters = request.labelFilters ?? [];
        if (labelFilters.length > ANALYTICS_MAX_LABEL_FILTERS) {
            throw new RangeError(`custd: analytics range query accepts at most ${ANALYTICS_MAX_LABEL_FILTERS} label filters, received ${labelFilters.length}`);
        }
        if (request.groupBy !== undefined && request.groupBy !== ANALYTICS_RANGE_GROUP_BY) {
            throw new RangeError(`custd: analytics range query groupBy must be "${ANALYTICS_RANGE_GROUP_BY}"`);
        }
        if (request.source !== undefined && !ANALYTICS_RANGE_QUERY_SOURCES.includes(request.source)) {
            throw new RangeError(`custd: analytics range query source must be one of ${ANALYTICS_RANGE_QUERY_SOURCES.filter((value) => value !== "").join(", ")}`);
        }
        assertRangeWithinLimit(request.from, request.to);
        const body = { from: request.from, to: request.to };
        if (request.eventType !== undefined) {
            body.eventType = request.eventType;
        }
        if (request.limit !== undefined) {
            body.limit = request.limit;
        }
        if (request.source !== undefined && request.source !== "") {
            body.source = request.source;
        }
        if (request.groupBy !== undefined) {
            body.groupBy = request.groupBy;
        }
        if (labelFilters.length > 0) {
            body.labelFilters = labelFilters;
        }
        const value = await this.request("POST", "/analytics/query-range", body, options);
        return assertRangeQueryResponse(value);
    }
}
/** Reject locally what the service would reject anyway, so it never costs a round trip. */
function assertRangeWithinLimit(from, to) {
    const fromMs = parseUTCDay(from, "from");
    const toMs = parseUTCDay(to, "to");
    if (toMs < fromMs) {
        throw new RangeError("custd: analytics range query to must not be before from");
    }
    const days = Math.round((toMs - fromMs) / 86400000) + 1;
    if (days > ANALYTICS_MAX_RANGE_DAYS) {
        throw new RangeError(`custd: analytics range query spans ${days} days, the maximum is ${ANALYTICS_MAX_RANGE_DAYS}`);
    }
}
function parseUTCDay(value, field) {
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
// assertRangeQueryResponse validates the named range response DTO. The service
// emits every required field, so a truncated or wrongly shaped body fails here
// instead of surfacing as a zero-valued result.
function assertRangeQueryResponse(value) {
    const context = "analytics range response";
    const response = requireRecord(value, context);
    for (const [index, row] of requireObjectList(response, "rows", context).entries()) {
        // A row is an open column bag, but `payload` is a declared object field, so
        // a present null or array fails instead of being passed through.
        optionalRecord(row, "payload", `${context} rows[${index}]`);
    }
    requireInteger(response, "count", context);
    for (const [index, bucket] of requireObjectList(response, "buckets", context).entries()) {
        const bucketContext = `${context} buckets[${index}]`;
        requireString(bucket, "date", bucketContext);
        requireInteger(bucket, "count", bucketContext);
        requireString(bucket, "source", bucketContext);
        requireBoolean(bucket, "complete", bucketContext);
        requireInteger(bucket, "queryDurationMs", bucketContext);
        optionalInteger(bucket, "parquetUriCount", bucketContext);
        optionalString(bucket, "message", bucketContext);
    }
    for (const [index, source] of requireObjectList(response, "sources", context).entries()) {
        const sourceContext = `${context} sources[${index}]`;
        requireString(source, "name", sourceContext);
        requireInteger(source, "count", sourceContext);
        requireBoolean(source, "complete", sourceContext);
        requireBoolean(source, "fresh", sourceContext);
        requireInteger(source, "queryDurationMs", sourceContext);
        requireInteger(source, "freshnessLagMs", sourceContext);
        optionalInteger(source, "parquetUriCount", sourceContext);
        optionalString(source, "message", sourceContext);
    }
    const timing = requireRecord(response.timing, `${context} timing`);
    requireInteger(timing, "eventLagP50Ms", `${context} timing`);
    requireInteger(timing, "eventLagP95Ms", `${context} timing`);
    requireInteger(timing, "eventLagMaxMs", `${context} timing`);
    requireInteger(timing, "queryDurationMs", `${context} timing`);
    requireInteger(timing, "snapshotAgeMs", `${context} timing`);
    optionalString(timing, "oldestEventTimestamp", `${context} timing`);
    optionalString(timing, "newestEventTimestamp", `${context} timing`);
    return response;
}
