//! Tenant reporting (Analytics API `/api/v1/reporting`): dashboards, dashboard data generations,
//! queries, subject insights, exports and prepared data outputs.
//!
//! Request and response shapes follow the analytics-api OpenAPI document.

use serde::{Deserialize, Serialize};

use crate::Result;
use crate::api_path::{NO_BODY, api_path};
use crate::client::CustdClient;
use crate::measurement::null_as_empty;
use crate::time_plans::{
    CompletedDurationReportAdjustmentInput, CompletedDurationReportAnnotationInput,
    CompletedDurationReportBlockInput, CompletedDurationReportPredictionComparison,
    CompletedDurationReportProvenance, CompletedDurationReportSummary,
};
use crate::transport::{Method, percent_encode};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DashboardCatalogueResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub dashboards: Vec<DashboardCatalogueEntry>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DashboardCatalogueEntry {
    pub default_range: String,
    pub description: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub export_formats: Vec<String>,
    pub group: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub interactions: Vec<String>,
    pub key: String,
    pub refresh_seconds: i64,
    pub title: String,
    pub trust: DashboardCatalogueTrust,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DashboardCatalogueTrust {
    pub server_owned: bool,
    pub tenant_scoped: bool,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DashboardDefinition {
    pub default_range: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub executive: Option<ExecutiveReportDefinition>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub export_formats: Vec<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub group: Option<String>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub interactions: Vec<DashboardInteractionRule>,
    pub key: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub pack_key: Option<String>,
    pub refresh_seconds: i64,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub required_scopes: Vec<String>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub sections: Vec<ReportingReportSectionDefinition>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub share_policy: Option<DashboardSharePolicy>,
    pub title: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub widgets: Vec<ReportingWidgetDefinition>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExecutiveReportDefinition {
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub actions: Vec<String>,
    pub comparison_basis: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub comparison_label: Option<String>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub findings: Vec<String>,
    pub primary_label: String,
    pub primary_metric_key: String,
    pub primary_unit: String,
    pub primary_widget_key: String,
    pub recipe: String,
    pub scope_label: String,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub supporting_widget_keys: Vec<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub target_unit: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub target_value: Option<f64>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DashboardInteractionRule {
    pub action: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub comparison_preset: Option<String>,
    pub dimension: String,
    pub key: String,
    pub linked_filter_group: String,
    pub reset_behavior: String,
    pub source_widget: String,
    pub target_widget: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingReportSectionDefinition {
    pub column_span: i64,
    pub key: String,
    pub layout: String,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub narrative: Vec<ReportingNarrativeBlock>,
    pub title: String,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub widget_keys: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DashboardSharePolicy {
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub comparison_presets: Vec<String>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub relative_ranges: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingWidgetDefinition {
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub dimensions: Vec<String>,
    pub key: String,
    pub kind: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub metrics: Vec<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub presentation: Option<PresentationPresetSelection>,
    pub template: String,
    pub title: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingNarrativeBlock {
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub references: Vec<ReportingNarrativeValueReference>,
    pub text: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PresentationPresetSelection {
    pub non_color_encoding: String,
    pub preset_id: String,
    pub summary_template_id: String,
    pub version: i64,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingNarrativeValueReference {
    pub value: String,
    pub widget_key: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DashboardGenerationRequest {
    pub dashboard_key: String,
    pub parameters: ReportExportQueryParameters,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DashboardGenerationResponse {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub byte_length: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub compression: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub contract_version: Option<i64>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub dataset_row_counts: Vec<ReportingDatasetRowCount>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub dataset_schemas: Vec<ReportingSnapshotDatasetSchema>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub download_url: Option<String>,
    pub generation_id: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub media_type: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub poll_after_seconds: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub snapshot_sha256: Option<String>,
    pub state: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub url_expires_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub valid_until: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportExportQueryParameters {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub comparison: Option<String>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub filters: Vec<ReportingRequestedFilter>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub from: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub max_rows: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub range_days: Option<i64>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub selections: Vec<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub to: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingDatasetRowCount {
    pub count: i64,
    pub key: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingSnapshotDatasetSchema {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub columns: Vec<ReportingSnapshotColumn>,
    pub key: String,
    pub label: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingRequestedFilter {
    pub dimension: String,
    pub operator: ReportingRequestedFilterOperator,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub value: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingSnapshotColumn {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub key: String,
    pub label: String,
    pub nullable: bool,
    pub r#type: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub unit: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingQueryRequest {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub comparison: Option<ReportingQueryRequestComparison>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub count_only: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub dashboard_key: Option<String>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub dimensions: Vec<String>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub filters: Vec<ReportingRequestedFilter>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub from: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub max_rows: Option<i64>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub metrics: Vec<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub range_days: Option<i64>,
    pub template: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub to: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub widget_key: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RenderedWidgetData {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub buckets: Vec<RenderedWidgetBucket>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub delta: Option<RenderedMetricValue>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub delta_label: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub delta_percent: Option<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub email_delivery: Option<ReportingEmailDeliveryRecipients>,
    pub event_lag_p95_ms: i64,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub label_metadata: Vec<ReportingSnapshotLabelMetadata>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub metadata: Option<ReportingQueryMetadata>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub parquet_uri_count: Option<i64>,
    pub query_duration_ms: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub secondary_label: Option<String>,
    pub snapshot_age_ms: i64,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub sources: Vec<ReportingSourceSummary>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub trust: Option<ReportingTrust>,
    pub value: RenderedMetricValue,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub visual: Option<RenderedVisualResult>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub warnings: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RenderedWidgetBucket {
    pub date: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub parquet_uri_count: Option<i64>,
    pub query_duration_ms: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub secondary: Option<RenderedMetricValue>,
    pub source: String,
    pub value: RenderedMetricValue,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RenderedMetricValue {
    pub complete: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub currency: Option<String>,
    pub data_sufficiency: String,
    pub sample_count: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub truncated: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub trust: Option<ReportingTemporalTrust>,
    pub unit: String,
    pub value: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingEmailDeliveryRecipients {
    pub complete: bool,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub recipients: Vec<ReportingEmailDeliveryRecipient>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingSnapshotLabelMetadata {
    pub definition_uuid: String,
    pub display_name: String,
    pub key: String,
    pub sensitivity: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub values: Vec<ReportingSnapshotLabelValue>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingQueryMetadata {
    pub covered_windows: i64,
    pub effective_max_rows: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub range_end: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub range_start: Option<String>,
    pub resolved_template: String,
    pub returned_buckets: i64,
    pub returned_rows: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingSourceSummary {
    pub completeness: String,
    pub count: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub coverage_end: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub coverage_start: Option<String>,
    pub kind: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingTrust {
    pub capture_state: String,
    pub consent_state: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub contract_version: Option<String>,
    pub coverage: String,
    pub data_freshness: String,
    pub export_state: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_export: Option<String>,
    pub next_action: ReportingNextActionHint,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub partial_reason: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub permission_class: Option<String>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub query_warnings: Vec<String>,
    pub retryability: ReportingTrustRetryability,
    pub rollup_state: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub schema_version: Option<String>,
    pub status: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub unavailable_reason: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RenderedVisualResult {
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub anomalies: Vec<RenderedAnomaly>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub calibration: Vec<RenderedCalibrationBucket>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub cohorts: Vec<RenderedCohortCell>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub distribution: Vec<RenderedDistributionBin>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub drivers: Vec<RenderedDriver>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub intervals: Vec<RenderedInterval>,
    pub kind: String,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub lifecycle: Vec<RenderedLifecycleStage>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub method: Option<String>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub quantiles: Vec<RenderedQuantile>,
    pub summary: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingTemporalTrust {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub calculation_version: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub coverage_end: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub coverage_start: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub freshness_ms: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub reconciliation: Option<ReportingReconciliationResult>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub source_range: Option<ReportingSourceRange>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub warnings: Vec<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub window_coverage: Option<f64>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingEmailDeliveryRecipient {
    pub occurred_at: String,
    pub outcome: ReportingEmailDeliveryRecipientOutcome,
    pub recipient_id: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingSnapshotLabelValue {
    pub display_name: String,
    pub uuid: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingNextActionHint {
    pub action: ReportingNextActionHintAction,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub max_retries: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub poll_after_seconds: Option<i64>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RenderedAnomaly {
    pub at: String,
    pub lower: f64,
    pub upper: f64,
    pub value: RenderedMetricValue,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RenderedCalibrationBucket {
    pub observed: RenderedMetricValue,
    pub predicted_lower: f64,
    pub predicted_upper: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RenderedCohortCell {
    pub cohort: String,
    pub population: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub suppressed: Option<bool>,
    pub value: RenderedMetricValue,
    pub window: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RenderedDistributionBin {
    pub lower: f64,
    pub upper: f64,
    pub value: RenderedMetricValue,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RenderedDriver {
    pub contribution: RenderedMetricValue,
    pub key: String,
    pub label: String,
    pub method: String,
    pub rank: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RenderedInterval {
    pub estimate: RenderedMetricValue,
    pub label: String,
    pub lower: RenderedMetricValue,
    pub upper: RenderedMetricValue,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RenderedLifecycleStage {
    pub converted: RenderedMetricValue,
    pub drop_off: RenderedMetricValue,
    pub entered: RenderedMetricValue,
    pub key: String,
    pub label: String,
    pub order: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RenderedQuantile {
    pub quantile: f64,
    pub value: RenderedMetricValue,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingReconciliationResult {
    pub availability: String,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub contributing_sources: Vec<ReportingSourceContribution>,
    pub divergence: ReportingSourceDivergence,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub observed_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub selected_source_key: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub selected_source_series: Option<String>,
    pub series_key: String,
    pub status: String,
    pub tenant_key: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub unit: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub value: Option<f64>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingSourceRange {
    pub end: String,
    pub start: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingSourceContribution {
    pub availability: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub freshness_seconds: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub observed_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub selected: Option<bool>,
    pub source_key: String,
    pub source_series_key: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub stale: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub unit: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub value: Option<f64>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingSourceDivergence {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub absolute_difference: Option<f64>,
    pub detected: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub relative_difference: Option<f64>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingSubjectInsightRequest {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub from: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub range_days: Option<i64>,
    pub subject: String,
    pub template: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub to: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingSubjectInsightResponse {
    pub data: RenderedWidgetData,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportExportJobList {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub exports: Vec<ReportExportJob>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportExportJob {
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub artifacts: Vec<ReportExportArtifact>,
    pub attempt_count: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub cancellation_reason: Option<String>,
    pub cleanup_attempts: i64,
    pub cleanup_state: String,
    pub dashboard_key: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub expires_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub failure_category: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub failure_message: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub finished_at: Option<String>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub formats: Vec<String>,
    pub id: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub next_attempt_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub next_cleanup_at: Option<String>,
    pub pack_generation: i64,
    pub pack_key: String,
    pub parameters_digest: String,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub progress_counters: Vec<ReportExportProgressCounter>,
    pub progress_stage: String,
    pub queued_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub snapshot_sha256: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub started_at: Option<String>,
    pub state: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportExportArtifact {
    pub artifact_key: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub fallback_for_format: Option<String>,
    pub filename: String,
    pub format: String,
    pub id: String,
    pub media_type: String,
    pub object_bytes: i64,
    pub object_sha256: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub renderer_version: Option<String>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub warnings: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportExportProgressCounter {
    pub count: i64,
    pub key: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportExportCreateRequest {
    pub dashboard_key: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub formats: Vec<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub idempotency_key: Option<String>,
    pub parameters: ReportExportQueryParameters,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompletedRunExportRequest {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub formats: Vec<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub idempotency_key: Option<String>,
    pub source: CompletedRunExportSource,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompletedRunExportSource {
    pub contract_version: String,
    pub identity: CompletedRunExportIdentity,
    pub integrity: CompletedRunExportIntegrity,
    pub metadata: CompletedRunExportMetadata,
    pub redaction: CompletedRunExportRedaction,
    pub sections: CompletedRunExportSections,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompletedRunExportIdentity {
    pub pack_generation: i64,
    pub pack_key: String,
    pub plan_id: String,
    pub run_id: String,
    pub tenant_id: String,
    pub version_id: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompletedRunExportIntegrity {
    pub export_sha256: String,
    pub source_input_sha256: String,
    pub source_report_sha256: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompletedRunExportMetadata {
    pub corrected: bool,
    pub generated_at: String,
    pub report_version: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompletedRunExportRedaction {
    pub redacted_annotation_count: i64,
    pub result: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompletedRunExportSections {
    pub adjustments: CompletedRunExportAdjustmentSection,
    pub annotations_actions: CompletedRunExportAnnotationsActionsSection,
    pub blocks: CompletedRunExportBlockSection,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub order: Vec<String>,
    pub prediction_comparison: CompletedRunExportPredictionComparisonSection,
    pub provenance: CompletedDurationReportProvenance,
    pub summary: CompletedDurationReportSummary,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompletedRunExportAdjustmentSection {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub items: Vec<CompletedDurationReportAdjustmentInput>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompletedRunExportAnnotationsActionsSection {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub items: Vec<CompletedDurationReportAnnotationInput>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompletedRunExportBlockSection {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub items: Vec<CompletedDurationReportBlockInput>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompletedRunExportPredictionComparisonSection {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub items: Vec<CompletedDurationReportPredictionComparison>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportExportCancelRequest {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub reason: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PreparedDataOutputListResponse {
    /// Configured output envelopes visible to the calling tenant.
    #[serde(default, deserialize_with = "null_as_empty")]
    pub outputs: Vec<PreparedDataOutputStatus>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PreparedDataOutputStatus {
    pub availability: PreparedDataOutputStatusAvailability,
    pub next_action: ReportingNextActionHint,
    pub observed_at: String,
    pub output_uuid: String,
    pub processing_state: PreparedDataOutputStatusProcessingState,
    pub provenance: ReportingProvenance,
    pub retryability: ReportingTrustRetryability,
    pub tenant_slug: String,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub warnings: Vec<ReportingWarning>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub watermark: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingProvenance {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub generation: Option<String>,
    pub owner: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub source_urn: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub watermark: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingWarning {
    pub code: String,
    pub message: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PreparedDataQueryEnvelope {
    /// Canonical prepared values selected from the configured output.
    pub data: RenderedWidgetData,
    /// Resolved status of the configured output.
    pub output: PreparedDataOutputStatus,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PreparedDataReceiptStatus {
    pub availability: PreparedDataOutputStatusAvailability,
    pub next_action: ReportingNextActionHint,
    pub observed_at: String,
    pub processing_state: PreparedDataOutputStatusProcessingState,
    pub provenance: ReportingProvenance,
    pub receipt_uuid: String,
    pub retryability: ReportingTrustRetryability,
    pub tenant_slug: String,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub warnings: Vec<ReportingWarning>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub watermark: Option<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ReportingRequestedFilterOperator {
    #[serde(rename = "eq")]
    Eq,
    #[serde(rename = "neq")]
    Neq,
    #[serde(rename = "in")]
    In,
    #[serde(rename = "contains")]
    Contains,
}

impl ReportingRequestedFilterOperator {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Eq => "eq",
            Self::Neq => "neq",
            Self::In => "in",
            Self::Contains => "contains",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ReportingQueryRequestComparison {
    #[serde(rename = "previous_period")]
    PreviousPeriod,
    #[serde(rename = "previous_year")]
    PreviousYear,
}

impl ReportingQueryRequestComparison {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::PreviousPeriod => "previous_period",
            Self::PreviousYear => "previous_year",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ReportingTrustRetryability {
    #[serde(rename = "none")]
    None,
    #[serde(rename = "bounded")]
    Bounded,
}

impl ReportingTrustRetryability {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::None => "none",
            Self::Bounded => "bounded",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ReportingEmailDeliveryRecipientOutcome {
    #[serde(rename = "deferred")]
    Deferred,
    #[serde(rename = "remote_accepted")]
    RemoteAccepted,
    #[serde(rename = "terminal_failure")]
    TerminalFailure,
}

impl ReportingEmailDeliveryRecipientOutcome {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Deferred => "deferred",
            Self::RemoteAccepted => "remote_accepted",
            Self::TerminalFailure => "terminal_failure",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ReportingNextActionHintAction {
    #[serde(rename = "none")]
    None,
    #[serde(rename = "poll")]
    Poll,
    #[serde(rename = "retry")]
    Retry,
    #[serde(rename = "rotate")]
    Rotate,
    #[serde(rename = "escalate")]
    Escalate,
}

impl ReportingNextActionHintAction {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::None => "none",
            Self::Poll => "poll",
            Self::Retry => "retry",
            Self::Rotate => "rotate",
            Self::Escalate => "escalate",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum PreparedDataOutputStatusAvailability {
    #[serde(rename = "complete")]
    Complete,
    #[serde(rename = "partial")]
    Partial,
    #[serde(rename = "stale")]
    Stale,
    #[serde(rename = "unavailable")]
    Unavailable,
}

impl PreparedDataOutputStatusAvailability {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Complete => "complete",
            Self::Partial => "partial",
            Self::Stale => "stale",
            Self::Unavailable => "unavailable",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum PreparedDataOutputStatusProcessingState {
    #[serde(rename = "accepted")]
    Accepted,
    #[serde(rename = "processing")]
    Processing,
    #[serde(rename = "ready")]
    Ready,
    #[serde(rename = "failed")]
    Failed,
}

impl PreparedDataOutputStatusProcessingState {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Accepted => "accepted",
            Self::Processing => "processing",
            Self::Ready => "ready",
            Self::Failed => "failed",
        }
    }
}

impl CustdClient {
    /// List reporting dashboards.
    pub fn list_reporting_dashboards(&self) -> Result<DashboardCatalogueResponse> {
        let path = api_path("/api/v1/reporting/dashboards".to_owned(), &[], None);
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Get reporting dashboard.
    pub fn get_reporting_dashboard(&self, key: &str) -> Result<DashboardDefinition> {
        let path = api_path(
            format!("/api/v1/reporting/dashboards/{}", percent_encode(key)),
            &[],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Create dashboard data generation.
    pub fn create_dashboard_data_generation(
        &self,
        request: &DashboardGenerationRequest,
    ) -> Result<DashboardGenerationResponse> {
        let path = api_path(
            "/api/v1/reporting/dashboard-data-generations".to_owned(),
            &[],
            None,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Run reporting query.
    pub fn query_reporting(&self, request: &ReportingQueryRequest) -> Result<RenderedWidgetData> {
        let path = api_path("/api/v1/reporting/query".to_owned(), &[], None);
        self.call(Method::Post, &path, Some(request))
    }

    /// Run exact-subject insight.
    pub fn query_subject_insight(
        &self,
        request: &ReportingSubjectInsightRequest,
    ) -> Result<ReportingSubjectInsightResponse> {
        let path = api_path("/api/v1/reporting/insights/subject".to_owned(), &[], None);
        self.call(Method::Post, &path, Some(request))
    }

    /// List report exports.
    pub fn list_report_exports(&self) -> Result<ReportExportJobList> {
        let path = api_path("/api/v1/reporting/exports".to_owned(), &[], None);
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Create report export.
    pub fn create_report_export(
        &self,
        request: &ReportExportCreateRequest,
    ) -> Result<ReportExportJob> {
        let path = api_path("/api/v1/reporting/exports".to_owned(), &[], None);
        self.call(Method::Post, &path, Some(request))
    }

    /// Create completed-run report export.
    pub fn create_completed_run_export(
        &self,
        request: &CompletedRunExportRequest,
    ) -> Result<ReportExportJob> {
        let path = api_path(
            "/api/v1/reporting/exports/completed-run".to_owned(),
            &[],
            None,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Get report export.
    pub fn get_report_export(&self, export_id: &str) -> Result<ReportExportJob> {
        let path = api_path(
            format!("/api/v1/reporting/exports/{}", percent_encode(export_id)),
            &[],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Cancel report export.
    pub fn cancel_report_export(
        &self,
        export_id: &str,
        request: &ReportExportCancelRequest,
    ) -> Result<ReportExportJob> {
        let path = api_path(
            format!(
                "/api/v1/reporting/exports/{}/cancel",
                percent_encode(export_id)
            ),
            &[],
            None,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// List prepared-data outputs.
    pub fn list_prepared_data_outputs(&self) -> Result<PreparedDataOutputListResponse> {
        let path = api_path("/api/v1/reporting/outputs".to_owned(), &[], None);
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Get prepared-data output.
    pub fn get_prepared_data_output(&self, output_uuid: &str) -> Result<PreparedDataOutputStatus> {
        let path = api_path(
            format!("/api/v1/reporting/outputs/{}", percent_encode(output_uuid)),
            &[],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Run prepared-data output query.
    pub fn query_prepared_data_output(
        &self,
        output_uuid: &str,
        request: &ReportingQueryRequest,
    ) -> Result<PreparedDataQueryEnvelope> {
        let path = api_path(
            format!(
                "/api/v1/reporting/outputs/{}/query",
                percent_encode(output_uuid)
            ),
            &[],
            None,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Get prepared-data receipt.
    pub fn get_prepared_data_receipt(
        &self,
        receipt_uuid: &str,
    ) -> Result<PreparedDataReceiptStatus> {
        let path = api_path(
            format!("/api/v1/processing/{}", percent_encode(receipt_uuid)),
            &[],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }
}
