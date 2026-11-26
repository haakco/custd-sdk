use custd_sdk::{
    ReportingPackAuditListResponse, ReportingPackDraft, ReportingPackDraftCreateRequest,
    ReportingPackDraftListResponse, ReportingPackDraftUpdateRequest, ReportingPackGeneration,
    ReportingPackGenerationStatus, ReportingPackGenerationValidityListResponse,
    ReportingPackPreviewRequest, ReportingPackPreviewResponse, ReportingPackRollupProvenance,
    ReportingPackSetupTemplateBindRequest, ReportingPackSetupTemplateBindResponse,
    ReportingPackSetupTemplateListResponse, ReportingPackValidateRequest,
    ReportingPackValidationResponse,
};

use super::{body, round_trip};
use crate::{Row, row};

pub fn rows() -> Vec<Row> {
    vec![
        row(
            "admin-api GET /api/v1/admin/reporting-packs/drafts",
            "/api/v1/admin/reporting-packs/drafts",
            |c| drop(c.custd.list_reporting_pack_drafts()),
            round_trip::<ReportingPackDraftListResponse>,
        ),
        row(
            "admin-api POST /api/v1/admin/reporting-packs/drafts",
            "/api/v1/admin/reporting-packs/drafts",
            |c| {
                drop(c.custd.create_reporting_pack_draft(&body::<ReportingPackDraftCreateRequest>(r#"{"definition":{"dimensions":[],"displayName":"x","enabled":true,"eventTypes":[],"key":"x","metrics":[],"owner":"x","proof":{"forbiddenFields":[],"key":"x","outputLayout":"x","safeMetadataFields":[],"templates":[]},"templates":[],"trust":{"redactionGuard":[],"safeFields":[]},"version":1}}"#)))
            },
            round_trip::<ReportingPackDraft>,
        ),
        row(
            "admin-api GET /api/v1/admin/reporting-packs/drafts/{draftId}",
            "/api/v1/admin/reporting-packs/drafts/d-1",
            |c| drop(c.custd.get_reporting_pack_draft("d-1")),
            round_trip::<ReportingPackDraft>,
        ),
        row(
            "admin-api PUT /api/v1/admin/reporting-packs/drafts/{draftId}",
            "/api/v1/admin/reporting-packs/drafts/d-1",
            |c| {
                drop(c.custd.update_reporting_pack_draft("d-1", &body::<ReportingPackDraftUpdateRequest>(r#"{"definition":{"dimensions":[],"displayName":"x","enabled":true,"eventTypes":[],"key":"x","metrics":[],"owner":"x","proof":{"forbiddenFields":[],"key":"x","outputLayout":"x","safeMetadataFields":[],"templates":[]},"templates":[],"trust":{"redactionGuard":[],"safeFields":[]},"version":1},"expectedRevision":1}"#)))
            },
            round_trip::<ReportingPackDraft>,
        ),
        row(
            "admin-api POST /api/v1/admin/reporting-packs/drafts/{draftId}/publish",
            "/api/v1/admin/reporting-packs/drafts/d-1/publish",
            |c| drop(c.custd.publish_reporting_pack_draft("d-1")),
            round_trip::<ReportingPackGeneration>,
        ),
        row(
            "admin-api POST /api/v1/admin/reporting-packs/drafts/{draftId}/restart",
            "/api/v1/admin/reporting-packs/drafts/d-1/restart",
            |c| drop(c.custd.restart_reporting_pack_draft("d-1")),
            round_trip::<ReportingPackDraft>,
        ),
        row(
            "admin-api POST /api/v1/admin/reporting-packs/validate",
            "/api/v1/admin/reporting-packs/validate",
            |c| {
                drop(c.custd.validate_reporting_pack(&body::<ReportingPackValidateRequest>(r#"{"definition":{"dimensions":[],"displayName":"x","enabled":true,"eventTypes":[],"key":"x","metrics":[],"owner":"x","proof":{"forbiddenFields":[],"key":"x","outputLayout":"x","safeMetadataFields":[],"templates":[]},"templates":[],"trust":{"redactionGuard":[],"safeFields":[]},"version":1}}"#)))
            },
            round_trip::<ReportingPackValidationResponse>,
        ),
        row(
            "admin-api POST /api/v1/admin/reporting-packs/preview",
            "/api/v1/admin/reporting-packs/preview",
            |c| {
                drop(c.custd.preview_reporting_pack(&body::<ReportingPackPreviewRequest>(r#"{"definition":{"dimensions":[],"displayName":"x","enabled":true,"eventTypes":[],"key":"x","metrics":[],"owner":"x","proof":{"forbiddenFields":[],"key":"x","outputLayout":"x","safeMetadataFields":[],"templates":[]},"templates":[],"trust":{"redactionGuard":[],"safeFields":[]},"version":1},"query":{"metrics":[],"template":"x"},"tenantSlug":"x"}"#)))
            },
            round_trip::<ReportingPackPreviewResponse>,
        ),
        row(
            "admin-api GET /api/v1/admin/reporting-packs/generations/{generationId}",
            "/api/v1/admin/reporting-packs/generations/g-1",
            |c| drop(c.custd.get_reporting_pack_generation("g-1")),
            round_trip::<ReportingPackGeneration>,
        ),
        row(
            "admin-api GET /api/v1/admin/reporting-packs/generations/{generationId}/status",
            "/api/v1/admin/reporting-packs/generations/g-1/status",
            |c| drop(c.custd.get_reporting_pack_generation_status("g-1")),
            round_trip::<ReportingPackGenerationStatus>,
        ),
        row(
            "admin-api GET /api/v1/admin/reporting-packs/generations/{generationId}/rollup-provenance",
            "/api/v1/admin/reporting-packs/generations/g-1/rollup-provenance",
            |c| drop(c.custd.get_reporting_pack_rollup_provenance("g-1")),
            round_trip::<ReportingPackRollupProvenance>,
        ),
        row(
            "admin-api POST /api/v1/admin/reporting-packs/generations/{generationId}/rollback",
            "/api/v1/admin/reporting-packs/generations/g-1/rollback",
            |c| drop(c.custd.rollback_reporting_pack_generation("g-1")),
            round_trip::<ReportingPackGeneration>,
        ),
        row(
            "admin-api GET /api/v1/admin/reporting-packs/generation-validity",
            "/api/v1/admin/reporting-packs/generation-validity",
            |c| drop(c.custd.list_reporting_pack_generation_validity()),
            round_trip::<ReportingPackGenerationValidityListResponse>,
        ),
        row(
            "admin-api GET /api/v1/admin/reporting-packs/setup-templates",
            "/api/v1/admin/reporting-packs/setup-templates",
            |c| drop(c.custd.list_reporting_pack_setup_templates()),
            round_trip::<ReportingPackSetupTemplateListResponse>,
        ),
        row(
            "admin-api POST /api/v1/admin/reporting-packs/setup-templates/{kind}/bind",
            "/api/v1/admin/reporting-packs/setup-templates/k-1/bind",
            |c| {
                drop(c.custd.bind_reporting_pack_setup_template(
                    "k-1",
                    &body::<ReportingPackSetupTemplateBindRequest>(
                        r#"{"bindings":{"eventType":"x","resourceField":"x","severityField":"x"}}"#,
                    ),
                ))
            },
            round_trip::<ReportingPackSetupTemplateBindResponse>,
        ),
        row(
            "admin-api GET /api/v1/admin/reporting-packs/audit-events",
            "/api/v1/admin/reporting-packs/audit-events?packKey=p-1",
            |c| drop(c.custd.list_reporting_pack_audit_events("p-1")),
            round_trip::<ReportingPackAuditListResponse>,
        ),
    ]
}
