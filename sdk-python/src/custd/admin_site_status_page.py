"""A Site's public status page: the draft selection, its preview, publication and customer updates.

``lastCheckedAt`` is absent until a component has been checked; ``draft`` and ``publication`` are
absent from the settings until the page has been saved or published.
"""

from __future__ import annotations

from typing import Literal, NotRequired, TypedDict

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
