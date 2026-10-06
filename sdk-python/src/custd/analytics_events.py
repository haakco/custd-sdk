from __future__ import annotations

import json
from datetime import date
from typing import Any, NotRequired, TypedDict, cast

from .client import AdminTransport, CustdClient, RequestError

ANALYTICS_QUERY_PATH = "/analytics/query"
ANALYTICS_QUERY_RANGE_PATH = "/analytics/query-range"

# MaxAnalyticsLabelFilters is the most label filters the service accepts on one query.
MAX_ANALYTICS_LABEL_FILTERS = 4

# ANALYTICS_MAX_RANGE_DAYS is the longest inclusive range the service accepts. A longer
# request is rejected locally rather than spending a round trip on a 400.
ANALYTICS_MAX_RANGE_DAYS = 120

# ANALYTICS_RANGE_GROUP_BY is the only bucket granularity the service supports today.
ANALYTICS_RANGE_GROUP_BY = "day"

ANALYTICS_QUERY_SOURCES = ("auto", "postgres", "duckdb", "rollup", "materialized")


class AnalyticsLabelFilter(TypedDict):
    """One exact tenant-vocabulary key/value filter."""

    key: str
    value: str


class AnalyticsEventQueryRequest(TypedDict):
    """The public query body.

    The service also accepts an internal ``anonymousId`` exact-subject predicate and a
    ``countOnly`` flag, but both are absent from its public JSON contract. They are
    therefore not representable here, which keeps them off the wire by construction.
    """

    # date is the UTC day to query, formatted YYYY-MM-DD. The service requires it.
    date: str
    eventType: NotRequired[str]
    limit: NotRequired[int]
    source: NotRequired[str]
    labelFilters: NotRequired[list[AnalyticsLabelFilter]]


class AnalyticsEventSourceSummary(TypedDict, total=False):
    """One source's contribution to a query.

    ``complete`` and ``fresh`` are the server's own assessment of whether that source
    answered the whole request and whether its data sat inside the freshness window. They
    are the authority for how far a result may be trusted; the SDK must not substitute its
    own heuristic.
    """

    name: str
    count: int
    parquetUriCount: int
    complete: bool
    fresh: bool
    queryDurationMs: int
    freshnessLagMs: int
    message: str


class AnalyticsEventTiming(TypedDict, total=False):
    """Server-measured lag and coverage for a query."""

    eventLagP50Ms: int
    eventLagP95Ms: int
    eventLagMaxMs: int
    queryDurationMs: int
    oldestEventTimestamp: str
    newestEventTimestamp: str
    snapshotAgeMs: int


class AnalyticsEventQueryResponse(TypedDict):
    """The query result, surfaced verbatim.

    ``results`` entries are column bags taken from the underlying parquet schema rather
    than a fixed shape, so each row is surfaced as a plain mapping and new columns appear
    without an SDK change.
    """

    results: list[dict[str, Any]]
    count: int
    sources: list[AnalyticsEventSourceSummary]
    timing: AnalyticsEventTiming


# The range request carries a wire field named ``from``, which is a Python keyword, so the
# TypedDict is declared functionally to keep the wire name rather than an aliased key.
AnalyticsEventRangeQueryRequest = TypedDict(
    "AnalyticsEventRangeQueryRequest",
    {
        "from": str,
        "to": str,
        "eventType": NotRequired[str],
        "limit": NotRequired[int],
        "source": NotRequired[str],
        "groupBy": NotRequired[str],
        "labelFilters": NotRequired[list[AnalyticsLabelFilter]],
    },
)


class AnalyticsEventRangeBucket(TypedDict, total=False):
    """One day's coverage inside a range query.

    ``complete`` is the server's own assessment of whether that day's source answered the
    whole request, so it is surfaced unchanged; the SDK must not substitute its own
    heuristic.
    """

    date: str
    count: int
    source: str
    complete: bool
    queryDurationMs: int
    parquetUriCount: int
    message: str


class AnalyticsEventRangeQueryResponse(TypedDict):
    """The range query result, surfaced verbatim."""

    rows: list[dict[str, Any]]
    count: int
    buckets: list[AnalyticsEventRangeBucket]
    sources: list[AnalyticsEventSourceSummary]
    timing: AnalyticsEventTiming


