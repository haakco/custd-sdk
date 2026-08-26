from __future__ import annotations

from collections.abc import Mapping
from typing import Any, NotRequired, TypedDict, cast

from .client import AdminClient, AdminRequestOptions, quote_path


class OffboardingScheduleRequest(TypedDict):
    tenant_slug: str
    effective_at: str
    grace_period_days: int
    reason: str
    status: NotRequired[str]


class OffboardingSchedule(TypedDict, total=False):
    tenant_slug: str
    effective_at: str
    grace_period_days: int
    reason: str
    status: str
    updated_at: str


class OffboardingScheduleListResponse(TypedDict):
    schedules: list[OffboardingSchedule]


class OffboardingCancelRequest(TypedDict):
    reason: str


class OffboardingRequestCreate(TypedDict):
    confirmation: str


class OffboardingRequest(TypedDict, total=False):
    request_uuid: str
    state: str
    requested_at: str


class OffboardingPreviewStore(TypedDict, total=False):
    store: str
    kind: str
    retention_class: str
    estimated_count: int
    source_authority: str


class OffboardingPreviewResponse(TypedDict, total=False):
    request_uuid: str
    generated_at: str
    expires_at: str
    stores: list[OffboardingPreviewStore]
    exclusions: list[dict[str, object]]
    preview_inventory_digest: str
    complete: bool
    partial: bool


class OffboardingWaiver(TypedDict):
    role: str
    reason: str
    timestamp: NotRequired[str]


class OffboardingExecuteRequest(TypedDict):
    waiver: OffboardingWaiver


class OffboardingExportResponse(TypedDict):
    request_uuid: str
    checksum_sha256: str
    byte_size: int
    record_count: int
    generated_at: str
    expires_at: str
    preview_inventory_digest: str


class OffboardingDownloadResponse(TypedDict):
    request_uuid: str
    download_url: str
    checksum_sha256: str
    byte_size: int
    record_count: int
    generated_at: str
    expires_at: str
    preview_inventory_digest: str


class OffboardingReceiptPerStore(TypedDict):
    store: str
    retention_class: str
    deleted_count: int
    retained_exceptions_count: int


class OffboardingReceiptResponse(TypedDict, total=False):
    company_id: int
    requested_by_user_id: int | None
    requested_by_actor: str
    requested_at: str
    completed_at: str
    final_state: str
    per_store: list[OffboardingReceiptPerStore]
    waiver: OffboardingWaiver | None
    sha256: str


def _value(body: Mapping[str, Any], name: str, wire_name: str | None = None) -> Any:
    if name in body:
        return body[name]
    if wire_name is not None and wire_name in body:
        return body[wire_name]
    raise KeyError(name)


def _schedule_payload(body: OffboardingScheduleRequest) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "tenantSlug": _value(body, "tenant_slug", "tenantSlug"),
        "effectiveAt": _value(body, "effective_at", "effectiveAt"),
        "gracePeriodDays": _value(body, "grace_period_days", "gracePeriodDays"),
        "reason": _value(body, "reason"),
    }
    status = body.get("status")
    if status:
        payload["status"] = status
    return payload


def _request_from_wire(response: Mapping[str, Any]) -> OffboardingRequest:
    result: dict[str, Any] = {}
    _copy_value(result, "request_uuid", response, "requestUuid")
    _copy_value(result, "state", response, "state")
    _copy_value(result, "requested_at", response, "requestedAt")
    return cast(OffboardingRequest, result)


def _schedule_from_wire(response: Mapping[str, Any]) -> OffboardingSchedule:
    result: dict[str, Any] = {}
    _copy_value(result, "tenant_slug", response, "tenantSlug")
    _copy_value(result, "effective_at", response, "effectiveAt")
    _copy_value(result, "grace_period_days", response, "gracePeriodDays")
    _copy_value(result, "reason", response, "reason")
    _copy_value(result, "status", response, "status")
    _copy_value(result, "updated_at", response, "updatedAt")
    return cast(OffboardingSchedule, result)


def _preview_from_wire(response: Mapping[str, Any]) -> OffboardingPreviewResponse:
    result: dict[str, Any] = {}
    _copy_value(result, "request_uuid", response, "requestUuid")
    _copy_value(result, "generated_at", response, "generatedAt")
    _copy_value(result, "expires_at", response, "expiresAt")
    _copy_value(result, "preview_inventory_digest", response, "previewInventoryDigest")
    _copy_value(result, "complete", response, "complete")
    _copy_value(result, "partial", response, "partial")
    if "exclusions" in response:
        result["exclusions"] = response["exclusions"]
    stores = response.get("stores", [])
    result["stores"] = [_preview_store_from_wire(store) for store in _mapping_list(stores)]
    return cast(OffboardingPreviewResponse, result)


