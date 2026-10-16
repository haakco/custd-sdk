"""Parent-owned data-scope management: scopes, resources and grants.

These routes are served by the admin API under ``/api/v1/admin`` and addressed
by external UUIDs. The immutable scope/resource codes are the selectors event
and query traffic use. Client-side checks are shape-only: the server is the
authority on which principals exist and what they may hold.
"""

from __future__ import annotations

import re
from typing import NotRequired, TypedDict, cast
from urllib.parse import urlencode

from .client import AdminClient, quote_path

DATA_SCOPE_CODE_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:-]*$")
DATA_SCOPE_UUID_PATTERN = re.compile(
    r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
)

# The closed unions the management contract exposes.
DATA_SCOPE_STATUSES = ("active", "disabled")
DATA_SCOPE_PRINCIPAL_KINDS = ("human", "machine")
DATA_SCOPE_GRANT_TARGET_KINDS = ("parent", "sub_client", "resource")
DATA_SCOPE_ACTIONS = ("read", "write")


class DataScope(TypedDict):
    """One parent-company data scope."""

    uuid: str
    code: str
    name: str
    status: str
    createdAt: str
    updatedAt: str


class DataScopeListResponse(TypedDict):
    scopes: list[DataScope]


class DataScopeCreateRequest(TypedDict):
    code: str
    name: str


class DataScopeUpdateRequest(TypedDict):
    # Both fields are optional, but at least one must be present.
    name: NotRequired[str]
    status: NotRequired[str]


class DataScopeResource(TypedDict):
    uuid: str
    scopeUuid: str
    code: str
    name: str
    status: str
    createdAt: str
    updatedAt: str


class DataScopeResourceListResponse(TypedDict):
    resources: list[DataScopeResource]


class DataScopeResourceCreateRequest(TypedDict):
    code: str
    name: str


class DataScopeResourceUpdateRequest(TypedDict):
    name: NotRequired[str]
    status: NotRequired[str]


class DataScopePrincipalRef(TypedDict):
    """The verified principal a grant belongs to.

    A human is its stable membership user UUID; a machine is its producer client
    ID. It never carries an email, a display name, or free actor text.
    """

    kind: str
    userUuid: NotRequired[str]
    clientId: NotRequired[str]


class DataScopeGrantTarget(TypedDict):
    kind: str
    scopeUuid: NotRequired[str]
    resourceUuid: NotRequired[str]


class DataScopeGrant(TypedDict):
    """One principal's grant over one explicit target and action."""

    principal: DataScopePrincipalRef
    target: DataScopeGrantTarget
    action: str


class DataScopeGrantListResponse(TypedDict):
    grants: list[DataScopeGrant]


def valid_data_scope_code(value: str) -> bool:
    """Report whether value is a valid immutable external scope/resource code."""
    return 1 <= len(value) <= 128 and DATA_SCOPE_CODE_PATTERN.match(value) is not None


def valid_data_scope_name(value: str) -> bool:
    """Report whether value is a valid mutable display name."""
    trimmed = value.strip()
    return 1 <= len(trimmed) <= 100


def _assert_code(value: str, label: str) -> None:
    if not valid_data_scope_code(value):
        raise ValueError(f"custd: {label} code must be 1-128 characters matching {DATA_SCOPE_CODE_PATTERN.pattern}")


def _assert_name(value: str, label: str) -> None:
    if not valid_data_scope_name(value):
        raise ValueError(f"custd: {label} name must be 1-100 characters")


def _assert_update(body: DataScopeUpdateRequest, label: str) -> None:
    has_name = "name" in body
    has_status = "status" in body
    if not has_name and not has_status:
        raise ValueError(f"custd: {label} update requires a name or a status")
    if has_name:
        _assert_name(body["name"], label)
    if has_status and body["status"] not in DATA_SCOPE_STATUSES:
        raise ValueError(f'custd: {label} status must be one of {", ".join(DATA_SCOPE_STATUSES)}')


def _assert_principal(principal: DataScopePrincipalRef) -> None:
    kind = principal.get("kind")
    user_uuid = principal.get("userUuid")
    client_id = principal.get("clientId")
    if kind == "human":
        if not isinstance(user_uuid, str) or client_id is not None or DATA_SCOPE_UUID_PATTERN.match(user_uuid) is None:
            raise ValueError("custd: a human principal requires userUuid and no clientId")
        return
    if kind == "machine":
        if not isinstance(client_id, str) or user_uuid is not None or not valid_data_scope_code(client_id):
            raise ValueError("custd: a machine principal requires a bounded clientId and no userUuid")
        return
    raise ValueError('custd: data scope principal kind must be "human" or "machine"')


