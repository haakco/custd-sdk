//! An auth environment's hosted app releases (Admin API): create, upload files, verify, promote and list.
//!
//! Request and response shapes follow the admin-api OpenAPI document.

use serde::{Deserialize, Serialize};

use crate::Result;
use crate::admin_apps::AppReleaseSummary;
use crate::api_path::{NO_BODY, api_path};
use crate::client::CustdClient;
use crate::measurement::null_as_empty;
use crate::transport::{Method, percent_encode};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectAppReleaseList {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub releases: Vec<AppReleaseSummary>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectAppCreateReleaseRequest {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub files: Vec<AuthProjectAppReleaseFile>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub label: Option<String>,
    pub routing: AuthProjectAppRoutingRules,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectAppRelease {
    pub active: bool,
    pub created_at: String,
    pub file_count: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub label: Option<String>,
    pub manifest: AuthProjectAppReleaseManifest,
    pub release_id: String,
    pub state: String,
    pub total_bytes: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub verified_at: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectAppReleaseFile {
    pub content_type: String,
    pub path: String,
    pub sha256: String,
    pub size: i64,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectAppRoutingRules {
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub cache: Vec<AuthProjectAppCacheRule>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub headers: Vec<AuthProjectAppHeaderRule>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub index_file: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub not_found_page: Option<String>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub shareable_routes: Vec<AuthProjectAppShareableRoute>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub site_card: Option<AuthProjectAppSiteCard>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub spa_fallbacks: Vec<AuthProjectAppSPAFallback>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectAppReleaseManifest {
    pub created_at: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub files: Vec<AuthProjectAppReleaseFile>,
    pub release_id: String,
    pub routing: AuthProjectAppRoutingRules,
    pub version: i64,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectAppCacheRule {
    pub r#match: String,
    pub mode: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectAppHeaderRule {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub framing: Option<String>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub headers: Vec<AuthProjectAppResponseHeader>,
    pub route: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectAppShareableRoute {
    pub card_template: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub kind: String,
    pub route: String,
    pub title: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectAppSiteCard {
    pub card_template: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub title: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectAppSPAFallback {
    pub file: String,
    pub prefix: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectAppResponseHeader {
    pub name: String,
    pub value: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectAppUploadedFile {
    pub path: String,
    pub sha256: String,
    pub size: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectAppPromotion {
    pub host: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub previous_release_id: Option<String>,
    pub promoted_at: String,
    pub release_id: String,
}

impl CustdClient {
    /// List the environment's releases.
    pub fn list_auth_project_app_releases(
        &self,
        project_id: &str,
        environment_id: &str,
        limit: Option<i64>,
    ) -> Result<AuthProjectAppReleaseList> {
        let path = api_path(
            format!(
                "/api/v1/admin/auth-projects/{}/environments/{}/releases",
                percent_encode(project_id),
                percent_encode(environment_id)
            ),
            &[("limit", limit.map(|v| v.to_string()))],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Create a release from its file manifest.
    pub fn create_auth_project_app_release(
        &self,
        project_id: &str,
        environment_id: &str,
        request: &AuthProjectAppCreateReleaseRequest,
    ) -> Result<AuthProjectAppRelease> {
        let path = api_path(
            format!(
                "/api/v1/admin/auth-projects/{}/environments/{}/releases",
                percent_encode(project_id),
                percent_encode(environment_id)
            ),
            &[],
            None,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Verify a release's stored files.
    pub fn verify_auth_project_app_release(
        &self,
        project_id: &str,
        environment_id: &str,
        release_id: &str,
    ) -> Result<AuthProjectAppRelease> {
        let path = api_path(
            format!(
                "/api/v1/admin/auth-projects/{}/environments/{}/releases/{}/verify",
                percent_encode(project_id),
                percent_encode(environment_id),
                percent_encode(release_id)
            ),
            &[],
            None,
        );
        self.call(Method::Post, &path, NO_BODY)
    }

    /// Serve a verified release on the environment's host.
    pub fn promote_auth_project_app_release(
        &self,
        project_id: &str,
        environment_id: &str,
        release_id: &str,
    ) -> Result<AuthProjectAppPromotion> {
        let path = api_path(
            format!(
                "/api/v1/admin/auth-projects/{}/environments/{}/releases/{}/promote",
                percent_encode(project_id),
                percent_encode(environment_id),
                percent_encode(release_id)
            ),
            &[],
            None,
        );
        self.call(Method::Post, &path, NO_BODY)
    }
}
