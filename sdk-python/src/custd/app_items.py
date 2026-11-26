"""Hosted-app item routes under ``/api/v1/app/``, for a server or script acting as a hosted app.

Every item call sends the app's Site key (``X-Custd-Site-Key``) and one of its allowed origins
(``Origin``), plus a link token (``Authorization: Bearer``), the signed-in user's access token
(``X-Custd-User-Token``), or both. An owner link reads and changes its one item; a share link only
reads it. A signed-in owner reaches their items with no link through :meth:`AppClient.owned_item`.

Items live in the Admin API (``/api/v1/app/items``, ``/api/v1/app/item``) and their forecasts and
model runs in the Analytics API (``/api/v1/app/forecast``, ``/api/v1/app/models``); both answer on
the app's ``apiBaseUrl``. Reads carry an ETag: pass it back as ``etag`` and an unchanged item answers
``{"status": "not_modified"}``. A link token travels only in a header, never in a URL.
"""

from __future__ import annotations

import json
import urllib.parse
from collections.abc import Mapping
from typing import Any, Generic, NotRequired, TypedDict, TypeVar, cast

from .app_types import (
    AppAlertUnsubscribeRequest,
    AppItemAlertDeliveryList,
    AppItemAlertRule,
    AppItemAlertRuleCreateRequest,
    AppItemAlertSettings,
    AppItemAlertSlackCreateRequest,
    AppItemAlertSubscription,
    AppItemAlertWebhook,
    AppItemAlertWebhookCreated,
    AppItemAlertWebhookCreateRequest,
    AppItemCreated,
    AppItemCreateRequest,
    AppItemLinkRotated,
    AppItemList,
    AppItemMeasurementPage,
    AppItemRead,
    AppItemRunPage,
    AppItemSettingsRequest,
    AppLinkCollectionEntry,
    AppLinkCollectionEntryAddRequest,
    AppMeetingAdvanceRequest,
    AppMeetingMinutesUpdate,
    AppModelCalculateRequest,
    AppModelCalculateResult,
    AppModelCopyRequest,
    AppModelRun,
    AppModelRunRequest,
    AppModelVersionRequest,
    AppPlanForecast,
    AppPlanUpdate,
    MeasurementForecastRunRequest,
    MeasurementForecastRunResponse,
    MeasurementForecastStoryResponse,
    MeasurementObservationBulkRequest,
    MeasurementObservationBulkResponse,
    MeasurementObservationCSVImportRequest,
    ProjectCompleteRequest,
    ProjectEstimate,
    ProjectEstimateCreateRequest,
    ProjectRunCreateRequest,
)
from .client import AdminTransport, default_admin_transport, problem_request_error, validate_measurement_results

APP_ITEM_SITE_KEY_HEADER = "X-Custd-Site-Key"
APP_ITEM_USER_TOKEN_HEADER = "X-Custd-User-Token"

APP_ITEM_KIND_MEASUREMENT_PROJECT = "measurement_project"
APP_ITEM_KIND_LINK_COLLECTION = "link_collection"
APP_ITEM_KIND_UNCERTAINTY_MODEL = "uncertainty_model"
APP_ITEM_KIND_MEETING = "meeting"
APP_ITEM_KIND_PLAN = "plan"

APP_LINK_ROLE_OWNER = "owner"
APP_LINK_ROLE_SHARE = "share"

APP_ITEM_OWNERSHIP_UNOWNED = "unowned"
APP_ITEM_OWNERSHIP_YOURS = "yours"
APP_ITEM_OWNERSHIP_OTHER = "other"

APP_READ_MODIFIED = "modified"
APP_READ_NOT_MODIFIED = "not_modified"

ITEMS_PATH = "/api/v1/app/items"
ITEM_PATH = "/api/v1/app/item"
FORECAST_PATH = "/api/v1/app/forecast"
MODELS_PATH = "/api/v1/app/models"
ALERTS_PATH = ITEM_PATH + "/alerts"
MEETING_PATH = ITEM_PATH + "/meeting"
APP_DISCOVERY_PATH = "/api/v1/app-hosts/{host}/discovery"
DEFAULT_APP_TIMEOUT_SECONDS = 10.0

