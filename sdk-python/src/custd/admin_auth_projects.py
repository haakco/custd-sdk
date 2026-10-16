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
from typing import Literal, NotRequired, TypedDict, cast

from .client import AdminClient, AdminRequestOptions

# AuthProjectIdentityMode names how an environment's identity boundary is shared.
# Custd owns the meaning of both legal values and the SDK surfaces them unchanged.
AuthProjectIdentityMode = str
AUTH_PROJECT_IDENTITY_MODES = ("isolated", "shared")

# AuthProjectAudienceEntitlementMode declares how an environment decides which principals an
# audience admits. "organisation_membership" is the pre-existing behaviour; "explicit_grants"
# admits an audience only when the principal holds a grant for that exact audience. Required on
# creation and immutable afterwards.
AuthProjectAudienceEntitlementMode = str
AUTH_PROJECT_AUDIENCE_ENTITLEMENT_MODES = ("organisation_membership", "explicit_grants")


class AuthProjectCreateRequest(TypedDict):
    """Body of POST /api/v1/admin/auth-projects."""

    slug: str
    name: str
    environmentSlug: str
    identityMode: AuthProjectIdentityMode
    audienceEntitlementMode: AuthProjectAudienceEntitlementMode


class AuthProjectEnvironmentCreateRequest(TypedDict):
    """Body of POST /api/v1/admin/auth-projects/{projectId}/environments."""

    slug: str
    name: str
    identityMode: AuthProjectIdentityMode
    audienceEntitlementMode: AuthProjectAudienceEntitlementMode


class AuthProjectSummary(TypedDict):
    """One project and the environment the call is scoped to.

    ``companyUuid`` is the persisted company of this project; ``None`` means explicitly
    unbound and must never be inferred from a slug, an email or the caller's company.
    """

    projectId: str
    slug: str
    name: str
    environmentId: str
    environmentSlug: str
    identityMode: AuthProjectIdentityMode
    companyUuid: str | None


class AuthProjectCompanyBinding(TypedDict):
    """Result of binding an explicitly unbound project to the owner's company."""

    projectId: str
    companyUuid: str


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


class ApplicationPrincipalListQuery(TypedDict, total=False):
    """Query for GET .../environments/{environmentId}/principals.

    ``cursor`` is the opaque ``nextCursor`` the previous page returned and is left
    off when empty. ``limit`` bounds the page; Custd applies its own default of 100
    and maximum of 100, so a positive limit is passed through unchanged.
    """

    cursor: str
    limit: int


class ApplicationPrincipalListItem(TypedDict):
    """One application principal admitted to one directory.

    ``providerSubject`` is the opaque management address the principal routes take;
    ``principalId`` is the application identity UUID it resolves to.
    """

    principalId: str
    directoryId: str
    providerSubject: str
    enabled: bool


class ApplicationPrincipalListResponse(TypedDict):
    """One page of an environment's application principals.

    ``principals`` is empty, never null, when the environment holds no principals.
    ``nextCursor`` is absent on the last page.
    """

    principals: list[ApplicationPrincipalListItem]
    nextCursor: NotRequired[str]


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


class ApplicationPrincipalTarget(TypedDict):
    """Address one application identity; the server validates its boundary."""

    projectId: str
    environmentId: str
    directoryId: str
    providerSubject: str


class ApplicationPrincipalSuspension(TypedDict):
    """Server receipt for suspension or restoration, not an echoed request."""

    projectId: str
    environmentId: str
    directoryId: str
    principalId: str
    enabled: bool
    sessionsRevoked: int
    revision: int
    replayed: bool


class ApplicationPrincipalErasureRequest(TypedDict):
    """Explicit confirmation of terminal erasure; no strongest-action default."""

    confirm: bool


class ApplicationPrincipalErasure(TypedDict):
    """Operation outcome; countsRecorded is false when replay lacks counts."""

    projectId: str
    environmentId: str
    directoryId: str
    principalId: str
    status: str
    invitations: int
    magicLinks: int
    memberships: int
    mappings: int
    profileValues: int
    principals: int
    revision: int
    replayed: bool
    countsRecorded: bool


