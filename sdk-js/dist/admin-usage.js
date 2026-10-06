// UsageAdminClient reads attributed usage for the authenticated tenant through
// GET /api/v1/admin/usage/me. The system-admin `/usage` and `/usage/export`
// surfaces are deliberately not exposed here: a tenant client must not depend on
// system-admin filtering.
//
// Usage is server-derived and includes provisional, final, and corrected state.
// `containsProvisional` and `containsIncomplete` are the server's own assessment
// of the returned rows, so a caller deciding whether a number is settled reads
// them rather than assuming every row is final.
/** The row cap the service applies when a request omits a limit. */
export const USAGE_DEFAULT_LIMIT = 500;
/** The most rows the usage endpoint returns in one request. */
export const USAGE_MAX_LIMIT = 5000;
export class UsageAdminClient {
    constructor(request) {
        this.request = request;
    }
    /**
     * Return the attributed usage for the token's own tenant. The tenant is
     * derived from the credential, so the caller never supplies a company slug.
     */
    get(query = {}, options) {
        let params;
        try {
            params = usageQueryParams(query).toString();
        }
        catch (error) {
            return Promise.reject(error);
        }
        return this.request("GET", `/usage/me${params.length > 0 ? `?${params}` : ""}`, undefined, options);
    }
}
function parseInstant(value, field) {
    const parsed = Date.parse(value);
    if (Number.isNaN(parsed)) {
        throw new RangeError(`custd: usage ${field} must be an RFC3339 timestamp`);
    }
    return parsed;
}
/**
 * Build the query string and reject locally what the service would reject
 * anyway, so an invalid window never costs a round trip.
 */
function usageQueryParams(query) {
    if (query.limit !== undefined &&
        (!Number.isInteger(query.limit) || query.limit < 1 || query.limit > USAGE_MAX_LIMIT)) {
        throw new RangeError(`custd: usage limit must be between 1 and ${USAGE_MAX_LIMIT}`);
    }
    const start = query.start === undefined ? undefined : parseInstant(query.start, "start");
    const end = query.end === undefined ? undefined : parseInstant(query.end, "end");
    if (start !== undefined && end !== undefined && start >= end) {
        throw new RangeError("custd: usage start must be before end");
    }
    const params = new URLSearchParams();
    if (query.end !== undefined) {
        params.set("end", query.end);
    }
    if (query.limit !== undefined) {
        params.set("limit", String(query.limit));
    }
    if (query.meterSlug !== undefined) {
        params.set("meter", query.meterSlug);
    }
    if (query.start !== undefined) {
        params.set("start", query.start);
    }
    return params;
}
