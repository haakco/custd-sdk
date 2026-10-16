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
export type DataScopeListResponse = {
    scopes: DataScope[];
};
export type DataScopeCreateRequest = {
    code: string;
    name: string;
};
/** Both fields are optional, but at least one must be present. */
export type DataScopeUpdateRequest = {
    name?: string;
    status?: DataScopeStatus;
};
export type DataScopeResource = {
    uuid: string;
    scopeUuid: string;
    code: string;
    name: string;
    status: DataScopeStatus;
    createdAt: string;
    updatedAt: string;
};
export type DataScopeResourceListResponse = {
    resources: DataScopeResource[];
};
export type DataScopeResourceCreateRequest = {
    code: string;
    name: string;
};
export type DataScopeResourceUpdateRequest = {
    name?: string;
    status?: DataScopeStatus;
};
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
export type DataScopeGrantListResponse = {
    grants: DataScopeGrant[];
};
export declare function validDataScopeCode(value: string): boolean;
export declare function validDataScopeName(value: string): boolean;
type AdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;
export declare class DataScopeAdminClient {
    private readonly request;
    constructor(request: AdminRequester);
    createScope(body: DataScopeCreateRequest): Promise<DataScope>;
    listScopes(includeDisabled?: boolean): Promise<DataScopeListResponse>;
    getScope(scopeUuid: string): Promise<DataScope>;
    updateScope(scopeUuid: string, body: DataScopeUpdateRequest): Promise<DataScope>;
    disableScope(scopeUuid: string): Promise<void>;
    createResource(scopeUuid: string, body: DataScopeResourceCreateRequest): Promise<DataScopeResource>;
    listResources(scopeUuid: string, includeDisabled?: boolean): Promise<DataScopeResourceListResponse>;
    getResource(scopeUuid: string, resourceUuid: string): Promise<DataScopeResource>;
    updateResource(scopeUuid: string, resourceUuid: string, body: DataScopeResourceUpdateRequest): Promise<DataScopeResource>;
    disableResource(scopeUuid: string, resourceUuid: string): Promise<void>;
    listGrants(principal: DataScopePrincipalRef): Promise<DataScopeGrantListResponse>;
    createGrant(grant: DataScopeGrant): Promise<DataScopeGrant>;
    revokeGrant(grant: DataScopeGrant): Promise<void>;
}
export {};
