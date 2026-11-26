//! Hosted applications (Admin API): create, read, pause, resume, repair, sign-in and deploy credentials.
//!
//! Request and response shapes follow the admin-api OpenAPI document.

use serde::{Deserialize, Serialize};

use crate::Result;
use crate::api_path::{NO_BODY, api_path};
use crate::client::{CustdClient, IDEMPOTENCY_KEY};
use crate::measurement::null_as_empty;
use crate::transport::{Method, percent_encode};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppListResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub apps: Vec<AppSummary>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub next_after: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSummary {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub active_release_id: Option<String>,
    pub app_id: String,
    pub environment_id: String,
    pub host: String,
    pub name: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub reason: Option<AppReason>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub serving_since: Option<String>,
    pub sign_in: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub site_uuid: Option<String>,
    pub slug: String,
    pub status: String,
    pub url: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppReason {
    pub code: String,
    pub message: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppOverview {
    pub app: AppSummary,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub latest_release: Option<AppReleaseSummary>,
    pub owner_links: i64,
    pub release_count: i64,
    pub share_links: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppReleaseSummary {
    pub active: bool,
    pub created_at: String,
    pub file_count: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub label: Option<String>,
    pub release_id: String,
    pub state: String,
    pub total_bytes: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub verified_at: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppCreateRequest {
    pub name: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub sign_in: Option<bool>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppCreation {
    pub app: AppSummary,
    pub replayed: bool,
    pub traffic_reporting: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSignInRequest {
    pub expected_revision: i64,
    pub mode: AppSignInRequestMode,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppDeployCredentialList {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub credentials: Vec<AppDeployCredentialSummary>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppDeployCredentialSummary {
    pub client_id: String,
    pub created_at: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppDeployCredential {
    pub app: String,
    pub client_id: String,
    pub client_secret: String,
    pub scope: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum AppSignInRequestMode {
    #[serde(rename = "off")]
    Off,
    #[serde(rename = "invite_only")]
    InviteOnly,
    #[serde(rename = "open")]
    Open,
}

impl AppSignInRequestMode {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Off => "off",
            Self::InviteOnly => "invite_only",
            Self::Open => "open",
        }
    }
}

impl CustdClient {
    /// List apps with one status each.
    pub fn list_apps(&self, after: Option<&str>) -> Result<AppListResponse> {
        let path = api_path(
            "/api/v1/admin/apps".to_owned(),
            &[("after", after.map(str::to_owned))],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Read one app.
    pub fn get_app(&self, slug: &str) -> Result<AppOverview> {
        let path = api_path(
            format!("/api/v1/admin/apps/{}", percent_encode(slug)),
            &[],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Create an app from its name.
    pub fn create_app(
        &self,
        request: &AppCreateRequest,
        idempotency_key: &str,
    ) -> Result<AppCreation> {
        let path = api_path("/api/v1/admin/apps".to_owned(), &[], None);
        self.call_with_headers(
            Method::Post,
            &path,
            &[(IDEMPOTENCY_KEY, idempotency_key)],
            Some(request),
        )
    }

    /// Pause an app.
    pub fn pause_app(&self, slug: &str, idempotency_key: &str) -> Result<AppSummary> {
        let path = api_path(
            format!("/api/v1/admin/apps/{}/pause", percent_encode(slug)),
            &[],
            None,
        );
        self.call_with_headers(
            Method::Post,
            &path,
            &[(IDEMPOTENCY_KEY, idempotency_key)],
            NO_BODY,
        )
    }

    /// Resume an app.
    pub fn resume_app(&self, slug: &str, idempotency_key: &str) -> Result<AppSummary> {
        let path = api_path(
            format!("/api/v1/admin/apps/{}/resume", percent_encode(slug)),
            &[],
            None,
        );
        self.call_with_headers(
            Method::Post,
            &path,
            &[(IDEMPOTENCY_KEY, idempotency_key)],
            NO_BODY,
        )
    }

    /// Repair an app's setup.
    pub fn repair_app(&self, slug: &str, idempotency_key: &str) -> Result<AppSummary> {
        let path = api_path(
            format!("/api/v1/admin/apps/{}/repair", percent_encode(slug)),
            &[],
            None,
        );
        self.call_with_headers(
            Method::Post,
            &path,
            &[(IDEMPOTENCY_KEY, idempotency_key)],
            NO_BODY,
        )
    }

    /// Set an app's sign-in mode.
    pub fn set_app_sign_in(
        &self,
        slug: &str,
        request: &AppSignInRequest,
        idempotency_key: &str,
    ) -> Result<AppSummary> {
        let path = api_path(
            format!("/api/v1/admin/apps/{}/sign-in", percent_encode(slug)),
            &[],
            None,
        );
        self.call_with_headers(
            Method::Post,
            &path,
            &[(IDEMPOTENCY_KEY, idempotency_key)],
            Some(request),
        )
    }

    /// List an app's CI deploy credentials.
    pub fn list_app_deploy_credentials(&self, slug: &str) -> Result<AppDeployCredentialList> {
        let path = api_path(
            format!(
                "/api/v1/admin/apps/{}/deploy-credentials",
                percent_encode(slug)
            ),
            &[],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Create a CI deploy credential for an app.
    pub fn create_app_deploy_credential(&self, slug: &str) -> Result<AppDeployCredential> {
        let path = api_path(
            format!(
                "/api/v1/admin/apps/{}/deploy-credentials",
                percent_encode(slug)
            ),
            &[],
            None,
        );
        self.call(Method::Post, &path, NO_BODY)
    }

    /// Delete an app's CI deploy credential.
    pub fn delete_app_deploy_credential(&self, slug: &str, client_id: &str) -> Result<()> {
        let path = api_path(
            format!(
                "/api/v1/admin/apps/{}/deploy-credentials/{}",
                percent_encode(slug),
                percent_encode(client_id)
            ),
            &[],
            None,
        );
        self.call(Method::Delete, &path, NO_BODY)
    }
}
