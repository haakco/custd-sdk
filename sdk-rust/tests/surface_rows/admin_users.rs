use custd_sdk::{
    AdminPasswordResetResponse, AdminUser, AdminUserCreateRequest, AdminUserDisableRequest,
    AdminUserEnableRequest, AdminUserListResponse, AdminUserMembershipCreateRequest,
    AdminUserQuery, AdminUserRemovalRequest, AdminUserRoleListResponse, AdminUserUpdateRequest,
};

use super::{body, round_trip};
use crate::{Row, bodiless, row};

pub fn rows() -> Vec<Row> {
    vec![
        row(
            "admin-api GET /api/v1/admin/users",
            "/api/v1/admin/users?companySlug=acme",
            |c| {
                drop(
                    c.custd
                        .list_admin_users(&AdminUserQuery::default(), Some("acme")),
                )
            },
            round_trip::<AdminUserListResponse>,
        ),
        row(
            "admin-api POST /api/v1/admin/users",
            "/api/v1/admin/users",
            |c| {
                drop(c.custd.create_admin_user(&body::<AdminUserCreateRequest>(
                    r#"{"companySlug":"x","email":"x","roles":[]}"#,
                )))
            },
            round_trip::<AdminUser>,
        ),
        row(
            "admin-api GET /api/v1/admin/users/{userUuid}",
            "/api/v1/admin/users/u-1?includeEnded=true&companySlug=acme",
            |c| drop(c.custd.get_admin_user("u-1", Some(true), Some("acme"))),
            round_trip::<AdminUser>,
        ),
        row(
            "admin-api PUT /api/v1/admin/users/{userUuid}",
            "/api/v1/admin/users/u-1?companySlug=acme",
            |c| {
                drop(c.custd.update_admin_user(
                    "u-1",
                    &body::<AdminUserUpdateRequest>(r#"{"roles":[]}"#),
                    Some("acme"),
                ))
            },
            round_trip::<AdminUser>,
        ),
        bodiless(
            "admin-api POST /api/v1/admin/users/{userUuid}/disable",
            "/api/v1/admin/users/u-1/disable?globalUser=true&companySlug=acme",
            |c| {
                drop(c.custd.disable_admin_user(
                    "u-1",
                    Some(true),
                    &body::<AdminUserDisableRequest>(r#"{"reason":"x"}"#),
                    Some("acme"),
                ))
            },
        ),
        bodiless(
            "admin-api POST /api/v1/admin/users/{userUuid}/enable",
            "/api/v1/admin/users/u-1/enable?globalUser=true&companySlug=acme",
            |c| {
                drop(c.custd.enable_admin_user(
                    "u-1",
                    Some(true),
                    &body::<AdminUserEnableRequest>(r#"{"roles":[]}"#),
                    Some("acme"),
                ))
            },
        ),
        row(
            "admin-api POST /api/v1/admin/users/{userUuid}/memberships",
            "/api/v1/admin/users/u-1/memberships",
            |c| {
                drop(c.custd.add_admin_user_membership(
                    "u-1",
                    &body::<AdminUserMembershipCreateRequest>(r#"{"companySlug":"x","roles":[]}"#),
                ))
            },
            round_trip::<AdminUser>,
        ),
        row(
            "admin-api POST /api/v1/admin/users/{userUuid}/reset-password",
            "/api/v1/admin/users/u-1/reset-password?includeEnded=true&companySlug=acme",
            |c| {
                drop(
                    c.custd
                        .reset_admin_user_password("u-1", Some(true), Some("acme")),
                )
            },
            round_trip::<AdminPasswordResetResponse>,
        ),
        row(
            "admin-api POST /api/v1/admin/users/{userUuid}/restore",
            "/api/v1/admin/users/u-1/restore?companySlug=acme",
            |c| {
                drop(c.custd.restore_admin_user(
                    "u-1",
                    &body::<AdminUserRemovalRequest>(r#"{"reason":"x"}"#),
                    "acme",
                ))
            },
            round_trip::<AdminUser>,
        ),
        bodiless(
            "admin-api POST /api/v1/admin/users/{userUuid}/retry-welcome",
            "/api/v1/admin/users/u-1/retry-welcome?includeEnded=true&companySlug=acme",
            |c| {
                drop(
                    c.custd
                        .retry_admin_user_welcome("u-1", Some(true), Some("acme")),
                )
            },
        ),
        row(
            "admin-api POST /api/v1/admin/users/{userUuid}/soft-delete",
            "/api/v1/admin/users/u-1/soft-delete?companySlug=acme",
            |c| {
                drop(c.custd.soft_delete_admin_user(
                    "u-1",
                    &body::<AdminUserRemovalRequest>(r#"{"reason":"x"}"#),
                    "acme",
                ))
            },
            round_trip::<AdminUser>,
        ),
        row(
            "admin-api GET /api/v1/admin/user-roles",
            "/api/v1/admin/user-roles",
            |c| drop(c.custd.list_admin_user_roles()),
            round_trip::<AdminUserRoleListResponse>,
        ),
    ]
}
