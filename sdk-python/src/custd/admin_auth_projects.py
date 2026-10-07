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


class ApplicationMembershipRevocation(TypedDict):
    """Response to ending a membership. The row is kept with ``removedAt`` stamped."""

    projectId: str
    environmentId: str
    directoryId: str
    principalId: str
    organisationId: str
    removedAt: str
    removed: bool


class AuthProjectAudienceBinding(TypedDict):
    """One application audience the environment admits and its provider settings.

    This is the binding a consumer's edge admits against; the contract derives
    the audience group ``custd-group-<environmentID>-<audienceSlug>`` from it.
    """

    audience: str
    publicClient: bool
    redirectUris: list[str] | None
    postLogoutRedirectUris: list[str] | None
    allowedOrigins: list[str] | None


class AuthProjectProfileField(TypedDict):
    """One profile field's policy inside the environment's desired state."""

    key: str
    required: bool
    visibleToApplication: bool
    editableBy: str


class AuthProjectDesiredState(TypedDict):
    """The environment configuration an apply writes.

    A consumer builds it from these fields alone: ``audiences`` carries the
    audience binding, and the remaining fields carry the rest. The legal scalar
    vocabularies are read from the environment's capability operation, not fixed
    here.
    """

    identityMode: AuthProjectIdentityMode
    registrationPolicy: str
    loginPaused: bool
    audiences: list[AuthProjectAudienceBinding] | None
    profileFields: list[AuthProjectProfileField] | None


class AuthProjectDesiredStateRequest(TypedDict):
    """Body of both the apply and preview operations.

    ``expectedRevision`` is the revision the caller read; Custd refuses an apply
    when the stored revision has moved.
    """

    desiredState: AuthProjectDesiredState
    expectedRevision: int


class AuthProjectOperation(TypedDict):
    """The receipt an apply returns.

    ``replayed`` reports that the same body and idempotency key returned the
    original operation.
    """

    id: str
    kind: str
    status: str
    revision: int
    idempotencyKey: str
    appliedAt: str
    replayed: bool


class AuthProjectChange(TypedDict):
    """One field-level change a preview reports."""

    field: str
    before: str
    after: str


class AuthProjectPreview(TypedDict):
    """The field-level change set an apply would write. A preview writes nothing."""

    projectId: str
    environmentId: str
    revision: int
    changes: list[AuthProjectChange] | None
    sideEffects: list[str] | None
    noOp: bool


class AuthProjectClientRegistration(TypedDict):
    """One audience's provider registration read back from status.

    ``clientId`` is the derived ``custd-app-<environmentID>-<audienceSlug>`` the
    binding resolves to.
    """

    audience: str
    clientId: str
    observed: bool


class AuthProjectClientSync(TypedDict):
    """The registration half of status: the provider clients Custd is known to hold."""

    clientIds: list[str] | None
    revision: int
    checkedAt: str
    current: bool
    registrations: list[AuthProjectClientRegistration] | None
    issuer: NotRequired[str]
    errorCategory: NotRequired[str]


class AuthProjectStatus(TypedDict):
    """The environment's configured state and applied revision.

    ``desired.audiences`` is the audience binding the caller applied, so the
    project/environment/audience mapping is readable here after an apply.
    ``reconciled`` describes the configuration and ``loginReady`` describes
    execution; neither is inferred from the other. ``clientSync`` is absent until
    registration has run.
    """

    projectId: str
    environmentId: str
    revision: int
    desired: AuthProjectDesiredState
    reconciled: bool
    reconcileNote: str
    loginReady: bool
    loginNote: str
    clientSync: NotRequired[AuthProjectClientSync]


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

    def apply_environment_desired_state(
        self,
        project_id: str,
        environment_id: str,
        body: AuthProjectDesiredStateRequest,
        options: AdminRequestOptions | None = None,
    ) -> AuthProjectOperation:
        """Write the environment's desired state and return the operation receipt.

        Custd makes it retry-safe per idempotency key, so the key is required.
        The audience binding the consumer's edge admits against is written here
        and read back through :meth:`get_environment_status`.
        """
        path = f"{_environment_path(project_id, environment_id)}/apply"
        return cast(
            AuthProjectOperation,
            self._admin.request("POST", path, dict(body), _require_idempotency_key(options)),
        )

    def preview_environment_desired_state(
        self,
        project_id: str,
        environment_id: str,
        body: AuthProjectDesiredStateRequest,
        options: AdminRequestOptions | None = None,
    ) -> AuthProjectPreview:
        """Report the field-level changes an apply would make. A preview writes nothing."""
        path = f"{_environment_path(project_id, environment_id)}/preview"
        return cast(AuthProjectPreview, self._admin.request("POST", path, dict(body), options))

    def get_environment_status(
        self,
        project_id: str,
        environment_id: str,
        options: AdminRequestOptions | None = None,
    ) -> AuthProjectStatus:
        """Read the environment's configured state and applied revision.

        ``status["desired"]["audiences"]`` carries the applied audience binding
        and ``status["environmentId"]`` the environment binding, so a caller
        reads the mapping back here after an apply.
        """
        path = f"{_environment_path(project_id, environment_id)}/status"
        return cast(AuthProjectStatus, self._admin.request("GET", path, None, options))


def _segment(value: str) -> str:
    """Escape one path segment so a caller-supplied identifier cannot reshape the path."""
    return urllib.parse.quote(value, safe="")


def _environment_path(project_id: str, environment_id: str) -> str:
    """Address one environment under one project."""
    return f"/auth-projects/{_segment(project_id)}/environments/{_segment(environment_id)}"


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
