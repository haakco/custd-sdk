from __future__ import annotations

from typing import Any, Literal, NotRequired, TypedDict

from ._wire import decode, request
from .client import AdminClient, quote_path
from .measurement import DurationEvaluationRequest, DurationEvaluationResponse

PredictionProjectKind = Literal[
    "deadline_forecast",
    "runway_forecast",
    "decision_analysis",
    "calibration",
    "duration",
    "event_probability",
]


class PredictionDefinitionCreateRequest(TypedDict, total=False):
    definition_key: str
    display_name: str
    description: str
    project_kind: PredictionProjectKind


class PredictionDefinitionUpdateRequest(TypedDict, total=False):
    definition_key: str
    display_name: str
    description: str
    revision: int


class PredictionVersionPublishRequest(TypedDict):
    definition: dict[str, Any]
    created_by: str


class PredictionSignalSourceCreateRequest(TypedDict, total=False):
    source_key: str
    source_mode: str
    display_name: str
    description: str
    configuration: dict[str, Any]
    poll_interval_seconds: int


class PredictionActivateRequest(TypedDict):
    version_uuid: str
    reason: NotRequired[str]


class PredictionPauseRequest(TypedDict, total=False):
    reason: str


class PredictionRunNowRequest(TypedDict, total=False):
    worker_id: str


class PredictionDefinition(TypedDict):
    uuid: str
    definition_key: str
    display_name: str
    project_kind: PredictionProjectKind
    schedule_kind: str
    status: str
    is_paused: bool
    created_at: str
    updated_at: str
    description: NotRequired[str]
    active_version_uuid: NotRequired[str]
    candidate_version_uuid: NotRequired[str]
    candidate_version_count: NotRequired[int]
    default_horizon_seconds: NotRequired[int]


class PredictionDefinitionListResponse(TypedDict):
    items: list[PredictionDefinition]
    next_page_token: NotRequired[str]


class PredictionVersion(TypedDict):
    uuid: str
    version_uuid: str
    version_number: int
    version_status: str
    definition: dict[str, Any]
    definition_hash: str
    feature_count: int
    source_count: int
    created_at: str
    created_by: str


class PredictionEvaluationSummary(TypedDict):
    window_start_at: str
    window_end_at: str
    resolved_run_count: int
    positive_count: int
    negative_count: int
    sparse_bucket_count: int
    brier_score: NotRequired[float]
    log_loss: NotRequired[float]


class PredictionOutcome(TypedDict):
    run_uuid: str
    outcome_kind: str
    resolution: str
    observed_value: int
    is_late_evidence: bool
    resolved_at: NotRequired[str]


class PredictionOutcomeListResponse(TypedDict):
    outcomes: list[PredictionOutcome]


class PredictionRun(TypedDict):
    run_uuid: str
    as_of_at: str
    horizon_end_at: str
    generated_at: str
    engine_version: str
    input_hash: str
    baseline: float
    output: float
    override_applied: bool
    warning_count: int
    duration_milliseconds: NotRequired[int]


class PredictionRunListResponse(TypedDict):
    runs: list[PredictionRun]


class PredictionThresholdEvent(TypedDict):
    version_uuid: str
    trigger_run_uuid: str
    dedup_key: str
    direction: str
    hysteresis_state: str
    threshold: float
    observed_value: float
    emitted_at: str


class PredictionThresholdEventListResponse(TypedDict):
    events: list[PredictionThresholdEvent]


class PredictionSignalSource(TypedDict):
    uuid: str
    source_key: str
    source_mode: str
    source_status: str
    display_name: str
    is_paused: bool
    consecutive_failed_count: int
    created_at: str
    updated_at: str
    description: NotRequired[str]
    poll_interval_seconds: NotRequired[int]
    last_succeeded_at: NotRequired[str]


class PredictionSignalSourceListResponse(TypedDict):
    sources: list[PredictionSignalSource]
    next_page_token: NotRequired[str]


