/**
 * Workflow timings: facts another system observed about its own work. Custd is not the
 * controller: the caller keeps its own lifecycle and reports what it observed after its own
 * commit. Every append is idempotent through the caller's deterministic key, and a 200 answer
 * is not a durable append: read each result's `accepted`.
 */

import type { RequestOptions } from "./index.js";

/** Expectation states. Only `ready` may be presented as a forecast; a cold start must look different. */
export const WORKFLOW_TIMING_STATES = {
  ready: "ready",
  coldStart: "cold_start",
  sparse: "sparse",
  stale: "stale",
  partial: "partial",
  unavailable: "unavailable",
  error: "error",
} as const;

export type WorkflowTimingState = (typeof WORKFLOW_TIMING_STATES)[keyof typeof WORKFLOW_TIMING_STATES];

/** The observed fact kinds. */
export const WORKFLOW_TIMING_FACT_KINDS = {
  runStarted: "run_started",
  runFinished: "run_finished",
  stepStarted: "step_started",
  stepFinished: "step_finished",
} as const;

export type WorkflowTimingFactKind = (typeof WORKFLOW_TIMING_FACT_KINDS)[keyof typeof WORKFLOW_TIMING_FACT_KINDS];

/** One declared step of a workflow shape. */
export type WorkflowTimingStepDeclaration = { stepKey: string; name: string; nominalMs: number };

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

export type WorkflowTimingRunFact = { state: string };

export type WorkflowTimingStepFact = { stepKey: string; attempt: number; state: string; errorClass?: string };

/** The observed fact body. */
export type WorkflowTimingFact = {
  kind: WorkflowTimingFactKind;
  occurredAt: string;
  dimensions?: Record<string, string>;
  run?: WorkflowTimingRunFact;
  step?: WorkflowTimingStepFact;
};

/** Which collector supplied a fact. Both the actor kind and reference are required. */
export type WorkflowTimingProvenance = { actorKind: string; actorRef: string; collector?: string };

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

export type WorkflowTimingDimensionDefinition = { dimensionKey: string; maxValueBytes: number };

export type WorkflowTimingStepDefinition = { stepKey: string; name: string; sequence: number; nominalMs: number };

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

export type WorkflowTimingDefinitionList = { items: WorkflowTimingDefinition[] };

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

export type WorkflowTimingRunList = { items: WorkflowTimingRunSummary[] };

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

export type WorkflowTimingRunDuration = { valueMs: number; baselineMs: number; startedAt: string; finishedAt: string };

export type WorkflowTimingStepDuration = {
  stepKey: string;
  attempt: number;
  valueMs: number;
  baselineMs: number;
  startedAt: string;
  finishedAt: string;
  receiptAt: string;
};

export type WorkflowTimingExcludedStep = { stepKey: string; attempt: number; outcome: string };

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
export type WorkflowTimingRunListQuery = { workflowKey?: string; limit?: number };

type AdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;
type Nullable<T, K extends keyof T> = Omit<T, K> & { [P in K]: T[P] | null };
type Query = Record<string, string | number | undefined>;

export class WorkflowTimingAdminClient {
  constructor(private readonly request: AdminRequester) {}

  /** Declaratively applies one workflow shape, keyed by its workflowKey. */
  reconcileDefinition(
    companySlug: string,
    declaration: WorkflowTimingDeclaration,
    options?: RequestOptions,
  ): Promise<WorkflowTimingReconcileResult> {
    const path = timingPath(`/definitions/${encodeURIComponent(declaration.workflowKey)}`, companySlug);
    return this.request<WorkflowTimingReconcileResult>("PUT", path, declaration, options).then((result) => ({
      ...result,
      definition: definition(result.definition),
    }));
  }

  async listDefinitions(
    companySlug: string,
    limit?: number,
    options?: RequestOptions,
  ): Promise<WorkflowTimingDefinitionList> {
    const path = timingPath("/definitions", companySlug, { limit });
    const list = await this.request<{ items: WorkflowTimingDefinition[] | null }>("GET", path, undefined, options);
    return { items: (list.items ?? []).map(definition) };
  }

  async getDefinition(
    companySlug: string,
    workflowKey: string,
    options?: RequestOptions,
  ): Promise<WorkflowTimingDefinition> {
    const path = timingPath(`/definitions/${encodeURIComponent(workflowKey)}`, companySlug);
    return definition(await this.request("GET", path, undefined, options));
  }

  /** Records one observed fact. Read the result's `accepted`, not the transport status. */
  appendObservation(
    companySlug: string,
    observation: WorkflowTimingObservation,
    options?: RequestOptions,
  ): Promise<WorkflowTimingBatchResult> {
    return this.append("/observations", companySlug, { observation }, options);
  }

  /** Records a bounded batch (10,000 facts, 1 MiB). Replay a failed request with the same idempotency keys. */
  appendObservations(
    companySlug: string,
    observations: WorkflowTimingObservation[],
    options?: RequestOptions,
  ): Promise<WorkflowTimingBatchResult> {
    return this.append("/observations:batch", companySlug, { observations }, options);
  }

