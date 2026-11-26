"""Reports a scheduled job or a private-network probe sends with its monitor's write credential.

Creating or rotating a heartbeat or private-uptime monitor returns its ``reportPath`` and one-time
``token``. Those two values and the API origin are the only authority these calls need, so they
take a ``SiteMonitorDestination`` instead of a client, never send the client's bearer token, and
never follow a redirect that would carry the write token to another address.
"""

from __future__ import annotations

import urllib.parse
from datetime import datetime
from typing import TypedDict

from ._wire import decode, public_request
from .admin_site_monitoring import (
    SITE_HEARTBEAT_OUTCOME_FAILED,
    SITE_HEARTBEAT_OUTCOME_SUCCEEDED,
    PrivateUptimeReport,
    PrivateUptimeWork,
    SiteHeartbeatReceipt,
    SiteHeartbeatReport,
)
from .client import no_redirect_transport
from .version import IDENTITY

SITE_HEARTBEAT_REPORT_PREFIX = "/api/v1/site-heartbeat-reports/"
PRIVATE_UPTIME_REPORT_PREFIX = "/api/v1/site-private-uptime-reports/"
DEFAULT_SITE_MONITOR_TIMEOUT_SECONDS = 10.0
_WRITE_TOKEN_LENGTH = 64
_HEARTBEAT_OUTCOMES = (SITE_HEARTBEAT_OUTCOME_SUCCEEDED, SITE_HEARTBEAT_OUTCOME_FAILED)


class SiteMonitorDestination(TypedDict):
    """The API origin with the report path and write token returned when the monitor was created."""

    base_url: str
    report_path: str
    write_token: str


def submit_site_heartbeat(
    destination: SiteMonitorDestination,
    report: SiteHeartbeatReport,
    *,
    timeout: float = DEFAULT_SITE_MONITOR_TIMEOUT_SECONDS,
) -> SiteHeartbeatReceipt:
    """Send a job occurrence's result and return the first receipt Custd accepted for it."""
    scheduled_for = _instant(report.get("scheduledFor"))
    if scheduled_for is None or report.get("outcome") not in _HEARTBEAT_OUTCOMES:
        raise ValueError("custd: heartbeat requires a scheduled time and succeeded or failed outcome")
    body = _send(destination, SITE_HEARTBEAT_REPORT_PREFIX, "POST", dict(report), timeout)
    receipt = decode(SiteHeartbeatReceipt, body)
    sent = receipt.get("report") or {}
    if (
        not receipt.get("receivedAt")
        or sent.get("outcome") != report["outcome"]
        or _instant(sent.get("scheduledFor")) != scheduled_for
    ):
        raise ValueError("custd: heartbeat receipt does not match the submitted occurrence")
    return receipt


def submit_private_uptime(
    destination: SiteMonitorDestination,
    report: PrivateUptimeReport,
    *,
    timeout: float = DEFAULT_SITE_MONITOR_TIMEOUT_SECONDS,
) -> None:
    """Send one observation from the probe inside the monitored network."""
    _send(destination, PRIVATE_UPTIME_REPORT_PREFIX, "POST", dict(report), timeout)


def get_private_uptime_work(
    destination: SiteMonitorDestination,
    *,
    timeout: float = DEFAULT_SITE_MONITOR_TIMEOUT_SECONDS,
) -> PrivateUptimeWork:
    """Return the on-demand check waiting for the probe; ``requestedAt`` is absent when there is none."""
    return decode(PrivateUptimeWork, _send(destination, PRIVATE_UPTIME_REPORT_PREFIX, "GET", None, timeout))


def _send(
    destination: SiteMonitorDestination, prefix: str, method: str, body: dict[str, object] | None, timeout: float
) -> object:
    base_url = _origin(destination["base_url"])
    report_path = destination["report_path"]
    tenant, _, monitor = report_path.removeprefix(prefix).partition("/")
    if (
        not report_path.startswith(prefix)
        or not _segment(tenant)
        or not _segment(monitor)
        or len(destination["write_token"]) != _WRITE_TOKEN_LENGTH
    ):
        raise ValueError("custd: site monitor requires a report path and write credential")
    headers = {"Authorization": "Bearer " + destination["write_token"], "X-Custd-Sdk": IDENTITY}
    if body is not None:
        headers["Content-Type"] = "application/json"
    return public_request(base_url, method, report_path, body, headers, timeout, no_redirect_transport)


def _origin(base_url: str) -> str:
    parsed = urllib.parse.urlsplit(base_url)
    if not parsed.hostname or parsed.username or parsed.query or parsed.fragment or parsed.path not in ("", "/"):
        raise ValueError("custd: site monitor requires an HTTPS API origin")
    return base_url.rstrip("/")


def _segment(value: str) -> bool:
    decoded = urllib.parse.unquote(value)
    return decoded not in ("", ".", "..") and not any(char in decoded for char in "/\\?#")


def _instant(value: object) -> datetime | None:
    if not isinstance(value, str):
        return None
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None
