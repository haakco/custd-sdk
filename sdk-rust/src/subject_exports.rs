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
    pub scope: SubjectExportResponseScope,
    pub state: SubjectExportResponseState,
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

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubjectExportCreateRequest {
    /// Stable key for retry-safe creation.
    pub idempotency_key: String,
    /// Tenant-scoped opaque subject identifier.
    pub opaque_subject_id: String,
    /// Export scope: access, portability, or both.
    pub scope: SubjectExportResponseScope,
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
    pub scope: SubjectExportResponseScope,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SubjectExportResponseScope {
    #[serde(rename = "access")]
    Access,
    #[serde(rename = "portability")]
    Portability,
    #[serde(rename = "both")]
    Both,
}

impl SubjectExportResponseScope {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Access => "access",
            Self::Portability => "portability",
            Self::Both => "both",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SubjectExportResponseState {
    #[serde(rename = "queued")]
    Queued,
    #[serde(rename = "running")]
    Running,
    #[serde(rename = "complete")]
    Complete,
    #[serde(rename = "failed")]
    Failed,
    #[serde(rename = "cancelled")]
    Cancelled,
    #[serde(rename = "expired")]
    Expired,
}

impl SubjectExportResponseState {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Queued => "queued",
            Self::Running => "running",
            Self::Complete => "complete",
            Self::Failed => "failed",
            Self::Cancelled => "cancelled",
            Self::Expired => "expired",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SubjectExportScope {
    #[serde(rename = "access")]
    Access,
    #[serde(rename = "portability")]
    Portability,
}

impl SubjectExportScope {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Access => "access",
            Self::Portability => "portability",
        }
    }
}

impl CustdClient {
    /// List subject exports.
    pub fn list_subject_exports(
        &self,
        limit: Option<i64>,
        company_slug: Option<&str>,
    ) -> Result<SubjectExportListResponse> {
        let path = api_path(
            "/api/v1/admin/subject-exports".to_owned(),
            &[("limit", limit.map(|v| v.to_string()))],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Queue a subject export.
    pub fn create_subject_export(
        &self,
        request: &SubjectExportCreateRequest,
        company_slug: Option<&str>,
    ) -> Result<SubjectExportResponse> {
        let path = api_path(
            "/api/v1/admin/subject-exports".to_owned(),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Get subject export status.
    pub fn get_subject_export(
        &self,
        request_id: &str,
        company_slug: Option<&str>,
    ) -> Result<SubjectExportResponse> {
        let path = api_path(
            format!(
                "/api/v1/admin/subject-exports/{}",
                percent_encode(request_id)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Cancel a subject export.
    pub fn cancel_subject_export(
        &self,
        request_id: &str,
        company_slug: Option<&str>,
    ) -> Result<SubjectExportResponse> {
        let path = api_path(
            format!(
                "/api/v1/admin/subject-exports/{}/cancel",
                percent_encode(request_id)
            ),
            &[],
            company_slug,
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
        scope: SubjectExportScope,
        company_slug: Option<&str>,
    ) -> Result<SubjectExportArtifactResponse> {
        let path = api_path(
            format!(
                "/api/v1/admin/subject-exports/{}/download",
                percent_encode(request_id)
            ),
            &[("scope", Some(scope.as_str().to_owned()))],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }
}
