use custd_sdk::{ApplicationProfileValuesRequest, CurrentApplicationProfile};

use super::{body, round_trip};
use crate::{Row, row};

pub fn rows() -> Vec<Row> {
    vec![
        row(
            "admin-api GET /api/v1/app/profile",
            "/api/v1/app/profile",
            |c| drop(c.custd.get_current_app_profile()),
            round_trip::<CurrentApplicationProfile>,
        ),
        row(
            "admin-api PATCH /api/v1/app/profile",
            "/api/v1/app/profile",
            |c| {
                drop(
                    c.custd
                        .update_current_app_profile(&body::<ApplicationProfileValuesRequest>(
                            r#"{"values":[]}"#,
                        )),
                )
            },
            round_trip::<CurrentApplicationProfile>,
        ),
        row(
            "admin-api POST /api/v1/app/profile",
            "/api/v1/app/profile",
            |c| {
                drop(c.custd.initialize_current_app_profile(
                    &body::<ApplicationProfileValuesRequest>(r#"{"values":[]}"#),
                ))
            },
            round_trip::<CurrentApplicationProfile>,
        ),
        row(
            "admin-api DELETE /api/v1/app/profile/photo",
            "/api/v1/app/profile/photo",
            |c| drop(c.custd.remove_current_app_profile_photo()),
            round_trip::<CurrentApplicationProfile>,
        ),
    ]
}
