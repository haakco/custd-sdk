use custd_sdk::{
    AppItemProjectUpdateRequest, AppItemRunCreateRequest,
    MeasurementCalibrationExerciseCreateRequest, MeasurementCalibrationExerciseResponse,
    MeasurementDecisionModelCreateRequest, MeasurementDecisionModelListResponse,
    MeasurementDecisionModelResponse, MeasurementDecisionModelUpdateRequest,
    MeasurementImportRunResponse, MeasurementProject, MeasurementSeriesCreateRequest,
    MeasurementSeriesResponse, MeasurementTargetCreateRequest, MeasurementTargetResponse,
};

use super::{body, round_trip};
use crate::{Row, bodiless, row, shape};

pub fn rows() -> Vec<Row> {
    vec![
        row(
            "admin-api PATCH /api/v1/admin/measurement/projects/{projectUuid}",
            "/api/v1/admin/measurement/projects/p-1?companySlug=acme",
            |c| {
                drop(c.custd.update_measurement_project(
                    "p-1",
                    &body::<AppItemProjectUpdateRequest>(r#"{}"#),
                    Some("acme"),
                ))
            },
            shape::<MeasurementProject>,
        ),
        row(
            "admin-api POST /api/v1/admin/measurement/projects/{projectUuid}/cancel",
            "/api/v1/admin/measurement/projects/p-1/cancel?companySlug=acme",
            |c| drop(c.custd.cancel_measurement_project("p-1", Some("acme"))),
            shape::<MeasurementProject>,
        ),
        row(
            "admin-api POST /api/v1/admin/measurement/projects/{projectUuid}/series",
            "/api/v1/admin/measurement/projects/p-1/series?companySlug=acme",
            |c| {
                drop(c.custd.create_measurement_series("p-1", &body::<MeasurementSeriesCreateRequest>(r#"{"completionDirection":"x","name":"x","seriesCode":"x","source":"x","unitSlug":"x"}"#), Some("acme")))
            },
            round_trip::<MeasurementSeriesResponse>,
        ),
        row(
            "admin-api POST /api/v1/admin/measurement/projects/{projectUuid}/targets",
            "/api/v1/admin/measurement/projects/p-1/targets?companySlug=acme",
            |c| {
                drop(c.custd.create_measurement_target(
                    "p-1",
                    &body::<MeasurementTargetCreateRequest>(
                        r#"{"name":"x","state":"x","targetCode":"x","targetValue":1.5}"#,
                    ),
                    Some("acme"),
                ))
            },
            round_trip::<MeasurementTargetResponse>,
        ),
        row(
            "admin-api POST /api/v1/admin/measurement/projects/{projectUuid}/targets/{targetUuid}/reopen",
            "/api/v1/admin/measurement/projects/p-1/targets/t-1/reopen?companySlug=acme",
            |c| {
                drop(
                    c.custd
                        .reopen_measurement_target("p-1", "t-1", Some("acme")),
                )
            },
            round_trip::<MeasurementTargetResponse>,
        ),
        row(
            "admin-api POST /api/v1/admin/measurement/projects/{projectUuid}/runs",
            "/api/v1/admin/measurement/projects/p-1/runs?companySlug=acme",
            |c| {
                drop(c.custd.create_measurement_run(
                    "p-1",
                    &body::<AppItemRunCreateRequest>(r#"{"projectCode":"x"}"#),
                    Some("acme"),
                ))
            },
            shape::<MeasurementProject>,
        ),
        row(
            "admin-api GET /api/v1/admin/measurement/projects/{projectUuid}/imports/{importUuid}",
            "/api/v1/admin/measurement/projects/p-1/imports/i-1?companySlug=acme",
            |c| drop(c.custd.get_measurement_import("p-1", "i-1", Some("acme"))),
            round_trip::<MeasurementImportRunResponse>,
        ),
        row(
            "admin-api POST /api/v1/admin/measurement/projects/{projectUuid}/calibration-exercises",
            "/api/v1/admin/measurement/projects/p-1/calibration-exercises?companySlug=acme",
            |c| {
                drop(c.custd.create_measurement_calibration_exercise(
                    "p-1",
                    &body::<MeasurementCalibrationExerciseCreateRequest>(
                        r#"{"confidence":1.5,"lowerBound":1.5,"question":"x","upperBound":1.5}"#,
                    ),
                    Some("acme"),
                ))
            },
            round_trip::<MeasurementCalibrationExerciseResponse>,
        ),
        row(
            "admin-api GET /api/v1/admin/measurement/projects/{projectUuid}/decisions",
            "/api/v1/admin/measurement/projects/p-1/decisions?companySlug=acme",
            |c| {
                drop(
                    c.custd
                        .list_measurement_decision_models("p-1", Some("acme")),
                )
            },
            round_trip::<MeasurementDecisionModelListResponse>,
        ),
        row(
            "admin-api POST /api/v1/admin/measurement/projects/{projectUuid}/decisions",
            "/api/v1/admin/measurement/projects/p-1/decisions?companySlug=acme",
            |c| {
                drop(c.custd.create_measurement_decision_model("p-1", &body::<MeasurementDecisionModelCreateRequest>(r#"{"choices":[],"decisionCode":"x","name":"x","status":"x","variables":[]}"#), Some("acme")))
            },
            round_trip::<MeasurementDecisionModelResponse>,
        ),
        row(
            "admin-api GET /api/v1/admin/measurement/projects/{projectUuid}/decisions/{decisionUuid}",
            "/api/v1/admin/measurement/projects/p-1/decisions/d-1?companySlug=acme",
            |c| {
                drop(
                    c.custd
                        .get_measurement_decision_model("p-1", "d-1", Some("acme")),
                )
            },
            round_trip::<MeasurementDecisionModelResponse>,
        ),
        row(
            "admin-api PATCH /api/v1/admin/measurement/projects/{projectUuid}/decisions/{decisionUuid}",
            "/api/v1/admin/measurement/projects/p-1/decisions/d-1?companySlug=acme",
            |c| {
                drop(c.custd.update_measurement_decision_model(
                    "p-1",
                    "d-1",
                    &body::<MeasurementDecisionModelUpdateRequest>(r#"{}"#),
                    Some("acme"),
                ))
            },
            round_trip::<MeasurementDecisionModelResponse>,
        ),
        bodiless(
            "admin-api DELETE /api/v1/admin/measurement/projects/{projectUuid}/decisions/{decisionUuid}",
            "/api/v1/admin/measurement/projects/p-1/decisions/d-1?companySlug=acme",
            |c| {
                drop(
                    c.custd
                        .archive_measurement_decision_model("p-1", "d-1", Some("acme")),
                )
            },
        ),
    ]
}
