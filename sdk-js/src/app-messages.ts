import type { RequestOptions } from "./index.js";
import { emptyAppNullLists } from "./response-lists.js";
import {
  requireBoolean,
  requireInteger,
  requireObjectList,
  requireRecord,
  requireString,
} from "./response-validation.js";

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

type Request = (
  method: string,
  path: string,
  body?: unknown,
  options?: RequestOptions,
  headers?: Record<string, string>,
) => Promise<unknown>;
type Download = (path: string, options?: RequestOptions) => Promise<Response>;

const root = "/app/messages";
const context = "message archive response";
const maxMediaBytes = 10 * 1024 * 1024;

function messagePath(messageUuid: string): string {
  return `${root}/${encodeURIComponent(messageUuid)}`;
}

export class AppMessageClient {
  constructor(
    private readonly request: Request,
    private readonly download: Download,
  ) {}

  async session(options?: RequestOptions): Promise<AppMessageSession> {
    const data = requireRecord(await this.request("GET", `${root}/session`, undefined, options), context);
    requireString(data, "companySlug", context);
    requireString(data, "principalId", context);
    requireBoolean(data, "importAllowed", context);
    return data as unknown as AppMessageSession;
  }

  /** Read the signed-in archive owner's current connector status. */
  async getConnector(options?: RequestOptions): Promise<AppMessageConnectorStatus> {
    return connectorStatus(await this.request("GET", `${root}/connector`, undefined, options));
  }

  /** Use a human tenant administrator token. The connector bearer is returned once. */
  async enrollConnector(options?: RequestOptions): Promise<AppMessageConnectorEnrollment> {
    const data = requireRecord(await this.request("POST", `${root}/connector/enroll`, undefined, options), context);
    return { status: connectorStatus(data.status), bearerToken: requireString(data, "bearerToken", context) };
  }

  async controlConnector(
    request: AppMessageConnectorControl,
    options?: RequestOptions,
  ): Promise<AppMessageConnectorStatus> {
    return connectorStatus(await this.request("POST", `${root}/connector/control`, request, options));
  }

  /** Verify a connector bearer and read its bound archive generation. */
  async connectorSession(options?: RequestOptions): Promise<AppMessageSession> {
    const data = requireRecord(await this.request("GET", `${root}/connector/session`, undefined, options), context);
    requireString(data, "companySlug", context);
    requireString(data, "principalId", context);
    requireBoolean(data, "importAllowed", context);
    requireInteger(data, "whatsappSourceGeneration", context);
    return data as unknown as AppMessageSession;
  }

  /** Use the connector bearer to report connection state and pending media. */
  async reportConnector(
    request: AppMessageConnectorReport,
    options?: RequestOptions,
  ): Promise<AppMessageConnectorStatus> {
    return connectorStatus(await this.request("POST", `${root}/connector/report`, request, options));
  }

  /** Apply native message edits or revocations with the connector bearer. */
  async mutate(request: AppMessageMutationBatch, options?: RequestOptions): Promise<AppMessageMutationBatchResponse> {
    const data = requireRecord(await this.request("POST", `${root}/mutations`, request, options), context);
    requireObjectList(data, "results", context);
    return data as unknown as AppMessageMutationBatchResponse;
  }

  async import(request: AppMessageBatchRequest, options?: RequestOptions): Promise<AppMessageBatchResponse> {
    const data = requireRecord(await this.request("POST", `${root}/batch`, request, options), context);
    requireObjectList(data, "results", context);
    return data as unknown as AppMessageBatchResponse;
  }

  async search(request: AppMessageSearchRequest, options?: RequestOptions): Promise<AppMessageSearchResponse> {
    const path = `${root}/search`;
    const response = await this.request("POST", path, request, options);
    const data = requireRecord(emptyAppNullLists("POST", `/api/v1${path}`, response), context);
    requireObjectList(data, "messages", context);
    return data as unknown as AppMessageSearchResponse;
  }

  async get(messageUuid: string, options?: RequestOptions): Promise<AppMessageReadResponse> {
    const path = messagePath(messageUuid);
    const response = await this.request("GET", path, undefined, options);
    const data = requireRecord(emptyAppNullLists("GET", `/api/v1${path}`, response), context);
    requireRecord(data.message, context);
    return data as unknown as AppMessageReadResponse;
  }

  async deleteSource(source: AppMessageSource, options?: RequestOptions): Promise<AppMessageDeleteSourceResponse> {
    const data = requireRecord(
      await this.request("DELETE", `${root}/sources/${encodeURIComponent(source)}`, undefined, options),
      context,
    );
    requireString(data, "source", context);
    requireInteger(data, "deletedCount", context);
    return data as unknown as AppMessageDeleteSourceResponse;
  }

  async uploadMedia(upload: AppMessageMediaUpload, options?: RequestOptions): Promise<AppMessageMediaMetadata> {
    if (upload.image.byteLength === 0 || upload.image.byteLength > maxMediaBytes) {
      throw new Error("custd: archive image must contain 1 byte to 10 MiB");
    }
    if (
      upload.sourceGeneration !== undefined &&
      (!Number.isSafeInteger(upload.sourceGeneration) || upload.sourceGeneration < 1)
    ) {
      throw new Error("custd: archive source generation must be a positive safe integer");
    }
    const data = requireRecord(
      await this.request(
        "PUT",
        `${messagePath(upload.messageUuid)}/media`,
        upload.image,
        options,
        upload.sourceGeneration === undefined
          ? undefined
          : { "X-Custd-Source-Generation": String(upload.sourceGeneration) },
      ),
      context,
    );
    requireString(data, "mediaUuid", context);
    requireString(data, "contentType", context);
    requireInteger(data, "byteCount", context);
    requireString(data, "ocrStatus", context);
    return data as unknown as AppMessageMediaMetadata;
  }

  async downloadMedia(ref: AppMessageMediaRef, options?: RequestOptions): Promise<AppMessageMedia> {
    const response = await this.download(
      `${messagePath(ref.messageUuid)}/media/${encodeURIComponent(ref.mediaUuid)}`,
      options,
    );
    const contentType = response.headers.get("content-type");
    if (
      (contentType !== "image/jpeg" && contentType !== "image/png") ||
      Number(response.headers.get("content-length")) > maxMediaBytes
    ) {
      await response.body?.cancel();
      throw new Error("custd: archive image must be JPEG or PNG and at most 10 MiB");
    }
    const image = new Uint8Array(await response.arrayBuffer());
    if (image.byteLength === 0 || image.byteLength > maxMediaBytes) {
      throw new Error("custd: archive image must contain 1 byte to 10 MiB");
    }
    return { contentType, image };
  }
}

function connectorStatus(value: unknown): AppMessageConnectorStatus {
  const data = requireRecord(value, context);
  requireString(data, "state", context);
  return data as unknown as AppMessageConnectorStatus;
}
