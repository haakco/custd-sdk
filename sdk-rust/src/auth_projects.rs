//! Auth projects and their environments (Admin API): create, bind, apply, preview, status, offboard and delete.
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
pub struct AuthProjectListResponse {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub next_after: Option<String>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub projects: Vec<AuthProjectSummary>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectSummary {
    pub audience_entitlement_mode: AuthProjectCreateRequestAudienceEntitlementMode,
    #[serde(default)]
    pub company_uuid: Option<String>,
    pub environment_id: String,
    pub environment_slug: String,
    pub identity_mode: AuthProjectCreateRequestIdentityMode,
    pub name: String,
    pub project_id: String,
    pub slug: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectCreateRequest {
    pub audience_entitlement_mode: AuthProjectCreateRequestAudienceEntitlementMode,
    pub environment_slug: String,
    pub identity_mode: AuthProjectCreateRequestIdentityMode,
    pub name: String,
    pub slug: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectCreation {
    pub operation_id: String,
    pub project: AuthProjectSummary,
    pub replayed: bool,
    pub runtime_ready: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectCompanyBinding {
    pub company_uuid: String,
    pub project_id: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectDeletionRequest {
    pub confirm_slug: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectDeletion {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub hosting: Vec<AuthProjectHostingRemoval>,
    pub name: String,
    pub project_id: String,
    pub released: AuthProjectReleasedResources,
    pub slug: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectHostingRemoval {
    pub environment_id: String,
    pub removed: AuthEnvironmentHostingRemoval,
    pub slug: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectReleasedResources {
    pub audience_bindings: i64,
    pub directories: i64,
    pub environments: i64,
    pub invitations: i64,
    pub memberships: i64,
    pub operations: i64,
    pub organisations: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthEnvironmentHostingRemoval {
    pub alert_deliveries: i64,
    pub alert_rules: i64,
    pub alert_subscriptions: i64,
    pub alert_webhooks: i64,
    pub collection_entries: i64,
    pub items: i64,
    pub links: i64,
    pub measurement_projects: i64,
    pub meetings: i64,
    pub release_objects: i64,
    pub releases: i64,
    pub request_summaries: i64,
    pub share_card_objects: i64,
    pub sites: i64,
    pub uncertainty_models: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectEnvironmentCreateRequest {
    pub audience_entitlement_mode: AuthProjectCreateRequestAudienceEntitlementMode,
    pub identity_mode: AuthProjectCreateRequestIdentityMode,
    pub name: String,
    pub slug: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectEnvironmentDeletionRequest {
    pub confirm_slug: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectEnvironmentDeletion {
    pub environment_id: String,
    pub hosting: AuthEnvironmentHostingRemoval,
    pub name: String,
    pub project_id: String,
    pub project_slug: String,
    pub released: AuthEnvironmentReleasedResources,
    pub slug: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthEnvironmentReleasedResources {
    pub audience_bindings: i64,
    pub directories: i64,
    pub invitations: i64,
    pub memberships: i64,
    pub operations: i64,
    pub organisations: i64,
    pub profile_values: i64,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectEnvironmentOffboardRequest {
    pub confirm_slug: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectEnvironmentOffboarding {
    pub authority_withdrawn: bool,
    pub client_cleanup: AuthEnvironmentClientCleanup,
    pub environment_id: String,
    pub hosting: AuthEnvironmentHostingWithdrawal,
    pub login_paused: bool,
    pub name: String,
    pub project_id: String,
    pub project_slug: String,
    pub retained: AuthEnvironmentRetainedResources,
    pub revision: i64,
    pub slug: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthEnvironmentClientCleanup {
    pub clients_removed: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub error_category: Option<String>,
    pub status: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthEnvironmentHostingWithdrawal {
    pub active_releases: i64,
    pub alert_deliveries: i64,
    pub alert_rules: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub error_category: Option<String>,
    pub sites: i64,
    pub status: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthEnvironmentRetainedResources {
    pub directories: i64,
    pub invitations: i64,
    pub memberships: i64,
    pub organisations: i64,
    pub profile_values: i64,
    pub reserved_slots: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectDesiredStateRequest {
    pub desired_state: AuthProjectDesiredState,
    pub expected_revision: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectOperation {
    pub applied_at: String,
    pub id: String,
    pub idempotency_key: String,
    pub kind: String,
    pub replayed: bool,
    pub revision: i64,
    pub status: String,
}

/// Whether the realm shows shared product marks.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AuthProjectBrandMode {
    Shared,
    WhiteLabel,
}

/// The color scheme displayed on the realm's hosted pages.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AuthProjectBrandPalette {
    Default,
    Light,
    Dark,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectDesiredState {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub application_session_policy: Option<AuthProjectDesiredStateApplicationSessionPolicy>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub audiences: Vec<AuthProjectAudienceBinding>,
    /// The sign-in accent as `#rrggbb`. An apply that leaves it `None` keeps the stored accent;
    /// `Some("")` clears it. A status always reports it.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub brand_accent: Option<String>,
    /// `None` keeps the stored mode; `Shared` restores product marks.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub brand_mode: Option<AuthProjectBrandMode>,
    /// `None` keeps the stored palette; `Default` restores the shared theme.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub brand_palette: Option<AuthProjectBrandPalette>,
    pub display_name: String,
    pub display_name_source: String,
    /// The public entry path. An apply that leaves it `None` keeps the stored path; `Some("")`
    /// clears it. A status always reports it.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub entry_path: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub hosting: Option<AuthProjectHosting>,
    pub identity_mode: AuthProjectCreateRequestIdentityMode,
    /// Whether sign-in is paused. An apply that leaves it `None` keeps the stored pause.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub login_paused: Option<bool>,
    /// An apply that leaves it `None` keeps the stored fields; `Some(vec![])` clears them.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub profile_fields: Option<Vec<AuthProjectProfileField>>,
    pub registration_policy: AuthProjectDesiredStateRegistrationPolicy,
    /// An apply that leaves it `None` keeps the stored methods; `Some(vec![])` clears the
    /// narrowing.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub sign_in_methods: Option<Vec<String>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub social_sign_in: Option<AuthProjectSocialSignIn>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub withdraw_display_name: Option<bool>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectAudienceBinding {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub allowed_origins: Vec<String>,
    pub audience: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub post_logout_redirect_uris: Vec<String>,
    pub public_client: bool,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub redirect_uris: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectHosting {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub capabilities: Vec<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub ingest_target: Option<AuthProjectHostingIngestTarget>,
    pub mode: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectProfileField {
    pub editable_by: AuthProjectProfileFieldEditableBy,
    pub key: String,
    pub required: bool,
    pub visible_to_application: bool,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectSocialSignIn {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub providers: Vec<AuthProjectSocialProvider>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub status: Option<AuthProjectSocialSignInStatus>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectHostingIngestTarget {
    pub resource_uuid: String,
    pub scope_uuid: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectSocialProvider {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub client_id: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub client_secret: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub client_secret_set: Option<bool>,
    pub mode: AuthProjectSocialProviderMode,
    pub provider: AuthProjectSocialProviderProvider,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectSocialSignInStatus {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub callback_urls: Vec<AuthProjectSocialCallbackURL>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub providers: Vec<AuthProjectSocialProviderStatus>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectSocialCallbackURL {
    pub provider: AuthProjectSocialProviderProvider,
    pub url: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectSocialProviderStatus {
    pub mode: AuthProjectSocialProviderMode,
    pub note: String,
    pub provider: AuthProjectSocialProviderProvider,
    pub state: AuthProjectSocialProviderStatusState,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectPreview {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub changes: Vec<AuthProjectChange>,
    pub environment_id: String,
    pub no_op: bool,
    pub project_id: String,
    pub revision: i64,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub side_effects: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectChange {
    pub after: String,
    pub before: String,
    pub field: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectStatus {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub brand_logo_url: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub client_sync: Option<AuthProjectClientSyncStatus>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub company_slug: Option<String>,
    #[serde(default)]
    pub company_uuid: Option<String>,
    pub desired: AuthProjectDesiredState,
    pub environment_id: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub hosting: Option<AuthProjectHostingStatus>,
    pub login_note: String,
    pub login_ready: bool,
    pub project_id: String,
    pub reconcile_note: String,
    pub reconciled: bool,
    pub revision: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectClientSyncStatus {
    pub checked_at: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub client_ids: Vec<String>,
    pub current: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub error_category: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub issuer: Option<String>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub registrations: Vec<AuthProjectClientRegistrationStatus>,
    pub revision: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectHostingStatus {
    pub host: String,
    pub origin: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub sign_in: Option<AuthProjectHostedSignIn>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectClientRegistrationStatus {
    pub audience: String,
    pub client_id: String,
    pub observed: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectHostedSignIn {
    pub audience: String,
    pub client_id: String,
    pub post_logout_redirect_uri: String,
    pub redirect_uri: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectCapability {
    pub audience_constraints: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub identity_modes: Vec<AuthProjectCreateRequestIdentityMode>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub profile_field_keys: Vec<String>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub registration_policies: Vec<AuthProjectDesiredStateRegistrationPolicy>,
    pub subject_uniqueness: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectClientSyncRequest {
    pub expected_revision: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectClientSyncReport {
    pub checked_at: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub clients: Vec<AuthProjectClientRegistration>,
    pub environment_id: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub error_category: Option<String>,
    pub revision: i64,
    pub superseded: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthProjectClientRegistration {
    pub action: AuthProjectClientRegistrationAction,
    pub audience: String,
    pub client_id: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub reason: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppItemEnvironmentLinkList {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub links: Vec<AppItemEnvironmentLink>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppItemEnvironmentLink {
    pub created_at: String,
    /// When the item expires unless it changes; its links stop working then.
    pub item_expires_at: String,
    pub item_uuid: String,
    pub kind: AppItemEnvironmentLinkKind,
    pub link_uuid: String,
    pub role: AppItemEnvironmentLinkRole,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum AuthProjectCreateRequestAudienceEntitlementMode {
    #[serde(rename = "organisation_membership")]
    OrganisationMembership,
    #[serde(rename = "explicit_grants")]
    ExplicitGrants,
}

impl AuthProjectCreateRequestAudienceEntitlementMode {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::OrganisationMembership => "organisation_membership",
            Self::ExplicitGrants => "explicit_grants",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum AuthProjectCreateRequestIdentityMode {
    #[serde(rename = "isolated")]
    Isolated,
    #[serde(rename = "shared")]
    Shared,
}

impl AuthProjectCreateRequestIdentityMode {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Isolated => "isolated",
            Self::Shared => "shared",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum AuthProjectDesiredStateApplicationSessionPolicy {
    #[serde(rename = "offer_remember_me")]
    OfferRememberMe,
    #[serde(rename = "short_only")]
    ShortOnly,
}

impl AuthProjectDesiredStateApplicationSessionPolicy {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::OfferRememberMe => "offer_remember_me",
            Self::ShortOnly => "short_only",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum AuthProjectDesiredStateRegistrationPolicy {
    #[serde(rename = "invite_only")]
    InviteOnly,
    #[serde(rename = "open")]
    Open,
}

impl AuthProjectDesiredStateRegistrationPolicy {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::InviteOnly => "invite_only",
            Self::Open => "open",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum AuthProjectProfileFieldEditableBy {
    #[serde(rename = "user")]
    User,
    #[serde(rename = "provider")]
    Provider,
    #[serde(rename = "administrator")]
    Administrator,
}

impl AuthProjectProfileFieldEditableBy {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::User => "user",
            Self::Provider => "provider",
            Self::Administrator => "administrator",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum AuthProjectSocialProviderMode {
    #[serde(rename = "shared")]
    Shared,
    #[serde(rename = "own")]
    Own,
}

impl AuthProjectSocialProviderMode {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Shared => "shared",
            Self::Own => "own",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum AuthProjectSocialProviderProvider {
    #[serde(rename = "google")]
    Google,
    #[serde(rename = "github")]
    Github,
}

impl AuthProjectSocialProviderProvider {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Google => "google",
            Self::Github => "github",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum AuthProjectSocialProviderStatusState {
    #[serde(rename = "active")]
    Active,
    #[serde(rename = "applying")]
    Applying,
    #[serde(rename = "unavailable")]
    Unavailable,
    #[serde(rename = "waiting_for_directory")]
    WaitingForDirectory,
}

impl AuthProjectSocialProviderStatusState {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Active => "active",
            Self::Applying => "applying",
            Self::Unavailable => "unavailable",
            Self::WaitingForDirectory => "waiting_for_directory",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum AuthProjectClientRegistrationAction {
    #[serde(rename = "created")]
    Created,
    #[serde(rename = "updated")]
    Updated,
    #[serde(rename = "unchanged")]
    Unchanged,
    #[serde(rename = "removed")]
    Removed,
    #[serde(rename = "refused")]
    Refused,
}

impl AuthProjectClientRegistrationAction {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Created => "created",
            Self::Updated => "updated",
            Self::Unchanged => "unchanged",
            Self::Removed => "removed",
            Self::Refused => "refused",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum AppItemEnvironmentLinkKind {
    #[serde(rename = "measurement_project")]
    MeasurementProject,
    #[serde(rename = "link_collection")]
    LinkCollection,
    #[serde(rename = "meeting")]
    Meeting,
    #[serde(rename = "uncertainty_model")]
    UncertaintyModel,
}

impl AppItemEnvironmentLinkKind {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::MeasurementProject => "measurement_project",
            Self::LinkCollection => "link_collection",
            Self::Meeting => "meeting",
            Self::UncertaintyModel => "uncertainty_model",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum AppItemEnvironmentLinkRole {
    #[serde(rename = "owner")]
    Owner,
    #[serde(rename = "share")]
    Share,
}

impl AppItemEnvironmentLinkRole {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Owner => "owner",
            Self::Share => "share",
        }
    }
}

impl CustdClient {
    /// List accessible project environments.
    pub fn list_auth_projects(&self, after: Option<&str>) -> Result<AuthProjectListResponse> {
        let path = api_path(
            "/api/v1/admin/auth-projects".to_owned(),
            &[("after", after.map(str::to_owned))],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Create an owned project and first environment.
    pub fn create_auth_project(
        &self,
        request: &AuthProjectCreateRequest,
        idempotency_key: &str,
    ) -> Result<AuthProjectCreation> {
        let path = api_path("/api/v1/admin/auth-projects".to_owned(), &[], None);
        self.call_with_headers(
            Method::Post,
            &path,
            &[(IDEMPOTENCY_KEY, idempotency_key)],
            Some(request),
        )
    }

    /// Bind an unbound historical project to the authenticated company.
    pub fn bind_auth_project_company(&self, project_id: &str) -> Result<AuthProjectCompanyBinding> {
        let path = api_path(
            format!(
                "/api/v1/admin/auth-projects/{}/company-binding",
                percent_encode(project_id)
            ),
            &[],
            None,
        );
        self.call(Method::Post, &path, NO_BODY)
    }

    /// Delete a project and everything scoped to it.
    pub fn delete_auth_project(
        &self,
        project_id: &str,
        request: &AuthProjectDeletionRequest,
    ) -> Result<AuthProjectDeletion> {
        let path = api_path(
            format!(
                "/api/v1/admin/auth-projects/{}/delete",
                percent_encode(project_id)
            ),
            &[],
            None,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Add a further environment to an existing project.
    pub fn create_auth_project_environment(
        &self,
        project_id: &str,
        request: &AuthProjectEnvironmentCreateRequest,
    ) -> Result<AuthProjectSummary> {
        let path = api_path(
            format!(
                "/api/v1/admin/auth-projects/{}/environments",
                percent_encode(project_id)
            ),
            &[],
            None,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Delete one environment without touching its siblings.
    pub fn delete_auth_project_environment(
        &self,
        project_id: &str,
        environment_id: &str,
        request: &AuthProjectEnvironmentDeletionRequest,
    ) -> Result<AuthProjectEnvironmentDeletion> {
        let path = api_path(
            format!(
                "/api/v1/admin/auth-projects/{}/environments/{}/delete",
                percent_encode(project_id),
                percent_encode(environment_id)
            ),
            &[],
            None,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Withdraw one environment's authority while retaining its data.
    pub fn offboard_auth_project_environment(
        &self,
        project_id: &str,
        environment_id: &str,
        request: &AuthProjectEnvironmentOffboardRequest,
    ) -> Result<AuthProjectEnvironmentOffboarding> {
        let path = api_path(
            format!(
                "/api/v1/admin/auth-projects/{}/environments/{}/offboard",
                percent_encode(project_id),
                percent_encode(environment_id)
            ),
            &[],
            None,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Apply an auth configuration change.
    pub fn apply_auth_project(
        &self,
        project_id: &str,
        environment_id: &str,
        request: &AuthProjectDesiredStateRequest,
        idempotency_key: &str,
    ) -> Result<AuthProjectOperation> {
        let path = api_path(
            format!(
                "/api/v1/admin/auth-projects/{}/environments/{}/apply",
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

    /// Preview an auth configuration change.
    pub fn preview_auth_project(
        &self,
        project_id: &str,
        environment_id: &str,
        request: &AuthProjectDesiredStateRequest,
    ) -> Result<AuthProjectPreview> {
        let path = api_path(
            format!(
                "/api/v1/admin/auth-projects/{}/environments/{}/preview",
                percent_encode(project_id),
                percent_encode(environment_id)
            ),
            &[],
            None,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Read the environment's configured auth state.
    pub fn get_auth_project_status(
        &self,
        project_id: &str,
        environment_id: &str,
    ) -> Result<AuthProjectStatus> {
        let path = api_path(
            format!(
                "/api/v1/admin/auth-projects/{}/environments/{}/status",
                percent_encode(project_id),
                percent_encode(environment_id)
            ),
            &[],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Read the environment's supported auth configuration.
    pub fn get_auth_project_capability(
        &self,
        project_id: &str,
        environment_id: &str,
    ) -> Result<AuthProjectCapability> {
        let path = api_path(
            format!(
                "/api/v1/admin/auth-projects/{}/environments/{}/capability",
                percent_encode(project_id),
                percent_encode(environment_id)
            ),
            &[],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Register the environment's application clients with the provider.
    pub fn reconcile_auth_project_clients(
        &self,
        project_id: &str,
        environment_id: &str,
        request: &AuthProjectClientSyncRequest,
        idempotency_key: &str,
    ) -> Result<AuthProjectClientSyncReport> {
        let path = api_path(
            format!(
                "/api/v1/admin/auth-projects/{}/environments/{}/clients/reconcile",
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

    /// List the environment's app item links.
    pub fn list_auth_project_app_links(
        &self,
        project_id: &str,
        environment_id: &str,
    ) -> Result<AppItemEnvironmentLinkList> {
        let path = api_path(
            format!(
                "/api/v1/admin/auth-projects/{}/environments/{}/app-links",
                percent_encode(project_id),
                percent_encode(environment_id)
            ),
            &[],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }
}