T = TypeVar("T")


class AppConditionalRead(TypedDict, Generic[T]):
    """A read that may be answered from the caller's copy: ``data`` is present only when modified."""

    status: str
    etag: NotRequired[str]
    data: NotRequired[T]


class AppDiscoverySignIn(TypedDict):
    issuer: str
    authorizationEndpoint: str
    tokenEndpoint: str
    endSessionEndpoint: str
    clientId: str
    audience: str
    redirectUri: str
    postLogoutRedirectUri: str


class AppDiscoveryDocument(TypedDict):
    """A hosted app's public discovery document, the source of its ``/.well-known/custd.json``."""

    apiBaseUrl: str
    host: str
    siteUuid: str
    browserKey: str
    environment: str
    capabilities: list[str]
    identityMode: str
    allowedOrigins: list[str]
    signIn: NotRequired[AppDiscoverySignIn]
    pageViewSchemaVersion: NotRequired[str]


class AppAlertUnsubscribePage(TypedDict):
    """The HTML page an alert email's unsubscribe link opens; opening it changes nothing."""

    html: str


class AppClient:
    """A hosted app's view of Custd: its API origin, its Site key and one of its allowed origins."""

    def __init__(
        self,
        api_base_url: str,
        site_key: str,
        origin: str,
        *,
        user_token: str | None = None,
        timeout: float = DEFAULT_APP_TIMEOUT_SECONDS,
        transport: AdminTransport | None = None,
    ) -> None:
        self.api_base_url = api_base_url.rstrip("/")
        self._site_key = site_key
        self._origin = origin
        self._user_token = user_token.strip() if user_token and user_token.strip() else None
        self.timeout = timeout
        self._transport = transport or default_admin_transport

    @classmethod
    def from_discovery(
        cls,
        discovery: AppDiscoveryDocument,
        origin: str,
        *,
        user_token: str | None = None,
        transport: AdminTransport | None = None,
    ) -> AppClient:
        return cls(discovery["apiBaseUrl"], discovery["browserKey"], origin, user_token=user_token, transport=transport)

    def with_user_token(self, user_token: str | None) -> AppClient:
        """The same app acting for a signed-in user; an item a signed-in creator makes is theirs at once."""
        return AppClient(
            self.api_base_url,
            self._site_key,
            self._origin,
            user_token=user_token,
            timeout=self.timeout,
            transport=self._transport,
        )

    def create_item(self, request: AppItemCreateRequest) -> AppItemCreated:
        """Create an item; keep both returned tokens, they are shown this once."""
        return cast(AppItemCreated, self._json("POST", ITEMS_PATH, None, dict(request)))

    def list_my_items(self) -> AppItemList:
        """The live items the signed-in user owns in this app, most recently changed first."""
        return AppItemList(items=self._json("GET", ITEMS_PATH, None).get("items") or [])

    def link(self, token: str) -> AppItemAccess:
        """The item routes reached through one link token."""
        return AppItemAccess(self, link_token=token)

    def owned_item(self, item_uuid: str) -> AppItemAccess:
        """The item routes for an item the signed-in user owns, reached with no link."""
        return AppItemAccess(self, owned_item=item_uuid)

    def _json(
        self,
        method: str,
        path: str,
        link_token: str | None,
        body: dict[str, Any] | None = None,
        query: Mapping[str, object] | None = None,
    ) -> dict[str, Any]:
        result = self._send(method, path, link_token, body, query)
        return _object(result.get("body"), path)

    def _send(
        self,
        method: str,
        path: str,
        link_token: str | None,
        body: dict[str, Any] | None = None,
        query: Mapping[str, object] | None = None,
        etag: str | None = None,
    ) -> dict[str, Any]:
        headers = {APP_ITEM_SITE_KEY_HEADER: self._site_key, "Origin": self._origin, "Accept": "application/json"}
        if link_token:
            headers["Authorization"] = f"Bearer {link_token}"
        if self._user_token:
            headers[APP_ITEM_USER_TOKEN_HEADER] = self._user_token
        if etag:
            headers["If-None-Match"] = etag
        if body is not None:
            headers["Content-Type"] = "application/json"
        url = self.api_base_url + path + _query(query)
        result = self._transport(method, url, body, headers, self.timeout)
        status = int(result["status"])
        if status >= 400:
            raise problem_request_error(status, result.get("body"), "app item")
        return result


