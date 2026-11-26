/**
 * Workflow timings: facts another system observed about its own work. Custd is not the
 * controller: the caller keeps its own lifecycle and reports what it observed after its own
 * commit. Every append is idempotent through the caller's deterministic key, and a 200 answer
 * is not a durable append: read each result's `accepted`.
 */
import type { RequestOptions } from "./index.js";
/** Expectation states. Only `ready` may be presented as a forecast; a cold start must look different. */
export declare const WORKFLOW_TIMING_STATES: {
    readonly ready: "ready";
    readonly coldStart: "cold_start";
    readonly sparse: "sparse";
    readonly stale: "stale";
    readonly partial: "partial";
    readonly unavailable: "unavailable";
    readonly error: "error";
};
export type WorkflowTimingState = (typeof WORKFLOW_TIMING_STATES)[keyof typeof WORKFLOW_TIMING_STATES];
/** The observed fact kinds. */
export declare const WORKFLOW_TIMING_FACT_KINDS: {
    readonly runStarted: "run_started";
    readonly runFinished: "run_finished";
    readonly stepStarted: "step_started";
    readonly stepFinished: "step_finished";
};
export type WorkflowTimingFactKind = (typeof WORKFLOW_TIMING_FACT_KINDS)[keyof typeof WORKFLOW_TIMING_FACT_KINDS];
/** One declared step of a workflow shape. */
export type WorkflowTimingStepDeclaration = {
    stepKey: string;
    name: string;
    nominalMs: number;
};
/** The declarative workflow shape. Repeating it is a no-op; a changed shape adds a forward-only revision. */
export type WorkflowTimingDeclaration = {
    workflowKey: string;
    name: string;
    description?: string;
    allowOverlap?: boolean;
    dimensions?: string[];
    steps: WorkflowTimingStepDeclaration[];
    retired?: boolean;
    predictionVersionUuid?: string;
};
export type WorkflowTimingRunFact = {
    state: string;
};
export type WorkflowTimingStepFact = {
    stepKey: string;
    attempt: number;
    state: string;
    errorClass?: string;
};
/** The observed fact body. */
export type WorkflowTimingFact = {
    kind: WorkflowTimingFactKind;
    occurredAt: string;
    dimensions?: Record<string, string>;
    run?: WorkflowTimingRunFact;
    step?: WorkflowTimingStepFact;
};
/** Which collector supplied a fact. Both the actor kind and reference are required. */
export type WorkflowTimingProvenance = {
    actorKind: string;
    actorRef: string;
    collector?: string;
};
/** One observed fact with its idempotency identity. */
export type WorkflowTimingObservation = {
    workflowKey: string;
    externalRunId: string;
    idempotencyKey: string;
    supersedesFactUuid?: string;
    provenance?: WorkflowTimingProvenance;
    fact: WorkflowTimingFact;
};
/** The per-item outcome of an append. */
export type WorkflowTimingObservationResult = {
    index: number;
    accepted: boolean;
    duplicate: boolean;
    workflowKey: string;
    externalRunId: string;
    idempotencyKey: string;
    runUuid?: string;
    factUuid?: string;
    errorCode?: string;
    errorMessage?: string;
};
/** The outcome of one append. A rejected item is not a durable append. */
export type WorkflowTimingBatchResult = {
    results: WorkflowTimingObservationResult[];
    accepted: number;
    rejected: number;
    duplicates: number;
};
export type WorkflowTimingDimensionDefinition = {
    dimensionKey: string;
    maxValueBytes: number;
};
export type WorkflowTimingStepDefinition = {
    stepKey: string;
    name: string;
    sequence: number;
    nominalMs: number;
};
/** An immutable compiled workflow shape. */
export type WorkflowTimingRevision = {
    uuid: string;
    number: number;
    hash: string;
    allowOverlap: boolean;
    predictionVersionUuid?: string;
    dimensions: WorkflowTimingDimensionDefinition[];
    steps: WorkflowTimingStepDefinition[];
};
/** One tenant-scoped workflow shape. */
export type WorkflowTimingDefinition = {
    uuid: string;
    workflowKey: string;
    name: string;
    description: string;
    status: string;
    currentRevision: WorkflowTimingRevision;
    revisionCount: number;
};
export type WorkflowTimingDefinitionList = {
    items: WorkflowTimingDefinition[];
};
/** What one reconcile changed. */
export type WorkflowTimingReconcileResult = {
    definition: WorkflowTimingDefinition;
    created: boolean;
    revisionChanged: boolean;
};
/** One evidence-backed duration expectation. The point and range are absent when not produced. */
export type WorkflowTimingExpectation = {
    seriesKey: string;
    stepKey?: string;
    attempt?: number;
    state: WorkflowTimingState;
    baselineMs: number;
    expectedMs?: number;
    conservativeLowMs?: number;
    conservativeHighMs?: number;
    sampleCount: number;
    method: string;
    methodVersion: string;
    predictionVersionUuid?: string;
    inputHash: string;
    generatedAt: string;
    evidenceWindowStart: string;
    warnings: string[];
};
/** One observed run's completion expectation. */
export type WorkflowTimingPrediction = {
    runUuid: string;
    workflowKey: string;
    externalRunId: string;
    state: WorkflowTimingState;
    allowOverlap: boolean;
    generatedAt: string;
    run: WorkflowTimingExpectation;
    steps: WorkflowTimingExpectation[];
};
/** The projection state of one run. Pending facts mean its durations are not yet trustworthy. */
export type WorkflowTimingProjectionStatus = {
    state: string;
    projectedLedgerId: number;
    latestLedgerId: number;
    pendingFacts: number;
    foldError?: string;
    healthy: boolean;
    nextAction: string;
};
export type WorkflowTimingAttempt = {
    stepKey: string;
    attempt: number;
    state: string;
    startedAt?: string;
    finishedAt?: string;
    errorClass?: string;
    occurredAt: string;
    receiptAt: string;
};
/** One observed run with its projection status and attempts. */
export type WorkflowTimingRun = {
    runUuid: string;
    workflowKey: string;
    workflowUuid: string;
    revisionUuid: string;
    revisionNumber: number;
    revisionHash: string;
    externalRunId: string;
    state: string;
    startedAt?: string;
    finishedAt?: string;
    sourceOccurredAt?: string;
    receiptAt: string;
    dimensions: Record<string, string>;
    attempts: WorkflowTimingAttempt[];
    projectionStatus: WorkflowTimingProjectionStatus;
};
export type WorkflowTimingRunSummary = {
    runUuid: string;
    externalRunId: string;
    workflowKey: string;
    state: string;
    startedAt?: string;
    finishedAt?: string;
    pendingFacts: number;
    openAttempts: number;
    receiptAt: string;
};
export type WorkflowTimingRunList = {
    items: WorkflowTimingRunSummary[];
};
/** The closed outcome tally of a workflow. */
export type WorkflowTimingOutcomeCounts = {
    completedRuns: number;
    failedRuns: number;
    cancelledRuns: number;
    runningRuns: number;
    completedSteps: number;
    failedAttempts: number;
    skippedAttempts: number;
    cancelledSteps: number;
    openAttempts: number;
    retries: number;
};
export type WorkflowTimingDurationHistoryEntry = {
    runUuid: string;
    stepKey: string;
    valueMs: number;
    baselineMs: number;
    revisionUuid: string;
    revisionNumber: number;
    outcome: string;
    corrected: boolean;
    observedAt: string;
};
export type WorkflowTimingContribution = {
    stepKey: string;
    attempts: number;
    totalMs: number;
    baselineMs: number;
    contributionPermille: number;
};
/** The latest completed run's split. Active time is the union of step intervals, never their sum. */
export type WorkflowTimingRunTiming = {
    runUuid: string;
    wallClockMs: number;
    activeMs: number;
    waitMs: number;
    nominalMs: number;
};
export type WorkflowTimingDurationHistory = {
    workflowKey: string;
    workflowUuid: string;
    entries: WorkflowTimingDurationHistoryEntry[];
    outcomes: WorkflowTimingOutcomeCounts;
    contributions: WorkflowTimingContribution[];
    latestCompletedRun?: WorkflowTimingRunTiming;
};
/** The measurement owner's evaluation artifact, as it stores it. */
export type WorkflowTimingEvaluationArtifact = {
    schema_version: string;
    source: string;
    prediction_version_uuid: string;
    content_sha256: string;
    evaluation: Record<string, unknown>;
};
/** The rolling-origin evaluation. Unavailable, with a next action, until a prediction version is selected. */
export type WorkflowTimingEvaluation = {
    workflowKey: string;
    workflowUuid: string;
    seriesKey: string;
    state: string;
    nextAction: string;
    baselineMs: number;
    outcomes: WorkflowTimingOutcomeCounts;
    predictionVersionUuid?: string;
    artifact?: WorkflowTimingEvaluationArtifact;
};
export type WorkflowTimingRunProjection = {
    runUuid: string;
    state: string;
    corrected: boolean;
    startedAt?: string;
    finishedAt?: string;
    occurredAt?: string;
    receiptAt: string;
    dimensions: Record<string, string>;
    attempts: WorkflowTimingAttempt[];
    appliedLedgerId: number;
    openAttempts: number;
};
export type WorkflowTimingRunDuration = {
    valueMs: number;
    baselineMs: number;
    startedAt: string;
    finishedAt: string;
};
export type WorkflowTimingStepDuration = {
    stepKey: string;
    attempt: number;
    valueMs: number;
    baselineMs: number;
    startedAt: string;
    finishedAt: string;
    receiptAt: string;
};
export type WorkflowTimingExcludedStep = {
    stepKey: string;
    attempt: number;
    outcome: string;
};
export type WorkflowTimingDurationProjection = {
    runEligible: boolean;
    run: WorkflowTimingRunDuration;
    steps: WorkflowTimingStepDuration[];
    excluded: WorkflowTimingExcludedStep[];
    activeMs: number;
    waitMs: number;
    openAttempts: number;
};
/** What one deterministic projection rebuild produced. */
export type WorkflowTimingRebuildResult = {
    runUuid: string;
    workflowKey: string;
    externalRunId: string;
    facts: number;
    status: WorkflowTimingProjectionStatus;
    observationsWritten: number;
    projection: WorkflowTimingRunProjection;
    durations: WorkflowTimingDurationProjection;
};
/** Optional narrowing for a run list. */
export type WorkflowTimingRunListQuery = {
    workflowKey?: string;
    limit?: number;
};
type AdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;
export declare class WorkflowTimingAdminClient {
    private readonly request;
    constructor(request: AdminRequester);
    /** Declaratively applies one workflow shape, keyed by its workflowKey. */
    reconcileDefinition(companySlug: string, declaration: WorkflowTimingDeclaration, options?: RequestOptions): Promise<WorkflowTimingReconcileResult>;
    listDefinitions(companySlug: string, limit?: number, options?: RequestOptions): Promise<WorkflowTimingDefinitionList>;
    getDefinition(companySlug: string, workflowKey: string, options?: RequestOptions): Promise<WorkflowTimingDefinition>;
    /** Records one observed fact. Read the result's `accepted`, not the transport status. */
    appendObservation(companySlug: string, observation: WorkflowTimingObservation, options?: RequestOptions): Promise<WorkflowTimingBatchResult>;
    /** Records a bounded batch (10,000 facts, 1 MiB). Replay a failed request with the same idempotency keys. */
    appendObservations(companySlug: string, observations: WorkflowTimingObservation[], options?: RequestOptions): Promise<WorkflowTimingBatchResult>;
    /** Appends a fact that supersedes an accepted one; the observation must name `supersedesFactUuid`. */
    correctObservation(companySlug: string, observation: WorkflowTimingObservation, options?: RequestOptions): Promise<WorkflowTimingBatchResult>;
    /** Lists observed runs, newest first. The server filters by workflow before it limits. */
    listRuns(companySlug: string, query?: WorkflowTimingRunListQuery, options?: RequestOptions): Promise<WorkflowTimingRunList>;
    getRun(companySlug: string, runUuid: string, options?: RequestOptions): Promise<WorkflowTimingRun>;
    /** Reads the evidence-backed completion expectation for one run. */
    getPrediction(companySlug: string, runUuid: string, options?: RequestOptions): Promise<WorkflowTimingPrediction>;
    getDurationHistory(companySlug: string, workflowKey: string, limit?: number, options?: RequestOptions): Promise<WorkflowTimingDurationHistory>;
    getEvaluation(companySlug: string, workflowKey: string, seriesKey?: string, options?: RequestOptions): Promise<WorkflowTimingEvaluation>;
    /** Rebuilds one run's projection from its ledger: the repair path when its status reports pending facts. */
    rebuildRun(companySlug: string, runUuid: string, options?: RequestOptions): Promise<WorkflowTimingRebuildResult>;
    private append;
}
export {};
