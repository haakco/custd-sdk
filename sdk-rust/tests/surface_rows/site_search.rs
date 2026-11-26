use custd_sdk::{
    SiteFindingImpact, SiteIndexNowState, SiteIndexNowSubmission, SiteIndexNowSubmissionRequest,
    SiteSearchAccount, SiteSearchConnection, SiteSearchConnectionRequest, SiteSearchInspection,
    SiteSearchInspectionList, SiteSearchInspectionRequest, SiteSearchMetricExportPage,
    SiteSearchPerformance, SiteSearchPoolQueryPage, SiteSearchPoolSetting,
    SiteSearchPoolSettingRequest, SiteSearchProvider, SiteSearchRowPage, SiteSearchRowsDimension,
    SiteSearchRowsQuery, SiteSearchValue,
};

use super::{body, round_trip};
use crate::{Row, bodiless, row};

pub fn rows() -> Vec<Row> {
    vec![
        row(
            "admin-api GET /api/v1/site-domains/search-account",
            "/api/v1/site-domains/search-account?companySlug=acme",
            |c| drop(c.custd.get_site_search_account(Some("acme"))),
            round_trip::<SiteSearchAccount>,
        ),
        row(
            "admin-api GET /api/v1/site-domains/{domainUuid}/search",
            "/api/v1/site-domains/d-1/search?days=7&companySlug=acme",
            |c| {
                drop(
                    c.custd
                        .get_site_search_performance("d-1", Some(7), Some("acme")),
                )
            },
            round_trip::<SiteSearchPerformance>,
        ),
        row(
            "admin-api PUT /api/v1/site-domains/{domainUuid}/search/{provider}",
            "/api/v1/site-domains/d-1/search/google?companySlug=acme",
            |c| {
                drop(c.custd.connect_site_search(
                    "d-1",
                    SiteSearchProvider::Google,
                    &body::<SiteSearchConnectionRequest>(r#"{"property":"x"}"#),
                    Some("acme"),
                ))
            },
            round_trip::<SiteSearchConnection>,
        ),
        bodiless(
            "admin-api DELETE /api/v1/site-domains/{domainUuid}/search/{provider}",
            "/api/v1/site-domains/d-1/search/google?companySlug=acme",
            |c| {
                drop(c.custd.disconnect_site_search(
                    "d-1",
                    SiteSearchProvider::Google,
                    Some("acme"),
                ))
            },
        ),
        row(
            "admin-api POST /api/v1/site-domains/{domainUuid}/search/{provider}/retry",
            "/api/v1/site-domains/d-1/search/google/retry?companySlug=acme",
            |c| {
                drop(c.custd.retry_site_search_import(
                    "d-1",
                    SiteSearchProvider::Google,
                    Some("acme"),
                ))
            },
            round_trip::<SiteSearchConnection>,
        ),
        row(
            "admin-api GET /api/v1/site-domains/{domainUuid}/search/rows",
            "/api/v1/site-domains/d-1/search/rows?dimension=page&provider=google&days=7&offset=7&limit=7&companySlug=acme",
            |c| {
                drop(c.custd.list_site_search_rows(
                    "d-1",
                    &SiteSearchRowsQuery {
                        dimension: Some(SiteSearchRowsDimension::Page),
                        provider: Some(SiteSearchProvider::Google),
                        days: Some(7),
                        offset: Some(7),
                        limit: Some(7),
                    },
                    Some("acme"),
                ))
            },
            round_trip::<SiteSearchRowPage>,
        ),
        row(
            "admin-api GET /api/v1/site-domains/{domainUuid}/search/inspections",
            "/api/v1/site-domains/d-1/search/inspections?companySlug=acme",
            |c| drop(c.custd.list_site_search_inspections("d-1", Some("acme"))),
            round_trip::<SiteSearchInspectionList>,
        ),
        row(
            "admin-api POST /api/v1/site-domains/{domainUuid}/search/inspections",
            "/api/v1/site-domains/d-1/search/inspections?companySlug=acme",
            |c| {
                drop(c.custd.request_site_search_inspection(
                    "d-1",
                    &body::<SiteSearchInspectionRequest>(r#"{"url":"x"}"#),
                    Some("acme"),
                ))
            },
            round_trip::<SiteSearchInspection>,
        ),
        row(
            "admin-api GET /api/v1/site-domains/search-pool",
            "/api/v1/site-domains/search-pool?companySlug=acme",
            |c| drop(c.custd.get_site_search_pool(Some("acme"))),
            round_trip::<SiteSearchPoolSetting>,
        ),
        row(
            "admin-api GET /api/v1/site-domains/search-pool/queries",
            "/api/v1/site-domains/search-pool/queries?search=s-1&limit=7&companySlug=acme",
            |c| {
                drop(
                    c.custd
                        .list_site_search_pool_queries(Some("s-1"), Some(7), Some("acme")),
                )
            },
            round_trip::<SiteSearchPoolQueryPage>,
        ),
        row(
            "admin-api PUT /api/v1/site-domains/search-pool",
            "/api/v1/site-domains/search-pool?companySlug=acme",
            |c| {
                drop(c.custd.set_site_search_pool(
                    &body::<SiteSearchPoolSettingRequest>(r#"{"joined":true}"#),
                    Some("acme"),
                ))
            },
            round_trip::<SiteSearchPoolSetting>,
        ),
        row(
            "admin-api GET /api/v1/site-domains/{domainUuid}/search-value",
            "/api/v1/site-domains/d-1/search-value?days=7&goal=a-1%2Cb-1&companySlug=acme",
            |c| {
                drop(
                    c.custd
                        .get_site_search_value("d-1", Some(7), &["a-1", "b-1"], Some("acme")),
                )
            },
            round_trip::<SiteSearchValue>,
        ),
        row(
            "admin-api GET /api/v1/site-domains/{domainUuid}/findings/{findingUuid}/search-impact",
            "/api/v1/site-domains/d-1/findings/f-1/search-impact?days=7&companySlug=acme",
            |c| {
                drop(
                    c.custd
                        .get_site_finding_search_impact("d-1", "f-1", Some(7), Some("acme")),
                )
            },
            round_trip::<SiteFindingImpact>,
        ),
        row(
            "admin-api GET /api/v1/site-domains/{domainUuid}/export/search-metrics",
            "/api/v1/site-domains/d-1/export/search-metrics?offset=7&limit=7&companySlug=acme",
            |c| {
                drop(
                    c.custd
                        .export_site_search_metrics("d-1", Some(7), Some(7), Some("acme")),
                )
            },
            round_trip::<SiteSearchMetricExportPage>,
        ),
        row(
            "admin-api GET /api/v1/site-domains/{domainUuid}/indexnow",
            "/api/v1/site-domains/d-1/indexnow?companySlug=acme",
            |c| drop(c.custd.get_site_index_now("d-1", Some("acme"))),
            round_trip::<SiteIndexNowState>,
        ),
        row(
            "admin-api PUT /api/v1/site-domains/{domainUuid}/indexnow",
            "/api/v1/site-domains/d-1/indexnow?companySlug=acme",
            |c| drop(c.custd.enable_site_index_now("d-1", Some("acme"))),
            round_trip::<SiteIndexNowState>,
        ),
        bodiless(
            "admin-api DELETE /api/v1/site-domains/{domainUuid}/indexnow",
            "/api/v1/site-domains/d-1/indexnow?companySlug=acme",
            |c| drop(c.custd.disable_site_index_now("d-1", Some("acme"))),
        ),
        row(
            "admin-api POST /api/v1/site-domains/{domainUuid}/indexnow/verify",
            "/api/v1/site-domains/d-1/indexnow/verify?companySlug=acme",
            |c| drop(c.custd.verify_site_index_now_key("d-1", Some("acme"))),
            round_trip::<SiteIndexNowState>,
        ),
        row(
            "admin-api POST /api/v1/site-domains/{domainUuid}/indexnow/submissions",
            "/api/v1/site-domains/d-1/indexnow/submissions?companySlug=acme",
            |c| {
                drop(c.custd.submit_site_index_now(
                    "d-1",
                    &body::<SiteIndexNowSubmissionRequest>(r#"{"urls":[]}"#),
                    Some("acme"),
                ))
            },
            round_trip::<SiteIndexNowSubmission>,
        ),
    ]
}
