"""Site Insights GA4 analytics: a domain's Google Analytics 4 connection and the organic landing
pages, key events and channels Custd imports through it.

Every shape is the admin-api's own JSON. A number GA4 did not report is absent, never 0. Closed
string sets are Literal aliases; a value a newer server adds still decodes, so keep a fallback.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Literal, NotRequired, TypedDict

if TYPE_CHECKING:
    from .admin_site_domains import SiteSearchConnectionStatus

SiteAnalyticsProvider = Literal["ga4"]
SiteAnalyticsUnavailableReport = Literal["ecommerce", "audience"]


SITE_ANALYTICS_PROVIDER_GA4: SiteAnalyticsProvider = "ga4"

# A GA4 connection's state: pending until the first import, failing when the latest import
# failed (lastFailure says why), revoked when GA4 no longer allows Custd to read the property.
SITE_ANALYTICS_STATUS_PENDING: SiteSearchConnectionStatus = "pending"
SITE_ANALYTICS_STATUS_ACTIVE: SiteSearchConnectionStatus = "active"
SITE_ANALYTICS_STATUS_FAILING: SiteSearchConnectionStatus = "failing"
SITE_ANALYTICS_STATUS_REVOKED: SiteSearchConnectionStatus = "revoked"

# The GA4 reports Custd does not import, each listed in SiteAnalyticsReport.unavailable.
SITE_ANALYTICS_UNAVAILABLE_ECOMMERCE: SiteAnalyticsUnavailableReport = "ecommerce"
SITE_ANALYTICS_UNAVAILABLE_AUDIENCE: SiteAnalyticsUnavailableReport = "audience"


class SiteAnalyticsConnection(TypedDict):
    """A domain's GA4 connection; ``propertyId`` is the property's numeric ID."""

    provider: SiteAnalyticsProvider
    propertyId: str
    status: SiteSearchConnectionStatus
    lastImportedAt: NotRequired[str]
    lastFailure: NotRequired[str]


class SiteAnalyticsRow(TypedDict):
    """One landing page path, key event name or channel group; an unreported number is absent."""

    key: str
    sessions: NotRequired[int]
    engagedSessions: NotRequired[int]
    keyEvents: NotRequired[float]


class SiteAnalyticsUnavailable(TypedDict):
    report: SiteAnalyticsUnavailableReport
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
