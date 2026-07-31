import type { RequestOptions } from "./index.js";
export type PrivacyErasureSelector = {
    type: string;
    value: string;
};
export type PrivacyErasureStoreProgress = {
    store: string;
    state: string;
    deletedCount?: number;
    reason?: string;
};
export type PrivacyErasure = {
    requestUuid: string;
    tenantSlug: string;
    selector: PrivacyErasureSelector;
    state: string;
    perStoreProgress?: PrivacyErasureStoreProgress[];
    createdAt?: string;
    completedAt?: string;
};
export type PrivacyErasureCreateRequest = {
    tenantSlug: string;
    selector: PrivacyErasureSelector;
    reason: string;
};
export type PrivacyErasureListResponse = {
    erasures: PrivacyErasure[];
};
export type PrivacyErasureState = {
    requestUuid: string;
    state: string;
    forcedAt?: string;
};
type AdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;
export declare class PrivacyErasureClient {
    private readonly request;
    constructor(request: AdminRequester);
    create(body: PrivacyErasureCreateRequest, options?: RequestOptions): Promise<PrivacyErasure>;
    list(options?: RequestOptions): Promise<PrivacyErasureListResponse>;
    get(requestUuid: string, options?: RequestOptions): Promise<PrivacyErasure>;
    force(requestUuid: string, options?: RequestOptions): Promise<PrivacyErasureState>;
}
export {};
