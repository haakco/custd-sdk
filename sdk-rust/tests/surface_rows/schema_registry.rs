//! Rows for the schema registry: event schemas and parsers, and the ingest parser preview.

use custd_sdk::{
    EventSchemaCheckRequest, EventSchemaInferRequest, EventSchemaRegisterRequest,
    ParserPreviewRequest, ParserSaveRequest,
};

use super::body;
use crate::{Row, bodiless};

fn parser() -> ParserSaveRequest {
    body(r#"{"code":"c","name":"n","parserType":"regex","pattern":null,"timestampFormat":"t"}"#)
}

pub fn rows() -> Vec<Row> {
    vec![
        bodiless(
            "schema-registry GET /api/v1/schemas",
            "/api/v1/schemas",
            |c| drop(c.custd.list_event_schemas()),
        ),
        bodiless(
            "schema-registry GET /api/v1/schemas/{eventType}/versions",
            "/api/v1/schemas/e-1/versions",
            |c| drop(c.custd.list_event_schema_versions("e-1")),
        ),
        bodiless(
            "schema-registry GET /api/v1/schemas/{eventType}/{version}",
            "/api/v1/schemas/e-1/v-1",
            |c| drop(c.custd.get_event_schema("e-1", "v-1")),
        ),
        bodiless(
            "schema-registry POST /api/v1/schemas",
            "/api/v1/schemas",
            |c| {
                drop(
                    c.custd
                        .register_event_schema(&EventSchemaRegisterRequest::default()),
                )
            },
        ),
        bodiless(
            "schema-registry POST /api/v1/schemas/validate",
            "/api/v1/schemas/validate",
            |c| {
                drop(
                    c.custd
                        .validate_event_schema(&EventSchemaCheckRequest::default()),
                )
            },
        ),
        bodiless(
            "schema-registry POST /api/v1/schemas/dry-run",
            "/api/v1/schemas/dry-run",
            |c| {
                drop(
                    c.custd
                        .dry_run_event_schema(&EventSchemaCheckRequest::default()),
                )
            },
        ),
        bodiless(
            "schema-registry POST /api/v1/schemas/infer",
            "/api/v1/schemas/infer",
            |c| {
                drop(
                    c.custd
                        .infer_event_schema(&EventSchemaInferRequest::default()),
                )
            },
        ),
        bodiless(
            "schema-registry POST /api/v1/schemas/{eventType}/{version}/active",
            "/api/v1/schemas/e-1/v-1/active",
            |c| drop(c.custd.activate_event_schema_version("e-1", "v-1")),
        ),
        bodiless(
            "schema-registry PUT /api/v1/schemas/{eventType}/{version}/enabled",
            "/api/v1/schemas/e-1/v-1/enabled",
            |c| drop(c.custd.enable_event_schema_version("e-1", "v-1")),
        ),
        bodiless(
            "schema-registry DELETE /api/v1/schemas/{eventType}/{version}/enabled",
            "/api/v1/schemas/e-1/v-1/enabled",
            |c| drop(c.custd.disable_event_schema_version("e-1", "v-1")),
        ),
        bodiless(
            "schema-registry DELETE /api/v1/schemas/{eventType}",
            "/api/v1/schemas/e-1",
            |c| drop(c.custd.disable_event_schema_type("e-1")),
        ),
        bodiless(
            "schema-registry GET /api/v1/parsers/presets",
            "/api/v1/parsers/presets",
            |c| drop(c.custd.list_parser_presets()),
        ),
        bodiless(
            "schema-registry GET /api/v1/parsers",
            "/api/v1/parsers",
            |c| drop(c.custd.list_parsers()),
        ),
        bodiless(
            "schema-registry POST /api/v1/parsers",
            "/api/v1/parsers",
            |c| drop(c.custd.create_parser(&parser())),
        ),
        bodiless(
            "schema-registry PUT /api/v1/parsers/{uuid}",
            "/api/v1/parsers/p-1",
            |c| drop(c.custd.update_parser("p-1", &parser())),
        ),
        bodiless(
            "schema-registry DELETE /api/v1/parsers/{uuid}",
            "/api/v1/parsers/p-1",
            |c| drop(c.custd.delete_parser("p-1")),
        ),
        bodiless(
            "ingest-api POST /api/v1/parser-preview",
            "/api/v1/parser-preview",
            |c| {
                let request = body::<ParserPreviewRequest>(
                    r#"{"parser":{"code":"c","name":"n","parserType":"json","pattern":null,"timestampFormat":"t"},"sample":"{}","maxLines":1}"#,
                );
                drop(c.custd.preview_parser(&request))
            },
        ),
    ]
}
