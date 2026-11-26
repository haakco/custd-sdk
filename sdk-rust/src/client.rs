use std::cell::RefCell;
use std::fmt;
use std::sync::Arc;

use serde::Serialize;
use serde::de::DeserializeOwned;

use crate::error::{ApiError, Error, Problem};
use crate::transport::{HttpRequest, HttpResponse, HttpStream, Method, Transport, UreqTransport};
use crate::{Result, SDK_IDENTITY};

/// The signed-in Custd API: measurement projects, observations, estimates and forecasts.
///
/// `base_url` is the API origin, for example `https://api.custd.com`; `access_token` is the
/// bearer token from [`crate::DeviceLogin`] or another OAuth grant.
#[derive(Clone)]
pub struct CustdClient {
    base_url: String,
    access_token: String,
    acting_company: Option<String>,
    pub(crate) transport: Arc<dyn Transport>,
}

impl CustdClient {
    pub fn new(base_url: impl Into<String>, access_token: impl Into<String>) -> Self {
        Self {
            base_url: trim_base_url(base_url.into()),
            access_token: access_token.into(),
            acting_company: None,
            transport: Arc::new(UreqTransport::new()),
        }
    }

    /// Names the client company a system administrator acts for on the ingest cleanup-job routes,
    /// which read the tenant only from `X-Custd-Effective-Company`. The server then requires an
    /// active support grant for that company. Other calls never send it.
    pub fn with_acting_company(mut self, company_slug: impl Into<String>) -> Self {
        self.acting_company = Some(company_slug.into());
        self
    }

    /// The `X-Custd-Effective-Company` header for the cleanup-job routes, when one is set.
    pub(crate) fn acting_company_header(&self) -> Vec<(&'static str, &str)> {
        self.acting_company
            .as_deref()
            .map(|company| (EFFECTIVE_COMPANY_HEADER, company))
            .into_iter()
            .collect()
    }

    pub(crate) fn call<T: DeserializeOwned>(
        &self,
        method: Method,
        path: &str,
        body: Option<&impl Serialize>,
    ) -> Result<T> {
        self.call_with_headers(method, path, &[], body)
    }

