"""Workflow timings: facts another system observed about its own work, under
``/api/v1/admin/workflow-timings``.

Custd is not the controller: the caller keeps its own lifecycle and reports what it observed after
its own commit. Every append is idempotent through the caller's deterministic key, and a 200 answer
is not a durable append: read each result's ``accepted``. Closed string sets are Literal aliases;
a new value still decodes. The server encodes an empty list as JSON null; every list decodes as empty.
"""

from __future__ import annotations

import urllib.parse
from typing import TYPE_CHECKING, Any, Literal, NotRequired, TypedDict, cast

from .client import quote_path

if TYPE_CHECKING:
    from .client import AdminClient, AdminRequestOptions

DurationForecastMethod = Literal["nominal", "duration_shrinkage"]
WorkflowTimingAttemptState = Literal["running", "completed", "failed", "cancelled", "skipped"]
WorkflowTimingDefinitionStatus = Literal["active", "retired"]
WorkflowTimingEvaluationState = Literal["ready", "cold_start", "sparse", "stale", "partial", "unavailable", "error"]
WorkflowTimingExcludedStepOutcome = Literal["completed", "failed", "cancelled", "skipped", "open"]
WorkflowTimingFactKind = Literal["run_started", "run_finished", "step_started", "step_finished"]
WorkflowTimingRunState = Literal["running", "completed", "failed", "cancelled"]


# Expectation states. Only ready may be presented as a forecast; a cold start must look different.
WORKFLOW_TIMING_STATE_READY: WorkflowTimingEvaluationState = "ready"
WORKFLOW_TIMING_STATE_COLD_START: WorkflowTimingEvaluationState = "cold_start"
WORKFLOW_TIMING_STATE_SPARSE: WorkflowTimingEvaluationState = "sparse"
WORKFLOW_TIMING_STATE_STALE: WorkflowTimingEvaluationState = "stale"
WORKFLOW_TIMING_STATE_PARTIAL: WorkflowTimingEvaluationState = "partial"
WORKFLOW_TIMING_STATE_UNAVAILABLE: WorkflowTimingEvaluationState = "unavailable"
WORKFLOW_TIMING_STATE_ERROR: WorkflowTimingEvaluationState = "error"

WORKFLOW_TIMING_FACT_RUN_STARTED: WorkflowTimingFactKind = "run_started"
WORKFLOW_TIMING_FACT_RUN_FINISHED: WorkflowTimingFactKind = "run_finished"
WORKFLOW_TIMING_FACT_STEP_STARTED: WorkflowTimingFactKind = "step_started"
WORKFLOW_TIMING_FACT_STEP_FINISHED: WorkflowTimingFactKind = "step_finished"

WORKFLOW_TIMING_RUN_RUNNING: WorkflowTimingRunState = "running"
WORKFLOW_TIMING_RUN_COMPLETED: WorkflowTimingRunState = "completed"
WORKFLOW_TIMING_RUN_FAILED: WorkflowTimingRunState = "failed"
WORKFLOW_TIMING_RUN_CANCELLED: WorkflowTimingRunState = "cancelled"
WORKFLOW_TIMING_STEP_SKIPPED: WorkflowTimingAttemptState = "skipped"

WORKFLOW_TIMING_DEFINITION_ACTIVE: WorkflowTimingDefinitionStatus = "active"
WORKFLOW_TIMING_DEFINITION_RETIRED: WorkflowTimingDefinitionStatus = "retired"

_TIMINGS_PATH = "/workflow-timings"


# ---- Requests ----


class WorkflowTimingStepDeclaration(TypedDict):
    stepKey: str
    name: str
    nominalMs: int


class WorkflowTimingDeclaration(TypedDict):
    """The declarative workflow shape. Repeating it is a no-op; a changed shape adds a revision."""

    workflowKey: str
    name: str
    steps: list[WorkflowTimingStepDeclaration]
    description: NotRequired[str]
    dimensions: NotRequired[list[str]]
    allowOverlap: NotRequired[bool]
    predictionVersionUuid: NotRequired[str]
    retired: NotRequired[bool]


class WorkflowTimingRunFact(TypedDict):
    state: WorkflowTimingRunState


