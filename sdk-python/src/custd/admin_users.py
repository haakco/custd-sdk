"""Tenant administrator users and their assignable roles under ``/api/v1/admin/users``.

A user has a global state and a per-company membership state; they are reported separately
because disabling an identity and ending a membership are different decisions. ``company_slug``
lets a system administrator name the tenant; other callers act on their own. Closed string
sets are Literal aliases; a value a newer server adds still decodes.
"""

from __future__ import annotations

import urllib.parse
from typing import TYPE_CHECKING, Any, Literal, NotRequired, TypedDict, cast

if TYPE_CHECKING:
    from .client import AdminClient, AdminRequestOptions

AdminUserGlobalState = Literal["enabled", "suspended"]
AdminUserMembershipState = Literal["active", "ended"]
AdminUserRoleSlug = Literal["tenant_admin", "tenant_ingest_manager", "tenant_analyst"]


ADMIN_USER_ROLE_TENANT_ADMIN: AdminUserRoleSlug = "tenant_admin"
ADMIN_USER_ROLE_TENANT_INGEST_MANAGER: AdminUserRoleSlug = "tenant_ingest_manager"
ADMIN_USER_ROLE_TENANT_ANALYST: AdminUserRoleSlug = "tenant_analyst"

ADMIN_USER_GLOBAL_STATE_ENABLED: AdminUserGlobalState = "enabled"
ADMIN_USER_GLOBAL_STATE_SUSPENDED: AdminUserGlobalState = "suspended"

ADMIN_USER_MEMBERSHIP_STATE_ACTIVE: AdminUserMembershipState = "active"
ADMIN_USER_MEMBERSHIP_STATE_ENDED: AdminUserMembershipState = "ended"

ADMIN_USERS_PATH = "/users"
ADMIN_USER_ROLES_PATH = "/user-roles"


class AdminUser(TypedDict):
    userUuid: str
    email: str
    companySlug: str
    roles: list[AdminUserRoleSlug]
    globalUserState: AdminUserGlobalState
    membershipState: AdminUserMembershipState
    createdAt: str
    lastLoginAt: str | None
    welcomeNotificationStatus: str
    deletedAt: str | None
    deletedByUserUuid: str | None
    deleteReason: str | None


class AdminUserListResponse(TypedDict):
    users: list[AdminUser]


class AdminUserListQuery(TypedDict, total=False):
    """Filters for the user list; unset fields are not sent."""

    companySlug: str
    role: str
    globalState: str
    membershipState: str
    welcomeStatus: str
    includeEnded: bool
    includeDeleted: bool


class AdminUserCreateRequest(TypedDict):
    companySlug: str
    email: str
    roles: list[AdminUserRoleSlug]


class AdminUserUpdateRequest(TypedDict):
    roles: list[AdminUserRoleSlug]


class AdminUserMembershipCreateRequest(TypedDict):
    companySlug: str
    roles: list[AdminUserRoleSlug]


class AdminUserDisableRequest(TypedDict, total=False):
    """Why access is turned off (lands in the audit stream); globalUser disables the identity."""

    reason: str
    companySlug: str
    globalUser: bool


class AdminUserEnableRequest(TypedDict):
    """The roles a reopened membership carries; globalUser enables the identity."""

    roles: list[AdminUserRoleSlug]
    companySlug: NotRequired[str]
    globalUser: NotRequired[bool]


class AdminUserRemovalRequest(TypedDict):
    reason: str


class AdminUserPasswordReset(TypedDict):
    """The reset notification Custd queued: never a password."""

    messageUuid: str
    deliveryUuids: list[str]


class AdminUserRole(TypedDict):
    slug: AdminUserRoleSlug
    name: str
    description: str


class AdminUserRoleListResponse(TypedDict):
    roles: list[AdminUserRole]


