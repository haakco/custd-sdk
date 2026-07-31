// TenantStorageClient owns tenant-scoped storage location registration.
// Locations are server-prefixed: the SDK submits clientLocation and the
// server returns a serverAssignedPrefix that the SDK must use for raw
// landing writes. Tenant is derived from the auth context; wrong-tenant
// reads collapse to an empty list indistinguishable from "no locations".
export class TenantStorageClient {
    constructor(request) {
        this.request = request;
    }
    list(options) {
        return this.request("GET", "/tenant-storage-locations", undefined, options);
    }
    create(body, options) {
        return this.request("POST", "/tenant-storage-locations", body, options);
    }
    get(id, options) {
        return this.request("GET", `/tenant-storage-locations/${encodeURIComponent(id)}`, undefined, options);
    }
    // Revoke removes a tenant storage location. The server is the authority for
    // whether the prefix is immediately unusable; the SDK must not assume
    // partial deletes are atomic.
    revoke(id, options) {
        return this.request("DELETE", `/tenant-storage-locations/${encodeURIComponent(id)}`, undefined, options);
    }
}