ApplicationIdentityTraitValue = (
    str | int | float | bool | None | list["ApplicationIdentityTraitValue"] | dict[str, "ApplicationIdentityTraitValue"]
)
ApplicationIdentityTraitsStatus = Literal[
    "included", "incomplete", "identity_absent", "directory_unavailable", "provider_unreadable"
]


class ApplicationIdentityTrait(TypedDict):
    """One public trait, preserving its JSON value without text coercion."""

    name: str
    value: ApplicationIdentityTraitValue


class ApplicationPrincipalIdentityExport(TypedDict):
    providerIssuer: str
    providerSubject: str
    traitsStatus: ApplicationIdentityTraitsStatus
    traits: list[ApplicationIdentityTrait] | None


class ApplicationPrincipalMembershipView(TypedDict):
    organisationId: str
    organisationSlug: str
    organisationName: str
    role: str
    createdAt: str
    removedAt: NotRequired[str]


class ApplicationPrincipalProfileValueView(TypedDict):
    fieldKey: str
    value: str


class ApplicationPrincipalExport(TypedDict):
    """All public identities and application data, with per-identity completeness."""

    projectId: str
    environmentId: str
    directoryId: str
    principalId: str
    enabled: bool
    createdAt: str
    identities: list[ApplicationPrincipalIdentityExport] | None
    memberships: list[ApplicationPrincipalMembershipView] | None
    profileValues: list[ApplicationPrincipalProfileValueView] | None


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
    # Persisted company of this environment's project; None means explicitly unbound.
    companyUuid: str | None


# Custd owns the four legal directory actions and the SDK rejects anything else
# before sending.
AuthProjectDirectoryAction = str
AUTH_PROJECT_DIRECTORY_ACTIONS = ("enable", "pause", "resume", "release")


class AuthProjectCapability(TypedDict):
    """The configured modes one environment may use; vocabularies are server-owned."""

    identityModes: list[str]
    registrationPolicies: list[str]
    profileFieldKeys: list[str]
    audienceConstraints: str
    subjectUniqueness: str


class AuthProjectDirectoryView(TypedDict):
    """One directory's credential-store state as reported."""

    poolId: str
    poolSlug: str
    state: str
    slotRef: NotRequired[str]
    runtimePublicUrl: NotRequired[str]
    revision: int
    attemptCount: int
    lastErrorCategory: NotRequired[str]
    readyAt: NotRequired[str]


class AuthProjectDirectoryCapacity(TypedDict):
    """The deployment-wide declared credential-store pool."""

    declared: int
    inUse: int
    free: int


class AuthProjectDirectoryStatus(TypedDict):
    """The environment's identity directories and their credential-store readiness."""

    projectId: str
    environmentId: str
    revision: int
    directories: list[AuthProjectDirectoryView]
    ready: bool
    capacity: AuthProjectDirectoryCapacity


class AuthProjectDirectoryRequest(TypedDict):
    """Body of a directory action; it cannot name a store, runtime URL or state."""

    poolId: str
    expectedRevision: int


class AuthProjectEnvironmentOrganisation(TypedDict):
    """One organisation an environment's directory holds; it carries no member data."""

    organisationId: str
    slug: str
    name: str
    identityPoolId: str


class AuthProjectEnvironmentOrganisationList(TypedDict):
    """The named list an environment's organisation read answers with."""

    projectId: str
    environmentId: str
    organisations: list[AuthProjectEnvironmentOrganisation]


class AuthProjectClientSyncRequest(TypedDict):
    """Body of clients/reconcile: the revision the caller read."""

    expectedRevision: int


class AuthProjectClientSyncRegistration(TypedDict):
    """One audience's reconcile outcome, reporting what the provider was observed to hold."""

    audience: str
    clientId: str
    action: str
    reason: NotRequired[str]


