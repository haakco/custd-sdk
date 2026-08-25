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
    status: string;
    state?: string;
    selectorType?: string;
    selectorDisplay?: string;
    perStoreProgress?: PrivacyErasureStoreProgress[];
    createdAt?: string;
    completedAt?: string;
};
export type PrivacyErasureCreateRequest = {
    companySlug: string;
    selector: PrivacyErasureSelector;
    reason: string;
    redactionId: string;
    forceNow?: boolean;
};
export type PrivacyErasureListResponse = {
    requests: PrivacyErasure[];
};
export type PrivacyErasureState = {
    request?: PrivacyErasure;
    safe_next_action?: string;
    safe_next_action_code?: string;
};
export type PrivacyErasureWaitOptions = RequestOptions & {
    maxPolls?: number;
    pollIntervalMs?: number;
    onProgress?: (request: PrivacyErasure) => void | Promise<void>;
};
export type PrivacyErasureRetryClassification = "retryable" | "non_retryable";
export declare class PrivacyErasureError extends Error {
    readonly code: string;
    readonly retryClassification: PrivacyErasureRetryClassification;
    readonly retryable: boolean;
    constructor(code: string, retryClassification: PrivacyErasureRetryClassification, message: string);
}
type AdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;
export declare class PrivacyErasureClient {
    private readonly request;
    constructor(request: AdminRequester);
    create(body: PrivacyErasureCreateRequest, options?: RequestOptions): Promise<PrivacyErasure>;
    list(companySlug: string, options?: RequestOptions): Promise<PrivacyErasureListResponse>;
    get(companySlug: string, requestUuid: string, options?: RequestOptions): Promise<PrivacyErasure>;
    force(companySlug: string, requestUuid: string, options?: RequestOptions): Promise<PrivacyErasureState>;
    createAndWait(body: PrivacyErasureCreateRequest, options?: PrivacyErasureWaitOptions): Promise<PrivacyErasure>;
    waitForCompletion(companySlug: string, requestUuid: string, options?: PrivacyErasureWaitOptions & {
        initialRequest?: PrivacyErasure;
    }): Promise<PrivacyErasure>;
}
export {};
