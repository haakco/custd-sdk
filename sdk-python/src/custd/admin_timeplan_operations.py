"""Time-plan operations, published versions, prediction snapshots and completed-run reports.

These are the response and request DTOs of the ``client.admin.time_plans`` operator and
reporting calls; the calls themselves live on ``TimePlanAdminClient``.
"""

from __future__ import annotations

from typing import NotRequired, TypedDict


class TimePlanDefinitionMathAdjustment(TypedDict):
    actualMs: int
    allocations: list[TimePlanDefinitionMathAllocationValue]
    elapsedMs: int
    exactConservation: bool
    horizonMs: int
    index: int
    markFutureNotRun: bool
    negativeAllocations: int
    overrunMs: int
    passed: bool
    reason: str
    remainingMs: int
    unusedMs: int
    vectorId: str


class TimePlanDefinitionMathAllocationValue(TypedDict):
    blockId: str
    durationMs: int
    sequence: int


class TimePlanDefinitionMathAllocation(TypedDict):
    allocations: list[TimePlanDefinitionMathAllocationValue]
    deterministicTieBreak: bool
    exactConservation: bool
    horizonMs: int
    index: int
    negativeAllocations: int
    passed: bool
    vectorId: str


class TimePlanDefinitionMathDefinition(TypedDict):
    allocatedMs: int
    blockCount: int
    exactConservation: bool
    horizonMs: int
    index: int
    passed: bool
    runtimeVocabularyClean: bool
    vectorId: str


class TimePlanDefinitionMathProofSummary(TypedDict):
    adjustmentVectorCount: int
    deterministicTieBreak: bool
    exactConservation: bool
    initialVectorCount: int
    negativeAllocations: int
    passed: bool
    vectorCount: int


class TimePlanDefinitionMathProofResponse(TypedDict):
    adjustments: list[TimePlanDefinitionMathAdjustment]
    allocations: list[TimePlanDefinitionMathAllocation]
    allocatorVersion: str
    companySlug: str
    conformanceSchemaVersion: str
    definitions: list[TimePlanDefinitionMathDefinition]
    observedAt: str
    schemaVersion: str
    source: str
    summary: TimePlanDefinitionMathProofSummary


class TimePlanOperationalStatus(TypedDict):
    activeRuns: int
    checkedAt: str
    failedOutbox: int
    oldestFailureAt: NotRequired[str]
    pendingOutbox: int
    publishedOutbox: int
    staleRuns: int


class TimePlanPublishedVersionDetails(TypedDict):
    allocations: list[TimePlanDefinitionMathAllocationValue]
    allocatorVersion: str
    blockCount: int
    definitionHash: str
    horizonMs: int
    planUuid: str
    publishedAt: str
    schemaVersion: str
    uuid: str
    versionNumber: int


class TimePlanDurationObservationIdentity(TypedDict):
    blockUuid: str
    idempotencyKey: str
    observationUuid: str
    planUuid: str
    runUuid: str
    semanticKey: str


class TimePlanDurationObservationReadResponse(TypedDict):
    nonDeletedCount: int
    observations: list[TimePlanDurationObservationIdentity]
    runUuid: str


class TimePlanPredictionSnapshot(TypedDict):
    blockId: int
    blockUuid: str
    inputHash: str
    method: str
    methodVersion: str
    p10Ms: NotRequired[int]
    p90Ms: NotRequired[int]
    pointMs: int
    predictedAt: str
    predictionVersionUuid: NotRequired[str]
    runUuid: str
    sampleCount: int
    snapshotUuid: str
    warnings: list[str]


class TimePlanPredictionSnapshotList(TypedDict):
    snapshots: list[TimePlanPredictionSnapshot]


class CompletedDurationReportAllocationChange(TypedDict):
    block_uuid: str
    from_ms: int
    to_ms: int


class CompletedDurationReportAllocation(TypedDict):
    block_uuid: str
    duration_ms: int
    sequence: int


class CompletedDurationReportCalculationReceipt(TypedDict):
    allocator_version: NotRequired[str]
    changes: NotRequired[list[CompletedDurationReportAllocationChange]]
    reason: NotRequired[str]
    result: NotRequired[list[CompletedDurationReportAllocation]]
    source: NotRequired[list[CompletedDurationReportAllocation]]
    summary: NotRequired[str]


class CompletedDurationReportAdjustment(TypedDict):
    actor_kind: NotRequired[str]
    actor_ref: NotRequired[str]
    allocator_version: NotRequired[str]
    client_occurred_at: NotRequired[str]
    command_id: str
    current_status: NotRequired[str]
    occurred_at: str
    previous_status: NotRequired[str]
    reason: NotRequired[str]
    receipt: CompletedDurationReportCalculationReceipt
    schema_version: NotRequired[str]
    stream_version: int
    supersedes_transition_id: NotRequired[str]
    transition_uuid: str
    type: str


