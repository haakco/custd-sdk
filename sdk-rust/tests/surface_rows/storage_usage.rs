use custd_sdk::{
    StorageAlertEventListResponse, StorageAlertRule, StorageAlertRuleCreateRequest,
    StorageAlertRuleListResponse, StorageUsageSummary, TenantStorageUsage, UsageResponse,
};

use super::{body, round_trip};
use crate::{Row, bodiless, row};

pub fn rows() -> Vec<Row> {
    vec![
        row(
            "admin-api GET /api/v1/admin/storage-usage",
            "/api/v1/admin/storage-usage",
            |c| drop(c.custd.list_storage_usage()),
            round_trip::<StorageUsageSummary>,
        ),
        row(
            "admin-api GET /api/v1/admin/storage-usage/me",
            "/api/v1/admin/storage-usage/me",
            |c| drop(c.custd.get_current_tenant_storage_usage()),
            round_trip::<TenantStorageUsage>,
        ),
        row(
            "admin-api GET /api/v1/admin/storage/alerts/{tenantSlug}",
            "/api/v1/admin/storage/alerts/t-1",
            |c| drop(c.custd.list_storage_alert_rules("t-1")),
            round_trip::<StorageAlertRuleListResponse>,
        ),
        row(
            "admin-api POST /api/v1/admin/storage/alerts/{tenantSlug}",
            "/api/v1/admin/storage/alerts/t-1",
            |c| {
                drop(c.custd.create_storage_alert_rule("t-1", &body::<StorageAlertRuleCreateRequest>(r#"{"channel":"x","emailRecipient":"x","enabled":true,"metric":"x","thresholdPercent":1}"#)))
            },
            round_trip::<StorageAlertRule>,
        ),
        bodiless(
            "admin-api DELETE /api/v1/admin/storage/alerts/{tenantSlug}/{ruleId}",
            "/api/v1/admin/storage/alerts/t-1/r-1",
            |c| drop(c.custd.delete_storage_alert_rule("t-1", "r-1")),
        ),
        row(
            "admin-api GET /api/v1/admin/storage/alerts/{tenantSlug}/events",
            "/api/v1/admin/storage/alerts/t-1/events",
            |c| drop(c.custd.list_storage_alert_events("t-1")),
            round_trip::<StorageAlertEventListResponse>,
        ),
        row(
            "admin-api GET /api/v1/admin/usage",
            "/api/v1/admin/usage?meter=m-1&start=s-1&end=e-1&limit=7&companySlug=acme",
            |c| {
                drop(c.custd.list_usage(
                    Some("m-1"),
                    Some("s-1"),
                    Some("e-1"),
                    Some(7),
                    Some("acme"),
                ))
            },
            round_trip::<UsageResponse>,
        ),
        row(
            "admin-api GET /api/v1/admin/usage/export",
            "/api/v1/admin/usage/export?meter=m-1&start=s-1&end=e-1&limit=7&companySlug=acme",
            |c| {
                drop(c.custd.export_usage(
                    Some("m-1"),
                    Some("s-1"),
                    Some("e-1"),
                    Some(7),
                    Some("acme"),
                ))
            },
            round_trip::<UsageResponse>,
        ),
        row(
            "admin-api GET /api/v1/admin/usage/me",
            "/api/v1/admin/usage/me?meter=m-1&start=s-1&end=e-1&limit=7&companySlug=acme",
            |c| {
                drop(c.custd.get_current_tenant_usage(
                    Some("m-1"),
                    Some("s-1"),
                    Some("e-1"),
                    Some(7),
                    Some("acme"),
                ))
            },
            round_trip::<UsageResponse>,
        ),
    ]
}
