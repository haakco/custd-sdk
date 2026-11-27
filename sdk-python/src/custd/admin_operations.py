"""Platform and tenant operations on the admin API.

Background jobs, scheduled tasks and system status (``client.admin.system``), row-level security
reconciliation (``rls``), environment policy, SDK usage and deprecations, storage alert rules,
accounting evidence, event type and category settings, accepted raw-landing claims, tenant
desired-state manifests, error issues and managed audit provisioning. Calls that name a tenant
take its slug; the others act on the credential's own tenant.
"""

from __future__ import annotations

from typing import Any, Literal, NotRequired, TypedDict

from ._wire import decode, request, require_idempotency
from .admin_privacy import PrivacyRule
from .admin_reporting_packs import (
    AccountingContract,
    ActivationRule,
    ActivityRule,
    AssetHierarchy,
    DashboardInteractionRule,
    DashboardSharePolicy,
    ExecutiveReportDefinition,
    FlowRule,
    IdentitySelectors,
    ObservationContract,
    PackDimension,
    PackMetric,
    PackTemplate,
    PresentationPresetSelection,
    ProofProfile,
    RedactionRule,
    ReportSectionDefinition,
    RetentionRule,
    RollupRule,
    SourceReconciliation,
    TransitionRule,
    TrustDiagnostics,
    WidgetKind,
)
from .client import AdminClient, AdminRequestOptions, quote_path
from .reporting_types import CanonicalUnit, ReportingExportFormat

AccountingEvidenceKind = Literal["purchase", "balance", "correction"]
BrowserIdentityMode = Literal["cookieless", "extended"]
ErrorIssueSort = Literal["recent", "frequent"]
ErrorIssueState = Literal["open", "resolved", "ignored"]
ErrorIssueStateFilter = Literal["open", "resolved", "ignored", "all"]
RLSExecuteOutcome = Literal["attempted", "success", "failure"]
StorageAlertChannel = Literal["email", "webhook"]
SystemHealthStatus = Literal["healthy", "degraded", "failing", "unknown"]
TenantManifestOperationState = Literal["pending", "success", "failure", "unknown"]


class AccountingEvidence(TypedDict):
    actor: str
    auditCorrelationId: str
    balance: NotRequired[float]
    delta: NotRequired[float]
    effectiveAt: str
    id: str
    kind: AccountingEvidenceKind
    observedAt: str
    quantity: NotRequired[float]
    reason: str
    supersedesId: NotRequired[str]
    targetId: NotRequired[str]
    targetKind: NotRequired[AccountingEvidenceKind]
    tenantKey: str
    unit: CanonicalUnit


class AccountingEvidenceListResponse(TypedDict):
    evidence: list[AccountingEvidence]


class EnvironmentPolicyReason(TypedDict):
    code: str
    remedy: str
    summary: str


class EnvironmentPolicy(TypedDict):
    activeCount: int
    activeValueLimit: int
    activeValues: list[str]
    autoCreateEnvironments: bool
    definitionEnabled: bool
    definitionPresent: bool
    disabledValues: list[str]
    reasons: list[EnvironmentPolicyReason]


class EventCategoryConfig(TypedDict):
    isAudit: bool
    name: str
    retentionDays: int | None
    rollupDimensions: NotRequired[Any]
    slug: str


class EventCategoryConfigListResponse(TypedDict):
    eventCategories: list[EventCategoryConfig]


class EventTypeConfig(TypedDict):
    categoryIsAudit: bool
    categoryRetentionDays: int | None
    categorySlug: str
    name: str
    retentionDays: int | None
    rollupDimensions: NotRequired[Any]
    slug: str


class EventTypeConfigListResponse(TypedDict):
    eventTypes: list[EventTypeConfig]


class IngestClaim(TypedDict):
    byteCount: int
    claimAttempts: int
    claimExpiresAt: NotRequired[str]
    eventCount: int
    failedAt: NotRequired[str]
    failureClass: NotRequired[str]
    objectId: int
    objectUuid: str
    processedAt: NotRequired[str]
    processingState: str
    windowStart: str


class IngestClaimList(TypedDict):
    claims: list[IngestClaim]
    truncated: bool


class JobOutboxStatus(TypedDict):
    failed: int
    name: str
    pending: int


class JobQueueCount(TypedDict):
    count: int
    kind: str
    oldestWaitingAt: NotRequired[str]
    queue: str
    state: str


class FailedJob(TypedDict):
    attempts: int
    failedAt: str
    jobId: int
    kind: str
    maxAttempts: int
    queue: str


class JobStatusResponse(TypedDict):
    outboxes: list[JobOutboxStatus]
    queueCounts: list[JobQueueCount]
    realtimeEvents: int
    recentFailures: list[FailedJob]


