// OffboardingClient owns the offboarding schedule and one-off request
// surfaces. Schedule writes the effective tenant server-side; callers must
// not pre-fill tenantSlug on the request body. The tenant is derived from
// the authenticated client context.

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
  effectiveAt: string;
  gracePeriodDays: number;
  reason: string;
  status: string;
};

export type OffboardingScheduleListResponse = {
  schedules: OffboardingSchedule[];
};

export type OffboardingCancelRequest = {
  reason: string;
};

// OffboardingRequest is the receipt returned for one-off offboarding
// requests. It is the response shape for request, getRequest, and the
// single-tenant collection read.
export type OffboardingRequest = {
  requestUuid: string;
  tenantSlug: string;
  status: string;
  requestedBy: string;
  requestedAt?: string;
};

// OffboardingRequestCreate is the body for POST /offboarding. confirmation
// is the human-typed string the server compares against the tenant slug
// before accepting the destructive transition.
export type OffboardingRequestCreate = {
  confirmation: string;
};

// OffboardingPerStore is one row of the per-store inventory the preview
// endpoint returns. estimatedCount is server-computed; the SDK must not
// re-derive it.
export type OffboardingPerStore = {
  store: string;
  kind: string;
  retentionClass: string;
  estimatedCount: number;
};

// OffboardingPreviewResponse is the body for POST
// /admin/offboarding/requests/{requestUuid}/preview.
export type OffboardingPreviewResponse = {
  requestUuid: string;
  previewInventoryDigest?: string;
  perStore: OffboardingPerStore[];
};

// OffboardingWaiver is the typed waiver the execute endpoint requires.
// role identifies the actor (e.g. client_owner); reason is the human-readable
// rationale. timestamp is server-stamped on accept.
export type OffboardingWaiver = {
  role: string;
  reason: string;
  timestamp?: string;
};

// OffboardingExecuteRequest is the body for POST
// /admin/offboarding/requests/{requestUuid}/execute. waiver is required for
// destructive execution; an empty role returns a 400 waiver_required error
// the SDK must surface without retry.
export type OffboardingExecuteRequest = {
  waiver: OffboardingWaiver;
};

// OffboardingExportResponse is the body for POST
// /admin/offboarding/requests/{requestUuid}/export. complete=false means
// the server is still gathering inventory; callers must poll.
export type OffboardingExportResponse = {
  requestUuid: string;
  exportArtifactId?: string;
  schemaVersion?: string;
  generatedAt?: string;
  expiresAt?: string;
  complete: boolean;
  checksum?: string;
};

// OffboardingDownloadResponse is the body for GET
// /admin/offboarding/requests/{requestUuid}/download. The downloadUrl is
// short-lived; callers must not log it or echo it into error messages.
export type OffboardingDownloadResponse = {
  requestUuid: string;
  downloadUrl: string;
  expiresAt?: string;
};

// OffboardingAcknowledgeResponse is the body for POST
// /admin/offboarding/requests/{requestUuid}/acknowledge.
export type OffboardingAcknowledgeResponse = {
  requestUuid: string;
  state?: string;
  acknowledgedAt?: string;
};

// OffboardingExecuteResponse is the body for POST
// /admin/offboarding/requests/{requestUuid}/execute. The waiver is echoed
// back with the server-stamped timestamp.
export type OffboardingExecuteResponse = {
  requestUuid: string;
  state?: string;
  executedAt?: string;
  waiver?: OffboardingWaiver;
};

// OffboardingRetryResponse is the body for POST
// /admin/offboarding/requests/{requestUuid}/retry.
export type OffboardingRetryResponse = {
  requestUuid: string;
  state?: string;
  retriedAt?: string;
};

// OffboardingReceiptPerStore is one row of the receipt's per-store summary.
// deletedCount is server-issued; retainedExceptionsCount covers legal holds
// and equivalent exclusions the SDK must not collapse.
export type OffboardingReceiptPerStore = {
  store: string;
  retentionClass: string;
  deletedCount: number;
  retainedExceptionsCount: number;
};

// OffboardingReceiptResponse is the body for GET
// /admin/offboarding/requests/{requestUuid}/receipt. finalState is the
// terminal state of the request; sha256 is the signed digest the client
// must store alongside its offboarding record.
export type OffboardingReceiptResponse = {
  requestUuid: string;
  tenantSlug: string;
  finalState: string;
  requestedByUserId?: string;
  requestedAt?: string;
  completedAt?: string;
  perStore: OffboardingReceiptPerStore[];
  waiver?: OffboardingWaiver | null;
  sha256?: string;
};

type AdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;

export class OffboardingClient {
  constructor(private readonly request: AdminRequester) {}

