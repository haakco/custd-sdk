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
export interface ErrorFrame {
    filename: string;
    lineno: number;
    colno?: number;
}
/** Sanitized app-to-server relay contract. Credentials and raw error content never enter it. */
export interface ErrorCaptureEvent {
    eventId?: string;
    platform: "javascript" | "go";
    exceptionType: string;
    frames: ErrorFrame[];
    mode: "handled" | "unhandled";
    environment: string;
    release?: string;
    correlationId?: string;
}
export interface ErrorCaptureEventConfig {
    environment: string;
    release?: string;
    eventId?: string;
}
/** Pure formatter for authenticated application relays, including Expo without browser globals. */
export declare function createErrorCaptureEvent(request: CaptureExceptionRequest, config: ErrorCaptureEventConfig): ErrorCaptureEvent;
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
export declare function installBrowserErrorCapture(client: Pick<ErrorCaptureClient, "captureException">): () => void;
export type NativeErrorHandler = (error: unknown, fatal?: boolean) => void;
/** React Native ErrorUtils-shaped seam; no native dependencies or global patching. */
export interface NativeErrorSource {
    getGlobalHandler(): NativeErrorHandler;
    setGlobalHandler(handler: NativeErrorHandler): void;
}
/** Capture delivery remains bounded by the caller; native error handling always runs. */
export declare function installNativeErrorCapture(source: NativeErrorSource, capture: (request: CaptureExceptionRequest) => unknown): () => void;
