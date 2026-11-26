/**
 * Ingest operator surfaces: diagnostics, monitoring, integrity, reprocessing and cleanup.
 * Every call is scoped to the credential's tenant unless it says otherwise.
 */

import type { RequestOptions } from "./index.js";

type APIRequester = <T>(
  method: string,
  path: string,
  body?: unknown,
  options?: RequestOptions,
  headers?: Record<string, string>,
) => Promise<T>;

/** The header the cleanup-job reads and cancel take their tenant from. */
export const CLEANUP_EFFECTIVE_COMPANY_HEADER = "X-Custd-Effective-Company";

/** The signed-in principal as ingest resolves it. `userUuid` is set only for a person. */
export type IngestAccount = {
  userUuid?: string;
  companySlug: string;
  companyName?: string;
  effectiveCompanySlug?: string;
  email: string;
  principalKind?: string;
  roles: string[];
  permissions: string[];
  scopes: string[];
};

/** The replay result of one rejected event. */
export type IngestReprocessOutcome = { uuid: string; success: boolean; error?: string };

/** One reprocess pass over up to 100 of the tenant's rejected events. */
export type IngestReprocessResult = {
  processed: number;
  succeeded: number;
  failed: number;
  outcomes: IngestReprocessOutcome[];
};

/** One managed audit event to redact, chosen by the pack's selector fields. */
export type ManagedAuditRedactionEvent = { selectors: Record<string, string>; fields: string[] };

/** Redacts fields from managed audit events under a redaction rule the tenant's pack declares. */
export type ManagedAuditRedactionRequest = {
  sourceSystem: string;
  redactionId: string;
  reason: string;
  events: ManagedAuditRedactionEvent[];
};

export const MANAGED_AUDIT_REDACTION_STATUSES = { redacted: "redacted", notFound: "not_found" } as const;

export type ManagedAuditRedactionStatus =
  (typeof MANAGED_AUDIT_REDACTION_STATUSES)[keyof typeof MANAGED_AUDIT_REDACTION_STATUSES];

export type ManagedAuditRedactionResult = { selectors: Record<string, string>; status: ManagedAuditRedactionStatus };

export type ManagedAuditRedactionResponse = {
  success: boolean;
  redactionId: string;
  resultShape: string;
  results: ManagedAuditRedactionResult[];
};

/**
 * How the tenant monitoring summary counts. `cached` (the default) serves fresh derived counters
 * when it can; `measured` always counts the ledgers.
 */
export type IngestMonitoringCounters = "cached" | "measured";

/** The tenant's ingest counters. Storage totals are platform-wide. */
export type IngestMonitoringSummary = {
  ingestRequestsTotal: number;
  ingestErrorsTotal: number;
  eventSegmentsVerifiedRowsTotal: number;
  rawEventsLandedTotal: number;
  rawStorageS3Total: number;
  rawLandingS3UploadFailuresTotal: number;
};

export type IngestAlertSeverity = "info" | "warning" | "error";

/** One active ingest alert for the tenant; an all-clear is an `info` alert. */
export type IngestMonitoringAlert = { id: string; severity: IngestAlertSeverity; title: string; message: string };

export type IngestMonitoringAlertList = { alerts: IngestMonitoringAlert[] };

/** Platform-wide ingest and storage counters. */
export type SystemMonitoringTotals = {
  ingestRequestsTotal: number;
  ingestErrorsTotal: number;
  rawEventsLandedTotal: number;
  rawLandingS3UploadFailuresTotal: number;
  dataSafetyInvariantViolationsTotal: number;
  storageUsageCollectorLastSuccessTimestamp: number;
  claimBacklogCount: number;
  claimBacklogOldestAgeSeconds: number;
};

export type SystemMonitoringRankReason = "largest-storage" | "most-rejects";

/** One tenant ranked as needing attention. */
export type SystemMonitoringTenant = {
  companySlug: string;
  companyName: string;
  rankReason: SystemMonitoringRankReason;
  attributedStorageBytes: number;
  effectiveLimitBytes: number;
  percentUsed: number;
  rejectedEvents?: number;
};

