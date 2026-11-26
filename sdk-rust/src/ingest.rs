//! The ingest API: sending events and raw lines, the caller's account, ingest operations
//! (reprocess, managed-audit redaction, monitoring, diagnostics, retention cleanup and integrity),
//! and generated-data cleanup plans and jobs.
//!
//! Shapes follow the ingest-api handlers. The credential names the tenant, except on the
//! cleanup-job routes, where a system administrator names it with
//! [`CustdClient::with_acting_company`].

use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::Result;
use crate::api_path::{NO_BODY, api_path};
use crate::client::{CustdClient, IDEMPOTENCY_KEY, decode};
use crate::error::{Error, Problem};
use crate::measurement::null_as_empty;
use crate::transport::{Method, percent_encode};

const CLEANUP_JOBS: &str = "/api/v1/cleanup/jobs";
const CLEANUP_PLANS: &str = "/api/v1/admin/cleanup/plans";

/// The page an event happened on.
#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
pub struct PageContext {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub path: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub referrer: Option<String>,
}

/// The device an event came from.
#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
pub struct DeviceContext {
    pub r#type: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub os: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub browser: Option<String>,
}

/// Where and on what an event happened.
#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
pub struct EventContext {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub page: Option<PageContext>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub device: Option<DeviceContext>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub locale: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub timezone: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub ip: Option<String>,
}

/// One event. `event_uuid` is the caller's idempotency identity; `payload` is the event type's
/// schema-checked data. An environment travels as the reserved `custd.environment` label.
#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EventEnvelope {
    pub event_uuid: String,
    pub event_type_slug: String,
    pub schema_version: String,
    /// RFC 3339.
    pub timestamp: String,
    pub session_id: String,
    pub anonymous_id: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub user_uuid: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub company_slug: Option<String>,
    #[serde(default, skip_serializing_if = "BTreeMap::is_empty")]
    pub labels: BTreeMap<String, String>,
    pub context: EventContext,
    pub payload: Value,
}

/// The acknowledgement of one sent event.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EventIngestReceipt {
    pub success: bool,
    pub event_uuid: String,
}

/// A batch of 1 to 1000 events.
#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
pub struct SendEventsRequest {
    pub events: Vec<EventEnvelope>,
}

/// One event's outcome in a batch; `error` carries the problem for a rejected event.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EventIngestResult {
    pub event_uuid: String,
    pub success: bool,
    pub status: u16,
    #[serde(default)]
    pub error: Option<Problem>,
}

/// A batch's outcome. `success` is true only when every event was accepted; on a partial
/// failure the rejected events are the results with `success` false. `accepted_event_ids` is
/// rebuilt from the checked results, in the order the events were sent.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SendEventsResponse {
    pub success: bool,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub results: Vec<EventIngestResult>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub accepted_event_ids: Vec<String>,
}

/// The source a raw upload belongs to: a data-scope sub-client and resource, set together.
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct RawSourceTarget {
    pub sub_client: String,
    pub resource: String,
}

/// Raw lines for one parser. Give an `idempotency_key` (`<unix-milliseconds>:<uuid-v4>`) to make
/// a retry safe: the server answers a repeat with the first result.
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct RawIngestRequest {
    pub content: String,
    pub parser_uuid: String,
    pub target: Option<RawSourceTarget>,
    pub idempotency_key: Option<String>,
}

/// One ingest diagnostics section; each answers with the whole snapshot.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum IngestDiagnosticsSection {
    Ingest,
    Buffers,
    Database,
    Segments,
    Reporting,
}

impl IngestDiagnosticsSection {
    /// The path segment.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Ingest => "ingest",
            Self::Buffers => "buffers",
            Self::Database => "database",
            Self::Segments => "segments",
            Self::Reporting => "reporting",
        }
    }
}

/// The replay result of one rejected event.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct IngestReprocessOutcome {
    pub uuid: String,
    pub success: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

/// IngestReprocessResult counts a replay of the tenant's rejected events.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct IngestReprocessResult {
    pub processed: i64,
    pub succeeded: i64,
    pub failed: i64,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub outcomes: Vec<IngestReprocessOutcome>,
}

