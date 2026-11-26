use custd_sdk::{
    AuthProjectAppCreateReleaseRequest, AuthProjectAppPromotion, AuthProjectAppRelease,
    AuthProjectAppReleaseList,
};

use super::{body, round_trip};
use crate::{Row, row};

pub fn rows() -> Vec<Row> {
    vec![
        row(
            "admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/releases",
            "/api/v1/admin/auth-projects/p-1/environments/e-1/releases?limit=7",
            |c| {
                drop(
                    c.custd
                        .list_auth_project_app_releases("p-1", "e-1", Some(7)),
                )
            },
            round_trip::<AuthProjectAppReleaseList>,
        ),
        row(
            "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/releases",
            "/api/v1/admin/auth-projects/p-1/environments/e-1/releases",
            |c| {
                drop(c.custd.create_auth_project_app_release(
                    "p-1",
                    "e-1",
                    &body::<AuthProjectAppCreateReleaseRequest>(r#"{"files":[],"routing":{}}"#),
                ))
            },
            round_trip::<AuthProjectAppRelease>,
        ),
        row(
            "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/releases/{releaseId}/verify",
            "/api/v1/admin/auth-projects/p-1/environments/e-1/releases/r-1/verify",
            |c| drop(c.custd.verify_auth_project_app_release("p-1", "e-1", "r-1")),
            round_trip::<AuthProjectAppRelease>,
        ),
        row(
            "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/releases/{releaseId}/promote",
            "/api/v1/admin/auth-projects/p-1/environments/e-1/releases/r-1/promote",
            |c| {
                drop(
                    c.custd
                        .promote_auth_project_app_release("p-1", "e-1", "r-1"),
                )
            },
            round_trip::<AuthProjectAppPromotion>,
        ),
    ]
}
