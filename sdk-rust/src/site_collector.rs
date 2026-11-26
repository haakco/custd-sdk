//! A Site's public write key: browser-style event collection (`/api/v1/collect/events`) and
//! error capture (`/api/v1/errors/api/{project}/envelope/`). No bearer token is involved.

use std::fmt;
use std::time::{SystemTime, UNIX_EPOCH};

use ring::rand::{SecureRandom, SystemRandom};
use serde::{Deserialize, Serialize};
use serde_json::json;
use url::Url;

use crate::client::{decode, execute, json_request, trim_base_url};
use crate::error::Error;
use crate::ingest::{
    EventEnvelope, EventIngestReceipt, SendEventsRequest, SendEventsResponse, check_batch_size,
    check_receipt, checked_batch,
};
use crate::transport::{Method, UreqTransport};
use crate::{Result, VERSION};

const WRITE_KEY_PREFIX: &str = "site_pk_";
const ERROR_ENVELOPE_PATH: &str = "/api/v1/errors/api/1/envelope/";

/// Whether the application caught the error.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ErrorCaptureMode {
    Handled,
    Unhandled,
}

/// One stack frame: a file name (no path), a 1-based line and an optional column.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ErrorCaptureFrame {
    pub filename: String,
    pub lineno: u32,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub colno: Option<u32>,
}

/// One captured Rust error. It carries the error's type and frames only, never its message, so
/// no user data leaves the application. `event_id` (32 lower-case hex digits) is generated when
/// unset.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ErrorCaptureEvent {
    pub event_id: Option<String>,
    pub exception_type: String,
    pub frames: Vec<ErrorCaptureFrame>,
    pub mode: ErrorCaptureMode,
    pub environment: String,
    pub release: Option<String>,
    pub correlation_id: Option<String>,
}

/// A Site's write key and one of its allowed origins.
#[derive(Clone)]
pub struct SiteCollector {
    base_url: String,
    write_key: String,
    origin: String,
}

impl SiteCollector {
    /// `write_key` is the Site's `site_pk_` key; `origin` is one of the Site's allowed origins.
    pub fn new(
        base_url: impl Into<String>,
        write_key: impl Into<String>,
        origin: impl Into<String>,
    ) -> Result<Self> {
        let write_key = write_key.into();
        let origin = origin.into();
        if !write_key.starts_with(WRITE_KEY_PREFIX) || origin.trim().is_empty() {
            return Err(Error::InvalidInput(
                "a site collector needs a site_pk_ write key and an allowed origin".to_owned(),
            ));
        }
        Ok(Self {
            base_url: trim_base_url(base_url.into()),
            write_key,
            origin,
        })
    }

    /// Collect one event. A receipt that does not acknowledge this event is an error.
    pub fn collect_event(&self, event: &EventEnvelope) -> Result<EventIngestReceipt> {
        let receipt: EventIngestReceipt = self.post("/api/v1/collect/events", event)?;
        check_receipt(&receipt, event)?;
        Ok(receipt)
    }

    /// Collect a batch of events; every result is checked against the sent events.
    pub fn collect_events(&self, request: &SendEventsRequest) -> Result<SendEventsResponse> {
        check_batch_size(request)?;
        let response = self.post("/api/v1/collect/events/batch", request)?;
        checked_batch(&request.events, response)
    }

    /// Send one error to the Site's error tracking. Any 2xx answer means it was accepted.
    pub fn capture_error(&self, event: &ErrorCaptureEvent) -> Result<()> {
        let body = self.error_envelope(event)?;
        let url = format!("{}{ERROR_ENVELOPE_PATH}", self.base_url);
        let mut request = json_request(Method::Post, url, Vec::new(), None::<&()>)?;
        request
            .headers
            .push(("Content-Type", "text/plain".to_owned()));
        request.body = Some(body.into_bytes());
        execute(&UreqTransport::new(), &request).map(|_| ())
    }

    fn post<T: serde::de::DeserializeOwned>(&self, path: &str, body: &impl Serialize) -> Result<T> {
        let headers = vec![
            ("Authorization", format!("Bearer {}", self.write_key)),
            ("Origin", self.origin.clone()),
        ];
        let request = json_request(
            Method::Post,
            format!("{}{path}", self.base_url),
            headers,
            Some(body),
        )?;
        decode(&execute(&UreqTransport::new(), &request)?.body)
    }

    /// The three-line envelope: its header with the write-key DSN, the item type, then the event.
    fn error_envelope(&self, event: &ErrorCaptureEvent) -> Result<String> {
        let event_id = match &event.event_id {
            Some(id) => id.clone(),
            None => random_event_id()?,
        };
        let mut dsn = Url::parse(&self.base_url)
            .map_err(|_| Error::InvalidInput("the base URL is not a URL".to_owned()))?;
        dsn.set_username(&self.write_key)
            .map_err(|()| Error::InvalidInput("the base URL cannot carry a key".to_owned()))?;
        dsn.set_path("/api/v1/errors/1");
        let mut body = json!({
            "event_id": event_id,
            "timestamp": unix_seconds(),
            "platform": "rust",
            "level": "error",
            "environment": event.environment,
            "sdk": {"name": "custd.rust", "version": VERSION},
            "exception": {"values": [{
                "type": event.exception_type,
                "mechanism": {"handled": event.mode == ErrorCaptureMode::Handled},
                "stacktrace": {"frames": event.frames},
            }]},
        });
        if let Some(release) = &event.release {
            body["release"] = json!(release);
        }
        if let Some(correlation_id) = &event.correlation_id {
            body["tags"] = json!({"correlation_id": correlation_id});
        }
        let header = json!({"event_id": event_id, "dsn": dsn.as_str()});
        Ok(format!("{header}\n{{\"type\":\"event\"}}\n{body}"))
    }
}

impl fmt::Debug for SiteCollector {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("SiteCollector")
            .field("base_url", &self.base_url)
            .field("write_key", &"<redacted>")
            .field("origin", &self.origin)
            .finish()
    }
}

fn random_event_id() -> Result<String> {
    let mut bytes = [0u8; 16];
    SystemRandom::new()
        .fill(&mut bytes)
        .map_err(|_| Error::Transport("error capture randomness unavailable".to_owned()))?;
    Ok(bytes.iter().map(|b| format!("{b:02x}")).collect())
}

fn unix_seconds() -> f64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_or(0.0, |elapsed| elapsed.as_secs_f64())
}
