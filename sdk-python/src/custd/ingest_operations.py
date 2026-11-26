"""Ingest-api operations beside event sending.

``client.admin.ingest`` reprocesses and redacts stored events, reads monitoring and data-path
diagnostics, runs the legacy cleanup and integrity checks, and plans and runs scoped
generated-data cleanup jobs. ``client.admin.get_account`` reads the caller's account document.

The module functions are the credential-free collector routes: ``collect_event`` and
``collect_events`` send browser events with a Site's public write key, ``ErrorCaptureClient``
relays allowlisted error metadata to the Sentry-compatible envelope route, and
``read_shared_site_report`` and ``read_auth_domain_monitoring_inventory`` read with a share token
or a monitoring key as their only authority.
"""

from __future__ import annotations

import json
import re
import uuid
from datetime import UTC, datetime
from typing import Any, Literal, NotRequired, TypedDict, cast

from ._wire import answer, decode, request
from .admin_site_insights import SiteReport
from .client import (
    AdminClient,
    AdminTransport,
    EventEnvelope,
    RequestError,
    ValidationError,
    apply_environment_label,
    assert_secure_or_local_http,
    default_admin_transport,
    prepare_event,
    quote_path,
    validate_event,
)
from .version import IDENTITY, VERSION

# IngestDiagnosticsSection names one route of the ingest diagnostics snapshot. Every section
# answers the same whole snapshot.
IngestDiagnosticsSection = Literal["ingest", "buffers", "database", "segments", "reporting"]
INGEST_DIAGNOSTICS_SECTIONS: tuple[IngestDiagnosticsSection, ...] = (
    "ingest",
    "buffers",
    "database",
    "segments",
    "reporting",
)

AUTH_DOMAIN_MONITORING_KEY_HEADER = "X-Custd-Auth-Domain-Monitoring-Key"
EFFECTIVE_COMPANY_HEADER = "X-Custd-Effective-Company"
DEFAULT_PUBLIC_TIMEOUT_SECONDS = 15.0
MAX_COLLECT_BATCH = 1000


class Account(TypedDict):
    companySlug: str
    effectiveCompanySlug: NotRequired[str]
    email: str
    roles: list[str]
    permissions: list[str]


class IngestCleanupResult(TypedDict):
    deletedRaw: int
    deletedEvents: int
    deletedRejected: int


class IngestIntegrityResult(TypedDict):
    checkedCount: int
    orphanedUUIDs: list[str]


IngestStatusCounts = TypedDict(
    "IngestStatusCounts",
    {
        "2xx": int,
        "4xx": int,
        "5xx": int,
    },
)


class IngestDiagnosticsIngestState(TypedDict):
    available: bool
    requestRatePerSecond: float
    statusCounts: IngestStatusCounts
    p95LatencyMs: float
    activeRequests: int


class IngestJetStreamCluster(TypedDict):
    replicaCount: int
    leader: NotRequired[str]
    replicated: bool
    allReplicasCurrent: bool


class IngestJetStreamStreamState(TypedDict):
    messages: int
    bytes: int
    subjects: int
    cluster: IngestJetStreamCluster


class IngestJetStreamConsumerState(TypedDict):
    numWaiting: int
    maxAckPending: int
    ackPendingUtilization: float
    slowConsumer: bool
    deliveredStreamSequence: int
    deliveredConsumerSequence: int
    ackFloorStreamSequence: int
    ackFloorConsumerSequence: int
    sequenceGap: int


class IngestJetStreamState(TypedDict):
    available: bool
    stream: NotRequired[str]
    consumer: NotRequired[str]
    pending: int
    ackPending: int
    redelivered: int
    consumerActive: bool
    retentionSecondsLeft: int
    streamState: IngestJetStreamStreamState
    consumerState: IngestJetStreamConsumerState


class IngestSegmentState(TypedDict):
    available: bool
    pending: int
    verified: int
    failed: int
    oldestPendingAgeSeconds: int
    compactedVerified: int
    compactedFailed: int
    rollupVerified: int
    rollupFailed: int
    compactionEligibleSources: int
    compactionEstimatedObjectReduction: int


class IngestRollupSchedulerState(TypedDict):
    intervalSeconds: int
    nextRunAt: str
    leaderWorkerId: str
    queuedRuns: int
    runningRuns: int
    failedRuns: int
    queuedJobs: int
    claimedJobs: int
    failedJobs: int
    latestRunStatus: str


