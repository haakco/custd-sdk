import type { RequestOptions } from "./index.js";
export type RetentionPolicy = {
    tenantSlug: string;
    maxAgeDays: number;
    hardDeleteAfterDays: number;
    applyToEventTypes: string[];
    applyToDataSpaces: string[];
};
export type RetentionPolicyUpsertRequest = {
    maxAgeDays: number;
    hardDeleteAfterDays: number;
    applyToEventTypes?: string[];
    applyToDataSpaces?: string[];
};
export type RetentionPolicyListResponse = {
    policies: RetentionPolicy[];
};
export type RetentionRunDeletion = {
    store: string;
    count: number;
};
export type RetentionRunPreview = {
    previewId: string;
    tenantSlug: string;
    estimatedDeletions: RetentionRunDeletion[];
    previewedAt?: string;
};
export type RetentionRun = {
    runId: string;
    tenantSlug: string;
    state: string;
    startedAt?: string;
    completedAt?: string;
    deletedCount?: number;
};
export type RetentionRunsListResponse = {
    runs: RetentionRun[];
};
type AdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;
export declare class RetentionClient {
    private readonly request;
    constructor(request: AdminRequester);
    list(options?: RequestOptions): Promise<RetentionPolicyListResponse>;
    get(tenantSlug: string, options?: RequestOptions): Promise<RetentionPolicy>;
    upsert(tenantSlug: string, body: RetentionPolicyUpsertRequest, options?: RequestOptions): Promise<RetentionPolicy>;
    delete(tenantSlug: string, options?: RequestOptions): Promise<void>;
    preview(tenantSlug: string, options?: RequestOptions): Promise<RetentionRunPreview>;
    apply(tenantSlug: string, options?: RequestOptions): Promise<RetentionRun>;
    listRuns(tenantSlug: string, options?: RequestOptions): Promise<RetentionRunsListResponse>;
}
export {};
