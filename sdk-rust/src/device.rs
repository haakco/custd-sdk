//! RFC 8628 device-code login, matching `custdctl login --method device`.
//!
//! The person approves on another device; this side polls the token endpoint at the provider's
//! pace. No browser or local listener is opened. A poll whose outcome is unknown (a server error,
//! a broken connection after sending, an unreadable answer) ends the login instead of polling
//! again, because the device code may already have been redeemed.

use std::fmt;
use std::thread;
use std::time::{Duration, Instant};

use serde::Deserialize;

use crate::error::Error;
use crate::transport::{
    HttpRequest, HttpResponse, Method, Transport, TransportError, UreqTransport, form_body,
};
use crate::{Result, SDK_IDENTITY};

const DEVICE_CODE_GRANT: &str = "urn:ietf:params:oauth:grant-type:device_code";
const DEFAULT_POLL_INTERVAL: Duration = Duration::from_secs(5);
const SLOW_DOWN_INCREMENT: Duration = Duration::from_secs(5);
const MAX_LIFETIME_SECONDS: u64 = 365 * 24 * 60 * 60;
const MAX_OAUTH_RESPONSE_BYTES: usize = 1 << 20;
const USER_CODE_GROUP_SIZE: usize = 4;

/// A public OAuth client signing a person in with the device flow.
#[derive(Debug, Clone)]
pub struct DeviceLogin {
    /// The HTTPS issuer; its `/.well-known/oauth-authorization-server` must name it exactly.
    pub issuer_url: String,
    pub client_id: String,
    pub scopes: Vec<String>,
    /// The token audience, for example `custd`. An absolute URI is also sent as an RFC 8707
    /// resource indicator.
    pub audience: Option<String>,
}

/// What to show the person. The device code itself is never exposed.
#[derive(Debug, Clone)]
pub struct DeviceInstructions {
    pub verification_uri: String,
    pub user_code: String,
    pub expires_in: Duration,
}

/// The bearer token the login produced.
#[derive(Clone)]
pub struct DeviceToken {
    pub access_token: String,
    pub refresh_token: Option<String>,
    pub expires_in: Duration,
}

/// A terminal device-login outcome. Provider-supplied detail is never kept.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DeviceLoginError {
    /// The issuer does not advertise device authorization.
    Unsupported,
    Expired,
    Denied,
    Rejected,
    /// The last poll's outcome is unknown, so the code may already be spent.
    Unconfirmed,
}

impl fmt::Display for DeviceLoginError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(match self {
            Self::Unsupported => "issuer does not advertise device authorization",
            Self::Expired => {
                "device authorization expired before it was approved; start login again with a new code"
            }
            Self::Denied => "device authorization was denied; start login again with a new code",
            Self::Rejected => "device authorization was rejected; start login again with a new code",
            Self::Unconfirmed => {
                "device authorization could not be confirmed; start login again with a new code"
            }
        })
    }
}

impl fmt::Debug for DeviceToken {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("DeviceToken")
            .field("access_token", &"<redacted>")
            .field(
                "refresh_token",
                &self.refresh_token.as_ref().map(|_| "<redacted>"),
            )
            .field("expires_in", &self.expires_in)
            .finish()
    }
}

/// The display form of a user code: separators dropped, letters upper-cased, groups of four.
pub fn device_user_code_groups(user_code: &str) -> Vec<String> {
    let compact: Vec<char> = user_code
        .chars()
        .filter(|c| !c.is_whitespace() && !is_code_separator(*c))
        .map(|c| c.to_ascii_uppercase())
        .collect();
    compact
        .chunks(USER_CODE_GROUP_SIZE)
        .map(|group| group.iter().collect())
        .collect()
}

fn is_code_separator(c: char) -> bool {
    matches!(c, '-' | '\u{2010}'..='\u{2014}' | '\u{feff}')
}

/// Time, behind a trait so tests can run the poll loop instantly.
pub(crate) trait Clock {
    fn now(&self) -> Instant;
    fn sleep(&self, duration: Duration);
}

struct SystemClock;

impl Clock for SystemClock {
    fn now(&self) -> Instant {
        Instant::now()
    }
    fn sleep(&self, duration: Duration) {
        thread::sleep(duration);
    }
}