class IngestWorkerState(TypedDict):
    available: bool
    enabled: bool
    backlog: int
    lagSeconds: int
    failed: int
    lastSuccessUnix: int
    lastFailureUnix: int
    lastFailureReason: str
    scheduler: NotRequired[IngestRollupSchedulerState]


class IngestObjectStorageState(TypedDict):
    available: bool
    acceptedRawLandingPending: int
    acceptedRawLandingOldestPendingAgeSeconds: int
    acceptedRawLandingWritingLeases: int
    acceptedRawLandingFailedObjects: int
    acceptedRawLandingConsolidationEligibleWindows: int
    acceptedRawLandingConsolidationSourceObjects: int
    acceptedRawLandingConsolidationEstimatedObjectReduction: int
    acceptedRawLandingS3UploadFailuresTotal: int
    acceptedRawLandingObjectGroupsPerSecond: float
    acceptedRawLandingUploadDurationMs: float
    acceptedRawLandingVerificationDurationMs: float
    acceptedRawLandingDBMetadataDurationMs: float
    acceptedRawLandingObjectGroupSizeAverage: float
    acceptedRawLandingObjectGroupSizeMax: float
    acceptedRawLandingObjectLimiterSaturation: float


class IngestBufferState(TypedDict):
    jetstream: IngestJetStreamState
    segments: IngestSegmentState
    compaction: IngestWorkerState
    rollups: IngestWorkerState
    s3: IngestObjectStorageState


class IngestTopStatement(TypedDict):
    query: str
    calls: int
    totalExecMs: float
    meanExecMs: float
    rowsReturned: int
    walBytes: int


class IngestWaitEvent(TypedDict):
    type: str
    event: str
    count: int


class IngestTableSize(TypedDict):
    tableName: str
    rowEstimate: int
    totalBytes: int
    tableBytes: int
    indexBytes: int


class IngestDatabasePoolState(TypedDict):
    available: bool
    active: int
    waiting: int
    walBytes: int
    topStatements: NotRequired[list[IngestTopStatement]]
    writeStatements: list[IngestTopStatement]
    waitEvents: NotRequired[list[IngestWaitEvent]]
    tableSizes: NotRequired[list[IngestTableSize]]


class IngestDatabaseState(TypedDict):
    core: IngestDatabasePoolState
    raw: IngestDatabasePoolState
    bytesPerEvent: int


class IngestReportingState(TypedDict):
    available: bool
    freshSource: str
    archiveSource: str
    missingWindows: int


class IngestSilentDropState(TypedDict):
    dropRatePerSecond: float


class IngestStageProgress(TypedDict):
    classification: str
    depth: int
    drainRatePerSecond: NotRequired[float]
    etaSeconds: NotRequired[int]
    retentionExpirySeconds: NotRequired[int]
    note: NotRequired[str]


class IngestPipelineStage(TypedDict):
    name: str
    status: str
    headline: str
    detailKey: str
    progress: NotRequired[IngestStageProgress]


class IngestDiagnosticsSnapshot(TypedDict):
    status: str
    generatedAt: str
    ingest: IngestDiagnosticsIngestState
    buffers: IngestBufferState
    database: IngestDatabaseState
    segments: IngestSegmentState
    reporting: IngestReportingState
    silentDrops: IngestSilentDropState
    pipeline: list[IngestPipelineStage]


class ManagedAuditRedactionEvent(TypedDict):
    selectors: dict[str, str]
    fields: list[str]


class ManagedAuditRedactionRequest(TypedDict):
    sourceSystem: str
    redactionId: str
    reason: str
    events: list[ManagedAuditRedactionEvent]


class ManagedAuditRedactionResult(TypedDict):
    selectors: dict[str, str]
    status: str


class ManagedAuditRedactionResponse(TypedDict):
    success: bool
    redactionId: str
    resultShape: str
    results: list[ManagedAuditRedactionResult]


class IngestMonitoringAlert(TypedDict):
    id: str
    type: str
    title: str
    message: str


class IngestMonitoringAlertList(TypedDict):
    alerts: list[IngestMonitoringAlert]


class IngestMonitoringSummary(TypedDict):
    ingest_requests_total: int
    ingest_errors_total: int
    event_segments_verified_rows_total: int
    raw_events_landed_total: int
    raw_storage_s3_total: int
    raw_landing_s3_upload_failures_total: int


