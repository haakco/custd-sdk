"""Reporting response DTOs shared by the rendered widget, prepared-data and report-export reads.

They import nothing from the client so that ``client.py`` and the operation modules can both
build on them.
"""

from __future__ import annotations

from typing import NotRequired, TypedDict


class PreparedDataNextAction(TypedDict):
    action: str
    maxRetries: NotRequired[int]
    pollAfterSeconds: NotRequired[int]


class PreparedDataProvenance(TypedDict):
    owner: str
    generation: NotRequired[str]
    sourceUrn: NotRequired[str]
    watermark: NotRequired[str]


class PreparedDataWarning(TypedDict):
    code: str
    message: str


class ReportingSourceContribution(TypedDict):
    sourceKey: str
    sourceSeriesKey: str
    availability: str
    value: NotRequired[float]
    unit: NotRequired[str]
    observedAt: NotRequired[str]
    freshnessSeconds: NotRequired[int]
    stale: NotRequired[bool]
    selected: NotRequired[bool]


class ReportingSourceDivergence(TypedDict):
    detected: bool
    absoluteDifference: NotRequired[float]
    relativeDifference: NotRequired[float]


class ReportingReconciliation(TypedDict):
    """How a value was chosen when several sources report the same series."""

    tenantKey: str
    seriesKey: str
    status: str
    availability: str
    divergence: ReportingSourceDivergence
    value: NotRequired[float]
    unit: NotRequired[str]
    observedAt: NotRequired[str]
    selectedSourceKey: NotRequired[str]
    selectedSourceSeries: NotRequired[str]
    contributingSources: NotRequired[list[ReportingSourceContribution]]


class ReportingSourceRange(TypedDict):
    start: str
    end: str


class RenderedMetricTrust(TypedDict):
    """The time coverage and source reconciliation behind one rendered value."""

    calculationVersion: NotRequired[str]
    coverageStart: NotRequired[str]
    coverageEnd: NotRequired[str]
    freshnessMs: NotRequired[int]
    windowCoverage: NotRequired[float]
    sourceRange: NotRequired[ReportingSourceRange]
    reconciliation: NotRequired[ReportingReconciliation]
    warnings: NotRequired[list[str]]


class RenderedEmailDeliveryRecipient(TypedDict):
    recipientId: str
    outcome: str
    occurredAt: str


class RenderedEmailDelivery(TypedDict):
    complete: bool
    recipients: list[RenderedEmailDeliveryRecipient]


class RenderedLabelValue(TypedDict):
    uuid: str
    displayName: str


class RenderedLabelMetadata(TypedDict):
    definitionUuid: str
    key: str
    displayName: str
    sensitivity: str
    values: list[RenderedLabelValue]


class ReportExportArtifact(TypedDict):
    artifactKey: str
    fallbackForFormat: NotRequired[str]
    filename: str
    format: str
    id: str
    mediaType: str
    objectBytes: int
    objectSha256: str
    rendererVersion: NotRequired[str]
    warnings: NotRequired[list[str]]


class ReportExportProgressCounter(TypedDict):
    count: int
    key: str


class ReportExportJob(TypedDict):
    """One report export job, from a dashboard or a completed run, and its artifacts."""

    artifacts: NotRequired[list[ReportExportArtifact]]
    attemptCount: int
    cancellationReason: NotRequired[str]
    cleanupAttempts: int
    cleanupState: str
    dashboardKey: str
    expiresAt: NotRequired[str]
    failureCategory: NotRequired[str]
    failureMessage: NotRequired[str]
    finishedAt: NotRequired[str]
    formats: list[str]
    id: str
    nextAttemptAt: NotRequired[str]
    nextCleanupAt: NotRequired[str]
    packGeneration: int
    packKey: str
    parametersDigest: str
    progressCounters: NotRequired[list[ReportExportProgressCounter]]
    progressStage: str
    queuedAt: str
    snapshotSha256: NotRequired[str]
    startedAt: NotRequired[str]
    state: str
