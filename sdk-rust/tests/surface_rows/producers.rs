use custd_sdk::{
    ProducerEnvironmentUpdateRequest, ProducerProvisionListResponse, ProducerProvisionPublicClient,
    ProducerProvisionRequest, ProducerProvisionResponse, ProducerSecretRotationResponse,
    ProducerSigningKeysResponse, ProducerSigningKeysUpdateRequest,
};

use super::{body, round_trip};
use crate::{Row, bodiless, row};

pub fn rows() -> Vec<Row> {
    vec![
        row(
            "admin-api GET /api/v1/producer-provisioning",
            "/api/v1/producer-provisioning?companySlug=acme",
            |c| drop(c.custd.list_producers(Some("acme"))),
            round_trip::<ProducerProvisionListResponse>,
        ),
        row(
            "admin-api POST /api/v1/producer-provisioning",
            "/api/v1/producer-provisioning",
            |c| {
                drop(c.custd.create_producer(&body::<ProducerProvisionRequest>(
                    r#"{"companySlug":"x","producerSlug":"x"}"#,
                )))
            },
            round_trip::<ProducerProvisionResponse>,
        ),
        row(
            "admin-api GET /api/v1/producer-provisioning/{clientId}",
            "/api/v1/producer-provisioning/c-1",
            |c| drop(c.custd.get_producer("c-1")),
            round_trip::<ProducerProvisionPublicClient>,
        ),
        bodiless(
            "admin-api DELETE /api/v1/producer-provisioning/{clientId}",
            "/api/v1/producer-provisioning/c-1",
            |c| drop(c.custd.revoke_producer("c-1")),
        ),
        row(
            "admin-api PATCH /api/v1/producer-provisioning/{clientId}/environment",
            "/api/v1/producer-provisioning/c-1/environment",
            |c| {
                drop(c.custd.update_producer_environment(
                    "c-1",
                    &body::<ProducerEnvironmentUpdateRequest>(r#"{"environment":"x"}"#),
                ))
            },
            round_trip::<ProducerProvisionPublicClient>,
        ),
        row(
            "admin-api POST /api/v1/producer-provisioning/{clientId}/rotate-secret",
            "/api/v1/producer-provisioning/c-1/rotate-secret",
            |c| drop(c.custd.rotate_producer_secret("c-1")),
            round_trip::<ProducerSecretRotationResponse>,
        ),
        row(
            "admin-api PUT /api/v1/producer-provisioning/{clientId}/signing-keys",
            "/api/v1/producer-provisioning/c-1/signing-keys",
            |c| {
                drop(c.custd.set_producer_signing_keys(
                    "c-1",
                    &body::<ProducerSigningKeysUpdateRequest>(r#"{"publicKeys":["AAAA"]}"#),
                ))
            },
            round_trip::<ProducerSigningKeysResponse>,
        ),
    ]
}
