import gzip
import json
import random
import re
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
from collections.abc import Callable, Mapping
from datetime import datetime
from typing import Any, NotRequired, TypedDict

INGEST_ENDPOINT = "/api/v1/events"
INGEST_BATCH_ENDPOINT = "/api/v1/events/batch"
DEFAULT_RETRY_STATUSES = (408, 429, 500, 502, 503, 504)
DEFAULT_COMPRESSION_THRESHOLD_BYTES = 1024

EventEnvelope = dict[str, Any]
TransportResult = dict[str, Any]
Transport = Callable[[str, EventEnvelope, dict[str, str], float], TransportResult]
AdminTransport = Callable[[str, str, dict[str, Any] | None, dict[str, str], float], TransportResult]
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


class RenderedMetricValue(TypedDict):
    value: float
    unit: str
    sampleCount: int
    dataSufficiency: str
    complete: bool
    truncated: NotRequired[bool]


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
    status: str
    dataFreshness: str
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


class SubjectInsightResponse(TypedDict):
    data: RenderedWidgetData


class PreparedDataStatus(TypedDict):
    tenantSlug: str
    processingState: str
    availability: str
    observedAt: str
    provenance: dict[str, Any]
    retryability: str
    nextAction: dict[str, Any]
    watermark: NotRequired[str]
    warnings: NotRequired[list[dict[str, str]] | None]


class PreparedDataOutputList(TypedDict):
    outputs: list[PreparedDataStatus] | None


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


class RequestError(RuntimeError):
    pass


class MemoryQueueStorage:
    def __init__(self) -> None:
        self._events: list[EventEnvelope] = []

    def load(self) -> list[EventEnvelope]:
        return [dict(event) for event in self._events]

    def save(self, events: list[EventEnvelope]) -> None:
        self._events = [dict(event) for event in events]

    def clear(self) -> None:
        self._events = []


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
        transport: Transport | None = None,
        admin_transport: AdminTransport | None = None,
        timeout: float = 15,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        assert_secure_or_local_http(self.base_url, "base_url")
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
        self.queue_enabled = bool((queue or {}).get("enabled", batch is not None))
        self.queue_storage = (queue or {}).get("storage") or MemoryQueueStorage()
        self.queue: list[EventEnvelope] = self.queue_storage.load() if self.queue_enabled else []
        self.max_queue_size = int((queue or {}).get("max_queue_size", 1000))
        self.compression = normalize_compression(compression)
        self.transport = transport or make_default_transport(self.compression)
        self.admin = AdminClient(self, admin_transport or default_admin_transport)
        self.provisioning = ProvisioningClient(self, admin_transport or default_admin_transport)
        self.reporting = ReportingClient(self, admin_transport or default_admin_transport)
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
        return self._send_with_retry(prepared)

    def track(self, event: EventEnvelope) -> TransportResult | None:
        prepared = prepare_event(event)
        validate_event(prepared)
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
        self.queue = self.queue[max_batch_size:]

        try:
            self._send_batch_with_retry(batch)
        except Exception:
            self.queue = batch + self.queue
            self.queue_storage.save(self.queue)
            raise

        self.queue_storage.save(self.queue)

    def close(self) -> None:
        self.flush()

    def _enqueue(self, event: EventEnvelope) -> None:
        if len(self.queue) >= self.max_queue_size:
            self.queue.pop(0)
        self.queue.append(event)
        self.queue_storage.save(self.queue)

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
            raise RequestError(problem_error_message(status, result.get("body")))
        return result

    def _send_batch(self, events: list[EventEnvelope]) -> TransportResult:
        result = self.transport(self._batch_endpoint(), {"events": events}, self._headers(), self.timeout)
        status = int(result["status"])
        if status in self.retry["retry_statuses"]:
            raise RetryableError(f"custd: retryable status {status}")
        if status >= 400:
            raise RequestError(problem_error_message(status, result.get("body")))

        body = result.get("body")
        if not (isinstance(body, str) and body):
            return result
        decoded = json.loads(body)
        if isinstance(decoded, dict):
            failure = batch_rejection_message(status, decoded.get("results"))
            if failure is not None:
                raise RequestError(failure)
        return result

    def _endpoint(self) -> str:
        return self.base_url + INGEST_ENDPOINT

    def _batch_endpoint(self) -> str:
        return self.base_url + INGEST_BATCH_ENDPOINT

    def _headers(self) -> dict[str, str]:
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self._token_provider()}",
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


