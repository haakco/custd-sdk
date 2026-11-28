import base64
import gzip
import hashlib
import json
import os
import random
import re
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
from collections.abc import Callable, Iterator, Mapping
from contextlib import contextmanager
from contextvars import ContextVar
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import TYPE_CHECKING, Any, Literal, NotRequired, Protocol, TypedDict, TypeVar, cast

from .reporting_types import (
    PreparedDataNextAction,
    PreparedDataProvenance,
    PreparedDataWarning,
    RenderedEmailDelivery,
    RenderedLabelMetadata,
    RenderedMetricTrust,
    RenderedUnit,
    ReportExportJob,
    ReportingComparison,
    ReportingExportFormat,
    ReportingRetryability,
)
from .version import IDENTITY

if TYPE_CHECKING:
    from .admin_oauth_admissions import (
        OAuthClient,
        OAuthClientListResponse,
        OAuthClientSecretResponse,
        OAuthClientUpdateScopesRequest,
    )
    from .admin_operations import (
        AdminSite,
        AdminSiteCreateRequest,
        AdminSiteCreateResponse,
        AdminSiteListResponse,
        AdminSiteUpdate,
        AdminSiteWriteKey,
        DashboardDefinition,
        PublicSiteConfig,
    )
    from .analytics_reads import (
        PreparedDataBootstrapStatus,
        PreparedDataBootstrapSubmitRequest,
        ReportingDashboardCatalogueResponse,
        ReportingDashboardGenerationRequest,
        ReportingDashboardGenerationResponse,
        ReportingDraftPreviewRequest,
    )
    from .ingest_operations import Account


OffboardingState = Literal[
    "preview",
    "requested",
    "exporting",
    "exported",
    "confirming",
    "confirmed",
    "waiver_requested",
    "waiver_approved",
    "fencing",
    "revoking",
    "deleting",
    "complete",
    "failed",
    "cancelled",
]
PreparedDataAvailability = Literal["complete", "partial", "stale", "unavailable"]
PreparedDataState = Literal["accepted", "processing", "ready", "failed"]
ProducerReservationStatus = Literal["pending", "claimed", "released", "expired"]
RenderedVisualKind = Literal["lifecycle", "cohort", "distribution", "uncertainty", "anomaly_driver"]
ReportingDataFreshness = Literal["unknown", "current", "fresh", "stale", "unavailable"]
ReportingDataSufficiency = Literal["unknown", "sufficient", "partial", "insufficient"]
ReportingTrustStatus = Literal["healthy", "partial", "unavailable", "unknown"]
TenantPurpose = Literal["customer", "generated_proof"]


INGEST_ENDPOINT = "/api/v1/events"
INGEST_BATCH_ENDPOINT = "/api/v1/events/batch"
RAW_INGEST_ENDPOINT = "/api/v1/raw"
DEFAULT_RETRY_STATUSES = (408, 429, 500, 502, 503, 504)
DEFAULT_COMPRESSION_THRESHOLD_BYTES = 1024
EVENT_LABEL_KEY_PATTERN = re.compile(r"^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$")
RAW_PARSER_UUID_PATTERN = re.compile(
    r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
)

EventEnvelope = dict[str, Any]
# TransportBody is what a transport may be asked to send: a JSON event, or the
# verbatim bytes of one raw, line-delimited upload.
TransportBody = EventEnvelope | bytes
TransportResult = dict[str, Any]
Transport = Callable[[str, TransportBody, dict[str, str], float], TransportResult]
# The payload is a JSON object, or the verbatim bytes of an upload whose Content-Type header names it.
AdminTransport = Callable[[str, str, dict[str, Any] | bytes | None, dict[str, str], float], TransportResult]


class ReadableBody(Protocol):
    def read(self, size: int, /) -> bytes: ...

    def close(self) -> None: ...


class BinaryWriter(Protocol):
    """Where a streamed download is written: an open binary file, ``io.BytesIO`` or a socket wrapper."""

    def write(self, data: bytes, /) -> object: ...


@dataclass(frozen=True)
class AdminStream:
    """An open answer whose body is read in chunks; ``headers`` keys are lower case."""

    status: int
    headers: dict[str, str]
    body: ReadableBody


# Opens a body-less request and returns the answer unread, so a download is copied, never buffered.
AdminStreamTransport = Callable[[str, str, dict[str, str], float], AdminStream]

STREAM_CHUNK_BYTES = 64 * 1024
# An error answer is a small problem document; more than this is not read.
STREAM_ERROR_BODY_LIMIT = 64 * 1024
REQUEST_ID_HEADER = "x-request-id"


@dataclass
class MetadataRecorder:
    """The server's ``X-Request-Id`` for the last answer made under ``record_metadata``; "" when none came."""

    request_id: str = ""


_METADATA_RECORDER: ContextVar[MetadataRecorder | None] = ContextVar("custd_metadata_recorder", default=None)


@contextmanager
def record_metadata() -> Iterator[MetadataRecorder]:
    """Record the request ID of every answer, refusals included, made inside the ``with`` block.

    It lets a caller quote the request the server logged without any method returning metadata::

        with record_metadata() as recorder:
            client.admin.machine_access.get()
        print(recorder.request_id)
    """
    recorder = MetadataRecorder()
    token = _METADATA_RECORDER.set(recorder)
    try:
        yield recorder
    finally:
        _METADATA_RECORDER.reset(token)


# The X-Request-Id of the last answer in this context, so the error built from it can carry it.
_ANSWER_REQUEST_ID: ContextVar[str] = ContextVar("custd_answer_request_id", default="")


def _record_request_id(headers: object) -> None:
    request_id = ""
    if isinstance(headers, Mapping):
        request_id = next(
            (str(value) for name, value in headers.items() if str(name).lower() == REQUEST_ID_HEADER and value), ""
        )
    _ANSWER_REQUEST_ID.set(request_id)
    recorder = _METADATA_RECORDER.get()
    if recorder is not None and request_id:
        recorder.request_id = request_id


def _recording_admin_transport(transport: "AdminTransport") -> "AdminTransport":
    def send(
        method: str, url: str, payload: dict[str, Any] | bytes | None, headers: dict[str, str], timeout: float
    ) -> TransportResult:
        result = transport(method, url, payload, headers, timeout)
        _record_request_id(result.get("headers"))
        return result

    return send


def _recording_stream_transport(transport: AdminStreamTransport) -> AdminStreamTransport:
    def open_stream(method: str, url: str, headers: dict[str, str], timeout: float) -> AdminStream:
        stream = transport(method, url, headers, timeout)
        _record_request_id(stream.headers)
        return stream

    return open_stream


def _recording_transport(transport: "Transport") -> "Transport":
    def send(url: str, event: TransportBody, headers: dict[str, str], timeout: float) -> TransportResult:
        result = transport(url, event, headers, timeout)
        _record_request_id(result.get("headers"))
        return result

    return send


class RawSourceTarget(TypedDict):
    """The declarative default data-scope target for one raw upload.

    Both fields are registered immutable CODES supplied as a pair, never numeric
    platform identities. They are a default the backend applies to a record with
    no canonical selection and refuses to let override an explicit selection.
    """

    subClient: str
    resource: str


# A standard raw-upload idempotency key: ``<unix-milliseconds>:<uuid-v4>``. The
# same key and the same body/parser/target let the backend return the accepted
# receipt again instead of landing a second copy; a changed intent under the
# same key is refused with a conflict. It carries no payload or credential.
RawRequestIdempotencyKey = str


class RawIngestRequest(TypedDict):
    """One raw, line-delimited upload for the bound parser.

    ``idempotencyKey`` opts the upload into stable admission. Absent means the
    existing one-shot unkeyed behavior with no safe replay.
    """

    content: str
    # parserUuid binds the parser executed for every line (X-Parser-UUID).
    parserUuid: str
    target: NotRequired[RawSourceTarget]
    idempotencyKey: NotRequired[RawRequestIdempotencyKey]


def create_raw_request_idempotency_key() -> RawRequestIdempotencyKey:
    """Mint a fresh key from the current time and a random UUIDv4.

    Mint it ONCE per request object so a resend reuses the key; a genuinely
    repeated occurrence needs a new request object and therefore a new key.
    """
    return f"{int(time.time() * 1000)}:{uuid.uuid4()}"


def create_raw_ingest_request(
    content: str,
    parser_uuid: str,
    target: RawSourceTarget | None = None,
) -> RawIngestRequest:
    """Build one raw request with a fresh, retained idempotency key."""
    request = RawIngestRequest(
        content=content,
        parserUuid=parser_uuid,
        idempotencyKey=create_raw_request_idempotency_key(),
    )
    if target is not None:
        request["target"] = target
    return request


class RawIngestResult(TypedDict):
    """The POST /api/v1/raw acceptance body.

    The route always answers 202 Accepted, so the status alone is not per-record
    success: read ``processed`` and ``failed``. A 202 with ``failed > 0`` is a
    partial failure.
    """

    success: bool
    processed: int
    failed: int


def _raw_ingest_url_and_body(base_url: str, request: RawIngestRequest) -> tuple[str, bytes]:
    """Validate the client inputs and build the raw upload URL and body.

    A missing/malformed parser UUID and a partial or malformed target are
    rejected locally before a round trip; both codes reuse the shared data-scope
    code rule rather than a second spelling. No backend parsing is shadowed.
    """
    from .admin_data_scopes import valid_data_scope_code

    parser_uuid = request.get("parserUuid")
    if not isinstance(parser_uuid, str) or RAW_PARSER_UUID_PATTERN.match(parser_uuid) is None:
        raise ValueError("custd: raw ingest requires a parser UUID")
    content = request.get("content")
    if not isinstance(content, str):
        raise ValueError("custd: raw ingest content must be a string")

    params: dict[str, str] = {}
    target = request.get("target")
    if target is not None:
        sub_client = target.get("subClient")
        resource = target.get("resource")
        if (
            not isinstance(sub_client, str)
            or not isinstance(resource, str)
            or not valid_data_scope_code(sub_client)
            or not valid_data_scope_code(resource)
        ):
            raise ValueError("custd: raw source target requires subClient and resource as a pair of valid codes")
        params = {"subClient": sub_client, "resource": resource}

    url = base_url.rstrip("/") + RAW_INGEST_ENDPOINT
    if params:
        url += "?" + urllib.parse.urlencode(params)
    return url, content.encode("utf-8")


_DTO = TypeVar("_DTO")


def _decode_dto(dto: type[_DTO], value: object) -> _DTO:
    """Return ``value`` as the named DTO with null lists made empty (see ``_wire.decode``)."""
    from ._wire import decode

    return decode(dto, value)


def _decode_raw_ingest_result(body: object, operation_key: str | None = None) -> RawIngestResult:
    """Decode the acceptance body strictly.

    A successful response must be an object carrying a boolean ``success`` and
    non-negative integer ``processed`` and ``failed``. An empty, null,
    non-object, or incomplete body, a wrong type, and a negative or fractional
    count all raise :class:`RawAcceptanceUnknownError` rather than defaulting or
    coercing a missing count; legitimate partial counts are returned unchanged.
    """
    try:
        decoded = _raw_response_object(body, operation_key)
        return RawIngestResult(
            success=_raw_response_bool(decoded, "success", operation_key),
            processed=_raw_response_non_negative_int(decoded, "processed", operation_key),
            failed=_raw_response_non_negative_int(decoded, "failed", operation_key),
        )
    except RawAcceptanceUnknownError:
        raise
    except (ValueError, TypeError) as error:
        raise RawAcceptanceUnknownError(operation_key) from error


def _raw_response_object(body: object, operation_key: str | None = None) -> dict[str, Any]:
    if isinstance(body, str):
        decoded: object = json.loads(body) if body != "" else None
    elif isinstance(body, bytes | bytearray):
        decoded = json.loads(bytes(body).decode("utf-8"))
    elif isinstance(body, dict):
        decoded = body
    else:
        decoded = None
    if not isinstance(decoded, dict):
        raise RawAcceptanceUnknownError(operation_key)
    return decoded


def _raw_response_bool(payload: dict[str, Any], key: str, operation_key: str | None = None) -> bool:
    value = payload.get(key)
    if not isinstance(value, bool):
        raise RawAcceptanceUnknownError(operation_key)
    return value


def _raw_response_non_negative_int(payload: dict[str, Any], key: str, operation_key: str | None = None) -> int:
    value = payload.get(key)
    # bool is an int subclass; exclude it so a boolean is not read as a count.
    if isinstance(value, bool) or not isinstance(value, int) or value < 0:
        raise RawAcceptanceUnknownError(operation_key)
    return value


class AdminRequestOptions(TypedDict, total=False):
    """Optional metadata applied to one authenticated admin request."""

    idempotency_key: str
    # The platform user a machine credential acts for, sent as
    # X-Custd-Owning-User-UUID. The /admin/auth-projects surface requires it for
    # a machine caller; a human administrator's own token subject is the actor
    # and leaves it unset.
    owning_user_uuid: str


TokenProvider = Callable[[], str]
OAuthTokenTransport = Callable[[str, dict[str, Any], float], dict[str, Any]]


