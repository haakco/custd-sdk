"""Site Insights scheduler tasks, as a platform operator sees them: whether each is registered and
enabled, its latest run and the work waiting across every tenant.

Only a system administrator may read it. Task names and run statuses are open sets: compare task
names with the constants below.
"""

from __future__ import annotations

from typing import NotRequired, TypedDict

SITE_INSIGHTS_TASK_CHECKS = "site-checks"
SITE_INSIGHTS_TASK_AUDITS = "site-audits"
SITE_INSIGHTS_TASK_SEARCH_IMPORTS = "site-search-imports"
SITE_INSIGHTS_TASK_WEB_DATA = "site-web-data"
SITE_INSIGHTS_TASK_WEB_GRAPH = "site-web-graph"
SITE_INSIGHTS_TASK_ACCESS_LOGS = "site-access-logs"
SITE_INSIGHTS_TASK_SEARCH_POOL = "site-search-pool"


class SiteInsightsBacklog(TypedDict):
    """One count of waiting work and what it means."""

    name: str
    count: int
    meaning: str


class SiteInsightsTaskStatus(TypedDict):
    """One task's state; ``registered`` is False when this deployment's scheduler never registered it.

    ``lastFailureAt`` is the start of the newest failed run among the recent runs.
    """

    taskName: str
    registered: bool
    enabled: bool
    backlog: list[SiteInsightsBacklog]
    nextRunAt: NotRequired[str]
    lastRunAt: NotRequired[str]
    lastRunStatus: NotRequired[str]
    lastFailureAt: NotRequired[str]
    lastFailure: NotRequired[str]


class SiteInsightsTaskList(TypedDict):
    generatedAt: str
    tasks: list[SiteInsightsTaskStatus]
