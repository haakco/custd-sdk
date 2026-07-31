// RetentionClient owns per-tenant retention policies. Effective-tenant
// authority is enforced server-side; wrong-tenant requests return 404.
export class RetentionClient {
    constructor(request) {
        this.request = request;
    }
    list(options) {
        return this.request("GET", "/retention/policies", undefined, options);
    }
    get(tenantSlug, options) {
        return this.request("GET", `/retention/policies/${encodeURIComponent(tenantSlug)}`, undefined, options);
    }
    upsert(tenantSlug, body, options) {
        return this.request("PUT", `/retention/policies/${encodeURIComponent(tenantSlug)}`, body, options);
    }
    delete(tenantSlug, options) {
        return this.request("DELETE", `/retention/policies/${encodeURIComponent(tenantSlug)}`, undefined, options);
    }
    // Preview asks the server to compute a deletion estimate without applying
    // it. The estimate is server-issued; the SDK must surface it verbatim and
    // never round or re-derive the per-store counts.
    preview(tenantSlug, options) {
        return this.request("POST", `/retention/policies/${encodeURIComponent(tenantSlug)}/preview`, undefined, options);
    }
    // Apply submits the destructive retention run. The server is the authority
    // for whether deletion actually happens; the SDK must not pre-announce state.
    apply(tenantSlug, options) {
        return this.request("POST", `/retention/policies/${encodeURIComponent(tenantSlug)}/apply`, undefined, options);
    }
    // ListRuns returns the retention runs for a single tenant. Empty runs list
    // is the canonical "no runs yet" response, not an error.
    listRuns(tenantSlug, options) {
        return this.request("GET", `/retention/policies/${encodeURIComponent(tenantSlug)}/runs`, undefined, options);
    }
}
