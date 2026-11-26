use custd_sdk::{
    AccountingEvidenceCreateRequest, AccountingEvidenceListResponse, AccountingEvidenceResponse,
    AuditEvent, AuditEventsScope, AuditListResponse,
};

use super::{audit_query, body, round_trip};
use crate::{Row, row};

pub fn rows() -> Vec<Row> {
    vec![
        row(
            "admin-api GET /api/v1/admin/audit/events",
            "/api/v1/admin/audit/events?scope=tenant&affectedTenantSlug=acme&since=s-1&until=u-1&actorKind=k-1&actorReference=r-1&action=a-1&resourceType=t-1&resourceId=i-1&outcome=o-1&correlationId=c-1&environmentId=e-1&limit=7&cursor=n-1&companySlug=acme",
            |c| drop(c.custd.list_audit_events(&audit_query(), Some("acme"))),
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
                drop(c.custd.create_accounting_evidence(&body::<AccountingEvidenceCreateRequest>(r#"{"auditCorrelationId":"x","effectiveAt":"x","id":"x","kind":"purchase","observedAt":"x","reason":"x","unit":"W"}"#)))
            },
            round_trip::<AccountingEvidenceResponse>,
        ),
    ]
}
