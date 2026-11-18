"""Site Insights client against admin-api responses recorded from the server's own DTOs.

contract-fixtures/site-insights.json is libs/go/siteaudit encoded by encoding/json, so
omitted (omitempty) fields are absent exactly as the server sends them.
"""

import json
import sys
import unittest
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from custd import (
    SITE_DOMAIN_NOT_VERIFIED_CODE,
    SITE_GENERATED_FORMAT_HTML,
    SITE_INDEXNOW_ACCEPTED,
    SITE_INDEXNOW_DOMAIN_UNVERIFIED_CODE,
    SITE_INDEXNOW_FAILED,
    SITE_INDEXNOW_KEY_UNVERIFIED_CODE,
    SITE_INDEXNOW_LIMIT_CODE,
    SITE_INDEXNOW_NOT_ENABLED_CODE,
    SITE_INDEXNOW_QUEUED,
    SITE_INDEXNOW_URLS_INVALID_CODE,
    SITE_PAGE_NOT_ON_DOMAIN_CODE,
    SITE_PAGE_RECHECK_CHECKED,
    SITE_PAGE_RECHECK_LIMIT_CODE,
    SITE_REMEDY_KIND_CONTENT,
    SITE_REMEDY_KIND_MARKUP,
    SITE_REMEDY_KIND_SERVER,
    SITE_ROBOTS_SOURCE_LIVE,
    SITE_RULE_IDS,
    SITE_RULE_TITLE_MISSING,
    SITE_RULE_UPTIME_DOWN,
    SITE_SEARCH_INSPECTION_LIMIT_CODE,
    SITE_SEARCH_INSPECTION_NOT_CONNECTED_CODE,
    SITE_SEARCH_INSPECTION_URL_INVALID_CODE,
    CustdClient,
    RequestError,
)

CONTRACT_FIXTURES = Path(__file__).resolve().parents[2] / "contract-fixtures"
FIXTURES = json.loads((CONTRACT_FIXTURES / "site-insights.json").read_text())
PAGE_TOOLS = json.loads((CONTRACT_FIXTURES / "site-page-tools.json").read_text())
INDEXNOW = json.loads((CONTRACT_FIXTURES / "site-indexnow.json").read_text())
REPORTING = json.loads((CONTRACT_FIXTURES / "site-insights-reporting.json").read_text())
BASE = "http://localhost:8080/api/v1/site-domains"
DOMAIN = "0198a3b2-0000-7000-8000-000000000001"
SITE = "0198a3b2-0000-7000-8000-000000000100"


class RecordingTransport:
    def __init__(self, status: int, body: Any) -> None:
        self.status = status
        self.body = body
        self.calls: list[tuple[str, str, dict[str, Any] | None]] = []

    def __call__(
        self, method: str, url: str, payload: dict[str, Any] | None, headers: dict[str, str], timeout: float
    ) -> dict[str, Any]:
        self.calls.append((method, url, payload))
        body = "" if self.body is None else json.dumps(self.body)
        return {"status": self.status, "body": body}


def site_domains(status: int, body: Any) -> tuple[Any, RecordingTransport]:
    transport = RecordingTransport(status, body)
    client = CustdClient(base_url="http://localhost:8080", token="token", admin_transport=transport)
    return client.admin.site_domains, transport


