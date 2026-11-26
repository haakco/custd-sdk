//! Rows for the hand-written Admin API methods whose operation names no response schema, and the
//! audit export and offboarding download.

use custd_sdk::{
    AuditEventExport, AuditEventQuery, AuditEventsFormat, AuditListResponse,
    ImpersonationSessionCreateRequest, NotificationDeliveryReplayRequest, OffboardingDownload,
    ProducerProvisionRequest,
};

use serde::Deserialize;
use serde_json::{Map, Value};

use super::round_trip;
use crate::{Row, bodiless, row};

/// The OpenAPI document gives historical cleanup an untyped object (so its example is one), while
/// the handler answers with a `TenantOffboardingReceipt`; the example can only prove an object.
fn object(value: &Value) -> Result<(), serde_json::Error> {
    Map::<String, Value>::deserialize(value).map(|_| ())
}

pub fn rows() -> Vec<Row> {
    vec![
        bodiless(
            "admin-api POST /api/v1/admin/impersonation-sessions",
            "/api/v1/admin/impersonation-sessions",
            |c| {
                let request = ImpersonationSessionCreateRequest::default();
                drop(c.custd.start_impersonation_session(&request))
            },
        ),
        bodiless(
            "admin-api GET /api/v1/admin/impersonation-sessions",
            "/api/v1/admin/impersonation-sessions",
            |c| drop(c.custd.list_impersonation_sessions()),
        ),
        bodiless(
            "admin-api POST /api/v1/admin/impersonation-sessions/{impersonationSessionUuid}/stop",
            "/api/v1/admin/impersonation-sessions/s-1/stop",
            |c| drop(c.custd.stop_impersonation_session("s-1")),
        ),
        bodiless(
            "admin-api POST /api/v1/admin/impersonation-sessions/{impersonationSessionUuid}/terminate",
            "/api/v1/admin/impersonation-sessions/s-1/terminate",
            |c| drop(c.custd.terminate_impersonation_session("s-1")),
        ),
        bodiless(
            "admin-api GET /api/v1/admin/retention/policies/{tenantSlug}/runs",
            "/api/v1/admin/retention/policies/acme/runs?limit=7&offset=2",
            |c| drop(c.custd.list_retention_runs("acme", Some(7), Some(2))),
        ),
        bodiless(
            "admin-api POST /api/v1/admin/retention/policies/{tenantSlug}/preview",
            "/api/v1/admin/retention/policies/acme/preview",
            |c| drop(c.custd.preview_retention_run("acme")),
        ),
        bodiless(
            "admin-api POST /api/v1/admin/retention/policies/{tenantSlug}/apply",
            "/api/v1/admin/retention/policies/acme/apply",
            |c| drop(c.custd.apply_retention_run("acme")),
        ),
        bodiless(
            "admin-api GET /api/v1/admin/scheduled-tasks/{taskName}",
            "/api/v1/admin/scheduled-tasks/t-1",
            |c| drop(c.custd.get_scheduled_task("t-1")),
        ),
        bodiless(
            "admin-api POST /api/v1/admin/scheduled-tasks/{taskName}/pause",
            "/api/v1/admin/scheduled-tasks/t-1/pause",
            |c| drop(c.custd.pause_scheduled_task("t-1")),
        ),
        bodiless(
            "admin-api POST /api/v1/admin/scheduled-tasks/{taskName}/resume",
            "/api/v1/admin/scheduled-tasks/t-1/resume",
            |c| drop(c.custd.resume_scheduled_task("t-1")),
        ),
        bodiless(
            "admin-api POST /api/v1/admin/scheduled-task-runs/{runUuid}/retry",
            "/api/v1/admin/scheduled-task-runs/r-1/retry",
            |c| drop(c.custd.retry_scheduled_task_run("r-1")),
        ),
        bodiless(
            "admin-api POST /api/v1/admin/notification-deliveries/{uuid}/replay",
            "/api/v1/admin/notification-deliveries/u-1/replay?companySlug=acme",
            |c| {
                let request = NotificationDeliveryReplayRequest::default();
                drop(
                    c.custd
                        .replay_notification_delivery("u-1", &request, Some("acme")),
                )
            },
        ),
        bodiless(
            "admin-api POST /api/v1/admin/privacy/erasures/{requestUuid}/force",
            "/api/v1/admin/privacy/erasures/r-1/force",
            |c| drop(c.custd.force_privacy_erasure("r-1")),
        ),
        bodiless(
            "admin-api POST /api/v1/managed-audit/provision",
            "/api/v1/managed-audit/provision",
            |c| {
                let request = ProducerProvisionRequest::default();
                drop(c.custd.provision_managed_audit_producer(&request))
            },
        ),
        row(
            "admin-api POST /api/v1/admin/tenants/{slug}/historical-cleanup",
            "/api/v1/admin/tenants/acme/historical-cleanup?companyId=7",
            |c| drop(c.custd.historical_cleanup_tenant("acme", 7, "key-0001")),
            object,
        ),
        row(
            "admin-api GET /api/v1/admin/audit/events/export",
            "/api/v1/admin/audit/events/export?format=csv&companySlug=acme",
            |c| {
                drop::<Result<AuditEventExport, _>>(c.custd.export_audit_events(
                    &AuditEventQuery::default(),
                    AuditEventsFormat::Csv,
                    Some("acme"),
                ))
            },
            round_trip::<AuditListResponse>,
        ),
        bodiless(
            "admin-api GET /api/v1/admin/offboarding/requests/{requestUuid}/download",
            "/api/v1/admin/offboarding/requests/r-1/download",
            |c| drop::<Result<OffboardingDownload, _>>(c.custd.download_offboarding("r-1")),
        ),
    ]
}
