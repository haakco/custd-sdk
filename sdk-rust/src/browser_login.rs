//! Hosted application browser sign-in using the registered OAuth client and PKCE.
use std::io::{Read, Write};
use std::net::{Ipv4Addr, TcpListener, TcpStream};
use std::thread;
use std::time::{Duration, Instant};

use base64::{Engine, engine::general_purpose::URL_SAFE_NO_PAD};
use ring::{digest, rand};
use url::Url;

use crate::device::{DeviceToken, decode_token};
use crate::transport::{HttpRequest, Method, Transport, UreqTransport, form_body};
use crate::{Error, HostedAppSignIn, Result, SDK_IDENTITY};

const LOGIN_TIMEOUT: Duration = Duration::from_secs(180);
const CALLBACK_TIMEOUT: Duration = Duration::from_secs(1);
const MAX_CALLBACK_BYTES: usize = 8192;

/// Browser sign-in for an application's own OAuth audience.
///
/// The application owner must register the exact `http://localhost:<port>/<path>` callback with
/// the hosted application client. This callback is separate from the app's web callback.
pub struct BrowserLogin {
    sign_in: HostedAppSignIn,
    redirect_uri: String,
    scopes: Vec<String>,
}

impl BrowserLogin {
    /// Uses the app's advertised client and a previously registered localhost callback.
    pub fn new(sign_in: &HostedAppSignIn, redirect_uri: String, scopes: Vec<String>) -> Self {
        Self {
            sign_in: sign_in.clone(),
            redirect_uri,
            scopes,
        }
    }

    /// Announces the authorization URL, then waits for the browser callback and exchanges its code.
    /// The URL is for the user to open in their browser. Do not log it.
    pub fn run(&self, announce: impl FnOnce(&str)) -> Result<DeviceToken> {
        self.run_with(&UreqTransport::new(), LOGIN_TIMEOUT, announce)
    }

    fn run_with(
        &self,
        transport: &dyn Transport,
        timeout: Duration,
        announce: impl FnOnce(&str),
    ) -> Result<DeviceToken> {
        let (mut authorization, token) = self.endpoints()?;
        let callback = self.callback()?;
        let address = (
            Ipv4Addr::LOCALHOST,
            callback.port().ok_or_else(callback_config_error)?,
        );
        let listener = TcpListener::bind(address).map_err(|_| {
            Error::Transport("cannot listen on the configured OAuth callback port".into())
        })?;
        listener
            .set_nonblocking(true)
            .map_err(|_| Error::Transport("cannot configure the OAuth callback listener".into()))?;
        let verifier = random_value()?;
        let state = random_value()?;
        let challenge =
            URL_SAFE_NO_PAD.encode(digest::digest(&digest::SHA256, verifier.as_bytes()));
        authorization
            .query_pairs_mut()
            .append_pair("response_type", "code")
            .append_pair("client_id", &self.sign_in.client_id)
            .append_pair("redirect_uri", &self.redirect_uri)
            .append_pair("scope", &self.scopes.join(" "))
            .append_pair("audience", &self.sign_in.audience)
            .append_pair("state", &state)
            .append_pair("code_challenge", &challenge)
            .append_pair("code_challenge_method", "S256");
        announce(authorization.as_str());
        let code = wait_for_code(&listener, &callback, &state, timeout)?;
        self.exchange(transport, token, &verifier, &code)
    }

    fn endpoints(&self) -> Result<(Url, Url)> {
        let issuer = https_url(&self.sign_in.issuer)?;
        let authorization = https_url(&self.sign_in.authorization_endpoint)?;
        let token = https_url(&self.sign_in.token_endpoint)?;
        if issuer.origin() != authorization.origin() || issuer.origin() != token.origin() {
            return Err(Error::InvalidInput(
                "OAuth endpoints must use the issuer origin".into(),
            ));
        }
        if self.sign_in.client_id.is_empty()
            || self.sign_in.audience.is_empty()
            || self.scopes.is_empty()
        {
            return Err(Error::InvalidInput(
                "OAuth client, audience and scopes are required".into(),
            ));
        }
        Ok((authorization, token))
    }

    fn callback(&self) -> Result<Url> {
        let callback = Url::parse(&self.redirect_uri).map_err(|_| callback_config_error())?;
        if callback.scheme() != "http"
            || callback.host_str() != Some("localhost")
            || callback.port().is_none_or(|port| port == 0)
            || callback.query().is_some()
            || callback.fragment().is_some()
            || !callback.username().is_empty()
            || callback.password().is_some()
            || callback.as_str() != self.redirect_uri
        {
            return Err(callback_config_error());
        }
        Ok(callback)
    }

    fn exchange(
        &self,
        transport: &dyn Transport,
        token: Url,
        verifier: &str,
        code: &str,
    ) -> Result<DeviceToken> {
        let response = transport
            .send(&HttpRequest {
                method: Method::Post,
                url: token.into(),
                headers: vec![
                    ("Accept", "application/json".into()),
                    ("X-Custd-Sdk", SDK_IDENTITY.into()),
                    ("Content-Type", "application/x-www-form-urlencoded".into()),
                ],
                body: Some(form_body(&[
                    ("grant_type", "authorization_code"),
                    ("client_id", &self.sign_in.client_id),
                    ("redirect_uri", &self.redirect_uri),
                    ("code_verifier", verifier),
                    ("code", code),
                ])),
            })
            .map_err(|_| Error::Transport("OAuth token exchange could not be confirmed".into()))?;
        if response.status != 200 {
            return Err(Error::InvalidResponse(format!(
                "OAuth token exchange returned HTTP {}",
                response.status
            )));
        }
        decode_token(&response.body)
            .ok_or_else(|| Error::InvalidResponse("invalid OAuth token response".into()))
    }
}

