use custd_sdk::{
    SiteAuditDelta, SiteAuditPageList, SiteFindingDismissal, SiteFindingDismissalRequest,
    SiteFindingDismissals, SiteFindingListResponse, SiteFindingsState,
};

use super::{body, round_trip};
use crate::{Row, bodiless, row};

pub fn rows() -> Vec<Row> {
    vec![
        row(
            "admin-api GET /api/v1/site-domains/{domainUuid}/findings",
            "/api/v1/site-domains/d-1/findings?state=open&companySlug=acme",
            |c| {
                drop(
                    c.custd
                        .list_site_findings("d-1", Some(SiteFindingsState::Open), Some("acme")),
                )
            },
            round_trip::<SiteFindingListResponse>,
        ),
        row(
            "admin-api GET /api/v1/site-domains/{domainUuid}/finding-dismissals",
            "/api/v1/site-domains/d-1/finding-dismissals?companySlug=acme",
            |c| drop(c.custd.list_site_finding_dismissals("d-1", Some("acme"))),
            round_trip::<SiteFindingDismissals>,
        ),
        row(
            "admin-api POST /api/v1/site-domains/{domainUuid}/finding-dismissals",
            "/api/v1/site-domains/d-1/finding-dismissals?companySlug=acme",
            |c| {
                drop(c.custd.dismiss_site_finding(
                    "d-1",
                    &body::<SiteFindingDismissalRequest>(
                        r#"{"findingUuid":"x","reason":"x","scope":"rule"}"#,
                    ),
                    Some("acme"),
                ))
            },
            round_trip::<SiteFindingDismissal>,
        ),
        bodiless(
            "admin-api DELETE /api/v1/site-domains/{domainUuid}/finding-dismissals/{dismissalUuid}",
            "/api/v1/site-domains/d-1/finding-dismissals/d-1?companySlug=acme",
            |c| drop(c.custd.restore_site_finding("d-1", "d-1", Some("acme"))),
        ),
        row(
            "admin-api GET /api/v1/site-domains/{domainUuid}/audit-delta",
            "/api/v1/site-domains/d-1/audit-delta?companySlug=acme",
            |c| drop(c.custd.get_site_audit_delta("d-1", Some("acme"))),
            round_trip::<SiteAuditDelta>,
        ),
        row(
            "admin-api GET /api/v1/site-domains/{domainUuid}/audit-pages",
            "/api/v1/site-domains/d-1/audit-pages?offset=7&limit=7&companySlug=acme",
            |c| {
                drop(
                    c.custd
                        .list_site_audit_pages("d-1", Some(7), Some(7), Some("acme")),
                )
            },
            round_trip::<SiteAuditPageList>,
        ),
    ]
}
