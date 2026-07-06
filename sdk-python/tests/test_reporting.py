import json
import unittest
from pathlib import Path
from typing import Any

from custd import CustdClient

FIXTURES = Path(__file__).resolve().parents[2] / "contract-fixtures"


class FakeTransport:
    def __init__(self, body: dict[str, Any]):
        self.body = body
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
        return {"status": 200, "body": json.dumps(self.body)}


def fixture(name: str) -> dict[str, Any]:
    return json.loads((FIXTURES / name).read_text())


class ReportingClientTest(unittest.TestCase):
    def test_reporting_dashboard_reads_awthy_dashboard(self) -> None:
        transport = FakeTransport(fixture("reporting-dashboard-awthy.json"))
        client = CustdClient(base_url="http://localhost:8080", token="token", admin_transport=transport)

        dashboard = client.reporting.dashboard("awthy_managed_audit_reporting")

        self.assertEqual("awthy_managed_audit_reporting", dashboard["key"])
        self.assertEqual("GET", transport.calls[0][0])
        self.assertEqual(
            "http://localhost:8080/api/v1/reporting/dashboards/awthy_managed_audit_reporting",
            transport.calls[0][1],
        )

    def test_reporting_query_returns_trust_diagnostics(self) -> None:
        transport = FakeTransport(fixture("reporting-query-awthy-trust.json"))
        client = CustdClient(base_url="http://localhost:8080", token="token", admin_transport=transport)

        widget = client.reporting.query(
            {
                "template": "awthy_secure_checkout_flow",
                "metrics": ["flow_completion_rate"],
                "from": "2026-07-06",
                "to": "2026-07-06",
                "maxRows": 50,
            }
        )

        self.assertEqual("healthy", widget["trust"]["status"])
        self.assertEqual("POST", transport.calls[0][0])
        self.assertEqual("http://localhost:8080/api/v1/reporting/query", transport.calls[0][1])

    def test_reporting_query_rejects_unsafe_trust_diagnostics(self) -> None:
        transport = FakeTransport(fixture("reporting-query-unsafe-trust.json"))
        client = CustdClient(base_url="http://localhost:8080", token="token", admin_transport=transport)

        with self.assertRaisesRegex(ValueError, "unsafe reporting trust diagnostics"):
            client.reporting.query(
                {
                    "template": "awthy_secure_checkout_flow",
                    "metrics": ["flow_completion_rate"],
                    "rangeDays": 1,
                }
            )
