//! Notifications: the email relay, notification webhooks and deliveries, and notification
//! destinations.
//!
//! Request and response shapes follow the admin-api OpenAPI document.

use serde::{Deserialize, Serialize};

use crate::Result;
use crate::api_path::{NO_BODY, api_path};
use crate::campaign_email::CampaignTestSelection;
use crate::client::CustdClient;
use crate::measurement::null_as_empty;
use crate::transport::{Method, percent_encode};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EmailRelayView {
    pub effective: EmailRelayEffectiveSender,
    /// The tenant's own relay; `None` when the tenant sends through Custd's relay.
    pub relay: Option<EmailRelay>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EmailRelayEffectiveSender {
    pub from_address: String,
    pub from_display_name: String,
    pub has_credential: bool,
    pub relay: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EmailRelay {
    pub created_at: String,
    pub enabled: bool,
    pub from_address: String,
    pub from_display_name: String,
    pub has_credential: bool,
    pub host: String,
    pub port: i64,
    pub tls_mode: String,
    pub updated_at: String,
    pub username: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EmailRelayWriteRequest {
    pub enabled: bool,
    pub from_address: String,
    pub from_display_name: String,
    pub host: String,
    pub password: String,
    pub port: i64,
    pub tls_mode: String,
    pub username: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EmailRelayTestSendRequest {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub campaign: Option<CampaignTestSelection>,
    pub recipient: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EmailRelayTestSendResult {
    pub accepted: bool,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub delivery_uuids: Vec<String>,
    pub message_uuid: String,
    pub sender: EmailRelayEffectiveSender,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NotificationWebhookListResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub subscriptions: Vec<NotificationWebhookSubscription>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NotificationWebhookSubscription {
    pub created_at: String,
    pub enabled: bool,
    pub endpoint: String,
    pub kind: NotificationWebhookSubscriptionKind,
    pub name: String,
    pub updated_at: String,
    pub uuid: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NotificationWebhookCreateRequest {
    pub company_slug: String,
    pub enabled: bool,
    pub endpoint: String,
    /// Defaults to webhook.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub kind: Option<NotificationWebhookSubscriptionKind>,
    pub name: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NotificationWebhookSecret {
    pub created_at: String,
    pub enabled: bool,
    pub endpoint: String,
    pub kind: NotificationWebhookSubscriptionKind,
    pub name: String,
    /// Shown once; empty for a Slack subscription, whose URL is its secret.
    pub signing_secret: String,
    pub updated_at: String,
    pub uuid: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NotificationWebhookEnabledRequest {
    pub enabled: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NotificationDeliveryStatus {
    pub attempt_count: i64,
    pub channel: String,
    pub created_at: String,
    pub delivery_uuid: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub failure_reason: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_error_class: Option<String>,
    pub message_uuid: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub next_action: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub provider_message_id: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub sent_at: Option<String>,
    pub state: String,
    pub template_id: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub terminal_at: Option<String>,
    pub updated_at: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TenantDestination {
    pub channel: TenantDestinationChannel,
    pub configured: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub email_recipient: Option<String>,
    pub enabled: bool,
    pub event_slug: TenantDestinationEventSlug,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TenantDestinationRequest {
    pub channel: TenantDestinationChannel,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub email_recipient: Option<String>,
    pub enabled: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum NotificationWebhookSubscriptionKind {
    #[serde(rename = "webhook")]
    Webhook,
    #[serde(rename = "slack")]
    Slack,
}

impl NotificationWebhookSubscriptionKind {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Webhook => "webhook",
            Self::Slack => "slack",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum TenantDestinationChannel {
    #[serde(rename = "email")]
    Email,
    #[serde(rename = "webhook")]
    Webhook,
    #[serde(rename = "slack")]
    Slack,
}

impl TenantDestinationChannel {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Email => "email",
            Self::Webhook => "webhook",
            Self::Slack => "slack",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum TenantDestinationEventSlug {
    #[serde(rename = "email_relay_test_send")]
    EmailRelayTestSend,
    #[serde(rename = "identity_verify_email")]
    IdentityVerifyEmail,
    #[serde(rename = "identity_reset_password")]
    IdentityResetPassword,
    #[serde(rename = "user_welcome")]
    UserWelcome,
    #[serde(rename = "application_invitation")]
    ApplicationInvitation,
    #[serde(rename = "error_issue_alert")]
    ErrorIssueAlert,
    #[serde(rename = "site_finding_opened")]
    SiteFindingOpened,
    #[serde(rename = "site_incident")]
    SiteIncident,
    #[serde(rename = "site_ai_allowance")]
    SiteAiAllowance,
    #[serde(rename = "site_status_page_confirm")]
    SiteStatusPageConfirm,
    #[serde(rename = "site_status_page_update")]
    SiteStatusPageUpdate,
}

impl TenantDestinationEventSlug {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::EmailRelayTestSend => "email_relay_test_send",
            Self::IdentityVerifyEmail => "identity_verify_email",
            Self::IdentityResetPassword => "identity_reset_password",
            Self::UserWelcome => "user_welcome",
            Self::ApplicationInvitation => "application_invitation",
            Self::ErrorIssueAlert => "error_issue_alert",
            Self::SiteFindingOpened => "site_finding_opened",
            Self::SiteIncident => "site_incident",
            Self::SiteAiAllowance => "site_ai_allowance",
            Self::SiteStatusPageConfirm => "site_status_page_confirm",
            Self::SiteStatusPageUpdate => "site_status_page_update",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum NotificationDestinationEventSlug {
    #[serde(rename = "error_issue_alert")]
    ErrorIssueAlert,
    #[serde(rename = "site_finding_opened")]
    SiteFindingOpened,
    #[serde(rename = "site_incident")]
    SiteIncident,
    #[serde(rename = "site_ai_allowance")]
    SiteAiAllowance,
}

impl NotificationDestinationEventSlug {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::ErrorIssueAlert => "error_issue_alert",
            Self::SiteFindingOpened => "site_finding_opened",
            Self::SiteIncident => "site_incident",
            Self::SiteAiAllowance => "site_ai_allowance",
        }
    }
}

impl CustdClient {
    /// Get a tenant's email relay and effective sender.
    pub fn get_email_relay(&self, tenant_slug: &str) -> Result<EmailRelayView> {
        let path = api_path(
            format!("/api/v1/admin/email-relay/{}", percent_encode(tenant_slug)),
            &[],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Create or replace a tenant's email relay.
    pub fn upsert_email_relay(
        &self,
        tenant_slug: &str,
        request: &EmailRelayWriteRequest,
    ) -> Result<EmailRelay> {
        let path = api_path(
            format!("/api/v1/admin/email-relay/{}", percent_encode(tenant_slug)),
            &[],
            None,
        );
        self.call(Method::Put, &path, Some(request))
    }

    /// Clear a tenant's email relay.
    pub fn delete_email_relay(&self, tenant_slug: &str) -> Result<()> {
        let path = api_path(
            format!("/api/v1/admin/email-relay/{}", percent_encode(tenant_slug)),
            &[],
            None,
        );
        self.call(Method::Delete, &path, NO_BODY)
    }

    /// Send a test email on a tenant's effective relay.
    pub fn test_send_email_relay(
        &self,
        tenant_slug: &str,
        request: &EmailRelayTestSendRequest,
    ) -> Result<EmailRelayTestSendResult> {
        let path = api_path(
            format!(
                "/api/v1/admin/email-relay/{}/test-send",
                percent_encode(tenant_slug)
            ),
            &[],
            None,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// List notification webhooks.
    pub fn list_notification_webhooks(&self) -> Result<NotificationWebhookListResponse> {
        let path = api_path("/api/v1/admin/notification-webhooks".to_owned(), &[], None);
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Create notification webhook.
    pub fn create_notification_webhook(
        &self,
        request: &NotificationWebhookCreateRequest,
    ) -> Result<NotificationWebhookSecret> {
        let path = api_path("/api/v1/admin/notification-webhooks".to_owned(), &[], None);
        self.call(Method::Post, &path, Some(request))
    }

    /// Update notification webhook.
    pub fn update_notification_webhook(
        &self,
        uuid: &str,
        request: &NotificationWebhookEnabledRequest,
        company_slug: Option<&str>,
    ) -> Result<NotificationWebhookSubscription> {
        let path = api_path(
            format!(
                "/api/v1/admin/notification-webhooks/{}",
                percent_encode(uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Patch, &path, Some(request))
    }

    /// Delete notification webhook.
    pub fn delete_notification_webhook(&self, uuid: &str) -> Result<()> {
        let path = api_path(
            format!(
                "/api/v1/admin/notification-webhooks/{}",
                percent_encode(uuid)
            ),
            &[],
            None,
        );
        self.call(Method::Delete, &path, NO_BODY)
    }

    /// Rotate notification webhook secret.
    pub fn rotate_notification_webhook_secret(
        &self,
        uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<NotificationWebhookSecret> {
        let path = api_path(
            format!(
                "/api/v1/admin/notification-webhooks/{}/rotate-secret",
                percent_encode(uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, NO_BODY)
    }

    /// Get notification delivery.
    pub fn get_notification_delivery(
        &self,
        uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<NotificationDeliveryStatus> {
        let path = api_path(
            format!(
                "/api/v1/admin/notification-deliveries/{}",
                percent_encode(uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Get where one event is sent for the tenant.
    pub fn get_notification_destination(
        &self,
        event_slug: NotificationDestinationEventSlug,
        company_slug: Option<&str>,
    ) -> Result<TenantDestination> {
        let path = api_path(
            format!("/api/v1/notification-destinations/{}", event_slug.as_str()),
            &[],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Set where one event is sent for the tenant.
    pub fn put_notification_destination(
        &self,
        event_slug: NotificationDestinationEventSlug,
        request: &TenantDestinationRequest,
        company_slug: Option<&str>,
    ) -> Result<TenantDestination> {
        let path = api_path(
            format!("/api/v1/notification-destinations/{}", event_slug.as_str()),
            &[],
            company_slug,
        );
        self.call(Method::Put, &path, Some(request))
    }
}
