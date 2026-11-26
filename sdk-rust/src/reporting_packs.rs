//! Reporting packs (Admin API `/api/v1/admin/reporting-packs`): drafts, validation, preview,
//! publication, generations, setup templates and the audit trail.
//!
//! Request and response shapes follow the admin-api OpenAPI document.

use serde::{Deserialize, Serialize};

use crate::Result;
use crate::api_path::{NO_BODY, api_path};
use crate::client::CustdClient;
use crate::measurement::null_as_empty;
use crate::reporting::{
    DashboardCatalogueEntryExportFormats, DashboardDefinition,
    ExecutiveReportDefinitionComparisonBasis, ExecutiveReportDefinitionRecipe,
    PresentationPresetSelection, RenderedMetricValue, RenderedMetricValueUnit, RenderedWidgetData,
    ReportingQueryRequest, ReportingReconciliationResultUnit, ReportingRequestedFilterOperator,
    ReportingTrustStatus,
};
use crate::transport::{Method, percent_encode};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPackDraftListResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub drafts: Vec<ReportingPackDraft>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPackDraft {
    pub created_at: String,
    pub definition: ReportingPack,
    pub id: i64,
    pub revision: i64,
    pub updated_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub validation_error: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPack {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub accounting: Option<ReportingPackAccountingContract>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub activation_rules: Vec<ReportingPackActivationRule>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub activity_rules: Vec<ReportingPackActivityRule>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub asset_hierarchy: Option<ReportingPackAssetHierarchy>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub dashboards: Vec<DashboardDefinition>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub dimensions: Vec<ReportingPackDimension>,
    pub display_name: String,
    pub enabled: bool,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub event_types: Vec<String>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub export_formats: Vec<DashboardCatalogueEntryExportFormats>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub flow_rules: Vec<ReportingPackFlowRule>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub identity: Option<ReportingPackIdentitySelectors>,
    pub key: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub metrics: Vec<ReportingPackMetric>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub observation: Option<ReportingPackObservationContract>,
    pub owner: String,
    pub proof: ReportingPackProofProfile,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub reconciliations: Vec<ReportingPackSourceReconciliation>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub redaction_rules: Vec<ReportingPackRedactionRule>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub retention_rules: Vec<ReportingPackRetentionRule>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub rollup_rules: Vec<ReportingPackRollupRule>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub templates: Vec<ReportingPackTemplate>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub transition_rules: Vec<ReportingPackTransitionRule>,
    pub trust: ReportingPackTrustDiagnostics,
    pub version: i64,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPackAccountingContract {
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub allocations: Vec<ReportingPackAllocationRule>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub schedules: Vec<ReportingPackSteppedRateSchedule>,
    pub usage_metric: String,
    pub version: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPackActivationRule {
    pub cohort_window_days: i64,
    pub identity: ReportingPackActivationRuleIdentity,
    pub key: String,
    pub predicate: ReportingPackMatchPredicate,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPackActivityRule {
    pub bucket_days: i64,
    pub identity: ReportingPackActivationRuleIdentity,
    pub key: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPackAssetHierarchy {
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub edges: Vec<ReportingPackAssetHierarchyEdge>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub max_depth: Option<i64>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub nodes: Vec<ReportingPackAssetNode>,
    pub tenant_key: String,
    pub version: i64,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPackDimension {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub allowed_value_pattern: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub fallback: Option<String>,
    pub key: String,
    pub label: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub label_definition_key: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub label_definition_uuid: Option<String>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub label_value_uuids: Vec<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub max_cardinality: Option<i64>,
    pub selector: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPackFlowRule {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub completion_markers: Vec<String>,
    pub correlation_selector: String,
    pub family_selector: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub family_value: Option<String>,
    pub include_uncorrelated: bool,
    pub key: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub start_markers: Vec<String>,
    pub step_selector: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPackIdentitySelectors {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub cohort: Option<ReportingPackSelectorDefinition>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub correlation: Option<ReportingPackSelectorDefinition>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub entity: Option<ReportingPackSelectorDefinition>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub session: Option<ReportingPackSelectorDefinition>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub subject: Option<ReportingPackSelectorDefinition>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPackMetric {
    pub calculation: ReportingPackMetricCalculation,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub canonical_unit: Option<ReportingReconciliationResultUnit>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub denominator_metric: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub distinct: Option<ReportingPackSelectorDefinition>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub flow_result: Option<ReportingPackMetricFlowResult>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub hierarchy_root_key: Option<String>,
    pub key: String,
    pub kind: ReportingPackMetricKind,
    pub label: String,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub r#match: Vec<ReportingPackMatchPredicate>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub maximum_gap_seconds: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub measurement_kind: Option<ReportingPackMetricMeasurementKind>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub numerator_metric: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub numeric: Option<ReportingPackNumericSelector>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub percentile: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub reset_policy: Option<ReportingPackMetricResetPolicy>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub rollover_at: Option<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub series_key: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub unit: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPackObservationContract {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub assets: Vec<ReportingPackObservationAsset>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub series: Vec<ReportingPackSemanticSeries>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub sources: Vec<ReportingPackObservationSource>,
    pub version: i64,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPackProofProfile {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub forbidden_fields: Vec<String>,
    pub key: String,
    pub output_layout: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub safe_metadata_fields: Vec<String>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub templates: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPackSourceReconciliation {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub absolute_tolerance: Option<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub canonical_unit: Option<ReportingReconciliationResultUnit>,
    pub max_age_seconds: i64,
    pub mode: ReportingPackSourceReconciliationMode,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub relative_tolerance: Option<f64>,
    pub series_key: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub sources: Vec<ReportingPackSourceSeries>,
    pub tenant_key: String,
    pub version: i64,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPackRedactionRule {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub allowed_fields: Vec<String>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub reason_classes: Vec<String>,
    pub result_shape: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub selector_fields: Vec<String>,
    pub source_event_type: String,
    pub source_system: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPackRetentionRule {
    pub activation_rule: String,
    pub key: String,
    pub return_predicate: ReportingPackMatchPredicate,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub return_window_days: Vec<i64>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPackRollupRule {
    pub completeness_required: bool,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub dimensions: Vec<ReportingPackRollupDimension>,
    pub family: String,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub r#match: Vec<ReportingPackMatchPredicate>,
    pub metric: String,
    pub source_event_type: String,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub templates: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPackTemplate {
    pub aggregation: ReportingPackTemplateAggregation,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub allowed_dimensions: Vec<String>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub allowed_filters: Vec<ReportingPackFilterDefinition>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub allowed_metrics: Vec<String>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub composition_rules: Vec<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub default_range: Option<String>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub event_types: Vec<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub flow_rule: Option<String>,
    pub max_rows: i64,
    pub name: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub source_modes: Vec<ReportingPackTemplateSourceModes>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub subject_scope: Option<ReportingPackSubjectScopeRule>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPackTransitionRule {
    pub identity: ReportingPackActivationRuleIdentity,
    pub key: String,
    pub max_duration_ms: i64,
    pub max_events: i64,
    pub step_selector: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub steps: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPackTrustDiagnostics {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub redaction_guard: Vec<String>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub safe_fields: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPackAllocationRule {
    pub key: String,
    pub rounding: ReportingPackRoundingPolicy,
    pub source_series_key: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub targets: Vec<ReportingPackAllocationTarget>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPackSteppedRateSchedule {
    pub billing_boundary: ReportingPackSteppedRateScheduleBillingBoundary,
    pub currency: String,
    pub effective_from: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub effective_to: Option<String>,
    pub key: String,
    pub rounding: ReportingPackRoundingPolicy,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub tiers: Vec<ReportingPackRateTier>,
    pub timezone: String,
    pub usage_metric: String,
    pub usage_unit: ReportingReconciliationResultUnit,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPackMatchPredicate {
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub any_of: Vec<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub exact: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub non_empty: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub pattern: Option<String>,
    pub selector: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPackAssetHierarchyEdge {
    pub child_key: String,
    pub mode: ReportingPackAssetHierarchyEdgeMode,
    pub parent_key: String,
    pub tenant_key: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPackAssetNode {
    pub key: String,
    pub label: String,
    pub tenant_key: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPackSelectorDefinition {
    pub selector: String,
    pub r#type: ReportingPackSelectorDefinitionType,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPackNumericSelector {
    pub selector: String,
    pub r#type: ReportingPackSelectorDefinitionType,
    pub unit: RenderedMetricValueUnit,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPackObservationAsset {
    pub key: String,
    pub label: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPackSemanticSeries {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub allowed_source_units: Vec<ReportingReconciliationResultUnit>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub asset_key: Option<String>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub asset_keys: Vec<String>,
    pub canonical_unit: ReportingReconciliationResultUnit,
    pub expected_cadence_seconds: i64,
    pub key: String,
    pub maximum_gap_seconds: i64,
    pub measurement_kind: ReportingPackMetricMeasurementKind,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub sources: Vec<ReportingPackSourceSeries>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPackObservationSource {
    pub key: String,
    pub label: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPackSourceSeries {
    pub priority: i64,
    pub source_key: String,
    pub source_series_key: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPackRollupDimension {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub allowed_value_pattern: Option<String>,
    pub dimension: String,
    pub selector: String,
    pub slot: i64,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPackFilterDefinition {
    pub dimension: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub operators: Vec<ReportingRequestedFilterOperator>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPackSubjectScopeRule {
    pub dimension: String,
    pub required: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPackRoundingPolicy {
    pub decimal_places: i64,
    pub mode: ReportingPackRoundingPolicyMode,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPackAllocationTarget {
    pub series_key: String,
    pub weight: f64,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPackRateTier {
    pub lower_bound: f64,
    pub price_per_unit: f64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub upper_bound: Option<f64>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPackDraftCreateRequest {
    pub definition: ReportingPack,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPackDraftUpdateRequest {
    pub definition: ReportingPack,
    pub expected_revision: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPackGeneration {
    pub created_at: String,
    pub definition: ReportingPack,
    pub generation_number: i64,
    pub id: i64,
    pub source_draft_id: i64,
    pub state: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPackValidateRequest {
    pub definition: ReportingPack,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPackValidationResponse {
    pub valid: bool,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPackPreviewRequest {
    pub definition: ReportingPack,
    pub query: ReportingQueryRequest,
    pub tenant_slug: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPackPreviewResponse {
    pub data: RenderedWidgetData,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub executive: Option<ExecutiveReport>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub presentation: Option<PresentationPresetSelection>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExecutiveReport {
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub actions: Vec<String>,
    pub as_of: String,
    pub comparison: ExecutiveComparisonResult,
    pub confidence: ExecutiveConfidence,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub findings: Vec<String>,
    pub generated_at: String,
    pub period: ExecutivePeriod,
    pub primary: ExecutivePrimaryResult,
    pub recipe: ExecutiveReportDefinitionRecipe,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub supporting_widgets: Vec<String>,
    pub tenant_display_name: String,
    pub title: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExecutiveComparisonResult {
    pub available: bool,
    pub basis: ExecutiveReportDefinitionComparisonBasis,
    pub label: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub percent_change: Option<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub target_value: Option<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub value: Option<RenderedMetricValue>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExecutiveConfidence {
    pub completeness: String,
    pub coverage: String,
    pub freshness: String,
    pub status: ReportingTrustStatus,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub warnings: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExecutivePeriod {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub from: Option<String>,
    pub label: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub to: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExecutivePrimaryResult {
    pub label: String,
    pub period_total: RenderedMetricValue,
    pub scope: String,
    pub unit: String,
    pub value: RenderedMetricValue,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPackGenerationStatus {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub acknowledgements: Vec<ReportingPackGenerationAcknowledgementStatus>,
    pub generation: ReportingPackGenerationStatusGeneration,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPackGenerationAcknowledgementStatus {
    pub accepted: bool,
    pub consumer: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub error_detail: Option<String>,
    pub observed_at: String,
    pub observed_generation_id: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPackGenerationStatusGeneration {
    pub generation_number: i64,
    pub id: i64,
    pub pack_key: String,
    pub state: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPackRollupProvenance {
    pub definition_fingerprint: String,
    pub generation_id: i64,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub materializations: Vec<ReportingPackMaterializationProvenance>,
    pub tenant_slug: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPackMaterializationProvenance {
    pub definition_fingerprint: String,
    pub source_coverage_count: i64,
    pub status: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPackGenerationValidityListResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub generations: Vec<ReportingPackGenerationValidity>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPackGenerationValidity {
    pub generation_number: i64,
    pub id: i64,
    pub pack_key: String,
    pub state: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub validation_error: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPackSetupTemplateListResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub templates: Vec<ReportingPackSetupTemplate>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPackSetupTemplate {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub bindings: Vec<ReportingPackSetupBindingField>,
    pub definition: ReportingPack,
    pub display_name: String,
    pub kind: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPackSetupBindingField {
    pub key: String,
    pub label: String,
    pub required: bool,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPackSetupTemplateBindRequest {
    pub bindings: ReportingPackLogObservabilityBindings,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPackSetupTemplateBindResponse {
    pub definition: ReportingPack,
    pub kind: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPackLogObservabilityBindings {
    pub event_type: String,
    pub resource_field: String,
    pub severity_field: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPackAuditListResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub events: Vec<ReportingPackAuditEvent>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportingPackAuditEvent {
    pub action: String,
    pub actor_display_name: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub actor_reference: Option<String>,
    pub created_at: String,
    pub pack_key: String,
    pub resource_type: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ReportingPackActivationRuleIdentity {
    #[serde(rename = "subject")]
    Subject,
    #[serde(rename = "session")]
    Session,
    #[serde(rename = "correlation")]
    Correlation,
}

impl ReportingPackActivationRuleIdentity {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Subject => "subject",
            Self::Session => "session",
            Self::Correlation => "correlation",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ReportingPackMetricCalculation {
    #[serde(rename = "usage_charge")]
    UsageCharge,
    #[serde(rename = "marginal_rate")]
    MarginalRate,
    #[serde(rename = "projection")]
    Projection,
    #[serde(rename = "purchased_vs_used")]
    PurchasedVsUsed,
    #[serde(rename = "observed_balance")]
    ObservedBalance,
    #[serde(rename = "projected_balance")]
    ProjectedBalance,
    #[serde(rename = "allocated_recovery")]
    AllocatedRecovery,
    #[serde(rename = "correction_count")]
    CorrectionCount,
    #[serde(rename = "count")]
    Count,
    #[serde(rename = "failure_count")]
    FailureCount,
    #[serde(rename = "flow")]
    Flow,
    #[serde(rename = "distinct_count")]
    DistinctCount,
    #[serde(rename = "sum")]
    Sum,
    #[serde(rename = "average")]
    Average,
    #[serde(rename = "percentile")]
    Percentile,
    #[serde(rename = "ratio")]
    Ratio,
    #[serde(rename = "latest")]
    Latest,
    #[serde(rename = "minimum")]
    Minimum,
    #[serde(rename = "maximum")]
    Maximum,
    #[serde(rename = "firstLastDelta")]
    FirstLastDelta,
    #[serde(rename = "timeWeightedAverage")]
    TimeWeightedAverage,
    #[serde(rename = "rate")]
    Rate,
    #[serde(rename = "integral")]
    Integral,
}

impl ReportingPackMetricCalculation {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::UsageCharge => "usage_charge",
            Self::MarginalRate => "marginal_rate",
            Self::Projection => "projection",
            Self::PurchasedVsUsed => "purchased_vs_used",
            Self::ObservedBalance => "observed_balance",
            Self::ProjectedBalance => "projected_balance",
            Self::AllocatedRecovery => "allocated_recovery",
            Self::CorrectionCount => "correction_count",
            Self::Count => "count",
            Self::FailureCount => "failure_count",
            Self::Flow => "flow",
            Self::DistinctCount => "distinct_count",
            Self::Sum => "sum",
            Self::Average => "average",
            Self::Percentile => "percentile",
            Self::Ratio => "ratio",
            Self::Latest => "latest",
            Self::Minimum => "minimum",
            Self::Maximum => "maximum",
            Self::FirstLastDelta => "firstLastDelta",
            Self::TimeWeightedAverage => "timeWeightedAverage",
            Self::Rate => "rate",
            Self::Integral => "integral",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ReportingPackMetricFlowResult {
    #[serde(rename = "steps")]
    Steps,
    #[serde(rename = "starts")]
    Starts,
    #[serde(rename = "completions")]
    Completions,
    #[serde(rename = "drop_offs")]
    DropOffs,
    #[serde(rename = "completion_rate")]
    CompletionRate,
    #[serde(rename = "uncorrelated")]
    Uncorrelated,
}

impl ReportingPackMetricFlowResult {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Steps => "steps",
            Self::Starts => "starts",
            Self::Completions => "completions",
            Self::DropOffs => "drop_offs",
            Self::CompletionRate => "completion_rate",
            Self::Uncorrelated => "uncorrelated",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ReportingPackMetricKind {
    #[serde(rename = "count")]
    Count,
    #[serde(rename = "unique_count")]
    UniqueCount,
    #[serde(rename = "rate")]
    Rate,
    #[serde(rename = "latency")]
    Latency,
    #[serde(rename = "percentile")]
    Percentile,
    #[serde(rename = "failure_ratio")]
    FailureRatio,
    #[serde(rename = "freshness_age")]
    FreshnessAge,
    #[serde(rename = "latest_value")]
    LatestValue,
    #[serde(rename = "probability")]
    Probability,
    #[serde(rename = "quantile")]
    Quantile,
    #[serde(rename = "credible_interval")]
    CredibleInterval,
    #[serde(rename = "forecast_date")]
    ForecastDate,
    #[serde(rename = "value_of_information")]
    ValueOfInformation,
}

impl ReportingPackMetricKind {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Count => "count",
            Self::UniqueCount => "unique_count",
            Self::Rate => "rate",
            Self::Latency => "latency",
            Self::Percentile => "percentile",
            Self::FailureRatio => "failure_ratio",
            Self::FreshnessAge => "freshness_age",
            Self::LatestValue => "latest_value",
            Self::Probability => "probability",
            Self::Quantile => "quantile",
            Self::CredibleInterval => "credible_interval",
            Self::ForecastDate => "forecast_date",
            Self::ValueOfInformation => "value_of_information",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ReportingPackMetricMeasurementKind {
    #[serde(rename = "gauge")]
    Gauge,
    #[serde(rename = "monotonicCounter")]
    MonotonicCounter,
    #[serde(rename = "intervalIncrement")]
    IntervalIncrement,
    #[serde(rename = "state")]
    State,
}

impl ReportingPackMetricMeasurementKind {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Gauge => "gauge",
            Self::MonotonicCounter => "monotonicCounter",
            Self::IntervalIncrement => "intervalIncrement",
            Self::State => "state",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ReportingPackMetricResetPolicy {
    #[serde(rename = "as_increment")]
    AsIncrement,
    #[serde(rename = "reject")]
    Reject,
    #[serde(rename = "rollover")]
    Rollover,
}

impl ReportingPackMetricResetPolicy {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::AsIncrement => "as_increment",
            Self::Reject => "reject",
            Self::Rollover => "rollover",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ReportingPackSourceReconciliationMode {
    #[serde(rename = "priority")]
    Priority,
    #[serde(rename = "freshness")]
    Freshness,
    #[serde(rename = "availability")]
    Availability,
    #[serde(rename = "agreement")]
    Agreement,
}

impl ReportingPackSourceReconciliationMode {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Priority => "priority",
            Self::Freshness => "freshness",
            Self::Availability => "availability",
            Self::Agreement => "agreement",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ReportingPackTemplateAggregation {
    #[serde(rename = "count")]
    Count,
    #[serde(rename = "flow")]
    Flow,
    #[serde(rename = "distinct_count")]
    DistinctCount,
    #[serde(rename = "sum")]
    Sum,
    #[serde(rename = "average")]
    Average,
    #[serde(rename = "percentile")]
    Percentile,
    #[serde(rename = "ratio")]
    Ratio,
}

impl ReportingPackTemplateAggregation {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Count => "count",
            Self::Flow => "flow",
            Self::DistinctCount => "distinct_count",
            Self::Sum => "sum",
            Self::Average => "average",
            Self::Percentile => "percentile",
            Self::Ratio => "ratio",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ReportingPackTemplateSourceModes {
    #[serde(rename = "auto")]
    Auto,
    #[serde(rename = "postgres")]
    Postgres,
    #[serde(rename = "duckdb")]
    Duckdb,
}

impl ReportingPackTemplateSourceModes {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Auto => "auto",
            Self::Postgres => "postgres",
            Self::Duckdb => "duckdb",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ReportingPackSteppedRateScheduleBillingBoundary {
    #[serde(rename = "calendar_month")]
    CalendarMonth,
    #[serde(rename = "calendar_day")]
    CalendarDay,
}

impl ReportingPackSteppedRateScheduleBillingBoundary {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::CalendarMonth => "calendar_month",
            Self::CalendarDay => "calendar_day",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ReportingPackAssetHierarchyEdgeMode {
    #[serde(rename = "inclusive")]
    Inclusive,
    #[serde(rename = "exclusive")]
    Exclusive,
    #[serde(rename = "informational")]
    Informational,
}

impl ReportingPackAssetHierarchyEdgeMode {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Inclusive => "inclusive",
            Self::Exclusive => "exclusive",
            Self::Informational => "informational",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ReportingPackSelectorDefinitionType {
    #[serde(rename = "string")]
    String,
    #[serde(rename = "integer")]
    Integer,
    #[serde(rename = "number")]
    Number,
}

impl ReportingPackSelectorDefinitionType {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::String => "string",
            Self::Integer => "integer",
            Self::Number => "number",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ReportingPackRoundingPolicyMode {
    #[serde(rename = "half_up")]
    HalfUp,
    #[serde(rename = "half_even")]
    HalfEven,
    #[serde(rename = "down")]
    Down,
    #[serde(rename = "up")]
    Up,
}

impl ReportingPackRoundingPolicyMode {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::HalfUp => "half_up",
            Self::HalfEven => "half_even",
            Self::Down => "down",
            Self::Up => "up",
        }
    }
}

impl CustdClient {
    /// List reporting pack drafts.
    pub fn list_reporting_pack_drafts(&self) -> Result<ReportingPackDraftListResponse> {
        let path = api_path("/api/v1/admin/reporting-packs/drafts".to_owned(), &[], None);
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Create reporting pack draft.
    pub fn create_reporting_pack_draft(
        &self,
        request: &ReportingPackDraftCreateRequest,
    ) -> Result<ReportingPackDraft> {
        let path = api_path("/api/v1/admin/reporting-packs/drafts".to_owned(), &[], None);
        self.call(Method::Post, &path, Some(request))
    }

    /// Get tenant-owned reporting pack draft.
    pub fn get_reporting_pack_draft(&self, draft_id: &str) -> Result<ReportingPackDraft> {
        let path = api_path(
            format!(
                "/api/v1/admin/reporting-packs/drafts/{}",
                percent_encode(draft_id)
            ),
            &[],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Update reporting pack draft.
    pub fn update_reporting_pack_draft(
        &self,
        draft_id: &str,
        request: &ReportingPackDraftUpdateRequest,
    ) -> Result<ReportingPackDraft> {
        let path = api_path(
            format!(
                "/api/v1/admin/reporting-packs/drafts/{}",
                percent_encode(draft_id)
            ),
            &[],
            None,
        );
        self.call(Method::Put, &path, Some(request))
    }

    /// Publish reporting pack candidate.
    pub fn publish_reporting_pack_draft(&self, draft_id: &str) -> Result<ReportingPackGeneration> {
        let path = api_path(
            format!(
                "/api/v1/admin/reporting-packs/drafts/{}/publish",
                percent_encode(draft_id)
            ),
            &[],
            None,
        );
        self.call(Method::Post, &path, NO_BODY)
    }

    /// Restart reporting pack draft into a fresh revision.
    pub fn restart_reporting_pack_draft(&self, draft_id: &str) -> Result<ReportingPackDraft> {
        let path = api_path(
            format!(
                "/api/v1/admin/reporting-packs/drafts/{}/restart",
                percent_encode(draft_id)
            ),
            &[],
            None,
        );
        self.call(Method::Post, &path, NO_BODY)
    }

    /// Validate reporting pack.
    pub fn validate_reporting_pack(
        &self,
        request: &ReportingPackValidateRequest,
    ) -> Result<ReportingPackValidationResponse> {
        let path = api_path(
            "/api/v1/admin/reporting-packs/validate".to_owned(),
            &[],
            None,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Preview reporting pack draft.
    pub fn preview_reporting_pack(
        &self,
        request: &ReportingPackPreviewRequest,
    ) -> Result<ReportingPackPreviewResponse> {
        let path = api_path(
            "/api/v1/admin/reporting-packs/preview".to_owned(),
            &[],
            None,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Get immutable reporting pack generation.
    pub fn get_reporting_pack_generation(
        &self,
        generation_id: &str,
    ) -> Result<ReportingPackGeneration> {
        let path = api_path(
            format!(
                "/api/v1/admin/reporting-packs/generations/{}",
                percent_encode(generation_id)
            ),
            &[],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Get reporting pack generation activation status.
    pub fn get_reporting_pack_generation_status(
        &self,
        generation_id: &str,
    ) -> Result<ReportingPackGenerationStatus> {
        let path = api_path(
            format!(
                "/api/v1/admin/reporting-packs/generations/{}/status",
                percent_encode(generation_id)
            ),
            &[],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Get tenant-scoped reporting pack rollup provenance.
    pub fn get_reporting_pack_rollup_provenance(
        &self,
        generation_id: &str,
    ) -> Result<ReportingPackRollupProvenance> {
        let path = api_path(
            format!(
                "/api/v1/admin/reporting-packs/generations/{}/rollup-provenance",
                percent_encode(generation_id)
            ),
            &[],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Request reporting pack rollback.
    pub fn rollback_reporting_pack_generation(
        &self,
        generation_id: &str,
    ) -> Result<ReportingPackGeneration> {
        let path = api_path(
            format!(
                "/api/v1/admin/reporting-packs/generations/{}/rollback",
                percent_encode(generation_id)
            ),
            &[],
            None,
        );
        self.call(Method::Post, &path, NO_BODY)
    }

    /// List serving reporting pack generation validity.
    pub fn list_reporting_pack_generation_validity(
        &self,
    ) -> Result<ReportingPackGenerationValidityListResponse> {
        let path = api_path(
            "/api/v1/admin/reporting-packs/generation-validity".to_owned(),
            &[],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// List reviewed reporting pack setup templates.
    pub fn list_reporting_pack_setup_templates(
        &self,
    ) -> Result<ReportingPackSetupTemplateListResponse> {
        let path = api_path(
            "/api/v1/admin/reporting-packs/setup-templates".to_owned(),
            &[],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Bind a reviewed setup template to client fields.
    pub fn bind_reporting_pack_setup_template(
        &self,
        kind: &str,
        request: &ReportingPackSetupTemplateBindRequest,
    ) -> Result<ReportingPackSetupTemplateBindResponse> {
        let path = api_path(
            format!(
                "/api/v1/admin/reporting-packs/setup-templates/{}/bind",
                percent_encode(kind)
            ),
            &[],
            None,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// List tenant-visible reporting pack audit events.
    pub fn list_reporting_pack_audit_events(
        &self,
        pack_key: &str,
    ) -> Result<ReportingPackAuditListResponse> {
        let path = api_path(
            "/api/v1/admin/reporting-packs/audit-events".to_owned(),
            &[("packKey", Some(pack_key.to_owned()))],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }
}
