from __future__ import annotations

from typing import TypedDict, cast

from .client import AdminClient, quote_path


class OffboardingScheduleRequest(TypedDict):
    tenantSlug: str
    executeAt: str
    reason: str


class OffboardingSchedule(TypedDict, total=False):
    tenantSlug: str
    executeAt: str
    reason: str
    state: str
    scheduledAt: str


class OffboardingScheduleListResponse(TypedDict):
    schedules: list[OffboardingSchedule]


class OffboardingRequestCreate(TypedDict):
    tenantSlug: str
    requestedByUserId: str
    idempotencyKey: str


class OffboardingRequest(TypedDict, total=False):
    requestUuid: str
    tenantSlug: str
    state: str
    requestedAt: str
    previewInventoryDigest: str
    exportArtifactId: str


class OffboardingPreviewResponse(TypedDict, total=False):
    requestUuid: str
    previewInventoryDigest: str
    perStore: list[dict[str, object]]


class OffboardingExecuteRequest(TypedDict):
    waiver: dict[str, str]


class OffboardingClient:
    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin

    def schedule(self, b: OffboardingScheduleRequest) -> OffboardingSchedule:
        return cast(OffboardingSchedule, self._admin.request(
            "POST", "/offboarding/schedules", dict(b)
        ))

    def list_schedules(self) -> OffboardingScheduleListResponse:
        return cast(OffboardingScheduleListResponse, self._admin.request("GET", "/offboarding/schedules"))

    def get_schedule(self, slug: str) -> OffboardingSchedule:
        return cast(OffboardingSchedule, self._admin.request(
            "GET", f"/offboarding/schedules/{quote_path(slug)}"
        ))

    def cancel_schedule(self, slug: str, b: dict[str, str]) -> None:
        self._admin.request(
            "POST", f"/offboarding/schedules/{quote_path(slug)}/cancel", b
        )

    def request(self, b: OffboardingRequestCreate) -> OffboardingRequest:
        return cast(OffboardingRequest, self._admin.request("POST", "/offboarding", dict(b)))

    def get_request(self, request_id: str) -> OffboardingRequest:
        return cast(OffboardingRequest, self._admin.request(
            "GET", f"/offboarding/{quote_path(request_id)}"
        ))

    def cancel_request(self, request_id: str) -> None:
        self._admin.request("POST", f"/offboarding/{quote_path(request_id)}/cancel")

    def confirm_request(self, request_id: str) -> None:
        self._admin.request("POST", f"/offboarding/{quote_path(request_id)}/confirm")

    def preview(self, request_id: str) -> OffboardingPreviewResponse:
        return cast(OffboardingPreviewResponse, self._admin.request(
            "POST", f"/offboarding/requests/{quote_path(request_id)}/preview"
        ))

    def export(self, request_id: str) -> dict[str, object]:
        return self._admin.request(
            "POST", f"/offboarding/requests/{quote_path(request_id)}/export"
        )

    def download(self, request_id: str) -> dict[str, object]:
        return self._admin.request(
            "GET", f"/offboarding/requests/{quote_path(request_id)}/download"
        )

    def acknowledge(self, request_id: str) -> dict[str, object]:
        return self._admin.request(
            "POST", f"/offboarding/requests/{quote_path(request_id)}/acknowledge"
        )

    def execute(self, request_id: str, b: OffboardingExecuteRequest) -> dict[str, object]:
        return self._admin.request(
            "POST", f"/offboarding/requests/{quote_path(request_id)}/execute", dict(b)
        )

    def retry(self, request_id: str) -> dict[str, object]:
        return self._admin.request(
            "POST", f"/offboarding/requests/{quote_path(request_id)}/retry"
        )

    def receipt(self, request_id: str) -> dict[str, object]:
        return self._admin.request(
            "GET", f"/offboarding/requests/{quote_path(request_id)}/receipt"
        )