class AuthProjectClientSyncReport(TypedDict):
    """One reconcile's outcome; ``superseded`` reports a configuration race.

    ``clients`` is the reconcile's registrations: the server emits ``null`` for an
    environment with no previous clients, so it is read as a nullable list rather
    than an empty one.
    """

    environmentId: str
    revision: int
    checkedAt: str
    errorCategory: NotRequired[str]
    superseded: bool
    clients: list[AuthProjectClientSyncRegistration] | None


class AuthProjectInvitation(TypedDict):
    """One invitation as a caller sees it; it never carries the token or its hash."""

    invitationId: str
    email: str
    membershipRole: str
    poolId: str
    organisationId: str
    expiresAt: str
    createdAt: str
    # open, accepted, revoked or expired.
    state: str
    # Only meaningful on the response to issuing an invitation; absent elsewhere.
    delivered: NotRequired[bool]
    # Server-recorded acceptance linkage; absent/None means unavailable, not an email match.
    acceptedPrincipalId: NotRequired[str | None]


class AuthProjectInvitationIssueRequest(TypedDict):
    """Body of POST .../invitations; it cannot name a project, token or state."""

    poolId: str
    organisationId: str
    email: str
    membershipRole: str
    expiresInSeconds: int


class AuthProjectInvitationIssued(TypedDict):
    """Response to issuing one invitation; ``inviteUrl`` is returned exactly once."""

    invitation: AuthProjectInvitation
    inviteUrl: str
    replayed: bool


class AuthProjectInvitationListResponse(TypedDict):
    """An environment's invitations, newest first."""

    invitations: list[AuthProjectInvitation]


class AuthProjectInvitationRevocationRequest(TypedDict):
    """Body of POST .../invitations/revoke."""

    invitationId: str


class AuthProjectInvitationRedeliveryRequest(TypedDict):
    """Body of POST .../invitations/redeliver; it cannot carry a link."""

    invitationId: str


class ApplicationProfileField(TypedDict):
    """One field of a principal's profile as the policy discloses it."""

    fieldKey: str
    value: NotRequired[str]
    present: bool
    required: bool
    editableBy: str
    editable: bool


class ApplicationPrincipalProfile(TypedDict):
    """One principal's profile, restricted to policy-visible fields."""

    projectId: str
    environmentId: str
    directoryId: str
    principalId: str
    fields: list[ApplicationProfileField]
    missingRequired: list[str]


class ApplicationProfileValue(TypedDict):
    """One field value a caller asks to store."""

    fieldKey: str
    value: str


class ApplicationProfileValuesRequest(TypedDict):
    """Body of POST .../profile; the boundary comes from the address, not the body."""

    values: list[ApplicationProfileValue]


class ApplicationMembershipChoice(TypedDict):
    """One organisation an application principal may act for, with its role there."""

    organisationId: str
    organisationSlug: str
    organisationName: str
    role: str


class ApplicationMembershipContext(TypedDict):
    """The set of organisations one application principal may act for."""

    projectId: str
    environmentId: str
    directoryId: str
    principalId: str
    memberships: list[ApplicationMembershipChoice]


class AuthProjectDeletionRequest(TypedDict):
    """Body of POST /auth-projects/{projectId}/delete; confirmSlug names the stored slug."""

    confirmSlug: str


class AuthProjectReleasedResources(TypedDict):
    """What deleting a project released, grouped so the receipt documents the cascade."""

    environments: int
    directories: int
    organisations: int
    memberships: int
    invitations: int
    audienceBindings: int
    operations: int


class AuthProjectDeletion(TypedDict):
    """The receipt for a deleted project."""

    projectId: str
    slug: str
    name: str
    released: AuthProjectReleasedResources


class AuthProjectEnvironmentDeletionRequest(TypedDict):
    """Body of POST .../environments/{environmentId}/delete; confirmSlug names the stored slug."""

    confirmSlug: str


class AuthProjectEnvironmentReleasedResources(TypedDict):
    """What deleting one environment released, grouped for the receipt."""

    directories: int
    organisations: int
    memberships: int
    invitations: int
    audienceBindings: int
    operations: int
    profileValues: int


