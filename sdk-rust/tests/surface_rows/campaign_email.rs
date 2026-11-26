use custd_sdk::{
    CampaignConfirmation, CampaignEmailRevision, CampaignEmailRevisionPublishRequest,
    CampaignPermission, CampaignRecipient, CampaignRenderRequest, CampaignRenderResult,
    CampaignRunScheduleRequest, CampaignRunStatus, CampaignWelcomeActivation,
    CampaignWelcomeDefinition, CampaignWelcomeEnrollment, CampaignWelcomePause,
    CampaignWelcomeSignup, CampaignWelcomeState,
};

use super::{body, round_trip};
use crate::{Row, row};

pub fn rows() -> Vec<Row> {
    vec![
        row(
            "admin-api POST /api/v1/admin/campaign-email-permissions/check",
            "/api/v1/admin/campaign-email-permissions/check?companySlug=acme",
            |c| {
                drop(c.custd.check_campaign_email_permission(
                    &body::<CampaignRecipient>(r#"{"email":"x"}"#),
                    Some("acme"),
                ))
            },
            round_trip::<CampaignPermission>,
        ),
        row(
            "admin-api POST /api/v1/admin/campaign-email-permissions/confirm",
            "/api/v1/admin/campaign-email-permissions/confirm?companySlug=acme",
            |c| {
                drop(c.custd.confirm_campaign_email_permission(
                    &body::<CampaignConfirmation>(
                        r#"{"confirmedAt":"x","email":"x","evidenceRef":"x","source":"x"}"#,
                    ),
                    Some("acme"),
                ))
            },
            round_trip::<CampaignPermission>,
        ),
        row(
            "admin-api POST /api/v1/admin/campaign-email-permissions/withdraw",
            "/api/v1/admin/campaign-email-permissions/withdraw?companySlug=acme",
            |c| {
                drop(c.custd.withdraw_campaign_email_permission(
                    &body::<CampaignRecipient>(r#"{"email":"x"}"#),
                    Some("acme"),
                ))
            },
            round_trip::<CampaignPermission>,
        ),
        row(
            "admin-api POST /api/v1/admin/campaign-email-revisions",
            "/api/v1/admin/campaign-email-revisions?companySlug=acme",
            |c| {
                drop(c.custd.publish_campaign_email_revision(
                    &body::<CampaignEmailRevisionPublishRequest>(
                        r#"{"artifactJson":"x","revision":"x"}"#,
                    ),
                    Some("acme"),
                ))
            },
            round_trip::<CampaignEmailRevision>,
        ),
        row(
            "admin-api GET /api/v1/admin/campaign-email-revisions/{revision}",
            "/api/v1/admin/campaign-email-revisions/r-1?companySlug=acme",
            |c| drop(c.custd.read_campaign_email_revision("r-1", Some("acme"))),
            round_trip::<CampaignEmailRevision>,
        ),
        row(
            "admin-api POST /api/v1/admin/campaign-email-revisions/{revision}/render",
            "/api/v1/admin/campaign-email-revisions/r-1/render",
            |c| {
                drop(c.custd.render_campaign_email_revision(
                    "r-1",
                    &body::<CampaignRenderRequest>(r#"{"slots":{}}"#),
                ))
            },
            round_trip::<CampaignRenderResult>,
        ),
        row(
            "admin-api POST /api/v1/admin/campaign-email-runs",
            "/api/v1/admin/campaign-email-runs?companySlug=acme",
            |c| {
                drop(c.custd.schedule_campaign_email_run(&body::<CampaignRunScheduleRequest>(r#"{"campaign":{"revision":"x","values":{}},"id":"x","recipients":[],"scheduledAt":"x"}"#), Some("acme")))
            },
            round_trip::<CampaignRunStatus>,
        ),
        row(
            "admin-api GET /api/v1/admin/campaign-email-runs/{runId}",
            "/api/v1/admin/campaign-email-runs/r-1?companySlug=acme",
            |c| drop(c.custd.get_campaign_email_run("r-1", Some("acme"))),
            round_trip::<CampaignRunStatus>,
        ),
        row(
            "admin-api POST /api/v1/admin/campaign-email-runs/{runId}/cancel",
            "/api/v1/admin/campaign-email-runs/r-1/cancel?companySlug=acme",
            |c| drop(c.custd.cancel_campaign_email_run("r-1", Some("acme"))),
            round_trip::<CampaignRunStatus>,
        ),
        row(
            "admin-api PUT /api/v1/admin/campaign-email-welcome/definition",
            "/api/v1/admin/campaign-email-welcome/definition?companySlug=acme",
            |c| {
                drop(c.custd.configure_campaign_welcome(&body::<CampaignWelcomeDefinition>(r#"{"reminder":{"revision":"x","values":{}},"version":"x","welcome":{"revision":"x","values":{}}}"#), Some("acme")))
            },
            round_trip::<CampaignWelcomeState>,
        ),
        row(
            "admin-api PUT /api/v1/admin/campaign-email-welcome/pause",
            "/api/v1/admin/campaign-email-welcome/pause?companySlug=acme",
            |c| {
                drop(c.custd.pause_campaign_welcome(
                    &body::<CampaignWelcomePause>(r#"{"paused":true}"#),
                    Some("acme"),
                ))
            },
            round_trip::<CampaignWelcomeState>,
        ),
        row(
            "admin-api POST /api/v1/admin/campaign-email-welcome/confirmed-signup",
            "/api/v1/admin/campaign-email-welcome/confirmed-signup?companySlug=acme",
            |c| {
                drop(c.custd.record_campaign_welcome_signup(&body::<CampaignWelcomeSignup>(r#"{"confirmedAt":"x","contactId":"x","email":"x","evidenceRef":"x","evidenceSource":"x"}"#), Some("acme")))
            },
            round_trip::<CampaignWelcomeEnrollment>,
        ),
        row(
            "admin-api POST /api/v1/admin/campaign-email-welcome/activation",
            "/api/v1/admin/campaign-email-welcome/activation?companySlug=acme",
            |c| {
                drop(c.custd.record_campaign_welcome_activation(
                    &body::<CampaignWelcomeActivation>(r#"{"activatedAt":"x","contactId":"x"}"#),
                    Some("acme"),
                ))
            },
            round_trip::<CampaignWelcomeEnrollment>,
        ),
        row(
            "admin-api GET /api/v1/admin/campaign-email-welcome/contacts/{contactId}",
            "/api/v1/admin/campaign-email-welcome/contacts/c-1?companySlug=acme",
            |c| drop(c.custd.get_campaign_welcome_enrollment("c-1", Some("acme"))),
            round_trip::<CampaignWelcomeEnrollment>,
        ),
    ]
}
