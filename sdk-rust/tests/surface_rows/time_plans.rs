use custd_sdk::{
    CompletedDurationReport, TimePlan, TimePlanAllocationResult, TimePlanAnnotation,
    TimePlanAnnotationInput, TimePlanAnnotationListResponse, TimePlanAnnotationRedactBody,
    TimePlanCommandRequest, TimePlanCommandResult, TimePlanCreateRunInput, TimePlanCreatedRun,
    TimePlanDefinition, TimePlanDefinitionMathProofResponse, TimePlanDraftInput,
    TimePlanDurationObservationReadResponse, TimePlanListResponse, TimePlanOperationalStatus,
    TimePlanOutboxReplayRequest, TimePlanOutboxReplayResponse, TimePlanPredictionSnapshotList,
    TimePlanProjectionLossResponse, TimePlanPublishedVersion, TimePlanPublishedVersionDetails,
    TimePlanReviseBody, TimePlanRevisionBody, TimePlanRunRepairResponse, TimePlanRunView,
    TimePlanTransitionHistoryResponse,
};

use super::{body, round_trip};
use crate::{Row, bodiless, row};

pub fn rows() -> Vec<Row> {
    vec![
        row(
            "admin-api GET /api/v1/admin/time-plans",
            "/api/v1/admin/time-plans?limit=7&companySlug=acme",
            |c| drop(c.custd.list_time_plans(Some(7), Some("acme"))),
            round_trip::<TimePlanListResponse>,
        ),
        row(
            "admin-api POST /api/v1/admin/time-plans",
            "/api/v1/admin/time-plans?companySlug=acme",
            |c| {
                drop(c.custd.create_time_plan(&body::<TimePlanDraftInput>(r#"{"definition":{"autoAdvance":true,"blocks":[],"horizonMs":1,"redistributionMode":"x"},"description":"x","name":"x","planKey":"x"}"#), Some("acme")))
            },
            round_trip::<TimePlan>,
        ),
        row(
            "admin-api GET /api/v1/admin/time-plans/{planUuid}",
            "/api/v1/admin/time-plans/p-1?companySlug=acme",
            |c| drop(c.custd.get_time_plan("p-1", Some("acme"))),
            round_trip::<TimePlan>,
        ),
        row(
            "admin-api PATCH /api/v1/admin/time-plans/{planUuid}",
            "/api/v1/admin/time-plans/p-1?companySlug=acme",
            |c| {
                drop(c.custd.revise_time_plan("p-1", &body::<TimePlanReviseBody>(r#"{"definition":{"autoAdvance":true,"blocks":[],"horizonMs":1,"redistributionMode":"x"},"description":"x","expectedRevision":1,"name":"x","planKey":"x"}"#), Some("acme")))
            },
            round_trip::<TimePlan>,
        ),
        row(
            "admin-api POST /api/v1/admin/time-plans/{planUuid}/publish",
            "/api/v1/admin/time-plans/p-1/publish?companySlug=acme",
            |c| {
                drop(c.custd.publish_time_plan(
                    "p-1",
                    &body::<TimePlanRevisionBody>(r#"{"expectedRevision":1}"#),
                    Some("acme"),
                ))
            },
            round_trip::<TimePlanPublishedVersion>,
        ),
        row(
            "admin-api POST /api/v1/admin/time-plans/{planUuid}/retire",
            "/api/v1/admin/time-plans/p-1/retire?companySlug=acme",
            |c| drop(c.custd.retire_time_plan("p-1", Some("acme"))),
            round_trip::<TimePlan>,
        ),
        row(
            "admin-api POST /api/v1/admin/time-plans/preview",
            "/api/v1/admin/time-plans/preview?companySlug=acme",
            |c| {
                drop(c.custd.preview_time_plan(&body::<TimePlanDefinition>(r#"{"autoAdvance":true,"blocks":[],"horizonMs":1,"redistributionMode":"x"}"#), Some("acme")))
            },
            round_trip::<TimePlanAllocationResult>,
        ),
        row(
            "admin-api GET /api/v1/admin/time-plans/plans/{planUuid}/versions/{versionUuid}",
            "/api/v1/admin/time-plans/plans/p-1/versions/v-1?companySlug=acme",
            |c| {
                drop(
                    c.custd
                        .get_published_time_plan_version("p-1", "v-1", Some("acme")),
                )
            },
            round_trip::<TimePlanPublishedVersionDetails>,
        ),
        row(
            "admin-api POST /api/v1/admin/time-plans/runs",
            "/api/v1/admin/time-plans/runs?companySlug=acme",
            |c| {
                drop(c.custd.create_time_plan_run(
                    &body::<TimePlanCreateRunInput>(r#"{"planUuid":"x"}"#),
                    Some("acme"),
                ))
            },
            round_trip::<TimePlanCreatedRun>,
        ),
        row(
            "admin-api GET /api/v1/admin/time-plans/runs/{runUuid}",
            "/api/v1/admin/time-plans/runs/r-1?companySlug=acme",
            |c| drop(c.custd.get_time_plan_run("r-1", Some("acme"))),
            round_trip::<TimePlanRunView>,
        ),
        row(
            "admin-api POST /api/v1/admin/time-plans/runs/{runUuid}/commands",
            "/api/v1/admin/time-plans/runs/r-1/commands?companySlug=acme",
            |c| {
                drop(c.custd.execute_time_plan_command("r-1", &body::<TimePlanCommandRequest>(r#"{"commandId":"x","expectedVersion":1,"idempotencyKey":"x","type":"schedule_run"}"#), Some("acme")))
            },
            round_trip::<TimePlanCommandResult>,
        ),
        row(
            "admin-api GET /api/v1/admin/time-plans/runs/{runUuid}/annotations",
            "/api/v1/admin/time-plans/runs/r-1/annotations?limit=7&companySlug=acme",
            |c| {
                drop(
                    c.custd
                        .list_time_plan_annotations("r-1", Some(7), Some("acme")),
                )
            },
            round_trip::<TimePlanAnnotationListResponse>,
        ),
        row(
            "admin-api POST /api/v1/admin/time-plans/runs/{runUuid}/annotations",
            "/api/v1/admin/time-plans/runs/r-1/annotations?companySlug=acme",
            |c| {
                drop(c.custd.create_time_plan_annotation(
                    "r-1",
                    &body::<TimePlanAnnotationInput>(r#"{"type":"note"}"#),
                    Some("acme"),
                ))
            },
            round_trip::<TimePlanAnnotation>,
        ),
        row(
            "admin-api POST /api/v1/admin/time-plans/runs/{runUuid}/annotations/{annotationUuid}/corrections",
            "/api/v1/admin/time-plans/runs/r-1/annotations/a-1/corrections?companySlug=acme",
            |c| {
                drop(c.custd.correct_time_plan_annotation(
                    "r-1",
                    "a-1",
                    &body::<TimePlanAnnotationInput>(r#"{"type":"note"}"#),
                    Some("acme"),
                ))
            },
            round_trip::<TimePlanAnnotation>,
        ),
        bodiless(
            "admin-api POST /api/v1/admin/time-plans/runs/{runUuid}/annotations/{annotationUuid}/redact",
            "/api/v1/admin/time-plans/runs/r-1/annotations/a-1/redact?companySlug=acme",
            |c| {
                drop(c.custd.redact_time_plan_annotation(
                    "r-1",
                    "a-1",
                    &body::<TimePlanAnnotationRedactBody>(r#"{"reason":"x"}"#),
                    Some("acme"),
                ))
            },
        ),
        row(
            "admin-api GET /api/v1/admin/time-plans/runs/{runUuid}/duration-observations",
            "/api/v1/admin/time-plans/runs/r-1/duration-observations?companySlug=acme",
            |c| {
                drop(
                    c.custd
                        .list_time_plan_duration_observations("r-1", Some("acme")),
                )
            },
            round_trip::<TimePlanDurationObservationReadResponse>,
        ),
        row(
            "admin-api GET /api/v1/admin/time-plans/runs/{runUuid}/history",
            "/api/v1/admin/time-plans/runs/r-1/history?limit=7&companySlug=acme",
            |c| drop(c.custd.list_time_plan_history("r-1", Some(7), Some("acme"))),
            round_trip::<TimePlanTransitionHistoryResponse>,
        ),
        row(
            "admin-api GET /api/v1/admin/time-plans/runs/{runUuid}/predictions",
            "/api/v1/admin/time-plans/runs/r-1/predictions?limit=7&companySlug=acme",
            |c| {
                drop(
                    c.custd
                        .list_time_plan_prediction_snapshots("r-1", Some(7), Some("acme")),
                )
            },
            round_trip::<TimePlanPredictionSnapshotList>,
        ),
        row(
            "admin-api GET /api/v1/admin/time-plans/runs/{runUuid}/report",
            "/api/v1/admin/time-plans/runs/r-1/report?companySlug=acme",
            |c| drop(c.custd.get_time_plan_run_report("r-1", Some("acme"))),
            round_trip::<CompletedDurationReport>,
        ),
        row(
            "admin-api POST /api/v1/admin/time-plans/runs/{runUuid}/projection-loss",
            "/api/v1/admin/time-plans/runs/r-1/projection-loss?companySlug=acme",
            |c| drop(c.custd.delete_time_plan_run_projection("r-1", Some("acme"))),
            round_trip::<TimePlanProjectionLossResponse>,
        ),
        row(
            "admin-api POST /api/v1/admin/time-plans/runs/{runUuid}/repair",
            "/api/v1/admin/time-plans/runs/r-1/repair?companySlug=acme",
            |c| drop(c.custd.repair_time_plan_run("r-1", Some("acme"))),
            round_trip::<TimePlanRunRepairResponse>,
        ),
        row(
            "admin-api GET /api/v1/admin/time-plans/operations/definition-math",
            "/api/v1/admin/time-plans/operations/definition-math?companySlug=acme",
            |c| drop(c.custd.get_time_plan_definition_math_proof(Some("acme"))),
            round_trip::<TimePlanDefinitionMathProofResponse>,
        ),
        row(
            "admin-api GET /api/v1/admin/time-plans/operations/status",
            "/api/v1/admin/time-plans/operations/status?companySlug=acme",
            |c| drop(c.custd.get_time_plan_operational_status(Some("acme"))),
            round_trip::<TimePlanOperationalStatus>,
        ),
        row(
            "admin-api POST /api/v1/admin/time-plans/operations/outbox/replay",
            "/api/v1/admin/time-plans/operations/outbox/replay?companySlug=acme",
            |c| {
                drop(c.custd.replay_time_plan_outbox(
                    &body::<TimePlanOutboxReplayRequest>(r#"{}"#),
                    Some("acme"),
                ))
            },
            round_trip::<TimePlanOutboxReplayResponse>,
        ),
    ]
}
