// SubjectExportClient owns per-tenant subject export requests. The download
// surface returns artifact metadata the SDK surfaces only to the caller; its
// object keys are tenant data and must not be logged or echoed into errors.
function exportPath(requestId, action = "") {
    return `/subject-exports/${encodeURIComponent(requestId)}${action}`;
}
function normalizeExport(request) {
    return { ...request, perStoreProgress: request.perStoreProgress ?? [] };
}
export class SubjectExportClient {
    constructor(request) {
        this.request = request;
    }
    async create(body, options) {
        return normalizeExport(await this.request("POST", "/subject-exports", body, options));
    }
    /** Lists the tenant's subject exports, newest first. The server default is 100; it accepts 1 to 1000. */
    async list(limit, options) {
        const query = limit === undefined ? "" : `?${new URLSearchParams({ limit: String(limit) })}`;
        const list = await this.request("GET", `/subject-exports${query}`, undefined, options);
        return { requests: (list.requests ?? []).map(normalizeExport) };
    }
    async get(requestId, options) {
        return normalizeExport(await this.request("GET", exportPath(requestId), undefined, options));
    }
    /** Stops a queued or running export and returns its cancelled status. */
    async cancel(requestId, options) {
        return normalizeExport(await this.request("POST", exportPath(requestId, "/cancel"), undefined, options));
    }
    /** Returns one stored artifact's metadata; scope names the artifact. The object keys are tenant data; do not log them. */
    download(requestId, scope, options) {
        const query = new URLSearchParams({ scope });
        return this.request("GET", `${exportPath(requestId, "/download")}?${query}`, undefined, options);
    }
    /**
     * Restarts a stuck export. The route is system-admin only and names the owning tenant in companySlug;
     * without one the client's actingCompanySlug is sent.
     */
    async force(requestId, options = {}) {
        const { companySlug, ...requestOptions } = options;
        const query = companySlug ? `?${new URLSearchParams({ companySlug })}` : "";
        return normalizeExport(await this.request("POST", `${exportPath(requestId, "/force")}${query}`, undefined, requestOptions));
    }
}
