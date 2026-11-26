//! Platform Site Insights (Admin API): AI usage, the task list and access-log hour replay.
//!
//! Request and response shapes follow the admin-api OpenAPI document.

use serde::{Deserialize, Serialize};

use crate::Result;
use crate::api_path::{NO_BODY, api_path};
use crate::client::CustdClient;
use crate::measurement::null_as_empty;
use crate::site_analytics::SiteAIUsageRow;
use crate::transport::Method;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteAIPlatformUsage {
    pub from: String,
    pub period: SiteAIPlatformUsagePeriod,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub rows: Vec<SiteAIUsageRow>,
    pub sampling_monthly_cap_usd_micros: i64,
    pub until: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteInsightsTaskList {
    pub generated_at: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub tasks: Vec<SiteInsightsTaskStatus>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteInsightsTaskStatus {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub backlog: Vec<SiteInsightsBacklog>,
    pub enabled: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_failure: Option<String>,
    /// Start of the newest failed run among the recent runs.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_failure_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_run_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_run_status: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub next_run_at: Option<String>,
    /// False when this deployment's scheduler never registered the task.
    pub registered: bool,
    pub task_name: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteInsightsBacklog {
    pub count: i64,
    pub meaning: String,
    pub name: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccessLogHourReplayRequest {
    /// Start of the UTC hour, for example 2026-11-17T10:00:00Z.
    pub hour_start: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccessLogHourReplay {
    pub hour_start: String,
    /// How the hour stood; missing when unrecorded.
    pub previous_status: AccessLogHourReplayPreviousStatus,
    pub requested_at: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SiteAIPlatformUsagePeriod {
    #[serde(rename = "day")]
    Day,
    #[serde(rename = "month")]
    Month,
    #[serde(rename = "previous-month")]
    PreviousMonth,
}

impl SiteAIPlatformUsagePeriod {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Day => "day",
            Self::Month => "month",
            Self::PreviousMonth => "previous-month",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum AccessLogHourReplayPreviousStatus {
    #[serde(rename = "done")]
    Done,
    #[serde(rename = "partial")]
    Partial,
    #[serde(rename = "failed")]
    Failed,
    #[serde(rename = "missing")]
    Missing,
}

impl AccessLogHourReplayPreviousStatus {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Done => "done",
            Self::Partial => "partial",
            Self::Failed => "failed",
            Self::Missing => "missing",
        }
    }
}

impl CustdClient {
    /// Read platform-wide Site Insights AI usage for a UTC period.
    pub fn get_site_ai_platform_usage(
        &self,
        period: Option<SiteAIPlatformUsagePeriod>,
    ) -> Result<SiteAIPlatformUsage> {
        let path = api_path(
            "/api/v1/admin/site-insights/ai-usage".to_owned(),
            &[("period", period.map(|v| v.as_str().to_owned()))],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// List the Site Insights scheduler tasks with their state and backlog.
    pub fn list_site_insights_tasks(&self) -> Result<SiteInsightsTaskList> {
        let path = api_path("/api/v1/admin/site-insights/tasks".to_owned(), &[], None);
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Read one access-log hour again.
    pub fn replay_access_log_hour(
        &self,
        request: &AccessLogHourReplayRequest,
    ) -> Result<AccessLogHourReplay> {
        let path = api_path(
            "/api/v1/admin/access-log-hours/replay".to_owned(),
            &[],
            None,
        );
        self.call(Method::Post, &path, Some(request))
    }
}
