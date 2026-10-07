"""Project-auth control plane for Custd projects, environments and principals.

Every call goes to /api/v1/admin/auth-projects. A machine credential may make
these calls only when it names the platform user it acts for: pass
``owning_user_uuid`` in the call's :class:`AdminRequestOptions` and it is sent as
X-Custd-Owning-User-UUID. Custd validates the named user as a live member of the
machine caller's own company. A human administrator's own token subject is the
actor and leaves the option unset.
"""

from __future__ import annotations

import urllib.parse
from typing import NotRequired, TypedDict, cast

from .client import AdminClient, AdminRequestOptions

# AuthProjectIdentityMode names how an environment's identity boundary is shared.
# Custd owns the meaning of both legal values and the SDK surfaces them unchanged.
AuthProjectIdentityMode = str
AUTH_PROJECT_IDENTITY_MODES = ("isolated", "shared")


class AuthProjectCreateRequest(TypedDict):
    """Body of POST /api/v1/admin/auth-projects."""

    slug: str
    name: str
    environmentSlug: str
    identityMode: AuthProjectIdentityMode


class AuthProjectEnvironmentCreateRequest(TypedDict):
    """Body of POST /api/v1/admin/auth-projects/{projectId}/environments."""

    slug: str
    name: str
    identityMode: AuthProjectIdentityMode


class AuthProjectSummary(TypedDict):
    """One project and the environment the call is scoped to."""

    projectId: str
    slug: str
    name: str
    environmentId: str
    environmentSlug: str
    identityMode: AuthProjectIdentityMode


class AuthProjectCreation(TypedDict):
    """Response to creating a project.

    ``replayed`` reports that the same body and idempotency key returned the
    original operation; ``runtimeReady`` reports that the environment is
    serving, not that application login is enabled.
    """

    project: AuthProjectSummary
    operationId: str
    replayed: bool
    runtimeReady: bool


class AuthProjectListResponse(TypedDict):
    """One page of GET /api/v1/admin/auth-projects."""

    projects: list[AuthProjectSummary]
    # Cursor for the next page; absent on the last page.
    nextAfter: NotRequired[str]


class ApplicationSession(TypedDict):
    """One session a directory holds for an application principal.

    The list carries no session token or credential.
    """

    sessionId: str
    active: bool
    authenticatedAt: NotRequired[str]
    authenticatorAssuranceLevel: NotRequired[str]
    expiresAt: NotRequired[str]
    issuedAt: NotRequired[str]


class ApplicationSessionInventory(TypedDict):
    """Response to listing one application principal's live sessions."""

    projectId: str
    environmentId: str
    directoryId: str
    principalId: str
    sessions: list[ApplicationSession]


class ApplicationSessionRevokeRequest(TypedDict):
    """Body of POST .../principals/{providerSubject}/sessions/revoke."""

    sessionId: str


class ApplicationSessionRevocation(TypedDict):
    """Response to revoking sessions. ``revoked`` is the number of sessions ended."""

    projectId: str
    directoryId: str
    principalId: str
    revoked: int
    sessionId: NotRequired[str]


class ApplicationSessionsRevokeAllRequest(TypedDict):
    """Body of POST .../principals/{providerSubject}/sessions/revoke-all."""

    # Must be True: a missing field is never read as the strongest action.
    confirm: bool


class ApplicationMembershipRevokeRequest(TypedDict):
    """Body of POST .../principals/{providerSubject}/memberships/revoke."""

    organisationId: str
    reason: NotRequired[str]


class ApplicationMembershipRevocation(TypedDict):
    """Response to ending a membership. The row is kept with ``removedAt`` stamped."""

    projectId: str
    environmentId: str
    directoryId: str
    principalId: str
    organisationId: str
    removedAt: str
    removed: bool


