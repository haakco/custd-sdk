use custd_sdk::{
    AnalyticsActiveNow, AnalyticsDashboardSummary, AnalyticsTelemetryEventCount,
    MeasurementPredictionDefinitionRead, MeasurementPredictionDefinitionReadList,
    MeasurementPredictionEvaluationRead, MeasurementPredictionOutcomeReadList,
    MeasurementPredictionRunReadList, MeasurementSimulationRun, MeasurementSimulationRunRequest,
    RenderedWidgetData, ReportingDraftPreviewRequest,
};

use super::{body, round_trip};
use crate::{Row, row};

const DRAFT_PREVIEW: &str = r#"{"tenantSlug":"acme","definition":{"dimensions":[],"displayName":"x","enabled":true,"eventTypes":[],"key":"x","metrics":[],"owner":"x","proof":{"forbiddenFields":[],"key":"x","outputLayout":"x","safeMetadataFields":[],"templates":[]},"templates":[],"trust":{"redactionGuard":[],"safeFields":[]},"version":1},"query":{"metrics":[],"template":"x"}}"#;

pub fn rows() -> Vec<Row> {
    vec![
        row(
            "analytics-api GET /api/v1/analytics/active-now",
            "/api/v1/analytics/active-now?site=s-1",
            |c| drop(c.custd.get_analytics_active_now("s-1")),
            round_trip::<AnalyticsActiveNow>,
        ),
        row(
            "analytics-api GET /api/v1/analytics/dashboard-summary",
            "/api/v1/analytics/dashboard-summary",
            |c| drop(c.custd.get_analytics_dashboard_summary()),
            round_trip::<AnalyticsDashboardSummary>,
        ),
        row(
            "analytics-api GET /api/v1/telemetry/event-count",
            "/api/v1/telemetry/event-count?date=2026-11-26&eventType=page_view",
            |c| {
                drop(
                    c.custd
                        .get_telemetry_event_count("2026-11-26", Some("page_view")),
                )
            },
            round_trip::<AnalyticsTelemetryEventCount>,
        ),
        row(
            "analytics-api POST /api/v1/reporting/draft-preview",
            "/api/v1/reporting/draft-preview",
            |c| {
                let request = body::<ReportingDraftPreviewRequest>(DRAFT_PREVIEW);
                drop(c.custd.preview_reporting_draft(&request))
            },
            round_trip::<RenderedWidgetData>,
        ),
        row(
            "analytics-api GET /api/v1/measurement/predictions/definitions",
            "/api/v1/measurement/predictions/definitions",
            |c| drop(c.custd.list_measurement_prediction_definitions()),
            round_trip::<MeasurementPredictionDefinitionReadList>,
        ),
        row(
            "analytics-api GET /api/v1/measurement/predictions/definitions/{definitionUuid}",
            "/api/v1/measurement/predictions/definitions/d-1",
            |c| drop(c.custd.get_measurement_prediction_definition("d-1")),
            round_trip::<MeasurementPredictionDefinitionRead>,
        ),
        row(
            "analytics-api GET /api/v1/measurement/predictions/definitions/{definitionUuid}/runs",
            "/api/v1/measurement/predictions/definitions/d-1/runs?since=2026-11-01T00%3A00%3A00Z",
            |c| {
                drop(
                    c.custd
                        .list_measurement_prediction_runs("d-1", Some("2026-11-01T00:00:00Z")),
                )
            },
            round_trip::<MeasurementPredictionRunReadList>,
        ),
        row(
            "analytics-api GET /api/v1/measurement/predictions/definitions/{definitionUuid}/outcomes",
            "/api/v1/measurement/predictions/definitions/d-1/outcomes",
            |c| drop(c.custd.list_measurement_prediction_outcomes("d-1")),
            round_trip::<MeasurementPredictionOutcomeReadList>,
        ),
        row(
            "analytics-api GET /api/v1/measurement/predictions/definitions/{definitionUuid}/evaluations",
            "/api/v1/measurement/predictions/definitions/d-1/evaluations",
            |c| drop(c.custd.get_measurement_prediction_evaluation("d-1")),
            round_trip::<MeasurementPredictionEvaluationRead>,
        ),
        row(
            "analytics-api POST /api/v1/measurement/projects/{projectUuid}/decisions/{decisionUuid}/simulation-runs",
            "/api/v1/measurement/projects/p-1/decisions/d-1/simulation-runs",
            |c| {
                let request = MeasurementSimulationRunRequest::default();
                drop(
                    c.custd
                        .create_measurement_simulation_run("p-1", "d-1", &request),
                )
            },
            round_trip::<MeasurementSimulationRun>,
        ),
        row(
            "analytics-api GET /api/v1/measurement/projects/{projectUuid}/decisions/{decisionUuid}/simulation-runs/{runUuid}",
            "/api/v1/measurement/projects/p-1/decisions/d-1/simulation-runs/r-1",
            |c| drop(c.custd.get_measurement_simulation_run("p-1", "d-1", "r-1")),
            round_trip::<MeasurementSimulationRun>,
        ),
    ]
}
