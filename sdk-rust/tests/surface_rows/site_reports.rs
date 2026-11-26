use custd_sdk::{
    SavedSiteReport, SavedSiteReportListResponse, SavedSiteReportRequest, SiteCampaignLink,
    SiteCampaignLinkList, SiteCampaignLinkRequest, SiteInsightsExport, SiteReport,
    SiteReportShareCreated, SiteReportShareListResponse, SiteReportShareRequest,
    SiteReportTemplate,
};

use super::{body, round_trip};
use crate::{Row, bodiless, row};

pub fn rows() -> Vec<Row> {
    vec![
        row(
            "admin-api GET /api/v1/site-domains/{domainUuid}/report",
            "/api/v1/site-domains/d-1/report?template=executive&days=7&companySlug=acme",
            |c| {
                drop(c.custd.get_site_report(
                    "d-1",
                    Some(SiteReportTemplate::Executive),
                    Some(7),
                    Some("acme"),
                ))
            },
            round_trip::<SiteReport>,
        ),
        row(
            "admin-api GET /api/v1/site-domains/{domainUuid}/report-shares",
            "/api/v1/site-domains/d-1/report-shares?companySlug=acme",
            |c| drop(c.custd.list_site_report_shares("d-1", Some("acme"))),
            round_trip::<SiteReportShareListResponse>,
        ),
        row(
            "admin-api POST /api/v1/site-domains/{domainUuid}/report-shares",
            "/api/v1/site-domains/d-1/report-shares?companySlug=acme",
            |c| {
                drop(c.custd.create_site_report_share(
                    "d-1",
                    &body::<SiteReportShareRequest>(r#"{}"#),
                    Some("acme"),
                ))
            },
            round_trip::<SiteReportShareCreated>,
        ),
        bodiless(
            "admin-api DELETE /api/v1/site-domains/{domainUuid}/report-shares/{shareUuid}",
            "/api/v1/site-domains/d-1/report-shares/s-1?companySlug=acme",
            |c| drop(c.custd.revoke_site_report_share("d-1", "s-1", Some("acme"))),
        ),
        row(
            "admin-api GET /api/v1/site-domains/{domainUuid}/saved-reports",
            "/api/v1/site-domains/d-1/saved-reports?companySlug=acme",
            |c| drop(c.custd.list_saved_site_reports("d-1", Some("acme"))),
            round_trip::<SavedSiteReportListResponse>,
        ),
        row(
            "admin-api GET /api/v1/site-domains/{domainUuid}/saved-reports/{reportUuid}",
            "/api/v1/site-domains/d-1/saved-reports/r-1?companySlug=acme",
            |c| drop(c.custd.get_saved_site_report("d-1", "r-1", Some("acme"))),
            round_trip::<SavedSiteReport>,
        ),
        row(
            "admin-api POST /api/v1/site-domains/{domainUuid}/saved-reports",
            "/api/v1/site-domains/d-1/saved-reports?companySlug=acme",
            |c| {
                drop(c.custd.save_site_report(
                    "d-1",
                    &body::<SavedSiteReportRequest>(r#"{"name":"x"}"#),
                    Some("acme"),
                ))
            },
            round_trip::<SavedSiteReport>,
        ),
        row(
            "admin-api PUT /api/v1/site-domains/{domainUuid}/saved-reports/{reportUuid}",
            "/api/v1/site-domains/d-1/saved-reports/r-1?companySlug=acme",
            |c| {
                drop(c.custd.replace_saved_site_report(
                    "d-1",
                    "r-1",
                    &body::<SavedSiteReportRequest>(r#"{"name":"x"}"#),
                    Some("acme"),
                ))
            },
            round_trip::<SavedSiteReport>,
        ),
        bodiless(
            "admin-api DELETE /api/v1/site-domains/{domainUuid}/saved-reports/{reportUuid}",
            "/api/v1/site-domains/d-1/saved-reports/r-1?companySlug=acme",
            |c| drop(c.custd.delete_saved_site_report("d-1", "r-1", Some("acme"))),
        ),
        row(
            "admin-api GET /api/v1/site-domains/{domainUuid}/export",
            "/api/v1/site-domains/d-1/export?companySlug=acme",
            |c| drop(c.custd.export_site_insights("d-1", Some("acme"))),
            round_trip::<SiteInsightsExport>,
        ),
        row(
            "admin-api GET /api/v1/site-domains/{domainUuid}/campaign-links",
            "/api/v1/site-domains/d-1/campaign-links?archived=true&companySlug=acme",
            |c| {
                drop(
                    c.custd
                        .list_site_campaign_links("d-1", Some(true), Some("acme")),
                )
            },
            round_trip::<SiteCampaignLinkList>,
        ),
        row(
            "admin-api POST /api/v1/site-domains/{domainUuid}/campaign-links",
            "/api/v1/site-domains/d-1/campaign-links?companySlug=acme",
            |c| {
                drop(c.custd.create_site_campaign_link(
                    "d-1",
                    &body::<SiteCampaignLinkRequest>(
                        r#"{"campaign":"x","medium":"x","source":"x","url":"x"}"#,
                    ),
                    Some("acme"),
                ))
            },
            round_trip::<SiteCampaignLink>,
        ),
        row(
            "admin-api POST /api/v1/site-domains/{domainUuid}/campaign-links/{linkUuid}/archive",
            "/api/v1/site-domains/d-1/campaign-links/l-1/archive?companySlug=acme",
            |c| {
                drop(
                    c.custd
                        .archive_site_campaign_link("d-1", "l-1", Some("acme")),
                )
            },
            round_trip::<SiteCampaignLink>,
        ),
    ]
}
