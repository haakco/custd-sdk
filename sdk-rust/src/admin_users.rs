//! Tenant users, memberships and roles (Admin API `/api/v1/admin/users` and `/user-roles`).
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
pub struct AdminUserListResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub users: Vec<AdminUser>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminUser {
    pub company_slug: String,
    pub created_at: String,
    #[serde(default)]
    pub delete_reason: Option<String>,
    #[serde(default)]
    pub deleted_at: Option<String>,
    #[serde(default)]
    pub deleted_by_user_uuid: Option<String>,
    pub email: String,
    pub global_user_state: AdminUserGlobalUserState,
    #[serde(default)]
    pub last_login_at: Option<String>,
    pub membership_state: AdminUserMembershipState,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub roles: Vec<TenantRole>,
    pub user_uuid: String,
    pub welcome_notification_status: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminUserCreateRequest {
    pub company_slug: String,
    pub email: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub roles: Vec<TenantRole>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminUserUpdateRequest {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub roles: Vec<TenantRole>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminUserDisableRequest {
    pub reason: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminUserEnableRequest {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub roles: Vec<TenantRole>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminUserMembershipCreateRequest {
    pub company_slug: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub roles: Vec<TenantRole>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminPasswordResetResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub delivery_uuids: Vec<String>,
    pub message_uuid: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminUserRemovalRequest {
    pub reason: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminUserRoleListResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub roles: Vec<AdminUserRole>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminUserRole {
    pub description: String,
    pub name: String,
    pub slug: TenantRole,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum AdminUserGlobalUserState {
    #[serde(rename = "enabled")]
    Enabled,
    #[serde(rename = "suspended")]
    Suspended,
}

impl AdminUserGlobalUserState {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Enabled => "enabled",
            Self::Suspended => "suspended",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum AdminUserMembershipState {
    #[serde(rename = "active")]
    Active,
    #[serde(rename = "ended")]
    Ended,
}

impl AdminUserMembershipState {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Active => "active",
            Self::Ended => "ended",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum TenantRole {
    #[serde(rename = "tenant_admin")]
    TenantAdmin,
    #[serde(rename = "tenant_ingest_manager")]
    TenantIngestManager,
    #[serde(rename = "tenant_analyst")]
    TenantAnalyst,
}

impl TenantRole {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::TenantAdmin => "tenant_admin",
            Self::TenantIngestManager => "tenant_ingest_manager",
            Self::TenantAnalyst => "tenant_analyst",
        }
    }
}

/// The filters and page of `list_admin_users`; unset fields use the server defaults.
#[derive(Debug, Clone, PartialEq, Default)]
pub struct AdminUserQuery {
    /// Filter by tenant role.
    pub role: Option<String>,
    /// Filter by global identity state.
    pub global_state: Option<String>,
    /// Filter by tenant membership state.
    pub membership_state: Option<String>,
    /// Filter by onboarding notification state.
    pub welcome_status: Option<String>,
    /// Include ended memberships.
    pub include_ended: Option<bool>,
    /// Include removed users. System administrators only.
    pub include_deleted: Option<bool>,
}

impl CustdClient {
    /// List admin users.
    pub fn list_admin_users(
        &self,
        query: &AdminUserQuery,
        company_slug: Option<&str>,
    ) -> Result<AdminUserListResponse> {
        let path = api_path(
            "/api/v1/admin/users".to_owned(),
            &[
                ("role", query.role.clone()),
                ("globalState", query.global_state.clone()),
                ("membershipState", query.membership_state.clone()),
                ("welcomeStatus", query.welcome_status.clone()),
                ("includeEnded", query.include_ended.map(|v| v.to_string())),
                (
                    "includeDeleted",
                    query.include_deleted.map(|v| v.to_string()),
                ),
            ],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Create an admin user.
    pub fn create_admin_user(&self, request: &AdminUserCreateRequest) -> Result<AdminUser> {
        let path = api_path("/api/v1/admin/users".to_owned(), &[], None);
        self.call(Method::Post, &path, Some(request))
    }

    /// Get an admin user.
    pub fn get_admin_user(
        &self,
        user_uuid: &str,
        include_ended: Option<bool>,
        company_slug: Option<&str>,
    ) -> Result<AdminUser> {
        let path = api_path(
            format!("/api/v1/admin/users/{}", percent_encode(user_uuid)),
            &[("includeEnded", include_ended.map(|v| v.to_string()))],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Update an admin user.
    pub fn update_admin_user(
        &self,
        user_uuid: &str,
        request: &AdminUserUpdateRequest,
        company_slug: Option<&str>,
    ) -> Result<AdminUser> {
        let path = api_path(
            format!("/api/v1/admin/users/{}", percent_encode(user_uuid)),
            &[],
            company_slug,
        );
        self.call(Method::Put, &path, Some(request))
    }

    /// Disable an admin user.
    pub fn disable_admin_user(
        &self,
        user_uuid: &str,
        global_user: Option<bool>,
        request: &AdminUserDisableRequest,
        company_slug: Option<&str>,
    ) -> Result<()> {
        let path = api_path(
            format!("/api/v1/admin/users/{}/disable", percent_encode(user_uuid)),
            &[("globalUser", global_user.map(|v| v.to_string()))],
            company_slug,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Enable an admin user.
    pub fn enable_admin_user(
        &self,
        user_uuid: &str,
        global_user: Option<bool>,
        request: &AdminUserEnableRequest,
        company_slug: Option<&str>,
    ) -> Result<()> {
        let path = api_path(
            format!("/api/v1/admin/users/{}/enable", percent_encode(user_uuid)),
            &[("globalUser", global_user.map(|v| v.to_string()))],
            company_slug,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Add an existing user to a tenant.
    pub fn add_admin_user_membership(
        &self,
        user_uuid: &str,
        request: &AdminUserMembershipCreateRequest,
    ) -> Result<AdminUser> {
        let path = api_path(
            format!(
                "/api/v1/admin/users/{}/memberships",
                percent_encode(user_uuid)
            ),
            &[],
            None,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Reset an admin user password.
    pub fn reset_admin_user_password(
        &self,
        user_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<AdminPasswordResetResponse> {
        let path = api_path(
            format!(
                "/api/v1/admin/users/{}/reset-password",
                percent_encode(user_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, NO_BODY)
    }

    /// Restore a soft-deleted admin user.
    pub fn restore_admin_user(
        &self,
        user_uuid: &str,
        request: &AdminUserRemovalRequest,
        company_slug: &str,
    ) -> Result<AdminUser> {
        let path = api_path(
            format!("/api/v1/admin/users/{}/restore", percent_encode(user_uuid)),
            &[],
            Some(company_slug),
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Retry an admin user welcome notification.
    pub fn retry_admin_user_welcome(
        &self,
        user_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<()> {
        let path = api_path(
            format!(
                "/api/v1/admin/users/{}/retry-welcome",
                percent_encode(user_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, NO_BODY)
    }

    /// Soft-delete an admin user.
    pub fn soft_delete_admin_user(
        &self,
        user_uuid: &str,
        request: &AdminUserRemovalRequest,
        company_slug: &str,
    ) -> Result<AdminUser> {
        let path = api_path(
            format!(
                "/api/v1/admin/users/{}/soft-delete",
                percent_encode(user_uuid)
            ),
            &[],
            Some(company_slug),
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// List admin user roles.
    pub fn list_admin_user_roles(&self) -> Result<AdminUserRoleListResponse> {
        let path = api_path("/api/v1/admin/user-roles".to_owned(), &[], None);
        self.call(Method::Get, &path, NO_BODY)
    }
}