class AppItemAccess:
    """One item as the item routes reach it: through a link token, or as the signed-in owner."""

    def __init__(self, app: AppClient, *, link_token: str | None = None, owned_item: str | None = None) -> None:
        self._app = app
        self._link_token = link_token
        self._owned_item = owned_item

    def claim(self) -> AppItemRead:
        """Make the signed-in holder of this owner link the item's owner; a repeat succeeds."""
        return self._item("POST", "/claim")

    def read(self, *, item: str | None = None, etag: str | None = None) -> AppConditionalRead[AppItemRead]:
        """Read the item, or with ``item`` one entry of a presented link collection."""
        return cast(AppConditionalRead[AppItemRead], self._conditional(ITEM_PATH, item, etag))

    def update_settings(self, request: AppItemSettingsRequest) -> AppItemRead:
        return self._item("PATCH", "", dict(request))

    def plan_forecast(self) -> AppPlanForecast:
        return cast(AppPlanForecast, self._call("GET", ITEM_PATH + "/plan/forecast"))

    def update_plan(self, request: AppPlanUpdate) -> AppItemRead:
        """Replace the plan graph if its revision still matches the caller's copy."""
        return self._item("PATCH", "/plan", dict(request))

    def add_measurements(self, request: MeasurementObservationBulkRequest) -> MeasurementObservationBulkResponse:
        """Record up to 1000 measurements; raise unless there is one result per row. Check each ``success``."""
        response = self._call("POST", ITEM_PATH + "/measurements", dict(request))
        validate_measurement_results(response.get("results"), len(request["rows"]))
        return cast(MeasurementObservationBulkResponse, response)

    def import_measurements_csv(self, csv: str, expected_rows: int) -> MeasurementObservationBulkResponse:
        """Record measurements from CSV text; ``expected_rows`` is the number of data rows sent."""
        request = MeasurementObservationCSVImportRequest(csv=csv)
        response = self._call("POST", ITEM_PATH + "/measurements/csv", dict(request))
        validate_measurement_results(response.get("results"), expected_rows)
        return cast(MeasurementObservationBulkResponse, response)

    def list_measurements(
        self, *, after: str | None = None, limit: int | None = None, run: str | None = None, item: str | None = None
    ) -> AppItemMeasurementPage:
        """One page of the item's measurements, of the current run unless ``run`` names another."""
        query = {"after": after, "limit": limit, "run": run}
        return cast(AppItemMeasurementPage, self._call("GET", ITEM_PATH + "/measurements", None, query, item))

    def list_runs(self, *, after: str | None = None, limit: int | None = None) -> AppItemRunPage:
        """One page of the item's measurement runs, newest first."""
        return cast(AppItemRunPage, self._call("GET", ITEM_PATH + "/runs", None, {"after": after, "limit": limit}))

    def start_run(self, request: ProjectRunCreateRequest) -> AppItemRead:
        """Start a new measurement run of the item's project."""
        return self._item("POST", "/runs", dict(request))

    def create_estimate(self, request: ProjectEstimateCreateRequest) -> ProjectEstimate:
        return cast(ProjectEstimate, self._call("POST", ITEM_PATH + "/estimates", dict(request)))

    def complete(self, request: ProjectCompleteRequest) -> AppItemRead:
        return self._item("POST", "/complete", dict(request))

    def cancel(self) -> AppItemRead:
        return self._item("POST", "/cancel")

    def reopen(self) -> AppItemRead:
        """Reopen a counter whose target was met."""
        return self._item("POST", "/reopen")

    def add_entry(self, token: str) -> AppLinkCollectionEntry:
        """Add the item another link opens to this link collection."""
        request = AppLinkCollectionEntryAddRequest(token=token)
        return cast(AppLinkCollectionEntry, self._call("POST", ITEM_PATH + "/entries", dict(request)))

    def remove_entry(self, entry_uuid: str) -> None:
        self._call("DELETE", f"{ITEM_PATH}/entries/{_segment(entry_uuid)}")

    def revoke_link(self, link_uuid: str) -> None:
        self._call("DELETE", f"{ITEM_PATH}/links/{_segment(link_uuid)}")

    def rotate_link(self, link_uuid: str) -> AppItemLinkRotated:
        """Replace a link; the old token stops working and the new one is shown this once."""
        return cast(AppItemLinkRotated, self._call("POST", f"{ITEM_PATH}/links/{_segment(link_uuid)}/rotate"))

    def run_forecast(self, request: MeasurementForecastRunRequest | None = None) -> MeasurementForecastRunResponse:
        """Run the item's forecast; owner links only."""
        body = dict(request) if request is not None else {}
        return cast(MeasurementForecastRunResponse, self._call("POST", FORECAST_PATH + "/runs", body))

    def latest_forecast(
        self, *, item: str | None = None, etag: str | None = None
    ) -> AppConditionalRead[MeasurementForecastRunResponse]:
        """The newest forecast run; refused with ``app_forecast_missing`` until one exists."""
        return cast(
            AppConditionalRead[MeasurementForecastRunResponse],
            self._conditional(FORECAST_PATH + "/latest", item, etag),
        )

    def forecast_run(
        self, run_uuid: str, *, item: str | None = None, etag: str | None = None
    ) -> AppConditionalRead[MeasurementForecastRunResponse]:
        path = f"{FORECAST_PATH}/runs/{_segment(run_uuid)}"
        return cast(AppConditionalRead[MeasurementForecastRunResponse], self._conditional(path, item, etag))

    def forecast_story(
        self, *, item: str | None = None, etag: str | None = None
    ) -> AppConditionalRead[MeasurementForecastStoryResponse]:
        """The project's measurements and forecast convergence."""
        read = self._conditional(FORECAST_PATH + "/story", item, etag)
        return cast(AppConditionalRead[MeasurementForecastStoryResponse], read)

    def add_model_version(self, request: AppModelVersionRequest) -> AppItemRead:
        """Save a new immutable version of the item's model; owner link only."""
        return self._item("POST", "/model/versions", dict(request))

    def copy_model(self, request: AppModelCopyRequest | None = None) -> AppItemCreated:
        """Copy a version into a new model item with its own two links, each shown this once."""
        body = dict(request) if request is not None else {}
        return cast(AppItemCreated, self._call("POST", ITEM_PATH + "/model/copy", body))

    def run_model(self, request: AppModelRunRequest) -> AppModelRun:
        """Run the item's model and store the run, which becomes every viewer's latest."""
        return cast(AppModelRun, self._call("POST", MODELS_PATH + "/runs", dict(request)))

    def calculate_model(self, request: AppModelCalculateRequest) -> AppModelCalculateResult:
        """Run a version with some inputs overridden; any link may, and nothing is stored."""
        return cast(AppModelCalculateResult, self._call("POST", MODELS_PATH + "/calculate", dict(request)))

    def latest_model_run(self, *, item: str | None = None, etag: str | None = None) -> AppConditionalRead[AppModelRun]:
        return cast(AppConditionalRead[AppModelRun], self._conditional(MODELS_PATH + "/latest", item, etag))

    def alert_settings(self) -> AppItemAlertSettings:
        """The item's alert rules, webhooks and the signed-in caller's email subscription; owner only."""
        return cast(AppItemAlertSettings, self._call("GET", ALERTS_PATH))

    def alert_deliveries(self) -> AppItemAlertDeliveryList:
        """The item's newest alert deliveries, at most 100; owner only."""
        return cast(AppItemAlertDeliveryList, self._call("GET", ALERTS_PATH + "/deliveries"))

    def add_alert_rule(self, rule: AppItemAlertRuleCreateRequest) -> AppItemAlertRule:
        return cast(AppItemAlertRule, self._call("POST", ALERTS_PATH + "/rules", dict(rule)))

    def remove_alert_rule(self, rule_uuid: str) -> None:
        self._call("DELETE", f"{ALERTS_PATH}/rules/{_segment(rule_uuid)}")

    def add_alert_webhook(self, endpoint: str) -> AppItemAlertWebhookCreated:
        """Register a signed webhook; its ``signingSecret`` is shown this once."""
        request = AppItemAlertWebhookCreateRequest(endpoint=endpoint)
        return cast(AppItemAlertWebhookCreated, self._call("POST", ALERTS_PATH + "/webhooks", dict(request)))

    def add_alert_slack(self, webhook_url: str) -> AppItemAlertWebhook:
        """Post the item's alerts to a Slack incoming webhook; the URL is stored sealed."""
        request = AppItemAlertSlackCreateRequest(webhookUrl=webhook_url)
        return cast(AppItemAlertWebhook, self._call("POST", ALERTS_PATH + "/slack", dict(request)))

    def remove_alert_webhook(self, webhook_uuid: str) -> None:
        self._call("DELETE", f"{ALERTS_PATH}/webhooks/{_segment(webhook_uuid)}")

    def subscribe_alert_email(self) -> AppItemAlertSubscription:
        """Email the signed-in user's verified address when a rule fires; a repeat keeps one."""
        return cast(AppItemAlertSubscription, self._call("PUT", ALERTS_PATH + "/subscription"))

    def unsubscribe_alert_email(self) -> None:
        self._call("DELETE", ALERTS_PATH + "/subscription")

    def update_meeting_minutes(self, request: AppMeetingMinutesUpdate) -> AppItemRead:
        return self._item("PATCH", "/meeting/minutes", dict(request))

    def start_meeting(self) -> AppItemRead:
        """Start the meeting item's first block; owner only."""
        return self._item("POST", "/meeting/start")

    def advance_meeting(self, block_uuid: str) -> AppItemRead:
        """Finish the block ``block_uuid`` names and put the next one on."""
        request = AppMeetingAdvanceRequest(blockUuid=block_uuid)
        return self._item("POST", "/meeting/advance", dict(request))

    def end_meeting(self) -> AppItemRead:
        """End the meeting now; blocks not reached are recorded as ``not_run``."""
        return self._item("POST", "/meeting/end")

    def _item(self, method: str, suffix: str, body: dict[str, Any] | None = None) -> AppItemRead:
        return cast(AppItemRead, self._call(method, ITEM_PATH + suffix, body))

    def _call(
        self,
        method: str,
        path: str,
        body: dict[str, Any] | None = None,
        query: Mapping[str, object] | None = None,
        item: str | None = None,
    ) -> dict[str, Any]:
        return self._app._json(method, path, self._link_token, body, self._target(query, item))

    def _conditional(self, path: str, item: str | None, etag: str | None) -> dict[str, Any]:
        result = self._app._send("GET", path, self._link_token, None, self._target(None, item), etag)
        etag_header = _header(result, "etag")
        if int(result["status"]) == 304:
            read: dict[str, Any] = {"status": APP_READ_NOT_MODIFIED}
            if etag_header or etag:
                read["etag"] = etag_header or etag
            return read
        read = {"status": APP_READ_MODIFIED, "data": _object(result.get("body"), path)}
        if etag_header:
            read["etag"] = etag_header
        return read

    def _target(self, query: Mapping[str, object] | None, item: str | None) -> dict[str, object]:
        """The query with ``item``: the collection entry a call names, else the owned item."""
        target = dict(query or {})
        if item or self._owned_item:
            target["item"] = item or self._owned_item
        return target


