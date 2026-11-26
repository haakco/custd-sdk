"""Measurement projects, decision models and forecasts.

``client.admin.measurement.projects`` manages a tenant's projects and their estimates, runs,
series, targets and decision models on the admin API. ``client.measurement`` reads what the
analytics API computes from them: the overview, forecast and decision-simulation runs, the
recorded forecast story and prediction definitions with their runs, outcomes and evaluations.
"""

from __future__ import annotations

from typing import Any, NotRequired, TypedDict

from ._wire import decode, query_string, request
from .admin_workflow_timings import DurationForecastEvaluationArtifact
from .app_types import (
    MeasurementForecastRunRequest,
    MeasurementForecastRunResponse,
    MeasurementForecastStoryResponse,
    MeasurementObservationBulkRequest,
    MeasurementObservationBulkResponse,
    MeasurementObservationResult,
    MeasurementObservationRow,
    MeasurementProject,
    MeasurementSeriesCreateRequest,
    MeasurementSeriesResponse,
    MeasurementTargetCreateRequest,
    MeasurementTargetResponse,
    ProjectCompleteRequest,
    ProjectEstimate,
    ProjectEstimateCreateRequest,
    ProjectEstimateListResponse,
    ProjectRunCreateRequest,
    ProjectUpdateRequest,
)
from .client import AdminClient, quote_path, validate_measurement_results


class MeasurementDecisionExpression(TypedDict):
    children: NotRequired[list[MeasurementDecisionExpression]]
    kind: str
    value: NotRequired[float]
    variableCode: NotRequired[str]


class MeasurementDecisionChoiceResponse(TypedDict):
    choiceCode: str
    choiceUuid: str
    description: str
    expression: NotRequired[MeasurementDecisionExpression]
    name: str


MeasurementDecisionDistributionParameters = TypedDict(
    "MeasurementDecisionDistributionParameters",
    {
        "max": NotRequired[float],
        "mean": NotRequired[float],
        "min": NotRequired[float],
        "mode": NotRequired[float],
        "std-dev": NotRequired[float],
        "value": NotRequired[float],
    },
)


class MeasurementDecisionVariableResponse(TypedDict):
    distributionSlug: str
    measurementCost: float
    name: str
    parameters: NotRequired[MeasurementDecisionDistributionParameters]
    unitSlug: str
    variableCode: str
    variableUuid: str


class MeasurementDecisionModel(TypedDict):
    choices: NotRequired[list[MeasurementDecisionChoiceResponse]]
    createdAt: str
    decisionCode: str
    decisionUuid: str
    description: str
    name: str
    objective: str
    projectCode: str
    status: str
    updatedAt: str
    variables: NotRequired[list[MeasurementDecisionVariableResponse]]


class MeasurementDecisionModelList(TypedDict):
    decisions: list[MeasurementDecisionModel]


class MeasurementImportRun(TypedDict):
    accepted: int
    completedAt: NotRequired[str]
    createdAt: str
    importId: str
    projectCode: str
    rejected: int
    results: list[MeasurementObservationResult]
    rowCount: int
    source: str


class MeasurementDecisionModelUpdateRequest(TypedDict):
    description: NotRequired[str]
    name: NotRequired[str]
    objective: NotRequired[str]
    status: NotRequired[str]


class DurationEvaluationRequest(TypedDict):
    asOf: NotRequired[str]
    limit: NotRequired[int]
    planUuid: str
    predictionVersionUuid: NotRequired[str]
    semanticKey: str
    windowStart: NotRequired[str]


class DurationEvaluationOutcomeCounts(TypedDict):
    cancelled: int
    censored: int
    eligible: int
    notRun: int
    skipped: int


class DurationEvaluationVersionHistoryEntry(TypedDict):
    actor: str
    fromStatus: str
    reason: str
    toStatus: str
    transitionKind: str
    transitionedAt: str
    versionUuid: str


