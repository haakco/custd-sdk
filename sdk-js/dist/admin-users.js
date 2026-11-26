/**
 * Tenant administrator users and their roles. A user has a global identity state and a
 * per-company membership state, reported separately: disabling an identity and ending a
 * membership are different decisions.
 */
/** The roles a tenant membership can carry. */
export const ADMIN_USER_ROLES = {
    tenantAdmin: "tenant_admin",
    tenantIngestManager: "tenant_ingest_manager",
    tenantAnalyst: "tenant_analyst",
};
export const ADMIN_USER_GLOBAL_STATES = { enabled: "enabled", suspended: "suspended" };
export const ADMIN_USER_MEMBERSHIP_STATES = { active: "active", ended: "ended" };
const usersPath = "/users";
export class AdminUserAdminClient {
    constructor(request) {
        this.request = request;
    }
    async list(query = {}, options) {
        const response = await this.request("GET", withQuery(usersPath, query), undefined, options);
        return { users: response.users ?? [] };
    }
    /** The roles a membership can be given. */
    async listRoles(options) {
        const response = await this.request("GET", "/user-roles", undefined, options);
        return { roles: response.roles ?? [] };
    }
    get(userUuid, scope = {}, options) {
        return this.request("GET", withQuery(userPath(userUuid), scope), undefined, options);
    }
    /** Creates a user with a membership in one company and queues the welcome notification. */
    create(body, options) {
        return this.request("POST", usersPath, body, options);
    }
    /** Replaces the user's roles in one company. */
    update(userUuid, body, companySlug, options) {
        return this.request("PUT", withQuery(userPath(userUuid), { companySlug }), body, options);
    }
    disable(userUuid, request = {}, options) {
        const { reason, ...query } = request;
        const body = reason === undefined ? undefined : { reason };
        return this.request("POST", withQuery(`${userPath(userUuid)}/disable`, query), body, options);
    }
    enable(userUuid, request, options) {
        const { roles, ...query } = request;
        return this.request("POST", withQuery(`${userPath(userUuid)}/enable`, query), { roles }, options);
    }
    /** Adds an existing user to another company with the given roles. */
    addMembership(userUuid, body, options) {
        return this.request("POST", `${userPath(userUuid)}/memberships`, body, options);
    }
    async resetPassword(userUuid, scope = {}, options) {
        const path = withQuery(`${userPath(userUuid)}/reset-password`, scope);
        const reset = await this.request("POST", path, undefined, options);
        return { messageUuid: reset.messageUuid, deliveryUuids: reset.deliveryUuids ?? [] };
    }
    /** Removes the user's access in one company while keeping the record. */
    softDelete(userUuid, companySlug, body, options) {
        return this.request("POST", withQuery(`${userPath(userUuid)}/soft-delete`, { companySlug }), body, options);
    }
    /** Reverses a soft delete in one company. */
    restore(userUuid, companySlug, body, options) {
        return this.request("POST", withQuery(`${userPath(userUuid)}/restore`, { companySlug }), body, options);
    }
    /** Re-sends the welcome notification. */
    retryWelcome(userUuid, scope = {}, options) {
        return this.request("POST", withQuery(`${userPath(userUuid)}/retry-welcome`, scope), undefined, options);
    }
}
function userPath(userUuid) {
    return `${usersPath}/${encodeURIComponent(userUuid)}`;
}
function withQuery(path, query) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === "" || value === false)
            continue;
        params.set(key, String(value));
    }
    const encoded = params.toString();
    return encoded ? `${path}?${encoded}` : path;
}
