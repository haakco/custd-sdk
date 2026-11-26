//! Analytics API reads that Custd's OpenAPI document does not describe: the realtime active-visitor
//! count, the stored-event dashboard summary, the per-day event count, draft reporting-pack previews,
//! the tenant's prediction reads and decision simulation runs.
//!
//! Shapes follow the analytics-api handler and service types. The credential names the tenant.

use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};

use crate::Result;
use crate::api_path::{NO_BODY, api_path};
use crate::client::CustdClient;
use crate::measurement::null_as_empty;
use crate::reporting::{RenderedWidgetData, ReportingQueryRequest};
use crate::reporting_packs::ReportingPack;
use crate::transport::{Method, percent_encode};

const PREDICTION_DEFINITIONS: &str = "/api/v1/measurement/predictions/definitions";

/// How many sessions were active on a site in the window.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AnalyticsActiveNow {
    pub active_now: i64,
    pub window_seconds: i64,
}

/// The tenant's stored-event overview.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AnalyticsDashboardSummary {
    pub tenant: AnalyticsDashboardTenant,
    pub events: AnalyticsDashboardEvents,
    pub coverage: AnalyticsDashboardCoverage,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub loaded_days: Vec<AnalyticsDashboardLoadedDay>,
    pub dogfood: AnalyticsDashboardDogfood,
    pub generated_at: String,
}

/// The tenant a summary describes.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AnalyticsDashboardTenant {
    pub company_slug: String,
}

/// The tenant's stored-event totals.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AnalyticsDashboardEvents {
    pub total: i64,
    pub oldest_event_at: Option<String>,
    pub latest_event_at: Option<String>,
    pub latest_received_at: Option<String>,
    pub loaded_day_count: i64,
}

/// The span of days with stored events.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AnalyticsDashboardCoverage {
    pub first_day: String,
    pub last_day: String,
    pub loaded_day_count: i64,
}

/// One stored day and its archive state.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AnalyticsDashboardLoadedDay {
    pub date: String,
    pub event_count: i64,
    pub archive_status: String,
    pub archive_verified_at: Option<String>,
    pub query_href: String,
}

/// The internal dogfood view; empty for client tenants.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AnalyticsDashboardDogfood {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub sources: Vec<AnalyticsDashboardDogfoodSource>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub metrics: Vec<AnalyticsDashboardDogfoodMetric>,
}

/// One internal source's delivery health.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AnalyticsDashboardDogfoodSource {
    pub source_system: String,
    pub source_company: String,
    pub environment: String,
    pub event_count: i64,
    pub latest_event_at: Option<String>,
    pub latest_event_type: String,
    pub failure_count: i64,
    pub rejection_count: i64,
    pub status: String,
}

/// One internal operational metric.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AnalyticsDashboardDogfoodMetric {
    pub source_system: String,
    pub service: String,
    pub metric_name: String,
    pub metric_kind: String,
    pub value: f64,
    pub unit: String,
    pub window_start: Option<String>,
    pub window_end: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub route: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub status: Option<String>,
}

/// How many events the tenant stored on one day.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct AnalyticsTelemetryEventCount {
    pub count: i64,
}

/// One query rendered against a reporting-pack definition that is not published. `tenant_slug`
/// must be the credential's tenant unless the caller is a system administrator.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingDraftPreviewRequest {
    pub tenant_slug: String,
    pub definition: ReportingPack,
    pub query: ReportingQueryRequest,
}

/// One active prediction definition, as the tenant reads it.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementPredictionDefinitionRead {
    pub uuid: String,
    pub definition_key: String,
    pub display_name: String,
    pub status: String,
    pub is_paused: bool,
    pub updated_at: String,
}

/// The tenant's active prediction definitions.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct MeasurementPredictionDefinitionReadList {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub items: Vec<MeasurementPredictionDefinitionRead>,
}

/// One run of a prediction definition.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementPredictionRunRead {
    pub run_uuid: String,
    pub as_of: String,
    pub horizon_end: String,
    pub output: f64,
    pub baseline: f64,
    pub override_applied: bool,
    pub input_hash: String,
    pub contribution_count: i64,
    pub generated_at: String,
}

/// A definition's runs, newest first.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct MeasurementPredictionRunReadList {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub items: Vec<MeasurementPredictionRunRead>,
}

/// How one prediction run resolved.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementPredictionOutcomeRead {
    pub run_uuid: String,
    pub resolution: String,
    pub outcome_kind: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub resolved_at: Option<String>,
    pub observed_value: i64,
    pub is_late_evidence: bool,
}

/// A definition's outcomes.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct MeasurementPredictionOutcomeReadList {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub items: Vec<MeasurementPredictionOutcomeRead>,
}

/// The latest scored window of a definition's resolved runs.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementPredictionEvaluationRead {
    pub window_start_at: String,
    pub window_end_at: String,
    pub resolved_run_count: i64,
    pub positive_count: i64,
    pub negative_count: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub brier_score: Option<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub log_loss: Option<f64>,
    pub sparse_bucket_count: i64,
}

/// Starts a value-of-information simulation of a decision; unset fields take the server defaults.
#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementSimulationRunRequest {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub sample_count: Option<i64>,
}