SubjectInsightRequest = TypedDict(
    "SubjectInsightRequest",
    {
        "template": str,
        "subject": str,
        "from": NotRequired[str],
        "to": NotRequired[str],
        "rangeDays": NotRequired[int],
    },
)


ReportingQueryRequest = TypedDict(
    "ReportingQueryRequest",
    {
        "template": str,
        "metrics": list[str],
        "dashboardKey": NotRequired[str],
        "widgetKey": NotRequired[str],
        "dimensions": NotRequired[list[str]],
        "filters": NotRequired[list[dict[str, str]]],
        "from": NotRequired[str],
        "to": NotRequired[str],
        "rangeDays": NotRequired[int],
        "maxRows": NotRequired[int],
        "countOnly": NotRequired[bool],
        "comparison": NotRequired[ReportingComparison],
    },
)


class RenderedMetricValue(TypedDict):
    value: float
    unit: RenderedUnit
    sampleCount: int
    dataSufficiency: ReportingDataSufficiency
    complete: bool
    truncated: NotRequired[bool]
    currency: NotRequired[str]
    trust: NotRequired[RenderedMetricTrust]


class RenderedAnomaly(TypedDict):
    at: str
    value: RenderedMetricValue
    lower: float
    upper: float


class RenderedCalibrationBucket(TypedDict):
    predictedLower: float
    predictedUpper: float
    observed: RenderedMetricValue


class RenderedCohortCell(TypedDict):
    cohort: str
    window: str
    population: int
    value: RenderedMetricValue
    suppressed: NotRequired[bool]


class RenderedDistributionBin(TypedDict):
    lower: float
    upper: float
    value: RenderedMetricValue


class RenderedDriver(TypedDict):
    key: str
    label: str
    method: str
    rank: int
    contribution: RenderedMetricValue


class RenderedInterval(TypedDict):
    label: str
    estimate: RenderedMetricValue
    lower: RenderedMetricValue
    upper: RenderedMetricValue


class RenderedLifecycleStage(TypedDict):
    key: str
    label: str
    order: int
    entered: RenderedMetricValue
    converted: RenderedMetricValue
    dropOff: RenderedMetricValue


class RenderedQuantile(TypedDict):
    quantile: float
    value: RenderedMetricValue


class RenderedVisualResult(TypedDict):
    """The analysis a non-time-series widget renders; ``kind`` names which list it fills."""

    kind: RenderedVisualKind
    summary: str
    method: NotRequired[str]
    anomalies: NotRequired[list[RenderedAnomaly]]
    calibration: NotRequired[list[RenderedCalibrationBucket]]
    cohorts: NotRequired[list[RenderedCohortCell]]
    distribution: NotRequired[list[RenderedDistributionBin]]
    drivers: NotRequired[list[RenderedDriver]]
    intervals: NotRequired[list[RenderedInterval]]
    lifecycle: NotRequired[list[RenderedLifecycleStage]]
    quantiles: NotRequired[list[RenderedQuantile]]


class RenderedWidgetBucket(TypedDict):
    date: str
    value: RenderedMetricValue
    source: str
    queryDurationMs: int
    parquetUriCount: NotRequired[int]
    message: NotRequired[str]
    secondary: NotRequired[RenderedMetricValue]


class ReportingQueryMetadata(TypedDict):
    resolvedTemplate: str
    effectiveMaxRows: int
    returnedRows: int
    returnedBuckets: int
    coveredWindows: int
    rangeStart: NotRequired[str]
    rangeEnd: NotRequired[str]


class ReportingSourceSummary(TypedDict):
    kind: str
    count: int
    completeness: str
    coverageStart: NotRequired[str]
    coverageEnd: NotRequired[str]


class RenderedReportingTrust(TypedDict):
    status: ReportingTrustStatus
    dataFreshness: ReportingDataFreshness
    retryability: ReportingRetryability
    nextAction: PreparedDataNextAction
    rollupState: str
    coverage: str
    captureState: str
    consentState: str
    exportState: str
    lastExport: NotRequired[str]
    schemaVersion: NotRequired[str]
    contractVersion: NotRequired[str]
    queryWarnings: NotRequired[list[str]]
    permissionClass: NotRequired[str]
    partialReason: NotRequired[str]
    unavailableReason: NotRequired[str]


class RenderedWidgetData(TypedDict):
    buckets: list[RenderedWidgetBucket]
    value: RenderedMetricValue
    queryDurationMs: int
    snapshotAgeMs: int
    eventLagP95Ms: int
    metadata: NotRequired[ReportingQueryMetadata]
    sources: NotRequired[list[ReportingSourceSummary]]
    warnings: NotRequired[list[str]]
    trust: NotRequired[RenderedReportingTrust]
    parquetUriCount: NotRequired[int]
    delta: NotRequired[RenderedMetricValue]
    deltaPercent: NotRequired[float]
    deltaLabel: NotRequired[str]
    secondaryLabel: NotRequired[str]
    visual: NotRequired[RenderedVisualResult]
    emailDelivery: NotRequired[RenderedEmailDelivery]
    labelMetadata: NotRequired[list[RenderedLabelMetadata]]


class SubjectInsightResponse(TypedDict):
    data: RenderedWidgetData


class PreparedDataStatus(TypedDict):
    """Where one processing receipt stands and its next safe action."""

    receiptUuid: str
    tenantSlug: str
    processingState: PreparedDataState
    availability: PreparedDataAvailability
    observedAt: str
    provenance: PreparedDataProvenance
    retryability: ReportingRetryability
    nextAction: PreparedDataNextAction
    watermark: NotRequired[str]
    warnings: NotRequired[list[PreparedDataWarning]]


class PreparedDataOutputStatus(TypedDict):
    """Where one prepared-data output stands and its next safe action."""

    outputUuid: str
    tenantSlug: str
    processingState: PreparedDataState
    availability: PreparedDataAvailability
    observedAt: str
    provenance: PreparedDataProvenance
    retryability: ReportingRetryability
    nextAction: PreparedDataNextAction
    watermark: NotRequired[str]
    warnings: NotRequired[list[PreparedDataWarning]]


class PreparedDataOutputList(TypedDict):
    outputs: list[PreparedDataOutputStatus]


class PreparedDataOutputQueryResponse(TypedDict):
    """A query answered from one prepared-data output, with the output's state."""

    data: RenderedWidgetData
    output: PreparedDataOutputStatus


ReportExportParameters = TypedDict(
    "ReportExportParameters",
    {
        "from": NotRequired[str],
        "to": NotRequired[str],
        "rangeDays": NotRequired[int],
        "maxRows": NotRequired[int],
        "comparison": NotRequired[ReportingComparison],
        "filters": NotRequired[list[dict[str, str]]],
        "selections": NotRequired[list[str]],
    },
)


class ReportExportCreateRequest(TypedDict):
    dashboardKey: str
    formats: list[ReportingExportFormat]
    parameters: ReportExportParameters
    idempotencyKey: NotRequired[str]


class ReportExportListResponse(TypedDict):
    """The named GET /api/v1/reporting/exports response; a null list decodes as empty."""

    exports: list[ReportExportJob]


class ValidationError(ValueError):
    pass


def validate_uuid(value: str, field: str) -> None:
    try:
        if str(uuid.UUID(value)) != value.lower():
            raise ValueError
    except (ValueError, AttributeError):
        raise ValidationError(f"custd: {field} must be a UUID") from None


class RetryableError(RuntimeError):
    pass


MACHINE_ACCESS_BLOCKED_CODE = "machine_access_blocked"
MACHINE_ACCESS_UNAVAILABLE_CODE = "machine_access_unavailable"


class MachineAccessBlock(TypedDict):
    """Why a machine access setting refused a request: the area, and which setting blocked it.

    ``blockedBy`` is ``company``, ``machine`` or ``support_automation`` (an open set).
    """

    area: str
    blockedBy: str
    companySlug: str
    clientId: str


class RequestError(RuntimeError):
    """A refused or failed call.

    ``request_id`` is the identifier to quote in a support request: the answer's ``X-Request-Id``,
    else the flat envelope's ``requestId``, else the problem's ``traceId``. ``machine_access`` is set
    when a machine access setting refused the call (code ``machine_access_blocked``).
    """

    def __init__(
        self,
        message: str,
        *,
        status: int | None = None,
        code: str | None = None,
        safe_next_action: str | None = None,
        reason: str | None = None,
        retryability: str = "none",
        next_action: dict[str, Any] | None = None,
        trace_id: str | None = None,
        request_id: str | None = None,
        machine_access: MachineAccessBlock | None = None,
    ) -> None:
        super().__init__(message)
        self.status = status
        self.code = code
        self.safe_next_action = safe_next_action
        self.reason = reason
        self.retryability = retryability
        self.next_action = next_action
        self.trace_id = trace_id
        self.request_id = request_id
        self.machine_access = machine_access

    @property
    def unavailable(self) -> bool:
        return self.status is None or self.status == 429 or self.status >= 500


class RawAcceptanceUnknownError(RequestError):
    """A raw upload's acceptance could not be determined.

    Raised when the connection failed before a response arrived, the 202 body
    was missing or malformed, or the response carried a status that does not
    prove rejection. The request may or may not have landed, so this error is
    non-retryable and recommends no replay: there is no verified occurrence
    identity, and resubmitting could double-land accepted records. Its cause
    carries no request payload or token.
    """

    def __init__(self, operation_key: str | None = None) -> None:
        super().__init__(
            "custd: raw upload acceptance is unknown; the request may or may not have landed "
            "and must not be replayed",
            code="raw_acceptance_unknown",
            retryability="none",
            next_action={"action": "escalate"},
        )
        # The original operation key, when the request carried one, so a caller
        # can retry with the SAME key once the backend dedup protocol is proven.
        self.operation_key = operation_key

    @property
    def unavailable(self) -> bool:
        # Not a retryable unavailability: acceptance is unknown, not absent.
        return False


def _decoded_error_body(body: object) -> dict[str, Any]:
    decoded: object = body
    if isinstance(body, bytes):
        body = body.decode("utf-8", errors="replace")
    if isinstance(body, str):
        try:
            decoded = json.loads(body)
        except json.JSONDecodeError:
            decoded = None
    return decoded if isinstance(decoded, dict) else {}


def _text(payload: dict[str, Any], key: str) -> str | None:
    value = payload.get(key)
    return value if isinstance(value, str) and value else None


def _machine_access_block(payload: dict[str, Any]) -> MachineAccessBlock | None:
    block = payload.get("machineAccess")
    if not isinstance(block, dict):
        return None
    return MachineAccessBlock(
        area=str(block.get("area") or ""),
        blockedBy=str(block.get("blockedBy") or ""),
        companySlug=str(block.get("companySlug") or ""),
        clientId=str(block.get("clientId") or ""),
    )


def _problem_retryability(payload: dict[str, Any], status: int) -> str:
    retryability = payload.get("retryability")
    if isinstance(retryability, str) and retryability in ("none", "bounded"):
        return retryability
    return "bounded" if status == 429 or status >= 500 else "none"


def _problem_error(message: str, status: int, payload: dict[str, Any]) -> RequestError:
    next_action = payload.get("nextAction")
    return RequestError(
        message,
        status=status,
        code=_text(payload, "code"),
        retryability=_problem_retryability(payload, status),
        next_action=next_action if isinstance(next_action, dict) else None,
        trace_id=_text(payload, "traceId"),
        request_id=_refusal_request_id(payload),
        machine_access=_machine_access_block(payload),
    )


def _refusal_request_id(payload: dict[str, Any]) -> str | None:
    """The ID to quote: the answer's X-Request-Id, else the flat envelope's requestId, else the traceId."""
    return _ANSWER_REQUEST_ID.get() or _text(payload, "requestId") or _text(payload, "traceId")


def admin_request_error(status: int, body: object) -> RequestError:
    """Translate an admin refusal: the flat ``{error, code, safe_next_action}`` envelope or an RFC 9457 problem."""
    payload = _decoded_error_body(body)
    reason_text = _text(payload, "error")
    if reason_text is None:
        detail = _text(payload, "detail")
        return _problem_error(f"custd: {detail or f'admin request failed with status {status}'}", status, payload)
    return RequestError(
        f"custd: {reason_text}",
        status=status,
        code=_text(payload, "code"),
        safe_next_action=_text(payload, "safe_next_action"),
        reason=reason_text,
        trace_id=_text(payload, "traceId"),
        request_id=_refusal_request_id(payload),
    )


def problem_request_error(status: int, body: object, operation: str) -> RequestError:
    """Translate an RFC 9457 problem+json body into a RequestError.

    The /api/v1 tenant routes report `detail`, `code`, `retryability` and `nextAction`,
    a different problem shape from the admin API's `error`/`safe_next_action`, so this
    does not share admin_request_error's flat branch.
    """
    payload = _decoded_error_body(body)
    detail = _text(payload, "detail")
    return _problem_error(detail or f"custd: {operation} request failed with status {status}", status, payload)


