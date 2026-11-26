//! Tenants (Admin API `/api/v1/admin/tenants`): create, read, delete and finalize a tenant, its
//! storage limit and its data-space entitlement.
//!
//! Request and response shapes follow the admin-api OpenAPI document.

use serde::{Deserialize, Serialize};

use crate::Result;
use crate::api_path::{NO_BODY, api_path};
use crate::client::CustdClient;
use crate::data_spaces::DataSpaceEntitlementState;
use crate::measurement::null_as_empty;
use crate::transport::{Method, percent_encode};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TenantListResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub tenants: Vec<Tenant>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Tenant {
    pub auto_create_environments: bool,
    pub company_id: i64,
    pub company_name: String,
    pub company_uuid: String,
    pub enabled: bool,
    pub purpose: TenantPurpose,
    pub slug: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TenantCreateRequest {
    pub company_name: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub purpose: Option<TenantPurpose>,
    pub slug: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorageLimitUpdateRequest {
    pub hard_limit_enabled: bool,
    pub included_storage_bytes: i64,
    pub purchased_storage_bytes: i64,
    pub warn_percent: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorageLimit {
    pub hard_limit_enabled: bool,
    pub included_storage_bytes: i64,
    pub purchased_storage_bytes: i64,
    pub warn_percent: i64,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DataSpaceEntitlementUpdateRequest {
    pub enabled: bool,
    pub max_active_data_spaces: i64,
    pub max_active_producers_per_data_space: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TenantOffboardingReceipt {
    #[serde(rename = "company_id")]
    pub company_id: i64,
    #[serde(rename = "completed_at")]
    pub completed_at: String,
    #[serde(rename = "final_state")]
    pub final_state: TenantOffboardingReceiptFinalState,
    #[serde(rename = "per_store", default, deserialize_with = "null_as_empty")]
    pub per_store: Vec<TenantReceiptPerStore>,
    #[serde(rename = "requested_at")]
    pub requested_at: String,
    #[serde(rename = "requested_by_kind")]
    pub requested_by_kind: String,
    pub sha256: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub waiver: Option<TenantReceiptWaiver>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TenantReceiptPerStore {
    #[serde(rename = "deleted_count")]
    pub deleted_count: i64,
    #[serde(rename = "retained_exceptions_count")]
    pub retained_exceptions_count: i64,
    #[serde(rename = "retention_class")]
    pub retention_class: String,
    pub store: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TenantReceiptWaiver {
    pub role: String,
    pub timestamp: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum TenantPurpose {
    #[serde(rename = "customer")]
    Customer,
    #[serde(rename = "generated_proof")]
    GeneratedProof,
}

impl TenantPurpose {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Customer => "customer",
            Self::GeneratedProof => "generated_proof",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum TenantOffboardingReceiptFinalState {
    #[serde(rename = "preview")]
    Preview,
    #[serde(rename = "requested")]
    Requested,
    #[serde(rename = "exporting")]
    Exporting,
    #[serde(rename = "exported")]
    Exported,
    #[serde(rename = "confirming")]
    Confirming,
    #[serde(rename = "confirmed")]
    Confirmed,
    #[serde(rename = "waiver_requested")]
    WaiverRequested,
    #[serde(rename = "waiver_approved")]
    WaiverApproved,
    #[serde(rename = "fencing")]
    Fencing,
    #[serde(rename = "revoking")]
    Revoking,
    #[serde(rename = "deleting")]
    Deleting,
    #[serde(rename = "complete")]
    Complete,
    #[serde(rename = "failed")]
    Failed,
    #[serde(rename = "cancelled")]
    Cancelled,
}

impl TenantOffboardingReceiptFinalState {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Preview => "preview",
            Self::Requested => "requested",
            Self::Exporting => "exporting",
            Self::Exported => "exported",
            Self::Confirming => "confirming",
            Self::Confirmed => "confirmed",
            Self::WaiverRequested => "waiver_requested",
            Self::WaiverApproved => "waiver_approved",
            Self::Fencing => "fencing",
            Self::Revoking => "revoking",
            Self::Deleting => "deleting",
            Self::Complete => "complete",
            Self::Failed => "failed",
            Self::Cancelled => "cancelled",
        }
    }
}

impl CustdClient {
    /// List tenants.
    pub fn list_tenants(&self) -> Result<TenantListResponse> {
        let path = api_path("/api/v1/admin/tenants".to_owned(), &[], None);
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Create a tenant.
    pub fn create_tenant(&self, request: &TenantCreateRequest) -> Result<Tenant> {
        let path = api_path("/api/v1/admin/tenants".to_owned(), &[], None);
        self.call(Method::Post, &path, Some(request))
    }

    /// Get a tenant.
    pub fn get_tenant(&self, slug: &str) -> Result<Tenant> {
        let path = api_path(
            format!("/api/v1/admin/tenants/{}", percent_encode(slug)),
            &[],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Delete a tenant.
    pub fn delete_tenant(&self, slug: &str) -> Result<()> {
        let path = api_path(
            format!("/api/v1/admin/tenants/{}", percent_encode(slug)),
            &[],
            None,
        );
        self.call(Method::Delete, &path, NO_BODY)
    }

    /// Finalize a cleaned tenant.
    pub fn finalize_tenant(&self, slug: &str, company_id: i64) -> Result<()> {
        let path = api_path(
            format!("/api/v1/admin/tenants/{}/finalize", percent_encode(slug)),
            &[("companyId", Some(company_id.to_string()))],
            None,
        );
        self.call(Method::Post, &path, NO_BODY)
    }

    /// Update tenant storage limit.
    pub fn update_storage_limit(
        &self,
        slug: &str,
        request: &StorageLimitUpdateRequest,
    ) -> Result<StorageLimit> {
        let path = api_path(
            format!(
                "/api/v1/admin/tenants/{}/storage-limit",
                percent_encode(slug)
            ),
            &[],
            None,
        );
        self.call(Method::Put, &path, Some(request))
    }

    /// Get tenant data space entitlement.
    pub fn get_data_space_entitlement(&self, slug: &str) -> Result<DataSpaceEntitlementState> {
        let path = api_path(
            format!(
                "/api/v1/admin/tenants/{}/data-space-entitlement",
                percent_encode(slug)
            ),
            &[],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Update tenant data space entitlement.
    pub fn update_data_space_entitlement(
        &self,
        slug: &str,
        request: &DataSpaceEntitlementUpdateRequest,
    ) -> Result<DataSpaceEntitlementState> {
        let path = api_path(
            format!(
                "/api/v1/admin/tenants/{}/data-space-entitlement",
                percent_encode(slug)
            ),
            &[],
            None,
        );
        self.call(Method::Put, &path, Some(request))
    }
}
