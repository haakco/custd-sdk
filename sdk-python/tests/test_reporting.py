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
        self.assertEqual("14d", dashboard["defaultRange"])
        self.assertEqual(300, dashboard["refreshSeconds"])
        self.assertEqual(["reporting:read"], dashboard["requiredScopes"])
        self.assertEqual("awthy_secure_checkout_flow", dashboard["widgets"][0]["template"])
        self.assertEqual(["flow_completion_rate"], dashboard["widgets"][0]["metrics"])
        self.assertEqual(["flow_step"], dashboard["widgets"][0]["dimensions"])
        self.assertEqual("GET", transport.calls[0][0])
        self.assertEqual(
            "http://localhost:8080/api/v1/reporting/dashboards/awthy_managed_audit_reporting",
            transport.calls[0][1],
        )

    def test_reporting_query_returns_trust_diagnostics(self) -> None:
        transport = FakeTransport(fixture("reporting-query-awthy-trust.json"))
        client = CustdClient(base_url="http://localhost:8080", token="token", admin_transport=transport)

        request = fixture("reporting-query-max-rows.json")
        widget = client.reporting.query(request)

        self.assertEqual(2, widget["count"])
        self.assertTrue(widget["complete"])
        self.assertFalse(widget["truncated"])
        self.assertEqual(42, widget["queryDurationMs"])
        self.assertEqual(1, widget["parquetUriCount"])
        self.assertEqual(120000, widget["snapshotAgeMs"])
        self.assertEqual(8000, widget["eventLagP95Ms"])
        self.assertEqual(1, widget["deltaCount"])
        self.assertEqual(100, widget["deltaPercent"])
        self.assertEqual("vs previous period", widget["deltaLabel"])
        self.assertEqual("completed checkouts", widget["secondaryLabel"])
        self.assertEqual("auto", widget["buckets"][0]["source"])
        self.assertTrue(widget["buckets"][0]["complete"])
        self.assertEqual(42, widget["buckets"][0]["queryDurationMs"])
        self.assertEqual(1, widget["buckets"][0]["parquetUriCount"])
        self.assertEqual("healthy", widget["trust"]["status"])
        self.assertEqual("healthy", widget["trust"]["rollupState"])
        self.assertEqual("awthy-audit-event/1.0.0", widget["trust"]["schemaVersion"])
        self.assertEqual("complete", widget["trust"]["coverage"])
        self.assertEqual("reporting.read", widget["trust"]["permissionClass"])
        self.assertEqual([], widget["trust"]["queryWarnings"])
        self.assertEqual("POST", transport.calls[0][0])
        self.assertEqual("http://localhost:8080/api/v1/reporting/query", transport.calls[0][1])
        request_body = transport.calls[0][2]
        self.assertEqual(request, request_body)
        self.assertEqual(50, request_body["maxRows"] if request_body else None)
        self.assertNotIn("rowLimit", request_body or {})

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
