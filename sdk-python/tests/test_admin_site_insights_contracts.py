"""Site Insights audit pages, saved reports, web data, access logs and rankings.

Each contract-fixtures file is the server's own Go types encoded by encoding/json, so omitted
(omitempty) fields are absent exactly as the server sends them.
"""

import json
import sys
import unittest
from datetime import UTC, datetime, timedelta, timezone
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from custd import (
    ACCESS_LOG_HOUR_INVALID_CODE,
    SAVED_SITE_REPORT_LIMIT_CODE,
    SAVED_SITE_REPORT_NAME_TAKEN_CODE,
    SITE_ACCESS_LOG_HOUR_FAILED,
    SITE_AUDIT_RUN_COMPLETE,
    SITE_AUDIT_RUN_FAILED,
    SITE_AUDIT_RUN_NOT_AUDITED,
    SITE_CRAWLER_IDENTITY_CLAIMS_TO_BE,
    SITE_GAP_COVERAGE_UNAVAILABLE,
    SITE_INDEXABILITY_ERROR,
    SITE_INDEXABILITY_REDIRECTED,
    SITE_INVENTORY_PENDING,
    SITE_KEYWORD_LIST_LIMIT_CODE,
    SITE_KEYWORD_LIST_NOT_FOUND_CODE,
    SITE_LIGHTHOUSE_PAGE_NOT_EXTRA_CODE,
    SITE_RANK_COUNTRY_ALL,
    SITE_RANK_STATE_NOT_RANKING,
    SITE_RANK_STATE_RANKING,
    SITE_RANKINGS_DAYS_INVALID_CODE,
    SITE_RANKINGS_SOURCE_FAILING,
    SITE_RANKINGS_SOURCE_NOT_CONNECTED,
    SITE_REFERRER_CLASS_SEARCH,
    SITE_REPORT_TEMPLATE_EXECUTIVE,
    SITE_REPORT_TEMPLATE_FULL,
    SITE_RULE_BROKEN_FRAGMENT,
    SITE_RULE_SITEMAP_BLOCKED_URL,
    SITE_TRACKED_KEYWORD_DUPLICATE_CODE,
    SITE_TRACKED_KEYWORD_INVALID_CODE,
    SITE_TRACKED_KEYWORD_LIMIT_CODE,
    SITE_TRACKED_KEYWORD_NOT_FOUND_CODE,
    SITE_TRAFFIC_DAY_MISSING,
    SITE_TRAFFIC_OTHER_KEY,
    SITE_TRANCO_UNRANKED,
    SITE_TREND_NO_ARTICLE,
    SITE_WEB_DOMAIN_ROLE_OWN,
    CustdClient,
    RequestError,
)

CONTRACT_FIXTURES = Path(__file__).resolve().parents[2] / "contract-fixtures"


def fixture(name: str) -> dict[str, Any]:
    return dict(json.loads((CONTRACT_FIXTURES / name).read_text()))


AUDIT = fixture("site-audit-pages.json")
SAVED = fixture("site-saved-reports.json")
REPORTING = fixture("site-insights-reporting.json")
WEB = fixture("site-web-data.json")
LOGS = fixture("site-access-logs.json")
RANKINGS = fixture("site-rankings.json")
API = "http://localhost:8080/api/v1"
BASE = API + "/site-domains"
DOMAIN = "domain-1"
D = f"{BASE}/{DOMAIN}"
SITE = "site-1"


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