def ingest_request_error(status: int, body: object) -> RequestError:
    """Translate an ingest refusal, keeping the problem's code, trace ID and machine access block."""
    return _problem_error(problem_error_message(status, body), status, _decoded_error_body(body))


class QueueStorageError(RuntimeError):
    pass


class QueueFullError(QueueStorageError):
    pass


class BatchRequestError(RequestError):
    def __init__(self, message: str, acknowledged_event_uuids: set[str]) -> None:
        super().__init__(message)
        self.acknowledged_event_uuids = frozenset(acknowledged_event_uuids)


class MemoryQueueStorage:
    def __init__(self) -> None:
        self._events: list[EventEnvelope] = []

    def load(self) -> list[EventEnvelope]:
        return [dict(event) for event in self._events]

    def save(self, events: list[EventEnvelope]) -> None:
        self._events = [dict(event) for event in events]

    def clear(self) -> None:
        self._events = []


DEFAULT_QUEUE_MAX_BYTES = 10 * 1024 * 1024


class FileQueueStorage:
    """Persist queued events through an atomic, private JSON file replacement."""

    def __init__(self, path: str | os.PathLike[str], *, max_bytes: int = DEFAULT_QUEUE_MAX_BYTES) -> None:
        if not isinstance(max_bytes, int) or isinstance(max_bytes, bool) or max_bytes <= 0:
            raise ValueError("custd: queue max_bytes must be a positive integer")
        self.path = Path(path)
        self.max_bytes = max_bytes

    def load(self) -> list[EventEnvelope]:
        self._assert_safe_path()
        if not self.path.exists():
            return []
        try:
            raw = self.path.read_bytes()
        except OSError as error:
            raise QueueStorageError(f"custd: failed to load queue file {self.path}") from error
        if len(raw) > self.max_bytes:
            raise QueueFullError(f"custd: queue file exceeds max_bytes ({len(raw)} > {self.max_bytes})")
        try:
            decoded = json.loads(raw)
        except json.JSONDecodeError as error:
            raise QueueStorageError(f"custd: failed to load queue file {self.path}") from error
        if not isinstance(decoded, list) or not all(isinstance(event, dict) for event in decoded):
            raise QueueStorageError(f"custd: queue file {self.path} must contain an event list")
        return [dict(event) for event in decoded]

    def save(self, events: list[EventEnvelope]) -> None:
        try:
            raw = json.dumps(events, ensure_ascii=False, separators=(",", ":"), allow_nan=False).encode("utf-8")
        except (TypeError, ValueError) as error:
            raise QueueStorageError("custd: queued events must be JSON serializable") from error
        if len(raw) > self.max_bytes:
            raise QueueFullError(f"custd: queue file exceeds max_bytes ({len(raw)} > {self.max_bytes})")

        directory = self.path.parent
        try:
            directory.mkdir(mode=0o700, parents=True, exist_ok=True)
            self._assert_safe_path()
            descriptor, temporary = tempfile.mkstemp(prefix=f".{self.path.name}.", dir=directory)
            try:
                with os.fdopen(descriptor, "wb") as handle:
                    os.fchmod(handle.fileno(), 0o600)
                    handle.write(raw)
                    handle.flush()
                    os.fsync(handle.fileno())
                os.replace(temporary, self.path)
                self._sync_directory(directory)
            except Exception:
                self._remove_temporary(temporary)
                raise
        except QueueStorageError:
            raise
        except OSError as error:
            raise QueueStorageError(f"custd: failed to save queue file {self.path}") from error

    def clear(self) -> None:
        self._assert_safe_path()
        if not self.path.exists():
            return
        try:
            self.path.unlink(missing_ok=True)
            self._sync_directory(self.path.parent)
        except OSError as error:
            raise QueueStorageError(f"custd: failed to clear queue file {self.path}") from error

    def _assert_safe_path(self) -> None:
        if self.path.is_symlink() or (self.path.exists() and not self.path.is_file()):
            raise QueueStorageError(f"custd: unsafe queue file path {self.path}")

    @staticmethod
    def _remove_temporary(path: str) -> None:
        try:
            os.unlink(path)
        except FileNotFoundError:
            pass

    @staticmethod
    def _sync_directory(directory: Path) -> None:
        descriptor = os.open(directory, os.O_RDONLY)
        try:
            os.fsync(descriptor)
        finally:
            os.close(descriptor)


class CustdClient:
    def __init__(
        self,
        *,
        base_url: str,
        token: str | None = None,
        oauth: dict[str, Any] | None = None,
        retry: dict[str, Any] | None = None,
        batch: dict[str, Any] | None = None,
        queue: dict[str, Any] | None = None,
        compression: dict[str, Any] | None = None,
        environment: str | None = None,
        transport: Transport | None = None,
        admin_transport: AdminTransport | None = None,
        admin_stream_transport: AdminStreamTransport | None = None,
        timeout: float = 15,
        acting_company_slug: str | None = None,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        # The client company a system administrator's requests target. Admin routes read the
        # tenant from the companySlug query, so a call that names none gets this one (see
        # with_acting_company). The ingest cleanup-job calls read it only from a header and
        # send it as X-Custd-Effective-Company, which needs a support grant for that company.
        # Ordinary tenant callers leave it unset.
        self.acting_company_slug = (acting_company_slug or "").strip()
        assert_secure_or_local_http(self.base_url, "base_url")
        # One credential serves every environment, so this is the process
        # default for events that do not declare their own.
        validate_environment_value(environment or "")
        self.environment = environment
        self._oauth = oauth
        self._oauth_token: tuple[str, float] | None = None
        self._token_transport = (oauth or {}).get("transport") or fetch_oauth_token
        if oauth is not None:
            assert_secure_or_local_http(str(oauth.get("token_url", "")), "token_url")
            self._token_provider = self._producer_token
        elif token is not None:
            self._token_provider = lambda: token
        else:
            raise ValueError("custd: token or oauth config is required")
        self.retry = normalize_retry(retry)
        self.batch = batch
        queue_config = queue or {}
        self.queue_enabled = bool(queue_config.get("enabled", batch is not None))
        queue_storage: Any = queue_config.get("storage")
        if queue_storage is None and queue_config.get("path"):
            queue_storage = FileQueueStorage(
                queue_config["path"],
                max_bytes=int(queue_config.get("max_bytes", DEFAULT_QUEUE_MAX_BYTES)),
            )
        self.queue_storage: Any = queue_storage or MemoryQueueStorage()
        self.queue: list[EventEnvelope] = self.queue_storage.load() if self.queue_enabled else []
        self.max_queue_size = int(queue_config.get("max_queue_size", 1000))
        if self.max_queue_size <= 0:
            raise ValueError("custd: queue max_queue_size must be a positive integer")
        self.compression = normalize_compression(compression)
        # Every transport records the answer's request ID for record_metadata.
        self.transport = _recording_transport(transport or make_default_transport(self.compression))
        recorded_admin_transport = _recording_admin_transport(admin_transport or default_admin_transport)
        self.admin = AdminClient(
            self,
            recorded_admin_transport,
            _recording_stream_transport(admin_stream_transport or default_admin_stream_transport),
        )
        self.provisioning = ProvisioningClient(self, recorded_admin_transport)
        self.reporting = ReportingClient(self, recorded_admin_transport)
        from .analytics_events import AnalyticsEventClient

        self.analytics = AnalyticsEventClient(self, recorded_admin_transport)
        from .app_messages import AppMessageClient

        self.app_messages = AppMessageClient(self, recorded_admin_transport)
        from .storefront import StorefrontClient

        self.storefronts = StorefrontClient(self, recorded_admin_transport)
        from .parsers import ParserClient

        self.parsers = ParserClient(self, recorded_admin_transport)
        from .measurement import MeasurementClient

        self.measurement = MeasurementClient(self.admin)
        self.timeout = timeout

    @classmethod
    def from_provisioned_producer(cls, credentials: dict[str, Any]) -> "CustdClient":
        """Build an event-producing client directly from a provisioned producer bundle."""
        if not credentials.get("client_secret") and not credentials.get("clientSecret"):
            raise ValueError("custd: provisioned producer bundle is missing the client secret")
        return cls(
            base_url=str(credentials.get("baseUrl", "")),
            oauth={
                "client_id": credentials.get("clientId", ""),
                "client_secret": credentials.get("clientSecret", ""),
                "token_url": credentials.get("tokenUrl", ""),
                "audience": credentials.get("audience", ""),
                "scopes": credentials.get("scopes", []),
            },
        )

    def ingest_event(self, event: EventEnvelope) -> TransportResult:
        prepared = prepare_event(event)
        validate_event(prepared)
        apply_environment_label(prepared, self.environment)
        return self._send_with_retry(prepared)

    def ingest_raw_lines(self, request: RawIngestRequest) -> RawIngestResult:
        """Upload raw, line-delimited content for the bound parser.

        X-Parser-UUID binds the parser exactly as direct collectors do. When a
        ``target`` is supplied its paired subClient/resource codes are appended
        as query parameters. A non-empty ``idempotencyKey`` is sent as the
        standard ``Idempotency-Key`` header, so a resend of the same request is
        deduplicated by the backend rather than landing twice. The route answers
        202 Accepted, so read ``processed``/``failed`` on the result rather than
        the status.

        A transport failure or an unusable 202 body cannot prove whether the
        upload landed, so it raises :class:`RawAcceptanceUnknownError` (which
        carries no retry guidance) rather than a retryable error: replaying the
        POST could double-land accepted records, and this method never retries
        automatically.
        """
        url, body = _raw_ingest_url_and_body(self.base_url, request)
        operation_key: str | None = request.get("idempotencyKey") or None
        headers = self._headers()
        headers["Content-Type"] = "text/plain; charset=utf-8"
        headers["X-Parser-UUID"] = request["parserUuid"]
        if operation_key:
            headers["Idempotency-Key"] = operation_key
        try:
            result = self.transport(url, body, headers, self.timeout)
        except RawAcceptanceUnknownError:
            raise
        except Exception as error:
            # A disconnect cannot prove whether the upload landed; offer no retry.
            raise RawAcceptanceUnknownError(operation_key) from error
        status = int(result["status"])
        if status in self.retry["retry_statuses"]:
            raise RawAcceptanceUnknownError(operation_key)
        if status >= 400:
            raise ingest_request_error(status, result.get("body"))
        return _decode_raw_ingest_result(result.get("body"), operation_key)

    def track(self, event: EventEnvelope) -> TransportResult | None:
        prepared = prepare_event(event)
        validate_event(prepared)
        apply_environment_label(prepared, self.environment)
        if not self.queue_enabled:
            return self._send_with_retry(prepared)

        self._enqueue(prepared)
        if self.batch is not None:
            max_batch_size = int(self.batch.get("max_batch_size", 0))
            if max_batch_size > 0 and len(self.queue) >= max_batch_size:
                self.flush()
        else:
            self.flush()
        return None

    def flush(self) -> None:
        if not self.queue_enabled or not self.queue:
            return

        max_batch_size = len(self.queue)
        if self.batch is not None:
            max_batch_size = int(self.batch.get("max_batch_size", max_batch_size))

        batch = self.queue[:max_batch_size]
        remaining = self.queue[max_batch_size:]

        try:
            self._send_batch_with_retry(batch)
        except BatchRequestError as error:
            self.queue = [
                event for event in batch if event.get("eventUuid") not in error.acknowledged_event_uuids
            ] + remaining
            self.queue_storage.save(self.queue)
            raise
        except Exception:
            self.queue = batch + remaining
            self.queue_storage.save(self.queue)
            raise

        self.queue = remaining
        self.queue_storage.save(self.queue)

    def close(self) -> None:
        self.flush()

    def _enqueue(self, event: EventEnvelope) -> None:
        if len(self.queue) >= self.max_queue_size:
            raise QueueFullError(f"custd: queue max_queue_size reached ({self.max_queue_size})")
        next_queue = [*self.queue, event]
        self.queue_storage.save(next_queue)
        self.queue = next_queue

    def _send_with_retry(self, event: EventEnvelope) -> TransportResult:
        max_attempts = int(self.retry["max_attempts"])
        attempt = 0
        while True:
            attempt += 1
            try:
                return self._send(event)
            except RetryableError:
                if attempt >= max_attempts:
                    raise
                time.sleep(backoff_delay(self.retry, attempt) / 1000)

    def _send_batch_with_retry(self, events: list[EventEnvelope]) -> TransportResult:
        max_attempts = int(self.retry["max_attempts"])
        attempt = 0
        while True:
            attempt += 1
            try:
                return self._send_batch(events)
            except RetryableError:
                if attempt >= max_attempts:
                    raise
                time.sleep(backoff_delay(self.retry, attempt) / 1000)

    def _send(self, event: EventEnvelope) -> TransportResult:
        result = self.transport(self._endpoint(), event, self._headers(), self.timeout)
        status = int(result["status"])
        if status in self.retry["retry_statuses"]:
            raise RetryableError(f"custd: retryable status {status}")
        if status >= 400:
            raise ingest_request_error(status, result.get("body"))
        return result

    def _send_batch(self, events: list[EventEnvelope]) -> TransportResult:
        result = self.transport(self._batch_endpoint(), {"events": events}, self._headers(), self.timeout)
        status = int(result["status"])
        if status in self.retry["retry_statuses"]:
            raise RetryableError(f"custd: retryable status {status}")
        if status >= 400:
            raise ingest_request_error(status, result.get("body"))

        body = result.get("body")
        if not (isinstance(body, str) and body):
            return result
        decoded = json.loads(body)
        if isinstance(decoded, dict):
            results = decoded.get("results")
            acknowledged = acknowledged_event_uuids(results, events)
            failure = batch_rejection_message(status, results)
            if failure is not None:
                raise BatchRequestError(failure, acknowledged)
            if isinstance(results, list) and len(acknowledged) != len(events):
                raise BatchRequestError("custd: batch response did not acknowledge every event", acknowledged)
            if decoded.get("success") is False and not isinstance(results, list):
                raise BatchRequestError("custd: batch request failed without per-event results", set())
            return result
        raise BatchRequestError("custd: batch response was not a JSON object", set())

    def _endpoint(self) -> str:
        return self.base_url + INGEST_ENDPOINT

    def _batch_endpoint(self) -> str:
        return self.base_url + INGEST_BATCH_ENDPOINT

    def _headers(self) -> dict[str, str]:
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self._token_provider()}",
            "X-Custd-Sdk": IDENTITY,
        }

    def _producer_token(self) -> str:
        now = time.time()
        if self._oauth_token is not None and self._oauth_token[1] > now + 30:
            return self._oauth_token[0]
        oauth = self._oauth or {}
        request = {
            "grant_type": "client_credentials",
            "client_id": oauth.get("client_id", ""),
            "client_secret": oauth.get("client_secret", ""),
            "audience": oauth.get("audience", ""),
            "scope": " ".join(oauth.get("scopes", [])),
        }
        token = self._token_transport(str(oauth.get("token_url", "")), request, self.timeout)
        access_token = token.get("access_token")
        if not access_token:
            raise RequestError("custd: token response missing access_token")
        expires_at = now + int(token.get("expires_in", 300))
        self._oauth_token = (str(access_token), expires_at)
        return str(access_token)


