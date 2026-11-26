"""Admin-owned reporting-pack lifecycle and reviewed setup templates.

The definition carried here is the canonical ``libs/go/reporting.Pack`` shape:
every contracted field is typed so a definition round-trips losslessly through
create/validate/preview/publish. Unknown extension fields are the only thing a
decode may drop. Bindings are typed, never a dictionary.
"""

from __future__ import annotations

from typing import Literal, NotRequired, TypedDict, cast

from ._wire import decode, request
from .client import AdminClient, RenderedMetricValue, RenderedWidgetData, ReportingTrustStatus, quote_path
from .reporting_types import CanonicalUnit, RenderedUnit, ReportingComparison, ReportingExportFormat

AssetHierarchyMode = Literal["inclusive", "exclusive", "informational"]
BillingBoundary = Literal["calendar_month", "calendar_day"]
DashboardRelativeRange = Literal["1d", "7d", "14d", "30d", "90d"]
DashboardResetBehavior = Literal["interaction", "dashboard"]
ExecutiveComparisonBasis = Literal["none", "previous-period", "target"]
ExecutiveReportRecipe = Literal["blank", "weekly-performance", "operations-health", "forecast-decision"]
NarrativeValueKind = Literal["primary", "delta"]
PackMeasurementKind = Literal["gauge", "monotonicCounter", "intervalIncrement", "state"]
PackMetricCalculation = Literal[
    "usage_charge",
    "marginal_rate",
    "projection",
    "purchased_vs_used",
    "observed_balance",
    "projected_balance",
    "allocated_recovery",
    "correction_count",
    "count",
    "failure_count",
    "flow",
    "distinct_count",
    "sum",
    "average",
    "percentile",
    "ratio",
    "latest",
    "minimum",
    "maximum",
    "firstLastDelta",
    "timeWeightedAverage",
    "rate",
    "integral",
]
PackMetricFlowResult = Literal["steps", "starts", "completions", "drop_offs", "completion_rate", "uncorrelated"]
PackMetricKind = Literal[
    "count",
    "unique_count",
    "rate",
    "latency",
    "percentile",
    "failure_ratio",
    "freshness_age",
    "latest_value",
    "probability",
    "quantile",
    "credible_interval",
    "forecast_date",
    "value_of_information",
]
PackMetricResetPolicy = Literal["as_increment", "reject", "rollover"]
PackRuleIdentity = Literal["subject", "session", "correlation"]
PackSelectorType = Literal["", "string", "integer", "number"]
PackTemplateAggregation = Literal["count", "flow", "distinct_count", "sum", "average", "percentile", "ratio"]
PackTemplateSourceMode = Literal["auto", "postgres", "duckdb"]
PresentationNonColorEncoding = Literal["line_symbol_label", "signed_bar_label", "band_boundary_label"]
PresentationPresetId = Literal[
    "forecast_convergence_v1",
    "anomaly_reference_v1",
    "descriptive_driver_v1",
    "uncertainty_reference_v1",
]
PresentationSummaryTemplate = Literal[
    "forecast_window_evidence",
    "anomaly_reference_evidence",
    "descriptive_driver_evidence",
    "uncertainty_reference_evidence",
]
ReportSectionLayout = Literal["lead", "grid", "detail"]
ReportingDashboardInteraction = Literal["filter", "drill_down"]
ReportingFilterOperator = Literal["eq", "neq", "in", "contains"]
SourceReconciliationMode = Literal["priority", "freshness", "availability", "agreement"]
WidgetKind = Literal[
    "stat_tile",
    "time_series",
    "breakdown_table",
    "top_list",
    "health_list",
    "freshness_panel",
    "export_table",
    "lifecycle_funnel",
    "cohort_retention",
    "forecast_fan",
    "uncertainty_band",
    "probability_tile",
    "distribution_histogram",
    "voi_ranked_list",
    "calibration_panel",
    "runway_tile",
    "anomaly_timeline",
    "driver_breakdown",
]


