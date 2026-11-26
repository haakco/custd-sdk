//! The tenant's event schema registry (`/api/v1/schemas`): event types, schema versions,
//! validation, dry runs, inference and version state.
//!
//! Shapes follow the schema-registry handlers. The credential names the tenant. The list routes
//! answer with a bare JSON array; each is returned in a named list type.

use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::Result;
use crate::api_path::NO_BODY;
use crate::client::CustdClient;
use crate::measurement::null_as_empty;
use crate::transport::{Method, percent_encode};

const SCHEMAS: &str = "/api/v1/schemas";

/// One event type the tenant can send.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EventType {
    pub slug: String,
    pub name: String,
    pub enabled: bool,
}

/// The tenant's event types.
#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EventTypeList {
    pub event_types: Vec<EventType>,
}

/// One stored version of an event type's schema; `json_schema` is the document as registered.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EventSchemaVersion {
    pub version: String,
    pub json_schema: String,
    pub is_active: bool,
    pub enabled: bool,
}

/// An event type's schema versions.
#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EventSchemaVersionList {
    pub versions: Vec<EventSchemaVersion>,
}

/// One version's JSON Schema document as stored.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct EventSchemaDocument {
    pub schema: Value,
}

/// Registers a schema version, creating the event type when it is new.
#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EventSchemaRegisterRequest {
    pub slug: String,
    pub name: String,
    pub version: String,
    /// The JSON Schema document as text.
    pub json_schema: String,
    pub enabled: bool,
    pub is_active: bool,
}

/// A schema and optional example events to check without registering anything.
#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EventSchemaCheckRequest {
    pub slug: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    pub version: String,
    pub json_schema: String,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub examples: Vec<Value>,
}

/// One problem the validator found.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EventSchemaIssue {
    pub path: String,
    pub keyword: String,
    pub message: String,
    pub schema_location: String,
    pub instance_location: String,
    pub severity: String,
}

/// Whether one example event matches the schema.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EventSchemaExampleResult {
    pub index: i64,
    pub valid: bool,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub issue_codes: Vec<String>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub issues: Vec<EventSchemaIssue>,
}

/// A field a registration would change incompatibly.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EventSchemaConflict {
    pub field: String,
    pub message: String,
}

/// The outcome of validating or dry-running a schema.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EventSchemaCheckResult {
    pub valid: bool,
    pub schema_valid: bool,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub issues: Vec<EventSchemaIssue>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub warnings: Vec<EventSchemaIssue>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub example_results: Vec<EventSchemaExampleResult>,
    pub normalized_schema: String,
    pub dialect: String,
    pub checksum: String,
    pub would_create_event_type: bool,
    pub would_create_version: bool,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub conflicts: Vec<EventSchemaConflict>,
    pub validator_engine: String,
    pub validator_version: String,
    pub schema_checksum: String,
    pub schema_dialect: String,
}

/// The sample events a candidate schema is inferred from.
#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EventSchemaInferRequest {
    pub samples: Vec<Value>,
}

/// A candidate schema inferred from samples.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EventSchemaInferResult {
    pub valid: bool,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub issues: Vec<EventSchemaIssue>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub inference_warnings: Vec<EventSchemaIssue>,
    pub candidate_schema: String,
    pub validator_engine: String,
    pub validator_version: String,
    pub schema_checksum: String,
    pub schema_dialect: String,
}

/// Confirms a schema or event-type state change.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct EventSchemaStateResult {
    pub updated: bool,
}

impl CustdClient {
    /// List the tenant's event types.
    pub fn list_event_schemas(&self) -> Result<EventTypeList> {
        let event_types: Option<Vec<EventType>> = self.call(Method::Get, SCHEMAS, NO_BODY)?;
        Ok(EventTypeList {
            event_types: event_types.unwrap_or_default(),
        })
    }

    /// List an event type's schema versions.
    pub fn list_event_schema_versions(&self, event_type: &str) -> Result<EventSchemaVersionList> {
        let path = format!("{}/versions", event_schema_path(event_type));
        let versions: Option<Vec<EventSchemaVersion>> = self.call(Method::Get, &path, NO_BODY)?;
        Ok(EventSchemaVersionList {
            versions: versions.unwrap_or_default(),
        })
    }

    /// Read one version's JSON Schema document.
    pub fn get_event_schema(&self, event_type: &str, version: &str) -> Result<EventSchemaDocument> {
        let path = event_schema_version_path(event_type, version);
        let schema: Value = self.call(Method::Get, &path, NO_BODY)?;
        Ok(EventSchemaDocument { schema })
    }

    /// Register a schema version and return its event type.
    pub fn register_event_schema(&self, request: &EventSchemaRegisterRequest) -> Result<EventType> {
        self.call(Method::Post, SCHEMAS, Some(request))
    }

    /// Check a schema and its examples without registering anything.
    pub fn validate_event_schema(
        &self,
        request: &EventSchemaCheckRequest,
    ) -> Result<EventSchemaCheckResult> {
        self.call(Method::Post, &format!("{SCHEMAS}/validate"), Some(request))
    }

    /// Report what registering the schema would do, without registering it.
    pub fn dry_run_event_schema(
        &self,
        request: &EventSchemaCheckRequest,
    ) -> Result<EventSchemaCheckResult> {
        self.call(Method::Post, &format!("{SCHEMAS}/dry-run"), Some(request))
    }

    /// Propose a schema from sample events.
    pub fn infer_event_schema(
        &self,
        request: &EventSchemaInferRequest,
    ) -> Result<EventSchemaInferResult> {
        self.call(Method::Post, &format!("{SCHEMAS}/infer"), Some(request))
    }

    /// Make one version the event type's active schema.
    pub fn activate_event_schema_version(
        &self,
        event_type: &str,
        version: &str,
    ) -> Result<EventSchemaStateResult> {
        let path = format!("{}/active", event_schema_version_path(event_type, version));
        self.call(Method::Post, &path, NO_BODY)
    }

    /// Let events validate against one version again.
    pub fn enable_event_schema_version(
        &self,
        event_type: &str,
        version: &str,
    ) -> Result<EventSchemaStateResult> {
        let path = format!("{}/enabled", event_schema_version_path(event_type, version));
        self.call(Method::Put, &path, NO_BODY)
    }

    /// Deprecate one version so new events no longer validate against it.
    pub fn disable_event_schema_version(
        &self,
        event_type: &str,
        version: &str,
    ) -> Result<EventSchemaStateResult> {
        let path = format!("{}/enabled", event_schema_version_path(event_type, version));
        self.call(Method::Delete, &path, NO_BODY)
    }

    /// Retire the tenant's event type. Its schemas and stored events stay readable.
    pub fn disable_event_schema_type(&self, event_type: &str) -> Result<EventSchemaStateResult> {
        self.call(Method::Delete, &event_schema_path(event_type), NO_BODY)
    }
}

fn event_schema_path(event_type: &str) -> String {
    format!("{SCHEMAS}/{}", percent_encode(event_type))
}

fn event_schema_version_path(event_type: &str, version: &str) -> String {
    format!(
        "{}/{}",
        event_schema_path(event_type),
        percent_encode(version)
    )
}
