/**
 * Accounting evidence: the purchases, balances and corrections a tenant records against a metered
 * quantity. A correction supersedes or targets an earlier record instead of editing it.
 */
const evidencePath = "/accounting/evidence";
export class AccountingEvidenceAdminClient {
    constructor(request) {
        this.request = request;
    }
    async list(query = {}, options) {
        const params = new URLSearchParams();
        if (query.asOf !== undefined)
            params.set("asOf", query.asOf);
        if (query.limit !== undefined)
            params.set("limit", String(query.limit));
        const encoded = params.toString();
        const path = encoded ? `${evidencePath}?${encoded}` : evidencePath;
        const list = await this.request("GET", path, undefined, options);
        return { evidence: list.evidence ?? [] };
    }
    create(body, options) {
        return this.request("POST", evidencePath, body, options);
    }
}
