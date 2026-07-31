import type { RequestOptions } from "./index.js";
export type SubjectExportSubject = {
    type: string;
    value: string;
};
export type SubjectExport = {
    requestId: string;
    tenantSlug: string;
    subject: SubjectExportSubject;
    scope: string;
    state: string;
    createdAt?: string;
    expiresAt?: string;
    checksum?: string;
    artifactSize?: number;
};
export type SubjectExportListResponse = {
    exports: SubjectExport[];
};
export type SubjectExportCreateRequest = {
    tenantSlug: string;
    subject: SubjectExportSubject;
    scope: string;
    idempotencyKey: string;
};
export type SubjectExportDownloadResponse = {
    requestId: string;
    downloadUrl: string;
    expiresAt?: string;
};
export type SubjectExportState = {
    requestId: string;
    state: string;
    cancelledAt?: string;
    forcedAt?: string;
};
type AdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;
export declare class SubjectExportClient {
    private readonly request;
    constructor(request: AdminRequester);
    create(body: SubjectExportCreateRequest, options?: RequestOptions): Promise<SubjectExport>;
    list(options?: RequestOptions): Promise<SubjectExportListResponse>;
    get(requestId: string, options?: RequestOptions): Promise<SubjectExport>;
    cancel(requestId: string, options?: RequestOptions): Promise<SubjectExportState>;
    download(requestId: string, options?: RequestOptions): Promise<SubjectExportDownloadResponse>;
    force(requestId: string, options?: RequestOptions): Promise<SubjectExportState>;
}
export {};