class RLSPolicySpec(TypedDict):
    enabled: bool
    force: bool
    policy_name: str


class RLSPolicyDiff(TypedDict):
    converged: bool
    desired: RLSPolicySpec
    drift: NotRequired[list[str]]
    live: RLSPolicySpec
    table: str


class RLSProofResponse(TypedDict):
    after: dict[str, RLSPolicySpec]
    attempted_at: str
    before: dict[str, RLSPolicySpec]
    completed_at: str
    diff: list[RLSPolicyDiff]
    plan_uuid: str
    rollback_sql: str


class RLSTableDiff(TypedDict):
    classification: str
    desired: NotRequired[RLSPolicySpec]
    drift: bool
    live: NotRequired[RLSPolicySpec]
    reason: NotRequired[str]
    table: str


class RLSStatus(TypedDict):
    catalog_digest: str
    catalog_version: str
    tables: list[RLSTableDiff]


class ScheduledTaskListRunSummary(TypedDict):
    """The stable fields of a run, as a task list and a queued run report them."""

    completedAt: NotRequired[str]
    durationMs: int
    failureReason: NotRequired[str]
    itemsCompleted: int
    itemsFailed: int
    itemsTotal: int
    runUuid: str
    scheduledFor: str
    startedAt: NotRequired[str]
    status: str
    taskName: str
    trigger: str
    workerId: NotRequired[str]


class ScheduledTaskRunResponseSummary(ScheduledTaskListRunSummary):
    """The run a run-now or retry call queued."""


class ScheduledTaskRun(ScheduledTaskListRunSummary):
    """A run in a task's detail read, with the work counters only that read reports."""

    # Each counter is present only when non-zero.
    jobsCompacted: NotRequired[int]
    rowsCompacted: NotRequired[int]
    bytesCompacted: NotRequired[int]
    sourcesRetired: NotRequired[int]
    bytesRetired: NotRequired[int]
    regionalTrendReads: NotRequired[int]
    regionalTrendItems: NotRequired[int]
    regionalTrendFailures: NotRequired[int]
    hackerNewsReads: NotRequired[int]
    hackerNewsItems: NotRequired[int]
    hackerNewsFailures: NotRequired[int]


class _ScheduledTaskFields(TypedDict):
    description: str
    displayName: str
    enabled: bool
    failedRuns: int
    forceRunsAllowed: bool
    lockBackend: str
    manualRunsAllowed: bool
    nextRunAt: NotRequired[str]
    overlapPolicy: str
    ownerService: str
    queuedRuns: int
    runningRuns: int
    scheduleExpression: str
    scheduleKind: str
    taskName: str
    timeoutSeconds: int
    timezone: str


class ScheduledTaskListItem(_ScheduledTaskFields):
    """A task in the list view, whose latest run carries no work counters."""

    latestRun: NotRequired[ScheduledTaskListRunSummary]


class ScheduledTaskSummary(_ScheduledTaskFields):
    """A task in its detail read."""

    latestRun: NotRequired[ScheduledTaskRun]


class ScheduledTaskListResponse(TypedDict):
    tasks: list[ScheduledTaskListItem]


class ScheduledTaskDetailResponse(TypedDict):
    """One scheduled task with its recent runs."""

    task: ScheduledTaskSummary
    runs: list[ScheduledTaskRun]


class SDKVersionDeprecation(TypedDict):
    deprecatedAt: str
    markedBy: str
    note: str
    recommendedVersion: str
    sdk: str
    versionScope: str


class SDKUsageItem(TypedDict):
    deprecation: NotRequired[SDKVersionDeprecation]
    firstSeenAt: str
    lastSeenAt: str
    requests: int
    sdk: str
    state: str
    version: str


class SDKUsageListResponse(TypedDict):
    items: list[SDKUsageItem]


class StorageAlertEvaluation(TypedDict):
    breached: bool
    evaluatedAt: str
    firedAt: NotRequired[str]
    measuredValue: int


class StorageAlertRule(TypedDict):
    channel: StorageAlertChannel
    createdAt: str
    emailRecipient: NotRequired[str]
    enabled: bool
    evaluation: NotRequired[StorageAlertEvaluation]
    metric: str
    ruleId: str
    tenantSlug: str
    thresholdPercent: int
    updatedAt: str


class StorageAlertRuleListResponse(TypedDict):
    rules: list[StorageAlertRule]


class StorageAlertDelivery(TypedDict):
    error: NotRequired[str]
    state: str
    updatedAt: NotRequired[str]


class StorageAlertMeasurement(TypedDict):
    limitBytes: int
    measuredValue: int
    thresholdPercent: int
    warningState: str