export type SystemMonitoringSummary = {
  generatedAt: string;
  totals: SystemMonitoringTotals;
  topTenants: SystemMonitoringTenant[];
};

/** The diagnostics sections ingest serves. Each returns the same full snapshot. */
export const INGEST_DIAGNOSTICS_SECTIONS = {
  ingest: "ingest",
  buffers: "buffers",
  database: "database",
  segments: "segments",
  reporting: "reporting",
} as const;

export type IngestDiagnosticsSection = (typeof INGEST_DIAGNOSTICS_SECTIONS)[keyof typeof INGEST_DIAGNOSTICS_SECTIONS];

export type IngestHealthStatus = "healthy" | "degraded" | "failing" | "unknown";

export type IngestStatusCounts = { "2xx": number; "4xx": number; "5xx": number };

export type IngestDiagnosticsIngestState = {
  available: boolean;
  requestRatePerSecond: number;
  statusCounts: IngestStatusCounts;
  p95LatencyMs: number;
  activeRequests: number;
};

export type IngestJetStreamState = {
  available: boolean;
  stream?: string;
  consumer?: string;
  pending: number;
  ackPending: number;
  redelivered: number;
  consumerActive: boolean;
  retentionSecondsLeft: number;
  streamState: {
    messages: number;
    bytes: number;
    subjects: number;
    cluster: { replicaCount: number; leader?: string; replicated: boolean; allReplicasCurrent: boolean };
  };
  consumerState: {
    numWaiting: number;
    maxAckPending: number;
    ackPendingUtilization: number;
    slowConsumer: boolean;
    deliveredStreamSequence: number;
    deliveredConsumerSequence: number;
    ackFloorStreamSequence: number;
    ackFloorConsumerSequence: number;
    sequenceGap: number;
  };
};

export type IngestSegmentState = {
  available: boolean;
  pending: number;
  verified: number;
  failed: number;
  oldestPendingAgeSeconds: number;
  compactedVerified: number;
  compactedFailed: number;
  rollupVerified: number;
  rollupFailed: number;
  compactionEligibleSources: number;
  compactionEstimatedObjectReduction: number;
};

export type IngestRollupSchedulerState = {
  intervalSeconds: number;
  nextRunAt: string;
  leaderWorkerId: string;
  queuedRuns: number;
  runningRuns: number;
  failedRuns: number;
  queuedJobs: number;
  claimedJobs: number;
  failedJobs: number;
  latestRunStatus: string;
};

export type IngestWorkerState = {
  available: boolean;
  enabled: boolean;
  backlog: number;
  lagSeconds: number;
  failed: number;
  lastSuccessUnix: number;
  lastFailureUnix: number;
  lastFailureReason: string;
  scheduler?: IngestRollupSchedulerState;
};

export type IngestObjectStorageState = {
  available: boolean;
  acceptedRawLandingPending: number;
  acceptedRawLandingOldestPendingAgeSeconds: number;
  acceptedRawLandingWritingLeases: number;
  acceptedRawLandingFailedObjects: number;
  acceptedRawLandingConsolidationEligibleWindows: number;
  acceptedRawLandingConsolidationSourceObjects: number;
  acceptedRawLandingConsolidationEstimatedObjectReduction: number;
  acceptedRawLandingS3UploadFailuresTotal: number;
  acceptedRawLandingObjectGroupsPerSecond: number;
  acceptedRawLandingUploadDurationMs: number;
  acceptedRawLandingVerificationDurationMs: number;
  acceptedRawLandingDBMetadataDurationMs: number;
  acceptedRawLandingObjectGroupSizeAverage: number;
  acceptedRawLandingObjectGroupSizeMax: number;
  acceptedRawLandingObjectLimiterSaturation: number;
};

export type IngestBufferState = {
  jetstream: IngestJetStreamState;
  segments: IngestSegmentState;
  compaction: IngestWorkerState;
  rollups: IngestWorkerState;
  s3: IngestObjectStorageState;
};

export type IngestTopStatement = {
  query: string;
  calls: number;
  totalExecMs: number;
  meanExecMs: number;
  rowsReturned: number;
  walBytes: number;
};

