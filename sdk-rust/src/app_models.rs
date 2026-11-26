//! Stored runs of a hosted app's uncertainty model.

use serde::{Deserialize, Serialize};

use crate::measurement::null_as_empty;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppUncertaintyModel {
    pub model_uuid: String,
    pub name: String,
    pub description: String,
    pub latest_version: u32,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppModelRunRequest {
    pub seed: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sample_count: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sensitivity_output: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppModelRun {
    pub run_uuid: String,
    pub model_uuid: String,
    pub version_number: u32,
    pub seed: i64,
    pub sample_count: u32,
    pub created_at: String,
    pub source_forecast_run_uuid: Option<String>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub quantities: Vec<AppModelQuantityResult>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct AppModelQuantityResult {
    pub name: String,
    pub summary: Option<AppModelQuantitySummary>,
    pub error: Option<AppModelQuantityError>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppModelQuantitySummary {
    pub mean: f64,
    pub std_dev: f64,
    pub percentiles: AppModelPercentiles,
    pub histogram: AppModelHistogram,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct AppModelPercentiles {
    pub p5: f64,
    pub p25: f64,
    pub p50: f64,
    pub p75: f64,
    pub p95: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct AppModelHistogram {
    pub min: f64,
    pub max: f64,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub counts: Vec<u32>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct AppModelQuantityError {
    pub code: String,
    pub detail: String,
}
