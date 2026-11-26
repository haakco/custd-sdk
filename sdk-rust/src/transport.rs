//! One HTTP exchange, behind a trait so the device flow can be tested without TLS.

use std::io;
use std::time::Duration;

use crate::SDK_IDENTITY;

/// The largest answer read into memory.
const MAX_RESPONSE_BYTES: u64 = 10 << 20;
const REQUEST_TIMEOUT: Duration = Duration::from_secs(30);

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum Method {
    Get,
    Post,
    Put,
    Patch,
    Delete,
}

#[derive(Debug, Clone)]
pub(crate) struct HttpRequest {
    pub method: Method,
    pub url: String,
    pub headers: Vec<(&'static str, String)>,
    pub body: Option<Vec<u8>>,
}

#[derive(Debug, Clone)]
pub(crate) struct HttpResponse {
    pub status: u16,
    pub etag: Option<String>,
    pub content_type: Option<String>,
    pub body: Vec<u8>,
}

/// A failed exchange. `PreSend` means the request provably never reached the server (name
/// resolution or connect failed), so repeating it cannot repeat a side effect.
#[derive(Debug, Clone)]
pub(crate) enum TransportError {
    PreSend(String),
    Failed(String),
}

impl TransportError {
    pub fn message(&self) -> &str {
        match self {
            TransportError::PreSend(message) | TransportError::Failed(message) => message,
        }
    }
}

pub(crate) trait Transport: Send + Sync {
    fn send(&self, request: &HttpRequest) -> Result<HttpResponse, TransportError>;
}

/// The real transport: ureq with rustls, no redirects, and every status returned as a response.
pub(crate) struct UreqTransport {
    agent: ureq::Agent,
}

impl UreqTransport {
    pub fn new() -> Self {
        let config = ureq::Agent::config_builder()
            .http_status_as_error(false)
            .max_redirects(0)
            .timeout_global(Some(REQUEST_TIMEOUT))
            .user_agent(SDK_IDENTITY)
            .build();
        Self {
            agent: ureq::Agent::new_with_config(config),
        }
    }
}

impl Transport for UreqTransport {
    fn send(&self, request: &HttpRequest) -> Result<HttpResponse, TransportError> {
        let mut builder = ureq::http::Request::builder()
            .method(http_method(request.method))
            .uri(&request.url);
        for (name, value) in &request.headers {
            builder = builder.header(*name, value);
        }
        let result = match &request.body {
            Some(body) => builder.body(body.clone()).map(|r| self.agent.run(r)),
            None => builder.body(()).map(|r| self.agent.run(r)),
        };
        let mut response = result
            .map_err(|error| TransportError::Failed(error.to_string()))?
            .map_err(classify)?;
        let etag = response
            .headers()
            .get("etag")
            .and_then(|value| value.to_str().ok())
            .map(str::to_owned);
        let content_type = response
            .headers()
            .get("content-type")
            .and_then(|value| value.to_str().ok())
            .map(str::to_owned);
        let body = response
            .body_mut()
            .with_config()
            .limit(MAX_RESPONSE_BYTES)
            .read_to_vec()
            .map_err(|error| TransportError::Failed(error.to_string()))?;
        Ok(HttpResponse {
            status: response.status().as_u16(),
            etag,
            content_type,
            body,
        })
    }
}

fn http_method(method: Method) -> ureq::http::Method {
    match method {
        Method::Get => ureq::http::Method::GET,
        Method::Post => ureq::http::Method::POST,
        Method::Put => ureq::http::Method::PUT,
        Method::Patch => ureq::http::Method::PATCH,
        Method::Delete => ureq::http::Method::DELETE,
    }
}

fn classify(error: ureq::Error) -> TransportError {
    let pre_send = match &error {
        ureq::Error::HostNotFound | ureq::Error::ConnectionFailed => true,
        ureq::Error::Timeout(timeout) => {
            matches!(timeout, ureq::Timeout::Resolve | ureq::Timeout::Connect)
        }
        ureq::Error::Io(io) => io.kind() == io::ErrorKind::ConnectionRefused,
        _ => false,
    };
    if pre_send {
        TransportError::PreSend(error.to_string())
    } else {
        TransportError::Failed(error.to_string())
    }
}

/// Percent-encodes everything but RFC 3986 unreserved characters, for a path segment or a
/// form/query value.
pub(crate) fn percent_encode(value: &str) -> String {
    let mut encoded = String::with_capacity(value.len());
    for byte in value.bytes() {
        if byte.is_ascii_alphanumeric() || matches!(byte, b'-' | b'.' | b'_' | b'~') {
            encoded.push(byte as char);
        } else {
            encoded.push_str(&format!("%{byte:02X}"));
        }
    }
    encoded
}

/// An `application/x-www-form-urlencoded` body.
pub(crate) fn form_body(fields: &[(&str, &str)]) -> Vec<u8> {
    fields
        .iter()
        .map(|(name, value)| format!("{}={}", percent_encode(name), percent_encode(value)))
        .collect::<Vec<_>>()
        .join("&")
        .into_bytes()
}
