//! Workflow timings (Admin API `/api/v1/admin/workflow-timings`): definitions, observations,
//! corrections, runs, predictions, duration history and evaluation.
//!
//! Request and response shapes follow the admin-api OpenAPI document.

use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};

use crate::Result;
use crate::api_path::{NO_BODY, api_path};
use crate::client::CustdClient;
use crate::measurement::null_as_empty;
use crate::measurement_predictions::DurationForecastEvaluationArtifact;
use crate::transport::{Method, percent_encode};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowTimingDefinitionList {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub items: Vec<WorkflowTimingDefinition>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowTimingDefinition {
    pub current_revision: WorkflowTimingRevision,
    pub description: String,
    pub name: String,
    pub revision_count: i64,
    pub status: WorkflowTimingDefinitionStatus,
    pub uuid: String,
    pub workflow_key: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowTimingRevision {
    pub allow_overlap: bool,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub dimensions: Vec<WorkflowTimingDimensionDefinition>,
    pub hash: String,
    pub number: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub prediction_version_uuid: Option<String>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub steps: Vec<WorkflowTimingStepDefinition>,
    pub uuid: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowTimingDimensionDefinition {
    pub dimension_key: String,
    pub max_value_bytes: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowTimingStepDefinition {
    pub name: String,
    pub nominal_ms: i64,
    pub sequence: i64,
    pub step_key: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowTimingDeclaration {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub allow_overlap: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub dimensions: Vec<String>,
    pub name: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub prediction_version_uuid: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub retired: Option<bool>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub steps: Vec<WorkflowTimingStepDeclaration>,
    pub workflow_key: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowTimingDefinitionReconcileResult {
    pub created: bool,
    pub definition: WorkflowTimingDefinition,
    pub revision_changed: bool,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowTimingStepDeclaration {
    pub name: String,
    pub nominal_ms: i64,
    pub step_key: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowTimingDurationHistoryResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub contributions: Vec<WorkflowTimingContributionEntry>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub entries: Vec<WorkflowTimingDurationHistoryEntry>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub latest_completed_run: Option<WorkflowTimingRunTimingSummary>,
    pub outcomes: WorkflowTimingOutcomeCounts,
    pub workflow_key: String,
    pub workflow_uuid: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowTimingContributionEntry {
    pub attempts: i64,
    pub baseline_ms: i64,
    pub contribution_permille: i64,
    pub step_key: String,
    pub total_ms: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowTimingDurationHistoryEntry {
    pub baseline_ms: i64,
    pub corrected: bool,
    pub observed_at: String,
    pub outcome: String,
    pub revision_number: i64,
    pub revision_uuid: String,
    pub run_uuid: String,
    pub step_key: String,
    pub value_ms: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowTimingRunTimingSummary {
    pub active_ms: i64,
    pub nominal_ms: i64,
    pub run_uuid: String,
    pub wait_ms: i64,
    pub wall_clock_ms: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowTimingOutcomeCounts {
    pub cancelled_runs: i64,
    pub cancelled_steps: i64,
    pub completed_runs: i64,
    pub completed_steps: i64,
    pub failed_attempts: i64,
    pub failed_runs: i64,
    pub open_attempts: i64,
    pub retries: i64,
    pub running_runs: i64,
    pub skipped_attempts: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowTimingEvaluationResponse {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub artifact: Option<DurationForecastEvaluationArtifact>,
    pub baseline_ms: i64,
    pub next_action: String,
    pub outcomes: WorkflowTimingOutcomeCounts,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub prediction_version_uuid: Option<String>,
    pub series_key: String,
    pub state: WorkflowTimingEvaluationResponseState,
    pub workflow_key: String,
    pub workflow_uuid: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowTimingObservationRequest {
    pub observation: WorkflowTimingObservation,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowTimingObservationBatchResult {
    pub accepted: i64,
    pub duplicates: i64,
    pub rejected: i64,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub results: Vec<WorkflowTimingObservationResult>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowTimingObservation {
    pub external_run_id: String,
    pub fact: WorkflowTimingFactPayload,
    pub idempotency_key: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub provenance: Option<WorkflowTimingFactProvenance>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub supersedes_fact_uuid: Option<String>,
    pub workflow_key: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowTimingObservationResult {
    pub accepted: bool,
    pub duplicate: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub error_code: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub error_message: Option<String>,
    pub external_run_id: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub fact_uuid: Option<String>,
    pub idempotency_key: String,
    pub index: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub run_uuid: Option<String>,
    pub workflow_key: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowTimingFactPayload {
    #[serde(default, skip_serializing_if = "BTreeMap::is_empty")]
    pub dimensions: BTreeMap<String, String>,
    pub kind: WorkflowTimingFactPayloadKind,
    pub occurred_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub run: Option<WorkflowTimingRunFact>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub step: Option<WorkflowTimingStepFact>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowTimingFactProvenance {
    pub actor_kind: String,
    pub actor_ref: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub collector: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowTimingRunFact {
    pub state: WorkflowTimingRunFactState,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowTimingStepFact {
    pub attempt: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub error_class: Option<String>,
    pub state: WorkflowTimingStepFactState,
    pub step_key: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowTimingObservationBatchRequest {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub observations: Vec<WorkflowTimingObservation>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowTimingRunListResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub items: Vec<WorkflowTimingRunSummary>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowTimingRunSummary {
    pub external_run_id: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub finished_at: Option<String>,
    pub open_attempts: i64,
    pub pending_facts: i64,
    pub receipt_at: String,
    pub run_uuid: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub started_at: Option<String>,
    pub state: WorkflowTimingRunFactState,
    pub workflow_key: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowTimingRunReadResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub attempts: Vec<WorkflowTimingAttemptProjection>,
    #[serde(default)]
    pub dimensions: BTreeMap<String, String>,
    pub external_run_id: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub finished_at: Option<String>,
    pub projection_status: WorkflowTimingRunProjectionStatus,
    pub receipt_at: String,
    pub revision_hash: String,
    pub revision_number: i64,
    pub revision_uuid: String,
    pub run_uuid: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub source_occurred_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub started_at: Option<String>,
    pub state: WorkflowTimingRunFactState,
    pub workflow_key: String,
    pub workflow_uuid: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowTimingAttemptProjection {
    pub attempt: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub error_class: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub finished_at: Option<String>,
    pub occurred_at: String,
    pub receipt_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub started_at: Option<String>,
    pub state: WorkflowTimingStepFactState,
    pub step_key: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowTimingRunProjectionStatus {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub fold_error: Option<String>,
    pub healthy: bool,
    pub latest_ledger_id: i64,
    pub next_action: String,
    pub pending_facts: i64,
    pub projected_ledger_id: i64,
    pub state: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowTimingRunPrediction {
    pub allow_overlap: bool,
    pub external_run_id: String,
    pub generated_at: String,
    pub run: WorkflowTimingExpectation,
    pub run_uuid: String,
    pub state: WorkflowTimingRunFactState,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub steps: Vec<WorkflowTimingExpectation>,
    pub workflow_key: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowTimingExpectation {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub attempt: Option<i64>,
    pub baseline_ms: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub conservative_high_ms: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub conservative_low_ms: Option<i64>,
    pub evidence_window_start: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub expected_ms: Option<i64>,
    pub generated_at: String,
    pub input_hash: String,
    pub method: String,
    pub method_version: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub prediction_version_uuid: Option<String>,
    pub sample_count: i64,
    pub series_key: String,
    pub state: WorkflowTimingEvaluationResponseState,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub step_key: Option<String>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub warnings: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowTimingRebuildResult {
    pub durations: WorkflowTimingDurationProjection,
    pub external_run_id: String,
    pub facts: i64,
    pub observations_written: i64,
    pub projection: WorkflowTimingRunProjection,
    pub run_uuid: String,
    pub status: WorkflowTimingRunProjectionStatus,
    pub workflow_key: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowTimingDurationProjection {
    pub active_ms: i64,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub excluded: Vec<WorkflowTimingExcludedStepOutcome>,
    pub open_attempts: i64,
    pub run: WorkflowTimingRunDurationFact,
    pub run_eligible: bool,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub steps: Vec<WorkflowTimingStepDurationFact>,
    pub wait_ms: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowTimingRunProjection {
    pub applied_ledger_id: i64,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub attempts: Vec<WorkflowTimingAttemptProjection>,
    pub corrected: bool,
    #[serde(default)]
    pub dimensions: BTreeMap<String, String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub finished_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub occurred_at: Option<String>,
    pub open_attempts: i64,
    pub receipt_at: String,
    pub run_uuid: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub started_at: Option<String>,
    pub state: WorkflowTimingRunFactState,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowTimingExcludedStepOutcome {
    pub attempt: i64,
    pub outcome: WorkflowTimingExcludedStepOutcomeOutcome,
    pub step_key: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowTimingRunDurationFact {
    pub baseline_ms: i64,
    pub finished_at: String,
    pub started_at: String,
    pub value_ms: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowTimingStepDurationFact {
    pub attempt: i64,
    pub baseline_ms: i64,
    pub finished_at: String,
    pub receipt_at: String,
    pub started_at: String,
    pub step_key: String,
    pub value_ms: i64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum WorkflowTimingDefinitionStatus {
    #[serde(rename = "active")]
    Active,
    #[serde(rename = "retired")]
    Retired,
}

impl WorkflowTimingDefinitionStatus {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Active => "active",
            Self::Retired => "retired",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum WorkflowTimingEvaluationResponseState {
    #[serde(rename = "ready")]
    Ready,
    #[serde(rename = "cold_start")]
    ColdStart,
    #[serde(rename = "sparse")]
    Sparse,
    #[serde(rename = "stale")]
    Stale,
    #[serde(rename = "partial")]
    Partial,
    #[serde(rename = "unavailable")]
    Unavailable,
    #[serde(rename = "error")]
    Error,
}

impl WorkflowTimingEvaluationResponseState {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Ready => "ready",
            Self::ColdStart => "cold_start",
            Self::Sparse => "sparse",
            Self::Stale => "stale",
            Self::Partial => "partial",
            Self::Unavailable => "unavailable",
            Self::Error => "error",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum WorkflowTimingFactPayloadKind {
    #[serde(rename = "run_started")]
    RunStarted,
    #[serde(rename = "run_finished")]
    RunFinished,
    #[serde(rename = "step_started")]
    StepStarted,
    #[serde(rename = "step_finished")]
    StepFinished,
}

impl WorkflowTimingFactPayloadKind {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::RunStarted => "run_started",
            Self::RunFinished => "run_finished",
            Self::StepStarted => "step_started",
            Self::StepFinished => "step_finished",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum WorkflowTimingRunFactState {
    #[serde(rename = "running")]
    Running,
    #[serde(rename = "completed")]
    Completed,
    #[serde(rename = "failed")]
    Failed,
    #[serde(rename = "cancelled")]
    Cancelled,
}

impl WorkflowTimingRunFactState {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Running => "running",
            Self::Completed => "completed",
            Self::Failed => "failed",
            Self::Cancelled => "cancelled",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum WorkflowTimingStepFactState {
    #[serde(rename = "running")]
    Running,
    #[serde(rename = "completed")]
    Completed,
    #[serde(rename = "failed")]
    Failed,
    #[serde(rename = "cancelled")]
    Cancelled,
    #[serde(rename = "skipped")]
    Skipped,
}

impl WorkflowTimingStepFactState {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Running => "running",
            Self::Completed => "completed",
            Self::Failed => "failed",
            Self::Cancelled => "cancelled",
            Self::Skipped => "skipped",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum WorkflowTimingExcludedStepOutcomeOutcome {
    #[serde(rename = "completed")]
    Completed,
    #[serde(rename = "failed")]
    Failed,
    #[serde(rename = "cancelled")]
    Cancelled,
    #[serde(rename = "skipped")]
    Skipped,
    #[serde(rename = "open")]
    Open,
}

impl WorkflowTimingExcludedStepOutcomeOutcome {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Completed => "completed",
            Self::Failed => "failed",
            Self::Cancelled => "cancelled",
            Self::Skipped => "skipped",
            Self::Open => "open",
        }
    }
}

impl CustdClient {
    /// List tenant-scoped workflow timing definitions.
    pub fn list_workflow_timing_definitions(
        &self,
        limit: Option<i64>,
        company_slug: Option<&str>,
    ) -> Result<WorkflowTimingDefinitionList> {
        let path = api_path(
            "/api/v1/admin/workflow-timings/definitions".to_owned(),
            &[("limit", limit.map(|v| v.to_string()))],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Get one tenant-scoped workflow timing definition.
    pub fn get_workflow_timing_definition(
        &self,
        workflow_key: &str,
        company_slug: Option<&str>,
    ) -> Result<WorkflowTimingDefinition> {
        let path = api_path(
            format!(
                "/api/v1/admin/workflow-timings/definitions/{}",
                percent_encode(workflow_key)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Declaratively reconcile one workflow shape (idempotent; a change creates a forward-only revision).
    pub fn reconcile_workflow_timing_definition(
        &self,
        workflow_key: &str,
        request: &WorkflowTimingDeclaration,
        company_slug: Option<&str>,
    ) -> Result<WorkflowTimingDefinitionReconcileResult> {
        let path = api_path(
            format!(
                "/api/v1/admin/workflow-timings/definitions/{}",
                percent_encode(workflow_key)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Put, &path, Some(request))
    }

    /// Read completed duration history with outcomes, revision and step contribution.
    pub fn get_workflow_timing_duration_history(
        &self,
        workflow_key: &str,
        limit: Option<i64>,
        company_slug: Option<&str>,
    ) -> Result<WorkflowTimingDurationHistoryResponse> {
        let path = api_path(
            format!(
                "/api/v1/admin/workflow-timings/definitions/{}/duration-history",
                percent_encode(workflow_key)
            ),
            &[("limit", limit.map(|v| v.to_string()))],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Evaluate one workflow series with the chronological rolling-origin fold.
    pub fn get_workflow_timing_evaluation(
        &self,
        workflow_key: &str,
        series_key: Option<&str>,
        company_slug: Option<&str>,
    ) -> Result<WorkflowTimingEvaluationResponse> {
        let path = api_path(
            format!(
                "/api/v1/admin/workflow-timings/definitions/{}/evaluation",
                percent_encode(workflow_key)
            ),
            &[("seriesKey", series_key.map(str::to_owned))],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Append one observed run/step fact with an idempotency key.
    pub fn append_workflow_timing_observation(
        &self,
        request: &WorkflowTimingObservationRequest,
        company_slug: Option<&str>,
    ) -> Result<WorkflowTimingObservationBatchResult> {
        let path = api_path(
            "/api/v1/admin/workflow-timings/observations".to_owned(),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Append a bounded batch of observed facts; each item returns its own result.
    pub fn append_workflow_timing_observations(
        &self,
        request: &WorkflowTimingObservationBatchRequest,
        company_slug: Option<&str>,
    ) -> Result<WorkflowTimingObservationBatchResult> {
        let path = api_path(
            "/api/v1/admin/workflow-timings/observations:batch".to_owned(),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Append a superseding fact for an accepted observation.
    pub fn correct_workflow_timing_observation(
        &self,
        request: &WorkflowTimingObservationRequest,
        company_slug: Option<&str>,
    ) -> Result<WorkflowTimingObservationBatchResult> {
        let path = api_path(
            "/api/v1/admin/workflow-timings/corrections".to_owned(),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// List observed workflow runs with their projection status.
    pub fn list_workflow_timing_runs(
        &self,
        workflow_key: Option<&str>,
        limit: Option<i64>,
        company_slug: Option<&str>,
    ) -> Result<WorkflowTimingRunListResponse> {
        let path = api_path(
            "/api/v1/admin/workflow-timings/runs".to_owned(),
            &[
                ("workflowKey", workflow_key.map(str::to_owned)),
                ("limit", limit.map(|v| v.to_string())),
            ],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Get one observed workflow run and its projection status.
    pub fn get_workflow_timing_run(
        &self,
        run_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<WorkflowTimingRunReadResponse> {
        let path = api_path(
            format!(
                "/api/v1/admin/workflow-timings/runs/{}",
                percent_encode(run_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Read the evidence-backed completion expectation for one observed run and its steps.
    pub fn get_workflow_timing_prediction(
        &self,
        run_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<WorkflowTimingRunPrediction> {
        let path = api_path(
            format!(
                "/api/v1/admin/workflow-timings/runs/{}/prediction",
                percent_encode(run_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Deterministically rebuild one run's projections and duration facts.
    pub fn rebuild_workflow_timing_run(
        &self,
        run_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<WorkflowTimingRebuildResult> {
        let path = api_path(
            format!(
                "/api/v1/admin/workflow-timings/runs/{}/rebuild",
                percent_encode(run_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, NO_BODY)
    }
}