class ProblemCodesTest(unittest.TestCase):
    def test_every_new_problem_reaches_the_caller_with_its_code(self) -> None:
        cases = [
            (AUDIT, "lighthousePageNotExtraProblem", SITE_LIGHTHOUSE_PAGE_NOT_EXTRA_CODE),
            (SAVED, "savedReportNameTakenProblem", SAVED_SITE_REPORT_NAME_TAKEN_CODE),
            (SAVED, "savedReportLimitProblem", SAVED_SITE_REPORT_LIMIT_CODE),
            (WEB, "keywordListNotFoundProblem", SITE_KEYWORD_LIST_NOT_FOUND_CODE),
            (WEB, "keywordListLimitProblem", SITE_KEYWORD_LIST_LIMIT_CODE),
            (LOGS, "accessLogHourInvalidProblem", ACCESS_LOG_HOUR_INVALID_CODE),
            (RANKINGS, "trackedKeywordInvalidProblem", SITE_TRACKED_KEYWORD_INVALID_CODE),
            (RANKINGS, "trackedKeywordLimitProblem", SITE_TRACKED_KEYWORD_LIMIT_CODE),
            (RANKINGS, "trackedKeywordDuplicateProblem", SITE_TRACKED_KEYWORD_DUPLICATE_CODE),
            (RANKINGS, "trackedKeywordNotFoundProblem", SITE_TRACKED_KEYWORD_NOT_FOUND_CODE),
            (RANKINGS, "rankingsDaysInvalidProblem", SITE_RANKINGS_DAYS_INVALID_CODE),
        ]
        for fixtures, key, code in cases:
            problem = fixtures[key]
            domains, _ = site_domains(problem["status"], problem)
            with self.subTest(key), self.assertRaises(RequestError) as raised:
                domains.get_rankings(DOMAIN)
            self.assertEqual((problem["status"], code), (raised.exception.status, raised.exception.code))


class AuditPagesTest(unittest.TestCase):
    def test_audit_and_lighthouse_reads_send_their_routes(self) -> None:
        domains, transport = site_domains(200, AUDIT["lighthousePages"])

        domains.list_audit_pages(DOMAIN)
        domains.list_audit_pages(DOMAIN, 50, 50, company_slug="acme")
        domains.get_audit_delta(DOMAIN)
        domains.get_lighthouse_history(DOMAIN, 7, "https://example.com/pricing")
        domains.get_lighthouse_pages(DOMAIN)
        domains.set_lighthouse_pages(DOMAIN, tuple(AUDIT["lighthousePagesRequest"]["urls"]))
        domains.set_lighthouse_pages(DOMAIN, [])

        self.assertEqual(
            [
                ("GET", f"{D}/audit-pages", None),
                ("GET", f"{D}/audit-pages?offset=50&limit=50&companySlug=acme", None),
                ("GET", f"{D}/audit-delta", None),
                ("GET", f"{D}/lighthouse?days=7&url=https%3A%2F%2Fexample.com%2Fpricing", None),
                ("GET", f"{D}/lighthouse/pages", None),
                ("PUT", f"{D}/lighthouse/pages", AUDIT["lighthousePagesRequest"]),
                ("PUT", f"{D}/lighthouse/pages", AUDIT["lighthousePagesClearRequest"]),
            ],
            transport.calls,
        )

    def test_decodes_audit_pages_keeping_present_zeros(self) -> None:
        domains, _ = site_domains(200, AUDIT["auditPages"])
        home, moved, orphan = domains.list_audit_pages(DOMAIN)["pages"]
        self.assertEqual(0, home["depth"])
        self.assertEqual("https://example.com/new", moved["finalUrl"])
        self.assertEqual(SITE_INDEXABILITY_REDIRECTED, moved["indexability"])
        self.assertEqual(0, orphan["inboundLinks"])
        self.assertNotIn("depth", orphan)

        domains, _ = site_domains(200, AUDIT["auditPagesTruncated"])
        truncated = domains.list_audit_pages(DOMAIN, 50)
        self.assertTrue(truncated["truncated"])
        broken = truncated["pages"][0]
        self.assertEqual((0, SITE_INDEXABILITY_ERROR), (broken["status"], broken["indexability"]))
        self.assertNotIn("inboundLinks", broken)

        domains, _ = site_domains(200, AUDIT["auditPagesNotAudited"])
        self.assertNotIn("auditedAt", domains.list_audit_pages(DOMAIN))

    def test_decodes_audit_deltas(self) -> None:
        domains, _ = site_domains(200, AUDIT["auditDelta"])
        delta = domains.get_audit_delta(DOMAIN)
        self.assertEqual(SITE_AUDIT_RUN_COMPLETE, delta["run"])
        self.assertEqual(SITE_RULE_BROKEN_FRAGMENT, delta["new"][0]["rule"])
        self.assertEqual(SITE_RULE_SITEMAP_BLOCKED_URL, delta["reopened"][0]["rule"])
        self.assertTrue(delta["fixed"][0]["history"]["fixed"])

        domains, _ = site_domains(200, AUDIT["auditDeltaFailed"])
        failed = domains.get_audit_delta(DOMAIN)
        self.assertEqual((SITE_AUDIT_RUN_FAILED, "the home page did not answer"), (failed["run"], failed["failure"]))

        domains, _ = site_domains(200, AUDIT["auditDeltaNotAudited"])
        never = domains.get_audit_delta(DOMAIN)
        self.assertEqual(SITE_AUDIT_RUN_NOT_AUDITED, never["run"])
        self.assertNotIn("auditedAt", never)

    def test_decodes_lighthouse_pages_and_page_history(self) -> None:
        domains, _ = site_domains(200, AUDIT["lighthousePageHistory"])
        history = domains.get_lighthouse_history(DOMAIN, url="https://example.com/pricing")
        self.assertEqual("https://example.com/pricing", history["url"])
        compared, first = history["pages"]
        self.assertEqual((95, False), (compared["previousScore"], compared["regressionOpen"]))
        self.assertNotIn("previousScore", first)
        self.assertTrue(first["regressionOpen"])

        domains, _ = site_domains(200, REPORTING["lighthouse"])
        self.assertEqual([], domains.get_lighthouse_history(DOMAIN)["pages"])

        domains, _ = site_domains(200, AUDIT["lighthousePagesEmpty"])
        pages = domains.get_lighthouse_pages(DOMAIN)
        self.assertEqual(([], 5), (pages["urls"], pages["maxPages"]))


