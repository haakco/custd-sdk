// RetentionClient owns per-tenant retention policies. Effective-tenant
// authority is enforced server-side; wrong-tenant requests return 404.
function policyPath(tenantSlug) {
    return `/retention/policies/${encodeURIComponent(tenantSlug)}`;
}
function policyList(list) {
    return { policies: (list.policies ?? []).map(normalizePolicy) };
}
function normalizePolicy(policy) {
    return { ...policy, lastAffectedCounts: policy.lastAffectedCounts ?? {} };
}
function runPreview(preview) {
    return {
        ...preview,
        perStore: (preview.perStore ?? []).map((store) => ({ ...store, sampleSubjects: store.sampleSubjects ?? [] })),
    };
}
export class RetentionClient {
    constructor(request) {
        this.request = request;
    }
    async list(options) {
        return policyList(await this.request("GET", "/retention/policies", undefined, options));
    }
    async get(tenantSlug, options) {
        return policyList(await this.request("GET", policyPath(tenantSlug), undefined, options));
    }
    async upsert(tenantSlug, body, options) {
        return normalizePolicy(await this.request("PUT", policyPath(tenantSlug), body, options));
    }
    delete(tenantSlug, options) {
        return this.request("DELETE", policyPath(tenantSlug), undefined, options);
    }
    // Preview asks the server to compute a deletion estimate without applying
    // it. The estimate is server-issued; the SDK must surface it verbatim and
    // never round or re-derive the per-store counts.
    async preview(tenantSlug, options) {
        return runPreview(await this.request("POST", `${policyPath(tenantSlug)}/preview`, undefined, options));
    }
    // Apply submits the destructive retention run. The server is the authority
    // for whether deletion actually happens; the SDK must not pre-announce state.
    async apply(tenantSlug, options) {
        return runPreview(await this.request("POST", `${policyPath(tenantSlug)}/apply`, undefined, options));
    }
    // ListRuns returns the retention runs for a single tenant. Empty runs list
    // is the canonical "no runs yet" response, not an error.
    async listRuns(tenantSlug, page = {}, options) {
        const query = new URLSearchParams();
        if (page.limit !== undefined)
            query.set("limit", String(page.limit));
        if (page.offset !== undefined)
            query.set("offset", String(page.offset));
        const suffix = query.toString() ? `?${query}` : "";
        const runs = await this.request("GET", `${policyPath(tenantSlug)}/runs${suffix}`, undefined, options);
        return {
            ...runs,
            runs: (runs.runs ?? []).map((run) => ({ ...run, lastAffectedCounts: run.lastAffectedCounts ?? {} })),
        };
    }
}
