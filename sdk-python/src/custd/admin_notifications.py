"""Notification delivery: webhooks, delivery attempts, destinations and the email relay.

``client.admin.webhooks`` subscribes signed webhooks to platform events, rotates their secrets
and reads or replays deliveries; ``client.admin.notification_destinations`` routes one event to
the tenant's chosen destination; ``client.admin.email_relay`` configures and tests the SMTP relay
a tenant's email goes out through.
"""

from __future__ import annotations

from typing import Literal, NotRequired, TypedDict

from ._wire import decode, request
from .client import AdminClient, quote_path

NotificationChannel = Literal["webhook", "slack", "email"]
NotificationDestinationEventSlug = Literal[
    "error_issue_alert",
    "site_finding_opened",
    "site_incident",
    "site_ai_allowance",
]
NotificationEventSlug = Literal[
    "email_relay_test_send",
    "identity_verify_email",
    "identity_reset_password",
    "user_welcome",
    "application_invitation",
    "error_issue_alert",
    "site_finding_opened",
    "site_incident",
    "site_ai_allowance",
    "site_status_page_confirm",
    "site_status_page_update",
]
NotificationWebhookKind = Literal["webhook", "slack"]


class EmailRelayEffectiveSender(TypedDict):
    fromAddress: str
    fromDisplayName: str
    hasCredential: bool
    relay: str


class EmailRelay(TypedDict):
    createdAt: str
    enabled: bool
    fromAddress: str
    fromDisplayName: str
    hasCredential: bool
    host: str
    port: int
    tlsMode: str
    updatedAt: str
    username: str


class EmailRelayView(TypedDict):
    """A tenant's own relay, None while the tenant sends through Custd's relay, and the sender in effect."""

    effective: EmailRelayEffectiveSender
    relay: EmailRelay | None


class NotificationDeliveryStatus(TypedDict):
    attemptCount: int
    channel: str
    createdAt: str
    deliveryUuid: str
    failureReason: NotRequired[str]
    lastErrorClass: NotRequired[str]
    messageUuid: str
    nextAction: NotRequired[str]
    providerMessageId: NotRequired[str]
    sentAt: NotRequired[str]
    state: str
    templateId: str
    terminalAt: NotRequired[str]
    updatedAt: str


class NotificationWebhookSubscription(TypedDict):
    createdAt: str
    enabled: bool
    endpoint: str
    kind: NotificationWebhookKind
    name: str
    updatedAt: str
    uuid: str


class NotificationWebhookListResponse(TypedDict):
    subscriptions: list[NotificationWebhookSubscription]


class NotificationDestination(TypedDict):
    channel: NotificationChannel
    configured: bool
    emailRecipient: NotRequired[str]
    enabled: bool
    eventSlug: NotificationEventSlug


class NotificationWebhookEnabledRequest(TypedDict):
    enabled: bool


class CampaignTestSelection(TypedDict):
    revision: str
    values: dict[str, str]


class EmailRelayTestSendRequest(TypedDict):
    campaign: NotRequired[CampaignTestSelection]
    receiptRevision: NotRequired[str]
    recipient: str


class EmailRelayTestSendResult(TypedDict):
    accepted: bool
    deliveryUuids: list[str]
    messageUuid: str
    sender: EmailRelayEffectiveSender


class NotificationWebhookCreateRequest(TypedDict):
    companySlug: str
    enabled: bool
    endpoint: str
    # Defaults to webhook.
    kind: NotRequired[NotificationWebhookKind]
    name: str


class NotificationWebhookSecret(TypedDict):
    createdAt: str
    enabled: bool
    endpoint: str
    kind: NotificationWebhookKind
    name: str
    # Shown once; empty for a Slack subscription, whose URL is its secret.
    signingSecret: str
    updatedAt: str
    uuid: str


class EmailRelayWriteRequest(TypedDict):
    enabled: bool
    fromAddress: str
    fromDisplayName: str
    host: str
    password: str
    port: int
    tlsMode: str
    username: str


class NotificationDestinationRequest(TypedDict):
    channel: NotificationChannel
    emailRecipient: NotRequired[str]
    enabled: bool


