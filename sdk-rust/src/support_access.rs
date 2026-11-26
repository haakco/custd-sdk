//! Support access grants (Admin API `/api/v1/admin/support-access`).
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
pub struct SupportAccessGrantListResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub grants: Vec<SupportAccessGrant>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SupportAccessGrant {
    pub company_slug: String,
    pub expires_at: String,
    pub operator_user_uuid: String,
    pub reason: String,
    #[serde(default)]
    pub revoked_at: Option<String>,
    pub starts_at: String,
    pub support_access_grant_uuid: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SupportAccessGrantCreateRequest {
    pub company_slug: String,
    pub expires_at: String,
    pub reason: String,
}

impl CustdClient {
    /// List support access grants.
    pub fn list_support_access_grants(
        &self,
        company_slug: Option<&str>,
    ) -> Result<SupportAccessGrantListResponse> {
        let path = api_path("/api/v1/admin/support-access".to_owned(), &[], company_slug);
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Create support access grant.
    pub fn create_support_access_grant(
        &self,
        request: &SupportAccessGrantCreateRequest,
    ) -> Result<SupportAccessGrant> {
        let path = api_path("/api/v1/admin/support-access".to_owned(), &[], None);
        self.call(Method::Post, &path, Some(request))
    }

    /// Revoke support access grant.
    pub fn revoke_support_access_grant(&self, support_access_grant_uuid: &str) -> Result<()> {
        let path = api_path(
            format!(
                "/api/v1/admin/support-access/{}/revoke",
                percent_encode(support_access_grant_uuid)
            ),
            &[],
            None,
        );
        self.call(Method::Post, &path, NO_BODY)
    }
}
