//! Time plans (Admin API `/api/v1/admin/time-plans`): plans, published versions, runs, commands,
//! annotations, predictions, reports and operations.
//!
//! Request and response shapes follow the admin-api OpenAPI document.

use serde::{Deserialize, Serialize};

use crate::Result;
use crate::api_path::{NO_BODY, api_path};
use crate::client::CustdClient;
use crate::measurement::null_as_empty;
use crate::transport::{Method, percent_encode};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimePlanListResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub plans: Vec<TimePlan>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimePlan {
    pub definition: TimePlanDefinition,
    pub description: String,
    pub draft_revision: i64,
    pub name: String,
    pub plan_key: String,
    pub status: String,
    pub updated_at: String,
    pub uuid: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimePlanDefinition {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub annotation_schema: Option<TimePlanAnnotationSchema>,
    pub auto_advance: bool,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub blocks: Vec<TimePlanDefinitionBlock>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub default_ends_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub default_starts_at: Option<String>,
    pub horizon_ms: i64,
    pub redistribution_mode: String,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub threshold_cues: Vec<TimePlanThresholdCue>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimePlanAnnotationSchema {
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub allowed_types: Vec<TimePlanAnnotationSchemaAllowedTypes>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub fields: Vec<TimePlanAnnotationSchemaFields>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimePlanDefinitionBlock {
    pub basis: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub category: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub denominator: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub duration_ms: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub numerator: Option<i64>,
    pub semantic_key: String,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub tags: Vec<String>,
    pub title: String,
    pub uuid: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub weight: Option<i64>,
}

/// Set exactly one of `remaining_ms` or `remaining_fraction_bps`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimePlanThresholdCue {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub remaining_ms: Option<i64>,
    pub severity: TimePlanThresholdCueSeverity,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub remaining_fraction_bps: Option<i64>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimePlanDraftInput {
    pub definition: TimePlanDefinition,
    pub description: String,
    pub name: String,
    pub plan_key: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimePlanReviseBody {
    pub definition: TimePlanDefinition,
    pub description: String,
    pub expected_revision: i64,
    pub name: String,
    pub plan_key: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimePlanRevisionBody {
    pub expected_revision: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimePlanPublishedVersion {
    pub definition_hash: String,
    pub plan_uuid: String,
    pub published_at: String,
    pub uuid: String,
    pub version_number: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimePlanAllocationResult {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub allocations: Vec<TimePlanAllocation>,
    pub allocator_version: String,
    pub horizon_ms: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimePlanAllocation {
    pub block_id: String,
    pub duration_ms: i64,
    pub sequence: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimePlanPublishedVersionDetails {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub allocations: Vec<TimePlanAllocation>,
    pub allocator_version: String,
    pub block_count: i64,
    pub definition_hash: String,
    pub horizon_ms: i64,
    pub plan_uuid: String,
    pub published_at: String,
    pub schema_version: String,
    pub uuid: String,
    pub version_number: i64,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimePlanCreateRunInput {
    pub plan_uuid: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub scheduled_ends_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub scheduled_starts_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub version_uuid: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimePlanCreatedRun {
    pub baseline_horizon_ms: i64,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub block_allocations: Vec<TimePlanAllocation>,
    pub created_at: String,
    pub plan_uuid: String,
    pub status: String,
    pub uuid: String,
    pub version_uuid: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimePlanRunView {
    pub baseline_horizon_ms: i64,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub blocks: Vec<TimePlanRunBlockView>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub current_block_uuid: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub effective_ends_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub effective_starts_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub executable_horizon_ms: Option<i64>,
    pub lost_ms: i64,
    pub overrun_ms: i64,
    pub plan_uuid: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub scheduled_ends_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub scheduled_starts_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub start_policy: Option<String>,
    pub status: String,
    pub stream_version: i64,
    pub unused_ms: i64,
    pub uuid: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimePlanRunBlockView {
    pub actual_active_ms: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub allocated_at_start_ms: Option<i64>,
    pub baseline_ms: i64,
    pub current_ms: i64,
    pub outcome_censored: bool,
    pub sequence: i64,
    pub status: String,
    pub uuid: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub wall_ended_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub wall_started_at: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimePlanCommandRequest {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub block_id: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub boundary_ends_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub client_occurred_at: Option<String>,
    pub command_id: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub corrected: Option<TimePlanCorrectedCommand>,
    pub expected_version: i64,
    pub idempotency_key: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub reason: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub scheduled_ends_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub scheduled_starts_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub start_policy: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub supersedes_transition_uuid: Option<String>,
    pub r#type: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimePlanCommandResult {
    pub duplicate: bool,
    pub projection: TimePlanRunView,
    pub receipt: TimePlanCalculationReceipt,
    pub transition_uuid: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimePlanCorrectedCommand {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub block_id: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub boundary_ends_at: Option<String>,
    pub effective_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub start_policy: Option<String>,
    pub r#type: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimePlanCalculationReceipt {
    pub allocator_version: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub changes: Vec<TimePlanAllocationChange>,
    pub reason: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub result: Vec<TimePlanAllocation>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub source: Vec<TimePlanAllocation>,
    pub summary: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimePlanAllocationChange {
    pub block_id: String,
    pub from_ms: i64,
    pub to_ms: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimePlanAnnotationListResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub annotations: Vec<TimePlanAnnotation>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimePlanAnnotation {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub action_status: Option<String>,
    pub actor_kind: String,
    pub actor_ref: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub assignee_ref: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub decision_status: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub due_date: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub marker_label: Option<String>,
    pub recorded_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub redacted_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub redaction_reason: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub run_block_uuid: Option<String>,
    pub run_uuid: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub supersedes_uuid: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub text: Option<String>,
    pub r#type: String,
    pub uuid: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimePlanAnnotationInput {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub action_status: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub assignee_ref: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub decision_status: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub due_date: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub marker_label: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub run_block_uuid: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub text: Option<String>,
    pub r#type: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimePlanAnnotationRedactBody {
    pub reason: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimePlanDurationObservationReadResponse {
    pub non_deleted_count: i64,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub observations: Vec<TimePlanDurationObservationIdentity>,
    pub run_uuid: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimePlanDurationObservationIdentity {
    pub block_uuid: String,
    pub idempotency_key: String,
    pub observation_uuid: String,
    pub plan_uuid: String,
    pub run_uuid: String,
    pub semantic_key: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimePlanTransitionHistoryResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub transitions: Vec<TimePlanTransitionView>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimePlanTransitionView {
    pub actor_kind: String,
    pub actor_ref: String,
    pub allocator_version: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub client_occurred_at: Option<String>,
    pub command_id: String,
    pub current_status: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub previous_status: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub reason: Option<String>,
    pub receipt: TimePlanCalculationReceipt,
    pub run_uuid: String,
    pub schema_version: String,
    pub server_received_at: String,
    pub stream_version: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub supersedes_transition_uuid: Option<String>,
    pub r#type: String,
    pub uuid: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimePlanPredictionSnapshotList {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub snapshots: Vec<TimePlanPredictionSnapshot>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimePlanPredictionSnapshot {
    pub block_id: i64,
    pub block_uuid: String,
    pub input_hash: String,
    pub method: String,
    pub method_version: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub p10_ms: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub p90_ms: Option<i64>,
    pub point_ms: i64,
    pub predicted_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub prediction_version_uuid: Option<String>,
    pub run_uuid: String,
    pub sample_count: i64,
    pub snapshot_uuid: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub warnings: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompletedDurationReport {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub adjustments: Vec<CompletedDurationReportAdjustmentInput>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub annotations: Vec<CompletedDurationReportAnnotationInput>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub blocks: Vec<CompletedDurationReportBlockInput>,
    #[serde(
        rename = "prediction_comparisons",
        default,
        deserialize_with = "null_as_empty"
    )]
    pub prediction_comparisons: Vec<CompletedDurationReportPredictionComparison>,
    pub provenance: CompletedDurationReportProvenance,
    pub summary: CompletedDurationReportSummary,
    #[serde(rename = "tenant_id")]
    pub tenant_id: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompletedDurationReportAdjustmentInput {
    #[serde(
        rename = "actor_kind",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub actor_kind: Option<String>,
    #[serde(rename = "actor_ref", default, skip_serializing_if = "Option::is_none")]
    pub actor_ref: Option<String>,
    #[serde(
        rename = "allocator_version",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub allocator_version: Option<String>,
    #[serde(
        rename = "client_occurred_at",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub client_occurred_at: Option<String>,
    #[serde(rename = "command_id")]
    pub command_id: String,
    #[serde(
        rename = "current_status",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub current_status: Option<String>,
    #[serde(rename = "occurred_at")]
    pub occurred_at: String,
    #[serde(
        rename = "previous_status",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub previous_status: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub reason: Option<String>,
    pub receipt: CompletedDurationReportCalculationReceipt,
    #[serde(
        rename = "schema_version",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub schema_version: Option<String>,
    #[serde(rename = "stream_version")]
    pub stream_version: i64,
    #[serde(
        rename = "supersedes_transition_id",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub supersedes_transition_id: Option<String>,
    #[serde(rename = "transition_uuid")]
    pub transition_uuid: String,
    pub r#type: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompletedDurationReportAnnotationInput {
    #[serde(
        rename = "action_status",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub action_status: Option<String>,
    #[serde(rename = "actor_kind")]
    pub actor_kind: String,
    #[serde(rename = "actor_ref", default, skip_serializing_if = "Option::is_none")]
    pub actor_ref: Option<String>,
    #[serde(
        rename = "assignee_ref",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub assignee_ref: Option<String>,
    #[serde(
        rename = "block_uuid",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub block_uuid: Option<String>,
    #[serde(
        rename = "decision_status",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub decision_status: Option<String>,
    #[serde(rename = "due_date", default, skip_serializing_if = "Option::is_none")]
    pub due_date: Option<String>,
    #[serde(
        rename = "marker_label",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub marker_label: Option<String>,
    #[serde(rename = "recorded_at")]
    pub recorded_at: String,
    #[serde(
        rename = "redacted_at",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub redacted_at: Option<String>,
    #[serde(
        rename = "supersedes_uuid",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub supersedes_uuid: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub text: Option<String>,
    pub r#type: String,
    pub uuid: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompletedDurationReportBlockInput {
    #[serde(rename = "actual_ms", default, skip_serializing_if = "Option::is_none")]
    pub actual_ms: Option<i64>,
    #[serde(
        rename = "allocated_at_start_ms",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub allocated_at_start_ms: Option<i64>,
    #[serde(rename = "block_uuid")]
    pub block_uuid: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub category: Option<String>,
    #[serde(rename = "current_ms")]
    pub current_ms: i64,
    pub outcome: String,
    #[serde(rename = "planned_ms")]
    pub planned_ms: i64,
    #[serde(rename = "semantic_key")]
    pub semantic_key: String,
    pub sequence: i64,
    pub status: String,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub tags: Vec<String>,
    #[serde(
        rename = "wall_ended_at",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub wall_ended_at: Option<String>,
    #[serde(
        rename = "wall_started_at",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub wall_started_at: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompletedDurationReportPredictionComparison {
    #[serde(
        rename = "absolute_error_ms",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub absolute_error_ms: Option<i64>,
    #[serde(rename = "actual_ms", default, skip_serializing_if = "Option::is_none")]
    pub actual_ms: Option<i64>,
    #[serde(rename = "block_uuid")]
    pub block_uuid: String,
    #[serde(rename = "input_hash")]
    pub input_hash: String,
    #[serde(
        rename = "interval_covered",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub interval_covered: Option<bool>,
    pub method: String,
    #[serde(rename = "method_version")]
    pub method_version: String,
    #[serde(rename = "p10_ms", default, skip_serializing_if = "Option::is_none")]
    pub p10_ms: Option<i64>,
    #[serde(rename = "p90_ms", default, skip_serializing_if = "Option::is_none")]
    pub p90_ms: Option<i64>,
    #[serde(rename = "point_ms")]
    pub point_ms: i64,
    #[serde(rename = "predicted_at")]
    pub predicted_at: String,
    #[serde(rename = "sample_count")]
    pub sample_count: i64,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub warnings: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompletedDurationReportProvenance {
    #[serde(rename = "adjustment_count")]
    pub adjustment_count: i64,
    #[serde(rename = "annotation_count")]
    pub annotation_count: i64,
    pub corrected: bool,
    #[serde(
        rename = "forecast_evaluation_hash",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub forecast_evaluation_hash: Option<String>,
    #[serde(rename = "generated_at")]
    pub generated_at: String,
    #[serde(rename = "input_hash")]
    pub input_hash: String,
    #[serde(
        rename = "measurement_input_hash",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub measurement_input_hash: Option<String>,
    #[serde(
        rename = "measurement_projection_version",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub measurement_projection_version: Option<String>,
    #[serde(rename = "prediction_count")]
    pub prediction_count: i64,
    #[serde(rename = "report_version")]
    pub report_version: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompletedDurationReportSummary {
    #[serde(rename = "actual_block_count")]
    pub actual_block_count: i64,
    #[serde(rename = "actual_complete")]
    pub actual_complete: bool,
    #[serde(rename = "actual_total_ms")]
    pub actual_total_ms: i64,
    #[serde(rename = "baseline_horizon_ms")]
    pub baseline_horizon_ms: i64,
    #[serde(rename = "block_count")]
    pub block_count: i64,
    #[serde(rename = "cancelled_block_count")]
    pub cancelled_block_count: i64,
    #[serde(rename = "censored_block_count")]
    pub censored_block_count: i64,
    #[serde(rename = "completed_at")]
    pub completed_at: String,
    #[serde(rename = "completed_block_count")]
    pub completed_block_count: i64,
    #[serde(rename = "current_total_ms")]
    pub current_total_ms: i64,
    #[serde(
        rename = "effective_ends_at",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub effective_ends_at: Option<String>,
    #[serde(
        rename = "effective_starts_at",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub effective_starts_at: Option<String>,
    #[serde(
        rename = "executable_horizon_ms",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub executable_horizon_ms: Option<i64>,
    #[serde(rename = "final_variance_ms")]
    pub final_variance_ms: i64,
    #[serde(rename = "lost_ms")]
    pub lost_ms: i64,
    #[serde(rename = "not_run_block_count")]
    pub not_run_block_count: i64,
    #[serde(rename = "overrun_ms")]
    pub overrun_ms: i64,
    #[serde(rename = "plan_id")]
    pub plan_id: String,
    #[serde(rename = "planned_total_ms")]
    pub planned_total_ms: i64,
    #[serde(rename = "run_id")]
    pub run_id: String,
    #[serde(rename = "run_status")]
    pub run_status: String,
    #[serde(
        rename = "scheduled_ends_at",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub scheduled_ends_at: Option<String>,
    #[serde(
        rename = "scheduled_starts_at",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub scheduled_starts_at: Option<String>,
    #[serde(rename = "skipped_block_count")]
    pub skipped_block_count: i64,
    #[serde(rename = "stream_version")]
    pub stream_version: i64,
    #[serde(rename = "unused_ms")]
    pub unused_ms: i64,
    #[serde(rename = "version_id")]
    pub version_id: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompletedDurationReportCalculationReceipt {
    #[serde(
        rename = "allocator_version",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub allocator_version: Option<String>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub changes: Vec<CompletedDurationReportAllocationChange>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub reason: Option<String>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub result: Vec<CompletedDurationReportAllocation>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub source: Vec<CompletedDurationReportAllocation>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub summary: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompletedDurationReportAllocationChange {
    #[serde(rename = "block_uuid")]
    pub block_uuid: String,
    #[serde(rename = "from_ms")]
    pub from_ms: i64,
    #[serde(rename = "to_ms")]
    pub to_ms: i64,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompletedDurationReportAllocation {
    #[serde(rename = "block_uuid")]
    pub block_uuid: String,
    #[serde(rename = "duration_ms")]
    pub duration_ms: i64,
    pub sequence: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimePlanProjectionLossResponse {
    pub deleted_rows: i64,
    pub lost_at: String,
    pub run_uuid: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimePlanRunRepairResponse {
    pub repaired_at: String,
    pub run: TimePlanRunView,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimePlanDefinitionMathProofResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub adjustments: Vec<TimePlanDefinitionMathAdjustmentResult>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub allocations: Vec<TimePlanDefinitionMathAllocationResult>,
    pub allocator_version: String,
    pub company_slug: String,
    pub conformance_schema_version: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub definitions: Vec<TimePlanDefinitionMathDefinitionResult>,
    pub observed_at: String,
    pub schema_version: String,
    pub source: String,
    pub summary: TimePlanDefinitionMathProofSummary,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimePlanDefinitionMathAdjustmentResult {
    pub actual_ms: i64,
    pub elapsed_ms: i64,
    pub horizon_ms: i64,
    pub index: i64,
    pub overrun_ms: i64,
    pub reason: String,
    pub remaining_ms: i64,
    pub unused_ms: i64,
    pub vector_id: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimePlanDefinitionMathAllocationResult {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub allocations: Vec<TimePlanAllocation>,
    pub deterministic_tie_break: bool,
    pub exact_conservation: bool,
    pub horizon_ms: i64,
    pub index: i64,
    pub negative_allocations: i64,
    pub passed: bool,
    pub vector_id: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimePlanDefinitionMathDefinitionResult {
    pub allocated_ms: i64,
    pub block_count: i64,
    pub exact_conservation: bool,
    pub horizon_ms: i64,
    pub index: i64,
    pub passed: bool,
    pub runtime_vocabulary_clean: bool,
    pub vector_id: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimePlanDefinitionMathProofSummary {
    pub adjustment_vector_count: i64,
    pub deterministic_tie_break: bool,
    pub exact_conservation: bool,
    pub initial_vector_count: i64,
    pub negative_allocations: i64,
    pub passed: bool,
    pub vector_count: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimePlanOperationalStatus {
    pub active_runs: i64,
    pub checked_at: String,
    pub failed_outbox: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub oldest_failure_at: Option<String>,
    pub pending_outbox: i64,
    pub published_outbox: i64,
    pub stale_runs: i64,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimePlanOutboxReplayRequest {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub limit: Option<i64>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimePlanOutboxReplayResponse {
    pub replayed_at: String,
    pub requested: i64,
    pub requeued: i64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum TimePlanAnnotationSchemaAllowedTypes {
    #[serde(rename = "note")]
    Note,
    #[serde(rename = "marker")]
    Marker,
    #[serde(rename = "decision")]
    Decision,
    #[serde(rename = "action")]
    Action,
}

impl TimePlanAnnotationSchemaAllowedTypes {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Note => "note",
            Self::Marker => "marker",
            Self::Decision => "decision",
            Self::Action => "action",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum TimePlanAnnotationSchemaFields {
    #[serde(rename = "text")]
    Text,
    #[serde(rename = "markerLabel")]
    MarkerLabel,
    #[serde(rename = "decisionStatus")]
    DecisionStatus,
    #[serde(rename = "assigneeRef")]
    AssigneeRef,
    #[serde(rename = "dueDate")]
    DueDate,
    #[serde(rename = "actionStatus")]
    ActionStatus,
}

impl TimePlanAnnotationSchemaFields {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Text => "text",
            Self::MarkerLabel => "markerLabel",
            Self::DecisionStatus => "decisionStatus",
            Self::AssigneeRef => "assigneeRef",
            Self::DueDate => "dueDate",
            Self::ActionStatus => "actionStatus",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum TimePlanThresholdCueSeverity {
    #[serde(rename = "info")]
    Info,
    #[serde(rename = "warning")]
    Warning,
    #[serde(rename = "critical")]
    Critical,
}

impl TimePlanThresholdCueSeverity {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Info => "info",
            Self::Warning => "warning",
            Self::Critical => "critical",
        }
    }
}

impl CustdClient {
    /// List time plans.
    pub fn list_time_plans(
        &self,
        limit: Option<i64>,
        company_slug: Option<&str>,
    ) -> Result<TimePlanListResponse> {
        let path = api_path(
            "/api/v1/admin/time-plans".to_owned(),
            &[("limit", limit.map(|v| v.to_string()))],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Create a time-plan draft.
    pub fn create_time_plan(
        &self,
        request: &TimePlanDraftInput,
        company_slug: Option<&str>,
    ) -> Result<TimePlan> {
        let path = api_path("/api/v1/admin/time-plans".to_owned(), &[], company_slug);
        self.call(Method::Post, &path, Some(request))
    }

    /// Get a time plan.
    pub fn get_time_plan(&self, plan_uuid: &str, company_slug: Option<&str>) -> Result<TimePlan> {
        let path = api_path(
            format!("/api/v1/admin/time-plans/{}", percent_encode(plan_uuid)),
            &[],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Revise a time-plan draft.
    pub fn revise_time_plan(
        &self,
        plan_uuid: &str,
        request: &TimePlanReviseBody,
    ) -> Result<TimePlan> {
        let path = api_path(
            format!("/api/v1/admin/time-plans/{}", percent_encode(plan_uuid)),
            &[],
            None,
        );
        self.call(Method::Patch, &path, Some(request))
    }

    /// Publish an immutable time-plan version.
    pub fn publish_time_plan(
        &self,
        plan_uuid: &str,
        request: &TimePlanRevisionBody,
    ) -> Result<TimePlanPublishedVersion> {
        let path = api_path(
            format!(
                "/api/v1/admin/time-plans/{}/publish",
                percent_encode(plan_uuid)
            ),
            &[],
            None,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Retire a time plan.
    pub fn retire_time_plan(
        &self,
        plan_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<TimePlan> {
        let path = api_path(
            format!(
                "/api/v1/admin/time-plans/{}/retire",
                percent_encode(plan_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, NO_BODY)
    }

    /// Validate and preview a time plan.
    pub fn preview_time_plan(
        &self,
        request: &TimePlanDefinition,
        company_slug: Option<&str>,
    ) -> Result<TimePlanAllocationResult> {
        let path = api_path(
            "/api/v1/admin/time-plans/preview".to_owned(),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Get an immutable published time-plan version.
    pub fn get_published_time_plan_version(
        &self,
        plan_uuid: &str,
        version_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<TimePlanPublishedVersionDetails> {
        let path = api_path(
            format!(
                "/api/v1/admin/time-plans/plans/{}/versions/{}",
                percent_encode(plan_uuid),
                percent_encode(version_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Create a frozen time-plan run.
    pub fn create_time_plan_run(
        &self,
        request: &TimePlanCreateRunInput,
        company_slug: Option<&str>,
    ) -> Result<TimePlanCreatedRun> {
        let path = api_path(
            "/api/v1/admin/time-plans/runs".to_owned(),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Get an authoritative time-plan run.
    pub fn get_time_plan_run(
        &self,
        run_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<TimePlanRunView> {
        let path = api_path(
            format!("/api/v1/admin/time-plans/runs/{}", percent_encode(run_uuid)),
            &[],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Execute a version-checked time-plan command.
    pub fn execute_time_plan_command(
        &self,
        run_uuid: &str,
        request: &TimePlanCommandRequest,
        company_slug: Option<&str>,
    ) -> Result<TimePlanCommandResult> {
        let path = api_path(
            format!(
                "/api/v1/admin/time-plans/runs/{}/commands",
                percent_encode(run_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// List bounded time-plan annotations.
    pub fn list_time_plan_annotations(
        &self,
        run_uuid: &str,
        limit: Option<i64>,
        company_slug: Option<&str>,
    ) -> Result<TimePlanAnnotationListResponse> {
        let path = api_path(
            format!(
                "/api/v1/admin/time-plans/runs/{}/annotations",
                percent_encode(run_uuid)
            ),
            &[("limit", limit.map(|v| v.to_string()))],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Add a bounded time-plan annotation.
    pub fn create_time_plan_annotation(
        &self,
        run_uuid: &str,
        request: &TimePlanAnnotationInput,
        company_slug: Option<&str>,
    ) -> Result<TimePlanAnnotation> {
        let path = api_path(
            format!(
                "/api/v1/admin/time-plans/runs/{}/annotations",
                percent_encode(run_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Append a corrected time-plan annotation.
    pub fn correct_time_plan_annotation(
        &self,
        run_uuid: &str,
        annotation_uuid: &str,
        request: &TimePlanAnnotationInput,
    ) -> Result<TimePlanAnnotation> {
        let path = api_path(
            format!(
                "/api/v1/admin/time-plans/runs/{}/annotations/{}/corrections",
                percent_encode(run_uuid),
                percent_encode(annotation_uuid)
            ),
            &[],
            None,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Redact sensitive annotation content.
    pub fn redact_time_plan_annotation(
        &self,
        run_uuid: &str,
        annotation_uuid: &str,
        request: &TimePlanAnnotationRedactBody,
    ) -> Result<()> {
        let path = api_path(
            format!(
                "/api/v1/admin/time-plans/runs/{}/annotations/{}/redact",
                percent_encode(run_uuid),
                percent_encode(annotation_uuid)
            ),
            &[],
            None,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// List persisted system duration observations for a run.
    pub fn list_time_plan_duration_observations(
        &self,
        run_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<TimePlanDurationObservationReadResponse> {
        let path = api_path(
            format!(
                "/api/v1/admin/time-plans/runs/{}/duration-observations",
                percent_encode(run_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// List bounded time-plan transition history.
    pub fn list_time_plan_history(
        &self,
        run_uuid: &str,
        limit: Option<i64>,
    ) -> Result<TimePlanTransitionHistoryResponse> {
        let path = api_path(
            format!(
                "/api/v1/admin/time-plans/runs/{}/history",
                percent_encode(run_uuid)
            ),
            &[("limit", limit.map(|v| v.to_string()))],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// List immutable time-plan prediction snapshots.
    pub fn list_time_plan_prediction_snapshots(
        &self,
        run_uuid: &str,
        limit: Option<i64>,
        company_slug: Option<&str>,
    ) -> Result<TimePlanPredictionSnapshotList> {
        let path = api_path(
            format!(
                "/api/v1/admin/time-plans/runs/{}/predictions",
                percent_encode(run_uuid)
            ),
            &[("limit", limit.map(|v| v.to_string()))],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Get a completed time-plan run report.
    pub fn get_time_plan_run_report(
        &self,
        run_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<CompletedDurationReport> {
        let path = api_path(
            format!(
                "/api/v1/admin/time-plans/runs/{}/report",
                percent_encode(run_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Remove one generated-proof run's rebuildable projection.
    pub fn delete_time_plan_run_projection(
        &self,
        run_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<TimePlanProjectionLossResponse> {
        let path = api_path(
            format!(
                "/api/v1/admin/time-plans/runs/{}/projection-loss",
                percent_encode(run_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, NO_BODY)
    }

    /// Rebuild a time-plan run projection from immutable history.
    pub fn repair_time_plan_run(&self, run_uuid: &str) -> Result<TimePlanRunRepairResponse> {
        let path = api_path(
            format!(
                "/api/v1/admin/time-plans/runs/{}/repair",
                percent_encode(run_uuid)
            ),
            &[],
            None,
        );
        self.call(Method::Post, &path, NO_BODY)
    }

    /// Run source-owned time-plan definition math proof.
    pub fn get_time_plan_definition_math_proof(
        &self,
        company_slug: Option<&str>,
    ) -> Result<TimePlanDefinitionMathProofResponse> {
        let path = api_path(
            "/api/v1/admin/time-plans/operations/definition-math".to_owned(),
            &[],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Read redacted time-plan operator status.
    pub fn get_time_plan_operational_status(
        &self,
        company_slug: Option<&str>,
    ) -> Result<TimePlanOperationalStatus> {
        let path = api_path(
            "/api/v1/admin/time-plans/operations/status".to_owned(),
            &[],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Requeue failed time-plan derived events.
    pub fn replay_time_plan_outbox(
        &self,
        request: &TimePlanOutboxReplayRequest,
        company_slug: Option<&str>,
    ) -> Result<TimePlanOutboxReplayResponse> {
        let path = api_path(
            "/api/v1/admin/time-plans/operations/outbox/replay".to_owned(),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, Some(request))
    }
}
