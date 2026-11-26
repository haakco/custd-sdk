/**
 * What a company's machine credentials (OAuth clients) may do, per feature area, for the whole
 * company and for each machine. The policy only narrows: an allowed area still needs the client's
 * own scopes, and a blocked area refuses that company's machines with a problem coded
 * `machine_access_blocked` whose `machineAccess` member names the setting.
 */
export const MACHINE_ACCESS_AREAS = {
    sites: "sites",
    reporting: "reporting",
    privacyErasure: "privacy_erasure",
    destructiveJobs: "destructive_jobs",
    usersAccess: "users_access",
    provisioning: "provisioning_credentials",
    ingestSchemas: "ingest_schemas",
    usageBilling: "usage_billing",
};
/** A company setting is allowed or blocked; a machine override may also inherit the company's. */
export const MACHINE_ACCESS_STATES = { allowed: "allowed", blocked: "blocked", inherit: "inherit" };
/** The setting that decided an area, or that refused a request. */
export const MACHINE_ACCESS_DECIDED_BY = {
    company: "company",
    machine: "machine",
    /** The target company's "Allow Custd support automation" setting, for Custd's platform operator machine. */
    supportAutomation: "support_automation",
};
/** Problem codes of a machine access refusal; `unavailable` is a bounded retry, not a setting to change. */
export const MACHINE_ACCESS_PROBLEM_CODES = {
    blocked: "machine_access_blocked",
    unavailable: "machine_access_unavailable",
};
export class MachineAccessAdminClient {
    constructor(request) {
        this.request = request;
    }
    /** A tenant administrator omits companySlug; platform authority names the company. */
    get(companySlug, options) {
        return this.request("GET", companyPath(companySlug), undefined, options);
    }
    update(body, companySlug, options) {
        return this.request("PUT", companyPath(companySlug), body, options);
    }
    /** The machine's own company is the scope. */
    getOverride(clientId, options) {
        return this.request("GET", clientPath(clientId), undefined, options);
    }
    updateOverride(clientId, body, options) {
        return this.request("PUT", clientPath(clientId), body, options);
    }
    getEffective(clientId, options) {
        return this.request("GET", clientPath(clientId, "/effective"), undefined, options);
    }
}
function companyPath(companySlug) {
    return companySlug ? `/machine-access?companySlug=${encodeURIComponent(companySlug)}` : "/machine-access";
}
function clientPath(clientId, suffix = "") {
    return `/machine-access/clients/${encodeURIComponent(clientId)}${suffix}`;
}
