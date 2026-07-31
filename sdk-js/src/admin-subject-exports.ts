// SubjectExportClient owns per-tenant subject export requests. The download
// surface returns a short-lived signed URL the SDK must surface only to the
// caller; it must not be logged or echoed into error messages.

import type { RequestOptions } from "./index.js";

// SubjectExportSubject is the typed selector the server returns alongside
// an export request. The value is a server-side identifier (e.g. a user
// UUID); the SDK must not echo it into logs or error messages.
export type SubjectExportSubject = {
  type: string;
  value: string;
};

// SubjectExport is the receipt returned for a subject export request. The
// checksum and artifactSize are present only once the request is in
// terminal ready state.
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

// SubjectExportCreateRequest is the body for POST /admin/subject-exports.
// idempotencyKey is required for safe retries.
export type SubjectExportCreateRequest = {
  tenantSlug: string;
  subject: SubjectExportSubject;
  scope: string;
  idempotencyKey: string;
};

// SubjectExportDownloadResponse is the body for GET
// /admin/subject-exports/{requestId}/download. The downloadUrl is a
// short-lived signed URL the SDK must hand back to the caller without
// logging the URL value or the underlying subject identifier.
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

export class SubjectExportClient {
  constructor(private readonly request: AdminRequester) {}

  create(body: SubjectExportCreateRequest, options?: RequestOptions): Promise<SubjectExport> {
    return this.request("POST", "/subject-exports", body, options);
  }

  list(options?: RequestOptions): Promise<SubjectExportListResponse> {
    return this.request("GET", "/subject-exports", undefined, options);
  }

  get(requestId: string, options?: RequestOptions): Promise<SubjectExport> {
    return this.request("GET", `/subject-exports/${encodeURIComponent(requestId)}`, undefined, options);
  }

  cancel(requestId: string, options?: RequestOptions): Promise<SubjectExportState> {
    return this.request("POST", `/subject-exports/${encodeURIComponent(requestId)}/cancel`, undefined, options);
  }

  // Download returns a short-lived signed URL. The downloadUrl field is
  // sensitive; callers must not log the URL or echo it into error messages.
  download(requestId: string, options?: RequestOptions): Promise<SubjectExportDownloadResponse> {
    return this.request("GET", `/subject-exports/${encodeURIComponent(requestId)}/download`, undefined, options);
  }

  force(requestId: string, options?: RequestOptions): Promise<SubjectExportState> {
    return this.request("POST", `/subject-exports/${encodeURIComponent(requestId)}/force`, undefined, options);
  }
}
