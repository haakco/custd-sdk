/** A registered browser Site and a server-only Site must use different write keys. */
export interface ErrorCaptureConfig {
    baseUrl: string;
    writeKey: string;
    environment: string;
    release?: string;
    fetch?: typeof fetch;
}
export interface CaptureExceptionRequest {
    error: unknown;
    mode?: "handled" | "unhandled";
    /** Application-owned ULID; no user, account or request content. */
    correlationId?: string;
}
export interface ErrorCaptureResult {
    outcome: "accepted" | "unavailable" | "rejected" | "limited";
    status?: number;
}
/** Native Custd collector. No global scope, persisted queue, retries or third-party collector. */
export declare class ErrorCaptureClient {
    private readonly config;
    private readonly origin;
    private readonly send;
    private captures;
    private concurrent;
    constructor(config: ErrorCaptureConfig);
    /** Always resolves: optional diagnostics never changes the operation that failed. */
    captureException(request: CaptureExceptionRequest): Promise<ErrorCaptureResult>;
}
/** Install once at the application boundary; close it when that application unmounts. */
export declare function installBrowserErrorCapture(client: ErrorCaptureClient): () => void;
