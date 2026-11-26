"""Route and decode conformance of the Python SDK against the Custd operation snapshot.

ROUTES has one case per operation the SDK implements. Each case calls the public method through the
default urllib transports with urlopen patched, and asserts the HTTP method and path it sends. The
keys must equal contract-fixtures/api/coverage/python.json, so that file never claims more than this
test proves. Every required query parameter in the snapshot must be sent by the route case, and
every declared one by the route case, the acting company or a QUERY_CASES call. NULL_LISTS proves
that a JSON null list in a minimal example comes back as an empty list. test_response_fields.py
decodes every example and checks each response DTO's fields.
"""

import contextlib
import io
import json
import pathlib
import re
import sys
import unittest
from collections.abc import Callable
from typing import Any, NamedTuple
from unittest import mock
from urllib.parse import parse_qsl, urlsplit

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "src"))

from custd import CustdClient, RequestError
from custd.admin_site_status_page import (
    confirm_public_status_page_subscription,
    read_public_status_page,
    subscribe_to_public_status_page,
    unsubscribe_from_public_status_page,
)
from custd.app_items import (
    AppClient,
    read_alert_unsubscribe_page,
    read_app_discovery,
    unsubscribe_alert_email_by_token,
)
from custd.app_profile import CurrentAppProfileClient
from custd.ingest_operations import (
    ErrorCaptureClient,
    collect_event,
    collect_events,
    read_auth_domain_monitoring_inventory,
    read_shared_site_report,
)
from custd.site_ai_owner import SiteAIOwnerClient, redeem_site_ai_owner_handoff
from custd.site_monitor_reports import (
    SiteMonitorDestination,
    get_private_uptime_work,
    submit_private_uptime,
    submit_site_heartbeat,
)

API = pathlib.Path(__file__).resolve().parents[2] / "contract-fixtures" / "api"
BASE_URL = "http://localhost:8080"
U = "11111111-1111-4111-8111-111111111111"
TARGET = {"projectId": U, "environmentId": U, "directoryId": U, "providerSubject": U}
OPT: Any = {"idempotency_key": "idem-key-0001"}
GRANT: Any = {
    "principal": {"kind": "human", "userUuid": U},
    "target": {"kind": "sub_client", "scopeUuid": U},
    "action": "read",
}
PARSER: Any = {
    "code": "nginx",
    "name": "Nginx",
    "parserType": "regex",
    "pattern": "(?P<path>.*)",
    "timestampFormat": "rfc3339",
    "fieldMapping": {},
}
EVENT: Any = {
    "eventUuid": U,
    "eventTypeSlug": "page_view",
    "schemaVersion": 1,
    "timestamp": "2026-11-01T00:00:00Z",
    "sessionId": "session-1",
    "anonymousId": "anonymous-1",
    "companySlug": "acme",
    "context": {"device": {"type": "desktop"}},
    "payload": {"path": "/"},
}
SCHEMA: Any = {
    "slug": "page_view",
    "name": "Page view",
    "version": "1.0.0",
    "jsonSchema": "{}",
    "enabled": True,
    "isActive": True,
}
HEARTBEAT: Any = {"name": "nightly", "schedule": {"cron": "0 2 * * *", "graceMinutes": 10, "timezone": "UTC"}}
MAINTENANCE: Any = {"windowUuid": U, "startsAt": "2026-11-01T00:00:00Z", "endsAt": "2026-11-01T01:00:00Z"}
IMAGE_OVERRIDE: Any = {
    "component": "hydra",
    "imageDigest": "sha256:0",
    "incidentReference": "INC-1",
    "expiresAt": "2026-11-01T00:00:00Z",
}
TIMING_OBSERVATION: Any = {
    "workflowKey": "deploy",
    "externalRunId": "run-1",
    "idempotencyKey": "deploy-run-1-started",
    "fact": {"kind": "run_started", "occurredAt": "2026-11-01T00:00:00Z"},
}
TIMING_DECLARATION: Any = {"workflowKey": "deploy", "name": "Deploy", "steps": []}
LINK = "l" * 43
APP_ITEM_PROJECT = {"projectCode": "p-1"}
PLAN_UPDATE: Any = {"expectedRevision": 1, "parts": []}
MODEL_RUN: Any = {"versionNumber": 1}
PROFILE_UPDATE: Any = {"values": [{"fieldKey": "name", "value": "Ada"}]}
APP_SIGN_IN: Any = {"mode": "open", "expectedRevision": 1}
ENTITLEMENT: Any = {"enabled": True, "maxActiveDataSpaces": 1, "maxActiveProducersPerDataSpace": 1}
STORAGE_LIMIT: Any = {
    "includedStorageBytes": 1,
    "purchasedStorageBytes": 0,
    "warnPercent": 80,
    "hardLimitEnabled": False,
}


ERROR_EVENT: Any = {
    "platform": "javascript",
    "exceptionType": "TypeError",
    "frames": [{"filename": "app.js", "lineno": 1}],
    "mode": "handled",
}


def _monitor(prefix: str) -> SiteMonitorDestination:
    return SiteMonitorDestination(base_url=BASE_URL, report_path=f"{prefix}acme/{U}", write_token="w" * 64)


def _ai_owner() -> SiteAIOwnerClient:
    return SiteAIOwnerClient({"origin": BASE_URL, "cookie": "c" * 26})


AI_HANDOFF: Any = {"code": "c" * 26, "redeemUrl": BASE_URL + "/api/v1/site-ai-owner/redeem"}
AI_SETTINGS: Any = {"aiMode": "off", "monthlyCapUsdMicros": 0}
HEARTBEAT_REPORT: Any = {"scheduledFor": "2026-11-01T02:00:00Z", "outcome": "succeeded"}
UPTIME_REPORT: Any = {"reportUuid": U, "observedAt": "2026-11-01T00:00:00Z", "responseMs": 1}
HEARTBEAT_REPORTS = "/api/v1/site-heartbeat-reports/"
UPTIME_REPORTS = "/api/v1/site-private-uptime-reports/"


def _error_capture() -> ErrorCaptureClient:
    return ErrorCaptureClient(BASE_URL, write_key="site_pk_" + "k" * 32, environment="production")


def _app() -> AppClient:
    return AppClient(BASE_URL, "site_pk_sample", "https://app.example.com", user_token="user-token")


def _link() -> Any:
    return _app().link(LINK)


def _profile() -> CurrentAppProfileClient:
    return CurrentAppProfileClient(BASE_URL, "user-token")


# Errors a decoder raises when the fake {} body is not a valid response. The request was already
# sent, which is all a route case asserts; a validation error before sending leaves no request.
DECODE_ERRORS = (ValueError, KeyError, AttributeError, RequestError)


class RouteCase(NamedTuple):
    path: str
    call: Callable[[CustdClient], object]
    # Only for an ANY operation: the method the SDK sends.
    method: str | None = None


class FakeResponse:
    status = 200
    headers: dict[str, str] = {}

    def __init__(self, body: bytes) -> None:
        self.stream = io.BytesIO(body)

    def read(self, size: int | None = -1) -> bytes:
        return self.stream.read(size)

    def close(self) -> None:
        self.stream.close()

    def __enter__(self) -> "FakeResponse":
        return self

    def __exit__(self, *_: object) -> bool:
        return False


class RecordingUrlopen:
    def __init__(self, body: bytes = b"{}") -> None:
        self.body = body
        self.requests: list[tuple[str, str]] = []

    def __call__(self, request: Any, timeout: float | None = None) -> FakeResponse:
        self.requests.append((request.get_method(), request.full_url))
        return FakeResponse(self.body)


def _track_in_batch() -> object:
    client = CustdClient(base_url=BASE_URL, token="token", batch={"max_batch_size": 1})
    return client.track(dict(EVENT))


