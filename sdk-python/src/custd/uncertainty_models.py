"""Uncertainty models: versioned quantity models and their Monte Carlo runs.

``client.admin.uncertainty_models`` creates, versions, copies and deletes a tenant's models on
the admin API; ``client.measurement.uncertainty_models`` runs a model version and reads its runs
on the analytics API.
"""

from __future__ import annotations

from typing import NotRequired, TypedDict

from ._wire import decode, request
from .client import AdminClient, quote_path


class UncertaintyModel(TypedDict):
    createdAt: str
    description: str
    latestVersion: int
    modelUuid: str
    name: str
    updatedAt: str


class UncertaintyModelList(TypedDict):
    models: list[UncertaintyModel]


class UncertaintyQueuedRunFailure(TypedDict):
    attempts: int
    error: str
    failedAt: str


class UncertaintyInputSource(TypedDict):
    field: str
    kind: str
    projectUuid: str


class UncertaintyInput(TypedDict):
    distribution: NotRequired[str]
    high: NotRequired[float]
    low: NotRequired[float]
    samples: NotRequired[list[float]]
    shape: str
    source: NotRequired[UncertaintyInputSource]
    successes: NotRequired[int]
    trials: NotRequired[int]
    value: NotRequired[float]


class UncertaintyQuantity(TypedDict):
    description: NotRequired[str]
    formula: NotRequired[str]
    input: NotRequired[UncertaintyInput]
    kind: str
    name: str
    unit: NotRequired[str]


class UncertaintyVersion(TypedDict):
    createdAt: str
    note: str
    quantities: list[UncertaintyQuantity]
    versionNumber: int
    versionUuid: str


class UncertaintyModelDetail(TypedDict):
    createdAt: str
    description: str
    latestVersion: int
    modelUuid: str
    name: str
    queuedRunFailure: NotRequired[UncertaintyQueuedRunFailure]
    updatedAt: str
    version: NotRequired[UncertaintyVersion]


class UncertaintyVersionSummary(TypedDict):
    createdAt: str
    note: str
    quantityCount: int
    versionNumber: int
    versionUuid: str


class UncertaintyVersionList(TypedDict):
    versions: list[UncertaintyVersionSummary]


class UncertaintyCreateModelRequest(TypedDict):
    description: NotRequired[str]
    name: str
    note: NotRequired[str]
    quantities: NotRequired[list[UncertaintyQuantity]]


class UncertaintyCopyModelRequest(TypedDict):
    name: NotRequired[str]
    versionNumber: NotRequired[int]


class UncertaintyCreateVersionRequest(TypedDict):
    note: NotRequired[str]
    quantities: list[UncertaintyQuantity]


class UncertaintyRunSummary(TypedDict):
    createdAt: str
    modelUuid: str
    runUuid: str
    sampleCount: int
    seed: int
    sourceForecastRunUuid: NotRequired[str]
    trigger: str
    versionNumber: int


class UncertaintyRunList(TypedDict):
    runs: list[UncertaintyRunSummary]


class UncertaintyBoundInput(TypedDict):
    detail: NotRequired[str]
    forecastGeneratedAt: NotRequired[str]
    forecastRunUuid: NotRequired[str]
    quantity: str
    source: UncertaintyInputSource
    state: str
    value: NotRequired[float]


class UncertaintyDecision(TypedDict):
    minimumWorthwhile: NotRequired[float]
    output: str
    threshold: float
    valuePerUnit: float


class UncertaintyInputInformation(TypedDict):
    expectedValueOfPerfectInformation: float
    name: str


class UncertaintyInformation(TypedDict):
    actProbability: float
    expectedValueOfPerfectInformation: float
    inputs: list[UncertaintyInputInformation]
    recommended: str
    suggestedNextMeasurement: NotRequired[str]


class UncertaintyQuantityError(TypedDict):
    code: str
    detail: str


class UncertaintyHistogram(TypedDict):
    counts: list[int]
    max: float
    min: float


class UncertaintyPercentiles(TypedDict):
    p25: float
    p5: float
    p50: float
    p75: float
    p95: float


class UncertaintyQuantitySummary(TypedDict):
    histogram: UncertaintyHistogram
    mean: float
    percentiles: UncertaintyPercentiles
    stdDev: float


class UncertaintyQuantityResult(TypedDict):
    error: NotRequired[UncertaintyQuantityError]
    name: str
    summary: NotRequired[UncertaintyQuantitySummary]


class UncertaintyScatterPoint(TypedDict):
    input: float
    output: float


class UncertaintyInputSensitivity(TypedDict):
    name: str
    rankCorrelation: float
    scatter: NotRequired[list[UncertaintyScatterPoint]]
    share: float


class UncertaintySensitivity(TypedDict):
    inputs: list[UncertaintyInputSensitivity]
    output: str


class UncertaintyRunDetail(TypedDict):
    boundInputs: list[UncertaintyBoundInput]
    createdAt: str
    decision: NotRequired[UncertaintyDecision]
    information: NotRequired[UncertaintyInformation]
    modelUuid: str
    quantities: list[UncertaintyQuantityResult]
    queuedRunFailure: NotRequired[UncertaintyQueuedRunFailure]
    runUuid: str
    sampleCount: int
    seed: int
    sensitivity: NotRequired[UncertaintySensitivity]
    sensitivityOutput: NotRequired[str]
    sourceForecastRunUuid: NotRequired[str]
    trigger: str
    versionNumber: int