#[derive(Deserialize)]
struct AuthorizationServerMetadata {
    issuer: String,
    #[serde(default)]
    authorization_endpoint: String,
    #[serde(default)]
    token_endpoint: String,
    #[serde(default)]
    jwks_uri: String,
    #[serde(default)]
    device_authorization_endpoint: String,
}

#[derive(Deserialize)]
struct DeviceAuthorization {
    #[serde(default)]
    device_code: String,
    #[serde(default)]
    user_code: String,
    #[serde(default)]
    verification_uri: String,
    #[serde(default)]
    verification_uri_complete: String,
    #[serde(default)]
    expires_in: i64,
    #[serde(default)]
    interval: i64,
}

#[derive(Deserialize)]
struct TokenAnswer {
    #[serde(default)]
    access_token: String,
    refresh_token: Option<String>,
    #[serde(default)]
    token_type: String,
    #[serde(default)]
    expires_in: i64,
}

#[derive(Deserialize)]
struct OAuthErrorAnswer {
    #[serde(default)]
    error: String,
}

enum PollOutcome {
    Token(DeviceToken),
    Pending,
    SlowDown,
}

impl DeviceLogin {
    /// Runs the login. `announce` receives the code to show once the provider issues it.
    pub fn run(&self, announce: impl FnOnce(&DeviceInstructions)) -> Result<DeviceToken> {
        self.run_with(&UreqTransport::new(), &SystemClock, announce)
    }

    pub(crate) fn run_with(
        &self,
        transport: &dyn Transport,
        clock: &dyn Clock,
        announce: impl FnOnce(&DeviceInstructions),
    ) -> Result<DeviceToken> {
        let origin = https_origin(&self.issuer_url)
            .ok_or_else(|| Error::InvalidInput("issuer must be an HTTPS URL".to_owned()))?;
        let metadata = self.discover(transport, &origin)?;
        let authorization = self.authorize(transport, &metadata, &origin)?;
        let expires_in = Duration::from_secs(authorization.expires_in as u64);
        let deadline = clock.now() + expires_in;
        announce(&DeviceInstructions {
            verification_uri: authorization.verification_uri.clone(),
            user_code: authorization.user_code.clone(),
            expires_in,
        });
        let form = self.token_form(&authorization.device_code);
        let interval = poll_interval(authorization.interval);
        poll(
            transport,
            clock,
            &metadata.token_endpoint,
            &form,
            deadline,
            interval,
        )
    }

    fn discover(
        &self,
        transport: &dyn Transport,
        origin: &str,
    ) -> Result<AuthorizationServerMetadata> {
        let url = format!(
            "{}/.well-known/oauth-authorization-server",
            self.issuer_url.trim_end_matches('/')
        );
        let response = oauth_send(transport, Method::Get, url, None)?;
        if response.status != 200 {
            return Err(Error::Api(crate::ApiError {
                status: response.status,
                problem: None,
                request_id: None,
            }));
        }
        let metadata: AuthorizationServerMetadata = decode_bounded(&response.body)?;
        if metadata.issuer != self.issuer_url {
            return Err(invalid(
                "metadata issuer does not exactly match configured issuer",
            ));
        }
        for endpoint in [
            &metadata.authorization_endpoint,
            &metadata.token_endpoint,
            &metadata.jwks_uri,
        ] {
            require_issuer_origin(endpoint, origin)?;
        }
        if metadata.device_authorization_endpoint.is_empty() {
            return Err(Error::DeviceLogin(DeviceLoginError::Unsupported));
        }
        require_issuer_origin(&metadata.device_authorization_endpoint, origin)?;
        Ok(metadata)
    }

    fn authorize(
        &self,
        transport: &dyn Transport,
        metadata: &AuthorizationServerMetadata,
        origin: &str,
    ) -> Result<DeviceAuthorization> {
        let scope = self.scopes.join(" ");
        let mut fields = vec![("client_id", self.client_id.as_str())];
        if !scope.is_empty() {
            fields.push(("scope", scope.as_str()));
        }
        if let Some(audience) = self.audience.as_deref().filter(|a| !a.is_empty()) {
            fields.push(("audience", audience));
        }
        let url = metadata.device_authorization_endpoint.clone();
        let response = oauth_send(transport, Method::Post, url, Some(form_body(&fields)))?;
        if response.status != 200 {
            return Err(invalid(&format!(
                "device authorization endpoint returned HTTP status {}",
                response.status
            )));
        }
        let authorization: DeviceAuthorization = decode_bounded(&response.body)?;
        validate_authorization(&authorization, origin)?;
        Ok(authorization)
    }

