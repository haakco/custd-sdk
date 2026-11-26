"""Subject exports under ``/api/v1/admin/subject-exports``: durable, asynchronous access and
portability exports of one opaque subject's data.

``company_slug`` lets a system administrator name the tenant (or set
``CustdClient(acting_company_slug=...)``); a tenant administrator acts on its own, and force, which
only a system administrator may call, always names it. A JSON null list decodes as empty.
"""

from __future__ import annotations

from typing import NotRequired, TypedDict

from ._wire import decode, request
from .client import AdminClient, quote_path

SUBJECT_EXPORTS_PATH = "/api/v1/admin/subject-exports"

SUBJECT_EXPORT_SCOPE_ACCESS = "access"
SUBJECT_EXPORT_SCOPE_PORTABILITY = "portability"
SUBJECT_EXPORT_SCOPE_BOTH = "both"


class SubjectExportCreateRequest(TypedDict):
    opaqueSubjectId: str
    scope: str
    idempotencyKey: str


class SubjectExportStoreProgress(TypedDict):
    store: str
    deletedCount: int
    retainedExceptions: int
    lastCompletedAt: NotRequired[str]
    lastError: NotRequired[str]


class SubjectExport(TypedDict):
    id: str
    opaqueSubjectId: str
    scope: str
    state: str
    idempotencyKey: str
    requestedAt: str
    expiresAt: str
    perStoreProgress: list[SubjectExportStoreProgress]
    completedAt: NotRequired[str]
    error: NotRequired[str]
    lastActionSafeNext: NotRequired[str]
    lastProgressAt: NotRequired[str]


class SubjectExportListResponse(TypedDict):
    requests: list[SubjectExport]


class SubjectExportDownloadResponse(TypedDict):
    """The stored artifact one scope of a completed export produced."""

    id: str
    requestId: str
    scope: str
    objectKey: str
    s3Key: str
    byteSize: int
    checksumSha256: str
    recordCount: int
    encryptionKeyId: str
    generatedAt: str
    expiresAt: str


class SubjectExportClient:
    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin

    def create(self, body: SubjectExportCreateRequest, *, company_slug: str | None = None) -> SubjectExport:
        answer = request(
            self._admin, "POST", SUBJECT_EXPORTS_PATH, query={"companySlug": company_slug}, body=dict(body)
        )
        return decode(SubjectExport, answer)

    def list(self, *, limit: int | None = None, company_slug: str | None = None) -> SubjectExportListResponse:
        query = {"limit": limit, "companySlug": company_slug}
        return decode(SubjectExportListResponse, request(self._admin, "GET", SUBJECT_EXPORTS_PATH, query=query))

    def get(self, request_id: str, *, company_slug: str | None = None) -> SubjectExport:
        path = _export_path(request_id)
        return decode(SubjectExport, request(self._admin, "GET", path, query={"companySlug": company_slug}))

    def cancel(self, request_id: str, *, company_slug: str | None = None) -> SubjectExport:
        path = _export_path(request_id) + "/cancel"
        return decode(SubjectExport, request(self._admin, "POST", path, query={"companySlug": company_slug}))

    def download(
        self, request_id: str, scope: str, *, company_slug: str | None = None
    ) -> SubjectExportDownloadResponse:
        """Read the artifact for one scope (access or portability) of a completed export."""
        path = _export_path(request_id) + "/download"
        query = {"scope": scope, "companySlug": company_slug}
        return decode(SubjectExportDownloadResponse, request(self._admin, "GET", path, query=query))

    def force(self, request_id: str, company_slug: str) -> SubjectExport:
        """Run a queued export now (system administrators only)."""
        path = _export_path(request_id) + "/force"
        return decode(SubjectExport, request(self._admin, "POST", path, query={"companySlug": company_slug}))


def _export_path(request_id: str) -> str:
    return f"{SUBJECT_EXPORTS_PATH}/{quote_path(request_id)}"