# The admin-api routes that select their tenant with the companySlug query.
ACTING_COMPANY_ROUTES = (
    "/api/v1/admin/",
    "/api/v1/site-domains",
    "/api/v1/error-issues",
    "/api/v1/notification-destinations",
)


def with_acting_company(client: CustdClient, path: str) -> str:
    """Name the configured acting company in ``path``'s companySlug query when the call names none.

    This is ordinary tenant selection, so it never adds the support-context header.
    """
    company = client.acting_company_slug
    route, _, query = path.partition("?")
    if not company or not route.startswith(ACTING_COMPANY_ROUTES):
        return path
    if any(key == "companySlug" and value for key, value in urllib.parse.parse_qsl(query)):
        return path
    return path + ("&" if query else "?") + urllib.parse.urlencode({"companySlug": company})


class AdminClient:
    def __init__(
        self, client: CustdClient, transport: AdminTransport, stream_transport: AdminStreamTransport
    ) -> None:
        self._client = client
        self._transport = transport
        self._stream_transport = stream_transport
        self.tenants = TenantAdminClient(self)
        self.oauth_clients = OAuthClientAdminClient(self)
        self.sites = SiteAdminClient(self)
        from .admin_access import ImpersonationAdminClient, SupportAccessAdminClient
        from .admin_audit import AuditAdminClient
        from .admin_auth_projects import AuthProjectAdminClient
        from .admin_campaign_email import CampaignEmailAdminClient
        from .admin_data_labels import DataLabelAdminClient
        from .admin_data_scopes import DataScopeAdminClient
        from .admin_machine_access import MachineAccessAdminClient
        from .admin_notifications import (
            EmailRelayAdminClient,
            NotificationDestinationAdminClient,
            NotificationWebhookAdminClient,
        )
        from .admin_oauth_admissions import OAuthClientAdmissionAdminClient
        from .admin_offboarding import OffboardingClient
        from .admin_operations import (
            AccountingEvidenceAdminClient,
            EnvironmentPolicyAdminClient,
            ErrorIssueAdminClient,
            EventTypeAdminClient,
            IngestClaimAdminClient,
            ManagedAuditAdminClient,
            RLSAdminClient,
            SDKUsageAdminClient,
            StorageAlertAdminClient,
            SystemAdminClient,
            TenantManifestAdminClient,
        )
        from .admin_predictions import PredictionAdminClient
        from .admin_privacy import PrivacyAdminClient
        from .admin_privacy_erasures import PrivacyErasureClient
        from .admin_reporting_packs import ReportingPacksAdminClient
        from .admin_retention import RetentionClient
        from .admin_schema_actions import SchemaActionAdminClient
        from .admin_schemas import SchemaAdminClient
        from .admin_site_domains import SiteDomainAdminClient
        from .admin_subject_exports import SubjectExportClient
        from .admin_tenant_storage import TenantStorageClient
        from .admin_timeplans import TimePlanAdminClient
        from .admin_usage import UsageAdminClient
        from .admin_users import AdminUserAdminClient
        from .admin_workflow_timings import WorkflowTimingAdminClient
        from .ingest_operations import IngestAdminClient
        from .measurement import MeasurementAdminClient
        from .uncertainty_models import UncertaintyModelAdminClient

        self.measurement = MeasurementAdminClient(self)
        self.schemas = SchemaAdminClient(self)
        self.tenant_storage = TenantStorageClient(self)
        self.subject_exports = SubjectExportClient(self)
        self.privacy_erasures = PrivacyErasureClient(self)
        self.retention = RetentionClient(self)
        self.offboarding = OffboardingClient(self)
        self.predictions = PredictionAdminClient(self)
        self.data_labels = DataLabelAdminClient(self)
        self.data_scopes = DataScopeAdminClient(self)
        self.reporting_packs = ReportingPacksAdminClient(self)
        self.time_plans = TimePlanAdminClient(self)
        self.audit = AuditAdminClient(self)
        self.usage = UsageAdminClient(self)
        self.site_domains = SiteDomainAdminClient(self)
        self.auth_projects = AuthProjectAdminClient(self)
        self.workflow_timings = WorkflowTimingAdminClient(self)
        self.users = AdminUserAdminClient(self)
        self.impersonation = ImpersonationAdminClient(self)
        self.support_access = SupportAccessAdminClient(self)
        self.oauth_client_admissions = OAuthClientAdmissionAdminClient(self)
        self.uncertainty_models = UncertaintyModelAdminClient(self)
        self.privacy = PrivacyAdminClient(self)
        self.ingest = IngestAdminClient(self)
        self.system = SystemAdminClient(self)
        self.rls = RLSAdminClient(self)
        self.environment_policy = EnvironmentPolicyAdminClient(self)
        self.sdk_usage = SDKUsageAdminClient(self)
        self.storage_alerts = StorageAlertAdminClient(self)
        self.accounting_evidence = AccountingEvidenceAdminClient(self)
        self.event_types = EventTypeAdminClient(self)
        self.ingest_claims = IngestClaimAdminClient(self)
        self.tenant_manifest = TenantManifestAdminClient(self)
        self.error_issues = ErrorIssueAdminClient(self)
        self.managed_audit = ManagedAuditAdminClient(self)
        self.webhooks = NotificationWebhookAdminClient(self)
        self.notification_destinations = NotificationDestinationAdminClient(self)
        self.email_relay = EmailRelayAdminClient(self)
        self.campaign_email = CampaignEmailAdminClient(self)
        self.schema_actions = SchemaActionAdminClient(self)
        self.machine_access = MachineAccessAdminClient(self)

    def get_account(self) -> "Account":
        """Read the authenticated caller's account document from /api/v1/account/me."""
        from .ingest_operations import _get_account

        return _get_account(self)

    def request(
        self,
        method: str,
        path: str,
        payload: dict[str, Any] | None = None,
        options: AdminRequestOptions | None = None,
    ) -> TransportResult:
        return self._send(method, path, payload, self._option_headers(options))

    def upload(
        self,
        method: str,
        path: str,
        data: bytes,
        content_type: str,
        options: AdminRequestOptions | None = None,
    ) -> TransportResult:
        """Send verbatim bytes (a file or multipart form) and decode the JSON answer."""
        headers = self._option_headers(options)
        headers["Content-Type"] = content_type
        return self._send(method, path, data, headers)

    def _option_headers(self, options: AdminRequestOptions | None) -> dict[str, str]:
        headers = self._client._headers()
        options = options or {}
        idempotency_key = options.get("idempotency_key")
        if isinstance(idempotency_key, str) and idempotency_key.strip():
            headers["Idempotency-Key"] = idempotency_key.strip()
        owning_user_uuid = options.get("owning_user_uuid")
        if isinstance(owning_user_uuid, str) and owning_user_uuid.strip():
            headers["X-Custd-Owning-User-UUID"] = owning_user_uuid.strip()
        return headers

    def _send(
        self, method: str, path: str, payload: dict[str, Any] | bytes | None, headers: dict[str, str]
    ) -> TransportResult:
        result = self._transport(
            method,
            self._client.base_url + with_acting_company(self._client, "/api/v1/admin" + path),
            payload,
            headers,
            self._client.timeout,
        )
        status = int(result["status"])
        if status >= 400:
            raise admin_request_error(status, result.get("body"))
        body = result.get("body")
        if status == 204 or body in (None, ""):
            return {}
        if isinstance(body, str):
            decoded = json.loads(body)
            return decoded if isinstance(decoded, dict) else {"items": decoded}
        if isinstance(body, dict):
            return body
        if isinstance(body, list):
            return {"items": body}
        return {}

    def open_stream(self, path: str) -> AdminStream:
        """GET ``path`` and return the accepted answer unread; the caller closes its body.

        An error answer is read (bounded), closed and raised as the admin request error.
        """
        stream = self._stream_transport(
            "GET",
            self._client.base_url + with_acting_company(self._client, "/api/v1/admin" + path),
            self._client._headers(),
            self._client.timeout,
        )
        if stream.status < 400:
            return stream
        try:
            body = stream.body.read(STREAM_ERROR_BODY_LIMIT).decode("utf-8", errors="replace")
        finally:
            stream.body.close()
        raise admin_request_error(stream.status, body)


def copy_stream(stream: AdminStream, writer: BinaryWriter, limit: int | None = None) -> tuple[int, str]:
    """Copy at most ``limit`` (else every) body byte into ``writer``; return the count and SHA-256 hex."""
    digest = hashlib.sha256()
    written = 0
    while limit is None or written < limit:
        size = STREAM_CHUNK_BYTES if limit is None else min(STREAM_CHUNK_BYTES, limit - written)
        chunk = stream.body.read(size)
        if not chunk:
            break
        writer.write(chunk)
        digest.update(chunk)
        written += len(chunk)
    return written, digest.hexdigest()


class ProvisioningClient:
    def __init__(self, client: CustdClient, transport: AdminTransport) -> None:
        self._client = client
        self._transport = transport
        self.data_spaces = DataSpaceProvisioningClient(self)
        self.producers = ProducerProvisioningClient(self)
        self.reservations = ProducerReservationsClient(self)

    def request(
        self,
        method: str,
        path: str,
        payload: dict[str, Any] | None = None,
    ) -> TransportResult:
        result = self._transport(
            method,
            self._client.base_url + "/api/v1" + path,
            payload,
            self._client._headers(),
            self._client.timeout,
        )
        status = int(result["status"])
        if status >= 400:
            raise problem_request_error(status, result.get("body"), "provisioning")
        body = result.get("body")
        if status == 204 or body in (None, ""):
            return {}
        if isinstance(body, str):
            decoded = json.loads(body)
            return decoded if isinstance(decoded, dict) else {"items": decoded}
        if isinstance(body, dict):
            return body
        if isinstance(body, list):
            return {"items": body}
        return {}


