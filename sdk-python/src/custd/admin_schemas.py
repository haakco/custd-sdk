"""Event-type schema registration on the schema registry.

The routes live on the top-level ``/api/v1/schemas`` surface the schema
registry serves, not under ``/api/v1/admin``, and answer RFC 9457 problems.
A new version of an event type is registered with :meth:`SchemaAdminClient.register`
under the same slug; there is no separate version-create route.
"""

from __future__ import annotations

import json
from typing import Any, NotRequired, TypedDict, cast

from ._wire import decode
from .client import AdminClient, problem_request_error, quote_path

SCHEMAS_PATH = "/schemas"


class SchemaRegisterRequest(TypedDict):
    """Body of POST /api/v1/schemas. ``jsonSchema`` is the schema document as text.

    The server stores ``enabled`` and ``isActive`` literally, so both are required: a
    false value registers a disabled event type or an inactive version.
    """

    slug: str
    name: str
    version: str
    jsonSchema: str
    enabled: bool
    isActive: bool


class SchemaEventType(TypedDict):
    """One tenant event type, as list and register return it."""

    slug: str
    name: str
    enabled: bool


class SchemaEventTypeList(TypedDict):
    """The named GET /api/v1/schemas DTO. The route emits a bare array; the client wraps it."""

    eventTypes: list[SchemaEventType]


class SchemaVersion(TypedDict):
    """One registered version of an event type; ``jsonSchema`` is the stored text."""

    version: str
    jsonSchema: str
    isActive: bool
    enabled: bool


class SchemaVersionList(TypedDict):
    """The named GET /api/v1/schemas/{eventType}/versions DTO, wrapping the bare array."""

    versions: list[SchemaVersion]


class EventSchemaStateResult(TypedDict):
    updated: bool


class EventSchemaCheckRequest(TypedDict):
    slug: str
    name: NotRequired[str]
    version: str
    jsonSchema: str
    examples: NotRequired[list[Any]]


class EventSchemaIssue(TypedDict):
    path: str
    keyword: str
    message: str
    schemaLocation: str
    instanceLocation: str
    severity: str


class EventSchemaExampleResult(TypedDict):
    index: int
    valid: bool
    issueCodes: list[str]
    issues: list[EventSchemaIssue]


class EventSchemaConflict(TypedDict):
    field: str
    message: str


class EventSchemaCheckResult(TypedDict):
    valid: bool
    schemaValid: bool
    issues: list[EventSchemaIssue]
    warnings: list[EventSchemaIssue]
    exampleResults: list[EventSchemaExampleResult]
    normalizedSchema: str
    dialect: str
    checksum: str
    wouldCreateEventType: bool
    wouldCreateVersion: bool
    conflicts: list[EventSchemaConflict]
    validatorEngine: str
    validatorVersion: str
    schemaChecksum: str
    schemaDialect: str


class EventSchemaInferRequest(TypedDict):
    samples: list[Any]


class EventSchemaInferResult(TypedDict):
    valid: bool
    issues: list[EventSchemaIssue]
    inferenceWarnings: list[EventSchemaIssue]
    candidateSchema: str
    validatorEngine: str
    validatorVersion: str
    schemaChecksum: str
    schemaDialect: str


class SchemaAdminClient:
    """Lists, reads and registers the tenant's event-type schemas."""

    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin

    def list(self) -> SchemaEventTypeList:
        """List the tenant's event types."""
        event_types = _list_value(self._request_value("GET", SCHEMAS_PATH))
        return SchemaEventTypeList(eventTypes=cast(list[SchemaEventType], event_types))

    def list_versions(self, event_type: str) -> SchemaVersionList:
        """List every registered version of one event type."""
        path = f"{SCHEMAS_PATH}/{quote_path(event_type)}/versions"
        return SchemaVersionList(versions=cast(list[SchemaVersion], _list_value(self._request_value("GET", path))))

    def get(self, event_type: str, version: str) -> dict[str, Any]:
        """Return one version's JSON Schema document, as stored."""
        path = f"{SCHEMAS_PATH}/{quote_path(event_type)}/{quote_path(version)}"
        value = self._request_value("GET", path)
        if not isinstance(value, dict):
            raise ValueError("custd: schema document must be a JSON object")
        return value

    def register(self, request: SchemaRegisterRequest) -> SchemaEventType:
        """Register an event type's schema version; a new version reuses the slug."""
        value = self._request_value("POST", SCHEMAS_PATH, dict(request))
        if not isinstance(value, dict):
            raise ValueError("custd: schema register response must be a JSON object")
        return cast(SchemaEventType, value)

    def validate(self, request: EventSchemaCheckRequest) -> EventSchemaCheckResult:
        """Check a schema and its examples without registering anything."""
        return decode(EventSchemaCheckResult, self._request_value("POST", f"{SCHEMAS_PATH}/validate", dict(request)))

    def dry_run(self, request: EventSchemaCheckRequest) -> EventSchemaCheckResult:
        """Report what registering the schema would do, without registering it."""
        return decode(EventSchemaCheckResult, self._request_value("POST", f"{SCHEMAS_PATH}/dry-run", dict(request)))

    def infer(self, request: EventSchemaInferRequest) -> EventSchemaInferResult:
        """Propose a schema from sample events."""
        return decode(EventSchemaInferResult, self._request_value("POST", f"{SCHEMAS_PATH}/infer", dict(request)))

    def activate(self, event_type: str, version: str) -> EventSchemaStateResult:
        """Make one version the event type's active schema."""
        return self._state("POST", f"{_version_path(event_type, version)}/active")

    def enable(self, event_type: str, version: str) -> EventSchemaStateResult:
        """Let events validate against one version again."""
        return self._state("PUT", f"{_version_path(event_type, version)}/enabled")

    def disable(self, event_type: str, version: str) -> EventSchemaStateResult:
        """Deprecate one version so new events no longer validate against it."""
        return self._state("DELETE", f"{_version_path(event_type, version)}/enabled")

    def disable_event_type(self, event_type: str) -> EventSchemaStateResult:
        """Retire the tenant's event type; its schemas and stored events stay readable."""
        return self._state("DELETE", f"{SCHEMAS_PATH}/{quote_path(event_type)}")

    def _state(self, method: str, path: str) -> EventSchemaStateResult:
        return decode(EventSchemaStateResult, self._request_value(method, path))

    def _request_value(self, method: str, path: str, payload: dict[str, Any] | None = None) -> Any:
        client = self._admin._client
        url = client.base_url + "/api/v1" + path
        result = self._admin._transport(method, url, payload, client._headers(), client.timeout)
        status = int(result["status"])
        body = result.get("body")
        if status >= 400:
            raise problem_request_error(status, body, "schema")
        if status == 204 or body in (None, ""):
            return None
        return json.loads(body) if isinstance(body, str) else body


def _list_value(value: Any) -> list[Any]:
    """Unwrap a bare-array response; a null list decodes as empty."""
    if value is None:
        return []
    if not isinstance(value, list):
        raise ValueError("custd: schema list response must be a JSON array")
    return value


def _version_path(event_type: str, version: str) -> str:
    return f"{SCHEMAS_PATH}/{quote_path(event_type)}/{quote_path(version)}"
