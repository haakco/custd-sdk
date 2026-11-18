"""Site Insights shared search pool: tenants that join contribute their Search Console queries and
may read the pooled queries as k-anonymous demand and position bands.

The pool is tenant-wide; a site-bound credential is refused. Positions are percents of pooled
impressions rounded to 5, so a present 0 is a real 0. Enum-like strings are open sets: compare
with the constants.
"""

from __future__ import annotations

from typing import NotRequired, TypedDict

# A query's pooled monthly impressions band.
SITE_SEARCH_POOL_DEMAND_100_999 = "100_999"
SITE_SEARCH_POOL_DEMAND_1K_10K = "1k_10k"
SITE_SEARCH_POOL_DEMAND_10K_100K = "10k_100k"
SITE_SEARCH_POOL_DEMAND_100K_PLUS = "100k_plus"

# Whether the tenant has joined the pool; SiteRankings.pool carries the same values.
SITE_SEARCH_POOL_JOINED = "joined"
SITE_SEARCH_POOL_NOT_JOINED = "not_joined"

SITE_SEARCH_POOL_QUERIES_DEFAULT_LIMIT = 50
SITE_SEARCH_POOL_QUERIES_MAX_LIMIT = 200
SITE_SEARCH_POOL_SEARCH_MAX_LENGTH = 100

# A pooled query needs this many contributing tenants and impressions over the window.
SITE_SEARCH_POOL_MIN_CONTRIBUTORS = 5
SITE_SEARCH_POOL_MIN_IMPRESSIONS = 100
SITE_SEARCH_POOL_WINDOW_DAYS = 28

# The shared search pool terms version current when this SDK was released
# (https://custd.com/docs/terms/shared-search-pool/). Joining is the organisation's consent, so the
# caller names the version it accepts; prefer the live SearchPoolSetting.termsVersion, since this
# constant goes stale when the terms change.
SITE_SEARCH_POOL_TERMS_VERSION = "2026-11-18"


class SearchPoolSetting(TypedDict):
    """The tenant's pool membership, the pool's rules and the terms a join accepts.

    ``joinedAt`` and ``acceptedTermsVersion`` are absent when not joined; ``termsVersion``, the
    version a join must name, is absent from an older server.
    """

    joined: bool
    minContributors: int
    minImpressions: int
    windowDays: int
    joinedAt: NotRequired[str]
    termsVersion: NotRequired[str]
    acceptedTermsVersion: NotRequired[str]


class SearchPoolPositions(TypedDict):
    """Percent of pooled impressions at each position band."""

    top3: int
    top10: int
    top20: int
    beyond20: int


class SearchPoolBand(TypedDict):
    demandBand: str
    positions: SearchPoolPositions


class SearchPoolQuery(SearchPoolBand):
    query: str


# "from" is a Python keyword, so the window uses the functional form.
_SearchPoolWindow = TypedDict(
    "_SearchPoolWindow", {"from": NotRequired[str], "to": NotRequired[str], "computedAt": NotRequired[str]}
)


class SearchPoolQueryPage(_SearchPoolWindow):
    """The pooled queries; ``from``, ``to`` and ``computedAt`` are absent before the first rollup."""

    queries: list[SearchPoolQuery]
