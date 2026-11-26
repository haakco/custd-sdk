use custd_sdk::{
    EmailRelay, EmailRelayTestSendRequest, EmailRelayTestSendResult, EmailRelayView,
    EmailRelayWriteRequest, NotificationDeliveryStatus, NotificationDestinationEventSlug,
    NotificationWebhookCreateRequest, NotificationWebhookEnabledRequest,
    NotificationWebhookListResponse, NotificationWebhookSecret, NotificationWebhookSubscription,
    TenantDestination, TenantDestinationRequest,
};

use super::{body, round_trip};
use crate::{Row, bodiless, row};

pub fn rows() -> Vec<Row> {
    vec![
        row(
            "admin-api GET /api/v1/admin/email-relay/{tenantSlug}",
            "/api/v1/admin/email-relay/t-1",
            |c| drop(c.custd.get_email_relay("t-1")),
            round_trip::<EmailRelayView>,
        ),
        row(
            "admin-api PUT /api/v1/admin/email-relay/{tenantSlug}",
            "/api/v1/admin/email-relay/t-1",
            |c| {
                drop(c.custd.upsert_email_relay("t-1", &body::<EmailRelayWriteRequest>(r#"{"enabled":true,"fromAddress":"x","fromDisplayName":"x","host":"x","password":"x","port":1,"tlsMode":"x","username":"x"}"#)))
            },
            round_trip::<EmailRelay>,
        ),
        bodiless(
            "admin-api DELETE /api/v1/admin/email-relay/{tenantSlug}",
            "/api/v1/admin/email-relay/t-1",
            |c| drop(c.custd.delete_email_relay("t-1")),
        ),
        row(
            "admin-api POST /api/v1/admin/email-relay/{tenantSlug}/test-send",
            "/api/v1/admin/email-relay/t-1/test-send",
            |c| {
                drop(c.custd.test_send_email_relay(
                    "t-1",
                    &body::<EmailRelayTestSendRequest>(r#"{"recipient":"x"}"#),
                ))
            },
            round_trip::<EmailRelayTestSendResult>,
        ),
        row(
            "admin-api GET /api/v1/admin/notification-webhooks",
            "/api/v1/admin/notification-webhooks",
            |c| drop(c.custd.list_notification_webhooks()),
            round_trip::<NotificationWebhookListResponse>,
        ),
        row(
            "admin-api POST /api/v1/admin/notification-webhooks",
            "/api/v1/admin/notification-webhooks",
            |c| {
                drop(c.custd.create_notification_webhook(
                    &body::<NotificationWebhookCreateRequest>(
                        r#"{"companySlug":"x","enabled":true,"endpoint":"x","name":"x"}"#,
                    ),
                ))
            },
            round_trip::<NotificationWebhookSecret>,
        ),
        row(
            "admin-api PATCH /api/v1/admin/notification-webhooks/{uuid}",
            "/api/v1/admin/notification-webhooks/u-1?companySlug=acme",
            |c| {
                drop(c.custd.update_notification_webhook(
                    "u-1",
                    &body::<NotificationWebhookEnabledRequest>(r#"{"enabled":true}"#),
                    Some("acme"),
                ))
            },
            round_trip::<NotificationWebhookSubscription>,
        ),
        bodiless(
            "admin-api DELETE /api/v1/admin/notification-webhooks/{uuid}",
            "/api/v1/admin/notification-webhooks/u-1",
            |c| drop(c.custd.delete_notification_webhook("u-1")),
        ),
        row(
            "admin-api POST /api/v1/admin/notification-webhooks/{uuid}/rotate-secret",
            "/api/v1/admin/notification-webhooks/u-1/rotate-secret?companySlug=acme",
            |c| {
                drop(
                    c.custd
                        .rotate_notification_webhook_secret("u-1", Some("acme")),
                )
            },
            round_trip::<NotificationWebhookSecret>,
        ),
        row(
            "admin-api GET /api/v1/admin/notification-deliveries/{uuid}",
            "/api/v1/admin/notification-deliveries/u-1?companySlug=acme",
            |c| drop(c.custd.get_notification_delivery("u-1", Some("acme"))),
            round_trip::<NotificationDeliveryStatus>,
        ),
        row(
            "admin-api GET /api/v1/notification-destinations/{eventSlug}",
            "/api/v1/notification-destinations/error_issue_alert?companySlug=acme",
            |c| {
                drop(c.custd.get_notification_destination(
                    NotificationDestinationEventSlug::ErrorIssueAlert,
                    Some("acme"),
                ))
            },
            round_trip::<TenantDestination>,
        ),
        row(
            "admin-api PUT /api/v1/notification-destinations/{eventSlug}",
            "/api/v1/notification-destinations/error_issue_alert?companySlug=acme",
            |c| {
                drop(c.custd.put_notification_destination(
                    NotificationDestinationEventSlug::ErrorIssueAlert,
                    &body::<TenantDestinationRequest>(r#"{"channel":"x","enabled":true}"#),
                    Some("acme"),
                ))
            },
            round_trip::<TenantDestination>,
        ),
    ]
}
