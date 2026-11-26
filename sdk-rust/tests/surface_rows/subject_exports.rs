use custd_sdk::{
    SubjectExportArtifactResponse, SubjectExportCreateRequest, SubjectExportListResponse,
    SubjectExportResponse, SubjectExportScope,
};

use super::{body, round_trip};
use crate::{Row, row};

pub fn rows() -> Vec<Row> {
    vec![
        row(
            "admin-api GET /api/v1/admin/subject-exports",
            "/api/v1/admin/subject-exports?limit=7&companySlug=acme",
            |c| drop(c.custd.list_subject_exports(Some(7), Some("acme"))),
            round_trip::<SubjectExportListResponse>,
        ),
        row(
            "admin-api POST /api/v1/admin/subject-exports",
            "/api/v1/admin/subject-exports?companySlug=acme",
            |c| {
                drop(c.custd.create_subject_export(
                    &body::<SubjectExportCreateRequest>(
                        r#"{"idempotencyKey":"x","opaqueSubjectId":"x","scope":"access"}"#,
                    ),
                    Some("acme"),
                ))
            },
            round_trip::<SubjectExportResponse>,
        ),
        row(
            "admin-api GET /api/v1/admin/subject-exports/{requestId}",
            "/api/v1/admin/subject-exports/r-1?companySlug=acme",
            |c| drop(c.custd.get_subject_export("r-1", Some("acme"))),
            round_trip::<SubjectExportResponse>,
        ),
        row(
            "admin-api POST /api/v1/admin/subject-exports/{requestId}/cancel",
            "/api/v1/admin/subject-exports/r-1/cancel?companySlug=acme",
            |c| drop(c.custd.cancel_subject_export("r-1", Some("acme"))),
            round_trip::<SubjectExportResponse>,
        ),
        row(
            "admin-api POST /api/v1/admin/subject-exports/{requestId}/force",
            "/api/v1/admin/subject-exports/r-1/force?companySlug=acme",
            |c| drop(c.custd.force_subject_export("r-1", "acme")),
            round_trip::<SubjectExportResponse>,
        ),
        row(
            "admin-api GET /api/v1/admin/subject-exports/{requestId}/download",
            "/api/v1/admin/subject-exports/r-1/download?scope=access&companySlug=acme",
            |c| {
                drop(c.custd.download_subject_export(
                    "r-1",
                    SubjectExportScope::Access,
                    Some("acme"),
                ))
            },
            round_trip::<SubjectExportArtifactResponse>,
        ),
    ]
}
