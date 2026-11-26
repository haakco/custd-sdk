"""Campaign email: recipient permission, published revisions, scheduled runs and the welcome series.

``client.admin.campaign_email`` checks, confirms and withdraws a recipient's permission, publishes
and renders immutable email revisions, schedules and cancels campaign runs, and configures the
welcome series and the activation and confirmed-signup facts that drive it.
"""

from __future__ import annotations

from typing import NotRequired, TypedDict

from ._wire import decode, request
from .admin_notifications import CampaignTestSelection
from .client import AdminClient, quote_path


class CampaignEmailRevision(TypedDict):
    artifactJson: str
    publishedAt: str
    revision: str


class CampaignRunRecipientStatus(TypedDict):
    deliveryUuid: NotRequired[str]
    position: int
    reason: NotRequired[str]
    state: str


class CampaignRunStatus(TypedDict):
    cancelled: int
    cancelledAt: NotRequired[str]
    deliveries: list[CampaignRunRecipientStatus]
    excluded: int
    failed: int
    id: str
    pending: int
    processing: int
    recipients: int
    revision: str
    scheduledAt: str
    sent: int


class CampaignWelcomeEnrollment(TypedDict):
    activatedAt: NotRequired[str]
    contactId: str
    earliestReminderAt: NotRequired[str]
    reminderRunId: NotRequired[str]
    version: NotRequired[str]
    welcomeRunId: NotRequired[str]


class CampaignEmailRecipient(TypedDict):
    email: str


class CampaignEmailPermission(TypedDict):
    confirmedAt: NotRequired[str]
    eligible: bool
    withdrawnAt: NotRequired[str]


class CampaignEmailConfirmation(TypedDict):
    confirmedAt: str
    email: str
    evidenceRef: str
    source: str


class PublishCampaignEmailRevisionRequest(TypedDict):
    artifactJson: str
    revision: str


class CampaignRenderRequest(TypedDict):
    slots: dict[str, str]


class CampaignRenderResult(TypedDict):
    companyUuid: str
    html: str
    subject: str
    text: str


class CampaignRunScheduleRequest(TypedDict):
    audienceDigest: NotRequired[str]
    campaign: CampaignTestSelection
    id: str
    recipients: list[str]
    scheduledAt: str


class CampaignWelcomeActivation(TypedDict):
    activatedAt: str
    contactId: str


class CampaignWelcomeSignup(TypedDict):
    confirmedAt: str
    contactId: str
    email: str
    evidenceRef: str
    evidenceSource: str


class CampaignWelcomeDefinition(TypedDict):
    reminder: CampaignTestSelection
    version: str
    welcome: CampaignTestSelection


class CampaignWelcomeState(TypedDict):
    paused: bool
    version: str


class CampaignWelcomePause(TypedDict):
    paused: bool | None


