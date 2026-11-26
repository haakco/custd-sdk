use custd_sdk::{
    EventCategoryConfigListResponse, EventCategoryConfigUpdateRequest, EventTypeConfigListResponse,
    EventTypeConfigUpdateRequest, SchemaActionDryRunRequest, SchemaActionDryRunResult,
    SchemaActionEnableRequest, SchemaActionRegisterRequest, SchemaActionValidateRequest,
    SchemaActionValidateResult, SchemaAuditResponse,
};

use super::{body, round_trip};
use crate::{Row, bodiless, row};

pub fn rows() -> Vec<Row> {
    vec![
        row(
            "admin-api GET /api/v1/admin/event-types",
            "/api/v1/admin/event-types",
            |c| drop(c.custd.list_event_types()),
            round_trip::<EventTypeConfigListResponse>,
        ),
        bodiless(
            "admin-api PATCH /api/v1/admin/event-types/{slug}",
            "/api/v1/admin/event-types/s-1",
            |c| {
                drop(c.custd.update_event_type(
                    "s-1",
                    &body::<EventTypeConfigUpdateRequest>(r#"{"retentionDays":1}"#),
                ))
            },
        ),
        row(
            "admin-api GET /api/v1/admin/event-categories",
            "/api/v1/admin/event-categories",
            |c| drop(c.custd.list_event_categories()),
            round_trip::<EventCategoryConfigListResponse>,
        ),
        bodiless(
            "admin-api PATCH /api/v1/admin/event-categories/{slug}",
            "/api/v1/admin/event-categories/s-1",
            |c| {
                drop(c.custd.update_event_category(
                    "s-1",
                    &body::<EventCategoryConfigUpdateRequest>(
                        r#"{"isAudit":true,"retentionDays":1}"#,
                    ),
                ))
            },
        ),
        row(
            "admin-api GET /api/v1/admin/schema/audit",
            "/api/v1/admin/schema/audit?tenantSlug=t-1",
            |c| drop(c.custd.audit_schemas("t-1")),
            round_trip::<SchemaAuditResponse>,
        ),
        row(
            "admin-api POST /api/v1/admin/schema/validate",
            "/api/v1/admin/schema/validate",
            |c| {
                drop(c.custd.validate_schema(&body::<SchemaActionValidateRequest>(r#"{"dialect":"x","eventTypeSlug":"x","schemaJson":"x","tenantSlug":"x"}"#)))
            },
            round_trip::<SchemaActionValidateResult>,
        ),
        row(
            "admin-api POST /api/v1/admin/schema/{tenantSlug}/{eventType}/dry-run",
            "/api/v1/admin/schema/t-1/e-1/dry-run",
            |c| {
                drop(c.custd.dry_run_schema("t-1", "e-1", &body::<SchemaActionDryRunRequest>(r#"{"dialect":"x","eventTypeSlug":"x","samples":[],"schemaJson":"x","tenantSlug":"x"}"#)))
            },
            round_trip::<SchemaActionDryRunResult>,
        ),
        bodiless(
            "admin-api POST /api/v1/admin/schema/{tenantSlug}/{eventType}/register",
            "/api/v1/admin/schema/t-1/e-1/register",
            |c| {
                drop(c.custd.register_schema_version("t-1", "e-1", &body::<SchemaActionRegisterRequest>(r#"{"checksum":"x","dialect":"x","enabled":true,"eventTypeSlug":"x","schemaJson":"x","tenantSlug":"x","version":"x"}"#)))
            },
        ),
        bodiless(
            "admin-api POST /api/v1/admin/schema/{tenantSlug}/{eventType}/enable",
            "/api/v1/admin/schema/t-1/e-1/enable",
            |c| {
                drop(c.custd.enable_schema_version(
                    "t-1",
                    "e-1",
                    &body::<SchemaActionEnableRequest>(
                        r#"{"enabledAt":"x","eventTypeSlug":"x","tenantSlug":"x","version":"x"}"#,
                    ),
                ))
            },
        ),
    ]
}
