"""Site Insights search value: a fixed finding's search numbers before and after the fix, and the
goal conversions of the pages search brings visitors to.

A number the server could not measure is absent from the dict, never 0; a present 0 is a real 0.
Enum-like strings are open sets: compare with the constants.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, NotRequired, TypedDict

if TYPE_CHECKING:
    # admin_site_domains imports this module for its client's return types.
    from .admin_site_domains import SiteSearchTotals

# A finding's search impact: still open, measured, or without enough imported days.
SITE_SEARCH_IMPACT_OPEN = "open"
SITE_SEARCH_IMPACT_MEASURED = "measured"
SITE_SEARCH_IMPACT_INSUFFICIENT = "insufficient"

SITE_SEARCH_IMPACT_DEFAULT_DAYS = 28
SITE_SEARCH_IMPACT_MIN_DAYS = 7
SITE_SEARCH_IMPACT_MAX_DAYS = 90

# Whether the goal conversions could be read whole, in part (a row bound), or not at all.
SITE_SEARCH_VALUE_GOALS_MEASURED = "measured"
SITE_SEARCH_VALUE_GOALS_PARTIAL = "partial"
SITE_SEARCH_VALUE_GOALS_UNAVAILABLE = "unavailable"

SITE_SEARCH_VALUE_DEFAULT_DAYS = 28
SITE_SEARCH_VALUE_MAX_DAYS = 90
SITE_SEARCH_VALUE_MAX_GOALS = 5
SITE_SEARCH_VALUE_PAGES = 50

# "from" is a Python keyword, so the window uses the functional form.
SiteSearchImpactWindow = TypedDict("SiteSearchImpactWindow", {"from": str, "to": str})


class SiteSearchImpactPeriod(TypedDict):
    """One side of the fix; an insufficient period has no numbers and says why in ``reason``."""

    status: str
    coveredDays: int
    expectedDays: int
    reason: NotRequired[str]
    clicks: NotRequired[int]
    impressions: NotRequired[int]
    ctr: NotRequired[float]


class SiteFindingImpactSource(TypedDict):
    """One provider's numbers for the finding's page before and after the fix."""

    provider: str
    source: str
    granularity: str
    status: str
    before: SiteSearchImpactPeriod
    after: SiteSearchImpactPeriod


class SiteFindingImpact(TypedDict):
    """A finding's page search numbers around its fix; the windows are absent while it is open.

    ``note`` says the difference is an observation, not a measured effect of the fix.
    """

    findingUuid: str
    rule: str
    url: str
    pageUrl: str
    status: str
    windowDays: int
    sources: list[SiteFindingImpactSource]
    note: str
    fixedAt: NotRequired[str]
    before: NotRequired[SiteSearchImpactWindow]
    after: NotRequired[SiteSearchImpactWindow]


class SiteSearchValuePage(TypedDict):
    """One search page; ``landings`` and ``goalConversions`` are absent when goals were not read for it."""

    provider: str
    source: str
    pageUrl: str
    path: str
    search: SiteSearchTotals
    landings: NotRequired[int]
    goalConversions: NotRequired[int]


# "from" is a Python keyword, so the shape uses the functional form.
_SiteSearchValueWindow = TypedDict(
    "_SiteSearchValueWindow", {"domainUuid": str, "siteUuid": str, "days": int, "from": str, "to": str}
)


class SiteSearchValue(_SiteSearchValueWindow):
    """The domain's top search pages and the named goals their visitors reached; ``attribution`` says how."""

    goals: list[str]
    goalStatus: str
    attribution: str
    pages: list[SiteSearchValuePage]
    goalReason: NotRequired[str]
