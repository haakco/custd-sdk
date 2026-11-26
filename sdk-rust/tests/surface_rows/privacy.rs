use custd_sdk::{
    PrivacyConsentListResponse, PrivacyConsentRecord, PrivacyConsentRecordRequest,
    PrivacyErasureCreateRequest, PrivacyErasureListResponse, PrivacyErasureResponse,
    PrivacyIdentifierListResponse, PrivacyIdentifierMapRequest, PrivacyIdentifierMapping,
    PrivacyRulesReplaceRequest, PrivacyRulesResponse,
};

use super::{body, round_trip};
use crate::{Row, row};

pub fn rows() -> Vec<Row> {
    vec![
        row(
            "admin-api GET /api/v1/admin/privacy/consent",
            "/api/v1/admin/privacy/consent?subjectId=s-1&companySlug=acme",
            |c| drop(c.custd.list_privacy_consents("s-1", Some("acme"))),
            round_trip::<PrivacyConsentListResponse>,
        ),
        row(
            "admin-api POST /api/v1/admin/privacy/consent",
            "/api/v1/admin/privacy/consent",
            |c| {
                drop(c.custd.record_privacy_consent(&body::<PrivacyConsentRecordRequest>(r#"{"companySlug":"x","granted":true,"purpose":"analytics","source":"x","subjectId":"x"}"#)))
            },
            round_trip::<PrivacyConsentRecord>,
        ),
        row(
            "admin-api DELETE /api/v1/admin/privacy/consent/{subjectId}",
            "/api/v1/admin/privacy/consent/s-1?purpose=p-1&source=s-1&companySlug=acme",
            |c| {
                drop(
                    c.custd
                        .revoke_privacy_consent("s-1", "p-1", Some("s-1"), Some("acme")),
                )
            },
            round_trip::<PrivacyConsentRecord>,
        ),
        row(
            "admin-api GET /api/v1/admin/privacy/erasures",
            "/api/v1/admin/privacy/erasures?companySlug=acme",
            |c| drop(c.custd.list_privacy_erasures(Some("acme"))),
            round_trip::<PrivacyErasureListResponse>,
        ),
        row(
            "admin-api POST /api/v1/admin/privacy/erasures",
            "/api/v1/admin/privacy/erasures",
            |c| {
                drop(c.custd.create_privacy_erasure(&body::<PrivacyErasureCreateRequest>(r#"{"companySlug":"x","forceNow":true,"reason":"x","redactionId":"x","selector":{"type":"x"}}"#)))
            },
            round_trip::<PrivacyErasureResponse>,
        ),
        row(
            "admin-api GET /api/v1/admin/privacy/erasures/{requestUuid}",
            "/api/v1/admin/privacy/erasures/r-1?companySlug=acme",
            |c| drop(c.custd.get_privacy_erasure("r-1", Some("acme"))),
            round_trip::<PrivacyErasureResponse>,
        ),
        row(
            "admin-api GET /api/v1/admin/privacy/identifiers/{companySlug}",
            "/api/v1/admin/privacy/identifiers/c-1",
            |c| drop(c.custd.list_privacy_identifier_mappings("c-1")),
            round_trip::<PrivacyIdentifierListResponse>,
        ),
        row(
            "admin-api POST /api/v1/admin/privacy/identifiers/{companySlug}/map",
            "/api/v1/admin/privacy/identifiers/c-1/map",
            |c| {
                drop(c.custd.map_privacy_identifier(
                    "c-1",
                    &body::<PrivacyIdentifierMapRequest>(r#"{"externalId":"x"}"#),
                ))
            },
            round_trip::<PrivacyIdentifierMapping>,
        ),
        row(
            "admin-api GET /api/v1/admin/privacy/rules",
            "/api/v1/admin/privacy/rules?companySlug=acme",
            |c| drop(c.custd.get_privacy_rules(Some("acme"))),
            round_trip::<PrivacyRulesResponse>,
        ),
        row(
            "admin-api PUT /api/v1/admin/privacy/rules",
            "/api/v1/admin/privacy/rules",
            |c| {
                drop(
                    c.custd
                        .replace_privacy_rules(&body::<PrivacyRulesReplaceRequest>(
                            r#"{"applyMode":"x","companySlug":"x","enabled":true,"rules":[]}"#,
                        )),
                )
            },
            round_trip::<PrivacyRulesResponse>,
        ),
    ]
}
