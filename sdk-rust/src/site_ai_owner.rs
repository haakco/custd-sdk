//! A data-space owner's Site Insights AI settings, reached through a broker handoff.
//!
//! An approved data-space broker issues a one-minute handoff ([`CustdClient::create_site_ai_owner_handoff`]),
//! and [`redeem_site_ai_owner_handoff`] turns it into a [`SiteAIOwnerSession`]. The session carries
//! its own cookie and write binding; it never sends the broker's credential or a company. The
//! handoff shapes follow the admin-api OpenAPI document; the session shapes follow its handlers.

use serde::de::DeserializeOwned;
use serde::{Deserialize, Serialize};

use crate::client::{CustdClient, checked, decode, execute, json_request};
use crate::error::Error;
use crate::transport::{HttpRequest, Method, Transport, UreqTransport, form_body};
use crate::{Result, SDK_IDENTITY, SiteAIConsentRequest, SiteAISettings, SiteAISettingsRequest};

const HANDOFF_PATH: &str = "/api/v1/site-domains/ai-owner-handoffs";
const OWNER_PATH: &str = "/api/v1/site-ai-owner";
const SESSION_COOKIE: &str = "__Host-custd-site-ai-owner";
const BINDING_HEADER: &str = "X-Custd-Site-AI-Session";

/// Asks for a handoff that lets one owner of a data space the calling broker manages change that
/// tenant's AI settings.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteAIOwnerHandoffRequest {
    /// Slug of a data space the calling broker owns.
    pub tenant_slug: String,
    /// The broker's opaque owner identifier: 1-96 of A-Z, a-z, 0-9, `_` or `-`.
    pub owner_subject: String,
}

/// A single-use handoff code, valid for one minute, and the address it is redeemed at.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteAIOwnerHandoffResponse {
    pub code: String,
    pub redeem_url: String,
}

/// The session's tenant, its write binding and the tenant's current AI settings.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteAIOwnerSettings {
    pub tenant_slug: String,
    pub session_binding: String,
    pub settings: SiteAISettings,
}

/// A signed-in AI settings session opened by redeeming a handoff.
pub struct SiteAIOwnerSession {
    origin: String,
    handle: String,
    binding: Option<String>,
}

impl CustdClient {
    /// Issue an AI settings handoff (approved data-space brokers). The tenant comes from the
    /// request body, so no company is sent.
    pub fn create_site_ai_owner_handoff(
        &self,
        request: &SiteAIOwnerHandoffRequest,
    ) -> Result<SiteAIOwnerHandoffResponse> {
        self.call(Method::Post, HANDOFF_PATH, Some(request))
    }
}

/// Open an owner session from a handoff. `hub_origin` is the broker's registered hub origin the
/// handoff was issued for; Custd answers a redeem with `303` and the session cookie.
pub fn redeem_site_ai_owner_handoff(
    handoff: &SiteAIOwnerHandoffResponse,
    hub_origin: &str,
) -> Result<SiteAIOwnerSession> {
    let origin = owner_origin(&handoff.redeem_url)?;
    if handoff.code.is_empty() || hub_origin.is_empty() {
        return Err(Error::InvalidInput(
            "an AI owner handoff needs a code and the hub origin".to_owned(),
        ));
    }
    let request = HttpRequest {
        method: Method::Post,
        url: handoff.redeem_url.clone(),
        headers: vec![
            (
                "Content-Type",
                "application/x-www-form-urlencoded".to_owned(),
            ),
            ("Origin", hub_origin.to_owned()),
            ("X-Custd-Sdk", SDK_IDENTITY.to_owned()),
        ],
        body: Some(form_body(&[("code", &handoff.code)])),
    };
    let response = UreqTransport::new()
        .send(&request)
        .map_err(|error| Error::Transport(error.message().to_owned()))?;
    if response.status != 303 {
        checked(response)?;
        return Err(Error::InvalidResponse(
            "an AI owner redeem must answer 303".to_owned(),
        ));
    }
    let handle = response
        .header("set-cookie")
        .and_then(|cookie| cookie.split(';').next())
        .and_then(|pair| pair.trim().strip_prefix(SESSION_COOKIE)?.strip_prefix('='))
        .filter(|value| !value.is_empty())
        .ok_or_else(|| Error::InvalidResponse("the AI owner redeem set no session".to_owned()))?;
    Ok(SiteAIOwnerSession {
        origin,
        handle: handle.to_owned(),
        binding: None,
    })
}

impl SiteAIOwnerSession {
    /// Read the session tenant's AI settings and refresh the write binding.
    pub fn get_settings(&mut self) -> Result<SiteAIOwnerSettings> {
        let settings: SiteAIOwnerSettings = self.send(Method::Get, "/settings", None::<&()>)?;
        self.binding = Some(settings.session_binding.clone());
        Ok(settings)
    }

    /// Replace the session tenant's AI mode and cap.
    pub fn set_settings(&mut self, request: &SiteAISettingsRequest) -> Result<SiteAISettings> {
        self.write("/settings", request)
    }

    /// Record or revoke the session tenant's AI terms consent.
    pub fn set_consent(&mut self, request: &SiteAIConsentRequest) -> Result<SiteAISettings> {
        self.write("/consent", request)
    }

    /// Reads the binding first when the session has none, so a write can follow a redeem.
    fn write(&mut self, path: &str, body: &impl Serialize) -> Result<SiteAISettings> {
        if self.binding.is_none() {
            self.get_settings()?;
        }
        self.send(Method::Put, path, Some(body))
    }

    fn send<T: DeserializeOwned>(
        &self,
        method: Method,
        path: &str,
        body: Option<&impl Serialize>,
    ) -> Result<T> {
        let mut headers = vec![("Cookie", format!("{SESSION_COOKIE}={}", self.handle))];
        if body.is_some() {
            headers.push(("Origin", self.origin.clone()));
            headers.push((BINDING_HEADER, self.binding.clone().unwrap_or_default()));
        }
        let url = format!("{}{OWNER_PATH}{path}", self.origin);
        let request = json_request(method, url, headers, body)?;
        decode(&execute(&UreqTransport::new(), &request)?.body)
    }
}

/// The Custd origin of a redeem URL: HTTPS (or local HTTP), the redeem path, nothing else.
fn owner_origin(redeem_url: &str) -> Result<String> {
    let refused =
        || Error::InvalidInput("an AI owner handoff needs the Custd redeem URL".to_owned());
    let url = url::Url::parse(redeem_url).map_err(|_| refused())?;
    let local = matches!(url.host_str(), Some("localhost" | "127.0.0.1" | "[::1]"));
    let scheme_ok = url.scheme() == "https" || (url.scheme() == "http" && local);
    if !scheme_ok
        || !url.username().is_empty()
        || url.password().is_some()
        || url.query().is_some()
        || url.fragment().is_some()
        || url.path() != format!("{OWNER_PATH}/redeem")
    {
        return Err(refused());
    }
    Ok(url.origin().ascii_serialization())
}