class DurationEvaluationVersionHistory(TypedDict):
    items: list[DurationEvaluationVersionHistoryEntry]


class DurationEvaluationVersion(TypedDict):
    createdAt: str
    status: str
    uuid: str
    versionNumber: int


class DurationEvaluationVersionEvidence(TypedDict):
    activeVersionUuid: NotRequired[str]
    history: DurationEvaluationVersionHistory
    selected: DurationEvaluationVersion


class DurationEvaluationResponse(TypedDict):
    artifact: DurationForecastEvaluationArtifact
    definitionUuid: str
    outcomes: DurationEvaluationOutcomeCounts
    planUuid: str
    semanticKey: str
    versionEvidence: DurationEvaluationVersionEvidence


class MeasurementCalibrationExerciseCreate(TypedDict):
    actualValue: NotRequired[float]
    confidence: float
    contained: NotRequired[bool]
    lowerBound: float
    metadata: NotRequired[dict[str, Any]]
    priorUuid: NotRequired[str]
    question: str
    resolvedAt: NotRequired[str]
    upperBound: float


class MeasurementCalibrationExercise(TypedDict):
    actualValue: NotRequired[float]
    confidence: float
    contained: NotRequired[bool]
    createdAt: str
    exerciseUuid: str
    lowerBound: float
    projectCode: str
    question: str
    resolvedAt: NotRequired[str]
    status: str
    updatedAt: str
    upperBound: float


class MeasurementDecisionChoice(TypedDict):
    choiceCode: str
    description: NotRequired[str]
    expression: MeasurementDecisionExpression
    name: str


class MeasurementDecisionVariable(TypedDict):
    distributionSlug: str
    measurementCost: NotRequired[float]
    name: str
    parameters: NotRequired[MeasurementDecisionDistributionParameters]
    unitSlug: NotRequired[str]
    variableCode: str


class MeasurementDecisionModelCreate(TypedDict):
    choices: list[MeasurementDecisionChoice]
    decisionCode: str
    description: NotRequired[str]
    name: str
    objective: NotRequired[str]
    status: str
    variables: list[MeasurementDecisionVariable]


class MeasurementOverviewPoint(TypedDict):
    label: str
    value: str


class MeasurementOverviewArea(TypedDict):
    detail: str
    headline: str
    key: str
    points: NotRequired[list[MeasurementOverviewPoint]]
    provenance: NotRequired[str]
    state: str
    title: str
    value: str
    widgetKind: str


class MeasurementOverviewTenant(TypedDict):
    companySlug: str
    label: str


class MeasurementOverviewResponse(TypedDict):
    areas: list[MeasurementOverviewArea]
    # UTC generation time in RFC 3339 format.
    generatedAt: str
    tenant: MeasurementOverviewTenant


class PredictionDefinitionRead(TypedDict):
    uuid: str
    definitionKey: str
    displayName: str
    status: str
    isPaused: bool
    updatedAt: str


class PredictionDefinitionReadList(TypedDict):
    items: list[PredictionDefinitionRead]


class PredictionRunRead(TypedDict):
    runUuid: str
    asOf: str
    horizonEnd: str
    output: float
    baseline: float
    overrideApplied: bool
    inputHash: str
    contributionCount: int
    generatedAt: str


class PredictionRunReadList(TypedDict):
    items: list[PredictionRunRead]


class PredictionOutcomeRead(TypedDict):
    runUuid: str
    resolution: str
    outcomeKind: str
    resolvedAt: NotRequired[str]
    observedValue: int
    isLateEvidence: bool


class PredictionOutcomeReadList(TypedDict):
    items: list[PredictionOutcomeRead]


class PredictionEvaluationRead(TypedDict):
    windowStartAt: str
    windowEndAt: str
    resolvedRunCount: int
    positiveCount: int
    negativeCount: int
    brierScore: NotRequired[float]
    logLoss: NotRequired[float]
    sparseBucketCount: int