ROUTES: dict[str, RouteCase] = {
    "admin-api GET /api/v1/public-status-pages/{key}": RouteCase(
        "/api/v1/public-status-pages/page-key", lambda c: read_public_status_page(BASE_URL, "page-key")
    ),
    "admin-api POST /api/v1/public-status-pages/{key}/subscribe": RouteCase(
        "/api/v1/public-status-pages/page-key/subscribe",
        lambda c: subscribe_to_public_status_page(BASE_URL, "page-key", {"email": "ada@example.com"}),
    ),
    "admin-api POST /api/v1/public-status-pages/{key}/confirm-subscription": RouteCase(
        "/api/v1/public-status-pages/page-key/confirm-subscription",
        lambda c: confirm_public_status_page_subscription(BASE_URL, "page-key", "sealed"),
    ),
    "admin-api POST /api/v1/public-status-pages/{key}/unsubscribe": RouteCase(
        "/api/v1/public-status-pages/page-key/unsubscribe",
        lambda c: unsubscribe_from_public_status_page(BASE_URL, "page-key", "sealed"),
    ),
    "admin-api POST /api/v1/site-heartbeat-reports/{companySlug}/{monitorUuid}": RouteCase(
        f"{HEARTBEAT_REPORTS}acme/{U}", lambda c: submit_site_heartbeat(_monitor(HEARTBEAT_REPORTS), HEARTBEAT_REPORT)
    ),
    "admin-api POST /api/v1/site-private-uptime-reports/{companySlug}/{monitorUuid}": RouteCase(
        f"{UPTIME_REPORTS}acme/{U}", lambda c: submit_private_uptime(_monitor(UPTIME_REPORTS), UPTIME_REPORT)
    ),
    "admin-api GET /api/v1/site-private-uptime-reports/{companySlug}/{monitorUuid}": RouteCase(
        f"{UPTIME_REPORTS}acme/{U}", lambda c: get_private_uptime_work(_monitor(UPTIME_REPORTS))
    ),
    "admin-api POST /api/v1/site-ai-owner/redeem": RouteCase(
        "/api/v1/site-ai-owner/redeem", lambda c: redeem_site_ai_owner_handoff(AI_HANDOFF, "https://hub.example")
    ),
    "admin-api GET /api/v1/site-ai-owner/settings": RouteCase(
        "/api/v1/site-ai-owner/settings", lambda c: _ai_owner().get_settings()
    ),
    "admin-api PUT /api/v1/site-ai-owner/settings": RouteCase(
        "/api/v1/site-ai-owner/settings", lambda c: _ai_owner().set_settings("binding", AI_SETTINGS)
    ),
    "admin-api PUT /api/v1/site-ai-owner/consent": RouteCase(
        "/api/v1/site-ai-owner/consent", lambda c: _ai_owner().set_consent("binding", {"action": "revoke"})
    ),
    "admin-api POST /api/v1/site-domains/ai-owner-handoffs": RouteCase(
        "/api/v1/site-domains/ai-owner-handoffs",
        lambda c: c.admin.site_domains.create_ai_owner_handoff({"tenantSlug": "acme", "ownerSubject": "owner-1"}),
    ),
    ("admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/organisations"): RouteCase(
        f"/api/v1/admin/auth-projects/{U}/environments/{U}/organisations",
        lambda c: c.admin.auth_projects.list_environment_organisations(U, U),
    ),
    (
        "admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/directories"
        "/{directoryId}/principals/{providerSubject}/sessions"
    ): RouteCase(
        f"/api/v1/admin/auth-projects/{U}/environments/{U}/directories/{U}/principals/sample/sessions",
        lambda c: c.admin.auth_projects.list_principal_sessions(U, U, U, "sample"),
    ),
    (
        "admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/directories"
        "/{directoryId}/principals/{providerSubject}/export"
    ): RouteCase(
        f"/api/v1/admin/auth-projects/{U}/environments/{U}/directories/{U}/principals/{U}/export",
        lambda c: c.admin.auth_projects.export_principal(TARGET),
    ),
    (
        "admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/directories"
        "/{directoryId}/principals/{providerSubject}/memberships"
    ): RouteCase(
        f"/api/v1/admin/auth-projects/{U}/environments/{U}/directories/{U}/principals/{U}/memberships",
        lambda c: c.admin.auth_projects.list_principal_memberships(TARGET),
    ),
    (
        "admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/directories"
        "/{directoryId}/principals/{providerSubject}/profile"
    ): RouteCase(
        f"/api/v1/admin/auth-projects/{U}/environments/{U}/directories/{U}/principals/{U}/profile",
        lambda c: c.admin.auth_projects.get_principal_profile(TARGET),
    ),
    (
        "admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/principals"
        "/{providerSubject}/audiences"
    ): RouteCase(
        f"/api/v1/admin/auth-projects/{U}/environments/{U}/principals/{U}/audiences",
        lambda c: c.admin.auth_projects.list_principal_audiences(TARGET),
    ),
    ("admin-api GET /api/v1/admin/measurement/predictions/definitions/{definitionUuid}/threshold-events"): RouteCase(
        f"/api/v1/admin/measurement/predictions/definitions/{U}/threshold-events",
        lambda c: c.admin.predictions.list_threshold_events("acme", U),
    ),
    (
        "admin-api GET /api/v1/admin/measurement/predictions/definitions/{definitionUuid}/versions/{versionUuid}"
    ): RouteCase(
        f"/api/v1/admin/measurement/predictions/definitions/{U}/versions/{U}",
        lambda c: c.admin.predictions.get_version("acme", U, U),
    ),
    (
        "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/directories/{action}"
    ): RouteCase(
        f"/api/v1/admin/auth-projects/{U}/environments/{U}/directories/enable",
        lambda c: c.admin.auth_projects.act_on_directory(
            U, U, "enable", {"poolId": "pool-1", "expectedRevision": 1}, OPT
        ),
    ),
    (
        "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}"
        "/directories/{directoryId}/principals/{providerSubject}/sessions/revoke"
    ): RouteCase(
        f"/api/v1/admin/auth-projects/{U}/environments/{U}/directories/{U}/principals/{U}/sessions/revoke",
        lambda c: c.admin.auth_projects.revoke_principal_session(U, U, U, U, {}, OPT),
    ),
    (
        "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}"
        "/directories/{directoryId}/principals/{providerSubject}/sessions/revoke-all"
    ): RouteCase(
        f"/api/v1/admin/auth-projects/{U}/environments/{U}/directories/{U}/principals/{U}/sessions/revoke-all",
        lambda c: c.admin.auth_projects.revoke_principal_sessions(U, U, U, U, {}, OPT),
    ),
    (
        "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}"
        "/directories/{directoryId}/principals/{providerSubject}/erase"
    ): RouteCase(
        f"/api/v1/admin/auth-projects/{U}/environments/{U}/directories/{U}/principals/{U}/erase",
        lambda c: c.admin.auth_projects.erase_principal(TARGET, {}, OPT),
    ),
    (
        "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}"
        "/directories/{directoryId}/principals/{providerSubject}/memberships/revoke"
    ): RouteCase(
        f"/api/v1/admin/auth-projects/{U}/environments/{U}/directories/{U}/principals/sample/memberships/revoke",
        lambda c: c.admin.auth_projects.revoke_principal_membership(U, U, U, "sample", {}),
    ),
    (
        "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}"
        "/directories/{directoryId}/principals/{providerSubject}/profile"
    ): RouteCase(
        f"/api/v1/admin/auth-projects/{U}/environments/{U}/directories/{U}/principals/{U}/profile",
        lambda c: c.admin.auth_projects.set_principal_profile(TARGET, {}, OPT),
    ),
    (
        "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}"
        "/directories/{directoryId}/principals/{providerSubject}/restore"
    ): RouteCase(
        f"/api/v1/admin/auth-projects/{U}/environments/{U}/directories/{U}/principals/{U}/restore",
        lambda c: c.admin.auth_projects.restore_principal(TARGET, OPT),
    ),
    (
        "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}"
        "/directories/{directoryId}/principals/{providerSubject}/suspend"
    ): RouteCase(
        f"/api/v1/admin/auth-projects/{U}/environments/{U}/directories/{U}/principals/{U}/suspend",
        lambda c: c.admin.auth_projects.suspend_principal(TARGET, OPT),
    ),
    (
        "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/invitations/redeliver"
    ): RouteCase(
        f"/api/v1/admin/auth-projects/{U}/environments/{U}/invitations/redeliver",
        lambda c: c.admin.auth_projects.redeliver_invitation(U, U, {}, OPT),
    ),
    (
        "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/invitations/revoke"
    ): RouteCase(
        f"/api/v1/admin/auth-projects/{U}/environments/{U}/invitations/revoke",
        lambda c: c.admin.auth_projects.revoke_invitation(U, U, {}, OPT),
    ),
    (
        "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/clients/reconcile"
    ): RouteCase(
        f"/api/v1/admin/auth-projects/{U}/environments/{U}/clients/reconcile",
        lambda c: c.admin.auth_projects.reconcile_environment_clients(U, U, {}, OPT),
    ),
    (
        "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/principals"
        "/{providerSubject}/audiences/grant"
    ): RouteCase(
        f"/api/v1/admin/auth-projects/{U}/environments/{U}/principals/{U}/audiences/grant",
        lambda c: c.admin.auth_projects.grant_principal_audience(TARGET, {}, OPT),
    ),
    (
        "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/principals"
        "/{providerSubject}/audiences/revoke"
    ): RouteCase(
        f"/api/v1/admin/auth-projects/{U}/environments/{U}/principals/{U}/audiences/revoke",
        lambda c: c.admin.auth_projects.revoke_principal_audience(TARGET, {}, OPT),
    ),
    "admin-api DELETE /api/v1/admin/data-label-assignments/schema-fields/{assignmentUuid}": RouteCase(
        f"/api/v1/admin/data-label-assignments/schema-fields/{U}",
        lambda c: c.admin.data_labels.remove_schema_field_assignment(U),
    ),
    "admin-api DELETE /api/v1/admin/event-types/{slug}/data-label-defaults/{definitionUuid}": RouteCase(
        f"/api/v1/admin/event-types/acme/data-label-defaults/{U}",
        lambda c: c.admin.data_labels.remove_event_type_default("acme", U),
    ),
    "admin-api DELETE /api/v1/admin/sites/{siteUuid}": RouteCase(
        f"/api/v1/admin/sites/{U}", lambda c: c.admin.sites.delete(U)
    ),
    "admin-api DELETE /api/v1/admin/oauth-clients/{clientId}": RouteCase(
        f"/api/v1/admin/oauth-clients/{U}", lambda c: c.admin.oauth_clients.delete(U)
    ),
    "admin-api DELETE /api/v1/admin/retention/policies/{tenantSlug}": RouteCase(
        "/api/v1/admin/retention/policies/acme", lambda c: c.admin.retention.delete("acme")
    ),
    "admin-api DELETE /api/v1/admin/tenants/{slug}": RouteCase(
        "/api/v1/admin/tenants/acme", lambda c: c.admin.tenants.delete("acme")
    ),
    "admin-api DELETE /api/v1/data-spaces/{slug}": RouteCase(
        "/api/v1/data-spaces/acme", lambda c: c.provisioning.data_spaces.revoke("acme")
    ),
    "admin-api POST /api/v1/data-spaces/{slug}/erasure": RouteCase(
        "/api/v1/data-spaces/acme/erasure", lambda c: c.provisioning.data_spaces.erase("acme")
    ),
    "admin-api GET /api/v1/data-spaces/{slug}/erasure": RouteCase(
        "/api/v1/data-spaces/acme/erasure", lambda c: c.provisioning.data_spaces.get_erasure("acme")
    ),
    "admin-api PUT /api/v1/producer-provisioning/{clientId}/signing-keys": RouteCase(
        f"/api/v1/producer-provisioning/{U}/signing-keys",
        lambda c: c.provisioning.producers.set_signing_keys(U, {"publicKeys": ["AAAA"]}),
    ),
    "admin-api GET /api/v1/producer-provisioning/{clientId}/signing-keys": RouteCase(
        f"/api/v1/producer-provisioning/{U}/signing-keys", lambda c: c.provisioning.producers.get_signing_keys(U)
    ),
    "admin-api GET /api/v1/data-spaces/{slug}/signing-status": RouteCase(
        "/api/v1/data-spaces/acme/signing-status", lambda c: c.provisioning.data_spaces.get_signing_status("acme")
    ),
    "admin-api POST /api/v1/data-spaces/{slug}/sites/{siteUuid}/adopt": RouteCase(
        f"/api/v1/data-spaces/acme/sites/{U}/adopt", lambda c: c.provisioning.data_spaces.adopt_site("acme", U)
    ),
    "admin-api DELETE /api/v1/site-domains/keyword-lists": RouteCase(
        "/api/v1/site-domains/keyword-lists", lambda c: c.admin.site_domains.delete_keyword_list("sample")
    ),
    "admin-api DELETE /api/v1/site-domains/{domainUuid}/analytics/ga4": RouteCase(
        f"/api/v1/site-domains/{U}/analytics/ga4", lambda c: c.admin.site_domains.disconnect_analytics(U)
    ),
    "admin-api DELETE /api/v1/site-domains/{domainUuid}/attestation": RouteCase(
        f"/api/v1/site-domains/{U}/attestation", lambda c: c.admin.site_domains.unattest(U)
    ),
    "admin-api DELETE /api/v1/site-domains/{domainUuid}/saved-reports/{reportUuid}": RouteCase(
        f"/api/v1/site-domains/{U}/saved-reports/{U}", lambda c: c.admin.site_domains.delete_saved_report(U, U)
    ),
    "admin-api DELETE /api/v1/site-domains/{domainUuid}/search/{provider}": RouteCase(
        f"/api/v1/site-domains/{U}/search/google", lambda c: c.admin.site_domains.disconnect_search(U, "google")
    ),
    "admin-api DELETE /api/v1/site-domains/{domainUuid}/indexnow": RouteCase(
        f"/api/v1/site-domains/{U}/indexnow", lambda c: c.admin.site_domains.disable_indexnow(U)
    ),
    "admin-api DELETE /api/v1/site-domains/{domainUuid}/rankings/keywords/{keywordUuid}": RouteCase(
        f"/api/v1/site-domains/{U}/rankings/keywords/{U}", lambda c: c.admin.site_domains.untrack_keyword(U, U)
    ),
    "admin-api DELETE /api/v1/site-domains/{domainUuid}/report-shares/{shareUuid}": RouteCase(
        f"/api/v1/site-domains/{U}/report-shares/{U}", lambda c: c.admin.site_domains.revoke_report_share(U, U)
    ),
    "admin-api DELETE /api/v1/site-domains/{domainUuid}/status-page": RouteCase(
        f"/api/v1/site-domains/{U}/status-page", lambda c: c.admin.site_domains.unpublish_status_page(U)
    ),
    "admin-api DELETE /api/v1/site-domains/{domainUuid}": RouteCase(
        f"/api/v1/site-domains/{U}", lambda c: c.admin.site_domains.delete(U)
    ),
    "admin-api DELETE /api/v1/producer-provisioning/{clientId}": RouteCase(
        f"/api/v1/producer-provisioning/{U}", lambda c: c.provisioning.producers.revoke(U)
    ),
    "admin-api GET /api/v1/admin/audit/events/export": RouteCase(
        "/api/v1/admin/audit/events/export", lambda c: c.admin.audit.export_events(io.BytesIO())
    ),
    "admin-api GET /api/v1/admin/audit/events/{eventId}": RouteCase(
        f"/api/v1/admin/audit/events/{U}", lambda c: c.admin.audit.get_event(U)
    ),
    "admin-api GET /api/v1/admin/audit/events": RouteCase(
        "/api/v1/admin/audit/events", lambda c: c.admin.audit.list_events()
    ),
    "admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/capability": RouteCase(
        f"/api/v1/admin/auth-projects/{U}/environments/{U}/capability",
        lambda c: c.admin.auth_projects.get_environment_capability(U, U),
    ),
    "admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/directories": RouteCase(
        f"/api/v1/admin/auth-projects/{U}/environments/{U}/directories",
        lambda c: c.admin.auth_projects.list_directories(U, U),
    ),
    "admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/invitations": RouteCase(
        f"/api/v1/admin/auth-projects/{U}/environments/{U}/invitations",
        lambda c: c.admin.auth_projects.list_invitations(U, U),
    ),
    "admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/principals": RouteCase(
        f"/api/v1/admin/auth-projects/{U}/environments/{U}/principals",
        lambda c: c.admin.auth_projects.list_principals(U, U),
    ),
    "admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/status": RouteCase(
        f"/api/v1/admin/auth-projects/{U}/environments/{U}/status",
        lambda c: c.admin.auth_projects.get_environment_status(U, U),
    ),
    "admin-api GET /api/v1/admin/auth-projects": RouteCase(
        "/api/v1/admin/auth-projects", lambda c: c.admin.auth_projects.list_projects()
    ),
    "admin-api GET /api/v1/admin/data-scope-grants": RouteCase(
        "/api/v1/admin/data-scope-grants", lambda c: c.admin.data_scopes.list_grants({"kind": "human", "userUuid": U})
    ),
    "admin-api GET /api/v1/admin/data-scopes/{scopeUuid}/resources/{resourceUuid}": RouteCase(
        f"/api/v1/admin/data-scopes/{U}/resources/{U}", lambda c: c.admin.data_scopes.get_resource(U, U)
    ),
    "admin-api GET /api/v1/admin/data-scopes/{scopeUuid}/resources": RouteCase(
        f"/api/v1/admin/data-scopes/{U}/resources", lambda c: c.admin.data_scopes.list_resources(U)
    ),
    "admin-api GET /api/v1/admin/data-scopes/{scopeUuid}": RouteCase(
        f"/api/v1/admin/data-scopes/{U}", lambda c: c.admin.data_scopes.get_scope(U)
    ),
    "admin-api GET /api/v1/admin/data-scopes": RouteCase(
        "/api/v1/admin/data-scopes", lambda c: c.admin.data_scopes.list_scopes()
    ),
    "admin-api GET /api/v1/admin/data-label-assignments": RouteCase(
        "/api/v1/admin/data-label-assignments", lambda c: c.admin.data_labels.list_assignments()
    ),
    "admin-api GET /api/v1/admin/data-labels/catalogue": RouteCase(
        "/api/v1/admin/data-labels/catalogue", lambda c: c.admin.data_labels.catalogue()
    ),
    "admin-api GET /api/v1/admin/data-labels/usage": RouteCase(
        "/api/v1/admin/data-labels/usage", lambda c: c.admin.data_labels.list_usage()
    ),
    "admin-api GET /api/v1/admin/data-labels/{definitionUuid}": RouteCase(
        f"/api/v1/admin/data-labels/{U}", lambda c: c.admin.data_labels.get(U)
    ),
    "admin-api GET /api/v1/admin/data-labels": RouteCase(
        "/api/v1/admin/data-labels", lambda c: c.admin.data_labels.list()
    ),
    "admin-api GET /api/v1/admin/site-insights/ai-usage": RouteCase(
        "/api/v1/admin/site-insights/ai-usage", lambda c: c.admin.site_domains.get_platform_ai_usage()
    ),
    "admin-api GET /api/v1/admin/site-insights/tasks": RouteCase(
        "/api/v1/admin/site-insights/tasks", lambda c: c.admin.site_domains.list_site_insights_tasks()
    ),
    "admin-api GET /api/v1/admin/sites/{siteUuid}": RouteCase(
        f"/api/v1/admin/sites/{U}", lambda c: c.admin.sites.get(U)
    ),
    "admin-api GET /api/v1/admin/sites": RouteCase("/api/v1/admin/sites", lambda c: c.admin.sites.list()),
    "admin-api GET /api/v1/admin/measurement/predictions/definitions/{definitionUuid}/evaluations": RouteCase(
        f"/api/v1/admin/measurement/predictions/definitions/{U}/evaluations",
        lambda c: c.admin.predictions.get_evaluation("acme", U),
    ),
    "admin-api GET /api/v1/admin/measurement/predictions/definitions/{definitionUuid}/outcomes": RouteCase(
        f"/api/v1/admin/measurement/predictions/definitions/{U}/outcomes",
        lambda c: c.admin.predictions.list_outcomes("acme", U),
    ),
    "admin-api GET /api/v1/admin/measurement/predictions/definitions/{definitionUuid}/runs": RouteCase(
        f"/api/v1/admin/measurement/predictions/definitions/{U}/runs",
        lambda c: c.admin.predictions.list_runs("acme", U),
    ),
    "admin-api GET /api/v1/admin/measurement/predictions/definitions/{definitionUuid}": RouteCase(
        f"/api/v1/admin/measurement/predictions/definitions/{U}",
        lambda c: c.admin.predictions.get_definition("acme", U),
    ),
    "admin-api GET /api/v1/admin/measurement/predictions/definitions": RouteCase(
        "/api/v1/admin/measurement/predictions/definitions", lambda c: c.admin.predictions.list_definitions("acme")
    ),
    "admin-api GET /api/v1/admin/measurement/predictions/sources/{sourceUuid}": RouteCase(
        f"/api/v1/admin/measurement/predictions/sources/{U}", lambda c: c.admin.predictions.get_signal_source("acme", U)
    ),
    "admin-api GET /api/v1/admin/measurement/predictions/sources": RouteCase(
        "/api/v1/admin/measurement/predictions/sources", lambda c: c.admin.predictions.list_signal_sources("acme")
    ),
    "admin-api GET /api/v1/admin/measurement/projects/{projectUuid}": RouteCase(
        f"/api/v1/admin/measurement/projects/{U}", lambda c: c.admin.measurement.projects.get(U)
    ),
    "admin-api GET /api/v1/admin/measurement/projects": RouteCase(
        "/api/v1/admin/measurement/projects", lambda c: c.admin.measurement.projects.list()
    ),
    "admin-api GET /api/v1/admin/oauth-clients/{clientId}": RouteCase(
        f"/api/v1/admin/oauth-clients/{U}", lambda c: c.admin.oauth_clients.get(U)
    ),
    "admin-api GET /api/v1/admin/oauth-clients": RouteCase(
        "/api/v1/admin/oauth-clients", lambda c: c.admin.oauth_clients.list()
    ),
    "admin-api GET /api/v1/admin/offboarding/schedules/{tenantSlug}": RouteCase(
        "/api/v1/admin/offboarding/schedules/acme", lambda c: c.admin.offboarding.get_schedule("acme")
    ),
    "admin-api GET /api/v1/admin/offboarding/schedules": RouteCase(
        "/api/v1/admin/offboarding/schedules", lambda c: c.admin.offboarding.list_schedules()
    ),
    "admin-api GET /api/v1/admin/offboarding/requests/{requestUuid}/download": RouteCase(
        f"/api/v1/admin/offboarding/requests/{U}/download", lambda c: c.admin.offboarding.download(U, io.BytesIO())
    ),
    "admin-api GET /api/v1/admin/offboarding/requests/{requestUuid}/receipt": RouteCase(
        f"/api/v1/admin/offboarding/requests/{U}/receipt", lambda c: c.admin.offboarding.receipt(U)
    ),
    "admin-api GET /api/v1/admin/offboarding/{requestUuid}": RouteCase(
        f"/api/v1/admin/offboarding/{U}", lambda c: c.admin.offboarding.get_request(U)
    ),
    "admin-api GET /api/v1/admin/privacy/erasures/{requestUuid}": RouteCase(
        f"/api/v1/admin/privacy/erasures/{U}", lambda c: c.admin.privacy_erasures.get(U)
    ),
    "admin-api GET /api/v1/admin/privacy/erasures": RouteCase(
        "/api/v1/admin/privacy/erasures", lambda c: c.admin.privacy_erasures.list()
    ),
    "admin-api GET /api/v1/admin/reporting-packs/audit-events": RouteCase(
        "/api/v1/admin/reporting-packs/audit-events", lambda c: c.admin.audit.list_reporting_pack_events("sample-key")
    ),
    "admin-api GET /api/v1/admin/reporting-packs/drafts/{draftId}": RouteCase(
        f"/api/v1/admin/reporting-packs/drafts/{U}", lambda c: c.admin.reporting_packs.get_draft(U)
    ),
    "admin-api GET /api/v1/admin/reporting-packs/drafts": RouteCase(
        "/api/v1/admin/reporting-packs/drafts", lambda c: c.admin.reporting_packs.list_drafts()
    ),
    "admin-api GET /api/v1/admin/reporting-packs/setup-templates": RouteCase(
        "/api/v1/admin/reporting-packs/setup-templates", lambda c: c.admin.reporting_packs.list_setup_templates()
    ),
    "admin-api GET /api/v1/admin/retention/policies/{tenantSlug}/runs": RouteCase(
        "/api/v1/admin/retention/policies/acme/runs", lambda c: c.admin.retention.list_runs("acme")
    ),
    "admin-api GET /api/v1/admin/retention/policies/{tenantSlug}": RouteCase(
        "/api/v1/admin/retention/policies/acme", lambda c: c.admin.retention.get("acme")
    ),
    "admin-api GET /api/v1/admin/retention/policies": RouteCase(
        "/api/v1/admin/retention/policies", lambda c: c.admin.retention.list()
    ),
    "admin-api GET /api/v1/admin/tenants/{slug}": RouteCase(
        "/api/v1/admin/tenants/acme", lambda c: c.admin.tenants.get("acme")
    ),
    "admin-api GET /api/v1/admin/tenants": RouteCase("/api/v1/admin/tenants", lambda c: c.admin.tenants.list()),
    "admin-api GET /api/v1/admin/time-plans/runs/{runUuid}/annotations": RouteCase(
        f"/api/v1/admin/time-plans/runs/{U}/annotations", lambda c: c.admin.time_plans.list_annotations("acme", U)
    ),
    "admin-api GET /api/v1/admin/time-plans/runs/{runUuid}/history": RouteCase(
        f"/api/v1/admin/time-plans/runs/{U}/history", lambda c: c.admin.time_plans.history("acme", U)
    ),
    "admin-api GET /api/v1/admin/time-plans/runs/{runUuid}": RouteCase(
        f"/api/v1/admin/time-plans/runs/{U}", lambda c: c.admin.time_plans.get_run("acme", U)
    ),
    "admin-api GET /api/v1/admin/time-plans/{planUuid}": RouteCase(
        f"/api/v1/admin/time-plans/{U}", lambda c: c.admin.time_plans.get("acme", U)
    ),
    "admin-api GET /api/v1/admin/time-plans": RouteCase(
        "/api/v1/admin/time-plans", lambda c: c.admin.time_plans.list("acme")
    ),
    "admin-api GET /api/v1/admin/usage/me": RouteCase("/api/v1/admin/usage/me", lambda c: c.admin.usage.get()),
    "admin-api GET /api/v1/admin/subject-exports/{requestId}/download": RouteCase(
        f"/api/v1/admin/subject-exports/{U}/download", lambda c: c.admin.subject_exports.download(U, "access")
    ),
    "admin-api GET /api/v1/admin/subject-exports/{requestId}": RouteCase(
        f"/api/v1/admin/subject-exports/{U}", lambda c: c.admin.subject_exports.get(U)
    ),
    "admin-api GET /api/v1/admin/subject-exports": RouteCase(
        "/api/v1/admin/subject-exports", lambda c: c.admin.subject_exports.list()
    ),
    "admin-api GET /api/v1/data-spaces": RouteCase("/api/v1/data-spaces", lambda c: c.provisioning.data_spaces.list()),
    "admin-api GET /api/v1/site-domains/ai-settings": RouteCase(
        "/api/v1/site-domains/ai-settings", lambda c: c.admin.site_domains.get_ai_settings()
    ),
    "admin-api GET /api/v1/site-domains/ai-usage": RouteCase(
        "/api/v1/site-domains/ai-usage", lambda c: c.admin.site_domains.get_ai_usage()
    ),
    "admin-api GET /api/v1/site-domains/alert-destination": RouteCase(
        "/api/v1/site-domains/alert-destination", lambda c: c.admin.site_domains.get_alert_destination()
    ),
    "admin-api GET /api/v1/site-domains/content-gap": RouteCase(
        "/api/v1/site-domains/content-gap", lambda c: c.admin.site_domains.get_content_gap()
    ),
    "admin-api GET /api/v1/site-domains/search-account": RouteCase(
        "/api/v1/site-domains/search-account", lambda c: c.admin.site_domains.get_search_account()
    ),
    "admin-api GET /api/v1/site-domains/search-pool/queries": RouteCase(
        "/api/v1/site-domains/search-pool/queries", lambda c: c.admin.site_domains.list_search_pool_queries()
    ),
    "admin-api GET /api/v1/site-domains/search-pool": RouteCase(
        "/api/v1/site-domains/search-pool", lambda c: c.admin.site_domains.get_search_pool()
    ),
    "admin-api GET /api/v1/site-domains/keyword-clusters": RouteCase(
        "/api/v1/site-domains/keyword-clusters", lambda c: c.admin.site_domains.get_keyword_clusters("sample")
    ),
    "admin-api GET /api/v1/site-domains/keyword-lists": RouteCase(
        "/api/v1/site-domains/keyword-lists", lambda c: c.admin.site_domains.list_keyword_lists()
    ),
    "admin-api GET /api/v1/site-domains/portfolio-summary": RouteCase(
        "/api/v1/site-domains/portfolio-summary", lambda c: c.admin.site_domains.get_portfolio_summary()
    ),
    "admin-api GET /api/v1/site-domains/project-context": RouteCase(
        "/api/v1/site-domains/project-context", lambda c: c.admin.site_domains.get_project_context()
    ),
    "admin-api GET /api/v1/site-domains/referring-domains": RouteCase(
        "/api/v1/site-domains/referring-domains", lambda c: c.admin.site_domains.get_referring_domains("sample")
    ),
    "admin-api GET /api/v1/site-domains/regional-trends": RouteCase(
        "/api/v1/site-domains/regional-trends", lambda c: c.admin.site_domains.get_regional_trends()
    ),
    "admin-api GET /api/v1/site-domains/topic-trends": RouteCase(
        "/api/v1/site-domains/topic-trends", lambda c: c.admin.site_domains.get_topic_trends()
    ),
    "admin-api GET /api/v1/site-domains/web-domains": RouteCase(
        "/api/v1/site-domains/web-domains", lambda c: c.admin.site_domains.get_web_domains()
    ),
    "admin-api GET /api/v1/site-domains/web-pages": RouteCase(
        "/api/v1/site-domains/web-pages", lambda c: c.admin.site_domains.list_web_pages("sample")
    ),
    "admin-api GET /api/v1/site-domains/{domainUuid}/ai-visibility": RouteCase(
        f"/api/v1/site-domains/{U}/ai-visibility", lambda c: c.admin.site_domains.get_ai_visibility(U)
    ),
    "admin-api GET /api/v1/site-domains/{domainUuid}/analytics": RouteCase(
        f"/api/v1/site-domains/{U}/analytics", lambda c: c.admin.site_domains.get_analytics(U)
    ),
    "admin-api GET /api/v1/site-domains/{domainUuid}/audit-delta": RouteCase(
        f"/api/v1/site-domains/{U}/audit-delta", lambda c: c.admin.site_domains.get_audit_delta(U)
    ),
    "admin-api GET /api/v1/site-domains/{domainUuid}/audit-pages": RouteCase(
        f"/api/v1/site-domains/{U}/audit-pages", lambda c: c.admin.site_domains.list_audit_pages(U)
    ),
    "admin-api GET /api/v1/site-domains/{domainUuid}/saved-reports/{reportUuid}": RouteCase(
        f"/api/v1/site-domains/{U}/saved-reports/{U}", lambda c: c.admin.site_domains.get_saved_report(U, U)
    ),
    "admin-api GET /api/v1/site-domains/{domainUuid}/saved-reports": RouteCase(
        f"/api/v1/site-domains/{U}/saved-reports", lambda c: c.admin.site_domains.list_saved_reports(U)
    ),
    "admin-api GET /api/v1/site-domains/{domainUuid}/campaign-links": RouteCase(
        f"/api/v1/site-domains/{U}/campaign-links", lambda c: c.admin.site_domains.list_campaign_links(U)
    ),
    "admin-api GET /api/v1/site-domains/{domainUuid}/search-value": RouteCase(
        f"/api/v1/site-domains/{U}/search-value", lambda c: c.admin.site_domains.get_search_value(U, "sample")
    ),
    "admin-api GET /api/v1/site-domains/{domainUuid}/search/inspections": RouteCase(
        f"/api/v1/site-domains/{U}/search/inspections", lambda c: c.admin.site_domains.list_search_inspections(U)
    ),
    "admin-api GET /api/v1/site-domains/{domainUuid}/search/rows": RouteCase(
        f"/api/v1/site-domains/{U}/search/rows", lambda c: c.admin.site_domains.list_search_rows(U)
    ),
    "admin-api GET /api/v1/site-domains/{domainUuid}/search": RouteCase(
        f"/api/v1/site-domains/{U}/search", lambda c: c.admin.site_domains.get_search_performance(U)
    ),
    "admin-api GET /api/v1/site-domains/{domainUuid}/export/search-metrics": RouteCase(
        f"/api/v1/site-domains/{U}/export/search-metrics", lambda c: c.admin.site_domains.export_search_metrics(U)
    ),
    "admin-api GET /api/v1/site-domains/{domainUuid}/export": RouteCase(
        f"/api/v1/site-domains/{U}/export", lambda c: c.admin.site_domains.export(U)
    ),
    "admin-api GET /api/v1/site-domains/{domainUuid}/findings/{findingUuid}/search-impact": RouteCase(
        f"/api/v1/site-domains/{U}/findings/{U}/search-impact",
        lambda c: c.admin.site_domains.get_finding_search_impact(U, U),
    ),
    "admin-api GET /api/v1/site-domains/{domainUuid}/findings": RouteCase(
        f"/api/v1/site-domains/{U}/findings", lambda c: c.admin.site_domains.list_findings(U)
    ),
    "admin-api GET /api/v1/site-domains/{domainUuid}/incidents": RouteCase(
        f"/api/v1/site-domains/{U}/incidents", lambda c: c.admin.site_domains.list_incidents(U)
    ),
    "admin-api GET /api/v1/site-domains/{domainUuid}/indexnow": RouteCase(
        f"/api/v1/site-domains/{U}/indexnow", lambda c: c.admin.site_domains.get_indexnow(U)
    ),
    "admin-api GET /api/v1/site-domains/{domainUuid}/lighthouse/pages": RouteCase(
        f"/api/v1/site-domains/{U}/lighthouse/pages", lambda c: c.admin.site_domains.get_lighthouse_pages(U)
    ),
    "admin-api GET /api/v1/site-domains/{domainUuid}/lighthouse": RouteCase(
        f"/api/v1/site-domains/{U}/lighthouse", lambda c: c.admin.site_domains.get_lighthouse_history(U)
    ),
    "admin-api GET /api/v1/site-domains/{domainUuid}/next-actions": RouteCase(
        f"/api/v1/site-domains/{U}/next-actions", lambda c: c.admin.site_domains.get_next_actions(U)
    ),
    "admin-api GET /api/v1/site-domains/{domainUuid}/page-search-queries": RouteCase(
        f"/api/v1/site-domains/{U}/page-search-queries",
        lambda c: c.admin.site_domains.get_page_search_queries(U, "sample"),
    ),
    "admin-api GET /api/v1/site-domains/{domainUuid}/page-facts": RouteCase(
        f"/api/v1/site-domains/{U}/page-facts", lambda c: c.admin.site_domains.get_page_facts(U, "sample")
    ),
    "admin-api GET /api/v1/site-domains/{domainUuid}/page-rechecks/{recheckUuid}": RouteCase(
        f"/api/v1/site-domains/{U}/page-rechecks/{U}", lambda c: c.admin.site_domains.get_page_recheck(U, U)
    ),
    "admin-api GET /api/v1/site-domains/{domainUuid}/page-rechecks": RouteCase(
        f"/api/v1/site-domains/{U}/page-rechecks", lambda c: c.admin.site_domains.list_page_rechecks(U, U)
    ),
    "admin-api GET /api/v1/site-domains/{domainUuid}/page-wording": RouteCase(
        f"/api/v1/site-domains/{U}/page-wording",
        lambda c: c.admin.site_domains.compare_page_wording(U, "sample", "sample"),
    ),
    "admin-api GET /api/v1/site-domains/{domainUuid}/probes": RouteCase(
        f"/api/v1/site-domains/{U}/probes", lambda c: c.admin.site_domains.list_probes(U)
    ),
    "admin-api GET /api/v1/site-domains/{domainUuid}/rankings": RouteCase(
        f"/api/v1/site-domains/{U}/rankings", lambda c: c.admin.site_domains.get_rankings(U)
    ),
    "admin-api GET /api/v1/site-domains/{domainUuid}/report-shares": RouteCase(
        f"/api/v1/site-domains/{U}/report-shares", lambda c: c.admin.site_domains.list_report_shares(U)
    ),
    "admin-api GET /api/v1/site-domains/{domainUuid}/report": RouteCase(
        f"/api/v1/site-domains/{U}/report", lambda c: c.admin.site_domains.get_report(U)
    ),
    "admin-api GET /api/v1/site-domains/{domainUuid}/status-page": RouteCase(
        f"/api/v1/site-domains/{U}/status-page", lambda c: c.admin.site_domains.get_status_page_settings(U)
    ),
    "admin-api GET /api/v1/site-domains/{domainUuid}/traffic": RouteCase(
        f"/api/v1/site-domains/{U}/traffic", lambda c: c.admin.site_domains.get_traffic(U)
    ),
    "admin-api GET /api/v1/site-domains/{domainUuid}/uptime-history": RouteCase(
        f"/api/v1/site-domains/{U}/uptime-history", lambda c: c.admin.site_domains.get_uptime_history(U)
    ),
    "admin-api GET /api/v1/site-domains/{domainUuid}": RouteCase(
        f"/api/v1/site-domains/{U}", lambda c: c.admin.site_domains.get(U)
    ),
    "admin-api GET /api/v1/site-domains": RouteCase("/api/v1/site-domains", lambda c: c.admin.site_domains.list()),
    "admin-api GET /api/v1/producer-provisioning": RouteCase(
        "/api/v1/producer-provisioning", lambda c: c.provisioning.producers.list()
    ),
    "admin-api PATCH /api/v1/admin/data-scopes/{scopeUuid}/resources/{resourceUuid}": RouteCase(
        f"/api/v1/admin/data-scopes/{U}/resources/{U}",
        lambda c: c.admin.data_scopes.update_resource(U, U, {"name": "Orders"}),
    ),
    "admin-api PATCH /api/v1/admin/data-scopes/{scopeUuid}": RouteCase(
        f"/api/v1/admin/data-scopes/{U}", lambda c: c.admin.data_scopes.update_scope(U, {"name": "EU"})
    ),
    "admin-api PATCH /api/v1/admin/data-label-values/{valueUuid}": RouteCase(
        f"/api/v1/admin/data-label-values/{U}", lambda c: c.admin.data_labels.update_value(U, {})
    ),
    "admin-api PATCH /api/v1/admin/data-labels/{definitionUuid}": RouteCase(
        f"/api/v1/admin/data-labels/{U}", lambda c: c.admin.data_labels.update(U, {})
    ),
    "admin-api PATCH /api/v1/admin/measurement/predictions/definitions/{definitionUuid}": RouteCase(
        f"/api/v1/admin/measurement/predictions/definitions/{U}",
        lambda c: c.admin.predictions.update_definition("acme", U, {}),
    ),
    "admin-api PATCH /api/v1/admin/time-plans/{planUuid}": RouteCase(
        f"/api/v1/admin/time-plans/{U}", lambda c: c.admin.time_plans.revise("acme", U, {})
    ),
    "admin-api PATCH /api/v1/producer-provisioning/{clientId}/environment": RouteCase(
        f"/api/v1/producer-provisioning/{U}/environment",
        lambda c: c.provisioning.producers.update_environment(U, "sample"),
    ),
    "admin-api POST /api/v1/admin/access-log-hours/replay": RouteCase(
        "/api/v1/admin/access-log-hours/replay", lambda c: c.admin.site_domains.replay_access_log_hour("sample")
    ),
    "admin-api POST /api/v1/admin/auth-projects/{projectId}/company-binding": RouteCase(
        f"/api/v1/admin/auth-projects/{U}/company-binding", lambda c: c.admin.auth_projects.bind_project_company(U)
    ),
    "admin-api POST /api/v1/admin/auth-projects/{projectId}/delete": RouteCase(
        f"/api/v1/admin/auth-projects/{U}/delete", lambda c: c.admin.auth_projects.delete_project(U, {})
    ),
    "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/apply": RouteCase(
        f"/api/v1/admin/auth-projects/{U}/environments/{U}/apply",
        lambda c: c.admin.auth_projects.apply_environment_desired_state(
            U, U, {"desiredState": {}, "expectedRevision": 1}, OPT
        ),
    ),
    "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/delete": RouteCase(
        f"/api/v1/admin/auth-projects/{U}/environments/{U}/delete",
        lambda c: c.admin.auth_projects.delete_environment(U, U, {}),
    ),
    "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/invitations": RouteCase(
        f"/api/v1/admin/auth-projects/{U}/environments/{U}/invitations",
        lambda c: c.admin.auth_projects.issue_invitation(U, U, {}, OPT),
    ),
    "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/offboard": RouteCase(
        f"/api/v1/admin/auth-projects/{U}/environments/{U}/offboard",
        lambda c: c.admin.auth_projects.offboard_environment(U, U, {}),
    ),
    "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/preview": RouteCase(
        f"/api/v1/admin/auth-projects/{U}/environments/{U}/preview",
        lambda c: c.admin.auth_projects.preview_environment_desired_state(
            U, U, {"desiredState": {}, "expectedRevision": 1}, OPT
        ),
    ),
    "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments": RouteCase(
        f"/api/v1/admin/auth-projects/{U}/environments", lambda c: c.admin.auth_projects.create_environment(U, {})
    ),
    "admin-api POST /api/v1/admin/auth-projects": RouteCase(
        "/api/v1/admin/auth-projects", lambda c: c.admin.auth_projects.create_project({"name": "Demo"}, OPT)
    ),
    "admin-api POST /api/v1/admin/data-scope-grants/revoke": RouteCase(
        "/api/v1/admin/data-scope-grants/revoke", lambda c: c.admin.data_scopes.revoke_grant(GRANT)
    ),
    "admin-api POST /api/v1/admin/data-scope-grants": RouteCase(
        "/api/v1/admin/data-scope-grants", lambda c: c.admin.data_scopes.create_grant(GRANT)
    ),
    "admin-api POST /api/v1/admin/data-scopes/{scopeUuid}/disable": RouteCase(
        f"/api/v1/admin/data-scopes/{U}/disable", lambda c: c.admin.data_scopes.disable_scope(U)
    ),
    "admin-api POST /api/v1/admin/data-scopes/{scopeUuid}/resources/{resourceUuid}/disable": RouteCase(
        f"/api/v1/admin/data-scopes/{U}/resources/{U}/disable", lambda c: c.admin.data_scopes.disable_resource(U, U)
    ),
    "admin-api POST /api/v1/admin/data-scopes/{scopeUuid}/resources": RouteCase(
        f"/api/v1/admin/data-scopes/{U}/resources",
        lambda c: c.admin.data_scopes.create_resource(U, {"code": "orders", "name": "Orders"}),
    ),
    "admin-api POST /api/v1/admin/data-scopes": RouteCase(
        "/api/v1/admin/data-scopes", lambda c: c.admin.data_scopes.create_scope({"code": "eu", "name": "EU"})
    ),
    "admin-api POST /api/v1/admin/data-label-values/{valueUuid}/disable": RouteCase(
        f"/api/v1/admin/data-label-values/{U}/disable", lambda c: c.admin.data_labels.disable_value(U)
    ),
    "admin-api POST /api/v1/admin/data-labels/{definitionUuid}/disable": RouteCase(
        f"/api/v1/admin/data-labels/{U}/disable", lambda c: c.admin.data_labels.disable(U)
    ),
    "admin-api POST /api/v1/admin/data-labels/{definitionUuid}/values": RouteCase(
        f"/api/v1/admin/data-labels/{U}/values", lambda c: c.admin.data_labels.create_value(U, {})
    ),
    "admin-api POST /api/v1/admin/data-labels": RouteCase(
        "/api/v1/admin/data-labels", lambda c: c.admin.data_labels.create({})
    ),
    "admin-api POST /api/v1/admin/sites/{siteUuid}/rotate-write-key": RouteCase(
        f"/api/v1/admin/sites/{U}/rotate-write-key", lambda c: c.admin.sites.rotate_write_key(U)
    ),
    "admin-api POST /api/v1/admin/sites": RouteCase("/api/v1/admin/sites", lambda c: c.admin.sites.create({})),
    "admin-api POST /api/v1/admin/measurement/predictions/definitions/{definitionUuid}/activate": RouteCase(
        f"/api/v1/admin/measurement/predictions/definitions/{U}/activate",
        lambda c: c.admin.predictions.activate_version("acme", U, {}),
    ),
    "admin-api POST /api/v1/admin/measurement/predictions/definitions/{definitionUuid}/archive": RouteCase(
        f"/api/v1/admin/measurement/predictions/definitions/{U}/archive",
        lambda c: c.admin.predictions.archive_definition("acme", U),
    ),
    "admin-api POST /api/v1/admin/measurement/predictions/definitions/{definitionUuid}/pause": RouteCase(
        f"/api/v1/admin/measurement/predictions/definitions/{U}/pause",
        lambda c: c.admin.predictions.pause_definition("acme", U),
    ),
    "admin-api POST /api/v1/admin/measurement/predictions/definitions/{definitionUuid}/publish": RouteCase(
        f"/api/v1/admin/measurement/predictions/definitions/{U}/publish",
        lambda c: c.admin.predictions.publish_version("acme", U, {}),
    ),
    "admin-api POST /api/v1/admin/measurement/predictions/definitions/{definitionUuid}/resume": RouteCase(
        f"/api/v1/admin/measurement/predictions/definitions/{U}/resume",
        lambda c: c.admin.predictions.resume_definition("acme", U),
    ),
    "admin-api POST /api/v1/admin/measurement/predictions/definitions/{definitionUuid}/run-now": RouteCase(
        f"/api/v1/admin/measurement/predictions/definitions/{U}/run-now",
        lambda c: c.admin.predictions.run_now("acme", U),
    ),
    "admin-api POST /api/v1/admin/measurement/predictions/definitions": RouteCase(
        "/api/v1/admin/measurement/predictions/definitions", lambda c: c.admin.predictions.create_definition("acme", {})
    ),
    "admin-api POST /api/v1/admin/measurement/predictions/sources/{sourceUuid}/activate": RouteCase(
        f"/api/v1/admin/measurement/predictions/sources/{U}/activate",
        lambda c: c.admin.predictions.activate_signal_source("acme", U),
    ),
    "admin-api POST /api/v1/admin/measurement/predictions/sources/{sourceUuid}/archive": RouteCase(
        f"/api/v1/admin/measurement/predictions/sources/{U}/archive",
        lambda c: c.admin.predictions.archive_signal_source("acme", U),
    ),
    "admin-api POST /api/v1/admin/measurement/predictions/sources": RouteCase(
        "/api/v1/admin/measurement/predictions/sources", lambda c: c.admin.predictions.create_signal_source("acme", {})
    ),
    "admin-api POST /api/v1/admin/measurement/projects/{projectUuid}/observations:bulk": RouteCase(
        f"/api/v1/admin/measurement/projects/{U}/observations:bulk",
        lambda c: c.admin.measurement.projects.submit_observations(U, {"rows": [{}]}),
    ),
    "admin-api POST /api/v1/admin/measurement/projects/{projectUuid}/observations:csv": RouteCase(
        f"/api/v1/admin/measurement/projects/{U}/observations:csv",
        lambda c: c.admin.measurement.projects.import_csv_string(U, "a,b\n1,2", 1),
    ),
    "admin-api POST /api/v1/admin/measurement/projects": RouteCase(
        "/api/v1/admin/measurement/projects", lambda c: c.admin.measurement.projects.create({})
    ),
    "admin-api POST /api/v1/admin/oauth-clients/{clientId}/rotate-secret": RouteCase(
        f"/api/v1/admin/oauth-clients/{U}/rotate-secret", lambda c: c.admin.oauth_clients.rotate_secret(U)
    ),
    "admin-api POST /api/v1/admin/oauth-clients": RouteCase(
        "/api/v1/admin/oauth-clients", lambda c: c.admin.oauth_clients.create({})
    ),
    "admin-api POST /api/v1/admin/offboarding/schedules/{tenantSlug}/cancel": RouteCase(
        "/api/v1/admin/offboarding/schedules/acme/cancel", lambda c: c.admin.offboarding.cancel_schedule("acme", {})
    ),
    "admin-api POST /api/v1/admin/offboarding/schedules": RouteCase(
        "/api/v1/admin/offboarding/schedules",
        lambda c: c.admin.offboarding.schedule(
            {
                "tenant_slug": "acme",
                "effective_at": "2026-12-01T00:00:00Z",
                "grace_period_days": 30,
                "reason": "closing",
            }
        ),
    ),
    "admin-api POST /api/v1/admin/offboarding/requests/{requestUuid}/acknowledge": RouteCase(
        f"/api/v1/admin/offboarding/requests/{U}/acknowledge", lambda c: c.admin.offboarding.acknowledge(U)
    ),
    "admin-api POST /api/v1/admin/offboarding/requests/{requestUuid}/execute": RouteCase(
        f"/api/v1/admin/offboarding/requests/{U}/execute", lambda c: c.admin.offboarding.execute(U)
    ),
    "admin-api POST /api/v1/admin/offboarding/requests/{requestUuid}/export": RouteCase(
        f"/api/v1/admin/offboarding/requests/{U}/export", lambda c: c.admin.offboarding.export(U)
    ),
    "admin-api POST /api/v1/admin/offboarding/requests/{requestUuid}/preview": RouteCase(
        f"/api/v1/admin/offboarding/requests/{U}/preview", lambda c: c.admin.offboarding.preview(U)
    ),
    "admin-api POST /api/v1/admin/offboarding/requests/{requestUuid}/retry": RouteCase(
        f"/api/v1/admin/offboarding/requests/{U}/retry", lambda c: c.admin.offboarding.retry(U)
    ),
    "admin-api POST /api/v1/admin/offboarding/{requestUuid}/cancel": RouteCase(
        f"/api/v1/admin/offboarding/{U}/cancel", lambda c: c.admin.offboarding.cancel_request(U, {})
    ),
    "admin-api POST /api/v1/admin/offboarding/{requestUuid}/confirm": RouteCase(
        f"/api/v1/admin/offboarding/{U}/confirm", lambda c: c.admin.offboarding.confirm_request(U)
    ),
    "admin-api POST /api/v1/admin/offboarding": RouteCase(
        "/api/v1/admin/offboarding", lambda c: c.admin.offboarding.request({})
    ),
    "admin-api POST /api/v1/admin/privacy/erasures/{requestUuid}/force": RouteCase(
        f"/api/v1/admin/privacy/erasures/{U}/force", lambda c: c.admin.privacy_erasures.force(U)
    ),
    "admin-api POST /api/v1/admin/privacy/erasures": RouteCase(
        "/api/v1/admin/privacy/erasures", lambda c: c.admin.privacy_erasures.create({})
    ),
    "admin-api POST /api/v1/admin/reporting-packs/drafts/{draftId}/publish": RouteCase(
        f"/api/v1/admin/reporting-packs/drafts/{U}/publish", lambda c: c.admin.reporting_packs.publish(U)
    ),
    "admin-api POST /api/v1/admin/reporting-packs/drafts": RouteCase(
        "/api/v1/admin/reporting-packs/drafts", lambda c: c.admin.reporting_packs.create_draft({})
    ),
    "admin-api POST /api/v1/admin/reporting-packs/setup-templates/{kind}/bind": RouteCase(
        "/api/v1/admin/reporting-packs/setup-templates/sample/bind",
        lambda c: c.admin.reporting_packs.bind_setup_template("sample", {}),
    ),
    "admin-api POST /api/v1/admin/reporting-packs/preview": RouteCase(
        "/api/v1/admin/reporting-packs/preview", lambda c: c.admin.reporting_packs.preview({})
    ),
    "admin-api POST /api/v1/admin/reporting-packs/validate": RouteCase(
        "/api/v1/admin/reporting-packs/validate", lambda c: c.admin.reporting_packs.validate({})
    ),
    "admin-api POST /api/v1/admin/retention/policies/{tenantSlug}/apply": RouteCase(
        "/api/v1/admin/retention/policies/acme/apply", lambda c: c.admin.retention.apply("acme")
    ),
    "admin-api POST /api/v1/admin/retention/policies/{tenantSlug}/preview": RouteCase(
        "/api/v1/admin/retention/policies/acme/preview", lambda c: c.admin.retention.preview("acme")
    ),
    "admin-api POST /api/v1/admin/tenants": RouteCase(
        "/api/v1/admin/tenants", lambda c: c.admin.tenants.create({})
    ),
    "admin-api POST /api/v1/admin/time-plans/preview": RouteCase(
        "/api/v1/admin/time-plans/preview", lambda c: c.admin.time_plans.preview("acme", {})
    ),
    "admin-api POST /api/v1/admin/time-plans/runs/{runUuid}/annotations/{annotationUuid}/corrections": RouteCase(
        f"/api/v1/admin/time-plans/runs/{U}/annotations/{U}/corrections",
        lambda c: c.admin.time_plans.correct_annotation("acme", U, U, {}),
    ),
    "admin-api POST /api/v1/admin/time-plans/runs/{runUuid}/annotations/{annotationUuid}/redact": RouteCase(
        f"/api/v1/admin/time-plans/runs/{U}/annotations/{U}/redact",
        lambda c: c.admin.time_plans.redact_annotation("acme", U, U, {}),
    ),
    "admin-api POST /api/v1/admin/time-plans/runs/{runUuid}/annotations": RouteCase(
        f"/api/v1/admin/time-plans/runs/{U}/annotations", lambda c: c.admin.time_plans.create_annotation("acme", U, {})
    ),
    "admin-api POST /api/v1/admin/time-plans/runs/{runUuid}/commands": RouteCase(
        f"/api/v1/admin/time-plans/runs/{U}/commands", lambda c: c.admin.time_plans.execute("acme", U, {})
    ),
    "admin-api POST /api/v1/admin/time-plans/runs": RouteCase(
        "/api/v1/admin/time-plans/runs", lambda c: c.admin.time_plans.create_run("acme", {})
    ),
    "admin-api POST /api/v1/admin/time-plans/{planUuid}/publish": RouteCase(
        f"/api/v1/admin/time-plans/{U}/publish", lambda c: c.admin.time_plans.publish("acme", U, {})
    ),
    "admin-api POST /api/v1/admin/time-plans/{planUuid}/retire": RouteCase(
        f"/api/v1/admin/time-plans/{U}/retire", lambda c: c.admin.time_plans.retire("acme", U)
    ),
    "admin-api POST /api/v1/admin/time-plans": RouteCase(
        "/api/v1/admin/time-plans", lambda c: c.admin.time_plans.create("acme", {})
    ),
    "admin-api POST /api/v1/admin/subject-exports/{requestId}/cancel": RouteCase(
        f"/api/v1/admin/subject-exports/{U}/cancel", lambda c: c.admin.subject_exports.cancel(U)
    ),
    "admin-api POST /api/v1/admin/subject-exports/{requestId}/force": RouteCase(
        f"/api/v1/admin/subject-exports/{U}/force", lambda c: c.admin.subject_exports.force(U, "acme")
    ),
    "admin-api POST /api/v1/admin/subject-exports": RouteCase(
        "/api/v1/admin/subject-exports", lambda c: c.admin.subject_exports.create({})
    ),
    "admin-api POST /api/v1/data-spaces": RouteCase(
        "/api/v1/data-spaces", lambda c: c.provisioning.data_spaces.create({})
    ),
    "admin-api POST /api/v1/site-domains/{domainUuid}/attestation": RouteCase(
        f"/api/v1/site-domains/{U}/attestation", lambda c: c.admin.site_domains.attest(U)
    ),
    "admin-api POST /api/v1/site-domains/{domainUuid}/audit": RouteCase(
        f"/api/v1/site-domains/{U}/audit", lambda c: c.admin.site_domains.request_audit(U)
    ),
    "admin-api POST /api/v1/site-domains/{domainUuid}/saved-reports": RouteCase(
        f"/api/v1/site-domains/{U}/saved-reports", lambda c: c.admin.site_domains.save_report(U, {"name": "Weekly"})
    ),
    "admin-api POST /api/v1/site-domains/{domainUuid}/campaign-links/{linkUuid}/archive": RouteCase(
        f"/api/v1/site-domains/{U}/campaign-links/{U}/archive",
        lambda c: c.admin.site_domains.archive_campaign_link(U, U),
    ),
    "admin-api POST /api/v1/site-domains/{domainUuid}/campaign-links": RouteCase(
        f"/api/v1/site-domains/{U}/campaign-links",
        lambda c: c.admin.site_domains.create_campaign_link(
            U, {"url": "https://example.com/", "source": "news", "medium": "email", "campaign": "launch"}
        ),
    ),
    "admin-api POST /api/v1/site-domains/{domainUuid}/search/inspections": RouteCase(
        f"/api/v1/site-domains/{U}/search/inspections",
        lambda c: c.admin.site_domains.request_search_inspection(U, "sample"),
    ),
    "admin-api POST /api/v1/site-domains/{domainUuid}/search/{provider}/retry": RouteCase(
        f"/api/v1/site-domains/{U}/search/google/retry", lambda c: c.admin.site_domains.retry_search_import(U, "google")
    ),
    "admin-api POST /api/v1/site-domains/{domainUuid}/indexnow/submissions": RouteCase(
        f"/api/v1/site-domains/{U}/indexnow/submissions", lambda c: c.admin.site_domains.submit_indexnow(U, "sample")
    ),
    "admin-api POST /api/v1/site-domains/{domainUuid}/indexnow/verify": RouteCase(
        f"/api/v1/site-domains/{U}/indexnow/verify", lambda c: c.admin.site_domains.verify_indexnow(U)
    ),
    "admin-api POST /api/v1/site-domains/{domainUuid}/page-check": RouteCase(
        f"/api/v1/site-domains/{U}/page-check", lambda c: c.admin.site_domains.check_page(U, "sample", "sample")
    ),
    "admin-api POST /api/v1/site-domains/{domainUuid}/page-rechecks": RouteCase(
        f"/api/v1/site-domains/{U}/page-rechecks", lambda c: c.admin.site_domains.request_page_recheck(U, "sample")
    ),
    "admin-api POST /api/v1/site-domains/{domainUuid}/rankings/keywords": RouteCase(
        f"/api/v1/site-domains/{U}/rankings/keywords",
        lambda c: c.admin.site_domains.track_keyword(U, {"keyword": "custd"}),
    ),
    "admin-api POST /api/v1/site-domains/{domainUuid}/report-shares": RouteCase(
        f"/api/v1/site-domains/{U}/report-shares", lambda c: c.admin.site_domains.create_report_share(U)
    ),
    "admin-api POST /api/v1/site-domains/{domainUuid}/robots-test": RouteCase(
        f"/api/v1/site-domains/{U}/robots-test", lambda c: c.admin.site_domains.test_robots(U, "sample", "sample")
    ),
    "admin-api POST /api/v1/site-domains/{domainUuid}/status-page/preview": RouteCase(
        f"/api/v1/site-domains/{U}/status-page/preview", lambda c: c.admin.site_domains.preview_status_page(U, {})
    ),
    "admin-api POST /api/v1/site-domains/{domainUuid}/status-page/updates": RouteCase(
        f"/api/v1/site-domains/{U}/status-page/updates", lambda c: c.admin.site_domains.post_status_page_update(U, {})
    ),
    "admin-api POST /api/v1/site-domains/{domainUuid}/verify": RouteCase(
        f"/api/v1/site-domains/{U}/verify", lambda c: c.admin.site_domains.verify(U)
    ),
    "admin-api POST /api/v1/site-domains/{domainUuid}/wording-compare": RouteCase(
        f"/api/v1/site-domains/{U}/wording-compare",
        lambda c: c.admin.site_domains.compare_wording(U, "sample", "sample"),
    ),
    "admin-api POST /api/v1/site-domains": RouteCase(
        "/api/v1/site-domains", lambda c: c.admin.site_domains.create({"host": "example.com"})
    ),
    "admin-api POST /api/v1/producer-provisioning/{clientId}/rotate-secret": RouteCase(
        f"/api/v1/producer-provisioning/{U}/rotate-secret", lambda c: c.provisioning.producers.rotate_secret(U)
    ),
    "admin-api POST /api/v1/producer-provisioning": RouteCase(
        "/api/v1/producer-provisioning", lambda c: c.provisioning.producers.provision({})
    ),
    "admin-api PUT /api/v1/admin/event-schemas/{schemaUuid}/field-data-labels": RouteCase(
        f"/api/v1/admin/event-schemas/{U}/field-data-labels",
        lambda c: c.admin.data_labels.set_schema_field_assignment(U, {}),
    ),
    "admin-api PUT /api/v1/admin/event-types/{slug}/data-label-defaults/{definitionUuid}": RouteCase(
        f"/api/v1/admin/event-types/acme/data-label-defaults/{U}",
        lambda c: c.admin.data_labels.set_event_type_default("acme", U, {}),
    ),
    "admin-api PUT /api/v1/admin/reporting-packs/drafts/{draftId}": RouteCase(
        f"/api/v1/admin/reporting-packs/drafts/{U}", lambda c: c.admin.reporting_packs.update_draft(U, {})
    ),
    "admin-api PUT /api/v1/admin/retention/policies/{tenantSlug}": RouteCase(
        "/api/v1/admin/retention/policies/acme", lambda c: c.admin.retention.upsert("acme", {})
    ),
    "admin-api PUT /api/v1/site-domains/ai-settings/consent": RouteCase(
        "/api/v1/site-domains/ai-settings/consent", lambda c: c.admin.site_domains.set_ai_consent({})
    ),
    "admin-api PUT /api/v1/site-domains/ai-settings": RouteCase(
        "/api/v1/site-domains/ai-settings", lambda c: c.admin.site_domains.set_ai_settings({})
    ),
    "admin-api PUT /api/v1/site-domains/alert-destination": RouteCase(
        "/api/v1/site-domains/alert-destination", lambda c: c.admin.site_domains.set_alert_destination("sample")
    ),
    "admin-api PUT /api/v1/site-domains/search-pool": RouteCase(
        "/api/v1/site-domains/search-pool", lambda c: c.admin.site_domains.set_search_pool(False)
    ),
    "admin-api PUT /api/v1/site-domains/keyword-lists": RouteCase(
        "/api/v1/site-domains/keyword-lists",
        lambda c: c.admin.site_domains.save_keyword_list({"name": "Core", "keywords": ["custd"]}),
    ),
    "admin-api PUT /api/v1/site-domains/project-context": RouteCase(
        "/api/v1/site-domains/project-context", lambda c: c.admin.site_domains.set_project_context({})
    ),
    "admin-api PUT /api/v1/site-domains/{domainUuid}/analytics/ga4": RouteCase(
        f"/api/v1/site-domains/{U}/analytics/ga4", lambda c: c.admin.site_domains.connect_analytics(U, U)
    ),
    "admin-api PUT /api/v1/site-domains/{domainUuid}/saved-reports/{reportUuid}": RouteCase(
        f"/api/v1/site-domains/{U}/saved-reports/{U}",
        lambda c: c.admin.site_domains.replace_saved_report(U, U, {"name": "Weekly"}),
    ),
    "admin-api PUT /api/v1/site-domains/{domainUuid}/checks": RouteCase(
        f"/api/v1/site-domains/{U}/checks", lambda c: c.admin.site_domains.set_check_mode(U, "warm")
    ),
    "admin-api PUT /api/v1/site-domains/{domainUuid}/search/{provider}": RouteCase(
        f"/api/v1/site-domains/{U}/search/google",
        lambda c: c.admin.site_domains.connect_search(U, "google", {"property": "sc-domain:example.com"}),
    ),
    "admin-api PUT /api/v1/site-domains/{domainUuid}/indexnow": RouteCase(
        f"/api/v1/site-domains/{U}/indexnow", lambda c: c.admin.site_domains.enable_indexnow(U)
    ),
    "admin-api PUT /api/v1/site-domains/{domainUuid}/lighthouse/pages": RouteCase(
        f"/api/v1/site-domains/{U}/lighthouse/pages", lambda c: c.admin.site_domains.set_lighthouse_pages(U, "sample")
    ),
    "admin-api PUT /api/v1/site-domains/{domainUuid}/probes": RouteCase(
        f"/api/v1/site-domains/{U}/probes", lambda c: c.admin.site_domains.set_probes(U, {})
    ),
    "admin-api PUT /api/v1/site-domains/{domainUuid}/rankings/keywords/{keywordUuid}": RouteCase(
        f"/api/v1/site-domains/{U}/rankings/keywords/{U}",
        lambda c: c.admin.site_domains.update_tracked_keyword(U, U, paused=True),
    ),
    "admin-api PUT /api/v1/site-domains/{domainUuid}/status-page": RouteCase(
        f"/api/v1/site-domains/{U}/status-page", lambda c: c.admin.site_domains.publish_status_page(U, {})
    ),
    "analytics-api GET /api/v1/processing/{receiptUuid}": RouteCase(
        f"/api/v1/processing/{U}", lambda c: c.reporting.receipt(U)
    ),
    "analytics-api GET /api/v1/reporting/dashboards/{key}": RouteCase(
        "/api/v1/reporting/dashboards/sample-key", lambda c: c.reporting.dashboard("sample-key")
    ),
    "analytics-api GET /api/v1/reporting/exports/{exportID}/artifacts/{artifactID}": RouteCase(
        f"/api/v1/reporting/exports/{U}/artifacts/{U}", lambda c: c.reporting.download_export(U, U)
    ),
    "analytics-api GET /api/v1/reporting/exports/{exportID}": RouteCase(
        f"/api/v1/reporting/exports/{U}", lambda c: c.reporting.get_export(U)
    ),
    "analytics-api GET /api/v1/reporting/exports": RouteCase(
        "/api/v1/reporting/exports", lambda c: c.reporting.list_exports()
    ),
    "analytics-api GET /api/v1/reporting/outputs/{outputUuid}": RouteCase(
        f"/api/v1/reporting/outputs/{U}", lambda c: c.reporting.output(U)
    ),
    "analytics-api GET /api/v1/reporting/outputs": RouteCase(
        "/api/v1/reporting/outputs", lambda c: c.reporting.outputs()
    ),
    "analytics-api POST /api/v1/analytics/query-range": RouteCase(
        "/api/v1/analytics/query-range", lambda c: c.analytics.query_range({"from": "2026-11-01", "to": "2026-11-02"})
    ),
    "analytics-api POST /api/v1/analytics/query": RouteCase(
        "/api/v1/analytics/query", lambda c: c.analytics.query({"date": "2026-11-01"})
    ),
    "analytics-api POST /api/v1/reporting/exports/{exportID}/cancel": RouteCase(
        f"/api/v1/reporting/exports/{U}/cancel", lambda c: c.reporting.cancel_export(U)
    ),
    "analytics-api POST /api/v1/reporting/exports": RouteCase(
        "/api/v1/reporting/exports",
        lambda c: c.reporting.create_export({"dashboardKey": "overview", "formats": ["csv"]}),
    ),
    "analytics-api POST /api/v1/reporting/insights/subject": RouteCase(
        "/api/v1/reporting/insights/subject",
        lambda c: c.reporting.subject_insight({"template": "page_summary", "subject": "/", "rangeDays": 7}),
    ),
    "analytics-api POST /api/v1/reporting/outputs/{outputUuid}/query": RouteCase(
        f"/api/v1/reporting/outputs/{U}/query", lambda c: c.reporting.query_output(U, {})
    ),
    "analytics-api POST /api/v1/reporting/query": RouteCase("/api/v1/reporting/query", lambda c: c.reporting.query({})),
    "schema-registry DELETE /api/v1/parsers/{uuid}": RouteCase(f"/api/v1/parsers/{U}", lambda c: c.parsers.delete(U)),
    "schema-registry GET /api/v1/parsers/presets": RouteCase(
        "/api/v1/parsers/presets", lambda c: c.parsers.list_presets()
    ),
    "schema-registry GET /api/v1/parsers": RouteCase("/api/v1/parsers", lambda c: c.parsers.list()),
    "schema-registry POST /api/v1/parsers": RouteCase("/api/v1/parsers", lambda c: c.parsers.create(PARSER)),
    "schema-registry PUT /api/v1/parsers/{uuid}": RouteCase(
        f"/api/v1/parsers/{U}", lambda c: c.parsers.update(U, PARSER)
    ),
    "admin-api GET /api/v1/tenant-storage-locations": RouteCase(
        "/api/v1/tenant-storage-locations", lambda c: c.admin.tenant_storage.list()
    ),
    "admin-api POST /api/v1/tenant-storage-locations": RouteCase(
        "/api/v1/tenant-storage-locations", lambda c: c.admin.tenant_storage.create()
    ),
    "admin-api GET /api/v1/tenant-storage-locations/{id}": RouteCase(
        "/api/v1/tenant-storage-locations/7", lambda c: c.admin.tenant_storage.get(7)
    ),
    "admin-api DELETE /api/v1/tenant-storage-locations/{id}": RouteCase(
        "/api/v1/tenant-storage-locations/7", lambda c: c.admin.tenant_storage.revoke(7)
    ),
    "schema-registry GET /api/v1/schemas": RouteCase("/api/v1/schemas", lambda c: c.admin.schemas.list()),
    "schema-registry GET /api/v1/schemas/{eventType}/versions": RouteCase(
        "/api/v1/schemas/page_view/versions", lambda c: c.admin.schemas.list_versions("page_view")
    ),
    "schema-registry GET /api/v1/schemas/{eventType}/{version}": RouteCase(
        "/api/v1/schemas/page_view/1.0.0", lambda c: c.admin.schemas.get("page_view", "1.0.0")
    ),
    "schema-registry POST /api/v1/schemas": RouteCase("/api/v1/schemas", lambda c: c.admin.schemas.register(SCHEMA)),
    "admin-api GET /api/v1/data-spaces/usage": RouteCase(
        "/api/v1/data-spaces/usage", lambda c: c.provisioning.data_spaces.get_usage()
    ),
    "admin-api GET /api/v1/data-spaces/{slug}/producer-reservations": RouteCase(
        "/api/v1/data-spaces/acme/producer-reservations", lambda c: c.provisioning.reservations.list("acme")
    ),
    "admin-api POST /api/v1/data-spaces/{slug}/producer-reservations": RouteCase(
        "/api/v1/data-spaces/acme/producer-reservations",
        lambda c: c.provisioning.reservations.reserve("acme", {"producerSlug": "web", "ttlSeconds": 60}),
    ),
    "admin-api POST /api/v1/data-spaces/{slug}/producer-reservations/{producerSlug}/claim": RouteCase(
        "/api/v1/data-spaces/acme/producer-reservations/web/claim",
        lambda c: c.provisioning.reservations.claim("acme", "web", {"claimedByClientId": U}),
    ),
    "admin-api DELETE /api/v1/data-spaces/{slug}/producer-reservations/{producerSlug}": RouteCase(
        "/api/v1/data-spaces/acme/producer-reservations/web",
        lambda c: c.provisioning.reservations.release("acme", "web"),
    ),
    "admin-api GET /api/v1/producer-provisioning/{clientId}": RouteCase(
        f"/api/v1/producer-provisioning/{U}", lambda c: c.provisioning.producers.get(U)
    ),
    "admin-api POST /api/v1/site-domains/{domainUuid}/approval": RouteCase(
        f"/api/v1/site-domains/{U}/approval", lambda c: c.admin.site_domains.approve(U)
    ),
    "admin-api DELETE /api/v1/site-domains/{domainUuid}/approval": RouteCase(
        f"/api/v1/site-domains/{U}/approval", lambda c: c.admin.site_domains.withdraw_approval(U)
    ),
    "admin-api POST /api/v1/site-domains/{domainUuid}/uptime-check": RouteCase(
        f"/api/v1/site-domains/{U}/uptime-check", lambda c: c.admin.site_domains.request_uptime_check(U)
    ),
    "admin-api POST /api/v1/site-domains/{domainUuid}/incidents/{incidentUuid}/acknowledgment": RouteCase(
        f"/api/v1/site-domains/{U}/incidents/{U}/acknowledgment",
        lambda c: c.admin.site_domains.acknowledge_incident(U, U),
    ),
    "admin-api PUT /api/v1/site-domains/{domainUuid}/browser-collector": RouteCase(
        f"/api/v1/site-domains/{U}/browser-collector",
        lambda c: c.admin.site_domains.set_browser_collector(U, {"mode": "disabled"}),
    ),
    "admin-api GET /api/v1/site-domains/{domainUuid}/finding-dismissals": RouteCase(
        f"/api/v1/site-domains/{U}/finding-dismissals", lambda c: c.admin.site_domains.list_finding_dismissals(U)
    ),
    "admin-api POST /api/v1/site-domains/{domainUuid}/finding-dismissals": RouteCase(
        f"/api/v1/site-domains/{U}/finding-dismissals",
        lambda c: c.admin.site_domains.dismiss_finding(U, {"findingUuid": U, "reason": "known", "scope": "rule"}),
    ),
    "admin-api DELETE /api/v1/site-domains/{domainUuid}/finding-dismissals/{dismissalUuid}": RouteCase(
        f"/api/v1/site-domains/{U}/finding-dismissals/{U}", lambda c: c.admin.site_domains.restore_finding(U, U)
    ),
    "admin-api GET /api/v1/site-domains/{domainUuid}/heartbeats": RouteCase(
        f"/api/v1/site-domains/{U}/heartbeats", lambda c: c.admin.site_domains.list_heartbeats(U)
    ),
    "admin-api POST /api/v1/site-domains/{domainUuid}/heartbeats": RouteCase(
        f"/api/v1/site-domains/{U}/heartbeats", lambda c: c.admin.site_domains.create_heartbeat(U, HEARTBEAT)
    ),
    "admin-api POST /api/v1/site-domains/{domainUuid}/heartbeats/{monitorUuid}/credential": RouteCase(
        f"/api/v1/site-domains/{U}/heartbeats/{U}/credential", lambda c: c.admin.site_domains.rotate_heartbeat(U, U)
    ),
    "admin-api DELETE /api/v1/site-domains/{domainUuid}/heartbeats/{monitorUuid}": RouteCase(
        f"/api/v1/site-domains/{U}/heartbeats/{U}", lambda c: c.admin.site_domains.delete_heartbeat(U, U)
    ),
    "admin-api GET /api/v1/site-domains/{domainUuid}/private-uptime": RouteCase(
        f"/api/v1/site-domains/{U}/private-uptime", lambda c: c.admin.site_domains.get_private_uptime(U)
    ),
    "admin-api POST /api/v1/site-domains/{domainUuid}/private-uptime": RouteCase(
        f"/api/v1/site-domains/{U}/private-uptime",
        lambda c: c.admin.site_domains.create_private_uptime(U, {"networkLabel": "office"}),
    ),
    "admin-api POST /api/v1/site-domains/{domainUuid}/private-uptime/check": RouteCase(
        f"/api/v1/site-domains/{U}/private-uptime/check", lambda c: c.admin.site_domains.request_private_uptime(U)
    ),
    "admin-api POST /api/v1/site-domains/{domainUuid}/private-uptime/{monitorUuid}/credential": RouteCase(
        f"/api/v1/site-domains/{U}/private-uptime/{U}/credential",
        lambda c: c.admin.site_domains.rotate_private_uptime(U, U),
    ),
    "admin-api DELETE /api/v1/site-domains/{domainUuid}/private-uptime/{monitorUuid}": RouteCase(
        f"/api/v1/site-domains/{U}/private-uptime/{U}", lambda c: c.admin.site_domains.delete_private_uptime(U, U)
    ),
    "admin-api GET /api/v1/site-domains/{domainUuid}/maintenance": RouteCase(
        f"/api/v1/site-domains/{U}/maintenance", lambda c: c.admin.site_domains.list_maintenance(U)
    ),
    "admin-api POST /api/v1/site-domains/{domainUuid}/maintenance": RouteCase(
        f"/api/v1/site-domains/{U}/maintenance", lambda c: c.admin.site_domains.schedule_maintenance(U, MAINTENANCE)
    ),
    "admin-api DELETE /api/v1/site-domains/{domainUuid}/maintenance/{windowUuid}": RouteCase(
        f"/api/v1/site-domains/{U}/maintenance/{U}", lambda c: c.admin.site_domains.cancel_maintenance(U, U)
    ),
    "admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/app-links": RouteCase(
        f"/api/v1/admin/auth-projects/{U}/environments/{U}/app-links",
        lambda c: c.admin.auth_projects.list_environment_app_links(U, U),
    ),
    "admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/domain": RouteCase(
        f"/api/v1/admin/auth-projects/{U}/environments/{U}/domain",
        lambda c: c.admin.auth_projects.get_environment_domain(U, U),
    ),
    "admin-api PUT /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/domain": RouteCase(
        f"/api/v1/admin/auth-projects/{U}/environments/{U}/domain",
        lambda c: c.admin.auth_projects.bind_environment_domain(U, U, {"host": "auth.example.com", "siteDomainId": U}),
    ),
    "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/domain/mint": RouteCase(
        f"/api/v1/admin/auth-projects/{U}/environments/{U}/domain/mint",
        lambda c: c.admin.auth_projects.mint_environment_domain(U, U, {"siteDomainId": U}),
    ),
    "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/domain/admit": RouteCase(
        f"/api/v1/admin/auth-projects/{U}/environments/{U}/domain/admit",
        lambda c: c.admin.auth_projects.admit_environment_domain(U, U),
    ),
    "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/domain/retry": RouteCase(
        f"/api/v1/admin/auth-projects/{U}/environments/{U}/domain/retry",
        lambda c: c.admin.auth_projects.retry_environment_domain(U, U),
    ),
    "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/domain/disable": RouteCase(
        f"/api/v1/admin/auth-projects/{U}/environments/{U}/domain/disable",
        lambda c: c.admin.auth_projects.disable_environment_domain(U, U),
    ),
    "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/domain/release": RouteCase(
        f"/api/v1/admin/auth-projects/{U}/environments/{U}/domain/release",
        lambda c: c.admin.auth_projects.release_environment_domain(U, U),
    ),
    (
        "admin-api PUT /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/domain/image-override"
    ): RouteCase(
        f"/api/v1/admin/auth-projects/{U}/environments/{U}/domain/image-override",
        lambda c: c.admin.auth_projects.set_environment_domain_image_override(U, U, IMAGE_OVERRIDE),
    ),
    (
        "admin-api DELETE /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/domain/image-override"
    ): RouteCase(
        f"/api/v1/admin/auth-projects/{U}/environments/{U}/domain/image-override",
        lambda c: c.admin.auth_projects.clear_environment_domain_image_override(U, U),
    ),
    "admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/releases": RouteCase(
        f"/api/v1/admin/auth-projects/{U}/environments/{U}/releases",
        lambda c: c.admin.auth_projects.list_app_releases(U, U),
    ),
    "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/releases": RouteCase(
        f"/api/v1/admin/auth-projects/{U}/environments/{U}/releases",
        lambda c: c.admin.auth_projects.create_app_release(U, U, {"files": [], "routing": {}}),
    ),
    (
        "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/releases/{releaseId}/files"
    ): RouteCase(
        f"/api/v1/admin/auth-projects/{U}/environments/{U}/releases/{U}/files",
        lambda c: c.admin.auth_projects.upload_app_release_file(U, U, U, "index.html", b"<html>"),
    ),
    (
        "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}"
        "/releases/{releaseId}/verify"
    ): RouteCase(
        f"/api/v1/admin/auth-projects/{U}/environments/{U}/releases/{U}/verify",
        lambda c: c.admin.auth_projects.verify_app_release(U, U, U),
    ),
    (
        "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}"
        "/releases/{releaseId}/promote"
    ): RouteCase(
        f"/api/v1/admin/auth-projects/{U}/environments/{U}/releases/{U}/promote",
        lambda c: c.admin.auth_projects.promote_app_release(U, U, U),
    ),
    "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/brand/logo": RouteCase(
        f"/api/v1/admin/auth-projects/{U}/environments/{U}/brand/logo",
        lambda c: c.admin.auth_projects.set_brand_logo(U, U, "logo.png", b"png"),
    ),
    "admin-api DELETE /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/brand/logo": RouteCase(
        f"/api/v1/admin/auth-projects/{U}/environments/{U}/brand/logo",
        lambda c: c.admin.auth_projects.clear_brand_logo(U, U),
    ),
    "ingest-api ANY /api/v1/events/batch": RouteCase(
        "/api/v1/events/batch", lambda c: _track_in_batch(), method="POST"
    ),
    "ingest-api ANY /api/v1/events": RouteCase("/api/v1/events", lambda c: c.ingest_event(EVENT), method="POST"),
    "ingest-api ANY /api/v1/parser-preview": RouteCase(
        "/api/v1/parser-preview",
        lambda c: c.parsers.preview({"parser": PARSER, "sample": "line", "maxLines": 1}),
        method="POST",
    ),
    "ingest-api ANY /api/v1/raw": RouteCase(
        "/api/v1/raw", lambda c: c.ingest_raw_lines({"content": "line\n", "parserUuid": U}), method="POST"
    ),
    "admin-api GET /api/v1/app/item": RouteCase("/api/v1/app/item", lambda c: _link().read()),
    "admin-api PATCH /api/v1/app/item": RouteCase(
        "/api/v1/app/item", lambda c: _link().update_settings({"name": "Item"})
    ),
    "admin-api POST /api/v1/app/items": RouteCase("/api/v1/app/items", lambda c: _app().create_item({"kind": "plan"})),
    "admin-api GET /api/v1/app/items": RouteCase("/api/v1/app/items", lambda c: _app().list_my_items()),
    "admin-api POST /api/v1/app/item/claim": RouteCase("/api/v1/app/item/claim", lambda c: _link().claim()),
    "admin-api GET /api/v1/app/item/plan/forecast": RouteCase(
        "/api/v1/app/item/plan/forecast", lambda c: _link().plan_forecast()
    ),
    "admin-api PATCH /api/v1/app/item/plan": RouteCase(
        "/api/v1/app/item/plan", lambda c: _link().update_plan(PLAN_UPDATE)
    ),
    "admin-api POST /api/v1/app/item/measurements": RouteCase(
        "/api/v1/app/item/measurements", lambda c: _link().add_measurements({"rows": [{}]})
    ),
    "admin-api POST /api/v1/app/item/measurements/csv": RouteCase(
        "/api/v1/app/item/measurements/csv", lambda c: _link().import_measurements_csv("a,b\n1,2", 1)
    ),
    "admin-api GET /api/v1/app/item/measurements": RouteCase(
        "/api/v1/app/item/measurements", lambda c: _link().list_measurements(limit=10, run=U)
    ),
    "admin-api GET /api/v1/app/item/runs": RouteCase("/api/v1/app/item/runs", lambda c: _link().list_runs(limit=10)),
    "admin-api POST /api/v1/app/item/runs": RouteCase(
        "/api/v1/app/item/runs", lambda c: _link().start_run(APP_ITEM_PROJECT)
    ),
    "admin-api POST /api/v1/app/item/estimates": RouteCase(
        "/api/v1/app/item/estimates", lambda c: _link().create_estimate({"estimateKind": "date"})
    ),
    "admin-api POST /api/v1/app/item/complete": RouteCase("/api/v1/app/item/complete", lambda c: _link().complete({})),
    "admin-api POST /api/v1/app/item/cancel": RouteCase("/api/v1/app/item/cancel", lambda c: _link().cancel()),
    "admin-api POST /api/v1/app/item/reopen": RouteCase(
        "/api/v1/app/item/reopen", lambda c: _app().owned_item(U).reopen()
    ),
    "admin-api POST /api/v1/app/item/entries": RouteCase("/api/v1/app/item/entries", lambda c: _link().add_entry(LINK)),
    "admin-api DELETE /api/v1/app/item/entries/{entryUuid}": RouteCase(
        f"/api/v1/app/item/entries/{U}", lambda c: _link().remove_entry(U)
    ),
    "admin-api DELETE /api/v1/app/item/links/{linkUuid}": RouteCase(
        f"/api/v1/app/item/links/{U}", lambda c: _link().revoke_link(U)
    ),
    "admin-api POST /api/v1/app/item/links/{linkUuid}/rotate": RouteCase(
        f"/api/v1/app/item/links/{U}/rotate", lambda c: _link().rotate_link(U)
    ),
    "admin-api POST /api/v1/app/item/model/versions": RouteCase(
        "/api/v1/app/item/model/versions", lambda c: _link().add_model_version({"quantities": []})
    ),
    "admin-api POST /api/v1/app/item/model/copy": RouteCase(
        "/api/v1/app/item/model/copy", lambda c: _link().copy_model()
    ),
    "admin-api GET /api/v1/app/item/alerts": RouteCase("/api/v1/app/item/alerts", lambda c: _link().alert_settings()),
    "admin-api GET /api/v1/app/item/alerts/deliveries": RouteCase(
        "/api/v1/app/item/alerts/deliveries", lambda c: _link().alert_deliveries()
    ),
    "admin-api POST /api/v1/app/item/alerts/rules": RouteCase(
        "/api/v1/app/item/alerts/rules", lambda c: _link().add_alert_rule({"kind": "target_met"})
    ),
    "admin-api DELETE /api/v1/app/item/alerts/rules/{ruleUuid}": RouteCase(
        f"/api/v1/app/item/alerts/rules/{U}", lambda c: _link().remove_alert_rule(U)
    ),
    "admin-api POST /api/v1/app/item/alerts/webhooks": RouteCase(
        "/api/v1/app/item/alerts/webhooks", lambda c: _link().add_alert_webhook("https://hooks.example.com")
    ),
    "admin-api POST /api/v1/app/item/alerts/slack": RouteCase(
        "/api/v1/app/item/alerts/slack", lambda c: _link().add_alert_slack("https://hooks.slack.com/x")
    ),
    "admin-api DELETE /api/v1/app/item/alerts/webhooks/{webhookUuid}": RouteCase(
        f"/api/v1/app/item/alerts/webhooks/{U}", lambda c: _link().remove_alert_webhook(U)
    ),
    "admin-api PUT /api/v1/app/item/alerts/subscription": RouteCase(
        "/api/v1/app/item/alerts/subscription", lambda c: _link().subscribe_alert_email()
    ),
    "admin-api DELETE /api/v1/app/item/alerts/subscription": RouteCase(
        "/api/v1/app/item/alerts/subscription", lambda c: _link().unsubscribe_alert_email()
    ),
    "admin-api GET /api/v1/app/item/alerts/unsubscribe": RouteCase(
        "/api/v1/app/item/alerts/unsubscribe", lambda c: read_alert_unsubscribe_page(BASE_URL, "sealed")
    ),
    "admin-api POST /api/v1/app/item/alerts/unsubscribe": RouteCase(
        "/api/v1/app/item/alerts/unsubscribe", lambda c: unsubscribe_alert_email_by_token(BASE_URL, "sealed")
    ),
    "admin-api PATCH /api/v1/app/item/meeting/minutes": RouteCase(
        "/api/v1/app/item/meeting/minutes", lambda c: _link().update_meeting_minutes({"notes": "n"})
    ),
    "admin-api POST /api/v1/app/item/meeting/start": RouteCase(
        "/api/v1/app/item/meeting/start", lambda c: _link().start_meeting()
    ),
    "admin-api POST /api/v1/app/item/meeting/advance": RouteCase(
        "/api/v1/app/item/meeting/advance", lambda c: _link().advance_meeting(U)
    ),
    "admin-api POST /api/v1/app/item/meeting/end": RouteCase(
        "/api/v1/app/item/meeting/end", lambda c: _link().end_meeting()
    ),
    "admin-api GET /api/v1/app-hosts/{host}/discovery": RouteCase(
        "/api/v1/app-hosts/app.example.com/discovery", lambda c: read_app_discovery(BASE_URL, "app.example.com")
    ),
    "admin-api GET /api/v1/app/profile": RouteCase("/api/v1/app/profile", lambda c: _profile().read()),
    "admin-api PATCH /api/v1/app/profile": RouteCase(
        "/api/v1/app/profile", lambda c: _profile().update(PROFILE_UPDATE)
    ),
    "admin-api POST /api/v1/app/profile": RouteCase(
        "/api/v1/app/profile", lambda c: _profile().initialize(PROFILE_UPDATE)
    ),
    "admin-api GET /api/v1/app/profile/photo": RouteCase(
        "/api/v1/app/profile/photo", lambda c: _profile().read_photo()
    ),
    "admin-api PUT /api/v1/app/profile/photo": RouteCase(
        "/api/v1/app/profile/photo", lambda c: _profile().upload_photo(b"png", "image/png")
    ),
    "admin-api POST /api/v1/app/profile/photo": RouteCase(
        "/api/v1/app/profile/photo", lambda c: _profile().initialize_photo(b"png", "image/webp")
    ),
    "admin-api DELETE /api/v1/app/profile/photo": RouteCase(
        "/api/v1/app/profile/photo", lambda c: _profile().remove_photo()
    ),
    "admin-api GET /api/v1/admin/apps": RouteCase(
        "/api/v1/admin/apps", lambda c: c.admin.auth_projects.list_apps(after=U)
    ),
    "admin-api POST /api/v1/admin/apps": RouteCase(
        "/api/v1/admin/apps", lambda c: c.admin.auth_projects.create_app({"name": "Done when"}, OPT)
    ),
    "admin-api GET /api/v1/admin/apps/{slug}": RouteCase(
        "/api/v1/admin/apps/done-when", lambda c: c.admin.auth_projects.get_app("done-when")
    ),
    "admin-api GET /api/v1/admin/apps/{slug}/deploy-credentials": RouteCase(
        "/api/v1/admin/apps/done-when/deploy-credentials",
        lambda c: c.admin.auth_projects.list_app_deploy_credentials("done-when"),
    ),
    "admin-api POST /api/v1/admin/apps/{slug}/deploy-credentials": RouteCase(
        "/api/v1/admin/apps/done-when/deploy-credentials",
        lambda c: c.admin.auth_projects.create_app_deploy_credential("done-when"),
    ),
    "admin-api DELETE /api/v1/admin/apps/{slug}/deploy-credentials/{clientId}": RouteCase(
        "/api/v1/admin/apps/done-when/deploy-credentials/client-1",
        lambda c: c.admin.auth_projects.delete_app_deploy_credential("done-when", "client-1"),
    ),
    "admin-api POST /api/v1/admin/apps/{slug}/pause": RouteCase(
        "/api/v1/admin/apps/done-when/pause", lambda c: c.admin.auth_projects.pause_app("done-when", OPT)
    ),
    "admin-api POST /api/v1/admin/apps/{slug}/resume": RouteCase(
        "/api/v1/admin/apps/done-when/resume", lambda c: c.admin.auth_projects.resume_app("done-when", OPT)
    ),
    "admin-api POST /api/v1/admin/apps/{slug}/repair": RouteCase(
        "/api/v1/admin/apps/done-when/repair", lambda c: c.admin.auth_projects.repair_app("done-when", OPT)
    ),
    "admin-api POST /api/v1/admin/apps/{slug}/sign-in": RouteCase(
        "/api/v1/admin/apps/done-when/sign-in",
        lambda c: c.admin.auth_projects.set_app_sign_in("done-when", APP_SIGN_IN, OPT),
    ),
    "admin-api POST /api/v1/admin/tenants/{slug}/finalize": RouteCase(
        "/api/v1/admin/tenants/acme/finalize", lambda c: c.admin.tenants.finalize("acme", 7)
    ),
    "admin-api POST /api/v1/admin/tenants/{slug}/historical-cleanup": RouteCase(
        "/api/v1/admin/tenants/acme/historical-cleanup", lambda c: c.admin.tenants.historical_cleanup("acme", 7, OPT)
    ),
    "admin-api GET /api/v1/admin/tenants/{slug}/data-space-entitlement": RouteCase(
        "/api/v1/admin/tenants/acme/data-space-entitlement",
        lambda c: c.admin.tenants.get_data_space_entitlement("acme"),
    ),
    "admin-api PUT /api/v1/admin/tenants/{slug}/data-space-entitlement": RouteCase(
        "/api/v1/admin/tenants/acme/data-space-entitlement",
        lambda c: c.admin.tenants.update_data_space_entitlement("acme", ENTITLEMENT),
    ),
    "admin-api PUT /api/v1/admin/tenants/{slug}/storage-limit": RouteCase(
        "/api/v1/admin/tenants/acme/storage-limit",
        lambda c: c.admin.tenants.update_storage_limit("acme", STORAGE_LIMIT),
    ),
    "analytics-api POST /api/v1/app/forecast/runs": RouteCase(
        "/api/v1/app/forecast/runs", lambda c: _link().run_forecast()
    ),
    "analytics-api GET /api/v1/app/forecast/latest": RouteCase(
        "/api/v1/app/forecast/latest", lambda c: _link().latest_forecast()
    ),
    "analytics-api GET /api/v1/app/forecast/runs/{runUuid}": RouteCase(
        f"/api/v1/app/forecast/runs/{U}", lambda c: _link().forecast_run(U)
    ),
    "analytics-api GET /api/v1/app/forecast/story": RouteCase(
        "/api/v1/app/forecast/story", lambda c: _link().forecast_story()
    ),
    "analytics-api POST /api/v1/app/models/runs": RouteCase(
        "/api/v1/app/models/runs", lambda c: _link().run_model(MODEL_RUN)
    ),
    "analytics-api POST /api/v1/app/models/calculate": RouteCase(
        "/api/v1/app/models/calculate", lambda c: _link().calculate_model({"outputs": ["total"]})
    ),
    "analytics-api GET /api/v1/app/models/latest": RouteCase(
        "/api/v1/app/models/latest", lambda c: _link().latest_model_run()
    ),
    "admin-api GET /api/v1/admin/workflow-timings/definitions": RouteCase(
        "/api/v1/admin/workflow-timings/definitions",
        lambda c: c.admin.workflow_timings.list_definitions(company_slug="acme"),
    ),
    "admin-api GET /api/v1/admin/workflow-timings/definitions/{workflowKey}": RouteCase(
        "/api/v1/admin/workflow-timings/definitions/deploy",
        lambda c: c.admin.workflow_timings.get_definition("deploy", company_slug="acme"),
    ),
    "admin-api PUT /api/v1/admin/workflow-timings/definitions/{workflowKey}": RouteCase(
        "/api/v1/admin/workflow-timings/definitions/deploy",
        lambda c: c.admin.workflow_timings.reconcile_definition(TIMING_DECLARATION, company_slug="acme"),
    ),
    "admin-api GET /api/v1/admin/workflow-timings/definitions/{workflowKey}/duration-history": RouteCase(
        "/api/v1/admin/workflow-timings/definitions/deploy/duration-history",
        lambda c: c.admin.workflow_timings.get_duration_history("deploy", company_slug="acme", limit=10),
    ),
    "admin-api GET /api/v1/admin/workflow-timings/definitions/{workflowKey}/evaluation": RouteCase(
        "/api/v1/admin/workflow-timings/definitions/deploy/evaluation",
        lambda c: c.admin.workflow_timings.get_evaluation("deploy", company_slug="acme", series_key="run"),
    ),
    "admin-api POST /api/v1/admin/workflow-timings/observations": RouteCase(
        "/api/v1/admin/workflow-timings/observations",
        lambda c: c.admin.workflow_timings.append_observation(TIMING_OBSERVATION, company_slug="acme"),
    ),
    "admin-api POST /api/v1/admin/workflow-timings/observations:batch": RouteCase(
        "/api/v1/admin/workflow-timings/observations:batch",
        lambda c: c.admin.workflow_timings.append_observations([TIMING_OBSERVATION], company_slug="acme"),
    ),
    "admin-api POST /api/v1/admin/workflow-timings/corrections": RouteCase(
        "/api/v1/admin/workflow-timings/corrections",
        lambda c: c.admin.workflow_timings.correct_observation(
            {**TIMING_OBSERVATION, "supersedesFactUuid": U}, company_slug="acme"
        ),
    ),
    "admin-api GET /api/v1/admin/workflow-timings/runs": RouteCase(
        "/api/v1/admin/workflow-timings/runs",
        lambda c: c.admin.workflow_timings.list_runs(company_slug="acme", workflow_key="deploy", limit=10),
    ),
    "admin-api GET /api/v1/admin/workflow-timings/runs/{runUuid}": RouteCase(
        f"/api/v1/admin/workflow-timings/runs/{U}", lambda c: c.admin.workflow_timings.get_run(U, company_slug="acme")
    ),
    "admin-api GET /api/v1/admin/workflow-timings/runs/{runUuid}/prediction": RouteCase(
        f"/api/v1/admin/workflow-timings/runs/{U}/prediction",
        lambda c: c.admin.workflow_timings.get_prediction(U, company_slug="acme"),
    ),
    "admin-api POST /api/v1/admin/workflow-timings/runs/{runUuid}/rebuild": RouteCase(
        f"/api/v1/admin/workflow-timings/runs/{U}/rebuild",
        lambda c: c.admin.workflow_timings.rebuild_run(U, company_slug="acme"),
    ),
    "admin-api GET /api/v1/admin/users": RouteCase("/api/v1/admin/users", lambda c: c.admin.users.list()),
    "admin-api POST /api/v1/admin/users": RouteCase(
        "/api/v1/admin/users",
        lambda c: c.admin.users.create({"companySlug": "acme", "email": "a@example.com", "roles": ["tenant_admin"]}),
    ),
    "admin-api GET /api/v1/admin/users/{userUuid}": RouteCase(
        f"/api/v1/admin/users/{U}", lambda c: c.admin.users.get(U)
    ),
    "admin-api PUT /api/v1/admin/users/{userUuid}": RouteCase(
        f"/api/v1/admin/users/{U}", lambda c: c.admin.users.update(U, {"roles": ["tenant_admin"]})
    ),
    "admin-api POST /api/v1/admin/users/{userUuid}/disable": RouteCase(
        f"/api/v1/admin/users/{U}/disable", lambda c: c.admin.users.disable(U, {"reason": "left"})
    ),
    "admin-api POST /api/v1/admin/users/{userUuid}/enable": RouteCase(
        f"/api/v1/admin/users/{U}/enable", lambda c: c.admin.users.enable(U, {"roles": ["tenant_admin"]})
    ),
    "admin-api POST /api/v1/admin/users/{userUuid}/memberships": RouteCase(
        f"/api/v1/admin/users/{U}/memberships",
        lambda c: c.admin.users.add_membership(U, {"companySlug": "acme", "roles": ["tenant_admin"]}),
    ),
    "admin-api POST /api/v1/admin/users/{userUuid}/reset-password": RouteCase(
        f"/api/v1/admin/users/{U}/reset-password", lambda c: c.admin.users.reset_password(U)
    ),
    "admin-api POST /api/v1/admin/users/{userUuid}/restore": RouteCase(
        f"/api/v1/admin/users/{U}/restore", lambda c: c.admin.users.restore(U, "acme", {"reason": "returned"})
    ),
    "admin-api POST /api/v1/admin/users/{userUuid}/retry-welcome": RouteCase(
        f"/api/v1/admin/users/{U}/retry-welcome", lambda c: c.admin.users.retry_welcome(U)
    ),
    "admin-api POST /api/v1/admin/users/{userUuid}/soft-delete": RouteCase(
        f"/api/v1/admin/users/{U}/soft-delete", lambda c: c.admin.users.soft_delete(U, "acme", {"reason": "left"})
    ),
    "admin-api GET /api/v1/admin/user-roles": RouteCase(
        "/api/v1/admin/user-roles", lambda c: c.admin.users.list_roles()
    ),
    "admin-api GET /api/v1/admin/impersonation-sessions": RouteCase(
        "/api/v1/admin/impersonation-sessions", lambda c: c.admin.impersonation.list()
    ),
    "admin-api POST /api/v1/admin/impersonation-sessions": RouteCase(
        "/api/v1/admin/impersonation-sessions",
        lambda c: c.admin.impersonation.start(
            {"companySlug": "acme", "targetUserUuid": U, "reason": "support", "expiresAt": "2026-11-01T01:00:00Z"}
        ),
    ),
    "admin-api POST /api/v1/admin/impersonation-sessions/{impersonationSessionUuid}/stop": RouteCase(
        f"/api/v1/admin/impersonation-sessions/{U}/stop", lambda c: c.admin.impersonation.stop(U)
    ),
    "admin-api POST /api/v1/admin/impersonation-sessions/{impersonationSessionUuid}/terminate": RouteCase(
        f"/api/v1/admin/impersonation-sessions/{U}/terminate", lambda c: c.admin.impersonation.terminate(U)
    ),
    "admin-api GET /api/v1/admin/support-access": RouteCase(
        "/api/v1/admin/support-access", lambda c: c.admin.support_access.list()
    ),
    "admin-api POST /api/v1/admin/support-access": RouteCase(
        "/api/v1/admin/support-access",
        lambda c: c.admin.support_access.create(
            {"companySlug": "acme", "reason": "support", "expiresAt": "2026-11-01T01:00:00Z"}
        ),
    ),
    "admin-api POST /api/v1/admin/support-access/{supportAccessGrantUuid}/revoke": RouteCase(
        f"/api/v1/admin/support-access/{U}/revoke", lambda c: c.admin.support_access.revoke(U)
    ),
    "admin-api GET /api/v1/admin/oauth-client-admissions": RouteCase(
        "/api/v1/admin/oauth-client-admissions", lambda c: c.admin.oauth_client_admissions.list("acme")
    ),
    "admin-api POST /api/v1/admin/oauth-client-admissions/{admissionUuid}/review": RouteCase(
        f"/api/v1/admin/oauth-client-admissions/{U}/review",
        lambda c: c.admin.oauth_client_admissions.review(U, {"companySlug": "acme"}),
    ),
    "admin-api POST /api/v1/admin/oauth-client-admissions/{admissionUuid}/approve": RouteCase(
        f"/api/v1/admin/oauth-client-admissions/{U}/approve",
        lambda c: c.admin.oauth_client_admissions.approve(
            U, {"companySlug": "acme", "clientId": "c1", "expectedRevision": 1, "securityRevision": "r1", "grants": []}
        ),
    ),
    "admin-api POST /api/v1/admin/oauth-client-admissions/{admissionUuid}/revoke": RouteCase(
        f"/api/v1/admin/oauth-client-admissions/{U}/revoke",
        lambda c: c.admin.oauth_client_admissions.revoke(U, {"companySlug": "acme", "expectedRevision": 1}),
    ),
    "admin-api PATCH /api/v1/admin/oauth-clients/{clientId}/scopes": RouteCase(
        "/api/v1/admin/oauth-clients/client-1/scopes",
        lambda c: c.admin.oauth_clients.update_scopes(
            "client-1", {"companySlug": "acme", "profile": "producer", "scopes": ["events.write"]}
        ),
    ),
    "admin-api POST /api/v1/admin/oauth-clients/{clientId}/replace-unknown-secret": RouteCase(
        "/api/v1/admin/oauth-clients/client-1/replace-unknown-secret",
        lambda c: c.admin.oauth_clients.replace_unknown_secret("client-1", OPT),
    ),
    "admin-api DELETE /api/v1/admin/measurement/projects/{projectUuid}/decisions/{decisionUuid}": RouteCase(
        "/api/v1/admin/measurement/projects/a1/decisions/a1",
        lambda c: c.admin.measurement.projects.delete_decision("a1", "a1"),
    ),
    "admin-api DELETE /api/v1/admin/uncertainty-models/{modelUuid}": RouteCase(
        "/api/v1/admin/uncertainty-models/a1", lambda c: c.admin.uncertainty_models.delete("a1")
    ),
    "admin-api GET /api/v1/admin/measurement/projects/{projectUuid}/decisions": RouteCase(
        "/api/v1/admin/measurement/projects/a1/decisions", lambda c: c.admin.measurement.projects.list_decisions("a1")
    ),
    "admin-api GET /api/v1/admin/measurement/projects/{projectUuid}/decisions/{decisionUuid}": RouteCase(
        "/api/v1/admin/measurement/projects/a1/decisions/a1",
        lambda c: c.admin.measurement.projects.get_decision("a1", "a1"),
    ),
    "admin-api GET /api/v1/admin/measurement/projects/{projectUuid}/estimates": RouteCase(
        "/api/v1/admin/measurement/projects/a1/estimates", lambda c: c.admin.measurement.projects.list_estimates("a1")
    ),
    "admin-api GET /api/v1/admin/measurement/projects/{projectUuid}/imports/{importUuid}": RouteCase(
        "/api/v1/admin/measurement/projects/a1/imports/a1",
        lambda c: c.admin.measurement.projects.get_import_run("a1", "a1"),
    ),
    "admin-api GET /api/v1/admin/uncertainty-models": RouteCase(
        "/api/v1/admin/uncertainty-models", lambda c: c.admin.uncertainty_models.list()
    ),
    "admin-api GET /api/v1/admin/uncertainty-models/{modelUuid}": RouteCase(
        "/api/v1/admin/uncertainty-models/a1", lambda c: c.admin.uncertainty_models.get("a1")
    ),
    "admin-api GET /api/v1/admin/uncertainty-models/{modelUuid}/versions": RouteCase(
        "/api/v1/admin/uncertainty-models/a1/versions", lambda c: c.admin.uncertainty_models.list_versions("a1")
    ),
    "admin-api GET /api/v1/admin/uncertainty-models/{modelUuid}/versions/{versionNumber}": RouteCase(
        "/api/v1/admin/uncertainty-models/a1/versions/1", lambda c: c.admin.uncertainty_models.get_version("a1", 1)
    ),
    "admin-api PATCH /api/v1/admin/measurement/projects/{projectUuid}": RouteCase(
        "/api/v1/admin/measurement/projects/a1", lambda c: c.admin.measurement.projects.update("a1", {})
    ),
    "admin-api PATCH /api/v1/admin/measurement/projects/{projectUuid}/decisions/{decisionUuid}": RouteCase(
        "/api/v1/admin/measurement/projects/a1/decisions/a1",
        lambda c: c.admin.measurement.projects.update_decision("a1", "a1", {}),
    ),
    (
        "admin-api POST /api/v1/admin/measurement/predictions/definitions/{definitionUuid}/duration-evaluations"
    ): RouteCase(
        "/api/v1/admin/measurement/predictions/definitions/a1/duration-evaluations",
        lambda c: c.admin.predictions.evaluate_duration_history("acme", "a1", {}),
    ),
    "admin-api POST /api/v1/admin/measurement/projects/{projectUuid}/calibration-exercises": RouteCase(
        "/api/v1/admin/measurement/projects/a1/calibration-exercises",
        lambda c: c.admin.measurement.projects.create_calibration_exercise("a1", {}),
    ),
    "admin-api POST /api/v1/admin/measurement/projects/{projectUuid}/cancel": RouteCase(
        "/api/v1/admin/measurement/projects/a1/cancel", lambda c: c.admin.measurement.projects.cancel("a1")
    ),
    "admin-api POST /api/v1/admin/measurement/projects/{projectUuid}/complete": RouteCase(
        "/api/v1/admin/measurement/projects/a1/complete", lambda c: c.admin.measurement.projects.complete("a1", {})
    ),
    "admin-api POST /api/v1/admin/measurement/projects/{projectUuid}/decisions": RouteCase(
        "/api/v1/admin/measurement/projects/a1/decisions",
        lambda c: c.admin.measurement.projects.create_decision_model("a1", {}),
    ),
    "admin-api POST /api/v1/admin/measurement/projects/{projectUuid}/estimates": RouteCase(
        "/api/v1/admin/measurement/projects/a1/estimates", lambda c: c.admin.measurement.projects.add_estimate("a1", {})
    ),
    "admin-api POST /api/v1/admin/measurement/projects/{projectUuid}/runs": RouteCase(
        "/api/v1/admin/measurement/projects/a1/runs", lambda c: c.admin.measurement.projects.add_run("a1", {})
    ),
    "admin-api POST /api/v1/admin/measurement/projects/{projectUuid}/series": RouteCase(
        "/api/v1/admin/measurement/projects/a1/series", lambda c: c.admin.measurement.projects.add_series("a1", {})
    ),
    "admin-api POST /api/v1/admin/measurement/projects/{projectUuid}/targets": RouteCase(
        "/api/v1/admin/measurement/projects/a1/targets", lambda c: c.admin.measurement.projects.add_target("a1", {})
    ),
    "admin-api POST /api/v1/admin/measurement/projects/{projectUuid}/targets/{targetUuid}/reopen": RouteCase(
        "/api/v1/admin/measurement/projects/a1/targets/a1/reopen",
        lambda c: c.admin.measurement.projects.reopen_target("a1", "a1"),
    ),
    "admin-api POST /api/v1/admin/uncertainty-models": RouteCase(
        "/api/v1/admin/uncertainty-models", lambda c: c.admin.uncertainty_models.create({})
    ),
    "admin-api POST /api/v1/admin/uncertainty-models/{modelUuid}/copy": RouteCase(
        "/api/v1/admin/uncertainty-models/a1/copy", lambda c: c.admin.uncertainty_models.copy("a1", {})
    ),
    "admin-api POST /api/v1/admin/uncertainty-models/{modelUuid}/versions": RouteCase(
        "/api/v1/admin/uncertainty-models/a1/versions", lambda c: c.admin.uncertainty_models.create_version("a1", {})
    ),
    "analytics-api GET /api/v1/measurement/overview": RouteCase(
        "/api/v1/measurement/overview", lambda c: c.measurement.overview()
    ),
    "analytics-api GET /api/v1/measurement/projects/{projectUuid}/forecast-runs/{runUuid}": RouteCase(
        "/api/v1/measurement/projects/a1/forecast-runs/a1",
        lambda c: c.measurement.projects.get_forecast_run("a1", "a1"),
    ),
    "analytics-api GET /api/v1/measurement/projects/{projectUuid}/forecast-story": RouteCase(
        "/api/v1/measurement/projects/a1/forecast-story", lambda c: c.measurement.projects.get_forecast_story("a1")
    ),
    "analytics-api GET /api/v1/measurement/uncertainty-models/{modelUuid}/runs": RouteCase(
        "/api/v1/measurement/uncertainty-models/a1/runs", lambda c: c.measurement.uncertainty_models.list_runs("a1")
    ),
    "analytics-api GET /api/v1/measurement/uncertainty-models/{modelUuid}/runs/{runUuid}": RouteCase(
        "/api/v1/measurement/uncertainty-models/a1/runs/a1",
        lambda c: c.measurement.uncertainty_models.get_run("a1", "a1"),
    ),
    "analytics-api POST /api/v1/measurement/projects/{projectUuid}/forecast-runs": RouteCase(
        "/api/v1/measurement/projects/a1/forecast-runs", lambda c: c.measurement.projects.run_forecast("a1", {})
    ),
    "analytics-api POST /api/v1/measurement/uncertainty-models/{modelUuid}/runs": RouteCase(
        "/api/v1/measurement/uncertainty-models/a1/runs",
        lambda c: c.measurement.uncertainty_models.create_run("a1", {}),
    ),
    "analytics-api GET /api/v1/measurement/predictions/definitions": RouteCase(
        "/api/v1/measurement/predictions/definitions", lambda c: c.measurement.predictions.list_definitions()
    ),
    "analytics-api GET /api/v1/measurement/predictions/definitions/{definitionUuid}": RouteCase(
        "/api/v1/measurement/predictions/definitions/a1", lambda c: c.measurement.predictions.get_definition("a1")
    ),
    "analytics-api GET /api/v1/measurement/predictions/definitions/{definitionUuid}/evaluations": RouteCase(
        "/api/v1/measurement/predictions/definitions/a1/evaluations",
        lambda c: c.measurement.predictions.get_latest_evaluation("a1"),
    ),
    "analytics-api GET /api/v1/measurement/predictions/definitions/{definitionUuid}/outcomes": RouteCase(
        "/api/v1/measurement/predictions/definitions/a1/outcomes",
        lambda c: c.measurement.predictions.list_outcomes("a1"),
    ),
    "analytics-api GET /api/v1/measurement/predictions/definitions/{definitionUuid}/runs": RouteCase(
        "/api/v1/measurement/predictions/definitions/a1/runs", lambda c: c.measurement.predictions.list_runs("a1")
    ),
    (
        "analytics-api GET /api/v1/measurement/projects/{projectUuid}/decisions/{decisionUuid}"
        "/simulation-runs/{runUuid}"
    ): RouteCase(
        "/api/v1/measurement/projects/a1/decisions/a1/simulation-runs/a1",
        lambda c: c.measurement.projects.get_decision_simulation_run("a1", "a1", "a1"),
    ),
    (
        "analytics-api POST /api/v1/measurement/projects/{projectUuid}/decisions/{decisionUuid}/simulation-runs"
    ): RouteCase(
        "/api/v1/measurement/projects/a1/decisions/a1/simulation-runs",
        lambda c: c.measurement.projects.run_decision_simulation("a1", "a1", {}),
    ),
    "admin-api GET /api/v1/admin/reporting-packs/generation-validity": RouteCase(
        "/api/v1/admin/reporting-packs/generation-validity",
        lambda c: c.admin.reporting_packs.list_generation_validity(),
    ),
    "admin-api GET /api/v1/admin/reporting-packs/generations/{generationId}": RouteCase(
        "/api/v1/admin/reporting-packs/generations/a1", lambda c: c.admin.reporting_packs.get_generation("a1")
    ),
    "admin-api GET /api/v1/admin/reporting-packs/generations/{generationId}/rollup-provenance": RouteCase(
        "/api/v1/admin/reporting-packs/generations/a1/rollup-provenance",
        lambda c: c.admin.reporting_packs.get_rollup_provenance("a1"),
    ),
    "admin-api GET /api/v1/admin/reporting-packs/generations/{generationId}/status": RouteCase(
        "/api/v1/admin/reporting-packs/generations/a1/status",
        lambda c: c.admin.reporting_packs.get_generation_status("a1"),
    ),
    "admin-api GET /api/v1/admin/time-plans/operations/definition-math": RouteCase(
        "/api/v1/admin/time-plans/operations/definition-math",
        lambda c: c.admin.time_plans.get_definition_math_proof("acme"),
    ),
    "admin-api GET /api/v1/admin/time-plans/operations/status": RouteCase(
        "/api/v1/admin/time-plans/operations/status", lambda c: c.admin.time_plans.get_operational_status("acme")
    ),
    "admin-api GET /api/v1/admin/time-plans/plans/{planUuid}/versions/{versionUuid}": RouteCase(
        "/api/v1/admin/time-plans/plans/a1/versions/a1",
        lambda c: c.admin.time_plans.get_published_version("acme", "a1", "a1"),
    ),
    "admin-api GET /api/v1/admin/time-plans/runs/{runUuid}/duration-observations": RouteCase(
        "/api/v1/admin/time-plans/runs/a1/duration-observations",
        lambda c: c.admin.time_plans.list_duration_observations("acme", "a1"),
    ),
    "admin-api GET /api/v1/admin/time-plans/runs/{runUuid}/predictions": RouteCase(
        "/api/v1/admin/time-plans/runs/a1/predictions", lambda c: c.admin.time_plans.list_run_predictions("acme", "a1")
    ),
    "admin-api GET /api/v1/admin/time-plans/runs/{runUuid}/report": RouteCase(
        "/api/v1/admin/time-plans/runs/a1/report",
        lambda c: c.admin.time_plans.get_completed_duration_report("acme", "a1"),
    ),
    "admin-api POST /api/v1/admin/reporting-packs/drafts/{draftId}/restart": RouteCase(
        "/api/v1/admin/reporting-packs/drafts/a1/restart", lambda c: c.admin.reporting_packs.restart_draft("a1")
    ),
    "admin-api POST /api/v1/admin/reporting-packs/generations/{generationId}/rollback": RouteCase(
        "/api/v1/admin/reporting-packs/generations/a1/rollback",
        lambda c: c.admin.reporting_packs.rollback_generation("a1"),
    ),
    "admin-api POST /api/v1/admin/time-plans/operations/outbox/replay": RouteCase(
        "/api/v1/admin/time-plans/operations/outbox/replay", lambda c: c.admin.time_plans.replay_outbox("acme", {})
    ),
    "admin-api POST /api/v1/admin/time-plans/runs/{runUuid}/projection-loss": RouteCase(
        "/api/v1/admin/time-plans/runs/a1/projection-loss",
        lambda c: c.admin.time_plans.delete_run_projection("acme", "a1"),
    ),
    "admin-api POST /api/v1/admin/time-plans/runs/{runUuid}/repair": RouteCase(
        "/api/v1/admin/time-plans/runs/a1/repair", lambda c: c.admin.time_plans.repair_run("a1")
    ),
    "analytics-api POST /api/v1/reporting/exports/completed-run": RouteCase(
        "/api/v1/reporting/exports/completed-run", lambda c: c.admin.time_plans.create_completed_run_export({})
    ),
    "admin-api GET /api/v1/admin/bootstrap": RouteCase(
        "/api/v1/admin/bootstrap", lambda c: c.reporting.get_client_bootstrap()
    ),
    "admin-api POST /api/v1/admin/bootstrap": RouteCase(
        "/api/v1/admin/bootstrap", lambda c: c.reporting.submit_client_bootstrap({})
    ),
    "analytics-api GET /api/v1/reporting/dashboards": RouteCase(
        "/api/v1/reporting/dashboards", lambda c: c.reporting.list_dashboards()
    ),
    "analytics-api POST /api/v1/reporting/dashboard-data-generations": RouteCase(
        "/api/v1/reporting/dashboard-data-generations", lambda c: c.reporting.generate_dashboard_data({})
    ),
    "analytics-api GET /api/v1/analytics/active-now": RouteCase(
        "/api/v1/analytics/active-now", lambda c: c.analytics.active_now(U)
    ),
    "analytics-api GET /api/v1/analytics/dashboard-summary": RouteCase(
        "/api/v1/analytics/dashboard-summary", lambda c: c.analytics.dashboard_summary()
    ),
    "analytics-api GET /api/v1/telemetry/event-count": RouteCase(
        "/api/v1/telemetry/event-count", lambda c: c.analytics.telemetry_event_count("2026-11-26")
    ),
    "analytics-api POST /api/v1/reporting/draft-preview": RouteCase(
        "/api/v1/reporting/draft-preview", lambda c: c.reporting.preview_draft({})
    ),
    "admin-api DELETE /api/v1/admin/privacy/consent/{subjectId}": RouteCase(
        "/api/v1/admin/privacy/consent/a1", lambda c: c.admin.privacy.delete_consent("a1", "a1")
    ),
    "admin-api GET /api/v1/admin/privacy/consent": RouteCase(
        "/api/v1/admin/privacy/consent", lambda c: c.admin.privacy.list_consent("a1")
    ),
    "admin-api GET /api/v1/admin/privacy/identifiers/{companySlug}": RouteCase(
        "/api/v1/admin/privacy/identifiers/a1", lambda c: c.admin.privacy.list_identifier_mappings("a1")
    ),
    "admin-api GET /api/v1/admin/privacy/rules": RouteCase(
        "/api/v1/admin/privacy/rules", lambda c: c.admin.privacy.get_rules()
    ),
    "admin-api GET /api/v1/admin/schema/audit": RouteCase(
        "/api/v1/admin/schema/audit", lambda c: c.admin.schema_actions.audit("a1")
    ),
    "admin-api POST /api/v1/admin/privacy/consent": RouteCase(
        "/api/v1/admin/privacy/consent", lambda c: c.admin.privacy.record_consent({})
    ),
    "admin-api POST /api/v1/admin/privacy/identifiers/{companySlug}/map": RouteCase(
        "/api/v1/admin/privacy/identifiers/a1/map", lambda c: c.admin.privacy.map_identifier("a1", {})
    ),
    "admin-api POST /api/v1/admin/schema/validate": RouteCase(
        "/api/v1/admin/schema/validate", lambda c: c.admin.schema_actions.validate({})
    ),
    "admin-api POST /api/v1/admin/schema/{tenantSlug}/{eventType}/dry-run": RouteCase(
        "/api/v1/admin/schema/a1/a1/dry-run", lambda c: c.admin.schema_actions.dry_run("a1", "a1", {})
    ),
    "admin-api POST /api/v1/admin/schema/{tenantSlug}/{eventType}/enable": RouteCase(
        "/api/v1/admin/schema/a1/a1/enable", lambda c: c.admin.schema_actions.enable_version("a1", "a1", {})
    ),
    "admin-api POST /api/v1/admin/schema/{tenantSlug}/{eventType}/register": RouteCase(
        "/api/v1/admin/schema/a1/a1/register", lambda c: c.admin.schema_actions.register("a1", "a1", {})
    ),
    "admin-api PUT /api/v1/admin/privacy/rules": RouteCase(
        "/api/v1/admin/privacy/rules", lambda c: c.admin.privacy.set_rules({})
    ),
    "schema-registry DELETE /api/v1/schemas/{eventType}": RouteCase(
        "/api/v1/schemas/a1", lambda c: c.admin.schemas.disable_event_type("a1")
    ),
    "schema-registry DELETE /api/v1/schemas/{eventType}/{version}/enabled": RouteCase(
        "/api/v1/schemas/a1/1/enabled", lambda c: c.admin.schemas.disable("a1", "1")
    ),
    "schema-registry PUT /api/v1/schemas/{eventType}/{version}/enabled": RouteCase(
        "/api/v1/schemas/a1/1/enabled", lambda c: c.admin.schemas.enable("a1", "1")
    ),
    "schema-registry POST /api/v1/schemas/{eventType}/{version}/active": RouteCase(
        "/api/v1/schemas/a1/1/active", lambda c: c.admin.schemas.activate("a1", "1")
    ),
    "schema-registry POST /api/v1/schemas/dry-run": RouteCase(
        "/api/v1/schemas/dry-run", lambda c: c.admin.schemas.dry_run(SCHEMA)
    ),
    "schema-registry POST /api/v1/schemas/validate": RouteCase(
        "/api/v1/schemas/validate", lambda c: c.admin.schemas.validate(SCHEMA)
    ),
    "schema-registry POST /api/v1/schemas/infer": RouteCase(
        "/api/v1/schemas/infer", lambda c: c.admin.schemas.infer({"samples": [{}]})
    ),
    "ingest-api ANY /api/v1/diagnostics/ingest": RouteCase(
        "/api/v1/diagnostics/ingest", lambda c: c.admin.ingest.diagnostics("ingest"), method="GET"
    ),
    "ingest-api ANY /api/v1/diagnostics/buffers": RouteCase(
        "/api/v1/diagnostics/buffers", lambda c: c.admin.ingest.diagnostics("buffers"), method="GET"
    ),
    "ingest-api ANY /api/v1/diagnostics/database": RouteCase(
        "/api/v1/diagnostics/database", lambda c: c.admin.ingest.diagnostics("database"), method="GET"
    ),
    "ingest-api ANY /api/v1/diagnostics/segments": RouteCase(
        "/api/v1/diagnostics/segments", lambda c: c.admin.ingest.diagnostics("segments"), method="GET"
    ),
    "ingest-api ANY /api/v1/diagnostics/reporting": RouteCase(
        "/api/v1/diagnostics/reporting", lambda c: c.admin.ingest.diagnostics("reporting"), method="GET"
    ),
    "ingest-api ANY /api/v1/account/me": RouteCase("/api/v1/account/me", lambda c: c.admin.get_account(), method="GET"),
    "ingest-api ANY /api/v1/admin/cleanup": RouteCase(
        "/api/v1/admin/cleanup", lambda c: c.admin.ingest.cleanup(), method="POST"
    ),
    "ingest-api ANY /api/v1/admin/integrity": RouteCase(
        "/api/v1/admin/integrity", lambda c: c.admin.ingest.check_integrity(), method="POST"
    ),
    "ingest-api ANY /api/v1/managed-audit/redactions": RouteCase(
        "/api/v1/managed-audit/redactions", lambda c: c.admin.ingest.redact_managed_audit({}), method="POST"
    ),
    "ingest-api ANY /api/v1/monitoring/alerts": RouteCase(
        "/api/v1/monitoring/alerts", lambda c: c.admin.ingest.monitoring_alerts(), method="GET"
    ),
    "ingest-api ANY /api/v1/monitoring/summary": RouteCase(
        "/api/v1/monitoring/summary", lambda c: c.admin.ingest.monitoring_summary(), method="GET"
    ),
    "ingest-api ANY /api/v1/reprocess": RouteCase(
        "/api/v1/reprocess", lambda c: c.admin.ingest.reprocess(), method="POST"
    ),
    "ingest-api ANY /api/v1/system/monitoring/summary": RouteCase(
        "/api/v1/system/monitoring/summary", lambda c: c.admin.ingest.system_monitoring_summary(), method="GET"
    ),
    "ingest-api ANY /api/v1/errors/api/{project}/envelope/": RouteCase(
        "/api/v1/errors/api/1/envelope/", lambda c: _error_capture().capture_event(ERROR_EVENT), method="POST"
    ),
    "ingest-api GET /api/v1/admin/cleanup/plans": RouteCase(
        "/api/v1/admin/cleanup/plans", lambda c: c.admin.ingest.list_cleanup_plans()
    ),
    "ingest-api POST /api/v1/admin/cleanup/plans": RouteCase(
        "/api/v1/admin/cleanup/plans", lambda c: c.admin.ingest.create_cleanup_plan({})
    ),
    "ingest-api GET /api/v1/cleanup/jobs": RouteCase(
        "/api/v1/cleanup/jobs", lambda c: c.admin.ingest.list_cleanup_jobs()
    ),
    "ingest-api POST /api/v1/cleanup/jobs": RouteCase(
        "/api/v1/cleanup/jobs", lambda c: c.admin.ingest.create_cleanup_job({})
    ),
    "ingest-api GET /api/v1/cleanup/jobs/{uuid}": RouteCase(
        "/api/v1/cleanup/jobs/a1", lambda c: c.admin.ingest.get_cleanup_job("a1")
    ),
    "ingest-api POST /api/v1/cleanup/jobs/{uuid}": RouteCase(
        "/api/v1/cleanup/jobs/a1", lambda c: c.admin.ingest.cancel_cleanup_job("a1")
    ),
    "ingest-api GET /api/v1/cleanup/jobs/{uuid}/proof": RouteCase(
        "/api/v1/cleanup/jobs/a1/proof", lambda c: c.admin.ingest.get_cleanup_job_proof("a1")
    ),
    "ingest-api POST /api/v1/collect/events": RouteCase(
        "/api/v1/collect/events",
        lambda c: collect_event(BASE_URL, dict(EVENT), write_key="site_pk_sample", origin="https://app.example.com"),
    ),
    "ingest-api POST /api/v1/collect/events/batch": RouteCase(
        "/api/v1/collect/events/batch",
        lambda c: collect_events(BASE_URL, [dict(EVENT)], write_key="site_pk_sample", origin="https://app.example.com"),
    ),
    "admin-api GET /api/v1/shared-site-reports/{token}": RouteCase(
        "/api/v1/shared-site-reports/a1", lambda c: read_shared_site_report(BASE_URL, "a1")
    ),
    "admin-api GET /api/v1/auth-domain-monitoring/inventory": RouteCase(
        "/api/v1/auth-domain-monitoring/inventory", lambda c: read_auth_domain_monitoring_inventory(BASE_URL, "k1")
    ),
    "admin-api DELETE /api/v1/admin/email-relay/{tenantSlug}": RouteCase(
        "/api/v1/admin/email-relay/a1", lambda c: c.admin.email_relay.delete("a1")
    ),
    "admin-api DELETE /api/v1/admin/notification-webhooks/{uuid}": RouteCase(
        "/api/v1/admin/notification-webhooks/a1", lambda c: c.admin.webhooks.delete("a1")
    ),
    "admin-api DELETE /api/v1/admin/sdk-usage/deprecations/{sdk}/{versionScope}": RouteCase(
        "/api/v1/admin/sdk-usage/deprecations/a1/a1", lambda c: c.admin.sdk_usage.delete_deprecation("a1", "a1")
    ),
    "admin-api DELETE /api/v1/admin/storage/alerts/{tenantSlug}/{ruleId}": RouteCase(
        "/api/v1/admin/storage/alerts/a1/a1", lambda c: c.admin.storage_alerts.delete_rule("a1", "a1")
    ),
    "admin-api GET /api/v1/admin/accounting/evidence": RouteCase(
        "/api/v1/admin/accounting/evidence", lambda c: c.admin.accounting_evidence.list()
    ),
    "admin-api GET /api/v1/admin/campaign-email-revisions/{revision}": RouteCase(
        "/api/v1/admin/campaign-email-revisions/a1", lambda c: c.admin.campaign_email.get_revision("a1")
    ),
    "admin-api GET /api/v1/admin/campaign-email-runs/{runId}": RouteCase(
        "/api/v1/admin/campaign-email-runs/a1", lambda c: c.admin.campaign_email.get_run("a1")
    ),
    "admin-api GET /api/v1/admin/campaign-email-welcome/contacts/{contactId}": RouteCase(
        "/api/v1/admin/campaign-email-welcome/contacts/a1", lambda c: c.admin.campaign_email.get_welcome_contact("a1")
    ),
    "admin-api GET /api/v1/admin/email-relay/{tenantSlug}": RouteCase(
        "/api/v1/admin/email-relay/a1", lambda c: c.admin.email_relay.get("a1")
    ),
    "admin-api GET /api/v1/admin/environment-policy": RouteCase(
        "/api/v1/admin/environment-policy", lambda c: c.admin.environment_policy.get()
    ),
    "admin-api GET /api/v1/admin/event-categories": RouteCase(
        "/api/v1/admin/event-categories", lambda c: c.admin.event_types.list_categories()
    ),
    "admin-api GET /api/v1/admin/event-types": RouteCase(
        "/api/v1/admin/event-types", lambda c: c.admin.event_types.list()
    ),
    "admin-api GET /api/v1/admin/ingest/claims/{tenantSlug}": RouteCase(
        "/api/v1/admin/ingest/claims/a1", lambda c: c.admin.ingest_claims.list("a1")
    ),
    "admin-api GET /api/v1/admin/jobs": RouteCase("/api/v1/admin/jobs", lambda c: c.admin.system.list_jobs()),
    "admin-api GET /api/v1/admin/notification-deliveries/{uuid}": RouteCase(
        "/api/v1/admin/notification-deliveries/a1", lambda c: c.admin.webhooks.get_delivery("a1")
    ),
    "admin-api GET /api/v1/admin/notification-webhooks": RouteCase(
        "/api/v1/admin/notification-webhooks", lambda c: c.admin.webhooks.list()
    ),
    "admin-api GET /api/v1/admin/rls/reconciliation-plans/{planUuid}/proof": RouteCase(
        "/api/v1/admin/rls/reconciliation-plans/a1/proof", lambda c: c.admin.rls.get_plan_proof("a1")
    ),
    "admin-api GET /api/v1/admin/rls/status": RouteCase("/api/v1/admin/rls/status", lambda c: c.admin.rls.status()),
    "admin-api GET /api/v1/admin/scheduled-tasks": RouteCase(
        "/api/v1/admin/scheduled-tasks", lambda c: c.admin.system.list_scheduled_tasks()
    ),
    "admin-api GET /api/v1/admin/scheduled-tasks/{taskName}": RouteCase(
        "/api/v1/admin/scheduled-tasks/a1", lambda c: c.admin.system.get_scheduled_task("a1")
    ),
    "admin-api GET /api/v1/admin/sdk-usage": RouteCase("/api/v1/admin/sdk-usage", lambda c: c.admin.sdk_usage.list()),
    "admin-api GET /api/v1/admin/storage-usage": RouteCase(
        "/api/v1/admin/storage-usage", lambda c: c.admin.usage.list_storage_usage()
    ),
    "admin-api GET /api/v1/admin/storage-usage/me": RouteCase(
        "/api/v1/admin/storage-usage/me", lambda c: c.admin.usage.get_retained_usage()
    ),
    "admin-api GET /api/v1/admin/storage/alerts/{tenantSlug}": RouteCase(
        "/api/v1/admin/storage/alerts/a1", lambda c: c.admin.storage_alerts.list_rules("a1")
    ),
    "admin-api GET /api/v1/admin/storage/alerts/{tenantSlug}/events": RouteCase(
        "/api/v1/admin/storage/alerts/a1/events", lambda c: c.admin.storage_alerts.list_events("a1")
    ),
    "admin-api GET /api/v1/admin/system/status": RouteCase(
        "/api/v1/admin/system/status", lambda c: c.admin.system.status()
    ),
    "admin-api GET /api/v1/admin/tenant-manifest/{tenantSlug}/readiness": RouteCase(
        "/api/v1/admin/tenant-manifest/a1/readiness", lambda c: c.admin.tenant_manifest.readiness("a1")
    ),
    "admin-api GET /api/v1/admin/usage": RouteCase("/api/v1/admin/usage", lambda c: c.admin.usage.list_usage()),
    "admin-api GET /api/v1/admin/usage/export": RouteCase(
        "/api/v1/admin/usage/export", lambda c: c.admin.usage.export_usage()
    ),
    "admin-api GET /api/v1/error-issues": RouteCase("/api/v1/error-issues", lambda c: c.admin.error_issues.list()),
    "admin-api GET /api/v1/error-issues/{issueUuid}": RouteCase(
        "/api/v1/error-issues/a1", lambda c: c.admin.error_issues.get("a1")
    ),
    "admin-api GET /api/v1/notification-destinations/{eventSlug}": RouteCase(
        "/api/v1/notification-destinations/a1", lambda c: c.admin.notification_destinations.get("a1")
    ),
    "admin-api GET /api/v1/sites/{siteUuid}/config": RouteCase(
        "/api/v1/sites/a1/config", lambda c: c.admin.sites.get_public_config("a1")
    ),
    "admin-api PATCH /api/v1/admin/environment-policy": RouteCase(
        "/api/v1/admin/environment-policy", lambda c: c.admin.environment_policy.update({})
    ),
    "admin-api PATCH /api/v1/admin/event-categories/{slug}": RouteCase(
        "/api/v1/admin/event-categories/a1", lambda c: c.admin.event_types.update_category("a1", {})
    ),
    "admin-api PATCH /api/v1/admin/event-types/{slug}": RouteCase(
        "/api/v1/admin/event-types/a1", lambda c: c.admin.event_types.update("a1", {})
    ),
    "admin-api PATCH /api/v1/admin/notification-webhooks/{uuid}": RouteCase(
        "/api/v1/admin/notification-webhooks/a1", lambda c: c.admin.webhooks.set_enabled("a1", {})
    ),
    "admin-api PATCH /api/v1/admin/sites/{siteUuid}": RouteCase(
        "/api/v1/admin/sites/a1", lambda c: c.admin.sites.update("a1", {})
    ),
    "admin-api POST /api/v1/admin/accounting/evidence": RouteCase(
        "/api/v1/admin/accounting/evidence", lambda c: c.admin.accounting_evidence.create({})
    ),
    "admin-api POST /api/v1/admin/campaign-email-permissions/check": RouteCase(
        "/api/v1/admin/campaign-email-permissions/check", lambda c: c.admin.campaign_email.check_permission({})
    ),
    "admin-api POST /api/v1/admin/campaign-email-permissions/confirm": RouteCase(
        "/api/v1/admin/campaign-email-permissions/confirm", lambda c: c.admin.campaign_email.confirm_permission({})
    ),
    "admin-api POST /api/v1/admin/campaign-email-permissions/withdraw": RouteCase(
        "/api/v1/admin/campaign-email-permissions/withdraw", lambda c: c.admin.campaign_email.withdraw_permission({})
    ),
    "admin-api POST /api/v1/admin/campaign-email-revisions": RouteCase(
        "/api/v1/admin/campaign-email-revisions", lambda c: c.admin.campaign_email.create_revision({})
    ),
    "admin-api POST /api/v1/admin/campaign-email-revisions/{revision}/render": RouteCase(
        "/api/v1/admin/campaign-email-revisions/a1/render", lambda c: c.admin.campaign_email.render_revision("a1", {})
    ),
    "admin-api POST /api/v1/admin/campaign-email-runs": RouteCase(
        "/api/v1/admin/campaign-email-runs", lambda c: c.admin.campaign_email.start_run({})
    ),
    "admin-api POST /api/v1/admin/campaign-email-runs/{runId}/cancel": RouteCase(
        "/api/v1/admin/campaign-email-runs/a1/cancel", lambda c: c.admin.campaign_email.cancel_run("a1")
    ),
    "admin-api POST /api/v1/admin/campaign-email-welcome/activation": RouteCase(
        "/api/v1/admin/campaign-email-welcome/activation",
        lambda c: c.admin.campaign_email.record_welcome_activation({}),
    ),
    "admin-api POST /api/v1/admin/campaign-email-welcome/confirmed-signup": RouteCase(
        "/api/v1/admin/campaign-email-welcome/confirmed-signup",
        lambda c: c.admin.campaign_email.record_welcome_confirmed_signup({}),
    ),
    "admin-api POST /api/v1/admin/email-relay/{tenantSlug}/test-send": RouteCase(
        "/api/v1/admin/email-relay/a1/test-send", lambda c: c.admin.email_relay.test_send("a1", {})
    ),
    "admin-api POST /api/v1/admin/ingest/claims/{tenantSlug}/{objectUuid}/retry": RouteCase(
        "/api/v1/admin/ingest/claims/a1/a1/retry", lambda c: c.admin.ingest_claims.retry("a1", "a1")
    ),
    "admin-api POST /api/v1/admin/ingest/claims/{tenantSlug}/{objectUuid}/terminal": RouteCase(
        "/api/v1/admin/ingest/claims/a1/a1/terminal", lambda c: c.admin.ingest_claims.mark_terminal("a1", "a1", {})
    ),
    "admin-api POST /api/v1/admin/jobs/{jobId}/retry": RouteCase(
        "/api/v1/admin/jobs/1/retry", lambda c: c.admin.system.retry_job(1)
    ),
    "admin-api POST /api/v1/admin/notification-deliveries/{uuid}/replay": RouteCase(
        "/api/v1/admin/notification-deliveries/a1/replay", lambda c: c.admin.webhooks.replay_delivery("a1")
    ),
    "admin-api POST /api/v1/admin/notification-webhooks": RouteCase(
        "/api/v1/admin/notification-webhooks", lambda c: c.admin.webhooks.create({})
    ),
    "admin-api POST /api/v1/admin/notification-webhooks/{uuid}/rotate-secret": RouteCase(
        "/api/v1/admin/notification-webhooks/a1/rotate-secret", lambda c: c.admin.webhooks.rotate_secret("a1")
    ),
    "admin-api POST /api/v1/admin/rls/reconciliation-plans": RouteCase(
        "/api/v1/admin/rls/reconciliation-plans", lambda c: c.admin.rls.create_plan({})
    ),
    "admin-api POST /api/v1/admin/rls/reconciliation-plans/{planUuid}/execute": RouteCase(
        "/api/v1/admin/rls/reconciliation-plans/a1/execute", lambda c: c.admin.rls.execute_plan("a1", {}, OPT)
    ),
    "admin-api POST /api/v1/admin/scheduled-task-runs/{runUuid}/retry": RouteCase(
        "/api/v1/admin/scheduled-task-runs/a1/retry", lambda c: c.admin.system.retry_scheduled_task_run("a1")
    ),
    "admin-api POST /api/v1/admin/scheduled-tasks/{taskName}/pause": RouteCase(
        "/api/v1/admin/scheduled-tasks/a1/pause", lambda c: c.admin.system.pause_scheduled_task("a1")
    ),
    "admin-api POST /api/v1/admin/scheduled-tasks/{taskName}/resume": RouteCase(
        "/api/v1/admin/scheduled-tasks/a1/resume", lambda c: c.admin.system.resume_scheduled_task("a1")
    ),
    "admin-api POST /api/v1/admin/scheduled-tasks/{taskName}/run": RouteCase(
        "/api/v1/admin/scheduled-tasks/a1/run", lambda c: c.admin.system.run_scheduled_task("a1", {})
    ),
    "admin-api POST /api/v1/admin/storage/alerts/{tenantSlug}": RouteCase(
        "/api/v1/admin/storage/alerts/a1", lambda c: c.admin.storage_alerts.create_rule("a1", {})
    ),
    "admin-api POST /api/v1/error-issues/{issueUuid}/state": RouteCase(
        "/api/v1/error-issues/a1/state", lambda c: c.admin.error_issues.set_state("a1", {})
    ),
    "admin-api POST /api/v1/managed-audit/provision": RouteCase(
        "/api/v1/managed-audit/provision", lambda c: c.admin.managed_audit.provision_producer()
    ),
    "admin-api PUT /api/v1/admin/campaign-email-welcome/definition": RouteCase(
        "/api/v1/admin/campaign-email-welcome/definition", lambda c: c.admin.campaign_email.put_welcome_definition({})
    ),
    "admin-api PUT /api/v1/admin/campaign-email-welcome/pause": RouteCase(
        "/api/v1/admin/campaign-email-welcome/pause", lambda c: c.admin.campaign_email.set_welcome_paused({})
    ),
    "admin-api PUT /api/v1/admin/email-relay/{tenantSlug}": RouteCase(
        "/api/v1/admin/email-relay/a1", lambda c: c.admin.email_relay.put("a1", {})
    ),
    "admin-api PUT /api/v1/admin/sdk-usage/deprecations/{sdk}/{versionScope}": RouteCase(
        "/api/v1/admin/sdk-usage/deprecations/a1/a1", lambda c: c.admin.sdk_usage.put_deprecation("a1", "a1", {})
    ),
    "admin-api PUT /api/v1/admin/tenant-manifest/{tenantSlug}": RouteCase(
        "/api/v1/admin/tenant-manifest/a1", lambda c: c.admin.tenant_manifest.apply("a1", {}, OPT)
    ),
    "admin-api PUT /api/v1/notification-destinations/{eventSlug}": RouteCase(
        "/api/v1/notification-destinations/a1", lambda c: c.admin.notification_destinations.put("a1", {})
    ),
}

