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
    SITE_RULE_IDS,
    SITE_RULE_TITLE_MISSING,
    SITE_RULE_UPTIME_DOWN,
    CustdClient,
    RequestError,
)

FIXTURES = json.loads(
    (Path(__file__).resolve().parents[2] / "contract-fixtures" / "site-insights.json").read_text()
)
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


class SiteRuleIdsTest(unittest.TestCase):
    def test_rule_ids_are_unique_and_cover_check_rules(self) -> None:
        self.assertEqual(63, len(SITE_RULE_IDS))
        self.assertEqual(len(SITE_RULE_IDS), len(set(SITE_RULE_IDS)))
        self.assertIn("tls.expiring-soon", SITE_RULE_IDS)
        self.assertIn("lighthouse.mobile-score-drop", SITE_RULE_IDS)


if __name__ == "__main__":
    unittest.main()