class MeasurementSimulationRunRequest(TypedDict):
    seed: NotRequired[int]
    sampleCount: NotRequired[int]


class MeasurementVOIVariableResponse(TypedDict):
    variableCode: str
    name: str
    rank: int
    evpi: float
    evppi: NotRequired[float]
    measurementCost: float
    worthMeasuring: bool


class MeasurementSimulationWarning(TypedDict):
    code: str
    severity: str
    message: str


class MeasurementSimulationRun(TypedDict):
    simulationRunUuid: str
    projectUuid: str
    decisionUuid: str
    status: str
    method: str
    generatedAt: str
    completedAt: str
    sampleCount: int
    seed: int
    variables: list[MeasurementVOIVariableResponse]
    warnings: NotRequired[list[MeasurementSimulationWarning]]
    provenance: dict[str, str]


class MeasurementAdminClient:
    """Measurement administration: ``projects`` manages the tenant's measurement projects."""

    def __init__(self, admin: AdminClient) -> None:
        self.projects = MeasurementProjectAdminClient(admin)


class MeasurementProjectListResponse(TypedDict):
    projects: list[MeasurementProject]


class MeasurementProjectCreateRequest(TypedDict):
    projectCode: str
    name: str
    kind: str
    target: MeasurementTargetCreateRequest
    series: list[MeasurementSeriesCreateRequest]
    description: NotRequired[str]
    companySlug: NotRequired[str]


def _with_company(path: str, company_slug: str | None) -> str:
    return path + query_string({"companySlug": company_slug})


