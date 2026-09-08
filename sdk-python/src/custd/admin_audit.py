from __future__ import annotations

from collections.abc import Mapping
from typing import Literal, NotRequired, TypedDict, cast
from urllib.parse import urlencode

from .client import AdminClient, ValidationError, quote_path, validate_uuid

AuditScope = Literal["tenant", "global"]
AuditOutcome = Literal["attempted", "success", "failure", "denied", "pending", "unknown"]
AuditDisclosureState = Literal["available", "redacted", "not_recorded"]


class AuditChange(TypedDict, total=False):
    field: str
    before: object
    after: object


class AuditNetworkDisclosure(TypedDict, total=False):
    ipAddress: str
    ipAddressState: AuditDisclosureState
    userAgent: str
    userAgentState: AuditDisclosureState


class AuditRetentionDisclosure(TypedDict):
    eventMaxAgeSeconds: int
    ipAddressMaxAgeSeconds: int
    userAgentMaxAgeSeconds: int


class AuditEvent(TypedDict, total=False):
    # Stable public audit event UUID.
    eventId: str
    tenantSlug: str
    actorKind: str
    actorReference: str
    actorDisplayName: str
    actorRoles: list[str]
    action: str
    resourceType: str
    resourceId: str
    outcome: AuditOutcome
    correlationId: str
    operationId: str
    changes: list[AuditChange]
    details: dict[str, object]
    network: AuditNetworkDisclosure
    createdAt: str


class AuditListOptions(TypedDict, total=False):
    scope: AuditScope
    companySlug: str
    affectedTenantSlug: str
    since: str
    until: str
    actorKind: str
    actorReference: str
    action: str
    resourceType: str
    resourceId: str
    outcome: AuditOutcome
    correlationId: str
    limit: int
    cursor: str


class AuditListResponse(TypedDict):
    events: list[AuditEvent]
    nextCursor: dict[str, str]
    coverageBeginsAt: NotRequired[str]
    retention: NotRequired[AuditRetentionDisclosure]


class AuditExportResponse(TypedDict):
    body: bytes
    headers: dict[str, str]


class ReportingPackAuditEvent(TypedDict, total=False):
    action: str
    actorReference: str
    actorDisplayName: str
    resourceType: str
    resourceId: str
    packKey: str
    createdAt: str


class ReportingPackAuditListResponse(TypedDict):
    events: list[ReportingPackAuditEvent]


_AUDIT_QUERY_KEYS = (
    "scope",
    "companySlug",
    "affectedTenantSlug",
    "since",
    "until",
    "actorKind",
    "actorReference",
    "action",
    "resourceType",
    "resourceId",
    "outcome",
    "correlationId",
    "limit",
    "cursor",
)
_AUDIT_EXPORT_QUERY_KEYS = _AUDIT_QUERY_KEYS[:-2]


def _query(options: Mapping[str, object] | None, keys: tuple[str, ...] = _AUDIT_QUERY_KEYS) -> str:
    if not options:
        return ""
    values = [
        (key, str(options[key]))
        for key in keys
        if key in options and options[key] not in (None, "")
    ]
    return "?" + urlencode(values) if values else ""


def _lookup_query(options: AuditListOptions | None) -> str:
    if not options:
        return ""
    values_options: Mapping[str, object] = options
    values = [
        (key, str(values_options[key]))
        for key in ("scope", "companySlug")
        if key in values_options and values_options[key] not in (None, "")
    ]
    return "?" + urlencode(values) if values else ""


