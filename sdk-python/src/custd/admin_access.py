"""Operator access to a tenant: impersonation sessions and time-boxed support-access grants.

Both are audited and end on their own at ``expiresAt``; stop, terminate and revoke end them early.
Enum-like strings are open sets.
"""

from __future__ import annotations

import urllib.parse
from typing import TYPE_CHECKING, NotRequired, TypedDict, cast

if TYPE_CHECKING:
    from .client import AdminClient, AdminRequestOptions

IMPERSONATION_SESSIONS_PATH = "/impersonation-sessions"
SUPPORT_ACCESS_PATH = "/support-access"


class ImpersonationSessionCreateRequest(TypedDict):
    companySlug: str
    targetUserUuid: str
    reason: str
    expiresAt: str


class ImpersonationSession(TypedDict):
    sessionUuid: str
    companySlug: str
    targetUserUuid: str
    targetUserEmail: NotRequired[str]
    reason: str
    consentState: str
    startedAt: str
    expiresAt: str
    stoppedAt: str | None
    stopReason: NotRequired[str]


class ImpersonationSessionListResponse(TypedDict):
    sessions: list[ImpersonationSession]


class SupportAccessGrantCreateRequest(TypedDict):
    companySlug: str
    reason: str
    expiresAt: str


class SupportAccessGrant(TypedDict):
    supportAccessGrantUuid: str
    companySlug: str
    operatorUserUuid: str
    reason: str
    startsAt: str
    expiresAt: str
    revokedAt: str | None


class SupportAccessGrantListResponse(TypedDict):
    grants: list[SupportAccessGrant]


class ImpersonationAdminClient:
    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin

    def start(
        self, request: ImpersonationSessionCreateRequest, options: AdminRequestOptions | None = None
    ) -> ImpersonationSession:
        response = self._admin.request("POST", IMPERSONATION_SESSIONS_PATH, dict(request), options)
        return cast(ImpersonationSession, response)

    def list(self, options: AdminRequestOptions | None = None) -> ImpersonationSessionListResponse:
        response = self._admin.request("GET", IMPERSONATION_SESSIONS_PATH, None, options)
        return ImpersonationSessionListResponse(
            sessions=cast(list[ImpersonationSession], response.get("sessions") or [])
        )

    def stop(self, session_uuid: str, options: AdminRequestOptions | None = None) -> ImpersonationSession:
        """End the operator's own session."""
        return self._action(session_uuid, "/stop", options)

    def terminate(self, session_uuid: str, options: AdminRequestOptions | None = None) -> ImpersonationSession:
        """End another operator's session."""
        return self._action(session_uuid, "/terminate", options)

    def _action(self, session_uuid: str, action: str, options: AdminRequestOptions | None) -> ImpersonationSession:
        path = f"{IMPERSONATION_SESSIONS_PATH}/{urllib.parse.quote(session_uuid, safe='')}{action}"
        return cast(ImpersonationSession, self._admin.request("POST", path, None, options))


class SupportAccessAdminClient:
    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin

    def create(
        self, request: SupportAccessGrantCreateRequest, options: AdminRequestOptions | None = None
    ) -> SupportAccessGrant:
        return cast(SupportAccessGrant, self._admin.request("POST", SUPPORT_ACCESS_PATH, dict(request), options))

    def list(
        self, *, company_slug: str | None = None, options: AdminRequestOptions | None = None
    ) -> SupportAccessGrantListResponse:
        """The grants visible to the caller; a system administrator may narrow them to one tenant."""
        path = SUPPORT_ACCESS_PATH
        if company_slug:
            path += "?" + urllib.parse.urlencode({"companySlug": company_slug})
        response = self._admin.request("GET", path, None, options)
        return SupportAccessGrantListResponse(grants=cast(list[SupportAccessGrant], response.get("grants") or []))

    def revoke(self, grant_uuid: str, options: AdminRequestOptions | None = None) -> SupportAccessGrant:
        path = f"{SUPPORT_ACCESS_PATH}/{urllib.parse.quote(grant_uuid, safe='')}/revoke"
        return cast(SupportAccessGrant, self._admin.request("POST", path, None, options))
