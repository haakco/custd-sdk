use std::fmt;
use std::sync::Arc;

use serde::Serialize;
use serde::de::DeserializeOwned;

use crate::error::{ApiError, Error, Problem};
use crate::transport::{HttpRequest, HttpResponse, Method, Transport, UreqTransport};
use crate::{Result, SDK_IDENTITY};

/// The signed-in Custd API: measurement projects, observations, estimates and forecasts.
///
/// `base_url` is the API origin, for example `https://api.custd.com`; `access_token` is the
/// bearer token from [`crate::DeviceLogin`] or another OAuth grant.
#[derive(Clone)]
pub struct CustdClient {
    base_url: String,
    access_token: String,
    pub(crate) transport: Arc<dyn Transport>,
}

impl CustdClient {
    pub fn new(base_url: impl Into<String>, access_token: impl Into<String>) -> Self {
        Self {
            base_url: trim_base_url(base_url.into()),
            access_token: access_token.into(),
            transport: Arc::new(UreqTransport::new()),
        }
    }

    pub(crate) fn call<T: DeserializeOwned>(
        &self,
        method: Method,
        path: &str,
        body: Option<&impl Serialize>,
    ) -> Result<T> {
        let headers = vec![("Authorization", format!("Bearer {}", self.access_token))];
        let request = json_request(method, format!("{}{path}", self.base_url), headers, body)?;
        let response = execute(self.transport.as_ref(), &request)?;
        decode(&response.body)
    }
}

impl fmt::Debug for CustdClient {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("CustdClient")
            .field("base_url", &self.base_url)
            .field("access_token", &"<redacted>")
            .finish()
    }
}

pub(crate) fn trim_base_url(base_url: String) -> String {
    base_url.trim_end_matches('/').to_owned()
}

/// A JSON request carrying the SDK identity, plus the caller's credential headers.
pub(crate) fn json_request(
    method: Method,
    url: String,
    mut headers: Vec<(&'static str, String)>,
    body: Option<&impl Serialize>,
) -> Result<HttpRequest> {
    headers.push(("Accept", "application/json".to_owned()));
    headers.push(("X-Custd-Sdk", SDK_IDENTITY.to_owned()));
    let body = match body {
        Some(value) => {
            headers.push(("Content-Type", "application/json".to_owned()));
            Some(serde_json::to_vec(value).map_err(|e| Error::InvalidInput(e.to_string()))?)
        }
        None => None,
    };
    Ok(HttpRequest {
        method,
        url,
        headers,
        body,
    })
}

/// Sends one request. A 2xx or 304 answer is returned; anything else becomes [`Error::Api`].
pub(crate) fn execute(transport: &dyn Transport, request: &HttpRequest) -> Result<HttpResponse> {
    let response = transport
        .send(request)
        .map_err(|error| Error::Transport(error.message().to_owned()))?;
    if (200..300).contains(&response.status) || response.status == 304 {
        return Ok(response);
    }
    Err(Error::Api(ApiError {
        status: response.status,
        problem: serde_json::from_slice::<Problem>(&response.body)
            .ok()
            .map(Box::new),
    }))
}

pub(crate) fn decode<T: DeserializeOwned>(body: &[u8]) -> Result<T> {
    // A 204 has no body; the unit type stands for it.
    let body = if body.is_empty() {
        b"null".as_slice()
    } else {
        body
    };
    serde_json::from_slice(body).map_err(|error| Error::Decode(error.to_string()))
}
