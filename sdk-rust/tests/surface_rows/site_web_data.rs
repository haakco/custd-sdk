use custd_sdk::{
    SiteProjectContext, SiteProjectContextRequest, SiteReferringDomains, SiteRegionalTrends,
    SiteTopicTrends, SiteWebDomains, SiteWebPages, SiteWebPagesQuery,
};

use super::{body, round_trip};
use crate::{Row, row};

pub fn rows() -> Vec<Row> {
    vec![
        row(
            "admin-api GET /api/v1/site-domains/topic-trends",
            "/api/v1/site-domains/topic-trends?siteUuid=s-1&companySlug=acme",
            |c| drop(c.custd.get_site_topic_trends(Some("s-1"), Some("acme"))),
            round_trip::<SiteTopicTrends>,
        ),
        row(
            "admin-api GET /api/v1/site-domains/web-domains",
            "/api/v1/site-domains/web-domains?siteUuid=s-1&companySlug=acme",
            |c| drop(c.custd.get_site_web_domains(Some("s-1"), Some("acme"))),
            round_trip::<SiteWebDomains>,
        ),
        row(
            "admin-api GET /api/v1/site-domains/web-pages",
            "/api/v1/site-domains/web-pages?siteUuid=s-1&domain=d-1&after=a-1&limit=7&companySlug=acme",
            |c| {
                drop(c.custd.list_site_web_pages(
                    &SiteWebPagesQuery {
                        site_uuid: Some("s-1".to_owned()),
                        domain: "d-1".to_owned(),
                        after: Some("a-1".to_owned()),
                        limit: Some(7),
                    },
                    Some("acme"),
                ))
            },
            round_trip::<SiteWebPages>,
        ),
        row(
            "admin-api GET /api/v1/site-domains/referring-domains",
            "/api/v1/site-domains/referring-domains?siteUuid=s-1&domain=d-1&companySlug=acme",
            |c| {
                drop(
                    c.custd
                        .get_site_referring_domains(Some("s-1"), "d-1", Some("acme")),
                )
            },
            round_trip::<SiteReferringDomains>,
        ),
        row(
            "admin-api GET /api/v1/site-domains/regional-trends",
            "/api/v1/site-domains/regional-trends?siteUuid=s-1&companySlug=acme",
            |c| drop(c.custd.get_site_regional_trends(Some("s-1"), Some("acme"))),
            round_trip::<SiteRegionalTrends>,
        ),
        row(
            "admin-api GET /api/v1/site-domains/project-context",
            "/api/v1/site-domains/project-context?siteUuid=s-1&companySlug=acme",
            |c| drop(c.custd.get_site_project_context(Some("s-1"), Some("acme"))),
            round_trip::<SiteProjectContext>,
        ),
        row(
            "admin-api PUT /api/v1/site-domains/project-context",
            "/api/v1/site-domains/project-context?siteUuid=s-1&companySlug=acme",
            |c| {
                drop(c.custd.set_site_project_context(
                    Some("s-1"),
                    &body::<SiteProjectContextRequest>(
                        r#"{"brandNames":[],"competitorDomains":[],"markets":[]}"#,
                    ),
                    Some("acme"),
                ))
            },
            round_trip::<SiteProjectContext>,
        ),
    ]
}