class WorkflowTimingStepFact(TypedDict):
    stepKey: str
    attempt: int
    state: WorkflowTimingAttemptState
    errorClass: NotRequired[str]


class WorkflowTimingFact(TypedDict):
    """One observed fact; kind is run_started, run_finished, step_started or step_finished."""

    kind: WorkflowTimingFactKind
    occurredAt: str
    dimensions: NotRequired[dict[str, str]]
    run: NotRequired[WorkflowTimingRunFact]
    step: NotRequired[WorkflowTimingStepFact]


class WorkflowTimingProvenance(TypedDict):
    actorKind: str
    actorRef: str
    collector: NotRequired[str]


class WorkflowTimingObservation(TypedDict):
    """A fact with the caller's deterministic idempotency key; a correction names supersedesFactUuid."""

    workflowKey: str
    externalRunId: str
    idempotencyKey: str
    fact: WorkflowTimingFact
    provenance: NotRequired[WorkflowTimingProvenance]
    supersedesFactUuid: NotRequired[str]


# ---- Definitions ----


class WorkflowTimingDimension(TypedDict):
    dimensionKey: str
    maxValueBytes: int


class WorkflowTimingStep(TypedDict):
    stepKey: str
    name: str
    nominalMs: int
    sequence: int


class WorkflowTimingRevision(TypedDict):
    uuid: str
    number: int
    hash: str
    allowOverlap: bool
    dimensions: list[WorkflowTimingDimension]
    steps: list[WorkflowTimingStep]
    predictionVersionUuid: NotRequired[str]


class WorkflowTimingDefinition(TypedDict):
    uuid: str
    workflowKey: str
    name: str
    description: str
    status: WorkflowTimingDefinitionStatus
    revisionCount: int
    currentRevision: WorkflowTimingRevision


class WorkflowTimingDefinitionList(TypedDict):
    items: list[WorkflowTimingDefinition]


class WorkflowTimingReconcileResult(TypedDict):
    created: bool
    revisionChanged: bool
    definition: WorkflowTimingDefinition


# ---- Appends ----


class WorkflowTimingObservationResult(TypedDict):
    index: int
    workflowKey: str
    externalRunId: str
    idempotencyKey: str
    accepted: bool
    duplicate: bool
    factUuid: NotRequired[str]
    runUuid: NotRequired[str]
    errorCode: NotRequired[str]
    errorMessage: NotRequired[str]


class WorkflowTimingBatchResult(TypedDict):
    """The outcome of one append; a rejected item is not durable even under a 200 answer."""

    accepted: int
    rejected: int
    duplicates: int
    results: list[WorkflowTimingObservationResult]


# ---- Runs ----


class WorkflowTimingRunSummary(TypedDict):
    runUuid: str
    workflowKey: str
    externalRunId: str
    state: WorkflowTimingRunState
    openAttempts: int
    pendingFacts: int
    receiptAt: str
    startedAt: NotRequired[str]
    finishedAt: NotRequired[str]


class WorkflowTimingRunList(TypedDict):
    items: list[WorkflowTimingRunSummary]


class WorkflowTimingAttempt(TypedDict):
    stepKey: str
    attempt: int
    state: WorkflowTimingAttemptState
    occurredAt: str
    receiptAt: str
    startedAt: NotRequired[str]
    finishedAt: NotRequired[str]
    errorClass: NotRequired[str]


class WorkflowTimingProjectionStatus(TypedDict):
    """Whether the run's projection has caught up with its ledger; nextAction names the repair."""

    healthy: bool
    state: str
    nextAction: str
    latestLedgerId: int
    projectedLedgerId: int
    pendingFacts: int
    foldError: NotRequired[str]


class WorkflowTimingRun(TypedDict):
    runUuid: str
    workflowKey: str
    workflowUuid: str
    externalRunId: str
    state: WorkflowTimingRunState
    revisionUuid: str
    revisionNumber: int
    revisionHash: str
    receiptAt: str
    dimensions: dict[str, str]
    attempts: list[WorkflowTimingAttempt]
    projectionStatus: WorkflowTimingProjectionStatus
    startedAt: NotRequired[str]
    finishedAt: NotRequired[str]
    sourceOccurredAt: NotRequired[str]


