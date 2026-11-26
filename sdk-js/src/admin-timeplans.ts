import type { RequestOptions } from "./index.js";

export type TimePlanAllocationBasis = "absolute" | "horizon_fraction" | "remainder_weight";

export type TimePlanAnnotationType = "note" | "marker" | "decision" | "action";

export type TimePlanAnnotationField =
  | "text"
  | "markerLabel"
  | "decisionStatus"
  | "assigneeRef"
  | "dueDate"
  | "actionStatus";

export type TimePlanThresholdCueSeverity = "info" | "warning" | "critical";

export type TimePlanAnnotationSchema = {
  allowedTypes?: TimePlanAnnotationType[];
  fields?: TimePlanAnnotationField[];
};

export type TimePlanThresholdCue =
  | {
      remainingMs: number;
      remainingFractionBps?: never;
      severity: TimePlanThresholdCueSeverity;
    }
  | {
      remainingFractionBps: number;
      remainingMs?: never;
      severity: TimePlanThresholdCueSeverity;
    };

export type TimePlanRedactionRequest = {
  reason: string;
};

const timePlanAnnotationTypes: readonly TimePlanAnnotationType[] = ["note", "marker", "decision", "action"];
const timePlanAnnotationFields: readonly TimePlanAnnotationField[] = [
  "text",
  "markerLabel",
  "decisionStatus",
  "assigneeRef",
  "dueDate",
  "actionStatus",
];
const timePlanAllocationBases: readonly TimePlanAllocationBasis[] = [
  "absolute",
  "horizon_fraction",
  "remainder_weight",
];
const timePlanThresholdSeverities: readonly TimePlanThresholdCueSeverity[] = ["info", "warning", "critical"];
const maxTimePlanThresholdCues = 16;

export function validateTimePlanDefinition(definition: TimePlanDefinition): void {
  if (!Number.isSafeInteger(definition.horizonMs) || definition.horizonMs <= 0) {
    throw new Error("custd: time-plan horizonMs must be a positive integer");
  }
  if (definition.annotationSchema) {
    validateTimePlanEnumList(definition.annotationSchema.allowedTypes, timePlanAnnotationTypes, "allowedTypes", 4);
    validateTimePlanEnumList(definition.annotationSchema.fields, timePlanAnnotationFields, "fields", 6);
  }
  const thresholdCues = definition.thresholdCues ?? [];
  if (thresholdCues.length > maxTimePlanThresholdCues) {
    throw new Error("custd: time-plan thresholdCues cannot contain more than 16 values");
  }
  const seenTriggers = new Set<string>();
  for (const cue of thresholdCues) {
    validateTimePlanThresholdCue(cue);
    const trigger = cue.remainingMs !== undefined ? `ms:${cue.remainingMs}` : `bps:${cue.remainingFractionBps}`;
    if (seenTriggers.has(trigger)) {
      throw new Error("custd: time-plan thresholdCues must not contain duplicate triggers");
    }
    seenTriggers.add(trigger);
  }
  for (const block of definition.blocks) {
    if (!timePlanAllocationBases.includes(block.basis)) {
      throw new Error("custd: time-plan block basis is invalid");
    }
  }
}

function validateTimePlanThresholdCue(cue: TimePlanThresholdCue): void {
  const hasRemainingMs = cue.remainingMs !== undefined && cue.remainingMs !== null;
  const hasRemainingFractionBps = cue.remainingFractionBps !== undefined && cue.remainingFractionBps !== null;
  if (hasRemainingMs === hasRemainingFractionBps) {
    throw new Error("custd: time-plan threshold cue must have one remaining threshold");
  }
  if (!timePlanThresholdSeverities.includes(cue.severity)) {
    throw new Error("custd: time-plan threshold cue severity is invalid");
  }
  if (hasRemainingMs) {
    const remainingMs = cue.remainingMs;
    if (
      remainingMs === undefined ||
      remainingMs === null ||
      !Number.isSafeInteger(remainingMs) ||
      remainingMs < 0 ||
      remainingMs > 2_419_200_000
    ) {
      throw new Error("custd: time-plan remainingMs is out of range");
    }
  }
  if (hasRemainingFractionBps) {
    const remainingFractionBps = cue.remainingFractionBps;
    if (
      remainingFractionBps === undefined ||
      remainingFractionBps === null ||
      !Number.isSafeInteger(remainingFractionBps) ||
      remainingFractionBps < 0 ||
      remainingFractionBps > 10_000
    ) {
      throw new Error("custd: time-plan remainingFractionBps is out of range");
    }
  }
}

function validateTimePlanEnumList<T extends string>(
  values: T[] | undefined,
  allowed: readonly T[],
  field: string,
  maxItems: number,
): void {
  if (!values) return;
  if (values.length > maxItems || new Set(values).size !== values.length) {
    throw new Error(`custd: time-plan ${field} contains too many or duplicate values`);
  }
  if (values.some((value) => !allowed.includes(value))) {
    throw new Error(`custd: time-plan ${field} contains an unsupported value`);
  }
}

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

