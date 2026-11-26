//! Privacy (Admin API `/api/v1/admin/privacy`): consent, erasures, identifier mappings and rules.
//!
//! Request and response shapes follow the admin-api OpenAPI document.

use serde::{Deserialize, Serialize};

use crate::Result;
use crate::api_path::{NO_BODY, api_path};
use crate::client::CustdClient;
use crate::measurement::null_as_empty;
use crate::transport::{Method, percent_encode};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PrivacyConsentListResponse {
    pub company_slug: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub records: Vec<PrivacyConsentRecord>,
    pub subject_id: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PrivacyConsentRecord {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub expires_at: Option<String>,
    pub granted: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub granted_at: Option<String>,
    pub purpose: String,
    pub recorded_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub revoked_at: Option<String>,
    pub source: String,
    pub subject_id: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PrivacyConsentRecordRequest {
    pub company_slug: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub expires_at: Option<String>,
    pub granted: bool,
    pub purpose: String,
    pub source: String,
    pub subject_id: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PrivacyErasureListResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub requests: Vec<PrivacyErasureResponse>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PrivacyErasureResponse {
    pub affected_segment_count: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub archive_recompacted_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub created_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub failed_rewrite_count: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub force_requested_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub latest_failure_reason: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub latest_recompacted_at: Option<String>,
    pub matched_event_count: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub oldest_pending_rewrite_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub pending_rewrite_count: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub recompacted_rewrite_count: Option<i64>,
    pub redacted_event_count: i64,
    pub request_uuid: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub requested_by: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub rewrite_count: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub rewriting_rewrite_count: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub rewritten_rewrite_count: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub s3_propagation_lag_seconds: Option<i64>,
    pub selector_display: String,
    pub selector_type: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub sla_deadline_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub sla_state: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub source: Option<String>,
    pub status: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PrivacyErasureCreateRequest {
    pub company_slug: String,
    pub force_now: bool,
    pub reason: String,
    pub redaction_id: String,
    pub selector: PrivacyErasureSelector,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PrivacyErasureSelector {
    pub r#type: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub value: Option<String>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub values: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PrivacyIdentifierListResponse {
    pub company_slug: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub mappings: Vec<PrivacyIdentifierMapping>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PrivacyIdentifierMapping {
    pub created_at: String,
    pub identifier_id: String,
    pub internal_id_hash: String,
    pub internal_id_hash_prefix: String,
    pub salt_version: i64,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PrivacyIdentifierMapRequest {
    pub external_id: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PrivacyRulesResponse {
    pub apply_mode: String,
    pub company_slug: String,
    pub enabled: bool,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub rules: Vec<PrivacyRule>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PrivacyRule {
    pub action: String,
    pub enabled: bool,
    pub field_path: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub truncate_length: Option<i64>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PrivacyRulesReplaceRequest {
    pub apply_mode: String,
    pub company_slug: String,
    pub enabled: bool,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub rules: Vec<PrivacyRule>,
}

impl CustdClient {
    /// List a subject's consent records.
    pub fn list_privacy_consents(
        &self,
        subject_id: &str,
        company_slug: Option<&str>,
    ) -> Result<PrivacyConsentListResponse> {
        let path = api_path(
            "/api/v1/admin/privacy/consent".to_owned(),
            &[("subjectId", Some(subject_id.to_owned()))],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Record a consent grant or revocation.
    pub fn record_privacy_consent(
        &self,
        request: &PrivacyConsentRecordRequest,
    ) -> Result<PrivacyConsentRecord> {
        let path = api_path("/api/v1/admin/privacy/consent".to_owned(), &[], None);
        self.call(Method::Post, &path, Some(request))
    }

    /// Revoke a subject's consent for one purpose.
    pub fn revoke_privacy_consent(
        &self,
        subject_id: &str,
        purpose: &str,
        source: Option<&str>,
        company_slug: Option<&str>,
    ) -> Result<PrivacyConsentRecord> {
        let path = api_path(
            format!(
                "/api/v1/admin/privacy/consent/{}",
                percent_encode(subject_id)
            ),
            &[
                ("purpose", Some(purpose.to_owned())),
                ("source", source.map(str::to_owned)),
            ],
            company_slug,
        );
        self.call(Method::Delete, &path, NO_BODY)
    }

    /// List privacy erasure requests.
    pub fn list_privacy_erasures(
        &self,
        company_slug: Option<&str>,
    ) -> Result<PrivacyErasureListResponse> {
        let path = api_path(
            "/api/v1/admin/privacy/erasures".to_owned(),
            &[],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Create privacy erasure request.
    pub fn create_privacy_erasure(
        &self,
        request: &PrivacyErasureCreateRequest,
    ) -> Result<PrivacyErasureResponse> {
        let path = api_path("/api/v1/admin/privacy/erasures".to_owned(), &[], None);
        self.call(Method::Post, &path, Some(request))
    }

    /// Get privacy erasure request.
    pub fn get_privacy_erasure(
        &self,
        request_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<PrivacyErasureResponse> {
        let path = api_path(
            format!(
                "/api/v1/admin/privacy/erasures/{}",
                percent_encode(request_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// List a tenant's identifier mappings (truncated hash prefix only).
    pub fn list_privacy_identifier_mappings(
        &self,
        company_slug: &str,
    ) -> Result<PrivacyIdentifierListResponse> {
        let path = api_path(
            format!(
                "/api/v1/admin/privacy/identifiers/{}",
                percent_encode(company_slug)
            ),
            &[],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Hash an external identifier and store the mapping.
    pub fn map_privacy_identifier(
        &self,
        company_slug: &str,
        request: &PrivacyIdentifierMapRequest,
    ) -> Result<PrivacyIdentifierMapping> {
        let path = api_path(
            format!(
                "/api/v1/admin/privacy/identifiers/{}/map",
                percent_encode(company_slug)
            ),
            &[],
            None,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Get privacy rules.
    pub fn get_privacy_rules(&self, company_slug: Option<&str>) -> Result<PrivacyRulesResponse> {
        let path = api_path("/api/v1/admin/privacy/rules".to_owned(), &[], company_slug);
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Replace privacy rules.
    pub fn replace_privacy_rules(
        &self,
        request: &PrivacyRulesReplaceRequest,
    ) -> Result<PrivacyRulesResponse> {
        let path = api_path("/api/v1/admin/privacy/rules".to_owned(), &[], None);
        self.call(Method::Put, &path, Some(request))
    }
}
