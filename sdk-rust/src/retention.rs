//! Retention policies (Admin API `/api/v1/admin/retention/policies`).
//!
//! Request and response shapes follow the admin-api OpenAPI document.

use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};

use crate::Result;
use crate::api_path::{NO_BODY, api_path};
use crate::client::CustdClient;
use crate::measurement::null_as_empty;
use crate::transport::{Method, percent_encode};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RetentionPolicyListResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub policies: Vec<RetentionPolicy>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RetentionPolicy {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub audit_id: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub company_id: Option<i64>,
    pub effective_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub expires_at: Option<String>,
    pub id: i64,
    #[serde(default)]
    pub last_affected_counts: BTreeMap<String, i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_error: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_result: Option<String>,
    pub legal_hold: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub legal_hold_until: Option<String>,
    pub max_age_seconds: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub next_run_at: Option<String>,
    pub precedence: i64,
    pub retention_class: RetentionPolicyRetentionClass,
    pub scope: RetentionPolicyScope,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RetentionPolicyUpsertRequest {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub effective_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub expires_at: Option<String>,
    pub legal_hold: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub legal_hold_reference: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub legal_hold_until: Option<String>,
    pub max_age_seconds: i64,
    pub precedence: i64,
    pub retention_class: RetentionPolicyRetentionClass,
    pub scope: RetentionPolicyScope,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RetentionPoliciesEnvelope {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub policies: Vec<RetentionPolicy>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum RetentionPolicyRetentionClass {
    #[serde(rename = "raw")]
    Raw,
    #[serde(rename = "archive")]
    Archive,
    #[serde(rename = "materialized")]
    Materialized,
    #[serde(rename = "cache")]
    Cache,
    #[serde(rename = "object")]
    Object,
    #[serde(rename = "audit_event")]
    AuditEvent,
    #[serde(rename = "audit_ip_address")]
    AuditIpAddress,
    #[serde(rename = "audit_user_agent")]
    AuditUserAgent,
}

impl RetentionPolicyRetentionClass {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Raw => "raw",
            Self::Archive => "archive",
            Self::Materialized => "materialized",
            Self::Cache => "cache",
            Self::Object => "object",
            Self::AuditEvent => "audit_event",
            Self::AuditIpAddress => "audit_ip_address",
            Self::AuditUserAgent => "audit_user_agent",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum RetentionPolicyScope {
    #[serde(rename = "tenant")]
    Tenant,
    #[serde(rename = "data_space")]
    DataSpace,
    #[serde(rename = "event_type")]
    EventType,
    #[serde(rename = "global")]
    Global,
}

impl RetentionPolicyScope {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Tenant => "tenant",
            Self::DataSpace => "data_space",
            Self::EventType => "event_type",
            Self::Global => "global",
        }
    }
}

impl CustdClient {
    /// List bounded retention policies.
    pub fn list_retention_policies(&self) -> Result<RetentionPolicyListResponse> {
        let path = api_path("/api/v1/admin/retention/policies".to_owned(), &[], None);
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Get a tenant's bounded retention policies.
    pub fn get_retention_policy(
        &self,
        tenant_slug: &str,
        request: &RetentionPolicyUpsertRequest,
    ) -> Result<RetentionPoliciesEnvelope> {
        let path = api_path(
            format!(
                "/api/v1/admin/retention/policies/{}",
                percent_encode(tenant_slug)
            ),
            &[],
            None,
        );
        self.call(Method::Get, &path, Some(request))
    }

    /// Create or replace a tenant's bounded retention policy.
    pub fn upsert_retention_policy(
        &self,
        tenant_slug: &str,
        request: &RetentionPolicyUpsertRequest,
    ) -> Result<RetentionPolicy> {
        let path = api_path(
            format!(
                "/api/v1/admin/retention/policies/{}",
                percent_encode(tenant_slug)
            ),
            &[],
            None,
        );
        self.call(Method::Put, &path, Some(request))
    }

    /// Delete a tenant's bounded retention policy.
    pub fn delete_retention_policy(
        &self,
        tenant_slug: &str,
        request: &RetentionPolicyUpsertRequest,
    ) -> Result<()> {
        let path = api_path(
            format!(
                "/api/v1/admin/retention/policies/{}",
                percent_encode(tenant_slug)
            ),
            &[],
            None,
        );
        self.call(Method::Delete, &path, Some(request))
    }
}