def _preview_store_from_wire(store: Mapping[str, Any]) -> OffboardingPreviewStore:
    result: dict[str, Any] = {}
    _copy_value(result, "store", store, "store")
    _copy_value(result, "kind", store, "kind")
    _copy_value(result, "retention_class", store, "retention_class")
    _copy_value(result, "estimated_count", store, "estimated_count")
    _copy_value(result, "source_authority", store, "source_authority")
    return cast(OffboardingPreviewStore, result)


def _export_from_wire(response: Mapping[str, Any]) -> OffboardingExportResponse:
    result: dict[str, Any] = {}
    _copy_value(result, "request_uuid", response, "requestUuid")
    _copy_value(result, "checksum_sha256", response, "checksumSha256")
    _copy_value(result, "byte_size", response, "byteSize")
    _copy_value(result, "record_count", response, "recordCount")
    _copy_value(result, "generated_at", response, "generatedAt")
    _copy_value(result, "expires_at", response, "expiresAt")
    _copy_value(result, "preview_inventory_digest", response, "previewInventoryDigest")
    return cast(OffboardingExportResponse, result)


def _download_from_wire(response: Mapping[str, Any]) -> OffboardingDownloadResponse:
    result: dict[str, Any] = {}
    _copy_value(result, "request_uuid", response, "requestUuid")
    _copy_value(result, "download_url", response, "downloadUrl")
    _copy_value(result, "checksum_sha256", response, "checksumSha256")
    _copy_value(result, "byte_size", response, "byteSize")
    _copy_value(result, "record_count", response, "recordCount")
    _copy_value(result, "generated_at", response, "generatedAt")
    _copy_value(result, "expires_at", response, "expiresAt")
    _copy_value(result, "preview_inventory_digest", response, "previewInventoryDigest")
    return cast(OffboardingDownloadResponse, result)


def _receipt_from_wire(response: Mapping[str, Any]) -> OffboardingReceiptResponse:
    result: dict[str, Any] = {}
    _copy_value(result, "company_id", response, "company_id")
    _copy_value(result, "requested_by_user_id", response, "requested_by_user_id")
    _copy_value(result, "requested_by_actor", response, "requested_by_actor")
    _copy_value(result, "requested_at", response, "requested_at")
    _copy_value(result, "completed_at", response, "completed_at")
    _copy_value(result, "final_state", response, "final_state")
    _copy_value(result, "sha256", response, "sha256")
    if "waiver" in response:
        result["waiver"] = response["waiver"]
    rows = response.get("per_store", [])
    result["per_store"] = [_receipt_store_from_wire(store) for store in _mapping_list(rows)]
    return cast(OffboardingReceiptResponse, result)


def _receipt_store_from_wire(store: Mapping[str, Any]) -> OffboardingReceiptPerStore:
    result: dict[str, Any] = {}
    _copy_value(result, "store", store, "store")
    _copy_value(result, "retention_class", store, "retention_class")
    _copy_value(result, "deleted_count", store, "deleted_count")
    _copy_value(result, "retained_exceptions_count", store, "retained_exceptions_count")
    return cast(OffboardingReceiptPerStore, result)


def _mapping_list(value: Any) -> list[Mapping[str, Any]]:
    if not isinstance(value, list):
        return []
    return [item for item in value if isinstance(item, Mapping)]


def _copy_value(target: dict[str, Any], name: str, source: Mapping[str, Any], *wire_names: str) -> None:
    for wire_name in wire_names:
        if wire_name in source:
            target[name] = source[wire_name]
            return


