use custd_sdk::{
    WorkflowTimingDeclaration, WorkflowTimingDefinition, WorkflowTimingDefinitionList,
    WorkflowTimingDefinitionReconcileResult, WorkflowTimingDurationHistoryResponse,
    WorkflowTimingEvaluationResponse, WorkflowTimingObservationBatchRequest,
    WorkflowTimingObservationBatchResult, WorkflowTimingObservationRequest,
    WorkflowTimingRebuildResult, WorkflowTimingRunListResponse, WorkflowTimingRunPrediction,
    WorkflowTimingRunReadResponse,
};

use super::{body, round_trip};
use crate::{Row, row};

pub fn rows() -> Vec<Row> {
    vec![
        row(
            "admin-api GET /api/v1/admin/workflow-timings/definitions",
            "/api/v1/admin/workflow-timings/definitions?limit=7&companySlug=acme",
            |c| {
                drop(
                    c.custd
                        .list_workflow_timing_definitions(Some(7), Some("acme")),
                )
            },
            round_trip::<WorkflowTimingDefinitionList>,
        ),
        row(
            "admin-api GET /api/v1/admin/workflow-timings/definitions/{workflowKey}",
            "/api/v1/admin/workflow-timings/definitions/w-1?companySlug=acme",
            |c| drop(c.custd.get_workflow_timing_definition("w-1", Some("acme"))),
            round_trip::<WorkflowTimingDefinition>,
        ),
        row(
            "admin-api PUT /api/v1/admin/workflow-timings/definitions/{workflowKey}",
            "/api/v1/admin/workflow-timings/definitions/w-1?companySlug=acme",
            |c| {
                drop(c.custd.reconcile_workflow_timing_definition(
                    "w-1",
                    &body::<WorkflowTimingDeclaration>(
                        r#"{"name":"x","steps":[],"workflowKey":"x"}"#,
                    ),
                    Some("acme"),
                ))
            },
            round_trip::<WorkflowTimingDefinitionReconcileResult>,
        ),
        row(
            "admin-api GET /api/v1/admin/workflow-timings/definitions/{workflowKey}/duration-history",
            "/api/v1/admin/workflow-timings/definitions/w-1/duration-history?limit=7&companySlug=acme",
            |c| {
                drop(
                    c.custd
                        .get_workflow_timing_duration_history("w-1", Some(7), Some("acme")),
                )
            },
            round_trip::<WorkflowTimingDurationHistoryResponse>,
        ),
        row(
            "admin-api GET /api/v1/admin/workflow-timings/definitions/{workflowKey}/evaluation",
            "/api/v1/admin/workflow-timings/definitions/w-1/evaluation?seriesKey=s-1&companySlug=acme",
            |c| {
                drop(
                    c.custd
                        .get_workflow_timing_evaluation("w-1", Some("s-1"), Some("acme")),
                )
            },
            round_trip::<WorkflowTimingEvaluationResponse>,
        ),
        row(
            "admin-api POST /api/v1/admin/workflow-timings/observations",
            "/api/v1/admin/workflow-timings/observations?companySlug=acme",
            |c| {
                drop(c.custd.append_workflow_timing_observation(&body::<WorkflowTimingObservationRequest>(r#"{"observation":{"externalRunId":"x","fact":{"kind":"run_started","occurredAt":"x"},"idempotencyKey":"x","workflowKey":"x"}}"#), Some("acme")))
            },
            round_trip::<WorkflowTimingObservationBatchResult>,
        ),
        row(
            "admin-api POST /api/v1/admin/workflow-timings/observations:batch",
            "/api/v1/admin/workflow-timings/observations:batch?companySlug=acme",
            |c| {
                drop(c.custd.append_workflow_timing_observations(
                    &body::<WorkflowTimingObservationBatchRequest>(r#"{"observations":[]}"#),
                    Some("acme"),
                ))
            },
            round_trip::<WorkflowTimingObservationBatchResult>,
        ),
        row(
            "admin-api POST /api/v1/admin/workflow-timings/corrections",
            "/api/v1/admin/workflow-timings/corrections?companySlug=acme",
            |c| {
                drop(c.custd.correct_workflow_timing_observation(&body::<WorkflowTimingObservationRequest>(r#"{"observation":{"externalRunId":"x","fact":{"kind":"run_started","occurredAt":"x"},"idempotencyKey":"x","workflowKey":"x"}}"#), Some("acme")))
            },
            round_trip::<WorkflowTimingObservationBatchResult>,
        ),
        row(
            "admin-api GET /api/v1/admin/workflow-timings/runs",
            "/api/v1/admin/workflow-timings/runs?workflowKey=w-1&limit=7&companySlug=acme",
            |c| {
                drop(
                    c.custd
                        .list_workflow_timing_runs(Some("w-1"), Some(7), Some("acme")),
                )
            },
            round_trip::<WorkflowTimingRunListResponse>,
        ),
        row(
            "admin-api GET /api/v1/admin/workflow-timings/runs/{runUuid}",
            "/api/v1/admin/workflow-timings/runs/r-1?companySlug=acme",
            |c| drop(c.custd.get_workflow_timing_run("r-1", Some("acme"))),
            round_trip::<WorkflowTimingRunReadResponse>,
        ),
        row(
            "admin-api GET /api/v1/admin/workflow-timings/runs/{runUuid}/prediction",
            "/api/v1/admin/workflow-timings/runs/r-1/prediction?companySlug=acme",
            |c| drop(c.custd.get_workflow_timing_prediction("r-1", Some("acme"))),
            round_trip::<WorkflowTimingRunPrediction>,
        ),
        row(
            "admin-api POST /api/v1/admin/workflow-timings/runs/{runUuid}/rebuild",
            "/api/v1/admin/workflow-timings/runs/r-1/rebuild?companySlug=acme",
            |c| drop(c.custd.rebuild_workflow_timing_run("r-1", Some("acme"))),
            round_trip::<WorkflowTimingRebuildResult>,
        ),
    ]
}
