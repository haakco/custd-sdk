/**
 * Accepted-event landing claims: the durable objects ingest landed for a tenant and their processing
 * state. An operator can retry a claim or mark it terminal with a failure class.
 */
export class IngestClaimAdminClient {
    constructor(request) {
        this.request = request;
    }
    async list(tenantSlug, limit, options) {
        const query = limit === undefined ? "" : `?limit=${encodeURIComponent(String(limit))}`;
        const list = await this.request("GET", `${tenantPath(tenantSlug)}${query}`, undefined, options);
        return { ...list, claims: list.claims ?? [] };
    }
    retry(tenantSlug, objectUuid, options) {
        return this.request("POST", `${claimPath(tenantSlug, objectUuid)}/retry`, undefined, options);
    }
    markTerminal(tenantSlug, objectUuid, body, options) {
        return this.request("POST", `${claimPath(tenantSlug, objectUuid)}/terminal`, body, options);
    }
}
function tenantPath(tenantSlug) {
    return `/ingest/claims/${encodeURIComponent(tenantSlug)}`;
}
function claimPath(tenantSlug, objectUuid) {
    return `${tenantPath(tenantSlug)}/${encodeURIComponent(objectUuid)}`;
}
