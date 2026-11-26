//! Event queries (Analytics API `/api/v1/analytics/query` and `/query-range`).
//!
//! Request and response shapes follow the analytics-api OpenAPI document.

use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::Result;
use crate::api_path::api_path;
use crate::client::CustdClient;
use crate::measurement::null_as_empty;
use crate::transport::Method;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AnalyticsEventsQueryRequest {
    pub date: String,
    pub event_type: String,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub label_filters: Vec<AnalyticsLabelFilter>,
    pub limit: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub resource: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub service: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub severity: Option<String>,
    pub source: AnalyticsEventsQueryRequestSource,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub sub_client: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AnalyticsEventsQueryResponse {
    pub count: i64,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub results: Vec<BTreeMap<String, Value>>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub sources: Vec<AnalyticsSourceSummary>,
    pub timing: AnalyticsTimingSummary,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AnalyticsLabelFilter {
    pub key: String,
    pub value: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AnalyticsSourceSummary {
    pub complete: bool,
    pub count: i64,
    pub fresh: bool,
    pub freshness_lag_ms: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
    pub name: AnalyticsEventsQueryRequestSource,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub parquet_uri_count: Option<i64>,
    pub query_duration_ms: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AnalyticsTimingSummary {
    pub event_lag_max_ms: i64,
    pub event_lag_p50_ms: i64,
    pub event_lag_p95_ms: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub newest_event_timestamp: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub oldest_event_timestamp: Option<String>,
    pub query_duration_ms: i64,
    pub snapshot_age_ms: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AnalyticsRangeQueryRequest {
    pub event_type: String,
    pub from: String,
    pub group_by: String,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub label_filters: Vec<AnalyticsLabelFilter>,
    pub limit: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub resource: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub service: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub severity: Option<String>,
    pub source: AnalyticsEventsQueryRequestSource,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub sub_client: Option<String>,
    pub to: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AnalyticsRangeQueryResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub buckets: Vec<AnalyticsRangeBucket>,
    pub count: i64,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub rows: Vec<BTreeMap<String, Value>>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub sources: Vec<AnalyticsSourceSummary>,
    pub timing: AnalyticsTimingSummary,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AnalyticsRangeBucket {
    pub complete: bool,
    pub count: i64,
    pub date: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub parquet_uri_count: Option<i64>,
    pub query_duration_ms: i64,
    pub source: AnalyticsEventsQueryRequestSource,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum AnalyticsEventsQueryRequestSource {
    #[serde(rename = "auto")]
    Auto,
    #[serde(rename = "postgres")]
    Postgres,
    #[serde(rename = "duckdb")]
    Duckdb,
    #[serde(rename = "rollup")]
    Rollup,
    #[serde(rename = "materialized")]
    Materialized,
}

impl AnalyticsEventsQueryRequestSource {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Auto => "auto",
            Self::Postgres => "postgres",
            Self::Duckdb => "duckdb",
            Self::Rollup => "rollup",
            Self::Materialized => "materialized",
        }
    }
}

impl CustdClient {
    /// Query tenant events.
    pub fn query_analytics_events(
        &self,
        request: &AnalyticsEventsQueryRequest,
    ) -> Result<AnalyticsEventsQueryResponse> {
        let path = api_path("/api/v1/analytics/query".to_owned(), &[], None);
        self.call(Method::Post, &path, Some(request))
    }

    /// Query tenant event range.
    pub fn query_analytics_event_range(
        &self,
        request: &AnalyticsRangeQueryRequest,
    ) -> Result<AnalyticsRangeQueryResponse> {
        let path = api_path("/api/v1/analytics/query-range".to_owned(), &[], None);
        self.call(Method::Post, &path, Some(request))
    }
}
