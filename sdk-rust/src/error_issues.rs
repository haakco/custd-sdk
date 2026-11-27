//! Error issues (Admin API `/api/v1/error-issues`).
//!
//! Request and response shapes follow the admin-api OpenAPI document.

use serde::{Deserialize, Serialize};

use crate::Result;
use crate::api_path::{NO_BODY, api_path};
use crate::client::CustdClient;
use crate::measurement::null_as_empty;
use crate::transport::{Method, percent_encode};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ErrorIssueListResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub issues: Vec<ErrorIssue>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub next_cursor: Option<String>,
    pub open_count: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ErrorIssue {
    pub culprit: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub environments: Vec<String>,
    pub event_count: i64,
    pub exception_type: String,
    pub fingerprint: String,
    pub first_release: String,
    pub first_seen_at: String,
    pub last_release: String,
    pub last_seen_at: String,
    pub platform: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub regressed_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub resolved_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub resolved_release: Option<String>,
    pub site_name: String,
    pub site_uuid: String,
    pub state: ErrorIssueState,
    pub title: String,
    pub uuid: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ErrorIssueDetail {
    pub issue: ErrorIssue,
    pub latest_event: ErrorIssueEvent,
    pub latest_event_uuid: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ErrorIssueDetailWithCompanyName {
    #[serde(flatten)]
    pub detail: ErrorIssueDetail,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub company_name: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ErrorIssueEvent {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub correlation_id: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub environment: Option<String>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub exceptions: Vec<ErrorIssueException>,
    pub fingerprint: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub level: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub platform: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub release: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub runtime_name: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub runtime_version: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub sdk_name: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub sdk_version: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub site_uuid: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub truncated: Option<bool>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ErrorIssueException {
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub frames: Vec<ErrorIssueFrame>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub frames_omitted: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub handled: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub module: Option<String>,
    pub r#type: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub value: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ErrorIssueFrame {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub column: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub context_line: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub filename: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub function: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub in_app: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub line: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub module: Option<String>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub post_context: Vec<String>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub pre_context: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ErrorIssueStateRequest {
    pub state: ErrorIssueState,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ErrorIssueState {
    #[serde(rename = "open")]
    Open,
    #[serde(rename = "resolved")]
    Resolved,
    #[serde(rename = "ignored")]
    Ignored,
}

impl ErrorIssueState {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Open => "open",
            Self::Resolved => "resolved",
            Self::Ignored => "ignored",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ErrorIssuesState {
    #[serde(rename = "open")]
    Open,
    #[serde(rename = "resolved")]
    Resolved,
    #[serde(rename = "ignored")]
    Ignored,
    #[serde(rename = "all")]
    All,
}

impl ErrorIssuesState {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Open => "open",
            Self::Resolved => "resolved",
            Self::Ignored => "ignored",
            Self::All => "all",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ErrorIssuesSort {
    #[serde(rename = "recent")]
    Recent,
    #[serde(rename = "frequent")]
    Frequent,
}

impl ErrorIssuesSort {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Recent => "recent",
            Self::Frequent => "frequent",
        }
    }
}

impl CustdClient {
    /// List a tenant's error issues.
    pub fn list_error_issues(
        &self,
        site_uuid: Option<&str>,
        state: Option<ErrorIssuesState>,
        sort: Option<ErrorIssuesSort>,
        limit: Option<i64>,
        cursor: Option<&str>,
        company_slug: Option<&str>,
    ) -> Result<ErrorIssueListResponse> {
        let path = api_path(
            "/api/v1/error-issues".to_owned(),
            &[
                ("siteUuid", site_uuid.map(str::to_owned)),
                ("state", state.map(|v| v.as_str().to_owned())),
                ("sort", sort.map(|v| v.as_str().to_owned())),
                ("limit", limit.map(|v| v.to_string())),
                ("cursor", cursor.map(str::to_owned)),
            ],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Get one error issue with its latest error.
    pub fn get_error_issue(
        &self,
        issue_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<ErrorIssueDetail> {
        self.get_error_issue_record(issue_uuid, company_slug)
    }

    /// Get one error issue with its latest error and company name.
    pub fn get_error_issue_with_company_name(
        &self,
        issue_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<ErrorIssueDetailWithCompanyName> {
        self.get_error_issue_record(issue_uuid, company_slug)
    }

    fn get_error_issue_record<T: serde::de::DeserializeOwned>(
        &self,
        issue_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<T> {
        let path = api_path(
            format!("/api/v1/error-issues/{}", percent_encode(issue_uuid)),
            &[],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Resolve, ignore or reopen an error issue.
    pub fn update_error_issue_state(
        &self,
        issue_uuid: &str,
        request: &ErrorIssueStateRequest,
        company_slug: Option<&str>,
    ) -> Result<ErrorIssue> {
        let path = api_path(
            format!("/api/v1/error-issues/{}/state", percent_encode(issue_uuid)),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, Some(request))
    }
}