class MetricDefinition(TypedDict):
    key: str
    label: str
    kind: str
    unit: NotRequired[str]
    description: NotRequired[str]


class SelectorDefinition(TypedDict):
    selector: str
    type: PackSelectorType


class NumericSelector(SelectorDefinition, total=False):
    unit: RenderedUnit


class MatchPredicate(TypedDict, total=False):
    selector: str
    exact: str
    anyOf: list[str]
    nonEmpty: bool
    pattern: str


class MetricCounter(TypedDict, total=False):
    maximumGapSeconds: int
    resetPolicy: str
    rolloverAt: float
    canonicalUnit: str


class MetricRatio(TypedDict, total=False):
    percentile: int
    numeratorMetric: str
    denominatorMetric: str


class MetricHierarchy(TypedDict, total=False):
    seriesKey: str
    hierarchyRootKey: str


class PackMetric(TypedDict, total=False):
    key: str
    label: str
    kind: PackMetricKind
    unit: str
    description: str
    calculation: PackMetricCalculation
    match: list[MatchPredicate]
    flowResult: PackMetricFlowResult
    numeric: NumericSelector
    distinct: SelectorDefinition
    measurementKind: PackMeasurementKind
    maximumGapSeconds: int
    resetPolicy: PackMetricResetPolicy
    rolloverAt: float
    canonicalUnit: CanonicalUnit
    percentile: int
    numeratorMetric: str
    denominatorMetric: str
    seriesKey: str
    hierarchyRootKey: str


class DimensionDefinition(TypedDict, total=False):
    key: str
    label: str
    description: str
    labelDefinitionUuid: str
    labelDefinitionKey: str
    labelValueUuids: list[str]


class PackDimension(DimensionDefinition, total=False):
    selector: str
    allowedValuePattern: str
    fallback: str
    maxCardinality: int


class FilterDefinition(TypedDict):
    dimension: str
    operators: list[ReportingFilterOperator]


class SubjectScopeRule(TypedDict):
    required: bool
    dimension: str


class QueryTemplate(TypedDict, total=False):
    name: str
    allowedMetrics: list[str]
    allowedDimensions: list[str]
    allowedFilters: list[FilterDefinition]
    sourceModes: list[PackTemplateSourceMode]
    maxRows: int
    defaultRange: str
    subjectScope: SubjectScopeRule
    compositionRules: list[str]


class PackTemplate(QueryTemplate, total=False):
    eventTypes: list[str]
    aggregation: PackTemplateAggregation
    flowRule: str


class FlowRule(TypedDict, total=False):
    key: str
    correlationSelector: str
    familySelector: str
    familyValue: str
    stepSelector: str
    startMarkers: list[str]
    completionMarkers: list[str]
    includeUncorrelated: bool


class RollupDimension(TypedDict, total=False):
    slot: int
    dimension: str
    selector: str
    allowedValuePattern: str


class RollupRule(TypedDict, total=False):
    family: str
    templates: list[str]
    metric: str
    sourceEventType: str
    match: list[MatchPredicate]
    dimensions: list[RollupDimension]
    completenessRequired: bool


class PresentationPresetSelection(TypedDict):
    presetId: PresentationPresetId
    version: int
    nonColorEncoding: PresentationNonColorEncoding
    summaryTemplateId: PresentationSummaryTemplate


class PackWidgetDefinition(TypedDict, total=False):
    key: str
    title: str
    kind: WidgetKind
    template: str
    metrics: list[str]
    dimensions: list[str]
    presentation: PresentationPresetSelection


class DashboardSharePolicy(TypedDict, total=False):
    relativeRanges: list[DashboardRelativeRange]
    comparisonPresets: list[ReportingComparison]


class DashboardInteractionRule(TypedDict, total=False):
    key: str
    sourceWidget: str
    targetWidget: str
    dimension: str
    action: ReportingDashboardInteraction
    linkedFilterGroup: str
    comparisonPreset: ReportingComparison
    resetBehavior: DashboardResetBehavior


