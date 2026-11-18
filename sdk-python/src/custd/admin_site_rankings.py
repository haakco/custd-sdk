"""Site Insights rank tracking: a domain's tracked keywords and their daily Search Console positions.

A day the keyword did not rank has no ``position``: it is absent from the dict, never 0. A keyword's
``pool`` band is absent when the tenant has not joined the search pool or the keyword is below its
threshold; the rankings' ``pool`` (SITE_SEARCH_POOL_JOINED or _NOT_JOINED) is absent from older servers.
Enum-like strings are open sets: compare with the constants.
"""

from __future__ import annotations

from typing import NotRequired, TypedDict

from .admin_site_search_pool import SearchPoolBand

# One day's rank state: ranked, had impressions without ranking, or no data for the day.
SITE_RANK_STATE_RANKING = "ranking"
SITE_RANK_STATE_NOT_RANKING = "not_ranking"
SITE_RANK_STATE_NO_DATA = "no_data"

SITE_TRACKED_KEYWORD_ACTIVE = "active"
SITE_TRACKED_KEYWORD_PAUSED = "paused"

# Country and device "all" track every country or device; a country is otherwise an ISO 3166-1
# alpha-3 code such as zaf.
SITE_RANK_COUNTRY_ALL = "all"
SITE_RANK_DEVICE_ALL = "all"
SITE_RANK_DEVICE_DESKTOP = "desktop"
SITE_RANK_DEVICE_MOBILE = "mobile"
SITE_RANK_DEVICE_TABLET = "tablet"

# The rankings source: the domain's Google Search Console connection, or not_connected.
SITE_RANKINGS_SOURCE_NOT_CONNECTED = "not_connected"
SITE_RANKINGS_SOURCE_PENDING = "pending"
SITE_RANKINGS_SOURCE_ACTIVE = "active"
SITE_RANKINGS_SOURCE_FAILING = "failing"
SITE_RANKINGS_SOURCE_REVOKED = "revoked"

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
    state: str
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
    status: str
    notifyPosition: int
    createdAt: str
    latest: SiteRankObservation
    observations: list[SiteRankObservation]
    pool: NotRequired[SearchPoolBand]


# "from" is a Python keyword, so the window's fields use the functional form.
_SiteRankingsWindow = TypedDict("_SiteRankingsWindow", {"from": str, "to": str})


class SiteRankings(_SiteRankingsWindow):
    """A domain's tracked keywords over ``from``..``to``; ``sourceFailure`` says why a failing source fails."""

    source: str
    maxKeywords: int
    keywords: list[SiteTrackedKeyword]
    sourceFailure: NotRequired[str]
    pool: NotRequired[str]
