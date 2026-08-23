from __future__ import annotations

from typing import TypedDict, cast

from .client import AdminClient, quote_path


class Subject(TypedDict):
    type: str
    value: str


class SubjectExportCreateRequest(TypedDict):
    tenantSlug: str
    subject: Subject
    scope: str
    idempotencyKey: str


class SubjectExport(TypedDict, total=False):
    requestId: str
    tenantSlug: str
    subject: Subject
    scope: str
    state: str
    createdAt: str
    expiresAt: str
    checksum: str
    artifactSize: int


class SubjectExportListResponse(TypedDict):
    exports: list[SubjectExport]


class SubjectExportDownloadResponse(TypedDict, total=False):
    requestId: str
    downloadUrl: str
    expiresAt: str


class SubjectExportState(TypedDict, total=False):
    requestId: str
    state: str
    cancelledAt: str
    forcedAt: str


class SubjectExportClient:
    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin

    def create(self, b: SubjectExportCreateRequest) -> SubjectExport:
        return cast(SubjectExport, self._admin.request("POST", "/subject-exports", dict(b)))

    def list(self) -> SubjectExportListResponse:
        return cast(SubjectExportListResponse, self._admin.request("GET", "/subject-exports"))

    def get(self, request_id: str) -> SubjectExport:
        return cast(SubjectExport, self._admin.request(
            "GET", f"/subject-exports/{quote_path(request_id)}"
        ))

    def cancel(self, request_id: str) -> SubjectExportState:
        return cast(SubjectExportState, self._admin.request(
            "POST", f"/subject-exports/{quote_path(request_id)}/cancel"
        ))

    def download(self, request_id: str) -> SubjectExportDownloadResponse:
        return cast(SubjectExportDownloadResponse, self._admin.request(
            "GET", f"/subject-exports/{quote_path(request_id)}/download"
        ))

    def force(self, request_id: str) -> SubjectExportState:
        return cast(SubjectExportState, self._admin.request(
            "POST", f"/subject-exports/{quote_path(request_id)}/force"
        ))
