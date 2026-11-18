"""Site Insights public web data: the page inventory of a Site's own and competitor domains,
Wikipedia topic trends, the content gap and the Site's keyword lists.

Every shape is the admin-api's own JSON. The enum-like strings are open sets: compare them
with the constants below and keep values the SDK does not know yet.
"""

from __future__ import annotations

from typing import NotRequired, TypedDict

# A web-data domain's role: the Site's own domain or a competitor from its project context.
SITE_WEB_DOMAIN_ROLE_OWN = "own"
SITE_WEB_DOMAIN_ROLE_COMPETITOR = "competitor"

# Where a page URL was found.
SITE_WEB_PAGE_SOURCE_SITEMAP = "sitemap"
SITE_WEB_PAGE_SOURCE_WAYBACK = "wayback"

# How a domain's sitemap or Wayback inventory stands.
SITE_INVENTORY_PENDING = "pending"
SITE_INVENTORY_DONE = "done"
SITE_INVENTORY_PARTIAL = "partial"
SITE_INVENTORY_UNAVAILABLE = "unavailable"
SITE_INVENTORY_FAILED = "failed"

# A domain's band on the Tranco top-sites list; unknown until the list is read.
SITE_TRANCO_TOP_1K = "top-1k"
SITE_TRANCO_TOP_10K = "top-10k"
SITE_TRANCO_TOP_100K = "top-100k"
SITE_TRANCO_TOP_1M = "top-1m"
SITE_TRANCO_UNRANKED = "unranked"
SITE_TRANCO_UNKNOWN = "unknown"

# A topic trend's Wikipedia lookup: pending, found, no article for the term, or failed.
SITE_TREND_PENDING = "pending"
SITE_TREND_FOUND = "found"
SITE_TREND_NO_ARTICLE = "no_article"
SITE_TREND_FAILED = "failed"

# Where a trend's term came from: a brand name of the project context or a keyword list's seed.
SITE_TREND_SOURCE_BRAND = "brand"
SITE_TREND_SOURCE_SEED = "seed"

# Whether the content gap could read the Site's own pages and queries.
SITE_GAP_COVERAGE_AVAILABLE = "available"
SITE_GAP_COVERAGE_UNAVAILABLE = "unavailable"


class SiteWebDomain(TypedDict):
    """One domain's page inventory. ``trancoRank`` is absent when unranked or unknown."""

    domain: str
    role: str
    trancoBand: str
    sitemapStatus: str
    waybackStatus: str
    pageCount: int
    nextInventoryAt: str
    trancoRank: NotRequired[int]
    trancoListDay: NotRequired[str]
    lastFailure: NotRequired[str]
    inventoryAt: NotRequired[str]


class SiteWebDomains(TypedDict):
    siteUuid: str
    domains: list[SiteWebDomain]


class SiteWebPage(TypedDict):
    """One page URL; ``firstSeen`` and ``lastSeen`` are YYYY-MM-DD."""

    url: str
    sources: list[str]
    firstSeen: str
    lastSeen: str


class SiteWebPages(TypedDict):
    """One page of a domain's URLs; pass ``next`` as ``after`` for the next page, absent on the last."""

    siteUuid: str
    domain: str
    pages: list[SiteWebPage]
    next: NotRequired[str]


class SiteTrendMonth(TypedDict):
    """One month (YYYY-MM) of Wikipedia page views."""

    month: str
    views: int


class SiteTopicTrend(TypedDict):
    term: str
    source: str
    project: str
    article: str
    status: str
    months: list[SiteTrendMonth]
    lastFailure: NotRequired[str]
    checkedAt: NotRequired[str]


class SiteTopicTrends(TypedDict):
    siteUuid: str
    trends: list[SiteTopicTrend]


class SiteGapPage(TypedDict):
    domain: str
    url: str
    sources: list[str]
    firstSeen: str
    lastSeen: str


class SiteGapTopic(TypedDict):
    """A topic competitors have pages on and the Site does not; ``pages`` holds up to five."""

    topic: str
    label: str
    competitors: list[str]
    pageCount: int
    pages: list[SiteGapPage]


class SiteGapCompetitor(TypedDict):
    domain: str
    sitemapStatus: str
    waybackStatus: str
    pageCount: int


class SiteContentGap(TypedDict):
    """The topics competitors cover and the Site does not; ``partial`` when an inventory is incomplete."""

    siteUuid: str
    ownCoverage: str
    ownPages: int
    ownQueries: int
    partial: bool
    competitors: list[SiteGapCompetitor]
    topics: list[SiteGapTopic]
    seed: NotRequired[str]


class SiteKeywordListRequest(TypedDict):
    """Creates or replaces a Site's keyword list by name: 1 to 500 keywords."""

    name: str
    keywords: list[str]
    seedTerm: NotRequired[str]


class SiteKeywordList(TypedDict):
    name: str
    keywords: list[str]
    createdAt: str
    updatedAt: str
    seedTerm: NotRequired[str]


class SiteKeywordLists(TypedDict):
    siteUuid: str
    lists: list[SiteKeywordList]


class SiteKeywordCluster(TypedDict):
    """Keywords sharing a word stem; the search numbers are absent when no keyword was measured."""

    cluster: str
    keywords: list[str]
    keywordCount: int
    measuredKeywords: int
    clicks: NotRequired[int]
    impressions: NotRequired[int]
    avgPosition: NotRequired[float]


class SiteKeywordStriking(TypedDict):
    """A keyword ranking just off page one."""

    keyword: str
    clicks: int
    impressions: int
    position: float


class SiteKeywordClusters(TypedDict):
    """A keyword list grouped by stem, with the Site's own search numbers over ``metricsDays``."""

    siteUuid: str
    name: str
    metricsSource: str
    metricsDays: int
    totalKeywords: int
    clusters: list[SiteKeywordCluster]
    strikingDistance: list[SiteKeywordStriking]
