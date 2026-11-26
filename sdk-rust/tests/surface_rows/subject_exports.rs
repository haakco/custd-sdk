use custd_sdk::{
    SubjectExportArtifactResponse, SubjectExportCreateRequest, SubjectExportListResponse,
    SubjectExportResponse,
};

use super::{body, round_trip};
use crate::{Row, row};

pub fn rows() -> Vec<Row> {
    vec![
        row(
            "admin-api GET /api/v1/admin/subject-exports",
            "/api/v1/admin/subject-exports?limit=7",
            |c| drop(c.custd.list_subject_exports(Some(7))),
            round_trip::<SubjectExportListResponse>,
        ),
        row(
            "admin-api POST /api/v1/admin/subject-exports",
            "/api/v1/admin/subject-exports",
            |c| {
                drop(
                    c.custd
                        .create_subject_export(&body::<SubjectExportCreateRequest>(
                            r#"{"idempotency_key":"x","opaque_subject_id":"x","scope":"x"}"#,
                        )),
                )
            },
            round_trip::<SubjectExportResponse>,
        ),
        row(
            "admin-api GET /api/v1/admin/subject-exports/{requestId}",
            "/api/v1/admin/subject-exports/r-1",
            |c| drop(c.custd.get_subject_export("r-1")),
            round_trip::<SubjectExportResponse>,
        ),
        row(
            "admin-api POST /api/v1/admin/subject-exports/{requestId}/cancel",
            "/api/v1/admin/subject-exports/r-1/cancel",
            |c| drop(c.custd.cancel_subject_export("r-1")),
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
            "/api/v1/admin/subject-exports/r-1/download?scope=s-1",
            |c| drop(c.custd.download_subject_export("r-1", "s-1")),
            round_trip::<SubjectExportArtifactResponse>,
        ),
    ]
}
