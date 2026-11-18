"""Site Insights export: everything Custd keeps for one domain, in one document, and its daily
search metrics in pages.

Each part reuses the shape the matching read returns. Enum-like strings are open sets: compare
them with the constants below.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, TypedDict

if TYPE_CHECKING:
    # admin_site_domains imports this module for its client's return types, so the shared
    # shapes are referenced only in (postponed) annotations.
    from .admin_site_campaign_links import SiteCampaignLinkList
    from .admin_site_domains import SiteDomain, SiteFindingList, SiteIncidentList
    from .admin_site_insights import (
        SavedSiteReport,
        SiteIndexNowState,
        SiteLighthouseHistory,
        SiteProjectContext,
        SiteSearchInspectionList,
        SiteUptimeHistory,
    )
    from .admin_site_rankings import SiteRankings
    from .admin_site_web_data import SiteKeywordLists, SiteTopicTrends, SiteWebDomains

# The export document's schema; a reader checks it before reading the rest.
SITE_INSIGHTS_EXPORT_SCHEMA = "custd.site-insights-export.v1"

# The most search metric rows one export_search_metrics page holds, and its default.
SITE_INSIGHTS_EXPORT_SEARCH_METRICS_MAX_LIMIT = 10000

# The dimension a search metric row is summed over; total rows have an empty key.
SITE_SEARCH_METRIC_DIMENSION_TOTAL = "total"
SITE_SEARCH_METRIC_DIMENSION_PAGE = "page"
SITE_SEARCH_METRIC_DIMENSION_QUERY = "query"
SITE_SEARCH_METRIC_DIMENSION_COUNTRY = "country"
SITE_SEARCH_METRIC_DIMENSION_DEVICE = "device"


class SiteInsightsMonitoringExport(TypedDict):
    """Findings, outages, uptime and Lighthouse runs (one history per measured page, home page first).

    ``findingRows`` counts every finding; ``findings`` holds at most 10000.
    """

    findings: SiteFindingList
    findingRows: int
    incidents: SiteIncidentList
    uptime: SiteUptimeHistory
    lighthouse: list[SiteLighthouseHistory]


class SiteInsightsSearchExport(TypedDict):
    """Rankings, URL inspections and IndexNow; ``metricRows`` counts the rows export_search_metrics pages."""

    rankings: SiteRankings
    inspections: SiteSearchInspectionList
    indexNow: SiteIndexNowState
    metricRows: int


class SiteInsightsReportsExport(TypedDict):
    savedReports: list[SavedSiteReport]
    campaignLinks: SiteCampaignLinkList


class SiteInsightsSiteExport(TypedDict):
    """The domain's Site: its project context, keyword lists, web-data domains and topic trends."""

    projectContext: SiteProjectContext
    keywordLists: SiteKeywordLists
    webDomains: SiteWebDomains
    topicTrends: SiteTopicTrends


class SiteInsightsExport(TypedDict):
    """One domain's Site Insights data; ``schema`` is SITE_INSIGHTS_EXPORT_SCHEMA."""

    schema: str
    exportedAt: str
    domain: SiteDomain
    monitoring: SiteInsightsMonitoringExport
    search: SiteInsightsSearchExport
    reports: SiteInsightsReportsExport
    site: SiteInsightsSiteExport


class SiteSearchMetricDay(TypedDict):
    """One provider's day of search numbers for one dimension key."""

    provider: str
    day: str
    dimension: str
    key: str
    clicks: int
    impressions: int
    avgPosition: float


class SiteSearchMetricPage(TypedDict):
    """One page of the domain's stored daily search metrics; ``total`` counts every row."""

    domainUuid: str
    offset: int
    limit: int
    total: int
    rows: list[SiteSearchMetricDay]