class MeasurementProjectAdminClient:
    """Creates and changes measurement projects and what they record."""

    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin

    def create(
        self, project: MeasurementProjectCreateRequest, *, company_slug: str | None = None
    ) -> MeasurementProject:
        path = "/api/v1/admin/measurement/projects"
        response = request(self._admin, "POST", path, query={"companySlug": company_slug}, body=dict(project))
        return decode(MeasurementProject, response)

    def list(self, *, company_slug: str | None = None) -> MeasurementProjectListResponse:
        path = "/api/v1/admin/measurement/projects"
        return decode(
            MeasurementProjectListResponse, request(self._admin, "GET", path, query={"companySlug": company_slug})
        )

    def get(self, project_uuid: str, *, company_slug: str | None = None) -> MeasurementProject:
        path = f"/api/v1/admin/measurement/projects/{quote_path(project_uuid)}"
        return decode(MeasurementProject, request(self._admin, "GET", path, query={"companySlug": company_slug}))

    def submit_observation(
        self, project_uuid: str, observation: MeasurementObservationRow, *, company_slug: str | None = None
    ) -> MeasurementObservationBulkResponse:
        return self.submit_observations(project_uuid, {"rows": [observation]}, company_slug=company_slug)

    def submit_observations(
        self, project_uuid: str, body: MeasurementObservationBulkRequest, *, company_slug: str | None = None
    ) -> MeasurementObservationBulkResponse:
        path = f"/measurement/projects/{quote_path(project_uuid)}/observations:bulk"
        response = self._admin.request("POST", _with_company(path, company_slug), dict(body))
        validate_measurement_results(response.get("results"), len(body.get("rows") or []))
        return decode(MeasurementObservationBulkResponse, response)

    def import_csv_string(
        self, project_uuid: str, csv: str, expected_rows: int, *, company_slug: str | None = None
    ) -> MeasurementObservationBulkResponse:
        path = f"/measurement/projects/{quote_path(project_uuid)}/observations:csv"
        response = self._admin.request("POST", _with_company(path, company_slug), {"csv": csv})
        validate_measurement_results(response.get("results"), expected_rows)
        return decode(MeasurementObservationBulkResponse, response)

    def delete_decision(self, project_uuid: str, decision_uuid: str, *, company_slug: str | None = None) -> None:
        """Archive a measurement decision model."""
        request(
            self._admin,
            "DELETE",
            f"/api/v1/admin/measurement/projects/{quote_path(project_uuid)}/decisions/{quote_path(decision_uuid)}",
            query={"companySlug": company_slug},
        )

    def list_decisions(self, project_uuid: str, *, company_slug: str | None = None) -> MeasurementDecisionModelList:
        """List measurement decision models."""
        return decode(
            MeasurementDecisionModelList,
            request(
                self._admin,
                "GET",
                f"/api/v1/admin/measurement/projects/{quote_path(project_uuid)}/decisions",
                query={"companySlug": company_slug},
            ),
        )

    def get_decision(
        self, project_uuid: str, decision_uuid: str, *, company_slug: str | None = None
    ) -> MeasurementDecisionModel:
        """Get a measurement decision model."""
        return decode(
            MeasurementDecisionModel,
            request(
                self._admin,
                "GET",
                f"/api/v1/admin/measurement/projects/{quote_path(project_uuid)}/decisions/{quote_path(decision_uuid)}",
                query={"companySlug": company_slug},
            ),
        )

    def list_estimates(self, project_uuid: str, *, company_slug: str | None = None) -> ProjectEstimateListResponse:
        """List a measurement project's delivery estimates."""
        return decode(
            ProjectEstimateListResponse,
            request(
                self._admin,
                "GET",
                f"/api/v1/admin/measurement/projects/{quote_path(project_uuid)}/estimates",
                query={"companySlug": company_slug},
            ),
        )

    def get_import_run(
        self, project_uuid: str, import_uuid: str, *, company_slug: str | None = None
    ) -> MeasurementImportRun:
        """Get a measurement import."""
        return decode(
            MeasurementImportRun,
            request(
                self._admin,
                "GET",
                f"/api/v1/admin/measurement/projects/{quote_path(project_uuid)}/imports/{quote_path(import_uuid)}",
                query={"companySlug": company_slug},
            ),
        )

    def update(
        self, project_uuid: str, body: ProjectUpdateRequest, *, company_slug: str | None = None
    ) -> MeasurementProject:
        """Update a measurement project."""
        return decode(
            MeasurementProject,
            request(
                self._admin,
                "PATCH",
                f"/api/v1/admin/measurement/projects/{quote_path(project_uuid)}",
                query={"companySlug": company_slug},
                body=dict(body),
            ),
        )

    def update_decision(
        self,
        project_uuid: str,
        decision_uuid: str,
        body: MeasurementDecisionModelUpdateRequest,
        *,
        company_slug: str | None = None,
    ) -> MeasurementDecisionModel:
        """Update a measurement decision model."""
        return decode(
            MeasurementDecisionModel,
            request(
                self._admin,
                "PATCH",
                f"/api/v1/admin/measurement/projects/{quote_path(project_uuid)}/decisions/{quote_path(decision_uuid)}",
                query={"companySlug": company_slug},
                body=dict(body),
            ),
        )

    def create_calibration_exercise(
        self, project_uuid: str, body: MeasurementCalibrationExerciseCreate, *, company_slug: str | None = None
    ) -> MeasurementCalibrationExercise:
        """Create a measurement calibration exercise."""
        return decode(
            MeasurementCalibrationExercise,
            request(
                self._admin,
                "POST",
                f"/api/v1/admin/measurement/projects/{quote_path(project_uuid)}/calibration-exercises",
                query={"companySlug": company_slug},
                body=dict(body),
            ),
        )

    def cancel(self, project_uuid: str, *, company_slug: str | None = None) -> MeasurementProject:
        """Cancel a measurement project."""
        return decode(
            MeasurementProject,
            request(
                self._admin,
                "POST",
                f"/api/v1/admin/measurement/projects/{quote_path(project_uuid)}/cancel",
                query={"companySlug": company_slug},
            ),
        )

    def complete(
        self, project_uuid: str, body: ProjectCompleteRequest, *, company_slug: str | None = None
    ) -> MeasurementProject:
        """Complete a measurement project with its actual date."""
        return decode(
            MeasurementProject,
            request(
                self._admin,
                "POST",
                f"/api/v1/admin/measurement/projects/{quote_path(project_uuid)}/complete",
                query={"companySlug": company_slug},
                body=dict(body),
            ),
        )

    def create_decision_model(
        self, project_uuid: str, body: MeasurementDecisionModelCreate, *, company_slug: str | None = None
    ) -> MeasurementDecisionModel:
        """Create a measurement decision model."""
        return decode(
            MeasurementDecisionModel,
            request(
                self._admin,
                "POST",
                f"/api/v1/admin/measurement/projects/{quote_path(project_uuid)}/decisions",
                query={"companySlug": company_slug},
                body=dict(body),
            ),
        )

    def add_estimate(
        self, project_uuid: str, body: ProjectEstimateCreateRequest, *, company_slug: str | None = None
    ) -> ProjectEstimate:
        """Record a delivery estimate."""
        return decode(
            ProjectEstimate,
            request(
                self._admin,
                "POST",
                f"/api/v1/admin/measurement/projects/{quote_path(project_uuid)}/estimates",
                query={"companySlug": company_slug},
                body=dict(body),
            ),
        )

    def add_run(
        self, project_uuid: str, body: ProjectRunCreateRequest, *, company_slug: str | None = None
    ) -> MeasurementProject:
        """Start a new run of a measurement project."""
        return decode(
            MeasurementProject,
            request(
                self._admin,
                "POST",
                f"/api/v1/admin/measurement/projects/{quote_path(project_uuid)}/runs",
                query={"companySlug": company_slug},
                body=dict(body),
            ),
        )

    def add_series(
        self, project_uuid: str, body: MeasurementSeriesCreateRequest, *, company_slug: str | None = None
    ) -> MeasurementSeriesResponse:
        """Create measurement series."""
        return decode(
            MeasurementSeriesResponse,
            request(
                self._admin,
                "POST",
                f"/api/v1/admin/measurement/projects/{quote_path(project_uuid)}/series",
                query={"companySlug": company_slug},
                body=dict(body),
            ),
        )

    def add_target(
        self, project_uuid: str, body: MeasurementTargetCreateRequest, *, company_slug: str | None = None
    ) -> MeasurementTargetResponse:
        """Create a measurement target."""
        return decode(
            MeasurementTargetResponse,
            request(
                self._admin,
                "POST",
                f"/api/v1/admin/measurement/projects/{quote_path(project_uuid)}/targets",
                query={"companySlug": company_slug},
                body=dict(body),
            ),
        )

    def reopen_target(
        self, project_uuid: str, target_uuid: str, *, company_slug: str | None = None
    ) -> MeasurementTargetResponse:
        """Reopen a met measurement target."""
        return decode(
            MeasurementTargetResponse,
            request(
                self._admin,
                "POST",
                f"/api/v1/admin/measurement/projects/{quote_path(project_uuid)}/targets/{quote_path(target_uuid)}/reopen",
                query={"companySlug": company_slug},
            ),
        )