def _assert_target(target: DataScopeGrantTarget) -> None:
    kind = target.get("kind")
    scope_uuid = target.get("scopeUuid")
    resource_uuid = target.get("resourceUuid")
    scope_ok = isinstance(scope_uuid, str) and DATA_SCOPE_UUID_PATTERN.match(scope_uuid) is not None
    resource_ok = isinstance(resource_uuid, str) and DATA_SCOPE_UUID_PATTERN.match(resource_uuid) is not None
    if kind == "parent":
        if scope_uuid is not None or resource_uuid is not None:
            raise ValueError("custd: a parent target carries no scope or resource")
        return
    if kind == "sub_client":
        if not scope_ok or resource_uuid is not None:
            raise ValueError("custd: a sub_client target requires scopeUuid and no resourceUuid")
        return
    if kind == "resource":
        if not scope_ok or not resource_ok:
            raise ValueError("custd: a resource target requires scopeUuid and resourceUuid")
        return
    raise ValueError('custd: data scope grant target kind must be "parent", "sub_client" or "resource"')


def _assert_grant(grant: DataScopeGrant) -> None:
    _assert_principal(grant["principal"])
    _assert_target(grant["target"])
    if grant["action"] not in DATA_SCOPE_ACTIONS:
        raise ValueError(f'custd: data scope action must be one of {", ".join(DATA_SCOPE_ACTIONS)}')


class DataScopeAdminClient:
    """Owns parent-owned data-scope management."""

    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin

    @staticmethod
    def _include_disabled(include: bool) -> str:
        return "?includeDisabled=true" if include else ""

    @staticmethod
    def _resource_path(scope_uuid: str, resource_uuid: str) -> str:
        return f"/data-scopes/{quote_path(scope_uuid)}/resources/{quote_path(resource_uuid)}"

    def create_scope(self, body: DataScopeCreateRequest) -> DataScope:
        _assert_code(body["code"], "data scope")
        _assert_name(body["name"], "data scope")
        return cast(DataScope, self._admin.request("POST", "/data-scopes", dict(body)))

    def list_scopes(self, include_disabled: bool = False) -> DataScopeListResponse:
        return cast(
            DataScopeListResponse,
            self._admin.request("GET", "/data-scopes" + self._include_disabled(include_disabled)),
        )

    def get_scope(self, scope_uuid: str) -> DataScope:
        return cast(DataScope, self._admin.request("GET", f"/data-scopes/{quote_path(scope_uuid)}"))

    def update_scope(self, scope_uuid: str, body: DataScopeUpdateRequest) -> DataScope:
        _assert_update(body, "data scope")
        return cast(DataScope, self._admin.request("PATCH", f"/data-scopes/{quote_path(scope_uuid)}", dict(body)))

    def disable_scope(self, scope_uuid: str) -> None:
        self._admin.request("POST", f"/data-scopes/{quote_path(scope_uuid)}/disable")

    def create_resource(self, scope_uuid: str, body: DataScopeResourceCreateRequest) -> DataScopeResource:
        _assert_code(body["code"], "data scope resource")
        _assert_name(body["name"], "data scope resource")
        return cast(
            DataScopeResource,
            self._admin.request("POST", f"/data-scopes/{quote_path(scope_uuid)}/resources", dict(body)),
        )

    def list_resources(self, scope_uuid: str, include_disabled: bool = False) -> DataScopeResourceListResponse:
        return cast(
            DataScopeResourceListResponse,
            self._admin.request(
                "GET",
                f"/data-scopes/{quote_path(scope_uuid)}/resources" + self._include_disabled(include_disabled),
            ),
        )

    def get_resource(self, scope_uuid: str, resource_uuid: str) -> DataScopeResource:
        return cast(DataScopeResource, self._admin.request("GET", self._resource_path(scope_uuid, resource_uuid)))

    def update_resource(
        self, scope_uuid: str, resource_uuid: str, body: DataScopeResourceUpdateRequest
    ) -> DataScopeResource:
        _assert_update(body, "data scope resource")
        return cast(
            DataScopeResource,
            self._admin.request("PATCH", self._resource_path(scope_uuid, resource_uuid), dict(body)),
        )

    def disable_resource(self, scope_uuid: str, resource_uuid: str) -> None:
        self._admin.request("POST", self._resource_path(scope_uuid, resource_uuid) + "/disable")

    def list_grants(self, principal: DataScopePrincipalRef) -> DataScopeGrantListResponse:
        _assert_principal(principal)
        params: dict[str, str] = {"kind": principal["kind"]}
        if "userUuid" in principal:
            params["userUuid"] = principal["userUuid"]
        if "clientId" in principal:
            params["clientId"] = principal["clientId"]
        return cast(
            DataScopeGrantListResponse,
            self._admin.request("GET", "/data-scope-grants?" + urlencode(params)),
        )

    def create_grant(self, grant: DataScopeGrant) -> DataScopeGrant:
        _assert_grant(grant)
        return cast(DataScopeGrant, self._admin.request("POST", "/data-scope-grants", dict(grant)))

    def revoke_grant(self, grant: DataScopeGrant) -> None:
        _assert_grant(grant)
        self._admin.request("POST", "/data-scope-grants/revoke", dict(grant))
