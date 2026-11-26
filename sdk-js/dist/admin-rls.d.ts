/**
 * Row-level security status and reconciliation plans. A plan records the policy state the catalogue
 * expects; executing it converges the live database and returns a diff plus the SQL that undoes it.
 * Creating and executing a plan both require an idempotency key.
 */
import type { RequestOptions } from "./index.js";
/** One table's row-level security policy. */
export type RlsPolicySpec = {
    enabled: boolean;
    force: boolean;
    policy_name: string;
};
/** One table's live policy compared with the catalogue. */
export type RlsTableDiff = {
    table: string;
    classification: string;
    drift: boolean;
    desired?: RlsPolicySpec;
    live?: RlsPolicySpec;
    reason?: string;
};
export type RlsStatus = {
    catalog_version: string;
    catalog_digest: string;
    tables: RlsTableDiff[];
};
/** A table's policy before and after reconciliation. */
export type RlsPolicyDiff = {
    table: string;
    converged: boolean;
    desired: RlsPolicySpec;
    live: RlsPolicySpec;
    drift: string[];
};
export type RlsPlanRequest = {
    label: string;
    git_commit: string;
    expires_in_seconds?: number;
};
/** One catalogue decision the plan expects to hold. */
export type RlsExpectedTable = {
    table: string;
    classification: string;
    reason?: string;
};
export type RlsPlan = {
    plan_uuid: string;
    label: string;
    git_commit: string;
    catalog_version: string;
    catalog_digest: string;
    target_tables: string[];
    expected_state: RlsExpectedTable[];
    reversible_sql_digest: string;
    created_at: string;
    expires_at: string;
    idempotency_key: string;
    actor_id: string;
};
export type RlsExecuteRequest = {
    force?: boolean;
};
export type RlsExecuteOutcome = "attempted" | "success" | "failure";
export type RlsExecuteResponse = {
    plan_uuid: string;
    outcome: RlsExecuteOutcome;
    diff: RlsPolicyDiff[];
    rollback_sql: string;
    started_at: string;
    finished_at: string;
};
export type RlsProof = {
    plan_uuid: string;
    diff: RlsPolicyDiff[];
    before: Record<string, RlsPolicySpec>;
    after: Record<string, RlsPolicySpec>;
    rollback_sql: string;
    attempted_at: string;
    completed_at: string;
};
/** Plan creation and execution are rejected without an idempotency key. */
export type RlsIdempotentOptions = RequestOptions & {
    idempotencyKey: string;
};
type AdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;
export declare class RlsAdminClient {
    private readonly request;
    constructor(request: AdminRequester);
    status(options?: RequestOptions): Promise<RlsStatus>;
    createPlan(body: RlsPlanRequest, options: RlsIdempotentOptions): Promise<RlsPlan>;
    executePlan(planUuid: string, body: RlsExecuteRequest, options: RlsIdempotentOptions): Promise<RlsExecuteResponse>;
    getPlanProof(planUuid: string, options?: RequestOptions): Promise<RlsProof>;
}
export {};
