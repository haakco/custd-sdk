use custd_sdk::{
    RetentionPoliciesEnvelope, RetentionPolicy, RetentionPolicyListResponse,
    RetentionPolicyUpsertRequest,
};

use super::{body, round_trip};
use crate::{Row, bodiless, row};

pub fn rows() -> Vec<Row> {
    vec![
        row(
            "admin-api GET /api/v1/admin/retention/policies",
            "/api/v1/admin/retention/policies",
            |c| drop(c.custd.list_retention_policies()),
            round_trip::<RetentionPolicyListResponse>,
        ),
        row(
            "admin-api GET /api/v1/admin/retention/policies/{tenantSlug}",
            "/api/v1/admin/retention/policies/t-1",
            |c| {
                drop(c.custd.get_retention_policy("t-1", &body::<RetentionPolicyUpsertRequest>(r#"{"legalHold":true,"maxAgeSeconds":1,"precedence":1,"retentionClass":"x","scope":"x"}"#)))
            },
            round_trip::<RetentionPoliciesEnvelope>,
        ),
        row(
            "admin-api PUT /api/v1/admin/retention/policies/{tenantSlug}",
            "/api/v1/admin/retention/policies/t-1",
            |c| {
                drop(c.custd.upsert_retention_policy("t-1", &body::<RetentionPolicyUpsertRequest>(r#"{"legalHold":true,"maxAgeSeconds":1,"precedence":1,"retentionClass":"x","scope":"x"}"#)))
            },
            round_trip::<RetentionPolicy>,
        ),
        bodiless(
            "admin-api DELETE /api/v1/admin/retention/policies/{tenantSlug}",
            "/api/v1/admin/retention/policies/t-1",
            |c| {
                drop(c.custd.delete_retention_policy("t-1", &body::<RetentionPolicyUpsertRequest>(r#"{"legalHold":true,"maxAgeSeconds":1,"precedence":1,"retentionClass":"x","scope":"x"}"#)))
            },
        ),
    ]
}
