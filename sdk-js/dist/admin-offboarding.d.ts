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
    tenantSlug: string;
    effectiveAt: string;
    gracePeriodDays: number;
    reason: string;
    status?: string;
};
export type OffboardingScheduleListResponse = {
    schedules: OffboardingSchedule[];
};
export type OffboardingCancelRequest = {
    reason: string;
};
export type OffboardingRequest = {
    requestUuid: string;
    state: string;
    requestedAt: string;
};
export type OffboardingRequestCreate = {
    confirmation: string;
};
export type OffboardingPreviewStore = {
    store: string;
    kind: string;
    retentionClass: string;
    estimatedCount: number;
    sourceAuthority?: string;
};
export type OffboardingPreviewResponse = {
    requestUuid: string;
    generatedAt: string;
    expiresAt: string;
    stores: OffboardingPreviewStore[];
    exclusions?: Array<Record<string, unknown>>;
    previewInventoryDigest: string;
    complete: boolean;
    partial: boolean;
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
    checksumSha256: string;
    byteSize: number;
    recordCount: number;
    generatedAt: string;
    expiresAt: string;
    previewInventoryDigest: string;
};
export type OffboardingDownloadResponse = {
    downloadUrl: string;
};
export type OffboardingAcknowledgeResponse = OffboardingRequest;
export type OffboardingExecuteResponse = OffboardingReceiptResponse;
export type OffboardingRetryResponse = OffboardingReceiptResponse;
export type OffboardingReceiptPerStore = {
    store: string;
    retentionClass: string;
    deletedCount: number;
    retainedExceptionsCount: number;
};
export type OffboardingReceiptResponse = {
    companyId: number;
    requestedByActor: string;
    requestedByUserId?: number | null;
    requestedAt: string;
    completedAt: string;
    finalState: string;
    perStore: OffboardingReceiptPerStore[];
    waiver?: OffboardingWaiver | null;
    sha256: string;
};
type AdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;
export declare class OffboardingClient {
    private readonly request;
    constructor(request: AdminRequester);
    schedule(body: OffboardingScheduleRequest, options?: RequestOptions): Promise<OffboardingSchedule>;
    listSchedules(options?: RequestOptions): Promise<OffboardingScheduleListResponse>;
    getSchedule(tenantSlug: string, options?: RequestOptions): Promise<OffboardingSchedule>;
    cancelSchedule(tenantSlug: string, body: OffboardingCancelRequest, options?: RequestOptions): Promise<OffboardingSchedule>;
    requestOffboarding(body: OffboardingRequestCreate, options?: RequestOptions): Promise<OffboardingRequest>;
    getRequest(requestUuid: string, options?: RequestOptions): Promise<OffboardingRequest>;
    cancelRequest(requestUuid: string, body: OffboardingCancelRequest, options?: RequestOptions): Promise<OffboardingRequest>;
    confirmRequest(requestUuid: string, options?: RequestOptions): Promise<OffboardingRequest>;
    preview(requestUuid: string, options?: RequestOptions): Promise<OffboardingPreviewResponse>;
    export(requestUuid: string, options?: RequestOptions): Promise<OffboardingExportResponse>;
    download(requestUuid: string, options?: RequestOptions): Promise<OffboardingDownloadResponse>;
    acknowledge(requestUuid: string, options?: RequestOptions): Promise<OffboardingAcknowledgeResponse>;
    execute(requestUuid: string, body: OffboardingExecuteRequest, options?: RequestOptions): Promise<OffboardingExecuteResponse>;
    retry(requestUuid: string, options?: RequestOptions): Promise<OffboardingRetryResponse>;
    receipt(requestUuid: string, options?: RequestOptions): Promise<OffboardingReceiptResponse>;
}
export {};
