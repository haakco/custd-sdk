// RetentionClient owns per-tenant retention policies. Effective-tenant
// authority is enforced server-side; wrong-tenant requests return 404.

import type { RequestOptions } from "./index.js";

/** Which data a retention policy row covers. */
export type RetentionScope = "tenant" | "data_space" | "event_type" | "global";

/** The classified store a retention policy row governs. */
export type RetentionClass =
  | "raw"
  | "archive"
  | "materialized"
  | "cache"
  | "object"
  | "audit_event"
  | "audit_ip_address"
  | "audit_user_agent";

/** One bounded retention policy row. */
export type RetentionPolicy = {
  id: number;
  companyId?: number;
  scope: RetentionScope;
  retentionClass: RetentionClass;
  maxAgeSeconds: number;
  precedence: number;
  legalHold: boolean;
  legalHoldUntil?: string;
  effectiveAt: string;
  expiresAt?: string;
  nextRunAt?: string;
  lastResult?: string;
  lastAffectedCounts: Record<string, number>;
  lastError?: string;
  auditId?: number;
};

/**
 * The body for PUT /admin/retention/policies/{tenantSlug}. legalHold is
 * system-admin only and needs a future legalHoldUntil plus an opaque
 * legalHoldReference.
 */
export type RetentionPolicyUpsertRequest = {
  scope: RetentionScope;
  retentionClass: RetentionClass;
  maxAgeSeconds: number;
  precedence: number;
  legalHold: boolean;
  legalHoldUntil?: string;
  legalHoldReference?: string;
  effectiveAt?: string;
  expiresAt?: string;
};

/** The policies for every tenant (list) or one tenant (get). */
export type RetentionPolicyListResponse = {
  policies: RetentionPolicy[];
};

/** One classified store's share of a retention preview or apply. */
export type RetentionStoreBreakdown = {
  store: string;
  retentionClass: string;
  candidateCount: number;
  estimatedAffected: number;
  sampleSubjects: string[];
  legalHoldCount: number;
};

/**
 * The body for preview and apply. lastResult is "preview" for a dry run and
 * "applied" for a live run; lastAffectedCounts is set only for an apply.
 */
export type RetentionRunPreview = {
  perStore: RetentionStoreBreakdown[];
  nextRunAt?: string;
  lastResult: string;
  lastAffectedCounts?: Record<string, number>;
  lastError?: string;
  safeNextAction: string;
  startedAt: string;
  completedAt: string;
};

/** One historical retention run. */
export type RetentionRun = {
  startAt: string;
  endAt: string;
  lastResult: string;
  lastAffectedCounts: Record<string, number>;
  lastError?: string;
  auditId?: number;
};

/** One page of retention runs. Follow nextOffset while hasMore. */
export type RetentionRunsListResponse = {
  runs: RetentionRun[];
  nextOffset: number;
  hasMore: boolean;
};

/** A page of retention runs: limit defaults to 25 server-side, offset to 0. */
export type RetentionRunsPage = {
  limit?: number;
  offset?: number;
};

type AdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;

function policyPath(tenantSlug: string): string {
  return `/retention/policies/${encodeURIComponent(tenantSlug)}`;
}

function policyList(list: RetentionPolicyListResponse): RetentionPolicyListResponse {
  return { policies: (list.policies ?? []).map(normalizePolicy) };
}

function normalizePolicy(policy: RetentionPolicy): RetentionPolicy {
  return { ...policy, lastAffectedCounts: policy.lastAffectedCounts ?? {} };
}

function runPreview(preview: RetentionRunPreview): RetentionRunPreview {
  return {
    ...preview,
    perStore: (preview.perStore ?? []).map((store) => ({ ...store, sampleSubjects: store.sampleSubjects ?? [] })),
  };
}

export class RetentionClient {
  constructor(private readonly request: AdminRequester) {}

  async list(options?: RequestOptions): Promise<RetentionPolicyListResponse> {
    return policyList(await this.request("GET", "/retention/policies", undefined, options));
  }

  async get(tenantSlug: string, options?: RequestOptions): Promise<RetentionPolicyListResponse> {
    return policyList(await this.request("GET", policyPath(tenantSlug), undefined, options));
  }

  async upsert(
    tenantSlug: string,
    body: RetentionPolicyUpsertRequest,
    options?: RequestOptions,
  ): Promise<RetentionPolicy> {
    return normalizePolicy(await this.request("PUT", policyPath(tenantSlug), body, options));
  }

  delete(tenantSlug: string, options?: RequestOptions): Promise<void> {
    return this.request("DELETE", policyPath(tenantSlug), undefined, options);
  }

  // Preview asks the server to compute a deletion estimate without applying
  // it. The estimate is server-issued; the SDK must surface it verbatim and
  // never round or re-derive the per-store counts.
  async preview(tenantSlug: string, options?: RequestOptions): Promise<RetentionRunPreview> {
    return runPreview(await this.request("POST", `${policyPath(tenantSlug)}/preview`, undefined, options));
  }

  // Apply submits the destructive retention run. The server is the authority
  // for whether deletion actually happens; the SDK must not pre-announce state.
  async apply(tenantSlug: string, options?: RequestOptions): Promise<RetentionRunPreview> {
    return runPreview(await this.request("POST", `${policyPath(tenantSlug)}/apply`, undefined, options));
  }

  // ListRuns returns the retention runs for a single tenant. Empty runs list
  // is the canonical "no runs yet" response, not an error.
  async listRuns(
    tenantSlug: string,
    page: RetentionRunsPage = {},
    options?: RequestOptions,
  ): Promise<RetentionRunsListResponse> {
    const query = new URLSearchParams();
    if (page.limit !== undefined) query.set("limit", String(page.limit));
    if (page.offset !== undefined) query.set("offset", String(page.offset));
    const suffix = query.toString() ? `?${query}` : "";
    const runs = await this.request<RetentionRunsListResponse>(
      "GET",
      `${policyPath(tenantSlug)}/runs${suffix}`,
      undefined,
      options,
    );
    return {
      ...runs,
      runs: (runs.runs ?? []).map((run) => ({ ...run, lastAffectedCounts: run.lastAffectedCounts ?? {} })),
    };
  }
}
