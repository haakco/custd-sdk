export class ClientSetupClient {
    constructor(request) {
        this.request = request;
    }
    apply(tenantSlug, manifest, options) {
        return this.request("PUT", `/tenant-manifest/${encodeURIComponent(tenantSlug)}`, manifest, options);
    }
    readiness(tenantSlug, options) {
        return this.request("GET", `/tenant-manifest/${encodeURIComponent(tenantSlug)}/readiness`, undefined, options);
    }
}
