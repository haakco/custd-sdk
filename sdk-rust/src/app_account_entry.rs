//! Hosted account settings entry for a signed-in application session: a one-use ticket from the
//! application's issuer (`<issuer>/settings/entry/ticket`), posted by the app's own same-tab form.

use std::fmt;

use base64::{Engine, engine::general_purpose::URL_SAFE_NO_PAD};
use serde::{Deserialize, Serialize};
use url::Url;

use crate::Result;
use crate::client::{CustdClient, json_request};
use crate::error::{ApiError, Error};
use crate::transport::Method;

const SETTINGS_ENTRY_PATH: &str = "/settings/entry";
/// The issuer's bound on the page hosted settings links back to.
const RETURN_PATH_MAX_BYTES: usize = 512;
const INVALID_RESPONSE: &str = "invalid app account entry response";

/// Binds a ticket to a registered application origin. Take the issuer and application origin
/// from trusted deployment configuration.
#[derive(Debug, Clone, Default, PartialEq)]
pub struct AppAccountEntryRequest {
    pub issuer: String,
    pub application_origin: String,
    /// The page on `application_origin` hosted settings links back to, such as `/mine`. Empty
    /// links to the application's home. It never carries a fragment.
    pub return_path: String,
}

/// For a same-tab form POST to `action_url`. The ticket is a short-lived, one-use credential and
/// must stay out of URLs and logs; `Debug` redacts it.
#[derive(Clone, PartialEq)]
pub struct AppAccountEntry {
    pub action_url: String,
    pub ticket: String,
}

impl fmt::Debug for AppAccountEntry {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("AppAccountEntry")
            .field("action_url", &self.action_url)
            .field("ticket", &"<redacted>")
            .finish()
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct TicketRequest<'a> {
    application_origin: &'a str,
    #[serde(skip_serializing_if = "str::is_empty")]
    return_path: &'a str,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct TicketResponse {
    action_url: String,
    ticket: String,
}

impl CustdClient {
    /// Obtains a hosted settings ticket for a remembered application session. `access_token` is
    /// the application user's own access token, not this client's credential.
    pub fn create_app_account_entry(
        &self,
        access_token: &str,
        request: &AppAccountEntryRequest,
    ) -> Result<AppAccountEntry> {
        if access_token.is_empty() || access_token.chars().any(char::is_whitespace) {
            return Err(Error::InvalidInput(
                "application access token is required".into(),
            ));
        }
        let issuer =
            serialized_origin(request.issuer.strip_suffix('/').unwrap_or(&request.issuer))?;
        let application_origin = serialized_origin(&request.application_origin)?;
        if !request.return_path.is_empty() && !valid_return_path(&request.return_path) {
            return Err(Error::InvalidInput(
                "app account return path must be a path on the application origin".into(),
            ));
        }
        let action = format!("{issuer}{SETTINGS_ENTRY_PATH}");
        let body = TicketRequest {
            application_origin,
            return_path: &request.return_path,
        };
        let headers = vec![("Authorization", format!("Bearer {access_token}"))];
        let wire = json_request(
            Method::Post,
            format!("{action}/ticket"),
            headers,
            Some(&body),
        )?;
        let response = self
            .transport
            .send(&wire)
            .map_err(|error| Error::Transport(error.message().to_owned()))?;
        // Status only: an issuer error body could carry ticket material.
        if !(200..300).contains(&response.status) {
            return Err(Error::Api(ApiError {
                status: response.status,
                problem: None,
            }));
        }
        match serde_json::from_slice::<TicketResponse>(&response.body) {
            Ok(entry) if entry.action_url == action && valid_ticket(&entry.ticket) => {
                Ok(AppAccountEntry {
                    action_url: action,
                    ticket: entry.ticket,
                })
            }
            _ => Err(Error::InvalidResponse(INVALID_RESPONSE.into())),
        }
    }
}

/// `raw` when it is already a serialized HTTPS origin: no path, credentials or explicit `:443`,
/// and a lowercase host.
fn serialized_origin(raw: &str) -> Result<&str> {
    Url::parse(raw)
        .ok()
        .filter(|url| {
            url.scheme() == "https"
                && url.username().is_empty()
                && url.password().is_none()
                && url.origin().ascii_serialization() == raw
        })
        .map(|_| raw)
        .ok_or_else(|| {
            Error::InvalidInput("app account entry requires a serialized HTTPS origin".into())
        })
}

/// Mirrors the issuer: an absolute path with an optional query, without a fragment, backslash,
/// control character or scheme-relative form.
fn valid_return_path(path: &str) -> bool {
    path.len() <= RETURN_PATH_MAX_BYTES
        && path.starts_with('/')
        && !path.starts_with("//")
        && !path
            .chars()
            .any(|c| c == '\\' || c == '#' || c <= ' ' || c == '\u{7f}')
}

/// 32 bytes as strict unpadded base64url.
fn valid_ticket(ticket: &str) -> bool {
    ticket.len() == 43
        && URL_SAFE_NO_PAD
            .decode(ticket)
            .is_ok_and(|bytes| bytes.len() == 32)
}

#[cfg(test)]
mod tests {
    use std::sync::{Arc, Mutex};

    use super::*;
    use crate::transport::{HttpRequest, HttpResponse, HttpStream, Transport, TransportError};