    fn token_form(&self, device_code: &str) -> Vec<u8> {
        let mut fields = vec![
            ("client_id", self.client_id.clone()),
            ("grant_type", DEVICE_CODE_GRANT.to_owned()),
            ("device_code", device_code.to_owned()),
        ];
        if let Some(audience) = self.audience.as_deref().filter(|a| !a.is_empty()) {
            match canonical_resource_uri(audience) {
                Some(resource) => {
                    fields.push(("audience", resource.clone()));
                    fields.push(("resource", resource));
                }
                None => fields.push(("audience", audience.to_owned())),
            }
        }
        let borrowed: Vec<(&str, &str)> = fields.iter().map(|(k, v)| (*k, v.as_str())).collect();
        form_body(&borrowed)
    }
}

fn poll(
    transport: &dyn Transport,
    clock: &dyn Clock,
    token_endpoint: &str,
    form: &[u8],
    deadline: Instant,
    mut interval: Duration,
) -> Result<DeviceToken> {
    loop {
        let remaining = deadline.saturating_duration_since(clock.now());
        if remaining.is_zero() {
            return Err(Error::DeviceLogin(DeviceLoginError::Expired));
        }
        clock.sleep(interval.min(remaining));
        if clock.now() >= deadline {
            return Err(Error::DeviceLogin(DeviceLoginError::Expired));
        }
        let outcome = redeem(transport, token_endpoint, form);
        if clock.now() >= deadline {
            return Err(Error::DeviceLogin(DeviceLoginError::Expired));
        }
        match outcome? {
            PollOutcome::Token(token) => return Ok(token),
            PollOutcome::Pending => {}
            PollOutcome::SlowDown => interval = interval.saturating_add(SLOW_DOWN_INCREMENT),
        }
    }
}

fn redeem(transport: &dyn Transport, token_endpoint: &str, form: &[u8]) -> Result<PollOutcome> {
    let request = oauth_request(Method::Post, token_endpoint.to_owned(), Some(form.to_vec()));
    let response = match transport.send(&request) {
        Ok(response) => response,
        // A failed connect proves the code was not sent, so polling again is safe.
        Err(TransportError::PreSend(_)) => return Ok(PollOutcome::SlowDown),
        Err(TransportError::Failed(_)) => return Err(device_error(DeviceLoginError::Unconfirmed)),
    };
    if (200..300).contains(&response.status) {
        return decode_token(&response.body)
            .map(PollOutcome::Token)
            .ok_or(device_error(DeviceLoginError::Unconfirmed));
    }
    if response.status >= 500 || response.body.len() > MAX_OAUTH_RESPONSE_BYTES {
        return Err(device_error(DeviceLoginError::Unconfirmed));
    }
    let code = serde_json::from_slice::<OAuthErrorAnswer>(&response.body)
        .map(|answer| answer.error)
        .unwrap_or_default();
    match code.as_str() {
        "authorization_pending" => Ok(PollOutcome::Pending),
        "slow_down" => Ok(PollOutcome::SlowDown),
        "access_denied" => Err(device_error(DeviceLoginError::Denied)),
        "expired_token" => Err(device_error(DeviceLoginError::Expired)),
        _ => Err(device_error(DeviceLoginError::Rejected)),
    }
}

pub(crate) fn decode_token(body: &[u8]) -> Option<DeviceToken> {
    let answer: TokenAnswer = decode_bounded(body).ok()?;
    let lifetime_ok = answer.expires_in > 0 && answer.expires_in as u64 <= MAX_LIFETIME_SECONDS;
    if answer.access_token.is_empty()
        || !answer.token_type.eq_ignore_ascii_case("bearer")
        || !lifetime_ok
    {
        return None;
    }
    Some(DeviceToken {
        access_token: answer.access_token,
        refresh_token: answer.refresh_token.filter(|t| !t.is_empty()),
        expires_in: Duration::from_secs(answer.expires_in as u64),
    })
}

