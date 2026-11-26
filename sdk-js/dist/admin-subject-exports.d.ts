import type { RequestOptions } from "./index.js";
/** What a subject export covers. A request may ask for both; each artifact is access or portability. */
export type SubjectExportScope = "access" | "portability" | "both";
/** The artifact a download names: the server serves access or portability, never both at once. */
export type SubjectExportArtifactScope = Exclude<SubjectExportScope, "both">;
export type SubjectExportStatus = "queued" | "running" | "complete" | "failed" | "cancelled" | "expired";
/** One store's progress for a subject export. */
export type SubjectExportStoreProgress = {
    store: string;
    deletedCount: number;
    retainedExceptions: number;
    lastError?: string;
    lastCompletedAt?: string;
};
/** The status of one subject export request, as create, get, list, cancel and force return it. */
export type SubjectExport = {
    id: string;
    opaqueSubjectId: string;
    scope: SubjectExportScope;
    state: SubjectExportStatus;
    idempotencyKey: string;
    requestedAt: string;
    expiresAt: string;
    completedAt?: string;
    lastProgressAt?: string;
    lastActionSafeNext?: string;
    error?: string;
    perStoreProgress: SubjectExportStoreProgress[];
};
export type SubjectExportListResponse = {
    requests: SubjectExport[];
};
/** The body for POST /admin/subject-exports. idempotencyKey makes a retry safe. */
export type SubjectExportCreateRequest = {
    opaqueSubjectId: string;
    scope: SubjectExportScope;
    idempotencyKey: string;
};
/**
 * One stored export artifact's identity, location and integrity metadata, as
 * GET /admin/subject-exports/{requestId}/download returns it. It names object
 * keys, not a signed URL.
 */
export type SubjectExportDownloadResponse = {
    id: string;
    requestId: string;
    scope: SubjectExportScope;
    objectKey: string;
    s3Key: string;
    encryptionKeyId: string;
    checksumSha256: string;
    byteSize: number;
    recordCount: number;
    generatedAt: string;
    expiresAt: string;
};
type AdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;
export declare class SubjectExportClient {
    private readonly request;
    constructor(request: AdminRequester);
    create(body: SubjectExportCreateRequest, options?: RequestOptions): Promise<SubjectExport>;
    /** Lists the tenant's subject exports, newest first. The server default is 100; it accepts 1 to 1000. */
    list(limit?: number, options?: RequestOptions): Promise<SubjectExportListResponse>;
    get(requestId: string, options?: RequestOptions): Promise<SubjectExport>;
    /** Stops a queued or running export and returns its cancelled status. */
    cancel(requestId: string, options?: RequestOptions): Promise<SubjectExport>;
    /** Returns one stored artifact's metadata; scope names the artifact. The object keys are tenant data; do not log them. */
    download(requestId: string, scope: SubjectExportArtifactScope, options?: RequestOptions): Promise<SubjectExportDownloadResponse>;
    force(requestId: string, options?: RequestOptions): Promise<SubjectExport>;
}
export {};
