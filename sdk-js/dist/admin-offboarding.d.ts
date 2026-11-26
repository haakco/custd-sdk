import { type CustdDownloadStream } from "./download-stream.js";
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
export type OffboardingPreviewExclusion = {
    store: string;
    reason: string;
};
export type OffboardingPreviewResponse = {
    requestUuid: string;
    generatedAt: string;
    expiresAt: string;
    stores: OffboardingPreviewStore[];
    exclusions?: OffboardingPreviewExclusion[];
    previewInventoryDigest: string;
    complete: boolean;
    partial: boolean;
};
export type OffboardingWaiver = {
    role: string;
    timestamp: string;
};
export type OffboardingRequesterKind = "human" | "machine";
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
    bytes: Uint8Array;
    checksumSha256: string;
    byteSize: number;
};
/**
 * The offboarding bundle as it arrives. The body errors if it runs past or ends short of
 * `byteSize`; `checksumSha256` is the server's digest, which the caller checks against the
 * bytes it stored before acknowledging the export.
 */
export type OffboardingDownloadStream = CustdDownloadStream & {
    byteSize: number;
    checksumSha256: string;
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
    requestedByKind: OffboardingRequesterKind;
    requestedAt: string;
    completedAt: string;
    finalState: string;
    perStore: OffboardingReceiptPerStore[];
    waiver?: OffboardingWaiver | null;
    sha256: string;
};
type AdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;
type AdminDownloader = (path: string, options?: RequestOptions) => Promise<OffboardingDownloadStream>;
export declare class OffboardingClient {
    private readonly request;
    private readonly downloadBinary;
    constructor(request: AdminRequester, downloadBinary: AdminDownloader);
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
    downloadStream(requestUuid: string, options?: RequestOptions): Promise<OffboardingDownloadStream>;
    download(requestUuid: string, options?: RequestOptions): Promise<OffboardingDownloadResponse>;
    acknowledge(requestUuid: string, options?: RequestOptions): Promise<OffboardingAcknowledgeResponse>;
    execute(requestUuid: string, options?: RequestOptions): Promise<OffboardingExecuteResponse>;
    retry(requestUuid: string, options?: RequestOptions): Promise<OffboardingRetryResponse>;
    receipt(requestUuid: string, options?: RequestOptions): Promise<OffboardingReceiptResponse>;
}
export {};