class SavedReportsTest(unittest.TestCase):
    def test_saved_reports_send_their_routes_and_flat_bodies(self) -> None:
        domains, transport = site_domains(200, SAVED["savedReport"])
        report_uuid = SAVED["savedReport"]["reportUuid"]
        request = SAVED["savedReportRequest"]

        domains.get_report(DOMAIN, template=SITE_REPORT_TEMPLATE_EXECUTIVE, days=14)
        domains.list_saved_reports(DOMAIN)
        domains.save_report(DOMAIN, request)
        domains.save_report(DOMAIN, {"name": "Full audit"})
        domains.get_saved_report(DOMAIN, report_uuid)
        domains.replace_saved_report(DOMAIN, report_uuid, request, company_slug="acme")
        domains.create_report_share(DOMAIN, 14, report_uuid=report_uuid)

        self.assertEqual(
            [
                ("GET", f"{D}/report?template=executive&days=14", None),
                ("GET", f"{D}/saved-reports", None),
                ("POST", f"{D}/saved-reports", request),
                ("POST", f"{D}/saved-reports", {"name": "Full audit"}),
                ("GET", f"{D}/saved-reports/{report_uuid}", None),
                ("PUT", f"{D}/saved-reports/{report_uuid}?companySlug=acme", request),
                ("POST", f"{D}/report-shares", SAVED["reportShareRequest"]),
            ],
            transport.calls,
        )

        domains, transport = site_domains(204, None)
        self.assertIsNone(domains.delete_saved_report(DOMAIN, report_uuid))
        self.assertEqual(("DELETE", f"{D}/saved-reports/{report_uuid}", None), transport.calls[0])

    def test_decodes_saved_reports_templates_and_shares(self) -> None:
        domains, _ = site_domains(200, SAVED["executiveReport"])
        self.assertEqual(SITE_REPORT_TEMPLATE_EXECUTIVE, domains.get_report(DOMAIN)["template"])
        domains, _ = site_domains(200, REPORTING["report"])
        self.assertEqual(SITE_REPORT_TEMPLATE_FULL, domains.get_report(DOMAIN)["template"])

        domains, _ = site_domains(201, SAVED["savedReport"])
        saved = domains.save_report(DOMAIN, SAVED["savedReportRequest"])
        self.assertEqual(("November client summary", 1), (saved["name"], saved["liveShares"]))
        self.assertEqual("example.com", saved["report"]["host"])

        domains, _ = site_domains(200, SAVED["savedReportList"])
        listed = domains.list_saved_reports(DOMAIN)
        self.assertEqual((2, 20, 0), (len(listed["reports"]), listed["maxReports"], listed["reports"][1]["liveShares"]))
        domains, _ = site_domains(200, SAVED["savedReportListEmpty"])
        self.assertEqual([], domains.list_saved_reports(DOMAIN)["reports"])

        domains, _ = site_domains(200, SAVED["reportShares"])
        of_saved, of_live = domains.list_report_shares(DOMAIN)["shares"]
        self.assertEqual(SAVED["savedReport"]["reportUuid"], of_saved["reportUuid"])
        self.assertNotIn("reportUuid", of_live)
        domains, _ = site_domains(201, SAVED["reportShareCreated"])
        self.assertEqual("test-only-share-token", domains.create_report_share(DOMAIN)["token"])


