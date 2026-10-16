// DataScopeAdminClient owns parent-owned data-scope management: scopes,
// resources, and explicit principal grants. It is reached through
// client.admin.dataScopes and reuses the admin transport at /api/v1/admin.
//
// The routes are addressed by external UUIDs; the immutable scope/resource
// codes are the selectors event and query traffic use. Client-side checks are
// shape-only — the server is the authority on which principals exist and what
// they may hold.

import type { RequestOptions } from "./index.js";

/** The closed lifecycle state of a scope or resource. */
export type DataScopeStatus = "active" | "disabled";

/** The closed discriminator between the two principals that can hold a grant. */
export type DataScopePrincipalKind = "human" | "machine";

/** What a grant covers. */
export type DataScopeGrantTargetKind = "parent" | "sub_client" | "resource";

/** A closed data action. */
export type DataScopeAction = "read" | "write";

export type DataScope = {
  uuid: string;
  code: string;
  name: string;
  status: DataScopeStatus;
  createdAt: string;
  updatedAt: string;
};

export type DataScopeListResponse = { scopes: DataScope[] };

export type DataScopeCreateRequest = { code: string; name: string };

/** Both fields are optional, but at least one must be present. */
export type DataScopeUpdateRequest = { name?: string; status?: DataScopeStatus };

export type DataScopeResource = {
  uuid: string;
  scopeUuid: string;
  code: string;
  name: string;
  status: DataScopeStatus;
  createdAt: string;
  updatedAt: string;
};

export type DataScopeResourceListResponse = { resources: DataScopeResource[] };

export type DataScopeResourceCreateRequest = { code: string; name: string };

export type DataScopeResourceUpdateRequest = { name?: string; status?: DataScopeStatus };

/**
 * The verified principal a grant belongs to. A human is its stable membership
 * user UUID; a machine is its producer client ID.
 */
export type DataScopePrincipalRef = {
  kind: DataScopePrincipalKind;
  userUuid?: string;
  clientId?: string;
};

export type DataScopeGrantTarget = {
  kind: DataScopeGrantTargetKind;
  scopeUuid?: string;
  resourceUuid?: string;
};

/** One principal's grant over one explicit target and action. */
export type DataScopeGrant = {
  principal: DataScopePrincipalRef;
  target: DataScopeGrantTarget;
  action: DataScopeAction;
};

export type DataScopeGrantListResponse = { grants: DataScopeGrant[] };

const DATA_SCOPE_CODE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const DATA_SCOPE_UUID_PATTERN = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export function validDataScopeCode(value: string): boolean {
  return value.length >= 1 && value.length <= 128 && DATA_SCOPE_CODE_PATTERN.test(value);
}

export function validDataScopeName(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length >= 1 && trimmed.length <= 100;
}

function assertDataScopeCode(value: string, label: string): void {
  if (!validDataScopeCode(value)) {
    throw new RangeError(`custd: ${label} code must be 1-128 characters matching ${DATA_SCOPE_CODE_PATTERN.source}`);
  }
}

function assertDataScopeName(value: string, label: string): void {
  if (!validDataScopeName(value)) {
    throw new RangeError(`custd: ${label} name must be 1-100 characters`);
  }
}

function assertDataScopeUpdate(update: DataScopeUpdateRequest, label: string): void {
  const hasName = update.name !== undefined;
  const hasStatus = update.status !== undefined;
  if (!hasName && !hasStatus) {
    throw new RangeError(`custd: ${label} update requires a name or a status`);
  }
  if (hasName) {
    assertDataScopeName(update.name as string, label);
  }
  if (hasStatus && update.status !== "active" && update.status !== "disabled") {
    throw new RangeError(`custd: ${label} status must be "active" or "disabled"`);
  }
}

function assertDataScopePrincipal(principal: DataScopePrincipalRef): void {
  const hasUser = principal.userUuid !== undefined;
  const hasClient = principal.clientId !== undefined;
  if (principal.kind === "human") {
    if (!hasUser || hasClient || !DATA_SCOPE_UUID_PATTERN.test(principal.userUuid as string)) {
      throw new RangeError("custd: a human principal requires userUuid and no clientId");
    }
    return;
  }
  if (principal.kind === "machine") {
    if (!hasClient || hasUser || !validDataScopeCode(principal.clientId as string)) {
      throw new RangeError("custd: a machine principal requires a bounded clientId and no userUuid");
    }
    return;
  }
  throw new RangeError('custd: data scope principal kind must be "human" or "machine"');
}

