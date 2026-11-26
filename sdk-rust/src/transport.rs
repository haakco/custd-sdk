//! One HTTP exchange, behind a trait so the device flow can be tested without TLS.

use std::io::{self, Read};
use std::time::Duration;

use crate::SDK_IDENTITY;

/// The largest answer read into memory: the Go SDK's limit for binary admin answers. Streamed
/// downloads are not held in memory and have no cap.
const MAX_RESPONSE_BYTES: u64 = 64 << 20;
const REQUEST_TIMEOUT: Duration = Duration::from_secs(30);
/// How long a streamed download may wait for its answer or for each read; the whole body has no
/// deadline, so a large archive is not cut off while it is still arriving.
const STREAM_STALL_TIMEOUT: Duration = Duration::from_secs(30);

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
    /// Every response header that is valid text, names lowercased.
    pub headers: Vec<(String, String)>,
    pub body: Vec<u8>,
}

impl HttpResponse {
    /// The first value of a response header, matched case-insensitively.
    pub fn header(&self, name: &str) -> Option<&str> {
        first_header(&self.headers, name)
    }
}

/// An answer whose body is read as it arrives rather than into memory.
pub(crate) struct HttpStream {
    pub status: u16,
    /// Every response header that is valid text, names lowercased.
    pub headers: Vec<(String, String)>,
    pub body: Box<dyn Read + Send>,
}

impl HttpStream {
    /// The first value of a response header, matched case-insensitively.
    pub fn header(&self, name: &str) -> Option<&str> {
        first_header(&self.headers, name)
    }

    /// The whole answer in memory, for a non-success status whose problem body is decoded.
    pub fn buffered(self) -> Result<HttpResponse, TransportError> {
        let mut body = Vec::new();
        self.body
            .take(MAX_RESPONSE_BYTES)
            .read_to_end(&mut body)
            .map_err(|error| TransportError::Failed(error.to_string()))?;
        Ok(HttpResponse {
            status: self.status,
            headers: self.headers,
            body,
        })
    }
}

fn first_header<'a>(headers: &'a [(String, String)], name: &str) -> Option<&'a str> {
    headers
        .iter()
        .find(|(key, _)| key.eq_ignore_ascii_case(name))
        .map(|(_, value)| value.as_str())
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

    /// Sends a request and returns the answer with its body unread, for downloads too large to
    /// hold in memory.
    fn stream(&self, request: &HttpRequest) -> Result<HttpStream, TransportError>;
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

impl UreqTransport {
    fn run(
        &self,
        request: &HttpRequest,
        streaming: bool,
    ) -> Result<ureq::http::Response<ureq::Body>, TransportError> {
        let mut builder = ureq::http::Request::builder()
            .method(http_method(request.method))
            .uri(&request.url);
        for (name, value) in &request.headers {
            builder = builder.header(*name, value);
        }
        let result = match &request.body {
            Some(body) => builder
                .body(body.clone())
                .map(|r| self.agent.run(self.configured(r, streaming))),
            None => builder
                .body(())
                .map(|r| self.agent.run(self.configured(r, streaming))),
        };
        result
            .map_err(|error| TransportError::Failed(error.to_string()))?
            .map_err(classify)
    }

    /// A streamed request trades the whole-exchange deadline for stall deadlines.
    fn configured<S: ureq::AsSendBody>(
        &self,
        request: ureq::http::Request<S>,
        streaming: bool,
    ) -> ureq::http::Request<S> {
        if !streaming {
            return request;
        }
        self.agent
            .configure_request(request)
            .timeout_global(None)
            .timeout_resolve(Some(STREAM_STALL_TIMEOUT))
            .timeout_connect(Some(STREAM_STALL_TIMEOUT))
            .timeout_recv_response(Some(STREAM_STALL_TIMEOUT))
            .timeout_per_read(Some(STREAM_STALL_TIMEOUT))
            .build()
    }
}

fn text_headers(response: &ureq::http::Response<ureq::Body>) -> Vec<(String, String)> {
    response
        .headers()
        .iter()
        .filter_map(|(name, value)| {
            Some((name.as_str().to_owned(), value.to_str().ok()?.to_owned()))
        })
        .collect()
}

impl Transport for UreqTransport {
    fn send(&self, request: &HttpRequest) -> Result<HttpResponse, TransportError> {
        let mut response = self.run(request, false)?;
        let headers = text_headers(&response);
        let body = response
            .body_mut()
            .with_config()
            .limit(MAX_RESPONSE_BYTES)
            .read_to_vec()
            .map_err(|error| TransportError::Failed(error.to_string()))?;
        Ok(HttpResponse {
            status: response.status().as_u16(),
            headers,
            body,
        })
    }

    fn stream(&self, request: &HttpRequest) -> Result<HttpStream, TransportError> {
        let response = self.run(request, true)?;
        let headers = text_headers(&response);
        let status = response.status().as_u16();
        Ok(HttpStream {
            status,
            headers,
            body: Box::new(response.into_body().into_reader()),
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
