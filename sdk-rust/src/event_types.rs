//! Event types, event categories and the admin schema actions (Admin API `/api/v1/admin/event-types`,
//! `/event-categories` and `/schema`).
//!
//! Request and response shapes follow the admin-api OpenAPI document.

use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::Result;
use crate::api_path::{NO_BODY, api_path};
use crate::client::CustdClient;
use crate::measurement::null_as_empty;
use crate::transport::{Method, percent_encode};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EventTypeConfigListResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub event_types: Vec<EventTypeConfig>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EventTypeConfig {
    pub category_is_audit: bool,
    #[serde(default)]
    pub category_retention_days: Option<i64>,
    pub category_slug: String,
    pub name: String,
    #[serde(default)]
    pub retention_days: Option<i64>,
    #[serde(default, skip_serializing_if = "Value::is_null")]
    pub rollup_dimensions: Value,
    pub slug: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EventTypeConfigUpdateRequest {
    #[serde(default)]
    pub retention_days: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub rollup_dimensions: Option<RollupDimensionProfile>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RollupDimensionProfile {
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub dimensions: Vec<EventRollupDimension>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EventRollupDimension {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub lookups: Vec<String>,
    pub slot: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EventCategoryConfigListResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub event_categories: Vec<EventCategoryConfig>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EventCategoryConfig {
    pub is_audit: bool,
    pub name: String,
    #[serde(default)]
    pub retention_days: Option<i64>,
    #[serde(default, skip_serializing_if = "Value::is_null")]
    pub rollup_dimensions: Value,
    pub slug: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EventCategoryConfigUpdateRequest {
    pub is_audit: bool,
    #[serde(default)]
    pub retention_days: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub rollup_dimensions: Option<RollupDimensionProfile>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SchemaAuditResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub schemas: Vec<SchemaAuditResult>,
    pub summary: SchemaAuditSummary,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SchemaAuditResult {
    pub class: String,
    pub dialect: String,
    pub event_type_slug: String,
    pub example_validation: SchemaExampleValidationSummary,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub issue_codes: Vec<String>,
    pub legacy_compile: SchemaCompileResult,
    pub recommended_action: String,
    pub schema_checksum: String,
    pub shared_compile: SchemaCompileResult,
    pub tenant_slug: String,
    pub version: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SchemaAuditSummary {
    pub blocked: i64,
    pub compatible: i64,
    pub needs_migration: i64,
    pub total: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SchemaExampleValidationSummary {
    pub deltas: i64,
    pub discovered: i64,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub issue_codes: Vec<String>,
    pub run: i64,
    pub same_accept: i64,
    pub same_reject: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SchemaCompileResult {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub issues: Vec<String>,
    pub valid: bool,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SchemaActionValidateRequest {
    pub dialect: String,
    pub event_type_slug: String,
    pub schema_json: String,
    pub tenant_slug: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SchemaActionValidateResult {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub issues: Vec<SchemaIssue>,
    pub suggested_action: String,
    pub valid: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SchemaIssue {
    pub code: String,
    pub message: String,
    pub path: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SchemaActionDryRunRequest {
    pub dialect: String,
    pub event_type_slug: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub samples: Vec<Value>,
    pub schema_json: String,
    pub tenant_slug: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SchemaActionDryRunResult {
    pub failed: i64,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub issues: Vec<SchemaIssue>,
    pub passed: i64,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SchemaActionRegisterRequest {
    pub checksum: String,
    pub dialect: String,
    pub enabled: bool,
    pub event_type_slug: String,
    pub schema_json: String,
    pub tenant_slug: String,
    pub version: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SchemaActionEnableRequest {
    pub enabled_at: String,
    pub event_type_slug: String,
    pub tenant_slug: String,
    pub version: String,
}

impl CustdClient {
    /// List event types.
    pub fn list_event_types(&self) -> Result<EventTypeConfigListResponse> {
        let path = api_path("/api/v1/admin/event-types".to_owned(), &[], None);
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Update event type.
    pub fn update_event_type(
        &self,
        slug: &str,
        request: &EventTypeConfigUpdateRequest,
    ) -> Result<()> {
        let path = api_path(
            format!("/api/v1/admin/event-types/{}", percent_encode(slug)),
            &[],
            None,
        );
        self.call(Method::Patch, &path, Some(request))
    }

    /// List event categories.
    pub fn list_event_categories(&self) -> Result<EventCategoryConfigListResponse> {
        let path = api_path("/api/v1/admin/event-categories".to_owned(), &[], None);
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Update event category.
    pub fn update_event_category(
        &self,
        slug: &str,
        request: &EventCategoryConfigUpdateRequest,
    ) -> Result<()> {
        let path = api_path(
            format!("/api/v1/admin/event-categories/{}", percent_encode(slug)),
            &[],
            None,
        );
        self.call(Method::Patch, &path, Some(request))
    }

    /// Audit active tenant schemas.
    pub fn audit_schemas(&self, tenant_slug: &str) -> Result<SchemaAuditResponse> {
        let path = api_path(
            "/api/v1/admin/schema/audit".to_owned(),
            &[("tenantSlug", Some(tenant_slug.to_owned()))],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Validate a candidate schema.
    pub fn validate_schema(
        &self,
        request: &SchemaActionValidateRequest,
    ) -> Result<SchemaActionValidateResult> {
        let path = api_path("/api/v1/admin/schema/validate".to_owned(), &[], None);
        self.call(Method::Post, &path, Some(request))
    }

    /// Dry-run a candidate schema against sample events.
    pub fn dry_run_schema(
        &self,
        tenant_slug: &str,
        event_type: &str,
        request: &SchemaActionDryRunRequest,
    ) -> Result<SchemaActionDryRunResult> {
        let path = api_path(
            format!(
                "/api/v1/admin/schema/{}/{}/dry-run",
                percent_encode(tenant_slug),
                percent_encode(event_type)
            ),
            &[],
            None,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Register a schema version.
    pub fn register_schema_version(
        &self,
        tenant_slug: &str,
        event_type: &str,
        request: &SchemaActionRegisterRequest,
    ) -> Result<()> {
        let path = api_path(
            format!(
                "/api/v1/admin/schema/{}/{}/register",
                percent_encode(tenant_slug),
                percent_encode(event_type)
            ),
            &[],
            None,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Enable a registered schema version.
    pub fn enable_schema_version(
        &self,
        tenant_slug: &str,
        event_type: &str,
        request: &SchemaActionEnableRequest,
    ) -> Result<()> {
        let path = api_path(
            format!(
                "/api/v1/admin/schema/{}/{}/enable",
                percent_encode(tenant_slug),
                percent_encode(event_type)
            ),
            &[],
            None,
        );
        self.call(Method::Post, &path, Some(request))
    }
}