class UncertaintyRunRequest(TypedDict):
    decision: NotRequired[UncertaintyDecision]
    sampleCount: NotRequired[int]
    seed: int
    sensitivityOutput: NotRequired[str]
    versionNumber: NotRequired[int]


class UncertaintyModelAdminClient:
    """Creates, versions, copies and deletes the tenant's uncertainty models."""

    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin

    def delete(self, model_uuid: str, *, company_slug: str | None = None) -> None:
        """Delete an uncertainty model with its versions and runs; an app item's model is deleted with its item."""
        request(
            self._admin,
            "DELETE",
            f"/api/v1/admin/uncertainty-models/{quote_path(model_uuid)}",
            query={"companySlug": company_slug},
        )

    def list(self, *, company_slug: str | None = None, source: str | None = None) -> UncertaintyModelList:
        """List the tenant's uncertainty models."""
        return decode(
            UncertaintyModelList,
            request(
                self._admin,
                "GET",
                "/api/v1/admin/uncertainty-models",
                query={"companySlug": company_slug, "source": source},
            ),
        )

    def get(self, model_uuid: str, *, company_slug: str | None = None) -> UncertaintyModelDetail:
        """Get an uncertainty model with its latest version."""
        return decode(
            UncertaintyModelDetail,
            request(
                self._admin,
                "GET",
                f"/api/v1/admin/uncertainty-models/{quote_path(model_uuid)}",
                query={"companySlug": company_slug},
            ),
        )

    def list_versions(self, model_uuid: str, *, company_slug: str | None = None) -> UncertaintyVersionList:
        """List an uncertainty model's versions, newest first."""
        return decode(
            UncertaintyVersionList,
            request(
                self._admin,
                "GET",
                f"/api/v1/admin/uncertainty-models/{quote_path(model_uuid)}/versions",
                query={"companySlug": company_slug},
            ),
        )

    def get_version(
        self, model_uuid: str, version_number: int, *, company_slug: str | None = None
    ) -> UncertaintyVersion:
        """Get one version of an uncertainty model."""
        return decode(
            UncertaintyVersion,
            request(
                self._admin,
                "GET",
                f"/api/v1/admin/uncertainty-models/{quote_path(model_uuid)}/versions/{version_number}",
                query={"companySlug": company_slug},
            ),
        )

    def create(self, body: UncertaintyCreateModelRequest, *, company_slug: str | None = None) -> UncertaintyModelDetail:
        """Create an uncertainty model, with version 1 when quantities are given."""
        return decode(
            UncertaintyModelDetail,
            request(
                self._admin,
                "POST",
                "/api/v1/admin/uncertainty-models",
                query={"companySlug": company_slug},
                body=dict(body),
            ),
        )

    def copy(
        self, model_uuid: str, body: UncertaintyCopyModelRequest, *, company_slug: str | None = None
    ) -> UncertaintyModelDetail:
        """Copy one version of an uncertainty model into a new model."""
        return decode(
            UncertaintyModelDetail,
            request(
                self._admin,
                "POST",
                f"/api/v1/admin/uncertainty-models/{quote_path(model_uuid)}/copy",
                query={"companySlug": company_slug},
                body=dict(body),
            ),
        )

    def create_version(
        self, model_uuid: str, body: UncertaintyCreateVersionRequest, *, company_slug: str | None = None
    ) -> UncertaintyVersion:
        """Save a new immutable version of an uncertainty model."""
        return decode(
            UncertaintyVersion,
            request(
                self._admin,
                "POST",
                f"/api/v1/admin/uncertainty-models/{quote_path(model_uuid)}/versions",
                query={"companySlug": company_slug},
                body=dict(body),
            ),
        )


class UncertaintyModelClient:
    """Runs an uncertainty model version and reads its runs."""

    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin

    def list_runs(self, model_uuid: str) -> UncertaintyRunList:
        """List an uncertainty model's runs."""
        return decode(
            UncertaintyRunList,
            request(self._admin, "GET", f"/api/v1/measurement/uncertainty-models/{quote_path(model_uuid)}/runs"),
        )

    def get_run(self, model_uuid: str, run_uuid: str) -> UncertaintyRunDetail:
        """Get an uncertainty model run."""
        return decode(
            UncertaintyRunDetail,
            request(
                self._admin,
                "GET",
                f"/api/v1/measurement/uncertainty-models/{quote_path(model_uuid)}/runs/{quote_path(run_uuid)}",
            ),
        )

    def create_run(self, model_uuid: str, body: UncertaintyRunRequest) -> UncertaintyRunDetail:
        """Run an uncertainty model."""
        return decode(
            UncertaintyRunDetail,
            request(
                self._admin,
                "POST",
                f"/api/v1/measurement/uncertainty-models/{quote_path(model_uuid)}/runs",
                body=dict(body),
            ),
        )