    const ISSUER: &str = "https://auth.canvas.test";
    const ACTION: &str = "https://auth.canvas.test/settings/entry";
    const ORIGIN: &str = "https://canvas.test";

    struct FakeIssuer {
        status: u16,
        body: String,
        requests: Mutex<Vec<HttpRequest>>,
    }

    impl Transport for FakeIssuer {
        fn send(&self, request: &HttpRequest) -> std::result::Result<HttpResponse, TransportError> {
            self.requests.lock().unwrap().push(request.clone());
            Ok(HttpResponse {
                status: self.status,
                headers: vec![],
                body: self.body.clone().into_bytes(),
            })
        }

        fn stream(&self, _: &HttpRequest) -> std::result::Result<HttpStream, TransportError> {
            unreachable!("account entry never streams")
        }
    }

    fn entry(
        status: u16,
        body: String,
        origin: &str,
        return_path: &str,
    ) -> (Result<AppAccountEntry>, Vec<HttpRequest>) {
        let issuer = Arc::new(FakeIssuer {
            status,
            body,
            requests: Mutex::new(vec![]),
        });
        let mut client = CustdClient::new("https://api.custd.test", "operator-token");
        client.transport = issuer.clone();
        let request = AppAccountEntryRequest {
            issuer: format!("{ISSUER}/"),
            application_origin: origin.to_owned(),
            return_path: return_path.to_owned(),
        };
        let result = client.create_app_account_entry("app-token", &request);
        let requests = issuer.requests.lock().unwrap().clone();
        (result, requests)
    }

    fn answer(action: &str, ticket: &str) -> String {
        format!(r#"{{"actionUrl":"{action}","ticket":"{ticket}"}}"#)
    }

    #[test]
    fn posts_to_the_issuer_with_the_app_token() {
        let ticket = "A".repeat(43);
        for (return_path, body) in [
            ("", r#"{"applicationOrigin":"https://canvas.test"}"#),
            (
                "/mine",
                r#"{"applicationOrigin":"https://canvas.test","returnPath":"/mine"}"#,
            ),
        ] {
            let (result, requests) = entry(200, answer(ACTION, &ticket), ORIGIN, return_path);
            let entry = result.unwrap();
            assert_eq!(
                (entry.action_url.as_str(), entry.ticket.as_str()),
                (ACTION, ticket.as_str())
            );
            assert!(!format!("{entry:?}").contains(&ticket));
            let [wire] = requests.as_slice() else {
                panic!("want one ticket request")
            };
            assert_eq!(wire.method, Method::Post);
            assert_eq!(wire.url, format!("{ACTION}/ticket"));
            let header = |name: &str| {
                wire.headers
                    .iter()
                    .find(|(key, _)| *key == name)
                    .map(|(_, value)| value.as_str())
            };
            assert_eq!(header("Authorization"), Some("Bearer app-token"));
            assert_eq!(header("X-Custd-Sdk"), Some(crate::SDK_IDENTITY));
            assert_eq!(wire.body.as_deref(), Some(body.as_bytes()));
        }
    }

    #[test]
    fn refuses_untrusted_input_and_answers() {
        let ticket = "A".repeat(43);
        let long_path = format!("/{}", "a".repeat(512));
        let cases = [
            // name, origin, return path, answer, whether the request is sent
            (
                "origin with path",
                "https://canvas.test/app",
                "",
                String::new(),
                false,
            ),
            (
                "origin with :443",
                "https://canvas.test:443",
                "",
                String::new(),
                false,
            ),
            (
                "uppercase origin",
                "https://Canvas.test",
                "",
                String::new(),
                false,
            ),
            (
                "backslash host",
                "https://canvas.test\\evil",
                "",
                String::new(),
                false,
            ),
            ("scheme-relative", ORIGIN, "//evil", String::new(), false),
            ("fragment", ORIGIN, "/a#b", String::new(), false),
            ("relative", ORIGIN, "mine", String::new(), false),
            ("backslash", ORIGIN, "/\\x", String::new(), false),
            (
                "513 bytes",
                ORIGIN,
                long_path.as_str(),
                String::new(),
                false,
            ),
            (
                "other action",
                ORIGIN,
                "",
                answer("https://other.test/settings/entry", &ticket),
                true,
            ),
            (
                "short ticket",
                ORIGIN,
                "",
                answer(ACTION, &"A".repeat(42)),
                true,
            ),
            (
                "non-canonical ticket",
                ORIGIN,
                "",
                answer(ACTION, &format!("{}B", "A".repeat(42))),
                true,
            ),
        ];
        for (name, origin, return_path, body, sent) in cases {
            let (result, requests) = entry(200, body, origin, return_path);
            let error = result.expect_err(name);
            assert!(
                matches!(error, Error::InvalidInput(_) | Error::InvalidResponse(_)),
                "{name}: {error}"
            );
            assert!(!error.to_string().contains(&"A".repeat(42)), "{name}");
            assert_eq!(!requests.is_empty(), sent, "{name}");
        }
        let (result, _) = entry(403, format!(r#"{{"detail":"{ticket}"}}"#), ORIGIN, "");
        let Err(Error::Api(api)) = result else {
            panic!("want the issuer's status")
        };
        assert_eq!((api.status, api.problem.is_none()), (403, true));
    }
}
