"""Tenant offboarding under ``/api/v1/admin/offboarding``: schedules, the request workflow
(preview, export, download, acknowledge, execute) and its content-free receipt. Responses keep the
server's wire spelling; a JSON null list decodes as empty.
"""

from __future__ import annotations

import re
from typing import Any, NotRequired, TypedDict, TypeVar

from . import _wire
from .client import (
    REQUEST_ID_HEADER,
    AdminClient,
    AdminRequestOptions,
    BinaryWriter,
    OffboardingState,
    copy_stream,
    quote_path,
)

OFFBOARDING_PATH = "/offboarding"

_T = TypeVar("_T")


class OffboardingScheduleRequest(TypedDict):
    tenantSlug: str
    effectiveAt: str
    gracePeriodDays: int
    reason: str
    status: NotRequired[str]


class OffboardingSchedule(TypedDict):
    tenantSlug: str
    effectiveAt: str
    gracePeriodDays: int
    reason: str
    status: str
    updatedAt: str


class OffboardingScheduleListResponse(TypedDict):
    schedules: list[OffboardingSchedule]


class OffboardingCancelRequest(TypedDict):
    reason: str


class OffboardingRequestCreate(TypedDict):
    confirmation: str


class OffboardingRequest(TypedDict):
    requestUuid: str
    state: OffboardingState
    requestedAt: str


class OffboardingPreviewStore(TypedDict):
    store: str
    kind: str
    retention_class: str
    estimated_count: int
    source_authority: NotRequired[str]


class OffboardingPreviewExclusion(TypedDict):
    store: str
    reason: str


class OffboardingPreviewResponse(TypedDict):
    requestUuid: str
    generatedAt: str
    expiresAt: str
    stores: list[OffboardingPreviewStore]
    exclusions: NotRequired[list[OffboardingPreviewExclusion]]
    previewInventoryDigest: str
    complete: bool
    partial: bool


class OffboardingWaiver(TypedDict):
    """The content-free waiver summary; free-form reasons are never kept in a receipt."""

    role: str
    timestamp: str


class OffboardingExportResponse(TypedDict):
    requestUuid: str
    checksumSha256: str
    byteSize: int
    recordCount: int
    generatedAt: str
    expiresAt: str
    previewInventoryDigest: str


class OffboardingDownload(TypedDict):
    """A bundle download written to the caller's writer; ``requestId`` is "" when the server sent none."""

    contentType: str
    checksumSha256: str
    byteSize: int
    requestId: str


class OffboardingReceiptPerStore(TypedDict):
    store: str
    retention_class: str
    deleted_count: int
    retained_exceptions_count: int


class OffboardingReceiptResponse(TypedDict):
    """The content-free lifecycle receipt, in the server's snake_case wire spelling."""

    company_id: int
    # "human" when an administrator requested the offboarding, otherwise the machine kind.
    requested_by_kind: str
    requested_at: str
    completed_at: str
    final_state: OffboardingState
    per_store: list[OffboardingReceiptPerStore]
    waiver: NotRequired[OffboardingWaiver]
    sha256: str


