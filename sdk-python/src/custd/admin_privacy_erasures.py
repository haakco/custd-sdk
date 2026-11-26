"""Physical privacy erasures under ``/api/v1/admin/privacy/erasures``.

An erasure has no cancel or retry: once queued it runs to completion, and ``force`` only brings a
pending one forward. ``company_slug`` lets a system administrator name the tenant on reads; other
callers act on their own. A JSON null list decodes as empty.
"""

from __future__ import annotations

from typing import NotRequired, TypedDict

from ._wire import decode, request
from .client import AdminClient, quote_path

PRIVACY_ERASURES_PATH = "/api/v1/admin/privacy/erasures"


class PrivacyErasureSelector(TypedDict):
    """Which events to erase: ``value`` for one identifier, ``values`` for several."""

    type: str
    value: NotRequired[str]
    values: NotRequired[list[str]]


class PrivacyErasureCreateRequest(TypedDict):
    companySlug: str
    selector: PrivacyErasureSelector
    reason: str
    redactionId: NotRequired[str]
    forceNow: NotRequired[bool]


class PrivacyErasure(TypedDict):
    """One erasure request with its rewrite, SLA and archive-propagation rollups."""

    requestUuid: str
    status: str
    selectorType: str
    selectorDisplay: str
    matchedEventCount: int
    redactedEventCount: int
    affectedSegmentCount: int
    source: NotRequired[str]
    requestedBy: NotRequired[str]
    createdAt: NotRequired[str]
    updatedAt: NotRequired[str]
    forceRequestedAt: NotRequired[str]
    rewriteCount: NotRequired[int]
    pendingRewriteCount: NotRequired[int]
    rewritingRewriteCount: NotRequired[int]
    rewrittenRewriteCount: NotRequired[int]
    recompactedRewriteCount: NotRequired[int]
    failedRewriteCount: NotRequired[int]
    oldestPendingRewriteAt: NotRequired[str]
    latestRecompactedAt: NotRequired[str]
    latestFailureReason: NotRequired[str]
    slaDeadlineAt: NotRequired[str]
    slaState: NotRequired[str]
    archiveRecompactedAt: NotRequired[str]
    s3PropagationLagSeconds: NotRequired[int]


class PrivacyErasureListResponse(TypedDict):
    requests: list[PrivacyErasure]


class PrivacyErasureForceResponse(TypedDict):
    """The erasure after a force, or the bounded next step when it could not be forced."""

    request: PrivacyErasure | None
    safe_next_action: str
    safe_next_action_code: str


class PrivacyErasureClient:
    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin

    def create(self, body: PrivacyErasureCreateRequest) -> PrivacyErasure:
        return decode(PrivacyErasure, request(self._admin, "POST", PRIVACY_ERASURES_PATH, body=dict(body)))

    def list(self, *, company_slug: str | None = None) -> PrivacyErasureListResponse:
        query = {"companySlug": company_slug}
        return decode(PrivacyErasureListResponse, request(self._admin, "GET", PRIVACY_ERASURES_PATH, query=query))

    def get(self, request_uuid: str, *, company_slug: str | None = None) -> PrivacyErasure:
        path = _erasure_path(request_uuid)
        return decode(PrivacyErasure, request(self._admin, "GET", path, query={"companySlug": company_slug}))

    def force(self, request_uuid: str, *, company_slug: str | None = None) -> PrivacyErasureForceResponse:
        path = _erasure_path(request_uuid) + "/force"
        answer = request(self._admin, "POST", path, query={"companySlug": company_slug})
        return decode(PrivacyErasureForceResponse, answer)


def _erasure_path(request_uuid: str) -> str:
    return f"{PRIVACY_ERASURES_PATH}/{quote_path(request_uuid)}"