/// ManagedAuditRedactionEvent selects one managed audit event and the fields to redact.
#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
pub struct ManagedAuditRedactionEvent {
    #[serde(default)]
    pub selectors: BTreeMap<String, String>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub fields: Vec<String>,
}

/// ManagedAuditRedactionRequest redacts fields of managed audit events under a
/// source system's redaction rule.
#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ManagedAuditRedactionRequest {
    pub source_system: String,
    pub redaction_id: String,
    pub reason: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub events: Vec<ManagedAuditRedactionEvent>,
}

/// The outcome for one selected event.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ManagedAuditRedactionResult {
    #[serde(default)]
    pub selectors: BTreeMap<String, String>,
    pub status: String,
}

/// ManagedAuditRedactionResponse reports a redaction request's outcome.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ManagedAuditRedactionResponse {
    pub success: bool,
    pub redaction_id: String,
    pub result_shape: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub results: Vec<ManagedAuditRedactionResult>,
}

/// The tenant's ingest and storage counters.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct IngestMonitoringSummary {
    pub ingest_requests_total: i64,
    pub ingest_errors_total: i64,
    pub event_segments_verified_rows_total: i64,
    pub raw_events_landed_total: i64,
    pub raw_storage_s3_total: i64,
    pub raw_landing_s3_upload_failures_total: i64,
}

/// One active ingest alert for the tenant.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IngestMonitoringAlert {
    pub id: String,
    #[serde(rename = "type")]
    pub severity: String,
    pub title: String,
    pub message: String,
}

/// IngestMonitoringAlertList lists the tenant's active ingest alerts.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct IngestMonitoringAlertList {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub alerts: Vec<IngestMonitoringAlert>,
}

/// The platform-wide ingest and storage counters.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct SystemMonitoringTotals {
    pub ingest_requests_total: i64,
    pub ingest_errors_total: i64,
    pub raw_events_landed_total: i64,
    pub raw_landing_s3_upload_failures_total: i64,
    pub data_safety_invariant_violations_total: i64,
    pub storage_usage_collector_last_success_timestamp: i64,
    pub claim_backlog_count: i64,
    pub claim_backlog_oldest_age_seconds: i64,
}

/// One of the tenants ranked as needing attention.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemMonitoringTenant {
    pub company_slug: String,
    pub company_name: String,
    pub rank_reason: String,
    pub attributed_storage_bytes: i64,
    pub effective_limit_bytes: i64,
    pub percent_used: f64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub rejected_events: Option<i64>,
}

/// The platform-wide monitoring view.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemMonitoringSummary {
    pub generated_at: String,
    pub totals: SystemMonitoringTotals,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub top_tenants: Vec<SystemMonitoringTenant>,
}

/// IngestStatusCounts counts ingest answers by status class.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IngestStatusCounts {
    #[serde(rename = "2xx")]
    pub two_xx: i64,
    #[serde(rename = "4xx")]
    pub four_xx: i64,
    #[serde(rename = "5xx")]
    pub five_xx: i64,
}

/// The request side of the ingest service.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IngestDiagnosticsIngestState {
    pub available: bool,
    pub request_rate_per_second: f64,
    pub status_counts: IngestStatusCounts,
    pub p95_latency_ms: f64,
    pub active_requests: i64,
}

/// The event stream's replication state.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IngestJetStreamCluster {
    pub replica_count: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub leader: Option<String>,
    pub replicated: bool,
    pub all_replicas_current: bool,
}

/// The event stream's size.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct IngestJetStreamStreamState {
    pub messages: i64,
    pub bytes: i64,
    pub subjects: i64,
    pub cluster: IngestJetStreamCluster,
}

/// The segment writer consumer's progress.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IngestJetStreamConsumerState {
    pub num_waiting: i64,
    pub max_ack_pending: i64,
    pub ack_pending_utilization: f64,
    pub slow_consumer: bool,
    pub delivered_stream_sequence: i64,
    pub delivered_consumer_sequence: i64,
    pub ack_floor_stream_sequence: i64,
    pub ack_floor_consumer_sequence: i64,
    pub sequence_gap: i64,
}