fn https_url(raw: &str) -> Result<Url> {
    Url::parse(raw).ok()
        .filter(|url| url.scheme() == "https" && url.host_str().is_some()
            && url.username().is_empty() && url.password().is_none()
            && url.fragment().is_none() && url.query().is_none())
        .ok_or_else(|| Error::InvalidInput("OAuth issuer and endpoints must be HTTPS URLs without credentials, query or fragment".into()))
}

fn callback_config_error() -> Error {
    Error::InvalidInput("register an exact http://localhost:<port>/<path> OAuth callback".into())
}

fn random_value() -> Result<String> {
    let mut bytes = [0; 32];
    rand::SecureRandom::fill(&rand::SystemRandom::new(), &mut bytes)
        .map_err(|_| Error::Transport("OAuth randomness unavailable".into()))?;
    Ok(URL_SAFE_NO_PAD.encode(bytes))
}

fn wait_for_code(
    listener: &TcpListener,
    callback: &Url,
    state: &str,
    timeout: Duration,
) -> Result<String> {
    let deadline = Instant::now() + timeout;
    while Instant::now() < deadline {
        match listener.accept() {
            Ok((mut stream, _)) => {
                let remaining = deadline.saturating_duration_since(Instant::now());
                if remaining.is_zero() {
                    break;
                }
                let io_limit = remaining.min(CALLBACK_TIMEOUT);
                let code =
                    receive_callback(&mut stream, callback, state, Instant::now() + io_limit);
                let (status, body) = match &code {
                    Some(Ok(_)) => ("200 OK", "Authorization received. Return to your terminal."),
                    Some(Err(_)) => (
                        "400 Bad Request",
                        "Authorization was refused. Return to your terminal.",
                    ),
                    None => ("400 Bad Request", "Invalid callback."),
                };
                if stream.set_write_timeout(Some(io_limit)).is_ok() {
                    // The validated callback remains usable if the browser closes the connection.
                    let _ = write!(
                        stream,
                        "HTTP/1.1 {status}\r\nContent-Type: text/plain; charset=utf-8\r\nCache-Control: no-store\r\nReferrer-Policy: no-referrer\r\nConnection: close\r\nContent-Length: {}\r\n\r\n{body}",
                        body.len()
                    );
                }
                if let Some(code) = code {
                    return code;
                }
            }
            Err(error) if error.kind() == std::io::ErrorKind::WouldBlock => {
                thread::sleep(Duration::from_millis(20));
            }
            Err(_) => return Err(Error::Transport("OAuth callback listener failed".into())),
        }
    }
    Err(Error::Transport("OAuth browser login timed out".into()))
}

fn receive_callback(
    stream: &mut TcpStream,
    callback: &Url,
    state: &str,
    deadline: Instant,
) -> Option<Result<String>> {
    let mut bytes = [0; MAX_CALLBACK_BYTES];
    let mut length = 0;
    while length < bytes.len() {
        let remaining = deadline.checked_duration_since(Instant::now())?;
        stream.set_read_timeout(Some(remaining)).ok()?;
        let count = stream.read(&mut bytes[length..]).ok()?;
        if count == 0 {
            return None;
        }
        // A header terminator may start in the preceding packet.
        let prior = length.saturating_sub(3);
        length += count;
        if bytes[prior..length]
            .windows(4)
            .any(|window| window == b"\r\n\r\n")
        {
            let input = std::str::from_utf8(&bytes[..length]).ok()?;
            let (first_line, _) = input.split_once("\r\n")?;
            return callback_code(first_line, callback, state);
        }
    }
    None
}

fn callback_code(first_line: &str, callback: &Url, state: &str) -> Option<Result<String>> {
    let mut parts = first_line.split_ascii_whitespace();
    if parts.next()? != "GET" {
        return None;
    }
    let target = parts.next()?;
    let (path, query) = target.split_once('?')?;
    if path != callback.path()
        || !matches!(parts.next(), Some("HTTP/1.0" | "HTTP/1.1"))
        || parts.next().is_some()
    {
        return None;
    }
    let fields: Vec<_> = url::form_urlencoded::parse(query.as_bytes()).collect();
    let one = |key| {
        let mut matches = fields.iter().filter(|(name, _)| name == key);
        let (_, value) = matches.next()?;
        if matches.next().is_some() || value.is_empty() {
            return None;
        }
        Some(value.as_ref())
    };
    if one("state")? != state {
        return None;
    }
    if let Some(code) = one("code").filter(|_| !fields.iter().any(|(key, _)| key == "error")) {
        return Some(Ok(code.into()));
    }
    Some(Err(Error::InvalidResponse(
        "OAuth browser authorization was refused or invalid".into(),
    )))
}

#[cfg(test)]
mod tests;