class AuthProjectAdminClient:
    """Manages Custd projects, their environments, and application principals."""

    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin

    def list_projects(
        self, after: str | None = None, options: AdminRequestOptions | None = None
    ) -> AuthProjectListResponse:
        """List up to 100 environments the named owning user owns or operates."""
        path = "/auth-projects"
        cursor = (after or "").strip()
        if cursor:
            path += "?after=" + urllib.parse.quote(cursor, safe="")
        return cast(AuthProjectListResponse, self._admin.request("GET", path, None, options))

    def create_project(
        self, body: AuthProjectCreateRequest, options: AdminRequestOptions | None = None
    ) -> AuthProjectCreation:
        """Create the named owning user's project ownership, pool and first paused environment."""
        return cast(
            AuthProjectCreation,
            self._admin.request("POST", "/auth-projects", dict(body), _require_idempotency_key(options)),
        )

    def create_environment(
        self, project_id: str, body: AuthProjectEnvironmentCreateRequest, options: AdminRequestOptions | None = None
    ) -> AuthProjectSummary:
        """Add a further environment to an existing project. The new environment starts paused."""
        path = f"/auth-projects/{_segment(project_id)}/environments"
        return cast(AuthProjectSummary, self._admin.request("POST", path, dict(body), options))

    def list_principal_sessions(
        self,
        project_id: str,
        environment_id: str,
        directory_id: str,
        provider_subject: str,
        options: AdminRequestOptions | None = None,
    ) -> ApplicationSessionInventory:
        """Report the sessions the directory currently holds for one application principal."""
        path = _application_principal_path(project_id, environment_id, directory_id, provider_subject) + "/sessions"
        return cast(ApplicationSessionInventory, self._admin.request("GET", path, None, options))

    def revoke_principal_session(
        self,
        project_id: str,
        environment_id: str,
        directory_id: str,
        provider_subject: str,
        body: ApplicationSessionRevokeRequest,
        options: AdminRequestOptions | None = None,
    ) -> ApplicationSessionRevocation:
        """End exactly one of a principal's sessions, leaving its other sessions untouched."""
        path = (
            _application_principal_path(project_id, environment_id, directory_id, provider_subject)
            + "/sessions/revoke"
        )
        return cast(
            ApplicationSessionRevocation,
            self._admin.request("POST", path, dict(body), _require_idempotency_key(options)),
        )

    def revoke_principal_sessions(
        self,
        project_id: str,
        environment_id: str,
        directory_id: str,
        provider_subject: str,
        body: ApplicationSessionsRevokeAllRequest,
        options: AdminRequestOptions | None = None,
    ) -> ApplicationSessionRevocation:
        """End every session the directory holds for one application principal."""
        path = (
            _application_principal_path(project_id, environment_id, directory_id, provider_subject)
            + "/sessions/revoke-all"
        )
        return cast(
            ApplicationSessionRevocation,
            self._admin.request("POST", path, dict(body), _require_idempotency_key(options)),
        )

    def revoke_principal_membership(
        self,
        project_id: str,
        environment_id: str,
        directory_id: str,
        provider_subject: str,
        body: ApplicationMembershipRevokeRequest,
        options: AdminRequestOptions | None = None,
    ) -> ApplicationMembershipRevocation:
        """End one application identity's membership of one organisation."""
        path = (
            _application_principal_path(project_id, environment_id, directory_id, provider_subject)
            + "/memberships/revoke"
        )
        return cast(
            ApplicationMembershipRevocation,
            self._admin.request("POST", path, dict(body), options),
        )


def _segment(value: str) -> str:
    """Escape one path segment so a caller-supplied identifier cannot reshape the path."""
    return urllib.parse.quote(value, safe="")


def _application_principal_path(
    project_id: str, environment_id: str, directory_id: str, provider_subject: str
) -> str:
    return (
        f"/auth-projects/{_segment(project_id)}"
        f"/environments/{_segment(environment_id)}"
        f"/directories/{_segment(directory_id)}"
        f"/principals/{_segment(provider_subject)}"
    )


def _require_idempotency_key(options: AdminRequestOptions | None) -> AdminRequestOptions:
    """Reject an empty key on the routes Custd makes retry-safe.

    A caller gets one clear error instead of a service 400.
    """
    key = (options or {}).get("idempotency_key")
    if not isinstance(key, str) or key.strip() == "":
        raise ValueError("custd: auth-project idempotency key is required")
    return options or {}