export type TimePlanAdjustmentReason =
  | "late_start"
  | "early_completion"
  | "overrun"
  | "skip"
  | "completion"
  | "boundary_change";

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

export type TimePlanPredictionSnapshotList = { snapshots: TimePlanPredictionSnapshot[] };

export type TimePlanReportAllocation = { block_uuid: string; duration_ms: number; sequence: number };

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
    changes?: { block_uuid: string; from_ms: number; to_ms: number }[] | null;
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

export type TimePlanOutboxReplayRequest = { limit?: number };

export type TimePlanOutboxReplay = { replayedAt: string; requested: number; requeued: number };

export type TimePlanProjectionLoss = { runUuid: string; deletedRows: number; lostAt: string };

export type TimePlanRunRepair = { repairedAt: string; run: TimePlanRun };

type AdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;

export class TimePlanAdminClient {
  constructor(private readonly request: AdminRequester) {}

  list(companySlug: string, limit?: number, options?: RequestOptions): Promise<TimePlanListResponse> {
    return this.request("GET", collectionPath("/time-plans", companySlug, limit), undefined, options);
  }

  get(companySlug: string, planUuid: string, options?: RequestOptions): Promise<TimePlan> {
    return this.request("GET", resourcePath(`/time-plans/${planUuid}`, companySlug), undefined, options);
  }

  create(companySlug: string, body: TimePlanDraftRequest, options?: RequestOptions): Promise<TimePlan> {
    validateTimePlanDefinition(body.definition);
    return this.request("POST", collectionPath("/time-plans", companySlug), body, options);
  }

  preview(
    companySlug: string,
    definition: TimePlanDefinition,
    options?: RequestOptions,
  ): Promise<TimePlanAllocationPreview> {
    validateTimePlanDefinition(definition);
    return this.request("POST", collectionPath("/time-plans/preview", companySlug), definition, options);
  }

  revise(
    companySlug: string,
    planUuid: string,
    body: TimePlanDraftRevisionRequest,
    options?: RequestOptions,
  ): Promise<TimePlan> {
    validateTimePlanDefinition(body.definition);
    return this.request("PATCH", resourcePath(`/time-plans/${planUuid}`, companySlug), body, options);
  }

  publish(
    companySlug: string,
    planUuid: string,
    body: TimePlanRevisionRequest,
    options?: RequestOptions,
  ): Promise<TimePlanVersion> {
    return this.request("POST", resourcePath(`/time-plans/${planUuid}/publish`, companySlug), body, options);
  }

  retire(companySlug: string, planUuid: string, options?: RequestOptions): Promise<TimePlan> {
    return this.request("POST", resourcePath(`/time-plans/${planUuid}/retire`, companySlug), undefined, options);
  }

  createRun(companySlug: string, body: TimePlanRunRequest, options?: RequestOptions): Promise<TimePlanCreatedRun> {
    return this.request("POST", collectionPath("/time-plans/runs", companySlug), body, options);
  }

  getRun(companySlug: string, runUuid: string, options?: RequestOptions): Promise<TimePlanRun> {
    return this.request("GET", resourcePath(`/time-plans/runs/${runUuid}`, companySlug), undefined, options);
  }

  history(
    companySlug: string,
    runUuid: string,
    limit?: number,
    options?: RequestOptions,
  ): Promise<TimePlanHistoryResponse> {
    return this.request(
      "GET",
      resourcePath(`/time-plans/runs/${runUuid}/history`, companySlug, limit),
      undefined,
      options,
    );
  }

  execute(
    companySlug: string,
    runUuid: string,
    body: TimePlanCommandRequest,
    options?: RequestOptions,
  ): Promise<TimePlanCommandResult> {
    return this.request("POST", resourcePath(`/time-plans/runs/${runUuid}/commands`, companySlug), body, options);
  }

  createAnnotation(
    companySlug: string,
    runUuid: string,
    body: TimePlanAnnotationInput,
    options?: RequestOptions,
  ): Promise<TimePlanAnnotation> {
    return this.request("POST", resourcePath(`/time-plans/runs/${runUuid}/annotations`, companySlug), body, options);
  }

  listAnnotations(
    companySlug: string,
    runUuid: string,
    limit?: number,
    options?: RequestOptions,
  ): Promise<TimePlanAnnotationListResponse> {
    return this.request(
      "GET",
      resourcePath(`/time-plans/runs/${runUuid}/annotations`, companySlug, limit),
      undefined,
      options,
    );
  }

  correctAnnotation(
    companySlug: string,
    runUuid: string,
    annotationUuid: string,
    body: TimePlanAnnotationInput,
    options?: RequestOptions,
  ): Promise<TimePlanAnnotation> {
    return this.request(
      "POST",
      resourcePath(`/time-plans/runs/${runUuid}/annotations/${annotationUuid}/corrections`, companySlug),
      body,
      options,
    );
  }

