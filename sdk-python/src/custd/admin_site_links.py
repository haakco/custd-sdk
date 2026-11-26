"""Site Insights links: the domains linking to a Site's own or competitor domain, by source.

A count or rank the server could not measure is absent from the dict, never 0; a present 0 is a
real 0 and a present ``followed`` False is a real nofollow. The role is a web-domain role
(SITE_WEB_DOMAIN_ROLE_OWN or _COMPETITOR). Closed string sets are Literal aliases; a value a newer
server adds still decodes.
"""

from __future__ import annotations

from typing import Literal, NotRequired, TypedDict

from .admin_site_web_data import SiteWebDomainRole

SiteLinkDataSource = Literal["bing", "commoncrawl", "crawl"]
SiteLinkSourceStatus = Literal["available", "pending", "failed", "unavailable"]
SiteLostLinksStatus = Literal["available", "pending", "unavailable"]


# Where a referring domain was found: Bing Webmaster Tools, the Common Crawl domain graph, or
# Custd's own audit crawls of the Site's other domains.
SITE_LINK_SOURCE_BING: SiteLinkDataSource = "bing"
SITE_LINK_SOURCE_COMMONCRAWL: SiteLinkDataSource = "commoncrawl"
SITE_LINK_SOURCE_CRAWL: SiteLinkDataSource = "crawl"

# How one link source, or the lost-links comparison, stands for the domain.
SITE_LINK_SOURCE_STATUS_AVAILABLE: SiteLinkSourceStatus = "available"
SITE_LINK_SOURCE_STATUS_PENDING: SiteLinkSourceStatus = "pending"
SITE_LINK_SOURCE_STATUS_FAILED: SiteLinkSourceStatus = "failed"
SITE_LINK_SOURCE_STATUS_UNAVAILABLE: SiteLinkSourceStatus = "unavailable"


class SiteLinkSourceTotal(TypedDict):
    """One source's totals; ``complete`` is False when ``listed`` is fewer than it counted."""

    source: SiteLinkDataSource
    status: SiteLinkSourceStatus
    scope: str
    listed: int
    complete: bool
    asOf: NotRequired[str]
    referringDomains: NotRequired[int]
    links: NotRequired[int]
    lastFailure: NotRequired[str]


class SiteDomainAuthority(TypedDict):
    """The domain's place in a Common Crawl graph release; the ranks are absent outside the graph."""

    release: str
    graphDomain: str
    inGraph: bool
    harmonicRank: NotRequired[int]
    harmonicCentrality: NotRequired[float]
    pageRankRank: NotRequired[int]
    pageRank: NotRequired[float]
    hosts: NotRequired[int]


class SiteReferringDomain(TypedDict):
    """One linking domain and the sources that list it."""

    domain: str
    sources: list[str]
    bingLinks: NotRequired[int]
    crawlLinks: NotRequired[int]
    followed: NotRequired[bool]
    anchorText: NotRequired[str]
    harmonicRank: NotRequired[int]
    pageRankRank: NotRequired[int]


class SiteLostReferringDomain(TypedDict):
    domain: str
    harmonicRank: NotRequired[int]


class SiteLostLinks(TypedDict):
    """Domains the previous graph release listed as linking that ``release`` no longer does."""

    status: SiteLostLinksStatus
    scope: str
    domains: list[SiteLostReferringDomain]
    release: NotRequired[str]
    previousRelease: NotRequired[str]


class SiteReferringDomains(TypedDict):
    """A domain's referring domains; ``authority`` is absent before any graph release was read."""

    siteUuid: str
    domain: str
    role: SiteWebDomainRole
    sources: list[SiteLinkSourceTotal]
    referringDomains: list[SiteReferringDomain]
    lost: SiteLostLinks
    authority: NotRequired[SiteDomainAuthority]