class WorkflowTimingExpectation(TypedDict):
    state: WorkflowTimingEvaluationState
    seriesKey: str
    method: str
    methodVersion: str
    inputHash: str
    baselineMs: int
    sampleCount: int
    evidenceWindowStart: str
    generatedAt: str
    warnings: list[str]
    stepKey: NotRequired[str]
    attempt: NotRequired[int]
    expectedMs: NotRequired[int]
    conservativeLowMs: NotRequired[int]
    conservativeHighMs: NotRequired[int]
    predictionVersionUuid: NotRequired[str]


class WorkflowTimingPrediction(TypedDict):
    """The evidence-backed completion expectation of one run and each of its steps."""

    runUuid: str
    workflowKey: str
    externalRunId: str
    state: WorkflowTimingRunState
    allowOverlap: bool
    generatedAt: str
    run: WorkflowTimingExpectation
    steps: list[WorkflowTimingExpectation]


class WorkflowTimingRunProjection(TypedDict):
    runUuid: str
    state: WorkflowTimingRunState
    appliedLedgerId: int
    corrected: bool
    openAttempts: int
    receiptAt: str
    dimensions: dict[str, str]
    attempts: list[WorkflowTimingAttempt]
    startedAt: NotRequired[str]
    finishedAt: NotRequired[str]
    occurredAt: NotRequired[str]


class WorkflowTimingRunDuration(TypedDict):
    startedAt: str
    finishedAt: str
    valueMs: int
    baselineMs: int


class WorkflowTimingStepDuration(TypedDict):
    stepKey: str
    attempt: int
    startedAt: str
    finishedAt: str
    receiptAt: str
    valueMs: int
    baselineMs: int


class WorkflowTimingExcludedStep(TypedDict):
    stepKey: str
    attempt: int
    outcome: WorkflowTimingExcludedStepOutcome


class WorkflowTimingDurationProjection(TypedDict):
    run: WorkflowTimingRunDuration
    runEligible: bool
    activeMs: int
    waitMs: int
    openAttempts: int
    steps: list[WorkflowTimingStepDuration]
    excluded: list[WorkflowTimingExcludedStep]


class WorkflowTimingRebuildResult(TypedDict):
    runUuid: str
    workflowKey: str
    externalRunId: str
    facts: int
    observationsWritten: int
    projection: WorkflowTimingRunProjection
    durations: WorkflowTimingDurationProjection
    status: WorkflowTimingProjectionStatus


# ---- History and evaluation ----


class WorkflowTimingOutcomeCounts(TypedDict):
    runningRuns: int
    completedRuns: int
    failedRuns: int
    cancelledRuns: int
    completedSteps: int
    cancelledSteps: int
    failedAttempts: int
    skippedAttempts: int
    openAttempts: int
    retries: int


class WorkflowTimingDurationEntry(TypedDict):
    runUuid: str
    stepKey: str
    revisionUuid: str
    revisionNumber: int
    outcome: str
    observedAt: str
    valueMs: int
    baselineMs: int
    corrected: bool


class WorkflowTimingContribution(TypedDict):
    stepKey: str
    attempts: int
    totalMs: int
    baselineMs: int
    contributionPermille: int


class WorkflowTimingRunTiming(TypedDict):
    runUuid: str
    wallClockMs: int
    activeMs: int
    waitMs: int
    nominalMs: int


class WorkflowTimingDurationHistory(TypedDict):
    workflowKey: str
    workflowUuid: str
    outcomes: WorkflowTimingOutcomeCounts
    entries: list[WorkflowTimingDurationEntry]
    contributions: list[WorkflowTimingContribution]
    latestCompletedRun: NotRequired[WorkflowTimingRunTiming]


class DurationForecastDefinition(TypedDict):
    method: DurationForecastMethod
    method_version: str
    minimum_history: int
    prior_weight: int
    schema_version: str


class DurationForecastInterval(TypedDict):
    p10_ms: NotRequired[int]
    p90_ms: NotRequired[int]


class DurationForecastEvaluationFold(TypedDict):
    fold_number: int
    held_out_run_id: str
    observed_at: str
    actual_ms: int
    training_sample_count: int
    nominal_point_ms: int
    nominal_absolute_error_ms: int
    shrinkage_point_ms: int
    shrinkage_absolute_error_ms: int
    shrinkage_interval: DurationForecastInterval


