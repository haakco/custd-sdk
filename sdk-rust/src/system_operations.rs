//! Platform operations (Admin API): jobs, scheduled tasks, system status, row-level security,
//! ingest claims, client bootstrap, the environment policy and SDK usage.
//!
//! Request and response shapes follow the admin-api OpenAPI document.

use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::Result;
use crate::api_path::{NO_BODY, api_path};
use crate::client::{CustdClient, IDEMPOTENCY_KEY};
use crate::measurement::null_as_empty;
use crate::reporting::{ReportingNextActionHint, ReportingProvenance, ReportingWarning};
use crate::transport::{Method, percent_encode};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JobStatusResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub outboxes: Vec<OutboxStatus>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub queue_counts: Vec<QueueCount>,
    pub realtime_events: i64,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub recent_failures: Vec<FailedJob>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OutboxStatus {
    pub failed: i64,
    pub name: String,
    pub pending: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub oldest_pending_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_retry_reason: Option<OutboxRetryReason>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum OutboxRetryReason {
    ProviderTransient,
    AuthenticationRejected,
    TlsFailure,
    ConnectionFailure,
    SenderRejected,
    RecipientRejected,
    UnclassifiedRetry,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QueueCount {
    pub count: i64,
    pub kind: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub oldest_waiting_at: Option<String>,
    pub queue: String,
    pub state: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FailedJob {
    pub attempts: i64,
    pub failed_at: String,
    pub job_id: i64,
    pub kind: String,
    pub max_attempts: i64,
    pub queue: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JobRetryReceipt {
    pub job_id: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScheduledTaskListViewResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub tasks: Vec<ScheduledTaskListItem>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScheduledTaskListItem {
    pub description: String,
    pub display_name: String,
    pub enabled: bool,
    pub failed_runs: i64,
    pub force_runs_allowed: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub latest_run: Option<ScheduledTaskListRunSummary>,
    pub lock_backend: String,
    pub manual_runs_allowed: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub next_run_at: Option<String>,
    pub overlap_policy: String,
    pub owner_service: String,
    pub queued_runs: i64,
    pub running_runs: i64,
    pub schedule_expression: String,
    pub schedule_kind: String,
    pub task_name: String,
    pub timeout_seconds: i64,
    pub timezone: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScheduledTaskListRunSummary {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub completed_at: Option<String>,
    pub duration_ms: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub failure_reason: Option<String>,
    pub items_completed: i64,
    pub items_failed: i64,
    pub items_total: i64,
    pub run_uuid: String,
    pub scheduled_for: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub started_at: Option<String>,
    pub status: String,
    pub task_name: String,
    pub trigger: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub worker_id: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScheduledTaskRunRequest {
    pub force: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScheduledTaskRunResponse {
    pub run: ScheduledTaskRunResponseSummary,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScheduledTaskRunResponseSummary {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub completed_at: Option<String>,
    pub duration_ms: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub failure_reason: Option<String>,
    pub items_completed: i64,
    pub items_failed: i64,
    pub items_total: i64,
    pub run_uuid: String,
    pub scheduled_for: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub started_at: Option<String>,
    pub status: String,
    pub task_name: String,
    pub trigger: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub worker_id: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemStatusResponse {
    pub generated_at: String,
    pub kpis: SystemStatusKPIs,
    pub overall_status: String,
    pub realm_capacity: SystemRealmCapacity,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub stages: Vec<SystemStageStatus>,
    pub storage: SystemStorageStatus,
    pub summary: OperationalSummary,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub top_tenants: Vec<SystemTenantHotspot>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemStatusKPIs {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub backlog_depth: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub claim_backlog: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub claim_backlog_oldest_age_seconds: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub desired_state: Option<DesiredStateDiagnostics>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub events_per_minute: Option<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub failed_raw_landing_objects: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub invariant_violations: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub raw_landing_upload_failures: Option<i64>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemRealmCapacity {
    pub declared: i64,
    pub exhausted: bool,
    pub observed: bool,
    pub occupied: i64,
    pub quarantined: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub reason: Option<String>,
    pub unavailable: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemStageStatus {
    pub name: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub progress: Option<SystemStageProgress>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub reason: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub signals: Option<SystemStageSignals>,
    pub status: SystemStageStatusStatus,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemStorageStatus {
    pub attributed_storage_bytes: i64,
    pub effective_limit_bytes: i64,
    pub measured_at: String,
    pub percent_used: f64,
    pub retained_logical_bytes: i64,
    pub tenant_count: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OperationalSummary {
    pub backlog: OperationalBacklogSummary,
    pub durable: OperationalStageSummary,
    pub queryable: OperationalStageSummary,
    pub received: OperationalStageSummary,
    pub status: SystemStageStatusStatus,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemTenantHotspot {
    pub attributed_storage_bytes: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub claim_queued: Option<i64>,
    pub company_name: String,
    pub company_slug: String,
    pub effective_limit_bytes: i64,
    pub percent_used: f64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub rank_reason: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub rejected_events: Option<i64>,
    pub retained_logical_bytes: i64,
    pub warning_state: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DesiredStateDiagnostics {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub backlog: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub exhausted_total: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub oldest_pending_age_seconds: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub terminal_total: Option<i64>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemStageProgress {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub classification: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub depth: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub drain_rate_per_second: Option<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub eta_seconds: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub note: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub retention_expiry_seconds: Option<i64>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemStageSignals {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub accepted_raw_landing_failed: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub accepted_raw_landing_pending: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub accepted_raw_landing_upload_failures: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub ack_floor_stream_sequence: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub ack_pending: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub ack_pending_utilization: Option<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub compaction_backlog: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub compaction_backlog_age_seconds: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub consumer_active: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub cpu_limit_milli: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub cpu_milli: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub delivered_stream_sequence: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub health_probe_ok: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub liveness_flap_count: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub memory_limit_bytes: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub memory_usage_bytes: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub metrics_probe_ok: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub oom_kill_count: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub pending: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub redelivered: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub resource_metrics_ok: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub restart_count: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub retention_seconds_left: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub rollup_backlog: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub segment_pending: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub slow_consumer: Option<bool>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OperationalBacklogSummary {
    pub classification: String,
    pub depth: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OperationalStageSummary {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub reason: Option<String>,
    pub status: SystemStageStatusStatus,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RLSStatus {
    #[serde(rename = "catalog_digest")]
    pub catalog_digest: String,
    #[serde(rename = "catalog_version")]
    pub catalog_version: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub tables: Vec<RLSTableDiff>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RLSTableDiff {
    pub classification: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub desired: Option<RLSPolicySpec>,
    pub drift: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub live: Option<RLSPolicySpec>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub reason: Option<String>,
    pub table: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RLSPolicySpec {
    pub enabled: bool,
    pub force: bool,
    #[serde(rename = "policy_name")]
    pub policy_name: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RLSPlanRequest {
    #[serde(
        rename = "expires_in_seconds",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub expires_in_seconds: Option<i64>,
    #[serde(rename = "git_commit")]
    pub git_commit: String,
    pub label: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RLSPlan {
    #[serde(rename = "actor_id")]
    pub actor_id: String,
    #[serde(rename = "catalog_digest")]
    pub catalog_digest: String,
    #[serde(rename = "catalog_version")]
    pub catalog_version: String,
    #[serde(rename = "created_at")]
    pub created_at: String,
    #[serde(rename = "expected_state")]
    pub expected_state: Value,
    #[serde(rename = "expires_at")]
    pub expires_at: String,
    #[serde(rename = "git_commit")]
    pub git_commit: String,
    #[serde(rename = "idempotency_key")]
    pub idempotency_key: String,
    pub label: String,
    #[serde(rename = "plan_uuid")]
    pub plan_uuid: String,
    #[serde(rename = "reversible_sql_digest")]
    pub reversible_sql_digest: String,
    #[serde(rename = "target_tables", default, deserialize_with = "null_as_empty")]
    pub target_tables: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RLSExecuteRequest {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub force: Option<bool>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RLSExecuteResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub diff: Vec<RLSPolicyDiff>,
    #[serde(rename = "finished_at")]
    pub finished_at: String,
    pub outcome: RLSExecuteResponseOutcome,
    #[serde(rename = "plan_uuid")]
    pub plan_uuid: String,
    #[serde(rename = "rollback_sql")]
    pub rollback_sql: String,
    #[serde(rename = "started_at")]
    pub started_at: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RLSPolicyDiff {
    pub converged: bool,
    pub desired: RLSPolicySpec,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub drift: Vec<String>,
    pub live: RLSPolicySpec,
    pub table: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RLSProofResponse {
    #[serde(default)]
    pub after: BTreeMap<String, RLSPolicySpec>,
    #[serde(rename = "attempted_at")]
    pub attempted_at: String,
    #[serde(default)]
    pub before: BTreeMap<String, RLSPolicySpec>,
    #[serde(rename = "completed_at")]
    pub completed_at: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub diff: Vec<RLSPolicyDiff>,
    #[serde(rename = "plan_uuid")]
    pub plan_uuid: String,
    #[serde(rename = "rollback_sql")]
    pub rollback_sql: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IngestClaimListResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub claims: Vec<IngestClaim>,
    pub truncated: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IngestClaim {
    pub byte_count: i64,
    pub claim_attempts: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub claim_expires_at: Option<String>,
    pub event_count: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub failed_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub failure_class: Option<String>,
    pub object_id: i64,
    pub object_uuid: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub processed_at: Option<String>,
    pub processing_state: String,
    pub window_start: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IngestClaimTerminalRequest {
    pub failure_class: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BootstrapStatus {
    pub next_action: ReportingNextActionHint,
    pub observed_at: String,
    pub provenance: ReportingProvenance,
    pub retryability: BootstrapStatusRetryability,
    pub state: BootstrapStatusState,
    pub tenant_slug: String,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub warnings: Vec<ReportingWarning>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClientBootstrapSubmitRequest {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub contact_email: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub note: Option<String>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub proofs: Vec<ClientBootstrapProof>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClientBootstrapProof {
    pub kind: ClientBootstrapProofKind,
    pub observed_at: String,
    pub value: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EnvironmentPolicy {
    pub active_count: i64,
    pub active_value_limit: i64,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub active_values: Vec<String>,
    pub auto_create_environments: bool,
    pub definition_enabled: bool,
    pub definition_present: bool,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub disabled_values: Vec<String>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub reasons: Vec<EnvironmentPolicyReason>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EnvironmentPolicyReason {
    pub code: String,
    pub remedy: String,
    pub summary: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EnvironmentPolicyUpdateRequest {
    #[serde(default)]
    pub auto_create_environments: Option<bool>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SDKUsageListResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub items: Vec<SDKUsageItem>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SDKUsageItem {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub deprecation: Option<SDKVersionDeprecation>,
    pub first_seen_at: String,
    pub last_seen_at: String,
    pub requests: i64,
    pub sdk: String,
    pub state: String,
    pub version: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SDKVersionDeprecation {
    pub deprecated_at: String,
    pub marked_by: String,
    pub note: String,
    pub recommended_version: String,
    pub sdk: String,
    pub version_scope: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SDKVersionDeprecationRequest {
    pub note: String,
    pub recommended_version: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SystemStageStatusStatus {
    #[serde(rename = "healthy")]
    Healthy,
    #[serde(rename = "degraded")]
    Degraded,
    #[serde(rename = "failing")]
    Failing,
    #[serde(rename = "unknown")]
    Unknown,
}

impl SystemStageStatusStatus {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Healthy => "healthy",
            Self::Degraded => "degraded",
            Self::Failing => "failing",
            Self::Unknown => "unknown",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum RLSExecuteResponseOutcome {
    #[serde(rename = "attempted")]
    Attempted,
    #[serde(rename = "success")]
    Success,
    #[serde(rename = "failure")]
    Failure,
}

impl RLSExecuteResponseOutcome {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Attempted => "attempted",
            Self::Success => "success",
            Self::Failure => "failure",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum BootstrapStatusRetryability {
    #[serde(rename = "none")]
    None,
    #[serde(rename = "bounded")]
    Bounded,
}

impl BootstrapStatusRetryability {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::None => "none",
            Self::Bounded => "bounded",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum BootstrapStatusState {
    #[serde(rename = "ready")]
    Ready,
    #[serde(rename = "attention_required")]
    AttentionRequired,
    #[serde(rename = "suspended")]
    Suspended,
}

impl BootstrapStatusState {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Ready => "ready",
            Self::AttentionRequired => "attention_required",
            Self::Suspended => "suspended",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ClientBootstrapProofKind {
    #[serde(rename = "dns_txt")]
    DnsTxt,
    #[serde(rename = "email_link")]
    EmailLink,
}

impl ClientBootstrapProofKind {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::DnsTxt => "dns_txt",
            Self::EmailLink => "email_link",
        }
    }
}

impl CustdClient {
    /// List job and outbox status.
    pub fn list_jobs(&self) -> Result<JobStatusResponse> {
        let path = api_path("/api/v1/admin/jobs".to_owned(), &[], None);
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Retry a discarded job.
    pub fn retry_job(&self, job_id: i64) -> Result<JobRetryReceipt> {
        let path = api_path(format!("/api/v1/admin/jobs/{}/retry", job_id), &[], None);
        self.call(Method::Post, &path, NO_BODY)
    }

    /// List scheduled tasks.
    pub fn list_scheduled_tasks(&self) -> Result<ScheduledTaskListViewResponse> {
        let path = api_path("/api/v1/admin/scheduled-tasks".to_owned(), &[], None);
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Run scheduled task now.
    pub fn run_scheduled_task_now(
        &self,
        task_name: &str,
        request: &ScheduledTaskRunRequest,
    ) -> Result<ScheduledTaskRunResponse> {
        let path = api_path(
            format!(
                "/api/v1/admin/scheduled-tasks/{}/run",
                percent_encode(task_name)
            ),
            &[],
            None,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Get system status.
    pub fn get_system_status(&self) -> Result<SystemStatusResponse> {
        let path = api_path("/api/v1/admin/system/status".to_owned(), &[], None);
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Get RLS catalog status.
    pub fn get_rls_status(&self) -> Result<RLSStatus> {
        let path = api_path("/api/v1/admin/rls/status".to_owned(), &[], None);
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Create an RLS reconciliation plan.
    pub fn create_rls_plan(&self, request: &RLSPlanRequest) -> Result<RLSPlan> {
        let path = api_path(
            "/api/v1/admin/rls/reconciliation-plans".to_owned(),
            &[],
            None,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Execute an RLS reconciliation plan.
    pub fn execute_rls_plan(
        &self,
        plan_uuid: &str,
        request: &RLSExecuteRequest,
        idempotency_key: &str,
    ) -> Result<RLSExecuteResponse> {
        let path = api_path(
            format!(
                "/api/v1/admin/rls/reconciliation-plans/{}/execute",
                percent_encode(plan_uuid)
            ),
            &[],
            None,
        );
        self.call_with_headers(
            Method::Post,
            &path,
            &[(IDEMPOTENCY_KEY, idempotency_key)],
            Some(request),
        )
    }

    /// Get an RLS reconciliation plan proof.
    pub fn get_rls_plan_proof(&self, plan_uuid: &str) -> Result<RLSProofResponse> {
        let path = api_path(
            format!(
                "/api/v1/admin/rls/reconciliation-plans/{}/proof",
                percent_encode(plan_uuid)
            ),
            &[],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// List accepted raw-landing claims.
    pub fn list_ingest_claims(
        &self,
        tenant_slug: &str,
        limit: Option<i64>,
    ) -> Result<IngestClaimListResponse> {
        let path = api_path(
            format!(
                "/api/v1/admin/ingest/claims/{}",
                percent_encode(tenant_slug)
            ),
            &[("limit", limit.map(|v| v.to_string()))],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Retry an accepted raw-landing claim.
    pub fn retry_ingest_claim(&self, tenant_slug: &str, object_uuid: &str) -> Result<IngestClaim> {
        let path = api_path(
            format!(
                "/api/v1/admin/ingest/claims/{}/{}/retry",
                percent_encode(tenant_slug),
                percent_encode(object_uuid)
            ),
            &[],
            None,
        );
        self.call(Method::Post, &path, NO_BODY)
    }

    /// Terminally classify an accepted raw-landing claim.
    pub fn terminal_ingest_claim(
        &self,
        tenant_slug: &str,
        object_uuid: &str,
        request: &IngestClaimTerminalRequest,
    ) -> Result<IngestClaim> {
        let path = api_path(
            format!(
                "/api/v1/admin/ingest/claims/{}/{}/terminal",
                percent_encode(tenant_slug),
                percent_encode(object_uuid)
            ),
            &[],
            None,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Get client bootstrap status.
    pub fn get_client_bootstrap(&self) -> Result<BootstrapStatus> {
        let path = api_path("/api/v1/admin/bootstrap".to_owned(), &[], None);
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Submit client bootstrap payload.
    pub fn submit_client_bootstrap(
        &self,
        request: &ClientBootstrapSubmitRequest,
    ) -> Result<BootstrapStatus> {
        let path = api_path("/api/v1/admin/bootstrap".to_owned(), &[], None);
        self.call(Method::Post, &path, Some(request))
    }

    /// Get the environment policy.
    pub fn get_environment_policy(&self, company_slug: Option<&str>) -> Result<EnvironmentPolicy> {
        let path = api_path(
            "/api/v1/admin/environment-policy".to_owned(),
            &[],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Update the environment policy.
    pub fn update_environment_policy(
        &self,
        request: &EnvironmentPolicyUpdateRequest,
        company_slug: Option<&str>,
    ) -> Result<EnvironmentPolicy> {
        let path = api_path(
            "/api/v1/admin/environment-policy".to_owned(),
            &[],
            company_slug,
        );
        self.call(Method::Patch, &path, Some(request))
    }

    /// List SDK usage.
    pub fn list_sdk_usage(&self) -> Result<SDKUsageListResponse> {
        let path = api_path("/api/v1/admin/sdk-usage".to_owned(), &[], None);
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Mark an SDK version deprecated.
    pub fn mark_sdk_version_deprecated(
        &self,
        sdk: &str,
        version_scope: &str,
        request: &SDKVersionDeprecationRequest,
    ) -> Result<SDKVersionDeprecation> {
        let path = api_path(
            format!(
                "/api/v1/admin/sdk-usage/deprecations/{}/{}",
                percent_encode(sdk),
                percent_encode(version_scope)
            ),
            &[],
            None,
        );
        self.call(Method::Put, &path, Some(request))
    }

    /// Clear an SDK version deprecation.
    pub fn clear_sdk_version_deprecation(&self, sdk: &str, version_scope: &str) -> Result<()> {
        let path = api_path(
            format!(
                "/api/v1/admin/sdk-usage/deprecations/{}/{}",
                percent_encode(sdk),
                percent_encode(version_scope)
            ),
            &[],
            None,
        );
        self.call(Method::Delete, &path, NO_BODY)
    }
}