class NarrativeValueReference(TypedDict):
    widgetKey: str
    value: NarrativeValueKind


class NarrativeBlock(TypedDict, total=False):
    text: str
    references: list[NarrativeValueReference]


class ReportSectionDefinition(TypedDict, total=False):
    key: str
    title: str
    layout: ReportSectionLayout
    columnSpan: int
    widgetKeys: list[str]
    narrative: list[NarrativeBlock]


class ExecutiveRecipeSelection(TypedDict):
    recipe: ExecutiveReportRecipe
    primaryWidgetKey: str
    primaryMetricKey: str
    primaryLabel: str
    primaryUnit: str
    scopeLabel: str


class ExecutiveReportDefinition(ExecutiveRecipeSelection):
    comparisonBasis: ExecutiveComparisonBasis
    comparisonLabel: NotRequired[str]
    targetValue: NotRequired[float]
    targetUnit: NotRequired[str]
    findings: NotRequired[list[str]]
    actions: NotRequired[list[str]]
    supportingWidgetKeys: NotRequired[list[str]]


class PackDashboardDefinition(TypedDict, total=False):
    key: str
    packKey: str
    exportFormats: list[ReportingExportFormat]
    title: str
    description: str
    group: str
    defaultRange: str
    refreshSeconds: int
    requiredScopes: list[str]
    widgets: list[PackWidgetDefinition]
    interactions: list[DashboardInteractionRule]
    sharePolicy: DashboardSharePolicy
    sections: list[ReportSectionDefinition]
    executive: ExecutiveReportDefinition


class TrustDiagnostics(TypedDict):
    safeFields: list[str]
    redactionGuard: list[str]


class RedactionRule(TypedDict):
    sourceSystem: str
    sourceEventType: str
    selectorFields: list[str]
    allowedFields: list[str]
    reasonClasses: list[str]
    resultShape: str


class ProofProfile(TypedDict):
    key: str
    templates: list[str]
    safeMetadataFields: list[str]
    forbiddenFields: list[str]
    outputLayout: str


class IdentitySelectors(TypedDict, total=False):
    subject: SelectorDefinition
    session: SelectorDefinition
    entity: SelectorDefinition
    cohort: SelectorDefinition
    correlation: SelectorDefinition


class TransitionRule(TypedDict, total=False):
    key: str
    identity: PackRuleIdentity
    stepSelector: str
    steps: list[str]
    maxDurationMs: int
    maxEvents: int


class ActivationRule(TypedDict, total=False):
    key: str
    identity: PackRuleIdentity
    predicate: MatchPredicate
    cohortWindowDays: int


class RetentionRule(TypedDict, total=False):
    key: str
    activationRule: str
    returnWindowDays: list[int]
    returnPredicate: MatchPredicate


class ActivityRule(TypedDict, total=False):
    key: str
    identity: PackRuleIdentity
    bucketDays: int


class ObservationSource(TypedDict):
    key: str
    label: str


class ObservationAsset(TypedDict):
    key: str
    label: str


class SourceSeries(TypedDict):
    sourceKey: str
    sourceSeriesKey: str
    priority: int


class SemanticSeries(TypedDict, total=False):
    key: str
    assetKey: str
    assetKeys: list[str]
    measurementKind: PackMeasurementKind
    canonicalUnit: CanonicalUnit
    allowedSourceUnits: list[CanonicalUnit]
    expectedCadenceSeconds: int
    maximumGapSeconds: int
    sources: list[SourceSeries]


class ObservationContract(TypedDict, total=False):
    version: int
    sources: list[ObservationSource]
    assets: list[ObservationAsset]
    series: list[SemanticSeries]


class SourceReconciliation(TypedDict, total=False):
    version: int
    tenantKey: str
    seriesKey: str
    canonicalUnit: CanonicalUnit
    mode: SourceReconciliationMode
    maxAgeSeconds: int
    absoluteTolerance: float
    relativeTolerance: float
    sources: list[SourceSeries]