class DurationForecastIntervalEvaluation(TypedDict):
    available_fold_count: int
    covered_fold_count: int
    coverage: float
    mean_width_ms: float


class DurationForecastEvaluationMetric(TypedDict):
    method: DurationForecastMethod
    evaluated_fold_count: int
    mean_absolute_error_ms: float
    interval: DurationForecastIntervalEvaluation


class DurationForecastEvaluationMetrics(TypedDict):
    nominal: DurationForecastEvaluationMetric
    shrinkage: DurationForecastEvaluationMetric


class DurationForecastEvaluation(TypedDict):
    tenant_id: str
    project_id: str
    series_id: str
    as_of: str
    input_hash: str
    primary_metric: str
    minimum_training_history: int
    fold_count: int
    definition: DurationForecastDefinition
    folds: list[DurationForecastEvaluationFold]
    metrics: DurationForecastEvaluationMetrics


class DurationForecastEvaluationArtifact(TypedDict):
    schema_version: str
    source: str
    prediction_version_uuid: str
    content_sha256: str
    evaluation: DurationForecastEvaluation


class WorkflowTimingEvaluation(TypedDict):
    """The leave-one-out duration evaluation of one series; state says whether it is usable."""

    workflowKey: str
    workflowUuid: str
    seriesKey: str
    state: WorkflowTimingEvaluationState
    nextAction: str
    baselineMs: int
    outcomes: WorkflowTimingOutcomeCounts
    predictionVersionUuid: NotRequired[str]
    artifact: NotRequired[DurationForecastEvaluationArtifact]