class MeasurementClient:
    """Reads measurement results from the analytics API; the credential names the tenant."""

    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin
        self.projects = MeasurementProjectClient(admin)
        self.predictions = PredictionReadClient(admin)
        from .uncertainty_models import UncertaintyModelClient

        self.uncertainty_models = UncertaintyModelClient(admin)

    def overview(self) -> MeasurementOverviewResponse:
        """Get measurement overview."""
        return decode(MeasurementOverviewResponse, request(self._admin, "GET", "/api/v1/measurement/overview"))


class MeasurementProjectClient:
    """Runs and reads a project's forecasts and decision simulations."""

    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin

    def get_forecast_run(self, project_uuid: str, run_uuid: str) -> MeasurementForecastRunResponse:
        """Get a measurement forecast run."""
        return decode(
            MeasurementForecastRunResponse,
            request(
                self._admin,
                "GET",
                f"/api/v1/measurement/projects/{quote_path(project_uuid)}/forecast-runs/{quote_path(run_uuid)}",
            ),
        )

    def get_forecast_story(self, project_uuid: str) -> MeasurementForecastStoryResponse:
        """Get recorded forecast story."""
        return decode(
            MeasurementForecastStoryResponse,
            request(self._admin, "GET", f"/api/v1/measurement/projects/{quote_path(project_uuid)}/forecast-story"),
        )

    def run_forecast(self, project_uuid: str, body: MeasurementForecastRunRequest) -> MeasurementForecastRunResponse:
        """Run a measurement forecast."""
        return decode(
            MeasurementForecastRunResponse,
            request(
                self._admin,
                "POST",
                f"/api/v1/measurement/projects/{quote_path(project_uuid)}/forecast-runs",
                body=dict(body),
            ),
        )

    def run_decision_simulation(
        self, project_uuid: str, decision_uuid: str, body: MeasurementSimulationRunRequest
    ) -> MeasurementSimulationRun:
        """Run a value-of-information simulation for one decision model."""
        path = _simulation_runs_path(project_uuid, decision_uuid)
        return decode(MeasurementSimulationRun, request(self._admin, "POST", path, body=dict(body)))

    def get_decision_simulation_run(
        self, project_uuid: str, decision_uuid: str, run_uuid: str
    ) -> MeasurementSimulationRun:
        """Read one recorded decision simulation run."""
        path = f"{_simulation_runs_path(project_uuid, decision_uuid)}/{quote_path(run_uuid)}"
        return decode(MeasurementSimulationRun, request(self._admin, "GET", path))


