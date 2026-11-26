// TenantStorageClient manages the caller tenant's storage locations. The server derives the tenant
// from the credential and assigns every location's bucket, root prefix and isolation tier; the caller
// chooses none of them.
export class TenantStorageClient {
    constructor(request) {
        this.request = request;
    }
    /** Lists the caller tenant's locations; another tenant's are never visible. */
    async list(options) {
        const list = await this.request("GET", "/tenant-storage-locations", undefined, options);
        return { locations: list.locations ?? [] };
    }
    /** Asks the server to assign the caller tenant a new location. */
    create(options) {
        return this.request("POST", "/tenant-storage-locations", {}, options);
    }
    get(id, options) {
        return this.request("GET", `/tenant-storage-locations/${id}`, undefined, options);
    }
    /** Revokes a location. The server decides when its prefix stops being usable. */
    revoke(id, options) {
        return this.request("DELETE", `/tenant-storage-locations/${id}`, undefined, options);
    }
}
