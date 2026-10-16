// DataScopeAdminClient owns parent-owned data-scope management: scopes,
// resources, and explicit principal grants. It is reached through
// client.admin.dataScopes and reuses the admin transport at /api/v1/admin.
//
// The routes are addressed by external UUIDs; the immutable scope/resource
// codes are the selectors event and query traffic use. Client-side checks are
// shape-only — the server is the authority on which principals exist and what
// they may hold.
const DATA_SCOPE_CODE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const DATA_SCOPE_UUID_PATTERN = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
export function validDataScopeCode(value) {
    return value.length >= 1 && value.length <= 128 && DATA_SCOPE_CODE_PATTERN.test(value);
}
export function validDataScopeName(value) {
    const trimmed = value.trim();
    return trimmed.length >= 1 && trimmed.length <= 100;
}
function assertDataScopeCode(value, label) {
    if (!validDataScopeCode(value)) {
        throw new RangeError(`custd: ${label} code must be 1-128 characters matching ${DATA_SCOPE_CODE_PATTERN.source}`);
    }
}
function assertDataScopeName(value, label) {
    if (!validDataScopeName(value)) {
        throw new RangeError(`custd: ${label} name must be 1-100 characters`);
    }
}
function assertDataScopeUpdate(update, label) {
    const hasName = update.name !== undefined;
    const hasStatus = update.status !== undefined;
    if (!hasName && !hasStatus) {
        throw new RangeError(`custd: ${label} update requires a name or a status`);
    }
    if (hasName) {
        assertDataScopeName(update.name, label);
    }
    if (hasStatus && update.status !== "active" && update.status !== "disabled") {
        throw new RangeError(`custd: ${label} status must be "active" or "disabled"`);
    }
}
function assertDataScopePrincipal(principal) {
    const hasUser = principal.userUuid !== undefined;
    const hasClient = principal.clientId !== undefined;
    if (principal.kind === "human") {
        if (!hasUser || hasClient || !DATA_SCOPE_UUID_PATTERN.test(principal.userUuid)) {
            throw new RangeError("custd: a human principal requires userUuid and no clientId");
        }
        return;
    }
    if (principal.kind === "machine") {
        if (!hasClient || hasUser || !validDataScopeCode(principal.clientId)) {
            throw new RangeError("custd: a machine principal requires a bounded clientId and no userUuid");
        }
        return;
    }
    throw new RangeError('custd: data scope principal kind must be "human" or "machine"');
}
function assertDataScopeTarget(target) {
    switch (target.kind) {
        case "parent":
            if (target.scopeUuid !== undefined || target.resourceUuid !== undefined) {
                throw new RangeError("custd: a parent target carries no scope or resource");
            }
            return;
        case "sub_client":
            if (!DATA_SCOPE_UUID_PATTERN.test(target.scopeUuid ?? "") || target.resourceUuid !== undefined) {
                throw new RangeError("custd: a sub_client target requires scopeUuid and no resourceUuid");
            }
            return;
        case "resource":
            if (!DATA_SCOPE_UUID_PATTERN.test(target.scopeUuid ?? "") ||
                !DATA_SCOPE_UUID_PATTERN.test(target.resourceUuid ?? "")) {
                throw new RangeError("custd: a resource target requires scopeUuid and resourceUuid");
            }
            return;
        default:
            throw new RangeError('custd: data scope grant target kind must be "parent", "sub_client" or "resource"');
    }
}
function assertDataScopeGrant(grant) {
    assertDataScopePrincipal(grant.principal);
    assertDataScopeTarget(grant.target);
    if (grant.action !== "read" && grant.action !== "write") {
        throw new RangeError('custd: data scope action must be "read" or "write"');
    }
}
const includeDisabledQuery = (include) => (include ? "?includeDisabled=true" : "");
const resourcePath = (scopeUuid, resourceUuid) => `/data-scopes/${encodeURIComponent(scopeUuid)}/resources/${encodeURIComponent(resourceUuid)}`;
export class DataScopeAdminClient {
    constructor(request) {
        this.request = request;
    }
    async createScope(body) {
        assertDataScopeCode(body.code, "data scope");
        assertDataScopeName(body.name, "data scope");
        return this.request("POST", "/data-scopes", body);
    }
    listScopes(includeDisabled = false) {
        return this.request("GET", `/data-scopes${includeDisabledQuery(includeDisabled)}`);
    }
    getScope(scopeUuid) {
        return this.request("GET", `/data-scopes/${encodeURIComponent(scopeUuid)}`);
    }
    async updateScope(scopeUuid, body) {
        assertDataScopeUpdate(body, "data scope");
        return this.request("PATCH", `/data-scopes/${encodeURIComponent(scopeUuid)}`, body);
    }
    disableScope(scopeUuid) {
        return this.request("POST", `/data-scopes/${encodeURIComponent(scopeUuid)}/disable`);
    }
    async createResource(scopeUuid, body) {
        assertDataScopeCode(body.code, "data scope resource");
        assertDataScopeName(body.name, "data scope resource");
        return this.request("POST", `/data-scopes/${encodeURIComponent(scopeUuid)}/resources`, body);
    }
    listResources(scopeUuid, includeDisabled = false) {
        return this.request("GET", `/data-scopes/${encodeURIComponent(scopeUuid)}/resources${includeDisabledQuery(includeDisabled)}`);
    }
    getResource(scopeUuid, resourceUuid) {
        return this.request("GET", resourcePath(scopeUuid, resourceUuid));
    }
    async updateResource(scopeUuid, resourceUuid, body) {
        assertDataScopeUpdate(body, "data scope resource");
        return this.request("PATCH", resourcePath(scopeUuid, resourceUuid), body);
    }
    disableResource(scopeUuid, resourceUuid) {
        return this.request("POST", `${resourcePath(scopeUuid, resourceUuid)}/disable`);
    }
    async listGrants(principal) {
        assertDataScopePrincipal(principal);
        const params = new URLSearchParams({ kind: principal.kind });
        if (principal.userUuid !== undefined) {
            params.set("userUuid", principal.userUuid);
        }
        if (principal.clientId !== undefined) {
            params.set("clientId", principal.clientId);
        }
        return this.request("GET", `/data-scope-grants?${params.toString()}`);
    }
    async createGrant(grant) {
        assertDataScopeGrant(grant);
        return this.request("POST", "/data-scope-grants", grant);
    }
    async revokeGrant(grant) {
        assertDataScopeGrant(grant);
        return this.request("POST", "/data-scope-grants/revoke", grant);
    }
}
