//! Sites (Admin API): create, list, read, update, delete, rotate the write key and the public Site config.
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
pub struct SiteListResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub sites: Vec<Site>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Site {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub allowed_environments: Vec<String>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub allowed_origins: Vec<String>,
    pub company_slug: String,
    pub enabled: bool,
    pub environment: String,
    pub identity_mode: SiteIdentityMode,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub ingest_target: Option<SiteIngestTarget>,
    pub name: String,
    pub rate_limit_per_minute: i64,
    pub retention_days: i64,
    pub site_uuid: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteIngestTarget {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub resource_code: Option<String>,
    pub resource_uuid: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub scope_code: Option<String>,
    pub scope_uuid: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteCreateRequest {
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub allowed_environments: Vec<String>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub allowed_origins: Vec<String>,
    pub company_slug: String,
    pub environment: String,
    pub identity_mode: String,
    pub ingest_target: SiteIngestTarget,
    pub name: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub rate_limit_per_minute: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub retention_days: Option<i64>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteCreateResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub allowed_environments: Vec<String>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub allowed_origins: Vec<String>,
    pub company_slug: String,
    pub enabled: bool,
    pub environment: String,
    pub identity_mode: SiteIdentityMode,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub ingest_target: Option<SiteIngestTarget>,
    pub name: String,
    pub rate_limit_per_minute: i64,
    pub retention_days: i64,
    pub site_uuid: String,
    pub write_key: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteUpdateRequest {
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub allowed_environments: Vec<String>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub allowed_origins: Vec<String>,
    pub environment: String,
    pub identity_mode: SiteIdentityMode,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub ingest_target: Option<SiteIngestTarget>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteWriteKeyResponse {
    pub write_key: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteConfigResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub allowed_origins: Vec<String>,
    pub environment: String,
    pub identity_mode: SiteIdentityMode,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub page_view_schema_version: Option<String>,
    pub site_uuid: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SiteIdentityMode {
    #[serde(rename = "cookieless")]
    Cookieless,
    #[serde(rename = "extended")]
    Extended,
}

impl SiteIdentityMode {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Cookieless => "cookieless",
            Self::Extended => "extended",
        }
    }
}

impl CustdClient {
    /// List sites.
    pub fn list_sites(&self) -> Result<SiteListResponse> {
        let path = api_path("/api/v1/admin/sites".to_owned(), &[], None);
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Create a site.
    pub fn create_site(&self, request: &SiteCreateRequest) -> Result<SiteCreateResponse> {
        let path = api_path("/api/v1/admin/sites".to_owned(), &[], None);
        self.call(Method::Post, &path, Some(request))
    }

    /// Get a site.
    pub fn get_site(&self, site_uuid: &str) -> Result<Site> {
        let path = api_path(
            format!("/api/v1/admin/sites/{}", percent_encode(site_uuid)),
            &[],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Update site config.
    pub fn update_site(&self, site_uuid: &str, request: &SiteUpdateRequest) -> Result<Site> {
        let path = api_path(
            format!("/api/v1/admin/sites/{}", percent_encode(site_uuid)),
            &[],
            None,
        );
        self.call(Method::Patch, &path, Some(request))
    }

    /// Delete a site.
    pub fn delete_site(&self, site_uuid: &str) -> Result<()> {
        let path = api_path(
            format!("/api/v1/admin/sites/{}", percent_encode(site_uuid)),
            &[],
            None,
        );
        self.call(Method::Delete, &path, NO_BODY)
    }

    /// Rotate site write key.
    pub fn rotate_site_write_key(&self, site_uuid: &str) -> Result<SiteWriteKeyResponse> {
        let path = api_path(
            format!(
                "/api/v1/admin/sites/{}/rotate-write-key",
                percent_encode(site_uuid)
            ),
            &[],
            None,
        );
        self.call(Method::Post, &path, NO_BODY)
    }
}
