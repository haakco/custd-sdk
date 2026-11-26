//! The tenant desired-state manifest (Admin API `/api/v1/admin/tenant-manifest`).
//!
//! Request and response shapes follow the admin-api OpenAPI document.

use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::Result;
use crate::api_path::{NO_BODY, api_path};
use crate::client::{CustdClient, IDEMPOTENCY_KEY};
use crate::event_types::RollupDimensionProfile;
use crate::measurement::null_as_empty;
use crate::privacy::PrivacyRule;
use crate::reporting_packs::ReportingPack;
use crate::transport::{Method, percent_encode};

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TenantManifest {
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub event_type_configs: Vec<EventTypeConfigDesired>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub oauth_clients: Vec<OAuthClientDesired>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub privacy: Option<PrivacyDesired>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub reporting_packs: Vec<ReportingPackDesired>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub retention: Option<RetentionDesired>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub schemas: Vec<SchemaDesired>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TenantManifestApplyResponse {
    pub manifest_digest: String,
    pub observed_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub operation: Option<TenantManifestOperationStatus>,
    pub ready: bool,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub resources: Vec<TenantManifestResourceStatus>,
    pub safe_next_action: String,
    pub safe_next_action_code: String,
    pub state: String,
    pub tenant_slug: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EventTypeConfigDesired {
    pub event_type_slug: String,
    pub rollup_dimensions: RollupDimensionProfile,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OAuthClientDesired {
    pub client_id: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub environment: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    pub purpose_profile: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PrivacyDesired {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub apply_mode: Option<String>,
    pub enabled: bool,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub rules: Vec<PrivacyRule>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPackDesired {
    pub definition: ReportingPack,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub expected_revision: Option<i64>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RetentionDesired {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub classes: Vec<String>,
    pub max_age_days: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SchemaDesired {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub dialect: Option<String>,
    pub enabled: bool,
    pub event_type_slug: String,
    pub schema_json: Value,
    pub version: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TenantManifestOperationStatus {
    pub attempt_count: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub completed_at: Option<String>,
    pub created_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub error_code: Option<String>,
    pub idempotency_key: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub lease_expires_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub pending: Option<TenantManifestOperationPendingStatus>,
    pub state: String,
    pub updated_at: String,
    pub uuid: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TenantManifestResourceStatus {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub detail: Option<String>,
    pub key: String,
    pub kind: String,
    pub ready: bool,
    pub safe_next_action: String,
    pub safe_next_action_code: String,
    pub state: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TenantManifestOperationPendingStatus {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_failure: Option<TenantManifestOperationRetryFailure>,
    pub next_attempt_at: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TenantManifestOperationRetryFailure {
    pub code: String,
    pub observed_at: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub resources: Vec<TenantManifestResourceStatus>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TenantManifestReadiness {
    pub manifest_digest: String,
    pub observed_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub operation: Option<TenantManifestOperationStatus>,
    pub ready: bool,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub resources: Vec<TenantManifestResourceStatus>,
    pub safe_next_action: String,
    pub safe_next_action_code: String,
    pub state: String,
    pub tenant_slug: String,
}

impl CustdClient {
    /// Apply tenant desired state.
    pub fn apply_tenant_manifest(
        &self,
        tenant_slug: &str,
        request: &TenantManifest,
        idempotency_key: &str,
    ) -> Result<TenantManifestApplyResponse> {
        let path = api_path(
            format!(
                "/api/v1/admin/tenant-manifest/{}",
                percent_encode(tenant_slug)
            ),
            &[],
            None,
        );
        self.call_with_headers(
            Method::Put,
            &path,
            &[(IDEMPOTENCY_KEY, idempotency_key)],
            Some(request),
        )
    }

    /// Read tenant desired-state readiness.
    pub fn get_tenant_manifest_readiness(
        &self,
        tenant_slug: &str,
    ) -> Result<TenantManifestReadiness> {
        let path = api_path(
            format!(
                "/api/v1/admin/tenant-manifest/{}/readiness",
                percent_encode(tenant_slug)
            ),
            &[],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }
}
