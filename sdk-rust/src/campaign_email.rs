//! Campaign email (Admin API): permissions, revisions, runs and the welcome campaign.
//!
//! Request and response shapes follow the admin-api OpenAPI document.

use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};

use crate::Result;
use crate::api_path::{NO_BODY, api_path};
use crate::client::CustdClient;
use crate::measurement::null_as_empty;
use crate::transport::{Method, percent_encode};

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CampaignRecipient {
    pub email: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CampaignPermission {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub confirmed_at: Option<String>,
    pub eligible: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub withdrawn_at: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CampaignConfirmation {
    pub confirmed_at: String,
    pub email: String,
    pub evidence_ref: String,
    pub source: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CampaignEmailRevisionPublishRequest {
    pub artifact_json: String,
    pub revision: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CampaignEmailRevision {
    pub artifact_json: String,
    pub published_at: String,
    pub revision: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CampaignRenderRequest {
    #[serde(default)]
    pub slots: BTreeMap<String, String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CampaignRenderResult {
    pub company_uuid: String,
    pub html: String,
    pub subject: String,
    pub text: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CampaignRunScheduleRequest {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub audience_digest: Option<String>,
    pub campaign: CampaignTestSelection,
    pub id: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub recipients: Vec<String>,
    pub scheduled_at: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CampaignRunStatus {
    pub cancelled: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub cancelled_at: Option<String>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub deliveries: Vec<CampaignRunRecipientStatus>,
    pub excluded: i64,
    pub failed: i64,
    pub id: String,
    pub pending: i64,
    pub processing: i64,
    pub recipients: i64,
    pub revision: String,
    pub scheduled_at: String,
    pub sent: i64,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CampaignTestSelection {
    pub revision: String,
    #[serde(default)]
    pub values: BTreeMap<String, String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CampaignRunRecipientStatus {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub delivery_uuid: Option<String>,
    pub position: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub reason: Option<String>,
    pub state: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CampaignWelcomeDefinition {
    pub reminder: CampaignTestSelection,
    pub version: String,
    pub welcome: CampaignTestSelection,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CampaignWelcomeState {
    pub paused: bool,
    pub version: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CampaignWelcomePause {
    #[serde(default)]
    pub paused: Option<bool>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CampaignWelcomeSignup {
    pub confirmed_at: String,
    pub contact_id: String,
    pub email: String,
    pub evidence_ref: String,
    pub evidence_source: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CampaignWelcomeEnrollment {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub activated_at: Option<String>,
    pub contact_id: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub earliest_reminder_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub reminder_run_id: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub version: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub welcome_run_id: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CampaignWelcomeActivation {
    pub activated_at: String,
    pub contact_id: String,
}

impl CustdClient {
    /// Check current campaign email permission.
    pub fn check_campaign_email_permission(
        &self,
        request: &CampaignRecipient,
        company_slug: Option<&str>,
    ) -> Result<CampaignPermission> {
        let path = api_path(
            "/api/v1/admin/campaign-email-permissions/check".to_owned(),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Record an existing verified campaign opt-in.
    pub fn confirm_campaign_email_permission(
        &self,
        request: &CampaignConfirmation,
        company_slug: Option<&str>,
    ) -> Result<CampaignPermission> {
        let path = api_path(
            "/api/v1/admin/campaign-email-permissions/confirm".to_owned(),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Withdraw permission to send campaign email.
    pub fn withdraw_campaign_email_permission(
        &self,
        request: &CampaignRecipient,
        company_slug: Option<&str>,
    ) -> Result<CampaignPermission> {
        let path = api_path(
            "/api/v1/admin/campaign-email-permissions/withdraw".to_owned(),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Publish a trusted-build email campaign artifact.
    pub fn publish_campaign_email_revision(
        &self,
        request: &CampaignEmailRevisionPublishRequest,
        company_slug: Option<&str>,
    ) -> Result<CampaignEmailRevision> {
        let path = api_path(
            "/api/v1/admin/campaign-email-revisions".to_owned(),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Read an exact email campaign artifact revision.
    pub fn read_campaign_email_revision(
        &self,
        revision: &str,
        company_slug: Option<&str>,
    ) -> Result<CampaignEmailRevision> {
        let path = api_path(
            format!(
                "/api/v1/admin/campaign-email-revisions/{}",
                percent_encode(revision)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Render a published email campaign revision.
    pub fn render_campaign_email_revision(
        &self,
        revision: &str,
        request: &CampaignRenderRequest,
    ) -> Result<CampaignRenderResult> {
        let path = api_path(
            format!(
                "/api/v1/admin/campaign-email-revisions/{}/render",
                percent_encode(revision)
            ),
            &[],
            None,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Schedule a pinned campaign run.
    pub fn schedule_campaign_email_run(
        &self,
        request: &CampaignRunScheduleRequest,
        company_slug: Option<&str>,
    ) -> Result<CampaignRunStatus> {
        let path = api_path(
            "/api/v1/admin/campaign-email-runs".to_owned(),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Inspect campaign run progress.
    pub fn get_campaign_email_run(
        &self,
        run_id: &str,
        company_slug: Option<&str>,
    ) -> Result<CampaignRunStatus> {
        let path = api_path(
            format!(
                "/api/v1/admin/campaign-email-runs/{}",
                percent_encode(run_id)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Cancel pending campaign delivery.
    pub fn cancel_campaign_email_run(
        &self,
        run_id: &str,
        company_slug: Option<&str>,
    ) -> Result<CampaignRunStatus> {
        let path = api_path(
            format!(
                "/api/v1/admin/campaign-email-runs/{}/cancel",
                percent_encode(run_id)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, NO_BODY)
    }

    /// Configure a pinned welcome funnel.
    pub fn configure_campaign_welcome(
        &self,
        request: &CampaignWelcomeDefinition,
        company_slug: Option<&str>,
    ) -> Result<CampaignWelcomeState> {
        let path = api_path(
            "/api/v1/admin/campaign-email-welcome/definition".to_owned(),
            &[],
            company_slug,
        );
        self.call(Method::Put, &path, Some(request))
    }

    /// Pause or resume welcome funnel submissions.
    pub fn pause_campaign_welcome(
        &self,
        request: &CampaignWelcomePause,
        company_slug: Option<&str>,
    ) -> Result<CampaignWelcomeState> {
        let path = api_path(
            "/api/v1/admin/campaign-email-welcome/pause".to_owned(),
            &[],
            company_slug,
        );
        self.call(Method::Put, &path, Some(request))
    }

    /// Enter a contact with recorded opt-in evidence.
    pub fn record_campaign_welcome_signup(
        &self,
        request: &CampaignWelcomeSignup,
        company_slug: Option<&str>,
    ) -> Result<CampaignWelcomeEnrollment> {
        let path = api_path(
            "/api/v1/admin/campaign-email-welcome/confirmed-signup".to_owned(),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Record first-party contact activation and exit the reminder.
    pub fn record_campaign_welcome_activation(
        &self,
        request: &CampaignWelcomeActivation,
        company_slug: Option<&str>,
    ) -> Result<CampaignWelcomeEnrollment> {
        let path = api_path(
            "/api/v1/admin/campaign-email-welcome/activation".to_owned(),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Inspect a contact's welcome enrollment and delivery runs.
    pub fn get_campaign_welcome_enrollment(
        &self,
        contact_id: &str,
        company_slug: Option<&str>,
    ) -> Result<CampaignWelcomeEnrollment> {
        let path = api_path(
            format!(
                "/api/v1/admin/campaign-email-welcome/contacts/{}",
                percent_encode(contact_id)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }
}