class AuthProjectEnvironmentDeletion(TypedDict):
    """The receipt for a deleted environment; it names both project and environment."""

    projectId: str
    projectSlug: str
    environmentId: str
    slug: str
    name: str
    released: AuthProjectEnvironmentReleasedResources


class AuthProjectEnvironmentOffboardRequest(TypedDict):
    """Body of POST .../environments/{environmentId}/offboard; confirmSlug names the stored slug."""

    confirmSlug: str


class AuthEnvironmentClientCleanup(TypedDict):
    """The provider half of one offboard; ``status`` is complete, pending or unavailable."""

    status: str
    clientsRemoved: int
    errorCategory: NotRequired[str]


class AuthEnvironmentRetainedResources(TypedDict):
    """What an offboard kept, so the receipt states plainly that nothing was destroyed."""

    directories: int
    organisations: int
    memberships: int
    invitations: int
    profileValues: int
    reservedSlots: int


class AuthProjectEnvironmentOffboarding(TypedDict):
    """The receipt for one offboarded environment; authority withdrawn, data retained."""

    projectId: str
    projectSlug: str
    environmentId: str
    slug: str
    name: str
    authorityWithdrawn: bool
    loginPaused: bool
    revision: int
    clientCleanup: AuthEnvironmentClientCleanup
    retained: AuthEnvironmentRetainedResources


AuthProjectRealmStep = Literal["apply", "directory_enable", "client_reconcile", "status"]

# The service bounds an Idempotency-Key at 8 to 128 characters. A realm provision
# derives one key per mutating step by appending a suffix to the caller's base key,
# so the base is bounded here to keep every derived key legal.
_AUTH_PROJECT_REALM_MIN_KEY_LENGTH = 8
_AUTH_PROJECT_REALM_MAX_KEY_LENGTH = 128
# ":directory-enable" and ":client-reconcile" are both 17 characters.
_AUTH_PROJECT_REALM_LONGEST_SUFFIX = ":directory-enable"


class AuthProjectRealmProvisionRequest(TypedDict):
    """One environment's realm setup: the desired state to apply and the directory to enable.

    It carries no directory revision: the helper names the revision each write just
    produced, which it derives from the previous step rather than trusting a caller
    to read.
    """

    desiredStateRequest: AuthProjectDesiredStateRequest
    directoryPoolId: str


class AuthProjectRealmProvisionReceipt(TypedDict):
    """What a realm provision wrote and, on failure, which step stopped it."""

    projectId: str
    environmentId: str
    apply: NotRequired[AuthProjectOperation]
    directory: NotRequired[AuthProjectOperation]
    reconcile: NotRequired[AuthProjectClientSyncReport]
    status: NotRequired[AuthProjectStatus]
    failedStep: NotRequired[AuthProjectRealmStep]


class AuthProjectRealmProvisionError(RuntimeError):
    """Raised when a realm provision stops early, carrying the failed step and receipt."""

    def __init__(self, failed_step: AuthProjectRealmStep, receipt: AuthProjectRealmProvisionReceipt) -> None:
        super().__init__(f"custd: realm provision failed at step {failed_step}")
        self.failed_step = failed_step
        self.receipt = receipt