/// The event stream and its consumer.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IngestJetStreamState {
    pub available: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub stream: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub consumer: Option<String>,
    pub pending: i64,
    pub ack_pending: i64,
    pub redelivered: i64,
    pub consumer_active: bool,
    pub retention_seconds_left: i64,
    pub stream_state: IngestJetStreamStreamState,
    pub consumer_state: IngestJetStreamConsumerState,
}

/// IngestSegmentState counts verified, pending and failed Parquet segments.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IngestSegmentState {
    pub available: bool,
    pub pending: i64,
    pub verified: i64,
    pub failed: i64,
    pub oldest_pending_age_seconds: i64,
    pub compacted_verified: i64,
    pub compacted_failed: i64,
    pub rollup_verified: i64,
    pub rollup_failed: i64,
    pub compaction_eligible_sources: i64,
    pub compaction_estimated_object_reduction: i64,
}

/// The rollup scheduler's queue.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IngestRollupSchedulerState {
    pub interval_seconds: i64,
    pub next_run_at: String,
    pub leader_worker_id: String,
    pub queued_runs: i64,
    pub running_runs: i64,
    pub failed_runs: i64,
    pub queued_jobs: i64,
    pub claimed_jobs: i64,
    pub failed_jobs: i64,
    pub latest_run_status: String,
}

/// One background worker's backlog and health.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IngestWorkerState {
    pub available: bool,
    pub enabled: bool,
    pub backlog: i64,
    pub lag_seconds: i64,
    pub failed: i64,
    pub last_success_unix: i64,
    pub last_failure_unix: i64,
    pub last_failure_reason: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub scheduler: Option<IngestRollupSchedulerState>,
}

/// The accepted-event raw landing in object storage.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IngestObjectStorageState {
    pub available: bool,
    pub accepted_raw_landing_pending: i64,
    pub accepted_raw_landing_oldest_pending_age_seconds: i64,
    pub accepted_raw_landing_writing_leases: i64,
    pub accepted_raw_landing_failed_objects: i64,
    pub accepted_raw_landing_consolidation_eligible_windows: i64,
    pub accepted_raw_landing_consolidation_source_objects: i64,
    pub accepted_raw_landing_consolidation_estimated_object_reduction: i64,
    pub accepted_raw_landing_s3_upload_failures_total: i64,
    pub accepted_raw_landing_object_groups_per_second: f64,
    pub accepted_raw_landing_upload_duration_ms: f64,
    pub accepted_raw_landing_verification_duration_ms: f64,
    #[serde(rename = "acceptedRawLandingDBMetadataDurationMs")]
    pub accepted_raw_landing_db_metadata_duration_ms: f64,
    pub accepted_raw_landing_object_group_size_average: f64,
    pub accepted_raw_landing_object_group_size_max: f64,
    pub accepted_raw_landing_object_limiter_saturation: f64,
}

/// Every buffer between ingest and stored segments.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IngestBufferState {
    #[serde(rename = "jetstream")]
    pub jet_stream: IngestJetStreamState,
    pub segments: IngestSegmentState,
    pub compaction: IngestWorkerState,
    pub rollups: IngestWorkerState,
    pub s3: IngestObjectStorageState,
}

/// One of a database's most expensive statements.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IngestTopStatement {
    pub query: String,
    pub calls: i64,
    pub total_exec_ms: f64,
    pub mean_exec_ms: f64,
    pub rows_returned: i64,
    pub wal_bytes: i64,
}

/// IngestWaitEvent counts sessions waiting on one event.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct IngestWaitEvent {
    pub r#type: String,
    pub event: String,
    pub count: i64,
}

/// One table's stored size.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IngestTableSize {
    pub table_name: String,
    pub row_estimate: i64,
    pub total_bytes: i64,
    pub table_bytes: i64,
    pub index_bytes: i64,
}

