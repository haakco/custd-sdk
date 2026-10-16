import json
import pathlib
import sys
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "src"))

from custd import CustdClient, RequestError

# A canonical definition carrying the fields the log-observability template
# emits plus several exotic contracted sections, so a lossy decode is visible.
DEFINITION = {
    "key": "log_observability",
    "displayName": "Log observability",
    "owner": "platform",
    "version": 1,
    "enabled": True,
    "eventTypes": ["log_observability_event"],
    "metrics": [{"key": "volume", "label": "Log volume", "kind": "count", "calculation": "count"}],
    "dimensions": [{"key": "severity", "label": "Severity", "selector": "payload.severity"}],
    "templates": [
        {
            "name": "overview",
            "allowedMetrics": [],
            "sourceModes": ["auto"],
            "maxRows": 250,
            "eventTypes": [],
            "aggregation": "count",
        }
    ],
    "flowRules": [{"key": "f", "correlationSelector": "a", "familySelector": "b", "stepSelector": "c"}],
    "rollupRules": [
        {
            "family": "volume",
            "metric": "volume",
            "sourceEventType": "e",
            "completenessRequired": False,
            "dimensions": [{"slot": 1, "dimension": "d", "selector": "payload.severity"}],
        }
    ],
    "dashboards": [
        {
            "key": "log_observability",
            "title": "Log observability",
            "defaultRange": "7d",
            "refreshSeconds": 60,
            "requiredScopes": ["reporting:read"],
            "widgets": [
                {"key": "volume", "title": "Log volume", "kind": "time_series", "template": "overview"}
            ],
        }
    ],
    "exportFormats": ["manifest"],
    "trust": {"safeFields": ["coverage.status"], "redactionGuard": ["email"]},
    "redactionRules": [{"sourceSystem": "s", "sourceEventType": "e", "resultShape": "summary"}],
    "proof": {"key": "proof", "templates": [], "outputLayout": "summary"},
    "identity": {"subject": {"selector": "s", "type": "subject"}},
    "transitionRules": [{"key": "t", "identity": "subject", "stepSelector": "s"}],
    "activationRules": [{"key": "a", "identity": "subject", "predicate": {"selector": "s"}}],
    "retentionRules": [{"key": "r", "activationRule": "a", "returnPredicate": {"selector": "s"}}],
    "activityRules": [{"key": "ac", "identity": "subject", "bucketDays": 1}],
    "observation": {"version": 1, "sources": [{"key": "s", "label": "S"}], "series": []},
    "reconciliations": [{"version": 1, "tenantKey": "t", "seriesKey": "s", "mode": "m", "sources": []}],
    "assetHierarchy": {"version": 1, "tenantKey": "t", "nodes": [], "edges": []},
    "accounting": {"version": 1, "usageMetric": "u", "schedules": []},
}

BINDINGS = {"eventType": "e", "severityField": "severity", "resourceField": "resource"}


class Transport:
    def __init__(self, body, status=200):
        self.body = body
        self.status = status
        self.calls = []

    def __call__(self, method, url, payload, headers, timeout):
        self.calls.append((method, url.removeprefix("http://localhost:8080"), payload))
        return {"status": self.status, "body": json.dumps(self.body)}


def make_client(transport):
    return CustdClient(base_url="http://localhost:8080", token="token", admin_transport=transport)


class ReportingPackSetupTemplateTest(unittest.TestCase):
    def test_lists_setup_templates_losslessly(self) -> None:
        template = {
            "kind": "log_observability",
            "displayName": "Log observability",
            "definition": DEFINITION,
            "bindings": [{"key": "eventType", "label": "Registered event type", "required": True}],
        }
        transport = Transport({"templates": [template]})
        response = make_client(transport).admin.reporting_packs.list_setup_templates()

        self.assertEqual(
            transport.calls[0][:2], ("GET", "/api/v1/admin/reporting-packs/setup-templates")
        )
        self.assertEqual(response["templates"][0]["definition"], DEFINITION)
        self.assertEqual(response["templates"][0]["bindings"][0]["key"], "eventType")

    def test_binds_typed_log_observability_bindings(self) -> None:
        transport = Transport({"kind": "log_observability", "definition": DEFINITION})
        response = make_client(transport).admin.reporting_packs.bind_setup_template(
            "log_observability", {"bindings": BINDINGS}
        )

        method, url, payload = transport.calls[0]
        self.assertEqual(method, "POST")
        self.assertEqual(
            url, "/api/v1/admin/reporting-packs/setup-templates/log_observability/bind"
        )
        self.assertEqual(payload, {"bindings": BINDINGS})
        self.assertEqual(response["definition"], DEFINITION)

    def test_unknown_kind_surfaces_a_typed_problem_error(self) -> None:
        transport = Transport({"title": "unknown setup template"}, status=400)
        with self.assertRaises(RequestError) as raised:
            make_client(transport).admin.reporting_packs.bind_setup_template(
                "nope", {"bindings": BINDINGS}
            )
        self.assertEqual(raised.exception.status, 400)

    def test_existing_crud_routes_unchanged(self) -> None:
        transport = Transport({"drafts": []})
        make_client(transport).admin.reporting_packs.list_drafts()
        self.assertEqual(transport.calls[0][:2], ("GET", "/api/v1/admin/reporting-packs/drafts"))


if __name__ == "__main__":
    unittest.main()
