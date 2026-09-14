import json
import unittest
from typing import Any

from custd import CustdClient
from custd.analytics_events import MAX_ANALYTICS_LABEL_FILTERS


class FakeTransport:
    def __init__(self, body: dict[str, Any], status: int = 200):
        self.body = body
        self.status = status
        self.calls: list[tuple[str, str, dict[str, Any] | None, dict[str, str], float]] = []

    def __call__(
        self,
        method: str,
        url: str,
        body: dict[str, Any] | None,
        headers: dict[str, str],
        timeout: float,
    ) -> dict[str, Any]:
        self.calls.append((method, url, body, headers, timeout))
        return {"status": self.status, "body": json.dumps(self.body)}


RESPONSE: dict[str, Any] = {
    "results": [{"eventTypeSlug": "page_view", "payload": {"path": "/"}}],
    "count": 1,
    "sources": [
        {
            "name": "postgres",
            "count": 1,
            "complete": True,
            "fresh": True,
            "queryDurationMs": 4,
            "freshnessLagMs": 12,
        }
    ],
    "timing": {
        "eventLagP50Ms": 10,
        "eventLagP95Ms": 20,
        "eventLagMaxMs": 30,
        "queryDurationMs": 4,
        "snapshotAgeMs": 100,
    },
}


class AnalyticsEventClientTest(unittest.TestCase):
    def test_queries_the_tenant_route_and_surfaces_the_server_assessment(self) -> None:
        transport = FakeTransport(RESPONSE)
        client = CustdClient(base_url="http://localhost:8080", token="token", admin_transport=transport)

        response = client.analytics.query({"date": "2026-09-14", "eventType": "page_view", "limit": 50})

        # The tenant route, not the admin one: the credential already names the tenant.
        self.assertEqual(["POST"], [call[0] for call in transport.calls])
        self.assertEqual(["http://localhost:8080/api/v1/analytics/query"], [call[1] for call in transport.calls])
        # The server's own completeness and freshness assessment is surfaced verbatim.
        self.assertTrue(response["sources"][0]["complete"])
        self.assertTrue(response["sources"][0]["fresh"])
        self.assertEqual(20, response["timing"]["eventLagP95Ms"])
        self.assertEqual([{"eventTypeSlug": "page_view", "payload": {"path": "/"}}], response["results"])

    def test_serialises_only_documented_public_fields(self) -> None:
        transport = FakeTransport(RESPONSE)
        client = CustdClient(base_url="http://localhost:8080", token="token", admin_transport=transport)

        # anonymousId is an internal exact-subject predicate and countOnly is an internal
        # flag. Both are absent from the service's public JSON contract, so a caller must
        # not be able to smuggle them onto the wire by passing extra properties.
        client.analytics.query(
            {"date": "2026-09-14", "anonymousId": "subject-1", "countOnly": True}  # type: ignore[typeddict-unknown-key]
        )

        self.assertEqual({"date": "2026-09-14"}, transport.calls[0][2])

    def test_rejects_invalid_requests_before_sending(self) -> None:
        too_many = [{"key": "k", "value": "v"} for _ in range(MAX_ANALYTICS_LABEL_FILTERS + 1)]
        cases: list[dict[str, Any]] = [
            {},
            {"date": "2026-09-14", "labelFilters": too_many},
            {"date": "2026-09-14", "source": "not-a-source"},
        ]

        for case in cases:
            with self.subTest(case=case):
                transport = FakeTransport(RESPONSE)
                client = CustdClient(base_url="http://localhost:8080", token="token", admin_transport=transport)
                with self.assertRaises(ValueError):
                    client.analytics.query(case)  # type: ignore[arg-type]
                self.assertEqual([], transport.calls)


if __name__ == "__main__":
    unittest.main()
