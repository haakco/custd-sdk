//! Producer provisioning (Admin API): OAuth producer clients, their environment and secret rotation.
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
pub struct ProducerProvisionListResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub producers: Vec<ProducerProvisionPublicClient>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProducerProvisionPublicClient {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub allowed_environments: Vec<String>,
    pub client_id: String,
    pub company_slug: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub display_name: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub environment: Option<String>,
    pub producer_slug: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub scopes: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProducerProvisionRequest {
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub allowed_environments: Vec<String>,
    pub company_slug: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub display_name: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub environment: Option<String>,
    pub producer_slug: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub scope_template: Option<String>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub scopes: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProducerProvisionResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub allowed_environments: Vec<String>,
    pub audience: String,
    pub base_url: String,
    pub client_id: String,
    pub client_secret: String,
    pub company_slug: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub environment: Option<String>,
    pub producer_slug: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub scopes: Vec<String>,
    pub token_url: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProducerEnvironmentUpdateRequest {
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub allowed_environments: Vec<String>,
    pub environment: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProducerSecretRotationResponse {
    pub audience: String,
    pub base_url: String,
    pub client_id: String,
    pub client_secret: String,
    pub token_url: String,
}

/// Replaces a signing producer's Ed25519 public keys: one or two base64 keys, two while rotating.
#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProducerSigningKeysUpdateRequest {
    pub public_keys: Vec<String>,
}

/// The public keys Custd now verifies a producer's signed events with.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProducerSigningKeysResponse {
    pub client_id: String,
    pub company_slug: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub public_keys: Vec<String>,
    /// The keys' sha256 fingerprints, `sha256:<hex>`, in `public_keys` order.
    #[serde(default, deserialize_with = "null_as_empty")]
    pub key_fingerprints: Vec<String>,
}

impl CustdClient {
    /// List producers.
    pub fn list_producers(
        &self,
        company_slug: Option<&str>,
    ) -> Result<ProducerProvisionListResponse> {
        let path = api_path(
            "/api/v1/producer-provisioning".to_owned(),
            &[],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Create a producer.
    pub fn create_producer(
        &self,
        request: &ProducerProvisionRequest,
    ) -> Result<ProducerProvisionResponse> {
        let path = api_path("/api/v1/producer-provisioning".to_owned(), &[], None);
        self.call(Method::Post, &path, Some(request))
    }

    /// Get a producer.
    pub fn get_producer(&self, client_id: &str) -> Result<ProducerProvisionPublicClient> {
        let path = api_path(
            format!(
                "/api/v1/producer-provisioning/{}",
                percent_encode(client_id)
            ),
            &[],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Revoke a producer.
    pub fn revoke_producer(&self, client_id: &str) -> Result<()> {
        let path = api_path(
            format!(
                "/api/v1/producer-provisioning/{}",
                percent_encode(client_id)
            ),
            &[],
            None,
        );
        self.call(Method::Delete, &path, NO_BODY)
    }

    /// Update a producer source environment.
    pub fn update_producer_environment(
        &self,
        client_id: &str,
        request: &ProducerEnvironmentUpdateRequest,
    ) -> Result<ProducerProvisionPublicClient> {
        let path = api_path(
            format!(
                "/api/v1/producer-provisioning/{}/environment",
                percent_encode(client_id)
            ),
            &[],
            None,
        );
        self.call(Method::Patch, &path, Some(request))
    }

    /// Rotate producer secret.
    pub fn rotate_producer_secret(
        &self,
        client_id: &str,
    ) -> Result<ProducerSecretRotationResponse> {
        let path = api_path(
            format!(
                "/api/v1/producer-provisioning/{}/rotate-secret",
                percent_encode(client_id)
            ),
            &[],
            None,
        );
        self.call(Method::Post, &path, NO_BODY)
    }

    /// Replace the public keys a hosting-email-delivery producer's events are verified with.
    pub fn set_producer_signing_keys(
        &self,
        client_id: &str,
        request: &ProducerSigningKeysUpdateRequest,
    ) -> Result<ProducerSigningKeysResponse> {
        let path = api_path(
            format!(
                "/api/v1/producer-provisioning/{}/signing-keys",
                percent_encode(client_id)
            ),
            &[],
            None,
        );
        self.call(Method::Put, &path, Some(request))
    }

    /// Read the public keys, and their fingerprints, a signing producer's events are verified with.
    pub fn get_producer_signing_keys(
        &self,
        client_id: &str,
    ) -> Result<ProducerSigningKeysResponse> {
        let path = api_path(
            format!(
                "/api/v1/producer-provisioning/{}/signing-keys",
                percent_encode(client_id)
            ),
            &[],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }
}