class StorageAlertEvent(TypedDict):
    channel: StorageAlertChannel
    delivery: StorageAlertDelivery
    emailRecipient: NotRequired[str]
    eventId: str
    measurement: StorageAlertMeasurement
    metric: str
    ruleId: NotRequired[str]
    tenantSlug: str
    triggeredAt: str


class StorageAlertEventListResponse(TypedDict):
    events: list[StorageAlertEvent]


class SystemDesiredStateDiagnostics(TypedDict):
    backlog: NotRequired[int]
    exhaustedTotal: NotRequired[int]
    oldestPendingAgeSeconds: NotRequired[int]
    terminalTotal: NotRequired[int]


class SystemStatusKPIs(TypedDict):
    backlogDepth: NotRequired[int]
    claimBacklog: NotRequired[int]
    claimBacklogOldestAgeSeconds: NotRequired[int]
    desiredState: NotRequired[SystemDesiredStateDiagnostics]
    eventsPerMinute: NotRequired[float]
    failedRawLandingObjects: NotRequired[int]
    invariantViolations: NotRequired[int]
    rawLandingUploadFailures: NotRequired[int]


class SystemRealmCapacity(TypedDict):
    declared: int
    exhausted: bool
    observed: bool
    occupied: int
    quarantined: int
    reason: NotRequired[str]
    unavailable: int


class SystemStageProgress(TypedDict):
    classification: NotRequired[str]
    depth: NotRequired[int]
    drainRatePerSecond: NotRequired[float]
    etaSeconds: NotRequired[int]
    note: NotRequired[str]
    retentionExpirySeconds: NotRequired[int]


class SystemStageSignals(TypedDict):
    acceptedRawLandingFailed: NotRequired[int]
    acceptedRawLandingPending: NotRequired[int]
    acceptedRawLandingUploadFailures: NotRequired[int]
    ackFloorStreamSequence: NotRequired[int]
    ackPending: NotRequired[int]
    ackPendingUtilization: NotRequired[float]
    compactionBacklog: NotRequired[int]
    compactionBacklogAgeSeconds: NotRequired[int]
    consumerActive: NotRequired[bool]
    cpuLimitMilli: NotRequired[int]
    cpuMilli: NotRequired[int]
    deliveredStreamSequence: NotRequired[int]
    healthProbeOk: NotRequired[bool]
    livenessFlapCount: NotRequired[int]
    memoryLimitBytes: NotRequired[int]
    memoryUsageBytes: NotRequired[int]
    metricsProbeOk: NotRequired[bool]
    oomKillCount: NotRequired[int]
    pending: NotRequired[int]
    redelivered: NotRequired[int]
    resourceMetricsOk: NotRequired[bool]
    restartCount: NotRequired[int]
    retentionSecondsLeft: NotRequired[int]
    rollupBacklog: NotRequired[int]
    segmentPending: NotRequired[int]
    slowConsumer: NotRequired[bool]


class SystemStageStatus(TypedDict):
    name: str
    progress: NotRequired[SystemStageProgress]
    reason: NotRequired[str]
    signals: NotRequired[SystemStageSignals]
    status: SystemHealthStatus


class SystemStorageStatus(TypedDict):
    attributedStorageBytes: int
    effectiveLimitBytes: int
    measuredAt: str
    percentUsed: float
    retainedLogicalBytes: int
    tenantCount: int


class SystemOperationalBacklogSummary(TypedDict):
    classification: str
    depth: int


class SystemOperationalStageSummary(TypedDict):
    reason: NotRequired[str]
    status: SystemHealthStatus


class SystemOperationalSummary(TypedDict):
    backlog: SystemOperationalBacklogSummary
    durable: SystemOperationalStageSummary
    queryable: SystemOperationalStageSummary
    received: SystemOperationalStageSummary
    status: SystemHealthStatus


class SystemTenantHotspot(TypedDict):
    attributedStorageBytes: int
    claimQueued: NotRequired[int]
    companyName: str
    companySlug: str
    effectiveLimitBytes: int
    percentUsed: float
    rankReason: NotRequired[str]
    rejectedEvents: NotRequired[int]
    retainedLogicalBytes: int
    warningState: str


class SystemStatusResponse(TypedDict):
    generatedAt: str
    kpis: SystemStatusKPIs
    overallStatus: str
    realmCapacity: SystemRealmCapacity
    stages: list[SystemStageStatus]
    storage: SystemStorageStatus
    summary: SystemOperationalSummary
    topTenants: list[SystemTenantHotspot]


class TenantManifestResourceStatus(TypedDict):
    detail: NotRequired[str]
    key: str
    kind: str
    ready: bool
    safeNextAction: str
    safeNextActionCode: str
    state: str


class TenantManifestRetryFailure(TypedDict):
    code: str
    observedAt: str
    resources: list[TenantManifestResourceStatus]


