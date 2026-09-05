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