export type IngestWaitEvent = { type: string; event: string; count: number };

export type IngestTableSize = {
  tableName: string;
  rowEstimate: number;
  totalBytes: number;
  tableBytes: number;
  indexBytes: number;
};

export type IngestDatabasePoolState = {
  available: boolean;
  active: number;
  waiting: number;
  walBytes: number;
  topStatements?: IngestTopStatement[];
  writeStatements: IngestTopStatement[];
  waitEvents?: IngestWaitEvent[];
  tableSizes?: IngestTableSize[];
};

export type IngestDatabaseState = {
  core: IngestDatabasePoolState;
  raw: IngestDatabasePoolState;
  bytesPerEvent: number;
};

export type IngestReportingState = {
  available: boolean;
  freshSource: string;
  archiveSource: string;
  missingWindows: number;
};

export type IngestStageProgressClassification = "recovering" | "growing" | "steady" | "idle" | "disabled" | "unknown";

/** How a pipeline stage's backlog is trending. Estimates are present only when ingest has them. */
export type IngestStageProgress = {
  classification: IngestStageProgressClassification;
  depth: number;
  drainRatePerSecond?: number;
  etaSeconds?: number;
  retentionExpirySeconds?: number;
  note?: string;
};

/** One node of the data-path flow; `detailKey` names the snapshot section to drill into. */
export type IngestPipelineStage = {
  name: string;
  status: IngestHealthStatus;
  headline: string;
  detailKey: string;
  progress?: IngestStageProgress;
};

/** The ingest data-path health snapshot: one overall status, then each stage and section. */
export type IngestDiagnosticsSnapshot = {
  status: IngestHealthStatus;
  generatedAt: string;
  ingest: IngestDiagnosticsIngestState;
  buffers: IngestBufferState;
  database: IngestDatabaseState;
  segments: IngestSegmentState;
  reporting: IngestReportingState;
  silentDrops: { dropRatePerSecond: number };
  pipeline: IngestPipelineStage[];
};

/** Rows one retention cleanup pass deleted for the tenant. */
export type IngestCleanupResult = { deletedRaw: number; deletedEvents: number; deletedRejected: number };

/** Raw events checked against the accepted-landing ledger, and those with no landing. */
export type IngestIntegrityResult = { checkedCount: number; orphanedUuids: string[] };

export const CLEANUP_MODES = { generatedData: "generated-data" } as const;

export type CleanupMode = (typeof CLEANUP_MODES)[keyof typeof CLEANUP_MODES];

/** A JetStream stream, and optionally its consumers, a cleanup selects. */
export type CleanupJetStreamSelection = { stream: string; consumers?: string[]; executionStatus?: string };

/** A dry-run or executable generated-data cleanup plan for the credential's tenant. */
export type CleanupPlanCreateRequest = {
  mode: CleanupMode;
  reason: string;
  dryRun?: boolean;
  execute?: boolean;
  approvedBy?: string;
  approvedS3Prefixes?: string[];
  eventTypeSlug?: string;
  startedAt?: string;
  endedAt?: string;
  jetStream?: CleanupJetStreamSelection[];
};

export type CleanupPlanScope = {
  mode: CleanupMode;
  reason?: string;
  tenantSlug?: string;
  eventTypeSlug?: string;
  startedAt?: string;
  endedAt?: string;
  approvedS3Prefixes: string[];
  jetStream?: CleanupJetStreamSelection[];
  jetStreamExecution?: string;
};

export type CleanupPlanItem = {
  phase: string;
  dataClass: string;
  storagePrefix?: string;
  selectedCount: number;
  selectedBytes: number;
  executionStatus?: string;
};

export type CleanupPlan = {
  planUuid: string;
  mode: CleanupMode;
  status: string;
  reason?: string;
  selectedRows: number;
  selectedObjects: number;
  estimatedBytes: number;
  scope: CleanupPlanScope;
  items: CleanupPlanItem[];
  createdAt?: string;
};

export type CleanupPlanList = { plans: CleanupPlan[] };