    /// [`CustdClient::call`] with extra request headers, such as [`IDEMPOTENCY_KEY`].
    pub(crate) fn call_with_headers<T: DeserializeOwned>(
        &self,
        method: Method,
        path: &str,
        extra: &[(&'static str, &str)],
        body: Option<&impl Serialize>,
    ) -> Result<T> {
        let mut headers = vec![("Authorization", format!("Bearer {}", self.access_token))];
        headers.extend(
            extra
                .iter()
                .map(|(name, value)| (*name, (*value).to_owned())),
        );
        let request = json_request(method, format!("{}{path}", self.base_url), headers, body)?;
        let response = execute(self.transport.as_ref(), &request)?;
        decode(&response.body)
    }

    /// Sends a non-JSON body (an image, a file, a multipart form) and returns the raw answer.
    pub(crate) fn send_bytes(
        &self,
        method: Method,
        path: &str,
        content: Option<(&str, Vec<u8>)>,
    ) -> Result<HttpResponse> {
        self.send_bytes_with_headers(method, path, &[], content)
    }

    /// [`CustdClient::send_bytes`] with extra request headers.
    pub(crate) fn send_bytes_with_headers(
        &self,
        method: Method,
        path: &str,
        extra: &[(&'static str, &str)],
        content: Option<(&str, Vec<u8>)>,
    ) -> Result<HttpResponse> {
        let mut headers = vec![("Authorization", format!("Bearer {}", self.access_token))];
        headers.extend(
            extra
                .iter()
                .map(|(name, value)| (*name, (*value).to_owned())),
        );
        let mut request = json_request(
            method,
            format!("{}{path}", self.base_url),
            headers,
            None::<&()>,
        )?;
        if let Some((content_type, bytes)) = content {
            request
                .headers
                .push(("Content-Type", content_type.to_owned()));
            request.body = Some(bytes);
        }
        execute(self.transport.as_ref(), &request)
    }

    /// Sends a bodiless GET and returns a success answer with its body unread. Any other answer
    /// is read whole and becomes [`Error::Api`], so a problem body never reaches a download.
    pub(crate) fn stream_get(&self, path: &str) -> Result<HttpStream> {
        let headers = vec![("Authorization", format!("Bearer {}", self.access_token))];
        let request = json_request(
            Method::Get,
            format!("{}{path}", self.base_url),
            headers,
            None::<&()>,
        )?;
        let transport_error =
            |error: crate::transport::TransportError| Error::Transport(error.message().to_owned());
        let stream = self.transport.stream(&request).map_err(transport_error)?;
        record_request_id(stream.header(REQUEST_ID_HEADER));
        let status = stream.status;
        if (200..300).contains(&status) {
            return Ok(stream);
        }
        checked(stream.buffered().map_err(transport_error)?)?;
        Err(Error::InvalidResponse(format!(
            "a download answered HTTP {status}"
        )))
    }
}

/// The header that makes a retried write safe: a repeat with the same key returns the first answer.
pub(crate) const IDEMPOTENCY_KEY: &str = "Idempotency-Key";

/// The header that asks for grant-backed support context for one client company.
const EFFECTIVE_COMPANY_HEADER: &str = "X-Custd-Effective-Company";

/// A JSON call that carries no Custd bearer token: a public route, or one with its own key header.
pub(crate) fn call_public<T: DeserializeOwned>(
    base_url: &str,
    method: Method,
    path: &str,
    headers: Vec<(&'static str, String)>,
    body: Option<&impl Serialize>,
) -> Result<T> {
    let url = format!("{}{path}", trim_base_url(base_url.to_owned()));
    let request = json_request(method, url, headers, body)?;
    decode(&execute(&UreqTransport::new(), &request)?.body)
}

impl fmt::Debug for CustdClient {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("CustdClient")
            .field("base_url", &self.base_url)
            .field("access_token", &"<redacted>")
            .field("acting_company", &self.acting_company)
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
    checked(response)
}

/// The response header carrying the server's request identifier.
const REQUEST_ID_HEADER: &str = "x-request-id";

/// The server-side identifiers of the answers [`record_metadata`] saw.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct ResponseMetadata {
    /// The last answer's `X-Request-Id`, refusals included; `None` when the server sent none.
    pub request_id: Option<String>,
}

thread_local! {
    static RECORDERS: RefCell<Vec<ResponseMetadata>> = const { RefCell::new(Vec::new()) };
}

/// Runs `call` and returns its result with the request ID of the last answer it received, so a
/// caller can quote the request the server logged without any method returning metadata:
///
/// ```no_run
/// # let client = custd_sdk::CustdClient::new("https://api.custd.com", "token");
/// let (policy, metadata) = custd_sdk::record_metadata(|| client.get_machine_access(None));
/// println!("{:?} {:?}", policy.is_ok(), metadata.request_id);
/// ```
///
/// Recording is per thread; nested calls record into the innermost one.
pub fn record_metadata<T>(call: impl FnOnce() -> T) -> (T, ResponseMetadata) {
    RECORDERS.with(|recorders| recorders.borrow_mut().push(ResponseMetadata::default()));
    struct Pop;
    impl Drop for Pop {
        fn drop(&mut self) {
            RECORDERS.with(|recorders| recorders.borrow_mut().pop());
        }
    }
    let pop = Pop;
    let result = call();
    let metadata =
        RECORDERS.with(|recorders| recorders.borrow().last().cloned().unwrap_or_default());
    drop(pop);
    (result, metadata)
}

fn record_request_id(request_id: Option<&str>) {
    let Some(request_id) = request_id.filter(|id| !id.is_empty()) else {
        return;
    };
    RECORDERS.with(|recorders| {
        if let Some(current) = recorders.borrow_mut().last_mut() {
            current.request_id = Some(request_id.to_owned());
        }
    });
}

/// A 2xx or 304 answer as is; anything else becomes [`Error::Api`].
/// Every answer's request ID is recorded for [`record_metadata`]; a refusal also carries it.
pub(crate) fn checked(response: HttpResponse) -> Result<HttpResponse> {
    let header = response.header(REQUEST_ID_HEADER).map(str::to_owned);
    record_request_id(header.as_deref());
    if (200..300).contains(&response.status) || response.status == 304 {
        return Ok(response);
    }
    let problem = serde_json::from_slice::<Problem>(&response.body).ok();
    let request_id = header.filter(|id| !id.is_empty()).or_else(|| {
        let problem = problem.as_ref()?;
        problem
            .request_id
            .clone()
            .or_else(|| problem.trace_id.clone())
    });
    Err(Error::Api(ApiError {
        status: response.status,
        problem: problem.map(Box::new),
        request_id,
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
