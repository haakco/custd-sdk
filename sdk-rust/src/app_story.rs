//! A measurement item's forecast story (`/api/v1/app/forecast/story`): its measurements, the
//! forecast snapshots that converged on a finish date, and the chart Custd compiled for them.
//! The chart's layers and tables and a linked prediction are passed through as served.

use serde::Deserialize;
use serde_json::Value;

use crate::measurement::{MeasurementForecastWarning, null_as_empty};

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppForecastStory {
    pub project_uuid: String,
    pub project_name: String,
    pub project_kind: String,
    pub state: String,
    pub current_snapshot_uuid: Option<String>,
    pub truncated: bool,
    pub target: AppForecastStoryTarget,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub observations: Vec<AppForecastStoryObservation>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub snapshots: Vec<AppForecastStorySnapshot>,
    /// A linked prediction's story, as served.
    pub prediction: Option<Value>,
    pub delivery: AppForecastStoryDelivery,
    pub presentation: AppForecastStoryPresentation,
    pub trust: AppForecastStoryTrust,
    pub provenance: AppForecastStoryProvenance,
}

#[derive(Debug, Clone, Deserialize)]
pub struct AppForecastStoryTarget {
    pub available: bool,
    pub label: String,
    pub value: f64,
    pub deadline: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppForecastStoryObservation {
    pub observed_at: String,
    pub value: f64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct AppForecastStoryPercentiles {
    pub p10: Option<String>,
    pub p25: Option<String>,
    pub p50: Option<String>,
    pub p75: Option<String>,
    pub p90: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppForecastStorySnapshot {
    pub run_uuid: String,
    pub as_of_at: String,
    pub generated_at: String,
    pub horizon_end_at: Option<String>,
    pub input_count: i64,
    pub input_hash: Option<String>,
    pub interval_state: String,
    pub method: String,
    pub movement: String,
    pub observed_value: Option<f64>,
    pub output_probability: Option<f64>,
    pub percentiles: AppForecastStoryPercentiles,
    pub sample_count: i64,
    pub status: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub warnings: Vec<MeasurementForecastWarning>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppForecastStoryDelivery {
    pub target_date: Option<String>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub estimates: Vec<AppForecastStoryEstimate>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppForecastStoryEstimate {
    pub estimated_at: String,
    pub low: String,
    pub high: String,
    pub note: Option<String>,
    pub width_days: f64,
    pub movement_days: Option<f64>,
}

/// The compiled chart. Its layers, references and tables are server-rendered and passed through.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppForecastStoryPresentation {
    pub version: i64,
    pub preset_id: String,
    pub renderer: String,
    pub caption: String,
    pub summary: String,
    pub non_color_encoding: String,
    pub width: i64,
    pub height: i64,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub layers: Vec<Value>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub references: Vec<Value>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub table_columns: Vec<Value>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub table_rows: Vec<Value>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub supporting_tables: Vec<Value>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppForecastStoryTrust {
    pub state: String,
    pub evidence: String,
    pub observation_count: i64,
    pub snapshot_count: i64,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppForecastStoryProvenance {
    pub owner: String,
    pub generated_at: String,
    pub latest_engine: Option<String>,
    pub latest_input_hash: Option<String>,
}