def read_app_discovery(
    api_base_url: str,
    host: str,
    *,
    timeout: float = DEFAULT_APP_TIMEOUT_SECONDS,
    transport: AdminTransport | None = None,
) -> AppDiscoveryDocument:
    """Read the public discovery document of the hosted app served on ``host``; no credential."""
    path = APP_DISCOVERY_PATH.format(host=_segment(host))
    result = _public_send("GET", api_base_url, path, None, timeout, transport)
    return cast(AppDiscoveryDocument, _object(result.get("body"), path))


def read_alert_unsubscribe_page(
    api_base_url: str,
    token: str,
    *,
    timeout: float = DEFAULT_APP_TIMEOUT_SECONDS,
    transport: AdminTransport | None = None,
) -> AppAlertUnsubscribePage:
    """The page an alert email's unsubscribe link opens. Reading it unsubscribes no one."""
    path = ALERTS_PATH + "/unsubscribe" + _query({"token": token})
    body = _public_send("GET", api_base_url, path, None, timeout, transport).get("body")
    html = body.decode("utf-8") if isinstance(body, bytes) else body
    return AppAlertUnsubscribePage(html=html if isinstance(html, str) else "")


def unsubscribe_alert_email_by_token(
    api_base_url: str,
    token: str,
    *,
    timeout: float = DEFAULT_APP_TIMEOUT_SECONDS,
    transport: AdminTransport | None = None,
) -> None:
    """Stop the alert-email subscription an unsubscribe link's sealed token names."""
    request = AppAlertUnsubscribeRequest(token=token)
    _public_send("POST", api_base_url, ALERTS_PATH + "/unsubscribe", dict(request), timeout, transport)