class IngestReprocessOutcome(TypedDict):
    uuid: str
    success: bool
    error: NotRequired[str]


class IngestReprocessResult(TypedDict):
    processed: int
    succeeded: int
    failed: int
    outcomes: list[IngestReprocessOutcome]


class SystemMonitoringTotals(TypedDict):
    ingest_requests_total: int
    ingest_errors_total: int
    raw_events_landed_total: int
    raw_landing_s3_upload_failures_total: int
    data_safety_invariant_violations_total: int
    storage_usage_collector_last_success_timestamp: int
    claim_backlog_count: int
    claim_backlog_oldest_age_seconds: int


class SystemMonitoringTenant(TypedDict):
    companySlug: str
    companyName: str
    rankReason: str
    attributedStorageBytes: int
    effectiveLimitBytes: int
    percentUsed: float
    rejectedEvents: NotRequired[int]


class SystemMonitoringSummary(TypedDict):
    generatedAt: str
    totals: SystemMonitoringTotals
    topTenants: list[SystemMonitoringTenant]


class CleanupJetStreamSelection(TypedDict):
    stream: str
    consumers: NotRequired[list[str]]
    executionStatus: NotRequired[str]


class CleanupPlanScope(TypedDict):
    mode: str
    reason: NotRequired[str]
    tenantSlug: NotRequired[str]
    eventTypeSlug: NotRequired[str]
    startedAt: NotRequired[str]
    endedAt: NotRequired[str]
    approvedS3Prefixes: list[str]
    jetStream: NotRequired[list[CleanupJetStreamSelection]]
    jetStreamExecution: NotRequired[str]


class CleanupPlanItem(TypedDict):
    phase: str
    dataClass: str
    storagePrefix: NotRequired[str]
    selectedCount: int
    selectedBytes: int
    executionStatus: NotRequired[str]


class CleanupPlan(TypedDict):
    planUuid: str
    mode: str
    status: str
    reason: NotRequired[str]
    selectedRows: int
    selectedObjects: int
    estimatedBytes: int
    scope: CleanupPlanScope
    items: NotRequired[list[CleanupPlanItem]]
    createdAt: NotRequired[str]


class CleanupPlanList(TypedDict):
    plans: list[CleanupPlan]


class CleanupPlanCreateRequest(TypedDict):
    mode: str
    reason: str
    dryRun: bool
    execute: bool
    approvedBy: str
    approvedS3Prefixes: list[str]
    eventTypeSlug: str
    startedAt: str
    endedAt: str
    jetStream: list[CleanupJetStreamSelection]


class CleanupApproval(TypedDict):
    Identity: str
    ExpiresAt: str


class CleanupObjectProgress(TypedDict):
    sourceKind: str
    cursorDirection: str
    cursorId: int
    cursorReceivedAt: NotRequired[str]
    batchNumber: int
    lastBatchIdentity: NotRequired[str]
    ledgerSelectedCount: int
    providerAcknowledgedCount: int
    providerRequestCount: int
    providerFailureCount: int
    selectedBytes: int
    retryCount: int
    pendingBatchIdentity: NotRequired[str]
    pendingBatchKeyCount: int
    pendingBatchAttemptCount: NotRequired[int]
    pendingBatchTerminal: NotRequired[bool]
    lastProgressAt: str
    version: int


class CleanupJobItem(TypedDict):
    id: int
    jobId: int
    phase: str
    dataClass: str
    storagePrefix: str
    selectedCount: int
    selectedBytes: int
    deletedCount: int
    verifiedCount: int
    status: str
    failureReason: NotRequired[str]
    objectProgress: NotRequired[CleanupObjectProgress]


class CleanupJob(TypedDict):
    jobId: int
    jobUuid: str
    status: str
    tenantSlug: str
    scopeHash: str
    holdKind: str
    approval: CleanupApproval
    failureReason: NotRequired[str]
    items: list[CleanupJobItem]
    createdAt: str


class CleanupJobList(TypedDict):
    jobs: list[CleanupJob]


class CleanupJobCreateRequest(TypedDict):
    mode: str
    reason: str
    tenantSlug: NotRequired[str]
    eventTypeSlug: NotRequired[str]
    startedAt: NotRequired[str]
    endedAt: NotRequired[str]
    approvedS3Prefixes: list[str]
    jetStream: NotRequired[list[CleanupJetStreamSelection]]
    approval: CleanupApproval


