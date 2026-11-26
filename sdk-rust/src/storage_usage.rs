//! Storage and metered usage (Admin API): storage usage, storage alert rules and events, and the
//! usage meters.
//!
//! Request and response shapes follow the admin-api OpenAPI document.

use serde::{Deserialize, Serialize};

use crate::Result;
use crate::api_path::{NO_BODY, api_path};
use crate::client::CustdClient;
use crate::data_spaces::DataSpaceStorageMeasurementState;
use crate::measurement::null_as_empty;
use crate::tenants::StorageLimit;
use crate::transport::{Method, percent_encode};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorageUsageSummary {
    pub attributed_storage_bytes: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub breakdown: Option<StorageUsageBreakdown>,
    pub effective_limit_bytes: i64,
    pub measured_at: String,
    pub measurement_state: DataSpaceStorageMeasurementState,
    pub percent_used: f64,
    pub remaining_bytes: i64,
    pub retained_event_count: i64,
    pub retained_logical_bytes: i64,
    pub tenant_count: i64,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub tenants: Vec<TenantStorageUsage>,
    pub warning: bool,
    pub warning_state: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorageUsageBreakdown {
    pub db_core_logical_bytes: i64,
    pub db_raw_inline_logical_bytes: i64,
    pub parquet_archive_attribution: String,
    pub s3_parquet_archive_bytes: i64,
    pub s3_parquet_archive_object_count: i64,
    pub s3_raw_bytes: i64,
    pub s3_raw_object_count: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TenantStorageUsage {
    pub attributed_storage_bytes: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub breakdown: Option<StorageUsageBreakdown>,
    pub company_name: String,
    pub company_slug: String,
    pub effective_limit_bytes: i64,
    pub limit: StorageLimit,
    pub measured_at: String,
    pub measurement_state: DataSpaceStorageMeasurementState,
    pub percent_used: f64,
    pub remaining_bytes: i64,
    pub retained_event_count: i64,
    pub retained_logical_bytes: i64,
    pub warning: bool,
    pub warning_state: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorageAlertRuleListResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub rules: Vec<StorageAlertRule>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorageAlertRule {
    pub channel: String,
    pub created_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub email_recipient: Option<String>,
    pub enabled: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub evaluation: Option<StorageAlertEvaluation>,
    pub metric: String,
    pub rule_id: String,
    pub tenant_slug: String,
    pub threshold_percent: i64,
    pub updated_at: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorageAlertEvaluation {
    pub breached: bool,
    pub evaluated_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub fired_at: Option<String>,
    pub measured_value: i64,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorageAlertRuleCreateRequest {
    pub channel: String,
    pub email_recipient: String,
    pub enabled: bool,
    pub metric: String,
    pub threshold_percent: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorageAlertEventListResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub events: Vec<StorageAlertEvent>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorageAlertEvent {
    pub channel: String,
    pub delivery: StorageAlertDelivery,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub email_recipient: Option<String>,
    pub event_id: String,
    pub measurement: StorageAlertMeasurement,
    pub metric: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub rule_id: Option<String>,
    pub tenant_slug: String,
    pub triggered_at: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorageAlertDelivery {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
    pub state: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorageAlertMeasurement {
    pub limit_bytes: i64,
    pub measured_value: i64,
    pub threshold_percent: i64,
    pub warning_state: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UsageResponse {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub company_slug: Option<String>,
    pub contains_incomplete: bool,
    pub contains_provisional: bool,
    pub end: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub rows: Vec<UsageRow>,
    pub schema_version: String,
    pub source_watermark: i64,
    pub start: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub totals: Vec<UsageTotal>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UsageRow {
    pub account_company_slug: String,
    pub calculation_version: i64,
    pub completeness_state: String,
    pub correction_generation: i64,
    pub data_space_company_slug: String,
    pub meter_slug: String,
    pub meter_version: i64,
    pub quantity: i64,
    pub source_watermark: i64,
    pub unit: String,
    pub window_end: String,
    pub window_start: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UsageTotal {
    pub account_company_slug: String,
    pub data_space_company_slug: String,
    pub meter_slug: String,
    pub quantity: i64,
    pub unit: String,
}

impl CustdClient {
    /// List tenant storage usage.
    pub fn list_storage_usage(&self) -> Result<StorageUsageSummary> {
        let path = api_path("/api/v1/admin/storage-usage".to_owned(), &[], None);
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Get current tenant storage usage.
    pub fn get_current_tenant_storage_usage(&self) -> Result<TenantStorageUsage> {
        let path = api_path("/api/v1/admin/storage-usage/me".to_owned(), &[], None);
        self.call(Method::Get, &path, NO_BODY)
    }

    /// List a tenant's storage alert rules.
    pub fn list_storage_alert_rules(
        &self,
        tenant_slug: &str,
    ) -> Result<StorageAlertRuleListResponse> {
        let path = api_path(
            format!(
                "/api/v1/admin/storage/alerts/{}",
                percent_encode(tenant_slug)
            ),
            &[],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Create a tenant storage alert rule.
    pub fn create_storage_alert_rule(
        &self,
        tenant_slug: &str,
        request: &StorageAlertRuleCreateRequest,
    ) -> Result<StorageAlertRule> {
        let path = api_path(
            format!(
                "/api/v1/admin/storage/alerts/{}",
                percent_encode(tenant_slug)
            ),
            &[],
            None,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Delete a tenant storage alert rule.
    pub fn delete_storage_alert_rule(&self, tenant_slug: &str, rule_id: &str) -> Result<()> {
        let path = api_path(
            format!(
                "/api/v1/admin/storage/alerts/{}/{}",
                percent_encode(tenant_slug),
                percent_encode(rule_id)
            ),
            &[],
            None,
        );
        self.call(Method::Delete, &path, NO_BODY)
    }

    /// List recent storage alert events for a tenant.
    pub fn list_storage_alert_events(
        &self,
        tenant_slug: &str,
    ) -> Result<StorageAlertEventListResponse> {
        let path = api_path(
            format!(
                "/api/v1/admin/storage/alerts/{}/events",
                percent_encode(tenant_slug)
            ),
            &[],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// List reconciled usage.
    pub fn list_usage(
        &self,
        meter: Option<&str>,
        start: Option<&str>,
        end: Option<&str>,
        limit: Option<i64>,
        company_slug: Option<&str>,
    ) -> Result<UsageResponse> {
        let path = api_path(
            "/api/v1/admin/usage".to_owned(),
            &[
                ("meter", meter.map(str::to_owned)),
                ("start", start.map(str::to_owned)),
                ("end", end.map(str::to_owned)),
                ("limit", limit.map(|v| v.to_string())),
            ],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Export reconciled usage.
    pub fn export_usage(
        &self,
        meter: Option<&str>,
        start: Option<&str>,
        end: Option<&str>,
        limit: Option<i64>,
        company_slug: Option<&str>,
    ) -> Result<UsageResponse> {
        let path = api_path(
            "/api/v1/admin/usage/export".to_owned(),
            &[
                ("meter", meter.map(str::to_owned)),
                ("start", start.map(str::to_owned)),
                ("end", end.map(str::to_owned)),
                ("limit", limit.map(|v| v.to_string())),
            ],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Get current tenant usage.
    pub fn get_current_tenant_usage(
        &self,
        meter: Option<&str>,
        start: Option<&str>,
        end: Option<&str>,
        limit: Option<i64>,
        company_slug: Option<&str>,
    ) -> Result<UsageResponse> {
        let path = api_path(
            "/api/v1/admin/usage/me".to_owned(),
            &[
                ("meter", meter.map(str::to_owned)),
                ("start", start.map(str::to_owned)),
                ("end", end.map(str::to_owned)),
                ("limit", limit.map(|v| v.to_string())),
            ],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }
}
