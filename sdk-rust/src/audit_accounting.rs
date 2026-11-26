//! The audit trail and accounting evidence (Admin API `/api/v1/admin/audit` and `/accounting`).
//!
//! Request and response shapes follow the admin-api OpenAPI document.

use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::Result;
use crate::api_path::{NO_BODY, api_path};
use crate::client::CustdClient;
use crate::measurement::null_as_empty;
use crate::transport::{Method, percent_encode};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuditListResponse {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub coverage_begins_at: Option<String>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub events: Vec<AuditEvent>,
    pub next_cursor: AuditListCursor,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub retention: Option<AuditRetentionDisclosure>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuditEvent {
    pub action: String,
    pub actor_display_name: String,
    pub actor_kind: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub actor_reference: Option<String>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub actor_roles: Vec<String>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub changes: Vec<AuditChange>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub correlation_id: Option<String>,
    pub created_at: String,
    #[serde(default, skip_serializing_if = "BTreeMap::is_empty")]
    pub details: BTreeMap<String, Value>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub domain_history: Option<AuditDomainHistory>,
    pub event_id: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub network: Option<AuditNetworkDisclosure>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub operation_id: Option<String>,
    pub outcome: AuditEventOutcome,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub resource_id: Option<String>,
    pub resource_type: String,
    pub tenant_slug: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuditListCursor {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub cursor: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuditRetentionDisclosure {
    pub event_max_age_seconds: i64,
    pub ip_address_max_age_seconds: i64,
    pub user_agent_max_age_seconds: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuditChange {
    #[serde(default, skip_serializing_if = "Value::is_null")]
    pub after: Value,
    #[serde(default, skip_serializing_if = "Value::is_null")]
    pub before: Value,
    pub field: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuditDomainHistory {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub action: Option<String>,
    pub created_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub current_state: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub previous_state: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub resource_id: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub resource_type: Option<String>,
    pub source: String,
    pub source_id: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub state: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub stream_version: Option<i64>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuditNetworkDisclosure {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub ip_address: Option<String>,
    pub ip_address_state: AuditNetworkDisclosureIpAddressState,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub user_agent: Option<String>,
    pub user_agent_state: AuditNetworkDisclosureIpAddressState,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountingEvidenceListResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub evidence: Vec<AccountingEvidence>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountingEvidence {
    pub actor: String,
    pub audit_correlation_id: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub balance: Option<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub delta: Option<f64>,
    pub effective_at: String,
    pub id: String,
    pub kind: AccountingEvidenceKind,
    pub observed_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub quantity: Option<f64>,
    pub reason: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub supersedes_id: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub target_id: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub target_kind: Option<AccountingEvidenceKind>,
    pub tenant_key: String,
    pub unit: AccountingEvidenceUnit,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountingEvidenceCreateRequest {
    pub audit_correlation_id: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub balance: Option<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub delta: Option<f64>,
    pub effective_at: String,
    pub id: String,
    pub kind: AccountingEvidenceKind,
    pub observed_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub quantity: Option<f64>,
    pub reason: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub supersedes_id: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub target_id: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub target_kind: Option<AccountingEvidenceKind>,
    pub unit: AccountingEvidenceUnit,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountingEvidenceResponse {
    pub evidence: AccountingEvidence,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum AuditEventOutcome {
    #[serde(rename = "attempted")]
    Attempted,
    #[serde(rename = "success")]
    Success,
    #[serde(rename = "failure")]
    Failure,
    #[serde(rename = "denied")]
    Denied,
    #[serde(rename = "pending")]
    Pending,
    #[serde(rename = "unknown")]
    Unknown,
}

impl AuditEventOutcome {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Attempted => "attempted",
            Self::Success => "success",
            Self::Failure => "failure",
            Self::Denied => "denied",
            Self::Pending => "pending",
            Self::Unknown => "unknown",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum AuditNetworkDisclosureIpAddressState {
    #[serde(rename = "available")]
    Available,
    #[serde(rename = "redacted")]
    Redacted,
    #[serde(rename = "not_recorded")]
    NotRecorded,
}

impl AuditNetworkDisclosureIpAddressState {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Available => "available",
            Self::Redacted => "redacted",
            Self::NotRecorded => "not_recorded",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum AccountingEvidenceKind {
    #[serde(rename = "purchase")]
    Purchase,
    #[serde(rename = "balance")]
    Balance,
    #[serde(rename = "correction")]
    Correction,
}

impl AccountingEvidenceKind {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Purchase => "purchase",
            Self::Balance => "balance",
            Self::Correction => "correction",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum AccountingEvidenceUnit {
    #[serde(rename = "W")]
    W,
    #[serde(rename = "kW")]
    KW,
    #[serde(rename = "Wh")]
    Wh,
    #[serde(rename = "kWh")]
    KWh,
    #[serde(rename = "V")]
    V,
    #[serde(rename = "A")]
    A,
    #[serde(rename = "L")]
    L,
    #[serde(rename = "Cel")]
    Cel,
    #[serde(rename = "By")]
    By,
    #[serde(rename = "1")]
    N1,
}

impl AccountingEvidenceUnit {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::W => "W",
            Self::KW => "kW",
            Self::Wh => "Wh",
            Self::KWh => "kWh",
            Self::V => "V",
            Self::A => "A",
            Self::L => "L",
            Self::Cel => "Cel",
            Self::By => "By",
            Self::N1 => "1",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum AuditEventsScope {
    #[serde(rename = "tenant")]
    Tenant,
    #[serde(rename = "global")]
    Global,
}

impl AuditEventsScope {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Tenant => "tenant",
            Self::Global => "global",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum AuditEventsFormat {
    #[serde(rename = "csv")]
    Csv,
    #[serde(rename = "json")]
    Json,
}

impl AuditEventsFormat {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Csv => "csv",
            Self::Json => "json",
        }
    }
}

/// The filters and page of `list_audit_events`; unset fields use the server defaults.
#[derive(Debug, Clone, PartialEq, Default)]
pub struct AuditEventQuery {
    /// Tenant scope by default; global scope is system-admin only.
    pub scope: Option<AuditEventsScope>,
    pub affected_tenant_slug: Option<String>,
    /// Optional inclusive lower bound on created_at (RFC3339).
    pub since: Option<String>,
    /// Optional exclusive upper bound on created_at (RFC3339). Must be after since.
    pub until: Option<String>,
    /// Optional actor kind filter.
    pub actor_kind: Option<String>,
    /// Pseudonymous actor reference filter.
    pub actor_reference: Option<String>,
    /// Optional namespaced action filter, e.g. tenant.create.
    pub action: Option<String>,
    /// Optional resource type filter.
    pub resource_type: Option<String>,
    /// Optional resource_id filter.
    pub resource_id: Option<String>,
    /// Optional outcome metadata filter.
    pub outcome: Option<String>,
    /// Optional request or operation correlation filter.
    pub correlation_id: Option<String>,
    /// Optional auth-project environment (realm) filter.
    pub environment_id: Option<String>,
    /// Page size 1-1000. Defaults to 100 when zero.
    pub limit: Option<i64>,
    /// Opaque keyset cursor returned by the prior page.
    pub cursor: Option<String>,
}

impl CustdClient {
    /// List audit events.
    pub fn list_audit_events(
        &self,
        query: &AuditEventQuery,
        company_slug: Option<&str>,
    ) -> Result<AuditListResponse> {
        let path = api_path(
            "/api/v1/admin/audit/events".to_owned(),
            &[
                ("scope", query.scope.map(|v| v.as_str().to_owned())),
                ("affectedTenantSlug", query.affected_tenant_slug.clone()),
                ("since", query.since.clone()),
                ("until", query.until.clone()),
                ("actorKind", query.actor_kind.clone()),
                ("actorReference", query.actor_reference.clone()),
                ("action", query.action.clone()),
                ("resourceType", query.resource_type.clone()),
                ("resourceId", query.resource_id.clone()),
                ("outcome", query.outcome.clone()),
                ("correlationId", query.correlation_id.clone()),
                ("environmentId", query.environment_id.clone()),
                ("limit", query.limit.map(|v| v.to_string())),
                ("cursor", query.cursor.clone()),
            ],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Get a single audit event.
    pub fn get_audit_event(
        &self,
        event_id: &str,
        scope: Option<AuditEventsScope>,
        company_slug: Option<&str>,
    ) -> Result<AuditEvent> {
        let path = api_path(
            format!("/api/v1/admin/audit/events/{}", percent_encode(event_id)),
            &[("scope", scope.map(|v| v.as_str().to_owned()))],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// List tenant accounting evidence.
    pub fn list_accounting_evidence(
        &self,
        as_of: Option<&str>,
        limit: Option<i64>,
    ) -> Result<AccountingEvidenceListResponse> {
        let path = api_path(
            "/api/v1/admin/accounting/evidence".to_owned(),
            &[
                ("asOf", as_of.map(str::to_owned)),
                ("limit", limit.map(|v| v.to_string())),
            ],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Append tenant accounting evidence.
    pub fn create_accounting_evidence(
        &self,
        request: &AccountingEvidenceCreateRequest,
    ) -> Result<AccountingEvidenceResponse> {
        let path = api_path("/api/v1/admin/accounting/evidence".to_owned(), &[], None);
        self.call(Method::Post, &path, Some(request))
    }
}