class PredictionReadClient:
    """Reads the tenant's active prediction definitions and what they produced."""

    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin

    def list_definitions(self) -> PredictionDefinitionReadList:
        """List the tenant's active prediction definitions."""
        return decode(PredictionDefinitionReadList, request(self._admin, "GET", _PREDICTION_DEFINITIONS_PATH))

    def get_definition(self, definition_uuid: str) -> PredictionDefinitionRead:
        """Read one prediction definition."""
        return decode(PredictionDefinitionRead, request(self._admin, "GET", _definition_path(definition_uuid)))

    def list_runs(self, definition_uuid: str, *, since: str | None = None) -> PredictionRunReadList:
        """List a definition's runs, newest first; ``since`` is an RFC 3339 lower bound."""
        path = _definition_path(definition_uuid, "/runs")
        return decode(PredictionRunReadList, request(self._admin, "GET", path, query={"since": since}))

    def list_outcomes(self, definition_uuid: str) -> PredictionOutcomeReadList:
        """List how a definition's runs resolved."""
        path = _definition_path(definition_uuid, "/outcomes")
        return decode(PredictionOutcomeReadList, request(self._admin, "GET", path))

    def get_latest_evaluation(self, definition_uuid: str) -> PredictionEvaluationRead:
        """Read a definition's latest evaluation."""
        path = _definition_path(definition_uuid, "/evaluations")
        return decode(PredictionEvaluationRead, request(self._admin, "GET", path))


_PREDICTION_DEFINITIONS_PATH = "/api/v1/measurement/predictions/definitions"


def _definition_path(definition_uuid: str, resource: str = "") -> str:
    return f"{_PREDICTION_DEFINITIONS_PATH}/{quote_path(definition_uuid)}{resource}"


def _simulation_runs_path(project_uuid: str, decision_uuid: str) -> str:
    project = quote_path(project_uuid)
    return f"/api/v1/measurement/projects/{project}/decisions/{quote_path(decision_uuid)}/simulation-runs"
