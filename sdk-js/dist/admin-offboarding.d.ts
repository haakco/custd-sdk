import type { RequestOptions } from "./index.js";
export type OffboardingSchedule = {
    tenantSlug: string;
    effectiveAt: string;
    gracePeriodDays: number;
    reason: string;
    status: string;
    updatedAt?: string;
};
export type OffboardingScheduleRequest = {
    effectiveAt: string;
    gracePeriodDays: number;
    reason: string;
    status: string;
};
export type OffboardingScheduleListResponse = {
    schedules: OffboardingSchedule[];
};
export type OffboardingCancelRequest = {
    reason: string;
};
export type OffboardingRequest = {
    requestUuid: string;
    tenantSlug: string;
    status: string;
    requestedBy: string;
    requestedAt?: string;
};
export type OffboardingRequestCreate = {
    confirmation: string;
};
export type OffboardingPerStore = {
    store: string;
    kind: string;
    retentionClass: string;
    estimatedCount: number;
};
export type OffboardingPreviewResponse = {
    requestUuid: string;
    previewInventoryDigest?: string;
    perStore: OffboardingPerStore[];
};
export type OffboardingWaiver = {
    role: string;
    reason: string;
    timestamp?: string;
};
export type OffboardingExecuteRequest = {
    waiver: OffboardingWaiver;
};
export type OffboardingExportResponse = {
    requestUuid: string;
    exportArtifactId?: string;
    schemaVersion?: string;
    generatedAt?: string;
    expiresAt?: string;
    complete: boolean;
    checksum?: string;
};
export type OffboardingDownloadResponse = {
    requestUuid: string;
    downloadUrl: string;
    expiresAt?: string;
};
export type OffboardingAcknowledgeResponse = {
    requestUuid: string;
    state?: string;
    acknowledgedAt?: string;
};
export type OffboardingExecuteResponse = {
    requestUuid: string;
    state?: string;
    executedAt?: string;
    waiver?: OffboardingWaiver;
};
export type OffboardingRetryResponse = {
    requestUuid: string;
    state?: string;
    retriedAt?: string;
};
export type OffboardingReceiptPerStore = {
    store: string;
    retentionClass: string;
    deletedCount: number;
    retainedExceptionsCount: number;
};
export type OffboardingReceiptResponse = {
    requestUuid: string;
    tenantSlug: string;
    finalState: string;
    requestedByActor: string;
    requestedByUserId?: string | null;
    requestedAt?: string;
    completedAt?: string;
    perStore: OffboardingReceiptPerStore[];
    waiver?: OffboardingWaiver | null;
    sha256?: string;
};
type AdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;
export declare class OffboardingClient {
    private readonly request;
    constructor(request: AdminRequester);
    schedule(body: OffboardingScheduleRequest, options?: RequestOptions): Promise<OffboardingSchedule>;
    listSchedules(options?: RequestOptions): Promise<OffboardingScheduleListResponse>;
    getSchedule(tenantSlug: string, options?: RequestOptions): Promise<OffboardingSchedule>;
    cancelSchedule(tenantSlug: string, body: OffboardingCancelRequest, options?: RequestOptions): Promise<void>;
    requestOffboarding(body: OffboardingRequestCreate, options?: RequestOptions): Promise<OffboardingRequest>;
    getRequest(requestUuid: string, options?: RequestOptions): Promise<OffboardingRequest>;
    cancelRequest(requestUuid: string, options?: RequestOptions): Promise<void>;
    confirmRequest(requestUuid: string, options?: RequestOptions): Promise<void>;
    preview(requestUuid: string, options?: RequestOptions): Promise<OffboardingPreviewResponse>;
    export(requestUuid: string, options?: RequestOptions): Promise<OffboardingExportResponse>;
    download(requestUuid: string, options?: RequestOptions): Promise<OffboardingDownloadResponse>;
    acknowledge(requestUuid: string, options?: RequestOptions): Promise<OffboardingAcknowledgeResponse>;
    execute(requestUuid: string, body: OffboardingExecuteRequest, options?: RequestOptions): Promise<OffboardingExecuteResponse>;
    retry(requestUuid: string, options?: RequestOptions): Promise<OffboardingRetryResponse>;
    receipt(requestUuid: string, options?: RequestOptions): Promise<OffboardingReceiptResponse>;
}
export {};