class CleanupJobProof(TypedDict):
    jobUuid: str
    status: str
    proof: Any


class EventIngestReceipt(TypedDict):
    success: bool
    eventUuid: str


class EventIngestProblem(TypedDict):
    type: NotRequired[str]
    title: NotRequired[str]
    status: NotRequired[int]
    detail: NotRequired[str]
    code: NotRequired[str]
    instance: NotRequired[str]
    traceId: NotRequired[str]
    fields: NotRequired[dict[str, str]]
    safeNextAction: NotRequired[str]
    requestId: NotRequired[str]
    retryability: NotRequired[str]
    nextAction: NotRequired[dict[str, Any]]


class EventIngestResult(TypedDict):
    eventUuid: str
    success: bool
    status: int
    error: NotRequired[EventIngestProblem]


class SendEventsResponse(TypedDict):
    success: bool
    results: list[EventIngestResult]
    acceptedEventIds: list[str]


class ErrorCaptureFrame(TypedDict):
    filename: str
    lineno: int
    colno: NotRequired[int]


class ErrorCaptureEvent(TypedDict):
    eventId: NotRequired[str]
    platform: str
    exceptionType: str
    frames: list[ErrorCaptureFrame]
    mode: str
    # The client's configured environment and release replace whatever the event carries.
    environment: NotRequired[str]
    release: NotRequired[str]
    correlationId: NotRequired[str]


class ErrorCaptureResult(TypedDict):
    outcome: str
    status: NotRequired[int]


class AuthDomainMonitoringInventory(TypedDict):
    hosts: list[str]
    retiredHosts: list[str]


class IngestAdminClient:
    """Operates the tenant's stored events and generated-data cleanup on ingest-api."""

    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin

    def reprocess(self) -> IngestReprocessResult:
        """Reprocess the tenant's rejected events and report each outcome."""
        return decode(IngestReprocessResult, request(self._admin, "POST", "/api/v1/reprocess"))

    def redact_managed_audit(self, body: ManagedAuditRedactionRequest) -> ManagedAuditRedactionResponse:
        """Redact managed audit events, as the managed audit producer's tenant."""
        response = request(self._admin, "POST", "/api/v1/managed-audit/redactions", body=dict(body))
        return decode(ManagedAuditRedactionResponse, response)

    def monitoring_summary(self) -> IngestMonitoringSummary:
        """Return the tenant's ingest counters."""
        return decode(IngestMonitoringSummary, request(self._admin, "GET", "/api/v1/monitoring/summary"))

    def monitoring_alerts(self) -> IngestMonitoringAlertList:
        """Return the tenant's active ingest alerts. The route answers a bare list."""
        alerts = request(self._admin, "GET", "/api/v1/monitoring/alerts")
        if alerts is not None and not isinstance(alerts, list):
            raise ValueError("custd: monitoring alerts response must be a JSON array")
        return decode(IngestMonitoringAlertList, {"alerts": alerts})

    def system_monitoring_summary(self) -> SystemMonitoringSummary:
        """Return the platform-wide monitoring view; system administrators only."""
        return decode(SystemMonitoringSummary, request(self._admin, "GET", "/api/v1/system/monitoring/summary"))

    def diagnostics(self, section: IngestDiagnosticsSection) -> IngestDiagnosticsSnapshot:
        """Return the data-path diagnostics snapshot from one section's route."""
        if section not in INGEST_DIAGNOSTICS_SECTIONS:
            raise ValueError(f"custd: unknown ingest diagnostics section {section!r}")
        return decode(IngestDiagnosticsSnapshot, request(self._admin, "GET", f"/api/v1/diagnostics/{section}"))

    def cleanup(self) -> IngestCleanupResult:
        """Delete the tenant's expired raw, event and rejected rows."""
        return decode(IngestCleanupResult, request(self._admin, "POST", "/api/v1/admin/cleanup"))

    def check_integrity(self) -> IngestIntegrityResult:
        """Check stored events against their raw objects and list the orphans."""
        return decode(IngestIntegrityResult, request(self._admin, "POST", "/api/v1/admin/integrity"))

    def list_cleanup_plans(self) -> CleanupPlanList:
        """Return the tenant's recent cleanup plans."""
        return decode(CleanupPlanList, request(self._admin, "GET", _CLEANUP_PLANS_PATH))

    def create_cleanup_plan(self, body: CleanupPlanCreateRequest) -> CleanupPlan:
        """Preview a generated-data cleanup."""
        return decode(CleanupPlan, request(self._admin, "POST", _CLEANUP_PLANS_PATH, body=dict(body)))

    def list_cleanup_jobs(self) -> CleanupJobList:
        """Return the tenant's cleanup jobs."""
        return decode(CleanupJobList, self._cleanup_job_request("GET", _CLEANUP_JOBS_PATH))

    def create_cleanup_job(self, body: CleanupJobCreateRequest) -> CleanupJob:
        """Enqueue a scoped cleanup job."""
        return decode(CleanupJob, request(self._admin, "POST", _CLEANUP_JOBS_PATH, body=dict(body)))

    def get_cleanup_job(self, job_uuid: str) -> CleanupJob:
        """Return one cleanup job and its phases."""
        return decode(CleanupJob, self._cleanup_job_request("GET", _cleanup_job_path(job_uuid)))

    def cancel_cleanup_job(self, job_uuid: str) -> CleanupJob:
        """Cancel a cleanup job and return its state."""
        return decode(CleanupJob, self._cleanup_job_request("POST", _cleanup_job_path(job_uuid)))

    def get_cleanup_job_proof(self, job_uuid: str) -> CleanupJobProof:
        """Return a completed job's proof; an unfinished job is a conflict."""
        return decode(CleanupJobProof, self._cleanup_job_request("GET", _cleanup_job_path(job_uuid) + "/proof"))

    def _cleanup_job_request(self, method: str, path: str) -> object:
        """Send a cleanup-job read or cancel, naming the configured acting company in the
        only place ingest-api reads it; unset, the credential's own company applies."""
        company = self._admin._client.acting_company_slug
        headers = {EFFECTIVE_COMPANY_HEADER: company} if company else None
        return request(self._admin, method, path, headers=headers)


