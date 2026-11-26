use custd_sdk::{
    DataLabelAssignmentListResponse, DataLabelCatalogueResponse, DataLabelDefinition,
    DataLabelDefinitionCreateRequest, DataLabelDefinitionListResponse,
    DataLabelDefinitionUpdateRequest, DataLabelUsageListResponse, DataLabelValue,
    DataLabelValueCreateRequest, DataLabelValueUpdateRequest, EventTypeDataLabelDefaultRequest,
    SchemaFieldDataLabelAssignmentRequest,
};

use super::{body, round_trip};
use crate::{Row, bodiless, row};

pub fn rows() -> Vec<Row> {
    vec![
        row(
            "admin-api GET /api/v1/admin/data-labels",
            "/api/v1/admin/data-labels?includeDisabled=true&companySlug=acme",
            |c| drop(c.custd.list_data_labels(Some(true), Some("acme"))),
            round_trip::<DataLabelDefinitionListResponse>,
        ),
        row(
            "admin-api POST /api/v1/admin/data-labels",
            "/api/v1/admin/data-labels?companySlug=acme",
            |c| {
                drop(c.custd.create_data_label(&body::<DataLabelDefinitionCreateRequest>(r#"{"allowedScopes":[],"description":"x","displayName":"x","intendedUse":"x","key":"x","propagationPolicy":"none","sensitivity":"public","synonyms":[]}"#), Some("acme")))
            },
            round_trip::<DataLabelDefinition>,
        ),
        row(
            "admin-api GET /api/v1/admin/data-labels/{definitionUuid}",
            "/api/v1/admin/data-labels/d-1?includeDisabled=true&companySlug=acme",
            |c| drop(c.custd.get_data_label("d-1", Some(true), Some("acme"))),
            round_trip::<DataLabelDefinition>,
        ),
        row(
            "admin-api PATCH /api/v1/admin/data-labels/{definitionUuid}",
            "/api/v1/admin/data-labels/d-1?companySlug=acme",
            |c| {
                drop(c.custd.update_data_label("d-1", &body::<DataLabelDefinitionUpdateRequest>(r#"{"allowedScopes":[],"description":"x","displayName":"x","intendedUse":"x","propagationPolicy":"none","sensitivity":"public","synonyms":[]}"#), Some("acme")))
            },
            round_trip::<DataLabelDefinition>,
        ),
        bodiless(
            "admin-api POST /api/v1/admin/data-labels/{definitionUuid}/disable",
            "/api/v1/admin/data-labels/d-1/disable?includeDisabled=true&companySlug=acme",
            |c| drop(c.custd.disable_data_label("d-1", Some(true), Some("acme"))),
        ),
        row(
            "admin-api GET /api/v1/admin/data-labels/catalogue",
            "/api/v1/admin/data-labels/catalogue?includeDisabled=true&companySlug=acme",
            |c| drop(c.custd.get_data_label_catalogue(Some(true), Some("acme"))),
            round_trip::<DataLabelCatalogueResponse>,
        ),
        row(
            "admin-api GET /api/v1/admin/data-labels/usage",
            "/api/v1/admin/data-labels/usage?companySlug=acme",
            |c| drop(c.custd.list_data_label_usage(Some("acme"))),
            round_trip::<DataLabelUsageListResponse>,
        ),
        row(
            "admin-api POST /api/v1/admin/data-labels/{definitionUuid}/values",
            "/api/v1/admin/data-labels/d-1/values?companySlug=acme",
            |c| {
                drop(c.custd.create_data_label_value(
                    "d-1",
                    &body::<DataLabelValueCreateRequest>(
                        r#"{"description":"x","displayName":"x","value":"x"}"#,
                    ),
                    Some("acme"),
                ))
            },
            round_trip::<DataLabelValue>,
        ),
        row(
            "admin-api PATCH /api/v1/admin/data-label-values/{valueUuid}",
            "/api/v1/admin/data-label-values/v-1?companySlug=acme",
            |c| {
                drop(c.custd.update_data_label_value(
                    "v-1",
                    &body::<DataLabelValueUpdateRequest>(
                        r#"{"description":"x","displayName":"x"}"#,
                    ),
                    Some("acme"),
                ))
            },
            round_trip::<DataLabelValue>,
        ),
        bodiless(
            "admin-api POST /api/v1/admin/data-label-values/{valueUuid}/disable",
            "/api/v1/admin/data-label-values/v-1/disable?companySlug=acme",
            |c| drop(c.custd.disable_data_label_value("v-1", Some("acme"))),
        ),
        row(
            "admin-api GET /api/v1/admin/data-label-assignments",
            "/api/v1/admin/data-label-assignments?companySlug=acme",
            |c| drop(c.custd.list_data_label_assignments(Some("acme"))),
            round_trip::<DataLabelAssignmentListResponse>,
        ),
        bodiless(
            "admin-api PUT /api/v1/admin/event-schemas/{schemaUuid}/field-data-labels",
            "/api/v1/admin/event-schemas/s-1/field-data-labels?companySlug=acme",
            |c| {
                drop(c.custd.set_schema_field_data_label_assignment(
                    "s-1",
                    &body::<SchemaFieldDataLabelAssignmentRequest>(
                        r#"{"definitionUuid":"x","fieldPath":"x","valueUuid":"x"}"#,
                    ),
                    Some("acme"),
                ))
            },
        ),
        bodiless(
            "admin-api DELETE /api/v1/admin/data-label-assignments/schema-fields/{assignmentUuid}",
            "/api/v1/admin/data-label-assignments/schema-fields/a-1?companySlug=acme",
            |c| {
                drop(
                    c.custd
                        .remove_schema_field_data_label_assignment("a-1", Some("acme")),
                )
            },
        ),
        bodiless(
            "admin-api PUT /api/v1/admin/event-types/{slug}/data-label-defaults/{definitionUuid}",
            "/api/v1/admin/event-types/s-1/data-label-defaults/d-1?companySlug=acme",
            |c| {
                drop(c.custd.set_event_type_data_label_default(
                    "s-1",
                    "d-1",
                    &body::<EventTypeDataLabelDefaultRequest>(r#"{"valueUuid":"x"}"#),
                    Some("acme"),
                ))
            },
        ),
        bodiless(
            "admin-api DELETE /api/v1/admin/event-types/{slug}/data-label-defaults/{definitionUuid}",
            "/api/v1/admin/event-types/s-1/data-label-defaults/d-1?companySlug=acme",
            |c| {
                drop(
                    c.custd
                        .remove_event_type_data_label_default("s-1", "d-1", Some("acme")),
                )
            },
        ),
    ]
}
