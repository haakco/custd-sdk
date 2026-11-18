"""Site Insights audit pages, saved reports, web data, links, access logs, rankings, the search pool,
campaign links and the draft tools.

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
    SITE_CAMPAIGN_LINK_LIMIT_CODE,
    SITE_CAMPAIGN_LINK_TAKEN_CODE,
    SITE_CAMPAIGN_LINKS_MAX,
    SITE_CRAWLER_IDENTITY_CLAIMS_TO_BE,
    SITE_GAP_COVERAGE_UNAVAILABLE,
    SITE_GENERATED_FORMAT_REDIRECT,
    SITE_INDEXABILITY_ERROR,
    SITE_INDEXABILITY_REDIRECTED,
    SITE_INVENTORY_PENDING,
    SITE_KEYWORD_DEMAND_AVAILABLE,
    SITE_KEYWORD_DEMAND_NO_MARKET,
    SITE_KEYWORD_DEMAND_SOURCE_BING,
    SITE_KEYWORD_LIST_LIMIT_CODE,
    SITE_KEYWORD_LIST_NOT_FOUND_CODE,
    SITE_LIGHTHOUSE_PAGE_NOT_EXTRA_CODE,
    SITE_LINK_SOURCE_COMMONCRAWL,
    SITE_LINK_SOURCE_STATUS_AVAILABLE,
    SITE_LINK_SOURCE_STATUS_FAILED,
    SITE_LINK_SOURCE_STATUS_PENDING,
    SITE_LINK_SOURCE_STATUS_UNAVAILABLE,
    SITE_PAGE_CHECK_SCOPE_CONTENT,
    SITE_PAGE_NOT_READ_CODE,
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
    SITE_SEARCH_IMPACT_INSUFFICIENT,
    SITE_SEARCH_IMPACT_MEASURED,
    SITE_SEARCH_IMPACT_OPEN,
    SITE_SEARCH_POOL_DEMAND_10K_100K,
    SITE_SEARCH_POOL_DEMAND_100_999,
    SITE_SEARCH_POOL_JOINED,
    SITE_SEARCH_POOL_NOT_JOINED,
    SITE_SEARCH_POOL_NOT_JOINED_CODE,
    SITE_SEARCH_POOL_QUERY_INVALID_CODE,
    SITE_SEARCH_POOL_SETTING_INVALID_CODE,
    SITE_SEARCH_POOL_SITE_BOUND_CODE,
    SITE_SEARCH_POOL_TERMS_VERSION,
    SITE_SEARCH_VALUE_GOALS_PARTIAL,
    SITE_SEARCH_VALUE_GOALS_UNAVAILABLE,
    SITE_TRACKED_KEYWORD_DUPLICATE_CODE,
    SITE_TRACKED_KEYWORD_INVALID_CODE,
    SITE_TRACKED_KEYWORD_LIMIT_CODE,
    SITE_TRACKED_KEYWORD_NOT_FOUND_CODE,
    SITE_TRAFFIC_DAY_MISSING,
    SITE_TRAFFIC_OTHER_KEY,
    SITE_TRANCO_UNRANKED,
    SITE_TREND_NO_ARTICLE,
    SITE_WEB_DOMAIN_ROLE_COMPETITOR,
    SITE_WEB_DOMAIN_ROLE_OWN,
    CustdClient,
    RequestError,
    SiteCampaignLinkRequest,
)

CONTRACT_FIXTURES = Path(__file__).resolve().parents[2] / "contract-fixtures"


def fixture(name: str) -> dict[str, Any]:
    return dict(json.loads((CONTRACT_FIXTURES / name).read_text()))


AUDIT = fixture("site-audit-pages.json")
SAVED = fixture("site-saved-reports.json")
REPORTING = fixture("site-insights-reporting.json")
REPORTING_346 = fixture("site-insights-reporting-3.46.json")
SEARCH_VALUE = fixture("site-search-value.json")
WEB = fixture("site-web-data.json")
LOGS = fixture("site-access-logs.json")
RANKINGS = fixture("site-rankings.json")
LINKS = fixture("site-links.json")
POOL = fixture("site-search-pool.json")
CAMPAIGNS = fixture("site-campaign-links.json")
TOOLS = fixture("site-page-tools.json")
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
            (POOL, "notJoinedProblem", SITE_SEARCH_POOL_NOT_JOINED_CODE),
            (POOL, "siteBoundProblem", SITE_SEARCH_POOL_SITE_BOUND_CODE),
            (POOL, "settingInvalidProblem", SITE_SEARCH_POOL_SETTING_INVALID_CODE),
            (POOL, "queryInvalidProblem", SITE_SEARCH_POOL_QUERY_INVALID_CODE),
            (CAMPAIGNS, "campaignLinkTakenProblem", SITE_CAMPAIGN_LINK_TAKEN_CODE),
            (CAMPAIGNS, "campaignLinkLimitProblem", SITE_CAMPAIGN_LINK_LIMIT_CODE),
            (TOOLS, "pageNotReadProblem", SITE_PAGE_NOT_READ_CODE),
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

    def test_decodes_a_3_46_server_without_template_or_lighthouse_pages(self) -> None:
        domains, _ = site_domains(200, REPORTING_346["report"])
        report = domains.get_report(DOMAIN)
        self.assertEqual("example.com", report["host"])
        self.assertIsNone(report.get("template"))

        domains, _ = site_domains(200, REPORTING_346["lighthouse"])
        history = domains.get_lighthouse_history(DOMAIN)
        self.assertEqual(2, len(history["runs"]))
        self.assertIsNone(history.get("url"))
        self.assertEqual([], history.get("pages", []))

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
        domains.get_referring_domains("example.com", SITE)
        domains.get_referring_domains("example.com")

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
                ("GET", f"{BASE}/referring-domains?domain=example.com&siteUuid={SITE}", None),
                ("GET", f"{BASE}/referring-domains?domain=example.com", None),
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
        self.assertNotIn("bingWeeklyImpressions", measured)
        self.assertNotIn("demand", clusters)

    def test_decodes_bing_keyword_demand_keeping_unread_numbers_absent(self) -> None:
        domains, _ = site_domains(200, WEB["keywordClustersWithDemand"])
        clusters = domains.get_keyword_clusters("Pricing")
        measured, unmeasured = clusters["clusters"]
        self.assertEqual(1400, measured.get("bingWeeklyImpressions"))
        self.assertNotIn("bingWeeklyImpressions", unmeasured)
        demand = clusters["demand"]
        self.assertEqual(
            (SITE_KEYWORD_DEMAND_AVAILABLE, SITE_KEYWORD_DEMAND_SOURCE_BING, "en-ZA"),
            (demand["state"], demand["source"], demand.get("market")),
        )
        exact, narrow, failed = demand["keywords"]
        self.assertEqual((1100, 3200), (exact.get("weeklyImpressions"), exact.get("broadImpressions")))
        self.assertIsNone(narrow.get("broadImpressions"))
        self.assertIsNone(failed.get("weeklyImpressions"))
        self.assertIn("503", failed.get("lastFailure", ""))

        domains, _ = site_domains(200, WEB["keywordClustersNoMarket"])
        no_market = domains.get_keyword_clusters("Pricing")["demand"]
        self.assertEqual((SITE_KEYWORD_DEMAND_NO_MARKET, []), (no_market["state"], no_market["keywords"]))
        self.assertNotIn("market", no_market)

        domains, _ = site_domains(200, WEB["keywordListWithRelated"])
        related = domains.save_keyword_list(WEB["keywordListRequest"])["related"]
        self.assertEqual(("2026-08-17", "2026-11-15"), (related["from"], related["to"]))
        first = related["keywords"][0]
        self.assertEqual((5400, 12000), (first["impressions"], first["broadImpressions"]))
        self.assertNotIn("related", WEB["keywordList"])


class ReferringDomainsTest(unittest.TestCase):
    def test_decodes_referring_domains_keeping_absent_none_and_real_zeros(self) -> None:
        domains, _ = site_domains(200, LINKS["referringDomains"])
        links = domains.get_referring_domains("example.com")
        self.assertEqual(SITE_WEB_DOMAIN_ROLE_OWN, links["role"])
        bing, commoncrawl, crawl = links["sources"]
        self.assertEqual((57, True), (bing.get("links"), bing["complete"]))
        self.assertEqual(SITE_LINK_SOURCE_COMMONCRAWL, commoncrawl["source"])
        self.assertEqual(1843, commoncrawl.get("referringDomains"))
        self.assertFalse(commoncrawl["complete"])
        self.assertIsNone(commoncrawl.get("links"))
        self.assertEqual(SITE_LINK_SOURCE_STATUS_AVAILABLE, crawl["status"])
        self.assertEqual(48210, links["authority"].get("harmonicRank"))
        news, blog, _forum = links["referringDomains"]
        self.assertIs(False, news.get("followed"))
        self.assertIsNone(blog.get("crawlLinks"))
        self.assertIsNone(blog.get("followed"))
        old, gone = links["lost"]["domains"]
        self.assertEqual(70000, old.get("harmonicRank"))
        self.assertIsNone(gone.get("harmonicRank"))

        domains, _ = site_domains(200, LINKS["referringDomainsPending"])
        pending = domains.get_referring_domains("rival.example")
        self.assertEqual(SITE_WEB_DOMAIN_ROLE_COMPETITOR, pending["role"])
        self.assertEqual(
            [SITE_LINK_SOURCE_STATUS_UNAVAILABLE, SITE_LINK_SOURCE_STATUS_PENDING, SITE_LINK_SOURCE_STATUS_UNAVAILABLE],
            [source["status"] for source in pending["sources"]],
        )
        for source in pending["sources"]:
            self.assertIsNone(source.get("referringDomains"))
            self.assertIsNone(source.get("links"))
        self.assertIsNone(pending.get("authority"))
        self.assertEqual([], pending["referringDomains"])
        self.assertEqual((SITE_LINK_SOURCE_STATUS_PENDING, []), (pending["lost"]["status"], pending["lost"]["domains"]))

        domains, _ = site_domains(200, LINKS["referringDomainsOutsideGraph"])
        outside = domains.get_referring_domains("shop.example.dev")
        failed, unavailable, crawled = outside["sources"]
        self.assertEqual(SITE_LINK_SOURCE_STATUS_FAILED, failed["status"])
        self.assertEqual("bing GetLinkCounts: 401 Unauthorized", failed.get("lastFailure"))
        self.assertIsNone(failed.get("referringDomains"))
        self.assertEqual("cc-main-2026-aug-sep-oct", unavailable.get("asOf"))
        self.assertEqual((0, 0), (crawled.get("referringDomains"), crawled.get("links")))
        authority = outside["authority"]
        self.assertIs(False, authority["inGraph"])
        for absent in ("harmonicRank", "harmonicCentrality", "pageRankRank", "pageRank", "hosts"):
            self.assertIsNone(authority.get(absent))
        self.assertEqual(SITE_LINK_SOURCE_STATUS_UNAVAILABLE, outside["lost"]["status"])


class SearchPoolTest(unittest.TestCase):
    def test_search_pool_sends_its_routes_and_bodies(self) -> None:
        domains, transport = site_domains(200, POOL["settingJoined"])

        domains.get_search_pool()
        domains.set_search_pool(True, SITE_SEARCH_POOL_TERMS_VERSION)
        domains.set_search_pool(False, SITE_SEARCH_POOL_TERMS_VERSION, company_slug="acme")
        domains.list_search_pool_queries()
        domains.list_search_pool_queries("pricing", 10)

        pool = f"{BASE}/search-pool"
        self.assertEqual(
            [
                ("GET", pool, None),
                ("PUT", pool, POOL["joinRequest"]),
                ("PUT", f"{pool}?companySlug=acme", POOL["leaveRequest"]),
                ("GET", f"{pool}/queries", None),
                ("GET", f"{pool}/queries?limit=10&search=pricing", None),
            ],
            transport.calls,
        )

    def test_joining_without_a_terms_version_is_refused_before_any_request(self) -> None:
        domains, transport = site_domains(200, POOL["settingJoined"])
        for missing in (None, "", "  "):
            with self.subTest(missing), self.assertRaises(ValueError):
                domains.set_search_pool(True, missing)
        self.assertEqual([], transport.calls)

        problem = POOL["termsNotAcceptedProblem"]
        domains, _ = site_domains(problem["status"], problem)
        with self.assertRaises(RequestError) as raised:
            domains.set_search_pool(True, "2020-01-01")
        self.assertEqual((400, None), (raised.exception.status, raised.exception.code))

    def test_decodes_pool_settings_and_queries_keeping_real_zeros(self) -> None:
        domains, _ = site_domains(200, POOL["settingNotJoined"])
        not_joined = domains.get_search_pool()
        self.assertIs(False, not_joined["joined"])
        self.assertIsNone(not_joined.get("joinedAt"))
        self.assertIsNone(not_joined.get("acceptedTermsVersion"))
        self.assertEqual(SITE_SEARCH_POOL_TERMS_VERSION, not_joined.get("termsVersion"))
        rules = (not_joined["minContributors"], not_joined["minImpressions"], not_joined["windowDays"])
        self.assertEqual((5, 100, 28), rules)
        domains, _ = site_domains(200, POOL["settingJoined"])
        joined = domains.set_search_pool(True, not_joined["termsVersion"])
        self.assertEqual("2026-11-18T09:00:00Z", joined.get("joinedAt"))
        self.assertEqual(SITE_SEARCH_POOL_TERMS_VERSION, joined.get("acceptedTermsVersion"))

        domains, _ = site_domains(200, POOL["queries"])
        page = domains.list_search_pool_queries()
        self.assertEqual(("2026-10-18", "2026-11-14"), (page.get("from"), page.get("to")))
        pricing, free = page["queries"]
        self.assertEqual(("pricing tool", SITE_SEARCH_POOL_DEMAND_10K_100K), (pricing["query"], pricing["demandBand"]))
        self.assertEqual(SITE_SEARCH_POOL_DEMAND_100_999, free["demandBand"])
        self.assertEqual({"top3": 0, "top10": 0, "top20": 25, "beyond20": 75}, free["positions"])

        domains, _ = site_domains(200, POOL["queriesBeforeRollup"])
        before = domains.list_search_pool_queries()
        self.assertEqual([], before["queries"])
        for absent in ("from", "to", "computedAt"):
            self.assertIsNone(before.get(absent))

        problem = POOL["notJoinedProblem"]
        domains, _ = site_domains(problem["status"], problem)
        with self.assertRaises(RequestError) as raised:
            domains.list_search_pool_queries("pricing")
        self.assertEqual((403, SITE_SEARCH_POOL_NOT_JOINED_CODE), (raised.exception.status, raised.exception.code))


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
        domains.update_tracked_keyword(DOMAIN, keyword_uuid, paused=True)

        self.assertEqual(
            [
                ("GET", f"{D}/rankings", None),
                ("GET", f"{D}/rankings?days=28&companySlug=acme", None),
                ("POST", f"{D}/rankings/keywords", RANKINGS["trackKeywordRequest"]),
                ("POST", f"{D}/rankings/keywords", {"keyword": "seo audit", "notifyPosition": 20}),
                ("PUT", f"{D}/rankings/keywords/{keyword_uuid}", RANKINGS["updateTrackedKeywordRequest"]),
                ("PUT", f"{D}/rankings/keywords/{keyword_uuid}", RANKINGS["updateTrackedKeywordPauseRequest"]),
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
        self.assertEqual(SITE_SEARCH_POOL_JOINED, domains.get_rankings(DOMAIN).get("pool"))
        self.assertEqual(SITE_SEARCH_POOL_DEMAND_10K_100K, tracked["pool"]["demandBand"])
        self.assertEqual({"top3": 35, "top10": 40, "top20": 15, "beyond20": 10}, tracked["pool"]["positions"])
        self.assertIsNone(paused.get("pool"))

        domains, _ = site_domains(200, RANKINGS["rankingsNotConnected"])
        not_connected = domains.get_rankings(DOMAIN)
        self.assertEqual(SITE_RANKINGS_SOURCE_NOT_CONNECTED, not_connected["source"])
        self.assertEqual(SITE_SEARCH_POOL_NOT_JOINED, not_connected.get("pool"))
        domains, _ = site_domains(200, RANKINGS["rankingsFailing"])
        failing = domains.get_rankings(DOMAIN)
        self.assertEqual(SITE_RANKINGS_SOURCE_FAILING, failing["source"])
        self.assertEqual(SITE_SEARCH_POOL_NOT_JOINED, failing.get("pool"))
        self.assertEqual("Search Console refused the token", failing["sourceFailure"])

        domains, _ = site_domains(201, RANKINGS["trackedKeyword"])
        created = domains.track_keyword(DOMAIN, RANKINGS["trackKeywordRequest"])
        self.assertEqual(("pricing tool", 10), (created["keyword"], created["notifyPosition"]))
        self.assertNotIn("position", created["latest"])

    def test_decodes_rankings_from_a_server_before_the_search_pool(self) -> None:
        domains, _ = site_domains(200, RANKINGS["rankingsBeforePool"])
        rankings = domains.get_rankings(DOMAIN)
        self.assertIsNone(rankings.get("pool"))
        self.assertEqual(2, len(rankings["keywords"]))
        for keyword in rankings["keywords"]:
            self.assertIsNone(keyword.get("pool"))


class SearchValueTest(unittest.TestCase):
    def test_search_value_reads_send_their_routes(self) -> None:
        domains, transport = site_domains(200, SEARCH_VALUE["searchValue"])

        domains.get_finding_search_impact(DOMAIN, "f-fixed")
        domains.get_finding_search_impact(DOMAIN, "f-fixed", 14, company_slug="acme")
        domains.get_search_value(DOMAIN, ["signup", "purchase"])
        domains.get_search_value(DOMAIN, ("signup",), 7)

        self.assertEqual(
            [
                ("GET", f"{D}/findings/f-fixed/search-impact", None),
                ("GET", f"{D}/findings/f-fixed/search-impact?days=14&companySlug=acme", None),
                ("GET", f"{D}/search-value?goal=signup&goal=purchase", None),
                ("GET", f"{D}/search-value?goal=signup&days=7", None),
            ],
            transport.calls,
        )

    def test_decodes_search_impact_keeping_real_zeros(self) -> None:
        domains, _ = site_domains(200, SEARCH_VALUE["findingImpact"])
        impact = domains.get_finding_search_impact(DOMAIN, "f-fixed")
        self.assertEqual(SITE_SEARCH_IMPACT_MEASURED, impact["status"])
        self.assertEqual("2026-10-16", impact["after"]["from"])
        google, bing = impact["sources"]
        self.assertEqual((0, 2100), (google["after"]["clicks"], google["after"]["impressions"]))
        self.assertEqual(SITE_SEARCH_IMPACT_INSUFFICIENT, bing["after"]["status"])
        for absent in ("clicks", "impressions", "ctr"):
            self.assertNotIn(absent, bing["after"])

        domains, _ = site_domains(200, SEARCH_VALUE["findingImpactOpen"])
        still_open = domains.get_finding_search_impact(DOMAIN, "f-open")
        self.assertEqual((SITE_SEARCH_IMPACT_OPEN, []), (still_open["status"], still_open["sources"]))
        for absent in ("fixedAt", "before", "after"):
            self.assertNotIn(absent, still_open)

    def test_decodes_search_value_with_unread_goals_absent(self) -> None:
        domains, _ = site_domains(200, SEARCH_VALUE["searchValue"])
        value = domains.get_search_value(DOMAIN, ["signup", "purchase"])
        self.assertEqual(SITE_SEARCH_VALUE_GOALS_PARTIAL, value["goalStatus"])
        pricing, blog, old = value["pages"]
        self.assertEqual((9, 4.2), (pricing["goalConversions"], pricing["search"]["position"]))
        self.assertEqual(0, blog["goalConversions"])
        self.assertNotIn("landings", old)
        self.assertNotIn("goalConversions", old)
        self.assertNotIn("position", old["search"])

        domains, _ = site_domains(200, SEARCH_VALUE["searchValueUnavailable"])
        unavailable = domains.get_search_value(DOMAIN, ["signup"], 7)
        self.assertEqual(SITE_SEARCH_VALUE_GOALS_UNAVAILABLE, unavailable["goalStatus"])
        self.assertNotIn("goalConversions", unavailable["pages"][0])


class CampaignLinksTest(unittest.TestCase):
    def test_campaign_links_send_their_routes_and_bodies(self) -> None:
        domains, transport = site_domains(200, CAMPAIGNS["campaignLinkListWithArchived"])

        listed = domains.list_campaign_links(DOMAIN, True)
        domains.list_campaign_links(DOMAIN)
        domains.create_campaign_link(DOMAIN, CAMPAIGNS["campaignLinkRequest"])
        plain: SiteCampaignLinkRequest = {
            "url": "https://example.com/",
            "source": "google",
            "medium": "cpc",
            "campaign": "sale",
        }
        domains.create_campaign_link(DOMAIN, plain)
        domains.archive_campaign_link(DOMAIN, "link-2")

        links = f"{D}/campaign-links"
        self.assertEqual(
            [
                ("GET", f"{links}?archived=true", None),
                ("GET", links, None),
                ("POST", links, CAMPAIGNS["campaignLinkRequest"]),
                ("POST", links, plain),
                ("POST", f"{links}/link-2/archive", None),
            ],
            transport.calls,
        )
        self.assertEqual(SITE_CAMPAIGN_LINKS_MAX, listed["maxLinks"])
        self.assertNotIn("archivedAt", listed["links"][0])
        self.assertEqual("", listed["links"][1]["term"])
        self.assertIn("archivedAt", listed["links"][1])


class DraftToolsTest(unittest.TestCase):
    def test_check_page_sends_the_draft_tools_and_decodes_them(self) -> None:
        domains, transport = site_domains(200, TOOLS["pageCheckDraftTools"])
        request = TOOLS["pageCheckDraftToolsRequest"]

        check = domains.check_page(
            DOMAIN, request["url"], request["html"], previous_url=request["previousUrl"], phrase=request["phrase"]
        )

        self.assertEqual([("POST", f"{D}/page-check", request)], transport.calls)
        self.assertEqual("cafe-hosting-plans-for-small-teams", check["slug"])
        self.assertEqual(SITE_GENERATED_FORMAT_REDIRECT, check["redirect"]["format"])
        self.assertEqual(3.85, check["phrase"]["densityPercent"])
        self.assertEqual("https://example.com/img/team.jpg", check["page"]["shareImage"])
        self.assertIn("FAQPage", check["page"]["faqSchema"]["code"])
        self.assertNotIn("slug", TOOLS["pageCheck"])
        self.assertNotIn("shareImage", TOOLS["pageFacts"])

        no_words = {"phrase": "x", "count": 0, "wordCount": 0, "densityPercent": 0}
        wordless = dict(TOOLS["pageCheckDraftTools"], phrase=no_words)
        domains, transport = site_domains(200, wordless)
        self.assertNotIn("densityPercent", domains.check_page(DOMAIN, request["url"], "<p></p>", phrase="x")["phrase"])
        self.assertEqual({"url": request["url"], "html": "<p></p>", "phrase": "x"}, transport.calls[0][2])

    def test_content_scope_lists_the_rules_it_checked(self) -> None:
        domains, transport = site_domains(200, TOOLS["pageCheckContent"])
        request = TOOLS["pageCheckContentRequest"]

        check = domains.check_page(DOMAIN, request["url"], request["html"], scope=SITE_PAGE_CHECK_SCOPE_CONTENT)

        self.assertEqual([("POST", f"{D}/page-check", request)], transport.calls)
        self.assertEqual(SITE_PAGE_CHECK_SCOPE_CONTENT, check.get("scope"))
        failed = {finding["rule"] for finding in check["findings"]}
        passed = [rule for rule in check.get("checkedRules", []) if rule not in failed]
        self.assertEqual(["heading.order-skip", "image.not-lazy"], passed)
        self.assertNotIn("checkedRules", TOOLS["pageCheck"])

    def test_compare_wording_drops_the_share_of_texts_it_did_not_compare(self) -> None:
        domains, transport = site_domains(200, TOOLS["wordingCompare"])
        request = TOOLS["wordingCompareRequest"]

        compared = domains.compare_wording(DOMAIN, request["first"], request["second"])
        self.assertEqual([("POST", f"{D}/wording-compare", request)], transport.calls)
        self.assertEqual((True, 91, True), (compared["compared"], compared["sharedPercent"], compared["nearDuplicate"]))

        domains, _ = site_domains(200, TOOLS["wordingCompareNotCompared"])
        short = domains.compare_wording(DOMAIN, "a", "b")
        self.assertFalse(short["compared"])
        self.assertNotIn("sharedPercent", short)


if __name__ == "__main__":
    unittest.main()
