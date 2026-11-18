"""Site Insights next actions and the portfolio summary, against the shapes the server's Go types
encode (contract-fixtures/site-next-actions.json)."""

import copy
import json
import sys
import unittest
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from custd import (
    SITE_NEXT_ACTION_CERTIFICATE,
    SITE_NEXT_ACTION_FINDING,
    SITE_NEXT_ACTION_OUTAGE,
    SITE_NEXT_ACTION_PLACE_FINDING,
    SITE_NEXT_ACTION_PLACE_PAGE,
    SITE_NEXT_ACTION_RECONNECT_SEARCH,
    SITE_NEXT_ACTION_VERIFY,
    SITE_NEXT_ACTIONS_MAX,
    SITE_NOT_CHECKED_SEARCH,
    CustdClient,
)

RECORDED: dict[str, Any] = json.loads(
    (Path(__file__).resolve().parents[2] / "contract-fixtures" / "site-next-actions.json").read_text()
)
BASE = "http://localhost:8080/api/v1/site-domains"


class RecordingTransport:
    def __init__(self, *bodies: Any) -> None:
        self.bodies = list(bodies)
        self.calls: list[tuple[str, str]] = []

    def __call__(
        self, method: str, url: str, payload: dict[str, Any] | None, headers: dict[str, str], timeout: float
    ) -> dict[str, Any]:
        self.calls.append((method, url))
        return {"status": 200, "body": json.dumps(self.bodies.pop(0))}


def site_domains(*bodies: Any) -> tuple[Any, RecordingTransport]:
    transport = RecordingTransport(*bodies)
    client = CustdClient(base_url="http://localhost:8080", token="token", admin_transport=transport)
    return client.admin.site_domains, transport


class SiteNextActionsTest(unittest.TestCase):
    def test_reads_next_actions_and_the_portfolio(self) -> None:
        unknown = copy.deepcopy(RECORDED["nextActionsPending"])
        unknown["actions"][0]["kind"] = "suggestion-ready"
        domains, transport = site_domains(
            RECORDED["nextActions"], RECORDED["nextActionsFindings"], RECORDED["portfolioSummary"], unknown
        )

        nxt = domains.get_next_actions("d-1")
        self.assertEqual(
            [SITE_NEXT_ACTION_OUTAGE, SITE_NEXT_ACTION_CERTIFICATE, SITE_NEXT_ACTION_RECONNECT_SEARCH],
            [action["kind"] for action in nxt["actions"]],
        )
        self.assertEqual((6, SITE_NEXT_ACTIONS_MAX), (nxt["actionCount"], len(nxt["actions"])))
        self.assertEqual([SITE_NOT_CHECKED_SEARCH], nxt["notChecked"])
        self.assertNotIn("rule", nxt["actions"][0])

        findings = domains.get_next_actions("d-1")["actions"]
        first, second = findings[0], findings[1]
        self.assertEqual((2, SITE_NEXT_ACTION_PLACE_FINDING), (first["affectedCount"], first["target"]["place"]))
        self.assertEqual((True, SITE_NEXT_ACTION_PLACE_PAGE), (second["recheckable"], second["target"]["place"]))

        rows = domains.get_portfolio_summary(company_slug="acme")["domains"]
        self.assertEqual(
            [SITE_NEXT_ACTION_VERIFY, SITE_NEXT_ACTION_OUTAGE, SITE_NEXT_ACTION_FINDING, None],
            [row.get("firstAction", {}).get("kind") for row in rows],
        )
        self.assertEqual(4, rows[1]["openFindings"]["high"])

        self.assertEqual("suggestion-ready", domains.get_next_actions("d-1")["actions"][0]["kind"])
        self.assertEqual(
            [
                ("GET", f"{BASE}/d-1/next-actions"),
                ("GET", f"{BASE}/d-1/next-actions"),
                ("GET", f"{BASE}/portfolio-summary?companySlug=acme"),
                ("GET", f"{BASE}/d-1/next-actions"),
            ],
            transport.calls,
        )

    def test_report_carries_the_reads_first_three(self) -> None:
        domains, _ = site_domains(RECORDED["reportWithNextActions"])
        self.assertEqual(RECORDED["nextActions"]["actions"], domains.get_report("d-1").get("nextActions"))


if __name__ == "__main__":
    unittest.main()