class ReportingClient:
    def __init__(self, client: CustdClient, transport: AdminTransport) -> None:
        self._client = client
        self._transport = transport

    def dashboard(self, key: str) -> "DashboardDefinition":
        from ._wire import decode
        from .admin_operations import DashboardDefinition

        return decode(DashboardDefinition, self._request("GET", f"/reporting/dashboards/{quote_path(key)}"))

    def create_export(self, request: ReportExportCreateRequest) -> ReportExportJob:
        formats = request.get("formats")
        if not request.get("dashboardKey") or not isinstance(formats, list) or not 1 <= len(formats) <= 8:
            raise ValueError("custd: report export requires a dashboard key and 1 to 8 formats")
        return _decode_dto(ReportExportJob, self._request("POST", "/reporting/exports", dict(request)))

    def list_exports(self, limit: int = 50) -> ReportExportListResponse:
        if isinstance(limit, bool) or not isinstance(limit, int) or not 1 <= limit <= 100:
            raise ValueError("custd: report export limit must be between 1 and 100")
        response = self._request("GET", f"/reporting/exports?limit={limit}")
        exports = response.get("exports")
        if exports is not None and (
            not isinstance(exports, list) or not all(isinstance(item, dict) for item in exports)
        ):
            raise ValueError("custd: report export list response exports must be an array of objects")
        return _decode_dto(ReportExportListResponse, response)

    def get_export(self, export_id: str) -> ReportExportJob:
        validate_uuid(export_id, "export_id")
        return _decode_dto(ReportExportJob, self._request("GET", f"/reporting/exports/{quote_path(export_id)}"))

    def cancel_export(self, export_id: str, reason: str = "") -> ReportExportJob:
        validate_uuid(export_id, "export_id")
        path = f"/reporting/exports/{quote_path(export_id)}/cancel"
        return _decode_dto(ReportExportJob, self._request("POST", path, {"reason": reason}))

    def download_export(self, export_id: str, artifact_id: str) -> bytes:
        validate_uuid(export_id, "export_id")
        validate_uuid(artifact_id, "artifact_id")
        path = f"/reporting/exports/{quote_path(export_id)}/artifacts/{quote_path(artifact_id)}"
        value = self._request_value("GET", path)
        data = value.encode() if isinstance(value, str) else value
        if not isinstance(data, bytes):
            raise ValueError("custd: report export download response must be bytes")
        if len(data) > 64 * 1024 * 1024:
            raise ValueError("custd: report export download exceeds 64 MiB")
        return data

    def query(self, request: ReportingQueryRequest) -> RenderedWidgetData:
        widget = self._request("POST", "/reporting/query", dict(request))
        if contains_unsafe_reporting_trust_key(widget.get("trust")):
            raise ValueError("custd: unsafe reporting trust diagnostics")
        validate_rendered_widget_data(widget)
        return cast(RenderedWidgetData, widget)

    def subject_insight(self, request: SubjectInsightRequest) -> SubjectInsightResponse:
        validate_subject_insight_request(request)
        response = self._request("POST", "/reporting/insights/subject", dict(request))
        validate_subject_insight_response(response)
        return SubjectInsightResponse(data=response["data"])

    def receipt(self, receipt_uuid: str) -> PreparedDataStatus:
        validate_uuid(receipt_uuid, "receipt_uuid")
        return _decode_dto(PreparedDataStatus, self._request("GET", f"/processing/{quote_path(receipt_uuid)}"))

    def outputs(self) -> PreparedDataOutputList:
        return _decode_dto(PreparedDataOutputList, self._request("GET", "/reporting/outputs"))

    def output(self, output_uuid: str) -> PreparedDataOutputStatus:
        validate_uuid(output_uuid, "output_uuid")
        path = f"/reporting/outputs/{quote_path(output_uuid)}"
        return _decode_dto(PreparedDataOutputStatus, self._request("GET", path))

    def query_output(
        self, output_uuid: str, request: ReportingQueryRequest | Mapping[str, Any]
    ) -> PreparedDataOutputQueryResponse:
        """Render one query against a prepared data output; a caller's own query document is sent verbatim."""
        validate_uuid(output_uuid, "output_uuid")
        path = f"/reporting/outputs/{quote_path(output_uuid)}/query"
        response = self._request("POST", path, dict(request))
        validate_rendered_widget_data(response.get("data"))
        return _decode_dto(PreparedDataOutputQueryResponse, response)

    def list_dashboards(self) -> "ReportingDashboardCatalogueResponse":
        """List the dashboards the tenant can open."""
        from ._wire import decode
        from .analytics_reads import ReportingDashboardCatalogueResponse

        return decode(ReportingDashboardCatalogueResponse, self._request("GET", "/reporting/dashboards"))

    def generate_dashboard_data(
        self, body: "ReportingDashboardGenerationRequest"
    ) -> "ReportingDashboardGenerationResponse":
        """Generate, or reuse, the data snapshot behind one dashboard view."""
        from ._wire import decode
        from .analytics_reads import ReportingDashboardGenerationResponse

        response = self._request("POST", "/reporting/dashboard-data-generations", dict(body))
        return decode(ReportingDashboardGenerationResponse, response)

    def preview_draft(self, body: "ReportingDraftPreviewRequest") -> RenderedWidgetData:
        """Render one query against a pack definition that has not been published."""
        widget = self._request("POST", "/reporting/draft-preview", dict(body))
        if contains_unsafe_reporting_trust_key(widget.get("trust")):
            raise ValueError("custd: unsafe reporting trust diagnostics")
        validate_rendered_widget_data(widget)
        return cast(RenderedWidgetData, widget)

    def get_client_bootstrap(self) -> "PreparedDataBootstrapStatus":
        """Read where the tenant's client bootstrap stands and its next safe action."""
        from ._wire import decode
        from .analytics_reads import PreparedDataBootstrapStatus

        return decode(PreparedDataBootstrapStatus, self._request("GET", "/admin/bootstrap"))

    def submit_client_bootstrap(self, body: "PreparedDataBootstrapSubmitRequest") -> "PreparedDataBootstrapStatus":
        """Submit the client's bootstrap proofs; the server derives the tenant and state."""
        from ._wire import decode
        from .analytics_reads import PreparedDataBootstrapStatus

        return decode(PreparedDataBootstrapStatus, self._request("POST", "/admin/bootstrap", dict(body)))

    def _request(
        self,
        method: str,
        path: str,
        payload: dict[str, Any] | None = None,
    ) -> TransportResult:
        body = self._request_value(method, path, payload)
        if isinstance(body, str):
            decoded = json.loads(body)
            if not isinstance(decoded, dict):
                raise ValueError("custd: reporting response must be an object")
            return decoded
        if isinstance(body, dict):
            return body
        raise ValueError("custd: reporting response must be an object")

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
                "custd: reporting transport unavailable",
                code="transport_unavailable",
                retryability="bounded",
            ) from error
        status = int(result["status"])
        if status >= 400:
            raise problem_request_error(status, result.get("body"), "reporting")
        body = result.get("body")
        if status == 204 or body in (None, ""):
            return {}
        return body


class StorageMeasurementState(TypedDict):
    calculationVersion: int
    completenessState: str
    sourceWatermark: int


class DataSpaceUsageRow(TypedDict):
    slug: str
    companyName: str
    enabled: bool
    measuredAt: str
    measurementState: StorageMeasurementState
    retainedEventCount: int
    retainedLogicalBytes: int
    revokedAt: NotRequired[str]


class DataSpaceUsageSummary(TypedDict):
    """GET /api/v1/data-spaces/usage: retained storage per owned data space."""

    parentCompanySlug: str
    dataSpaceCount: int
    dataSpaces: list[DataSpaceUsageRow]
    measuredAt: str
    measurementState: StorageMeasurementState
    retainedEventCount: int
    retainedLogicalBytes: int


class ProducerProvisionPublicClient(TypedDict):
    """A provisioned producer without its secret."""

    clientId: str
    companySlug: str
    producerSlug: str
    allowedEnvironments: list[str]
    scopes: list[str]
    displayName: NotRequired[str]
    environment: NotRequired[str]


class ProducerProvisionListResponse(TypedDict):
    producers: list[ProducerProvisionPublicClient]


class ProducerProvisionRequest(TypedDict):
    companySlug: str
    producerSlug: str
    displayName: NotRequired[str]
    environment: NotRequired[str]
    allowedEnvironments: NotRequired[list[str]]
    scopes: NotRequired[list[str]]
    scopeTemplate: NotRequired[str]


class ProducerProvisionResponse(TypedDict):
    """A new producer's credentials; ``clientSecret`` is shown only this once."""

    clientId: str
    clientSecret: str
    companySlug: str
    producerSlug: str
    allowedEnvironments: list[str]
    scopes: list[str]
    tokenUrl: str
    audience: str
    baseUrl: str
    environment: NotRequired[str]


class ProducerSecretRotationResponse(TypedDict):
    """A producer's replacement secret, shown only this once."""

    clientId: str
    clientSecret: str
    tokenUrl: str
    audience: str
    baseUrl: str


class DataSpace(TypedDict):
    slug: str
    companyName: str
    parentCompanySlug: str
    enabled: bool


class DataSpaceCreateRequest(TypedDict):
    slug: str
    companyName: str


class DataSpaceListResponse(TypedDict):
    dataSpaces: list[DataSpace]
    entitlement: "DataSpaceEntitlementState"


class ProducerReservation(TypedDict):
    producerSlug: str
    parentCompanySlug: str
    childCompanySlug: str
    status: ProducerReservationStatus
    reservedAt: str
    expiresAt: str
    maxTtlSeconds: int
    claimedByClientId: NotRequired[str]


class ProducerReservationListResponse(TypedDict):
    reservations: list[ProducerReservation]


class ProducerReservationCreateRequest(TypedDict):
    producerSlug: str
    ttlSeconds: int


SCOPE_TEMPLATE_HOSTING_EMAIL_DELIVERY = "hosting-email-delivery"
"""Writes only hosting-email-delivery events into an owned data space, each verified with the keys
set by ``ProducerProvisioningClient.set_signing_keys``."""

SCOPE_TEMPLATE_HOSTING_PANEL_READ = "hosting-panel-read"
"""The read-only credential a parent's panel reads one data space's reporting and Site Insights with."""

DataSpaceErasureStatus = Literal["requested", "erasing", "completed", "failed"]


class DataSpaceErasure(TypedDict):
    """The erasure request for one data space and how far it has got."""

    requestUuid: str
    dataSpaceSlug: str
    parentCompanySlug: str
    status: DataSpaceErasureStatus
    requestedAt: str


class ProducerSigningKeysUpdateRequest(TypedDict):
    """One or two base64 Ed25519 public keys; two while a key is being rotated."""

    publicKeys: list[str]


class ProducerSigningKeys(TypedDict):
    """The public keys Custd now verifies a producer's signed events with."""

    clientId: str
    companySlug: str
    publicKeys: list[str]
    keyFingerprints: list[str]
    """The keys' sha256 fingerprints, ``sha256:<hex>``, in ``publicKeys`` order."""


DataSpaceSigningState = Literal["active", "revoked", "erased"]
SigningProducerState = Literal["ready", "awaiting_keys", "cancelled"]
DataSpaceSiteAdoptionStatus = Literal["adopted", "already_adopted"]


class SigningRefusalCounts(TypedDict):
    """The signed events ingest refused for one producer, by reason."""

    bindingNotReady: int
    bindingCancelled: int
    invalidSignature: int
    lastRefusedAt: NotRequired[str]


class SigningProducerStatus(TypedDict):
    """One signing producer of a data space: its keys and its refusals."""

    clientId: str
    state: SigningProducerState
    keyFingerprints: list[str]
    refusals: SigningRefusalCounts


class DataSpaceSigningStatus(TypedDict):
    """Whether a data space's signing producers can deliver events."""

    dataSpaceSlug: str
    parentCompanySlug: str
    state: DataSpaceSigningState
    erasedAt: NotRequired[str]
    producers: list[SigningProducerStatus]


class DataSpaceSiteAdoption(TypedDict):
    """The result of moving a parent's Site into an owned data space."""

    siteUuid: str
    dataSpaceSlug: str
    parentCompanySlug: str
    status: DataSpaceSiteAdoptionStatus
    movedRecords: int
    credentialClientIds: list[str]


class ProducerReservationClaimRequest(TypedDict):
    claimedByClientId: str


class DataSpaceProvisioningClient:
    def __init__(self, provisioning: ProvisioningClient) -> None:
        self._provisioning = provisioning

    def create(self, data_space: DataSpaceCreateRequest, parent_company_slug: str | None = None) -> DataSpace:
        path = "/data-spaces" + _parent_company_query(parent_company_slug)
        return _decode_dto(DataSpace, self._provisioning.request("POST", path, dict(data_space)))

    def list(self, parent_company_slug: str | None = None) -> DataSpaceListResponse:
        path = "/data-spaces" + _parent_company_query(parent_company_slug)
        return _decode_dto(DataSpaceListResponse, self._provisioning.request("GET", path))

    def revoke(self, slug: str, parent_company_slug: str | None = None) -> None:
        path = f"/data-spaces/{quote_path(slug)}" + _parent_company_query(parent_company_slug)
        self._provisioning.request("DELETE", path)

    def erase(self, slug: str, parent_company_slug: str | None = None) -> DataSpaceErasure:
        """Ask Custd to erase everything the data space holds; the answer is the accepted request."""
        path = f"/data-spaces/{quote_path(slug)}/erasure" + _parent_company_query(parent_company_slug)
        return _decode_dto(DataSpaceErasure, self._provisioning.request("POST", path))

    def get_erasure(self, slug: str, parent_company_slug: str | None = None) -> DataSpaceErasure:
        path = f"/data-spaces/{quote_path(slug)}/erasure" + _parent_company_query(parent_company_slug)
        return _decode_dto(DataSpaceErasure, self._provisioning.request("GET", path))

    def get_signing_status(self, slug: str, parent_company_slug: str | None = None) -> DataSpaceSigningStatus:
        """Read whether the data space's signing producers are ready and what ingest refused."""
        path = f"/data-spaces/{quote_path(slug)}/signing-status" + _parent_company_query(parent_company_slug)
        return _decode_dto(DataSpaceSigningStatus, self._provisioning.request("GET", path))

    def adopt_site(self, slug: str, site_uuid: str, parent_company_slug: str | None = None) -> DataSpaceSiteAdoption:
        """Move a parent's Site, with every record keyed to it, into the data space.

        Its credentials keep their client id and secret. Repeating it answers ``already_adopted``.
        """
        path = f"/data-spaces/{quote_path(slug)}/sites/{quote_path(site_uuid)}/adopt" + _parent_company_query(
            parent_company_slug
        )
        return _decode_dto(DataSpaceSiteAdoption, self._provisioning.request("POST", path))

    def get_usage(self, parent_company_slug: str | None = None) -> DataSpaceUsageSummary:
        """Report the retained storage of every data space the caller owns."""
        usage = self._provisioning.request("GET", "/data-spaces/usage" + _parent_company_query(parent_company_slug))
        usage["dataSpaces"] = usage.get("dataSpaces") or []
        return cast(DataSpaceUsageSummary, usage)


