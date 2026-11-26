use custd_sdk::{
    AccountingEvidenceCreateRequest, AccountingEvidenceListResponse, AccountingEvidenceResponse,
    AuditEvent, AuditEventQuery, AuditEventsScope, AuditListResponse,
};

use super::{body, round_trip};
use crate::{Row, row};

pub fn rows() -> Vec<Row> {
    vec![
        row(
            "admin-api GET /api/v1/admin/audit/events",
            "/api/v1/admin/audit/events?companySlug=acme",
            |c| {
                drop(
                    c.custd
                        .list_audit_events(&AuditEventQuery::default(), Some("acme")),
                )
            },
            round_trip::<AuditListResponse>,
        ),
        row(
            "admin-api GET /api/v1/admin/audit/events/{eventId}",
            "/api/v1/admin/audit/events/e-1?scope=tenant&companySlug=acme",
            |c| {
                drop(
                    c.custd
                        .get_audit_event("e-1", Some(AuditEventsScope::Tenant), Some("acme")),
                )
            },
            round_trip::<AuditEvent>,
        ),
        row(
            "admin-api GET /api/v1/admin/accounting/evidence",
            "/api/v1/admin/accounting/evidence?asOf=a-1&limit=7",
            |c| drop(c.custd.list_accounting_evidence(Some("a-1"), Some(7))),
            round_trip::<AccountingEvidenceListResponse>,
        ),
        row(
            "admin-api POST /api/v1/admin/accounting/evidence",
            "/api/v1/admin/accounting/evidence",
            |c| {
                drop(c.custd.create_accounting_evidence(&body::<AccountingEvidenceCreateRequest>(r#"{"auditCorrelationId":"x","effectiveAt":"x","id":"x","kind":"x","observedAt":"x","reason":"x","unit":"x"}"#)))
            },
            round_trip::<AccountingEvidenceResponse>,
        ),
    ]
}
