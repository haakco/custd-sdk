//! A hosted app's discovery file, `/.well-known/custd.json` on the app's own origin: where its
//! API is, its public Site key and what it may do. It holds no secret.

use serde::Deserialize;

use crate::Result;
use crate::client::{decode, execute, json_request, trim_base_url};
use crate::transport::{Method, Transport, UreqTransport};

pub const HOSTED_APP_DISCOVERY_PATH: &str = "/.well-known/custd.json";

/// `/.well-known/custd.json` as Custd serves it for a hosted environment. Fields a newer
/// backend adds are ignored.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HostedAppDiscovery {
    pub api_base_url: String,
    pub host: String,
    pub site_uuid: String,
    /// The Site's public browser write key (`site_pk_...`).
    pub browser_key: String,
    pub environment: String,
    /// `tracking`, `error_capture`, `app_data`, `sign_in`, and any a newer backend adds.
    #[serde(default)]
    pub capabilities: Vec<String>,
    pub sign_in: Option<HostedAppSignIn>,
    /// The origins the app's Site accepts; send one as [`crate::AppClient`]'s `origin`.
    #[serde(default)]
    pub allowed_origins: Vec<String>,
}

/// The hosted environment's own directory's OAuth public client.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HostedAppSignIn {
    pub issuer: String,
    pub authorization_endpoint: String,
    pub token_endpoint: String,
    pub end_session_endpoint: Option<String>,
    pub client_id: String,
    pub audience: String,
    pub redirect_uri: String,
}

/// Reads the discovery file of the app at `app_origin`, such as `https://counter.apps.custd.com`.
pub fn read_hosted_app_discovery(app_origin: &str) -> Result<HostedAppDiscovery> {
    read_with(&UreqTransport::new(), app_origin)
}

fn read_with(transport: &dyn Transport, app_origin: &str) -> Result<HostedAppDiscovery> {
    let url = format!(
        "{}{HOSTED_APP_DISCOVERY_PATH}",
        trim_base_url(app_origin.to_owned())
    );
    let request = json_request(Method::Get, url, Vec::new(), None::<&()>)?;
    decode(&execute(transport, &request)?.body)
}
