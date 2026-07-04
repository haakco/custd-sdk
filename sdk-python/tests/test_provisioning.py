import pathlib
import sys
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "src"))

from custd import CustdClient


class CapturingProvisioningTransport:
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


class ProvisioningClientTest(unittest.TestCase):
    def test_data_spaces_use_public_api(self):
        transport = CapturingProvisioningTransport([
            {
                "status": 201,
                "body": {
                    "slug": "agency-store-001",
                    "companyName": "Agency Store 001",
                    "parentCompanySlug": "agency",
                    "enabled": True,
                },
            },
            {
                "status": 200,
                "body": {
                    "dataSpaces": [],
                    "entitlement": {
                        "enabled": True,
                        "activeDataSpaces": 0,
                        "maxActiveDataSpaces": 5,
                        "maxActiveProducersPerDataSpace": 3,
                    },
                },
            },
            {"status": 204, "body": None},
        ])
        client = CustdClient(base_url="http://localhost:8080/", token="broker-token", admin_transport=transport)

        created = client.provisioning.data_spaces.create({
            "slug": "agency-store-001",
            "companyName": "Agency Store 001",
        })
        listed = client.provisioning.data_spaces.list()
        client.provisioning.data_spaces.revoke("agency store/001")

        self.assertEqual("agency-store-001", created["slug"])
        self.assertEqual(5, listed["entitlement"]["maxActiveDataSpaces"])
        self.assertEqual([
            ("POST", "http://localhost:8080/api/v1/data-spaces"),
            ("GET", "http://localhost:8080/api/v1/data-spaces"),
            ("DELETE", "http://localhost:8080/api/v1/data-spaces/agency%20store%2F001"),
        ], [(call["method"], call["url"]) for call in transport.calls])

    def test_producers_keep_one_time_secret_explicit(self):
        transport = CapturingProvisioningTransport([
            {
                "status": 201,
                "body": {
                    "clientId": "custd-agency-store-001-webhook",
                    "clientSecret": "once",
                    "companySlug": "agency-store-001",
                    "producerSlug": "webhook",
                    "scopes": ["events.write"],
                },
            },
            {
                "status": 200,
                "body": [
                    {
                        "clientId": "custd-agency-store-001-webhook",
                        "companySlug": "agency-store-001",
                        "producerSlug": "webhook",
                        "scopes": ["events.write"],
                    },
                ],
            },
            {"status": 200, "body": {"clientId": "custd-x", "clientSecret": "next", "scopes": ["events.write"]}},
            {"status": 204, "body": None},
        ])
        client = CustdClient(base_url="http://localhost:8080", token="broker-token", admin_transport=transport)

        created = client.provisioning.producers.provision({
            "companySlug": "agency-store-001",
            "producerSlug": "webhook",
            "scopeTemplate": "managed-audit",
        })
        producers = client.provisioning.producers.list("agency-store-001")
        rotated = client.provisioning.producers.rotate_secret("custd/agency store")
        client.provisioning.producers.revoke("custd/agency store")

        self.assertEqual("once", created["clientSecret"])
        self.assertEqual("webhook", producers[0]["producerSlug"])
        self.assertEqual("next", rotated["clientSecret"])
        self.assertEqual([
            ("POST", "http://localhost:8080/api/v1/producer-provisioning"),
            ("GET", "http://localhost:8080/api/v1/producer-provisioning?companySlug=agency-store-001"),
            ("POST", "http://localhost:8080/api/v1/producer-provisioning/custd%2Fagency%20store/rotate-secret"),
            ("DELETE", "http://localhost:8080/api/v1/producer-provisioning/custd%2Fagency%20store"),
        ], [(call["method"], call["url"]) for call in transport.calls])


if __name__ == "__main__":
    unittest.main()