class PredictionAdminClient:
    """Prediction definitions, their versions, runs and outcomes, and their signal sources.

    Responses keep the server's snake_case wire spelling; a JSON null list decodes as empty.
    """

    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin

    def list_definitions(
        self, company_slug: str, page_size: int | None = None, page_token: str | None = None
    ) -> PredictionDefinitionListResponse:
        path = self._collection("/definitions", company_slug, page_size, page_token)
        return decode(PredictionDefinitionListResponse, self._admin.request("GET", path))

    def get_definition(self, company_slug: str, definition_uuid: str) -> PredictionDefinition:
        path = self._resource(f"/definitions/{definition_uuid}", company_slug)
        return decode(PredictionDefinition, self._admin.request("GET", path))

    def create_definition(self, company_slug: str, body: PredictionDefinitionCreateRequest) -> PredictionDefinition:
        path = self._collection("/definitions", company_slug)
        return decode(PredictionDefinition, self._admin.request("POST", path, dict(body)))

    def update_definition(
        self, company_slug: str, definition_uuid: str, body: PredictionDefinitionUpdateRequest
    ) -> PredictionDefinition:
        path = self._resource(f"/definitions/{definition_uuid}", company_slug)
        return decode(PredictionDefinition, self._admin.request("PATCH", path, dict(body)))

    def get_version(self, company_slug: str, definition_uuid: str, version_uuid: str) -> PredictionVersion:
        path = self._resource(f"/definitions/{definition_uuid}/versions/{version_uuid}", company_slug)
        return decode(PredictionVersion, self._admin.request("GET", path))

    def publish_version(
        self, company_slug: str, definition_uuid: str, body: PredictionVersionPublishRequest
    ) -> PredictionVersion:
        path = self._resource(f"/definitions/{definition_uuid}/publish", company_slug)
        return decode(PredictionVersion, self._admin.request("POST", path, dict(body)))

    def activate_version(
        self, company_slug: str, definition_uuid: str, body: PredictionActivateRequest
    ) -> PredictionVersion:
        path = self._resource(f"/definitions/{definition_uuid}/activate", company_slug)
        return decode(PredictionVersion, self._admin.request("POST", path, dict(body)))

    def pause_definition(
        self, company_slug: str, definition_uuid: str, body: PredictionPauseRequest | None = None
    ) -> None:
        self._admin.request(
            "POST", self._resource(f"/definitions/{definition_uuid}/pause", company_slug), dict(body or {})
        )

    def resume_definition(self, company_slug: str, definition_uuid: str) -> None:
        self._admin.request("POST", self._resource(f"/definitions/{definition_uuid}/resume", company_slug))

    def archive_definition(self, company_slug: str, definition_uuid: str) -> None:
        self._admin.request("POST", self._resource(f"/definitions/{definition_uuid}/archive", company_slug))

    def run_now(self, company_slug: str, definition_uuid: str, body: PredictionRunNowRequest | None = None) -> None:
        self._admin.request(
            "POST", self._resource(f"/definitions/{definition_uuid}/run-now", company_slug), dict(body or {})
        )

    def list_runs(
        self, company_slug: str, definition_uuid: str, page_size: int | None = None
    ) -> PredictionRunListResponse:
        path = self._collection(f"/definitions/{quote_path(definition_uuid)}/runs", company_slug, page_size)
        return decode(PredictionRunListResponse, self._admin.request("GET", path))

    def list_outcomes(
        self, company_slug: str, definition_uuid: str, page_size: int | None = None
    ) -> PredictionOutcomeListResponse:
        path = self._collection(f"/definitions/{quote_path(definition_uuid)}/outcomes", company_slug, page_size)
        return decode(PredictionOutcomeListResponse, self._admin.request("GET", path))

    def get_evaluation(self, company_slug: str, definition_uuid: str) -> PredictionEvaluationSummary:
        path = self._resource(f"/definitions/{definition_uuid}/evaluations", company_slug)
        return decode(PredictionEvaluationSummary, self._admin.request("GET", path))

    def evaluate_duration_history(
        self, company_slug: str, definition_uuid: str, body: DurationEvaluationRequest
    ) -> DurationEvaluationResponse:
        """Evaluate tenant-scoped duration history with chronological rolling-origin folds."""
        path = f"/api/v1/admin/measurement/predictions/definitions/{quote_path(definition_uuid)}/duration-evaluations"
        response = request(self._admin, "POST", path, query={"companySlug": company_slug}, body=dict(body))
        return decode(DurationEvaluationResponse, response)

    def list_threshold_events(
        self, company_slug: str, definition_uuid: str, page_size: int | None = None
    ) -> PredictionThresholdEventListResponse:
        path = self._collection(f"/definitions/{quote_path(definition_uuid)}/threshold-events", company_slug, page_size)
        return decode(PredictionThresholdEventListResponse, self._admin.request("GET", path))

    def list_signal_sources(
        self, company_slug: str, page_size: int | None = None, page_token: str | None = None
    ) -> PredictionSignalSourceListResponse:
        path = self._collection("/sources", company_slug, page_size, page_token)
        return decode(PredictionSignalSourceListResponse, self._admin.request("GET", path))

    def get_signal_source(self, company_slug: str, source_uuid: str) -> PredictionSignalSource:
        path = self._resource(f"/sources/{source_uuid}", company_slug)
        return decode(PredictionSignalSource, self._admin.request("GET", path))

    def create_signal_source(
        self, company_slug: str, body: PredictionSignalSourceCreateRequest
    ) -> PredictionSignalSource:
        path = self._collection("/sources", company_slug)
        return decode(PredictionSignalSource, self._admin.request("POST", path, dict(body)))

    def activate_signal_source(self, company_slug: str, source_uuid: str) -> None:
        self._admin.request("POST", self._resource(f"/sources/{source_uuid}/activate", company_slug))

    def archive_signal_source(self, company_slug: str, source_uuid: str) -> None:
        self._admin.request("POST", self._resource(f"/sources/{source_uuid}/archive", company_slug))

    @staticmethod
    def _collection(path: str, company_slug: str, page_size: int | None = None, page_token: str | None = None) -> str:
        query = [f"companySlug={quote_path(company_slug)}"]
        if page_size is not None:
            query.append(f"pageSize={page_size}")
        if page_token is not None:
            query.append(f"pageToken={quote_path(page_token)}")
        return f"/measurement/predictions{path}?{'&'.join(query)}"

    @classmethod
    def _resource(cls, path: str, company_slug: str) -> str:
        segments = path.split("/")
        encoded = "/".join(segment if index == 0 else quote_path(segment) for index, segment in enumerate(segments))
        return cls._collection(encoded, company_slug)
