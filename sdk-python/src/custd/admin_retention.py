"""Tenant retention policies under ``/api/v1/admin/retention/policies/{tenantSlug}``.

A tenant holds one policy per retention class. ``preview`` is a dry run and ``apply`` the live
sweep; both answer the same per-store breakdown, told apart by ``lastResult``. A class under legal
hold is never swept. A JSON null list decodes as empty.
"""

from __future__ import annotations

from typing import Literal, NotRequired, TypedDict

from ._wire import decode, request
from .client import AdminClient, quote_path

RetentionClass = Literal[
    "raw",
    "archive",
    "materialized",
    "cache",
    "object",
    "audit_event",
    "audit_ip_address",
    "audit_user_agent",
]
RetentionScope = Literal["tenant", "data_space", "event_type", "global"]


RETENTION_POLICIES_PATH = "/api/v1/admin/retention/policies"


class RetentionPolicy(TypedDict):
    id: int
    scope: RetentionScope
    retentionClass: RetentionClass
    maxAgeSeconds: int
    precedence: int
    legalHold: bool
    effectiveAt: str
    lastAffectedCounts: dict[str, int]
    companyId: NotRequired[int]
    auditId: NotRequired[int]
    expiresAt: NotRequired[str]
    legalHoldUntil: NotRequired[str]
    lastResult: NotRequired[str]
    lastError: NotRequired[str]
    nextRunAt: NotRequired[str]


class RetentionPolicyUpsertRequest(TypedDict):
    scope: RetentionScope
    retentionClass: RetentionClass
    maxAgeSeconds: int
    precedence: int
    legalHold: bool
    legalHoldReference: NotRequired[str]
    legalHoldUntil: NotRequired[str]
    effectiveAt: NotRequired[str]
    expiresAt: NotRequired[str]


class RetentionPolicyListResponse(TypedDict):
    policies: list[RetentionPolicy]


class RetentionStoreBreakdown(TypedDict):
    store: str
    retentionClass: str
    candidateCount: int
    estimatedAffected: int
    sampleSubjects: list[str]
    legalHoldCount: int


class RetentionRun(TypedDict):
    """A preview (``lastResult`` "preview") or a live apply ("applied") and its per-store counts."""

    perStore: list[RetentionStoreBreakdown]
    lastResult: str
    safeNextAction: str
    startedAt: str
    completedAt: str
    nextRunAt: NotRequired[str]
    lastAffectedCounts: NotRequired[dict[str, int]]
    lastError: NotRequired[str]


class RetentionRunRecord(TypedDict):
    startAt: str
    endAt: str
    lastResult: str
    lastAffectedCounts: dict[str, int]
    lastError: NotRequired[str]
    auditId: NotRequired[int]


class RetentionRunsListResponse(TypedDict):
    """One page of runs; follow ``nextOffset`` while ``hasMore``."""

    runs: list[RetentionRunRecord]
    nextOffset: int
    hasMore: bool


class RetentionClient:
    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin

    def list(self) -> RetentionPolicyListResponse:
        return decode(RetentionPolicyListResponse, request(self._admin, "GET", RETENTION_POLICIES_PATH))

    def get(self, tenant_slug: str) -> RetentionPolicyListResponse:
        """Read every retention-class policy of one tenant."""
        return decode(RetentionPolicyListResponse, request(self._admin, "GET", _policy_path(tenant_slug)))

    def upsert(self, tenant_slug: str, body: RetentionPolicyUpsertRequest) -> RetentionPolicy:
        return decode(RetentionPolicy, request(self._admin, "PUT", _policy_path(tenant_slug), body=dict(body)))

    def delete(self, tenant_slug: str) -> None:
        request(self._admin, "DELETE", _policy_path(tenant_slug))

    def preview(self, tenant_slug: str) -> RetentionRun:
        return decode(RetentionRun, request(self._admin, "POST", _policy_path(tenant_slug) + "/preview"))

    def apply(self, tenant_slug: str) -> RetentionRun:
        return decode(RetentionRun, request(self._admin, "POST", _policy_path(tenant_slug) + "/apply"))

    def list_runs(
        self, tenant_slug: str, *, limit: int | None = None, offset: int | None = None
    ) -> RetentionRunsListResponse:
        path = _policy_path(tenant_slug) + "/runs"
        query = {"limit": limit, "offset": offset}
        return decode(RetentionRunsListResponse, request(self._admin, "GET", path, query=query))


def _policy_path(tenant_slug: str) -> str:
    return f"{RETENTION_POLICIES_PATH}/{quote_path(tenant_slug)}"
