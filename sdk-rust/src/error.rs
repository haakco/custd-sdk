use std::fmt;

use serde::Deserialize;

use crate::device::DeviceLoginError;

/// Why a call failed.
#[derive(Debug)]
pub enum Error {
    /// The request did not complete: DNS, connect, TLS, timeout or a broken connection.
    Transport(String),
    /// Custd answered with a non-success status.
    Api(ApiError),
    /// The answer was not the JSON shape this SDK expects.
    Decode(String),
    /// The answer decoded but broke the contract, for example a missing per-row result.
    InvalidResponse(String),
    /// The caller's input cannot be sent.
    InvalidInput(String),
    /// Device-code login ended without a token.
    DeviceLogin(DeviceLoginError),
}

/// A non-success answer, with its RFC 9457 problem details when Custd sent them.
#[derive(Debug, Clone)]
pub struct ApiError {
    pub status: u16,
    pub problem: Option<Box<Problem>>,
}

/// RFC 9457 problem details as Custd sends them.
#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Problem {
    #[serde(rename = "type", default)]
    pub problem_type: String,
    #[serde(default)]
    pub title: String,
    #[serde(default)]
    pub status: u16,
    pub detail: Option<String>,
    pub code: Option<String>,
    pub instance: Option<String>,
    pub trace_id: Option<String>,
    /// `none` or `bounded`: whether repeating the same request can succeed.
    pub retryability: Option<String>,
}

impl ApiError {
    /// The problem's `code`, such as `app_item_meeting_step_refused`, when Custd sent one.
    pub fn code(&self) -> Option<&str> {
        self.problem.as_ref()?.code.as_deref()
    }
}

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Error::Transport(message) => write!(f, "custd: request failed: {message}"),
            Error::Api(api) => write!(f, "{api}"),
            Error::Decode(message) => write!(f, "custd: decode response: {message}"),
            Error::InvalidResponse(message) => write!(f, "custd: invalid response: {message}"),
            Error::InvalidInput(message) => write!(f, "custd: invalid input: {message}"),
            Error::DeviceLogin(error) => write!(f, "{error}"),
        }
    }
}

impl fmt::Display for ApiError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "custd: HTTP {}", self.status)?;
        let Some(problem) = &self.problem else {
            return Ok(());
        };
        write!(f, ": {}", problem.title)?;
        if let Some(detail) = &problem.detail {
            write!(f, ": {detail}")?;
        }
        Ok(())
    }
}

impl std::error::Error for Error {}