/** Who approved a cleanup and until when the approval holds. */
export type CleanupApproval = { identity: string; expiresAt: string };

/** Enqueues a scoped cleanup job. An omitted tenantSlug uses the credential's tenant. */
export type CleanupJobCreateRequest = {
  mode: CleanupMode;
  reason: string;
  tenantSlug?: string;
  eventTypeSlug?: string;
  startedAt?: string;
  endedAt?: string;
  approvedS3Prefixes: string[];
  jetStream?: CleanupJetStreamSelection[];
  approval: CleanupApproval;
};

export const CLEANUP_JOB_STATUSES = {
  queued: "queued",
  dryRun: "dry_run",
  running: "running",
  completed: "completed",
  failed: "failed",
} as const;

export type CleanupJobStatus = (typeof CLEANUP_JOB_STATUSES)[keyof typeof CLEANUP_JOB_STATUSES];

/** How far an object-storage phase has deleted. */
export type CleanupObjectProgress = {
  sourceKind: string;
  cursorDirection: string;
  cursorId: number;
  cursorReceivedAt?: string;
  batchNumber: number;
  lastBatchIdentity?: string;
  ledgerSelectedCount: number;
  providerAcknowledgedCount: number;
  providerRequestCount: number;
  providerFailureCount: number;
  selectedBytes: number;
  retryCount: number;
  pendingBatchIdentity?: string;
  pendingBatchKeyCount: number;
  pendingBatchAttemptCount?: number;
  pendingBatchTerminal?: boolean;
  lastProgressAt: string;
  version: number;
};

export type CleanupJobItem = {
  id: number;
  jobId: number;
  phase: string;
  dataClass: string;
  storagePrefix: string;
  selectedCount: number;
  selectedBytes: number;
  deletedCount: number;
  verifiedCount: number;
  status: string;
  failureReason?: string;
  objectProgress?: CleanupObjectProgress;
};

export type CleanupJob = {
  jobId: number;
  jobUuid: string;
  status: CleanupJobStatus;
  tenantSlug: string;
  scopeHash: string;
  holdKind: string;
  approval: CleanupApproval;
  failureReason?: string;
  items: CleanupJobItem[];
  createdAt: string;
};

export type CleanupJobList = { jobs: CleanupJob[] };

/** The proof document the cleanup worker recorded; its fields are owned by the worker. */
export type CleanupJobProofDocument = { [field: string]: unknown };

/** A completed job's proof. Ingest answers 409 until the job completes. */
export type CleanupJobProof = { jobUuid: string; status: CleanupJobStatus; proof: CleanupJobProofDocument };

type WireAccount = Omit<IngestAccount, "roles" | "permissions" | "scopes"> & {
  roles: string[] | null;
  permissions: string[] | null;
  scopes?: string[] | null;
};
type WireMonitoringSummary = Record<string, number | undefined>;
type WireAlert = Omit<IngestMonitoringAlert, "severity"> & { type: IngestAlertSeverity };
type WireSystemSummary = {
  generatedAt: string;
  totals: WireMonitoringSummary;
  topTenants: SystemMonitoringTenant[] | null;
};
type WirePool = Omit<IngestDatabasePoolState, "writeStatements"> & { writeStatements: IngestTopStatement[] | null };
type WireSnapshot = Omit<IngestDiagnosticsSnapshot, "pipeline" | "database"> & {
  pipeline: IngestPipelineStage[] | null;
  database: { core: WirePool; raw: WirePool; bytesPerEvent: number };
};
type WirePlan = Omit<CleanupPlan, "items" | "scope"> & {
  items?: CleanupPlanItem[] | null;
  scope: Omit<CleanupPlanScope, "approvedS3Prefixes"> & { approvedS3Prefixes: string[] | null };
};
type WireJob = Omit<CleanupJob, "items" | "approval"> & {
  items: CleanupJobItem[] | null;
  approval: { Identity: string; ExpiresAt: string };
};

const cleanupJobsPath = "/cleanup/jobs";
const cleanupPlansPath = "/admin/cleanup/plans";

