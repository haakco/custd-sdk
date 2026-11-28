use custd_sdk::{
    AppCreateRequest, AppCreation, AppDeployCredential, AppDeployCredentialList, AppListResponse,
    AppOverview, AppSignInRequest, AppSummary,
};

use super::{body, round_trip};
use crate::{Row, bodiless, row};

pub fn rows() -> Vec<Row> {
    vec![
        row(
            "admin-api GET /api/v1/admin/apps",
            "/api/v1/admin/apps?after=a-1",
            |c| drop(c.custd.list_apps(Some("a-1"))),
            round_trip::<AppListResponse>,
        ),
        row(
            "admin-api GET /api/v1/admin/apps/{slug}",
            "/api/v1/admin/apps/s-1",
            |c| drop(c.custd.get_app("s-1")),
            round_trip::<AppOverview>,
        ),
        row(
            "admin-api POST /api/v1/admin/apps",
            "/api/v1/admin/apps",
            |c| {
                drop(
                    c.custd
                        .create_app(&body::<AppCreateRequest>(r#"{"name":"x"}"#), "key-0001"),
                )
            },
            round_trip::<AppCreation>,
        ),
        row(
            "admin-api POST /api/v1/admin/apps/{slug}/pause",
            "/api/v1/admin/apps/s-1/pause",
            |c| drop(c.custd.pause_app("s-1", "key-0001")),
            round_trip::<AppSummary>,
        ),
        row(
            "admin-api POST /api/v1/admin/apps/{slug}/resume",
            "/api/v1/admin/apps/s-1/resume",
            |c| drop(c.custd.resume_app("s-1", "key-0001")),
            round_trip::<AppSummary>,
        ),
        row(
            "admin-api POST /api/v1/admin/apps/{slug}/repair",
            "/api/v1/admin/apps/s-1/repair",
            |c| drop(c.custd.repair_app("s-1", "key-0001")),
            round_trip::<AppSummary>,
        ),
        row(
            "admin-api POST /api/v1/admin/apps/{slug}/sign-in",
            "/api/v1/admin/apps/s-1/sign-in",
            |c| {
                drop(c.custd.set_app_sign_in(
                    "s-1",
                    &body::<AppSignInRequest>(r#"{"expectedRevision":1,"mode":"off"}"#),
                    "key-0001",
                ))
            },
            round_trip::<AppSummary>,
        ),
        row(
            "admin-api GET /api/v1/admin/apps/{slug}/deploy-credentials",
            "/api/v1/admin/apps/s-1/deploy-credentials",
            |c| drop(c.custd.list_app_deploy_credentials("s-1")),
            round_trip::<AppDeployCredentialList>,
        ),
        row(
            "admin-api POST /api/v1/admin/apps/{slug}/deploy-credentials",
            "/api/v1/admin/apps/s-1/deploy-credentials",
            |c| drop(c.custd.create_app_deploy_credential("s-1")),
            round_trip::<AppDeployCredential>,
        ),
        bodiless(
            "admin-api DELETE /api/v1/admin/apps/{slug}/deploy-credentials/{clientId}",
            "/api/v1/admin/apps/s-1/deploy-credentials/c-1",
            |c| drop(c.custd.delete_app_deploy_credential("s-1", "c-1")),
        ),
        row(
            "admin-api GET /api/v1/admin/apps/{slug}/purchase-handoff-credentials",
            "/api/v1/admin/apps/s-1/purchase-handoff-credentials",
            |c| drop(c.custd.list_purchase_handoff_credentials("s-1")),
            round_trip::<AppDeployCredentialList>,
        ),
        row(
            "admin-api POST /api/v1/admin/apps/{slug}/purchase-handoff-credentials",
            "/api/v1/admin/apps/s-1/purchase-handoff-credentials",
            |c| drop(c.custd.create_purchase_handoff_credential("s-1")),
            round_trip::<AppDeployCredential>,
        ),
        bodiless(
            "admin-api DELETE /api/v1/admin/apps/{slug}/purchase-handoff-credentials/{clientId}",
            "/api/v1/admin/apps/s-1/purchase-handoff-credentials/c-1",
            |c| drop(c.custd.delete_purchase_handoff_credential("s-1", "c-1")),
        ),
    ]
}