/// A decision simulation run and the value of measuring each variable.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementSimulationRun {
    pub simulation_run_uuid: String,
    pub project_uuid: String,
    pub decision_uuid: String,
    pub status: String,
    pub method: String,
    pub generated_at: String,
    pub completed_at: String,
    pub sample_count: i64,
    pub seed: i64,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub variables: Vec<MeasurementSimulationVariable>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub warnings: Vec<MeasurementSimulationWarning>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub provenance: BTreeMap<String, String>,
}

/// One decision variable's expected value of perfect (and partial) information.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementSimulationVariable {
    pub variable_uuid: String,
    pub name: String,
    pub rank: i64,
    pub evpi: f64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub evppi: Option<f64>,
    pub measurement_cost: f64,
    pub worth_measuring: bool,
}

/// A caveat on a simulation run.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct MeasurementSimulationWarning {
    pub code: String,
    pub severity: String,
    pub message: String,
}

impl CustdClient {
    /// Count the sessions active on one site now. A 503 means realtime counts are unavailable and
    /// the caller should hide them.
    pub fn get_analytics_active_now(&self, site: &str) -> Result<AnalyticsActiveNow> {
        let query = [("site", Some(site.to_owned()))];
        let path = api_path("/api/v1/analytics/active-now".to_owned(), &query, None);
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Read the tenant's stored-event overview.
    pub fn get_analytics_dashboard_summary(&self) -> Result<AnalyticsDashboardSummary> {
        self.call(Method::Get, "/api/v1/analytics/dashboard-summary", NO_BODY)
    }

    /// Count the tenant's events on one UTC date (`YYYY-MM-DD`), optionally of one event type.
    pub fn get_telemetry_event_count(
        &self,
        date: &str,
        event_type: Option<&str>,
    ) -> Result<AnalyticsTelemetryEventCount> {
        let query = [
            ("date", Some(date.to_owned())),
            ("eventType", event_type.map(str::to_owned)),
        ];
        let path = api_path("/api/v1/telemetry/event-count".to_owned(), &query, None);
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Render one query against a reporting-pack definition that is not published.
    pub fn preview_reporting_draft(
        &self,
        request: &ReportingDraftPreviewRequest,
    ) -> Result<RenderedWidgetData> {
        self.call(
            Method::Post,
            "/api/v1/reporting/draft-preview",
            Some(request),
        )
    }

    /// List the tenant's active prediction definitions.
    pub fn list_measurement_prediction_definitions(
        &self,
    ) -> Result<MeasurementPredictionDefinitionReadList> {
        self.call(Method::Get, PREDICTION_DEFINITIONS, NO_BODY)
    }

    /// Read one prediction definition.
    pub fn get_measurement_prediction_definition(
        &self,
        definition_uuid: &str,
    ) -> Result<MeasurementPredictionDefinitionRead> {
        self.call(Method::Get, &prediction_path(definition_uuid, ""), NO_BODY)
    }

    /// List a definition's runs, newest first; `since` (RFC 3339) keeps runs as of then or later.
    pub fn list_measurement_prediction_runs(
        &self,
        definition_uuid: &str,
        since: Option<&str>,
    ) -> Result<MeasurementPredictionRunReadList> {
        let query = [("since", since.map(str::to_owned))];
        let path = api_path(prediction_path(definition_uuid, "/runs"), &query, None);
        self.call(Method::Get, &path, NO_BODY)
    }

    /// List how a definition's runs resolved.
    pub fn list_measurement_prediction_outcomes(
        &self,
        definition_uuid: &str,
    ) -> Result<MeasurementPredictionOutcomeReadList> {
        let path = prediction_path(definition_uuid, "/outcomes");
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Read the latest evaluation of a definition's resolved runs.
    pub fn get_measurement_prediction_evaluation(
        &self,
        definition_uuid: &str,
    ) -> Result<MeasurementPredictionEvaluationRead> {
        let path = prediction_path(definition_uuid, "/evaluations");
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Start a value-of-information simulation of one decision.
    pub fn create_measurement_simulation_run(
        &self,
        project_uuid: &str,
        decision_uuid: &str,
        request: &MeasurementSimulationRunRequest,
    ) -> Result<MeasurementSimulationRun> {
        let path = simulation_runs_path(project_uuid, decision_uuid);
        self.call(Method::Post, &path, Some(request))
    }

    /// Read one decision simulation run.
    pub fn get_measurement_simulation_run(
        &self,
        project_uuid: &str,
        decision_uuid: &str,
        run_uuid: &str,
    ) -> Result<MeasurementSimulationRun> {
        let path = format!(
            "{}/{}",
            simulation_runs_path(project_uuid, decision_uuid),
            percent_encode(run_uuid)
        );
        self.call(Method::Get, &path, NO_BODY)
    }
}

fn prediction_path(definition_uuid: &str, resource: &str) -> String {
    format!(
        "{PREDICTION_DEFINITIONS}/{}{resource}",
        percent_encode(definition_uuid)
    )
}

fn simulation_runs_path(project_uuid: &str, decision_uuid: &str) -> String {
    format!(
        "/api/v1/measurement/projects/{}/decisions/{}/simulation-runs",
        percent_encode(project_uuid),
        percent_encode(decision_uuid)
    )
}
