import type { RequestOptions } from "./index.js";

/** What a prediction definition forecasts. */
export type PredictionProjectKind =
  | "deadline_forecast"
  | "runway_forecast"
  | "decision_analysis"
  | "calibration"
  | "duration"
  | "event_probability";

export type PredictionDefinition = {
  uuid: string;
  definition_key: string;
  display_name: string;
  description?: string;
  project_kind: PredictionProjectKind;
  status: string;
  schedule_kind: string;
  default_horizon_seconds?: number;
  is_paused: boolean;
  active_version_uuid?: string;
  candidate_version_uuid?: string;
  candidate_version_count?: number;
  created_at: string;
  updated_at: string;
};

export type PredictionDefinitionCreateRequest = {
  definition_key: string;
  display_name: string;
  description?: string;
  project_kind?: PredictionProjectKind;
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

export type PredictionActivateRequest = { version_uuid: string; reason?: string };
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

export type PredictionSignalSourceListResponse = {
  sources: PredictionSignalSource[];
  next_page_token?: string;
};

export type PredictionRunListResponse = {
  runs: PredictionRunSummary[];
};

export type PredictionOutcomeListResponse = {
  outcomes: PredictionOutcomeSummary[];
};

export type PredictionThresholdEventListResponse = {
  events: PredictionThresholdEvent[];
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

/** Scores a definition's duration forecasts against one plan block's completed history. */
export type PredictionDurationEvaluationRequest = {
  planUuid: string;
  semanticKey: string;
  predictionVersionUuid?: string;
  asOf?: string;
  windowStart?: string;
  limit?: number;
};

export type DurationForecastMethod = "nominal" | "duration_shrinkage";

export type DurationForecastInterval = { p10_ms?: number; p90_ms?: number };

/** One held-out run of the rolling-origin evaluation. Fields are as the measurement owner stores them. */
export type DurationForecastEvaluationFold = {
  fold_number: number;
  held_out_run_id: string;
  observed_at: string;
  actual_ms: number;
  training_sample_count: number;
  nominal_point_ms: number;
  nominal_absolute_error_ms: number;
  shrinkage_point_ms: number;
  shrinkage_absolute_error_ms: number;
  shrinkage_interval: DurationForecastInterval;
};

export type DurationForecastEvaluationMetric = {
  method: DurationForecastMethod;
  evaluated_fold_count: number;
  mean_absolute_error_ms: number;
  interval: {
    available_fold_count: number;
    covered_fold_count: number;
    coverage: number;
    mean_width_ms: number;
  };
};

export type DurationForecastEvaluation = {
  tenant_id: string;
  project_id: string;
  series_id: string;
  as_of: string;
  input_hash: string;
  primary_metric: string;
  minimum_training_history: number;
  fold_count: number;
  definition: {
    method: DurationForecastMethod;
    method_version: string;
    minimum_history: number;
    prior_weight: number;
    schema_version: string;
  };
  folds: DurationForecastEvaluationFold[];
  metrics: { nominal: DurationForecastEvaluationMetric; shrinkage: DurationForecastEvaluationMetric };
};

/** The stored evaluation artifact and the checksum of its content. */
export type DurationForecastEvaluationArtifact = {
  schema_version: string;
  source: string;
  prediction_version_uuid: string;
  content_sha256: string;
  evaluation: DurationForecastEvaluation;
};

export type PredictionDurationEvaluationVersionHistoryEntry = {
  versionUuid: string;
  transitionKind: string;
  fromStatus: string;
  toStatus: string;
  actor: string;
  reason: string;
  transitionedAt: string;
};

export type PredictionDurationEvaluation = {
  definitionUuid: string;
  planUuid: string;
  semanticKey: string;
  outcomes: { eligible: number; censored: number; cancelled: number; skipped: number; notRun: number };
  versionEvidence: {
    activeVersionUuid?: string;
    selected: { uuid: string; versionNumber: number; status: string; createdAt: string };
    history: { items: PredictionDurationEvaluationVersionHistoryEntry[] };
  };
  artifact: DurationForecastEvaluationArtifact;
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

  async listRuns(
    companySlug: string,
    definitionUuid: string,
    pageSize?: number,
    options?: RequestOptions,
  ): Promise<PredictionRunListResponse> {
    const list = await this.request<PredictionRunListResponse>(
      "GET",
      collectionPath(`/definitions/${definitionUuid}/runs`, companySlug, pageSize),
      undefined,
      options,
    );
    return { runs: list.runs ?? [] };
  }

  async listOutcomes(
    companySlug: string,
    definitionUuid: string,
    pageSize?: number,
    options?: RequestOptions,
  ): Promise<PredictionOutcomeListResponse> {
    const list = await this.request<PredictionOutcomeListResponse>(
      "GET",
      collectionPath(`/definitions/${definitionUuid}/outcomes`, companySlug, pageSize),
      undefined,
      options,
    );
    return { outcomes: list.outcomes ?? [] };
  }

  getEvaluation(companySlug: string, definitionUuid: string, options?: RequestOptions) {
    return this.request<PredictionEvaluationSummary>(
      "GET",
      resourcePath(`/definitions/${definitionUuid}/evaluations`, companySlug),
      undefined,
      options,
    );
  }

  async evaluateDurationHistory(
    companySlug: string,
    definitionUuid: string,
    body: PredictionDurationEvaluationRequest,
    options?: RequestOptions,
  ): Promise<PredictionDurationEvaluation> {
    const evaluation = await this.request<PredictionDurationEvaluation>(
      "POST",
      resourcePath(`/definitions/${definitionUuid}/duration-evaluations`, companySlug),
      body,
      options,
    );
    const { versionEvidence, artifact } = evaluation;
    return {
      ...evaluation,
      versionEvidence: { ...versionEvidence, history: { items: versionEvidence.history?.items ?? [] } },
      artifact: { ...artifact, evaluation: { ...artifact.evaluation, folds: artifact.evaluation.folds ?? [] } },
    };
  }

  async listThresholdEvents(
    companySlug: string,
    definitionUuid: string,
    pageSize?: number,
    options?: RequestOptions,
  ): Promise<PredictionThresholdEventListResponse> {
    const list = await this.request<PredictionThresholdEventListResponse>(
      "GET",
      collectionPath(`/definitions/${definitionUuid}/threshold-events`, companySlug, pageSize),
      undefined,
      options,
    );
    return { events: list.events ?? [] };
  }

  async listSignalSources(
    companySlug: string,
    pageSize?: number,
    pageToken?: string,
    options?: RequestOptions,
  ): Promise<PredictionSignalSourceListResponse> {
    const list = await this.request<PredictionSignalSourceListResponse>(
      "GET",
      collectionPath("/sources", companySlug, pageSize, pageToken),
      undefined,
      options,
    );
    return { ...list, sources: list.sources ?? [] };
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