_CLEANUP_PLANS_PATH = "/api/v1/admin/cleanup/plans"
_CLEANUP_JOBS_PATH = "/api/v1/cleanup/jobs"


def _cleanup_job_path(job_uuid: str) -> str:
    return f"{_CLEANUP_JOBS_PATH}/{quote_path(job_uuid)}"


def _get_account(admin: AdminClient) -> Account:
    """Read the authenticated caller's account document from /api/v1/account/me."""
    return decode(Account, request(admin, "GET", "/api/v1/account/me"))


def collect_event(
    api_base_url: str,
    event: EventEnvelope,
    *,
    write_key: str,
    origin: str,
    timeout: float = DEFAULT_PUBLIC_TIMEOUT_SECONDS,
    transport: AdminTransport | None = None,
) -> EventIngestReceipt:
    """Send one browser event with a Site's public write key; no client credential is sent."""
    (prepared,) = _confirmed_events([event])
    body = _collect(api_base_url, "/api/v1/collect/events", prepared, write_key, origin, timeout, transport)
    receipt = decode(EventIngestReceipt, body)
    if receipt.get("success") is not True or receipt.get("eventUuid") != prepared["eventUuid"]:
        raise ValidationError("custd: collector response does not acknowledge the sent event")
    return receipt


def collect_events(
    api_base_url: str,
    events: list[EventEnvelope],
    *,
    write_key: str,
    origin: str,
    timeout: float = DEFAULT_PUBLIC_TIMEOUT_SECONDS,
    transport: AdminTransport | None = None,
) -> SendEventsResponse:
    """Send a batch of browser events and return each event's outcome; partial rejection is valid."""
    prepared = _confirmed_events(events)
    payload = {"events": prepared}
    body = _collect(api_base_url, "/api/v1/collect/events/batch", payload, write_key, origin, timeout, transport)
    response = decode(SendEventsResponse, body)
    sent = {event["eventUuid"] for event in prepared}
    reported = [result.get("eventUuid") for result in response["results"]]
    if len(reported) != len(sent) or set(reported) != sent:
        raise ValidationError("custd: collector response does not report every sent event")
    return response


