use custd_sdk::{
    DataScope, DataScopeCreateRequest, DataScopeGrant, DataScopeGrantListResponse,
    DataScopeGrantRequest, DataScopeGrantsKind, DataScopeListResponse, DataScopeResource,
    DataScopeResourceCreateRequest, DataScopeResourceListResponse, DataScopeResourceUpdateRequest,
    DataScopeUpdateRequest,
};

use super::{body, round_trip};
use crate::{Row, bodiless, row};

pub fn rows() -> Vec<Row> {
    vec![
        row(
            "admin-api GET /api/v1/admin/data-scopes",
            "/api/v1/admin/data-scopes?includeDisabled=true&companySlug=acme",
            |c| drop(c.custd.list_data_scopes(Some(true), Some("acme"))),
            round_trip::<DataScopeListResponse>,
        ),
        row(
            "admin-api POST /api/v1/admin/data-scopes",
            "/api/v1/admin/data-scopes?companySlug=acme",
            |c| {
                drop(c.custd.create_data_scope(
                    &body::<DataScopeCreateRequest>(r#"{"code":"x","name":"x"}"#),
                    Some("acme"),
                ))
            },
            round_trip::<DataScope>,
        ),
        row(
            "admin-api GET /api/v1/admin/data-scopes/{scopeUuid}",
            "/api/v1/admin/data-scopes/s-1?companySlug=acme",
            |c| drop(c.custd.get_data_scope("s-1", Some("acme"))),
            round_trip::<DataScope>,
        ),
        row(
            "admin-api PATCH /api/v1/admin/data-scopes/{scopeUuid}",
            "/api/v1/admin/data-scopes/s-1?companySlug=acme",
            |c| {
                drop(c.custd.update_data_scope(
                    "s-1",
                    &body::<DataScopeUpdateRequest>(r#"{}"#),
                    Some("acme"),
                ))
            },
            round_trip::<DataScope>,
        ),
        bodiless(
            "admin-api POST /api/v1/admin/data-scopes/{scopeUuid}/disable",
            "/api/v1/admin/data-scopes/s-1/disable?companySlug=acme",
            |c| drop(c.custd.disable_data_scope("s-1", Some("acme"))),
        ),
        row(
            "admin-api GET /api/v1/admin/data-scopes/{scopeUuid}/resources",
            "/api/v1/admin/data-scopes/s-1/resources?includeDisabled=true&companySlug=acme",
            |c| {
                drop(
                    c.custd
                        .list_data_scope_resources("s-1", Some(true), Some("acme")),
                )
            },
            round_trip::<DataScopeResourceListResponse>,
        ),
        row(
            "admin-api POST /api/v1/admin/data-scopes/{scopeUuid}/resources",
            "/api/v1/admin/data-scopes/s-1/resources?companySlug=acme",
            |c| {
                drop(c.custd.create_data_scope_resource(
                    "s-1",
                    &body::<DataScopeResourceCreateRequest>(r#"{"code":"x","name":"x"}"#),
                    Some("acme"),
                ))
            },
            round_trip::<DataScopeResource>,
        ),
        row(
            "admin-api GET /api/v1/admin/data-scopes/{scopeUuid}/resources/{resourceUuid}",
            "/api/v1/admin/data-scopes/s-1/resources/r-1?companySlug=acme",
            |c| drop(c.custd.get_data_scope_resource("s-1", "r-1", Some("acme"))),
            round_trip::<DataScopeResource>,
        ),
        row(
            "admin-api PATCH /api/v1/admin/data-scopes/{scopeUuid}/resources/{resourceUuid}",
            "/api/v1/admin/data-scopes/s-1/resources/r-1?companySlug=acme",
            |c| {
                drop(c.custd.update_data_scope_resource(
                    "s-1",
                    "r-1",
                    &body::<DataScopeResourceUpdateRequest>(r#"{}"#),
                    Some("acme"),
                ))
            },
            round_trip::<DataScopeResource>,
        ),
        bodiless(
            "admin-api POST /api/v1/admin/data-scopes/{scopeUuid}/resources/{resourceUuid}/disable",
            "/api/v1/admin/data-scopes/s-1/resources/r-1/disable?companySlug=acme",
            |c| {
                drop(
                    c.custd
                        .disable_data_scope_resource("s-1", "r-1", Some("acme")),
                )
            },
        ),
        row(
            "admin-api GET /api/v1/admin/data-scope-grants",
            "/api/v1/admin/data-scope-grants?kind=human&userUuid=u-1&clientId=c-1&companySlug=acme",
            |c| {
                drop(c.custd.list_data_scope_grants(
                    Some(DataScopeGrantsKind::Human),
                    Some("u-1"),
                    Some("c-1"),
                    Some("acme"),
                ))
            },
            round_trip::<DataScopeGrantListResponse>,
        ),
        row(
            "admin-api POST /api/v1/admin/data-scope-grants",
            "/api/v1/admin/data-scope-grants?companySlug=acme",
            |c| {
                drop(c.custd.create_data_scope_grant(
                    &body::<DataScopeGrantRequest>(
                        r#"{"action":"x","principal":{"kind":"x"},"target":{"kind":"x"}}"#,
                    ),
                    Some("acme"),
                ))
            },
            round_trip::<DataScopeGrant>,
        ),
        bodiless(
            "admin-api POST /api/v1/admin/data-scope-grants/revoke",
            "/api/v1/admin/data-scope-grants/revoke?companySlug=acme",
            |c| {
                drop(c.custd.revoke_data_scope_grant(
                    &body::<DataScopeGrantRequest>(
                        r#"{"action":"x","principal":{"kind":"x"},"target":{"kind":"x"}}"#,
                    ),
                    Some("acme"),
                ))
            },
        ),
    ]
}