class TenantManifestPendingOperation(TypedDict):
    lastFailure: NotRequired[TenantManifestRetryFailure]
    nextAttemptAt: str


class TenantManifestOperationStatus(TypedDict):
    attemptCount: int
    completedAt: NotRequired[str]
    createdAt: str
    errorCode: NotRequired[str]
    idempotencyKey: str
    leaseExpiresAt: NotRequired[str]
    pending: NotRequired[TenantManifestPendingOperation]
    state: TenantManifestOperationState
    updatedAt: str
    uuid: str


class TenantManifestReadinessResponse(TypedDict):
    manifestDigest: str
    observedAt: str
    operation: NotRequired[TenantManifestOperationStatus]
    ready: bool
    resources: list[TenantManifestResourceStatus]
    safeNextAction: str
    safeNextActionCode: str
    state: str
    tenantSlug: str


class ErrorIssue(TypedDict):
    culprit: str
    environments: list[str]
    eventCount: int
    exceptionType: str
    fingerprint: str
    firstRelease: str
    firstSeenAt: str
    lastRelease: str
    lastSeenAt: str
    platform: str
    regressedAt: NotRequired[str]
    resolvedAt: NotRequired[str]
    resolvedRelease: NotRequired[str]
    siteName: str
    siteUuid: str
    state: ErrorIssueState
    title: str
    uuid: str


class ErrorIssueListResponse(TypedDict):
    issues: list[ErrorIssue]
    nextCursor: NotRequired[str]
    openCount: int


class ErrorIssueFrame(TypedDict):
    column: NotRequired[int]
    contextLine: NotRequired[str]
    filename: NotRequired[str]
    function: NotRequired[str]
    inApp: NotRequired[bool]
    line: NotRequired[int]
    module: NotRequired[str]
    postContext: NotRequired[list[str]]
    preContext: NotRequired[list[str]]


class ErrorIssueException(TypedDict):
    frames: NotRequired[list[ErrorIssueFrame]]
    framesOmitted: NotRequired[int]
    handled: NotRequired[bool]
    module: NotRequired[str]
    type: str
    value: NotRequired[str]


class ErrorIssueEvent(TypedDict):
    correlationId: NotRequired[str]
    environment: NotRequired[str]
    exceptions: list[ErrorIssueException]
    fingerprint: str
    level: NotRequired[str]
    platform: NotRequired[str]
    release: NotRequired[str]
    runtimeName: NotRequired[str]
    runtimeVersion: NotRequired[str]
    sdkName: NotRequired[str]
    sdkVersion: NotRequired[str]
    siteUuid: NotRequired[str]
    truncated: NotRequired[bool]


class ErrorIssueDetail(TypedDict):
    companyName: NotRequired[str]
    issue: ErrorIssue
    latestEvent: ErrorIssueEvent
    latestEventUuid: str


class PublicSiteConfig(TypedDict):
    allowedOrigins: list[str]
    environment: str
    identityMode: BrowserIdentityMode
    pageViewSchemaVersion: NotRequired[str]
    siteUuid: str


class EnvironmentPolicyUpdateRequest(TypedDict):
    autoCreateEnvironments: bool | None


class EventRollupDimension(TypedDict):
    lookups: list[str]
    slot: str


class RollupDimensionProfile(TypedDict):
    dimensions: NotRequired[list[EventRollupDimension]]


class EventCategoryConfigUpdateRequest(TypedDict):
    isAudit: bool
    retentionDays: int | None
    rollupDimensions: NotRequired[RollupDimensionProfile]


class EventTypeConfigUpdateRequest(TypedDict):
    retentionDays: int | None
    rollupDimensions: NotRequired[RollupDimensionProfile]


class AdminSiteIngestTarget(TypedDict):
    resourceCode: NotRequired[str]
    resourceUuid: str
    scopeCode: NotRequired[str]
    scopeUuid: str


class AdminSiteUpdate(TypedDict):
    allowedEnvironments: NotRequired[list[str]]
    allowedOrigins: list[str]
    environment: str
    identityMode: BrowserIdentityMode
    ingestTarget: NotRequired[AdminSiteIngestTarget]


class AdminSite(TypedDict):
    allowedEnvironments: list[str]
    allowedOrigins: list[str]
    companySlug: str
    enabled: bool
    environment: str
    identityMode: BrowserIdentityMode
    ingestTarget: NotRequired[AdminSiteIngestTarget]
    name: str
    rateLimitPerMinute: int
    retentionDays: int
    siteUuid: str


class AdminSiteCreateRequest(TypedDict):
    companySlug: str
    name: str
    environment: str
    identityMode: str
    allowedOrigins: list[str]
    ingestTarget: AdminSiteIngestTarget
    allowedEnvironments: NotRequired[list[str]]
    rateLimitPerMinute: NotRequired[int]
    retentionDays: NotRequired[int]


