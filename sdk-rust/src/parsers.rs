//! Raw-line parsers: the built-in preset catalogue and the tenant's own parsers (schema registry
//! `/api/v1/parsers`), and the bounded dry-run preview (ingest API `/api/v1/parser-preview`).
//!
//! Shapes follow the schema-registry and ingest-api handlers. The credential names the tenant.

use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::Result;
use crate::api_path::NO_BODY;
use crate::client::CustdClient;
use crate::measurement::null_as_empty;
use crate::transport::{Method, percent_encode};

const PARSERS: &str = "/api/v1/parsers";

/// How a parser reads one line.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ParserType {
    Regex,
    Json,
    Xml,
    Csv,
    Syslog,
}

/// How lines are grouped into records before parsing.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum ParserFramingType {
    None,
    DockerJson,
    K8sCri,
    PhpMultiline,
}

/// What source framing made of one previewed record.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ParserFramingOutcome {
    Complete,
    Malformed,
    Incomplete,
    Oversize,
}

/// Source framing; unset limits use the server defaults (64 KiB and 32 lines).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ParserFraming {
    pub r#type: ParserFramingType,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub max_record_bytes: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub max_lines: Option<i64>,
}

/// Fields a parser generates under one namespace.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ParserGeneratedFieldConfig {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub fields: Vec<String>,
    pub namespace: String,
}

/// One tenant-owned parser.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ParserDefinition {
    pub uuid: String,
    pub code: String,
    pub name: String,
    pub parser_type: ParserType,
    #[serde(default)]
    pub pattern: Option<String>,
    pub timestamp_format: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub field_mapping: BTreeMap<String, String>,
    #[serde(default, skip_serializing_if = "BTreeMap::is_empty")]
    pub generated_fields: BTreeMap<String, ParserGeneratedFieldConfig>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub framing: Option<ParserFraming>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub enabled: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub revision: Option<i64>,
}

/// The tenant's parsers.
#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ParserListResponse {
    pub parsers: Vec<ParserDefinition>,
}

/// One built-in parser preset.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ParserPreset {
    pub code: String,
    pub name: String,
    pub family: String,
    pub description: String,
    pub parser_type: ParserType,
    pub pattern: String,
    pub timestamp_format: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub field_mapping: BTreeMap<String, String>,
    pub sample: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub variants: Vec<String>,
}

/// The built-in parser presets.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ParserPresetListResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub presets: Vec<ParserPreset>,
}

/// Creates or replaces a tenant-owned parser.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ParserSaveRequest {
    pub code: String,
    pub name: String,
    pub parser_type: ParserType,
    pub pattern: Option<String>,
    pub timestamp_format: String,
    #[serde(default)]
    pub field_mapping: BTreeMap<String, String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub framing: Option<ParserFraming>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub enabled: Option<bool>,
}

/// The parser a preview runs; nothing is stored.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ParserPreviewDefinition {
    pub code: String,
    pub name: String,
    pub parser_type: ParserType,
    pub pattern: Option<String>,
    pub timestamp_format: String,
    #[serde(default)]
    pub field_mapping: BTreeMap<String, String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub framing: Option<ParserFraming>,
}

/// A dry run: the server bounds `sample` to 256 KiB and `max_lines` to 100.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ParserPreviewRequest {
    pub parser: ParserPreviewDefinition,
    pub sample: String,
    pub max_lines: i64,
}

/// One sample line's result; `line` is 1-based and `error` is set only when `ok` is false.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ParserPreviewRow {
    pub line: i64,
    pub ok: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub framing: Option<ParserFramingOutcome>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub event_type_slug: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub timestamp: Option<String>,
    #[serde(default, skip_serializing_if = "BTreeMap::is_empty")]
    pub context: BTreeMap<String, Value>,
    #[serde(default, skip_serializing_if = "BTreeMap::is_empty")]
    pub payload: BTreeMap<String, Value>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

/// The dry-run result; `parsed` and `failed` summarise `results`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ParserPreviewResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub results: Vec<ParserPreviewRow>,
    pub parsed: i64,
    pub failed: i64,
}

/// A parser deletion.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ParserDeleteResponse {
    pub deleted: bool,
}

impl CustdClient {
    /// List the built-in parser presets.
    pub fn list_parser_presets(&self) -> Result<ParserPresetListResponse> {
        self.call(Method::Get, &format!("{PARSERS}/presets"), NO_BODY)
    }

    /// List the tenant's parsers.
    pub fn list_parsers(&self) -> Result<ParserListResponse> {
        let parsers: Option<Vec<ParserDefinition>> = self.call(Method::Get, PARSERS, NO_BODY)?;
        Ok(ParserListResponse {
            parsers: parsers.unwrap_or_default(),
        })
    }

    /// Add a tenant-owned parser.
    pub fn create_parser(&self, request: &ParserSaveRequest) -> Result<ParserDefinition> {
        self.call(Method::Post, PARSERS, Some(request))
    }

    /// Replace a tenant-owned parser.
    pub fn update_parser(
        &self,
        parser_uuid: &str,
        request: &ParserSaveRequest,
    ) -> Result<ParserDefinition> {
        let path = format!("{PARSERS}/{}", percent_encode(parser_uuid));
        self.call(Method::Put, &path, Some(request))
    }

    /// Remove a tenant-owned parser.
    pub fn delete_parser(&self, parser_uuid: &str) -> Result<ParserDeleteResponse> {
        let path = format!("{PARSERS}/{}", percent_encode(parser_uuid));
        self.call(Method::Delete, &path, NO_BODY)
    }

    /// Run a parser against a bounded sample and return each line's result. Nothing is stored.
    pub fn preview_parser(&self, request: &ParserPreviewRequest) -> Result<ParserPreviewResponse> {
        self.call(Method::Post, "/api/v1/parser-preview", Some(request))
    }
}
