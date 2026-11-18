"""Site Insights access-log traffic, AI visibility and hour replay.

Numbers come from the domain's CDN access logs, read hour by hour. ``coverage`` says how many
hours were read; a number the server could not measure is absent from the dict, never 0, while
a present 0 is a real 0. Enum-like strings are open sets: compare with the constants.
"""

from __future__ import annotations

from typing import NotRequired, TypedDict

# How much of one day's access logs were read.
SITE_TRAFFIC_DAY_COMPLETE = "complete"
SITE_TRAFFIC_DAY_PARTIAL = "partial"
SITE_TRAFFIC_DAY_MISSING = "missing"

# A crawler's identity: verified by reverse DNS, or only a User-Agent claiming to be it.
SITE_CRAWLER_IDENTITY_VERIFIED = "verified"
SITE_CRAWLER_IDENTITY_CLAIMS_TO_BE = "claims_to_be"

# What kind of site referred a request.
SITE_REFERRER_CLASS_SEARCH = "search"
SITE_REFERRER_CLASS_AI = "ai"
SITE_REFERRER_CLASS_SOCIAL = "social"
SITE_REFERRER_CLASS_OTHER = "other"

# The key (or path) that collects the rows beyond each day's top rows.
SITE_TRAFFIC_OTHER_KEY = "(other)"

# How a replayed hour stood before the replay; missing when it was never recorded.
SITE_ACCESS_LOG_HOUR_DONE = "done"
SITE_ACCESS_LOG_HOUR_PARTIAL = "partial"
SITE_ACCESS_LOG_HOUR_FAILED = "failed"
SITE_ACCESS_LOG_HOUR_MISSING = "missing"


class SiteTrafficCoverage(TypedDict):
    """Hours of the range read whole, in part, failed (retried) and not read; complete when all whole."""

    hoursExpected: int
    hoursRead: int
    hoursPartial: int
    hoursFailed: int
    hoursMissing: int
    complete: bool


class SiteTrafficTotals(TypedDict):
    """The range's totals; ``p95Ms`` is absent without a request."""

    requests: int
    bytes: int
    notFound: int
    p95Ms: NotRequired[int]


class SiteTrafficDay(TypedDict):
    """One UTC day, YYYY-MM-DD; its numbers are absent when no hour of it was read."""

    date: str
    coverage: str
    hoursRead: int
    hoursPartial: int
    hoursFailed: int
    hoursMissing: int
    requests: NotRequired[int]
    bytes: NotRequired[int]
    notFound: NotRequired[int]


class SiteTrafficCount(TypedDict):
    """Requests for one key: a status class, path, country or assistant domain."""

    key: str
    requests: int


class SiteTrafficSlowPath(TypedDict):
    path: str
    requests: int
    p95Ms: int
    maxMs: int


# "class" is a Python keyword, so the referrer shapes use the functional form.
SiteTrafficReferrerClass = TypedDict("SiteTrafficReferrerClass", {"class": str, "requests": int})
SiteTrafficReferrer = TypedDict("SiteTrafficReferrer", {"class": str, "domain": str, "requests": int})


class SiteTrafficCrawler(TypedDict):
    """One crawler's requests; ``ai`` when it fetches for an AI assistant or its training."""

    crawler: str
    identity: str
    ai: bool
    requests: int
    notFound: int


# "from" is a Python keyword, so the range's shared fields use the functional form.
_SiteTrafficRange = TypedDict(
    "_SiteTrafficRange",
    {"domainUuid": str, "from": str, "to": str, "generatedAt": str, "coverage": SiteTrafficCoverage},
)


class SiteTraffic(_SiteTrafficRange):
    """A domain's access-log traffic over UTC days ``from``..``to``; ``totals`` is absent when no hour was read."""

    days: list[SiteTrafficDay]
    statusClasses: list[SiteTrafficCount]
    notFoundPaths: list[SiteTrafficCount]
    slowPaths: list[SiteTrafficSlowPath]
    countries: list[SiteTrafficCount]
    referrerClasses: list[SiteTrafficReferrerClass]
    referrers: list[SiteTrafficReferrer]
    crawlers: list[SiteTrafficCrawler]
    totals: NotRequired[SiteTrafficTotals]


class SiteAIPage(TypedDict):
    """One page's AI-crawler requests (verified and claimed) and AI-assistant referrals."""

    path: str
    verifiedCrawlerHits: int
    claimedCrawlerHits: int
    referralVisits: int


class SiteAIVisibility(_SiteTrafficRange):
    """AI crawlers, AI-assistant referrals and the pages they reach over ``from``..``to``."""

    siteUuid: str
    crawlers: list[SiteTrafficCrawler]
    assistants: list[SiteTrafficCount]
    pages: list[SiteAIPage]


class SiteAccessLogHourReplay(TypedDict):
    """A queued replay of one UTC hour of access logs and how the hour stood before it."""

    hourStart: str
    previousStatus: str
    requestedAt: str