# A JSON null list in the minimal example must come back as []. Operation ID -> path to the list.
NULL_LISTS: dict[str, tuple[str, ...]] = {
    "admin-api GET /api/v1/admin/audit/events": ("events",),
    "admin-api GET /api/v1/admin/reporting-packs/audit-events": ("events",),
    "admin-api GET /api/v1/admin/usage/me": ("rows",),
    "analytics-api POST /api/v1/analytics/query-range": ("rows",),
    "analytics-api POST /api/v1/reporting/query": ("buckets",),
    "analytics-api POST /api/v1/reporting/insights/subject": ("data", "buckets"),
    "analytics-api GET /api/v1/reporting/exports": ("exports",),
    "admin-api GET /api/v1/tenant-storage-locations": ("locations",),
    "admin-api GET /api/v1/data-spaces/usage": ("dataSpaces",),
    "admin-api GET /api/v1/data-spaces/{slug}/producer-reservations": ("reservations",),
    "admin-api GET /api/v1/producer-provisioning/{clientId}": ("scopes",),
    "admin-api GET /api/v1/site-domains/{domainUuid}/finding-dismissals": ("dismissals",),
    "admin-api GET /api/v1/site-domains/{domainUuid}/heartbeats": ("monitors",),
    "admin-api GET /api/v1/site-domains/{domainUuid}/maintenance": ("windows",),
    "admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/releases": ("releases",),
    "admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/app-links": ("links",),
    "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/releases": (
        "manifest",
        "files",
    ),
    (
        "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}"
        "/releases/{releaseId}/verify"
    ): ("manifest", "files"),
    "admin-api DELETE /api/v1/app/profile/photo": ("fields",),
    "admin-api GET /api/v1/app/profile": ("fields",),
    "admin-api PATCH /api/v1/app/profile": ("fields",),
    "admin-api POST /api/v1/app/profile": ("fields",),
    "admin-api POST /api/v1/app/profile/photo": ("fields",),
    "admin-api PUT /api/v1/app/profile/photo": ("fields",),
    "admin-api GET /api/v1/app/item/alerts": ("webhooks",),
    "admin-api GET /api/v1/app/item/alerts/deliveries": ("deliveries",),
    "admin-api GET /api/v1/app/item/measurements": ("rows",),
    "admin-api GET /api/v1/app/item/plan/forecast": ("projectedProgress",),
    "admin-api GET /api/v1/app/item/runs": ("runs",),
    "admin-api GET /api/v1/app/items": ("items",),
    "analytics-api GET /api/v1/app/forecast/story": ("data", "presentation", "tableRows"),
    "analytics-api GET /api/v1/app/models/latest": ("data", "quantities"),
    "analytics-api POST /api/v1/app/models/calculate": ("quantities",),
    "analytics-api POST /api/v1/app/models/runs": ("boundInputs",),
    "admin-api GET /api/v1/admin/apps": ("apps",),
    "admin-api GET /api/v1/admin/apps/{slug}/deploy-credentials": ("credentials",),
    "admin-api GET /api/v1/admin/workflow-timings/definitions": ("items",),
    "admin-api GET /api/v1/admin/workflow-timings/definitions/{workflowKey}": ("currentRevision", "dimensions"),
    "admin-api GET /api/v1/admin/workflow-timings/definitions/{workflowKey}/duration-history": ("entries",),
    "admin-api GET /api/v1/admin/workflow-timings/runs": ("items",),
    "admin-api GET /api/v1/admin/workflow-timings/runs/{runUuid}": ("attempts",),
    "admin-api GET /api/v1/admin/workflow-timings/runs/{runUuid}/prediction": ("steps",),
    "admin-api POST /api/v1/admin/workflow-timings/corrections": ("results",),
    "admin-api POST /api/v1/admin/workflow-timings/observations": ("results",),
    "admin-api POST /api/v1/admin/workflow-timings/observations:batch": ("results",),
    "admin-api POST /api/v1/admin/workflow-timings/runs/{runUuid}/rebuild": ("projection", "attempts"),
    "admin-api PUT /api/v1/admin/workflow-timings/definitions/{workflowKey}": (
        "definition",
        "currentRevision",
        "steps",
    ),
    "admin-api GET /api/v1/admin/users": ("users",),
    "admin-api GET /api/v1/admin/user-roles": ("roles",),
    "admin-api POST /api/v1/admin/users/{userUuid}/reset-password": ("deliveryUuids",),
    "admin-api GET /api/v1/admin/support-access": ("grants",),
    "admin-api GET /api/v1/admin/oauth-client-admissions": ("admissions",),
    "admin-api POST /api/v1/admin/oauth-client-admissions/{admissionUuid}/review": ("metadata", "redirectUris"),
    "admin-api POST /api/v1/admin/oauth-client-admissions/{admissionUuid}/approve": ("admission", "approvedGrants"),
    "admin-api POST /api/v1/admin/oauth-client-admissions/{admissionUuid}/revoke": ("admission", "requestedGrants"),
    "admin-api PATCH /api/v1/admin/oauth-clients/{clientId}/scopes": ("scopes",),
    "admin-api GET /api/v1/admin/measurement/projects/{projectUuid}/decisions": ("decisions",),
    "admin-api GET /api/v1/admin/measurement/projects/{projectUuid}/estimates": ("estimates",),
    "admin-api GET /api/v1/admin/measurement/projects/{projectUuid}/imports/{importUuid}": ("results",),
    "admin-api GET /api/v1/admin/uncertainty-models": ("models",),
    "admin-api GET /api/v1/admin/uncertainty-models/{modelUuid}/versions": ("versions",),
    "admin-api GET /api/v1/admin/uncertainty-models/{modelUuid}/versions/{versionNumber}": ("quantities",),
    "admin-api POST /api/v1/admin/measurement/predictions/definitions/{definitionUuid}/duration-evaluations": (
        "artifact",
        "evaluation",
        "folds",
    ),
    "admin-api POST /api/v1/admin/uncertainty-models/{modelUuid}/versions": ("quantities",),
    "analytics-api GET /api/v1/measurement/overview": ("areas",),
    "analytics-api GET /api/v1/measurement/projects/{projectUuid}/forecast-story": ("observations",),
    "analytics-api GET /api/v1/measurement/uncertainty-models/{modelUuid}/runs": ("runs",),
    "analytics-api GET /api/v1/measurement/uncertainty-models/{modelUuid}/runs/{runUuid}": ("boundInputs",),
    "analytics-api POST /api/v1/measurement/uncertainty-models/{modelUuid}/runs": ("boundInputs",),
    "admin-api GET /api/v1/admin/reporting-packs/generation-validity": ("generations",),
    "admin-api GET /api/v1/admin/reporting-packs/generations/{generationId}": ("definition", "dimensions"),
    "admin-api GET /api/v1/admin/reporting-packs/generations/{generationId}/rollup-provenance": ("materializations",),
    "admin-api GET /api/v1/admin/reporting-packs/generations/{generationId}/status": ("acknowledgements",),
    "admin-api GET /api/v1/admin/time-plans/operations/definition-math": ("adjustments",),
    "admin-api GET /api/v1/admin/time-plans/plans/{planUuid}/versions/{versionUuid}": ("allocations",),
    "admin-api GET /api/v1/admin/time-plans/runs/{runUuid}/duration-observations": ("observations",),
    "admin-api GET /api/v1/admin/time-plans/runs/{runUuid}/predictions": ("snapshots",),
    "admin-api GET /api/v1/admin/time-plans/runs/{runUuid}/report": ("adjustments",),
    "admin-api POST /api/v1/admin/reporting-packs/drafts/{draftId}/restart": ("definition", "dimensions"),
    "admin-api POST /api/v1/admin/reporting-packs/generations/{generationId}/rollback": ("definition", "dimensions"),
    "analytics-api POST /api/v1/reporting/exports/completed-run": ("formats",),
    "analytics-api GET /api/v1/reporting/dashboards": ("dashboards",),
    "admin-api GET /api/v1/admin/privacy/consent": ("records",),
    "admin-api GET /api/v1/admin/privacy/identifiers/{companySlug}": ("mappings",),
    "admin-api GET /api/v1/admin/privacy/rules": ("rules",),
    "admin-api GET /api/v1/admin/schema/audit": ("schemas",),
    "admin-api POST /api/v1/admin/schema/validate": ("issues",),
    "admin-api POST /api/v1/admin/schema/{tenantSlug}/{eventType}/dry-run": ("issues",),
    "admin-api PUT /api/v1/admin/privacy/rules": ("rules",),
    "admin-api GET /api/v1/admin/accounting/evidence": ("evidence",),
    "admin-api GET /api/v1/admin/campaign-email-runs/{runId}": ("deliveries",),
    "admin-api GET /api/v1/admin/environment-policy": ("activeValues",),
    "admin-api GET /api/v1/admin/event-categories": ("eventCategories",),
    "admin-api GET /api/v1/admin/event-types": ("eventTypes",),
    "admin-api GET /api/v1/admin/ingest/claims/{tenantSlug}": ("claims",),
    "admin-api GET /api/v1/admin/jobs": ("outboxes",),
    "admin-api GET /api/v1/admin/notification-webhooks": ("subscriptions",),
    "admin-api GET /api/v1/admin/rls/reconciliation-plans/{planUuid}/proof": ("diff",),
    "admin-api GET /api/v1/admin/rls/status": ("tables",),
    "admin-api GET /api/v1/admin/scheduled-tasks": ("tasks",),
    "admin-api GET /api/v1/admin/sdk-usage": ("items",),
    "admin-api GET /api/v1/admin/storage-usage": ("tenants",),
    "admin-api GET /api/v1/admin/storage/alerts/{tenantSlug}": ("rules",),
    "admin-api GET /api/v1/admin/storage/alerts/{tenantSlug}/events": ("events",),
    "admin-api GET /api/v1/admin/system/status": ("stages",),
    "admin-api GET /api/v1/admin/tenant-manifest/{tenantSlug}/readiness": ("resources",),
    "admin-api GET /api/v1/admin/usage": ("rows",),
    "admin-api GET /api/v1/admin/usage/export": ("rows",),
    "admin-api GET /api/v1/error-issues": ("issues",),
    "admin-api GET /api/v1/error-issues/{issueUuid}": ("issue", "environments"),
    "admin-api GET /api/v1/sites/{siteUuid}/config": ("allowedOrigins",),
    "admin-api PATCH /api/v1/admin/environment-policy": ("activeValues",),
    "admin-api PATCH /api/v1/admin/sites/{siteUuid}": ("allowedEnvironments",),
    "admin-api POST /api/v1/admin/campaign-email-runs": ("deliveries",),
    "admin-api POST /api/v1/admin/campaign-email-runs/{runId}/cancel": ("deliveries",),
    "admin-api POST /api/v1/admin/email-relay/{tenantSlug}/test-send": ("deliveryUuids",),
    "admin-api POST /api/v1/admin/rls/reconciliation-plans": ("target_tables",),
    "admin-api POST /api/v1/admin/rls/reconciliation-plans/{planUuid}/execute": ("diff",),
    "admin-api POST /api/v1/error-issues/{issueUuid}/state": ("environments",),
    "admin-api PUT /api/v1/admin/tenant-manifest/{tenantSlug}": ("resources",),
    "admin-api GET /api/v1/admin/privacy/erasures": ("requests",),
    "admin-api GET /api/v1/admin/subject-exports": ("requests",),
    "admin-api GET /api/v1/admin/retention/policies": ("policies",),
    "admin-api GET /api/v1/admin/offboarding/schedules": ("schedules",),
    "admin-api GET /api/v1/producer-provisioning": ("producers",),
    "admin-api GET /api/v1/admin/tenants": ("tenants",),
    "admin-api GET /api/v1/admin/oauth-clients": ("clients",),
    "admin-api GET /api/v1/admin/sites": ("sites",),
    "admin-api GET /api/v1/data-spaces": ("dataSpaces",),
    "admin-api GET /api/v1/admin/measurement/predictions/definitions/{definitionUuid}/runs": ("runs",),
    "admin-api GET /api/v1/admin/measurement/projects": ("projects",),
    "analytics-api GET /api/v1/reporting/outputs": ("outputs",),
}


