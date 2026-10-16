"""Admin-owned reporting-pack lifecycle and reviewed setup templates.

The definition carried here is the canonical ``libs/go/reporting.Pack`` shape:
every contracted field is typed so a definition round-trips losslessly through
create/validate/preview/publish. Unknown extension fields are the only thing a
decode may drop. Bindings are typed, never a dictionary.
"""

from __future__ import annotations

from typing import NotRequired, TypedDict, cast

from .client import AdminClient, RenderedMetricValue, RenderedWidgetBucket, quote_path


class MetricDefinition(TypedDict):
    key: str
    label: str
    kind: str
    unit: NotRequired[str]
    description: NotRequired[str]


class SelectorDefinition(TypedDict):
    selector: str
    type: str


class NumericSelector(SelectorDefinition, total=False):
    unit: str


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
    kind: str
    unit: str
    description: str
    calculation: str
    match: list[MatchPredicate]
    flowResult: str
    numeric: NumericSelector
    distinct: SelectorDefinition
    measurementKind: str
    maximumGapSeconds: int
    resetPolicy: str
    rolloverAt: float
    canonicalUnit: str
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
    operators: list[str]


class SubjectScopeRule(TypedDict):
    required: bool
    dimension: str


class QueryTemplate(TypedDict, total=False):
    name: str
    allowedMetrics: list[str]
    allowedDimensions: list[str]
    allowedFilters: list[FilterDefinition]
    sourceModes: list[str]
    maxRows: int
    defaultRange: str
    subjectScope: SubjectScopeRule
    compositionRules: list[str]


class PackTemplate(QueryTemplate, total=False):
    eventTypes: list[str]
    aggregation: str
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
    presetId: str
    version: int
    nonColorEncoding: str
    summaryTemplateId: str


class PackWidgetDefinition(TypedDict, total=False):
    key: str
    title: str
    kind: str
    template: str
    metrics: list[str]
    dimensions: list[str]
    presentation: PresentationPresetSelection


class DashboardSharePolicy(TypedDict, total=False):
    relativeRanges: list[str]
    comparisonPresets: list[str]


class DashboardInteractionRule(TypedDict, total=False):
    key: str
    sourceWidget: str
    targetWidget: str
    dimension: str
    action: str
    linkedFilterGroup: str
    comparisonPreset: str
    resetBehavior: str


class NarrativeValueReference(TypedDict):
    widgetKey: str
    value: str


class NarrativeBlock(TypedDict, total=False):
    text: str
    references: list[NarrativeValueReference]


class ReportSectionDefinition(TypedDict, total=False):
    key: str
    title: str
    layout: str
    columnSpan: int
    widgetKeys: list[str]
    narrative: list[NarrativeBlock]


class ExecutiveReportDefinition(TypedDict, total=False):
    comparisonBasis: str
    comparisonLabel: str
    targetValue: float
    targetUnit: str
    findings: list[str]
    actions: list[str]
    supportingWidgetKeys: list[str]


class PackDashboardDefinition(TypedDict, total=False):
    key: str
    packKey: str
    exportFormats: list[str]
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
    identity: str
    stepSelector: str
    steps: list[str]
    maxDurationMs: int
    maxEvents: int


class ActivationRule(TypedDict, total=False):
    key: str
    identity: str
    predicate: MatchPredicate
    cohortWindowDays: int


class RetentionRule(TypedDict, total=False):
    key: str
    activationRule: str
    returnWindowDays: list[int]
    returnPredicate: MatchPredicate


class ActivityRule(TypedDict, total=False):
    key: str
    identity: str
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
    measurementKind: str
    canonicalUnit: str
    allowedSourceUnits: list[str]
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
    canonicalUnit: str
    mode: str
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
    mode: str


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


class SteppedRateSchedule(TypedDict, total=False):
    key: str
    usageMetric: str
    usageUnit: str
    timezone: str
    billingBoundary: str
    effectiveFrom: str
    effectiveTo: str
    currency: str
    tiers: list[RateTier]
    rounding: str


class AllocationRule(TypedDict, total=False):
    key: str
    sourceSeriesKey: str
    targets: list[AllocationTarget]
    rounding: str


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
    exportFormats: list[str]
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


class ReportingPackPreviewResponse(TypedDict, total=False):
    buckets: list[RenderedWidgetBucket]
    value: RenderedMetricValue


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
