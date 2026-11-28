import type { RequestOptions } from "./index.js";
export type AppMessageSource = "sms" | "imessage" | "whatsapp";
export interface AppMessageSession {
    companySlug: string;
    principalId: string;
    importAllowed: boolean;
}
export interface AppMessageInput {
    externalId: string;
    threadId: string | null;
    sender: string | null;
    participants: string[];
    timestamp: string;
    direction: string;
    text: string;
}
export interface AppMessageBatchRequest {
    source: AppMessageSource;
    messages: AppMessageInput[];
}
export interface AppMessageImportResult {
    externalId: string;
    status: string;
    messageUuid?: string;
    errorCode?: string;
}
export interface AppMessageBatchResponse {
    results: AppMessageImportResult[];
}
export interface AppMessageSearchRequest {
    query?: string;
    sender?: string;
    source?: AppMessageSource;
    threadId?: string;
    from?: string;
    to?: string;
    limit?: number;
    cursor?: string;
}
export interface AppMessageMediaMetadata {
    mediaUuid: string;
    contentType: string;
    byteCount: number;
    ocrStatus: string;
    ocrText?: string;
}
export interface AppMessage {
    messageUuid: string;
    source: string;
    externalId: string;
    threadId: string;
    sender: string;
    participants: string[];
    timestamp: string;
    direction: string;
    text: string;
    media?: AppMessageMediaMetadata[];
}
export interface AppMessageSearchResponse {
    messages: AppMessage[];
    nextCursor?: string;
}
export interface AppMessageReadResponse {
    message: AppMessage;
}
export interface AppMessageDeleteSourceResponse {
    source: string;
    deletedCount: number;
}
export interface AppMessageMediaUpload {
    messageUuid: string;
    image: Uint8Array;
}
export interface AppMessageMediaRef {
    messageUuid: string;
    mediaUuid: string;
}
export interface AppMessageMedia {
    contentType: "image/jpeg" | "image/png";
    image: Uint8Array;
}
type Request = (method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<unknown>;
type Download = (path: string, options?: RequestOptions) => Promise<Response>;
export declare class AppMessageClient {
    private readonly request;
    private readonly download;
    constructor(request: Request, download: Download);
    session(options?: RequestOptions): Promise<AppMessageSession>;
    import(request: AppMessageBatchRequest, options?: RequestOptions): Promise<AppMessageBatchResponse>;
    search(request: AppMessageSearchRequest, options?: RequestOptions): Promise<AppMessageSearchResponse>;
    get(messageUuid: string, options?: RequestOptions): Promise<AppMessageReadResponse>;
    deleteSource(source: AppMessageSource, options?: RequestOptions): Promise<AppMessageDeleteSourceResponse>;
    uploadMedia(upload: AppMessageMediaUpload, options?: RequestOptions): Promise<AppMessageMediaMetadata>;
    downloadMedia(ref: AppMessageMediaRef, options?: RequestOptions): Promise<AppMessageMedia>;
}
export {};