class SiteDomainRoutesTest(unittest.TestCase):
    def test_domain_operations_send_their_routes_and_acting_company(self) -> None:
        domains, transport = site_domains(200, FIXTURES["domain"])

        domains.create({"siteUuid": SITE, "host": "www.example.com"}, company_slug="acme")
        domains.get(DOMAIN, company_slug="acme")
        domains.verify(DOMAIN)
        domains.request_audit(DOMAIN)
        domains.set_check_mode(DOMAIN, "paused")
        domains.attest(DOMAIN)
        domains.unattest(DOMAIN)
        domains.delete(DOMAIN)

        self.assertEqual(
            [
                ("POST", f"{BASE}?companySlug=acme", {"siteUuid": SITE, "host": "www.example.com"}),
                ("GET", f"{BASE}/{DOMAIN}?companySlug=acme", None),
                ("POST", f"{BASE}/{DOMAIN}/verify", None),
                ("POST", f"{BASE}/{DOMAIN}/audit", None),
                ("PUT", f"{BASE}/{DOMAIN}/checks", {"mode": "paused"}),
                ("POST", f"{BASE}/{DOMAIN}/attestation", None),
                ("DELETE", f"{BASE}/{DOMAIN}/attestation", None),
                ("DELETE", f"{BASE}/{DOMAIN}", None),
            ],
            transport.calls,
        )

    def test_reads_send_optional_filters_only_when_given(self) -> None:
        domains, transport = site_domains(200, {"domains": [], "findings": [], "incidents": []})

        domains.list()
        domains.list(SITE)
        domains.list_findings(DOMAIN)
        domains.list_findings(DOMAIN, "all", company_slug="acme")
        domains.list_incidents(DOMAIN)

        self.assertEqual(
            [
                f"{BASE}",
                f"{BASE}?siteUuid={SITE}",
                f"{BASE}/{DOMAIN}/findings",
                f"{BASE}/{DOMAIN}/findings?state=all&companySlug=acme",
                f"{BASE}/{DOMAIN}/incidents",
            ],
            [call[1] for call in transport.calls],
        )

    def test_site_bound_credential_names_no_site(self) -> None:
        domains, transport = site_domains(200, FIXTURES["alertDestination"])

        domains.create({"host": "www.example.com"})
        domains.get_alert_destination()
        domains.set_alert_destination("")
        domains.set_alert_destination("owner@example.com", SITE)

        self.assertEqual(
            [
                ("POST", BASE, {"host": "www.example.com"}),
                ("GET", f"{BASE}/alert-destination", None),
                ("PUT", f"{BASE}/alert-destination", {"emailRecipient": ""}),
                ("PUT", f"{BASE}/alert-destination?siteUuid={SITE}", {"emailRecipient": "owner@example.com"}),
            ],
            transport.calls,
        )

    def test_search_operations_send_their_routes(self) -> None:
        domains, transport = site_domains(200, FIXTURES["searchConnection"])

        domains.get_search_account()
        domains.get_search_performance(DOMAIN)
        domains.get_search_performance(DOMAIN, 7)
        domains.connect_search(DOMAIN, "bing", {"property": "https://www.example.com/", "apiKey": "key"})
        domains.connect_search(DOMAIN, "google", {"property": "sc-domain:example.com"})
        domains.disconnect_search(DOMAIN, "google")

        self.assertEqual(
            [
                ("GET", f"{BASE}/search-account", None),
                ("GET", f"{BASE}/{DOMAIN}/search", None),
                ("GET", f"{BASE}/{DOMAIN}/search?days=7", None),
                ("PUT", f"{BASE}/{DOMAIN}/search/bing", {"property": "https://www.example.com/", "apiKey": "key"}),
                ("PUT", f"{BASE}/{DOMAIN}/search/google", {"property": "sc-domain:example.com"}),
                ("DELETE", f"{BASE}/{DOMAIN}/search/google", None),
            ],
            transport.calls,
        )

    def test_path_segments_are_escaped(self) -> None:
        domains, transport = site_domains(200, FIXTURES["domain"])

        domains.get("a/b?c")

        self.assertEqual(f"{BASE}/a%2Fb%3Fc", transport.calls[0][1])


