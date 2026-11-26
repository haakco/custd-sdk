//! Prediction definitions, versions, runs, outcomes, evaluations, threshold events and signal
//! sources (Admin API `/api/v1/admin/measurement/predictions`).
//!
//! Request and response shapes follow the admin-api OpenAPI document.

use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::Result;
use crate::api_path::{NO_BODY, api_path};
use crate::client::CustdClient;
use crate::measurement::null_as_empty;
use crate::transport::{Method, percent_encode};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementPredictionDefinitionListResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub items: Vec<MeasurementPredictionDefinition>,
    #[serde(
        rename = "next_page_token",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub next_page_token: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementPredictionDefinition {
    #[serde(
        rename = "active_version_uuid",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub active_version_uuid: Option<String>,
    #[serde(
        rename = "candidate_version_count",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub candidate_version_count: Option<i64>,
    #[serde(
        rename = "candidate_version_uuid",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub candidate_version_uuid: Option<String>,
    #[serde(
        rename = "default_horizon_seconds",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub default_horizon_seconds: Option<i64>,
    #[serde(rename = "definition_key")]
    pub definition_key: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(rename = "display_name")]
    pub display_name: String,
    #[serde(rename = "is_paused")]
    pub is_paused: bool,
    #[serde(rename = "project_kind")]
    pub project_kind: String,
    #[serde(rename = "schedule_kind")]
    pub schedule_kind: String,
    pub status: String,
    pub uuid: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementPredictionDefinitionCreateRequest {
    #[serde(rename = "definition_key")]
    pub definition_key: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(rename = "display_name")]
    pub display_name: String,
    #[serde(
        rename = "project_kind",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub project_kind: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementPredictionDefinitionUpdateRequest {
    #[serde(rename = "definition_key")]
    pub definition_key: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(
        rename = "display_name",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub display_name: Option<String>,
    pub revision: i64,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementPredictionActivateRequest {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub reason: Option<String>,
    #[serde(rename = "version_uuid")]
    pub version_uuid: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementPredictionVersion {
    #[serde(rename = "created_at")]
    pub created_at: String,
    #[serde(rename = "created_by")]
    pub created_by: String,
    pub definition: Value,
    #[serde(rename = "definition_hash")]
    pub definition_hash: String,
    #[serde(rename = "feature_count")]
    pub feature_count: i64,
    #[serde(rename = "source_count")]
    pub source_count: i64,
    pub uuid: String,
    #[serde(rename = "version_number")]
    pub version_number: i64,
    #[serde(rename = "version_status")]
    pub version_status: String,
    #[serde(rename = "version_uuid")]
    pub version_uuid: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementPredictionPauseRequest {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub reason: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementDurationEvaluationRequest {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub as_of: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub limit: Option<i64>,
    pub plan_uuid: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub prediction_version_uuid: Option<String>,
    pub semantic_key: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub window_start: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementDurationEvaluationResponse {
    pub artifact: DurationForecastEvaluationArtifact,
    pub definition_uuid: String,
    pub outcomes: MeasurementDurationEvaluationOutcomeCounts,
    pub plan_uuid: String,
    pub semantic_key: String,
    pub version_evidence: MeasurementDurationEvaluationVersionEvidence,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DurationForecastEvaluationArtifact {
    #[serde(rename = "content_sha256")]
    pub content_sha256: String,
    pub evaluation: DurationForecastEvaluation,
    #[serde(rename = "prediction_version_uuid")]
    pub prediction_version_uuid: String,
    #[serde(rename = "schema_version")]
    pub schema_version: String,
    pub source: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementDurationEvaluationOutcomeCounts {
    pub cancelled: i64,
    pub censored: i64,
    pub eligible: i64,
    pub not_run: i64,
    pub skipped: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementDurationEvaluationVersionEvidence {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub active_version_uuid: Option<String>,
    pub history: MeasurementDurationEvaluationVersionHistory,
    pub selected: MeasurementDurationEvaluationVersion,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DurationForecastEvaluation {
    #[serde(rename = "as_of")]
    pub as_of: String,
    pub definition: DurationForecastDefinition,
    #[serde(rename = "fold_count")]
    pub fold_count: i64,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub folds: Vec<DurationForecastEvaluationFold>,
    #[serde(rename = "input_hash")]
    pub input_hash: String,
    pub metrics: DurationForecastEvaluationMetrics,
    #[serde(rename = "minimum_training_history")]
    pub minimum_training_history: i64,
    #[serde(rename = "primary_metric")]
    pub primary_metric: String,
    #[serde(rename = "project_id")]
    pub project_id: String,
    #[serde(rename = "series_id")]
    pub series_id: String,
    #[serde(rename = "tenant_id")]
    pub tenant_id: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementDurationEvaluationVersionHistory {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub items: Vec<MeasurementDurationEvaluationVersionHistoryEntry>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementDurationEvaluationVersion {
    pub created_at: String,
    pub status: String,
    pub uuid: String,
    pub version_number: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DurationForecastDefinition {
    pub method: String,
    #[serde(rename = "method_version")]
    pub method_version: String,
    #[serde(rename = "minimum_history")]
    pub minimum_history: i64,
    #[serde(rename = "prior_weight")]
    pub prior_weight: i64,
    #[serde(rename = "schema_version")]
    pub schema_version: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DurationForecastEvaluationFold {
    #[serde(rename = "actual_ms")]
    pub actual_ms: i64,
    #[serde(rename = "fold_number")]
    pub fold_number: i64,
    #[serde(rename = "held_out_run_id")]
    pub held_out_run_id: String,
    #[serde(rename = "nominal_absolute_error_ms")]
    pub nominal_absolute_error_ms: i64,
    #[serde(rename = "nominal_point_ms")]
    pub nominal_point_ms: i64,
    #[serde(rename = "observed_at")]
    pub observed_at: String,
    #[serde(rename = "shrinkage_absolute_error_ms")]
    pub shrinkage_absolute_error_ms: i64,
    #[serde(rename = "shrinkage_interval")]
    pub shrinkage_interval: DurationForecastInterval,
    #[serde(rename = "shrinkage_point_ms")]
    pub shrinkage_point_ms: i64,
    #[serde(rename = "training_sample_count")]
    pub training_sample_count: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DurationForecastEvaluationMetrics {
    pub nominal: DurationForecastEvaluationMetric,
    pub shrinkage: DurationForecastEvaluationMetric,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementDurationEvaluationVersionHistoryEntry {
    pub actor: String,
    pub from_status: String,
    pub reason: String,
    pub to_status: String,
    pub transition_kind: String,
    pub transitioned_at: String,
    pub version_uuid: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DurationForecastInterval {
    #[serde(rename = "p10_ms", default, skip_serializing_if = "Option::is_none")]
    pub p10_ms: Option<i64>,
    #[serde(rename = "p90_ms", default, skip_serializing_if = "Option::is_none")]
    pub p90_ms: Option<i64>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DurationForecastEvaluationMetric {
    #[serde(rename = "evaluated_fold_count")]
    pub evaluated_fold_count: i64,
    pub interval: DurationForecastIntervalEvaluation,
    #[serde(rename = "mean_absolute_error_ms")]
    pub mean_absolute_error_ms: f64,
    pub method: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DurationForecastIntervalEvaluation {
    #[serde(rename = "available_fold_count")]
    pub available_fold_count: i64,
    pub coverage: f64,
    #[serde(rename = "covered_fold_count")]
    pub covered_fold_count: i64,
    #[serde(rename = "mean_width_ms")]
    pub mean_width_ms: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementPredictionVersionPublishRequest {
    #[serde(rename = "created_by")]
    pub created_by: String,
    pub definition: Value,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementPredictionRunNowRequest {
    #[serde(rename = "worker_id", default, skip_serializing_if = "Option::is_none")]
    pub worker_id: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementPredictionEvaluationSummary {
    #[serde(
        rename = "brier_score",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub brier_score: Option<f64>,
    #[serde(rename = "log_loss", default, skip_serializing_if = "Option::is_none")]
    pub log_loss: Option<f64>,
    #[serde(rename = "negative_count")]
    pub negative_count: i64,
    #[serde(rename = "positive_count")]
    pub positive_count: i64,
    #[serde(rename = "resolved_run_count")]
    pub resolved_run_count: i64,
    #[serde(rename = "sparse_bucket_count")]
    pub sparse_bucket_count: i64,
    #[serde(rename = "window_end_at")]
    pub window_end_at: String,
    #[serde(rename = "window_start_at")]
    pub window_start_at: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementPredictionOutcomeListResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub outcomes: Vec<MeasurementPredictionOutcomeSummary>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementPredictionOutcomeSummary {
    #[serde(rename = "is_late_evidence")]
    pub is_late_evidence: bool,
    #[serde(rename = "observed_value")]
    pub observed_value: i64,
    #[serde(rename = "outcome_kind")]
    pub outcome_kind: String,
    pub resolution: String,
    #[serde(
        rename = "resolved_at",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub resolved_at: Option<String>,
    #[serde(rename = "run_uuid")]
    pub run_uuid: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementPredictionRunListResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub runs: Vec<MeasurementPredictionRunSummary>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementPredictionRunSummary {
    #[serde(rename = "as_of_at")]
    pub as_of_at: String,
    pub baseline: f64,
    #[serde(
        rename = "duration_milliseconds",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub duration_milliseconds: Option<i64>,
    #[serde(rename = "engine_version")]
    pub engine_version: String,
    #[serde(rename = "generated_at")]
    pub generated_at: String,
    #[serde(rename = "horizon_end_at")]
    pub horizon_end_at: String,
    #[serde(rename = "input_hash")]
    pub input_hash: String,
    pub output: f64,
    #[serde(rename = "override_applied")]
    pub override_applied: bool,
    #[serde(rename = "run_uuid")]
    pub run_uuid: String,
    #[serde(rename = "warning_count")]
    pub warning_count: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementPredictionThresholdEventListResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub events: Vec<MeasurementPredictionThresholdEvent>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementPredictionThresholdEvent {
    #[serde(rename = "dedup_key")]
    pub dedup_key: String,
    pub direction: String,
    #[serde(rename = "emitted_at")]
    pub emitted_at: String,
    #[serde(rename = "hysteresis_state")]
    pub hysteresis_state: String,
    #[serde(rename = "observed_value")]
    pub observed_value: f64,
    pub threshold: f64,
    #[serde(rename = "trigger_run_uuid")]
    pub trigger_run_uuid: String,
    #[serde(rename = "version_uuid")]
    pub version_uuid: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementSignalSourceListResponse {
    #[serde(
        rename = "next_page_token",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub next_page_token: Option<String>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub sources: Vec<MeasurementSignalSource>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementSignalSource {
    #[serde(rename = "consecutive_failed_count")]
    pub consecutive_failed_count: i64,
    #[serde(rename = "created_at")]
    pub created_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(rename = "display_name")]
    pub display_name: String,
    #[serde(rename = "is_paused")]
    pub is_paused: bool,
    #[serde(
        rename = "last_succeeded_at",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub last_succeeded_at: Option<String>,
    #[serde(
        rename = "poll_interval_seconds",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub poll_interval_seconds: Option<i64>,
    #[serde(rename = "source_key")]
    pub source_key: String,
    #[serde(rename = "source_mode")]
    pub source_mode: String,
    #[serde(rename = "source_status")]
    pub source_status: String,
    #[serde(rename = "updated_at")]
    pub updated_at: String,
    pub uuid: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementSignalSourceCreateRequest {
    pub configuration: Value,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(rename = "display_name")]
    pub display_name: String,
    #[serde(
        rename = "poll_interval_seconds",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub poll_interval_seconds: Option<i64>,
    #[serde(rename = "source_key")]
    pub source_key: String,
    #[serde(rename = "source_mode")]
    pub source_mode: String,
}

impl CustdClient {
    /// List tenant-scoped prediction definitions.
    pub fn list_prediction_definitions(
        &self,
        page_size: Option<i64>,
        page_token: Option<&str>,
        company_slug: Option<&str>,
    ) -> Result<MeasurementPredictionDefinitionListResponse> {
        let path = api_path(
            "/api/v1/admin/measurement/predictions/definitions".to_owned(),
            &[
                ("pageSize", page_size.map(|v| v.to_string())),
                ("pageToken", page_token.map(str::to_owned)),
            ],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Create a tenant-scoped prediction definition (draft).
    pub fn create_prediction_definition(
        &self,
        request: &MeasurementPredictionDefinitionCreateRequest,
        company_slug: Option<&str>,
    ) -> Result<MeasurementPredictionDefinition> {
        let path = api_path(
            "/api/v1/admin/measurement/predictions/definitions".to_owned(),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Get a tenant-scoped prediction definition.
    pub fn get_prediction_definition(
        &self,
        definition_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<MeasurementPredictionDefinition> {
        let path = api_path(
            format!(
                "/api/v1/admin/measurement/predictions/definitions/{}",
                percent_encode(definition_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Update a tenant-scoped prediction definition draft.
    pub fn update_prediction_definition(
        &self,
        definition_uuid: &str,
        request: &MeasurementPredictionDefinitionUpdateRequest,
        company_slug: Option<&str>,
    ) -> Result<MeasurementPredictionDefinition> {
        let path = api_path(
            format!(
                "/api/v1/admin/measurement/predictions/definitions/{}",
                percent_encode(definition_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Patch, &path, Some(request))
    }

    /// Activate an immutable version (writes partial-unique-index active row).
    pub fn activate_prediction_version(
        &self,
        definition_uuid: &str,
        request: &MeasurementPredictionActivateRequest,
        company_slug: Option<&str>,
    ) -> Result<MeasurementPredictionVersion> {
        let path = api_path(
            format!(
                "/api/v1/admin/measurement/predictions/definitions/{}/activate",
                percent_encode(definition_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Archive a tenant-scoped prediction definition while retaining its history.
    pub fn archive_prediction_definition(
        &self,
        definition_uuid: &str,
        request: &MeasurementPredictionPauseRequest,
        company_slug: Option<&str>,
    ) -> Result<()> {
        let path = api_path(
            format!(
                "/api/v1/admin/measurement/predictions/definitions/{}/archive",
                percent_encode(definition_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Evaluate tenant-scoped duration history with chronological rolling-origin folds.
    pub fn evaluate_duration_history(
        &self,
        definition_uuid: &str,
        request: &MeasurementDurationEvaluationRequest,
        company_slug: Option<&str>,
    ) -> Result<MeasurementDurationEvaluationResponse> {
        let path = api_path(
            format!(
                "/api/v1/admin/measurement/predictions/definitions/{}/duration-evaluations",
                percent_encode(definition_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Pause tenant-scoped prediction runs.
    pub fn pause_prediction_definition(
        &self,
        definition_uuid: &str,
        request: &MeasurementPredictionPauseRequest,
        company_slug: Option<&str>,
    ) -> Result<()> {
        let path = api_path(
            format!(
                "/api/v1/admin/measurement/predictions/definitions/{}/pause",
                percent_encode(definition_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Compile and publish a candidate version (immutable).
    pub fn publish_prediction_definition(
        &self,
        definition_uuid: &str,
        request: &MeasurementPredictionVersionPublishRequest,
        company_slug: Option<&str>,
    ) -> Result<MeasurementPredictionVersion> {
        let path = api_path(
            format!(
                "/api/v1/admin/measurement/predictions/definitions/{}/publish",
                percent_encode(definition_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Resume tenant-scoped prediction runs.
    pub fn resume_prediction_definition(
        &self,
        definition_uuid: &str,
        request: &MeasurementPredictionPauseRequest,
        company_slug: Option<&str>,
    ) -> Result<()> {
        let path = api_path(
            format!(
                "/api/v1/admin/measurement/predictions/definitions/{}/resume",
                percent_encode(definition_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Enqueue a forced evaluation through the scheduler.
    pub fn run_prediction_now(
        &self,
        definition_uuid: &str,
        request: &MeasurementPredictionRunNowRequest,
        company_slug: Option<&str>,
    ) -> Result<()> {
        let path = api_path(
            format!(
                "/api/v1/admin/measurement/predictions/definitions/{}/run-now",
                percent_encode(definition_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Get the latest bounded evaluation summary.
    pub fn get_prediction_evaluation(
        &self,
        definition_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<MeasurementPredictionEvaluationSummary> {
        let path = api_path(
            format!(
                "/api/v1/admin/measurement/predictions/definitions/{}/evaluations",
                percent_encode(definition_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// List bounded prediction outcome history.
    pub fn list_prediction_outcomes(
        &self,
        definition_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<MeasurementPredictionOutcomeListResponse> {
        let path = api_path(
            format!(
                "/api/v1/admin/measurement/predictions/definitions/{}/outcomes",
                percent_encode(definition_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// List bounded prediction run history.
    pub fn list_prediction_runs(
        &self,
        definition_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<MeasurementPredictionRunListResponse> {
        let path = api_path(
            format!(
                "/api/v1/admin/measurement/predictions/definitions/{}/runs",
                percent_encode(definition_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// List durable prediction threshold events.
    pub fn list_prediction_threshold_events(
        &self,
        definition_uuid: &str,
        page_size: Option<i64>,
        company_slug: Option<&str>,
    ) -> Result<MeasurementPredictionThresholdEventListResponse> {
        let path = api_path(
            format!(
                "/api/v1/admin/measurement/predictions/definitions/{}/threshold-events",
                percent_encode(definition_uuid)
            ),
            &[("pageSize", page_size.map(|v| v.to_string()))],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Get an immutable prediction definition version.
    pub fn get_prediction_version(
        &self,
        definition_uuid: &str,
        version_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<MeasurementPredictionVersion> {
        let path = api_path(
            format!(
                "/api/v1/admin/measurement/predictions/definitions/{}/versions/{}",
                percent_encode(definition_uuid),
                percent_encode(version_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// List tenant-scoped signal sources.
    pub fn list_prediction_sources(
        &self,
        page_size: Option<i64>,
        page_token: Option<&str>,
        company_slug: Option<&str>,
    ) -> Result<MeasurementSignalSourceListResponse> {
        let path = api_path(
            "/api/v1/admin/measurement/predictions/sources".to_owned(),
            &[
                ("pageSize", page_size.map(|v| v.to_string())),
                ("pageToken", page_token.map(str::to_owned)),
            ],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Create a tenant-scoped signal source.
    pub fn create_prediction_source(
        &self,
        request: &MeasurementSignalSourceCreateRequest,
        company_slug: Option<&str>,
    ) -> Result<MeasurementSignalSource> {
        let path = api_path(
            "/api/v1/admin/measurement/predictions/sources".to_owned(),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Get a tenant-scoped signal source.
    pub fn get_prediction_source(
        &self,
        source_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<MeasurementSignalSource> {
        let path = api_path(
            format!(
                "/api/v1/admin/measurement/predictions/sources/{}",
                percent_encode(source_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Activate a tenant-scoped signal source.
    pub fn activate_prediction_source(
        &self,
        source_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<()> {
        let path = api_path(
            format!(
                "/api/v1/admin/measurement/predictions/sources/{}/activate",
                percent_encode(source_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, NO_BODY)
    }

    /// Archive a tenant-scoped signal source while retaining its history.
    pub fn archive_prediction_source(
        &self,
        source_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<()> {
        let path = api_path(
            format!(
                "/api/v1/admin/measurement/predictions/sources/{}/archive",
                percent_encode(source_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, NO_BODY)
    }
}
