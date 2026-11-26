use custd_sdk::{
    AppItemCreated, AppItemMeasurementPage, AppItemRead, AppItemRunCreateRequest, AppItemRunPage,
    AppItemSettingsRequest, AppModelCalculateRequest, AppModelCalculateResult, AppModelCopyRequest,
    AppModelVersionRequest,
};

use super::{body, round_trip};
use crate::{Row, TOKEN, row, shape};

pub fn rows() -> Vec<Row> {
    vec![
        row(
            "admin-api PATCH /api/v1/app/item",
            "/api/v1/app/item",
            |c| {
                drop(
                    c.app
                        .link(TOKEN)
                        .update(&body::<AppItemSettingsRequest>(r#"{}"#)),
                )
            },
            shape::<AppItemRead>,
        ),
        row(
            "admin-api GET /api/v1/app/item/measurements",
            "/api/v1/app/item/measurements?item=i-1&after=a-1&limit=7&run=r-1",
            |c| {
                drop(c.app.link(TOKEN).list_measurements(
                    Some("i-1"),
                    Some("a-1"),
                    Some(7),
                    Some("r-1"),
                ))
            },
            round_trip::<AppItemMeasurementPage>,
        ),
        row(
            "admin-api GET /api/v1/app/item/runs",
            "/api/v1/app/item/runs?item=i-1&after=a-1&limit=7",
            |c| {
                drop(
                    c.app
                        .link(TOKEN)
                        .list_runs(Some("i-1"), Some("a-1"), Some(7)),
                )
            },
            round_trip::<AppItemRunPage>,
        ),
        row(
            "admin-api POST /api/v1/app/item/runs",
            "/api/v1/app/item/runs",
            |c| {
                drop(
                    c.app
                        .link(TOKEN)
                        .start_run(&body::<AppItemRunCreateRequest>(r#"{"projectCode":"x"}"#)),
                )
            },
            shape::<AppItemRead>,
        ),
        row(
            "admin-api POST /api/v1/app/item/model/copy",
            "/api/v1/app/item/model/copy",
            |c| {
                drop(
                    c.app
                        .link(TOKEN)
                        .copy_model(&body::<AppModelCopyRequest>(r#"{}"#)),
                )
            },
            shape::<AppItemCreated>,
        ),
        row(
            "admin-api POST /api/v1/app/item/model/versions",
            "/api/v1/app/item/model/versions",
            |c| {
                drop(
                    c.app
                        .link(TOKEN)
                        .add_model_version(&body::<AppModelVersionRequest>(r#"{"quantities":[]}"#)),
                )
            },
            shape::<AppItemRead>,
        ),
        row(
            "analytics-api POST /api/v1/app/models/calculate",
            "/api/v1/app/models/calculate",
            |c| {
                drop(
                    c.app
                        .link(TOKEN)
                        .calculate_model(&body::<AppModelCalculateRequest>(r#"{"outputs":[]}"#)),
                )
            },
            round_trip::<AppModelCalculateResult>,
        ),
    ]
}