class SiteDomainResponsesTest(unittest.TestCase):
    def test_decodes_a_checked_domain(self) -> None:
        domains, _ = site_domains(200, FIXTURES["domain"])

        domain = domains.get(DOMAIN)

        self.assertTrue(domain["ownership"]["verified"])
        self.assertEqual("attested", domain["ownership"]["verifiedBy"])
        self.assertEqual("awthy-site-broker", domain["ownership"]["attestation"]["clientId"])
        self.assertEqual(1, domain["audit"]["lastSummary"]["high"])
        self.assertEqual("down", domain["checks"]["uptime"]["status"])
        self.assertEqual(3, domain["checks"]["openIncident"]["failedChecks"])
        self.assertEqual(840, domain["checks"]["warming"]["unwarmedResponseMs"])

    def test_decodes_lists_with_absent_optional_fields(self) -> None:
        domains, _ = site_domains(200, FIXTURES["domainList"])
        self.assertEqual(DOMAIN, domains.list(SITE)["domains"][0]["domainUuid"])

        domains, _ = site_domains(200, FIXTURES["pendingDomain"])
        pending = domains.get(DOMAIN)
        self.assertFalse(pending["ownership"]["verified"])
        self.assertNotIn("lastSummary", pending["audit"])
        self.assertNotIn("openIncident", pending["checks"])
        self.assertEqual("no TXT record found", pending["ownership"]["lastCheckFailure"])

        domains, _ = site_domains(200, FIXTURES["findingList"])
        findings = domains.list_findings(DOMAIN, "all")["findings"]
        self.assertEqual([SITE_RULE_TITLE_MISSING, SITE_RULE_UPTIME_DOWN], [f["rule"] for f in findings])
        self.assertTrue(findings[1]["history"]["fixed"])
        self.assertEqual(SITE_REMEDY_KIND_CONTENT, findings[0]["remedy"]["kind"])
        self.assertEqual(SITE_REMEDY_KIND_SERVER, findings[1]["remedy"]["kind"])
        self.assertNotIn("generated", findings[0]["remedy"])

        domains, _ = site_domains(200, FIXTURES["incidentList"])
        incidents = domains.list_incidents(DOMAIN)["incidents"]
        self.assertNotIn("resolvedAt", incidents[0])
        self.assertEqual("2026-11-12T01:20:00Z", incidents[1]["resolvedAt"])

    def test_decodes_search_performance(self) -> None:
        domains, _ = site_domains(200, FIXTURES["searchPerformance"])

        performance = domains.get_search_performance(DOMAIN, 28)

        self.assertEqual(["active"], [c["status"] for c in performance["connections"]])
        source = performance["sources"][0]
        self.assertEqual(4, source["totals"]["clicks"])
        self.assertEqual("2026-11-15", source["from"])
        self.assertEqual(2, source["previous"]["clicks"])
        self.assertEqual("2026-11-15", source["daily"][0]["day"])
        self.assertEqual(1, len(performance["strikingDistance"]))

        domains, _ = site_domains(200, FIXTURES["searchAccount"])
        account = domains.get_search_account()
        self.assertTrue(account["googleConfigured"])
        self.assertFalse(account["bingConfigured"])

    def test_delete_and_disconnect_accept_no_content(self) -> None:
        domains, _ = site_domains(204, None)

        self.assertIsNone(domains.delete(DOMAIN))
        self.assertIsNone(domains.disconnect_search(DOMAIN, "bing"))

    def test_a_non_object_response_is_refused(self) -> None:
        domains, _ = site_domains(200, ["not", "a", "domain"])

        with self.assertRaises(ValueError):
            domains.get(DOMAIN)

    def test_problem_code_reaches_the_caller(self) -> None:
        domains, _ = site_domains(409, FIXTURES["notVerifiedProblem"])

        with self.assertRaises(RequestError) as raised:
            domains.request_audit(DOMAIN)

        self.assertEqual(409, raised.exception.status)
        self.assertEqual(SITE_DOMAIN_NOT_VERIFIED_CODE, raised.exception.code)
        self.assertIn("verify the domain", str(raised.exception))


