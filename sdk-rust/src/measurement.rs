//! Measurement projects (Admin API) and their forecasts (Analytics API).
//!
//! The shapes follow `MeasurementProject*`, `MeasurementObservation*`, `ProjectEstimate*` and
//! `MeasurementForecastRun*` in Custd's generated OpenAPI documents.

use std::collections::BTreeMap;

use serde::{Deserialize, Deserializer, Serialize};

use crate::Result;
use crate::api_path::api_path;
use crate::client::CustdClient;
use crate::error::Error;
use crate::transport::{Method, percent_encode};

const ADMIN_PROJECTS: &str = "/api/v1/admin/measurement/projects";
const ANALYTICS_PROJECTS: &str = "/api/v1/measurement/projects";

/// Decodes a JSON `null` as empty; Custd serialises an empty Go slice or map as `null`.
pub(crate) fn null_as_empty<'de, D, T>(deserializer: D) -> std::result::Result<T, D::Error>
where
    D: Deserializer<'de>,
    T: Deserialize<'de> + Default,
{
    Ok(Option::<T>::deserialize(deserializer)?.unwrap_or_default())
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementProjectCreate {
    pub project_code: String,
    pub name: String,
    /// For example `deadline_forecast` or `runway_forecast`.
    pub kind: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub series: Vec<MeasurementSeriesCreate>,
    pub target: MeasurementTargetCreate,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementSeriesCreate {
    pub series_code: String,
    pub name: String,
    pub unit_slug: String,
    pub completion_direction: String,
    pub source: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementTargetCreate {
    pub target_code: String,
    pub name: String,
    pub target_value: f64,
    /// RFC 3339 date-time.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub target_date: Option<String>,
    pub state: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementProject {
    pub project_uuid: String,
    pub project_code: String,
    pub kind: String,
    pub status: String,
    pub name: String,
    #[serde(default)]
    pub description: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub series: Vec<MeasurementSeries>,
    pub target: Option<MeasurementTarget>,
    pub delivery: MeasurementProjectDelivery,
    pub run: MeasurementProjectRun,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementSeries {
    pub series_uuid: String,
    pub series_code: String,
    pub name: String,
    pub unit_slug: String,
    /// The unit's display label, such as `tasks`; absent when the unit has none.
    #[serde(default)]
    pub unit_label: Option<String>,
    pub completion_direction: String,
    pub source: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementTarget {
    pub target_uuid: String,
    pub target_code: String,
    pub name: String,
    pub target_value: f64,
    pub target_date: Option<String>,
    pub completed_at: Option<String>,
    pub state: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementProjectDelivery {
    pub definition_of_done: String,
    pub target_date: Option<String>,
    pub completed_at: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementProjectRun {
    pub similar: bool,
    pub forecast_method: Option<String>,
    pub series_root_uuid: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct MeasurementProjectList {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub projects: Vec<MeasurementProject>,
}

/// One measurement of a series.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementObservation {
    pub series_uuid: String,
    /// RFC 3339 date-time.
    pub observed_at: String,
    pub value: f64,
    /// Repeating a row with the same key does not record it twice.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub idempotency_key: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct MeasurementObservationBulk {
    pub rows: Vec<MeasurementObservation>,
}

#[derive(Serialize)]
pub(crate) struct MeasurementObservationCsv<'a> {
    pub csv: &'a str,
}

/// The outcome of an observation import, one result per submitted row.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementObservationImport {
    pub import_id: String,
    pub accepted: i64,
    pub rejected: i64,
    /// Set when this import met the project's target.
    pub completed_target_uuid: Option<String>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub results: Vec<MeasurementObservationResult>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementObservationResult {
    pub row_index: i64,
    pub success: bool,
    pub status: Option<i64>,
    pub observation_uuid: Option<String>,
    #[serde(rename = "type")]
    pub problem_type: Option<String>,
    pub title: Option<String>,
    pub detail: Option<String>,
}

/// A dated low/high delivery estimate.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectEstimateCreate {
    /// RFC 3339 date-time; blank means now.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub estimated_at: Option<String>,
    pub low_date: String,
    pub high_date: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub note: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectEstimate {
    pub estimate_uuid: String,
    pub estimated_at: String,
    pub low_date: String,
    pub high_date: String,
    #[serde(default)]
    pub note: String,
}

/// A project's estimates, oldest first, with the standing of the latest one.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectEstimateList {
    pub delivery_target_date: Option<String>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub estimates: Vec<ProjectEstimate>,
    pub latest: Option<ProjectEstimateStatus>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectEstimateStatus {
    pub estimate: ProjectEstimate,
    pub chance_by_delivery_target: Option<f64>,
    pub age_days: f64,
    pub movement_days: Option<f64>,
}

/// Completes a project on its actual delivery date (RFC 3339).
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectComplete {
    pub completed_at: String,
}

#[derive(Debug, Clone, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementForecastRunRequest {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub forecast_from: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub method: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sample_count: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementForecastRun {
    pub forecast_run_uuid: String,
    pub project_uuid: String,
    pub status: String,
    pub method: String,
    pub generated_at: String,
    pub forecast_from: Option<String>,
    pub input_count: i64,
    pub sample_count: i64,
    pub seed: i64,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub percentiles: BTreeMap<String, String>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub provenance: BTreeMap<String, String>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub warnings: Vec<MeasurementForecastWarning>,
    /// The counter forecast: rate, completion interval, deadline chance and chart lines.
    pub counter: Option<MeasurementForecastCounter>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct MeasurementForecastWarning {
    pub code: String,
    pub severity: String,
    pub message: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementForecastCounter {
    pub pooled_run_count: i64,
    /// The chance of reaching the target by its date, 0 to 1.
    pub deadline_probability: Option<f64>,
    pub completion_interval: Option<MeasurementForecastInterval>,
    pub rate: Option<MeasurementForecastRate>,
    pub detail: MeasurementForecastDetail,
}

#[derive(Debug, Clone, Deserialize)]
pub struct MeasurementForecastInterval {
    pub confidence: f64,
    pub lower: String,
    pub upper: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementForecastRate {
    pub per_second: f64,
    pub per_minute: f64,
    pub per_hour: f64,
    pub per_day: f64,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementForecastDetail {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub posterior_lines: Vec<MeasurementForecastLine>,
    pub arrival_histogram: MeasurementForecastHistogram,
}

#[derive(Debug, Clone, Deserialize)]
pub struct MeasurementForecastLine {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub points: Vec<MeasurementForecastPoint>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct MeasurementForecastPoint {
    pub at: String,
    pub value: f64,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementForecastHistogram {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub bins: Vec<MeasurementForecastHistogramBin>,
    pub never_count: i64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct MeasurementForecastHistogramBin {
    pub start: String,
    pub end: String,
    pub count: i64,
}

/// Checks the per-row contract: one result per submitted row, and every accepted row names its
/// observation. An HTTP 202 alone does not prove the rows were stored.
pub(crate) fn validate_import(
    import: MeasurementObservationImport,
    submitted_rows: usize,
) -> Result<MeasurementObservationImport> {
    if import.results.len() != submitted_rows {
        return Err(Error::InvalidResponse(format!(
            "measurement result count {} does not match submitted row count {submitted_rows}",
            import.results.len()
        )));
    }
    let missing = import
        .results
        .iter()
        .position(|r| r.success && r.observation_uuid.as_deref().unwrap_or("").is_empty());
    if let Some(index) = missing {
        return Err(Error::InvalidResponse(format!(
            "measurement result {index} missing observationUuid"
        )));
    }
    Ok(import)
}

/// An Admin API project path; a system administrator names the tenant with `company_slug`.
fn admin_project_path(project: Option<&str>, suffix: &str, company_slug: Option<&str>) -> String {
    let project = project.map_or(String::new(), |p| format!("/{}", percent_encode(p)));
    api_path(
        format!("{ADMIN_PROJECTS}{project}{suffix}"),
        &[],
        company_slug,
    )
}

fn analytics_project_path(project: &str, suffix: &str) -> String {
    format!("{ANALYTICS_PROJECTS}/{}{suffix}", percent_encode(project))
}

const NO_BODY: Option<&()> = None;

/// The Admin API project routes take `company_slug`, sent as `?companySlug=`, so a system
/// administrator can name the tenant; a tenant credential passes `None`.
impl CustdClient {
    pub fn create_measurement_project(
        &self,
        request: &MeasurementProjectCreate,
        company_slug: Option<&str>,
    ) -> Result<MeasurementProject> {
        let path = admin_project_path(None, "", company_slug);
        self.call(Method::Post, &path, Some(request))
    }

    pub fn list_measurement_projects(
        &self,
        company_slug: Option<&str>,
    ) -> Result<MeasurementProjectList> {
        let path = admin_project_path(None, "", company_slug);
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Reads a project by its UUID or code.
    pub fn get_measurement_project(
        &self,
        project: &str,
        company_slug: Option<&str>,
    ) -> Result<MeasurementProject> {
        let path = admin_project_path(Some(project), "", company_slug);
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Adds observations, one or in bulk, and checks every row's result.
    pub fn add_measurement_observations(
        &self,
        project: &str,
        request: &MeasurementObservationBulk,
        company_slug: Option<&str>,
    ) -> Result<MeasurementObservationImport> {
        let path = admin_project_path(Some(project), "/observations:bulk", company_slug);
        let import = self.call(Method::Post, &path, Some(request))?;
        validate_import(import, request.rows.len())
    }

    /// Imports observations from CSV text; `expected_rows` is the number of data rows sent.
    pub fn import_measurement_observations_csv(
        &self,
        project: &str,
        csv: &str,
        expected_rows: usize,
        company_slug: Option<&str>,
    ) -> Result<MeasurementObservationImport> {
        let path = admin_project_path(Some(project), "/observations:csv", company_slug);
        let import = self.call(
            Method::Post,
            &path,
            Some(&MeasurementObservationCsv { csv }),
        )?;
        validate_import(import, expected_rows)
    }

    pub fn create_project_estimate(
        &self,
        project: &str,
        request: &ProjectEstimateCreate,
        company_slug: Option<&str>,
    ) -> Result<ProjectEstimate> {
        let path = admin_project_path(Some(project), "/estimates", company_slug);
        self.call(Method::Post, &path, Some(request))
    }

    pub fn list_project_estimates(
        &self,
        project: &str,
        company_slug: Option<&str>,
    ) -> Result<ProjectEstimateList> {
        let path = admin_project_path(Some(project), "/estimates", company_slug);
        self.call(Method::Get, &path, NO_BODY)
    }

    pub fn complete_project(
        &self,
        project: &str,
        request: &ProjectComplete,
        company_slug: Option<&str>,
    ) -> Result<MeasurementProject> {
        let path = admin_project_path(Some(project), "/complete", company_slug);
        self.call(Method::Post, &path, Some(request))
    }

    pub fn run_measurement_forecast(
        &self,
        project: &str,
        request: &MeasurementForecastRunRequest,
    ) -> Result<MeasurementForecastRun> {
        let path = analytics_project_path(project, "/forecast-runs");
        self.call(Method::Post, &path, Some(request))
    }

    pub fn get_measurement_forecast_run(
        &self,
        project: &str,
        run_uuid: &str,
    ) -> Result<MeasurementForecastRun> {
        let path = analytics_project_path(
            project,
            &format!("/forecast-runs/{}", percent_encode(run_uuid)),
        );
        self.call(Method::Get, &path, NO_BODY)
    }
}