def _confirmed_events(events: list[EventEnvelope]) -> list[EventEnvelope]:
    """Fill, validate and label a 1 to 1000 event batch, as every confirmed send does."""
    if not 1 <= len(events) <= MAX_COLLECT_BATCH:
        raise ValidationError(f"custd: a collector batch must contain 1 to {MAX_COLLECT_BATCH} events")
    prepared = []
    for index, event in enumerate(events):
        filled = prepare_event(event)
        try:
            validate_event(filled)
        except ValidationError as error:
            raise ValidationError(f"custd: event {index}: {error}") from error
        apply_environment_label(filled, None)
        prepared.append(filled)
    if len({event["eventUuid"] for event in prepared}) != len(prepared):
        raise ValidationError("custd: batch contains duplicate eventUuid")
    return prepared


def _collect(
    api_base_url: str,
    path: str,
    payload: dict[str, Any],
    write_key: str,
    origin: str,
    timeout: float,
    transport: AdminTransport | None,
) -> object:
    if not write_key.startswith("site_pk_") or not origin.strip():
        raise ValueError("custd: collector requires a site_pk_ write key and an allowed origin")
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {write_key}",
        "Origin": origin,
        "X-Custd-Sdk": IDENTITY,
    }
    return _public(api_base_url, "POST", path, payload, headers, timeout, transport)


def read_shared_site_report(
    api_base_url: str,
    token: str,
    *,
    timeout: float = DEFAULT_PUBLIC_TIMEOUT_SECONDS,
    transport: AdminTransport | None = None,
) -> SiteReport:
    """Read the site report a share link opens. The share token is the only authority."""
    if not token.strip():
        raise ValueError("custd: shared site report requires a share token")
    path = f"/api/v1/shared-site-reports/{quote_path(token)}"
    return decode(SiteReport, _public(api_base_url, "GET", path, None, {"X-Custd-Sdk": IDENTITY}, timeout, transport))


def read_auth_domain_monitoring_inventory(
    api_base_url: str,
    monitoring_key: str,
    *,
    timeout: float = DEFAULT_PUBLIC_TIMEOUT_SECONDS,
    transport: AdminTransport | None = None,
) -> AuthDomainMonitoringInventory:
    """Return the realm hostnames the external checker may probe; the monitoring key is its credential."""
    if not monitoring_key.strip():
        raise ValueError("custd: auth domain monitoring requires a monitoring key")
    headers = {"X-Custd-Sdk": IDENTITY, AUTH_DOMAIN_MONITORING_KEY_HEADER: monitoring_key}
    path = "/api/v1/auth-domain-monitoring/inventory"
    return decode(AuthDomainMonitoringInventory, _public(api_base_url, "GET", path, None, headers, timeout, transport))


def _public(
    api_base_url: str,
    method: str,
    path: str,
    payload: dict[str, Any] | None,
    headers: dict[str, str],
    timeout: float,
    transport: AdminTransport | None,
) -> object:
    base = api_base_url.rstrip("/")
    assert_secure_or_local_http(base, "api_base_url")
    result = (transport or default_admin_transport)(method, base + path, payload, headers, timeout)
    return answer(int(result["status"]), result.get("body"), path)


ERROR_CAPTURE_PLATFORMS = ("javascript", "go")
ERROR_CAPTURE_MODES = ("handled", "unhandled")
ERROR_CAPTURE_MAX_CAPTURES = 20
ERROR_CAPTURE_MAX_BYTES = 16384
ERROR_CAPTURE_TIMEOUT_SECONDS = 2.0
_CAPTURE_KEY = re.compile(r"^site_pk_[A-Za-z0-9_-]{32,128}$")
_CAPTURE_ENVIRONMENT = re.compile(r"^[a-zA-Z0-9._-]{1,64}$")
_CAPTURE_RELEASE = re.compile(r"^[a-zA-Z0-9@._+-]{1,200}$")
_CAPTURE_TYPE = re.compile(r"^[A-Za-z_$][A-Za-z0-9_$.]{0,127}$")
_CAPTURE_FILENAME = re.compile(r"^[A-Za-z0-9_.+\[\]-]{1,128}\.(go|[cm]?js|jsx|tsx?|bundle)$")
_CAPTURE_ID = re.compile(r"^[a-f0-9]{32}$")
_CAPTURE_CORRELATION = re.compile(r"^[0-7][0-9A-HJKMNP-TV-Z]{25}$")


