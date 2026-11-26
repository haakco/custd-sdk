/**
 * OAuth client admissions. A dynamically registered client asks for grants; a tenant administrator
 * reviews the client's metadata, approves the grants it should hold, or revokes it. Every mutation
 * names the revision it was decided against, so a stale decision is rejected.
 */
const admissionsPath = "/oauth-client-admissions";
export class OAuthClientAdmissionAdminClient {
    constructor(request) {
        this.request = request;
    }
    async list(companySlug, options) {
        const path = `${admissionsPath}?companySlug=${encodeURIComponent(companySlug)}`;
        const list = await this.request("GET", path, undefined, options);
        return { admissions: (list.admissions ?? []).map(normalizeAdmission) };
    }
    async review(admissionUuid, body, options) {
        const review = await this.request("POST", `${admissionPath(admissionUuid)}/review`, body, options);
        return {
            admission: normalizeAdmission(review.admission),
            metadata: { ...review.metadata, redirectUris: review.metadata.redirectUris ?? [] },
        };
    }
    approve(admissionUuid, body, options) {
        return this.mutate(`${admissionPath(admissionUuid)}/approve`, body, options);
    }
    revoke(admissionUuid, body, options) {
        return this.mutate(`${admissionPath(admissionUuid)}/revoke`, body, options);
    }
    async mutate(path, body, options) {
        const response = await this.request("POST", path, body, options);
        return { admission: normalizeAdmission(response.admission) };
    }
}
function admissionPath(admissionUuid) {
    return `${admissionsPath}/${encodeURIComponent(admissionUuid)}`;
}
function normalizeGrants(grants) {
    return (grants ?? []).map((grant) => ({ ...grant, scopes: grant.scopes ?? [] }));
}
function normalizeAdmission(admission) {
    return {
        ...admission,
        requestedGrants: normalizeGrants(admission.requestedGrants),
        approvedGrants: normalizeGrants(admission.approvedGrants),
    };
}
