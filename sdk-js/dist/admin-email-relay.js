/**
 * A tenant's outbound email relay. Without an enabled, complete relay the tenant's mail goes through
 * Custd's shared relay. The password is write-only: reads report only whether one is stored.
 */
export class EmailRelayAdminClient {
    constructor(request) {
        this.request = request;
    }
    get(tenantSlug) {
        return this.request("GET", relayPath(tenantSlug));
    }
    put(tenantSlug, body) {
        return this.request("PUT", relayPath(tenantSlug), body);
    }
    delete(tenantSlug) {
        return this.request("DELETE", relayPath(tenantSlug));
    }
    async testSend(tenantSlug, body) {
        const result = await this.request("POST", `${relayPath(tenantSlug)}/test-send`, body);
        return { ...result, deliveryUuids: result.deliveryUuids ?? [] };
    }
}
function relayPath(tenantSlug) {
    return `/email-relay/${encodeURIComponent(tenantSlug)}`;
}
