use custd_sdk::{
    Site, SiteCreateRequest, SiteCreateResponse, SiteListResponse, SiteUpdateRequest,
    SiteWriteKeyResponse,
};

use super::{body, round_trip};
use crate::{Row, bodiless, row};

pub fn rows() -> Vec<Row> {
    vec![
        row(
            "admin-api GET /api/v1/admin/sites",
            "/api/v1/admin/sites",
            |c| drop(c.custd.list_sites()),
            round_trip::<SiteListResponse>,
        ),
        row(
            "admin-api POST /api/v1/admin/sites",
            "/api/v1/admin/sites",
            |c| {
                drop(c.custd.create_site(&body::<SiteCreateRequest>(r#"{"allowedOrigins":[],"companySlug":"x","environment":"x","identityMode":"x","ingestTarget":{"resourceUuid":"x","scopeUuid":"x"},"name":"x"}"#)))
            },
            round_trip::<SiteCreateResponse>,
        ),
        row(
            "admin-api GET /api/v1/admin/sites/{siteUuid}",
            "/api/v1/admin/sites/s-1",
            |c| drop(c.custd.get_site("s-1")),
            round_trip::<Site>,
        ),
        row(
            "admin-api PATCH /api/v1/admin/sites/{siteUuid}",
            "/api/v1/admin/sites/s-1",
            |c| {
                drop(c.custd.update_site(
                    "s-1",
                    &body::<SiteUpdateRequest>(
                        r#"{"allowedOrigins":[],"environment":"x","identityMode":"cookieless"}"#,
                    ),
                ))
            },
            round_trip::<Site>,
        ),
        bodiless(
            "admin-api DELETE /api/v1/admin/sites/{siteUuid}",
            "/api/v1/admin/sites/s-1",
            |c| drop(c.custd.delete_site("s-1")),
        ),
        row(
            "admin-api POST /api/v1/admin/sites/{siteUuid}/rotate-write-key",
            "/api/v1/admin/sites/s-1/rotate-write-key",
            |c| drop(c.custd.rotate_site_write_key("s-1")),
            round_trip::<SiteWriteKeyResponse>,
        ),
    ]
}
