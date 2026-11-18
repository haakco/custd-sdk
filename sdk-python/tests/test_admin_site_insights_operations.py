"""Site Insights page search queries, GA4 analytics, the export, search import retry and the
operator's task read, against the shapes the server's Go types encode (contract-fixtures)."""

import json
import sys
import unittest
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from custd import (
    SITE_ANALYTICS_CONNECTION_NOT_FOUND_CODE,
    SITE_ANALYTICS_PROPERTY_INVALID_CODE,
    SITE_ANALYTICS_STATUS_PENDING,
    SITE_ANALYTICS_UNAVAILABLE_AUDIENCE,
    SITE_ANALYTICS_UNAVAILABLE_ECOMMERCE,
    SITE_INSIGHTS_EXPORT_SCHEMA,
    SITE_INSIGHTS_TASK_CHECKS,
    SITE_INSIGHTS_TASK_SEARCH_IMPORTS,
    SITE_INSIGHTS_TASK_WEB_GRAPH,
    SITE_LINK_SOURCE_IN_TITLE,
    SITE_PAGE_QUERIES_AVAILABLE,
    SITE_PAGE_QUERIES_NOT_CONNECTED,
    SITE_SEARCH_METRIC_DIMENSION_QUERY,
    SITE_SEARCH_METRIC_DIMENSION_TOTAL,
    SITE_SEARCH_PROVIDER_GOOGLE,
    SITE_SEARCH_RETRY_NOT_FAILING_CODE,
    SITE_TITLE_TEMPLATE_GUIDE,
    CustdClient,
    RequestError,
)

CONTRACT_FIXTURES = Path(__file__).resolve().parents[2] / "contract-fixtures"


def fixture(name: str) -> dict[str, Any]:
    return dict(json.loads((CONTRACT_FIXTURES / name).read_text()))


QUERIES = fixture("site-page-queries.json")
ANALYTICS = fixture("site-analytics.json")
EXPORT = fixture("site-export.json")
TASKS = fixture("site-insights-tasks.json")
API = "http://localhost:8080/api/v1"
D = API + "/site-domains/domain-1"


class RecordingTransport:
    def __init__(self, status: int, body: Any) -> None:
        self.status = status
        self.body = body
        self.calls: list[tuple[str, str, dict[str, Any] | None]] = []

    def __call__(
        self, method: str, url: str, payload: dict[str, Any] | None, headers: dict[str, str], timeout: float
    ) -> dict[str, Any]:
        self.calls.append((method, url, payload))
        return {"status": self.status, "body": "" if self.body is None else json.dumps(self.body)}


def site_domains(status: int, body: Any) -> tuple[Any, RecordingTransport]:
    transport = RecordingTransport(status, body)
    client = CustdClient(base_url="http://localhost:8080", token="token", admin_transport=transport)
    return client.admin.site_domains, transport


