import pathlib
import sys
import unittest
from typing import Any

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "src"))

from custd import CustdClient
from custd.admin_usage import USAGE_MAX_LIMIT


class FakeTransport:
    def __init__(self, body: dict[str, Any]):
        self.body = body
        self.calls: list[tuple[str, str, dict[str, Any] | None]] = []

    def __call__(self, method, url, payload, headers, timeout):
        self.calls.append((method, url, payload))
        return {"status": 200, "body": self.body}


REPORT: dict[str, Any] = {
    "schemaVersion": "usage.v1",
    "companySlug": "acme",
    "start": "2026-09-01T00:00:00Z",
    "end": "2026-10-01T00:00:00Z",
    "rows": [
        {
            "accountCompanySlug": "acme",
            "dataSpaceCompanySlug": "acme-web",
            "meterSlug": "events.ingested",
            "meterVersion": 1,
            "unit": "event",
            "windowStart": "2026-09-01T00:00:00Z",
            "windowEnd": "2026-09-02T00:00:00Z",
            "quantity": 42,
            "sourceWatermark": 100,
            "completenessState": "final",
            "correctionGeneration": 0,
            "calculationVersion": 1,
        }
    ],
    "totals": [
        {
            "accountCompanySlug": "acme",
            "dataSpaceCompanySlug": "acme-web",
            "meterSlug": "events.ingested",
            "unit": "event",
            "quantity": 42,
        }
    ],
    "sourceWatermark": 100,
    "containsProvisional": False,
    "containsIncomplete": False,
}


class UsageAdminClientTest(unittest.TestCase):
    def test_reads_the_current_tenant_usage(self) -> None:
        transport = FakeTransport(REPORT)
        client = CustdClient(base_url="http://localhost:8080", token="token", admin_transport=transport)

        report = client.admin.usage.get()

        self.assertEqual(["GET"], [call[0] for call in transport.calls])
        self.assertEqual(["http://localhost:8080/api/v1/admin/usage/me"], [call[1] for call in transport.calls])
        self.assertEqual("usage.v1", report["schemaVersion"])
        self.assertEqual("acme", report["companySlug"])
        self.assertEqual(42, report["rows"][0]["quantity"])
        self.assertEqual("final", report["rows"][0]["completenessState"])
        self.assertEqual("events.ingested", report["totals"][0]["meterSlug"])
        self.assertFalse(report["containsProvisional"])

    def test_encodes_the_meter_window_and_limit(self) -> None:
        transport = FakeTransport(REPORT)
        client = CustdClient(base_url="http://localhost:8080", token="token", admin_transport=transport)

        client.admin.usage.get(
            {
                "meterSlug": "events.ingested",
                "start": "2026-09-01T00:00:00Z",
                "end": "2026-10-01T00:00:00Z",
                "limit": 100,
            }
        )

        self.assertEqual(
            "http://localhost:8080/api/v1/admin/usage/me"
            "?end=2026-10-01T00%3A00%3A00Z&limit=100&meter=events.ingested&start=2026-09-01T00%3A00%3A00Z",
            transport.calls[0][1],
        )

    def test_rejects_an_invalid_window_or_limit_before_sending(self) -> None:
        cases: list[dict[str, Any]] = [
            {"start": "2026-10-01T00:00:00Z", "end": "2026-10-01T00:00:00Z"},
            {"start": "not-a-timestamp"},
            {"end": "2026-10-01T00:00:00"},  # no offset
            {"limit": 0},
            {"limit": USAGE_MAX_LIMIT + 1},
            {"limit": -1},
        ]

        for case in cases:
            with self.subTest(case=case):
                transport = FakeTransport(REPORT)
                client = CustdClient(base_url="http://localhost:8080", token="token", admin_transport=transport)
                with self.assertRaises(ValueError):
                    client.admin.usage.get(case)  # type: ignore[arg-type]
                self.assertEqual([], transport.calls)


if __name__ == "__main__":
    unittest.main()