class SitePageToolsTest(unittest.TestCase):
    def test_page_tools_send_their_routes_and_bodies(self) -> None:
        domains, transport = site_domains(202, PAGE_TOOLS["pageRecheckQueued"])
        page = "https://example.com/plans"
        draft = PAGE_TOOLS["pageCheckRequest"]
        robots = PAGE_TOOLS["robotsTestRequest"]

        domains.get_page_facts(DOMAIN, page, company_slug="acme")
        domains.request_page_recheck(DOMAIN, page)
        domains.get_page_recheck(DOMAIN, "r/1")
        domains.check_page(DOMAIN, draft["url"], draft["html"])
        domains.test_robots(DOMAIN, robots["url"], robots["userAgent"], robots["robotsTxt"])
        domains.test_robots(DOMAIN, "/", "GPTBot")

        self.assertEqual(
            [
                ("GET", f"{BASE}/{DOMAIN}/page-facts?url=https%3A%2F%2Fexample.com%2Fplans&companySlug=acme", None),
                ("POST", f"{BASE}/{DOMAIN}/page-rechecks", PAGE_TOOLS["pageRecheckRequest"]),
                ("GET", f"{BASE}/{DOMAIN}/page-rechecks/r%2F1", None),
                ("POST", f"{BASE}/{DOMAIN}/page-check", draft),
                ("POST", f"{BASE}/{DOMAIN}/robots-test", robots),
                ("POST", f"{BASE}/{DOMAIN}/robots-test", {"url": "/", "userAgent": "GPTBot"}),
            ],
            transport.calls,
        )

    def test_decodes_page_facts_and_rechecks(self) -> None:
        domains, _ = site_domains(200, PAGE_TOOLS["pageFacts"])
        facts = domains.get_page_facts(DOMAIN, "https://example.com/plans")
        self.assertEqual(57.1, facts["readability"]["fleschReadingEase"])
        self.assertEqual([1, 2], [heading["level"] for heading in facts["headings"]])
        self.assertEqual("en-za", facts["hreflang"][0]["code"])

        domains, _ = site_domains(200, PAGE_TOOLS["pageFactsWithoutReadingEase"])
        self.assertNotIn("fleschReadingEase", domains.get_page_facts(DOMAIN, "https://example.com/af/planne")["readability"])

        domains, _ = site_domains(202, PAGE_TOOLS["pageRecheckQueued"])
        queued = domains.request_page_recheck(DOMAIN, "https://example.com/plans")
        self.assertNotIn("checkedAt", queued)
        self.assertEqual([], queued["openRules"])

        domains, _ = site_domains(200, PAGE_TOOLS["pageRecheckChecked"])
        checked = domains.get_page_recheck(DOMAIN, queued["recheckUuid"])
        self.assertEqual(SITE_PAGE_RECHECK_CHECKED, checked["state"])
        self.assertEqual(["title.missing"], checked["fixedRules"])

        domains, _ = site_domains(200, PAGE_TOOLS["pageRecheckFailed"])
        self.assertEqual("the page answered HTTP 503", domains.get_page_recheck(DOMAIN, "r")["failure"])

    def test_decodes_draft_findings_with_remedies(self) -> None:
        domains, _ = site_domains(200, PAGE_TOOLS["pageCheck"])

        result = domains.check_page(DOMAIN, "https://example.com/plans", "<html></html>")

        canonical = next(f for f in result["findings"] if f["rule"] == "canonical.missing")
        self.assertNotIn("findingUuid", canonical)
        self.assertEqual(SITE_REMEDY_KIND_MARKUP, canonical["remedy"]["kind"])
        self.assertEqual(SITE_GENERATED_FORMAT_HTML, canonical["remedy"]["generated"]["format"])
        self.assertIn('href="https://example.com/plans"', canonical["remedy"]["generated"]["code"])
        self.assertEqual(13, result["page"]["wordCount"])

        self.assertEqual({"kind": "", "element": ""}, PAGE_TOOLS["remedyUnknownRule"])
        domains, _ = site_domains(200, {"findings": [PAGE_TOOLS["findingWithGeneratedFix"]]})
        finding = domains.list_findings(DOMAIN)["findings"][0]
        self.assertEqual("<link rel=\"canonical\">", finding["remedy"]["element"])

    def test_decodes_robots_tests(self) -> None:
        domains, _ = site_domains(200, PAGE_TOOLS["robotsTest"])
        pasted = domains.test_robots(DOMAIN, "/private/report?id=1", "Googlebot", "User-agent: *")
        self.assertFalse(pasted["allowed"])
        self.assertEqual({"line": 2, "directive": "disallow", "pattern": "/private/"}, pasted["rule"])
        self.assertNotIn("robotsStatus", pasted)

        domains, _ = site_domains(200, PAGE_TOOLS["robotsTestLiveMissing"])
        live = domains.test_robots(DOMAIN, "/", "GPTBot")
        self.assertEqual(SITE_ROBOTS_SOURCE_LIVE, live["source"])
        self.assertEqual(404, live["robotsStatus"])
        self.assertNotIn("rule", live)

    def test_page_tool_problem_codes_reach_the_caller(self) -> None:
        cases = [
            (400, "pageNotOnDomainProblem", SITE_PAGE_NOT_ON_DOMAIN_CODE),
            (429, "pageRecheckLimitProblem", SITE_PAGE_RECHECK_LIMIT_CODE),
        ]
        for status, fixture, code in cases:
            domains, _ = site_domains(status, PAGE_TOOLS[fixture])
            with self.assertRaises(RequestError) as raised:
                domains.request_page_recheck(DOMAIN, "https://example.com/plans")
            self.assertEqual((status, code), (raised.exception.status, raised.exception.code))


