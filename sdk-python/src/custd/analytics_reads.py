"""Tenant analytics reads beside the event query.

The reporting dashboard catalogue, dashboard data generations, draft pack previews and the
client bootstrap state (on ``client.reporting``), and the realtime active-visitor count, the
stored-event summary and the per-day event count (on ``client.analytics``). The credential names
the tenant.
"""

from __future__ import annotations

from typing import Literal, NotRequired, TypedDict

from .admin_reporting_packs import PackDefinition, ReportingDashboardInteraction, ReportingFilterOperator
from .client import ReportingQueryRequest
from .reporting_types import (
    PreparedDataNextAction,
    PreparedDataProvenance,
    PreparedDataWarning,
    ReportingComparison,
    ReportingExportFormat,
    ReportingRetryability,
)

PreparedDataBootstrapProofKind = Literal["dns_txt", "email_link"]
PreparedDataBootstrapState = Literal["ready", "attention_required", "suspended"]
ReportingDashboardGenerationState = Literal["building", "ready", "unavailable"]
ReportingSnapshotColumnType = Literal[
    "text",
    "integer",
    "number",
    "percentage",
    "currency",
    "date",
    "datetime",
    "duration",
    "boolean",
    "null",
]


class PreparedDataBootstrapStatus(TypedDict):
    nextAction: PreparedDataNextAction
    observedAt: str
    provenance: PreparedDataProvenance
    retryability: ReportingRetryability
    state: PreparedDataBootstrapState
    tenantSlug: str
    warnings: NotRequired[list[PreparedDataWarning]]


class PreparedDataBootstrapProof(TypedDict):
    kind: PreparedDataBootstrapProofKind
    observedAt: str
    value: str


class PreparedDataBootstrapSubmitRequest(TypedDict):
    contactEmail: NotRequired[str]
    note: NotRequired[str]
    proofs: NotRequired[list[PreparedDataBootstrapProof]]


class ReportingDashboardCatalogueTrust(TypedDict):
    serverOwned: bool
    tenantScoped: bool


class ReportingDashboardCatalogueEntry(TypedDict):
    defaultRange: str
    description: str
    exportFormats: list[ReportingExportFormat]
    group: str
    interactions: list[ReportingDashboardInteraction]
    key: str
    refreshSeconds: int
    title: str
    trust: ReportingDashboardCatalogueTrust


class ReportingDashboardCatalogueResponse(TypedDict):
    dashboards: list[ReportingDashboardCatalogueEntry]


class ReportingDashboardGenerationFilter(TypedDict):
    dimension: str
    operator: ReportingFilterOperator
    value: NotRequired[str]


ReportingExportQueryParameters = TypedDict(
    "ReportingExportQueryParameters",
    {
        "comparison": NotRequired[ReportingComparison],
        "filters": NotRequired[list[ReportingDashboardGenerationFilter]],
        "from": NotRequired[str],
        "maxRows": NotRequired[int],
        "rangeDays": NotRequired[int],
        "selections": NotRequired[list[str]],
        "to": NotRequired[str],
    },
)


class ReportingDashboardGenerationRequest(TypedDict):
    dashboardKey: str
    parameters: ReportingExportQueryParameters


class ReportingDatasetRowCount(TypedDict):
    count: int
    key: str


class ReportingSnapshotColumn(TypedDict):
    description: NotRequired[str]
    key: str
    label: str
    nullable: bool
    type: ReportingSnapshotColumnType
    unit: NotRequired[str]


class ReportingSnapshotDatasetSchema(TypedDict):
    columns: list[ReportingSnapshotColumn]
    key: str
    label: str


class ReportingDashboardGenerationResponse(TypedDict):
    byteLength: NotRequired[int]
    compression: NotRequired[str]
    contractVersion: NotRequired[int]
    datasetRowCounts: NotRequired[list[ReportingDatasetRowCount]]
    datasetSchemas: NotRequired[list[ReportingSnapshotDatasetSchema]]
    downloadUrl: NotRequired[str]
    generationId: str
    mediaType: NotRequired[str]
    pollAfterSeconds: NotRequired[int]
    snapshotSha256: NotRequired[str]
    state: ReportingDashboardGenerationState
    urlExpiresAt: NotRequired[str]
    validUntil: NotRequired[str]


class AnalyticsActiveNow(TypedDict):
    activeNow: int
    windowSeconds: int


class AnalyticsDashboardTenant(TypedDict):
    companySlug: str


class AnalyticsDashboardEvents(TypedDict):
    total: int
    oldestEventAt: str | None
    latestEventAt: str | None
    latestReceivedAt: str | None
    loadedDayCount: int


class AnalyticsDashboardCoverage(TypedDict):
    firstDay: str
    lastDay: str
    loadedDayCount: int


class AnalyticsDashboardLoadedDay(TypedDict):
    date: str
    eventCount: int
    archiveStatus: str
    archiveVerifiedAt: str | None
    queryHref: str


class AnalyticsDashboardDogfoodSource(TypedDict):
    sourceSystem: str
    sourceCompany: str
    environment: str
    eventCount: int
    latestEventAt: str | None
    latestEventType: str
    failureCount: int
    rejectionCount: int
    status: str


class AnalyticsDashboardDogfoodMetric(TypedDict):
    sourceSystem: str
    service: str
    metricName: str
    metricKind: str
    value: float
    unit: str
    windowStart: str | None
    windowEnd: str | None
    route: NotRequired[str]
    status: NotRequired[str]


class AnalyticsDashboardDogfood(TypedDict):
    sources: list[AnalyticsDashboardDogfoodSource]
    metrics: list[AnalyticsDashboardDogfoodMetric]


class AnalyticsDashboardSummary(TypedDict):
    tenant: AnalyticsDashboardTenant
    events: AnalyticsDashboardEvents
    coverage: AnalyticsDashboardCoverage
    loadedDays: list[AnalyticsDashboardLoadedDay]
    dogfood: AnalyticsDashboardDogfood
    generatedAt: str


class AnalyticsTelemetryEventCount(TypedDict):
    count: int


class ReportingDraftPreviewRequest(TypedDict):
    tenantSlug: str
    definition: PackDefinition
    query: ReportingQueryRequest