class AdminUserAdminClient:
    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin

    def list(
        self, query: AdminUserListQuery | None = None, options: AdminRequestOptions | None = None
    ) -> AdminUserListResponse:
        response = self._admin.request("GET", _with_query(ADMIN_USERS_PATH, dict(query or {})), None, options)
        return AdminUserListResponse(users=cast(list[AdminUser], response.get("users") or []))

    def get(
        self,
        user_uuid: str,
        *,
        company_slug: str | None = None,
        include_ended: bool = False,
        options: AdminRequestOptions | None = None,
    ) -> AdminUser:
        path = _with_query(_user_path(user_uuid), {"companySlug": company_slug, "includeEnded": include_ended})
        return cast(AdminUser, self._admin.request("GET", path, None, options))

    def create(self, request: AdminUserCreateRequest, options: AdminRequestOptions | None = None) -> AdminUser:
        return cast(AdminUser, self._admin.request("POST", ADMIN_USERS_PATH, dict(request), options))

    def update(
        self,
        user_uuid: str,
        request: AdminUserUpdateRequest,
        *,
        company_slug: str | None = None,
        options: AdminRequestOptions | None = None,
    ) -> AdminUser:
        path = _with_query(_user_path(user_uuid), {"companySlug": company_slug})
        return cast(AdminUser, self._admin.request("PUT", path, dict(request), options))

    def disable(
        self,
        user_uuid: str,
        request: AdminUserDisableRequest | None = None,
        options: AdminRequestOptions | None = None,
    ) -> None:
        query: dict[str, Any] = dict(request or {})
        reason = query.pop("reason", None)
        path = _with_query(_user_path(user_uuid) + "/disable", query)
        self._admin.request("POST", path, None if reason is None else {"reason": reason}, options)

    def enable(
        self, user_uuid: str, request: AdminUserEnableRequest, options: AdminRequestOptions | None = None
    ) -> None:
        query: dict[str, Any] = dict(request)
        roles = query.pop("roles")
        path = _with_query(_user_path(user_uuid) + "/enable", query)
        self._admin.request("POST", path, {"roles": roles}, options)

    def add_membership(
        self, user_uuid: str, request: AdminUserMembershipCreateRequest, options: AdminRequestOptions | None = None
    ) -> AdminUser:
        path = _user_path(user_uuid) + "/memberships"
        return cast(AdminUser, self._admin.request("POST", path, dict(request), options))

    def reset_password(
        self,
        user_uuid: str,
        *,
        company_slug: str | None = None,
        include_ended: bool = False,
        options: AdminRequestOptions | None = None,
    ) -> AdminUserPasswordReset:
        path = _with_query(
            _user_path(user_uuid) + "/reset-password", {"companySlug": company_slug, "includeEnded": include_ended}
        )
        response = self._admin.request("POST", path, None, options)
        return AdminUserPasswordReset(
            messageUuid=cast(str, response.get("messageUuid")),
            deliveryUuids=cast(list[str], response.get("deliveryUuids") or []),
        )

    def soft_delete(
        self,
        user_uuid: str,
        company_slug: str,
        request: AdminUserRemovalRequest,
        options: AdminRequestOptions | None = None,
    ) -> AdminUser:
        """Remove the user's access in one tenant, keeping the record and the reason."""
        return self._removal(user_uuid, "/soft-delete", company_slug, request, options)

    def restore(
        self,
        user_uuid: str,
        company_slug: str,
        request: AdminUserRemovalRequest,
        options: AdminRequestOptions | None = None,
    ) -> AdminUser:
        return self._removal(user_uuid, "/restore", company_slug, request, options)

    def retry_welcome(
        self,
        user_uuid: str,
        *,
        company_slug: str | None = None,
        include_ended: bool = False,
        options: AdminRequestOptions | None = None,
    ) -> None:
        path = _with_query(
            _user_path(user_uuid) + "/retry-welcome", {"companySlug": company_slug, "includeEnded": include_ended}
        )
        self._admin.request("POST", path, None, options)

    def list_roles(self, options: AdminRequestOptions | None = None) -> AdminUserRoleListResponse:
        """The roles the caller may assign."""
        response = self._admin.request("GET", ADMIN_USER_ROLES_PATH, None, options)
        return AdminUserRoleListResponse(roles=cast(list[AdminUserRole], response.get("roles") or []))

    def _removal(
        self,
        user_uuid: str,
        action: str,
        company_slug: str,
        request: AdminUserRemovalRequest,
        options: AdminRequestOptions | None,
    ) -> AdminUser:
        path = _with_query(_user_path(user_uuid) + action, {"companySlug": company_slug})
        return cast(AdminUser, self._admin.request("POST", path, dict(request), options))


def _user_path(user_uuid: str) -> str:
    return f"{ADMIN_USERS_PATH}/{urllib.parse.quote(user_uuid, safe='')}"


def _with_query(path: str, query: dict[str, Any]) -> str:
    """Append the set parameters; None, empty and False values are not sent."""
    params = {
        key: "true" if value is True else str(value)
        for key, value in query.items()
        if value is not None and value != "" and value is not False
    }
    return f"{path}?{urllib.parse.urlencode(params)}" if params else path
