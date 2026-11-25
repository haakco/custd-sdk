"""The Site status-page admin calls, replayed from contract-fixtures/site-status-page.json."""

import json
import sys
import unittest
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from custd import CustdClient, site_status_page_public_url

FIXTURE = json.loads((Path(__file__).resolve().parents[2] / "contract-fixtures" / "site-status-page.json").read_text())
DOMAIN = "0198a3b2-0000-7000-8000-000000000001"
PAGE = f"http://localhost:8080/api/v1/site-domains/{DOMAIN}/status-page"


class ReplayTransport:
    def __init__(self, responses: list[tuple[int, Any]]) -> None:
        self.responses = responses
        self.calls: list[tuple[str, str, dict[str, Any] | None]] = []

    def __call__(
        self, method: str, url: str, payload: dict[str, Any] | None, headers: dict[str, str], timeout: float
    ) -> dict[str, Any]:
        self.calls.append((method, url, payload))
        status, body = self.responses[len(self.calls) - 1]
        return {"status": status, "body": "" if body is None else json.dumps(body)}


class SiteStatusPageTest(unittest.TestCase):
    def test_status_page_calls_send_their_routes_and_decode_the_fixture(self) -> None:
        transport = ReplayTransport(
            [
                (200, FIXTURE["statusPageSettingsEmpty"]),
                (200, FIXTURE["statusPageSettings"]),
                (200, FIXTURE["statusPagePreview"]),
                (200, FIXTURE["statusPagePublication"]),
                (204, None),
                (200, FIXTURE["statusPageUpdateHistory"]),
            ]
        )
        client = CustdClient(base_url="http://localhost:8080", token="token", admin_transport=transport)
        domains = client.admin.site_domains
        draft = FIXTURE["statusPageDraft"]

        empty = domains.get_status_page_settings(DOMAIN)
        settings = domains.get_status_page_settings(DOMAIN, company_slug="acme")
        page = domains.preview_status_page(DOMAIN, draft)
        publication = domains.publish_status_page(DOMAIN, draft)
        domains.unpublish_status_page(DOMAIN)
        history = domains.post_status_page_update(DOMAIN, FIXTURE["statusPageUpdateRequest"])

        self.assertEqual(
            [
                ("GET", PAGE, None),
                ("GET", f"{PAGE}?companySlug=acme", None),
                ("POST", f"{PAGE}/preview", draft),
                ("PUT", PAGE, draft),
                ("DELETE", PAGE, None),
                ("POST", f"{PAGE}/updates", FIXTURE["statusPageUpdateRequest"]),
            ],
            transport.calls,
        )
        self.assertNotIn("draft", empty)
        self.assertNotIn("publication", empty)
        self.assertEqual("Customer portal", settings["draft"]["components"][0]["label"])
        portal, billing = page["components"]
        self.assertEqual(("up", "2026-11-20T05:59:00Z"), (portal["status"], portal["lastCheckedAt"]))
        self.assertEqual("maintenance", billing["status"])
        self.assertNotIn("lastCheckedAt", billing)
        self.assertEqual("Service restored.", page["updates"][0]["message"])
        self.assertEqual("2026-11-20T06:00:00Z", publication["publishedAt"])
        self.assertEqual("2026-11-20T06:05:00Z", history["updates"][0]["publishedAt"])
        self.assertEqual(
            "https://custd.com/status-page#AZijsgAAcACAAAAAAAAAAQGYo7IAAHAAgAAAAAAAAAE",
            site_status_page_public_url(publication, "https://custd.com/"),
        )


if __name__ == "__main__":
    unittest.main()
