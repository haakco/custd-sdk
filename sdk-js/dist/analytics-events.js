// AnalyticsEventClient owns the tenant event query: POST /api/v1/analytics/query.
//
// It reads a tenant's own ingested events, including payloads, behind the dedicated
// `events.read` scope. Effective-tenant authority is enforced server-side, so the caller
// never supplies a tenant slug — the credential already names the tenant.
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
}