class AssetNode(TypedDict):
    tenantKey: str
    key: str
    label: str


class AssetHierarchyEdge(TypedDict):
    tenantKey: str
    parentKey: str
    childKey: str
    mode: AssetHierarchyMode


class AssetHierarchy(TypedDict, total=False):
    version: int
    tenantKey: str
    maxDepth: int
    nodes: list[AssetNode]
    edges: list[AssetHierarchyEdge]


class RateTier(TypedDict, total=False):
    lowerBound: float
    upperBound: float
    pricePerUnit: float


class AllocationTarget(TypedDict):
    seriesKey: str
    weight: float


RoundingMode = Literal["half_up", "half_even", "down", "up"]


class RoundingPolicy(TypedDict):
    mode: RoundingMode
    decimalPlaces: int


class SteppedRateSchedule(TypedDict):
    key: str
    usageMetric: str
    usageUnit: CanonicalUnit
    timezone: str
    billingBoundary: BillingBoundary
    effectiveFrom: str
    effectiveTo: NotRequired[str]
    currency: str
    tiers: list[RateTier]
    rounding: RoundingPolicy


class AllocationRule(TypedDict, total=False):
    key: str
    sourceSeriesKey: str
    targets: list[AllocationTarget]
    rounding: RoundingPolicy


class AccountingContract(TypedDict, total=False):
    version: int
    usageMetric: str
    schedules: list[SteppedRateSchedule]
    allocations: list[AllocationRule]


class PackDefinition(TypedDict, total=False):
    """The canonical reporting-pack definition (mirrors libs/go/reporting.Pack)."""

    key: str
    displayName: str
    owner: str
    version: int
    enabled: bool
    eventTypes: list[str]
    metrics: list[PackMetric]
    dimensions: list[PackDimension]
    templates: list[PackTemplate]
    flowRules: list[FlowRule]
    rollupRules: list[RollupRule]
    dashboards: list[PackDashboardDefinition]
    exportFormats: list[ReportingExportFormat]
    trust: TrustDiagnostics
    redactionRules: list[RedactionRule]
    proof: ProofProfile
    identity: IdentitySelectors
    transitionRules: list[TransitionRule]
    activationRules: list[ActivationRule]
    retentionRules: list[RetentionRule]
    activityRules: list[ActivityRule]
    observation: ObservationContract
    reconciliations: list[SourceReconciliation]
    assetHierarchy: AssetHierarchy
    accounting: AccountingContract


class ReportingPackDraft(TypedDict, total=False):
    id: int
    revision: int
    definition: PackDefinition
    createdAt: str
    updatedAt: str
    # Why the last validation of this draft failed, when it did.
    validationError: str


class ReportingPackDraftCreateRequest(TypedDict):
    definition: PackDefinition


class ReportingPackDraftUpdateRequest(TypedDict):
    definition: PackDefinition
    expectedRevision: int


class ReportingPackDraftListResponse(TypedDict):
    drafts: list[ReportingPackDraft]


class ReportingPackValidateResponse(TypedDict):
    valid: bool


class QueryHint(TypedDict, total=False):
    template: str
    metrics: list[str]
    dimensions: list[str]
    rangeDays: int


class ReportingPackPreviewRequest(TypedDict):
    definition: PackDefinition
    tenantSlug: str
    query: QueryHint


class ExecutiveComparisonResult(TypedDict):
    available: bool
    basis: ExecutiveComparisonBasis
    label: str
    percentChange: NotRequired[float]
    targetValue: NotRequired[float]
    value: NotRequired[RenderedMetricValue]


class ExecutiveConfidence(TypedDict):
    status: ReportingTrustStatus
    completeness: str
    coverage: str
    freshness: str
    warnings: NotRequired[list[str]]


ExecutivePeriod = TypedDict("ExecutivePeriod", {"label": str, "from": NotRequired[str], "to": NotRequired[str]})