class AdminSiteCreateResponse(TypedDict):
    """A new site with its write key, which only create and rotate-write-key return."""

    siteUuid: str
    companySlug: str
    name: str
    environment: str
    allowedEnvironments: list[str]
    allowedOrigins: list[str]
    identityMode: BrowserIdentityMode
    enabled: bool
    rateLimitPerMinute: int
    retentionDays: int
    writeKey: str
    ingestTarget: NotRequired[AdminSiteIngestTarget]


class AdminSiteWriteKey(TypedDict):
    """A site's replacement write key."""

    writeKey: str


class AdminSiteListResponse(TypedDict):
    sites: list[AdminSite]


class AccountingEvidenceCreateRequest(TypedDict):
    auditCorrelationId: str
    balance: NotRequired[float]
    delta: NotRequired[float]
    effectiveAt: str
    id: str
    kind: AccountingEvidenceKind
    observedAt: str
    quantity: NotRequired[float]
    reason: str
    supersedesId: NotRequired[str]
    targetId: NotRequired[str]
    targetKind: NotRequired[AccountingEvidenceKind]
    unit: CanonicalUnit


class AccountingEvidenceResponse(TypedDict):
    evidence: AccountingEvidence


class IngestClaimTerminalRequest(TypedDict):
    failureClass: str


class JobRetryReceipt(TypedDict):
    jobId: int


class RLSPlanRequest(TypedDict):
    expires_in_seconds: NotRequired[int]
    git_commit: str
    label: str


class RLSPlan(TypedDict):
    actor_id: str
    catalog_digest: str
    catalog_version: str
    created_at: str
    expected_state: Any
    expires_at: str
    git_commit: str
    idempotency_key: str
    label: str
    plan_uuid: str
    reversible_sql_digest: str
    target_tables: list[str]


class RLSExecuteRequest(TypedDict):
    force: NotRequired[bool]


class RLSExecuteResponse(TypedDict):
    diff: list[RLSPolicyDiff]
    finished_at: str
    outcome: RLSExecuteOutcome
    plan_uuid: str
    rollback_sql: str
    started_at: str


class ScheduledTaskRunRequest(TypedDict):
    force: bool


class ScheduledTaskRunResponse(TypedDict):
    run: ScheduledTaskRunResponseSummary


class StorageAlertRuleCreateRequest(TypedDict):
    channel: StorageAlertChannel
    emailRecipient: str
    enabled: bool
    metric: str
    thresholdPercent: int


class ErrorIssueStateRequest(TypedDict):
    state: ErrorIssueState


class SDKVersionDeprecationRequest(TypedDict):
    note: str
    recommendedVersion: str


class TenantManifestEventType(TypedDict):
    eventTypeSlug: str
    rollupDimensions: RollupDimensionProfile


class TenantManifestOAuthClient(TypedDict):
    clientId: str
    environment: NotRequired[str]
    name: NotRequired[str]
    purposeProfile: str


class TenantManifestPrivacy(TypedDict):
    applyMode: NotRequired[str]
    enabled: bool
    rules: NotRequired[list[PrivacyRule]]


class WidgetDefinition(TypedDict):
    dimensions: NotRequired[list[str]]
    key: str
    kind: WidgetKind
    metrics: list[str]
    presentation: NotRequired[PresentationPresetSelection]
    template: str
    title: str


class DashboardDefinition(TypedDict):
    defaultRange: str
    description: NotRequired[str]
    executive: NotRequired[ExecutiveReportDefinition]
    exportFormats: NotRequired[list[ReportingExportFormat]]
    group: NotRequired[str]
    interactions: NotRequired[list[DashboardInteractionRule]]
    key: str
    packKey: NotRequired[str]
    refreshSeconds: int
    requiredScopes: list[str]
    sections: NotRequired[list[ReportSectionDefinition]]
    sharePolicy: NotRequired[DashboardSharePolicy]
    title: str
    widgets: list[WidgetDefinition]


class Pack(TypedDict):
    accounting: NotRequired[AccountingContract]
    activationRules: NotRequired[list[ActivationRule]]
    activityRules: NotRequired[list[ActivityRule]]
    assetHierarchy: NotRequired[AssetHierarchy]
    dashboards: NotRequired[list[DashboardDefinition]]
    dimensions: list[PackDimension]
    displayName: str
    enabled: bool
    eventTypes: list[str]
    exportFormats: NotRequired[list[ReportingExportFormat]]
    flowRules: NotRequired[list[FlowRule]]
    identity: NotRequired[IdentitySelectors]
    key: str
    metrics: list[PackMetric]
    observation: NotRequired[ObservationContract]
    owner: str
    proof: ProofProfile
    reconciliations: NotRequired[list[SourceReconciliation]]
    redactionRules: NotRequired[list[RedactionRule]]
    retentionRules: NotRequired[list[RetentionRule]]
    rollupRules: NotRequired[list[RollupRule]]
    templates: list[PackTemplate]
    transitionRules: NotRequired[list[TransitionRule]]
    trust: TrustDiagnostics
    version: int