  /** Appends a fact that supersedes an accepted one; the observation must name `supersedesFactUuid`. */
  correctObservation(
    companySlug: string,
    observation: WorkflowTimingObservation,
    options?: RequestOptions,
  ): Promise<WorkflowTimingBatchResult> {
    return this.append("/corrections", companySlug, { observation }, options);
  }

  /** Lists observed runs, newest first. The server filters by workflow before it limits. */
  async listRuns(
    companySlug: string,
    query: WorkflowTimingRunListQuery = {},
    options?: RequestOptions,
  ): Promise<WorkflowTimingRunList> {
    const path = timingPath("/runs", companySlug, { workflowKey: query.workflowKey, limit: query.limit });
    const list = await this.request<{ items: WorkflowTimingRunSummary[] | null }>("GET", path, undefined, options);
    return { items: list.items ?? [] };
  }

  async getRun(companySlug: string, runUuid: string, options?: RequestOptions): Promise<WorkflowTimingRun> {
    const path = timingPath(`/runs/${encodeURIComponent(runUuid)}`, companySlug);
    const run = await this.request<Nullable<WorkflowTimingRun, "attempts">>("GET", path, undefined, options);
    return { ...run, attempts: run.attempts ?? [] };
  }

  /** Reads the evidence-backed completion expectation for one run. */
  async getPrediction(
    companySlug: string,
    runUuid: string,
    options?: RequestOptions,
  ): Promise<WorkflowTimingPrediction> {
    const path = timingPath(`/runs/${encodeURIComponent(runUuid)}/prediction`, companySlug);
    const prediction = await this.request<Nullable<WorkflowTimingPrediction, "steps">>("GET", path, undefined, options);
    return { ...prediction, run: expectation(prediction.run), steps: (prediction.steps ?? []).map(expectation) };
  }

  async getDurationHistory(
    companySlug: string,
    workflowKey: string,
    limit?: number,
    options?: RequestOptions,
  ): Promise<WorkflowTimingDurationHistory> {
    const path = timingPath(`/definitions/${encodeURIComponent(workflowKey)}/duration-history`, companySlug, { limit });
    const history = await this.request<Nullable<WorkflowTimingDurationHistory, "entries" | "contributions">>(
      "GET",
      path,
      undefined,
      options,
    );
    return { ...history, entries: history.entries ?? [], contributions: history.contributions ?? [] };
  }

  getEvaluation(
    companySlug: string,
    workflowKey: string,
    seriesKey?: string,
    options?: RequestOptions,
  ): Promise<WorkflowTimingEvaluation> {
    const path = timingPath(`/definitions/${encodeURIComponent(workflowKey)}/evaluation`, companySlug, { seriesKey });
    return this.request("GET", path, undefined, options);
  }

  /** Rebuilds one run's projection from its ledger: the repair path when its status reports pending facts. */
  async rebuildRun(
    companySlug: string,
    runUuid: string,
    options?: RequestOptions,
  ): Promise<WorkflowTimingRebuildResult> {
    const path = timingPath(`/runs/${encodeURIComponent(runUuid)}/rebuild`, companySlug);
    return rebuildResult(await this.request("POST", path, undefined, options));
  }

  private async append(
    route: string,
    companySlug: string,
    body: object,
    options?: RequestOptions,
  ): Promise<WorkflowTimingBatchResult> {
    const result = await this.request<Nullable<WorkflowTimingBatchResult, "results">>(
      "POST",
      timingPath(route, companySlug),
      body,
      options,
    );
    return { ...result, results: result.results ?? [] };
  }
}

function timingPath(route: string, companySlug: string, query: Query = {}): string {
  const params = new URLSearchParams({ companySlug });
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return `/workflow-timings${route}?${params.toString()}`;
}

function definition(value: WorkflowTimingDefinition): WorkflowTimingDefinition {
  const revision = value.currentRevision as Nullable<WorkflowTimingRevision, "dimensions" | "steps">;
  return {
    ...value,
    currentRevision: { ...revision, dimensions: revision.dimensions ?? [], steps: revision.steps ?? [] },
  };
}

function expectation(value: Nullable<WorkflowTimingExpectation, "warnings">): WorkflowTimingExpectation {
  return { ...value, warnings: value.warnings ?? [] };
}

type WireRebuildResult = Omit<WorkflowTimingRebuildResult, "projection" | "durations"> & {
  projection: Nullable<WorkflowTimingRunProjection, "attempts">;
  durations: Nullable<WorkflowTimingDurationProjection, "steps" | "excluded">;
};

function rebuildResult(value: WireRebuildResult): WorkflowTimingRebuildResult {
  return {
    ...value,
    projection: { ...value.projection, attempts: value.projection.attempts ?? [] },
    durations: { ...value.durations, steps: value.durations.steps ?? [], excluded: value.durations.excluded ?? [] },
  };
}
