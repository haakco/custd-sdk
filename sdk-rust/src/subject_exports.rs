//! Data subject exports (Admin API `/api/v1/admin/subject-exports`).
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
pub struct SubjectExportListResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub requests: Vec<SubjectExportResponse>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubjectExportResponse {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub completed_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
    pub expires_at: String,
    pub id: String,
    pub idempotency_key: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_action_safe_next: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_progress_at: Option<String>,
    pub opaque_subject_id: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub per_store_progress: Vec<SubjectExportStoreProgress>,
    pub requested_at: String,
    pub scope: String,
    pub state: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubjectExportStoreProgress {
    pub deleted_count: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_completed_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_error: Option<String>,
    pub retained_exceptions: i64,
    pub store: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubjectExportCreateRequest {
    /// Stable key for retry-safe creation.
    #[serde(rename = "idempotency_key")]
    pub idempotency_key: String,
    /// Tenant-scoped opaque subject identifier.
    #[serde(rename = "opaque_subject_id")]
    pub opaque_subject_id: String,
    /// Export scope: access, portability, or both.
    pub scope: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubjectExportArtifactResponse {
    pub byte_size: i64,
    pub checksum_sha256: String,
    pub encryption_key_id: String,
    pub expires_at: String,
    pub generated_at: String,
    pub id: String,
    pub object_key: String,
    pub record_count: i64,
    pub request_id: String,
    pub s3_key: String,
    pub scope: String,
}

impl CustdClient {
    /// List subject exports.
    pub fn list_subject_exports(&self, limit: Option<i64>) -> Result<SubjectExportListResponse> {
        let path = api_path(
            "/api/v1/admin/subject-exports".to_owned(),
            &[("limit", limit.map(|v| v.to_string()))],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Queue a subject export.
    pub fn create_subject_export(
        &self,
        request: &SubjectExportCreateRequest,
    ) -> Result<SubjectExportResponse> {
        let path = api_path("/api/v1/admin/subject-exports".to_owned(), &[], None);
        self.call(Method::Post, &path, Some(request))
    }

    /// Get subject export status.
    pub fn get_subject_export(&self, request_id: &str) -> Result<SubjectExportResponse> {
        let path = api_path(
            format!(
                "/api/v1/admin/subject-exports/{}",
                percent_encode(request_id)
            ),
            &[],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Cancel a subject export.
    pub fn cancel_subject_export(&self, request_id: &str) -> Result<SubjectExportResponse> {
        let path = api_path(
            format!(
                "/api/v1/admin/subject-exports/{}/cancel",
                percent_encode(request_id)
            ),
            &[],
            None,
        );
        self.call(Method::Post, &path, NO_BODY)
    }

    /// Force a queued subject export.
    pub fn force_subject_export(
        &self,
        request_id: &str,
        company_slug: &str,
    ) -> Result<SubjectExportResponse> {
        let path = api_path(
            format!(
                "/api/v1/admin/subject-exports/{}/force",
                percent_encode(request_id)
            ),
            &[],
            Some(company_slug),
        );
        self.call(Method::Post, &path, NO_BODY)
    }

    /// Download a completed subject export.
    pub fn download_subject_export(
        &self,
        request_id: &str,
        scope: &str,
    ) -> Result<SubjectExportArtifactResponse> {
        let path = api_path(
            format!(
                "/api/v1/admin/subject-exports/{}/download",
                percent_encode(request_id)
            ),
            &[("scope", Some(scope.to_owned()))],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }
}
