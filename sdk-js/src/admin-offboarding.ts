// OffboardingClient owns the offboarding schedule and one-off request
// surfaces. Its types mirror the current admin-api JSON wire contract.

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

// OffboardingRequest is the response shape for request, getRequest, and
// acknowledgement. The server calls the lifecycle field state (schedules
// use status).
export type OffboardingRequest = {
  requestUuid: string;
  state: string;
  requestedAt: string;
};

// OffboardingRequestCreate is the body for POST /offboarding. confirmation
// is the human-typed string the server compares against the tenant slug
// before accepting the destructive transition.
export type OffboardingRequestCreate = {
  confirmation: string;
};

// OffboardingPreviewStore is one row of the server-computed inventory. The
// SDK normalizes the server's snake_case durable fields for JavaScript callers.
export type OffboardingPreviewStore = {
  store: string;
  kind: string;
  retentionClass: string;
  estimatedCount: number;
  sourceAuthority?: string;
};

// OffboardingPreviewResponse is the body for POST
// /admin/offboarding/requests/{requestUuid}/preview.
export type OffboardingPreviewResponse = {
  requestUuid: string;
  generatedAt: string;
  expiresAt: string;
  stores: OffboardingPreviewStore[];
  exclusions?: Array<Record<string, unknown>>;
  previewInventoryDigest: string;
  complete: boolean;
  partial: boolean;
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
// /admin/offboarding/requests/{requestUuid}/execute. The server strictly
// decodes these top-level snake_case fields; waiver is not a nested object.
export type OffboardingExecuteRequest = {
  waiver: OffboardingWaiver;
};

// OffboardingExportResponse is the body for POST
// /admin/offboarding/requests/{requestUuid}/export.
export type OffboardingExportResponse = {
  requestUuid: string;
  checksumSha256: string;
  byteSize: number;
  recordCount: number;
  generatedAt: string;
  expiresAt: string;
  previewInventoryDigest: string;
};

// OffboardingDownloadResponse is the durable export descriptor returned by
// GET /admin/offboarding/requests/{requestUuid}/download. The downloadUrl is
// short-lived; callers must not log it or echo it into error messages. The
// remaining fields are the server's authoritative verification metadata.
export type OffboardingDownloadResponse = {
  requestUuid: string;
  downloadUrl: string;
  checksumSha256: string;
  byteSize: number;
  recordCount: number;
  generatedAt: string;
  expiresAt: string;
  previewInventoryDigest: string;
};

export type OffboardingAcknowledgeResponse = OffboardingRequest;

// Execute and retry return the same content-free receipt shape as GET receipt.
export type OffboardingExecuteResponse = OffboardingReceiptResponse;

export type OffboardingRetryResponse = OffboardingReceiptResponse;

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
// terminal state of the request; sha256 is the unkeyed integrity checksum the
// client must store alongside its offboarding record.
export type OffboardingReceiptResponse = {
  companyId: number;
  requestedByActor: string;
  requestedByUserId?: number | null;
  requestedAt: string;
  completedAt: string;
  finalState: string;
  perStore: OffboardingReceiptPerStore[];
  waiver?: OffboardingWaiver | null;
  sha256: string;
};

type AdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;

type WirePreviewStore = {
  store: string;
  kind: string;
  retention_class: string;
  estimated_count: number;
  source_authority?: string;
};

type WirePreviewResponse = Omit<OffboardingPreviewResponse, "stores"> & { stores: WirePreviewStore[] };
type WireReceiptPerStore = {
  store: string;
  retention_class: string;
  deleted_count: number;
  retained_exceptions_count: number;
};
type WireReceiptResponse = {
  company_id: number;
  requested_by_actor: string;
  requested_by_user_id?: number | null;
  requested_at: string;
  completed_at: string;
  final_state: string;
  per_store: WireReceiptPerStore[];
  waiver?: OffboardingWaiver | null;
  sha256: string;
};

function mapPreview(response: WirePreviewResponse): OffboardingPreviewResponse {
  return {
    ...response,
    stores: response.stores.map((store) => ({
      store: store.store,
      kind: store.kind,
      retentionClass: store.retention_class,
      estimatedCount: store.estimated_count,
      ...(store.source_authority ? { sourceAuthority: store.source_authority } : {}),
    })),
  };
}

function mapReceipt(response: WireReceiptResponse): OffboardingReceiptResponse {
  return {
    companyId: response.company_id,
    requestedByActor: response.requested_by_actor,
    requestedByUserId: response.requested_by_user_id,
    requestedAt: response.requested_at,
    completedAt: response.completed_at,
    finalState: response.final_state,
    perStore: response.per_store.map((store) => ({
      store: store.store,
      retentionClass: store.retention_class,
      deletedCount: store.deleted_count,
      retainedExceptionsCount: store.retained_exceptions_count,
    })),
    waiver: response.waiver,
    sha256: response.sha256,
  };
}

export class OffboardingClient {
  constructor(private readonly request: AdminRequester) {}

  // schedule writes a delayed offboarding schedule. tenantSlug is required and
  // must match the authenticated tenant scope.
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

  cancelSchedule(
    tenantSlug: string,
    body: OffboardingCancelRequest,
    options?: RequestOptions,
  ): Promise<OffboardingSchedule> {
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

  cancelRequest(
    requestUuid: string,
    body: OffboardingCancelRequest,
    options?: RequestOptions,
  ): Promise<OffboardingRequest> {
    return this.request("POST", `/offboarding/${encodeURIComponent(requestUuid)}/cancel`, body, options);
  }

  confirmRequest(requestUuid: string, options?: RequestOptions): Promise<OffboardingRequest> {
    return this.request("POST", `/offboarding/${encodeURIComponent(requestUuid)}/confirm`, undefined, options);
  }

  // preview asks the server to compute the per-store inventory estimate for
  // the offboarding request. The result is server-issued and must be
  // surfaced verbatim; the SDK must not re-derive estimatedCount.
  async preview(requestUuid: string, options?: RequestOptions): Promise<OffboardingPreviewResponse> {
    const response = await this.request<WirePreviewResponse>(
      "POST",
      `/offboarding/requests/${encodeURIComponent(requestUuid)}/preview`,
      undefined,
      options,
    );
    return mapPreview(response);
  }

  // export triggers the destructive export packaging for a request. The
  // response is the per-request artifact metadata; the download URL is
  // fetched separately via download.
  export(requestUuid: string, options?: RequestOptions): Promise<OffboardingExportResponse> {
    return this.request("POST", `/offboarding/requests/${encodeURIComponent(requestUuid)}/export`, undefined, options);
  }

  // download returns the durable export descriptor and a short-lived signed
  // URL for the offboarding artifact. The downloadUrl is sensitive; callers
  // must not log it or echo it into error messages.
  download(requestUuid: string, options?: RequestOptions): Promise<OffboardingDownloadResponse> {
    return this.request("GET", `/offboarding/requests/${encodeURIComponent(requestUuid)}/download`, undefined, options);
  }

  // acknowledge records that the export was downloaded successfully and its
  // inventory was confirmed. Never call it merely because preview succeeded.
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
    const wireBody = {
      waiver_role: body.waiver.role,
      waiver_reason: body.waiver.reason,
      ...(body.waiver.timestamp ? { waiver_timestamp: body.waiver.timestamp } : {}),
    };
    return this.request<WireReceiptResponse>(
      "POST",
      `/offboarding/requests/${encodeURIComponent(requestUuid)}/execute`,
      wireBody,
      options,
    ).then(mapReceipt);
  }

  // retry re-arms an offboarding request that previously failed. The server
  // decides whether the request is retryable; the SDK does not pre-filter.
  retry(requestUuid: string, options?: RequestOptions): Promise<OffboardingRetryResponse> {
    return this.request<WireReceiptResponse>(
      "POST",
      `/offboarding/requests/${encodeURIComponent(requestUuid)}/retry`,
      undefined,
      options,
    ).then(mapReceipt);
  }

  // receipt returns the terminal offboarding receipt for a request. The
  // sha256 is an unkeyed integrity checksum the client must retain alongside
  // its offboarding record; it is not an authenticity signature.
  receipt(requestUuid: string, options?: RequestOptions): Promise<OffboardingReceiptResponse> {
    return this.request<WireReceiptResponse>(
      "GET",
      `/offboarding/requests/${encodeURIComponent(requestUuid)}/receipt`,
      undefined,
      options,
    ).then(mapReceipt);
  }
}
