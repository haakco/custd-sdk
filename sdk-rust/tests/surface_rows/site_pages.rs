use custd_sdk::{
    SiteLighthouseHistory, SiteLighthousePages, SiteLighthousePagesRequest, SiteObservedWording,
    SitePageCheckRequest, SitePageCheckResponse, SitePageFacts, SitePageRecheck,
    SitePageRecheckList, SitePageRecheckRequest, SitePageSearchQueries, SiteRobotsTestRequest,
    SiteRobotsTestResponse, SiteWordingCompare, SiteWordingCompareRequest,
};

use super::{body, round_trip};
use crate::{Row, row};

pub fn rows() -> Vec<Row> {
    vec![
        row(
            "admin-api GET /api/v1/site-domains/{domainUuid}/page-facts",
            "/api/v1/site-domains/d-1/page-facts?url=u-1&companySlug=acme",
            |c| drop(c.custd.get_site_page_facts("d-1", "u-1", Some("acme"))),
            round_trip::<SitePageFacts>,
        ),
        row(
            "admin-api GET /api/v1/site-domains/{domainUuid}/page-rechecks",
            "/api/v1/site-domains/d-1/page-rechecks?ids=a-1%2Cb-1&companySlug=acme",
            |c| {
                drop(
                    c.custd
                        .list_site_page_rechecks("d-1", &["a-1", "b-1"], Some("acme")),
                )
            },
            round_trip::<SitePageRecheckList>,
        ),
        row(
            "admin-api GET /api/v1/site-domains/{domainUuid}/page-rechecks/{recheckUuid}",
            "/api/v1/site-domains/d-1/page-rechecks/r-1?companySlug=acme",
            |c| drop(c.custd.get_site_page_recheck("d-1", "r-1", Some("acme"))),
            round_trip::<SitePageRecheck>,
        ),
        row(
            "admin-api POST /api/v1/site-domains/{domainUuid}/page-rechecks",
            "/api/v1/site-domains/d-1/page-rechecks?companySlug=acme",
            |c| {
                drop(c.custd.request_site_page_recheck(
                    "d-1",
                    &body::<SitePageRecheckRequest>(r#"{"url":"x"}"#),
                    Some("acme"),
                ))
            },
            round_trip::<SitePageRecheck>,
        ),
        row(
            "admin-api GET /api/v1/site-domains/{domainUuid}/page-wording",
            "/api/v1/site-domains/d-1/page-wording?firstUrl=f-1&secondUrl=s-1&companySlug=acme",
            |c| {
                drop(
                    c.custd
                        .compare_site_page_wording("d-1", "f-1", "s-1", Some("acme")),
                )
            },
            round_trip::<SiteObservedWording>,
        ),
        row(
            "admin-api POST /api/v1/site-domains/{domainUuid}/page-check",
            "/api/v1/site-domains/d-1/page-check?companySlug=acme",
            |c| {
                drop(c.custd.check_site_page(
                    "d-1",
                    &body::<SitePageCheckRequest>(r#"{"html":"x","url":"x"}"#),
                    Some("acme"),
                ))
            },
            round_trip::<SitePageCheckResponse>,
        ),
        row(
            "admin-api POST /api/v1/site-domains/{domainUuid}/robots-test",
            "/api/v1/site-domains/d-1/robots-test?companySlug=acme",
            |c| {
                drop(c.custd.test_site_robots(
                    "d-1",
                    &body::<SiteRobotsTestRequest>(r#"{"url":"x","userAgent":"x"}"#),
                    Some("acme"),
                ))
            },
            round_trip::<SiteRobotsTestResponse>,
        ),
        row(
            "admin-api POST /api/v1/site-domains/{domainUuid}/wording-compare",
            "/api/v1/site-domains/d-1/wording-compare?companySlug=acme",
            |c| {
                drop(c.custd.compare_site_wording(
                    "d-1",
                    &body::<SiteWordingCompareRequest>(r#"{"first":"x","second":"x"}"#),
                    Some("acme"),
                ))
            },
            round_trip::<SiteWordingCompare>,
        ),
        row(
            "admin-api GET /api/v1/site-domains/{domainUuid}/page-search-queries",
            "/api/v1/site-domains/d-1/page-search-queries?url=u-1&companySlug=acme",
            |c| {
                drop(
                    c.custd
                        .get_site_page_search_queries("d-1", "u-1", Some("acme")),
                )
            },
            round_trip::<SitePageSearchQueries>,
        ),
        row(
            "admin-api GET /api/v1/site-domains/{domainUuid}/lighthouse",
            "/api/v1/site-domains/d-1/lighthouse?days=7&url=u-1&companySlug=acme",
            |c| {
                drop(
                    c.custd
                        .get_site_lighthouse_history("d-1", Some(7), Some("u-1"), Some("acme")),
                )
            },
            round_trip::<SiteLighthouseHistory>,
        ),
        row(
            "admin-api GET /api/v1/site-domains/{domainUuid}/lighthouse/pages",
            "/api/v1/site-domains/d-1/lighthouse/pages?companySlug=acme",
            |c| drop(c.custd.get_site_lighthouse_pages("d-1", Some("acme"))),
            round_trip::<SiteLighthousePages>,
        ),
        row(
            "admin-api PUT /api/v1/site-domains/{domainUuid}/lighthouse/pages",
            "/api/v1/site-domains/d-1/lighthouse/pages?companySlug=acme",
            |c| {
                drop(c.custd.set_site_lighthouse_pages(
                    "d-1",
                    &body::<SiteLighthousePagesRequest>(r#"{"urls":[]}"#),
                    Some("acme"),
                ))
            },
            round_trip::<SiteLighthousePages>,
        ),
    ]
}
