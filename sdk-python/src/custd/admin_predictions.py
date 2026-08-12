from __future__ import annotations

from typing import Any, TypedDict

from .client import AdminClient, quote_path


class PredictionDefinitionCreateRequest(TypedDict, total=False):
    definition_key: str
    display_name: str
    description: str


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


class PredictionRollbackRequest(TypedDict, total=False):
    version_uuid: str
    reason: str


class PredictionPauseRequest(TypedDict, total=False):
    reason: str


class PredictionRunNowRequest(TypedDict, total=False):
    worker_id: str


class PredictionAdminClient:
    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin

    def list_definitions(
        self, company_slug: str, page_size: int | None = None, page_token: str | None = None
    ) -> dict[str, Any]:
        return self._admin.request("GET", self._collection("/definitions", company_slug, page_size, page_token))

    def get_definition(self, company_slug: str, definition_uuid: str) -> dict[str, Any]:
        return self._admin.request("GET", self._resource(f"/definitions/{definition_uuid}", company_slug))

    def create_definition(self, company_slug: str, body: PredictionDefinitionCreateRequest) -> dict[str, Any]:
        return self._admin.request("POST", self._collection("/definitions", company_slug), dict(body))

    def update_definition(
        self, company_slug: str, definition_uuid: str, body: PredictionDefinitionUpdateRequest
    ) -> dict[str, Any]:
        return self._admin.request(
            "PATCH", self._resource(f"/definitions/{definition_uuid}", company_slug), dict(body)
        )

    def get_version(self, company_slug: str, definition_uuid: str, version_uuid: str) -> dict[str, Any]:
        return self._admin.request(
            "GET", self._resource(f"/definitions/{definition_uuid}/versions/{version_uuid}", company_slug)
        )

    def publish_version(
        self, company_slug: str, definition_uuid: str, body: PredictionVersionPublishRequest
    ) -> dict[str, Any]:
        return self._admin.request(
            "POST", self._resource(f"/definitions/{definition_uuid}/publish", company_slug), dict(body)
        )

    def activate_version(
        self, company_slug: str, definition_uuid: str, body: PredictionActivateRequest
    ) -> dict[str, Any]:
        return self._admin.request(
            "POST", self._resource(f"/definitions/{definition_uuid}/activate", company_slug), dict(body)
        )

    def rollback_version(
        self, company_slug: str, definition_uuid: str, body: PredictionRollbackRequest
    ) -> dict[str, Any]:
        return self._admin.request(
            "POST", self._resource(f"/definitions/{definition_uuid}/rollback", company_slug), dict(body)
        )

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

    def list_runs(self, company_slug: str, definition_uuid: str, page_size: int | None = None) -> list[dict[str, Any]]:
        return self._list(f"/definitions/{definition_uuid}/runs", company_slug, page_size)

    def list_outcomes(
        self, company_slug: str, definition_uuid: str, page_size: int | None = None
    ) -> list[dict[str, Any]]:
        return self._list(f"/definitions/{definition_uuid}/outcomes", company_slug, page_size)

    def get_evaluation(self, company_slug: str, definition_uuid: str) -> dict[str, Any]:
        return self._admin.request("GET", self._resource(f"/definitions/{definition_uuid}/evaluations", company_slug))

    def list_threshold_events(
        self, company_slug: str, definition_uuid: str, page_size: int | None = None
    ) -> list[dict[str, Any]]:
        return self._list(f"/definitions/{definition_uuid}/threshold-events", company_slug, page_size)

    def list_signal_sources(
        self, company_slug: str, page_size: int | None = None, page_token: str | None = None
    ) -> list[dict[str, Any]]:
        return self._list("/sources", company_slug, page_size, page_token)

    def get_signal_source(self, company_slug: str, source_uuid: str) -> dict[str, Any]:
        return self._admin.request("GET", self._resource(f"/sources/{source_uuid}", company_slug))

    def create_signal_source(self, company_slug: str, body: PredictionSignalSourceCreateRequest) -> dict[str, Any]:
        return self._admin.request("POST", self._collection("/sources", company_slug), dict(body))

    def activate_signal_source(self, company_slug: str, source_uuid: str) -> None:
        self._admin.request("POST", self._resource(f"/sources/{source_uuid}/activate", company_slug))

    def archive_signal_source(self, company_slug: str, source_uuid: str) -> None:
        self._admin.request("POST", self._resource(f"/sources/{source_uuid}/archive", company_slug))

    def _list(
        self, path: str, company_slug: str, page_size: int | None = None, page_token: str | None = None
    ) -> list[dict[str, Any]]:
        response = self._admin.request("GET", self._collection(path, company_slug, page_size, page_token))
        return list(response.get("items", []))

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
