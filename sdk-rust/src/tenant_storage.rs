//! Tenant storage locations (Admin API).
//!
//! Request and response shapes follow the admin-api OpenAPI document.

use serde::{Deserialize, Serialize};

use crate::Result;
use crate::api_path::{NO_BODY, api_path};
use crate::client::CustdClient;
use crate::measurement::null_as_empty;
use crate::transport::Method;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TenantStorageLocationListResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub locations: Vec<TenantStorageLocationView>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TenantStorageLocationView {
    pub bucket: String,
    pub code: String,
    pub company_id: i64,
    pub created_at: String,
    pub endpoint: String,
    pub id: i64,
    pub isolation_tier: String,
    pub provider: String,
    pub region: String,
    pub root_prefix: String,
    pub updated_at: String,
    pub uuid: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub validated_at: Option<String>,
    pub validation_status: String,
    pub write_enabled: bool,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TenantStorageLocationCreateBody {}

impl CustdClient {
    /// List tenant storage locations.
    pub fn list_tenant_storage_locations(&self) -> Result<TenantStorageLocationListResponse> {
        let path = api_path("/api/v1/tenant-storage-locations".to_owned(), &[], None);
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Create a tenant storage location.
    pub fn create_tenant_storage_location(
        &self,
        request: &TenantStorageLocationCreateBody,
    ) -> Result<TenantStorageLocationView> {
        let path = api_path("/api/v1/tenant-storage-locations".to_owned(), &[], None);
        self.call(Method::Post, &path, Some(request))
    }

    /// Get a tenant storage location.
    pub fn get_tenant_storage_location(&self, id: i64) -> Result<TenantStorageLocationView> {
        let path = api_path(
            format!("/api/v1/tenant-storage-locations/{}", id),
            &[],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Revoke a tenant storage location.
    pub fn revoke_tenant_storage_location(&self, id: i64) -> Result<()> {
        let path = api_path(
            format!("/api/v1/tenant-storage-locations/{}", id),
            &[],
            None,
        );
        self.call(Method::Delete, &path, NO_BODY)
    }
}
