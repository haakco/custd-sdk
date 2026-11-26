use custd_sdk::{
    OAuthClient, OAuthClientAdmissionApproveRequest, OAuthClientAdmissionListResponse,
    OAuthClientAdmissionMutationResponse, OAuthClientAdmissionReviewRequest,
    OAuthClientAdmissionReviewResponse, OAuthClientAdmissionRevokeRequest,
    OAuthClientCreateRequest, OAuthClientCreateResponse, OAuthClientListResponse,
    OAuthClientSecretResponse, OAuthClientUpdateScopesRequest,
};

use super::{body, round_trip};
use crate::{Row, bodiless, row};

pub fn rows() -> Vec<Row> {
    vec![
        row(
            "admin-api GET /api/v1/admin/oauth-clients",
            "/api/v1/admin/oauth-clients",
            |c| drop(c.custd.list_oauth_clients()),
            round_trip::<OAuthClientListResponse>,
        ),
        row(
            "admin-api POST /api/v1/admin/oauth-clients",
            "/api/v1/admin/oauth-clients",
            |c| {
                drop(c.custd.create_oauth_client(
                    &body::<OAuthClientCreateRequest>(
                        r#"{"clientId":"x","companySlug":"x","profile":"x","scopes":[]}"#,
                    ),
                    "key-0001",
                ))
            },
            round_trip::<OAuthClientCreateResponse>,
        ),
        row(
            "admin-api GET /api/v1/admin/oauth-clients/{clientId}",
            "/api/v1/admin/oauth-clients/c-1",
            |c| drop(c.custd.get_oauth_client("c-1")),
            round_trip::<OAuthClient>,
        ),
        bodiless(
            "admin-api DELETE /api/v1/admin/oauth-clients/{clientId}",
            "/api/v1/admin/oauth-clients/c-1",
            |c| drop(c.custd.delete_oauth_client("c-1")),
        ),
        row(
            "admin-api POST /api/v1/admin/oauth-clients/{clientId}/rotate-secret",
            "/api/v1/admin/oauth-clients/c-1/rotate-secret",
            |c| drop(c.custd.rotate_oauth_client_secret("c-1", "key-0001")),
            round_trip::<OAuthClientSecretResponse>,
        ),
        row(
            "admin-api POST /api/v1/admin/oauth-clients/{clientId}/replace-unknown-secret",
            "/api/v1/admin/oauth-clients/c-1/replace-unknown-secret",
            |c| {
                drop(
                    c.custd
                        .replace_unknown_oauth_client_secret("c-1", "key-0001"),
                )
            },
            round_trip::<OAuthClientSecretResponse>,
        ),
        row(
            "admin-api PATCH /api/v1/admin/oauth-clients/{clientId}/scopes",
            "/api/v1/admin/oauth-clients/c-1/scopes",
            |c| {
                drop(c.custd.update_oauth_client_scopes(
                    "c-1",
                    &body::<OAuthClientUpdateScopesRequest>(
                        r#"{"companySlug":"x","profile":"x","scopes":[]}"#,
                    ),
                ))
            },
            round_trip::<OAuthClient>,
        ),
        row(
            "admin-api GET /api/v1/admin/oauth-client-admissions",
            "/api/v1/admin/oauth-client-admissions?companySlug=acme",
            |c| drop(c.custd.list_oauth_client_admissions("acme")),
            round_trip::<OAuthClientAdmissionListResponse>,
        ),
        row(
            "admin-api POST /api/v1/admin/oauth-client-admissions/{admissionUuid}/review",
            "/api/v1/admin/oauth-client-admissions/a-1/review",
            |c| {
                drop(c.custd.review_oauth_client_admission(
                    "a-1",
                    &body::<OAuthClientAdmissionReviewRequest>(r#"{"companySlug":"x"}"#),
                ))
            },
            round_trip::<OAuthClientAdmissionReviewResponse>,
        ),
        row(
            "admin-api POST /api/v1/admin/oauth-client-admissions/{admissionUuid}/approve",
            "/api/v1/admin/oauth-client-admissions/a-1/approve",
            |c| {
                drop(c.custd.approve_oauth_client_admission("a-1", &body::<OAuthClientAdmissionApproveRequest>(r#"{"clientId":"x","companySlug":"x","expectedRevision":1,"grants":[],"securityRevision":"x"}"#)))
            },
            round_trip::<OAuthClientAdmissionMutationResponse>,
        ),
        row(
            "admin-api POST /api/v1/admin/oauth-client-admissions/{admissionUuid}/revoke",
            "/api/v1/admin/oauth-client-admissions/a-1/revoke",
            |c| {
                drop(c.custd.revoke_oauth_client_admission(
                    "a-1",
                    &body::<OAuthClientAdmissionRevokeRequest>(
                        r#"{"companySlug":"x","expectedRevision":1}"#,
                    ),
                ))
            },
            round_trip::<OAuthClientAdmissionMutationResponse>,
        ),
    ]
}
