"""Site Insights public web data: the page inventory of a Site's own and competitor domains,
Wikipedia topic trends, the content gap and the Site's keyword lists.

Every shape is the admin-api's own JSON. Closed string sets are Literal aliases;
a value a newer server adds still decodes, so keep values the SDK does not know yet.
"""

from __future__ import annotations

from typing import Literal, NotRequired, TypedDict

SiteContentGapCoverage = Literal["available", "unavailable"]
SiteKeywordDemandState = Literal["available", "no_market", "no_bing"]
SiteTopicTrendSource = Literal["brand", "seed"]
SiteTopicTrendStatus = Literal["pending", "found", "no_article", "failed"]
SiteTrancoBand = Literal["top-1k", "top-10k", "top-100k", "top-1m", "unranked", "unknown"]
SiteWebDomainRole = Literal["own", "competitor"]
SiteWebInventoryStatus = Literal["pending", "done", "partial", "unavailable", "failed"]


# A web-data domain's role: the Site's own domain or a competitor from its project context.
SITE_WEB_DOMAIN_ROLE_OWN: SiteWebDomainRole = "own"
SITE_WEB_DOMAIN_ROLE_COMPETITOR: SiteWebDomainRole = "competitor"

# Where a page URL was found.
SITE_WEB_PAGE_SOURCE_SITEMAP = "sitemap"
SITE_WEB_PAGE_SOURCE_WAYBACK = "wayback"

# How a domain's sitemap or Wayback inventory stands.
SITE_INVENTORY_PENDING: SiteWebInventoryStatus = "pending"
SITE_INVENTORY_DONE: SiteWebInventoryStatus = "done"
SITE_INVENTORY_PARTIAL: SiteWebInventoryStatus = "partial"
SITE_INVENTORY_UNAVAILABLE: SiteWebInventoryStatus = "unavailable"
SITE_INVENTORY_FAILED: SiteWebInventoryStatus = "failed"

# A domain's band on the Tranco top-sites list; unknown until the list is read.
SITE_TRANCO_TOP_1K: SiteTrancoBand = "top-1k"
SITE_TRANCO_TOP_10K: SiteTrancoBand = "top-10k"
SITE_TRANCO_TOP_100K: SiteTrancoBand = "top-100k"
SITE_TRANCO_TOP_1M: SiteTrancoBand = "top-1m"
SITE_TRANCO_UNRANKED: SiteTrancoBand = "unranked"
SITE_TRANCO_UNKNOWN: SiteTrancoBand = "unknown"

# A topic trend's Wikipedia lookup: pending, found, no article for the term, or failed.
SITE_TREND_PENDING: SiteTopicTrendStatus = "pending"
SITE_TREND_FOUND: SiteTopicTrendStatus = "found"
SITE_TREND_NO_ARTICLE: SiteTopicTrendStatus = "no_article"
SITE_TREND_FAILED: SiteTopicTrendStatus = "failed"

# Where a trend's term came from: a brand name of the project context or a keyword list's seed.
SITE_TREND_SOURCE_BRAND: SiteTopicTrendSource = "brand"
SITE_TREND_SOURCE_SEED: SiteTopicTrendSource = "seed"

# Whether the content gap could read the Site's own pages and queries.
SITE_GAP_COVERAGE_AVAILABLE: SiteContentGapCoverage = "available"
SITE_GAP_COVERAGE_UNAVAILABLE: SiteContentGapCoverage = "unavailable"

# Where keyword demand and related keywords come from.
SITE_KEYWORD_DEMAND_SOURCE_BING = "bing_keyword_research"

# Whether a keyword list's Bing demand could be read: available, no market in the project context,
# or no Bing keyword research on this deployment.
SITE_KEYWORD_DEMAND_AVAILABLE: SiteKeywordDemandState = "available"
SITE_KEYWORD_DEMAND_NO_MARKET: SiteKeywordDemandState = "no_market"
SITE_KEYWORD_DEMAND_NO_BING: SiteKeywordDemandState = "no_bing"


