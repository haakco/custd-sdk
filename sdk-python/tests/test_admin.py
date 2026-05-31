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


if __name__ == "__main__":
    unittest.main()
