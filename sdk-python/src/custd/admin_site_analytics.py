"""Site Insights GA4 analytics: a domain's Google Analytics 4 connection and the organic landing
pages, key events and channels Custd imports through it.

Every shape is the admin-api's own JSON. A number GA4 did not report is absent, never 0. The
enum-like strings are open sets: compare them with the constants below.
"""

from __future__ import annotations

from typing import NotRequired, TypedDict

SITE_ANALYTICS_PROVIDER_GA4 = "ga4"

# A GA4 connection's state: pending until the first import, failing when the latest import
# failed (lastFailure says why), revoked when GA4 no longer allows Custd to read the property.
SITE_ANALYTICS_STATUS_PENDING = "pending"
SITE_ANALYTICS_STATUS_ACTIVE = "active"
SITE_ANALYTICS_STATUS_FAILING = "failing"
SITE_ANALYTICS_STATUS_REVOKED = "revoked"

# The GA4 reports Custd does not import, each listed in SiteAnalyticsReport.unavailable.
SITE_ANALYTICS_UNAVAILABLE_ECOMMERCE = "ecommerce"
SITE_ANALYTICS_UNAVAILABLE_AUDIENCE = "audience"


class SiteAnalyticsConnection(TypedDict):
    """A domain's GA4 connection; ``propertyId`` is the property's numeric ID."""

    provider: str
    propertyId: str
    status: str
    lastImportedAt: NotRequired[str]
    lastFailure: NotRequired[str]


class SiteAnalyticsRow(TypedDict):
    """One landing page path, key event name or channel group; an unreported number is absent."""

    key: str
    sessions: NotRequired[int]
    engagedSessions: NotRequired[int]
    keyEvents: NotRequired[float]


class SiteAnalyticsUnavailable(TypedDict):
    report: str
    reason: str


class SiteAnalyticsReport(TypedDict):
    """A domain's imported GA4 numbers over ``windowFrom``..``windowTo`` (YYYY-MM-DD).

    ``connection`` and the window are absent when the domain is not connected or not yet imported.
    With ``keyEventsRecorded`` False the property records no organic key event, and the rows carry
    no ``keyEvents``.
    """

    domainUuid: str
    keyEventsRecorded: bool
    landingPages: list[SiteAnalyticsRow]
    keyEvents: list[SiteAnalyticsRow]
    channels: list[SiteAnalyticsRow]
    unavailable: list[SiteAnalyticsUnavailable]
    connection: NotRequired[SiteAnalyticsConnection]
    windowFrom: NotRequired[str]
    windowTo: NotRequired[str]
