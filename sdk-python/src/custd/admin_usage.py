from __future__ import annotations

import urllib.parse
from datetime import datetime
from typing import NotRequired, TypedDict, cast

from .client import AdminClient

# Usage is server-derived and includes provisional, final, and corrected state.
# The system-admin ``/usage`` and ``/usage/export`` surfaces are deliberately not
# exposed here: a tenant client must not depend on system-admin filtering.

# USAGE_DEFAULT_LIMIT is the row cap the service applies when a request omits one.
USAGE_DEFAULT_LIMIT = 500

# USAGE_MAX_LIMIT is the most rows the usage endpoint returns in one request.
USAGE_MAX_LIMIT = 5000

# UsageCompletenessState names how final one usage row is. The server derives it
# and owns its meaning; the SDK surfaces it unchanged.
UsageCompletenessState = str
USAGE_COMPLETENESS_STATES = ("provisional", "final", "corrected", "incomplete")


class UsageRow(TypedDict):
    """One attributed usage quantity for one half-open UTC window."""

    accountCompanySlug: str
    dataSpaceCompanySlug: str
    meterSlug: str
    meterVersion: int
    unit: str
    windowStart: str
    windowEnd: str
    quantity: int
    sourceWatermark: int
    completenessState: UsageCompletenessState
    correctionGeneration: int
    calculationVersion: int


class UsageTotal(TypedDict):
    """A meter total across every row returned for the window."""

    accountCompanySlug: str
    dataSpaceCompanySlug: str
    meterSlug: str
    unit: str
    quantity: int


class UsageReport(TypedDict):
    """Attributed usage for the token's own tenant.

    ``containsProvisional`` and ``containsIncomplete`` are the server's own
    assessment of the returned rows, so a caller deciding whether a number is
    settled reads them rather than assuming every row is final.
    """

    schemaVersion: str
    companySlug: NotRequired[str]
    start: str
    end: str
    rows: list[UsageRow]
    totals: list[UsageTotal]
    sourceWatermark: int
    containsProvisional: bool
    containsIncomplete: bool


class UsageQuery(TypedDict, total=False):
    """Narrows and bounds the usage window.

    Omitting ``start`` and ``end`` uses the service default, the trailing 30 days
    ending now; omitting ``limit`` uses ``USAGE_DEFAULT_LIMIT``.
    """

    meterSlug: str
    # Inclusive RFC3339 UTC window start.
    start: str
    # Exclusive RFC3339 UTC window end.
    end: str
    # Maximum rows, between 1 and USAGE_MAX_LIMIT.
    limit: int


class UsageAdminClient:
    """Reads attributed usage for the authenticated tenant through GET /api/v1/admin/usage/me."""

    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin

    def get(self, query: UsageQuery | None = None) -> UsageReport:
        """Return the attributed usage for the token's own tenant.

        The tenant is derived from the credential, so the caller never supplies
        a company slug.
        """
        return cast(UsageReport, self._admin.request("GET", "/usage/me" + _usage_query_string(query)))


def _usage_query_string(query: UsageQuery | None) -> str:
    """Build the query string and reject locally what the service would reject anyway."""
    if not query:
        return ""

    limit = query.get("limit")
    if limit is not None and (limit < 1 or limit > USAGE_MAX_LIMIT):
        raise ValueError(f"custd: usage limit must be between 1 and {USAGE_MAX_LIMIT}")

    start = query.get("start")
    end = query.get("end")
    start_instant = _parse_instant(start, "start") if start is not None else None
    end_instant = _parse_instant(end, "end") if end is not None else None
    if start_instant is not None and end_instant is not None and start_instant >= end_instant:
        raise ValueError("custd: usage start must be before end")

    params: dict[str, str] = {}
    if end is not None:
        params["end"] = end
    if limit is not None:
        params["limit"] = str(limit)
    meter = query.get("meterSlug")
    if meter is not None:
        params["meter"] = meter
    if start is not None:
        params["start"] = start
    return "?" + urllib.parse.urlencode(params) if params else ""


def _parse_instant(value: str, field: str) -> datetime:
    try:
        parsed = datetime.fromisoformat(value)
    except ValueError as error:
        raise ValueError(f"custd: usage {field} must be an RFC3339 timestamp") from error
    if parsed.tzinfo is None:
        raise ValueError(f"custd: usage {field} must be an RFC3339 timestamp with a UTC offset")
    return parsed
