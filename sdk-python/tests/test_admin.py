import io
import pathlib
import sys
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "src"))

from custd import CustdClient
from custd.client import AdminStream


class CapturingAdminTransport:
    def __init__(self, responses):
        self.responses = list(responses)
        self.calls = []

    def __call__(self, method, url, payload, headers, timeout):
        self.calls.append({
            "method": method,
            "url": url,
            "payload": payload,
            "headers": headers,
            "timeout": timeout,
        })
        return self.responses.pop(0)


class AdminClientTest(unittest.TestCase):
    def test_audit_reader_carries_scope_filters_and_safe_export(self):
        transport = CapturingAdminTransport([
            {
                "status": 200,
                "body": {
                    "events": [{
                        "eventId": "01957abc-0000-7000-8000-000000000001",
                        "tenantSlug": "acme",
                        "actorKind": "user",
                        "actorId": "private-user-id",
                        "actorReference": "actor-0123456789ab",
                        "actorDisplayName": "Admin User",
                        "actorRoles": ["tenant-admin"],
                        "action": "tenant.create",
                        "resourceType": "tenant",
                        "resourceId": "acme",
                        "outcome": "success",
                        "correlationId": "req-1",
                        "operationId": "op-1",
                        "changes": [{"field": "enabled", "before": False, "after": True}],
                        "details": {"safe": "value"},
                        "network": {
                            "ipAddress": "10.0.0.1", "ipAddressState": "available", "userAgentState": "redacted",
                        },
                        "ipAddress": "legacy-sensitive",
                        "metadata": "sensitive",
                        "createdAt": "2026-07-23T12:00:00Z",
                    }],
                    "nextCursor": {"cursor": "next"},
                    "coverageBeginsAt": "2026-07-01T00:00:00Z",
                    "retention": {
                        "eventMaxAgeSeconds": 31536000, "ipAddressMaxAgeSeconds": 15552000,
                        "userAgentMaxAgeSeconds": 7776000,
                    },
                },
            },
            {"status": 200, "body": {
                "eventId": "01957abc-0000-7000-8000-000000000001",
                "tenantSlug": "acme", "actorKind": "user", "actorReference": "actor-0123456789ab",
                "actorDisplayName": "Admin User", "actorRoles": ["tenant-admin"],
                "action": "tenant.create", "resourceType": "tenant", "resourceId": "acme",
                "outcome": "success", "correlationId": "req-1", "operationId": "op-1",
                "changes": [{"field": "enabled", "before": False, "after": True}],
                "details": {"safe": "value"},
                "network": {"ipAddressState": "redacted", "userAgent": "Mozilla/5.0", "userAgentState": "available"},
                "ipAddress": "legacy-sensitive", "metadata": "sensitive",
                "createdAt": "2026-07-23T12:00:00Z",
            }},
        ])
        csv = b"eventId,tenantSlug\n01957abc-0000-7000-8000-000000000001,acme\n"
        export_urls = []

        def stream(method, url, headers, timeout):
            export_urls.append(url)
            answer_headers = {"content-type": "text/csv; charset=utf-8", "x-request-id": "req-9"}
            return AdminStream(200, answer_headers, io.BytesIO(csv))

        client = CustdClient(
            base_url="http://localhost:8080", token="admin-token", admin_transport=transport,
            admin_stream_transport=stream,
        )
        options = {
            "scope": "global", "affectedTenantSlug": "acme", "since": "2026-07-01T00:00:00Z",
            "until": "2026-08-01T00:00:00Z", "actorKind": "user", "actorReference": "actor-0123456789ab",
            "action": "tenant.create", "resourceType": "tenant", "resourceId": "acme",
            "outcome": "success", "correlationId": "req-1", "environmentId": "env-1", "limit": 50, "cursor": "next",
        }
        written = io.BytesIO()

        listed = client.admin.audit.list_events(options)
        event = client.admin.audit.get_event(
            "01957abc-0000-7000-8000-000000000001", {"scope": "tenant", "companySlug": "acme"}
        )
        exported = client.admin.audit.export_events(written, options, "csv")

        self.assertEqual("next", listed["nextCursor"]["cursor"])
        self.assertEqual("2026-07-01T00:00:00Z", listed["coverageBeginsAt"])
        self.assertEqual(31536000, listed["retention"]["eventMaxAgeSeconds"])
        self.assertEqual("Admin User", listed["events"][0]["actorDisplayName"])
        self.assertNotIn("actorId", listed["events"][0])
        self.assertEqual(["tenant-admin"], listed["events"][0]["actorRoles"])
        self.assertEqual("success", listed["events"][0]["outcome"])
        self.assertEqual("req-1", listed["events"][0]["correlationId"])
        self.assertEqual("op-1", listed["events"][0]["operationId"])
        self.assertEqual(True, listed["events"][0]["changes"][0]["after"])
        self.assertEqual("available", listed["events"][0]["network"]["ipAddressState"])
        self.assertEqual("value", listed["events"][0]["details"]["safe"])
        self.assertNotIn("ipAddress", listed["events"][0])
        self.assertNotIn("metadata", event)
        self.assertEqual(csv, written.getvalue())
        self.assertEqual(
            {"contentType": "text/csv; charset=utf-8", "byteSize": len(csv), "requestId": "req-9"}, exported
        )
        self.assertEqual(
            "http://localhost:8080/api/v1/admin/audit/events?scope=global&affectedTenantSlug=acme&since=2026-07-01T00%3A00%3A00Z&until=2026-08-01T00%3A00%3A00Z&actorKind=user&actorReference=actor-0123456789ab&action=tenant.create&resourceType=tenant&resourceId=acme&outcome=success&correlationId=req-1&environmentId=env-1&limit=50&cursor=next",
            transport.calls[0]["url"],
        )
        self.assertEqual(
            "http://localhost:8080/api/v1/admin/audit/events/01957abc-0000-7000-8000-000000000001?scope=tenant&companySlug=acme",
            transport.calls[1]["url"],
        )
        self.assertEqual(export_urls[0].split("?")[0], "http://localhost:8080/api/v1/admin/audit/events/export")
        self.assertIn("environmentId=env-1", export_urls[0])
        self.assertIn("format=csv", export_urls[0])
        self.assertNotIn("limit=50", export_urls[0])
        self.assertNotIn("cursor=next", export_urls[0])

    def test_email_relay_view_reports_no_relay_while_the_tenant_uses_custds(self):
        effective = {"fromAddress": "no-reply@custd.com", "fromDisplayName": "Custd", "hasCredential": True,
                     "relay": "custd"}
        transport = CapturingAdminTransport([{"status": 200, "body": {"relay": None, "effective": effective}}])
        client = CustdClient(base_url="http://localhost:8080", token="admin-token", admin_transport=transport)

        view = client.admin.email_relay.get("acme")

        self.assertIsNone(view["relay"])
        self.assertEqual("custd", view["effective"]["relay"])

    def test_audit_reader_rejects_non_uuid_event_id(self):
        transport = CapturingAdminTransport([
            {"status": 200, "body": {"events": [{"eventId": "ev-1"}], "nextCursor": {"cursor": ""}}},
        ])
        client = CustdClient(base_url="http://localhost:8080", token="admin-token", admin_transport=transport)

        with self.assertRaisesRegex(ValueError, "eventId must be a UUID"):
            client.admin.audit.list_events()

    def test_reporting_pack_audit_reader_uses_pack_key_and_safe_actor_fields(self):
        transport = CapturingAdminTransport([
            {"status": 200, "body": {"events": [{
                "action": "draft_created", "actorId": "private-user-id", "actorReference": "actor-0123456789ab",
                "actorDisplayName": "Admin User", "resourceType": "reporting_pack", "resourceId": "42",
                "packKey": "security", "createdAt": "2026-07-23T12:00:00Z", "metadata": "sensitive",
            }]}}
        ])
        client = CustdClient(base_url="http://localhost:8080", token="admin-token", admin_transport=transport)

        result = client.admin.audit.list_reporting_pack_events("security")

        self.assertEqual("actor-0123456789ab", result["events"][0]["actorReference"])
        self.assertNotIn("actorId", result["events"][0])
        self.assertNotIn("metadata", result["events"][0])
        self.assertEqual(
            "http://localhost:8080/api/v1/admin/reporting-packs/audit-events?packKey=security",
            transport.calls[0]["url"],
        )

    def test_admin_tenants_create_uses_admin_api(self):
        transport = CapturingAdminTransport([
            {"status": 201, "body": {"slug": "acme", "companyName": "Acme Inc", "enabled": True}},
        ])
        client = CustdClient(
            base_url="http://localhost:8080/",
            token="admin-token",
            admin_transport=transport,
        )

        tenant = client.admin.tenants.create({"slug": "acme", "companyName": "Acme Inc"})

        self.assertEqual("acme", tenant["slug"])
        self.assertEqual("POST", transport.calls[0]["method"])
        self.assertEqual("http://localhost:8080/api/v1/admin/tenants", transport.calls[0]["url"])
        self.assertEqual("Bearer admin-token", transport.calls[0]["headers"]["Authorization"])
        self.assertEqual({"slug": "acme", "companyName": "Acme Inc"}, transport.calls[0]["payload"])

    def test_prediction_admin_keeps_company_scope_and_list_envelopes(self):
        transport = CapturingAdminTransport([
            {"status": 201, "body": {"uuid": "definition-1", "status": "draft"}},
            {"status": 200, "body": {"sources": [{"uuid": "source-1", "source_mode": "http_json"}]}},
            {"status": 202, "body": {}},
        ])
        client = CustdClient(base_url="http://localhost:8080", token="admin-token", admin_transport=transport)

        definition = client.admin.predictions.create_definition("acme", {
            "definition_key": "quota", "display_name": "Quota",
        })
        sources = client.admin.predictions.list_signal_sources("acme", 10, "next")
        client.admin.predictions.run_now("acme", "definition-1", {"worker_id": "proof"})

        self.assertEqual("definition-1", definition["uuid"])
        self.assertEqual("source-1", sources["sources"][0]["uuid"])
        self.assertEqual(
            "http://localhost:8080/api/v1/admin/measurement/predictions/definitions?companySlug=acme",
            transport.calls[0]["url"],
        )
        self.assertEqual(
            "http://localhost:8080/api/v1/admin/measurement/predictions/sources?companySlug=acme&pageSize=10&pageToken=next",
            transport.calls[1]["url"],
        )

    def test_oauth_client_list_does_not_expose_client_secret(self):
        transport = CapturingAdminTransport([
            {
                "status": 201,
                "body": {
                    "clientId": "custd-acme",
                    "companySlug": "acme",
                    "scopes": ["events.write"],
                    "clientSecret": "secret",
                },
            },
            {
                "status": 200,
                "body": {
                    "clients": [
                        {"clientId": "custd-acme", "companySlug": "acme", "scopes": ["events.write"]},
                    ],
                },
            },
        ])
        client = CustdClient(
            base_url="http://localhost:8080",
            token="admin-token",
            admin_transport=transport,
        )

        created = client.admin.oauth_clients.create({
            "clientId": "custd-acme",
            "companySlug": "acme",
            "scopes": ["events.write"],
        })
        clients = client.admin.oauth_clients.list()

        self.assertEqual("secret", created["clientSecret"])
        self.assertNotIn("clientSecret", clients["clients"][0])

    def test_admin_sites_manage_browser_sites(self):
        transport = CapturingAdminTransport([
            {
                "status": 201,
                "body": {
                    "siteUuid": "site-123",
                    "companySlug": "acme",
                    "name": "Docs",
                    "identityMode": "cookieless",
                    "allowedOrigins": ["https://example.com"],
                    "rateLimitPerMinute": 600,
                    "retentionDays": 365,
                    "ingestTarget": {
                        "scopeUuid": "11111111-1111-4111-8111-111111111111",
                        "resourceUuid": "22222222-2222-4222-8222-222222222222",
                        "scopeCode": "acme-store",
                        "resourceCode": "srv-01",
                    },
                    "writeKey": "site_pk_test",
                },
            },
            {"status": 200, "body": {"writeKey": "site_pk_next"}},
        ])
        client = CustdClient(base_url="http://localhost:8080", token="admin-token", admin_transport=transport)

        created = client.admin.sites.create({
            "companySlug": "acme",
            "name": "Docs",
            "identityMode": "cookieless",
            "allowedOrigins": ["https://example.com"],
            "ingestTarget": {
                "scopeUuid": "11111111-1111-4111-8111-111111111111",
                "resourceUuid": "22222222-2222-4222-8222-222222222222",
            },
        })
        rotated = client.admin.sites.rotate_write_key("site-123")

        self.assertEqual("site_pk_test", created["writeKey"])
        self.assertEqual("srv-01", created["ingestTarget"]["resourceCode"])
        self.assertEqual(
            "22222222-2222-4222-8222-222222222222",
            transport.calls[0]["payload"]["ingestTarget"]["resourceUuid"],
        )
        self.assertEqual("site_pk_next", rotated["writeKey"])
        self.assertEqual("http://localhost:8080/api/v1/admin/sites", transport.calls[0]["url"])

    def test_admin_sites_list_get_delete_do_not_expose_write_keys(self):
        site = {
            "siteUuid": "site-123",
            "companySlug": "acme",
            "name": "Docs",
            "identityMode": "cookieless",
            "allowedOrigins": ["https://example.com"],
            "rateLimitPerMinute": 600,
            "retentionDays": 365,
            "enabled": True,
            "ingestTarget": {
                "scopeUuid": "11111111-1111-4111-8111-111111111111",
                "resourceUuid": "22222222-2222-4222-8222-222222222222",
                "scopeCode": "acme-store",
                "resourceCode": "srv-01",
            },
            "writeKey": "site_pk_should_not_leak",
        }
        transport = CapturingAdminTransport([
            {"status": 200, "body": {"sites": [site]}},
            {"status": 200, "body": site},
            {"status": 204, "body": None},
        ])
        client = CustdClient(base_url="http://localhost:8080", token="admin-token", admin_transport=transport)

        listed = client.admin.sites.list()
        got = client.admin.sites.get("site-123")
        client.admin.sites.delete("site-123")

        self.assertNotIn("writeKey", listed["sites"][0])
        self.assertNotIn("writeKey", got)
        self.assertEqual("acme-store", got["ingestTarget"]["scopeCode"])
        self.assertEqual([
            ("GET", "http://localhost:8080/api/v1/admin/sites"),
            ("GET", "http://localhost:8080/api/v1/admin/sites/site-123"),
            ("DELETE", "http://localhost:8080/api/v1/admin/sites/site-123"),
        ], [(call["method"], call["url"]) for call in transport.calls])

    def test_admin_schemas_use_the_schema_registry_routes(self):
        transport = CapturingAdminTransport([
            {"status": 200, "body": "null"},
            {"status": 200, "body": [{"version": "1.0.0", "jsonSchema": "{}", "isActive": True, "enabled": True}]},
            {"status": 200, "body": {"type": "object"}},
            {"status": 201, "body": {"slug": "checkout.started", "name": "Checkout started", "enabled": True}},
        ])
        client = CustdClient(base_url="http://localhost:8080", token="admin-token", admin_transport=transport)

        listed = client.admin.schemas.list()
        versions = client.admin.schemas.list_versions("checkout.started")
        document = client.admin.schemas.get("checkout.started", "1.0.0")
        registered = client.admin.schemas.register({
            "slug": "checkout.started",
            "name": "Checkout started",
            "version": "1.1.0",
            "jsonSchema": '{"type": "object"}',
            "enabled": True,
            "isActive": True,
        })

        self.assertEqual([], listed["eventTypes"])
        self.assertEqual("1.0.0", versions["versions"][0]["version"])
        self.assertEqual({"type": "object"}, document)
        self.assertEqual("checkout.started", registered["slug"])
        self.assertEqual([
            ("GET", "http://localhost:8080/api/v1/schemas"),
            ("GET", "http://localhost:8080/api/v1/schemas/checkout.started/versions"),
            ("GET", "http://localhost:8080/api/v1/schemas/checkout.started/1.0.0"),
            ("POST", "http://localhost:8080/api/v1/schemas"),
        ], [(call["method"], call["url"]) for call in transport.calls])

    def test_admin_measurement_projects_create_uses_admin_api(self):
        transport = CapturingAdminTransport([
            {
                "status": 201,
                "body": {
                    "projectUuid": "project-123",
                    "projectCode": "checkout-runway",
                    "name": "Checkout Runway",
                    "kind": "deadline_forecast",
                    "status": "active",
                },
            },
        ])
        client = CustdClient(base_url="http://localhost:8080", token="admin-token", admin_transport=transport)

        project = client.admin.measurement.projects.create({
            "projectCode": "checkout-runway",
            "name": "Checkout Runway",
            "kind": "deadline_forecast",
            "series": [{
                "seriesCode": "checkout-completions",
                "name": "Checkout completions",
                "unitSlug": "count",
                "completionDirection": "increase",
                "source": "manual",
            }],
            "target": {
                "targetCode": "release",
                "name": "Release",
                "targetValue": 100,
                "targetDate": "2026-08-31T00:00:00Z",
                "state": "active",
            },
        })

        self.assertEqual("project-123", project["projectUuid"])
        self.assertEqual("POST", transport.calls[0]["method"])
        self.assertEqual("http://localhost:8080/api/v1/admin/measurement/projects", transport.calls[0]["url"])

    def test_admin_measurement_observation_bulk_validates_row_results(self):
        transport = CapturingAdminTransport([
            {
                "status": 202,
                "body": {
                    "importId": "import-123",
                    "accepted": 1,
                    "rejected": 1,
                    "results": [
                        {
                            "rowIndex": 1,
                            "success": True,
                            "status": 202,
                            "observationUuid": "observation-123",
                        },
                        {
                            "rowIndex": 2,
                            "success": False,
                            "status": 422,
                            "type": "https://custd.dev/problems/measurement-invalid-observation",
                            "title": "Invalid measurement observation",
                            "detail": "observedAt must be an RFC3339 timestamp",
                        },
                    ],
                },
            },
        ])
        client = CustdClient(base_url="http://localhost:8080", token="admin-token", admin_transport=transport)

        response = client.admin.measurement.projects.submit_observations("checkout-runway", {
            "rows": [
                measurement_observation("2026-07-01T00:00:00Z"),
                measurement_observation("not-a-timestamp"),
            ],
        })

        self.assertEqual(1, response["accepted"])
        self.assertFalse(response["results"][1]["success"])
        self.assertEqual(
            "http://localhost:8080/api/v1/admin/measurement/projects/checkout-runway/observations:bulk",
            transport.calls[0]["url"],
        )

    def test_admin_measurement_csv_import_validates_row_results(self):
        transport = CapturingAdminTransport([
            {
                "status": 202,
                "body": {
                    "importId": "import-456",
                    "accepted": 1,
                    "rejected": 1,
                    "results": [
                        {
                            "rowIndex": 1,
                            "success": True,
                            "status": 202,
                            "observationUuid": "observation-456",
                        },
                        {
                            "rowIndex": 2,
                            "success": False,
                            "status": 422,
                            "type": "https://custd.dev/problems/measurement-invalid-observation",
                            "title": "Invalid measurement observation",
                            "detail": "value must be finite",
                        },
                    ],
                },
            },
        ])
        client = CustdClient(base_url="http://localhost:8080", token="admin-token", admin_transport=transport)

        response = client.admin.measurement.projects.import_csv_string(
            "checkout-runway",
            "seriesUuid,observedAt,value\ncheckout-completions,2026-07-01T00:00:00Z,42.5\n",
            2,
        )

        self.assertEqual(1, response["rejected"])
        self.assertEqual(
            {"csv": "seriesUuid,observedAt,value\ncheckout-completions,2026-07-01T00:00:00Z,42.5\n"},
            transport.calls[0]["payload"],
        )
        self.assertEqual(
            "http://localhost:8080/api/v1/admin/measurement/projects/checkout-runway/observations:csv",
            transport.calls[0]["url"],
        )

    def test_admin_measurement_rejects_mismatched_result_count(self):
        transport = CapturingAdminTransport([
            {"status": 202, "body": {"results": []}},
        ])
        client = CustdClient(base_url="http://localhost:8080", token="admin-token", admin_transport=transport)

        with self.assertRaisesRegex(
            RuntimeError,
            "measurement result count 0 does not match submitted row count 1",
        ):
            client.admin.measurement.projects.submit_observation(
                "checkout-runway",
                measurement_observation("2026-07-01T00:00:00Z"),
            )

    def test_admin_measurement_rejects_successful_row_without_observation_uuid(self):
        transport = CapturingAdminTransport([
            {"status": 202, "body": {"results": [{"rowIndex": 1, "success": True, "status": 202}]}},
        ])
        client = CustdClient(base_url="http://localhost:8080", token="admin-token", admin_transport=transport)

        with self.assertRaisesRegex(RuntimeError, "measurement result 0 missing observationUuid"):
            client.admin.measurement.projects.submit_observation(
                "checkout-runway",
                measurement_observation("2026-07-01T00:00:00Z"),
            )

def measurement_observation(observed_at):
    return {
        "seriesUuid": "checkout-completions",
        "observedAt": observed_at,
        "value": 42,
    }


if __name__ == "__main__":
    unittest.main()
