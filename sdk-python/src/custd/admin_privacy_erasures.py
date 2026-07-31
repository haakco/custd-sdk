from __future__ import annotations

from typing import TypedDict

from .client import AdminClient, quote_path


class Selector(TypedDict):
    type: str
    value: str


class PrivacyErasureCreateRequest(TypedDict):
    tenantSlug: str
    selector: Selector
    reason: str


class PrivacyErasure(TypedDict, total=False):
    requestUuid: str
    tenantSlug: str
    selector: Selector
    state: str
    perStoreProgress: list[dict[str, object]]
    createdAt: str
    completedAt: str


class PrivacyErasureListResponse(TypedDict):
    erasures: list[PrivacyErasure]


class PrivacyErasureState(TypedDict, total=False):
    requestUuid: str
    state: str
    forcedAt: str


class PrivacyErasureClient:
    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin

    def create(self, b: PrivacyErasureCreateRequest) -> PrivacyErasure:
        return self._admin.request(
            "POST", "/privacy/erasures", dict(b)
        )  # type: ignore[return-value]

    def list(self) -> PrivacyErasureListResponse:
        return self._admin.request("GET", "/privacy/erasures")  # type: ignore[return-value]

    def get(self, request_id: str) -> PrivacyErasure:
        return self._admin.request(
            "GET", f"/privacy/erasures/{quote_path(request_id)}"
        )  # type: ignore[return-value]

    def force(self, request_id: str) -> PrivacyErasureState:
        return self._admin.request(
            "POST", f"/privacy/erasures/{quote_path(request_id)}/force"
        )  # type: ignore[return-value]