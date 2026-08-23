from __future__ import annotations

from typing import TypedDict, cast

from .client import AdminClient, quote_path


class RetentionPolicy(TypedDict, total=False):
    tenantSlug: str
    scope: str
    retentionClass: str
    maxAgeSeconds: int
    precedence: int
    legalHold: bool
    effectiveAt: str
    expiresAt: str | None


class RetentionPolicyUpsertRequest(TypedDict, total=False):
    scope: str
    retentionClass: str
    maxAgeSeconds: int
    precedence: int
    legalHold: bool
    effectiveAt: str


class RetentionPolicyListResponse(TypedDict):
    policies: list[RetentionPolicy]


class RetentionRunPreview(TypedDict, total=False):
    previewId: str
    tenantSlug: str
    estimatedDeletions: list[dict[str, object]]
    previewedAt: str


class RetentionRun(TypedDict, total=False):
    runId: str
    tenantSlug: str
    state: str
    startedAt: str
    completedAt: str
    deletedCount: int


class RetentionRunsListResponse(TypedDict):
    runs: list[RetentionRun]


class RetentionClient:
    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin

    def list(self) -> RetentionPolicyListResponse:
        return cast(RetentionPolicyListResponse, self._admin.request("GET", "/retention/policies"))

    def get(self, slug: str) -> RetentionPolicy:
        return cast(RetentionPolicy, self._admin.request(
            "GET", f"/retention/policies/{quote_path(slug)}"
        ))

    def upsert(self, slug: str, b: RetentionPolicyUpsertRequest) -> RetentionPolicy:
        return cast(RetentionPolicy, self._admin.request(
            "PUT", f"/retention/policies/{quote_path(slug)}", dict(b)
        ))

    def delete(self, slug: str) -> None:
        self._admin.request("DELETE", f"/retention/policies/{quote_path(slug)}")

    def preview(self, slug: str) -> RetentionRunPreview:
        return cast(RetentionRunPreview, self._admin.request(
            "POST", f"/retention/policies/{quote_path(slug)}/preview"
        ))

    def apply(self, slug: str) -> RetentionRun:
        return cast(RetentionRun, self._admin.request(
            "POST", f"/retention/policies/{quote_path(slug)}/apply"
        ))

    def list_runs(self, slug: str) -> RetentionRunsListResponse:
        return cast(RetentionRunsListResponse, self._admin.request(
            "GET", f"/retention/policies/{quote_path(slug)}/runs"
        ))
