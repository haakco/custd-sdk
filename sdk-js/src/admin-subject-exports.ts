// SubjectExportClient owns per-tenant subject export requests. The download
// surface returns artifact metadata the SDK surfaces only to the caller; its
// object keys are tenant data and must not be logged or echoed into errors.

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

/** force's options: companySlug names the tenant that owns the export. */
export type SubjectExportForceOptions = RequestOptions & { companySlug?: string };

type AdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;

function exportPath(requestId: string, action = ""): string {
  return `/subject-exports/${encodeURIComponent(requestId)}${action}`;
}

function normalizeExport(request: SubjectExport): SubjectExport {
  return { ...request, perStoreProgress: request.perStoreProgress ?? [] };
}

export class SubjectExportClient {
  constructor(private readonly request: AdminRequester) {}

  async create(body: SubjectExportCreateRequest, options?: RequestOptions): Promise<SubjectExport> {
    return normalizeExport(await this.request("POST", "/subject-exports", body, options));
  }

  /** Lists the tenant's subject exports, newest first. The server default is 100; it accepts 1 to 1000. */
  async list(limit?: number, options?: RequestOptions): Promise<SubjectExportListResponse> {
    const query = limit === undefined ? "" : `?${new URLSearchParams({ limit: String(limit) })}`;
    const list = await this.request<SubjectExportListResponse>("GET", `/subject-exports${query}`, undefined, options);
    return { requests: (list.requests ?? []).map(normalizeExport) };
  }

  async get(requestId: string, options?: RequestOptions): Promise<SubjectExport> {
    return normalizeExport(await this.request("GET", exportPath(requestId), undefined, options));
  }

  /** Stops a queued or running export and returns its cancelled status. */
  async cancel(requestId: string, options?: RequestOptions): Promise<SubjectExport> {
    return normalizeExport(await this.request("POST", exportPath(requestId, "/cancel"), undefined, options));
  }

  /** Returns one stored artifact's metadata; scope names the artifact. The object keys are tenant data; do not log them. */
  download(
    requestId: string,
    scope: SubjectExportArtifactScope,
    options?: RequestOptions,
  ): Promise<SubjectExportDownloadResponse> {
    const query = new URLSearchParams({ scope });
    return this.request("GET", `${exportPath(requestId, "/download")}?${query}`, undefined, options);
  }

  /**
   * Restarts a stuck export. The route is system-admin only and names the owning tenant in companySlug;
   * without one the client's actingCompanySlug is sent.
   */
  async force(requestId: string, options: SubjectExportForceOptions = {}): Promise<SubjectExport> {
    const { companySlug, ...requestOptions } = options;
    const query = companySlug ? `?${new URLSearchParams({ companySlug })}` : "";
    return normalizeExport(
      await this.request("POST", `${exportPath(requestId, "/force")}${query}`, undefined, requestOptions),
    );
  }
}
