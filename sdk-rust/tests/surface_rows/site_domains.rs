use custd_sdk::{
    SiteBrowserCollector, SiteBrowserCollectorRequest, SiteCheckSettingsRequest,
    SiteDomainCreateRequest, SiteDomainListWithUptimePaths, SiteDomainWithUptimePath,
    SiteNextActions, SitePortfolioSummary,
};

use super::{body, round_trip};
use crate::{Row, bodiless, row};

pub fn rows() -> Vec<Row> {
    vec![
        row(
            "admin-api GET /api/v1/site-domains",
            "/api/v1/site-domains?siteUuid=s-1&companySlug=acme",
            |c| {
                drop(
                    c.custd
                        .list_site_domains_with_uptime_paths(Some("s-1"), Some("acme")),
                )
            },
            round_trip::<SiteDomainListWithUptimePaths>,
        ),
        row(
            "admin-api GET /api/v1/site-domains/{domainUuid}",
            "/api/v1/site-domains/d-1?companySlug=acme",
            |c| {
                drop(
                    c.custd
                        .get_site_domain_with_uptime_path("d-1", Some("acme")),
                )
            },
            round_trip::<SiteDomainWithUptimePath>,
        ),
        row(
            "admin-api POST /api/v1/site-domains",
            "/api/v1/site-domains?companySlug=acme",
            |c| {
                drop(c.custd.create_site_domain(
                    &body::<SiteDomainCreateRequest>(r#"{"host":"x"}"#),
                    Some("acme"),
                ))
            },
            round_trip::<SiteDomainWithUptimePath>,
        ),
        bodiless(
            "admin-api DELETE /api/v1/site-domains/{domainUuid}",
            "/api/v1/site-domains/d-1?companySlug=acme",
            |c| drop(c.custd.delete_site_domain("d-1", Some("acme"))),
        ),
        row(
            "admin-api POST /api/v1/site-domains/{domainUuid}/verify",
            "/api/v1/site-domains/d-1/verify?companySlug=acme",
            |c| drop(c.custd.verify_site_domain("d-1", Some("acme"))),
            round_trip::<SiteDomainWithUptimePath>,
        ),
        row(
            "admin-api POST /api/v1/site-domains/{domainUuid}/attestation",
            "/api/v1/site-domains/d-1/attestation?companySlug=acme",
            |c| drop(c.custd.attest_site_domain("d-1", Some("acme"))),
            round_trip::<SiteDomainWithUptimePath>,
        ),
        row(
            "admin-api DELETE /api/v1/site-domains/{domainUuid}/attestation",
            "/api/v1/site-domains/d-1/attestation?companySlug=acme",
            |c| drop(c.custd.unattest_site_domain("d-1", Some("acme"))),
            round_trip::<SiteDomainWithUptimePath>,
        ),
        row(
            "admin-api POST /api/v1/site-domains/{domainUuid}/approval",
            "/api/v1/site-domains/d-1/approval?companySlug=acme",
            |c| drop(c.custd.approve_site_domain("d-1", Some("acme"))),
            round_trip::<SiteDomainWithUptimePath>,
        ),
        row(
            "admin-api DELETE /api/v1/site-domains/{domainUuid}/approval",
            "/api/v1/site-domains/d-1/approval?companySlug=acme",
            |c| drop(c.custd.withdraw_site_domain_approval("d-1", Some("acme"))),
            round_trip::<SiteDomainWithUptimePath>,
        ),
        row(
            "admin-api POST /api/v1/site-domains/{domainUuid}/audit",
            "/api/v1/site-domains/d-1/audit?companySlug=acme",
            |c| drop(c.custd.request_site_audit("d-1", Some("acme"))),
            round_trip::<SiteDomainWithUptimePath>,
        ),
        row(
            "admin-api PUT /api/v1/site-domains/{domainUuid}/checks",
            "/api/v1/site-domains/d-1/checks?companySlug=acme",
            |c| {
                drop(c.custd.set_site_check_mode(
                    "d-1",
                    &body::<SiteCheckSettingsRequest>(r#"{"mode":"paused"}"#),
                    Some("acme"),
                ))
            },
            round_trip::<SiteDomainWithUptimePath>,
        ),
        row(
            "admin-api PUT /api/v1/site-domains/{domainUuid}/browser-collector",
            "/api/v1/site-domains/d-1/browser-collector",
            |c| {
                drop(c.custd.converge_site_browser_collector(
                    "d-1",
                    &body::<SiteBrowserCollectorRequest>(r#"{"mode":"enabled"}"#),
                ))
            },
            round_trip::<SiteBrowserCollector>,
        ),
        row(
            "admin-api GET /api/v1/site-domains/portfolio-summary",
            "/api/v1/site-domains/portfolio-summary?companySlug=acme",
            |c| drop(c.custd.get_site_portfolio_summary(Some("acme"))),
            round_trip::<SitePortfolioSummary>,
        ),
        row(
            "admin-api GET /api/v1/site-domains/{domainUuid}/next-actions",
            "/api/v1/site-domains/d-1/next-actions?companySlug=acme",
            |c| drop(c.custd.get_site_next_actions("d-1", Some("acme"))),
            round_trip::<SiteNextActions>,
        ),
    ]
}
