import type { RequestOptions } from "./index.js";
export type TenantStorageLocation = {
    id: string;
    tenantSlug: string;
    clientLocation: string;
    serverAssignedPrefix: string;
    status: string;
    createdAt?: string;
    expiresAt?: string;
};
export type TenantStorageListResponse = {
    locations: TenantStorageLocation[];
};
export type TenantStorageCreateRequest = {
    tenantSlug?: string;
    clientLocation: string;
};
type NonAdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;
export declare class TenantStorageClient {
    private readonly request;
    constructor(request: NonAdminRequester);
    list(options?: RequestOptions): Promise<TenantStorageListResponse>;
    create(body: TenantStorageCreateRequest, options?: RequestOptions): Promise<TenantStorageLocation>;
    get(id: string, options?: RequestOptions): Promise<TenantStorageLocation>;
    revoke(id: string, options?: RequestOptions): Promise<void>;
}
export {};
