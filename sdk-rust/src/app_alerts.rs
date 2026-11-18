//! Alerts on an app item (`/api/v1/app/item/alerts`): rules that fire once each time their
//! condition becomes true, signed webhooks, the signed-in owner's email subscription, and the
//! deliveries they made. Every alert route needs the owner link or the owning user.

use std::fmt;

use serde::{Deserialize, Serialize};

use crate::Result;
use crate::app::{AppLink, NO_BODY};
use crate::measurement::null_as_empty;
use crate::transport::{Method, percent_encode};

pub const APP_ALERT_RULE_DEADLINE_PROBABILITY_BELOW: &str = "deadline_probability_below";
pub const APP_ALERT_RULE_TARGET_REACHED: &str = "target_reached";
pub const APP_ALERT_RULE_ESTIMATE_STALE: &str = "estimate_stale";
pub const APP_ALERT_RULE_FORECAST_MOVED_INSIDE_TARGET: &str = "forecast_moved_inside_target";

/// 422: the signed-in user has no verified email address to send alerts to.
pub const APP_ALERT_NO_VERIFIED_EMAIL: &str = "app_alert_no_verified_email";
/// 503: the user's email address could not be checked right now; retry.
pub const APP_ALERT_EMAIL_CHECK_UNAVAILABLE: &str = "app_alert_email_check_unavailable";
/// 422: the item holds as many rules, webhooks or subscriptions as it may.
pub const APP_ALERT_LIMIT: &str = "app_alert_limit";

/// A rule's type and parameters.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppAlertRuleSpec {
    /// One of the `APP_ALERT_RULE_*` types.
    #[serde(rename = "type")]
    pub rule_type: String,
    /// Chance from 0 to 1 (exclusive); `deadline_probability_below` only.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub threshold: Option<f64>,
    /// Days without a new estimate, 1 to 365; `estimate_stale` only.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub stale_days: Option<i64>,
}

/// One rule and the state it last saw. It fires again only after `condition_met` clears.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppAlertRule {
    pub rule_uuid: String,
    #[serde(flatten)]
    pub spec: AppAlertRuleSpec,
    pub condition_met: bool,
    pub crossings: i64,
    pub created_at: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppAlertWebhook {
    pub webhook_uuid: String,
    pub endpoint: String,
    pub created_at: String,
}

/// A new webhook and its signing secret, shown only this once. Each delivery carries
/// `X-Custd-Signature: v1=<hex HMAC-SHA256 of "<timestamp>.<body>">` under the secret.
#[derive(Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppAlertWebhookCreated {
    pub webhook: AppAlertWebhook,
    pub signing_secret: String,
}

/// The signed-in user's email subscription; the address is their verified one.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppAlertSubscription {
    pub subscription_uuid: String,
    pub created_at: String,
}

/// Everything an owner manages on the item's alerts.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppAlertSettings {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub rules: Vec<AppAlertRule>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub webhooks: Vec<AppAlertWebhook>,
    /// The signed-in caller's own subscription, if any.
    pub subscription: Option<AppAlertSubscription>,
    /// Whether this deployment can deliver webhooks and email at all.
    pub delivery_available: bool,
}

/// One delivery of one rule crossing to one destination. `channel` is `webhook` or `email`;
/// `outcome` is `pending`, `sent` or `failed`.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppAlertDelivery {
    /// Matches the webhook's `X-Custd-Delivery-Id`.
    pub delivery_uuid: String,
    pub rule_uuid: String,
    pub rule_type: String,
    pub crossing: i64,
    pub channel: String,
    pub webhook_uuid: Option<String>,
    pub outcome: String,
    pub attempts: i64,
    pub last_error_class: Option<String>,
    pub last_status_code: Option<u16>,
    pub created_at: String,
    pub updated_at: String,
}

/// The item's newest deliveries, at most 100.
#[derive(Debug, Clone, Deserialize)]
pub struct AppAlertDeliveryList {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub deliveries: Vec<AppAlertDelivery>,
}

#[derive(Serialize)]
struct AppAlertWebhookCreate<'a> {
    endpoint: &'a str,
}

impl AppLink<'_> {
    /// The item's rules, webhooks and the signed-in caller's email subscription.
    pub fn alert_settings(&self) -> Result<AppAlertSettings> {
        self.write(Method::Get, "/alerts", NO_BODY)
    }

    /// The item's newest deliveries.
    pub fn alert_deliveries(&self) -> Result<AppAlertDeliveryList> {
        self.write(Method::Get, "/alerts/deliveries", NO_BODY)
    }

    /// Adds a rule; at most 10 per item.
    pub fn add_alert_rule(&self, rule: &AppAlertRuleSpec) -> Result<AppAlertRule> {
        self.write(Method::Post, "/alerts/rules", Some(rule))
    }

    /// Removes a rule and its delivery history.
    pub fn remove_alert_rule(&self, rule_uuid: &str) -> Result<()> {
        let suffix = format!("/alerts/rules/{}", percent_encode(rule_uuid));
        self.write(Method::Delete, &suffix, NO_BODY)
    }

    /// Registers a signed webhook at an HTTPS `endpoint`; at most 5 per item.
    pub fn add_alert_webhook(&self, endpoint: &str) -> Result<AppAlertWebhookCreated> {
        let body = AppAlertWebhookCreate { endpoint };
        self.write(Method::Post, "/alerts/webhooks", Some(&body))
    }

    /// Removes a webhook; its undelivered alerts go with it.
    pub fn remove_alert_webhook(&self, webhook_uuid: &str) -> Result<()> {
        let suffix = format!("/alerts/webhooks/{}", percent_encode(webhook_uuid));
        self.write(Method::Delete, &suffix, NO_BODY)
    }

    /// Emails the signed-in user's verified address when a rule fires. Needs
    /// [`crate::AppClient::with_user_token`]; refused with [`APP_ALERT_NO_VERIFIED_EMAIL`] or a
    /// retryable [`APP_ALERT_EMAIL_CHECK_UNAVAILABLE`].
    pub fn subscribe_alert_email(&self) -> Result<AppAlertSubscription> {
        self.write(Method::Put, "/alerts/subscription", NO_BODY)
    }

    /// Stops the signed-in user's alert email. Repeating it succeeds.
    pub fn unsubscribe_alert_email(&self) -> Result<()> {
        self.write(Method::Delete, "/alerts/subscription", NO_BODY)
    }
}

impl fmt::Debug for AppAlertWebhookCreated {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("AppAlertWebhookCreated")
            .field("webhook", &self.webhook)
            .field("signing_secret", &"<redacted>")
            .finish()
    }
}