# Every list a hosted-app response can carry as JSON null, at any depth, from the OpenAPI schemas.
# None of these names is a nullable non-list field in those responses, so null always means empty.
_NULLABLE_LIST_FIELDS = frozenset(
    {
        "actions",
        "allowedOrigins",
        "bins",
        "blocks",
        "boundInputs",
        "calibration",
        "capabilities",
        "cells",
        "columns",
        "contributions",
        "counts",
        "deliveries",
        "entries",
        "estimates",
        "history",
        "inputs",
        "items",
        "layers",
        "links",
        "missingParts",
        "observations",
        "observedProgress",
        "outcomes",
        "parts",
        "planMeetingSummaries",
        "points",
        "posteriorLines",
        "prerequisites",
        "projectedProgress",
        "quantities",
        "references",
        "results",
        "rows",
        "rules",
        "runs",
        "samples",
        "scatter",
        "series",
        "snapshots",
        "sources",
        "supportingTables",
        "tableColumns",
        "tableRows",
        "warnings",
        "webhooks",
    }
)


def _public_send(
    method: str,
    api_base_url: str,
    path: str,
    body: dict[str, Any] | None,
    timeout: float,
    transport: AdminTransport | None,
) -> dict[str, Any]:
    headers = {"Content-Type": "application/json"} if body is not None else {}
    send = transport or default_admin_transport
    result = send(method, api_base_url.rstrip("/") + path, body, headers, timeout)
    status = int(result["status"])
    if status >= 400:
        raise problem_request_error(status, result.get("body"), "app")
    return result


def _object(body: object, path: str) -> dict[str, Any]:
    if body in (None, "", b""):
        return {}
    decoded = json.loads(body) if isinstance(body, str | bytes) else body
    if not isinstance(decoded, dict):
        raise ValueError(f"custd: {path} response must be a JSON object")
    _empty_null_lists(decoded)
    return decoded


def _empty_null_lists(value: object) -> None:
    """Decode every JSON null list in a response as an empty list, however deep it sits."""
    if isinstance(value, dict):
        for key, child in value.items():
            if child is None and key in _NULLABLE_LIST_FIELDS:
                value[key] = []
            else:
                _empty_null_lists(child)
    elif isinstance(value, list):
        for child in value:
            _empty_null_lists(child)


def _header(result: Mapping[str, Any], name: str) -> str | None:
    headers = result.get("headers")
    if not isinstance(headers, Mapping):
        return None
    for key, value in headers.items():
        if str(key).lower() == name:
            return str(value)
    return None


def _query(values: Mapping[str, object] | None) -> str:
    present = {key: value for key, value in (values or {}).items() if value is not None}
    return "?" + urllib.parse.urlencode(present) if present else ""


def _segment(value: str) -> str:
    return urllib.parse.quote(value, safe="")
