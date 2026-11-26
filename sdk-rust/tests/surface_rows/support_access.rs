use custd_sdk::{
    SupportAccessGrant, SupportAccessGrantCreateRequest, SupportAccessGrantListResponse,
};

use super::{body, round_trip};
use crate::{Row, bodiless, row};

pub fn rows() -> Vec<Row> {
    vec![
        row(
            "admin-api GET /api/v1/admin/support-access",
            "/api/v1/admin/support-access?companySlug=acme",
            |c| drop(c.custd.list_support_access_grants(Some("acme"))),
            round_trip::<SupportAccessGrantListResponse>,
        ),
        row(
            "admin-api POST /api/v1/admin/support-access",
            "/api/v1/admin/support-access",
            |c| {
                drop(
                    c.custd
                        .create_support_access_grant(&body::<SupportAccessGrantCreateRequest>(
                            r#"{"companySlug":"x","expiresAt":"x","reason":"x"}"#,
                        )),
                )
            },
            round_trip::<SupportAccessGrant>,
        ),
        bodiless(
            "admin-api POST /api/v1/admin/support-access/{supportAccessGrantUuid}/revoke",
            "/api/v1/admin/support-access/s-1/revoke",
            |c| drop(c.custd.revoke_support_access_grant("s-1")),
        ),
    ]
}
