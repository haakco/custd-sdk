use custd_sdk::{
    BootstrapStatus, ClientBootstrapSubmitRequest, EnvironmentPolicy,
    EnvironmentPolicyUpdateRequest, IngestClaim, IngestClaimListResponse,
    IngestClaimTerminalRequest, JobRetryReceipt, JobStatusResponse, RLSExecuteRequest,
    RLSExecuteResponse, RLSPlan, RLSPlanRequest, RLSProofResponse, RLSStatus, SDKUsageListResponse,
    SDKVersionDeprecation, SDKVersionDeprecationRequest, ScheduledTaskListViewResponse,
    ScheduledTaskRunRequest, ScheduledTaskRunResponse, SystemStatusResponse,
};

use super::{body, round_trip};
use crate::{Row, bodiless, row};

pub fn rows() -> Vec<Row> {
    vec![
        row(
            "admin-api GET /api/v1/admin/jobs",
            "/api/v1/admin/jobs",
            |c| drop(c.custd.list_jobs()),
            round_trip::<JobStatusResponse>,
        ),
        row(
            "admin-api POST /api/v1/admin/jobs/{jobId}/retry",
            "/api/v1/admin/jobs/7/retry",
            |c| drop(c.custd.retry_job(7)),
            round_trip::<JobRetryReceipt>,
        ),
        row(
            "admin-api GET /api/v1/admin/scheduled-tasks",
            "/api/v1/admin/scheduled-tasks",
            |c| drop(c.custd.list_scheduled_tasks()),
            round_trip::<ScheduledTaskListViewResponse>,
        ),
        row(
            "admin-api POST /api/v1/admin/scheduled-tasks/{taskName}/run",
            "/api/v1/admin/scheduled-tasks/t-1/run",
            |c| {
                drop(c.custd.run_scheduled_task_now(
                    "t-1",
                    &body::<ScheduledTaskRunRequest>(r#"{"force":true}"#),
                ))
            },
            round_trip::<ScheduledTaskRunResponse>,
        ),
        row(
            "admin-api GET /api/v1/admin/system/status",
            "/api/v1/admin/system/status",
            |c| drop(c.custd.get_system_status()),
            round_trip::<SystemStatusResponse>,
        ),
        row(
            "admin-api GET /api/v1/admin/rls/status",
            "/api/v1/admin/rls/status",
            |c| drop(c.custd.get_rls_status()),
            round_trip::<RLSStatus>,
        ),
        row(
            "admin-api POST /api/v1/admin/rls/reconciliation-plans",
            "/api/v1/admin/rls/reconciliation-plans",
            |c| {
                drop(
                    c.custd.create_rls_plan(&body::<RLSPlanRequest>(
                        r#"{"git_commit":"x","label":"x"}"#,
                    )),
                )
            },
            round_trip::<RLSPlan>,
        ),
        row(
            "admin-api POST /api/v1/admin/rls/reconciliation-plans/{planUuid}/execute",
            "/api/v1/admin/rls/reconciliation-plans/p-1/execute",
            |c| {
                drop(c.custd.execute_rls_plan(
                    "p-1",
                    &body::<RLSExecuteRequest>(r#"{}"#),
                    "key-0001",
                ))
            },
            round_trip::<RLSExecuteResponse>,
        ),
        row(
            "admin-api GET /api/v1/admin/rls/reconciliation-plans/{planUuid}/proof",
            "/api/v1/admin/rls/reconciliation-plans/p-1/proof",
            |c| drop(c.custd.get_rls_plan_proof("p-1")),
            round_trip::<RLSProofResponse>,
        ),
        row(
            "admin-api GET /api/v1/admin/ingest/claims/{tenantSlug}",
            "/api/v1/admin/ingest/claims/t-1?limit=7",
            |c| drop(c.custd.list_ingest_claims("t-1", Some(7))),
            round_trip::<IngestClaimListResponse>,
        ),
        row(
            "admin-api POST /api/v1/admin/ingest/claims/{tenantSlug}/{objectUuid}/retry",
            "/api/v1/admin/ingest/claims/t-1/o-1/retry",
            |c| drop(c.custd.retry_ingest_claim("t-1", "o-1")),
            round_trip::<IngestClaim>,
        ),
        row(
            "admin-api POST /api/v1/admin/ingest/claims/{tenantSlug}/{objectUuid}/terminal",
            "/api/v1/admin/ingest/claims/t-1/o-1/terminal",
            |c| {
                drop(c.custd.terminal_ingest_claim(
                    "t-1",
                    "o-1",
                    &body::<IngestClaimTerminalRequest>(r#"{"failureClass":"x"}"#),
                ))
            },
            round_trip::<IngestClaim>,
        ),
        row(
            "admin-api GET /api/v1/admin/bootstrap",
            "/api/v1/admin/bootstrap",
            |c| drop(c.custd.get_client_bootstrap()),
            round_trip::<BootstrapStatus>,
        ),
        row(
            "admin-api POST /api/v1/admin/bootstrap",
            "/api/v1/admin/bootstrap",
            |c| {
                drop(
                    c.custd
                        .submit_client_bootstrap(&body::<ClientBootstrapSubmitRequest>(r#"{}"#)),
                )
            },
            round_trip::<BootstrapStatus>,
        ),
        row(
            "admin-api GET /api/v1/admin/environment-policy",
            "/api/v1/admin/environment-policy?companySlug=acme",
            |c| drop(c.custd.get_environment_policy(Some("acme"))),
            round_trip::<EnvironmentPolicy>,
        ),
        row(
            "admin-api PATCH /api/v1/admin/environment-policy",
            "/api/v1/admin/environment-policy?companySlug=acme",
            |c| {
                drop(c.custd.update_environment_policy(
                    &body::<EnvironmentPolicyUpdateRequest>(r#"{"autoCreateEnvironments":true}"#),
                    Some("acme"),
                ))
            },
            round_trip::<EnvironmentPolicy>,
        ),
        row(
            "admin-api GET /api/v1/admin/sdk-usage",
            "/api/v1/admin/sdk-usage",
            |c| drop(c.custd.list_sdk_usage()),
            round_trip::<SDKUsageListResponse>,
        ),
        row(
            "admin-api PUT /api/v1/admin/sdk-usage/deprecations/{sdk}/{versionScope}",
            "/api/v1/admin/sdk-usage/deprecations/s-1/v-1",
            |c| {
                drop(c.custd.mark_sdk_version_deprecated(
                    "s-1",
                    "v-1",
                    &body::<SDKVersionDeprecationRequest>(
                        r#"{"note":"x","recommendedVersion":"x"}"#,
                    ),
                ))
            },
            round_trip::<SDKVersionDeprecation>,
        ),
        bodiless(
            "admin-api DELETE /api/v1/admin/sdk-usage/deprecations/{sdk}/{versionScope}",
            "/api/v1/admin/sdk-usage/deprecations/s-1/v-1",
            |c| drop(c.custd.clear_sdk_version_deprecation("s-1", "v-1")),
        ),
    ]
}