def _parent_company_query(parent_company_slug: str | None) -> str:
    """The parentCompanySlug a parent-company administrator names a data-space owner with."""
    return "?" + urllib.parse.urlencode({"parentCompanySlug": parent_company_slug}) if parent_company_slug else ""


class ProducerProvisioningClient:
    def __init__(self, provisioning: ProvisioningClient) -> None:
        self._provisioning = provisioning

    def provision(self, request: ProducerProvisionRequest) -> ProducerProvisionResponse:
        response = self._provisioning.request("POST", "/producer-provisioning", dict(request))
        return _decode_dto(ProducerProvisionResponse, response)

    def list(self, company_slug: str | None = None) -> ProducerProvisionListResponse:
        query = f"?companySlug={quote_path(company_slug)}" if company_slug else ""
        response = self._provisioning.request("GET", f"/producer-provisioning{query}")
        return _decode_dto(ProducerProvisionListResponse, response)

    def rotate_secret(self, client_id: str) -> ProducerSecretRotationResponse:
        path = f"/producer-provisioning/{quote_path(client_id)}/rotate-secret"
        return _decode_dto(ProducerSecretRotationResponse, self._provisioning.request("POST", path))

    def update_environment(self, client_id: str, environment: str) -> ProducerProvisionPublicClient:
        """Set the environment recorded for this producer.

        It is the authenticated default for events that do not declare their
        own, not a per-environment credential: one producer is expected to carry
        every environment unless an operator deliberately restricts it.
        """
        path = f"/producer-provisioning/{quote_path(client_id)}/environment"
        response = self._provisioning.request("PATCH", path, {"environment": environment})
        return _decode_dto(ProducerProvisionPublicClient, response)

    def set_signing_keys(self, client_id: str, request: ProducerSigningKeysUpdateRequest) -> ProducerSigningKeys:
        """Replace the public keys a hosting-email-delivery producer's events are verified with."""
        path = f"/producer-provisioning/{quote_path(client_id)}/signing-keys"
        return _decode_dto(ProducerSigningKeys, self._provisioning.request("PUT", path, dict(request)))

    def get_signing_keys(self, client_id: str) -> ProducerSigningKeys:
        """Read the public keys, and their fingerprints, a signing producer's events are verified with."""
        path = f"/producer-provisioning/{quote_path(client_id)}/signing-keys"
        return _decode_dto(ProducerSigningKeys, self._provisioning.request("GET", path))

    def get(self, client_id: str) -> ProducerProvisionPublicClient:
        producer = self._provisioning.request("GET", f"/producer-provisioning/{quote_path(client_id)}")
        producer["allowedEnvironments"] = producer.get("allowedEnvironments") or []
        producer["scopes"] = producer.get("scopes") or []
        return cast(ProducerProvisionPublicClient, producer)

    def revoke(self, client_id: str) -> None:
        self._provisioning.request("DELETE", f"/producer-provisioning/{quote_path(client_id)}")


class ProducerReservationsClient:
    """Reserve, claim and release producer slugs on one owned data space."""

    def __init__(self, provisioning: ProvisioningClient) -> None:
        self._provisioning = provisioning

    def reserve(
        self, data_space_slug: str, request: ProducerReservationCreateRequest, parent_company_slug: str | None = None
    ) -> ProducerReservation:
        path = _reservations_path(data_space_slug) + _parent_company_query(parent_company_slug)
        return cast(ProducerReservation, self._provisioning.request("POST", path, dict(request)))

    def list(self, data_space_slug: str, parent_company_slug: str | None = None) -> ProducerReservationListResponse:
        path = _reservations_path(data_space_slug) + _parent_company_query(parent_company_slug)
        reservations = self._provisioning.request("GET", path).get("reservations")
        return ProducerReservationListResponse(reservations=reservations or [])

    def claim(
        self,
        data_space_slug: str,
        producer_slug: str,
        request: ProducerReservationClaimRequest,
        parent_company_slug: str | None = None,
    ) -> ProducerReservation:
        path = f"{_reservations_path(data_space_slug)}/{quote_path(producer_slug)}/claim"
        path += _parent_company_query(parent_company_slug)
        return cast(ProducerReservation, self._provisioning.request("POST", path, dict(request)))

    def release(self, data_space_slug: str, producer_slug: str, parent_company_slug: str | None = None) -> None:
        path = f"{_reservations_path(data_space_slug)}/{quote_path(producer_slug)}"
        self._provisioning.request("DELETE", path + _parent_company_query(parent_company_slug))


def _reservations_path(data_space_slug: str) -> str:
    return f"/data-spaces/{quote_path(data_space_slug)}/producer-reservations"


class DataSpaceEntitlementState(TypedDict):
    enabled: bool
    maxActiveDataSpaces: int
    maxActiveProducersPerDataSpace: int
    activeDataSpaces: int


class DataSpaceEntitlementUpdateRequest(TypedDict):
    enabled: bool
    maxActiveDataSpaces: int
    maxActiveProducersPerDataSpace: int


class StorageLimit(TypedDict):
    includedStorageBytes: int
    purchasedStorageBytes: int
    warnPercent: int
    hardLimitEnabled: bool


StorageLimitUpdateRequest = StorageLimit


class TenantHistoricalCleanupStore(TypedDict):
    store: str
    retention_class: str
    deleted_count: int
    retained_exceptions_count: int


class TenantHistoricalCleanupWaiver(TypedDict):
    role: str
    timestamp: str


class TenantHistoricalCleanupReceipt(TypedDict):
    """The content-free receipt for a deleted tenant's historical cleanup, in its wire spelling."""

    company_id: int
    requested_by_kind: str
    requested_at: str
    completed_at: str
    final_state: OffboardingState
    per_store: list[TenantHistoricalCleanupStore]
    sha256: str
    waiver: NotRequired[TenantHistoricalCleanupWaiver]


class Tenant(TypedDict):
    companyId: int
    companyUuid: str
    slug: str
    companyName: str
    purpose: TenantPurpose
    enabled: bool
    autoCreateEnvironments: bool


class TenantListResponse(TypedDict):
    tenants: list[Tenant]


class TenantCreateRequest(TypedDict):
    slug: str
    companyName: str
    purpose: NotRequired[TenantPurpose]


class TenantAdminClient:
    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin

    def finalize(self, slug: str, company_id: int) -> None:
        """Permanently remove an already deleted tenant once its cleanup is finished."""
        self._admin.request("POST", _tenant_company_path(slug, "finalize", company_id))

    def historical_cleanup(
        self, slug: str, company_id: int, options: AdminRequestOptions | None = None
    ) -> TenantHistoricalCleanupReceipt:
        """Run a deleted tenant's cleanup; pass the same idempotency_key to retry one cleanup."""
        if not (options or {}).get("idempotency_key", "").strip():
            raise ValueError("custd: historical cleanup idempotency key is required")
        path = _tenant_company_path(slug, "historical-cleanup", company_id)
        receipt = dict(self._admin.request("POST", path, None, options))
        receipt["per_store"] = receipt.get("per_store") or []
        return cast(TenantHistoricalCleanupReceipt, receipt)

    def get_data_space_entitlement(self, slug: str) -> DataSpaceEntitlementState:
        return cast(
            DataSpaceEntitlementState,
            self._admin.request("GET", f"/tenants/{quote_path(slug)}/data-space-entitlement"),
        )

    def update_data_space_entitlement(
        self, slug: str, body: DataSpaceEntitlementUpdateRequest
    ) -> DataSpaceEntitlementState:
        path = f"/tenants/{quote_path(slug)}/data-space-entitlement"
        return cast(DataSpaceEntitlementState, self._admin.request("PUT", path, dict(body)))

    def update_storage_limit(self, slug: str, body: StorageLimitUpdateRequest) -> StorageLimit:
        path = f"/tenants/{quote_path(slug)}/storage-limit"
        return cast(StorageLimit, self._admin.request("PUT", path, dict(body)))

    def create(self, tenant: TenantCreateRequest) -> Tenant:
        return _decode_dto(Tenant, self._admin.request("POST", "/tenants", dict(tenant)))

    def list(self) -> TenantListResponse:
        return _decode_dto(TenantListResponse, self._admin.request("GET", "/tenants"))

    def get(self, slug: str) -> Tenant:
        return _decode_dto(Tenant, self._admin.request("GET", f"/tenants/{quote_path(slug)}"))

    def delete(self, slug: str) -> None:
        self._admin.request("DELETE", f"/tenants/{quote_path(slug)}")


def _tenant_company_path(slug: str, action: str, company_id: int) -> str:
    if isinstance(company_id, bool) or not isinstance(company_id, int) or company_id <= 0:
        raise ValueError("custd: company id must be a positive integer")
    return f"/tenants/{quote_path(slug)}/{action}?companyId={company_id}"


class OAuthClientCreateRequest(TypedDict):
    clientId: str
    companySlug: str
    profile: str
    scopes: list[str]
    environment: NotRequired[str]
    purposeProfile: NotRequired[str]
    siteUuid: NotRequired[str]


class OAuthClientLoginSetup(TypedDict):
    """What a person needs to sign in with a new interactive client, including the CLI command."""

    profileName: str
    clientId: str
    issuerUrl: str
    apiUrl: str
    audience: str
    scopes: list[str]
    redirectUris: list[str]
    configInitCommand: str


class OAuthClientCreateResponse(TypedDict):
    """A new OAuth client; ``clientSecret`` is shown only this once, and absent for a public client."""

    clientId: str
    companySlug: str
    profile: str
    scopes: list[str]
    clientSecret: NotRequired[str]
    purposeProfile: NotRequired[str]
    loginSetup: NotRequired[OAuthClientLoginSetup]


class OAuthClientAdminClient:
    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin

    def create(self, client: OAuthClientCreateRequest) -> OAuthClientCreateResponse:
        return _decode_dto(OAuthClientCreateResponse, self._admin.request("POST", "/oauth-clients", dict(client)))

    def list(self) -> "OAuthClientListResponse":
        from .admin_oauth_admissions import OAuthClientListResponse

        return _decode_dto(OAuthClientListResponse, self._admin.request("GET", "/oauth-clients"))

    def get(self, client_id: str) -> "OAuthClient":
        from .admin_oauth_admissions import OAuthClient

        return _decode_dto(OAuthClient, self._admin.request("GET", f"/oauth-clients/{quote_path(client_id)}"))

    def delete(self, client_id: str) -> None:
        self._admin.request("DELETE", f"/oauth-clients/{quote_path(client_id)}")

    def rotate_secret(self, client_id: str) -> "OAuthClientSecretResponse":
        from .admin_oauth_admissions import OAuthClientSecretResponse

        path = f"/oauth-clients/{quote_path(client_id)}/rotate-secret"
        return _decode_dto(OAuthClientSecretResponse, self._admin.request("POST", path))

    def update_scopes(
        self, client_id: str, request: "OAuthClientUpdateScopesRequest", options: AdminRequestOptions | None = None
    ) -> "OAuthClient":
        """Replace the client's scope profile; a tenant administrator reaches only its own clients."""
        from .admin_oauth_admissions import oauth_client_with_scopes

        path = f"/oauth-clients/{quote_path(client_id)}/scopes"
        return oauth_client_with_scopes(self._admin.request("PATCH", path, dict(request), options))

    def replace_unknown_secret(self, client_id: str, options: AdminRequestOptions) -> "OAuthClientSecretResponse":
        """Issue a new secret when the current one is lost. The Idempotency-Key makes a retry safe;
        the new secret is shown only this once."""
        key = options.get("idempotency_key")
        if not isinstance(key, str) or key.strip() == "":
            raise ValueError("custd: replace-unknown-secret idempotency key is required")
        path = f"/oauth-clients/{quote_path(client_id)}/replace-unknown-secret"
        return cast("OAuthClientSecretResponse", self._admin.request("POST", path, None, options))


