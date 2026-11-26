use custd_sdk::{
    AppModelCopyRequest, UncertaintyModelCreateRequest, UncertaintyModelDetail,
    UncertaintyModelList, UncertaintyModelRunDetail, UncertaintyModelRunList,
    UncertaintyModelRunRequest, UncertaintyModelSource, UncertaintyModelVersion,
    UncertaintyModelVersionCreateRequest, UncertaintyModelVersionList,
};

use super::{body, round_trip};
use crate::{Row, bodiless, row};

pub fn rows() -> Vec<Row> {
    vec![
        row(
            "admin-api GET /api/v1/admin/uncertainty-models",
            "/api/v1/admin/uncertainty-models?source=all&companySlug=acme",
            |c| {
                drop(
                    c.custd
                        .list_uncertainty_models(Some(UncertaintyModelSource::All), Some("acme")),
                )
            },
            round_trip::<UncertaintyModelList>,
        ),
        row(
            "admin-api POST /api/v1/admin/uncertainty-models",
            "/api/v1/admin/uncertainty-models?companySlug=acme",
            |c| {
                drop(c.custd.create_uncertainty_model(
                    &body::<UncertaintyModelCreateRequest>(r#"{"name":"x"}"#),
                    Some("acme"),
                ))
            },
            round_trip::<UncertaintyModelDetail>,
        ),
        row(
            "admin-api GET /api/v1/admin/uncertainty-models/{modelUuid}",
            "/api/v1/admin/uncertainty-models/m-1?companySlug=acme",
            |c| drop(c.custd.get_uncertainty_model("m-1", Some("acme"))),
            round_trip::<UncertaintyModelDetail>,
        ),
        bodiless(
            "admin-api DELETE /api/v1/admin/uncertainty-models/{modelUuid}",
            "/api/v1/admin/uncertainty-models/m-1?companySlug=acme",
            |c| drop(c.custd.delete_uncertainty_model("m-1", Some("acme"))),
        ),
        row(
            "admin-api POST /api/v1/admin/uncertainty-models/{modelUuid}/copy",
            "/api/v1/admin/uncertainty-models/m-1/copy?companySlug=acme",
            |c| {
                drop(c.custd.copy_uncertainty_model(
                    "m-1",
                    &body::<AppModelCopyRequest>(r#"{}"#),
                    Some("acme"),
                ))
            },
            round_trip::<UncertaintyModelDetail>,
        ),
        row(
            "admin-api GET /api/v1/admin/uncertainty-models/{modelUuid}/versions",
            "/api/v1/admin/uncertainty-models/m-1/versions?companySlug=acme",
            |c| drop(c.custd.list_uncertainty_model_versions("m-1", Some("acme"))),
            round_trip::<UncertaintyModelVersionList>,
        ),
        row(
            "admin-api POST /api/v1/admin/uncertainty-models/{modelUuid}/versions",
            "/api/v1/admin/uncertainty-models/m-1/versions?companySlug=acme",
            |c| {
                drop(c.custd.create_uncertainty_model_version(
                    "m-1",
                    &body::<UncertaintyModelVersionCreateRequest>(r#"{"quantities":[]}"#),
                    Some("acme"),
                ))
            },
            round_trip::<UncertaintyModelVersion>,
        ),
        row(
            "admin-api GET /api/v1/admin/uncertainty-models/{modelUuid}/versions/{versionNumber}",
            "/api/v1/admin/uncertainty-models/m-1/versions/7?companySlug=acme",
            |c| {
                drop(
                    c.custd
                        .get_uncertainty_model_version("m-1", 7, Some("acme")),
                )
            },
            round_trip::<UncertaintyModelVersion>,
        ),
        row(
            "analytics-api GET /api/v1/measurement/uncertainty-models/{modelUuid}/runs",
            "/api/v1/measurement/uncertainty-models/m-1/runs",
            |c| drop(c.custd.list_uncertainty_model_runs("m-1")),
            round_trip::<UncertaintyModelRunList>,
        ),
        row(
            "analytics-api POST /api/v1/measurement/uncertainty-models/{modelUuid}/runs",
            "/api/v1/measurement/uncertainty-models/m-1/runs",
            |c| {
                drop(c.custd.create_uncertainty_model_run(
                    "m-1",
                    &body::<UncertaintyModelRunRequest>(r#"{"seed":1}"#),
                ))
            },
            round_trip::<UncertaintyModelRunDetail>,
        ),
        row(
            "analytics-api GET /api/v1/measurement/uncertainty-models/{modelUuid}/runs/{runUuid}",
            "/api/v1/measurement/uncertainty-models/m-1/runs/r-1",
            |c| drop(c.custd.get_uncertainty_model_run("m-1", "r-1")),
            round_trip::<UncertaintyModelRunDetail>,
        ),
    ]
}
