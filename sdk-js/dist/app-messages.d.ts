import type { RequestOptions } from "./index.js";
export type AppMessageSource = "sms" | "imessage" | "whatsapp";
export interface AppMessageSession {
    companySlug: string;
    principalId: string;
    importAllowed: boolean;
    whatsappSourceGeneration?: number;
}
export type AppMessageConnectorState = "active" | "paused" | "stale" | "disconnected";
export type AppMessageConnectorConnection = "connecting" | "importing_history" | "syncing" | "offline" | "pair_again";
export interface AppMessageConnectorControl {
    action: "pause" | "resume" | "disconnect";
}
export interface AppMessageConnectorReport {
    connectionState: AppMessageConnectorConnection;
    pendingMedia: number;
}
export interface AppMessageConnectorStatus {
    state: AppMessageConnectorState;
    grantId?: string;
    sourceGeneration?: number;
    createdAt?: string;
    updatedAt?: string;
    lastReportAt?: string;
    pendingMedia?: number;
    connectionState?: AppMessageConnectorConnection;
}
export interface AppMessageConnectorEnrollment {
    status: AppMessageConnectorStatus;
    bearerToken: string;
}
export interface AppMessageMutation {
    externalId: string;
    operationId: string;
    kind: "edit" | "revoke";
    revision: number;
    text?: string;
}
export interface AppMessageMutationBatch {
    source: "whatsapp";
    mutations: AppMessageMutation[];
    sourceGeneration: number;
}
export interface AppMessageMutationResult {
    externalId: string;
    operationId: string;
    status: string;
    errorCode?: string;
}
export interface AppMessageMutationBatchResponse {
    results: AppMessageMutationResult[];
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
    sourceGeneration?: number;
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
    sourceGeneration?: number;
}
export interface AppMessageMediaUpload {
    messageUuid: string;
    image: Uint8Array;
    sourceGeneration?: number;
}
export interface AppMessageMediaRef {
    messageUuid: string;
    mediaUuid: string;
}
export interface AppMessageMedia {
    contentType: "image/jpeg" | "image/png";
    image: Uint8Array;
}
type Request = (method: string, path: string, body?: unknown, options?: RequestOptions, headers?: Record<string, string>) => Promise<unknown>;
type Download = (path: string, options?: RequestOptions) => Promise<Response>;
export declare class AppMessageClient {
    private readonly request;
    private readonly download;
    constructor(request: Request, download: Download);
    session(options?: RequestOptions): Promise<AppMessageSession>;
    /** Read the signed-in archive owner's current connector status. */
    getConnector(options?: RequestOptions): Promise<AppMessageConnectorStatus>;
    /** Use a human tenant administrator token. The connector bearer is returned once. */
    enrollConnector(options?: RequestOptions): Promise<AppMessageConnectorEnrollment>;
    controlConnector(request: AppMessageConnectorControl, options?: RequestOptions): Promise<AppMessageConnectorStatus>;
    /** Verify a connector bearer and read its bound archive generation. */
    connectorSession(options?: RequestOptions): Promise<AppMessageSession>;
    /** Use the connector bearer to report connection state and pending media. */
    reportConnector(request: AppMessageConnectorReport, options?: RequestOptions): Promise<AppMessageConnectorStatus>;
    /** Apply native message edits or revocations with the connector bearer. */
    mutate(request: AppMessageMutationBatch, options?: RequestOptions): Promise<AppMessageMutationBatchResponse>;
    import(request: AppMessageBatchRequest, options?: RequestOptions): Promise<AppMessageBatchResponse>;
    search(request: AppMessageSearchRequest, options?: RequestOptions): Promise<AppMessageSearchResponse>;
    get(messageUuid: string, options?: RequestOptions): Promise<AppMessageReadResponse>;
    deleteSource(source: AppMessageSource, options?: RequestOptions): Promise<AppMessageDeleteSourceResponse>;
    uploadMedia(upload: AppMessageMediaUpload, options?: RequestOptions): Promise<AppMessageMediaMetadata>;
    downloadMedia(ref: AppMessageMediaRef, options?: RequestOptions): Promise<AppMessageMedia>;
}
export {};
