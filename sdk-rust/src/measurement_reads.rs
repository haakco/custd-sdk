//! Tenant measurement reads (Analytics API): the measurement overview and a project's forecast story.
//!
//! Request and response shapes follow the analytics-api OpenAPI document.

use serde::{Deserialize, Serialize};

use crate::Result;
use crate::api_path::{NO_BODY, api_path};
use crate::client::CustdClient;
use crate::measurement::MeasurementForecastWarning;
use crate::measurement::null_as_empty;
use crate::transport::{Method, percent_encode};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementOverviewResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub areas: Vec<MeasurementOverviewArea>,
    /// UTC generation time in RFC 3339 format.
    pub generated_at: String,
    pub tenant: MeasurementOverviewTenant,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementOverviewArea {
    pub detail: String,
    pub headline: String,
    pub key: String,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub points: Vec<MeasurementOverviewPoint>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub provenance: Option<String>,
    pub state: String,
    pub title: String,
    pub value: String,
    pub widget_kind: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementOverviewTenant {
    pub company_slug: String,
    pub label: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementOverviewPoint {
    pub label: String,
    pub value: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementForecastStoryResponse {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub current_snapshot_uuid: Option<String>,
    pub delivery: MeasurementForecastStoryDelivery,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub observations: Vec<MeasurementForecastStoryObservation>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub prediction: Option<MeasurementPredictionStory>,
    pub presentation: MeasurementCompiledPresentation,
    pub project_kind: String,
    pub project_name: String,
    pub project_uuid: String,
    pub provenance: MeasurementForecastStoryProvenance,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub snapshots: Vec<MeasurementForecastStorySnapshot>,
    pub state: String,
    pub target: MeasurementForecastStoryTarget,
    pub truncated: bool,
    pub trust: MeasurementForecastStoryTrust,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementForecastStoryDelivery {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub estimates: Vec<MeasurementForecastStoryEstimate>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub target_date: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementForecastStoryObservation {
    pub observed_at: String,
    pub value: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementPredictionStory {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub contributions: Vec<MeasurementPredictionContribution>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub current: Option<MeasurementPredictionStoryPoint>,
    pub definition_key: String,
    pub definition_uuid: String,
    pub display_name: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub evaluation: Option<MeasurementPredictionStoryEvaluation>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub history: Vec<MeasurementPredictionStoryPoint>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub outcomes: Vec<MeasurementPredictionStoryOutcome>,
    pub quality_state: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub sources: Vec<MeasurementPredictionSourceHealth>,
    pub state: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementCompiledPresentation {
    pub caption: String,
    pub height: i64,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub layers: Vec<PresentationLayer>,
    pub non_color_encoding: String,
    pub preset_id: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub references: Vec<PresentationReference>,
    pub renderer: String,
    pub summary: String,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub supporting_tables: Vec<PresentationSupportingTable>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub table_columns: Vec<PresentationTableColumn>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub table_rows: Vec<PresentationTableRow>,
    pub version: i64,
    pub width: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementForecastStoryProvenance {
    pub generated_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub latest_engine: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub latest_input_hash: Option<String>,
    pub owner: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementForecastStorySnapshot {
    pub as_of_at: String,
    pub generated_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub horizon_end_at: Option<String>,
    pub input_count: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub input_hash: Option<String>,
    pub interval_state: String,
    pub method: String,
    pub movement: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub observed_value: Option<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub output_probability: Option<f64>,
    pub percentiles: MeasurementForecastStoryPercentiles,
    pub run_uuid: String,
    pub sample_count: i64,
    pub status: String,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub warnings: Vec<MeasurementForecastWarning>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementForecastStoryTarget {
    pub available: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub deadline: Option<String>,
    pub label: String,
    pub value: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementForecastStoryTrust {
    pub evidence: String,
    pub observation_count: i64,
    pub snapshot_count: i64,
    pub state: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementForecastStoryEstimate {
    pub estimated_at: String,
    pub high: String,
    pub low: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub movement_days: Option<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub note: Option<String>,
    pub width_days: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementPredictionContribution {
    pub delta: f64,
    pub feature_key: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub feature_value: Option<f64>,
    pub movement: String,
    pub value: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementPredictionStoryPoint {
    pub as_of_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub horizon_end_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub input_hash: Option<String>,
    pub probability: f64,
    pub run_uuid: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementPredictionStoryEvaluation {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub brier_score: Option<f64>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub calibration: Vec<MeasurementPredictionCalibrationBucket>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub log_loss: Option<f64>,
    pub negative_count: i64,
    pub positive_count: i64,
    pub resolved_run_count: i64,
    pub window_end_at: String,
    pub window_start_at: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementPredictionStoryOutcome {
    pub is_late_evidence: bool,
    pub observed_value: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub outcome_kind: Option<String>,
    pub resolution: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub resolved_at: Option<String>,
    pub run_uuid: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementPredictionSourceHealth {
    pub consecutive_failures: i64,
    pub display_name: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_attempt_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_succeeded_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub next_eligible_at: Option<String>,
    pub source_key: String,
    pub status: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PresentationLayer {
    pub label: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub points: Vec<PresentationPoint>,
    pub role: String,
    pub y_kind: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PresentationReference {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub date: Option<String>,
    pub label: String,
    pub role: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub value: Option<f64>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PresentationSupportingTable {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub columns: Vec<PresentationTableColumn>,
    pub key: String,
    pub label: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub rows: Vec<PresentationSupportingTableRow>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PresentationTableColumn {
    pub key: String,
    pub label: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PresentationTableRow {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub cells: Vec<String>,
    pub snapshot_uuid: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementForecastStoryPercentiles {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub p10: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub p25: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub p50: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub p75: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub p90: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementPredictionCalibrationBucket {
    pub lower: f64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub observed_rate: Option<f64>,
    pub positive_count: i64,
    pub predicted: f64,
    pub sample_count: i64,
    pub upper: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PresentationPoint {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub date: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub lower_date: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub lower_value: Option<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub selected: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub snapshot_uuid: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub upper_date: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub upper_value: Option<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub value: Option<f64>,
    pub x: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PresentationSupportingTableRow {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub cells: Vec<String>,
    pub key: String,
}

impl CustdClient {
    /// Get measurement overview.
    pub fn get_measurement_overview(&self) -> Result<MeasurementOverviewResponse> {
        let path = api_path("/api/v1/measurement/overview".to_owned(), &[], None);
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Get recorded forecast story.
    pub fn get_measurement_forecast_story(
        &self,
        project_uuid: &str,
    ) -> Result<MeasurementForecastStoryResponse> {
        let path = api_path(
            format!(
                "/api/v1/measurement/projects/{}/forecast-story",
                percent_encode(project_uuid)
            ),
            &[],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }
}