class SiteAdminClient:
    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin

    def create(self, site: "AdminSiteCreateRequest") -> "AdminSiteCreateResponse":
        """Create a site; the answer carries its write key, which only create and rotate return."""
        from .admin_operations import AdminSiteCreateResponse

        return _decode_dto(AdminSiteCreateResponse, self._admin.request("POST", "/sites", dict(site)))

    def list(self) -> "AdminSiteListResponse":
        from .admin_operations import AdminSiteListResponse

        response = self._admin.request("GET", "/sites")
        sites = response.get("sites")
        if isinstance(sites, list):
            response = dict(response)
            response["sites"] = [public_admin_site(site) for site in sites]
        return _decode_dto(AdminSiteListResponse, response)

    def get(self, site_uuid: str) -> "AdminSite":
        from .admin_operations import AdminSite

        site = public_admin_site(self._admin.request("GET", f"/sites/{quote_path(site_uuid)}"))
        return _decode_dto(AdminSite, site)

    def delete(self, site_uuid: str) -> None:
        self._admin.request("DELETE", f"/sites/{quote_path(site_uuid)}")

    def rotate_write_key(self, site_uuid: str) -> "AdminSiteWriteKey":
        from .admin_operations import AdminSiteWriteKey

        path = f"/sites/{quote_path(site_uuid)}/rotate-write-key"
        return _decode_dto(AdminSiteWriteKey, self._admin.request("POST", path))

    def update(self, site_uuid: str, body: "AdminSiteUpdate") -> "AdminSite":
        """Change a site's settings."""
        from ._wire import decode, request
        from .admin_operations import AdminSite

        path = f"/api/v1/admin/sites/{quote_path(site_uuid)}"
        return decode(AdminSite, request(self._admin, "PATCH", path, body=dict(body)))

    def get_public_config(self, site_uuid: str) -> "PublicSiteConfig":
        """Read the public collector configuration a site's pages load."""
        from ._wire import decode, request
        from .admin_operations import PublicSiteConfig

        path = f"/api/v1/sites/{quote_path(site_uuid)}/config"
        return decode(PublicSiteConfig, request(self._admin, "GET", path))


def validate_measurement_results(results: Any, submitted_rows: int) -> None:
    if not isinstance(results, list) or len(results) != submitted_rows:
        count = len(results) if isinstance(results, list) else 0
        raise RequestError(
            f"custd: measurement result count {count} does not match submitted row count {submitted_rows}"
        )
    for index, result in enumerate(results):
        if isinstance(result, dict) and result.get("success") is True and not result.get("observationUuid"):
            raise RequestError(f"custd: measurement result {index} missing observationUuid")


def public_admin_site(site: TransportResult) -> TransportResult:
    safe_site = dict(site)
    safe_site.pop("writeKey", None)
    return safe_site


def redacted_provisioned_producer(credentials: dict[str, Any]) -> dict[str, Any]:
    """Return the display-safe view of a provisioned producer bundle.

    Omits the client secret so the result is safe to render on dashboards.
    """
    return {key: value for key, value in credentials.items() if key != "clientSecret"}


BATCH_REJECTION_LIST_LIMIT = 10


def acknowledged_event_uuids(results: Any, events: list[EventEnvelope]) -> set[str]:
    if not isinstance(results, list):
        return set()
    expected = {
        event["eventUuid"] for event in events if isinstance(event.get("eventUuid"), str) and event["eventUuid"]
    }
    acknowledged: set[str] = set()
    for result in results:
        if not isinstance(result, dict) or result.get("success") is not True:
            continue
        event_uuid = result.get("eventUuid") or result.get("event_uuid")
        if isinstance(event_uuid, str) and event_uuid in expected:
            acknowledged.add(event_uuid)
    return acknowledged


def problem_error_message(status: int, body: Any) -> str:
    """Render an HTTP error from an RFC 9457 problem+json body.

    Falls back to a status-only message when the body is absent or is not a
    problem document (e.g. a plain-text upstream error).
    """
    problem = parse_problem(body)
    if problem is None:
        return f"custd: request failed with status {status}"
    title = str(problem.get("title") or "request failed")
    detail = problem.get("detail")
    suffix = f": {detail}" if detail else ""
    return f"custd: {title} (status {status}){suffix}"


def parse_problem(body: Any) -> dict[str, Any] | None:
    if not (isinstance(body, str) and body):
        return None
    try:
        decoded = json.loads(body)
    except json.JSONDecodeError:
        return None
    if isinstance(decoded, dict) and ("title" in decoded or "type" in decoded):
        return decoded
    return None


def batch_rejection_message(status: int, results: Any) -> str | None:
    """Return an error message when a batch carries failed per-event results.

    Each result is {eventUuid|event_uuid, success, status, error?} where error
    is an RFC 9457 problem object (or a plain string). Returns None when every
    result succeeded.
    """
    if not isinstance(results, list):
        return None
    failed = [r for r in results if isinstance(r, dict) and r.get("success") is False]
    if not failed:
        return None

    parts = [describe_failed_result(result, status) for result in failed[:BATCH_REJECTION_LIST_LIMIT]]
    if len(failed) > BATCH_REJECTION_LIST_LIMIT:
        parts.append(f"+{len(failed) - BATCH_REJECTION_LIST_LIMIT} more")
    return f"custd: batch rejected {len(failed)} of {len(results)} event(s): {'; '.join(parts)}"


def describe_failed_result(result: dict[str, Any], status: int) -> str:
    event_uuid = result.get("eventUuid") or result.get("event_uuid") or "unknown"
    result_status = result.get("status") or status
    reason = describe_result_error(result.get("error"))
    return f"{event_uuid} [status {result_status}] {reason}"


def describe_result_error(error: Any) -> str:
    if isinstance(error, dict):
        title = error.get("title")
        detail = error.get("detail")
        parts = [str(value) for value in (title, detail) if value]
        if parts:
            return ": ".join(parts)
    if isinstance(error, str) and error:
        return error
    return "no error detail"


def validate_event(event: EventEnvelope) -> None:
    missing: list[str] = []
    for field in (
        "eventUuid",
        "eventTypeSlug",
        "schemaVersion",
        "timestamp",
        "sessionId",
        "anonymousId",
        "companySlug",
        "context",
        "payload",
    ):
        if event.get(field) in (None, ""):
            missing.append(field)

    raw_context = event.get("context")
    context = raw_context if isinstance(raw_context, dict) else {}
    raw_device = context.get("device")
    device = raw_device if isinstance(raw_device, dict) else {}
    if not device.get("type"):
        missing.append("context.device.type")

    if missing:
        raise ValidationError(f"custd: missing required fields: {', '.join(missing)}")
    validate_environment_value(str(event.get("environment") or ""))
    validate_event_labels(event)


def validate_event_labels(event: EventEnvelope) -> None:
    if "resolvedLabels" in event or "vocabularyFingerprint" in event:
        raise ValidationError("custd: server-owned label fields are not accepted")
    if "labels" not in event:
        return
    labels = event["labels"]
    if not isinstance(labels, dict) or not all(
        isinstance(key, str) and isinstance(value, str) for key, value in labels.items()
    ):
        raise ValidationError("custd: labels must be an object of strings")
    if len(labels) > 16:
        raise ValidationError("custd: labels may contain at most 16 entries")
    for key, value in labels.items():
        if len(key.encode("utf-8")) > 64 or EVENT_LABEL_KEY_PATTERN.fullmatch(key) is None or key.startswith("custd."):
            raise ValidationError(f"custd: labels.{key} has an invalid key")
        if not value or value != value.strip() or len(value.encode("utf-8")) > 128:
            raise ValidationError(f"custd: labels.{key} has an invalid value")


ENVIRONMENT_LABEL_KEY = "custd.environment"
UNCLASSIFIED_ENVIRONMENT = "unclassified"
ENVIRONMENT_VALUE_PATTERN = re.compile(r"^[a-z][a-z0-9-]{0,31}$")


def validate_environment_value(value: str) -> None:
    """Check a declared environment against the contract ingest applies."""
    if not value:
        return
    if value != value.strip() or ENVIRONMENT_VALUE_PATTERN.fullmatch(value) is None:
        raise ValidationError(
            f"custd: environment {value!r} must be lowercase letters, digits and hyphens, "
            "at most 32 characters"
        )
    if value == UNCLASSIFIED_ENVIRONMENT:
        raise ValidationError("custd: environment 'unclassified' is reserved")


def apply_environment_label(event: EventEnvelope, client_environment: str | None) -> None:
    """Stamp the effective environment onto the envelope labels.

    An event-level declaration wins over the client default, and a label the
    caller already set is never overwritten. This runs after label validation
    because the label key is reserved: callers declare the environment through
    the field, not through labels.
    """
    effective = str(event.get("environment") or client_environment or "")
    if not effective:
        return
    labels = event.get("labels")
    if not isinstance(labels, dict):
        labels = {}
        event["labels"] = labels
    labels.setdefault(ENVIRONMENT_LABEL_KEY, effective)


def prepare_event(event: EventEnvelope) -> EventEnvelope:
    prepared = dict(event)
    prepared["eventUuid"] = prepared.get("eventUuid") or str(uuid.uuid4())
    prepared["sessionId"] = prepared.get("sessionId") or str(uuid.uuid4())
    prepared["anonymousId"] = prepared.get("anonymousId") or str(uuid.uuid4())
    return prepared


def create_dogfood_event(input: dict[str, Any]) -> EventEnvelope:
    missing = [
        name
        for name in (
            "eventTypeSlug",
            "schemaVersion",
            "companySlug",
            "sourceSystem",
            "sourceCompany",
            "environment",
        )
        if input.get(name) in (None, "")
    ]
    if missing:
        raise ValidationError(f"custd: missing dogfood fields: {', '.join(missing)}")

    payload = sanitize_dogfood_payload(dict(input.get("payload") or {}))
    payload["sourceSystem"] = input["sourceSystem"]
    payload["sourceCompany"] = input["sourceCompany"]
    payload["environment"] = input["environment"]
    payload["schemaVersion"] = input["schemaVersion"]
    if input.get("correlationId"):
        payload["correlationId"] = input["correlationId"]

    return prepare_event(
        {
            "eventTypeSlug": input["eventTypeSlug"],
            "schemaVersion": input["schemaVersion"],
            "timestamp": iso_now(),
            "companySlug": input["companySlug"],
            "context": {"device": {"type": "server"}},
            "payload": payload,
        }
    )


DOGFOOD_PROTECTED_PAYLOAD_FIELDS = {
    "sourcesystem",
    "sourcecompany",
    "environment",
    "schemaversion",
    "correlationid",
}

DOGFOOD_FORBIDDEN_PAYLOAD_FIELDS = {
    "apikey",
    "authorization",
    "password",
    "rawapiresponse",
    "token",
    "signedurl",
    "rawprompt",
    "oauthcode",
    "devicesecret",
    "providercredential",
}

REPORTING_FORBIDDEN_TRUST_KEYS = {
    "rawpayload",
    "sql",
    "token",
    "secret",
    "stack",
    "email",
    "ipaddress",
    "hostname",
    "orderid",
    "carttoken",
}


def sanitize_dogfood_payload(payload: dict[str, Any]) -> dict[str, Any]:
    cleaned: dict[str, Any] = {}
    for key, value in payload.items():
        if not dogfood_payload_field_allowed(key):
            continue
        if isinstance(value, dict):
            cleaned[key] = sanitize_dogfood_payload(value)
        else:
            cleaned[key] = value
    return cleaned


def dogfood_payload_field_allowed(key: str) -> bool:
    normalized = key.lower().replace("_", "")
    return normalized not in DOGFOOD_PROTECTED_PAYLOAD_FIELDS and normalized not in DOGFOOD_FORBIDDEN_PAYLOAD_FIELDS


def validate_subject_insight_request(request: Mapping[str, Any]) -> None:
    allowed = {"template", "subject", "from", "to", "rangeDays"}
    if set(request) - allowed:
        raise ValueError("custd: subject insight request contains unsupported fields")
    template = request.get("template")
    if not isinstance(template, str) or re.fullmatch(r"[a-z][a-z0-9_]{0,127}", template) is None:
        raise ValueError("custd: subject insight template is required")
    if not isinstance(request.get("subject"), str) or not request["subject"].strip() or len(request["subject"]) > 512:
        raise ValueError("custd: subject insight subject is required")
    has_range_days = "rangeDays" in request
    has_from = "from" in request
    has_to = "to" in request
    if has_range_days == (has_from or has_to) or has_from != has_to:
        raise ValueError("custd: subject insight requires rangeDays or both from and to")
    if has_range_days and (
        not isinstance(request["rangeDays"], int)
        or isinstance(request["rangeDays"], bool)
        or not 1 <= request["rangeDays"] <= 366
    ):
        raise ValueError("custd: subject insight rangeDays must be between 1 and 366")
    if has_from:
        try:
            start = _parse_rfc3339(request["from"])
            end = _parse_rfc3339(request["to"])
        except (TypeError, ValueError) as error:
            raise ValueError("custd: subject insight from and to must be RFC3339 timestamps") from error
        if end <= start or (end - start).total_seconds() > 366 * 86400:
            raise ValueError("custd: subject insight date range must be positive and at most 366 days")


