/**
 * The tenant's environment policy: which environment values are active, which are disabled, whether
 * new values are created automatically, and why the policy is in its current state.
 */
export class EnvironmentPolicyAdminClient {
    constructor(request) {
        this.request = request;
    }
    async get(companySlug, options) {
        return normalizePolicy(await this.request("GET", policyPath(companySlug), undefined, options));
    }
    async update(body, companySlug, options) {
        return normalizePolicy(await this.request("PATCH", policyPath(companySlug), body, options));
    }
}
function policyPath(companySlug) {
    return companySlug ? `/environment-policy?companySlug=${encodeURIComponent(companySlug)}` : "/environment-policy";
}
function normalizePolicy(policy) {
    return {
        ...policy,
        activeValues: policy.activeValues ?? [],
        disabledValues: policy.disabledValues ?? [],
        reasons: policy.reasons ?? [],
    };
}
