//! An auth environment's sign-in domain and brand logo (Admin API).
//!
//! Request and response shapes follow the admin-api OpenAPI document.

use serde::{Deserialize, Serialize};

use crate::Result;
use crate::api_path::{NO_BODY, api_path};
use crate::client::CustdClient;
use crate::transport::{Method, percent_encode};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthDomainBinding {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub certificate_expires_at: Option<String>,
    pub created_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub dns_proof: Option<AuthDomainDNSProof>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub dns_target: Option<String>,
    pub environment_id: String,
    pub host: String,
    pub images: AuthDomainImages,
    pub intent_revision: i64,
    pub issuer: String,
    pub lifecycle: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub observed_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub site_domain_id: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub slot_ref: Option<String>,
    pub status: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthDomainDNSProof {
    pub record_name: String,
    pub record_value: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthDomainImages {
    pub convergence: String,
    pub expected: AuthDomainImageSet,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub r#override: Option<AuthDomainImageOverrideStatus>,
    pub running: AuthDomainImageSet,
    pub source: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthDomainImageSet {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub gateway: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub hydra: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthDomainImageOverrideStatus {
    pub actor_kind: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub actor_subject: Option<String>,
    pub component: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub ended_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub ended_by: Option<String>,
    pub expires_at: String,
    pub image_digest: String,
    pub incident_reference: String,
    pub receipt_id: String,
    pub set_at: String,
    pub state: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthDomainBindRequest {
    pub host: String,
    pub site_domain_id: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthDomainMintRequest {
    pub site_domain_id: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthDomainImageOverrideSetRequest {
    pub component: String,
    pub expires_at: String,
    pub image_digest: String,
    pub incident_reference: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectBrandLogo {
    pub byte_size: i64,
    pub content_type: String,
    pub height: i64,
    pub updated_at: String,
    pub width: i64,
}

impl CustdClient {
    /// Read the environment's authentication domain.
    pub fn get_auth_project_domain(
        &self,
        project_id: &str,
        environment_id: &str,
    ) -> Result<AuthDomainBinding> {
        let path = api_path(
            format!(
                "/api/v1/admin/auth-projects/{}/environments/{}/domain",
                percent_encode(project_id),
                percent_encode(environment_id)
            ),
            &[],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Reserve a verified hostname for the environment.
    pub fn bind_auth_project_domain(
        &self,
        project_id: &str,
        environment_id: &str,
        request: &AuthDomainBindRequest,
    ) -> Result<AuthDomainBinding> {
        let path = api_path(
            format!(
                "/api/v1/admin/auth-projects/{}/environments/{}/domain",
                percent_encode(project_id),
                percent_encode(environment_id)
            ),
            &[],
            None,
        );
        self.call(Method::Put, &path, Some(request))
    }

    /// Admit the environment's reserved realm into installed capacity.
    pub fn admit_auth_project_domain(
        &self,
        project_id: &str,
        environment_id: &str,
    ) -> Result<AuthDomainBinding> {
        let path = api_path(
            format!(
                "/api/v1/admin/auth-projects/{}/environments/{}/domain/admit",
                percent_encode(project_id),
                percent_encode(environment_id)
            ),
            &[],
            None,
        );
        self.call(Method::Post, &path, NO_BODY)
    }

    /// Disable the authentication domain.
    pub fn disable_auth_project_domain(
        &self,
        project_id: &str,
        environment_id: &str,
    ) -> Result<AuthDomainBinding> {
        let path = api_path(
            format!(
                "/api/v1/admin/auth-projects/{}/environments/{}/domain/disable",
                percent_encode(project_id),
                percent_encode(environment_id)
            ),
            &[],
            None,
        );
        self.call(Method::Post, &path, NO_BODY)
    }

    /// Reserve a platform-generated issuer hostname for an installed environment.
    pub fn mint_auth_project_domain(
        &self,
        project_id: &str,
        environment_id: &str,
        request: &AuthDomainMintRequest,
    ) -> Result<AuthDomainBinding> {
        let path = api_path(
            format!(
                "/api/v1/admin/auth-projects/{}/environments/{}/domain/mint",
                percent_encode(project_id),
                percent_encode(environment_id)
            ),
            &[],
            None,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Release the authentication domain.
    pub fn release_auth_project_domain(
        &self,
        project_id: &str,
        environment_id: &str,
    ) -> Result<AuthDomainBinding> {
        let path = api_path(
            format!(
                "/api/v1/admin/auth-projects/{}/environments/{}/domain/release",
                percent_encode(project_id),
                percent_encode(environment_id)
            ),
            &[],
            None,
        );
        self.call(Method::Post, &path, NO_BODY)
    }

    /// Retry authentication domain provisioning.
    pub fn retry_auth_project_domain(
        &self,
        project_id: &str,
        environment_id: &str,
    ) -> Result<AuthDomainBinding> {
        let path = api_path(
            format!(
                "/api/v1/admin/auth-projects/{}/environments/{}/domain/retry",
                percent_encode(project_id),
                percent_encode(environment_id)
            ),
            &[],
            None,
        );
        self.call(Method::Post, &path, NO_BODY)
    }

    /// Pin one realm component to an exact incident image identity.
    pub fn set_auth_project_domain_image_override(
        &self,
        project_id: &str,
        environment_id: &str,
        request: &AuthDomainImageOverrideSetRequest,
    ) -> Result<AuthDomainBinding> {
        let path = api_path(
            format!(
                "/api/v1/admin/auth-projects/{}/environments/{}/domain/image-override",
                percent_encode(project_id),
                percent_encode(environment_id)
            ),
            &[],
            None,
        );
        self.call(Method::Put, &path, Some(request))
    }

    /// End the realm's incident image override.
    pub fn clear_auth_project_domain_image_override(
        &self,
        project_id: &str,
        environment_id: &str,
    ) -> Result<AuthDomainBinding> {
        let path = api_path(
            format!(
                "/api/v1/admin/auth-projects/{}/environments/{}/domain/image-override",
                percent_encode(project_id),
                percent_encode(environment_id)
            ),
            &[],
            None,
        );
        self.call(Method::Delete, &path, NO_BODY)
    }

    /// Remove the realm's brand logo.
    pub fn clear_auth_project_brand_logo(
        &self,
        project_id: &str,
        environment_id: &str,
    ) -> Result<()> {
        let path = api_path(
            format!(
                "/api/v1/admin/auth-projects/{}/environments/{}/brand/logo",
                percent_encode(project_id),
                percent_encode(environment_id)
            ),
            &[],
            None,
        );
        self.call(Method::Delete, &path, NO_BODY)
    }
}
