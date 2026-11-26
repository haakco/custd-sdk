//! Hand-written Admin API routes: impersonation sessions, retention runs, one scheduled task and its
//! pause, resume and retry, notification replay, a forced privacy erasure, managed-audit producer
//! provisioning and a deleted tenant's historical cleanup.
//!
//! Retention runs and historical cleanup follow the admin-api OpenAPI document; the other shapes
//! follow the admin-api handler and service types, because their operations name no response schema.

use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};

use crate::Result;
use crate::api_path::{NO_BODY, api_path};
use crate::client::{CustdClient, IDEMPOTENCY_KEY};
use crate::measurement::null_as_empty;
use crate::privacy::PrivacyErasureResponse;
use crate::producers::{ProducerProvisionRequest, ProducerProvisionResponse};
use crate::system_operations::{ScheduledTaskRunResponse, ScheduledTaskRunResponseSummary};
use crate::tenants::TenantOffboardingReceipt;
use crate::transport::{Method, percent_encode};

const IMPERSONATION_SESSIONS: &str = "/api/v1/admin/impersonation-sessions";
const RETENTION_POLICIES: &str = "/api/v1/admin/retention/policies";
const SCHEDULED_TASKS: &str = "/api/v1/admin/scheduled-tasks";

/// Asks for an impersonation session. The starter comes from the credential, never the request.
#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImpersonationSessionCreateRequest {
    pub company_slug: String,
    pub target_user_uuid: String,
    pub reason: String,
    /// RFC 3339; at most eight hours ahead. A longer window is refused, not shortened.
    pub expires_at: String,
}

/// One operator acting as one user. Consent is server-owned: read `consent_state`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImpersonationSession {
    pub session_uuid: String,
    pub company_slug: String,
    pub target_user_uuid: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub target_user_email: Option<String>,
    pub reason: String,
    pub consent_state: String,
    pub started_at: String,
    pub expires_at: String,
    #[serde(default)]
    pub stopped_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub stop_reason: Option<String>,
}

/// The operator's impersonation sessions.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImpersonationSessionListResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub sessions: Vec<ImpersonationSession>,
}

/// A stopped or terminated session and the state it is now in.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImpersonationSessionState {
    pub session_uuid: String,
    pub state: String,
}

/// One classified store's projection in a retention preview or apply.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RetentionStoreBreakdown {
    pub store: String,
    pub retention_class: String,
    pub candidate_count: i64,
    pub estimated_affected: i64,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub sample_subjects: Vec<String>,
    pub legal_hold_count: i64,
}

/// A retention preview (`last_result` "preview") or apply ("applied"). Counts are the server's.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RetentionRunPreview {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub per_store: Vec<RetentionStoreBreakdown>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub next_run_at: Option<String>,
    pub last_result: String,
    #[serde(default, skip_serializing_if = "BTreeMap::is_empty")]
    pub last_affected_counts: BTreeMap<String, i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_error: Option<String>,
    pub safe_next_action: String,
    pub started_at: String,
    pub completed_at: String,
}

/// One historical retention run.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RetentionRun {
    pub start_at: String,
    pub end_at: String,
    pub last_result: String,
    #[serde(default)]
    pub last_affected_counts: BTreeMap<String, i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_error: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub audit_id: Option<i64>,
}

/// A page of a tenant's retention runs. Follow `next_offset` while `has_more`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RetentionRunListResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub runs: Vec<RetentionRun>,
    pub next_offset: i64,
    pub has_more: bool,
}

/// One durable scheduled task: its schedule, policy and current pressure.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScheduledTaskSummary {
    pub task_name: String,
    pub display_name: String,
    pub description: String,
    pub owner_service: String,
    pub enabled: bool,
    pub schedule_kind: String,
    pub schedule_expression: String,
    pub timezone: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub next_run_at: Option<String>,
    pub overlap_policy: String,
    pub lock_backend: String,
    pub timeout_seconds: i64,
    pub manual_runs_allowed: bool,
    pub force_runs_allowed: bool,
    pub queued_runs: i64,
    pub running_runs: i64,
    pub failed_runs: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub latest_run: Option<ScheduledTaskRunResponseSummary>,
}

/// One scheduled task and its recent runs.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ScheduledTaskDetailResponse {
    pub task: ScheduledTaskSummary,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub runs: Vec<ScheduledTaskRunResponseSummary>,
}

/// Why a delivery is replayed; the server records it with the replay.
#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NotificationDeliveryReplayRequest {
    pub reason: String,
}

/// A forced erasure and the safe next step when it could not finish.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct PrivacyErasureForceResponse {
    #[serde(default)]
    pub request: Option<PrivacyErasureResponse>,
    pub safe_next_action: String,
    pub safe_next_action_code: String,
}

impl CustdClient {
    /// Start an impersonation session (system administrators).
    pub fn start_impersonation_session(
        &self,
        request: &ImpersonationSessionCreateRequest,
    ) -> Result<ImpersonationSession> {
        self.call(Method::Post, IMPERSONATION_SESSIONS, Some(request))
    }

