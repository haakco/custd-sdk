//! Data scopes, their resources and grants (Admin API `/api/v1/admin/data-scopes` and
//! `/data-scope-grants`).
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
pub struct DataScopeListResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub scopes: Vec<DataScope>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DataScope {
    pub code: String,
    pub created_at: String,
    pub name: String,
    pub status: DataScopeUpdateRequestStatus,
    pub updated_at: String,
    pub uuid: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DataScopeCreateRequest {
    pub code: String,
    pub name: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DataScopeUpdateRequest {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub status: Option<DataScopeUpdateRequestStatus>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DataScopeResourceListResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub resources: Vec<DataScopeResource>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DataScopeResource {
    pub code: String,
    pub created_at: String,
    pub name: String,
    pub scope_uuid: String,
    pub status: DataScopeUpdateRequestStatus,
    pub updated_at: String,
    pub uuid: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DataScopeResourceCreateRequest {
    pub code: String,
    pub name: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DataScopeResourceUpdateRequest {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub status: Option<DataScopeUpdateRequestStatus>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DataScopeGrantListResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub grants: Vec<DataScopeGrant>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DataScopeGrant {
    pub action: DataScopeGrantAction,
    pub principal: DataScopePrincipalRef,
    pub target: DataScopeGrantTarget,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DataScopePrincipalRef {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub client_id: Option<String>,
    pub kind: DataScopeGrantsKind,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub user_uuid: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DataScopeGrantTarget {
    pub kind: DataScopeGrantTargetKind,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub resource_uuid: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub scope_uuid: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DataScopeGrantRequest {
    pub action: DataScopeGrantAction,
    pub principal: DataScopePrincipalRef,
    pub target: DataScopeGrantTarget,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum DataScopeUpdateRequestStatus {
    #[serde(rename = "active")]
    Active,
    #[serde(rename = "disabled")]
    Disabled,
}

impl DataScopeUpdateRequestStatus {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Active => "active",
            Self::Disabled => "disabled",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum DataScopeGrantAction {
    #[serde(rename = "read")]
    Read,
    #[serde(rename = "write")]
    Write,
}

impl DataScopeGrantAction {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Read => "read",
            Self::Write => "write",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum DataScopeGrantsKind {
    #[serde(rename = "human")]
    Human,
    #[serde(rename = "machine")]
    Machine,
}

impl DataScopeGrantsKind {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Human => "human",
            Self::Machine => "machine",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum DataScopeGrantTargetKind {
    #[serde(rename = "parent")]
    Parent,
    #[serde(rename = "sub_client")]
    SubClient,
    #[serde(rename = "resource")]
    Resource,
}

impl DataScopeGrantTargetKind {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Parent => "parent",
            Self::SubClient => "sub_client",
            Self::Resource => "resource",
        }
    }
}

impl CustdClient {
    /// List data scopes.
    pub fn list_data_scopes(
        &self,
        include_disabled: Option<bool>,
        company_slug: Option<&str>,
    ) -> Result<DataScopeListResponse> {
        let path = api_path(
            "/api/v1/admin/data-scopes".to_owned(),
            &[("includeDisabled", include_disabled.map(|v| v.to_string()))],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Create a data scope.
    pub fn create_data_scope(
        &self,
        request: &DataScopeCreateRequest,
        company_slug: Option<&str>,
    ) -> Result<DataScope> {
        let path = api_path("/api/v1/admin/data-scopes".to_owned(), &[], company_slug);
        self.call(Method::Post, &path, Some(request))
    }

    /// Get a data scope.
    pub fn get_data_scope(
        &self,
        scope_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<DataScope> {
        let path = api_path(
            format!("/api/v1/admin/data-scopes/{}", percent_encode(scope_uuid)),
            &[],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Update a data scope.
    pub fn update_data_scope(
        &self,
        scope_uuid: &str,
        request: &DataScopeUpdateRequest,
        company_slug: Option<&str>,
    ) -> Result<DataScope> {
        let path = api_path(
            format!("/api/v1/admin/data-scopes/{}", percent_encode(scope_uuid)),
            &[],
            company_slug,
        );
        self.call(Method::Patch, &path, Some(request))
    }

    /// Disable a data scope.
    pub fn disable_data_scope(&self, scope_uuid: &str, company_slug: Option<&str>) -> Result<()> {
        let path = api_path(
            format!(
                "/api/v1/admin/data-scopes/{}/disable",
                percent_encode(scope_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, NO_BODY)
    }

    /// List data-scope resources.
    pub fn list_data_scope_resources(
        &self,
        scope_uuid: &str,
        include_disabled: Option<bool>,
        company_slug: Option<&str>,
    ) -> Result<DataScopeResourceListResponse> {
        let path = api_path(
            format!(
                "/api/v1/admin/data-scopes/{}/resources",
                percent_encode(scope_uuid)
            ),
            &[("includeDisabled", include_disabled.map(|v| v.to_string()))],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Create a data-scope resource.
    pub fn create_data_scope_resource(
        &self,
        scope_uuid: &str,
        request: &DataScopeResourceCreateRequest,
        company_slug: Option<&str>,
    ) -> Result<DataScopeResource> {
        let path = api_path(
            format!(
                "/api/v1/admin/data-scopes/{}/resources",
                percent_encode(scope_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Get a data-scope resource.
    pub fn get_data_scope_resource(
        &self,
        scope_uuid: &str,
        resource_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<DataScopeResource> {
        let path = api_path(
            format!(
                "/api/v1/admin/data-scopes/{}/resources/{}",
                percent_encode(scope_uuid),
                percent_encode(resource_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Update a data-scope resource.
    pub fn update_data_scope_resource(
        &self,
        scope_uuid: &str,
        resource_uuid: &str,
        request: &DataScopeResourceUpdateRequest,
        company_slug: Option<&str>,
    ) -> Result<DataScopeResource> {
        let path = api_path(
            format!(
                "/api/v1/admin/data-scopes/{}/resources/{}",
                percent_encode(scope_uuid),
                percent_encode(resource_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Patch, &path, Some(request))
    }

    /// Disable a data-scope resource.
    pub fn disable_data_scope_resource(
        &self,
        scope_uuid: &str,
        resource_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<()> {
        let path = api_path(
            format!(
                "/api/v1/admin/data-scopes/{}/resources/{}/disable",
                percent_encode(scope_uuid),
                percent_encode(resource_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, NO_BODY)
    }

    /// List data-scope grants.
    pub fn list_data_scope_grants(
        &self,
        kind: Option<DataScopeGrantsKind>,
        user_uuid: Option<&str>,
        client_id: Option<&str>,
        company_slug: Option<&str>,
    ) -> Result<DataScopeGrantListResponse> {
        let path = api_path(
            "/api/v1/admin/data-scope-grants".to_owned(),
            &[
                ("kind", kind.map(|v| v.as_str().to_owned())),
                ("userUuid", user_uuid.map(str::to_owned)),
                ("clientId", client_id.map(str::to_owned)),
            ],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Create a data-scope grant.
    pub fn create_data_scope_grant(
        &self,
        request: &DataScopeGrantRequest,
        company_slug: Option<&str>,
    ) -> Result<DataScopeGrant> {
        let path = api_path(
            "/api/v1/admin/data-scope-grants".to_owned(),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Revoke a data-scope grant.
    pub fn revoke_data_scope_grant(
        &self,
        request: &DataScopeGrantRequest,
        company_slug: Option<&str>,
    ) -> Result<()> {
        let path = api_path(
            "/api/v1/admin/data-scope-grants/revoke".to_owned(),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, Some(request))
    }
}