class SiteSearchRowsAndInspectionsTest(unittest.TestCase):
    def test_search_rows_send_only_given_filters(self) -> None:
        domains, transport = site_domains(200, PAGE_TOOLS["searchRows"])

        domains.list_search_rows(DOMAIN)
        domains.list_search_rows(DOMAIN, "country", provider="google", days=7, offset=0, limit=50)

        self.assertEqual(
            [
                f"{BASE}/{DOMAIN}/search/rows",
                f"{BASE}/{DOMAIN}/search/rows?dimension=country&provider=google&days=7&offset=0&limit=50",
            ],
            [call[1] for call in transport.calls],
        )

    def test_decodes_search_rows_with_unavailable_providers(self) -> None:
        domains, _ = site_domains(200, PAGE_TOOLS["searchRows"])
        rows = domains.list_search_rows(DOMAIN, "country")
        self.assertNotIn("provider", rows)
        self.assertEqual(6.5, rows["rows"][0]["totals"]["position"])
        self.assertEqual("bing", rows["unavailable"][0]["provider"])

        domains, _ = site_domains(200, PAGE_TOOLS["searchRowsNoPosition"])
        page = domains.list_search_rows(DOMAIN, provider="bing", offset=100, limit=50)
        self.assertEqual((101, 100, "bing"), (page["total"], page["offset"], page["provider"]))
        self.assertNotIn("position", page["rows"][0]["totals"])
        self.assertEqual(0, page["rows"][0]["totals"]["ctr"])
        self.assertEqual([], page["unavailable"])

    def test_inspections_send_their_routes_and_decode(self) -> None:
        domains, transport = site_domains(202, PAGE_TOOLS["searchInspectionQueued"])
        queued = domains.request_search_inspection(DOMAIN, "https://example.com/plans", company_slug="acme")
        self.assertNotIn("inspectedAt", queued)

        domains, list_transport = site_domains(200, PAGE_TOOLS["searchInspectionList"])
        listed = domains.list_search_inspections(DOMAIN)

        self.assertEqual(
            ("POST", f"{BASE}/{DOMAIN}/search/inspections?companySlug=acme", PAGE_TOOLS["searchInspectionRequest"]),
            transport.calls[0],
        )
        self.assertEqual(("GET", f"{BASE}/{DOMAIN}/search/inspections", None), list_transport.calls[0])
        self.assertEqual((200, 3), (listed["dailyLimit"], listed["usedToday"]))
        done, unknown, failed = listed["inspections"]
        self.assertEqual("PASS", done["verdict"])
        self.assertEqual("2026-11-15T03:00:00Z", done["lastCrawlAt"])
        self.assertNotIn("mobileUsabilityVerdict", done)
        self.assertNotIn("lastCrawlAt", unknown)
        self.assertEqual("Google answered HTTP 403", failed["failure"])

    def test_inspection_problem_codes_reach_the_caller(self) -> None:
        cases = [
            (400, "searchInspectionUrlInvalidProblem", SITE_SEARCH_INSPECTION_URL_INVALID_CODE),
            (409, "searchInspectionNotConnectedProblem", SITE_SEARCH_INSPECTION_NOT_CONNECTED_CODE),
            (429, "searchInspectionLimitProblem", SITE_SEARCH_INSPECTION_LIMIT_CODE),
        ]
        for status, fixture, code in cases:
            domains, _ = site_domains(status, PAGE_TOOLS[fixture])
            with self.assertRaises(RequestError) as raised:
                domains.request_search_inspection(DOMAIN, "https://example.com/plans")
            self.assertEqual((status, code), (raised.exception.status, raised.exception.code))


