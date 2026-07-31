from __future__ import annotations

from typing import TypedDict

from .client import AdminClient, quote_path


class TenantStorageLocation(TypedDict, total=False):
    id: str
    tenantSlug: str
    clientLocation: str
    serverAssignedPrefix: str
    status: str
    createdAt: str
    expiresAt: str


class TenantStorageCreateRequest(TypedDict, total=False):
    tenantSlug: str
    clientLocation: str


class TenantStorageListResponse(TypedDict):
    locations: list[TenantStorageLocation]


class TenantStorageClient:
    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin

    def list(self) -> TenantStorageListResponse:
        return self._admin.request("GET", "/tenant-storage-locations")  # type: ignore[return-value]

    def create(self, body: TenantStorageCreateRequest) -> TenantStorageLocation:
        return self._admin.request(
            "POST", "/tenant-storage-locations", dict(body)
        )  # type: ignore[return-value]

    def get(self, location_id: str) -> TenantStorageLocation:
        return self._admin.request(
            "GET", f"/tenant-storage-locations/{quote_path(location_id)}"
        )  # type: ignore[return-value]

    def revoke(self, location_id: str) -> None:
        self._admin.request(
            "DELETE", f"/tenant-storage-locations/{quote_path(location_id)}"
        )