/// One database's connections and load.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IngestDatabasePoolState {
    pub available: bool,
    pub active: i64,
    pub waiting: i64,
    pub wal_bytes: i64,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub top_statements: Vec<IngestTopStatement>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub write_statements: Vec<IngestTopStatement>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub wait_events: Vec<IngestWaitEvent>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub table_sizes: Vec<IngestTableSize>,
}

/// The core and raw databases.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IngestDatabaseState {
    pub core: IngestDatabasePoolState,
    pub raw: IngestDatabasePoolState,
    pub bytes_per_event: i64,
}

/// IngestReportingState says where reporting reads fresh and archived data.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IngestReportingState {
    pub available: bool,
    pub fresh_source: String,
    pub archive_source: String,
    pub missing_windows: i64,
}

/// The rate events are lost without an answer.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IngestSilentDropState {
    pub drop_rate_per_second: f64,
}

/// How a pipeline stage's backlog is trending.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IngestStageProgress {
    pub classification: String,
    pub depth: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub drain_rate_per_second: Option<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub eta_seconds: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub retention_expiry_seconds: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub note: Option<String>,
}

/// One node of the data path, in flow order.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IngestPipelineStage {
    pub name: String,
    pub status: String,
    pub headline: String,
    pub detail_key: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub progress: Option<IngestStageProgress>,
}

/// The whole data-path health view: one status,
/// the ordered pipeline, then each section's detail.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IngestDiagnosticsSnapshot {
    pub status: String,
    pub generated_at: String,
    pub ingest: IngestDiagnosticsIngestState,
    pub buffers: IngestBufferState,
    pub database: IngestDatabaseState,
    pub segments: IngestSegmentState,
    pub reporting: IngestReportingState,
    pub silent_drops: IngestSilentDropState,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub pipeline: Vec<IngestPipelineStage>,
}

/// IngestCleanupResult counts the rows a retention cleanup deleted.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IngestCleanupResult {
    pub deleted_raw: i64,
    pub deleted_events: i64,
    pub deleted_rejected: i64,
}

/// A raw-landing integrity check: how many raw events
/// were checked and which had no accepted landing.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IngestIntegrityResult {
    pub checked_count: i64,
    #[serde(rename = "orphanedUUIDs", default, deserialize_with = "null_as_empty")]
    pub orphaned_uui_ds: Vec<String>,
}

/// CleanupJetStreamSelection names a stream and the consumers a cleanup drains.
#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CleanupJetStreamSelection {
    pub stream: String,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub consumers: Vec<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub execution_status: Option<String>,
}

/// CleanupPlanCreateRequest asks for a generated-data cleanup plan. Times are RFC 3339.
#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CleanupPlanCreateRequest {
    pub mode: String,
    pub reason: String,
    pub dry_run: bool,
    pub execute: bool,
    pub approved_by: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub approved_s3_prefixes: Vec<String>,
    pub event_type_slug: String,
    pub started_at: String,
    pub ended_at: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub jet_stream: Vec<CleanupJetStreamSelection>,
}

/// The frozen scope a plan was computed for.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CleanupPlanScope {
    pub mode: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub reason: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub tenant_slug: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub event_type_slug: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub started_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub ended_at: Option<String>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub approved_s3_prefixes: Vec<String>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub jet_stream: Vec<CleanupJetStreamSelection>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub jet_stream_execution: Option<String>,
}

/// What one phase of a plan selects.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CleanupPlanItem {
    pub phase: String,
    pub data_class: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub storage_prefix: Option<String>,
    pub selected_count: i64,
    pub selected_bytes: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub execution_status: Option<String>,
}

/// A previewed generated-data cleanup.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CleanupPlan {
    pub plan_uuid: String,
    pub mode: String,
    pub status: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub reason: Option<String>,
    pub selected_rows: i64,
    pub selected_objects: i64,
    pub estimated_bytes: i64,
    pub scope: CleanupPlanScope,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub items: Vec<CleanupPlanItem>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub created_at: Option<String>,
}