export class IngestOperationsClient {
  constructor(
    private readonly request: APIRequester,
    private readonly actingCompanySlug = "",
  ) {}

  // cleanupJobRequest sends a cleanup-job read or cancel, naming the configured acting
  // company in the only place those routes read a tenant from.
  private cleanupJobRequest<T>(method: string, path: string, options?: RequestOptions): Promise<T> {
    const headers: Record<string, string> = this.actingCompanySlug
      ? { [CLEANUP_EFFECTIVE_COMPANY_HEADER]: this.actingCompanySlug }
      : {};
    return this.request<T>(method, path, undefined, options, headers);
  }

  /** The signed-in principal, tenant, roles and scopes. */
  async account(options?: RequestOptions): Promise<IngestAccount> {
    const wire = await this.request<WireAccount>("GET", "/account/me", undefined, options);
    return { ...wire, roles: wire.roles ?? [], permissions: wire.permissions ?? [], scopes: wire.scopes ?? [] };
  }

  /** Replays up to 100 of the tenant's rejected events through validation. */
  async reprocess(options?: RequestOptions): Promise<IngestReprocessResult> {
    const wire = await this.request<
      Omit<IngestReprocessResult, "outcomes"> & { outcomes: IngestReprocessOutcome[] | null }
    >("POST", "/reprocess", undefined, options);
    return { ...wire, outcomes: wire.outcomes ?? [] };
  }

  async redactManagedAudit(
    body: ManagedAuditRedactionRequest,
    options?: RequestOptions,
  ): Promise<ManagedAuditRedactionResponse> {
    const wire = await this.request<
      Omit<ManagedAuditRedactionResponse, "results"> & { results: ManagedAuditRedactionResult[] | null }
    >("POST", "/managed-audit/redactions", body, options);
    return { ...wire, results: wire.results ?? [] };
  }

  async monitoringSummary(
    counters: IngestMonitoringCounters = "cached",
    options?: RequestOptions,
  ): Promise<IngestMonitoringSummary> {
    const query = counters === "measured" ? "?counters=measured" : "";
    const wire = await this.request<WireMonitoringSummary>("GET", `/monitoring/summary${query}`, undefined, options);
    return {
      ingestRequestsTotal: wire.ingest_requests_total ?? 0,
      ingestErrorsTotal: wire.ingest_errors_total ?? 0,
      eventSegmentsVerifiedRowsTotal: wire.event_segments_verified_rows_total ?? 0,
      rawEventsLandedTotal: wire.raw_events_landed_total ?? 0,
      rawStorageS3Total: wire.raw_storage_s3_total ?? 0,
      rawLandingS3UploadFailuresTotal: wire.raw_landing_s3_upload_failures_total ?? 0,
    };
  }

  async monitoringAlerts(options?: RequestOptions): Promise<IngestMonitoringAlertList> {
    const wire = await this.request<WireAlert[] | null>("GET", "/monitoring/alerts", undefined, options);
    return { alerts: (wire ?? []).map(({ type, ...alert }) => ({ ...alert, severity: type })) };
  }

  /** The platform-wide view. System administrators only. */
  async systemMonitoringSummary(options?: RequestOptions): Promise<SystemMonitoringSummary> {
    const wire = await this.request<WireSystemSummary>("GET", "/system/monitoring/summary", undefined, options);
    return {
      generatedAt: wire.generatedAt,
      totals: systemTotals(wire.totals ?? {}),
      topTenants: wire.topTenants ?? [],
    };
  }

  /** The data-path health snapshot, read through one of its section routes. System administrators only. */
  async diagnostics(
    section: IngestDiagnosticsSection = "ingest",
    options?: RequestOptions,
  ): Promise<IngestDiagnosticsSnapshot> {
    const wire = await this.request<WireSnapshot>("GET", `/diagnostics/${section}`, undefined, options);
    return {
      ...wire,
      pipeline: wire.pipeline ?? [],
      database: { ...wire.database, core: pool(wire.database.core), raw: pool(wire.database.raw) },
    };
  }

  /** Runs one retention cleanup pass for the tenant. */
  cleanup(options?: RequestOptions): Promise<IngestCleanupResult> {
    return this.request("POST", "/admin/cleanup", undefined, options);
  }

