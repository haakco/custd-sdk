use custd_sdk::{
    OffboardingCancelRequest, OffboardingExecuteRequest, OffboardingExportResponse,
    OffboardingPreviewResponse, OffboardingRequestBody, OffboardingRequestCancellation,
    OffboardingRequestResponse, OffboardingSchedule, OffboardingScheduleListResponse,
    OffboardingScheduleRequest, TenantOffboardingReceipt,
};

use super::{body, round_trip};
use crate::{Row, row};

pub fn rows() -> Vec<Row> {
    vec![
        row(
            "admin-api GET /api/v1/admin/offboarding/schedules",
            "/api/v1/admin/offboarding/schedules",
            |c| drop(c.custd.list_offboarding_schedules()),
            round_trip::<OffboardingScheduleListResponse>,
        ),
        row(
            "admin-api POST /api/v1/admin/offboarding/schedules",
            "/api/v1/admin/offboarding/schedules",
            |c| {
                drop(c.custd.schedule_offboarding(&body::<OffboardingScheduleRequest>(r#"{"effectiveAt":"x","gracePeriodDays":1,"reason":"x","tenantSlug":"x"}"#)))
            },
            round_trip::<OffboardingSchedule>,
        ),
        row(
            "admin-api GET /api/v1/admin/offboarding/schedules/{tenantSlug}",
            "/api/v1/admin/offboarding/schedules/t-1",
            |c| drop(c.custd.get_offboarding("t-1")),
            round_trip::<OffboardingSchedule>,
        ),
        row(
            "admin-api POST /api/v1/admin/offboarding/schedules/{tenantSlug}/cancel",
            "/api/v1/admin/offboarding/schedules/t-1/cancel",
            |c| {
                drop(c.custd.cancel_offboarding(
                    "t-1",
                    &body::<OffboardingCancelRequest>(r#"{"reason":"x"}"#),
                ))
            },
            round_trip::<OffboardingSchedule>,
        ),
        row(
            "admin-api POST /api/v1/admin/offboarding",
            "/api/v1/admin/offboarding",
            |c| {
                drop(c.custd.request_offboarding(&body::<OffboardingRequestBody>(
                    r#"{"confirmation":"x"}"#,
                )))
            },
            round_trip::<OffboardingRequestResponse>,
        ),
        row(
            "admin-api GET /api/v1/admin/offboarding/{requestUuid}",
            "/api/v1/admin/offboarding/r-1",
            |c| drop(c.custd.get_offboarding_request("r-1")),
            round_trip::<OffboardingRequestResponse>,
        ),
        row(
            "admin-api POST /api/v1/admin/offboarding/{requestUuid}/confirm",
            "/api/v1/admin/offboarding/r-1/confirm",
            |c| drop(c.custd.confirm_offboarding_request("r-1")),
            round_trip::<OffboardingRequestResponse>,
        ),
        row(
            "admin-api POST /api/v1/admin/offboarding/{requestUuid}/cancel",
            "/api/v1/admin/offboarding/r-1/cancel",
            |c| {
                drop(c.custd.cancel_offboarding_request(
                    "r-1",
                    &body::<OffboardingRequestCancellation>(r#"{"reason":"x"}"#),
                ))
            },
            round_trip::<OffboardingRequestResponse>,
        ),
        row(
            "admin-api POST /api/v1/admin/offboarding/requests/{requestUuid}/acknowledge",
            "/api/v1/admin/offboarding/requests/r-1/acknowledge",
            |c| drop(c.custd.acknowledge_offboarding("r-1")),
            round_trip::<OffboardingRequestResponse>,
        ),
        row(
            "admin-api POST /api/v1/admin/offboarding/requests/{requestUuid}/preview",
            "/api/v1/admin/offboarding/requests/r-1/preview",
            |c| drop(c.custd.preview_offboarding("r-1")),
            round_trip::<OffboardingPreviewResponse>,
        ),
        row(
            "admin-api POST /api/v1/admin/offboarding/requests/{requestUuid}/export",
            "/api/v1/admin/offboarding/requests/r-1/export",
            |c| drop(c.custd.export_offboarding("r-1")),
            round_trip::<OffboardingExportResponse>,
        ),
        row(
            "admin-api POST /api/v1/admin/offboarding/requests/{requestUuid}/execute",
            "/api/v1/admin/offboarding/requests/r-1/execute",
            |c| {
                drop(c.custd.execute_offboarding(
                    "r-1",
                    &body::<OffboardingExecuteRequest>(
                        r#"{"waiver_reason":"x","waiver_role":"x","waiver_timestamp":"x"}"#,
                    ),
                ))
            },
            round_trip::<TenantOffboardingReceipt>,
        ),
        row(
            "admin-api POST /api/v1/admin/offboarding/requests/{requestUuid}/retry",
            "/api/v1/admin/offboarding/requests/r-1/retry",
            |c| drop(c.custd.retry_offboarding("r-1")),
            round_trip::<TenantOffboardingReceipt>,
        ),
        row(
            "admin-api GET /api/v1/admin/offboarding/requests/{requestUuid}/receipt",
            "/api/v1/admin/offboarding/requests/r-1/receipt",
            |c| drop(c.custd.get_offboarding_receipt("r-1")),
            round_trip::<TenantOffboardingReceipt>,
        ),
    ]
}