# Each optional query parameter a route case leaves out, sent by the same public method. Together
# with the route case and the acting company, every declared parameter must be sent. Rows that
# declare ``item`` also run as the owned item, which sends it.
AUDIT_FILTERS: Any = {
    "scope": "tenant",
    "affectedTenantSlug": "acme",
    "since": "2026-11-01T00:00:00Z",
    "until": "2026-11-02T00:00:00Z",
    "actorKind": "human",
    "actorReference": "a",
    "action": "a",
    "resourceType": "r",
    "resourceId": "r",
    "outcome": "success",
    "correlationId": "c",
}
USAGE_WINDOW: Any = {"meterSlug": "events", "start": "2026-11-01T00:00:00Z", "end": "2026-11-02T00:00:00Z", "limit": 1}
_RESERVATIONS = "/api/v1/data-spaces/{slug}/producer-reservations"
_SITE_DOMAINS = "/api/v1/site-domains"
QUERY_CASES: dict[str, Callable[[CustdClient], object]] = {
    "admin-api GET /api/v1/admin/measurement/predictions/definitions/{definitionUuid}/threshold-events": (
        lambda c: c.admin.predictions.list_threshold_events("acme", U, page_size=10)
    ),
    "admin-api GET /api/v1/admin/measurement/predictions/definitions/{definitionUuid}/runs": (
        lambda c: c.admin.predictions.list_runs("acme", U, page_size=10)
    ),
    "admin-api GET /api/v1/admin/measurement/predictions/definitions/{definitionUuid}/outcomes": (
        lambda c: c.admin.predictions.list_outcomes("acme", U, page_size=10)
    ),
    "admin-api DELETE /api/v1/data-spaces/{slug}": lambda c: c.provisioning.data_spaces.revoke("acme", "parent"),
    "admin-api POST /api/v1/data-spaces/{slug}/erasure": lambda c: c.provisioning.data_spaces.erase("acme", "parent"),
    "admin-api GET /api/v1/data-spaces/{slug}/signing-status": (
        lambda c: c.provisioning.data_spaces.get_signing_status("acme", "parent")
    ),
    "admin-api POST /api/v1/data-spaces/{slug}/sites/{siteUuid}/adopt": (
        lambda c: c.provisioning.data_spaces.adopt_site("acme", U, "parent")
    ),
    "admin-api GET /api/v1/data-spaces/{slug}/erasure": (
        lambda c: c.provisioning.data_spaces.get_erasure("acme", "parent")
    ),
    "admin-api GET /api/v1/admin/audit/events/export": (
        lambda c: c.admin.audit.export_events(io.BytesIO(), AUDIT_FILTERS)
    ),
    "admin-api GET /api/v1/admin/audit/events/{eventId}": lambda c: c.admin.audit.get_event(U, {"scope": "tenant"}),
    "admin-api GET /api/v1/admin/audit/events": (
        lambda c: c.admin.audit.list_events({**AUDIT_FILTERS, "limit": 1, "cursor": "next"})
    ),
    "admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/principals": (
        lambda c: c.admin.auth_projects.list_principals(U, U, {"limit": 1, "cursor": "next"})
    ),
    "admin-api GET /api/v1/admin/auth-projects": lambda c: c.admin.auth_projects.list_projects("next"),
    "admin-api GET /api/v1/admin/data-scope-grants": (
        lambda c: c.admin.data_scopes.list_grants({"kind": "machine", "clientId": "web"})
    ),
    "admin-api GET /api/v1/admin/data-scopes/{scopeUuid}/resources": (
        lambda c: c.admin.data_scopes.list_resources(U, include_disabled=True)
    ),
    "admin-api GET /api/v1/admin/data-scopes": lambda c: c.admin.data_scopes.list_scopes(include_disabled=True),
    "admin-api GET /api/v1/admin/data-labels/catalogue": lambda c: c.admin.data_labels.catalogue(include_disabled=True),
    "admin-api GET /api/v1/admin/data-labels/{definitionUuid}": (
        lambda c: c.admin.data_labels.get(U, include_disabled=True)
    ),
    "admin-api GET /api/v1/admin/data-labels": lambda c: c.admin.data_labels.list(include_disabled=True),
    "admin-api GET /api/v1/admin/site-insights/ai-usage": lambda c: c.admin.site_domains.get_platform_ai_usage("day"),
    "admin-api GET /api/v1/admin/measurement/predictions/definitions": (
        lambda c: c.admin.predictions.list_definitions("acme", page_size=10, page_token="next")
    ),
    "admin-api GET /api/v1/admin/measurement/predictions/sources": (
        lambda c: c.admin.predictions.list_signal_sources("acme", page_size=10, page_token="next")
    ),
    "admin-api GET /api/v1/admin/retention/policies/{tenantSlug}/runs": (
        lambda c: c.admin.retention.list_runs("acme", limit=10, offset=10)
    ),
    "admin-api GET /api/v1/admin/time-plans/runs/{runUuid}/annotations": (
        lambda c: c.admin.time_plans.list_annotations("acme", U, limit=10)
    ),
    "admin-api GET /api/v1/admin/time-plans/runs/{runUuid}/history": (
        lambda c: c.admin.time_plans.history("acme", U, limit=10)
    ),
    "admin-api GET /api/v1/admin/time-plans": lambda c: c.admin.time_plans.list("acme", limit=10),
    "admin-api GET /api/v1/admin/usage/me": lambda c: c.admin.usage.get(USAGE_WINDOW),
    "admin-api GET /api/v1/admin/subject-exports": lambda c: c.admin.subject_exports.list(limit=10),
    "admin-api GET /api/v1/data-spaces": lambda c: c.provisioning.data_spaces.list("parent"),
    "admin-api GET /api/v1/data-spaces/usage": lambda c: c.provisioning.data_spaces.get_usage("parent"),
    "admin-api POST /api/v1/data-spaces": lambda c: c.provisioning.data_spaces.create({}, "parent"),
    f"admin-api GET {_RESERVATIONS}": lambda c: c.provisioning.reservations.list("acme", "parent"),
    f"admin-api POST {_RESERVATIONS}": (
        lambda c: c.provisioning.reservations.reserve("acme", {"producerSlug": "web", "ttlSeconds": 60}, "parent")
    ),
    f"admin-api POST {_RESERVATIONS}/{{producerSlug}}/claim": (
        lambda c: c.provisioning.reservations.claim("acme", "web", {"claimedByClientId": U}, "parent")
    ),
    f"admin-api DELETE {_RESERVATIONS}/{{producerSlug}}": (
        lambda c: c.provisioning.reservations.release("acme", "web", "parent")
    ),
    "admin-api GET /api/v1/producer-provisioning": lambda c: c.provisioning.producers.list("acme"),
    f"admin-api DELETE {_SITE_DOMAINS}/keyword-lists": lambda c: c.admin.site_domains.delete_keyword_list("core", U),
    f"admin-api GET {_SITE_DOMAINS}/alert-destination": lambda c: c.admin.site_domains.get_alert_destination(U),
    f"admin-api PUT {_SITE_DOMAINS}/alert-destination": (
        lambda c: c.admin.site_domains.set_alert_destination("ops@example.com", U)
    ),
    f"admin-api GET {_SITE_DOMAINS}/content-gap": lambda c: c.admin.site_domains.get_content_gap(U, "seed"),
    f"admin-api GET {_SITE_DOMAINS}/search-pool/queries": (
        lambda c: c.admin.site_domains.list_search_pool_queries("custd", 10)
    ),
    f"admin-api GET {_SITE_DOMAINS}/keyword-clusters": lambda c: c.admin.site_domains.get_keyword_clusters("core", U),
    f"admin-api GET {_SITE_DOMAINS}/keyword-lists": lambda c: c.admin.site_domains.list_keyword_lists(U),
    f"admin-api PUT {_SITE_DOMAINS}/keyword-lists": (
        lambda c: c.admin.site_domains.save_keyword_list({"name": "Core", "keywords": ["custd"]}, U)
    ),
    f"admin-api GET {_SITE_DOMAINS}/project-context": lambda c: c.admin.site_domains.get_project_context(U),
    f"admin-api PUT {_SITE_DOMAINS}/project-context": lambda c: c.admin.site_domains.set_project_context({}, U),
    f"admin-api GET {_SITE_DOMAINS}/referring-domains": (
        lambda c: c.admin.site_domains.get_referring_domains("example.com", U)
    ),
    f"admin-api GET {_SITE_DOMAINS}/regional-trends": lambda c: c.admin.site_domains.get_regional_trends(U),
    f"admin-api GET {_SITE_DOMAINS}/topic-trends": lambda c: c.admin.site_domains.get_topic_trends(U),
    f"admin-api GET {_SITE_DOMAINS}/web-domains": lambda c: c.admin.site_domains.get_web_domains(U),
    f"admin-api GET {_SITE_DOMAINS}/web-pages": (
        lambda c: c.admin.site_domains.list_web_pages("example.com", U, after="next", limit=10)
    ),
    f"admin-api GET {_SITE_DOMAINS}": lambda c: c.admin.site_domains.list(U),
    f"admin-api GET {_SITE_DOMAINS}/{{domainUuid}}/ai-visibility": (
        lambda c: c.admin.site_domains.get_ai_visibility(U, "2026-11-01", "2026-11-02")
    ),
    f"admin-api GET {_SITE_DOMAINS}/{{domainUuid}}/audit-pages": (
        lambda c: c.admin.site_domains.list_audit_pages(U, 1, 1)
    ),
    f"admin-api GET {_SITE_DOMAINS}/{{domainUuid}}/campaign-links": (
        lambda c: c.admin.site_domains.list_campaign_links(U, True)
    ),
    f"admin-api GET {_SITE_DOMAINS}/{{domainUuid}}/search-value": (
        lambda c: c.admin.site_domains.get_search_value(U, ["signup"], 7)
    ),
    f"admin-api GET {_SITE_DOMAINS}/{{domainUuid}}/search/rows": (
        lambda c: c.admin.site_domains.list_search_rows(U, "query", provider="google", days=7, offset=1, limit=1)
    ),
    f"admin-api GET {_SITE_DOMAINS}/{{domainUuid}}/search": lambda c: c.admin.site_domains.get_search_performance(U, 7),
    f"admin-api GET {_SITE_DOMAINS}/{{domainUuid}}/export/search-metrics": (
        lambda c: c.admin.site_domains.export_search_metrics(U, 1, 1)
    ),
    f"admin-api GET {_SITE_DOMAINS}/{{domainUuid}}/findings/{{findingUuid}}/search-impact": (
        lambda c: c.admin.site_domains.get_finding_search_impact(U, U, 7)
    ),
    f"admin-api GET {_SITE_DOMAINS}/{{domainUuid}}/findings": lambda c: c.admin.site_domains.list_findings(U, "open"),
    f"admin-api GET {_SITE_DOMAINS}/{{domainUuid}}/lighthouse": (
        lambda c: c.admin.site_domains.get_lighthouse_history(U, 7, "https://example.com/")
    ),
    f"admin-api GET {_SITE_DOMAINS}/{{domainUuid}}/rankings": lambda c: c.admin.site_domains.get_rankings(U, 7),
    f"admin-api GET {_SITE_DOMAINS}/{{domainUuid}}/report": (
        lambda c: c.admin.site_domains.get_report(U, template="executive", days=7)
    ),
    f"admin-api GET {_SITE_DOMAINS}/{{domainUuid}}/traffic": (
        lambda c: c.admin.site_domains.get_traffic(U, "2026-11-01", "2026-11-02")
    ),
    f"admin-api GET {_SITE_DOMAINS}/{{domainUuid}}/uptime-history": (
        lambda c: c.admin.site_domains.get_uptime_history(U, 7)
    ),
    "admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/releases": (
        lambda c: c.admin.auth_projects.list_app_releases(U, U, 10)
    ),
    "admin-api GET /api/v1/app/item/measurements": lambda c: _link().list_measurements(after="next", item=U),
    "admin-api GET /api/v1/app/item/runs": lambda c: _link().list_runs(after="next"),
    "admin-api GET /api/v1/admin/workflow-timings/definitions": (
        lambda c: c.admin.workflow_timings.list_definitions(limit=10)
    ),
    "admin-api GET /api/v1/admin/users": lambda c: c.admin.users.list(
        {
            "role": "tenant_admin",
            "globalState": "active",
            "membershipState": "active",
            "welcomeStatus": "sent",
            "includeEnded": True,
            "includeDeleted": True,
        }
    ),
    "admin-api GET /api/v1/admin/users/{userUuid}": lambda c: c.admin.users.get(U, include_ended=True),
    "admin-api POST /api/v1/admin/users/{userUuid}/disable": (
        lambda c: c.admin.users.disable(U, {"reason": "left", "globalUser": True})
    ),
    "admin-api POST /api/v1/admin/users/{userUuid}/enable": (
        lambda c: c.admin.users.enable(U, {"roles": ["tenant_admin"], "globalUser": True})
    ),
    "admin-api GET /api/v1/admin/uncertainty-models": lambda c: c.admin.uncertainty_models.list(source="manual"),
    "analytics-api GET /api/v1/measurement/predictions/definitions/{definitionUuid}/runs": (
        lambda c: c.measurement.predictions.list_runs("a1", since="2026-11-01T00:00:00Z")
    ),
    "admin-api GET /api/v1/admin/time-plans/runs/{runUuid}/predictions": (
        lambda c: c.admin.time_plans.list_run_predictions("acme", "a1", limit=10)
    ),
    "analytics-api GET /api/v1/telemetry/event-count": (
        lambda c: c.analytics.telemetry_event_count("2026-11-26", event_type="page_view")
    ),
    "admin-api DELETE /api/v1/admin/privacy/consent/{subjectId}": (
        lambda c: c.admin.privacy.delete_consent("a1", "a1", source="banner")
    ),
    "admin-api GET /api/v1/admin/accounting/evidence": (
        lambda c: c.admin.accounting_evidence.list(as_of="2026-11-01T00:00:00Z", limit=10)
    ),
    "admin-api GET /api/v1/admin/ingest/claims/{tenantSlug}": lambda c: c.admin.ingest_claims.list("a1", limit=10),
    "admin-api GET /api/v1/admin/usage": lambda c: c.admin.usage.list_usage(USAGE_WINDOW),
    "admin-api GET /api/v1/admin/usage/export": lambda c: c.admin.usage.export_usage(USAGE_WINDOW),
    "admin-api GET /api/v1/error-issues": lambda c: c.admin.error_issues.list(
        site_uuid=U, state="open", sort="last_seen", limit=10, cursor="next"
    ),
}