/// CleanupPlanList lists the tenant's recent cleanup plans.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct CleanupPlanList {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub plans: Vec<CleanupPlan>,
}

/// Who approved a cleanup job and until when.
#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CleanupApproval {
    #[serde(rename = "Identity")]
    pub identity: String,
    #[serde(rename = "ExpiresAt")]
    pub expires_at: String,
}

/// CleanupJobCreateRequest enqueues a scoped cleanup job. An empty TenantSlug
/// uses the credential's tenant.
#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CleanupJobCreateRequest {
    pub mode: String,
    pub reason: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub tenant_slug: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub event_type_slug: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub started_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub ended_at: Option<String>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub approved_s3_prefixes: Vec<String>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub jet_stream: Vec<CleanupJetStreamSelection>,
    pub approval: CleanupApproval,
}

/// How far an object-storage phase has deleted.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CleanupObjectProgress {
    pub source_kind: String,
    pub cursor_direction: String,
    pub cursor_id: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub cursor_received_at: Option<String>,
    pub batch_number: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_batch_identity: Option<String>,
    pub ledger_selected_count: i64,
    pub provider_acknowledged_count: i64,
    pub provider_request_count: i64,
    pub provider_failure_count: i64,
    pub selected_bytes: i64,
    pub retry_count: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub pending_batch_identity: Option<String>,
    pub pending_batch_key_count: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub pending_batch_attempt_count: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub pending_batch_terminal: Option<bool>,
    pub last_progress_at: String,
    pub version: i64,
}

/// One phase of a cleanup job.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CleanupJobItem {
    pub id: i64,
    pub job_id: i64,
    pub phase: String,
    pub data_class: String,
    pub storage_prefix: String,
    pub selected_count: i64,
    pub selected_bytes: i64,
    pub deleted_count: i64,
    pub verified_count: i64,
    pub status: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub failure_reason: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub object_progress: Option<CleanupObjectProgress>,
}

/// A cleanup job and its phases.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CleanupJob {
    pub job_id: i64,
    pub job_uuid: String,
    pub status: String,
    pub tenant_slug: String,
    pub scope_hash: String,
    pub hold_kind: String,
    pub approval: CleanupApproval,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub failure_reason: Option<String>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub items: Vec<CleanupJobItem>,
    pub created_at: String,
}

/// CleanupJobList lists the tenant's cleanup jobs.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct CleanupJobList {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub jobs: Vec<CleanupJob>,
}

/// The proof a completed job recorded. Proof is the
/// server's proof document, kept exactly as stored.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CleanupJobProof {
    pub job_uuid: String,
    pub status: String,
    #[serde(default)]
    pub proof: Value,
}

/// The authenticated caller's own account, as the API publishes it.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CurrentAccount {
    /// Set only for a human principal; a machine has no user.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub user_uuid: Option<String>,
    pub company_slug: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub company_name: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub effective_company_slug: Option<String>,
    pub email: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub roles: Vec<String>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub permissions: Vec<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub principal_kind: Option<String>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub scopes: Vec<String>,
}

/// The POST /api/v1/raw acceptance body. The route always
/// answers 202 Accepted, so the HTTP status alone is not per-record success:
/// read Processed and Failed. A 202 with Failed > 0 is a partial failure. A body
/// that is not an object carrying a boolean success and non-negative integer
/// Processed and Failed is rejected rather than defaulted.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct RawIngestResult {
    pub success: bool,
    pub processed: i64,
    pub failed: i64,
}

impl CustdClient {
    /// Read the authenticated caller's own account.
    pub fn get_current_account(&self) -> Result<CurrentAccount> {
        self.call(Method::Get, "/api/v1/account/me", NO_BODY)
    }

    /// Send one event. A receipt that does not acknowledge this event is an error.
    pub fn send_event(&self, event: &EventEnvelope) -> Result<EventIngestReceipt> {
        let receipt: EventIngestReceipt = self.call(Method::Post, "/api/v1/events", Some(event))?;
        check_receipt(&receipt, event)?;
        Ok(receipt)
    }

