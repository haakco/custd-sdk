"""Hosting DTOs for one auth-project environment: its issuer domain, app releases,
realm brand logo and app-item links.

The calls are methods on :class:`custd.admin_auth_projects.AuthProjectAdminClient`.
Enum-like strings are open sets owned by Custd.
"""

from __future__ import annotations

from typing import NotRequired, TypedDict


class AuthDomainDNSProof(TypedDict):
    recordName: str
    recordValue: str


class AuthDomainImageSet(TypedDict, total=False):
    gateway: str
    hydra: str


class AuthDomainImageOverrideStatus(TypedDict):
    component: str
    imageDigest: str
    incidentReference: str
    receiptId: str
    actorKind: str
    state: str
    setAt: str
    expiresAt: str
    actorSubject: NotRequired[str]
    endedAt: NotRequired[str]
    endedBy: NotRequired[str]


class AuthDomainImages(TypedDict):
    convergence: str
    source: str
    expected: AuthDomainImageSet
    running: AuthDomainImageSet
    override: NotRequired[AuthDomainImageOverrideStatus]


class AuthDomainBinding(TypedDict):
    """The environment's issuer host claim and how far its realm has converged."""

    environmentId: str
    host: str
    issuer: str
    lifecycle: str
    status: str
    intentRevision: int
    createdAt: str
    images: AuthDomainImages
    certificateExpiresAt: NotRequired[str]
    dnsProof: NotRequired[AuthDomainDNSProof]
    dnsTarget: NotRequired[str]
    observedAt: NotRequired[str]
    siteDomainId: NotRequired[str]
    slotRef: NotRequired[str]


class AuthDomainBindRequest(TypedDict):
    host: str
    siteDomainId: str


class AuthDomainMintRequest(TypedDict):
    """Mint the env-<environment uuid> issuer host under an attested Site domain."""

    siteDomainId: str


class AuthDomainImageOverrideRequest(TypedDict):
    """One bounded image exception: expiresAt at most 24 hours ahead of the server clock."""

    component: str
    imageDigest: str
    incidentReference: str
    expiresAt: str


class AppReleaseFile(TypedDict):
    path: str
    contentType: str
    sha256: str
    size: int


class AppReleaseCacheRule(TypedDict):
    match: str
    mode: str


class AppReleaseResponseHeader(TypedDict):
    name: str
    value: str


class AppReleaseHeaderRule(TypedDict):
    route: str
    framing: NotRequired[str]
    headers: NotRequired[list[AppReleaseResponseHeader]]


class AppReleaseShareableRoute(TypedDict):
    route: str
    kind: str
    title: str
    cardTemplate: str
    description: NotRequired[str]


class AppReleaseSiteCard(TypedDict):
    title: str
    cardTemplate: str
    description: NotRequired[str]


class AppReleaseSPAFallback(TypedDict):
    prefix: str
    file: str


class AppReleaseRouting(TypedDict, total=False):
    cache: list[AppReleaseCacheRule]
    headers: list[AppReleaseHeaderRule]
    indexFile: str
    notFoundPage: str
    shareableRoutes: list[AppReleaseShareableRoute]
    siteCard: AppReleaseSiteCard
    spaFallbacks: list[AppReleaseSPAFallback]


class AppReleaseCreateRequest(TypedDict):
    """A release manifest: every file's size and sha256, and how the host routes them."""

    files: list[AppReleaseFile]
    routing: AppReleaseRouting
    label: NotRequired[str]


class AppReleaseManifest(TypedDict):
    releaseId: str
    version: int
    createdAt: str
    files: list[AppReleaseFile]
    routing: AppReleaseRouting


class AppReleaseSummary(TypedDict):
    releaseId: str
    state: str
    active: bool
    createdAt: str
    fileCount: int
    totalBytes: int
    label: NotRequired[str]
    verifiedAt: NotRequired[str]


class AppRelease(AppReleaseSummary):
    manifest: AppReleaseManifest


class AppReleaseList(TypedDict):
    releases: list[AppReleaseSummary]


class AppReleaseUploadedFile(TypedDict):
    path: str
    sha256: str
    size: int


class AppReleasePromotion(TypedDict):
    releaseId: str
    host: str
    promotedAt: str
    previousReleaseId: NotRequired[str]


class AuthProjectBrandLogo(TypedDict):
    """The stored realm logo; the image bytes are served by the realm, never returned here."""

    contentType: str
    byteSize: int
    width: int
    height: int
    updatedAt: str


class AuthProjectAppLink(TypedDict):
    """One app item linked to the environment; kind and role are open sets."""

    linkUuid: str
    itemUuid: str
    kind: str
    role: str
    createdAt: str
    itemExpiresAt: str


class AuthProjectAppLinkList(TypedDict):
    links: list[AuthProjectAppLink]


# Who may sign in to a hosted app; an open set owned by Custd.
APP_SIGN_IN_MODE_OFF = "off"
APP_SIGN_IN_MODE_INVITE_ONLY = "invite_only"
APP_SIGN_IN_MODE_OPEN = "open"


class AppCreateRequest(TypedDict):
    """Body of POST /api/v1/admin/apps: a name, and whether the app signs people in."""

    name: str
    signIn: NotRequired[bool]


class AppReason(TypedDict):
    code: str
    message: str


class AppSummary(TypedDict):
    """One hosted app; status is an open set (for example serving, paused or failed)."""

    appId: str
    slug: str
    name: str
    environmentId: str
    host: str
    url: str
    status: str
    signIn: bool
    siteUuid: NotRequired[str]
    reason: NotRequired[AppReason]
    activeReleaseId: NotRequired[str]
    servingSince: NotRequired[str]


class AppCreation(TypedDict):
    """The receipt for one create; ``replayed`` is true when the Idempotency-Key had already created it."""

    app: AppSummary
    replayed: bool
    trafficReporting: str


class AppListResponse(TypedDict):
    """One page of the caller's apps, worst status first. Pass ``nextAfter`` as the next ``after``."""

    apps: list[AppSummary]
    nextAfter: NotRequired[str]


class AppOverview(TypedDict):
    app: AppSummary
    latestRelease: NotRequired[AppReleaseSummary]
    releaseCount: int
    ownerLinks: int
    shareLinks: int


class AppDeployCredential(TypedDict):
    """A CI credential for this app's release routes. The secret is in this response only."""

    clientId: str
    clientSecret: str
    app: str
    scope: str


class AppDeployCredentialSummary(TypedDict):
    clientId: str
    createdAt: str


class AppDeployCredentialList(TypedDict):
    credentials: list[AppDeployCredentialSummary]


class AppSignInRequest(TypedDict):
    """A sign-in change against the environment revision Auth Project Status reports."""

    mode: str
    expectedRevision: int