class SiteProjectContextTest(unittest.TestCase):
    def test_project_context_sends_every_list(self) -> None:
        domains, transport = site_domains(200, PAGE_TOOLS["projectContext"])

        domains.get_project_context()
        domains.get_project_context(SITE, company_slug="acme")
        updated = domains.set_project_context(PAGE_TOOLS["projectContextRequest"], SITE)
        domains.set_project_context({"brandNames": [], "competitorDomains": [], "markets": []})

        self.assertEqual(
            [
                ("GET", f"{BASE}/project-context", None),
                ("GET", f"{BASE}/project-context?siteUuid={SITE}&companySlug=acme", None),
                ("PUT", f"{BASE}/project-context?siteUuid={SITE}", PAGE_TOOLS["projectContextRequest"]),
                ("PUT", f"{BASE}/project-context", {"brandNames": [], "competitorDomains": [], "markets": []}),
            ],
            transport.calls,
        )
        self.assertEqual([{"country": "ZA", "language": "en"}], updated["markets"])
        self.assertEqual("2026-11-17T08:00:00Z", updated["updatedAt"])

        domains, _ = site_domains(200, PAGE_TOOLS["projectContextEmpty"])
        empty = domains.get_project_context()
        self.assertEqual([], empty["brandNames"])
        self.assertNotIn("updatedAt", empty)


class SiteReportingTest(unittest.TestCase):
    def test_reporting_reads_send_their_routes(self) -> None:
        domains, transport = site_domains(200, REPORTING["created"])

        domains.get_report(DOMAIN)
        domains.get_uptime_history(DOMAIN)
        domains.get_uptime_history(DOMAIN, 7)
        domains.get_lighthouse_history(DOMAIN)
        domains.get_lighthouse_history(DOMAIN, 30, company_slug="acme")
        domains.list_report_shares(DOMAIN)
        domains.create_report_share(DOMAIN)
        domains.create_report_share(DOMAIN, 7)

        self.assertEqual(
            [
                ("GET", f"{BASE}/{DOMAIN}/report", None),
                ("GET", f"{BASE}/{DOMAIN}/uptime-history", None),
                ("GET", f"{BASE}/{DOMAIN}/uptime-history?responseDays=7", None),
                ("GET", f"{BASE}/{DOMAIN}/lighthouse", None),
                ("GET", f"{BASE}/{DOMAIN}/lighthouse?days=30&companySlug=acme", None),
                ("GET", f"{BASE}/{DOMAIN}/report-shares", None),
                ("POST", f"{BASE}/{DOMAIN}/report-shares", {"expiresInDays": 30}),
                ("POST", f"{BASE}/{DOMAIN}/report-shares", {"expiresInDays": 7}),
            ],
            transport.calls,
        )

        domains, transport = site_domains(204, None)
        self.assertIsNone(domains.revoke_report_share(DOMAIN, "share-1"))
        self.assertEqual(("DELETE", f"{BASE}/{DOMAIN}/report-shares/share-1", None), transport.calls[0])

    def test_decodes_reports_with_unmeasured_values_absent(self) -> None:
        domains, _ = site_domains(200, REPORTING["report"])
        report = domains.get_report(DOMAIN)
        self.assertNotIn("upPercent", report["uptime"]["windows"]["last24h"])
        self.assertEqual(90, report["uptime"]["windows"]["last7d"]["upPercent"])
        self.assertNotIn("accessibility", report["speed"][0]["scores"])
        self.assertEqual(8.5, report["search"]["topQueries"][0]["totals"]["position"])
        self.assertNotIn("position", report["search"]["sources"][0]["previous"])
        self.assertEqual("No title", report["audit"]["findings"][0]["title"])

        domains, _ = site_domains(200, REPORTING["uptime"])
        uptime = domains.get_uptime_history(DOMAIN, 7)
        self.assertEqual(7, uptime["responseDays"])
        self.assertNotIn("avgMs", uptime["hours"][0])

        domains, _ = site_domains(200, REPORTING["lighthouse"])
        desktop, mobile = domains.get_lighthouse_history(DOMAIN)["runs"]
        self.assertEqual(83, desktop["scores"]["performance"])
        self.assertEqual(({}, {}, "timeout"), (mobile["scores"], mobile["metrics"], mobile["failure"]))

        domains, _ = site_domains(200, REPORTING["shares"])
        self.assertEqual("share-1", domains.list_report_shares(DOMAIN)["shares"][0]["shareUuid"])
        domains, _ = site_domains(200, REPORTING["created"])
        self.assertEqual("test-only-share-token", domains.create_report_share(DOMAIN)["token"])


