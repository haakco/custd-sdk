use custd_sdk::{
    SiteContentGap, SiteKeywordClusters, SiteKeywordList, SiteKeywordListRequest, SiteKeywordLists,
    SiteRankings, SiteTrackedKeyword, SiteTrackedKeywordRequest, SiteTrackedKeywordUpdate,
};

use super::{body, round_trip};
use crate::{Row, bodiless, row};

pub fn rows() -> Vec<Row> {
    vec![
        bodiless(
            "admin-api DELETE /api/v1/site-domains/keyword-lists",
            "/api/v1/site-domains/keyword-lists?siteUuid=s-1&name=n-1&companySlug=acme",
            |c| {
                drop(
                    c.custd
                        .delete_site_keyword_list(Some("s-1"), "n-1", Some("acme")),
                )
            },
        ),
        row(
            "admin-api GET /api/v1/site-domains/keyword-clusters",
            "/api/v1/site-domains/keyword-clusters?siteUuid=s-1&name=n-1&companySlug=acme",
            |c| {
                drop(
                    c.custd
                        .get_site_keyword_clusters(Some("s-1"), "n-1", Some("acme")),
                )
            },
            round_trip::<SiteKeywordClusters>,
        ),
        row(
            "admin-api GET /api/v1/site-domains/keyword-lists",
            "/api/v1/site-domains/keyword-lists?siteUuid=s-1&companySlug=acme",
            |c| drop(c.custd.list_site_keyword_lists(Some("s-1"), Some("acme"))),
            round_trip::<SiteKeywordLists>,
        ),
        row(
            "admin-api PUT /api/v1/site-domains/keyword-lists",
            "/api/v1/site-domains/keyword-lists?siteUuid=s-1&companySlug=acme",
            |c| {
                drop(c.custd.save_site_keyword_list(
                    Some("s-1"),
                    &body::<SiteKeywordListRequest>(r#"{"keywords":[],"name":"x"}"#),
                    Some("acme"),
                ))
            },
            round_trip::<SiteKeywordList>,
        ),
        row(
            "admin-api GET /api/v1/site-domains/{domainUuid}/rankings",
            "/api/v1/site-domains/d-1/rankings?days=7&companySlug=acme",
            |c| drop(c.custd.get_site_rankings("d-1", Some(7), Some("acme"))),
            round_trip::<SiteRankings>,
        ),
        row(
            "admin-api POST /api/v1/site-domains/{domainUuid}/rankings/keywords",
            "/api/v1/site-domains/d-1/rankings/keywords?companySlug=acme",
            |c| {
                drop(c.custd.track_site_keyword(
                    "d-1",
                    &body::<SiteTrackedKeywordRequest>(r#"{"keyword":"x"}"#),
                    Some("acme"),
                ))
            },
            round_trip::<SiteTrackedKeyword>,
        ),
        row(
            "admin-api PUT /api/v1/site-domains/{domainUuid}/rankings/keywords/{keywordUuid}",
            "/api/v1/site-domains/d-1/rankings/keywords/k-1?companySlug=acme",
            |c| {
                drop(c.custd.update_site_tracked_keyword(
                    "d-1",
                    "k-1",
                    &body::<SiteTrackedKeywordUpdate>(r#"{"paused":true}"#),
                    Some("acme"),
                ))
            },
            round_trip::<SiteTrackedKeyword>,
        ),
        bodiless(
            "admin-api DELETE /api/v1/site-domains/{domainUuid}/rankings/keywords/{keywordUuid}",
            "/api/v1/site-domains/d-1/rankings/keywords/k-1?companySlug=acme",
            |c| drop(c.custd.untrack_site_keyword("d-1", "k-1", Some("acme"))),
        ),
        row(
            "admin-api GET /api/v1/site-domains/content-gap",
            "/api/v1/site-domains/content-gap?siteUuid=s-1&seed=s-1&companySlug=acme",
            |c| {
                drop(
                    c.custd
                        .get_site_content_gap(Some("s-1"), Some("s-1"), Some("acme")),
                )
            },
            round_trip::<SiteContentGap>,
        ),
    ]
}