class WebDataTest(unittest.TestCase):
    def test_web_data_sends_site_scoped_routes(self) -> None:
        domains, transport = site_domains(200, WEB["keywordList"])

        domains.get_web_domains()
        domains.get_web_domains(SITE)
        domains.list_web_pages("rival.example", SITE, after="https://rival.example/pricing", limit=2)
        domains.list_web_pages("rival.example")
        domains.get_topic_trends(SITE)
        domains.get_content_gap()
        domains.get_content_gap(SITE, "seo")
        domains.list_keyword_lists(SITE)
        domains.save_keyword_list(WEB["keywordListRequest"], SITE)
        domains.save_keyword_list({"name": "Brand", "keywords": []})
        domains.get_keyword_clusters("Pricing", SITE)

        self.assertEqual(
            [
                ("GET", f"{BASE}/web-domains", None),
                ("GET", f"{BASE}/web-domains?siteUuid={SITE}", None),
                (
                    "GET",
                    f"{BASE}/web-pages?siteUuid={SITE}&domain=rival.example"
                    "&after=https%3A%2F%2Frival.example%2Fpricing&limit=2",
                    None,
                ),
                ("GET", f"{BASE}/web-pages?domain=rival.example", None),
                ("GET", f"{BASE}/topic-trends?siteUuid={SITE}", None),
                ("GET", f"{BASE}/content-gap", None),
                ("GET", f"{BASE}/content-gap?siteUuid={SITE}&seed=seo", None),
                ("GET", f"{BASE}/keyword-lists?siteUuid={SITE}", None),
                ("PUT", f"{BASE}/keyword-lists?siteUuid={SITE}", WEB["keywordListRequest"]),
                ("PUT", f"{BASE}/keyword-lists", {"name": "Brand", "keywords": []}),
                ("GET", f"{BASE}/keyword-clusters?siteUuid={SITE}&name=Pricing", None),
            ],
            transport.calls,
        )

        domains, transport = site_domains(204, None)
        self.assertIsNone(domains.delete_keyword_list("Pricing", SITE))
        self.assertEqual(("DELETE", f"{BASE}/keyword-lists?siteUuid={SITE}&name=Pricing", None), transport.calls[0])

    def test_decodes_web_data_with_absent_measurements(self) -> None:
        domains, _ = site_domains(200, WEB["webDomains"])
        own, rival, new = domains.get_web_domains()["domains"]
        self.assertEqual((SITE_WEB_DOMAIN_ROLE_OWN, 8421), (own["role"], own["trancoRank"]))
        self.assertEqual(SITE_TRANCO_UNRANKED, rival["trancoBand"])
        self.assertNotIn("trancoRank", rival)
        self.assertEqual((SITE_INVENTORY_PENDING, 0), (new["sitemapStatus"], new["pageCount"]))
        self.assertNotIn("inventoryAt", new)

        domains, _ = site_domains(200, WEB["webPages"])
        self.assertEqual("https://rival.example/pricing", domains.list_web_pages("rival.example")["next"])
        domains, _ = site_domains(200, WEB["webPagesLast"])
        self.assertNotIn("next", domains.list_web_pages("rival.example"))

        domains, _ = site_domains(200, WEB["topicTrends"])
        found, missing, failed = domains.get_topic_trends()["trends"]
        self.assertEqual(0, found["months"][1]["views"])
        self.assertEqual(SITE_TREND_NO_ARTICLE, missing["status"])
        self.assertNotIn("checkedAt", failed)

        domains, _ = site_domains(200, WEB["contentGap"])
        self.assertEqual("seo checklist", domains.get_content_gap(seed="seo")["topics"][0]["label"])
        domains, _ = site_domains(200, WEB["contentGapUnavailable"])
        gap = domains.get_content_gap()
        self.assertEqual(SITE_GAP_COVERAGE_UNAVAILABLE, gap["ownCoverage"])
        self.assertNotIn("seed", gap)

        domains, _ = site_domains(200, WEB["keywordLists"])
        self.assertNotIn("seedTerm", domains.list_keyword_lists()["lists"][0])
        domains, _ = site_domains(200, WEB["keywordClusters"])
        clusters = domains.get_keyword_clusters("Pricing")
        measured, unmeasured = clusters["clusters"]
        self.assertEqual(6.5, measured["avgPosition"])
        self.assertEqual(0, unmeasured["measuredKeywords"])
        self.assertNotIn("clicks", unmeasured)