class TenantManifestReportingPack(TypedDict):
    definition: Pack
    expectedRevision: NotRequired[int]


class TenantManifestRetention(TypedDict):
    classes: list[str]
    maxAgeDays: int


class TenantManifestSchema(TypedDict):
    dialect: NotRequired[str]
    enabled: bool
    eventTypeSlug: str
    schemaJson: Any
    version: str


class TenantManifest(TypedDict):
    eventTypeConfigs: NotRequired[list[TenantManifestEventType]]
    oauthClients: NotRequired[list[TenantManifestOAuthClient]]
    privacy: NotRequired[TenantManifestPrivacy]
    reportingPacks: NotRequired[list[TenantManifestReportingPack]]
    retention: NotRequired[TenantManifestRetention]
    schemas: NotRequired[list[TenantManifestSchema]]


class TenantManifestApplyResponse(TypedDict):
    manifestDigest: str
    observedAt: str
    operation: NotRequired[TenantManifestOperationStatus]
    ready: bool
    resources: list[TenantManifestResourceStatus]
    safeNextAction: str
    safeNextActionCode: str
    state: str
    tenantSlug: str


class SDKUsageAdminClient:
    """Reads which SDK versions call the platform and marks versions deprecated."""

    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin

    def delete_deprecation(self, sdk: str, version_scope: str) -> None:
        """Clear an SDK version deprecation."""
        request(
            self._admin, "DELETE", f"/api/v1/admin/sdk-usage/deprecations/{quote_path(sdk)}/{quote_path(version_scope)}"
        )

    def list(self) -> SDKUsageListResponse:
        """List SDK usage."""
        return decode(SDKUsageListResponse, request(self._admin, "GET", "/api/v1/admin/sdk-usage"))

    def put_deprecation(
        self, sdk: str, version_scope: str, body: SDKVersionDeprecationRequest
    ) -> SDKVersionDeprecation:
        """Mark an SDK version deprecated."""
        return decode(
            SDKVersionDeprecation,
            request(
                self._admin,
                "PUT",
                f"/api/v1/admin/sdk-usage/deprecations/{quote_path(sdk)}/{quote_path(version_scope)}",
                body=dict(body),
            ),
        )


class StorageAlertAdminClient:
    """Manages a tenant's storage alert rules and reads the alerts they raised."""

    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin

    def delete_rule(self, tenant_slug: str, rule_id: str) -> None:
        """Delete a tenant storage alert rule."""
        request(self._admin, "DELETE", f"/api/v1/admin/storage/alerts/{quote_path(tenant_slug)}/{quote_path(rule_id)}")

    def list_rules(self, tenant_slug: str) -> StorageAlertRuleListResponse:
        """List a tenant's storage alert rules."""
        return decode(
            StorageAlertRuleListResponse,
            request(self._admin, "GET", f"/api/v1/admin/storage/alerts/{quote_path(tenant_slug)}"),
        )

    def list_events(self, tenant_slug: str) -> StorageAlertEventListResponse:
        """List recent storage alert events for a tenant."""
        return decode(
            StorageAlertEventListResponse,
            request(self._admin, "GET", f"/api/v1/admin/storage/alerts/{quote_path(tenant_slug)}/events"),
        )

    def create_rule(self, tenant_slug: str, body: StorageAlertRuleCreateRequest) -> StorageAlertRule:
        """Create a tenant storage alert rule."""
        return decode(
            StorageAlertRule,
            request(self._admin, "POST", f"/api/v1/admin/storage/alerts/{quote_path(tenant_slug)}", body=dict(body)),
        )


class AccountingEvidenceAdminClient:
    """Appends and lists the tenant's accounting evidence."""

    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin

    def list(self, *, as_of: str | None = None, limit: int | None = None) -> AccountingEvidenceListResponse:
        """List tenant accounting evidence."""
        return decode(
            AccountingEvidenceListResponse,
            request(self._admin, "GET", "/api/v1/admin/accounting/evidence", query={"asOf": as_of, "limit": limit}),
        )

    def create(self, body: AccountingEvidenceCreateRequest) -> AccountingEvidenceResponse:
        """Append tenant accounting evidence."""
        return decode(
            AccountingEvidenceResponse,
            request(self._admin, "POST", "/api/v1/admin/accounting/evidence", body=dict(body)),
        )