class OffboardingClient:
    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin

    def schedule(
        self,
        body: OffboardingScheduleRequest,
        options: AdminRequestOptions | None = None,
    ) -> OffboardingSchedule:
        response = self._admin.request("POST", "/offboarding/schedules", _schedule_payload(body), options)
        return _schedule_from_wire(response)

    def list_schedules(self, options: AdminRequestOptions | None = None) -> OffboardingScheduleListResponse:
        response = self._admin.request("GET", "/offboarding/schedules", options=options)
        schedules = response.get("schedules", [])
        return {"schedules": [_schedule_from_wire(item) for item in _mapping_list(schedules)]}

    def get_schedule(
        self,
        tenant_slug: str,
        options: AdminRequestOptions | None = None,
    ) -> OffboardingSchedule:
        response = self._admin.request("GET", f"/offboarding/schedules/{quote_path(tenant_slug)}", options=options)
        return _schedule_from_wire(response)

    def cancel_schedule(
        self,
        tenant_slug: str,
        body: OffboardingCancelRequest,
        options: AdminRequestOptions | None = None,
    ) -> OffboardingSchedule:
        response = self._admin.request(
            "POST", f"/offboarding/schedules/{quote_path(tenant_slug)}/cancel", dict(body), options
        )
        return _schedule_from_wire(response)

    def request_offboarding(
        self,
        body: OffboardingRequestCreate,
        options: AdminRequestOptions | None = None,
    ) -> OffboardingRequest:
        response = self._admin.request("POST", "/offboarding", dict(body), options)
        return _request_from_wire(response)

    def request(
        self,
        body: OffboardingRequestCreate,
        options: AdminRequestOptions | None = None,
    ) -> OffboardingRequest:
        return self.request_offboarding(body, options)

    def get_request(
        self,
        request_uuid: str,
        options: AdminRequestOptions | None = None,
    ) -> OffboardingRequest:
        response = self._admin.request("GET", f"/offboarding/{quote_path(request_uuid)}", options=options)
        return _request_from_wire(response)

    def cancel_request(
        self,
        request_uuid: str,
        body: OffboardingCancelRequest,
        options: AdminRequestOptions | None = None,
    ) -> OffboardingRequest:
        response = self._admin.request("POST", f"/offboarding/{quote_path(request_uuid)}/cancel", dict(body), options)
        return _request_from_wire(response)

    def confirm_request(
        self,
        request_uuid: str,
        options: AdminRequestOptions | None = None,
    ) -> OffboardingRequest:
        response = self._admin.request("POST", f"/offboarding/{quote_path(request_uuid)}/confirm", options=options)
        return _request_from_wire(response)

    def preview(
        self,
        request_uuid: str,
        options: AdminRequestOptions | None = None,
    ) -> OffboardingPreviewResponse:
        response = self._admin.request(
            "POST", f"/offboarding/requests/{quote_path(request_uuid)}/preview", options=options
        )
        return _preview_from_wire(response)

    def export(
        self,
        request_uuid: str,
        options: AdminRequestOptions | None = None,
    ) -> OffboardingExportResponse:
        response = self._admin.request(
            "POST", f"/offboarding/requests/{quote_path(request_uuid)}/export", options=options
        )
        return _export_from_wire(response)

    def download(
        self,
        request_uuid: str,
        options: AdminRequestOptions | None = None,
    ) -> OffboardingDownloadResponse:
        response = self._admin.request(
            "GET", f"/offboarding/requests/{quote_path(request_uuid)}/download", options=options
        )
        return _download_from_wire(response)

    def acknowledge(
        self,
        request_uuid: str,
        options: AdminRequestOptions | None = None,
    ) -> OffboardingRequest:
        response = self._admin.request(
            "POST", f"/offboarding/requests/{quote_path(request_uuid)}/acknowledge", options=options
        )
        return _request_from_wire(response)

    def execute(
        self,
        request_uuid: str,
        body: OffboardingExecuteRequest,
        options: AdminRequestOptions | None = None,
    ) -> OffboardingReceiptResponse:
        waiver = body["waiver"]
        wire_body: dict[str, Any] = {
            "waiver_role": waiver["role"],
            "waiver_reason": waiver["reason"],
        }
        if waiver.get("timestamp"):
            wire_body["waiver_timestamp"] = waiver["timestamp"]
        response = self._admin.request(
            "POST", f"/offboarding/requests/{quote_path(request_uuid)}/execute", wire_body, options
        )
        return _receipt_from_wire(response)

    def retry(
        self,
        request_uuid: str,
        options: AdminRequestOptions | None = None,
    ) -> OffboardingReceiptResponse:
        response = self._admin.request(
            "POST", f"/offboarding/requests/{quote_path(request_uuid)}/retry", options=options
        )
        return _receipt_from_wire(response)

    def receipt(
        self,
        request_uuid: str,
        options: AdminRequestOptions | None = None,
    ) -> OffboardingReceiptResponse:
        response = self._admin.request(
            "GET", f"/offboarding/requests/{quote_path(request_uuid)}/receipt", options=options
        )
        return _receipt_from_wire(response)
