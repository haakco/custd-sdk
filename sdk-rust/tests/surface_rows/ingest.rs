//! Rows for the ingest API: events, raw lines, the caller's account, ingest operations, cleanup
//! plans and jobs, and the Site write-key routes.

use custd_sdk::{
    CleanupJobCreateRequest, CleanupPlanCreateRequest, ErrorCaptureEvent, ErrorCaptureMode,
    EventEnvelope, IngestDiagnosticsSection, ManagedAuditRedactionRequest, RawIngestRequest,
    SendEventsRequest, SiteCollector,
};

use crate::{Clients, Row, bodiless, sends};

fn collector(c: &Clients) -> SiteCollector {
    SiteCollector::new(&c.base_url, "site_pk_test", "https://app.example").unwrap()
}

fn batch() -> SendEventsRequest {
    SendEventsRequest {
        events: vec![EventEnvelope::default()],
    }
}

pub fn rows() -> Vec<Row> {
    vec![
        sends(
            "GET",
            bodiless(
                "ingest-api ANY /api/v1/account/me",
                "/api/v1/account/me",
                |c| drop(c.custd.get_current_account()),
            ),
        ),
        bodiless("ingest-api POST /api/v1/events", "/api/v1/events", |c| {
            drop(c.custd.send_event(&EventEnvelope::default()))
        }),
        bodiless(
            "ingest-api POST /api/v1/events/batch",
            "/api/v1/events/batch",
            |c| drop(c.custd.send_events(&batch())),
        ),
        bodiless(
            "ingest-api POST /api/v1/raw",
            "/api/v1/raw?subClient=s-1&resource=r-1",
            |c| {
                let request = RawIngestRequest {
                    content: "line".to_owned(),
                    parser_uuid: "p-1".to_owned(),
                    target: Some(custd_sdk::RawSourceTarget {
                        sub_client: "s-1".to_owned(),
                        resource: "r-1".to_owned(),
                    }),
                    idempotency_key: None,
                };
                drop(c.custd.ingest_raw_lines(&request))
            },
        ),
        bodiless(
            "ingest-api POST /api/v1/reprocess",
            "/api/v1/reprocess",
            |c| drop(c.custd.reprocess_rejected_events()),
        ),
        bodiless(
            "ingest-api POST /api/v1/managed-audit/redactions",
            "/api/v1/managed-audit/redactions",
            |c| {
                let request = ManagedAuditRedactionRequest::default();
                drop(c.custd.redact_managed_audit_events(&request))
            },
        ),
        bodiless(
            "ingest-api GET /api/v1/monitoring/summary",
            "/api/v1/monitoring/summary",
            |c| drop(c.custd.get_ingest_monitoring_summary()),
        ),
        bodiless(
            "ingest-api GET /api/v1/monitoring/alerts",
            "/api/v1/monitoring/alerts",
            |c| drop(c.custd.list_ingest_monitoring_alerts()),
        ),
        bodiless(
            "ingest-api GET /api/v1/system/monitoring/summary",
            "/api/v1/system/monitoring/summary",
            |c| drop(c.custd.get_system_monitoring_summary()),
        ),
        bodiless(
            "ingest-api POST /api/v1/admin/cleanup",
            "/api/v1/admin/cleanup",
            |c| drop(c.custd.run_ingest_cleanup()),
        ),
        bodiless(
            "ingest-api POST /api/v1/admin/integrity",
            "/api/v1/admin/integrity",
            |c| drop(c.custd.check_ingest_integrity()),
        ),
        bodiless(
            "ingest-api GET /api/v1/admin/cleanup/plans",
            "/api/v1/admin/cleanup/plans",
            |c| drop(c.custd.list_cleanup_plans()),
        ),
        bodiless(
            "ingest-api POST /api/v1/admin/cleanup/plans",
            "/api/v1/admin/cleanup/plans",
            |c| {
                drop(
                    c.custd
                        .create_cleanup_plan(&CleanupPlanCreateRequest::default()),
                )
            },
        ),
        bodiless(
            "ingest-api GET /api/v1/cleanup/jobs",
            "/api/v1/cleanup/jobs",
            |c| drop(c.custd.list_cleanup_jobs()),
        ),
        bodiless(
            "ingest-api POST /api/v1/cleanup/jobs",
            "/api/v1/cleanup/jobs",
            |c| {
                drop(
                    c.custd
                        .create_cleanup_job(&CleanupJobCreateRequest::default()),
                )
            },
        ),
        bodiless(
            "ingest-api GET /api/v1/cleanup/jobs/{uuid}",
            "/api/v1/cleanup/jobs/j-1",
            |c| drop(c.custd.get_cleanup_job("j-1")),
        ),
        bodiless(
            "ingest-api POST /api/v1/cleanup/jobs/{uuid}",
            "/api/v1/cleanup/jobs/j-1",
            |c| drop(c.custd.cancel_cleanup_job("j-1")),
        ),
        bodiless(
            "ingest-api GET /api/v1/cleanup/jobs/{uuid}/proof",
            "/api/v1/cleanup/jobs/j-1/proof",
            |c| drop(c.custd.get_cleanup_job_proof("j-1")),
        ),
        bodiless(
            "ingest-api POST /api/v1/collect/events",
            "/api/v1/collect/events",
            |c| drop(collector(c).collect_event(&EventEnvelope::default())),
        ),
        bodiless(
            "ingest-api POST /api/v1/collect/events/batch",
            "/api/v1/collect/events/batch",
            |c| drop(collector(c).collect_events(&batch())),
        ),
        sends(
            "POST",
            bodiless(
                "ingest-api ANY /api/v1/errors/api/{project}/envelope/",
                "/api/v1/errors/api/1/envelope/",
                |c| {
                    let event = ErrorCaptureEvent {
                        event_id: None,
                        exception_type: "Error".to_owned(),
                        frames: vec![],
                        mode: ErrorCaptureMode::Handled,
                        environment: "test".to_owned(),
                        release: None,
                        correlation_id: None,
                    };
                    drop(collector(c).capture_error(&event))
                },
            ),
        ),
        bodiless(
            "ingest-api GET /api/v1/diagnostics/ingest",
            "/api/v1/diagnostics/ingest",
            |c| {
                drop(
                    c.custd
                        .get_ingest_diagnostics(IngestDiagnosticsSection::Ingest),
                )
            },
        ),
        bodiless(
            "ingest-api GET /api/v1/diagnostics/buffers",
            "/api/v1/diagnostics/buffers",
            |c| {
                drop(
                    c.custd
                        .get_ingest_diagnostics(IngestDiagnosticsSection::Buffers),
                )
            },
        ),
        bodiless(
            "ingest-api GET /api/v1/diagnostics/database",
            "/api/v1/diagnostics/database",
            |c| {
                drop(
                    c.custd
                        .get_ingest_diagnostics(IngestDiagnosticsSection::Database),
                )
            },
        ),
        bodiless(
            "ingest-api GET /api/v1/diagnostics/segments",
            "/api/v1/diagnostics/segments",
            |c| {
                drop(
                    c.custd
                        .get_ingest_diagnostics(IngestDiagnosticsSection::Segments),
                )
            },
        ),
        bodiless(
            "ingest-api GET /api/v1/diagnostics/reporting",
            "/api/v1/diagnostics/reporting",
            |c| {
                drop(
                    c.custd
                        .get_ingest_diagnostics(IngestDiagnosticsSection::Reporting),
                )
            },
        ),
    ]
}