class OffboardingClient:
    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin

    def schedule(
        self,
        body: OffboardingScheduleRequest,
        options: AdminRequestOptions | None = None,
    ) -> OffboardingSchedule:
        return self._call(OffboardingSchedule, "POST", "/schedules", options, dict(body))

    def list_schedules(self, options: AdminRequestOptions | None = None) -> OffboardingScheduleListResponse:
        return self._call(OffboardingScheduleListResponse, "GET", "/schedules", options)

    def get_schedule(
        self,
        tenant_slug: str,
        options: AdminRequestOptions | None = None,
    ) -> OffboardingSchedule:
        return self._call(OffboardingSchedule, "GET", f"/schedules/{quote_path(tenant_slug)}", options)

    def cancel_schedule(
        self,
        tenant_slug: str,
        body: OffboardingCancelRequest,
        options: AdminRequestOptions | None = None,
    ) -> OffboardingSchedule:
        path = f"/schedules/{quote_path(tenant_slug)}/cancel"
        return self._call(OffboardingSchedule, "POST", path, options, dict(body))

    def request_offboarding(
        self,
        body: OffboardingRequestCreate,
        options: AdminRequestOptions | None = None,
    ) -> OffboardingRequest:
        return self._call(OffboardingRequest, "POST", "", options, dict(body))

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
        return self._call(OffboardingRequest, "GET", f"/{quote_path(request_uuid)}", options)

    def cancel_request(
        self,
        request_uuid: str,
        body: OffboardingCancelRequest,
        options: AdminRequestOptions | None = None,
    ) -> OffboardingRequest:
        return self._call(OffboardingRequest, "POST", f"/{quote_path(request_uuid)}/cancel", options, dict(body))

    def confirm_request(
        self,
        request_uuid: str,
        options: AdminRequestOptions | None = None,
    ) -> OffboardingRequest:
        return self._call(OffboardingRequest, "POST", f"/{quote_path(request_uuid)}/confirm", options)

    def preview(
        self,
        request_uuid: str,
        options: AdminRequestOptions | None = None,
    ) -> OffboardingPreviewResponse:
        return self._call(OffboardingPreviewResponse, "POST", _request_path(request_uuid, "preview"), options)

    def export(
        self,
        request_uuid: str,
        options: AdminRequestOptions | None = None,
    ) -> OffboardingExportResponse:
        return self._call(OffboardingExportResponse, "POST", _request_path(request_uuid, "export"), options)

    def download(self, request_uuid: str, writer: BinaryWriter) -> OffboardingDownload:
        """Stream the authenticated export bundle into ``writer``, hashing it as it copies.

        A response without a valid Content-Length and X-Checksum-SHA256 is refused before anything is
        written. When the copied bytes do not match them a ValueError is raised after the copy, so
        ``writer`` then holds an unverified bundle the caller must discard.
        """
        stream = self._admin.open_stream(f"/offboarding/requests/{quote_path(request_uuid)}/download")
        try:
            length_header = stream.headers.get("content-length", "").strip()
            if re.fullmatch(r"[0-9]+", length_header) is None:
                raise ValueError("custd: offboarding download content length is invalid")
            checksum = stream.headers.get("x-checksum-sha256", "").strip().lower()
            if re.fullmatch(r"[0-9a-f]{64}", checksum) is None:
                raise ValueError("custd: offboarding download checksum header is invalid")
            byte_size = int(length_header)
            written, digest = copy_stream(stream, writer, byte_size + 1)
        finally:
            stream.body.close()
        if written != byte_size:
            raise ValueError("custd: offboarding download content length mismatch")
        if digest != checksum:
            raise ValueError("custd: offboarding download checksum mismatch")
        return {
            "contentType": stream.headers.get("content-type", ""),
            "checksumSha256": checksum,
            "byteSize": byte_size,
            "requestId": stream.headers.get(REQUEST_ID_HEADER, ""),
        }

    def acknowledge(
        self,
        request_uuid: str,
        options: AdminRequestOptions | None = None,
    ) -> OffboardingRequest:
        return self._call(OffboardingRequest, "POST", _request_path(request_uuid, "acknowledge"), options)

    def execute(
        self,
        request_uuid: str,
        options: AdminRequestOptions | None = None,
    ) -> OffboardingReceiptResponse:
        return self._call(OffboardingReceiptResponse, "POST", _request_path(request_uuid, "execute"), options)

    def retry(
        self,
        request_uuid: str,
        options: AdminRequestOptions | None = None,
    ) -> OffboardingReceiptResponse:
        return self._call(OffboardingReceiptResponse, "POST", _request_path(request_uuid, "retry"), options)

    def receipt(
        self,
        request_uuid: str,
        options: AdminRequestOptions | None = None,
    ) -> OffboardingReceiptResponse:
        return self._call(OffboardingReceiptResponse, "GET", _request_path(request_uuid, "receipt"), options)

    def _call(
        self,
        dto: type[_T],
        method: str,
        path: str,
        options: AdminRequestOptions | None,
        body: dict[str, Any] | None = None,
    ) -> _T:
        # The workflow's conflict answers carry error, code and safe_next_action, which the
        # admin request error keeps.
        return _wire.decode(dto, self._admin.request(method, OFFBOARDING_PATH + path, body, options))


def _request_path(request_uuid: str, action: str) -> str:
    return f"/requests/{quote_path(request_uuid)}/{action}"
