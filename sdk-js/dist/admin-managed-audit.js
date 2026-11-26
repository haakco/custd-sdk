/**
 * Managed audit producer provisioning: the provisioning broker mints a producer credential for a
 * managed-audit tenant. The request and the returned bundle are the producer-provisioning contract.
 */
export class ManagedAuditAdminClient {
    constructor(request) {
        this.request = request;
    }
    /** The returned bundle holds the client secret; it is shown only once. */
    provisionProducer(body, options) {
        return this.request("POST", "/managed-audit/provision", body, options);
    }
}
