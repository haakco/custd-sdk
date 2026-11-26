//! An auth environment's directories, principals, sessions, memberships, audiences, organisations and invitations (Admin API).
//!
//! Request and response shapes follow the admin-api OpenAPI document.

use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::Result;
use crate::api_path::{NO_BODY, api_path};
use crate::app_profile::ApplicationProfileValuesRequest;
use crate::auth_projects::{AuthProjectCreateRequestAudienceEntitlementMode, AuthProjectOperation};
use crate::client::{CustdClient, IDEMPOTENCY_KEY};
use crate::measurement::null_as_empty;
use crate::transport::{Method, percent_encode};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectDirectoryStatus {
    pub capacity: AuthProjectDirectoryCapacity,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub directories: Vec<AuthProjectDirectoryView>,
    pub environment_id: String,
    pub project_id: String,
    pub ready: bool,
    pub revision: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectDirectoryCapacity {
    pub declared: i64,
    pub free: i64,
    pub in_use: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectDirectoryView {
    pub attempt_count: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_error_category: Option<String>,
    pub pool_id: String,
    pub pool_slug: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub ready_at: Option<String>,
    pub revision: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub runtime_public_url: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub slot_ref: Option<String>,
    pub state: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectDirectoryRequest {
    pub expected_revision: i64,
    pub pool_id: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplicationPrincipalListResponse {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub next_cursor: Option<String>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub principals: Vec<ApplicationPrincipalListItem>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplicationPrincipalListItem {
    pub directory_id: String,
    pub enabled: bool,
    pub principal_id: String,
    pub provider_subject: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplicationPrincipalExport {
    pub created_at: String,
    pub directory_id: String,
    pub enabled: bool,
    pub environment_id: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub identities: Vec<ApplicationPrincipalIdentityExport>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub memberships: Vec<ApplicationPrincipalMembershipView>,
    pub principal_id: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub profile_values: Vec<ApplicationPrincipalProfileValueView>,
    pub project_id: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplicationPrincipalIdentityExport {
    pub provider_issuer: String,
    pub provider_subject: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub traits: Vec<ApplicationIdentityTrait>,
    pub traits_status: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplicationPrincipalMembershipView {
    pub created_at: String,
    pub organisation_id: String,
    pub organisation_name: String,
    pub organisation_slug: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub removed_at: Option<String>,
    pub role: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplicationPrincipalProfileValueView {
    pub field_key: String,
    pub value: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplicationIdentityTrait {
    pub name: String,
    pub value: Value,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplicationPrincipalErasureRequest {
    pub confirm: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplicationPrincipalErasure {
    pub counts_recorded: bool,
    pub directory_id: String,
    pub environment_id: String,
    pub invitations: i64,
    pub magic_links: i64,
    pub mappings: i64,
    pub memberships: i64,
    pub principal_id: String,
    pub principals: i64,
    pub profile_values: i64,
    pub project_id: String,
    pub replayed: bool,
    pub revision: i64,
    pub status: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplicationPrincipalSuspension {
    pub directory_id: String,
    pub enabled: bool,
    pub environment_id: String,
    pub principal_id: String,
    pub project_id: String,
    pub replayed: bool,
    pub revision: i64,
    pub sessions_revoked: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplicationPrincipalProfile {
    pub directory_id: String,
    pub environment_id: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub fields: Vec<ApplicationProfileField>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub missing_required: Vec<String>,
    pub principal_id: String,
    pub project_id: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplicationProfileField {
    pub editable: bool,
    pub editable_by: String,
    pub field_key: String,
    pub present: bool,
    pub required: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub value: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplicationSessionInventory {
    pub directory_id: String,
    pub environment_id: String,
    pub principal_id: String,
    pub project_id: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub sessions: Vec<ApplicationSession>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplicationSession {
    pub active: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub authenticated_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub authenticator_assurance_level: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub expires_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub issued_at: Option<String>,
    pub session_id: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplicationSessionRevokeRequest {
    pub session_id: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplicationSessionRevocation {
    pub directory_id: String,
    pub principal_id: String,
    pub project_id: String,
    pub revoked: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub session_id: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplicationSessionsRevokeAllRequest {
    pub confirm: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplicationMembershipContext {
    pub directory_id: String,
    pub environment_id: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub memberships: Vec<ApplicationMembershipChoice>,
    pub principal_id: String,
    pub project_id: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplicationMembershipChoice {
    pub organisation_id: String,
    pub organisation_name: String,
    pub organisation_slug: String,
    pub role: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplicationMembershipRevokeRequest {
    pub organisation_id: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplicationMembershipRevocation {
    pub directory_id: String,
    pub environment_id: String,
    pub organisation_id: String,
    pub principal_id: String,
    pub project_id: String,
    pub removed: bool,
    pub removed_at: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectPrincipalAudiences {
    pub audience_entitlement_mode: AuthProjectCreateRequestAudienceEntitlementMode,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub audiences: Vec<AuthProjectPrincipalAudience>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectPrincipalAudience {
    pub audience: String,
    pub granted: bool,
    pub managed: bool,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectAudienceGrantRequest {
    pub audience: String,
    pub directory_id: String,
    pub organisation_id: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectAudienceGrant {
    pub audience: String,
    pub granted: bool,
    pub managed: bool,
    pub organisation_id: String,
    pub principal_id: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectEnvironmentOrganisationList {
    pub environment_id: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub organisations: Vec<AuthProjectEnvironmentOrganisation>,
    pub project_id: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectEnvironmentOrganisation {
    pub identity_pool_id: String,
    pub name: String,
    pub organisation_id: String,
    pub slug: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectInvitationListResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub invitations: Vec<AuthProjectInvitationView>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectInvitationView {
    #[serde(default)]
    pub accepted_principal_id: Option<String>,
    pub created_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub delivered: Option<bool>,
    pub email: String,
    pub expires_at: String,
    pub invitation_id: String,
    pub membership_role: String,
    pub organisation_id: String,
    pub pool_id: String,
    pub state: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectInvitationIssueRequest {
    pub email: String,
    pub expires_in_seconds: i64,
    pub membership_role: String,
    pub organisation_id: String,
    pub pool_id: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectInvitationIssued {
    pub invitation: AuthProjectInvitationView,
    pub invite_url: String,
    pub replayed: bool,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectInvitationRedeliveryRequest {
    pub invitation_id: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectInvitationRevocationRequest {
    pub invitation_id: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum AuthDirectoryAction {
    #[serde(rename = "enable")]
    Enable,
    #[serde(rename = "pause")]
    Pause,
    #[serde(rename = "resume")]
    Resume,
    #[serde(rename = "release")]
    Release,
}

impl AuthDirectoryAction {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Enable => "enable",
            Self::Pause => "pause",
            Self::Resume => "resume",
            Self::Release => "release",
        }
    }
}

impl CustdClient {
    /// Read the environment's identity directories and credential-store state.
    pub fn list_auth_directories(
        &self,
        project_id: &str,
        environment_id: &str,
    ) -> Result<AuthProjectDirectoryStatus> {
        let path = api_path(
            format!(
                "/api/v1/admin/auth-projects/{}/environments/{}/directories",
                percent_encode(project_id),
                percent_encode(environment_id)
            ),
            &[],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Enable, pause, resume or release one directory credential store.
    pub fn act_on_auth_directory(
        &self,
        project_id: &str,
        environment_id: &str,
        action: AuthDirectoryAction,
        request: &AuthProjectDirectoryRequest,
        idempotency_key: &str,
    ) -> Result<AuthProjectOperation> {
        let path = api_path(
            format!(
                "/api/v1/admin/auth-projects/{}/environments/{}/directories/{}",
                percent_encode(project_id),
                percent_encode(environment_id),
                action.as_str()
            ),
            &[],
            None,
        );
        self.call_with_headers(
            Method::Post,
            &path,
            &[(IDEMPOTENCY_KEY, idempotency_key)],
            Some(request),
        )
    }

    /// List application principal addresses.
    pub fn list_application_principals(
        &self,
        project_id: &str,
        environment_id: &str,
        limit: Option<i64>,
        cursor: Option<&str>,
    ) -> Result<ApplicationPrincipalListResponse> {
        let path = api_path(
            format!(
                "/api/v1/admin/auth-projects/{}/environments/{}/principals",
                percent_encode(project_id),
                percent_encode(environment_id)
            ),
            &[
                ("limit", limit.map(|v| v.to_string())),
                ("cursor", cursor.map(str::to_owned)),
            ],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Export one application principal's complete record.
    pub fn export_application_principal(
        &self,
        project_id: &str,
        environment_id: &str,
        directory_id: &str,
        provider_subject: &str,
    ) -> Result<ApplicationPrincipalExport> {
        let path = api_path(
            format!(
                "/api/v1/admin/auth-projects/{}/environments/{}/directories/{}/principals/{}/export",
                percent_encode(project_id),
                percent_encode(environment_id),
                percent_encode(directory_id),
                percent_encode(provider_subject)
            ),
            &[],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Erase one application principal and everything it owns.
    pub fn erase_application_principal(
        &self,
        project_id: &str,
        environment_id: &str,
        directory_id: &str,
        provider_subject: &str,
        request: &ApplicationPrincipalErasureRequest,
        idempotency_key: &str,
    ) -> Result<ApplicationPrincipalErasure> {
        let path = api_path(
            format!(
                "/api/v1/admin/auth-projects/{}/environments/{}/directories/{}/principals/{}/erase",
                percent_encode(project_id),
                percent_encode(environment_id),
                percent_encode(directory_id),
                percent_encode(provider_subject)
            ),
            &[],
            None,
        );
        self.call_with_headers(
            Method::Post,
            &path,
            &[(IDEMPOTENCY_KEY, idempotency_key)],
            Some(request),
        )
    }

    /// Suspend one application principal.
    pub fn suspend_application_principal(
        &self,
        project_id: &str,
        environment_id: &str,
        directory_id: &str,
        provider_subject: &str,
        idempotency_key: &str,
    ) -> Result<ApplicationPrincipalSuspension> {
        let path = api_path(
            format!(
                "/api/v1/admin/auth-projects/{}/environments/{}/directories/{}/principals/{}/suspend",
                percent_encode(project_id),
                percent_encode(environment_id),
                percent_encode(directory_id),
                percent_encode(provider_subject)
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

    /// Restore one suspended application principal.
    pub fn restore_application_principal(
        &self,
        project_id: &str,
        environment_id: &str,
        directory_id: &str,
        provider_subject: &str,
        idempotency_key: &str,
    ) -> Result<ApplicationPrincipalSuspension> {
        let path = api_path(
            format!(
                "/api/v1/admin/auth-projects/{}/environments/{}/directories/{}/principals/{}/restore",
                percent_encode(project_id),
                percent_encode(environment_id),
                percent_encode(directory_id),
                percent_encode(provider_subject)
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

    /// Read one application principal's profile values.
    pub fn get_application_principal_profile(
        &self,
        project_id: &str,
        environment_id: &str,
        directory_id: &str,
        provider_subject: &str,
    ) -> Result<ApplicationPrincipalProfile> {
        let path = api_path(
            format!(
                "/api/v1/admin/auth-projects/{}/environments/{}/directories/{}/principals/{}/profile",
                percent_encode(project_id),
                percent_encode(environment_id),
                percent_encode(directory_id),
                percent_encode(provider_subject)
            ),
            &[],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Set one application principal's profile values.
    pub fn set_application_principal_profile(
        &self,
        project_id: &str,
        environment_id: &str,
        directory_id: &str,
        provider_subject: &str,
        request: &ApplicationProfileValuesRequest,
        idempotency_key: &str,
    ) -> Result<ApplicationPrincipalProfile> {
        let path = api_path(
            format!(
                "/api/v1/admin/auth-projects/{}/environments/{}/directories/{}/principals/{}/profile",
                percent_encode(project_id),
                percent_encode(environment_id),
                percent_encode(directory_id),
                percent_encode(provider_subject)
            ),
            &[],
            None,
        );
        self.call_with_headers(
            Method::Post,
            &path,
            &[(IDEMPOTENCY_KEY, idempotency_key)],
            Some(request),
        )
    }

    /// List one application principal's live sessions.
    pub fn list_application_principal_sessions(
        &self,
        project_id: &str,
        environment_id: &str,
        directory_id: &str,
        provider_subject: &str,
    ) -> Result<ApplicationSessionInventory> {
        let path = api_path(
            format!(
                "/api/v1/admin/auth-projects/{}/environments/{}/directories/{}/principals/{}/sessions",
                percent_encode(project_id),
                percent_encode(environment_id),
                percent_encode(directory_id),
                percent_encode(provider_subject)
            ),
            &[],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Revoke exactly one of an application principal's sessions.
    pub fn revoke_application_principal_session(
        &self,
        project_id: &str,
        environment_id: &str,
        directory_id: &str,
        provider_subject: &str,
        request: &ApplicationSessionRevokeRequest,
        idempotency_key: &str,
    ) -> Result<ApplicationSessionRevocation> {
        let path = api_path(
            format!(
                "/api/v1/admin/auth-projects/{}/environments/{}/directories/{}/principals/{}/sessions/revoke",
                percent_encode(project_id),
                percent_encode(environment_id),
                percent_encode(directory_id),
                percent_encode(provider_subject)
            ),
            &[],
            None,
        );
        self.call_with_headers(
            Method::Post,
            &path,
            &[(IDEMPOTENCY_KEY, idempotency_key)],
            Some(request),
        )
    }

    /// Revoke every session of one application principal.
    pub fn revoke_application_principal_sessions(
        &self,
        project_id: &str,
        environment_id: &str,
        directory_id: &str,
        provider_subject: &str,
        request: &ApplicationSessionsRevokeAllRequest,
        idempotency_key: &str,
    ) -> Result<ApplicationSessionRevocation> {
        let path = api_path(
            format!(
                "/api/v1/admin/auth-projects/{}/environments/{}/directories/{}/principals/{}/sessions/revoke-all",
                percent_encode(project_id),
                percent_encode(environment_id),
                percent_encode(directory_id),
                percent_encode(provider_subject)
            ),
            &[],
            None,
        );
        self.call_with_headers(
            Method::Post,
            &path,
            &[(IDEMPOTENCY_KEY, idempotency_key)],
            Some(request),
        )
    }

    /// List an application identity's organisations.
    pub fn list_application_principal_memberships(
        &self,
        project_id: &str,
        environment_id: &str,
        directory_id: &str,
        provider_subject: &str,
    ) -> Result<ApplicationMembershipContext> {
        let path = api_path(
            format!(
                "/api/v1/admin/auth-projects/{}/environments/{}/directories/{}/principals/{}/memberships",
                percent_encode(project_id),
                percent_encode(environment_id),
                percent_encode(directory_id),
                percent_encode(provider_subject)
            ),
            &[],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// End an application identity's membership of one organisation.
    pub fn revoke_application_principal_membership(
        &self,
        project_id: &str,
        environment_id: &str,
        directory_id: &str,
        provider_subject: &str,
        request: &ApplicationMembershipRevokeRequest,
    ) -> Result<ApplicationMembershipRevocation> {
        let path = api_path(
            format!(
                "/api/v1/admin/auth-projects/{}/environments/{}/directories/{}/principals/{}/memberships/revoke",
                percent_encode(project_id),
                percent_encode(environment_id),
                percent_encode(directory_id),
                percent_encode(provider_subject)
            ),
            &[],
            None,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Read an addressed principal's registered audience entitlements.
    pub fn list_principal_audiences(
        &self,
        project_id: &str,
        environment_id: &str,
        provider_subject: &str,
        directory_id: &str,
    ) -> Result<AuthProjectPrincipalAudiences> {
        let path = api_path(
            format!(
                "/api/v1/admin/auth-projects/{}/environments/{}/principals/{}/audiences",
                percent_encode(project_id),
                percent_encode(environment_id),
                percent_encode(provider_subject)
            ),
            &[("directoryId", Some(directory_id.to_owned()))],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Grant one workload audience to an addressed principal.
    pub fn grant_principal_audience(
        &self,
        project_id: &str,
        environment_id: &str,
        provider_subject: &str,
        request: &AuthProjectAudienceGrantRequest,
        idempotency_key: &str,
    ) -> Result<AuthProjectAudienceGrant> {
        let path = api_path(
            format!(
                "/api/v1/admin/auth-projects/{}/environments/{}/principals/{}/audiences/grant",
                percent_encode(project_id),
                percent_encode(environment_id),
                percent_encode(provider_subject)
            ),
            &[],
            None,
        );
        self.call_with_headers(
            Method::Post,
            &path,
            &[(IDEMPOTENCY_KEY, idempotency_key)],
            Some(request),
        )
    }

    /// Revoke one workload audience without changing organisation membership or siblings.
    pub fn revoke_principal_audience(
        &self,
        project_id: &str,
        environment_id: &str,
        provider_subject: &str,
        request: &AuthProjectAudienceGrantRequest,
        idempotency_key: &str,
    ) -> Result<AuthProjectAudienceGrant> {
        let path = api_path(
            format!(
                "/api/v1/admin/auth-projects/{}/environments/{}/principals/{}/audiences/revoke",
                percent_encode(project_id),
                percent_encode(environment_id),
                percent_encode(provider_subject)
            ),
            &[],
            None,
        );
        self.call_with_headers(
            Method::Post,
            &path,
            &[(IDEMPOTENCY_KEY, idempotency_key)],
            Some(request),
        )
    }

    /// Read the environment's directory organisations.
    pub fn list_auth_environment_organisations(
        &self,
        project_id: &str,
        environment_id: &str,
    ) -> Result<AuthProjectEnvironmentOrganisationList> {
        let path = api_path(
            format!(
                "/api/v1/admin/auth-projects/{}/environments/{}/organisations",
                percent_encode(project_id),
                percent_encode(environment_id)
            ),
            &[],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// List the environment's invitations.
    pub fn list_auth_invitations(
        &self,
        project_id: &str,
        environment_id: &str,
    ) -> Result<AuthProjectInvitationListResponse> {
        let path = api_path(
            format!(
                "/api/v1/admin/auth-projects/{}/environments/{}/invitations",
                percent_encode(project_id),
                percent_encode(environment_id)
            ),
            &[],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Invite one address into a directory and deliver the link.
    pub fn issue_auth_project_invitation(
        &self,
        project_id: &str,
        environment_id: &str,
        request: &AuthProjectInvitationIssueRequest,
        idempotency_key: &str,
    ) -> Result<AuthProjectInvitationIssued> {
        let path = api_path(
            format!(
                "/api/v1/admin/auth-projects/{}/environments/{}/invitations",
                percent_encode(project_id),
                percent_encode(environment_id)
            ),
            &[],
            None,
        );
        self.call_with_headers(
            Method::Post,
            &path,
            &[(IDEMPOTENCY_KEY, idempotency_key)],
            Some(request),
        )
    }

    /// Replace one live invitation's link and offer it again.
    pub fn redeliver_auth_project_invitation(
        &self,
        project_id: &str,
        environment_id: &str,
        request: &AuthProjectInvitationRedeliveryRequest,
        idempotency_key: &str,
    ) -> Result<AuthProjectInvitationIssued> {
        let path = api_path(
            format!(
                "/api/v1/admin/auth-projects/{}/environments/{}/invitations/redeliver",
                percent_encode(project_id),
                percent_encode(environment_id)
            ),
            &[],
            None,
        );
        self.call_with_headers(
            Method::Post,
            &path,
            &[(IDEMPOTENCY_KEY, idempotency_key)],
            Some(request),
        )
    }

    /// Withdraw a live invitation before it is used.
    pub fn revoke_auth_project_invitation(
        &self,
        project_id: &str,
        environment_id: &str,
        request: &AuthProjectInvitationRevocationRequest,
        idempotency_key: &str,
    ) -> Result<AuthProjectInvitationView> {
        let path = api_path(
            format!(
                "/api/v1/admin/auth-projects/{}/environments/{}/invitations/revoke",
                percent_encode(project_id),
                percent_encode(environment_id)
            ),
            &[],
            None,
        );
        self.call_with_headers(
            Method::Post,
            &path,
            &[(IDEMPOTENCY_KEY, idempotency_key)],
            Some(request),
        )
    }
}