class SiteWebDomain(TypedDict):
    """One domain's page inventory. ``trancoRank`` is absent when unranked or unknown."""

    domain: str
    role: SiteWebDomainRole
    trancoBand: SiteTrancoBand
    sitemapStatus: SiteWebInventoryStatus
    waybackStatus: SiteWebInventoryStatus
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
    source: SiteTopicTrendSource
    project: str
    article: str
    status: SiteTopicTrendStatus
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
    ownCoverage: SiteContentGapCoverage
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
    marketSampleEnabled: NotRequired[bool]


class SiteRelatedKeyword(TypedDict):
    """A keyword Bing relates to the list's seed term, with its searches over the window."""

    keyword: str
    impressions: int
    broadImpressions: int


# "from" is a Python keyword, so the related keywords use the functional form.
_SiteRelatedKeywordsWindow = TypedDict("_SiteRelatedKeywordsWindow", {"from": str, "to": str})


class SiteRelatedKeywords(_SiteRelatedKeywordsWindow):
    """Bing's keywords related to the seed term; ``from`` and ``to`` are YYYY-MM-DD."""

    source: str
    market: str
    checkedAt: str
    keywords: list[SiteRelatedKeyword]


class SiteMarketSearchHit(TypedDict):
    title: str
    url: str
    authority: int
    date: NotRequired[str]


class SiteMarketSample(TypedDict):
    """The search results last observed for the list's seed term."""

    observedAt: str
    hits: list[SiteMarketSearchHit]


class SiteKeywordList(TypedDict):
    """A keyword list; ``related`` is absent until Bing was read for the seed term, and from older servers."""

    name: str
    keywords: list[str]
    createdAt: str
    updatedAt: str
    seedTerm: NotRequired[str]
    related: NotRequired[SiteRelatedKeywords]
    marketSampleEnabled: bool
    marketSample: NotRequired[SiteMarketSample]


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
    # Bing's latest weekly searches for the cluster's keywords, summed; absent when none was read.
    bingWeeklyImpressions: NotRequired[int]


class SiteKeywordStriking(TypedDict):
    """A keyword ranking just off page one."""

    keyword: str
    clicks: int
    impressions: int
    position: float


class SiteKeywordDemand(TypedDict):
    """Bing's searches for one keyword in the week of ``weekOf``.

    A number Bing did not report is absent, never 0; ``lastFailure`` says why the latest read
    failed (it is retried a day later).
    """

    keyword: str
    checkedAt: str
    weeklyImpressions: NotRequired[int]
    broadImpressions: NotRequired[int]
    weekOf: NotRequired[str]
    lastFailure: NotRequired[str]


class SiteKeywordDemandSet(TypedDict):
    """A keyword list's Bing demand, apart from the Site's own search numbers."""

    state: SiteKeywordDemandState
    source: str
    keywords: list[SiteKeywordDemand]
    market: NotRequired[str]


class SiteKeywordClusters(TypedDict):
    """A keyword list grouped by stem, with the Site's own search numbers over ``metricsDays``.

    ``demand`` is absent from an older server.
    """

    siteUuid: str
    name: str
    metricsSource: str
    metricsDays: int
    totalKeywords: int
    clusters: list[SiteKeywordCluster]
    strikingDistance: list[SiteKeywordStriking]
    demand: NotRequired[SiteKeywordDemandSet]


class SiteRegionalTrendMatch(TypedDict):
    topic: str
    sourceUrl: str
    publishedAt: str
    matchedTerm: str
    discussionUrl: NotRequired[str]


class SiteRegionalTrendMarket(TypedDict):
    supported: bool
    country: str
    checkedAt: NotRequired[str]
    stale: bool
    matches: list[SiteRegionalTrendMatch]


class SiteTechnicalTrends(TypedDict):
    """Global Hacker News evidence for a Site that opted in."""

    source: str
    checkedAt: NotRequired[str]
    stale: bool
    matches: list[SiteRegionalTrendMatch]


class SiteRegionalTrends(TypedDict):
    siteUuid: str
    source: str
    hasSavedTerms: bool
    markets: list[SiteRegionalTrendMarket]
    technical: NotRequired[SiteTechnicalTrends]