def load_operations() -> dict[str, dict[str, Any]]:
    snapshot = json.loads((API / "operations.json").read_text(encoding="utf-8"))
    return {operation["id"]: operation for operation in snapshot["operations"]}


def template_pattern(path: str) -> re.Pattern[str]:
    return re.compile("^" + re.sub(r"\\\{[^}]+\\\}", "[^/]+", re.escape(path)) + "$")


def recording(urlopen: "RecordingUrlopen") -> Any:
    """Route the default transport and the no-redirect transport through one recorder."""
    stack = contextlib.ExitStack()
    stack.enter_context(mock.patch("custd.client.urllib.request.urlopen", urlopen))
    stack.enter_context(mock.patch("custd.client._NO_REDIRECT_OPENER.open", urlopen))
    return stack


def send(case: RouteCase, body: bytes = b"{}") -> list[tuple[str, str]]:
    urlopen = RecordingUrlopen(body)
    with recording(urlopen):
        client = CustdClient(base_url=BASE_URL, token="token")
        try:
            case.call(client)
        except DECODE_ERRORS:
            if body != b"{}":
                raise
    return urlopen.requests


def query_sent(call: Callable[[CustdClient], object], acting_company: str = "", owned_item: bool = False) -> set[str]:
    """The query parameter names ``call`` sends, optionally with an acting company or as the owned item."""
    urlopen = RecordingUrlopen()
    with recording(urlopen), contextlib.ExitStack() as stack:
        if owned_item:
            stack.enter_context(mock.patch(f"{__name__}._link", lambda: _app().owned_item(U)))
        try:
            call(CustdClient(base_url=BASE_URL, token="token", acting_company_slug=acting_company))
        except DECODE_ERRORS:
            pass
    return {name for _, url in urlopen.requests for name, _ in parse_qsl(urlsplit(url).query)}


