"""A company's admissions of OAuth clients, and the OAuth client scope and secret-recovery DTOs.

Approval is a decision about the snapshot a review returned: approve and revoke carry the
``expectedRevision`` they decided on, and a changed admission answers 409 so the caller reviews
again instead of retrying a decision the server has already refused.
"""

from __future__ import annotations

import urllib.parse
from typing import TYPE_CHECKING, Any, NotRequired, TypedDict, cast

if TYPE_CHECKING:
    from .client import AdminClient, AdminRequestOptions

OAUTH_CLIENT_ADMISSIONS_PATH = "/oauth-client-admissions"


class OAuthClientAdmissionGrant(TypedDict):
    resourceUri: str
    scopes: list[str]


class OAuthClientAdmission(TypedDict):
    admissionUuid: str
    clientId: str
    companyUuid: str
    revision: int
    requestedGrants: list[OAuthClientAdmissionGrant]
    requestedSecurityRevision: str
    approvedGrants: list[OAuthClientAdmissionGrant]
    approvedSecurityRevision: NotRequired[str]
    approvedAt: NotRequired[str]
    revokedAt: NotRequired[str]


class OAuthClientAdmissionList(TypedDict):
    admissions: list[OAuthClientAdmission]


class OAuthClientAdmissionMetadata(TypedDict):
    """The client's current registration, revalidated by the review."""

    clientName: str
    expiresAt: str
    redirectUris: list[str]
    securityRevision: str


class OAuthClientAdmissionReviewRequest(TypedDict):
    companySlug: str


class OAuthClientAdmissionReviewResponse(TypedDict):
    admission: OAuthClientAdmission
    metadata: OAuthClientAdmissionMetadata


class OAuthClientAdmissionApproveRequest(TypedDict):
    companySlug: str
    clientId: str
    expectedRevision: int
    securityRevision: str
    grants: list[OAuthClientAdmissionGrant]


class OAuthClientAdmissionRevokeRequest(TypedDict):
    companySlug: str
    expectedRevision: int


class OAuthClientAdmissionMutationResponse(TypedDict):
    admission: OAuthClientAdmission


class OAuthClientUpdateScopesRequest(TypedDict):
    companySlug: str
    profile: str
    scopes: list[str]


class OAuthClient(TypedDict):
    clientId: str
    companySlug: str
    scopes: list[str]
    environment: NotRequired[str]
    profile: NotRequired[str]
    purposeProfile: NotRequired[str]
    # When the client was created; an override saved for an earlier client of the same ID does not apply to it.
    createdAt: NotRequired[str]


class OAuthClientListResponse(TypedDict):
    clients: list[OAuthClient]


class OAuthClientSecretResponse(TypedDict):
    """A new client secret, shown only this once."""

    clientSecret: str


class OAuthClientAdmissionAdminClient:
    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin

    def list(self, company_slug: str, options: AdminRequestOptions | None = None) -> OAuthClientAdmissionList:
        """The selected company's admissions; the server checks the caller's membership of it."""
        path = OAUTH_CLIENT_ADMISSIONS_PATH + "?" + urllib.parse.urlencode({"companySlug": company_slug})
        response = self._admin.request("GET", path, None, options)
        admissions = [_admission(item) for item in response.get("admissions") or []]
        return OAuthClientAdmissionList(admissions=admissions)

    def review(
        self,
        admission_uuid: str,
        request: OAuthClientAdmissionReviewRequest,
        options: AdminRequestOptions | None = None,
    ) -> OAuthClientAdmissionReviewResponse:
        """Revalidate the admission against the client's current metadata and return both."""
        response = self._admin.request("POST", _action_path(admission_uuid, "review"), dict(request), options)
        metadata = dict(response.get("metadata") or {})
        metadata["redirectUris"] = metadata.get("redirectUris") or []
        return OAuthClientAdmissionReviewResponse(
            admission=_admission(response.get("admission")),
            metadata=cast(OAuthClientAdmissionMetadata, metadata),
        )

    def approve(
        self,
        admission_uuid: str,
        request: OAuthClientAdmissionApproveRequest,
        options: AdminRequestOptions | None = None,
    ) -> OAuthClientAdmissionMutationResponse:
        return self._mutate(admission_uuid, "approve", dict(request), options)

    def revoke(
        self,
        admission_uuid: str,
        request: OAuthClientAdmissionRevokeRequest,
        options: AdminRequestOptions | None = None,
    ) -> OAuthClientAdmissionMutationResponse:
        """Withdraw the admission at expectedRevision; the client's own registration stays."""
        return self._mutate(admission_uuid, "revoke", dict(request), options)

    def _mutate(
        self, admission_uuid: str, action: str, body: dict[str, Any], options: AdminRequestOptions | None
    ) -> OAuthClientAdmissionMutationResponse:
        response = self._admin.request("POST", _action_path(admission_uuid, action), body, options)
        return OAuthClientAdmissionMutationResponse(admission=_admission(response.get("admission")))


def oauth_client_with_scopes(value: dict[str, Any]) -> OAuthClient:
    """An OAuth client whose JSON null scope list decodes as empty."""
    client = dict(value)
    client["scopes"] = client.get("scopes") or []
    return cast(OAuthClient, client)


def _admission(value: Any) -> OAuthClientAdmission:
    admission = dict(value or {})
    for key in ("requestedGrants", "approvedGrants"):
        admission[key] = [_grant(grant) for grant in admission.get(key) or []]
    return cast(OAuthClientAdmission, admission)


def _grant(value: Any) -> OAuthClientAdmissionGrant:
    grant = dict(value or {})
    grant["scopes"] = grant.get("scopes") or []
    return cast(OAuthClientAdmissionGrant, grant)


def _action_path(admission_uuid: str, action: str) -> str:
    return f"{OAUTH_CLIENT_ADMISSIONS_PATH}/{urllib.parse.quote(admission_uuid, safe='')}/{action}"
