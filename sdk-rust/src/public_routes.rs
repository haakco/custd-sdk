//! Routes that take no Custd bearer token: a Site's public config, a shared site report, a hosted
//! app host's discovery document, the auth-domain monitoring inventory (its own key header), the
//! alert email unsubscribe page, and a published status page and its email subscriptions. Each
//! takes the API origin, such as `https://api.custd.com`.

use serde::{Deserialize, Serialize};

use crate::client::{call_public, execute, json_request, trim_base_url};
use crate::measurement::null_as_empty;
use crate::transport::{Method, UreqTransport, percent_encode};
use crate::{
    AppAlertUnsubscribeRequest, HostedAppDiscovery, Result, SiteConfigResponse, SiteReport,
    SiteStatusPage,
};

const AUTH_DOMAIN_MONITORING_KEY_HEADER: &str = "X-Custd-Auth-Domain-Monitoring-Key";

/// The enrolled sign-in hosts an external checker may probe anonymously.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthDomainMonitoringInventory {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub hosts: Vec<String>,
    /// Hosts being retired, or retired in the last 25 hours. A host that leaves `hosts` without
    /// appearing here was lost, not retired.
    #[serde(default, deserialize_with = "null_as_empty")]
    pub retired_hosts: Vec<String>,
}

/// Asks a published status page to email its updates to one address.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct SiteStatusSubscriptionRequest {
    pub email: String,
}

/// The single-use token from a status page subscription email.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct SiteStatusSubscriptionToken {
    pub token: String,
}

/// The HTML page an alert email's unsubscribe link opens.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AppAlertUnsubscribePage {
    pub html: String,
}

/// Read a Site's public browser config.
pub fn get_site_config(base_url: &str, site_uuid: &str) -> Result<SiteConfigResponse> {
    let path = format!("/api/v1/sites/{}/config", percent_encode(site_uuid));
    call_public(base_url, Method::Get, &path, Vec::new(), None::<&()>)
}

/// Read the site report a share link's token opens.
pub fn read_shared_site_report(base_url: &str, token: &str) -> Result<SiteReport> {
    let path = format!("/api/v1/shared-site-reports/{}", percent_encode(token));
    call_public(base_url, Method::Get, &path, Vec::new(), None::<&()>)
}

/// Read the discovery document Custd serves for a hosted application's host.
pub fn read_app_host_discovery(base_url: &str, host: &str) -> Result<HostedAppDiscovery> {
    let path = format!("/api/v1/app-hosts/{}/discovery", percent_encode(host));
    call_public(base_url, Method::Get, &path, Vec::new(), None::<&()>)
}

/// Read the sign-in hosts to monitor, with the monitoring key.
pub fn read_auth_domain_monitoring_inventory(
    base_url: &str,
    monitoring_key: &str,
) -> Result<AuthDomainMonitoringInventory> {
    let headers = vec![(AUTH_DOMAIN_MONITORING_KEY_HEADER, monitoring_key.to_owned())];
    call_public(
        base_url,
        Method::Get,
        "/api/v1/auth-domain-monitoring/inventory",
        headers,
        None::<&()>,
    )
}

/// Open an alert email's unsubscribe page; opening it changes nothing.
pub fn get_app_alert_unsubscribe_page(
    base_url: &str,
    token: Option<&str>,
) -> Result<AppAlertUnsubscribePage> {
    let mut url = format!(
        "{}/api/v1/app/item/alerts/unsubscribe",
        trim_base_url(base_url.to_owned())
    );
    if let Some(token) = token.filter(|token| !token.is_empty()) {
        url = format!("{url}?token={}", percent_encode(token));
    }
    let request = json_request(Method::Get, url, Vec::new(), None::<&()>)?;
    let response = execute(&UreqTransport::new(), &request)?;
    Ok(AppAlertUnsubscribePage {
        html: String::from_utf8_lossy(&response.body).into_owned(),
    })
}

/// Stop the email subscription an unsubscribe token names. Repeating it succeeds.
pub fn unsubscribe_app_alert_email(
    base_url: &str,
    request: &AppAlertUnsubscribeRequest,
) -> Result<()> {
    call_public(
        base_url,
        Method::Post,
        "/api/v1/app/item/alerts/unsubscribe",
        Vec::new(),
        Some(request),
    )
}

/// Read a published status page by its public key; an unpublished key answers 404.
pub fn read_public_status_page(base_url: &str, key: &str) -> Result<SiteStatusPage> {
    call_public(
        base_url,
        Method::Get,
        &status_page_path(key, ""),
        Vec::new(),
        None::<&()>,
    )
}

/// Ask for a confirmation email. Custd answers the same for an unknown key, so success does not
/// prove the page exists.
pub fn subscribe_to_status_page(
    base_url: &str,
    key: &str,
    request: &SiteStatusSubscriptionRequest,
) -> Result<()> {
    let path = status_page_path(key, "/subscribe");
    call_public(base_url, Method::Post, &path, Vec::new(), Some(request))
}

/// Confirm a status page subscription with the emailed token.
pub fn confirm_status_page_subscription(
    base_url: &str,
    key: &str,
    token: &SiteStatusSubscriptionToken,
) -> Result<()> {
    let path = status_page_path(key, "/confirm-subscription");
    call_public(base_url, Method::Post, &path, Vec::new(), Some(token))
}

/// End a status page subscription with the emailed token.
pub fn unsubscribe_from_status_page(
    base_url: &str,
    key: &str,
    token: &SiteStatusSubscriptionToken,
) -> Result<()> {
    let path = status_page_path(key, "/unsubscribe");
    call_public(base_url, Method::Post, &path, Vec::new(), Some(token))
}

fn status_page_path(key: &str, action: &str) -> String {
    format!(
        "/api/v1/public-status-pages/{}{action}",
        percent_encode(key)
    )
}