class SiteIndexNowTest(unittest.TestCase):
    def test_indexnow_sends_its_routes_and_bodies(self) -> None:
        domains, transport = site_domains(200, INDEXNOW["verified"])

        domains.get_indexnow(DOMAIN, company_slug="acme")
        domains.enable_indexnow(DOMAIN)
        domains.verify_indexnow(DOMAIN)
        domains.submit_indexnow(DOMAIN, tuple(INDEXNOW["submissionRequest"]["urls"]))

        self.assertEqual(
            [
                ("GET", f"{BASE}/{DOMAIN}/indexnow?companySlug=acme", None),
                ("PUT", f"{BASE}/{DOMAIN}/indexnow", None),
                ("POST", f"{BASE}/{DOMAIN}/indexnow/verify", None),
                ("POST", f"{BASE}/{DOMAIN}/indexnow/submissions", INDEXNOW["submissionRequest"]),
            ],
            transport.calls,
        )

        domains, transport = site_domains(204, None)
        self.assertIsNone(domains.disable_indexnow(DOMAIN))
        self.assertEqual(("DELETE", f"{BASE}/{DOMAIN}/indexnow", None), transport.calls[0])

    def test_decodes_indexnow_states_with_absent_fields(self) -> None:
        domains, _ = site_domains(200, INDEXNOW["disabled"])
        disabled = domains.get_indexnow(DOMAIN)
        self.assertFalse(disabled["enabled"])
        for absent in ("key", "keyLocation", "verifiedAt", "lastCheckFailure"):
            self.assertNotIn(absent, disabled)
        self.assertEqual((1000, 0, []), (disabled["dailyUrlLimit"], disabled["urlsToday"], disabled["submissions"]))

        domains, _ = site_domains(200, INDEXNOW["enabledUnverified"])
        unverified = domains.verify_indexnow(DOMAIN)
        self.assertFalse(unverified["verified"])
        self.assertEqual("the key file answered HTTP 404", unverified["lastCheckFailure"])
        self.assertTrue(unverified["keyLocation"].endswith(unverified["key"] + ".txt"))

        domains, _ = site_domains(200, INDEXNOW["verified"])
        verified = domains.get_indexnow(DOMAIN)
        self.assertEqual("2026-11-17T07:00:00Z", verified["verifiedAt"])
        queued, accepted, failed = verified["submissions"]
        self.assertEqual(SITE_INDEXNOW_QUEUED, queued["status"])
        self.assertNotIn("providerStatus", queued)
        self.assertNotIn("submittedAt", queued)
        self.assertEqual((SITE_INDEXNOW_ACCEPTED, 202), (accepted["status"], accepted["providerStatus"]))
        self.assertEqual(SITE_INDEXNOW_FAILED, failed["status"])
        self.assertNotIn("providerStatus", failed)

        domains, _ = site_domains(202, INDEXNOW["submissionQueued"])
        submission = domains.submit_indexnow(DOMAIN, ["https://example.com/plans"])
        self.assertEqual(2, len(submission["urls"]))
        self.assertNotIn("failure", submission)

    def test_indexnow_problem_codes_reach_the_caller(self) -> None:
        cases = [
            (409, "domainUnverifiedProblem", SITE_INDEXNOW_DOMAIN_UNVERIFIED_CODE),
            (409, "notEnabledProblem", SITE_INDEXNOW_NOT_ENABLED_CODE),
            (409, "keyUnverifiedProblem", SITE_INDEXNOW_KEY_UNVERIFIED_CODE),
            (400, "urlsInvalidProblem", SITE_INDEXNOW_URLS_INVALID_CODE),
            (429, "limitProblem", SITE_INDEXNOW_LIMIT_CODE),
        ]
        for status, fixture, code in cases:
            domains, _ = site_domains(status, INDEXNOW[fixture])
            with self.assertRaises(RequestError) as raised:
                domains.submit_indexnow(DOMAIN, ["https://example.com/"])
            self.assertEqual((status, code), (raised.exception.status, raised.exception.code))


class SiteRuleIdsTest(unittest.TestCase):
    def test_rule_ids_are_unique_and_cover_check_rules(self) -> None:
        self.assertEqual(76, len(SITE_RULE_IDS))
        self.assertEqual(len(SITE_RULE_IDS), len(set(SITE_RULE_IDS)))
        self.assertIn("tls.expiring-soon", SITE_RULE_IDS)
        self.assertIn("lighthouse.mobile-score-drop", SITE_RULE_IDS)


if __name__ == "__main__":
    unittest.main()