class CompletedDurationReportAnnotation(TypedDict):
    action_status: NotRequired[str]
    actor_kind: str
    actor_ref: NotRequired[str]
    assignee_ref: NotRequired[str]
    block_uuid: NotRequired[str]
    decision_status: NotRequired[str]
    due_date: NotRequired[str]
    marker_label: NotRequired[str]
    recorded_at: str
    redacted_at: NotRequired[str]
    supersedes_uuid: NotRequired[str]
    text: NotRequired[str]
    type: str
    uuid: str


class CompletedDurationReportBlock(TypedDict):
    actual_ms: NotRequired[int]
    allocated_at_start_ms: NotRequired[int]
    block_uuid: str
    category: NotRequired[str]
    current_ms: int
    outcome: str
    planned_ms: int
    semantic_key: str
    sequence: int
    status: str
    tags: NotRequired[list[str]]
    wall_ended_at: NotRequired[str]
    wall_started_at: NotRequired[str]


class CompletedDurationReportPredictionComparison(TypedDict):
    absolute_error_ms: NotRequired[int]
    actual_ms: NotRequired[int]
    block_uuid: str
    input_hash: str
    interval_covered: NotRequired[bool]
    method: str
    method_version: str
    p10_ms: NotRequired[int]
    p90_ms: NotRequired[int]
    point_ms: int
    predicted_at: str
    sample_count: int
    warnings: NotRequired[list[str]]


class CompletedDurationReportProvenance(TypedDict):
    adjustment_count: int
    annotation_count: int
    corrected: bool
    forecast_evaluation_hash: NotRequired[str]
    generated_at: str
    input_hash: str
    measurement_input_hash: NotRequired[str]
    measurement_projection_version: NotRequired[str]
    prediction_count: int
    report_version: str


class CompletedDurationReportSummary(TypedDict):
    actual_block_count: int
    actual_complete: bool
    actual_total_ms: int
    baseline_horizon_ms: int
    block_count: int
    cancelled_block_count: int
    censored_block_count: int
    completed_at: str
    completed_block_count: int
    current_total_ms: int
    effective_ends_at: NotRequired[str]
    effective_starts_at: NotRequired[str]
    executable_horizon_ms: NotRequired[int]
    final_variance_ms: int
    lost_ms: int
    not_run_block_count: int
    overrun_ms: int
    plan_id: str
    planned_total_ms: int
    run_id: str
    run_status: str
    scheduled_ends_at: NotRequired[str]
    scheduled_starts_at: NotRequired[str]
    skipped_block_count: int
    stream_version: int
    unused_ms: int
    version_id: str


class CompletedDurationReport(TypedDict):
    adjustments: list[CompletedDurationReportAdjustment]
    annotations: list[CompletedDurationReportAnnotation]
    blocks: list[CompletedDurationReportBlock]
    prediction_comparisons: list[CompletedDurationReportPredictionComparison]
    provenance: CompletedDurationReportProvenance
    summary: CompletedDurationReportSummary
    tenant_id: str


class TimePlanOutboxReplayRequest(TypedDict):
    limit: NotRequired[int]


class TimePlanOutboxReplayResponse(TypedDict):
    replayedAt: str
    requested: int
    requeued: int


class TimePlanProjectionLossResponse(TypedDict):
    deletedRows: int
    lostAt: str
    runUuid: str


class CompletedRunExportIdentity(TypedDict):
    packGeneration: int
    packKey: str
    planId: str
    runId: str
    tenantId: str
    versionId: str


class CompletedRunExportIntegrity(TypedDict):
    exportSha256: str
    sourceInputSha256: str
    sourceReportSha256: str


class CompletedRunExportMetadata(TypedDict):
    corrected: bool
    generatedAt: str
    reportVersion: str


class CompletedRunExportRedaction(TypedDict):
    redactedAnnotationCount: int
    result: str


class CompletedRunExportAdjustmentSection(TypedDict):
    items: list[CompletedDurationReportAdjustment]


class CompletedRunExportAnnotationsActionsSection(TypedDict):
    items: list[CompletedDurationReportAnnotation]


class CompletedRunExportBlockSection(TypedDict):
    items: list[CompletedDurationReportBlock]


class CompletedRunExportPredictionComparisonSection(TypedDict):
    items: list[CompletedDurationReportPredictionComparison]


class CompletedRunExportSections(TypedDict):
    adjustments: CompletedRunExportAdjustmentSection
    annotationsActions: CompletedRunExportAnnotationsActionsSection
    blocks: CompletedRunExportBlockSection
    order: list[str]
    predictionComparison: CompletedRunExportPredictionComparisonSection
    provenance: CompletedDurationReportProvenance
    summary: CompletedDurationReportSummary


class CompletedRunExportSource(TypedDict):
    contractVersion: str
    identity: CompletedRunExportIdentity
    integrity: CompletedRunExportIntegrity
    metadata: CompletedRunExportMetadata
    redaction: CompletedRunExportRedaction
    sections: CompletedRunExportSections


class CompletedRunExportRequest(TypedDict):
    formats: list[str]
    idempotencyKey: NotRequired[str]
    source: CompletedRunExportSource


