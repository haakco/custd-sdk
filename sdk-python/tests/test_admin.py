import pathlib
import sys
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "src"))

from custd import CustdClient


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
        })
        rotated = client.admin.sites.rotate_write_key("site-123")

        self.assertEqual("site_pk_test", created["writeKey"])
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
        self.assertEqual([
            ("GET", "http://localhost:8080/api/v1/admin/sites"),
            ("GET", "http://localhost:8080/api/v1/admin/sites/site-123"),
            ("DELETE", "http://localhost:8080/api/v1/admin/sites/site-123"),
        ], [(call["method"], call["url"]) for call in transport.calls])

    def test_admin_schemas_manage_event_type_schemas(self):
        transport = CapturingAdminTransport([
            {"status": 200, "body": {"schemas": [{"eventTypeSlug": "page-view", "version": "1.0.0"}]}},
            {"status": 200, "body": {"eventTypeSlug": "page-view", "version": "1.0.0"}},
            {"status": 201, "body": {"eventTypeSlug": "checkout.started", "version": "1.0.0"}},
            {"status": 201, "body": {"eventTypeSlug": "checkout.started", "version": "1.1.0"}},
        ])
        client = CustdClient(base_url="http://localhost:8080", token="admin-token", admin_transport=transport)

        listed = client.admin.schemas.list()
        got = client.admin.schemas.get("page-view")
        registered = client.admin.schemas.register({
            "eventTypeSlug": "checkout.started",
            "version": "1.0.0",
            "jsonSchema": {"type": "object"},
        })
        versioned = client.admin.schemas.create_version(
            "checkout.started",
            {"version": "1.1.0", "jsonSchema": {"type": "object"}},
        )

        self.assertEqual("page-view", listed["schemas"][0]["eventTypeSlug"])
        self.assertEqual("page-view", got["eventTypeSlug"])
        self.assertEqual("checkout.started", registered["eventTypeSlug"])
        self.assertEqual("1.1.0", versioned["version"])
        self.assertEqual([
            ("GET", "http://localhost:8080/api/v1/admin/schemas"),
            ("GET", "http://localhost:8080/api/v1/admin/schemas/page-view"),
            ("POST", "http://localhost:8080/api/v1/admin/schemas"),
            ("POST", "http://localhost:8080/api/v1/admin/schemas/checkout.started/versions"),
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
