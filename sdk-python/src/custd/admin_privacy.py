"""Privacy controls: consent records, identifier mappings and privacy rules.

``client.admin.privacy`` records and revokes a subject's consent per purpose, maps a tenant's
subject identifiers, and reads or replaces the tenant's privacy rules. Erasure requests live on
``client.admin.privacy_erasures``.
"""

from __future__ import annotations

from typing import NotRequired, TypedDict

from ._wire import decode, request
from .client import AdminClient, quote_path


class PrivacyConsentRecord(TypedDict):
    expiresAt: NotRequired[str]
    granted: bool
    grantedAt: NotRequired[str]
    purpose: str
    recordedAt: str
    revokedAt: NotRequired[str]
    source: str
    subjectId: str


class PrivacyConsentListResponse(TypedDict):
    companySlug: str
    records: list[PrivacyConsentRecord]
    subjectId: str


class PrivacyIdentifierMapping(TypedDict):
    createdAt: str
    identifierId: str
    internalIdHash: str
    internalIdHashPrefix: str
    saltVersion: int


class PrivacyIdentifierListResponse(TypedDict):
    companySlug: str
    mappings: list[PrivacyIdentifierMapping]


class PrivacyRule(TypedDict):
    action: str
    enabled: bool
    fieldPath: str
    truncateLength: NotRequired[int]


class PrivacyRules(TypedDict):
    applyMode: str
    companySlug: str
    enabled: bool
    rules: list[PrivacyRule]


class PrivacyConsentRecordRequest(TypedDict):
    companySlug: str
    expiresAt: NotRequired[str]
    granted: bool
    purpose: str
    source: str
    subjectId: str


class PrivacyIdentifierMapRequest(TypedDict):
    externalId: str


class PrivacyAdminClient:
    """Records consent, maps identifiers and manages the tenant's privacy rules."""

    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin

    def delete_consent(
        self, subject_id: str, purpose: str, *, company_slug: str | None = None, source: str | None = None
    ) -> PrivacyConsentRecord:
        """Revoke a subject's consent for one purpose."""
        return decode(
            PrivacyConsentRecord,
            request(
                self._admin,
                "DELETE",
                f"/api/v1/admin/privacy/consent/{quote_path(subject_id)}",
                query={"purpose": purpose, "companySlug": company_slug, "source": source},
            ),
        )

    def list_consent(self, subject_id: str, *, company_slug: str | None = None) -> PrivacyConsentListResponse:
        """List a subject's consent records."""
        return decode(
            PrivacyConsentListResponse,
            request(
                self._admin,
                "GET",
                "/api/v1/admin/privacy/consent",
                query={"subjectId": subject_id, "companySlug": company_slug},
            ),
        )

    def list_identifier_mappings(self, company_slug: str) -> PrivacyIdentifierListResponse:
        """List a tenant's identifier mappings (truncated hash prefix only)."""
        return decode(
            PrivacyIdentifierListResponse,
            request(self._admin, "GET", f"/api/v1/admin/privacy/identifiers/{quote_path(company_slug)}"),
        )

    def get_rules(self, *, company_slug: str | None = None) -> PrivacyRules:
        """Get privacy rules."""
        return decode(
            PrivacyRules,
            request(self._admin, "GET", "/api/v1/admin/privacy/rules", query={"companySlug": company_slug}),
        )

    def record_consent(self, body: PrivacyConsentRecordRequest) -> PrivacyConsentRecord:
        """Record a consent grant or revocation."""
        return decode(
            PrivacyConsentRecord, request(self._admin, "POST", "/api/v1/admin/privacy/consent", body=dict(body))
        )

    def map_identifier(self, company_slug: str, body: PrivacyIdentifierMapRequest) -> PrivacyIdentifierMapping:
        """Hash an external identifier and store the mapping."""
        return decode(
            PrivacyIdentifierMapping,
            request(
                self._admin,
                "POST",
                f"/api/v1/admin/privacy/identifiers/{quote_path(company_slug)}/map",
                body=dict(body),
            ),
        )

    def set_rules(self, body: PrivacyRules) -> PrivacyRules:
        """Replace privacy rules."""
        return decode(PrivacyRules, request(self._admin, "PUT", "/api/v1/admin/privacy/rules", body=dict(body)))
