"""Site Insights rank tracking: a domain's tracked keywords and their daily Search Console positions.

A day the keyword did not rank has no ``position``: it is absent from the dict, never 0. A keyword's
``pool`` band is absent when the tenant has not joined the search pool or the keyword is below its
threshold; the rankings' ``pool`` (SITE_SEARCH_POOL_JOINED or _NOT_JOINED) is absent from older servers.
Closed string sets are Literal aliases; a value a newer server adds still decodes.
"""

from __future__ import annotations

from typing import Literal, NotRequired, TypedDict

from .admin_site_search_pool import SearchPoolAccess, SearchPoolBand

SiteRankObservationState = Literal["ranking", "not_ranking", "no_data"]
SiteRankingsSource = Literal["not_connected", "pending", "active", "failing", "revoked"]
SiteTrackedKeywordStatus = Literal["active", "paused"]


# One day's rank state: ranked, had impressions without ranking, or no data for the day.
SITE_RANK_STATE_RANKING: SiteRankObservationState = "ranking"
SITE_RANK_STATE_NOT_RANKING: SiteRankObservationState = "not_ranking"
SITE_RANK_STATE_NO_DATA: SiteRankObservationState = "no_data"

SITE_TRACKED_KEYWORD_ACTIVE: SiteTrackedKeywordStatus = "active"
SITE_TRACKED_KEYWORD_PAUSED: SiteTrackedKeywordStatus = "paused"

# Country and device "all" track every country or device; a country is otherwise an ISO 3166-1
# alpha-3 code such as zaf.
SITE_RANK_COUNTRY_ALL = "all"
SITE_RANK_DEVICE_ALL = "all"
SITE_RANK_DEVICE_DESKTOP = "desktop"
SITE_RANK_DEVICE_MOBILE = "mobile"
SITE_RANK_DEVICE_TABLET = "tablet"

# The rankings source: the domain's Google Search Console connection, or not_connected.
SITE_RANKINGS_SOURCE_NOT_CONNECTED: SiteRankingsSource = "not_connected"
SITE_RANKINGS_SOURCE_PENDING: SiteRankingsSource = "pending"
SITE_RANKINGS_SOURCE_ACTIVE: SiteRankingsSource = "active"
SITE_RANKINGS_SOURCE_FAILING: SiteRankingsSource = "failing"
SITE_RANKINGS_SOURCE_REVOKED: SiteRankingsSource = "revoked"

SITE_MAX_TRACKED_KEYWORDS = 50
SITE_DEFAULT_NOTIFY_POSITION = 10
SITE_RANKINGS_DEFAULT_DAYS = 28
SITE_RANKINGS_MAX_DAYS = 90


class SiteTrackKeywordRequest(TypedDict):
    """Tracks a keyword; country and device default to all, notifyPosition (1..100) to 10."""

    keyword: str
    country: NotRequired[str]
    device: NotRequired[str]
    notifyPosition: NotRequired[int]


class SiteRankObservation(TypedDict):
    """One day (YYYY-MM-DD); ``position`` and ``rankingUrl`` are absent when not ranking."""

    day: str
    state: SiteRankObservationState
    clicks: int
    impressions: int
    rankingUrl: NotRequired[str]
    position: NotRequired[float]


class SiteTrackedKeyword(TypedDict):
    """A tracked keyword, its newest day and every day of the window, oldest first."""

    keywordUuid: str
    keyword: str
    country: str
    device: str
    status: SiteTrackedKeywordStatus
    notifyPosition: int
    createdAt: str
    latest: SiteRankObservation
    observations: list[SiteRankObservation]
    pool: NotRequired[SearchPoolBand]


# "from" is a Python keyword, so the window's fields use the functional form.
_SiteRankingsWindow = TypedDict("_SiteRankingsWindow", {"from": str, "to": str})


class SiteRankings(_SiteRankingsWindow):
    """A domain's tracked keywords over ``from``..``to``; ``sourceFailure`` says why a failing source fails."""

    source: SiteRankingsSource
    maxKeywords: int
    keywords: list[SiteTrackedKeyword]
    sourceFailure: NotRequired[str]
    pool: NotRequired[SearchPoolAccess]