def _safe_event(value: object) -> AuditEvent:
    if not isinstance(value, Mapping):
        raise ValueError("custd: audit event response must be an object")
    event_id = value.get("eventId")
    if not isinstance(event_id, str):
        raise ValueError("custd: audit event response eventId must be a UUID")
    try:
        validate_uuid(event_id, "audit event eventId")
    except ValidationError:
        raise ValueError("custd: audit event response eventId must be a UUID") from None
    event: dict[str, object] = {}
    for key in (
        "eventId", "tenantSlug", "actorKind", "actorReference", "actorDisplayName", "action", "resourceType",
        "resourceId", "outcome", "correlationId", "operationId", "createdAt",
    ):
        if key in value:
            event[key] = value[key]
    actor_roles = value.get("actorRoles")
    if isinstance(actor_roles, list):
        event["actorRoles"] = [role for role in actor_roles if isinstance(role, str)]
    changes = value.get("changes")
    if isinstance(changes, list):
        safe_changes: list[AuditChange] = []
        for change in changes:
            if not isinstance(change, Mapping) or not isinstance(change.get("field"), str):
                continue
            safe_change: AuditChange = {"field": change["field"]}
            if "before" in change:
                safe_change["before"] = change["before"]
            if "after" in change:
                safe_change["after"] = change["after"]
            safe_changes.append(safe_change)
        event["changes"] = safe_changes
    details = value.get("details")
    if isinstance(details, Mapping):
        event["details"] = dict(details)
    network = value.get("network")
    if isinstance(network, Mapping):
        ip_state = network.get("ipAddressState")
        ua_state = network.get("userAgentState")
        if ip_state in ("available", "redacted", "not_recorded") and ua_state in (
            "available", "redacted", "not_recorded"
        ):
            safe_network: AuditNetworkDisclosure = {
                "ipAddressState": cast(AuditDisclosureState, ip_state),
                "userAgentState": cast(AuditDisclosureState, ua_state),
            }
            if isinstance(network.get("ipAddress"), str):
                safe_network["ipAddress"] = network["ipAddress"]
            if isinstance(network.get("userAgent"), str):
                safe_network["userAgent"] = network["userAgent"]
            event["network"] = safe_network
    return cast(AuditEvent, event)


def _safe_retention(value: object) -> AuditRetentionDisclosure | None:
    if not isinstance(value, Mapping):
        return None
    keys = ("eventMaxAgeSeconds", "ipAddressMaxAgeSeconds", "userAgentMaxAgeSeconds")
    if not all(type(value.get(key)) is int for key in keys):
        return None
    return {
        "eventMaxAgeSeconds": cast(int, value["eventMaxAgeSeconds"]),
        "ipAddressMaxAgeSeconds": cast(int, value["ipAddressMaxAgeSeconds"]),
        "userAgentMaxAgeSeconds": cast(int, value["userAgentMaxAgeSeconds"]),
    }


class AuditAdminClient:
    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin

    def list_events(self, options: AuditListOptions | None = None) -> AuditListResponse:
        response = self._admin.request("GET", "/audit/events" + _query(options))
        events = response.get("events")
        if not isinstance(events, list):
            raise ValueError("custd: audit list response events must be an array")
        cursor = response.get("nextCursor")
        if not isinstance(cursor, Mapping):
            cursor = {"cursor": ""}
        retention = _safe_retention(response.get("retention"))
        result: AuditListResponse = {
            "events": [_safe_event(event) for event in events],
            "nextCursor": {"cursor": str(cursor.get("cursor", ""))},
        }
        if isinstance(response.get("coverageBeginsAt"), str):
            result["coverageBeginsAt"] = response["coverageBeginsAt"]
        if retention is not None:
            result["retention"] = retention
        return result

    def get_event(self, event_id: str, options: AuditListOptions | None = None) -> AuditEvent:
        response = self._admin.request("GET", f"/audit/events/{quote_path(event_id)}{_lookup_query(options)}")
        return _safe_event(response)

    def export_events(
        self, options: AuditListOptions | None = None, format: Literal["csv", "json"] = "json"
    ) -> AuditExportResponse:
        if format not in ("csv", "json"):
            raise ValueError("custd: audit export format must be csv or json")
        query = _query(options, _AUDIT_EXPORT_QUERY_KEYS)
        separator = "&" if query else "?"
        body, headers = self._admin.request_binary("GET", f"/audit/events/export{query}{separator}format={format}")
        return {"body": body, "headers": headers}

    def list_reporting_pack_events(self, pack_key: str) -> ReportingPackAuditListResponse:
        response = self._admin.request(
            "GET", "/reporting-packs/audit-events?" + urlencode({"packKey": pack_key})
        )
        events = response.get("events")
        if not isinstance(events, list):
            raise ValueError("custd: reporting-pack audit list response events must be an array")
        safe_events: list[ReportingPackAuditEvent] = []
        for event in events:
            if not isinstance(event, Mapping):
                raise ValueError("custd: reporting-pack audit event response must be an object")
            safe_events.append(cast(ReportingPackAuditEvent, {key: event[key] for key in (
                "action", "actorReference", "actorDisplayName", "resourceType", "resourceId", "packKey", "createdAt"
            ) if key in event}))
        return {"events": safe_events}
