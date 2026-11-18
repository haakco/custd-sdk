"""A domain's saved UTM campaign links: a page on the domain's own host tagged with utm_* values.

The server trims, lower-cases and joins spaces with "_" in every value, so reports never split one
channel across spellings. ``term`` and ``content`` are empty strings when unset; ``archivedAt`` is
absent while a link is active.
"""

from __future__ import annotations

from typing import NotRequired, TypedDict

# A 409 on create_campaign_link: the domain already has an active link with this tagged URL.
SITE_CAMPAIGN_LINK_TAKEN_CODE = "site_campaign_link_taken"
# A 409 on create_campaign_link: the domain keeps its maximum of active links; archive one first.
SITE_CAMPAIGN_LINK_LIMIT_CODE = "site_campaign_link_limit"

# How many active campaign links one domain keeps.
SITE_CAMPAIGN_LINKS_MAX = 500


class SiteCampaignLinkRequest(TypedDict):
    """source, medium and campaign are required; term (the paid keyword) and content are optional.

    Every value is at most 100 characters.
    """

    url: str
    source: str
    medium: str
    campaign: str
    term: NotRequired[str]
    content: NotRequired[str]


class SiteCampaignLink(TypedDict):
    """One saved link; ``taggedUrl`` is the link to share."""

    linkUuid: str
    url: str
    source: str
    medium: str
    campaign: str
    term: str
    content: str
    taggedUrl: str
    createdAt: str
    archivedAt: NotRequired[str]


class SiteCampaignLinkList(TypedDict):
    """A domain's links, newest first, and the utm_source and utm_medium names to suggest."""

    links: list[SiteCampaignLink]
    maxLinks: int
    suggestedSources: list[str]
    suggestedMediums: list[str]
