//! Reports a heartbeat or private uptime monitor sends with its own write credential: a scheduled
//! job's result, a private probe's observation, and the probe's pending check work.
//!
//! The report path and token come from the monitor's credential
//! ([`crate::SiteHeartbeatCredential`] or [`crate::SitePrivateUptimeCredential`]); no Custd bearer
//! token or company is sent. The shapes follow the admin-api handlers.

use serde::Serialize;
use serde::de::DeserializeOwned;

use crate::client::{decode, execute, json_request, trim_base_url};
use crate::error::Error;
use crate::transport::{Method, UreqTransport};
use crate::{
    Result, SiteHeartbeatReceipt, SiteHeartbeatReport, SitePrivateUptimeReport,
    SitePrivateUptimeWork,
};

const HEARTBEAT_REPORTS: &str = "/api/v1/site-heartbeat-reports/";
const PRIVATE_UPTIME_REPORTS: &str = "/api/v1/site-private-uptime-reports/";
const WRITE_TOKEN_LENGTH: usize = 64;

/// Where one monitor reports: the API origin, such as `https://api.custd.com`, and the report path
/// and write token from the monitor's credential.
#[derive(Clone)]
pub struct SiteMonitorDestination {
    pub base_url: String,
    pub report_path: String,
    pub write_token: String,
}

impl std::fmt::Debug for SiteMonitorDestination {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("SiteMonitorDestination")
            .field("base_url", &self.base_url)
            .field("report_path", &self.report_path)
            .field("write_token", &"<redacted>")
            .finish()
    }
}

/// Send a scheduled job's result and return the first accepted receipt for that occurrence.
pub fn submit_site_heartbeat(
    destination: &SiteMonitorDestination,
    report: &SiteHeartbeatReport,
) -> Result<SiteHeartbeatReceipt> {
    let receipt: SiteHeartbeatReceipt =
        send(destination, HEARTBEAT_REPORTS, Method::Post, Some(report))?;
    if receipt.received_at.is_empty() || receipt.report.outcome != report.outcome {
        return Err(Error::InvalidResponse(
            "the heartbeat receipt does not match the submitted occurrence".to_owned(),
        ));
    }
    Ok(receipt)
}

/// Send a private probe's observation.
pub fn submit_private_uptime(
    destination: &SiteMonitorDestination,
    report: &SitePrivateUptimeReport,
) -> Result<()> {
    send(
        destination,
        PRIVATE_UPTIME_REPORTS,
        Method::Post,
        Some(report),
    )
}

/// Read the check the private probe should run now, if any.
pub fn get_private_uptime_work(
    destination: &SiteMonitorDestination,
) -> Result<SitePrivateUptimeWork> {
    send(
        destination,
        PRIVATE_UPTIME_REPORTS,
        Method::Get,
        None::<&()>,
    )
}

/// Sends to the credential's own report path only, so the token never reaches another route.
fn send<T: DeserializeOwned>(
    destination: &SiteMonitorDestination,
    prefix: &str,
    method: Method,
    body: Option<&impl Serialize>,
) -> Result<T> {
    let segments: Vec<&str> = destination
        .report_path
        .strip_prefix(prefix)
        .map(|rest| rest.split('/').collect())
        .unwrap_or_default();
    let valid_path = segments.len() == 2
        && segments.iter().all(|segment| {
            !matches!(*segment, "" | "." | "..") && !segment.contains(['\\', '?', '#', '%'])
        });
    if !valid_path || destination.write_token.len() != WRITE_TOKEN_LENGTH {
        return Err(Error::InvalidInput(
            "a site monitor needs its report path and write token".to_owned(),
        ));
    }
    let url = format!(
        "{}{}",
        trim_base_url(destination.base_url.clone()),
        destination.report_path
    );
    let headers = vec![(
        "Authorization",
        format!("Bearer {}", destination.write_token),
    )];
    let request = json_request(method, url, headers, body)?;
    decode(&execute(&UreqTransport::new(), &request)?.body)
}