class ExecutivePrimaryResult(TypedDict):
    label: str
    scope: str
    unit: str
    value: RenderedMetricValue
    periodTotal: RenderedMetricValue


class ExecutiveReport(TypedDict):
    """The executive summary a dashboard with an executive recipe renders."""

    title: str
    recipe: ExecutiveReportRecipe
    tenantDisplayName: str
    asOf: str
    generatedAt: str
    period: ExecutivePeriod
    primary: ExecutivePrimaryResult
    comparison: ExecutiveComparisonResult
    confidence: ExecutiveConfidence
    findings: NotRequired[list[str]]
    actions: NotRequired[list[str]]
    supportingWidgets: NotRequired[list[str]]


class ReportingPackPreviewResponse(TypedDict):
    """The preview envelope: the rendered widget under ``data``, aggregate-only with no raw rows."""

    data: RenderedWidgetData
    executive: NotRequired[ExecutiveReport]
    presentation: NotRequired[PresentationPresetSelection]


class ReportingPackGeneration(TypedDict, total=False):
    id: int
    generationNumber: int
    sourceDraftId: int
    definition: PackDefinition
    state: str
    createdAt: str


class ReportingPackSetupBindingField(TypedDict):
    """One client-selectable binding descriptor a setup template renders."""

    key: str
    label: str
    required: bool


class LogObservabilityBindings(TypedDict):
    """The typed log-observability bindings a client selects. Never a dictionary."""

    eventType: str
    severityField: str
    resourceField: str


class ReportingPackSetupTemplate(TypedDict):
    """One reviewed setup template: its canonical definition plus selectable bindings."""

    kind: str
    displayName: str
    definition: PackDefinition
    bindings: list[ReportingPackSetupBindingField]


class ReportingPackSetupTemplateListResponse(TypedDict):
    templates: list[ReportingPackSetupTemplate]


class ReportingPackSetupTemplateBindRequest(TypedDict):
    bindings: LogObservabilityBindings


class ReportingPackSetupTemplateBindResponse(TypedDict):
    kind: str
    definition: PackDefinition


class ReportingPackGenerationValidity(TypedDict):
    generationNumber: int
    id: int
    packKey: str
    state: str
    validationError: NotRequired[str]


class ReportingPackGenerationValidityListResponse(TypedDict):
    generations: list[ReportingPackGenerationValidity]


class ReportingPackMaterializationProvenance(TypedDict):
    definitionFingerprint: str
    sourceCoverageCount: int
    status: str


class ReportingPackRollupProvenance(TypedDict):
    definitionFingerprint: str
    generationId: int
    materializations: list[ReportingPackMaterializationProvenance]
    tenantSlug: str


class ReportingPackGenerationAcknowledgement(TypedDict):
    accepted: bool
    consumer: str
    errorDetail: NotRequired[str]
    observedAt: str
    observedGenerationId: int


class ReportingPackGenerationStatusDetail(TypedDict):
    generationNumber: int
    id: int
    packKey: str
    state: str


class ReportingPackGenerationStatusResponse(TypedDict):
    acknowledgements: list[ReportingPackGenerationAcknowledgement]
    generation: ReportingPackGenerationStatusDetail


