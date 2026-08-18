import type { RequestOptions } from "./index.js";
export type PredictionDefinition = {
    uuid: string;
    definition_key: string;
    display_name: string;
    description?: string;
    status: string;
    schedule_kind: string;
    default_horizon_seconds?: number;
    is_paused: boolean;
    created_at: string;
    updated_at: string;
};
export type PredictionDefinitionCreateRequest = {
    definition_key: string;
    display_name: string;
    description?: string;
};
export type PredictionDefinitionUpdateRequest = {
    definition_key?: string;
    display_name?: string;
    description?: string;
    revision: number;
};
export type PredictionDefinitionListResponse = {
    items: PredictionDefinition[];
    next_page_token?: string;
};
export type PredictionVersion = {
    uuid: string;
    version_uuid: string;
    version_number: number;
    version_status: string;
    definition_hash: string;
    definition: Record<string, unknown>;
    feature_count: number;
    source_count: number;
    created_by: string;
    created_at: string;
};
export type PredictionVersionPublishRequest = {
    definition: Record<string, unknown>;
    created_by: string;
};
export type PredictionActivateRequest = {
    version_uuid: string;
};
export type PredictionRollbackRequest = {
    version_uuid: string;
    reason?: string;
};
export type PredictionPauseRequest = {
    reason?: string;
};
export type PredictionRunNowRequest = {
    worker_id?: string;
};
export type PredictionSignalSource = {
    uuid: string;
    source_key: string;
    source_mode: string;
    display_name: string;
    description?: string;
    poll_interval_seconds?: number;
    source_status: string;
    is_paused: boolean;
    created_at: string;
    updated_at: string;
    last_succeeded_at?: string;
    consecutive_failed_count: number;
};
export type PredictionSignalSourceCreateRequest = {
    source_key: string;
    source_mode: string;
    display_name: string;
    description?: string;
    configuration: Record<string, unknown>;
    poll_interval_seconds?: number;
};
export type PredictionRunSummary = {
    run_uuid: string;
    as_of_at: string;
    horizon_end_at: string;
    output: number;
    baseline: number;
    override_applied: boolean;
    input_hash: string;
    engine_version: string;
    warning_count: number;
    generated_at: string;
    duration_milliseconds?: number;
};
export type PredictionOutcomeSummary = {
    run_uuid: string;
    resolution: string;
    outcome_kind: string;
    resolved_at?: string;
    observed_value: number;
    is_late_evidence: boolean;
};
export type PredictionEvaluationSummary = {
    window_start_at: string;
    window_end_at: string;
    resolved_run_count: number;
    positive_count: number;
    negative_count: number;
    brier_score?: number;
    log_loss?: number;
    sparse_bucket_count: number;
};
export type PredictionThresholdEvent = {
    version_uuid: string;
    hysteresis_state: string;
    direction: string;
    observed_value: number;
    threshold: number;
    trigger_run_uuid: string;
    dedup_key: string;
    emitted_at: string;
};
type AdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;
export declare class PredictionAdminClient {
    private readonly request;
    constructor(request: AdminRequester);
    listDefinitions(companySlug: string, pageSize?: number, pageToken?: string, options?: RequestOptions): Promise<PredictionDefinitionListResponse>;
    getDefinition(companySlug: string, definitionUuid: string, options?: RequestOptions): Promise<PredictionDefinition>;
    createDefinition(companySlug: string, body: PredictionDefinitionCreateRequest, options?: RequestOptions): Promise<PredictionDefinition>;
    updateDefinition(companySlug: string, definitionUuid: string, body: PredictionDefinitionUpdateRequest, options?: RequestOptions): Promise<PredictionDefinition>;
    getVersion(companySlug: string, definitionUuid: string, versionUuid: string, options?: RequestOptions): Promise<PredictionVersion>;
    publishVersion(companySlug: string, definitionUuid: string, body: PredictionVersionPublishRequest, options?: RequestOptions): Promise<PredictionVersion>;
    activateVersion(companySlug: string, definitionUuid: string, body: PredictionActivateRequest, options?: RequestOptions): Promise<PredictionVersion>;
    rollbackVersion(companySlug: string, definitionUuid: string, body: PredictionRollbackRequest, options?: RequestOptions): Promise<PredictionVersion>;
    pauseDefinition(companySlug: string, definitionUuid: string, body?: PredictionPauseRequest, options?: RequestOptions): Promise<void>;
    resumeDefinition(companySlug: string, definitionUuid: string, options?: RequestOptions): Promise<void>;
    archiveDefinition(companySlug: string, definitionUuid: string, options?: RequestOptions): Promise<void>;
    runNow(companySlug: string, definitionUuid: string, body?: PredictionRunNowRequest, options?: RequestOptions): Promise<void>;
    listRuns(companySlug: string, definitionUuid: string, pageSize?: number, options?: RequestOptions): Promise<PredictionRunSummary[]>;
    listOutcomes(companySlug: string, definitionUuid: string, pageSize?: number, options?: RequestOptions): Promise<PredictionOutcomeSummary[]>;
    getEvaluation(companySlug: string, definitionUuid: string, options?: RequestOptions): Promise<PredictionEvaluationSummary>;
    listThresholdEvents(companySlug: string, definitionUuid: string, pageSize?: number, options?: RequestOptions): Promise<PredictionThresholdEvent[]>;
    listSignalSources(companySlug: string, pageSize?: number, pageToken?: string, options?: RequestOptions): Promise<PredictionSignalSource[]>;
    getSignalSource(companySlug: string, sourceUuid: string, options?: RequestOptions): Promise<PredictionSignalSource>;
    createSignalSource(companySlug: string, body: PredictionSignalSourceCreateRequest, options?: RequestOptions): Promise<PredictionSignalSource>;
    activateSignalSource(companySlug: string, sourceUuid: string, options?: RequestOptions): Promise<void>;
    archiveSignalSource(companySlug: string, sourceUuid: string, options?: RequestOptions): Promise<void>;
}
export {};
