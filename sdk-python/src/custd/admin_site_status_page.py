"""A Site's public status page: the draft selection, its preview, publication and customer updates.

``lastCheckedAt`` is absent until a component has been checked; ``draft`` and ``publication`` are
absent from the settings until the page has been saved or published.

The ``*_public_status_page*`` functions are what the published page itself calls. The page's public
key (and, for a confirmation or unsubscribe link, its sealed token) is their only authority, so they
take an API base URL instead of a client and never send a bearer token.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Literal, NotRequired, TypedDict

from ._wire import decode, public_request
from .client import quote_path
from .version import IDENTITY

if TYPE_CHECKING:
    from .client import AdminTransport

PUBLIC_STATUS_PAGES_PATH = "/api/v1/public-status-pages"
DEFAULT_PUBLIC_STATUS_PAGE_TIMEOUT_SECONDS = 10.0

SiteStatusComponentStatus = Literal["unknown", "up", "failing", "down", "paused", "maintenance"]


class SiteStatusSelection(TypedDict):
    """A verified domain and the label customers see for it."""

    domainUuid: str
    label: str


class SiteStatusDraft(TypedDict):
    """The title and components to preview or publish."""

    title: str
    components: list[SiteStatusSelection]


class SiteStatusComponent(TypedDict):
    """The public projection of a selected component."""

    label: str
    status: SiteStatusComponentStatus
    lastCheckedAt: NotRequired[str]


class SiteStatusUpdate(TypedDict):
    """An update approved for public display."""

    message: str
    publishedAt: str


class SiteStatusPage(TypedDict):
    """The preview of what customers can see."""

    title: str
    components: list[SiteStatusComponent]
    updates: list[SiteStatusUpdate]


class SiteStatusPublication(TypedDict):
    """Identifies a published status page; build its link with site_status_page_public_url."""

    publicKey: str
    publishedAt: str


class SiteStatusSettings(TypedDict):
    """The private editor state for the Site."""

    draft: NotRequired[SiteStatusDraft]
    publication: NotRequired[SiteStatusPublication]


class SiteStatusUpdateRequest(TypedDict):
    """A reviewed customer message and a stable retry ID."""

    requestUuid: str
    message: str


class SiteStatusUpdateHistory(TypedDict):
    """The latest published updates."""

    updates: list[SiteStatusUpdate]


def site_status_page_public_url(publication: SiteStatusPublication, panel_origin: str) -> str:
    """The link customers open, on the Custd panel origin (https://custd.com in production).

    The key stays in the fragment, so it is never sent to a server or written to an access log.
    """
    return panel_origin.rstrip("/") + "/status-page#" + publication["publicKey"]


class SiteStatusSubscriptionRequest(TypedDict):
    """The address to send a subscription confirmation link to."""

    email: str


class SiteStatusSubscriptionToken(TypedDict):
    """The sealed token a confirmation or unsubscribe link carries."""

    token: str


def read_public_status_page(
    api_base_url: str,
    public_key: str,
    *,
    timeout: float = DEFAULT_PUBLIC_STATUS_PAGE_TIMEOUT_SECONDS,
    transport: AdminTransport | None = None,
) -> SiteStatusPage:
    """Read what customers see on a published status page."""
    path = _public_status_page_path(public_key)
    return decode(SiteStatusPage, public_request(api_base_url, "GET", path, None, _HEADERS, timeout, transport))


def subscribe_to_public_status_page(
    api_base_url: str,
    public_key: str,
    request: SiteStatusSubscriptionRequest,
    *,
    timeout: float = DEFAULT_PUBLIC_STATUS_PAGE_TIMEOUT_SECONDS,
    transport: AdminTransport | None = None,
) -> None:
    """Ask for update emails; Custd mails a confirmation link and answers the same for any key."""
    path = _public_status_page_path(public_key) + "/subscribe"
    public_request(api_base_url, "POST", path, dict(request), _JSON_HEADERS, timeout, transport)


def confirm_public_status_page_subscription(
    api_base_url: str,
    public_key: str,
    token: str,
    *,
    timeout: float = DEFAULT_PUBLIC_STATUS_PAGE_TIMEOUT_SECONDS,
    transport: AdminTransport | None = None,
) -> None:
    """Confirm the subscription a confirmation link's token names."""
    _send_subscription_token(api_base_url, public_key, "/confirm-subscription", token, timeout, transport)


def unsubscribe_from_public_status_page(
    api_base_url: str,
    public_key: str,
    token: str,
    *,
    timeout: float = DEFAULT_PUBLIC_STATUS_PAGE_TIMEOUT_SECONDS,
    transport: AdminTransport | None = None,
) -> None:
    """Stop the subscription an unsubscribe link's token names."""
    _send_subscription_token(api_base_url, public_key, "/unsubscribe", token, timeout, transport)


_HEADERS = {"X-Custd-Sdk": IDENTITY}
_JSON_HEADERS = {**_HEADERS, "Content-Type": "application/json"}


def _public_status_page_path(public_key: str) -> str:
    if not public_key.strip():
        raise ValueError("custd: a public status page requires its public key")
    return f"{PUBLIC_STATUS_PAGES_PATH}/{quote_path(public_key)}"


def _send_subscription_token(
    api_base_url: str, public_key: str, action: str, token: str, timeout: float, transport: AdminTransport | None
) -> None:
    if not token.strip():
        raise ValueError("custd: a status page subscription link requires its token")
    body = SiteStatusSubscriptionToken(token=token)
    path = _public_status_page_path(public_key) + action
    public_request(api_base_url, "POST", path, dict(body), _JSON_HEADERS, timeout, transport)