class ErrorCaptureClient:
    """Relays allowlisted error metadata to the collector's error envelope route.

    Only the exception type, code locations and mode are sent, never a message. The client is
    request-scoped: it sends at most 20 captures, never retries, and a capture's failure is an
    outcome, not an exception, so error reporting never changes the caller's result.
    """

    def __init__(
        self,
        base_url: str,
        *,
        write_key: str,
        environment: str,
        release: str | None = None,
        transport: AdminTransport | None = None,
    ) -> None:
        self._base_url = base_url.rstrip("/")
        assert_secure_or_local_http(self._base_url, "base_url")
        if (
            not _CAPTURE_KEY.match(write_key)
            or not _CAPTURE_ENVIRONMENT.match(environment)
            or (release is not None and not _CAPTURE_RELEASE.match(release))
        ):
            raise ValueError("custd: invalid error capture configuration")
        self._write_key = write_key
        self._environment = environment
        self._release = release
        self._transport = transport or default_admin_transport
        self._captures = 0

    def capture_event(self, event: ErrorCaptureEvent) -> ErrorCaptureResult:
        """Validate the relayed metadata and post it as one envelope with this client's Site key."""
        event = {**event, "environment": self._environment}
        if self._release is not None:
            event["release"] = self._release
        if not _valid_capture(event):
            return ErrorCaptureResult(outcome="rejected")
        if self._captures >= ERROR_CAPTURE_MAX_CAPTURES:
            return ErrorCaptureResult(outcome="limited")
        self._captures += 1
        body = self._envelope(event)
        if len(body) > ERROR_CAPTURE_MAX_BYTES:
            return ErrorCaptureResult(outcome="limited")
        url = self._base_url + "/api/v1/errors/api/1/envelope/"
        try:
            result = self._transport("POST", url, body, {"Content-Type": "text/plain"}, ERROR_CAPTURE_TIMEOUT_SECONDS)
        except (OSError, RequestError):
            return ErrorCaptureResult(outcome="unavailable")
        status = int(result["status"])
        return ErrorCaptureResult(outcome="accepted" if 200 <= status < 300 else "rejected", status=status)

    def _envelope(self, event: ErrorCaptureEvent) -> bytes:
        event_id = event.get("eventId") or uuid.uuid4().hex
        scheme, host = self._base_url.split("://", 1)
        header = {"event_id": event_id, "dsn": f"{scheme}://{self._write_key}@{host}/api/v1/errors/1"}
        exception = {
            "type": event["exceptionType"],
            "mechanism": {"handled": event["mode"] != "unhandled"},
            "stacktrace": {"frames": list(event["frames"])},
        }
        payload: dict[str, Any] = {
            "event_id": event_id,
            "timestamp": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
            "platform": event["platform"],
            "level": "error",
            "environment": event["environment"],
            "sdk": {"name": "custd.python", "version": VERSION},
            "exception": {"values": [exception]},
        }
        if event.get("release"):
            payload["release"] = event["release"]
        if event.get("correlationId"):
            payload["tags"] = {"correlation_id": event["correlationId"]}
        lines = [json.dumps(header), json.dumps({"type": "event"}), json.dumps(payload)]
        return "\n".join(lines).encode("utf-8")


def _valid_capture(event: ErrorCaptureEvent) -> bool:
    optional = (
        (event.get("release"), _CAPTURE_RELEASE),
        (event.get("eventId"), _CAPTURE_ID),
        (event.get("correlationId"), _CAPTURE_CORRELATION),
    )
    if (
        event.get("platform") not in ERROR_CAPTURE_PLATFORMS
        or event.get("mode") not in ERROR_CAPTURE_MODES
        or not _CAPTURE_TYPE.match(str(event.get("exceptionType", "")))
        or not _CAPTURE_ENVIRONMENT.match(str(event.get("environment", "")))
        or any(value and not pattern.match(str(value)) for value, pattern in optional)
        or len(event.get("frames", [])) > 24
    ):
        return False
    return all(_valid_frame(cast(dict[str, Any], frame)) for frame in event.get("frames", []))


def _valid_frame(frame: dict[str, Any]) -> bool:
    lineno = frame.get("lineno")
    colno = frame.get("colno", 0)
    return (
        bool(_CAPTURE_FILENAME.match(str(frame.get("filename", ""))))
        and isinstance(lineno, int)
        and 1 <= lineno <= 1_000_000
        and isinstance(colno, int)
        and 0 <= colno <= 2**31 - 1
    )
