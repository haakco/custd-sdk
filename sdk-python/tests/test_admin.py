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


if __name__ == "__main__":
    unittest.main()
