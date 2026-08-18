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

export type PredictionActivateRequest = { version_uuid: string };
export type PredictionRollbackRequest = { version_uuid: string; reason?: string };
export type PredictionPauseRequest = { reason?: string };
export type PredictionRunNowRequest = { worker_id?: string };

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

export class PredictionAdminClient {
  constructor(private readonly request: AdminRequester) {}

  listDefinitions(companySlug: string, pageSize?: number, pageToken?: string, options?: RequestOptions) {
    return this.request<PredictionDefinitionListResponse>(
      "GET",
      collectionPath("/definitions", companySlug, pageSize, pageToken),
      undefined,
      options,
    );
  }

  getDefinition(companySlug: string, definitionUuid: string, options?: RequestOptions) {
    return this.request<PredictionDefinition>(
      "GET",
      resourcePath(`/definitions/${definitionUuid}`, companySlug),
      undefined,
      options,
    );
  }

  createDefinition(companySlug: string, body: PredictionDefinitionCreateRequest, options?: RequestOptions) {
    return this.request<PredictionDefinition>("POST", collectionPath("/definitions", companySlug), body, options);
  }

  updateDefinition(
    companySlug: string,
    definitionUuid: string,
    body: PredictionDefinitionUpdateRequest,
    options?: RequestOptions,
  ) {
    return this.request<PredictionDefinition>(
      "PATCH",
      resourcePath(`/definitions/${definitionUuid}`, companySlug),
      body,
      options,
    );
  }

  getVersion(companySlug: string, definitionUuid: string, versionUuid: string, options?: RequestOptions) {
    return this.request<PredictionVersion>(
      "GET",
      resourcePath(`/definitions/${definitionUuid}/versions/${versionUuid}`, companySlug),
      undefined,
      options,
    );
  }

  publishVersion(
    companySlug: string,
    definitionUuid: string,
    body: PredictionVersionPublishRequest,
    options?: RequestOptions,
  ) {
    return this.request<PredictionVersion>(
      "POST",
      resourcePath(`/definitions/${definitionUuid}/publish`, companySlug),
      body,
      options,
    );
  }

  activateVersion(
    companySlug: string,
    definitionUuid: string,
    body: PredictionActivateRequest,
    options?: RequestOptions,
  ) {
    return this.request<PredictionVersion>(
      "POST",
      resourcePath(`/definitions/${definitionUuid}/activate`, companySlug),
      body,
      options,
    );
  }

  rollbackVersion(
    companySlug: string,
    definitionUuid: string,
    body: PredictionRollbackRequest,
    options?: RequestOptions,
  ) {
    return this.request<PredictionVersion>(
      "POST",
      resourcePath(`/definitions/${definitionUuid}/rollback`, companySlug),
      body,
      options,
    );
  }

  pauseDefinition(
    companySlug: string,
    definitionUuid: string,
    body: PredictionPauseRequest = {},
    options?: RequestOptions,
  ) {
    return this.request<void>("POST", resourcePath(`/definitions/${definitionUuid}/pause`, companySlug), body, options);
  }

  resumeDefinition(companySlug: string, definitionUuid: string, options?: RequestOptions) {
    return this.request<void>(
      "POST",
      resourcePath(`/definitions/${definitionUuid}/resume`, companySlug),
      undefined,
      options,
    );
  }

  archiveDefinition(companySlug: string, definitionUuid: string, options?: RequestOptions) {
    return this.request<void>(
      "POST",
      resourcePath(`/definitions/${definitionUuid}/archive`, companySlug),
      undefined,
      options,
    );
  }

  runNow(companySlug: string, definitionUuid: string, body: PredictionRunNowRequest = {}, options?: RequestOptions) {
    return this.request<void>(
      "POST",
      resourcePath(`/definitions/${definitionUuid}/run-now`, companySlug),
      body,
      options,
    );
  }

  listRuns(companySlug: string, definitionUuid: string, pageSize?: number, options?: RequestOptions) {
    return this.request<PredictionRunSummary[]>(
      "GET",
      collectionPath(`/definitions/${definitionUuid}/runs`, companySlug, pageSize),
      undefined,
      options,
    );
  }

  listOutcomes(companySlug: string, definitionUuid: string, pageSize?: number, options?: RequestOptions) {
    return this.request<PredictionOutcomeSummary[]>(
      "GET",
      collectionPath(`/definitions/${definitionUuid}/outcomes`, companySlug, pageSize),
      undefined,
      options,
    );
  }

  getEvaluation(companySlug: string, definitionUuid: string, options?: RequestOptions) {
    return this.request<PredictionEvaluationSummary>(
      "GET",
      resourcePath(`/definitions/${definitionUuid}/evaluations`, companySlug),
      undefined,
      options,
    );
  }

  listThresholdEvents(companySlug: string, definitionUuid: string, pageSize?: number, options?: RequestOptions) {
    return this.request<PredictionThresholdEvent[]>(
      "GET",
      collectionPath(`/definitions/${definitionUuid}/threshold-events`, companySlug, pageSize),
      undefined,
      options,
    );
  }

  listSignalSources(companySlug: string, pageSize?: number, pageToken?: string, options?: RequestOptions) {
    return this.request<PredictionSignalSource[]>(
      "GET",
      collectionPath("/sources", companySlug, pageSize, pageToken),
      undefined,
      options,
    );
  }

  getSignalSource(companySlug: string, sourceUuid: string, options?: RequestOptions) {
    return this.request<PredictionSignalSource>(
      "GET",
      resourcePath(`/sources/${sourceUuid}`, companySlug),
      undefined,
      options,
    );
  }

  createSignalSource(companySlug: string, body: PredictionSignalSourceCreateRequest, options?: RequestOptions) {
    return this.request<PredictionSignalSource>("POST", collectionPath("/sources", companySlug), body, options);
  }

  activateSignalSource(companySlug: string, sourceUuid: string, options?: RequestOptions) {
    return this.request<void>("POST", resourcePath(`/sources/${sourceUuid}/activate`, companySlug), undefined, options);
  }

  archiveSignalSource(companySlug: string, sourceUuid: string, options?: RequestOptions) {
    return this.request<void>("POST", resourcePath(`/sources/${sourceUuid}/archive`, companySlug), undefined, options);
  }
}

function collectionPath(path: string, companySlug: string, pageSize?: number, pageToken?: string): string {
  const query = new URLSearchParams({ companySlug });
  if (pageSize !== undefined) query.set("pageSize", String(pageSize));
  if (pageToken !== undefined) query.set("pageToken", pageToken);
  return `/measurement/predictions${path}?${query.toString()}`;
}

function resourcePath(path: string, companySlug: string): string {
  const encodedPath = path
    .split("/")
    .map((segment, index) => (index === 0 ? segment : encodeURIComponent(segment)))
    .join("/");
  return collectionPath(encodedPath, companySlug);
}
