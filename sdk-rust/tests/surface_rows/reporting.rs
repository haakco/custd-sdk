use custd_sdk::{
    CompletedRunExportRequest, DashboardCatalogueResponse, DashboardDefinition,
    DashboardGenerationRequest, DashboardGenerationResponse, PreparedDataOutputListResponse,
    PreparedDataOutputStatus, PreparedDataQueryEnvelope, PreparedDataReceiptStatus,
    RenderedWidgetData, ReportExportCancelRequest, ReportExportCreateRequest, ReportExportJob,
    ReportExportJobList, ReportingQueryRequest, ReportingSubjectInsightRequest,
    ReportingSubjectInsightResponse,
};

use super::{body, round_trip};
use crate::{Row, row};

pub fn rows() -> Vec<Row> {
    vec![
        row(
            "analytics-api GET /api/v1/reporting/dashboards",
            "/api/v1/reporting/dashboards",
            |c| drop(c.custd.list_reporting_dashboards()),
            round_trip::<DashboardCatalogueResponse>,
        ),
        row(
            "analytics-api GET /api/v1/reporting/dashboards/{key}",
            "/api/v1/reporting/dashboards/k-1",
            |c| drop(c.custd.get_reporting_dashboard("k-1")),
            round_trip::<DashboardDefinition>,
        ),
        row(
            "analytics-api POST /api/v1/reporting/dashboard-data-generations",
            "/api/v1/reporting/dashboard-data-generations",
            |c| {
                drop(
                    c.custd
                        .create_dashboard_data_generation(&body::<DashboardGenerationRequest>(
                            r#"{"dashboardKey":"x","parameters":{}}"#,
                        )),
                )
            },
            round_trip::<DashboardGenerationResponse>,
        ),
        row(
            "analytics-api POST /api/v1/reporting/query",
            "/api/v1/reporting/query",
            |c| {
                drop(c.custd.query_reporting(&body::<ReportingQueryRequest>(
                    r#"{"metrics":[],"template":"x"}"#,
                )))
            },
            round_trip::<RenderedWidgetData>,
        ),
        row(
            "analytics-api POST /api/v1/reporting/insights/subject",
            "/api/v1/reporting/insights/subject",
            |c| {
                drop(
                    c.custd
                        .query_subject_insight(&body::<ReportingSubjectInsightRequest>(
                            r#"{"subject":"x","template":"x"}"#,
                        )),
                )
            },
            round_trip::<ReportingSubjectInsightResponse>,
        ),
        row(
            "analytics-api GET /api/v1/reporting/exports",
            "/api/v1/reporting/exports",
            |c| drop(c.custd.list_report_exports()),
            round_trip::<ReportExportJobList>,
        ),
        row(
            "analytics-api POST /api/v1/reporting/exports",
            "/api/v1/reporting/exports",
            |c| {
                drop(
                    c.custd
                        .create_report_export(&body::<ReportExportCreateRequest>(
                            r#"{"dashboardKey":"x","formats":[],"parameters":{}}"#,
                        )),
                )
            },
            round_trip::<ReportExportJob>,
        ),
        row(
            "analytics-api POST /api/v1/reporting/exports/completed-run",
            "/api/v1/reporting/exports/completed-run",
            |c| {
                drop(c.custd.create_completed_run_export(&body::<CompletedRunExportRequest>(r#"{"formats":[],"source":{"contractVersion":"x","identity":{"packGeneration":1,"packKey":"x","planId":"x","runId":"x","tenantId":"x","versionId":"x"},"integrity":{"exportSha256":"x","sourceInputSha256":"x","sourceReportSha256":"x"},"metadata":{"corrected":true,"generatedAt":"x","reportVersion":"x"},"redaction":{"redactedAnnotationCount":1,"result":"x"},"sections":{"adjustments":{"items":[]},"annotationsActions":{"items":[]},"blocks":{"items":[]},"order":[],"predictionComparison":{"items":[]},"provenance":{"adjustment_count":1,"annotation_count":1,"corrected":true,"generated_at":"x","input_hash":"x","prediction_count":1,"report_version":"x"},"summary":{"actual_block_count":1,"actual_complete":true,"actual_total_ms":1,"baseline_horizon_ms":1,"block_count":1,"cancelled_block_count":1,"censored_block_count":1,"completed_at":"x","completed_block_count":1,"current_total_ms":1,"final_variance_ms":1,"lost_ms":1,"not_run_block_count":1,"overrun_ms":1,"plan_id":"x","planned_total_ms":1,"run_id":"x","run_status":"x","skipped_block_count":1,"stream_version":1,"unused_ms":1,"version_id":"x"}}}}"#)))
            },
            round_trip::<ReportExportJob>,
        ),
        row(
            "analytics-api GET /api/v1/reporting/exports/{exportID}",
            "/api/v1/reporting/exports/e-1",
            |c| drop(c.custd.get_report_export("e-1")),
            round_trip::<ReportExportJob>,
        ),
        row(
            "analytics-api POST /api/v1/reporting/exports/{exportID}/cancel",
            "/api/v1/reporting/exports/e-1/cancel",
            |c| {
                drop(
                    c.custd
                        .cancel_report_export("e-1", &body::<ReportExportCancelRequest>(r#"{}"#)),
                )
            },
            round_trip::<ReportExportJob>,
        ),
        row(
            "analytics-api GET /api/v1/reporting/outputs",
            "/api/v1/reporting/outputs",
            |c| drop(c.custd.list_prepared_data_outputs()),
            round_trip::<PreparedDataOutputListResponse>,
        ),
        row(
            "analytics-api GET /api/v1/reporting/outputs/{outputUuid}",
            "/api/v1/reporting/outputs/o-1",
            |c| drop(c.custd.get_prepared_data_output("o-1")),
            round_trip::<PreparedDataOutputStatus>,
        ),
        row(
            "analytics-api POST /api/v1/reporting/outputs/{outputUuid}/query",
            "/api/v1/reporting/outputs/o-1/query",
            |c| {
                drop(c.custd.query_prepared_data_output(
                    "o-1",
                    &body::<ReportingQueryRequest>(r#"{"metrics":[],"template":"x"}"#),
                ))
            },
            round_trip::<PreparedDataQueryEnvelope>,
        ),
        row(
            "analytics-api GET /api/v1/processing/{receiptUuid}",
            "/api/v1/processing/r-1",
            |c| drop(c.custd.get_prepared_data_receipt("r-1")),
            round_trip::<PreparedDataReceiptStatus>,
        ),
    ]
}
