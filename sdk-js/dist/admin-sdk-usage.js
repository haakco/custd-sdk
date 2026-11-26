/**
 * SDK usage by release, as Custd observes it from the `X-Custd-Sdk` header, and the deprecations
 * Custd announces for a release range.
 */
export class SdkUsageAdminClient {
    constructor(request) {
        this.request = request;
    }
    async list(options) {
        const list = await this.request("GET", "/sdk-usage", undefined, options);
        return { items: list.items ?? [] };
    }
    /** Marks every release of `sdk` within `versionScope` deprecated. */
    putDeprecation(sdk, versionScope, body, options) {
        return this.request("PUT", deprecationPath(sdk, versionScope), body, options);
    }
    deleteDeprecation(sdk, versionScope, options) {
        return this.request("DELETE", deprecationPath(sdk, versionScope), undefined, options);
    }
}
function deprecationPath(sdk, versionScope) {
    return `/sdk-usage/deprecations/${encodeURIComponent(sdk)}/${encodeURIComponent(versionScope)}`;
}