class AdminClient:
    def __init__(self, client: CustdClient, transport: AdminTransport) -> None:
        self._client = client
        self._transport = transport
        self.tenants = TenantAdminClient(self)
        self.oauth_clients = OAuthClientAdminClient(self)
        self.sites = SiteAdminClient(self)
        self.schemas = SchemaAdminClient(self)
        self.measurement = MeasurementAdminClient(self)

    def request(
        self,
        method: str,
        path: str,
        payload: dict[str, Any] | None = None,
    ) -> TransportResult:
        result = self._transport(
            method,
            self._client.base_url + "/api/v1/admin" + path,
            payload,
            self._client._headers(),
            self._client.timeout,
        )
        status = int(result["status"])
        if status >= 400:
            raise RequestError(f"custd: admin request failed with status {status}")
        body = result.get("body")
        if status == 204 or body in (None, ""):
            return {}
        if isinstance(body, str):
            decoded = json.loads(body)
            return decoded if isinstance(decoded, dict) else {}
        if isinstance(body, dict):
            return body
        return {}


class ProvisioningClient:
    def __init__(self, client: CustdClient, transport: AdminTransport) -> None:
        self._client = client
        self._transport = transport
        self.data_spaces = DataSpaceProvisioningClient(self)
        self.producers = ProducerProvisioningClient(self)

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
            raise RequestError(f"custd: provisioning request failed with status {status}")
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

    def dashboard(self, key: str) -> TransportResult:
        return self._request("GET", f"/reporting/dashboards/{quote_path(key)}")

    def query(self, request: dict[str, Any]) -> TransportResult:
        widget = self._request("POST", "/reporting/query", request)
        if contains_unsafe_reporting_trust_key(widget.get("trust")):
            raise ValueError("custd: unsafe reporting trust diagnostics")
        return widget

    def subject_insight(self, request: SubjectInsightRequest) -> SubjectInsightResponse:
        validate_subject_insight_request(request)
        response = self._request("POST", "/reporting/insights/subject", dict(request))
        validate_subject_insight_response(response)
        return SubjectInsightResponse(data=response["data"])

    def receipt(self, receipt_uuid: str) -> PreparedDataStatus:
        validate_uuid(receipt_uuid, "receipt_uuid")
        return self._request("GET", f"/processing/{quote_path(receipt_uuid)}")  # type: ignore[return-value]

    def outputs(self) -> PreparedDataOutputList:
        response = self._request("GET", "/reporting/outputs")
        return PreparedDataOutputList(outputs=response.get("outputs"))

    def output(self, output_uuid: str) -> PreparedDataStatus:
        validate_uuid(output_uuid, "output_uuid")
        return self._request("GET", f"/reporting/outputs/{quote_path(output_uuid)}")  # type: ignore[return-value]

    def query_output(self, output_uuid: str, request: dict[str, Any]) -> TransportResult:
        validate_uuid(output_uuid, "output_uuid")
        return self._request("POST", f"/reporting/outputs/{quote_path(output_uuid)}/query", request)

    def _request(
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
            raise RequestError(f"custd: reporting request failed with status {status}")
        body = result.get("body")
        if status == 204 or body in (None, ""):
            return {}
        if isinstance(body, str):
            decoded = json.loads(body)
            if not isinstance(decoded, dict):
                raise ValueError("custd: reporting response must be an object")
            return decoded
        if isinstance(body, dict):
            return body
        raise ValueError("custd: reporting response must be an object")


class DataSpaceProvisioningClient:
    def __init__(self, provisioning: ProvisioningClient) -> None:
        self._provisioning = provisioning

    def create(self, data_space: dict[str, Any]) -> TransportResult:
        return self._provisioning.request("POST", "/data-spaces", data_space)

    def list(self) -> TransportResult:
        return self._provisioning.request("GET", "/data-spaces")

    def revoke(self, slug: str) -> None:
        self._provisioning.request("DELETE", f"/data-spaces/{quote_path(slug)}")


class ProducerProvisioningClient:
    def __init__(self, provisioning: ProvisioningClient) -> None:
        self._provisioning = provisioning

    def provision(self, request: dict[str, Any]) -> TransportResult:
        return self._provisioning.request("POST", "/producer-provisioning", request)

    def list(self, company_slug: str | None = None) -> list[dict[str, Any]]:
        query = f"?companySlug={quote_path(company_slug)}" if company_slug else ""
        response = self._provisioning.request("GET", f"/producer-provisioning{query}")
        items = response.get("items")
        return items if isinstance(items, list) else []

    def rotate_secret(self, client_id: str) -> TransportResult:
        return self._provisioning.request("POST", f"/producer-provisioning/{quote_path(client_id)}/rotate-secret")

    def revoke(self, client_id: str) -> None:
        self._provisioning.request("DELETE", f"/producer-provisioning/{quote_path(client_id)}")


class TenantAdminClient:
    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin

    def create(self, tenant: dict[str, Any]) -> TransportResult:
        return self._admin.request("POST", "/tenants", tenant)

    def list(self) -> TransportResult:
        return self._admin.request("GET", "/tenants")

    def get(self, slug: str) -> TransportResult:
        return self._admin.request("GET", f"/tenants/{quote_path(slug)}")

    def delete(self, slug: str) -> None:
        self._admin.request("DELETE", f"/tenants/{quote_path(slug)}")


class OAuthClientAdminClient:
    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin

    def create(self, client: dict[str, Any]) -> TransportResult:
        return self._admin.request("POST", "/oauth-clients", client)

    def list(self) -> TransportResult:
        return self._admin.request("GET", "/oauth-clients")

    def get(self, client_id: str) -> TransportResult:
        return self._admin.request("GET", f"/oauth-clients/{quote_path(client_id)}")

    def delete(self, client_id: str) -> None:
        self._admin.request("DELETE", f"/oauth-clients/{quote_path(client_id)}")

    def rotate_secret(self, client_id: str) -> TransportResult:
        return self._admin.request("POST", f"/oauth-clients/{quote_path(client_id)}/rotate-secret")


class SiteAdminClient:
    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin

    def create(self, site: dict[str, Any]) -> TransportResult:
        return self._admin.request("POST", "/sites", site)

    def list(self) -> TransportResult:
        response = self._admin.request("GET", "/sites")
        sites = response.get("sites")
        if isinstance(sites, list):
            response = dict(response)
            response["sites"] = [public_admin_site(site) for site in sites]
        return response

    def get(self, site_uuid: str) -> TransportResult:
        return public_admin_site(self._admin.request("GET", f"/sites/{quote_path(site_uuid)}"))

    def delete(self, site_uuid: str) -> None:
        self._admin.request("DELETE", f"/sites/{quote_path(site_uuid)}")

    def rotate_write_key(self, site_uuid: str) -> TransportResult:
        return self._admin.request("POST", f"/sites/{quote_path(site_uuid)}/rotate-write-key")


class SchemaAdminClient:
    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin

    def list(self) -> TransportResult:
        return self._admin.request("GET", "/schemas")

    def get(self, event_type_slug: str) -> TransportResult:
        return self._admin.request("GET", f"/schemas/{quote_path(event_type_slug)}")

    def register(self, schema: dict[str, Any]) -> TransportResult:
        return self._admin.request("POST", "/schemas", schema)

    def create_version(self, event_type_slug: str, schema: dict[str, Any]) -> TransportResult:
        return self._admin.request("POST", f"/schemas/{quote_path(event_type_slug)}/versions", schema)


class MeasurementAdminClient:
    def __init__(self, admin: AdminClient) -> None:
        self.projects = MeasurementProjectAdminClient(admin)


class MeasurementProjectAdminClient:
    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin

    def create(self, project: dict[str, Any]) -> TransportResult:
        return self._admin.request("POST", "/measurement/projects", project)

    def list(self) -> TransportResult:
        return self._admin.request("GET", "/measurement/projects")

    def get(self, project_uuid: str) -> TransportResult:
        return self._admin.request("GET", f"/measurement/projects/{quote_path(project_uuid)}")

    def submit_observation(self, project_uuid: str, observation: dict[str, Any]) -> TransportResult:
        return self.submit_observations(project_uuid, {"rows": [observation]})

    def submit_observations(self, project_uuid: str, request: dict[str, Any]) -> TransportResult:
        response = self._admin.request(
            "POST",
            f"/measurement/projects/{quote_path(project_uuid)}/observations:bulk",
            request,
        )
        validate_measurement_results(response.get("results"), len(request.get("rows", [])))
        return response

    def import_csv_string(self, project_uuid: str, csv: str, expected_rows: int) -> TransportResult:
        response = self._admin.request(
            "POST",
            f"/measurement/projects/{quote_path(project_uuid)}/observations:csv",
            {"csv": csv},
        )
        validate_measurement_results(response.get("results"), expected_rows)
        return response


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

    return prepare_event({
        "eventTypeSlug": input["eventTypeSlug"],
        "schemaVersion": input["schemaVersion"],
        "timestamp": iso_now(),
        "companySlug": input["companySlug"],
        "context": {"device": {"type": "server"}},
        "payload": payload,
    })


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
    required = {"buckets", "value", "queryDurationMs", "snapshotAgeMs", "eventLagP95Ms"}
    if not isinstance(data, dict) or not required.issubset(data):
        raise ValueError("custd: subject insight response contains malformed rendered widget data")
    if not isinstance(data["buckets"], list) or not _is_rendered_metric_value(data["value"]):
        raise ValueError("custd: subject insight response contains malformed rendered widget data")
    if not all(_is_rendered_widget_bucket(bucket) for bucket in data["buckets"]):
        raise ValueError("custd: subject insight response contains malformed rendered widget data")
    if not all(
        isinstance(data[key], int) and not isinstance(data[key], bool)
        for key in ("queryDurationMs", "snapshotAgeMs", "eventLagP95Ms")
    ):
        raise ValueError("custd: subject insight response contains malformed rendered widget data")
    if contains_unsafe_reporting_trust_key(data.get("trust")):
        raise ValueError("custd: unsafe reporting trust diagnostics")
    if not _has_valid_optional_rendered_fields(data):
        raise ValueError("custd: subject insight response contains malformed rendered widget data")


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
    required = ("status", "dataFreshness", "rollupState", "coverage", "captureState", "consentState", "exportState")
    optional_strings = (
        "lastExport", "schemaVersion", "contractVersion", "permissionClass", "partialReason", "unavailableReason"
    )
    return (
        isinstance(value, dict)
        and all(isinstance(value.get(field), str) for field in required)
        and all(field not in value or isinstance(value[field], str) for field in optional_strings)
        and (
            "queryWarnings" not in value
            or isinstance(value["queryWarnings"], list)
            and all(isinstance(item, str) for item in value["queryWarnings"])
        )
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
    if parsed.scheme == "http" and parsed.hostname in ("localhost", "127.0.0.1", "::1"):
        return
    raise ValueError(f"custd: {field} must use https unless it targets localhost")


def fetch_oauth_token(token_url: str, form: dict[str, Any], timeout: float) -> dict[str, Any]:
    body = urllib.parse.urlencode({key: value for key, value in form.items() if value}).encode("utf-8")
    request = urllib.request.Request(
        token_url,
        data=body,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
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
        "threshold_bytes": int(
            compression.get("threshold_bytes", DEFAULT_COMPRESSION_THRESHOLD_BYTES)
        ),
    }


def make_default_transport(compression: dict[str, Any]) -> Transport:
    def transport(
        url: str,
        event: EventEnvelope,
        headers: dict[str, str],
        timeout: float,
    ) -> TransportResult:
        body = json.dumps(event).encode("utf-8")
        if compression["enabled"] and len(body) >= compression["threshold_bytes"]:
            body = gzip.compress(body)
            headers = {**headers, "Content-Encoding": "gzip"}
        request = urllib.request.Request(url, data=body, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                return {"status": response.status, "body": response.read().decode("utf-8")}
        except urllib.error.HTTPError as err:
            return {"status": err.code, "body": err.read().decode("utf-8")}
        except urllib.error.URLError as err:
            raise RetryableError(f"custd: request failed: {err}") from err

    return transport


default_transport = make_default_transport(normalize_compression(None))


def default_admin_transport(
    method: str,
    url: str,
    payload: dict[str, Any] | None,
    headers: dict[str, str],
    timeout: float,
) -> TransportResult:
    data = None
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return {"status": response.status, "body": response.read().decode("utf-8")}
    except urllib.error.HTTPError as err:
        return {"status": err.code, "body": err.read().decode("utf-8")}
    except urllib.error.URLError as err:
        raise RetryableError(f"custd: admin request failed: {err}") from err


def quote_path(value: str) -> str:
    return urllib.parse.quote(value, safe="")
