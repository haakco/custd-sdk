//! OAuth clients and client admissions (Admin API `/api/v1/admin/oauth-clients` and
//! `/oauth-client-admissions`).
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
pub struct OAuthClientListResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub clients: Vec<OAuthClient>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OAuthClient {
    pub client_id: String,
    pub company_slug: String,
    /// When the client was created; an override saved for an earlier client of the same ID does
    /// not apply to it.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub created_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub environment: Option<String>,
    pub profile: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub purpose_profile: Option<String>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub scopes: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OAuthClientCreateRequest {
    pub client_id: String,
    pub company_slug: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub environment: Option<String>,
    pub profile: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub purpose_profile: Option<String>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub scopes: Vec<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub site_uuid: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OAuthClientCreateResponse {
    pub client_id: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub client_secret: Option<String>,
    pub company_slug: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub login_setup: Option<OAuthClientLoginSetup>,
    pub profile: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub purpose_profile: Option<String>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub scopes: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OAuthClientLoginSetup {
    pub api_url: String,
    pub audience: String,
    pub client_id: String,
    pub config_init_command: String,
    pub issuer_url: String,
    pub profile_name: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub redirect_uris: Vec<String>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub scopes: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OAuthClientSecretResponse {
    pub client_secret: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OAuthClientUpdateScopesRequest {
    pub company_slug: String,
    pub profile: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub scopes: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OAuthClientAdmissionListResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub admissions: Vec<OAuthClientAdmission>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OAuthClientAdmission {
    pub admission_uuid: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub approved_at: Option<String>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub approved_grants: Vec<OAuthClientAdmissionGrant>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub approved_security_revision: Option<String>,
    pub client_id: String,
    pub company_uuid: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub requested_grants: Vec<OAuthClientAdmissionGrant>,
    pub requested_security_revision: String,
    pub revision: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub revoked_at: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OAuthClientAdmissionGrant {
    pub resource_uri: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub scopes: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OAuthClientAdmissionReviewRequest {
    pub company_slug: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OAuthClientAdmissionReviewResponse {
    pub admission: OAuthClientAdmission,
    pub metadata: OAuthClientAdmissionMetadata,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OAuthClientAdmissionMetadata {
    pub client_name: String,
    pub expires_at: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub redirect_uris: Vec<String>,
    pub security_revision: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OAuthClientAdmissionApproveRequest {
    pub client_id: String,
    pub company_slug: String,
    pub expected_revision: i64,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub grants: Vec<OAuthClientAdmissionGrant>,
    pub security_revision: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OAuthClientAdmissionMutationResponse {
    pub admission: OAuthClientAdmission,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OAuthClientAdmissionRevokeRequest {
    pub company_slug: String,
    pub expected_revision: i64,
}

impl CustdClient {
    /// List visible OAuth clients.
    pub fn list_oauth_clients(&self) -> Result<OAuthClientListResponse> {
        let path = api_path("/api/v1/admin/oauth-clients".to_owned(), &[], None);
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Create an OAuth client.
    pub fn create_oauth_client(
        &self,
        request: &OAuthClientCreateRequest,
        idempotency_key: &str,
    ) -> Result<OAuthClientCreateResponse> {
        let path = api_path("/api/v1/admin/oauth-clients".to_owned(), &[], None);
        self.call_with_headers(
            Method::Post,
            &path,
            &[(IDEMPOTENCY_KEY, idempotency_key)],
            Some(request),
        )
    }

    /// Get an OAuth client.
    pub fn get_oauth_client(&self, client_id: &str) -> Result<OAuthClient> {
        let path = api_path(
            format!("/api/v1/admin/oauth-clients/{}", percent_encode(client_id)),
            &[],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Delete an OAuth client.
    pub fn delete_oauth_client(&self, client_id: &str) -> Result<()> {
        let path = api_path(
            format!("/api/v1/admin/oauth-clients/{}", percent_encode(client_id)),
            &[],
            None,
        );
        self.call(Method::Delete, &path, NO_BODY)
    }

    /// Rotate an OAuth client secret.
    pub fn rotate_oauth_client_secret(
        &self,
        client_id: &str,
        idempotency_key: &str,
    ) -> Result<OAuthClientSecretResponse> {
        let path = api_path(
            format!(
                "/api/v1/admin/oauth-clients/{}/rotate-secret",
                percent_encode(client_id)
            ),
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

    /// Replace an OAuth client secret after unknown delivery.
    pub fn replace_unknown_oauth_client_secret(
        &self,
        client_id: &str,
        idempotency_key: &str,
    ) -> Result<OAuthClientSecretResponse> {
        let path = api_path(
            format!(
                "/api/v1/admin/oauth-clients/{}/replace-unknown-secret",
                percent_encode(client_id)
            ),
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

    /// Update OAuth client scopes.
    pub fn update_oauth_client_scopes(
        &self,
        client_id: &str,
        request: &OAuthClientUpdateScopesRequest,
    ) -> Result<OAuthClient> {
        let path = api_path(
            format!(
                "/api/v1/admin/oauth-clients/{}/scopes",
                percent_encode(client_id)
            ),
            &[],
            None,
        );
        self.call(Method::Patch, &path, Some(request))
    }

    /// List external application admissions.
    pub fn list_oauth_client_admissions(
        &self,
        company_slug: &str,
    ) -> Result<OAuthClientAdmissionListResponse> {
        let path = api_path(
            "/api/v1/admin/oauth-client-admissions".to_owned(),
            &[],
            Some(company_slug),
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Review external application access.
    pub fn review_oauth_client_admission(
        &self,
        admission_uuid: &str,
        request: &OAuthClientAdmissionReviewRequest,
    ) -> Result<OAuthClientAdmissionReviewResponse> {
        let path = api_path(
            format!(
                "/api/v1/admin/oauth-client-admissions/{}/review",
                percent_encode(admission_uuid)
            ),
            &[],
            None,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Approve reviewed external application access.
    pub fn approve_oauth_client_admission(
        &self,
        admission_uuid: &str,
        request: &OAuthClientAdmissionApproveRequest,
    ) -> Result<OAuthClientAdmissionMutationResponse> {
        let path = api_path(
            format!(
                "/api/v1/admin/oauth-client-admissions/{}/approve",
                percent_encode(admission_uuid)
            ),
            &[],
            None,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Revoke external application access.
    pub fn revoke_oauth_client_admission(
        &self,
        admission_uuid: &str,
        request: &OAuthClientAdmissionRevokeRequest,
    ) -> Result<OAuthClientAdmissionMutationResponse> {
        let path = api_path(
            format!(
                "/api/v1/admin/oauth-client-admissions/{}/revoke",
                percent_encode(admission_uuid)
            ),
            &[],
            None,
        );
        self.call(Method::Post, &path, Some(request))
    }
}