def decode(case: RouteCase, body: object) -> Any:
    with recording(RecordingUrlopen(json.dumps(body).encode("utf-8"))):
        return case.call(CustdClient(base_url=BASE_URL, token="token"))


class SurfaceConformanceTest(unittest.TestCase):
    operations = load_operations()

    def test_coverage_file_lists_exactly_the_route_cases(self) -> None:
        coverage = json.loads((API / "coverage" / "python.json").read_text(encoding="utf-8"))
        self.assertEqual(sorted(coverage["operations"]), coverage["operations"])
        self.assertEqual(set(ROUTES), set(coverage["operations"]))

    def test_each_route_case_sends_its_operation_method_and_path(self) -> None:
        for operation_id, case in ROUTES.items():
            with self.subTest(operation_id):
                operation = self.operations[operation_id]
                self.assertEqual("required", operation["sdk"])
                expected_method = case.method if operation["method"] == "ANY" else operation["method"]
                self.assertIsNotNone(expected_method)
                self.assertRegex(case.path, template_pattern(operation["path"]))
                requests = send(case)
                self.assertEqual(1, len(requests), requests)
                method, url = requests[0]
                self.assertEqual(expected_method, method)
                self.assertEqual(case.path, urlsplit(url).path)

    def test_each_route_case_sends_its_required_query_parameters(self) -> None:
        for operation_id, case in ROUTES.items():
            required = {q["name"] for q in self.operations[operation_id].get("query") or [] if q["required"]}
            with self.subTest(operation_id):
                self.assertLessEqual(required, query_sent(case.call))

    def test_every_declared_query_parameter_can_be_sent(self) -> None:
        self.assertLessEqual(set(QUERY_CASES), set(ROUTES))
        for operation_id, case in ROUTES.items():
            declared = {q["name"] for q in self.operations[operation_id].get("query") or []}
            owned = "item" in declared
            sent = query_sent(case.call, "acme", owned)
            with self.subTest(operation_id):
                if operation_id in QUERY_CASES:
                    extra = query_sent(QUERY_CASES[operation_id], "acme", owned)
                    self.assertTrue(extra - sent, "the query case sends nothing the route case does not")
                    sent |= extra
                self.assertEqual(set(), declared - sent, "declared but never sent")

    def test_null_lists_decode_as_empty(self) -> None:
        for operation_id, field_path in NULL_LISTS.items():
            with self.subTest(operation_id):
                example = json.loads((API / self.operations[operation_id]["example"]).read_text(encoding="utf-8"))
                value: Any = decode(ROUTES[operation_id], example["minimal"])
                for key in field_path:
                    value = value[key]
                self.assertEqual([], value)


if __name__ == "__main__":
    unittest.main()
