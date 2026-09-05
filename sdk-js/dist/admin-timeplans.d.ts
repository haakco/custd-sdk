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
}
export type TimePlanAllocationPreview = {
    allocatorVersion: string;
    horizonMs: number;
    allocations: TimePlanAllocation[];
};
export {};