class ReportingPacksAdminClient:
    """The admin-owned reporting-pack lifecycle and reviewed setup templates.

    The authority model is company_id; the SDK sends no tenant slug on these
    surfaces. The setup-template bind is a pure build: it creates no data,
    grants no scope, and writes no generation, so its result must be posted
    through :meth:`create_draft`/:meth:`preview` only when the caller intends to.
    """

    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin

    def list_drafts(self) -> ReportingPackDraftListResponse:
        return cast(ReportingPackDraftListResponse, self._admin.request("GET", "/reporting-packs/drafts"))

    def get_draft(self, draft_id: str) -> ReportingPackDraft:
        return cast(ReportingPackDraft, self._admin.request("GET", f"/reporting-packs/drafts/{quote_path(draft_id)}"))

    def create_draft(self, request: ReportingPackDraftCreateRequest) -> ReportingPackDraft:
        return cast(
            ReportingPackDraft, self._admin.request("POST", "/reporting-packs/drafts", dict(request))
        )

    def update_draft(
        self, draft_id: str, request: ReportingPackDraftUpdateRequest
    ) -> ReportingPackDraft:
        return cast(
            ReportingPackDraft,
            self._admin.request("PUT", f"/reporting-packs/drafts/{quote_path(draft_id)}", dict(request)),
        )

    def validate(self, request: ReportingPackDraftCreateRequest) -> ReportingPackValidateResponse:
        return cast(
            ReportingPackValidateResponse, self._admin.request("POST", "/reporting-packs/validate", dict(request))
        )

    def preview(self, request: ReportingPackPreviewRequest) -> ReportingPackPreviewResponse:
        return cast(
            ReportingPackPreviewResponse, self._admin.request("POST", "/reporting-packs/preview", dict(request))
        )

    def publish(self, draft_id: str) -> ReportingPackGeneration:
        return cast(
            ReportingPackGeneration,
            self._admin.request("POST", f"/reporting-packs/drafts/{quote_path(draft_id)}/publish"),
        )

    def list_setup_templates(self) -> ReportingPackSetupTemplateListResponse:
        """List the reviewed setup templates, each with its canonical definition."""
        return cast(
            ReportingPackSetupTemplateListResponse,
            self._admin.request("GET", "/reporting-packs/setup-templates"),
        )

    def bind_setup_template(
        self, kind: str, request: ReportingPackSetupTemplateBindRequest
    ) -> ReportingPackSetupTemplateBindResponse:
        """Apply typed bindings to one setup template; returns the server-built definition.

        It is a pure build. Unknown kinds and invalid bindings surface the backend's
        typed problem error faithfully.
        """
        return cast(
            ReportingPackSetupTemplateBindResponse,
            self._admin.request(
                "POST",
                f"/reporting-packs/setup-templates/{quote_path(kind)}/bind",
                dict(request),
            ),
        )

    def list_generation_validity(self) -> ReportingPackGenerationValidityListResponse:
        """List serving reporting pack generation validity."""
        return decode(
            ReportingPackGenerationValidityListResponse,
            request(self._admin, "GET", "/api/v1/admin/reporting-packs/generation-validity"),
        )

    def get_generation(self, generation_id: str) -> ReportingPackGeneration:
        """Get immutable reporting pack generation."""
        return decode(
            ReportingPackGeneration,
            request(self._admin, "GET", f"/api/v1/admin/reporting-packs/generations/{quote_path(generation_id)}"),
        )

    def get_rollup_provenance(self, generation_id: str) -> ReportingPackRollupProvenance:
        """Get tenant-scoped reporting pack rollup provenance."""
        return decode(
            ReportingPackRollupProvenance,
            request(
                self._admin,
                "GET",
                f"/api/v1/admin/reporting-packs/generations/{quote_path(generation_id)}/rollup-provenance",
            ),
        )

    def get_generation_status(self, generation_id: str) -> ReportingPackGenerationStatusResponse:
        """Get reporting pack generation activation status."""
        return decode(
            ReportingPackGenerationStatusResponse,
            request(
                self._admin, "GET", f"/api/v1/admin/reporting-packs/generations/{quote_path(generation_id)}/status"
            ),
        )

    def restart_draft(self, draft_id: str) -> ReportingPackDraft:
        """Restart reporting pack draft into a fresh revision."""
        return decode(
            ReportingPackDraft,
            request(self._admin, "POST", f"/api/v1/admin/reporting-packs/drafts/{quote_path(draft_id)}/restart"),
        )

    def rollback_generation(self, generation_id: str) -> ReportingPackGeneration:
        """Request reporting pack rollback."""
        return decode(
            ReportingPackGeneration,
            request(
                self._admin, "POST", f"/api/v1/admin/reporting-packs/generations/{quote_path(generation_id)}/rollback"
            ),
        )