  /** Checks recent raw events against the accepted-landing ledger. */
  async checkIntegrity(options?: RequestOptions): Promise<IngestIntegrityResult> {
    const wire = await this.request<{ checkedCount: number; orphanedUUIDs: string[] | null }>(
      "POST",
      "/admin/integrity",
      undefined,
      options,
    );
    return { checkedCount: wire.checkedCount, orphanedUuids: wire.orphanedUUIDs ?? [] };
  }

  async listCleanupPlans(options?: RequestOptions): Promise<CleanupPlanList> {
    const wire = await this.request<{ plans: WirePlan[] | null }>("GET", cleanupPlansPath, undefined, options);
    return { plans: (wire.plans ?? []).map(cleanupPlan) };
  }

  async createCleanupPlan(body: CleanupPlanCreateRequest, options?: RequestOptions): Promise<CleanupPlan> {
    return cleanupPlan(await this.request<WirePlan>("POST", cleanupPlansPath, body, options));
  }

  async listCleanupJobs(options?: RequestOptions): Promise<CleanupJobList> {
    const wire = await this.cleanupJobRequest<{ jobs: WireJob[] | null }>("GET", cleanupJobsPath, options);
    return { jobs: (wire.jobs ?? []).map(cleanupJob) };
  }

  async createCleanupJob(body: CleanupJobCreateRequest, options?: RequestOptions): Promise<CleanupJob> {
    return cleanupJob(await this.request<WireJob>("POST", cleanupJobsPath, body, options));
  }

  async getCleanupJob(jobUuid: string, options?: RequestOptions): Promise<CleanupJob> {
    return cleanupJob(await this.cleanupJobRequest<WireJob>("GET", cleanupJobPath(jobUuid), options));
  }

  /** Cancels a job that has not started running and returns its state. */
  async cancelCleanupJob(jobUuid: string, options?: RequestOptions): Promise<CleanupJob> {
    return cleanupJob(await this.cleanupJobRequest<WireJob>("POST", cleanupJobPath(jobUuid), options));
  }

  getCleanupJobProof(jobUuid: string, options?: RequestOptions): Promise<CleanupJobProof> {
    return this.cleanupJobRequest("GET", `${cleanupJobPath(jobUuid)}/proof`, options);
  }
}

function cleanupJobPath(jobUuid: string): string {
  return `${cleanupJobsPath}/${encodeURIComponent(jobUuid)}`;
}

function systemTotals(wire: WireMonitoringSummary): SystemMonitoringTotals {
  return {
    ingestRequestsTotal: wire.ingest_requests_total ?? 0,
    ingestErrorsTotal: wire.ingest_errors_total ?? 0,
    rawEventsLandedTotal: wire.raw_events_landed_total ?? 0,
    rawLandingS3UploadFailuresTotal: wire.raw_landing_s3_upload_failures_total ?? 0,
    dataSafetyInvariantViolationsTotal: wire.data_safety_invariant_violations_total ?? 0,
    storageUsageCollectorLastSuccessTimestamp: wire.storage_usage_collector_last_success_timestamp ?? 0,
    claimBacklogCount: wire.claim_backlog_count ?? 0,
    claimBacklogOldestAgeSeconds: wire.claim_backlog_oldest_age_seconds ?? 0,
  };
}

function pool(wire: WirePool): IngestDatabasePoolState {
  return { ...wire, writeStatements: wire.writeStatements ?? [] };
}

function cleanupPlan(wire: WirePlan): CleanupPlan {
  return {
    ...wire,
    items: wire.items ?? [],
    scope: { ...wire.scope, approvedS3Prefixes: wire.scope.approvedS3Prefixes ?? [] },
  };
}

// Ingest serializes the approval without JSON tags, so its keys arrive capitalized.
function cleanupJob(wire: WireJob): CleanupJob {
  const { approval, ...job } = wire;
  return {
    ...job,
    items: wire.items ?? [],
    approval: { identity: approval.Identity, expiresAt: approval.ExpiresAt },
  };
}
