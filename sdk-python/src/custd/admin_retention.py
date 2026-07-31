from __future__ import annotations

from typing import TypedDict

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
        return self._admin.request("GET", "/retention/policies")  # type: ignore[return-value]

    def get(self, slug: str) -> RetentionPolicy:
        return self._admin.request(
            "GET", f"/retention/policies/{quote_path(slug)}"
        )  # type: ignore[return-value]

    def upsert(self, slug: str, b: RetentionPolicyUpsertRequest) -> RetentionPolicy:
        return self._admin.request(
            "PUT", f"/retention/policies/{quote_path(slug)}", dict(b)
        )  # type: ignore[return-value]

    def delete(self, slug: str) -> None:
        self._admin.request("DELETE", f"/retention/policies/{quote_path(slug)}")

    def preview(self, slug: str) -> RetentionRunPreview:
        return self._admin.request(
            "POST", f"/retention/policies/{quote_path(slug)}/preview"
        )  # type: ignore[return-value]

    def apply(self, slug: str) -> RetentionRun:
        return self._admin.request(
            "POST", f"/retention/policies/{quote_path(slug)}/apply"
        )  # type: ignore[return-value]

    def list_runs(self, slug: str) -> RetentionRunsListResponse:
        return self._admin.request(
            "GET", f"/retention/policies/{quote_path(slug)}/runs"
        )  # type: ignore[return-value]