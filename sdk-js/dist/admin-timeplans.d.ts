import type { RequestOptions } from "./index.js";
export type TimePlanAllocationBasis = "absolute" | "horizon_fraction" | "remainder_weight";
export type TimePlanAnnotationType = "note" | "marker" | "decision" | "action";
export type TimePlanAnnotationField = "text" | "markerLabel" | "decisionStatus" | "assigneeRef" | "dueDate" | "actionStatus";
export type TimePlanThresholdCueSeverity = "info" | "warning" | "critical";
export type TimePlanAnnotationSchema = {
    allowedTypes?: TimePlanAnnotationType[];
    fields?: TimePlanAnnotationField[];
};
export type TimePlanThresholdCue = {
    remainingMs: number;
    remainingFractionBps?: never;
    severity: TimePlanThresholdCueSeverity;
} | {
    remainingFractionBps: number;
    remainingMs?: never;
    severity: TimePlanThresholdCueSeverity;
};
export type TimePlanRedactionRequest = {
    reason: string;
};
export declare function validateTimePlanDefinition(definition: TimePlanDefinition): void;
export type TimePlanDefinitionBlock = {
    uuid: string;
    semanticKey: string;
    title: string;
    description?: string;
    category?: string;
    tags?: string[];
    basis: TimePlanAllocationBasis;
    durationMs?: number;
    numerator?: number;
    denominator?: number;
    weight?: number;
};
export type TimePlanDefinition = {
    horizonMs: number;
    defaultStartsAt?: string;
    defaultEndsAt?: string;
    redistributionMode?: string;
    autoAdvance?: boolean;
    annotationSchema?: TimePlanAnnotationSchema;
    thresholdCues?: TimePlanThresholdCue[];
    blocks: TimePlanDefinitionBlock[];
};
export type TimePlanDraftRequest = {
    planKey: string;
    name: string;
    description?: string;
    definition: TimePlanDefinition;
};
export type TimePlanDraftRevisionRequest = TimePlanDraftRequest & {
    expectedRevision: number;
};
export type TimePlanRevisionRequest = {
    expectedRevision: number;
};
export type TimePlan = {
    uuid: string;
    planKey: string;
    name: string;
    description?: string;
    status: string;
    draftRevision: number;
    definition: TimePlanDefinition;
    updatedAt: string;
};
export type TimePlanListResponse = {
    plans: TimePlan[];
};
export type TimePlanVersion = {
    uuid: string;
    planUuid: string;
    versionNumber: number;
    definitionHash: string;
    publishedAt: string;
};
export type TimePlanRunRequest = {
    planUuid: string;
    versionUuid?: string;
    scheduledStartsAt?: string;
    scheduledEndsAt?: string;
};
export type TimePlanAllocation = {
    blockId: string;
    sequence: number;
    durationMs: number;
};
export type TimePlanCreatedRun = {
    uuid: string;
    planUuid: string;
    versionUuid: string;
    status: string;
    baselineHorizonMs: number;
    blockAllocations: TimePlanAllocation[];
    createdAt: string;
};
export type TimePlanRunBlock = {
    uuid: string;
    sequence: number;
    status: string;
    baselineMs: number;
    currentMs: number;
    allocatedAtStartMs?: number;
    actualActiveMs: number;
    wallStartedAt?: string;
    wallEndedAt?: string;
    outcomeCensored: boolean;
};
export type TimePlanRun = {
    uuid: string;
    planUuid: string;
    status: string;
    streamVersion: number;
    scheduledStartsAt?: string;
    scheduledEndsAt?: string;
    effectiveStartsAt?: string;
    effectiveEndsAt?: string;
    startPolicy?: string;
    baselineHorizonMs: number;
    executableHorizonMs?: number;
    lostMs: number;
    unusedMs: number;
    overrunMs: number;
    currentBlockUuid?: string;
    blocks: TimePlanRunBlock[];
};
export type TimePlanCommandRequest = {
    commandId: string;
    idempotencyKey: string;
    expectedVersion: number;
    type: string;
    blockId?: string;
    clientOccurredAt?: string;
    boundaryEndsAt?: string;
    scheduledStartsAt?: string;
    scheduledEndsAt?: string;
    startPolicy?: string;
    reason?: string;
    supersedesTransitionUuid?: string;
    corrected?: TimePlanCorrectedCommand;
};
export type TimePlanCorrectedCommand = {
    type: string;
    blockId?: string;
    effectiveAt: string;
    boundaryEndsAt?: string;
    startPolicy?: string;
};
export type TimePlanCalculationChange = {
    blockId: string;
    fromMs: number;
    toMs: number;
};
export type TimePlanCalculationReceipt = {
    allocatorVersion: string;
    reason: string;
    summary: string;
    source: TimePlanAllocation[];
    result: TimePlanAllocation[];
    changes: TimePlanCalculationChange[];
};
export type TimePlanCommandResult = {
    transitionUuid: string;
    projection: TimePlanRun;
    receipt: TimePlanCalculationReceipt;
    duplicate: boolean;
};
export type TimePlanTransition = {
    uuid: string;
    runUuid: string;
    streamVersion: number;
    commandId: string;
    type: string;
    actorKind: string;
    actorRef: string;
    serverReceivedAt: string;
    clientOccurredAt?: string;
    reason?: string;
    previousStatus?: string;
    currentStatus: string;
    allocatorVersion: string;
    schemaVersion: string;
    supersedesTransitionUuid?: string;
    receipt: TimePlanCalculationReceipt;
};
export type TimePlanHistoryResponse = {
    transitions: TimePlanTransition[];
};
export type TimePlanAnnotationInput = {
    type: TimePlanAnnotationType | string;
    runBlockUuid?: string;
    text?: string;
    markerLabel?: string;
    decisionStatus?: string;
    assigneeRef?: string;
    dueDate?: string;
    actionStatus?: string;
};
export type TimePlanAnnotation = TimePlanAnnotationInput & {
    uuid: string;
    runUuid: string;
    supersedesUuid?: string;
    recordedAt: string;
    actorKind: string;
    actorRef: string;
    redactedAt?: string;
    redactionReason?: string;
};
export type TimePlanAnnotationListResponse = {
    annotations: TimePlanAnnotation[];
};
export type TimePlanAdjustmentReason = "late_start" | "early_completion" | "overrun" | "skip" | "completion" | "boundary_change";
/** The allocator conformance proof: every published vector re-run against this server's allocator. */
export type TimePlanDefinitionMathProof = {
    schemaVersion: string;
    conformanceSchemaVersion: string;
    allocatorVersion: string;
    companySlug: string;
    source: string;
    observedAt: string;
    summary: {
        vectorCount: number;
        initialVectorCount: number;
        adjustmentVectorCount: number;
        negativeAllocations: number;
        exactConservation: boolean;
        deterministicTieBreak: boolean;
        passed: boolean;
    };
    definitions: {
        index: number;
        vectorId: string;
        horizonMs: number;
        blockCount: number;
        allocatedMs: number;
        exactConservation: boolean;
        runtimeVocabularyClean: boolean;
        passed: boolean;
    }[];
    allocations: {
        index: number;
        vectorId: string;
        horizonMs: number;
        allocations: TimePlanAllocation[];
        negativeAllocations: number;
        exactConservation: boolean;
        deterministicTieBreak: boolean;
        passed: boolean;
    }[];
    adjustments: {
        index: number;
        vectorId: string;
        reason: TimePlanAdjustmentReason;
        horizonMs: number;
        elapsedMs: number;
        actualMs: number;
        remainingMs: number;
        unusedMs: number;
        overrunMs: number;
        allocations: TimePlanAllocation[];
        negativeAllocations: number;
        exactConservation: boolean;
        markFutureNotRun: boolean;
        passed: boolean;
    }[];
};
export type TimePlanOperationalStatus = {
    checkedAt: string;
    activeRuns: number;
    staleRuns: number;
    pendingOutbox: number;
    publishedOutbox: number;
    failedOutbox: number;
    oldestFailureAt?: string;
};
export type TimePlanPublishedVersion = {
    uuid: string;
    planUuid: string;
    versionNumber: number;
    schemaVersion: string;
    allocatorVersion: string;
    definitionHash: string;
    horizonMs: number;
    blockCount: number;
    allocations: TimePlanAllocation[];
    publishedAt: string;
};
export type TimePlanDurationObservation = {
    observationUuid: string;
    idempotencyKey: string;
    planUuid: string;
    runUuid: string;
    blockUuid: string;
    semanticKey: string;
};
export type TimePlanDurationObservationList = {
    runUuid: string;
    nonDeletedCount: number;
    observations: TimePlanDurationObservation[];
};
export type TimePlanPredictionSnapshot = {
    snapshotUuid: string;
    runUuid: string;
    blockId: number;
    blockUuid: string;
    method: string;
    methodVersion: string;
    predictionVersionUuid?: string;
    inputHash: string;
    sampleCount: number;
    pointMs: number;
    p10Ms?: number;
    p90Ms?: number;
    warnings: string[];
    predictedAt: string;
};
export type TimePlanPredictionSnapshotList = {
    snapshots: TimePlanPredictionSnapshot[];
};
export type TimePlanReportAllocation = {
    block_uuid: string;
    duration_ms: number;
    sequence: number;
};
/** One adjustment in a completed run's report. Fields are as the report owner stores them. */
export type TimePlanReportAdjustment = {
    transition_uuid: string;
    command_id: string;
    type: string;
    stream_version: number;
    occurred_at: string;
    client_occurred_at?: string;
    schema_version?: string;
    allocator_version?: string;
    previous_status?: string;
    current_status?: string;
    reason?: string;
    actor_kind?: string;
    actor_ref?: string;
    supersedes_transition_id?: string;
    receipt: {
        allocator_version?: string;
        reason?: string;
        summary?: string;
        changes?: {
            block_uuid: string;
            from_ms: number;
            to_ms: number;
        }[] | null;
        source?: TimePlanReportAllocation[] | null;
        result?: TimePlanReportAllocation[] | null;
    };
};
export type TimePlanReportAnnotation = {
    uuid: string;
    type: string;
    actor_kind: string;
    actor_ref?: string;
    block_uuid?: string;
    text?: string;
    marker_label?: string;
    decision_status?: string;
    action_status?: string;
    assignee_ref?: string;
    due_date?: string;
    supersedes_uuid?: string;
    recorded_at: string;
    redacted_at?: string;
};
export type TimePlanReportBlock = {
    block_uuid: string;
    semantic_key: string;
    sequence: number;
    status: string;
    outcome: string;
    category?: string;
    tags?: string[] | null;
    planned_ms: number;
    current_ms: number;
    allocated_at_start_ms?: number;
    actual_ms?: number;
    wall_started_at?: string;
    wall_ended_at?: string;
};
export type TimePlanReportPredictionComparison = {
    block_uuid: string;
    method: string;
    method_version: string;
    input_hash: string;
    sample_count: number;
    predicted_at: string;
    point_ms: number;
    p10_ms?: number;
    p90_ms?: number;
    actual_ms?: number;
    absolute_error_ms?: number;
    interval_covered?: boolean;
    warnings?: string[] | null;
};
/** The completed run's duration report, exactly as the report owner stores it. */
export type TimePlanCompletedDurationReport = {
    tenant_id: string;
    summary: {
        plan_id: string;
        version_id: string;
        run_id: string;
        run_status: string;
        stream_version: number;
        completed_at: string;
        scheduled_starts_at?: string;
        scheduled_ends_at?: string;
        effective_starts_at?: string;
        effective_ends_at?: string;
        baseline_horizon_ms: number;
        executable_horizon_ms?: number;
        planned_total_ms: number;
        current_total_ms: number;
        actual_total_ms: number;
        actual_complete: boolean;
        final_variance_ms: number;
        lost_ms: number;
        unused_ms: number;
        overrun_ms: number;
        block_count: number;
        actual_block_count: number;
        completed_block_count: number;
        skipped_block_count: number;
        cancelled_block_count: number;
        not_run_block_count: number;
        censored_block_count: number;
    };
    blocks: TimePlanReportBlock[];
    adjustments: TimePlanReportAdjustment[];
    annotations: TimePlanReportAnnotation[];
    prediction_comparisons: TimePlanReportPredictionComparison[];
    provenance: {
        report_version: string;
        generated_at: string;
        input_hash: string;
        corrected: boolean;
        adjustment_count: number;
        annotation_count: number;
        prediction_count: number;
        forecast_evaluation_hash?: string;
        measurement_input_hash?: string;
        measurement_projection_version?: string;
    };
};
export type TimePlanOutboxReplayRequest = {
    limit?: number;
};
export type TimePlanOutboxReplay = {
    replayedAt: string;
    requested: number;
    requeued: number;
};
export type TimePlanProjectionLoss = {
    runUuid: string;
    deletedRows: number;
    lostAt: string;
};
export type TimePlanRunRepair = {
    repairedAt: string;
    run: TimePlanRun;
};
type AdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;
export declare class TimePlanAdminClient {
    private readonly request;
    constructor(request: AdminRequester);
    list(companySlug: string, limit?: number, options?: RequestOptions): Promise<TimePlanListResponse>;
    get(companySlug: string, planUuid: string, options?: RequestOptions): Promise<TimePlan>;
    create(companySlug: string, body: TimePlanDraftRequest, options?: RequestOptions): Promise<TimePlan>;
    preview(companySlug: string, definition: TimePlanDefinition, options?: RequestOptions): Promise<TimePlanAllocationPreview>;
    revise(companySlug: string, planUuid: string, body: TimePlanDraftRevisionRequest, options?: RequestOptions): Promise<TimePlan>;
    publish(companySlug: string, planUuid: string, body: TimePlanRevisionRequest, options?: RequestOptions): Promise<TimePlanVersion>;
    retire(companySlug: string, planUuid: string, options?: RequestOptions): Promise<TimePlan>;
    createRun(companySlug: string, body: TimePlanRunRequest, options?: RequestOptions): Promise<TimePlanCreatedRun>;
    getRun(companySlug: string, runUuid: string, options?: RequestOptions): Promise<TimePlanRun>;
    history(companySlug: string, runUuid: string, limit?: number, options?: RequestOptions): Promise<TimePlanHistoryResponse>;
    execute(companySlug: string, runUuid: string, body: TimePlanCommandRequest, options?: RequestOptions): Promise<TimePlanCommandResult>;
    createAnnotation(companySlug: string, runUuid: string, body: TimePlanAnnotationInput, options?: RequestOptions): Promise<TimePlanAnnotation>;
    listAnnotations(companySlug: string, runUuid: string, limit?: number, options?: RequestOptions): Promise<TimePlanAnnotationListResponse>;
    correctAnnotation(companySlug: string, runUuid: string, annotationUuid: string, body: TimePlanAnnotationInput, options?: RequestOptions): Promise<TimePlanAnnotation>;
    redactAnnotation(companySlug: string, runUuid: string, annotationUuid: string, request: TimePlanRedactionRequest, options?: RequestOptions): Promise<void>;
    /** Re-runs the allocator conformance vectors and reports whether every one passed. */
    getDefinitionMathProof(companySlug: string, options?: RequestOptions): Promise<TimePlanDefinitionMathProof>;
    getOperationalStatus(companySlug: string, options?: RequestOptions): Promise<TimePlanOperationalStatus>;
    /** Re-queues failed outbox events for publication. */
    replayOutbox(companySlug: string, body?: TimePlanOutboxReplayRequest, options?: RequestOptions): Promise<TimePlanOutboxReplay>;
    getPublishedVersion(companySlug: string, planUuid: string, versionUuid: string, options?: RequestOptions): Promise<TimePlanPublishedVersion>;
    listDurationObservations(companySlug: string, runUuid: string, options?: RequestOptions): Promise<TimePlanDurationObservationList>;
    listRunPredictions(companySlug: string, runUuid: string, limit?: number, options?: RequestOptions): Promise<TimePlanPredictionSnapshotList>;
    getCompletedDurationReport(companySlug: string, runUuid: string, options?: RequestOptions): Promise<TimePlanCompletedDurationReport>;
    /** Drops a run's read projection so it is rebuilt from the event stream. */
    deleteRunProjection(companySlug: string, runUuid: string, options?: RequestOptions): Promise<TimePlanProjectionLoss>;
    /** Rebuilds a run's projection from its event stream. The run names its tenant. */
    repairRun(runUuid: string, options?: RequestOptions): Promise<TimePlanRunRepair>;
}
export type TimePlanAllocationPreview = {
    allocatorVersion: string;
    horizonMs: number;
    allocations: TimePlanAllocation[];
};
export {};
