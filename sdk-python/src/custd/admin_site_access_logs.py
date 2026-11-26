"""Site Insights access-log traffic, AI visibility and hour replay.

Numbers come from the domain's CDN access logs, read hour by hour. ``coverage`` says how many
hours were read; a number the server could not measure is absent from the dict, never 0, while
a present 0 is a real 0. Closed string sets are Literal
aliases; a value a newer server adds still decodes.
"""

from __future__ import annotations

from typing import Literal, NotRequired, TypedDict

from .admin_site_ai import SiteAIProduct

SiteAccessLogHourStatus = Literal["done", "partial", "failed", "missing"]
SiteCrawlerIdentity = Literal["verified", "claims_to_be"]
SiteReferrerClass = Literal["search", "ai", "social", "other"]
SiteTrafficDayCoverage = Literal["complete", "partial", "missing"]


# How much of one day's access logs were read.
SITE_TRAFFIC_DAY_COMPLETE: SiteTrafficDayCoverage = "complete"
SITE_TRAFFIC_DAY_PARTIAL: SiteTrafficDayCoverage = "partial"
SITE_TRAFFIC_DAY_MISSING: SiteTrafficDayCoverage = "missing"

# A crawler's identity: verified by reverse DNS, or only a User-Agent claiming to be it.
SITE_CRAWLER_IDENTITY_VERIFIED: SiteCrawlerIdentity = "verified"
SITE_CRAWLER_IDENTITY_CLAIMS_TO_BE: SiteCrawlerIdentity = "claims_to_be"

# What kind of site referred a request.
SITE_REFERRER_CLASS_SEARCH: SiteReferrerClass = "search"
SITE_REFERRER_CLASS_AI: SiteReferrerClass = "ai"
SITE_REFERRER_CLASS_SOCIAL: SiteReferrerClass = "social"
SITE_REFERRER_CLASS_OTHER: SiteReferrerClass = "other"

# The key (or path) that collects the rows beyond each day's top rows.
SITE_TRAFFIC_OTHER_KEY = "(other)"

# How a replayed hour stood before the replay; missing when it was never recorded.
SITE_ACCESS_LOG_HOUR_DONE: SiteAccessLogHourStatus = "done"
SITE_ACCESS_LOG_HOUR_PARTIAL: SiteAccessLogHourStatus = "partial"
SITE_ACCESS_LOG_HOUR_FAILED: SiteAccessLogHourStatus = "failed"
SITE_ACCESS_LOG_HOUR_MISSING: SiteAccessLogHourStatus = "missing"


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
    coverage: SiteTrafficDayCoverage
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
SiteTrafficReferrerClass = TypedDict("SiteTrafficReferrerClass", {"class": SiteReferrerClass, "requests": int})
SiteTrafficReferrer = TypedDict("SiteTrafficReferrer", {"class": SiteReferrerClass, "domain": str, "requests": int})


class SiteTrafficCrawler(TypedDict):
    """One crawler's requests; ``ai`` when it fetches for an AI assistant or its training."""

    crawler: str
    identity: SiteCrawlerIdentity
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


class SiteAIAnswerSample(TypedDict):
    """One AI product's latest answer about the site, when one was sampled."""

    product: SiteAIProduct
    observedAt: str
    answer: NotRequired[str]


class SiteAIVisibility(_SiteTrafficRange):
    """AI crawlers, AI-assistant referrals and the pages they reach over ``from``..``to``."""

    siteUuid: str
    crawlers: list[SiteTrafficCrawler]
    assistants: list[SiteTrafficCount]
    pages: list[SiteAIPage]
    answerSample: NotRequired[SiteAIAnswerSample]


class SiteAccessLogHourReplay(TypedDict):
    """A queued replay of one UTC hour of access logs and how the hour stood before it."""

    hourStart: str
    previousStatus: SiteAccessLogHourStatus
    requestedAt: str