class AuthProjectRealmNotConvergedError(AuthProjectRealmProvisionError):
    """Raised when every step ran but the realm's provider registration is not current.

    It is the honest answer for a provision that is not finished: the receipt's
    ``status.reconciled`` is false and ``reconcileNote`` carries the reason.
    """

    def __init__(self, receipt: AuthProjectRealmProvisionReceipt, reconcile_note: str) -> None:
        super().__init__("status", receipt)
        self.reconcile_note = reconcile_note


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

    def bind_project_company(
        self, project_id: str, options: AdminRequestOptions | None = None
    ) -> AuthProjectCompanyBinding:
        """Bind an explicitly unbound project to the authenticated human owner's company.

        The actionable step a ``company_binding_required`` refusal names: the body is empty, Custd
        refuses a machine credential and a foreign rebind, and repeating it for the same company is
        safe, so it carries no idempotency key.
        """
        path = f"/auth-projects/{_segment(project_id)}/company-binding"
        return cast(AuthProjectCompanyBinding, self._admin.request("POST", path, None, options))

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
            _application_principal_path(project_id, environment_id, directory_id, provider_subject) + "/sessions/revoke"
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

    def export_principal(
        self, target: ApplicationPrincipalTarget, options: AdminRequestOptions | None = None
    ) -> ApplicationPrincipalExport:
        """Read all public identity traits, never credential/code/session material."""
        path = _principal_target_path(target) + "/export"
        return cast(ApplicationPrincipalExport, self._admin.request("GET", path, None, options))

    def suspend_principal(
        self, target: ApplicationPrincipalTarget, options: AdminRequestOptions | None = None
    ) -> ApplicationPrincipalSuspension:
        """Withdraw authority and revoke every principal-owned identity's sessions."""
        path = _principal_target_path(target) + "/suspend"
        return cast(
            ApplicationPrincipalSuspension, self._admin.request("POST", path, None, _require_idempotency_key(options))
        )

    def restore_principal(
        self, target: ApplicationPrincipalTarget, options: AdminRequestOptions | None = None
    ) -> ApplicationPrincipalSuspension:
        """Restore authority without changing factors; pending withdrawals refuse."""
        path = _principal_target_path(target) + "/restore"
        return cast(
            ApplicationPrincipalSuspension, self._admin.request("POST", path, None, _require_idempotency_key(options))
        )

    def erase_principal(
        self,
        target: ApplicationPrincipalTarget,
        body: ApplicationPrincipalErasureRequest,
        options: AdminRequestOptions | None = None,
    ) -> ApplicationPrincipalErasure:
        """Invoke the server-owned durable erasure of the complete mapping set."""
        path = _principal_target_path(target) + "/erase"
        return cast(
            ApplicationPrincipalErasure,
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

    def get_environment_capability(
        self, project_id: str, environment_id: str, options: AdminRequestOptions | None = None
    ) -> AuthProjectCapability:
        """Read the environment's supported auth configuration."""
        path = f"{_environment_path(project_id, environment_id)}/capability"
        return cast(AuthProjectCapability, self._admin.request("GET", path, None, options))

    def list_directories(
        self, project_id: str, environment_id: str, options: AdminRequestOptions | None = None
    ) -> AuthProjectDirectoryStatus:
        """Report every directory in the environment and whether it is fully stored."""
        path = f"{_environment_path(project_id, environment_id)}/directories"
        return cast(AuthProjectDirectoryStatus, self._admin.request("GET", path, None, options))

    def act_on_directory(
        self,
        project_id: str,
        environment_id: str,
        action: AuthProjectDirectoryAction,
        body: AuthProjectDirectoryRequest,
        options: AdminRequestOptions | None = None,
    ) -> AuthProjectOperation:
        """Enable, pause, resume or release one directory credential store."""
        if action not in AUTH_PROJECT_DIRECTORY_ACTIONS:
            raise ValueError(
                f"custd: auth-project directory action {action!r} is not one of enable, pause, resume or release"
            )
        path = f"{_environment_path(project_id, environment_id)}/directories/{_segment(action)}"
        return cast(
            AuthProjectOperation,
            self._admin.request("POST", path, dict(body), _require_idempotency_key(options)),
        )

    def list_environment_organisations(
        self, project_id: str, environment_id: str, options: AdminRequestOptions | None = None
    ) -> AuthProjectEnvironmentOrganisationList:
        """Report the organisations one environment's directory holds."""
        path = f"{_environment_path(project_id, environment_id)}/organisations"
        return cast(AuthProjectEnvironmentOrganisationList, self._admin.request("GET", path, None, options))

    def list_principals(
        self,
        project_id: str,
        environment_id: str,
        query: ApplicationPrincipalListQuery | None = None,
        options: AdminRequestOptions | None = None,
    ) -> ApplicationPrincipalListResponse:
        """List the application principals every directory in the environment holds.

        The owning-user header is taken from ``options`` like the other project-auth
        reads, and paging continues with the opaque ``nextCursor`` the previous page
        returned.
        """
        resolved = query or {}
        params: list[str] = []
        # The cursor is opaque: only an absent or genuinely empty value is dropped, and
        # every other string is url-encoded byte-for-byte without normalization.
        cursor = resolved.get("cursor")
        if cursor:
            params.append("cursor=" + urllib.parse.quote(cursor, safe=""))
        limit = resolved.get("limit", 0)
        if limit:
            params.append("limit=" + str(limit))
        suffix = "" if not params else "?" + "&".join(params)
        path = f"{_environment_path(project_id, environment_id)}/principals{suffix}"
        return cast(ApplicationPrincipalListResponse, self._admin.request("GET", path, None, options))

    def reconcile_environment_clients(
        self,
        project_id: str,
        environment_id: str,
        body: AuthProjectClientSyncRequest,
        options: AdminRequestOptions | None = None,
    ) -> AuthProjectClientSyncReport:
        """Register the environment's application clients with the provider."""
        path = f"{_environment_path(project_id, environment_id)}/clients/reconcile"
        return cast(
            AuthProjectClientSyncReport,
            self._admin.request("POST", path, dict(body), _require_idempotency_key(options)),
        )

    def list_invitations(
        self, project_id: str, environment_id: str, options: AdminRequestOptions | None = None
    ) -> AuthProjectInvitationListResponse:
        """Report the environment's invitations, newest first."""
        path = f"{_environment_path(project_id, environment_id)}/invitations"
        return cast(AuthProjectInvitationListResponse, self._admin.request("GET", path, None, options))

    def issue_invitation(
        self,
        project_id: str,
        environment_id: str,
        body: AuthProjectInvitationIssueRequest,
        options: AdminRequestOptions | None = None,
    ) -> AuthProjectInvitationIssued:
        """Invite one address into a directory and return the one-time link."""
        path = f"{_environment_path(project_id, environment_id)}/invitations"
        return cast(
            AuthProjectInvitationIssued,
            self._admin.request("POST", path, dict(body), _require_idempotency_key(options)),
        )

    def revoke_invitation(
        self,
        project_id: str,
        environment_id: str,
        body: AuthProjectInvitationRevocationRequest,
        options: AdminRequestOptions | None = None,
    ) -> AuthProjectInvitation:
        """Withdraw a live invitation before it is used."""
        path = f"{_environment_path(project_id, environment_id)}/invitations/revoke"
        return cast(
            AuthProjectInvitation,
            self._admin.request("POST", path, dict(body), _require_idempotency_key(options)),
        )

    def redeliver_invitation(
        self,
        project_id: str,
        environment_id: str,
        body: AuthProjectInvitationRedeliveryRequest,
        options: AdminRequestOptions | None = None,
    ) -> AuthProjectInvitationIssued:
        """Replace one live invitation's link and return the fresh one-time link."""
        path = f"{_environment_path(project_id, environment_id)}/invitations/redeliver"
        return cast(
            AuthProjectInvitationIssued,
            self._admin.request("POST", path, dict(body), _require_idempotency_key(options)),
        )

    def get_principal_profile(
        self, target: ApplicationPrincipalTarget, options: AdminRequestOptions | None = None
    ) -> ApplicationPrincipalProfile:
        """Read one application principal's profile, restricted to policy-visible fields."""
        path = _principal_target_path(target) + "/profile"
        return cast(ApplicationPrincipalProfile, self._admin.request("GET", path, None, options))

    def set_principal_profile(
        self,
        target: ApplicationPrincipalTarget,
        body: ApplicationProfileValuesRequest,
        options: AdminRequestOptions | None = None,
    ) -> ApplicationPrincipalProfile:
        """Set one application principal's profile values as an upsert."""
        path = _principal_target_path(target) + "/profile"
        return cast(
            ApplicationPrincipalProfile,
            self._admin.request("POST", path, dict(body), _require_idempotency_key(options)),
        )

    def list_principal_memberships(
        self, target: ApplicationPrincipalTarget, options: AdminRequestOptions | None = None
    ) -> ApplicationMembershipContext:
        """List the organisations one application principal may act for."""
        path = _principal_target_path(target) + "/memberships"
        return cast(ApplicationMembershipContext, self._admin.request("GET", path, None, options))

    def delete_project(
        self,
        project_id: str,
        body: AuthProjectDeletionRequest,
        options: AdminRequestOptions | None = None,
    ) -> AuthProjectDeletion:
        """Delete a project and everything scoped to it; ``confirmSlug`` names the stored slug."""
        path = f"/auth-projects/{_segment(project_id)}/delete"
        return cast(AuthProjectDeletion, self._admin.request("POST", path, dict(body), options))

    def delete_environment(
        self,
        project_id: str,
        environment_id: str,
        body: AuthProjectEnvironmentDeletionRequest,
        options: AdminRequestOptions | None = None,
    ) -> AuthProjectEnvironmentDeletion:
        """Delete one environment without touching its siblings; ``confirmSlug`` names the stored slug."""
        path = f"{_environment_path(project_id, environment_id)}/delete"
        return cast(AuthProjectEnvironmentDeletion, self._admin.request("POST", path, dict(body), options))

    def offboard_environment(
        self,
        project_id: str,
        environment_id: str,
        body: AuthProjectEnvironmentOffboardRequest,
        options: AdminRequestOptions | None = None,
    ) -> AuthProjectEnvironmentOffboarding:
        """Withdraw one environment's authority while keeping its data and reserved stores.

        It is the safe step for an environment whose directory still holds a
        credential store, which a physical delete refuses. The route carries no
        Idempotency-Key: the withdrawal is an addressed marker and a retry resumes
        the provider cleanup rather than duplicating it. ``confirmSlug`` names the
        stored environment slug exactly.
        """
        path = f"{_environment_path(project_id, environment_id)}/offboard"
        return cast(
            AuthProjectEnvironmentOffboarding,
            self._admin.request("POST", path, dict(body), options),
        )

    def provision_realm(
        self,
        project_id: str,
        environment_id: str,
        request: AuthProjectRealmProvisionRequest,
        options: AdminRequestOptions | None = None,
    ) -> AuthProjectRealmProvisionReceipt:
        """Set one environment's identity realm up in the order the service requires.

        The order matters because each write advances the environment's authority
        revision:

        1. Apply the desired state (which also registers the clients it implies).
        2. Enable the directory credential store, naming the revision the apply
           produced rather than the caller's stale read.
        3. Reconcile the environment's clients at the revision the directory enable
           produced, because the enable moved the revision past the observation the
           apply recorded.
        4. Read status and refuse to report success while the provider is not known
           to hold the configured registrations.

        Each mutating step derives a stable key from the base ``idempotency_key`` in
        options, so retrying the whole call with the same base key resumes rather
        than duplicating. The base must be 8 to 111 characters, so every derived key
        stays within the service's 8 to 128 bound. On a failed step it raises
        :class:`AuthProjectRealmProvisionError` with the failed step and every
        completed step's receipt; when every step ran but status is unreconciled it
        raises :class:`AuthProjectRealmNotConvergedError`.
        """
        resolved, base = _realm_base_key(options)
        receipt: AuthProjectRealmProvisionReceipt = {"projectId": project_id, "environmentId": environment_id}

        try:
            receipt["apply"] = self.apply_environment_desired_state(
                project_id,
                environment_id,
                request["desiredStateRequest"],
                {**resolved, "idempotency_key": f"{base}:apply"},
            )
        except Exception as error:
            receipt["failedStep"] = "apply"
            raise AuthProjectRealmProvisionError("apply", receipt) from error

        # The enable names the revision the apply committed; the service compares it
        # against the environment's current revision, which the apply just advanced.
        try:
            receipt["directory"] = self.act_on_directory(
                project_id,
                environment_id,
                "enable",
                {"poolId": request["directoryPoolId"], "expectedRevision": receipt["apply"]["revision"]},
                {**resolved, "idempotency_key": f"{base}:directory-enable"},
            )
        except Exception as error:
            receipt["failedStep"] = "directory_enable"
            raise AuthProjectRealmProvisionError("directory_enable", receipt) from error

        try:
            receipt["reconcile"] = self.reconcile_environment_clients(
                project_id,
                environment_id,
                {"expectedRevision": receipt["directory"]["revision"]},
                {**resolved, "idempotency_key": f"{base}:client-reconcile"},
            )
        except Exception as error:
            receipt["failedStep"] = "client_reconcile"
            raise AuthProjectRealmProvisionError("client_reconcile", receipt) from error

        try:
            # Status is a read, so it does not carry the workflow's write key.
            read_options: AdminRequestOptions = {}
            owning_user_uuid = resolved.get("owning_user_uuid")
            if owning_user_uuid is not None:
                read_options["owning_user_uuid"] = owning_user_uuid
            receipt["status"] = self.get_environment_status(project_id, environment_id, read_options)
        except Exception as error:
            receipt["failedStep"] = "status"
            raise AuthProjectRealmProvisionError("status", receipt) from error

        if not receipt["status"]["reconciled"]:
            receipt["failedStep"] = "status"
            raise AuthProjectRealmNotConvergedError(receipt, receipt["status"]["reconcileNote"])

        return receipt


def _realm_base_key(options: AdminRequestOptions | None) -> tuple[AdminRequestOptions, str]:
    """Validate the workflow's base key before any request is sent.

    A caller gets one clear error instead of a service rejection on a derived key
    whose suffix pushed it past the bound.
    """
    resolved = options or {}
    base = (resolved.get("idempotency_key") or "").strip()
    if base == "":
        raise ValueError("custd: auth-project realm provision requires a base idempotency key")
    if len(base) < _AUTH_PROJECT_REALM_MIN_KEY_LENGTH:
        raise ValueError(
            "custd: auth-project realm base idempotency key must be at least "
            f"{_AUTH_PROJECT_REALM_MIN_KEY_LENGTH} characters"
        )
    max_base = _AUTH_PROJECT_REALM_MAX_KEY_LENGTH - len(_AUTH_PROJECT_REALM_LONGEST_SUFFIX)
    if len(base) > max_base:
        raise ValueError(
            "custd: auth-project realm base idempotency key must be at most "
            f"{max_base} characters so every per-step key stays within {_AUTH_PROJECT_REALM_MAX_KEY_LENGTH}"
        )
    return resolved, base


def _segment(value: str) -> str:
    """Escape one path segment so a caller-supplied identifier cannot reshape the path."""
    return urllib.parse.quote(value, safe="")


def _environment_path(project_id: str, environment_id: str) -> str:
    """Address one environment under one project."""
    return f"/auth-projects/{_segment(project_id)}/environments/{_segment(environment_id)}"


def _application_principal_path(project_id: str, environment_id: str, directory_id: str, provider_subject: str) -> str:
    return (
        f"/auth-projects/{_segment(project_id)}"
        f"/environments/{_segment(environment_id)}"
        f"/directories/{_segment(directory_id)}"
        f"/principals/{_segment(provider_subject)}"
    )


def _principal_target_path(target: ApplicationPrincipalTarget) -> str:
    return _application_principal_path(
        target["projectId"], target["environmentId"], target["directoryId"], target["providerSubject"]
    )


def _require_idempotency_key(options: AdminRequestOptions | None) -> AdminRequestOptions:
    """Reject an empty key on the routes Custd makes retry-safe.

    A caller gets one clear error instead of a service 400.
    """
    key = (options or {}).get("idempotency_key")
    if not isinstance(key, str) or key.strip() == "":
        raise ValueError("custd: auth-project idempotency key is required")
    return options or {}