    /// List the caller's impersonation sessions.
    pub fn list_impersonation_sessions(&self) -> Result<ImpersonationSessionListResponse> {
        self.call(Method::Get, IMPERSONATION_SESSIONS, NO_BODY)
    }

    /// Stop an impersonation session early, as its holder.
    pub fn stop_impersonation_session(
        &self,
        session_uuid: &str,
    ) -> Result<ImpersonationSessionState> {
        self.impersonation_session_action(session_uuid, "stop")
    }

    /// End an impersonation session as an operator action.
    pub fn terminate_impersonation_session(
        &self,
        session_uuid: &str,
    ) -> Result<ImpersonationSessionState> {
        self.impersonation_session_action(session_uuid, "terminate")
    }

    fn impersonation_session_action(
        &self,
        session_uuid: &str,
        action: &str,
    ) -> Result<ImpersonationSessionState> {
        let path = format!(
            "{IMPERSONATION_SESSIONS}/{}/{action}",
            percent_encode(session_uuid)
        );
        self.call(Method::Post, &path, NO_BODY)
    }

    /// List a tenant's retention runs, newest first.
    pub fn list_retention_runs(
        &self,
        tenant_slug: &str,
        limit: Option<i64>,
        offset: Option<i64>,
    ) -> Result<RetentionRunListResponse> {
        let path = api_path(
            format!("{RETENTION_POLICIES}/{}/runs", percent_encode(tenant_slug)),
            &[
                ("limit", limit.map(|v| v.to_string())),
                ("offset", offset.map(|v| v.to_string())),
            ],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Estimate what a retention run would delete, without deleting anything.
    pub fn preview_retention_run(&self, tenant_slug: &str) -> Result<RetentionRunPreview> {
        self.retention_run(tenant_slug, "preview")
    }

    /// Run the tenant's retention policy now. This deletes data.
    pub fn apply_retention_run(&self, tenant_slug: &str) -> Result<RetentionRunPreview> {
        self.retention_run(tenant_slug, "apply")
    }

    fn retention_run(&self, tenant_slug: &str, action: &str) -> Result<RetentionRunPreview> {
        let path = format!(
            "{RETENTION_POLICIES}/{}/{action}",
            percent_encode(tenant_slug)
        );
        self.call(Method::Post, &path, NO_BODY)
    }

    /// Read one scheduled task and its recent runs.
    pub fn get_scheduled_task(&self, task_name: &str) -> Result<ScheduledTaskDetailResponse> {
        let path = format!("{SCHEDULED_TASKS}/{}", percent_encode(task_name));
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Stop a scheduled task's future runs.
    pub fn pause_scheduled_task(&self, task_name: &str) -> Result<()> {
        self.scheduled_task_action(task_name, "pause")
    }

    /// Re-enable a scheduled task's future runs.
    pub fn resume_scheduled_task(&self, task_name: &str) -> Result<()> {
        self.scheduled_task_action(task_name, "resume")
    }

    fn scheduled_task_action(&self, task_name: &str, action: &str) -> Result<()> {
        let path = format!("{SCHEDULED_TASKS}/{}/{action}", percent_encode(task_name));
        self.call(Method::Post, &path, NO_BODY)
    }

    /// Queue a failed scheduled-task run again and return the queued run.
    pub fn retry_scheduled_task_run(&self, run_uuid: &str) -> Result<ScheduledTaskRunResponse> {
        let path = format!(
            "/api/v1/admin/scheduled-task-runs/{}/retry",
            percent_encode(run_uuid)
        );
        self.call(Method::Post, &path, NO_BODY)
    }

    /// Send one notification delivery again.
    pub fn replay_notification_delivery(
        &self,
        uuid: &str,
        request: &NotificationDeliveryReplayRequest,
        company_slug: Option<&str>,
    ) -> Result<()> {
        let path = api_path(
            format!(
                "/api/v1/admin/notification-deliveries/{}/replay",
                percent_encode(uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Force a pending privacy erasure to run now.
    pub fn force_privacy_erasure(
        &self,
        request_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<PrivacyErasureForceResponse> {
        let path = api_path(
            format!(
                "/api/v1/admin/privacy/erasures/{}/force",
                percent_encode(request_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, NO_BODY)
    }

    /// Provision the tenant's managed-audit producer; the answer carries its one-time secret.
    pub fn provision_managed_audit_producer(
        &self,
        request: &ProducerProvisionRequest,
    ) -> Result<ProducerProvisionResponse> {
        self.call(
            Method::Post,
            "/api/v1/managed-audit/provision",
            Some(request),
        )
    }

    /// Run a deleted tenant's deletion cleanup again and return its receipt. `company_id` must name
    /// the same tenant as `slug`; a retry with the same idempotency key finishes the same cleanup.
    pub fn historical_cleanup_tenant(
        &self,
        slug: &str,
        company_id: i64,
        idempotency_key: &str,
    ) -> Result<TenantOffboardingReceipt> {
        let path = api_path(
            format!(
                "/api/v1/admin/tenants/{}/historical-cleanup",
                percent_encode(slug)
            ),
            &[("companyId", Some(company_id.to_string()))],
            None,
        );
        self.call_with_headers(
            Method::Post,
            &path,
            &[(IDEMPOTENCY_KEY, idempotency_key)],
            NO_BODY,
        )
    }
}