class AccessLogsTest(unittest.TestCase):
    def test_access_log_reads_and_replay_send_their_routes(self) -> None:
        domains, transport = site_domains(202, LOGS["accessLogHourReplay"])
        hour = LOGS["accessLogHourReplayRequest"]["hourStart"]

        domains.get_traffic(DOMAIN)
        domains.get_traffic(DOMAIN, "2026-11-15", "2026-11-16", company_slug="acme")
        domains.get_ai_visibility(DOMAIN, "2026-11-15", "2026-11-16")
        domains.replay_access_log_hour(hour)
        domains.replay_access_log_hour(datetime(2026, 11, 17, 10, tzinfo=UTC))
        domains.replay_access_log_hour(datetime(2026, 11, 17, 12, tzinfo=timezone(timedelta(hours=2))))

        request = LOGS["accessLogHourReplayRequest"]
        self.assertEqual(
            [
                ("GET", f"{D}/traffic", None),
                ("GET", f"{D}/traffic?from=2026-11-15&to=2026-11-16&companySlug=acme", None),
                ("GET", f"{D}/ai-visibility?from=2026-11-15&to=2026-11-16", None),
                ("POST", f"{API}/admin/access-log-hours/replay", request),
                ("POST", f"{API}/admin/access-log-hours/replay", request),
                ("POST", f"{API}/admin/access-log-hours/replay", request),
            ],
            transport.calls,
        )
        with self.assertRaises(ValueError):
            domains.replay_access_log_hour(datetime(2026, 11, 17, 10))

    def test_decodes_traffic_with_unread_days_absent(self) -> None:
        domains, _ = site_domains(200, LOGS["traffic"])
        traffic = domains.get_traffic(DOMAIN)
        self.assertEqual(("2026-11-15", 750), (traffic["from"], traffic["totals"]["p95Ms"]))
        unread, partial = traffic["days"]
        self.assertEqual(SITE_TRAFFIC_DAY_MISSING, unread["coverage"])
        self.assertNotIn("requests", unread)
        self.assertNotIn("notFound", unread)
        self.assertEqual(0, partial["notFound"])
        self.assertEqual(SITE_TRAFFIC_OTHER_KEY, traffic["notFoundPaths"][1]["key"])
        self.assertEqual(SITE_REFERRER_CLASS_SEARCH, traffic["referrers"][0]["class"])
        self.assertEqual(SITE_CRAWLER_IDENTITY_CLAIMS_TO_BE, traffic["crawlers"][1]["identity"])

        domains, _ = site_domains(200, LOGS["trafficEmpty"])
        self.assertNotIn("totals", domains.get_traffic(DOMAIN))

        domains, _ = site_domains(200, LOGS["aiVisibility"])
        visibility = domains.get_ai_visibility(DOMAIN)
        self.assertFalse(visibility["coverage"]["complete"])
        self.assertEqual("chatgpt.com", visibility["assistants"][0]["key"])
        self.assertEqual(25, visibility["pages"][0]["referralVisits"])

        domains, _ = site_domains(202, LOGS["accessLogHourReplay"])
        replay = domains.replay_access_log_hour("2026-11-17T10:00:00Z")
        self.assertEqual(SITE_ACCESS_LOG_HOUR_FAILED, replay["previousStatus"])


