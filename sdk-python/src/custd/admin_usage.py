from __future__ import annotations

import re
import urllib.parse
from collections.abc import Mapping
from datetime import datetime
from typing import Any, NotRequired, TypedDict, cast

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

# _RFC3339_PATTERN is the documented wire grammar for the usage window: a full
# timestamp with the T separator and an explicit Z or numeric offset. Matching it
# before parsing rejects values Python's parser is lenient about, such as a
# space-separated timestamp or a date-only string.
_RFC3339_PATTERN = re.compile(
    r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$"
)


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
        return _validate_usage_report(self._admin.request("GET", "/usage/me" + _usage_query_string(query)))


def _validate_usage_report(value: object) -> UsageReport:
    """Validate the named usage response DTO.

    The service always emits every required field, so a malformed success body
    (an empty body, a partial object, or a wrongly shaped collection) fails here
    instead of surfacing as a zero-valued report. ``companySlug`` is the only
    optional wire field and is omitted, never null, when the tenant has none.
    """
    if not isinstance(value, Mapping):
        raise ValueError("custd: usage response must be a JSON object")
    payload = cast(dict[str, Any], value)
    _require_string(payload, "schemaVersion")
    _require_string(payload, "start")
    _require_string(payload, "end")
    _require_integer(payload, "sourceWatermark")
    _require_boolean(payload, "containsProvisional")
    _require_boolean(payload, "containsIncomplete")
    # companySlug is omitted-or-string: absence is valid, but a present null is
    # not a string and must not be retained on the report.
    if "companySlug" in payload and not isinstance(payload["companySlug"], str):
        raise ValueError("custd: usage response field companySlug must be a string")
    for index, row in enumerate(_require_objects(payload, "rows")):
        _require_string(row, "accountCompanySlug", f"rows[{index}]")
        _require_string(row, "dataSpaceCompanySlug", f"rows[{index}]")
        _require_string(row, "meterSlug", f"rows[{index}]")
        _require_integer(row, "meterVersion", f"rows[{index}]")
        _require_string(row, "unit", f"rows[{index}]")
        _require_string(row, "windowStart", f"rows[{index}]")
        _require_string(row, "windowEnd", f"rows[{index}]")
        _require_integer(row, "quantity", f"rows[{index}]")
        _require_integer(row, "sourceWatermark", f"rows[{index}]")
        _require_string(row, "completenessState", f"rows[{index}]")
        _require_integer(row, "correctionGeneration", f"rows[{index}]")
        _require_integer(row, "calculationVersion", f"rows[{index}]")
    for index, total in enumerate(_require_objects(payload, "totals")):
        _require_string(total, "accountCompanySlug", f"totals[{index}]")
        _require_string(total, "dataSpaceCompanySlug", f"totals[{index}]")
        _require_string(total, "meterSlug", f"totals[{index}]")
        _require_string(total, "unit", f"totals[{index}]")
        _require_integer(total, "quantity", f"totals[{index}]")
    return cast(UsageReport, payload)


def _require(payload: Mapping[str, Any], key: str, context: str) -> Any:
    if key not in payload or payload[key] is None:
        raise ValueError(f"custd: usage response {context} field {key} is required")
    return payload[key]


def _require_string(payload: Mapping[str, Any], key: str, context: str = "") -> str:
    value = _require(payload, key, context)
    if not isinstance(value, str):
        raise ValueError(f"custd: usage response {context} field {key} must be a string")
    return value


def _require_integer(payload: Mapping[str, Any], key: str, context: str = "") -> int:
    value = _require(payload, key, context)
    if isinstance(value, bool) or not isinstance(value, int):
        raise ValueError(f"custd: usage response {context} field {key} must be an integer")
    return value


def _require_boolean(payload: Mapping[str, Any], key: str, context: str = "") -> bool:
    value = _require(payload, key, context)
    if not isinstance(value, bool):
        raise ValueError(f"custd: usage response {context} field {key} must be a boolean")
    return value


def _require_objects(payload: Mapping[str, Any], key: str) -> list[Mapping[str, Any]]:
    value = _require(payload, key, "")
    if not isinstance(value, list):
        raise ValueError(f"custd: usage response field {key} must be a list")
    objects: list[Mapping[str, Any]] = []
    for item in value:
        if not isinstance(item, Mapping):
            raise ValueError(f"custd: usage response field {key} must contain objects")
        objects.append(item)
    return objects


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
    if _RFC3339_PATTERN.match(value) is None:
        raise ValueError(f"custd: usage {field} must be an RFC3339 timestamp")
    try:
        # The pattern already requires the T separator and an explicit offset, so
        # fromisoformat here only rejects an impossible calendar date.
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as error:
        raise ValueError(f"custd: usage {field} must be an RFC3339 timestamp") from error
    if parsed.tzinfo is None:
        raise ValueError(f"custd: usage {field} must be an RFC3339 timestamp with a UTC offset")
    return parsed