def validate_subject_insight_response(response: dict[str, Any]) -> None:
    data = response.get("data")
    try:
        validate_rendered_widget_data(data)
    except ValueError as error:
        if str(error) == "custd: unsafe reporting trust diagnostics":
            raise
        raise ValueError("custd: subject insight response contains malformed rendered widget data") from error


def validate_rendered_widget_data(data: Any) -> None:
    required = {"buckets", "value", "queryDurationMs", "snapshotAgeMs", "eventLagP95Ms"}
    if not isinstance(data, dict) or not required.issubset(data):
        raise ValueError("custd: rendered widget data is malformed")
    # The server encodes an empty bucket list as JSON null; it decodes as empty.
    if data["buckets"] is None:
        data["buckets"] = []
    if not isinstance(data["buckets"], list) or not _is_rendered_metric_value(data["value"]):
        raise ValueError("custd: rendered widget data is malformed")
    if not all(_is_rendered_widget_bucket(bucket) for bucket in data["buckets"]):
        raise ValueError("custd: rendered widget data is malformed")
    if not all(
        isinstance(data[key], int) and not isinstance(data[key], bool)
        for key in ("queryDurationMs", "snapshotAgeMs", "eventLagP95Ms")
    ):
        raise ValueError("custd: rendered widget data is malformed")
    if contains_unsafe_reporting_trust_key(data.get("trust")):
        raise ValueError("custd: unsafe reporting trust diagnostics")
    if not _has_valid_optional_rendered_fields(data):
        raise ValueError("custd: rendered widget data is malformed")


def _is_rendered_metric_value(value: Any) -> bool:
    required = {"value", "unit", "sampleCount", "dataSufficiency", "complete"}
    return (
        isinstance(value, dict)
        and required.issubset(value)
        and isinstance(value["value"], int | float)
        and not isinstance(value["value"], bool)
        and isinstance(value["unit"], str)
        and isinstance(value["sampleCount"], int)
        and not isinstance(value["sampleCount"], bool)
        and isinstance(value["dataSufficiency"], str)
        and isinstance(value["complete"], bool)
    )


def _is_rendered_widget_bucket(value: Any) -> bool:
    required = {"date", "value", "source", "queryDurationMs"}
    return (
        isinstance(value, dict)
        and required.issubset(value)
        and isinstance(value["date"], str)
        and isinstance(value["source"], str)
        and isinstance(value["queryDurationMs"], int)
        and not isinstance(value["queryDurationMs"], bool)
        and _is_rendered_metric_value(value["value"])
        and ("parquetUriCount" not in value or _is_int(value["parquetUriCount"]))
        and ("message" not in value or isinstance(value["message"], str))
        and ("secondary" not in value or _is_rendered_metric_value(value["secondary"]))
    )


def _parse_rfc3339(value: Any) -> datetime:
    pattern = r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})"
    if not isinstance(value, str) or re.fullmatch(pattern, value) is None:
        raise ValueError("not RFC3339")
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        raise ValueError("timezone required")
    return parsed


def _is_int(value: Any) -> bool:
    return isinstance(value, int) and not isinstance(value, bool)


def _has_valid_optional_rendered_fields(data: dict[str, Any]) -> bool:
    metric_fields = ("delta",)
    string_fields = ("deltaLabel", "secondaryLabel")
    int_fields = ("parquetUriCount",)
    if any(field in data and not _is_rendered_metric_value(data[field]) for field in metric_fields):
        return False
    if any(field in data and not isinstance(data[field], str) for field in string_fields):
        return False
    if any(field in data and not _is_int(data[field]) for field in int_fields):
        return False
    if "deltaPercent" in data and (
        not isinstance(data["deltaPercent"], int | float) or isinstance(data["deltaPercent"], bool)
    ):
        return False
    if "warnings" in data and (
        not isinstance(data["warnings"], list) or not all(isinstance(item, str) for item in data["warnings"])
    ):
        return False
    if "sources" in data and (
        not isinstance(data["sources"], list) or not all(_is_reporting_source(item) for item in data["sources"])
    ):
        return False
    if "metadata" in data and not _is_reporting_metadata(data["metadata"]):
        return False
    return "trust" not in data or _is_reporting_trust(data["trust"])


def _is_reporting_metadata(value: Any) -> bool:
    required_strings = ("resolvedTemplate",)
    required_ints = ("effectiveMaxRows", "returnedRows", "returnedBuckets", "coveredWindows")
    return (
        isinstance(value, dict)
        and all(isinstance(value.get(field), str) for field in required_strings)
        and all(_is_int(value.get(field)) for field in required_ints)
        and all(field not in value or isinstance(value[field], str) for field in ("rangeStart", "rangeEnd"))
    )


def _is_reporting_source(value: Any) -> bool:
    return (
        isinstance(value, dict)
        and isinstance(value.get("kind"), str)
        and _is_int(value.get("count"))
        and isinstance(value.get("completeness"), str)
        and all(field not in value or isinstance(value[field], str) for field in ("coverageStart", "coverageEnd"))
    )


def _is_reporting_trust(value: Any) -> bool:
    required_strings = (
        "status",
        "dataFreshness",
        "retryability",
        "rollupState",
        "coverage",
        "captureState",
        "consentState",
        "exportState",
    )
    optional_strings = (
        "lastExport",
        "schemaVersion",
        "contractVersion",
        "permissionClass",
        "partialReason",
        "unavailableReason",
    )
    return (
        isinstance(value, dict)
        and all(isinstance(value.get(field), str) for field in required_strings)
        and _is_reporting_next_action_hint(value["nextAction"])
        and all(field not in value or isinstance(value[field], str) for field in optional_strings)
        and (
            "queryWarnings" not in value
            or isinstance(value["queryWarnings"], list)
            and all(isinstance(item, str) for item in value["queryWarnings"])
        )
    )


def _is_reporting_next_action_hint(value: Any) -> bool:
    return (
        isinstance(value, dict)
        and isinstance(value.get("action"), str)
        and ("pollAfterSeconds" not in value or _is_int(value["pollAfterSeconds"]))
        and ("maxRetries" not in value or _is_int(value["maxRetries"]))
    )


def contains_unsafe_reporting_trust_key(value: Any) -> bool:
    if isinstance(value, list):
        return any(contains_unsafe_reporting_trust_key(item) for item in value)
    if not isinstance(value, dict):
        return False
    return any(
        str(key).lower() in REPORTING_FORBIDDEN_TRUST_KEYS or contains_unsafe_reporting_trust_key(child)
        for key, child in value.items()
    )


def iso_now() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def assert_secure_or_local_http(raw_url: str, field: str) -> None:
    parsed = urllib.parse.urlparse(raw_url)
    if parsed.scheme == "https":
        return
    if parsed.scheme == "http" and parsed.hostname in (
        "localhost",
        "127.0.0.1",
        "::1",
        "host.docker.internal",
    ):
        return
    raise ValueError(f"custd: {field} must use https unless it targets localhost")


def fetch_oauth_token(token_url: str, form: dict[str, Any], timeout: float) -> dict[str, Any]:
    client_id = str(form.get("client_id", ""))
    client_secret = str(form.get("client_secret", ""))
    basic = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode("ascii")
    body = urllib.parse.urlencode({
        key: value for key, value in form.items() if value and key not in {"client_id", "client_secret"}
    }).encode("utf-8")
    request = urllib.request.Request(
        token_url,
        data=body,
        headers={
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": f"Basic {basic}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            decoded = json.loads(response.read().decode("utf-8"))
            return decoded if isinstance(decoded, dict) else {}
    except urllib.error.HTTPError as err:
        raise RequestError(f"custd: token request failed with status {err.code}") from err
    except urllib.error.URLError as err:
        raise RetryableError(f"custd: token request failed: {err}") from err


def normalize_retry(retry: dict[str, Any] | None) -> dict[str, Any]:
    retry = retry or {}
    return {
        "max_attempts": int(retry.get("max_attempts", 3)),
        "base_delay_ms": int(retry.get("base_delay_ms", 200)),
        "max_delay_ms": int(retry.get("max_delay_ms", 2000)),
        "jitter": float(retry.get("jitter", 0.2)),
        "retry_statuses": tuple(retry.get("retry_statuses", DEFAULT_RETRY_STATUSES)),
    }


def backoff_delay(retry: dict[str, Any], attempt: int) -> int:
    base = retry["base_delay_ms"]
    capped = min(base * (2 ** (attempt - 1)), retry["max_delay_ms"])
    jitter = capped * retry["jitter"] * (random.random() * 2 - 1)
    return max(0, int(capped + jitter))


def normalize_compression(compression: dict[str, Any] | None) -> dict[str, Any]:
    compression = compression or {}
    return {
        "enabled": bool(compression.get("enabled", True)),
        "threshold_bytes": int(compression.get("threshold_bytes", DEFAULT_COMPRESSION_THRESHOLD_BYTES)),
    }


def make_default_transport(compression: dict[str, Any]) -> Transport:
    def transport(
        url: str,
        event: TransportBody,
        headers: dict[str, str],
        timeout: float,
    ) -> TransportResult:
        # A raw upload is sent verbatim; only JSON events are compressed.
        if isinstance(event, bytes | bytearray):
            body = bytes(event)
        else:
            body = json.dumps(event).encode("utf-8")
            if compression["enabled"] and len(body) >= compression["threshold_bytes"]:
                body = gzip.compress(body)
                headers = {**headers, "Content-Encoding": "gzip"}
        request = urllib.request.Request(url, data=body, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                return {
                    "status": response.status,
                    "body": response.read().decode("utf-8"),
                    "headers": dict(response.headers.items()),
                }
        except urllib.error.HTTPError as err:
            return {"status": err.code, "body": err.read().decode("utf-8"), "headers": dict(err.headers.items())}
        except urllib.error.URLError as err:
            raise RetryableError(f"custd: request failed: {err}") from err

    return transport


default_transport = make_default_transport(normalize_compression(None))


def _send_admin(
    method: str,
    url: str,
    payload: dict[str, Any] | bytes | None,
    headers: dict[str, str],
    timeout: float,
) -> TransportResult:
    data = None
    if isinstance(payload, bytes):
        data = payload
    elif payload is not None:
        data = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            archive_media = method == "GET" and "/api/v1/app/messages/" in url and "/media/" in url
            is_binary = archive_media or "/artifacts/" in url or (
                method == "GET" and url.endswith("/api/v1/app/profile/photo")
            )
            limit = 10 * 1024 * 1024 if archive_media else 64 * 1024 * 1024
            declared = response.headers.get("Content-Length") if is_binary else None
            if declared is not None and declared.isdigit() and int(declared) > limit:
                raise RequestError(f"custd: binary admin response exceeds {limit} bytes")
            raw = response.read(limit + 1) if is_binary else response.read()
            if is_binary and len(raw) > limit:
                raise RequestError(f"custd: binary admin response exceeds {limit} bytes")
            body = raw if is_binary else raw.decode("utf-8")
            response_headers = {str(key): str(value) for key, value in response.headers.items()}
            return {"status": response.status, "body": body, "headers": response_headers}
    except urllib.error.HTTPError as err:
        return {
            "status": err.code,
            "body": err.read().decode("utf-8"),
            "headers": {str(key): str(value) for key, value in err.headers.items()},
        }
    except urllib.error.URLError as err:
        raise RetryableError(f"custd: admin request failed: {err}") from err


# Every answer records its request ID, so a refusal built from it carries the ID to quote.
default_admin_transport = _recording_admin_transport(_send_admin)


def default_admin_stream_transport(method: str, url: str, headers: dict[str, str], timeout: float) -> AdminStream:
    request = urllib.request.Request(url, headers=headers, method=method)
    try:
        response = urllib.request.urlopen(request, timeout=timeout)
    except urllib.error.HTTPError as err:
        return AdminStream(err.code, {key.lower(): value for key, value in err.headers.items()}, err)
    except urllib.error.URLError as err:
        raise RetryableError(f"custd: admin request failed: {err}") from err
    return AdminStream(response.status, {key.lower(): value for key, value in response.headers.items()}, response)


class _KeepRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *_: object) -> None:
        return None


_NO_REDIRECT_OPENER = urllib.request.build_opener(_KeepRedirect)


def _send_without_redirect(
    method: str,
    url: str,
    payload: dict[str, Any] | bytes | None,
    headers: dict[str, str],
    timeout: float,
) -> TransportResult:
    """Send one request and return a redirect as the answer instead of following it.

    A credential in the headers then never reaches another address, and the redirect's own
    headers (such as Set-Cookie) stay readable.
    """
    data = payload if isinstance(payload, bytes) else None if payload is None else json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with _NO_REDIRECT_OPENER.open(request, timeout=timeout) as response:
            body = response.read().decode("utf-8")
            return {"status": response.status, "body": body, "headers": dict(response.headers.items())}
    except urllib.error.HTTPError as err:
        return {"status": err.code, "body": err.read().decode("utf-8"), "headers": dict(err.headers.items())}
    except urllib.error.URLError as err:
        raise RetryableError(f"custd: request failed: {err}") from err


no_redirect_transport = _recording_admin_transport(_send_without_redirect)


def quote_path(value: str) -> str:
    return urllib.parse.quote(value, safe="")