  // schedule writes a delayed offboarding schedule for the effective tenant.
  // The server pulls the tenant from the auth context; do not include
  // tenantSlug in the request body. The collection endpoint is POST
  // /offboarding/schedules.
  schedule(body: OffboardingScheduleRequest, options?: RequestOptions): Promise<OffboardingSchedule> {
    return this.request("POST", "/offboarding/schedules", body, options);
  }

  listSchedules(options?: RequestOptions): Promise<OffboardingScheduleListResponse> {
    return this.request("GET", "/offboarding/schedules", undefined, options);
  }

  // getSchedule reads the delayed offboarding schedule for a single tenant.
  // It targets the per-tenant route GET /offboarding/schedules/{tenantSlug},
  // which is distinct from the global listSchedules collection read.
  getSchedule(tenantSlug: string, options?: RequestOptions): Promise<OffboardingSchedule> {
    return this.request("GET", `/offboarding/schedules/${encodeURIComponent(tenantSlug)}`, undefined, options);
  }

  cancelSchedule(tenantSlug: string, body: OffboardingCancelRequest, options?: RequestOptions): Promise<void> {
    return this.request("POST", `/offboarding/schedules/${encodeURIComponent(tenantSlug)}/cancel`, body, options);
  }

  // request submits a one-off offboarding request for the effective tenant
  // via POST /offboarding. The confirmation field must match the tenant
  // slug the server reads from the auth context; mismatches fail with 400.
  requestOffboarding(body: OffboardingRequestCreate, options?: RequestOptions): Promise<OffboardingRequest> {
    return this.request("POST", "/offboarding", body, options);
  }

  getRequest(requestUuid: string, options?: RequestOptions): Promise<OffboardingRequest> {
    return this.request("GET", `/offboarding/${encodeURIComponent(requestUuid)}`, undefined, options);
  }

  cancelRequest(requestUuid: string, options?: RequestOptions): Promise<void> {
    return this.request("POST", `/offboarding/${encodeURIComponent(requestUuid)}/cancel`, undefined, options);
  }

  confirmRequest(requestUuid: string, options?: RequestOptions): Promise<void> {
    return this.request("POST", `/offboarding/${encodeURIComponent(requestUuid)}/confirm`, undefined, options);
  }

  // preview asks the server to compute the per-store inventory estimate for
  // the offboarding request. The result is server-issued and must be
  // surfaced verbatim; the SDK must not re-derive estimatedCount.
  preview(requestUuid: string, options?: RequestOptions): Promise<OffboardingPreviewResponse> {
    return this.request("POST", `/offboarding/requests/${encodeURIComponent(requestUuid)}/preview`, undefined, options);
  }

  // export triggers the destructive export packaging for a request. The
  // response is the per-request artifact metadata; the download URL is
  // fetched separately via download.
  export(requestUuid: string, options?: RequestOptions): Promise<OffboardingExportResponse> {
    return this.request("POST", `/offboarding/requests/${encodeURIComponent(requestUuid)}/export`, undefined, options);
  }

  // download returns a short-lived signed URL for the offboarding export
  // artifact. The downloadUrl is sensitive; callers must not log it or
  // echo it into error messages.
  download(requestUuid: string, options?: RequestOptions): Promise<OffboardingDownloadResponse> {
    return this.request("GET", `/offboarding/requests/${encodeURIComponent(requestUuid)}/download`, undefined, options);
  }

  // acknowledge records that the operator (or client) has accepted the
  // preview. After acknowledgment the server is willing to accept execute.
  acknowledge(requestUuid: string, options?: RequestOptions): Promise<OffboardingAcknowledgeResponse> {
    return this.request(
      "POST",
      `/offboarding/requests/${encodeURIComponent(requestUuid)}/acknowledge`,
      undefined,
      options,
    );
  }

  // execute triggers the destructive phase. The server requires a non-empty
  // waiver.role; an empty waiver returns 400 waiver_required, which the
  // SDK surfaces without retry.
  execute(
    requestUuid: string,
    body: OffboardingExecuteRequest,
    options?: RequestOptions,
  ): Promise<OffboardingExecuteResponse> {
    return this.request("POST", `/offboarding/requests/${encodeURIComponent(requestUuid)}/execute`, body, options);
  }

  // retry re-arms an offboarding request that previously failed. The server
  // decides whether the request is retryable; the SDK does not pre-filter.
  retry(requestUuid: string, options?: RequestOptions): Promise<OffboardingRetryResponse> {
    return this.request("POST", `/offboarding/requests/${encodeURIComponent(requestUuid)}/retry`, undefined, options);
  }

  // receipt returns the terminal offboarding receipt for a request. The
  // sha256 digest is the signed evidence the client must retain alongside
  // its offboarding record.
  receipt(requestUuid: string, options?: RequestOptions): Promise<OffboardingReceiptResponse> {
    return this.request("GET", `/offboarding/requests/${encodeURIComponent(requestUuid)}/receipt`, undefined, options);
  }
}