fn validate_authorization(authorization: &DeviceAuthorization, origin: &str) -> Result<()> {
    if authorization.device_code.is_empty() || authorization.user_code.is_empty() {
        return Err(invalid(
            "device authorization response is missing its codes",
        ));
    }
    if authorization.expires_in <= 0 || authorization.expires_in as u64 > MAX_LIFETIME_SECONDS {
        return Err(invalid(
            "device authorization response has an invalid expiry",
        ));
    }
    require_issuer_origin(&authorization.verification_uri, origin)?;
    if !authorization.verification_uri_complete.is_empty() {
        require_issuer_origin(&authorization.verification_uri_complete, origin)?;
    }
    Ok(())
}

fn poll_interval(seconds: i64) -> Duration {
    if seconds <= 0 {
        return DEFAULT_POLL_INTERVAL;
    }
    Duration::from_secs(seconds as u64)
}

fn oauth_request(method: Method, url: String, form: Option<Vec<u8>>) -> HttpRequest {
    let mut headers = vec![
        ("Accept", "application/json".to_owned()),
        ("X-Custd-Sdk", SDK_IDENTITY.to_owned()),
    ];
    if form.is_some() {
        headers.push((
            "Content-Type",
            "application/x-www-form-urlencoded".to_owned(),
        ));
    }
    HttpRequest {
        method,
        url,
        headers,
        body: form,
    }
}

fn oauth_send(
    transport: &dyn Transport,
    method: Method,
    url: String,
    form: Option<Vec<u8>>,
) -> Result<HttpResponse> {
    transport
        .send(&oauth_request(method, url, form))
        .map_err(|error| Error::Transport(error.message().to_owned()))
}

fn decode_bounded<T: serde::de::DeserializeOwned>(body: &[u8]) -> Result<T> {
    if body.len() > MAX_OAUTH_RESPONSE_BYTES {
        return Err(Error::Decode(
            "OAuth response exceeds size limit".to_owned(),
        ));
    }
    serde_json::from_slice(body).map_err(|_| Error::Decode("invalid OAuth JSON".to_owned()))
}

fn require_issuer_origin(raw: &str, issuer_origin: &str) -> Result<()> {
    match https_origin(raw) {
        Some(origin) if origin == issuer_origin => Ok(()),
        Some(_) => Err(invalid("OAuth endpoint must have the issuer origin")),
        None => Err(invalid("OAuth endpoint must be an HTTPS URL")),
    }
}

/// The lower-cased `https://host[:port]` of a URL with no user info or fragment, or `None`.
fn https_origin(raw: &str) -> Option<String> {
    let rest = raw
        .get(..8)
        .filter(|s| s.eq_ignore_ascii_case("https://"))
        .map(|_| &raw[8..])?;
    let authority = rest.split(['/', '?']).next().unwrap_or("");
    if authority.is_empty() || authority.contains('@') || raw.contains('#') {
        return None;
    }
    Some(format!("https://{}", authority.to_ascii_lowercase()))
}

/// The canonical RFC 8707 resource an audience names, or `None` when it is not an absolute URI
/// (the ordinary `custd` audience). Mirrors Custd's `auth.CanonicalResourceURI`.
fn canonical_resource_uri(audience: &str) -> Option<String> {
    if audience != audience.trim() || audience.contains('#') {
        return None;
    }
    let (scheme, rest) = audience.split_once(':')?;
    let valid_scheme = scheme.starts_with(|c: char| c.is_ascii_alphabetic())
        && scheme
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || matches!(c, '+' | '-' | '.'));
    if !valid_scheme {
        return None;
    }
    let scheme = scheme.to_ascii_lowercase();
    let Some(hierarchical) = rest.strip_prefix("//") else {
        return Some(format!("{scheme}:{rest}"));
    };
    let split = hierarchical.find(['/', '?']).unwrap_or(hierarchical.len());
    let (host, tail) = hierarchical.split_at(split);
    let (path, query) = match tail.split_once('?') {
        Some((path, query)) => (path, format!("?{query}")),
        None => (tail, String::new()),
    };
    Some(format!(
        "{scheme}://{}{}{query}",
        host.to_ascii_lowercase(),
        path.trim_end_matches('/')
    ))
}

fn invalid(message: &str) -> Error {
    Error::InvalidResponse(message.to_owned())
}

fn device_error(error: DeviceLoginError) -> Error {
    Error::DeviceLogin(error)
}

#[cfg(test)]
mod tests;
