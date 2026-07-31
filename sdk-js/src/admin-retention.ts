// RetentionClient owns per-tenant retention policies. Effective-tenant
// authority is enforced server-side; wrong-tenant requests return 404.

import type { RequestOptions } from "./index.js";

export type RetentionPolicy = {
  tenantSlug: string;
  maxAgeDays: number;
  hardDeleteAfterDays: number;
  applyToEventTypes: string[];
  applyToDataSpaces: string[];
};

export type RetentionPolicyUpsertRequest = {
  maxAgeDays: number;
  hardDeleteAfterDays: number;
  applyToEventTypes?: string[];
  applyToDataSpaces?: string[];
};

export type RetentionPolicyListResponse = {
  policies: RetentionPolicy[];
};

// RetentionRunDeletion is the per-store deletion estimate a preview returns.
// The count is server-computed; the SDK must not infer it client-side.
export type RetentionRunDeletion = {
  store: string;
  count: number;
};

// RetentionRunPreview is the body for POST
// /admin/retention/policies/{slug}/preview. The previewId is server-issued;
// the SDK does not mint it.
export type RetentionRunPreview = {
  previewId: string;
  tenantSlug: string;
  estimatedDeletions: RetentionRunDeletion[];
  previewedAt?: string;
};

// RetentionRun is the body element for GET
// /admin/retention/policies/{slug}/runs. completedAt is empty while the
// run is in flight.
export type RetentionRun = {
  runId: string;
  tenantSlug: string;
  state: string;
  startedAt?: string;
  completedAt?: string;
  deletedCount?: number;
};

export type RetentionRunsListResponse = {
  runs: RetentionRun[];
};

type AdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;

export class RetentionClient {
  constructor(private readonly request: AdminRequester) {}

  list(options?: RequestOptions): Promise<RetentionPolicyListResponse> {
    return this.request("GET", "/retention/policies", undefined, options);
  }

  get(tenantSlug: string, options?: RequestOptions): Promise<RetentionPolicy> {
    return this.request("GET", `/retention/policies/${encodeURIComponent(tenantSlug)}`, undefined, options);
  }

  upsert(tenantSlug: string, body: RetentionPolicyUpsertRequest, options?: RequestOptions): Promise<RetentionPolicy> {
    return this.request("PUT", `/retention/policies/${encodeURIComponent(tenantSlug)}`, body, options);
  }

  delete(tenantSlug: string, options?: RequestOptions): Promise<void> {
    return this.request("DELETE", `/retention/policies/${encodeURIComponent(tenantSlug)}`, undefined, options);
  }

  // Preview asks the server to compute a deletion estimate without applying
  // it. The estimate is server-issued; the SDK must surface it verbatim and
  // never round or re-derive the per-store counts.
  preview(tenantSlug: string, options?: RequestOptions): Promise<RetentionRunPreview> {
    return this.request("POST", `/retention/policies/${encodeURIComponent(tenantSlug)}/preview`, undefined, options);
  }

  // Apply submits the destructive retention run. The server is the authority
  // for whether deletion actually happens; the SDK must not pre-announce state.
  apply(tenantSlug: string, options?: RequestOptions): Promise<RetentionRun> {
    return this.request("POST", `/retention/policies/${encodeURIComponent(tenantSlug)}/apply`, undefined, options);
  }

  // ListRuns returns the retention runs for a single tenant. Empty runs list
  // is the canonical "no runs yet" response, not an error.
  listRuns(tenantSlug: string, options?: RequestOptions): Promise<RetentionRunsListResponse> {
    return this.request("GET", `/retention/policies/${encodeURIComponent(tenantSlug)}/runs`, undefined, options);
  }
}
