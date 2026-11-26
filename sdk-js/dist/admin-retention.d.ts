import type { RequestOptions } from "./index.js";
/** Which data a retention policy row covers. */
export type RetentionScope = "tenant" | "data_space" | "event_type" | "global";
/** The classified store a retention policy row governs. */
export type RetentionClass = "raw" | "archive" | "materialized" | "cache" | "object" | "audit_event" | "audit_ip_address" | "audit_user_agent";
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
export declare class RetentionClient {
    private readonly request;
    constructor(request: AdminRequester);
    list(options?: RequestOptions): Promise<RetentionPolicyListResponse>;
    get(tenantSlug: string, options?: RequestOptions): Promise<RetentionPolicyListResponse>;
    upsert(tenantSlug: string, body: RetentionPolicyUpsertRequest, options?: RequestOptions): Promise<RetentionPolicy>;
    delete(tenantSlug: string, options?: RequestOptions): Promise<void>;
    preview(tenantSlug: string, options?: RequestOptions): Promise<RetentionRunPreview>;
    apply(tenantSlug: string, options?: RequestOptions): Promise<RetentionRunPreview>;
    listRuns(tenantSlug: string, page?: RetentionRunsPage, options?: RequestOptions): Promise<RetentionRunsListResponse>;
}
export {};
