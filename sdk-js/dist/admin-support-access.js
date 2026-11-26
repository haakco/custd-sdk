/**
 * Time-boxed support access grants: a tenant lets a HaakCo operator into its data for a stated
 * reason until a stated time, and can revoke the grant early.
 */
const grantsPath = "/support-access";
export class SupportAccessAdminClient {
    constructor(request) {
        this.request = request;
    }
    async list(companySlug, options) {
        const path = companySlug ? `${grantsPath}?companySlug=${encodeURIComponent(companySlug)}` : grantsPath;
        const list = await this.request("GET", path, undefined, options);
        return { grants: list.grants ?? [] };
    }
    create(body, options) {
        return this.request("POST", grantsPath, body, options);
    }
    revoke(supportAccessGrantUuid, options) {
        return this.request("POST", `${grantsPath}/${encodeURIComponent(supportAccessGrantUuid)}/revoke`, undefined, options);
    }
}
