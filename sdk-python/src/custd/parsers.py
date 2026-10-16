"""Parser catalogue, tenant-owned CRUD and bounded dry-run preview.

These routes are served by the schema registry behind the caller's tenant
credential, so no tenant slug is ever supplied. Every method returns a named
typed DTO; the parser collection route emits a bare JSON array on the wire and
the client wraps it in :class:`ParserListResponse`.
"""

from __future__ import annotations

import json
from typing import Any, NotRequired, TypedDict, cast

from .analytics_events import _analytics_request_error
from .client import AdminTransport, CustdClient, RequestError, quote_path

PARSER_PATH = "/parsers"
PARSER_PRESETS_PATH = "/parsers/presets"
PARSER_PREVIEW_PATH = "/parser-preview"

# PARSER_TYPES are the parser families the ingestion dispatcher can execute.
PARSER_TYPES = ("regex", "json", "xml", "csv", "syslog")

# PARSER_FRAMING_TYPES are the stateless batch-framing modes applied before the
# application parser runs.
PARSER_FRAMING_TYPES = ("none", "docker-json", "k8s-cri", "php-multiline")

# Framing bounds. A caller may request a lower cap; these ceilings are hard
# engine limits a request cannot raise. Zero bounds select the defaults. They
# mirror libs/go/logpresets, the shared declaration-and-validation authority.
DEFAULT_PARSER_FRAMING_MAX_RECORD_BYTES = 64 << 10
DEFAULT_PARSER_FRAMING_MAX_LINES = 32
MAX_PARSER_FRAMING_RECORD_BYTES = 1 << 20
MAX_PARSER_FRAMING_LINES = 256

# PARSER_FRAMING_OUTCOMES are the visible per-record results of one framing pass.
PARSER_FRAMING_OUTCOMES = ("complete", "malformed", "incomplete", "oversize")


class ParserFraming(TypedDict):
    """Stateless framing configuration carried by a parser definition.

    Framing is revision-pinned with the parser and is the same configuration for
    preview and save. Multiline assembly is bounded by ``maxRecordBytes`` and
    ``maxLines``; there is deliberately no idle timeout on stateless batch
    framing.
    """

    type: str
    maxRecordBytes: NotRequired[int]
    maxLines: NotRequired[int]


class ParserGeneratedFieldConfig(TypedDict):
    """How a generated field is computed from source fields."""

    fields: list[str]
    namespace: str


class ParserDefinition(TypedDict):
    """A tenant-owned parser."""

    uuid: str
    code: str
    name: str
    parserType: str
    pattern: str | None
    timestampFormat: str
    fieldMapping: dict[str, str]
    generatedFields: NotRequired[dict[str, ParserGeneratedFieldConfig] | None]
    # Stateless framing configuration, revision-pinned with the parser.
    framing: NotRequired[ParserFraming]
    # Newer server fields. Both are optional so a response from a server that
    # predates them still decodes; when present they carry the server's value.
    enabled: NotRequired[bool]
    revision: NotRequired[int]


class ParserListResponse(TypedDict):
    """The named parser-collection DTO.

    The route emits a bare JSON array; the client wraps it so callers never
    handle an untyped list.
    """

    parsers: list[ParserDefinition]


class ParserPreset(TypedDict):
    """One built-in reusable parser definition from the published catalog."""

    code: str
    name: str
    family: str
    description: str
    parserType: str
    pattern: str
    timestampFormat: str
    fieldMapping: dict[str, str]
    sample: str
    variants: list[str]


class ParserPresetListResponse(TypedDict):
    """The named preset-catalog DTO for GET /parsers/presets."""

    presets: list[ParserPreset]


class ParserSaveRequest(TypedDict):
    """The create/update body for a tenant-owned parser.

    ``enabled`` is optional: leaving it unset omits the field so the server
    keeps its default (an enabled parser), which also keeps the body valid
    against a server that does not yet accept the field.
    """

    code: str
    name: str
    parserType: str
    pattern: str | None
    timestampFormat: str
    fieldMapping: dict[str, str]
    # Stateless framing configuration, the same for save and preview.
    framing: NotRequired[ParserFraming]
    enabled: NotRequired[bool]


class ParserPreviewDefinition(TypedDict):
    """The parser shape a preview executes.

    It mirrors the saved definition minus the server-assigned uuid and the
    newer-only enabled/revision fields, because the preview route decodes
    strictly.
    """

    code: str
    name: str
    parserType: str
    pattern: str | None
    timestampFormat: str
    fieldMapping: dict[str, str]
    # The same framing configuration a save would carry.
    framing: NotRequired[ParserFraming]


class ParserPreviewRequest(TypedDict):
    """The dry-run body. The service bounds the sample to 256 KiB and maxLines to 100."""

    parser: ParserPreviewDefinition
    sample: str
    maxLines: int


class ParserPreviewRow(TypedDict, total=False):
    """One sample line's result. ``line`` is 1-based in the original sample.

    ``framing`` is the source-framing outcome and is populated only for a
    non-none framing mode.
    """

    line: int
    ok: bool
    framing: str
    eventTypeSlug: str
    timestamp: str
    context: dict[str, Any]
    payload: dict[str, Any]
    error: str


class ParserPreviewResponse(TypedDict):
    """The dry-run result. ``parsed`` and ``failed`` summarize ``results``."""

    results: list[ParserPreviewRow]
    parsed: int
    failed: int