class SiteInsightsOperationsTest(unittest.TestCase):
    def test_calls_send_their_routes_bodies_and_acting_company(self) -> None:
        domains, transport = site_domains(200, {})

        domains.get_page_search_queries("domain-1", "https://shop.example.com/pricing", company_slug="acme")
        domains.get_analytics("domain-1")
        domains.connect_analytics("domain-1", ANALYTICS["connectionRequest"]["propertyId"], company_slug="acme")
        domains.disconnect_analytics("domain-1")
        domains.export("domain-1", company_slug="acme")
        domains.export_search_metrics("domain-1")
        domains.export_search_metrics("domain-1", 0, 500)
        domains.retry_search_import("domain-1", SITE_SEARCH_PROVIDER_GOOGLE, company_slug="acme")
        domains.list_site_insights_tasks()

        self.assertEqual(
            [
                ("GET", f"{D}/page-search-queries?url=https%3A%2F%2Fshop.example.com%2Fpricing&companySlug=acme", None),
                ("GET", f"{D}/analytics", None),
                ("PUT", f"{D}/analytics/ga4?companySlug=acme", ANALYTICS["connectionRequest"]),
                ("DELETE", f"{D}/analytics/ga4", None),
                ("GET", f"{D}/export?companySlug=acme", None),
                ("GET", f"{D}/export/search-metrics", None),
                ("GET", f"{D}/export/search-metrics?offset=0&limit=500", None),
                ("POST", f"{D}/search/google/retry?companySlug=acme", None),
                ("GET", f"{API}/admin/site-insights/tasks", None),
            ],
            transport.calls,
        )

    def test_decodes_page_search_queries_and_their_absent_window(self) -> None:
        domains, _ = site_domains(200, QUERIES["pageSearchQueries"])
        page = domains.get_page_search_queries("domain-1", "https://shop.example.com/pricing")
        self.assertEqual((SITE_PAGE_QUERIES_AVAILABLE, "2026-10-18"), (page["state"], page["window"]["from"]))
        self.assertEqual((4.2, True), (page["queries"][0]["position"], page["queries"][0]["inDescription"]))
        self.assertEqual(SITE_TITLE_TEMPLATE_GUIDE, page["titleOptions"][1]["template"])
        self.assertEqual(SITE_LINK_SOURCE_IN_TITLE, page["linkSources"][0]["where"])

        domains, _ = site_domains(200, QUERIES["pageSearchQueriesNotConnected"])
        missing = domains.get_page_search_queries("domain-1", "https://shop.example.com/pricing")
        self.assertEqual((SITE_PAGE_QUERIES_NOT_CONNECTED, []), (missing["state"], missing["queries"]))
        self.assertNotIn("window", missing)

    def test_decodes_analytics_keeping_unreported_numbers_absent(self) -> None:
        domains, _ = site_domains(200, ANALYTICS["report"])
        report = domains.get_analytics("domain-1")
        pricing, compare = report["landingPages"]
        self.assertEqual((820, 34), (pricing.get("sessions"), pricing.get("keyEvents")))
        self.assertNotIn("keyEvents", compare)
        self.assertEqual(
            [SITE_ANALYTICS_UNAVAILABLE_ECOMMERCE, SITE_ANALYTICS_UNAVAILABLE_AUDIENCE],
            [row["report"] for row in report["unavailable"]],
        )

        domains, _ = site_domains(200, ANALYTICS["reportNoKeyEvents"])
        quiet = domains.get_analytics("domain-1")
        self.assertFalse(quiet["keyEventsRecorded"])
        self.assertNotIn("keyEvents", quiet["landingPages"][0])

        domains, _ = site_domains(200, ANALYTICS["reportNotConnected"])
        unconnected = domains.get_analytics("domain-1")
        for absent in ("connection", "windowFrom", "windowTo"):
            self.assertNotIn(absent, unconnected)

        domains, _ = site_domains(200, ANALYTICS["connectionPending"])
        pending = domains.connect_analytics("domain-1", "123456789")
        self.assertEqual(SITE_ANALYTICS_STATUS_PENDING, pending["status"])
        self.assertNotIn("lastImportedAt", pending)

    def test_decodes_the_export_and_its_search_metric_pages(self) -> None:
        domains, _ = site_domains(200, EXPORT["export"])
        export = domains.export("domain-1")
        self.assertEqual((SITE_INSIGHTS_EXPORT_SCHEMA, "example.com"), (export["schema"], export["domain"]["host"]))
        self.assertEqual(2, export["monitoring"]["findingRows"])
        self.assertEqual(EXPORT["export"]["search"]["indexNow"], export["search"]["indexNow"])
        self.assertEqual("Example Hosting", export["site"]["projectContext"]["brandNames"][0])

        domains, _ = site_domains(200, EXPORT["searchMetrics"])
        page = domains.export_search_metrics("domain-1")
        total, query = page["rows"]
        self.assertEqual((SITE_SEARCH_METRIC_DIMENSION_TOTAL, ""), (total["dimension"], total["key"]))
        self.assertEqual(SITE_SEARCH_METRIC_DIMENSION_QUERY, query["dimension"])
        self.assertEqual((0, 2, 2), (page["offset"], page["limit"], page["total"]))

    def test_decodes_the_task_status_and_a_retried_connection(self) -> None:
        domains, _ = site_domains(200, TASKS["tasks"])
        checks, imports, graph = domains.list_site_insights_tasks()["tasks"]
        self.assertEqual(SITE_INSIGHTS_TASK_CHECKS, checks["taskName"])
        self.assertEqual(3, checks["backlog"][0]["count"])
        self.assertNotIn("lastFailure", checks)
        self.assertEqual(SITE_INSIGHTS_TASK_SEARCH_IMPORTS, imports["taskName"])
        self.assertEqual("failed", imports.get("lastRunStatus"))
        self.assertEqual((SITE_INSIGHTS_TASK_WEB_GRAPH, False), (graph["taskName"], graph["registered"]))
        self.assertNotIn("nextRunAt", graph)

        domains, _ = site_domains(200, TASKS["searchConnectionRetried"])
        retried = domains.retry_search_import("domain-1", SITE_SEARCH_PROVIDER_GOOGLE)
        self.assertEqual(("failing", "2026-11-14"), (retried["status"], retried.get("importedThrough")))

    def test_problems_reach_the_caller_with_their_codes(self) -> None:
        cases = [
            (ANALYTICS["propertyInvalidProblem"], SITE_ANALYTICS_PROPERTY_INVALID_CODE),
            (ANALYTICS["connectionNotFoundProblem"], SITE_ANALYTICS_CONNECTION_NOT_FOUND_CODE),
            (TASKS["retryNotFailingProblem"], SITE_SEARCH_RETRY_NOT_FAILING_CODE),
            (EXPORT["searchMetricsInvalidProblem"], None),
        ]
        for problem, code in cases:
            domains, _ = site_domains(problem["status"], problem)
            with self.subTest(code), self.assertRaises(RequestError) as raised:
                domains.get_analytics("domain-1")
            self.assertEqual((problem["status"], code), (raised.exception.status, raised.exception.code))


if __name__ == "__main__":
    unittest.main()