class EnvironmentPolicyAdminClient:
    """Reads and changes the tenant's environment label policy."""

    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin

    def get(self, *, company_slug: str | None = None) -> EnvironmentPolicy:
        """Get the environment policy."""
        return decode(
            EnvironmentPolicy,
            request(self._admin, "GET", "/api/v1/admin/environment-policy", query={"companySlug": company_slug}),
        )

    def update(self, body: EnvironmentPolicyUpdateRequest, *, company_slug: str | None = None) -> EnvironmentPolicy:
        """Update the environment policy."""
        return decode(
            EnvironmentPolicy,
            request(
                self._admin,
                "PATCH",
                "/api/v1/admin/environment-policy",
                query={"companySlug": company_slug},
                body=dict(body),
            ),
        )


class EventTypeAdminClient:
    """Reads and changes event type and event category settings."""

    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin

    def list_categories(self) -> EventCategoryConfigListResponse:
        """List event categories."""
        return decode(EventCategoryConfigListResponse, request(self._admin, "GET", "/api/v1/admin/event-categories"))

    def list(self) -> EventTypeConfigListResponse:
        """List event types."""
        return decode(EventTypeConfigListResponse, request(self._admin, "GET", "/api/v1/admin/event-types"))

    def update_category(self, slug: str, body: EventCategoryConfigUpdateRequest) -> None:
        """Update event category."""
        request(self._admin, "PATCH", f"/api/v1/admin/event-categories/{quote_path(slug)}", body=dict(body))

    def update(self, slug: str, body: EventTypeConfigUpdateRequest) -> None:
        """Update event type."""
        request(self._admin, "PATCH", f"/api/v1/admin/event-types/{quote_path(slug)}", body=dict(body))


class IngestClaimAdminClient:
    """Inspects and repairs accepted raw-landing claims."""

    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin

    def list(self, tenant_slug: str, *, limit: int | None = None) -> IngestClaimList:
        """List accepted raw-landing claims."""
        return decode(
            IngestClaimList,
            request(
                self._admin, "GET", f"/api/v1/admin/ingest/claims/{quote_path(tenant_slug)}", query={"limit": limit}
            ),
        )

    def retry(self, tenant_slug: str, object_uuid: str) -> IngestClaim:
        """Retry an accepted raw-landing claim."""
        return decode(
            IngestClaim,
            request(
                self._admin,
                "POST",
                f"/api/v1/admin/ingest/claims/{quote_path(tenant_slug)}/{quote_path(object_uuid)}/retry",
            ),
        )

    def mark_terminal(self, tenant_slug: str, object_uuid: str, body: IngestClaimTerminalRequest) -> IngestClaim:
        """Terminally classify an accepted raw-landing claim."""
        return decode(
            IngestClaim,
            request(
                self._admin,
                "POST",
                f"/api/v1/admin/ingest/claims/{quote_path(tenant_slug)}/{quote_path(object_uuid)}/terminal",
                body=dict(body),
            ),
        )


class SystemAdminClient:
    """Platform operations: background jobs, scheduled tasks and the system status view."""

    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin

    def list_jobs(self) -> JobStatusResponse:
        """List job and outbox status."""
        return decode(JobStatusResponse, request(self._admin, "GET", "/api/v1/admin/jobs"))

    def list_scheduled_tasks(self) -> ScheduledTaskListResponse:
        """List scheduled tasks."""
        return decode(ScheduledTaskListResponse, request(self._admin, "GET", "/api/v1/admin/scheduled-tasks"))

    def get_scheduled_task(self, task_name: str) -> ScheduledTaskDetailResponse:
        """Get one scheduled task with its recent runs."""
        path = f"/api/v1/admin/scheduled-tasks/{quote_path(task_name)}"
        return decode(ScheduledTaskDetailResponse, request(self._admin, "GET", path))

    def status(self) -> SystemStatusResponse:
        """Get system status."""
        return decode(SystemStatusResponse, request(self._admin, "GET", "/api/v1/admin/system/status"))

    def retry_job(self, job_id: int) -> JobRetryReceipt:
        """Retry a discarded job."""
        return decode(JobRetryReceipt, request(self._admin, "POST", f"/api/v1/admin/jobs/{job_id}/retry"))

    def retry_scheduled_task_run(self, run_uuid: str) -> ScheduledTaskRunResponse:
        """Retry a scheduled task run and return the run it queued."""
        path = f"/api/v1/admin/scheduled-task-runs/{quote_path(run_uuid)}/retry"
        return decode(ScheduledTaskRunResponse, request(self._admin, "POST", path))

    def pause_scheduled_task(self, task_name: str) -> None:
        """Pause scheduled task."""
        request(self._admin, "POST", f"/api/v1/admin/scheduled-tasks/{quote_path(task_name)}/pause")

    def resume_scheduled_task(self, task_name: str) -> None:
        """Resume scheduled task."""
        request(self._admin, "POST", f"/api/v1/admin/scheduled-tasks/{quote_path(task_name)}/resume")

    def run_scheduled_task(self, task_name: str, body: ScheduledTaskRunRequest) -> ScheduledTaskRunResponse:
        """Run scheduled task now."""
        return decode(
            ScheduledTaskRunResponse,
            request(self._admin, "POST", f"/api/v1/admin/scheduled-tasks/{quote_path(task_name)}/run", body=dict(body)),
        )