class ParserDeleteResponse(TypedDict):
    """The body of a successful parser deletion."""

    deleted: bool


class ParserClient:
    """The tenant parser routes: preset catalog, CRUD collection and preview."""

    def __init__(self, client: CustdClient, transport: AdminTransport) -> None:
        self._client = client
        self._transport = transport

    def list_presets(self) -> ParserPresetListResponse:
        """List the built-in reusable parser catalog."""
        return cast(ParserPresetListResponse, self._request("GET", PARSER_PRESETS_PATH))

    def list(self) -> ParserListResponse:
        """List this tenant's own parsers, wrapped in the named DTO."""
        value = self._request_value("GET", PARSER_PATH)
        if not isinstance(value, list):
            raise ValueError("custd: parser list response must be a JSON array")
        return ParserListResponse(parsers=cast(list[ParserDefinition], value))

    def create(self, request: ParserSaveRequest) -> ParserDefinition:
        """Create a tenant-owned parser."""
        return cast(ParserDefinition, self._request("POST", PARSER_PATH, _save_payload(request)))

    def update(self, parser_uuid: str, request: ParserSaveRequest) -> ParserDefinition:
        """Replace a tenant-owned parser addressed by its explicit UUID."""
        return cast(
            ParserDefinition,
            self._request("PUT", f"{PARSER_PATH}/{quote_path(parser_uuid)}", _save_payload(request)),
        )

    def delete(self, parser_uuid: str) -> ParserDeleteResponse:
        """Delete a tenant-owned parser addressed by its explicit UUID."""
        return cast(
            ParserDeleteResponse,
            self._request("DELETE", f"{PARSER_PATH}/{quote_path(parser_uuid)}"),
        )

    def preview(self, request: ParserPreviewRequest) -> ParserPreviewResponse:
        """Run a parser definition against a bounded sample. Writes and retains nothing."""
        return cast(ParserPreviewResponse, self._request("POST", PARSER_PREVIEW_PATH, _preview_payload(request)))

    def _request(self, method: str, path: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
        value = self._request_value(method, path, payload)
        if isinstance(value, str):
            decoded = json.loads(value)
            if not isinstance(decoded, dict):
                raise ValueError("custd: parser response must be an object")
            return decoded
        if isinstance(value, dict):
            return value
        raise ValueError("custd: parser response must be an object")

    def _request_value(self, method: str, path: str, payload: dict[str, Any] | None = None) -> Any:
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
                "custd: parser transport unavailable",
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
            return json.loads(body)
        return body


def _save_payload(request: ParserSaveRequest) -> dict[str, Any]:
    """Rebuild the create/update body from the documented fields.

    An unset ``enabled`` is omitted rather than sent as ``None``; extra caller
    properties are kept off the wire by construction.
    """
    payload: dict[str, Any] = {
        "code": request["code"],
        "name": request["name"],
        "parserType": request["parserType"],
        "pattern": request["pattern"],
        "timestampFormat": request["timestampFormat"],
        "fieldMapping": request["fieldMapping"],
    }
    enabled = request.get("enabled")
    if enabled is not None:
        payload["enabled"] = enabled
    framing = request.get("framing")
    if framing is not None:
        payload["framing"] = _framing_payload(framing)
    return payload


def _preview_payload(request: ParserPreviewRequest) -> dict[str, Any]:
    """Project the previewed definition onto the strictly-decoded preview shape.

    ``framing`` is carried because preview and save share one configuration; the
    create/update-only field such as ``enabled`` cannot reach the parser object
    the route rejects unknown fields against.
    """
    definition = request["parser"]
    parser: dict[str, Any] = {
        "code": definition["code"],
        "name": definition["name"],
        "parserType": definition["parserType"],
        "pattern": definition["pattern"],
        "timestampFormat": definition["timestampFormat"],
        "fieldMapping": definition["fieldMapping"],
    }
    framing = definition.get("framing")
    if framing is not None:
        parser["framing"] = _framing_payload(framing)
    return {
        "parser": parser,
        "sample": request["sample"],
        "maxLines": request["maxLines"],
    }


def _framing_payload(framing: ParserFraming) -> dict[str, Any]:
    """Validate the framing declaration and rebuild only the documented keys.

    A bound outside 0..hard ceiling is rejected before any request, mirroring the
    canonical server validation; zero selects the default.
    """
    if framing["type"] not in PARSER_FRAMING_TYPES:
        raise ValueError(f"custd: parser framing type must be one of {', '.join(PARSER_FRAMING_TYPES)}")
    max_record_bytes = framing.get("maxRecordBytes")
    if max_record_bytes is not None and not (0 <= max_record_bytes <= MAX_PARSER_FRAMING_RECORD_BYTES):
        raise ValueError(
            f"custd: parser framing maxRecordBytes must be 0..{MAX_PARSER_FRAMING_RECORD_BYTES}"
        )
    max_lines = framing.get("maxLines")
    if max_lines is not None and not (0 <= max_lines <= MAX_PARSER_FRAMING_LINES):
        raise ValueError(f"custd: parser framing maxLines must be 0..{MAX_PARSER_FRAMING_LINES}")
    payload: dict[str, Any] = {"type": framing["type"]}
    if max_record_bytes is not None:
        payload["maxRecordBytes"] = max_record_bytes
    if max_lines is not None:
        payload["maxLines"] = max_lines
    return payload