class AnalyticsEventClient:
    """Query this tenant's own events.

    The endpoint reads a tenant's own ingested events, including payloads, behind the
    dedicated ``events.read`` scope. Effective-tenant authority is enforced server-side,
    so the caller never supplies a tenant slug.
    """

    def __init__(self, client: CustdClient, transport: AdminTransport) -> None:
        self._client = client
        self._transport = transport

    def query(self, request: AnalyticsEventQueryRequest) -> AnalyticsEventQueryResponse:
        payload = _public_query_payload(request)
        return cast(AnalyticsEventQueryResponse, self._request("POST", ANALYTICS_QUERY_PATH, payload))

    def query_range(self, request: AnalyticsEventRangeQueryRequest) -> AnalyticsEventRangeQueryResponse:
        """Query this tenant's own events across an inclusive date range."""
        payload = _public_range_query_payload(request)
        return cast(AnalyticsEventRangeQueryResponse, self._request("POST", ANALYTICS_QUERY_RANGE_PATH, payload))

    def _request(self, method: str, path: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
        try:
            result = self._transport(
                method,
                self._client.base_url + "/api/v1" + path,
                payload,
                self._client._headers(),
                self._client.timeout,
            )
        except RequestError:
            raise
        except Exception as error:
            raise RequestError(
                "custd: analytics transport unavailable",
                code="transport_unavailable",
                retryability="bounded",
            ) from error

        status = int(result["status"])
        body = result.get("body")
        if status >= 400:
            raise _analytics_request_error(status, body)
        if status == 204 or body in (None, ""):
            return {}
        if isinstance(body, str):
            decoded = json.loads(body)
            if not isinstance(decoded, dict):
                raise ValueError("custd: analytics response must be an object")
            return decoded
        if isinstance(body, dict):
            return body
        raise ValueError("custd: analytics response must be an object")


def _analytics_request_error(status: int, body: object) -> RequestError:
    """Translate an RFC 9457 problem+json body into a RequestError.

    The tenant API reports `detail`, `code`, `retryability`, and `nextAction`, which is a
    different problem shape from the admin API's `error`/`safe_next_action`, so this does
    not share admin_request_error.
    """
    try:
        problem = json.loads(body) if isinstance(body, str) else body
    except json.JSONDecodeError:
        problem = None
    payload = problem if isinstance(problem, dict) else {}
    retryability = payload.get("retryability")
    detail = payload.get("detail")
    code = payload.get("code")
    next_action = payload.get("nextAction")
    return RequestError(
        detail if isinstance(detail, str) and detail else f"custd: analytics request failed with status {status}",
        status=status,
        code=code if isinstance(code, str) and code else None,
        retryability=(
            retryability
            if isinstance(retryability, str) and retryability in ("none", "bounded")
            else ("bounded" if status == 429 or status >= 500 else "none")
        ),
        next_action=next_action if isinstance(next_action, dict) else None,
    )


def _public_query_payload(request: AnalyticsEventQueryRequest) -> dict[str, Any]:
    """Serialise only the documented public fields.

    Rebuilding the body from named keys, rather than forwarding the caller's mapping,
    means an internal field the service would ignore or honour cannot be smuggled onto
    the wire by a caller passing extra properties.
    """
    date = request.get("date")
    if not isinstance(date, str) or date == "":
        raise ValueError("custd: analytics query requires a date (YYYY-MM-DD)")

    filters = request.get("labelFilters") or []
    if len(filters) > MAX_ANALYTICS_LABEL_FILTERS:
        raise ValueError(
            f"custd: analytics query accepts at most {MAX_ANALYTICS_LABEL_FILTERS} label filters, "
            f"received {len(filters)}"
        )

    payload: dict[str, Any] = {"date": date}
    if request.get("eventType") is not None:
        payload["eventType"] = request["eventType"]
    if request.get("limit") is not None:
        payload["limit"] = request["limit"]
    source = request.get("source")
    if source is not None:
        if source not in ANALYTICS_QUERY_SOURCES:
            raise ValueError(f"custd: analytics source must be one of {', '.join(ANALYTICS_QUERY_SOURCES)}")
        payload["source"] = source
    if filters:
        payload["labelFilters"] = filters
    return payload


def _public_range_query_payload(request: AnalyticsEventRangeQueryRequest) -> dict[str, Any]:
    """Serialise only the documented public range fields.

    As with the single-day payload, rebuilding the body from named keys keeps the internal
    ``anonymousId`` predicate and ``countOnly`` flag off the wire by construction.
    """
    from_value = request.get("from")
    to_value = request.get("to")
    if not isinstance(from_value, str) or not isinstance(to_value, str) or from_value == "" or to_value == "":
        raise ValueError("custd: analytics range query requires from and to (YYYY-MM-DD)")

    start_day = _parse_utc_day(from_value, "from")
    end_day = _parse_utc_day(to_value, "to")
    if end_day < start_day:
        raise ValueError("custd: analytics range query to must not be before from")
    days = (end_day - start_day).days + 1
    if days > ANALYTICS_MAX_RANGE_DAYS:
        raise ValueError(
            f"custd: analytics range query spans {days} days, the maximum is {ANALYTICS_MAX_RANGE_DAYS}"
        )

    group_by = request.get("groupBy")
    if group_by is not None and group_by != ANALYTICS_RANGE_GROUP_BY:
        raise ValueError(f"custd: analytics range query groupBy must be {ANALYTICS_RANGE_GROUP_BY!r}")

    filters = request.get("labelFilters") or []
    if len(filters) > MAX_ANALYTICS_LABEL_FILTERS:
        raise ValueError(
            f"custd: analytics range query accepts at most {MAX_ANALYTICS_LABEL_FILTERS} label filters, "
            f"received {len(filters)}"
        )

    payload: dict[str, Any] = {"from": from_value, "to": to_value}
    if request.get("eventType") is not None:
        payload["eventType"] = request["eventType"]
    if request.get("limit") is not None:
        payload["limit"] = request["limit"]
    source = request.get("source")
    if source is not None:
        if source not in ANALYTICS_QUERY_SOURCES:
            raise ValueError(f"custd: analytics source must be one of {', '.join(ANALYTICS_QUERY_SOURCES)}")
        payload["source"] = source
    if group_by is not None:
        payload["groupBy"] = group_by
    if filters:
        payload["labelFilters"] = filters
    return payload


def _parse_utc_day(value: str, field: str) -> date:
    try:
        return date.fromisoformat(value)
    except ValueError as error:
        raise ValueError(f"custd: analytics range query {field} must be YYYY-MM-DD") from error
