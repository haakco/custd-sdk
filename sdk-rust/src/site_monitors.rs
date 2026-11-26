//! A domain's uptime: incidents, heartbeats, private uptime, maintenance, probes and alerts.
//!
//! Request and response shapes follow the admin-api OpenAPI document. A system administrator
//! names the tenant with `company_slug`, sent as `?companySlug=`; a tenant credential passes `None`.

use serde::{Deserialize, Serialize};

use crate::Result;
use crate::api_path::{NO_BODY, SITE_DOMAINS, api_path};
use crate::client::CustdClient;
use crate::measurement::null_as_empty;
use crate::site_domains::{SiteDomain, SiteIncident};
use crate::transport::{Method, percent_encode};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteIncidentListResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub incidents: Vec<SiteIncident>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteHeartbeatList {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub monitors: Vec<SiteHeartbeatMonitor>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteHeartbeatMonitor {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub latest: Option<SiteHeartbeatReceipt>,
    pub monitor_uuid: String,
    pub name: String,
    pub next_expected_at: String,
    pub schedule: SiteHeartbeatSchedule,
    pub started_at: String,
    pub status: SiteHeartbeatMonitorStatus,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteHeartbeatReceipt {
    pub received_at: String,
    pub report: SiteHeartbeatReport,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteHeartbeatSchedule {
    /// Five-field cron expression in the configured timezone.
    pub cron: String,
    pub grace_minutes: i64,
    /// IANA timezone for the job's schedule.
    pub timezone: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteHeartbeatReport {
    pub outcome: SiteHeartbeatReportOutcome,
    pub scheduled_for: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteHeartbeatCreate {
    pub name: String,
    pub schedule: SiteHeartbeatSchedule,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteHeartbeatCredential {
    pub monitor: SiteHeartbeatMonitor,
    pub report_path: String,
    pub token: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SitePrivateUptimeMonitor {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub latest: Option<SitePrivateUptimeReport>,
    pub monitor_uuid: String,
    pub network_label: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub requested_at: Option<String>,
    pub status: SitePrivateUptimeMonitorStatus,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SitePrivateUptimeReport {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub failure: Option<SitePrivateUptimeReportFailure>,
    pub observed_at: String,
    pub report_uuid: String,
    pub response_ms: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub status_code: Option<i64>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SitePrivateUptimeMonitorCreate {
    pub network_label: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SitePrivateUptimeCredential {
    pub monitor: SitePrivateUptimeMonitor,
    pub report_path: String,
    pub token: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SitePrivateUptimeWork {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub requested_at: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteMaintenanceWindows {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub windows: Vec<SiteMaintenanceWindow>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteMaintenanceWindow {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub cancelled_at: Option<String>,
    pub ends_at: String,
    pub starts_at: String,
    pub window_uuid: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteMaintenanceWindowRequest {
    pub ends_at: String,
    pub starts_at: String,
    pub window_uuid: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteProbeListResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub probes: Vec<SiteProbe>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteProbe {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub detail: Option<SiteProbeDetail>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub expected_addresses: Vec<String>,
    pub kind: SiteProbeKind,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_checked_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_failure: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub port: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub protocol: Option<SiteProbeProtocol>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub response_ms: Option<i64>,
    pub status: SiteProbeStatus,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteProbeDetail {
    /// Every address a dns probe resolved.
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub addresses: Vec<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub bytes_read: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub cache: Option<SiteDeliveryCache>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub missing_addresses: Vec<String>,
    /// http/1.1 or h2.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub negotiated_protocol: Option<String>,
    /// The address connected to, or the first address resolved.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub resolved_ip: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub status_code: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub timings: Option<SiteDeliveryTimings>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub tls_version: Option<String>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub unexpected_addresses: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteDeliveryCache {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub age: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub cache_control: Option<String>,
    /// Cache-Status, X-Cache or CF-Cache-Status, the first present.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub cache_status: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub server: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub via: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteDeliveryTimings {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub connect_ms: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub dns_ms: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub first_byte_ms: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub tls_ms: Option<i64>,
    pub total_ms: i64,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteProbesRequest {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub probes: Vec<SiteProbeSpec>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteProbeSpec {
    /// Exact public A and AAAA addresses for a DNS probe.
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub expected_addresses: Vec<String>,
    pub kind: SiteProbeKind,
    /// The port a tcp probe connects to, 1-65535.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub port: Option<i64>,
    /// The protocol an http-delivery probe requires.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub protocol: Option<SiteProbeProtocol>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteUptimeHistory {
    /// Ninety UTC days, oldest first, ending today.
    #[serde(default, deserialize_with = "null_as_empty")]
    pub days: Vec<SiteUptimeDay>,
    pub domain_uuid: String,
    pub generated_at: String,
    /// Each hour with a check in the response window, oldest first.
    #[serde(default, deserialize_with = "null_as_empty")]
    pub hours: Vec<SiteResponseHour>,
    /// When uptime checks started; absent before the first.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub monitored_since: Option<String>,
    pub response_days: i64,
    pub windows: SiteUptimeWindows,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteUptimeDay {
    pub checks: i64,
    /// UTC day, YYYY-MM-DD.
    pub date: String,
    pub up_checks: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub up_percent: Option<f64>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteResponseHour {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub avg_ms: Option<i64>,
    pub checks: i64,
    pub hour_start: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub max_ms: Option<i64>,
    pub up_checks: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteUptimeWindows {
    pub last24h: SiteUptimeWindow,
    pub last30d: SiteUptimeWindow,
    pub last7d: SiteUptimeWindow,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteUptimeWindow {
    pub checks: i64,
    pub up_checks: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub up_percent: Option<f64>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteAlertDestination {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub email_recipient: Option<String>,
    pub site_uuid: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteAlertDestinationRequest {
    pub email_recipient: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SiteHeartbeatMonitorStatus {
    #[serde(rename = "pending")]
    Pending,
    #[serde(rename = "on-time")]
    OnTime,
    #[serde(rename = "late")]
    Late,
    #[serde(rename = "missed")]
    Missed,
    #[serde(rename = "failed")]
    Failed,
}

impl SiteHeartbeatMonitorStatus {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Pending => "pending",
            Self::OnTime => "on-time",
            Self::Late => "late",
            Self::Missed => "missed",
            Self::Failed => "failed",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SiteHeartbeatReportOutcome {
    #[serde(rename = "succeeded")]
    Succeeded,
    #[serde(rename = "failed")]
    Failed,
}

impl SiteHeartbeatReportOutcome {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Succeeded => "succeeded",
            Self::Failed => "failed",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SitePrivateUptimeMonitorStatus {
    #[serde(rename = "unknown")]
    Unknown,
    #[serde(rename = "up")]
    Up,
    #[serde(rename = "down")]
    Down,
}

impl SitePrivateUptimeMonitorStatus {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Unknown => "unknown",
            Self::Up => "up",
            Self::Down => "down",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SitePrivateUptimeReportFailure {
    #[serde(rename = "dns")]
    Dns,
    #[serde(rename = "connection")]
    Connection,
    #[serde(rename = "tls")]
    Tls,
    #[serde(rename = "timeout")]
    Timeout,
}

impl SitePrivateUptimeReportFailure {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Dns => "dns",
            Self::Connection => "connection",
            Self::Tls => "tls",
            Self::Timeout => "timeout",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SiteProbeKind {
    #[serde(rename = "ping")]
    Ping,
    #[serde(rename = "tcp")]
    Tcp,
    #[serde(rename = "dns")]
    Dns,
    #[serde(rename = "http-delivery")]
    HttpDelivery,
}

impl SiteProbeKind {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Ping => "ping",
            Self::Tcp => "tcp",
            Self::Dns => "dns",
            Self::HttpDelivery => "http-delivery",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SiteProbeProtocol {
    #[serde(rename = "http1.1")]
    Http11,
    #[serde(rename = "http2")]
    Http2,
}

impl SiteProbeProtocol {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Http11 => "http1.1",
            Self::Http2 => "http2",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SiteProbeStatus {
    #[serde(rename = "unknown")]
    Unknown,
    #[serde(rename = "up")]
    Up,
    #[serde(rename = "down")]
    Down,
    #[serde(rename = "paused")]
    Paused,
}

impl SiteProbeStatus {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Unknown => "unknown",
            Self::Up => "up",
            Self::Down => "down",
            Self::Paused => "paused",
        }
    }
}

impl CustdClient {
    /// List a domain's recent outages, newest first.
    pub fn list_site_incidents(
        &self,
        domain_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<SiteIncidentListResponse> {
        let path = api_path(
            format!("{SITE_DOMAINS}/{}/incidents", percent_encode(domain_uuid)),
            &[],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Record acknowledgment of an open uptime incident.
    pub fn acknowledge_site_incident(
        &self,
        incident_uuid: &str,
        domain_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<SiteIncident> {
        let path = api_path(
            format!(
                "{SITE_DOMAINS}/{}/incidents/{}/acknowledgment",
                percent_encode(domain_uuid),
                percent_encode(incident_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, NO_BODY)
    }

    /// Queue an uptime check for a verified domain with active checks.
    pub fn request_site_uptime_check(
        &self,
        domain_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<SiteDomain> {
        let path = api_path(
            format!(
                "{SITE_DOMAINS}/{}/uptime-check",
                percent_encode(domain_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, NO_BODY)
    }

    /// List a domain’s heartbeat monitors and latest receipts.
    pub fn list_site_heartbeats(
        &self,
        domain_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<SiteHeartbeatList> {
        let path = api_path(
            format!("{SITE_DOMAINS}/{}/heartbeats", percent_encode(domain_uuid)),
            &[],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Create a job monitor and return its one-time write credential.
    pub fn create_site_heartbeat(
        &self,
        domain_uuid: &str,
        request: &SiteHeartbeatCreate,
        company_slug: Option<&str>,
    ) -> Result<SiteHeartbeatCredential> {
        let path = api_path(
            format!("{SITE_DOMAINS}/{}/heartbeats", percent_encode(domain_uuid)),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Replace the monitor’s write credential.
    pub fn rotate_site_heartbeat(
        &self,
        monitor_uuid: &str,
        domain_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<SiteHeartbeatCredential> {
        let path = api_path(
            format!(
                "{SITE_DOMAINS}/{}/heartbeats/{}/credential",
                percent_encode(domain_uuid),
                percent_encode(monitor_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, NO_BODY)
    }

    /// Remove a job monitor and revoke its write credential.
    pub fn delete_site_heartbeat(
        &self,
        monitor_uuid: &str,
        domain_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<()> {
        let path = api_path(
            format!(
                "{SITE_DOMAINS}/{}/heartbeats/{}",
                percent_encode(domain_uuid),
                percent_encode(monitor_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Delete, &path, NO_BODY)
    }

    /// Read the private uptime monitor and its latest result.
    pub fn get_private_uptime(
        &self,
        domain_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<SitePrivateUptimeMonitor> {
        let path = api_path(
            format!(
                "{SITE_DOMAINS}/{}/private-uptime",
                percent_encode(domain_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Create a private monitor and return its one-time write credential.
    pub fn create_private_uptime(
        &self,
        domain_uuid: &str,
        request: &SitePrivateUptimeMonitorCreate,
        company_slug: Option<&str>,
    ) -> Result<SitePrivateUptimeCredential> {
        let path = api_path(
            format!(
                "{SITE_DOMAINS}/{}/private-uptime",
                percent_encode(domain_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Replace the private monitor’s write credential.
    pub fn rotate_private_uptime(
        &self,
        monitor_uuid: &str,
        domain_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<SitePrivateUptimeCredential> {
        let path = api_path(
            format!(
                "{SITE_DOMAINS}/{}/private-uptime/{}/credential",
                percent_encode(domain_uuid),
                percent_encode(monitor_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, NO_BODY)
    }

    /// Remove the private monitor and revoke its write credential.
    pub fn delete_private_uptime(
        &self,
        monitor_uuid: &str,
        domain_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<()> {
        let path = api_path(
            format!(
                "{SITE_DOMAINS}/{}/private-uptime/{}",
                percent_encode(domain_uuid),
                percent_encode(monitor_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Delete, &path, NO_BODY)
    }

    /// Request a new observation from the private network probe.
    pub fn request_private_uptime(
        &self,
        domain_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<SitePrivateUptimeWork> {
        let path = api_path(
            format!(
                "{SITE_DOMAINS}/{}/private-uptime/check",
                percent_encode(domain_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, NO_BODY)
    }

    /// List a domain's maintenance windows, upcoming and active first.
    pub fn list_site_maintenance(
        &self,
        domain_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<SiteMaintenanceWindows> {
        let path = api_path(
            format!("{SITE_DOMAINS}/{}/maintenance", percent_encode(domain_uuid)),
            &[],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Schedule a one-off maintenance window for a verified domain.
    pub fn schedule_site_maintenance(
        &self,
        domain_uuid: &str,
        request: &SiteMaintenanceWindowRequest,
        company_slug: Option<&str>,
    ) -> Result<SiteMaintenanceWindow> {
        let path = api_path(
            format!("{SITE_DOMAINS}/{}/maintenance", percent_encode(domain_uuid)),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Cancel an upcoming or active maintenance window.
    pub fn cancel_site_maintenance(
        &self,
        domain_uuid: &str,
        window_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<SiteMaintenanceWindow> {
        let path = api_path(
            format!(
                "{SITE_DOMAINS}/{}/maintenance/{}",
                percent_encode(domain_uuid),
                percent_encode(window_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Delete, &path, NO_BODY)
    }

    /// List a domain's network probes (ping, tcp, dns, http-delivery) and their latest results.
    pub fn list_site_probes(
        &self,
        domain_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<SiteProbeListResponse> {
        let path = api_path(
            format!("{SITE_DOMAINS}/{}/probes", percent_encode(domain_uuid)),
            &[],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Replace a domain's network probes; an empty list turns them off.
    pub fn set_site_probes(
        &self,
        domain_uuid: &str,
        request: &SiteProbesRequest,
        company_slug: Option<&str>,
    ) -> Result<SiteProbeListResponse> {
        let path = api_path(
            format!("{SITE_DOMAINS}/{}/probes", percent_encode(domain_uuid)),
            &[],
            company_slug,
        );
        self.call(Method::Put, &path, Some(request))
    }

    /// Get a domain's uptime percentages, ninety daily bars and hourly response times.
    pub fn get_site_uptime_history(
        &self,
        domain_uuid: &str,
        response_days: Option<i64>,
        company_slug: Option<&str>,
    ) -> Result<SiteUptimeHistory> {
        let path = api_path(
            format!(
                "{SITE_DOMAINS}/{}/uptime-history",
                percent_encode(domain_uuid)
            ),
            &[("responseDays", response_days.map(|v| v.to_string()))],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Get the email address a Site's alerts go to.
    pub fn get_site_alert_destination(
        &self,
        site_uuid: Option<&str>,
        company_slug: Option<&str>,
    ) -> Result<SiteAlertDestination> {
        let path = api_path(
            format!("{SITE_DOMAINS}/alert-destination"),
            &[("siteUuid", site_uuid.map(str::to_owned))],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Send a Site's finding and outage alerts to its own email address, or clear it.
    pub fn set_site_alert_destination(
        &self,
        site_uuid: Option<&str>,
        request: &SiteAlertDestinationRequest,
        company_slug: Option<&str>,
    ) -> Result<SiteAlertDestination> {
        let path = api_path(
            format!("{SITE_DOMAINS}/alert-destination"),
            &[("siteUuid", site_uuid.map(str::to_owned))],
            company_slug,
        );
        self.call(Method::Put, &path, Some(request))
    }
}