class RLSAdminClient:
    """Reports the row-level security catalog and reconciles it through reviewed plans."""

    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin

    def get_plan_proof(self, plan_uuid: str) -> RLSProofResponse:
        """Get an RLS reconciliation plan proof."""
        return decode(
            RLSProofResponse,
            request(self._admin, "GET", f"/api/v1/admin/rls/reconciliation-plans/{quote_path(plan_uuid)}/proof"),
        )

    def status(self) -> RLSStatus:
        """Get RLS catalog status."""
        return decode(RLSStatus, request(self._admin, "GET", "/api/v1/admin/rls/status"))

    def create_plan(self, body: RLSPlanRequest) -> RLSPlan:
        """Create an RLS reconciliation plan."""
        return decode(RLSPlan, request(self._admin, "POST", "/api/v1/admin/rls/reconciliation-plans", body=dict(body)))

    def execute_plan(self, plan_uuid: str, body: RLSExecuteRequest, options: AdminRequestOptions) -> RLSExecuteResponse:
        """Execute an RLS reconciliation plan."""
        return decode(
            RLSExecuteResponse,
            request(
                self._admin,
                "POST",
                f"/api/v1/admin/rls/reconciliation-plans/{quote_path(plan_uuid)}/execute",
                body=dict(body),
                options=require_idempotency(options),
            ),
        )


class TenantManifestAdminClient:
    """Applies a tenant's desired state and reports its readiness."""

    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin

    def readiness(self, tenant_slug: str) -> TenantManifestReadinessResponse:
        """Read tenant desired-state readiness."""
        return decode(
            TenantManifestReadinessResponse,
            request(self._admin, "GET", f"/api/v1/admin/tenant-manifest/{quote_path(tenant_slug)}/readiness"),
        )

    def apply(
        self, tenant_slug: str, body: TenantManifest, options: AdminRequestOptions
    ) -> TenantManifestApplyResponse:
        """Apply tenant desired state."""
        return decode(
            TenantManifestApplyResponse,
            request(
                self._admin,
                "PUT",
                f"/api/v1/admin/tenant-manifest/{quote_path(tenant_slug)}",
                body=dict(body),
                options=require_idempotency(options),
            ),
        )


class ErrorIssueAdminClient:
    """Reads a tenant's grouped error issues and changes their state."""

    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin

    def list(
        self,
        *,
        company_slug: str | None = None,
        site_uuid: str | None = None,
        state: ErrorIssueStateFilter | None = None,
        sort: ErrorIssueSort | None = None,
        limit: int | None = None,
        cursor: str | None = None,
    ) -> ErrorIssueListResponse:
        """List a tenant's error issues."""
        return decode(
            ErrorIssueListResponse,
            request(
                self._admin,
                "GET",
                "/api/v1/error-issues",
                query={
                    "companySlug": company_slug,
                    "siteUuid": site_uuid,
                    "state": state,
                    "sort": sort,
                    "limit": limit,
                    "cursor": cursor,
                },
            ),
        )

    def get(self, issue_uuid: str, *, company_slug: str | None = None) -> ErrorIssueDetail:
        """Get one error issue with its latest error."""
        return decode(
            ErrorIssueDetail,
            request(
                self._admin,
                "GET",
                f"/api/v1/error-issues/{quote_path(issue_uuid)}",
                query={"companySlug": company_slug},
            ),
        )

    def set_state(
        self, issue_uuid: str, body: ErrorIssueStateRequest, *, company_slug: str | None = None
    ) -> ErrorIssue:
        """Resolve, ignore or reopen an error issue."""
        return decode(
            ErrorIssue,
            request(
                self._admin,
                "POST",
                f"/api/v1/error-issues/{quote_path(issue_uuid)}/state",
                query={"companySlug": company_slug},
                body=dict(body),
            ),
        )


class ManagedAuditAdminClient:
    """Provisions the tenant's managed audit producer."""

    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin

    def provision_producer(self) -> None:
        """Provision managed audit producer."""
        request(self._admin, "POST", "/api/v1/managed-audit/provision")