    /// Send a batch of events. Every result is checked against the sent events; a partial
    /// failure is returned, not raised, so read `success` and each result.
    pub fn send_events(&self, request: &SendEventsRequest) -> Result<SendEventsResponse> {
        check_batch_size(request)?;
        let response = self.call(Method::Post, "/api/v1/events/batch", Some(request))?;
        checked_batch(&request.events, response)
    }

    /// Upload raw lines for a parser to turn into events.
    pub fn ingest_raw_lines(&self, request: &RawIngestRequest) -> Result<RawIngestResult> {
        if request.parser_uuid.trim().is_empty() {
            return Err(Error::InvalidInput(
                "raw ingest requires a parser UUID".to_owned(),
            ));
        }
        let target = request.target.as_ref();
        let path = api_path(
            "/api/v1/raw".to_owned(),
            &[
                ("subClient", target.map(|t| t.sub_client.clone())),
                ("resource", target.map(|t| t.resource.clone())),
            ],
            None,
        );
        let mut headers = vec![("X-Parser-UUID", request.parser_uuid.as_str())];
        if let Some(key) = &request.idempotency_key {
            headers.push((IDEMPOTENCY_KEY, key.as_str()));
        }
        let content = Some((
            "text/plain; charset=utf-8",
            request.content.as_bytes().to_vec(),
        ));
        let response = self.send_bytes_with_headers(Method::Post, &path, &headers, content)?;
        decode(&response.body)
    }

    /// Replay the tenant's rejected events.
    pub fn reprocess_rejected_events(&self) -> Result<IngestReprocessResult> {
        self.call(Method::Post, "/api/v1/reprocess", NO_BODY)
    }

    /// Redact fields of managed audit events under a source system's redaction rule.
    pub fn redact_managed_audit_events(
        &self,
        request: &ManagedAuditRedactionRequest,
    ) -> Result<ManagedAuditRedactionResponse> {
        self.call(
            Method::Post,
            "/api/v1/managed-audit/redactions",
            Some(request),
        )
    }

    /// Read the tenant's ingest and storage counters.
    pub fn get_ingest_monitoring_summary(&self) -> Result<IngestMonitoringSummary> {
        self.call(Method::Get, "/api/v1/monitoring/summary", NO_BODY)
    }

    /// List the tenant's active ingest alerts.
    pub fn list_ingest_monitoring_alerts(&self) -> Result<IngestMonitoringAlertList> {
        let alerts: Option<Vec<IngestMonitoringAlert>> =
            self.call(Method::Get, "/api/v1/monitoring/alerts", NO_BODY)?;
        Ok(IngestMonitoringAlertList {
            alerts: alerts.unwrap_or_default(),
        })
    }

    /// Read the platform-wide monitoring view (system administrators).
    pub fn get_system_monitoring_summary(&self) -> Result<SystemMonitoringSummary> {
        self.call(Method::Get, "/api/v1/system/monitoring/summary", NO_BODY)
    }

