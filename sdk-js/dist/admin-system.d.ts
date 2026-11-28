/**
 * Platform operations: system status, background jobs, scheduled tasks and client bootstrap.
 * Everything here except the bootstrap is for system administrators.
 */
import type { RequestOptions } from "./index.js";
/** A stage's or the whole system's health. */
export type SystemHealthStatus = "healthy" | "degraded" | "failing" | "unknown";
export type DesiredStateDiagnostics = {
    backlog?: number;
    exhaustedTotal?: number;
    oldestPendingAgeSeconds?: number;
    terminalTotal?: number;
};
export type SystemStatusKpis = {
    backlogDepth?: number;
    claimBacklog?: number;
    claimBacklogOldestAgeSeconds?: number;
    desiredState?: DesiredStateDiagnostics;
    eventsPerMinute?: number;
    failedRawLandingObjects?: number;
    invariantViolations?: number;
    rawLandingUploadFailures?: number;
};
/** Ingest realm slots: declared, occupied and the reasons some cannot be used. */
export type SystemRealmCapacity = {
    declared: number;
    exhausted: boolean;
    observed: boolean;
    occupied: number;
    quarantined: number;
    reason?: string;
    unavailable: number;
};
export type SystemStageProgress = {
    classification?: string;
    depth?: number;
    drainRatePerSecond?: number;
    etaSeconds?: number;
    note?: string;
    retentionExpirySeconds?: number;
};
/** The raw signals a stage's status is derived from. Each is present only when observed. */
export type SystemStageSignals = {
    acceptedRawLandingFailed?: number;
    acceptedRawLandingPending?: number;
    acceptedRawLandingUploadFailures?: number;
    ackFloorStreamSequence?: number;
    ackPending?: number;
    ackPendingUtilization?: number;
    compactionBacklog?: number;
    compactionBacklogAgeSeconds?: number;
    consumerActive?: boolean;
    cpuLimitMilli?: number;
    cpuMilli?: number;
    deliveredStreamSequence?: number;
    healthProbeOk?: boolean;
    livenessFlapCount?: number;
    memoryLimitBytes?: number;
    memoryUsageBytes?: number;
    metricsProbeOk?: boolean;
    oomKillCount?: number;
    pending?: number;
    redelivered?: number;
    resourceMetricsOk?: boolean;
    restartCount?: number;
    retentionSecondsLeft?: number;
    rollupBacklog?: number;
    segmentPending?: number;
    slowConsumer?: boolean;
};
export type SystemStageStatus = {
    name: string;
    status: SystemHealthStatus;
    reason?: string;
    progress?: SystemStageProgress;
    signals?: SystemStageSignals;
};
export type SystemStorageStatus = {
    attributedStorageBytes: number;
    effectiveLimitBytes: number;
    measuredAt: string;
    percentUsed: number;
    retainedLogicalBytes: number;
    tenantCount: number;
};
export type OperationalStageSummary = {
    status: SystemHealthStatus;
    reason?: string;
};
/** The one-line answer: is data received, durable and queryable, and how deep is the backlog. */
export type OperationalSummary = {
    status: SystemHealthStatus;
    received: OperationalStageSummary;
    durable: OperationalStageSummary;
    queryable: OperationalStageSummary;
    backlog: {
        classification: string;
        depth: number;
    };
};
export type SystemTenantHotspot = {
    companySlug: string;
    companyName: string;
    attributedStorageBytes: number;
    effectiveLimitBytes: number;
    percentUsed: number;
    retainedLogicalBytes: number;
    warningState: string;
    claimQueued?: number;
    rankReason?: string;
    rejectedEvents?: number;
};
/** The aggregated system view. */
export type SystemStatus = {
    generatedAt: string;
    overallStatus: string;
    summary: OperationalSummary;
    kpis: SystemStatusKpis;
    realmCapacity: SystemRealmCapacity;
    storage: SystemStorageStatus;
    stages: SystemStageStatus[];
    topTenants: SystemTenantHotspot[];
};
/** A sanitized notification delivery retry category. */
export type JobOutboxRetryReason = "provider_transient" | "authentication_rejected" | "tls_failure" | "connection_failure" | "sender_rejected" | "recipient_rejected" | "unclassified_retry";
export type JobOutboxStatus = {
    name: string;
    pending: number;
    failed: number;
    /** The oldest pending delivery in the notification outbox, when available. */
    oldestPendingAt?: string;
    /** The latest retry category in the notification outbox, when available. */
    lastRetryReason?: JobOutboxRetryReason;
};
export type JobQueueCount = {
    queue: string;
    kind: string;
    state: string;
    count: number;
    oldestWaitingAt?: string;
};
export type FailedJob = {
    jobId: number;
    queue: string;
    kind: string;
    attempts: number;
    maxAttempts: number;
    failedAt: string;
};
/** Background job queues, outboxes and the most recent failures. */
export type JobStatusResponse = {
    queueCounts: JobQueueCount[];
    outboxes: JobOutboxStatus[];
    recentFailures: FailedJob[];
    realtimeEvents: number;
};
export type JobRetryReceipt = {
    jobId: number;
};
/** One run of a scheduled task. */
export type ScheduledTaskRunSummary = {
    runUuid: string;
    taskName: string;
    scheduledFor: string;
    startedAt?: string;
    completedAt?: string;
    durationMs: number;
    trigger: string;
    status: string;
    workerId?: string;
    failureReason?: string;
    itemsTotal: number;
    itemsCompleted: number;
    itemsFailed: number;
};
/** A run in a task detail, with the work counts the run proved. Each count is present only when non-zero. */
export type ScheduledTaskRunDetail = ScheduledTaskRunSummary & {
    jobsCompacted?: number;
    rowsCompacted?: number;
    bytesCompacted?: number;
    sourcesRetired?: number;
    bytesRetired?: number;
    regionalTrendReads?: number;
    regionalTrendItems?: number;
    regionalTrendFailures?: number;
    hackerNewsReads?: number;
    hackerNewsItems?: number;
    hackerNewsFailures?: number;
};
/** One durable scheduled task with its schedule, execution policy and current pressure. */
export type ScheduledTask = {
    taskName: string;
    displayName: string;
    description: string;
    ownerService: string;
    enabled: boolean;
    scheduleKind: string;
    scheduleExpression: string;
    timezone: string;
    nextRunAt?: string;
    overlapPolicy: string;
    lockBackend: string;
    timeoutSeconds: number;
    manualRunsAllowed: boolean;
    forceRunsAllowed: boolean;
    queuedRuns: number;
    runningRuns: number;
    failedRuns: number;
};
export type ScheduledTaskListItem = ScheduledTask & {
    latestRun?: ScheduledTaskRunSummary;
};
export type ScheduledTaskListResponse = {
    tasks: ScheduledTaskListItem[];
};
/** One task and its recent runs. */
export type ScheduledTaskDetail = {
    task: ScheduledTask & {
        latestRun?: ScheduledTaskRunDetail;
    };
    runs: ScheduledTaskRunDetail[];
};
/** A manual run. `force` asks to run despite the overlap policy where the task allows it. */
export type ScheduledTaskRunRequest = {
    force: boolean;
};
export type ScheduledTaskRunResponse = {
    run: ScheduledTaskRunSummary;
};
export type ClientBootstrapState = "ready" | "attention_required" | "suspended";
export type ClientBootstrapNextAction = {
    action: "none" | "poll" | "retry" | "rotate" | "escalate";
    maxRetries?: number;
    pollAfterSeconds?: number;
};
export type ClientBootstrapProvenance = {
    owner: string;
    generation?: string;
    sourceUrn?: string;
    watermark?: string;
};
export type ClientBootstrapWarning = {
    code: string;
    message: string;
};
/** Where the tenant's first-login bootstrap stands and what to do next. */
export type ClientBootstrapStatus = {
    tenantSlug: string;
    state: ClientBootstrapState;
    retryability: "none" | "bounded";
    nextAction: ClientBootstrapNextAction;
    observedAt: string;
    provenance: ClientBootstrapProvenance;
    warnings: ClientBootstrapWarning[];
};
export type ClientBootstrapProof = {
    kind: "dns_txt" | "email_link";
    value: string;
    observedAt: string;
};
export type ClientBootstrapSubmitRequest = {
    contactEmail?: string;
    note?: string;
    proofs?: ClientBootstrapProof[];
};
type AdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;
export declare class SystemAdminClient {
    private readonly request;
    constructor(request: AdminRequester);
    status(options?: RequestOptions): Promise<SystemStatus>;
    listJobs(options?: RequestOptions): Promise<JobStatusResponse>;
    /** Re-queues one failed job. */
    retryJob(jobId: number, options?: RequestOptions): Promise<JobRetryReceipt>;
    listScheduledTasks(options?: RequestOptions): Promise<ScheduledTaskListResponse>;
    getScheduledTask(taskName: string, options?: RequestOptions): Promise<ScheduledTaskDetail>;
    /** Triggers a run now. The server decides whether the task's overlap and force policy permits it. */
    runScheduledTask(taskName: string, body?: ScheduledTaskRunRequest, options?: RequestOptions): Promise<ScheduledTaskRunResponse>;
    /** Stops future runs. */
    pauseScheduledTask(taskName: string, options?: RequestOptions): Promise<void>;
    /** Re-enables future runs. */
    resumeScheduledTask(taskName: string, options?: RequestOptions): Promise<void>;
    /** Re-queues one failed run. */
    retryScheduledTaskRun(runUuid: string, options?: RequestOptions): Promise<ScheduledTaskRunResponse>;
    /** Reads the tenant's bootstrap state. */
    getBootstrap(options?: RequestOptions): Promise<ClientBootstrapStatus>;
    /** Submits bootstrap proofs and contact details. */
    submitBootstrap(body: ClientBootstrapSubmitRequest, options?: RequestOptions): Promise<ClientBootstrapStatus>;
}
export {};
