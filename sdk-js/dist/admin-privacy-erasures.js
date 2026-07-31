// PrivacyErasureClient owns per-tenant subject erasure requests. Erasures
// are forward-only: there is no cancel or retry surface because the server
// contract has none. force is the bounded operator action.
export class PrivacyErasureClient {
    constructor(request) {
        this.request = request;
    }
    create(body, options) {
        return this.request("POST", "/privacy/erasures", body, options);
    }
    list(options) {
        return this.request("GET", "/privacy/erasures", undefined, options);
    }
    get(requestUuid, options) {
        return this.request("GET", `/privacy/erasures/${encodeURIComponent(requestUuid)}`, undefined, options);
    }
    force(requestUuid, options) {
        return this.request("POST", `/privacy/erasures/${encodeURIComponent(requestUuid)}/force`, undefined, options);
    }
}