function assertDataScopeTarget(target: DataScopeGrantTarget): void {
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
      if (
        !DATA_SCOPE_UUID_PATTERN.test(target.scopeUuid ?? "") ||
        !DATA_SCOPE_UUID_PATTERN.test(target.resourceUuid ?? "")
      ) {
        throw new RangeError("custd: a resource target requires scopeUuid and resourceUuid");
      }
      return;
    default:
      throw new RangeError('custd: data scope grant target kind must be "parent", "sub_client" or "resource"');
  }
}

function assertDataScopeGrant(grant: DataScopeGrant): void {
  assertDataScopePrincipal(grant.principal);
  assertDataScopeTarget(grant.target);
  if (grant.action !== "read" && grant.action !== "write") {
    throw new RangeError('custd: data scope action must be "read" or "write"');
  }
}

type AdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;
const includeDisabledQuery = (include: boolean): string => (include ? "?includeDisabled=true" : "");
const resourcePath = (scopeUuid: string, resourceUuid: string): string =>
  `/data-scopes/${encodeURIComponent(scopeUuid)}/resources/${encodeURIComponent(resourceUuid)}`;

export class DataScopeAdminClient {
  constructor(private readonly request: AdminRequester) {}

  async createScope(body: DataScopeCreateRequest): Promise<DataScope> {
    assertDataScopeCode(body.code, "data scope");
    assertDataScopeName(body.name, "data scope");
    return this.request("POST", "/data-scopes", body);
  }

  listScopes(includeDisabled = false): Promise<DataScopeListResponse> {
    return this.request("GET", `/data-scopes${includeDisabledQuery(includeDisabled)}`);
  }

  getScope(scopeUuid: string): Promise<DataScope> {
    return this.request("GET", `/data-scopes/${encodeURIComponent(scopeUuid)}`);
  }

  async updateScope(scopeUuid: string, body: DataScopeUpdateRequest): Promise<DataScope> {
    assertDataScopeUpdate(body, "data scope");
    return this.request("PATCH", `/data-scopes/${encodeURIComponent(scopeUuid)}`, body);
  }

  disableScope(scopeUuid: string): Promise<void> {
    return this.request("POST", `/data-scopes/${encodeURIComponent(scopeUuid)}/disable`);
  }

  async createResource(scopeUuid: string, body: DataScopeResourceCreateRequest): Promise<DataScopeResource> {
    assertDataScopeCode(body.code, "data scope resource");
    assertDataScopeName(body.name, "data scope resource");
    return this.request("POST", `/data-scopes/${encodeURIComponent(scopeUuid)}/resources`, body);
  }

  listResources(scopeUuid: string, includeDisabled = false): Promise<DataScopeResourceListResponse> {
    return this.request(
      "GET",
      `/data-scopes/${encodeURIComponent(scopeUuid)}/resources${includeDisabledQuery(includeDisabled)}`,
    );
  }

  getResource(scopeUuid: string, resourceUuid: string): Promise<DataScopeResource> {
    return this.request("GET", resourcePath(scopeUuid, resourceUuid));
  }

  async updateResource(
    scopeUuid: string,
    resourceUuid: string,
    body: DataScopeResourceUpdateRequest,
  ): Promise<DataScopeResource> {
    assertDataScopeUpdate(body, "data scope resource");
    return this.request("PATCH", resourcePath(scopeUuid, resourceUuid), body);
  }

  disableResource(scopeUuid: string, resourceUuid: string): Promise<void> {
    return this.request("POST", `${resourcePath(scopeUuid, resourceUuid)}/disable`);
  }

  async listGrants(principal: DataScopePrincipalRef): Promise<DataScopeGrantListResponse> {
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

  async createGrant(grant: DataScopeGrant): Promise<DataScopeGrant> {
    assertDataScopeGrant(grant);
    return this.request("POST", "/data-scope-grants", grant);
  }

  async revokeGrant(grant: DataScopeGrant): Promise<void> {
    assertDataScopeGrant(grant);
    return this.request("POST", "/data-scope-grants/revoke", grant);
  }
}