class WorkflowTimingAdminClient:
    """Declare workflow shapes, append observed facts, and read runs, predictions and history."""

    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin

    def reconcile_definition(
        self,
        declaration: WorkflowTimingDeclaration,
        *,
        company_slug: str | None = None,
        options: AdminRequestOptions | None = None,
    ) -> WorkflowTimingReconcileResult:
        """Declaratively applies one workflow shape, keyed by its workflowKey."""
        path = _timing_path(f"/definitions/{quote_path(declaration['workflowKey'])}", company_slug)
        result = self._admin.request("PUT", path, dict(declaration), options)
        _definition(result.get("definition"))
        return cast(WorkflowTimingReconcileResult, result)

    def list_definitions(
        self, *, company_slug: str | None = None, limit: int | None = None
    ) -> WorkflowTimingDefinitionList:
        result = self._admin.request("GET", _timing_path("/definitions", company_slug, limit=limit))
        for definition in _list(result, "items"):
            _definition(definition)
        return cast(WorkflowTimingDefinitionList, result)

    def get_definition(self, workflow_key: str, *, company_slug: str | None = None) -> WorkflowTimingDefinition:
        path = _timing_path(f"/definitions/{quote_path(workflow_key)}", company_slug)
        result = self._admin.request("GET", path)
        _definition(result)
        return cast(WorkflowTimingDefinition, result)

    def append_observation(
        self,
        observation: WorkflowTimingObservation,
        *,
        company_slug: str | None = None,
        options: AdminRequestOptions | None = None,
    ) -> WorkflowTimingBatchResult:
        """Records one observed fact. Read the result's ``accepted``, not the transport status."""
        return self._append("/observations", {"observation": dict(observation)}, company_slug, options)

    def append_observations(
        self,
        observations: list[WorkflowTimingObservation],
        *,
        company_slug: str | None = None,
        options: AdminRequestOptions | None = None,
    ) -> WorkflowTimingBatchResult:
        """Records a bounded batch (10,000 facts, 1 MiB). Replay a failure with the same keys."""
        body = {"observations": [dict(observation) for observation in observations]}
        return self._append("/observations:batch", body, company_slug, options)

    def correct_observation(
        self,
        observation: WorkflowTimingObservation,
        *,
        company_slug: str | None = None,
        options: AdminRequestOptions | None = None,
    ) -> WorkflowTimingBatchResult:
        """Appends a fact that supersedes an accepted one; the observation names supersedesFactUuid."""
        return self._append("/corrections", {"observation": dict(observation)}, company_slug, options)

    def list_runs(
        self,
        *,
        company_slug: str | None = None,
        workflow_key: str | None = None,
        limit: int | None = None,
    ) -> WorkflowTimingRunList:
        """Lists observed runs, newest first. The server filters by workflow before it limits."""
        path = _timing_path("/runs", company_slug, workflowKey=workflow_key, limit=limit)
        result = self._admin.request("GET", path)
        _list(result, "items")
        return cast(WorkflowTimingRunList, result)

    def get_run(self, run_uuid: str, *, company_slug: str | None = None) -> WorkflowTimingRun:
        result = self._admin.request("GET", _timing_path(f"/runs/{quote_path(run_uuid)}", company_slug))
        _list(result, "attempts")
        return cast(WorkflowTimingRun, result)

    def get_prediction(self, run_uuid: str, *, company_slug: str | None = None) -> WorkflowTimingPrediction:
        """Reads the evidence-backed completion expectation for one run."""
        path = _timing_path(f"/runs/{quote_path(run_uuid)}/prediction", company_slug)
        result = self._admin.request("GET", path)
        _expectation(result.get("run"))
        for step in _list(result, "steps"):
            _expectation(step)
        return cast(WorkflowTimingPrediction, result)

    def get_duration_history(
        self, workflow_key: str, *, company_slug: str | None = None, limit: int | None = None
    ) -> WorkflowTimingDurationHistory:
        path = _timing_path(f"/definitions/{quote_path(workflow_key)}/duration-history", company_slug, limit=limit)
        result = self._admin.request("GET", path)
        _list(result, "entries")
        _list(result, "contributions")
        return cast(WorkflowTimingDurationHistory, result)

    def get_evaluation(
        self, workflow_key: str, *, company_slug: str | None = None, series_key: str | None = None
    ) -> WorkflowTimingEvaluation:
        path = _timing_path(f"/definitions/{quote_path(workflow_key)}/evaluation", company_slug, seriesKey=series_key)
        result = self._admin.request("GET", path)
        artifact = result.get("artifact")
        if isinstance(artifact, dict) and isinstance(artifact.get("evaluation"), dict):
            _list(artifact["evaluation"], "folds")
        return cast(WorkflowTimingEvaluation, result)

    def rebuild_run(
        self, run_uuid: str, *, company_slug: str | None = None, options: AdminRequestOptions | None = None
    ) -> WorkflowTimingRebuildResult:
        """Rebuilds one run's projection from its ledger: the repair when its status reports pending facts."""
        path = _timing_path(f"/runs/{quote_path(run_uuid)}/rebuild", company_slug)
        result = self._admin.request("POST", path, None, options)
        projection = result.get("projection")
        if isinstance(projection, dict):
            _list(projection, "attempts")
        durations = result.get("durations")
        if isinstance(durations, dict):
            _list(durations, "steps")
            _list(durations, "excluded")
        return cast(WorkflowTimingRebuildResult, result)

    def _append(
        self,
        route: str,
        body: dict[str, Any],
        company_slug: str | None,
        options: AdminRequestOptions | None,
    ) -> WorkflowTimingBatchResult:
        result = self._admin.request("POST", _timing_path(route, company_slug), body, options)
        _list(result, "results")
        return cast(WorkflowTimingBatchResult, result)


def _timing_path(route: str, company_slug: str | None, **query: str | int | None) -> str:
    params = {"companySlug": company_slug, **query}
    encoded = urllib.parse.urlencode({key: str(value) for key, value in params.items() if value not in (None, "")})
    return f"{_TIMINGS_PATH}{route}" + (f"?{encoded}" if encoded else "")


def _list(payload: dict[str, Any], key: str) -> list[Any]:
    """Return the list at key, replacing an absent or JSON null list with an empty one in place."""
    value = payload.get(key)
    if value is None:
        payload[key] = []
        return cast(list[Any], payload[key])
    if not isinstance(value, list):
        raise ValueError(f"custd: workflow timing response field {key} must be a list")
    return value


def _definition(value: object) -> None:
    if isinstance(value, dict) and isinstance(value.get("currentRevision"), dict):
        _list(value["currentRevision"], "dimensions")
        _list(value["currentRevision"], "steps")


def _expectation(value: object) -> None:
    if isinstance(value, dict):
        _list(value, "warnings")