class EmailRelayAdminClient:
    """Configures, tests and clears a tenant's email relay."""

    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin

    def delete(self, tenant_slug: str) -> None:
        """Clear a tenant's email relay."""
        request(self._admin, "DELETE", f"/api/v1/admin/email-relay/{quote_path(tenant_slug)}")

    def get(self, tenant_slug: str) -> EmailRelayView:
        """Get a tenant's email relay and effective sender."""
        return decode(
            EmailRelayView, request(self._admin, "GET", f"/api/v1/admin/email-relay/{quote_path(tenant_slug)}")
        )

    def test_send(self, tenant_slug: str, body: EmailRelayTestSendRequest) -> EmailRelayTestSendResult:
        """Send a test email on a tenant's effective relay."""
        return decode(
            EmailRelayTestSendResult,
            request(
                self._admin, "POST", f"/api/v1/admin/email-relay/{quote_path(tenant_slug)}/test-send", body=dict(body)
            ),
        )

    def put(self, tenant_slug: str, body: EmailRelayWriteRequest) -> EmailRelay:
        """Create or replace a tenant's email relay."""
        return decode(
            EmailRelay,
            request(self._admin, "PUT", f"/api/v1/admin/email-relay/{quote_path(tenant_slug)}", body=dict(body)),
        )


class NotificationWebhookAdminClient:
    """Manages the tenant's notification webhooks and their deliveries."""

    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin

    def delete(self, uuid: str) -> None:
        """Delete notification webhook."""
        request(self._admin, "DELETE", f"/api/v1/admin/notification-webhooks/{quote_path(uuid)}")

    def get_delivery(self, uuid: str, *, company_slug: str | None = None) -> NotificationDeliveryStatus:
        """Get notification delivery."""
        return decode(
            NotificationDeliveryStatus,
            request(
                self._admin,
                "GET",
                f"/api/v1/admin/notification-deliveries/{quote_path(uuid)}",
                query={"companySlug": company_slug},
            ),
        )

    def list(self) -> NotificationWebhookListResponse:
        """List notification webhooks."""
        return decode(
            NotificationWebhookListResponse, request(self._admin, "GET", "/api/v1/admin/notification-webhooks")
        )

    def set_enabled(
        self, uuid: str, body: NotificationWebhookEnabledRequest, *, company_slug: str | None = None
    ) -> NotificationWebhookSubscription:
        """Update notification webhook."""
        return decode(
            NotificationWebhookSubscription,
            request(
                self._admin,
                "PATCH",
                f"/api/v1/admin/notification-webhooks/{quote_path(uuid)}",
                query={"companySlug": company_slug},
                body=dict(body),
            ),
        )

    def replay_delivery(self, uuid: str, *, company_slug: str | None = None) -> None:
        """Replay notification delivery."""
        path = f"/api/v1/admin/notification-deliveries/{quote_path(uuid)}/replay"
        request(self._admin, "POST", path, query={"companySlug": company_slug})

    def create(self, body: NotificationWebhookCreateRequest) -> NotificationWebhookSecret:
        """Create notification webhook."""
        return decode(
            NotificationWebhookSecret,
            request(self._admin, "POST", "/api/v1/admin/notification-webhooks", body=dict(body)),
        )

    def rotate_secret(self, uuid: str, *, company_slug: str | None = None) -> NotificationWebhookSecret:
        """Rotate notification webhook secret."""
        return decode(
            NotificationWebhookSecret,
            request(
                self._admin,
                "POST",
                f"/api/v1/admin/notification-webhooks/{quote_path(uuid)}/rotate-secret",
                query={"companySlug": company_slug},
            ),
        )


class NotificationDestinationAdminClient:
    """Reads and sets where one notification event is delivered."""

    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin

    def get(
        self, event_slug: NotificationDestinationEventSlug, *, company_slug: str | None = None
    ) -> NotificationDestination:
        """Get where one event is sent for the tenant."""
        return decode(
            NotificationDestination,
            request(
                self._admin,
                "GET",
                f"/api/v1/notification-destinations/{quote_path(event_slug)}",
                query={"companySlug": company_slug},
            ),
        )

    def put(
        self,
        event_slug: NotificationDestinationEventSlug,
        body: NotificationDestinationRequest,
        *,
        company_slug: str | None = None,
    ) -> NotificationDestination:
        """Set where one event is sent for the tenant."""
        return decode(
            NotificationDestination,
            request(
                self._admin,
                "PUT",
                f"/api/v1/notification-destinations/{quote_path(event_slug)}",
                query={"companySlug": company_slug},
                body=dict(body),
            ),
        )