  redactAnnotation(
    companySlug: string,
    runUuid: string,
    annotationUuid: string,
    request: TimePlanRedactionRequest,
    options?: RequestOptions,
  ): Promise<void> {
    return this.request(
      "POST",
      resourcePath(`/time-plans/runs/${runUuid}/annotations/${annotationUuid}/redact`, companySlug),
      request,
      options,
    );
  }
  /** Re-runs the allocator conformance vectors and reports whether every one passed. */
  async getDefinitionMathProof(companySlug: string, options?: RequestOptions): Promise<TimePlanDefinitionMathProof> {
    const proof = await this.request<TimePlanDefinitionMathProof>(
      "GET",
      collectionPath("/time-plans/operations/definition-math", companySlug),
      undefined,
      options,
    );
    return {
      ...proof,
      definitions: proof.definitions ?? [],
      allocations: (proof.allocations ?? []).map((row) => ({ ...row, allocations: row.allocations ?? [] })),
      adjustments: (proof.adjustments ?? []).map((row) => ({ ...row, allocations: row.allocations ?? [] })),
    };
  }

  getOperationalStatus(companySlug: string, options?: RequestOptions): Promise<TimePlanOperationalStatus> {
    return this.request("GET", collectionPath("/time-plans/operations/status", companySlug), undefined, options);
  }

  /** Re-queues failed outbox events for publication. */
  replayOutbox(
    companySlug: string,
    body: TimePlanOutboxReplayRequest = {},
    options?: RequestOptions,
  ): Promise<TimePlanOutboxReplay> {
    return this.request("POST", collectionPath("/time-plans/operations/outbox/replay", companySlug), body, options);
  }

  async getPublishedVersion(
    companySlug: string,
    planUuid: string,
    versionUuid: string,
    options?: RequestOptions,
  ): Promise<TimePlanPublishedVersion> {
    const path = resourcePath(`/time-plans/plans/${planUuid}/versions/${versionUuid}`, companySlug);
    const version = await this.request<TimePlanPublishedVersion>("GET", path, undefined, options);
    return { ...version, allocations: version.allocations ?? [] };
  }

  async listDurationObservations(
    companySlug: string,
    runUuid: string,
    options?: RequestOptions,
  ): Promise<TimePlanDurationObservationList> {
    const path = resourcePath(`/time-plans/runs/${runUuid}/duration-observations`, companySlug);
    const list = await this.request<TimePlanDurationObservationList>("GET", path, undefined, options);
    return { ...list, observations: list.observations ?? [] };
  }

  async listRunPredictions(
    companySlug: string,
    runUuid: string,
    limit?: number,
    options?: RequestOptions,
  ): Promise<TimePlanPredictionSnapshotList> {
    const path = resourcePath(`/time-plans/runs/${runUuid}/predictions`, companySlug, limit);
    const list = await this.request<TimePlanPredictionSnapshotList>("GET", path, undefined, options);
    return { snapshots: (list.snapshots ?? []).map((row) => ({ ...row, warnings: row.warnings ?? [] })) };
  }

  async getCompletedDurationReport(
    companySlug: string,
    runUuid: string,
    options?: RequestOptions,
  ): Promise<TimePlanCompletedDurationReport> {
    const path = resourcePath(`/time-plans/runs/${runUuid}/report`, companySlug);
    const report = await this.request<TimePlanCompletedDurationReport>("GET", path, undefined, options);
    return {
      ...report,
      blocks: report.blocks ?? [],
      adjustments: report.adjustments ?? [],
      annotations: report.annotations ?? [],
      prediction_comparisons: report.prediction_comparisons ?? [],
    };
  }

  /** Drops a run's read projection so it is rebuilt from the event stream. */
  deleteRunProjection(companySlug: string, runUuid: string, options?: RequestOptions): Promise<TimePlanProjectionLoss> {
    const path = resourcePath(`/time-plans/runs/${runUuid}/projection-loss`, companySlug);
    return this.request("POST", path, undefined, options);
  }

  /** Rebuilds a run's projection from its event stream. The run names its tenant. */
  async repairRun(runUuid: string, options?: RequestOptions): Promise<TimePlanRunRepair> {
    const path = `/time-plans/runs/${encodeURIComponent(runUuid)}/repair`;
    const repair = await this.request<TimePlanRunRepair>("POST", path, undefined, options);
    return { ...repair, run: { ...repair.run, blocks: repair.run.blocks ?? [] } };
  }
}

export type TimePlanAllocationPreview = {
  allocatorVersion: string;
  horizonMs: number;
  allocations: TimePlanAllocation[];
};

function collectionPath(path: string, companySlug: string, limit?: number): string {
  const query = new URLSearchParams({ companySlug });
  if (limit !== undefined) query.set("limit", String(limit));
  return `${path}?${query.toString()}`;
}

function resourcePath(path: string, companySlug: string, limit?: number): string {
  const segments = path.split("/").map((segment, index) => (index === 0 ? segment : encodeURIComponent(segment)));
  return collectionPath(segments.join("/"), companySlug, limit);
}
