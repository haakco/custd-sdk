use custd_sdk::{
    AuthDomainBindRequest, AuthDomainBinding, AuthDomainImageOverrideSetRequest,
    AuthDomainMintRequest,
};

use super::{body, round_trip};
use crate::{Row, bodiless, row};

pub fn rows() -> Vec<Row> {
    vec![
        row(
            "admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/domain",
            "/api/v1/admin/auth-projects/p-1/environments/e-1/domain",
            |c| drop(c.custd.get_auth_project_domain("p-1", "e-1")),
            round_trip::<AuthDomainBinding>,
        ),
        row(
            "admin-api PUT /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/domain",
            "/api/v1/admin/auth-projects/p-1/environments/e-1/domain",
            |c| {
                drop(c.custd.bind_auth_project_domain(
                    "p-1",
                    "e-1",
                    &body::<AuthDomainBindRequest>(r#"{"host":"x","siteDomainId":"x"}"#),
                ))
            },
            round_trip::<AuthDomainBinding>,
        ),
        row(
            "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/domain/admit",
            "/api/v1/admin/auth-projects/p-1/environments/e-1/domain/admit",
            |c| drop(c.custd.admit_auth_project_domain("p-1", "e-1")),
            round_trip::<AuthDomainBinding>,
        ),
        row(
            "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/domain/disable",
            "/api/v1/admin/auth-projects/p-1/environments/e-1/domain/disable",
            |c| drop(c.custd.disable_auth_project_domain("p-1", "e-1")),
            round_trip::<AuthDomainBinding>,
        ),
        row(
            "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/domain/mint",
            "/api/v1/admin/auth-projects/p-1/environments/e-1/domain/mint",
            |c| {
                drop(c.custd.mint_auth_project_domain(
                    "p-1",
                    "e-1",
                    &body::<AuthDomainMintRequest>(r#"{"siteDomainId":"x"}"#),
                ))
            },
            round_trip::<AuthDomainBinding>,
        ),
        row(
            "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/domain/release",
            "/api/v1/admin/auth-projects/p-1/environments/e-1/domain/release",
            |c| drop(c.custd.release_auth_project_domain("p-1", "e-1")),
            round_trip::<AuthDomainBinding>,
        ),
        row(
            "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/domain/retry",
            "/api/v1/admin/auth-projects/p-1/environments/e-1/domain/retry",
            |c| drop(c.custd.retry_auth_project_domain("p-1", "e-1")),
            round_trip::<AuthDomainBinding>,
        ),
        row(
            "admin-api PUT /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/domain/image-override",
            "/api/v1/admin/auth-projects/p-1/environments/e-1/domain/image-override",
            |c| {
                drop(c.custd.set_auth_project_domain_image_override("p-1", "e-1", &body::<AuthDomainImageOverrideSetRequest>(r#"{"component":"x","expiresAt":"x","imageDigest":"x","incidentReference":"x"}"#)))
            },
            round_trip::<AuthDomainBinding>,
        ),
        row(
            "admin-api DELETE /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/domain/image-override",
            "/api/v1/admin/auth-projects/p-1/environments/e-1/domain/image-override",
            |c| {
                drop(
                    c.custd
                        .clear_auth_project_domain_image_override("p-1", "e-1"),
                )
            },
            round_trip::<AuthDomainBinding>,
        ),
        bodiless(
            "admin-api DELETE /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/brand/logo",
            "/api/v1/admin/auth-projects/p-1/environments/e-1/brand/logo",
            |c| drop(c.custd.clear_auth_project_brand_logo("p-1", "e-1")),
        ),
    ]
}