class RankingsTest(unittest.TestCase):
    def test_rank_tracking_sends_its_routes_and_bodies(self) -> None:
        domains, transport = site_domains(200, RANKINGS["updatedTrackedKeyword"])
        keyword_uuid = RANKINGS["updatedTrackedKeyword"]["keywordUuid"]

        domains.get_rankings(DOMAIN)
        domains.get_rankings(DOMAIN, 28, company_slug="acme")
        domains.track_keyword(DOMAIN, RANKINGS["trackKeywordRequest"])
        domains.track_keyword(DOMAIN, {"keyword": "seo audit", "notifyPosition": 20})
        domains.update_tracked_keyword(DOMAIN, keyword_uuid, paused=False, notify_position=5)

        self.assertEqual(
            [
                ("GET", f"{D}/rankings", None),
                ("GET", f"{D}/rankings?days=28&companySlug=acme", None),
                ("POST", f"{D}/rankings/keywords", RANKINGS["trackKeywordRequest"]),
                ("POST", f"{D}/rankings/keywords", {"keyword": "seo audit", "notifyPosition": 20}),
                ("PUT", f"{D}/rankings/keywords/{keyword_uuid}", RANKINGS["updateTrackedKeywordRequest"]),
            ],
            transport.calls,
        )

        domains, transport = site_domains(204, None)
        self.assertIsNone(domains.untrack_keyword(DOMAIN, keyword_uuid))
        self.assertEqual(("DELETE", f"{D}/rankings/keywords/{keyword_uuid}", None), transport.calls[0])

    def test_decodes_rankings_with_unranked_positions_absent(self) -> None:
        domains, _ = site_domains(200, RANKINGS["rankings"])
        tracked, paused = domains.get_rankings(DOMAIN)["keywords"]
        no_data, not_ranking, ranking = tracked["observations"]
        self.assertEqual((SITE_RANK_STATE_RANKING, 7.4), (ranking["state"], ranking["position"]))
        self.assertEqual(SITE_RANK_STATE_NOT_RANKING, not_ranking["state"])
        self.assertNotIn("position", not_ranking)
        self.assertNotIn("rankingUrl", no_data)
        self.assertEqual(SITE_RANK_COUNTRY_ALL, paused["country"])

        domains, _ = site_domains(200, RANKINGS["rankingsNotConnected"])
        self.assertEqual(SITE_RANKINGS_SOURCE_NOT_CONNECTED, domains.get_rankings(DOMAIN)["source"])
        domains, _ = site_domains(200, RANKINGS["rankingsFailing"])
        failing = domains.get_rankings(DOMAIN)
        self.assertEqual(SITE_RANKINGS_SOURCE_FAILING, failing["source"])
        self.assertEqual("Search Console refused the token", failing["sourceFailure"])

        domains, _ = site_domains(201, RANKINGS["trackedKeyword"])
        created = domains.track_keyword(DOMAIN, RANKINGS["trackKeywordRequest"])
        self.assertEqual(("pricing tool", 10), (created["keyword"], created["notifyPosition"]))
        self.assertNotIn("position", created["latest"])


if __name__ == "__main__":
    unittest.main()
