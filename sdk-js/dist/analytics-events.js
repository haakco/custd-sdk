// AnalyticsEventClient owns the tenant event query: POST /api/v1/analytics/query.
//
// It reads a tenant's own ingested events, including payloads, behind the dedicated
// `events.read` scope. Effective-tenant authority is enforced server-side, so the caller
// never supplies a tenant slug — the credential already names the tenant.
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
        assertRangeWithinLimit(request.from, request.to);
        const body = { from: request.from, to: request.to };
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