class CampaignEmailAdminClient:
    """Runs the tenant's campaign email: permissions, revisions, runs and the welcome series."""

    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin

    def get_revision(self, revision: str, *, company_slug: str | None = None) -> CampaignEmailRevision:
        """Read an exact email campaign artifact revision."""
        return decode(
            CampaignEmailRevision,
            request(
                self._admin,
                "GET",
                f"/api/v1/admin/campaign-email-revisions/{quote_path(revision)}",
                query={"companySlug": company_slug},
            ),
        )

    def get_run(self, run_id: str, *, company_slug: str | None = None) -> CampaignRunStatus:
        """Inspect campaign run progress."""
        return decode(
            CampaignRunStatus,
            request(
                self._admin,
                "GET",
                f"/api/v1/admin/campaign-email-runs/{quote_path(run_id)}",
                query={"companySlug": company_slug},
            ),
        )

    def get_welcome_contact(self, contact_id: str, *, company_slug: str | None = None) -> CampaignWelcomeEnrollment:
        """Inspect a contact's welcome enrollment and delivery runs."""
        return decode(
            CampaignWelcomeEnrollment,
            request(
                self._admin,
                "GET",
                f"/api/v1/admin/campaign-email-welcome/contacts/{quote_path(contact_id)}",
                query={"companySlug": company_slug},
            ),
        )

    def check_permission(
        self, body: CampaignEmailRecipient, *, company_slug: str | None = None
    ) -> CampaignEmailPermission:
        """Check current campaign email permission."""
        return decode(
            CampaignEmailPermission,
            request(
                self._admin,
                "POST",
                "/api/v1/admin/campaign-email-permissions/check",
                query={"companySlug": company_slug},
                body=dict(body),
            ),
        )

    def confirm_permission(
        self, body: CampaignEmailConfirmation, *, company_slug: str | None = None
    ) -> CampaignEmailPermission:
        """Record an existing verified campaign opt-in."""
        return decode(
            CampaignEmailPermission,
            request(
                self._admin,
                "POST",
                "/api/v1/admin/campaign-email-permissions/confirm",
                query={"companySlug": company_slug},
                body=dict(body),
            ),
        )

    def withdraw_permission(
        self, body: CampaignEmailRecipient, *, company_slug: str | None = None
    ) -> CampaignEmailPermission:
        """Withdraw permission to send campaign email."""
        return decode(
            CampaignEmailPermission,
            request(
                self._admin,
                "POST",
                "/api/v1/admin/campaign-email-permissions/withdraw",
                query={"companySlug": company_slug},
                body=dict(body),
            ),
        )

    def create_revision(
        self, body: PublishCampaignEmailRevisionRequest, *, company_slug: str | None = None
    ) -> CampaignEmailRevision:
        """Publish a trusted-build email campaign artifact."""
        return decode(
            CampaignEmailRevision,
            request(
                self._admin,
                "POST",
                "/api/v1/admin/campaign-email-revisions",
                query={"companySlug": company_slug},
                body=dict(body),
            ),
        )

    def render_revision(self, revision: str, body: CampaignRenderRequest) -> CampaignRenderResult:
        """Render a published email campaign revision."""
        return decode(
            CampaignRenderResult,
            request(
                self._admin,
                "POST",
                f"/api/v1/admin/campaign-email-revisions/{quote_path(revision)}/render",
                body=dict(body),
            ),
        )

    def start_run(self, body: CampaignRunScheduleRequest, *, company_slug: str | None = None) -> CampaignRunStatus:
        """Schedule a pinned campaign run."""
        return decode(
            CampaignRunStatus,
            request(
                self._admin,
                "POST",
                "/api/v1/admin/campaign-email-runs",
                query={"companySlug": company_slug},
                body=dict(body),
            ),
        )

    def cancel_run(self, run_id: str, *, company_slug: str | None = None) -> CampaignRunStatus:
        """Cancel pending campaign delivery."""
        return decode(
            CampaignRunStatus,
            request(
                self._admin,
                "POST",
                f"/api/v1/admin/campaign-email-runs/{quote_path(run_id)}/cancel",
                query={"companySlug": company_slug},
            ),
        )

    def record_welcome_activation(
        self, body: CampaignWelcomeActivation, *, company_slug: str | None = None
    ) -> CampaignWelcomeEnrollment:
        """Record first-party contact activation and exit the reminder."""
        return decode(
            CampaignWelcomeEnrollment,
            request(
                self._admin,
                "POST",
                "/api/v1/admin/campaign-email-welcome/activation",
                query={"companySlug": company_slug},
                body=dict(body),
            ),
        )

    def record_welcome_confirmed_signup(
        self, body: CampaignWelcomeSignup, *, company_slug: str | None = None
    ) -> CampaignWelcomeEnrollment:
        """Enter a contact with recorded opt-in evidence."""
        return decode(
            CampaignWelcomeEnrollment,
            request(
                self._admin,
                "POST",
                "/api/v1/admin/campaign-email-welcome/confirmed-signup",
                query={"companySlug": company_slug},
                body=dict(body),
            ),
        )

    def put_welcome_definition(
        self, body: CampaignWelcomeDefinition, *, company_slug: str | None = None
    ) -> CampaignWelcomeState:
        """Configure a pinned welcome funnel."""
        return decode(
            CampaignWelcomeState,
            request(
                self._admin,
                "PUT",
                "/api/v1/admin/campaign-email-welcome/definition",
                query={"companySlug": company_slug},
                body=dict(body),
            ),
        )

    def set_welcome_paused(
        self, body: CampaignWelcomePause, *, company_slug: str | None = None
    ) -> CampaignWelcomeState:
        """Pause or resume welcome funnel submissions."""
        return decode(
            CampaignWelcomeState,
            request(
                self._admin,
                "PUT",
                "/api/v1/admin/campaign-email-welcome/pause",
                query={"companySlug": company_slug},
                body=dict(body),
            ),
        )
