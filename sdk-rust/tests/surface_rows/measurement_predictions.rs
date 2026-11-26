use custd_sdk::{
    MeasurementDurationEvaluationRequest, MeasurementDurationEvaluationResponse,
    MeasurementPredictionActivateRequest, MeasurementPredictionDefinition,
    MeasurementPredictionDefinitionCreateRequest, MeasurementPredictionDefinitionListResponse,
    MeasurementPredictionDefinitionUpdateRequest, MeasurementPredictionEvaluationSummary,
    MeasurementPredictionOutcomeListResponse, MeasurementPredictionPauseRequest,
    MeasurementPredictionRunListResponse, MeasurementPredictionRunNowRequest,
    MeasurementPredictionThresholdEventListResponse, MeasurementPredictionVersion,
    MeasurementPredictionVersionPublishRequest, MeasurementSignalSource,
    MeasurementSignalSourceCreateRequest, MeasurementSignalSourceListResponse,
};

use super::{body, round_trip};
use crate::{Row, bodiless, row};

pub fn rows() -> Vec<Row> {
    vec![
        row(
            "admin-api GET /api/v1/admin/measurement/predictions/definitions",
            "/api/v1/admin/measurement/predictions/definitions?pageSize=7&pageToken=p-1&companySlug=acme",
            |c| {
                drop(
                    c.custd
                        .list_prediction_definitions(Some(7), Some("p-1"), Some("acme")),
                )
            },
            round_trip::<MeasurementPredictionDefinitionListResponse>,
        ),
        row(
            "admin-api POST /api/v1/admin/measurement/predictions/definitions",
            "/api/v1/admin/measurement/predictions/definitions?companySlug=acme",
            |c| {
                drop(c.custd.create_prediction_definition(
                    &body::<MeasurementPredictionDefinitionCreateRequest>(
                        r#"{"definition_key":"x","display_name":"x"}"#,
                    ),
                    Some("acme"),
                ))
            },
            round_trip::<MeasurementPredictionDefinition>,
        ),
        row(
            "admin-api GET /api/v1/admin/measurement/predictions/definitions/{definitionUuid}",
            "/api/v1/admin/measurement/predictions/definitions/d-1?companySlug=acme",
            |c| drop(c.custd.get_prediction_definition("d-1", Some("acme"))),
            round_trip::<MeasurementPredictionDefinition>,
        ),
        row(
            "admin-api PATCH /api/v1/admin/measurement/predictions/definitions/{definitionUuid}",
            "/api/v1/admin/measurement/predictions/definitions/d-1?companySlug=acme",
            |c| {
                drop(c.custd.update_prediction_definition(
                    "d-1",
                    &body::<MeasurementPredictionDefinitionUpdateRequest>(
                        r#"{"definition_key":"x","revision":1}"#,
                    ),
                    Some("acme"),
                ))
            },
            round_trip::<MeasurementPredictionDefinition>,
        ),
        row(
            "admin-api POST /api/v1/admin/measurement/predictions/definitions/{definitionUuid}/activate",
            "/api/v1/admin/measurement/predictions/definitions/d-1/activate?companySlug=acme",
            |c| {
                drop(c.custd.activate_prediction_version(
                    "d-1",
                    &body::<MeasurementPredictionActivateRequest>(r#"{"version_uuid":"x"}"#),
                    Some("acme"),
                ))
            },
            round_trip::<MeasurementPredictionVersion>,
        ),
        bodiless(
            "admin-api POST /api/v1/admin/measurement/predictions/definitions/{definitionUuid}/archive",
            "/api/v1/admin/measurement/predictions/definitions/d-1/archive?companySlug=acme",
            |c| {
                drop(c.custd.archive_prediction_definition(
                    "d-1",
                    &body::<MeasurementPredictionPauseRequest>(r#"{}"#),
                    Some("acme"),
                ))
            },
        ),
        row(
            "admin-api POST /api/v1/admin/measurement/predictions/definitions/{definitionUuid}/duration-evaluations",
            "/api/v1/admin/measurement/predictions/definitions/d-1/duration-evaluations?companySlug=acme",
            |c| {
                drop(c.custd.evaluate_duration_history(
                    "d-1",
                    &body::<MeasurementDurationEvaluationRequest>(
                        r#"{"planUuid":"x","semanticKey":"x"}"#,
                    ),
                    Some("acme"),
                ))
            },
            round_trip::<MeasurementDurationEvaluationResponse>,
        ),
        bodiless(
            "admin-api POST /api/v1/admin/measurement/predictions/definitions/{definitionUuid}/pause",
            "/api/v1/admin/measurement/predictions/definitions/d-1/pause?companySlug=acme",
            |c| {
                drop(c.custd.pause_prediction_definition(
                    "d-1",
                    &body::<MeasurementPredictionPauseRequest>(r#"{}"#),
                    Some("acme"),
                ))
            },
        ),
        row(
            "admin-api POST /api/v1/admin/measurement/predictions/definitions/{definitionUuid}/publish",
            "/api/v1/admin/measurement/predictions/definitions/d-1/publish?companySlug=acme",
            |c| {
                drop(c.custd.publish_prediction_definition(
                    "d-1",
                    &body::<MeasurementPredictionVersionPublishRequest>(
                        r#"{"created_by":"x","definition":"x"}"#,
                    ),
                    Some("acme"),
                ))
            },
            round_trip::<MeasurementPredictionVersion>,
        ),
        bodiless(
            "admin-api POST /api/v1/admin/measurement/predictions/definitions/{definitionUuid}/resume",
            "/api/v1/admin/measurement/predictions/definitions/d-1/resume?companySlug=acme",
            |c| {
                drop(c.custd.resume_prediction_definition(
                    "d-1",
                    &body::<MeasurementPredictionPauseRequest>(r#"{}"#),
                    Some("acme"),
                ))
            },
        ),
        bodiless(
            "admin-api POST /api/v1/admin/measurement/predictions/definitions/{definitionUuid}/run-now",
            "/api/v1/admin/measurement/predictions/definitions/d-1/run-now?companySlug=acme",
            |c| {
                drop(c.custd.run_prediction_now(
                    "d-1",
                    &body::<MeasurementPredictionRunNowRequest>(r#"{}"#),
                    Some("acme"),
                ))
            },
        ),
        row(
            "admin-api GET /api/v1/admin/measurement/predictions/definitions/{definitionUuid}/evaluations",
            "/api/v1/admin/measurement/predictions/definitions/d-1/evaluations?companySlug=acme",
            |c| drop(c.custd.get_prediction_evaluation("d-1", Some("acme"))),
            round_trip::<MeasurementPredictionEvaluationSummary>,
        ),
        row(
            "admin-api GET /api/v1/admin/measurement/predictions/definitions/{definitionUuid}/outcomes",
            "/api/v1/admin/measurement/predictions/definitions/d-1/outcomes?companySlug=acme",
            |c| drop(c.custd.list_prediction_outcomes("d-1", Some("acme"))),
            round_trip::<MeasurementPredictionOutcomeListResponse>,
        ),
        row(
            "admin-api GET /api/v1/admin/measurement/predictions/definitions/{definitionUuid}/runs",
            "/api/v1/admin/measurement/predictions/definitions/d-1/runs?companySlug=acme",
            |c| drop(c.custd.list_prediction_runs("d-1", Some("acme"))),
            round_trip::<MeasurementPredictionRunListResponse>,
        ),
        row(
            "admin-api GET /api/v1/admin/measurement/predictions/definitions/{definitionUuid}/threshold-events",
            "/api/v1/admin/measurement/predictions/definitions/d-1/threshold-events?pageSize=7&companySlug=acme",
            |c| {
                drop(
                    c.custd
                        .list_prediction_threshold_events("d-1", Some(7), Some("acme")),
                )
            },
            round_trip::<MeasurementPredictionThresholdEventListResponse>,
        ),
        row(
            "admin-api GET /api/v1/admin/measurement/predictions/definitions/{definitionUuid}/versions/{versionUuid}",
            "/api/v1/admin/measurement/predictions/definitions/d-1/versions/v-1?companySlug=acme",
            |c| drop(c.custd.get_prediction_version("d-1", "v-1", Some("acme"))),
            round_trip::<MeasurementPredictionVersion>,
        ),
        row(
            "admin-api GET /api/v1/admin/measurement/predictions/sources",
            "/api/v1/admin/measurement/predictions/sources?pageSize=7&pageToken=p-1&companySlug=acme",
            |c| {
                drop(
                    c.custd
                        .list_prediction_sources(Some(7), Some("p-1"), Some("acme")),
                )
            },
            round_trip::<MeasurementSignalSourceListResponse>,
        ),
        row(
            "admin-api POST /api/v1/admin/measurement/predictions/sources",
            "/api/v1/admin/measurement/predictions/sources?companySlug=acme",
            |c| {
                drop(c.custd.create_prediction_source(&body::<MeasurementSignalSourceCreateRequest>(r#"{"configuration":"x","display_name":"x","source_key":"x","source_mode":"x"}"#), Some("acme")))
            },
            round_trip::<MeasurementSignalSource>,
        ),
        row(
            "admin-api GET /api/v1/admin/measurement/predictions/sources/{sourceUuid}",
            "/api/v1/admin/measurement/predictions/sources/s-1?companySlug=acme",
            |c| drop(c.custd.get_prediction_source("s-1", Some("acme"))),
            round_trip::<MeasurementSignalSource>,
        ),
        bodiless(
            "admin-api POST /api/v1/admin/measurement/predictions/sources/{sourceUuid}/activate",
            "/api/v1/admin/measurement/predictions/sources/s-1/activate?companySlug=acme",
            |c| drop(c.custd.activate_prediction_source("s-1", Some("acme"))),
        ),
        bodiless(
            "admin-api POST /api/v1/admin/measurement/predictions/sources/{sourceUuid}/archive",
            "/api/v1/admin/measurement/predictions/sources/s-1/archive?companySlug=acme",
            |c| drop(c.custd.archive_prediction_source("s-1", Some("acme"))),
        ),
    ]
}
