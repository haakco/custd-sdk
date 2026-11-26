"""Site Insights monitoring: heartbeats, private uptime, maintenance windows, finding
dismissals and the browser collector, all under ``/api/v1/site-domains/{domainUuid}``.

A credential (``token``) is returned only when a monitor is created or rotated; store it
then, because no read returns it again. Enum-like strings are open sets: compare with the
constants.
"""

from __future__ import annotations

from typing import NotRequired, TypedDict

SITE_HEARTBEAT_OUTCOME_SUCCEEDED = "succeeded"
SITE_HEARTBEAT_OUTCOME_FAILED = "failed"

SITE_FINDING_DISMISSAL_SCOPE_RULE = "rule"
SITE_FINDING_DISMISSAL_SCOPE_URL = "url"

SITE_BROWSER_COLLECTOR_ENABLED = "enabled"
SITE_BROWSER_COLLECTOR_DISABLED = "disabled"


class SiteHeartbeatSchedule(TypedDict):
    cron: str
    graceMinutes: int
    timezone: str


class SiteHeartbeatReport(TypedDict):
    scheduledFor: str
    outcome: str


class SiteHeartbeatReceipt(TypedDict):
    receivedAt: str
    report: SiteHeartbeatReport


class SiteHeartbeatMonitor(TypedDict):
    """One scheduled job's heartbeat; status is pending, on-time, late, missed or failed."""

    monitorUuid: str
    name: str
    schedule: SiteHeartbeatSchedule
    status: str
    startedAt: str
    nextExpectedAt: str
    latest: NotRequired[SiteHeartbeatReceipt]


class SiteHeartbeatList(TypedDict):
    monitors: list[SiteHeartbeatMonitor]


class SiteHeartbeatCreateRequest(TypedDict):
    name: str
    schedule: SiteHeartbeatSchedule


class SiteHeartbeatCredential(TypedDict):
    """A heartbeat with the report path and the one-time token the job reports with."""

    monitor: SiteHeartbeatMonitor
    reportPath: str
    token: str


class PrivateUptimeReport(TypedDict):
    reportUuid: str
    observedAt: str
    responseMs: int
    statusCode: NotRequired[int]
    failure: NotRequired[str]


class PrivateUptimeMonitor(TypedDict):
    """The domain's private-network uptime monitor; status is unknown, up or down."""

    monitorUuid: str
    networkLabel: str
    status: str
    requestedAt: NotRequired[str]
    latest: NotRequired[PrivateUptimeReport]


class PrivateUptimeCreateRequest(TypedDict):
    networkLabel: str


class PrivateUptimeCredential(TypedDict):
    """A private-uptime monitor with the report path and the one-time runner token."""

    monitor: PrivateUptimeMonitor
    reportPath: str
    token: str


class PrivateUptimeWork(TypedDict):
    """The accepted on-demand private check; the runner picks it up on its next poll."""

    requestedAt: NotRequired[str]


class SiteMaintenanceWindowRequest(TypedDict):
    """A window during which checks do not open incidents. windowUuid makes a retry safe."""

    windowUuid: str
    startsAt: str
    endsAt: str


class SiteMaintenanceWindow(TypedDict):
    windowUuid: str
    startsAt: str
    endsAt: str
    cancelledAt: NotRequired[str]


class SiteMaintenanceWindows(TypedDict):
    windows: list[SiteMaintenanceWindow]


class SiteFindingDismissalRequest(TypedDict):
    """Dismiss one finding's rule everywhere (scope rule) or only on its URL (scope url)."""

    findingUuid: str
    reason: str
    scope: str


class SiteFindingDismissal(TypedDict):
    dismissalUuid: str
    dismissedAt: str
    reason: str
    rule: str
    title: str
    url: NotRequired[str]


class SiteFindingDismissals(TypedDict):
    dismissals: list[SiteFindingDismissal]


class SiteBrowserCollectorRequest(TypedDict):
    """Enable (with an environment, on a verified domain) or disable the browser collector."""

    mode: str
    environment: NotRequired[str]


class SiteBrowserCollector(TypedDict):
    """The Site's browser collector; an enabled one carries its ingest key and allowed origin."""

    siteUuid: str
    mode: str
    environment: NotRequired[str]
    browserKey: NotRequired[str]
    allowedOrigin: NotRequired[str]