    /// Read the data-path health snapshot through one diagnostics section.
    pub fn get_ingest_diagnostics(
        &self,
        section: IngestDiagnosticsSection,
    ) -> Result<IngestDiagnosticsSnapshot> {
        let path = format!("/api/v1/diagnostics/{}", section.as_str());
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Run the ingest retention cleanup now.
    pub fn run_ingest_cleanup(&self) -> Result<IngestCleanupResult> {
        self.call(Method::Post, "/api/v1/admin/cleanup", NO_BODY)
    }

    /// Check that every raw event has an accepted landing.
    pub fn check_ingest_integrity(&self) -> Result<IngestIntegrityResult> {
        self.call(Method::Post, "/api/v1/admin/integrity", NO_BODY)
    }

    /// List the tenant's recent generated-data cleanup plans.
    pub fn list_cleanup_plans(&self) -> Result<CleanupPlanList> {
        self.call(Method::Get, CLEANUP_PLANS, NO_BODY)
    }

    /// Preview a generated-data cleanup.
    pub fn create_cleanup_plan(&self, request: &CleanupPlanCreateRequest) -> Result<CleanupPlan> {
        self.call(Method::Post, CLEANUP_PLANS, Some(request))
    }

    /// List the tenant's cleanup jobs.
    pub fn list_cleanup_jobs(&self) -> Result<CleanupJobList> {
        let headers = self.acting_company_header();
        self.call_with_headers(Method::Get, CLEANUP_JOBS, &headers, NO_BODY)
    }

    /// Queue an approved cleanup job. A system administrator acting for another company also
    /// needs [`CustdClient::with_acting_company`] naming the request's tenant.
    pub fn create_cleanup_job(&self, request: &CleanupJobCreateRequest) -> Result<CleanupJob> {
        let headers = self.acting_company_header();
        self.call_with_headers(Method::Post, CLEANUP_JOBS, &headers, Some(request))
    }

    /// Read one cleanup job.
    pub fn get_cleanup_job(&self, job_uuid: &str) -> Result<CleanupJob> {
        let headers = self.acting_company_header();
        let path = cleanup_job_path(job_uuid);
        self.call_with_headers(Method::Get, &path, &headers, NO_BODY)
    }

    /// Cancel a cleanup job and return its state.
    pub fn cancel_cleanup_job(&self, job_uuid: &str) -> Result<CleanupJob> {
        let headers = self.acting_company_header();
        let path = cleanup_job_path(job_uuid);
        self.call_with_headers(Method::Post, &path, &headers, NO_BODY)
    }

    /// Read a completed cleanup job's proof.
    pub fn get_cleanup_job_proof(&self, job_uuid: &str) -> Result<CleanupJobProof> {
        let headers = self.acting_company_header();
        let path = format!("{}/proof", cleanup_job_path(job_uuid));
        self.call_with_headers(Method::Get, &path, &headers, NO_BODY)
    }
}

fn cleanup_job_path(job_uuid: &str) -> String {
    format!("{CLEANUP_JOBS}/{}", percent_encode(job_uuid))
}

fn invalid(message: &str) -> Error {
    Error::InvalidResponse(message.to_owned())
}

pub(crate) fn check_receipt(receipt: &EventIngestReceipt, event: &EventEnvelope) -> Result<()> {
    if receipt.success && receipt.event_uuid == event.event_uuid {
        Ok(())
    } else {
        Err(invalid(
            "the event answer does not acknowledge the sent event",
        ))
    }
}

pub(crate) fn check_batch_size(request: &SendEventsRequest) -> Result<()> {
    if (1..=1000).contains(&request.events.len()) {
        Ok(())
    } else {
        Err(Error::InvalidInput(
            "a batch holds 1 to 1000 events".to_owned(),
        ))
    }
}

/// Checks every result against the sent events and rebuilds `accepted_event_ids` from them.
pub(crate) fn checked_batch(
    events: &[EventEnvelope],
    mut response: SendEventsResponse,
) -> Result<SendEventsResponse> {
    if response.results.len() != events.len() {
        return Err(invalid(
            "the batch answer has a result count that does not match the events",
        ));
    }
    let mut pending: Vec<&str> = events.iter().map(|e| e.event_uuid.as_str()).collect();
    let mut accepted = Vec::new();
    for result in &response.results {
        let Some(index) = pending.iter().position(|uuid| *uuid == result.event_uuid) else {
            return Err(invalid(
                "the batch answer names an unknown or repeated event",
            ));
        };
        pending.swap_remove(index);
        let status_class_ok = if result.success {
            (200..300).contains(&result.status)
        } else {
            (400..600).contains(&result.status)
        };
        if !status_class_ok {
            return Err(invalid(
                "a batch result's status disagrees with its success",
            ));
        }
        if result.success {
            accepted.push(result.event_uuid.as_str());
        }
    }
    if response.success != (accepted.len() == events.len()) {
        return Err(invalid(
            "the batch answer's success disagrees with its results",
        ));
    }
    response.accepted_event_ids = events
        .iter()
        .filter(|e| accepted.contains(&e.event_uuid.as_str()))
        .map(|e| e.event_uuid.clone())
        .collect();
    Ok(response)
}
