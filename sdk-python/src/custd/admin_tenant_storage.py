"""Tenant storage locations: the per-tenant S3-compatible storage control plane.

The routes live on the top-level ``/api/v1/tenant-storage-locations`` surface, not
under ``/api/v1/admin``. Custd assigns every routing field and the immutable tenant
prefix, so a create sends an empty body. Revoked locations stay listed so historical
object references remain resolvable.
"""

from __future__ import annotations

import json
from collections.abc import Mapping
from typing import Any, TypedDict, cast

from .client import AdminClient, problem_request_error

TENANT_STORAGE_LOCATIONS_PATH = "/tenant-storage-locations"


class TenantStorageLocation(TypedDict):
    id: int
    uuid: str
    code: str
    companyId: int
    provider: str
    endpoint: str
    region: str
    bucket: str
    rootPrefix: str
    isolationTier: str
    validationStatus: str
    writeEnabled: bool


class TenantStorageListResponse(TypedDict):
    locations: list[TenantStorageLocation]


class TenantStorageClient:
    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin

    def list(self) -> TenantStorageListResponse:
        locations = self._request("GET", TENANT_STORAGE_LOCATIONS_PATH).get("locations") or []
        return TenantStorageListResponse(locations=cast(list[TenantStorageLocation], locations))

    def create(self) -> TenantStorageLocation:
        """Create and activate a new Custd-assigned location for the tenant."""
        return cast(TenantStorageLocation, self._request("POST", TENANT_STORAGE_LOCATIONS_PATH, {}))

    def get(self, location_id: int) -> TenantStorageLocation:
        return cast(TenantStorageLocation, self._request("GET", _location_path(location_id)))

    def revoke(self, location_id: int) -> None:
        self._request("DELETE", _location_path(location_id))

    def _request(self, method: str, path: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
        client = self._admin._client
        url = client.base_url + "/api/v1" + path
        result = self._admin._transport(method, url, payload, client._headers(), client.timeout)
        status = int(result["status"])
        body = result.get("body")
        if status >= 400:
            raise problem_request_error(status, body, "tenant storage")
        if status == 204 or body in (None, ""):
            return {}
        decoded = json.loads(body) if isinstance(body, str) else body
        if not isinstance(decoded, Mapping):
            raise ValueError("custd: tenant storage response must be a JSON object")
        return dict(decoded)


def _location_path(location_id: int) -> str:
    if isinstance(location_id, bool) or not isinstance(location_id, int):
        raise ValueError("custd: tenant storage location id must be an integer")
    return f"{TENANT_STORAGE_LOCATIONS_PATH}/{location_id}"
