"""Calls that carry their own authority: monitor write tokens and the AI settings owner session."""

import http.server
import json
import pathlib
import sys
import threading
import unittest
from typing import Any
from unittest import mock

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "src"))

from custd import (
    SITE_AI_OWNER_BINDING_HEADER,
    SiteAIOwnerClient,
    redeem_site_ai_owner_handoff,
    submit_site_heartbeat,
)

BASE_URL = "https://api.custd.example"
U = "11111111-1111-4111-8111-111111111111"
DESTINATION: Any = {
    "base_url": BASE_URL,
    "report_path": f"/api/v1/site-heartbeat-reports/acme/{U}",
    "write_token": "w" * 64,
}
REPORT: Any = {"scheduledFor": "2026-11-01T02:00:00Z", "outcome": "succeeded"}


class Response:
    def __init__(self, status: int, body: object) -> None:
        self.status = status
        self.headers: dict[str, str] = {}
        self.body = json.dumps(body).encode("utf-8")

    def read(self, *_: object) -> bytes:
        return self.body

    def __enter__(self) -> "Response":
        return self

    def __exit__(self, *_: object) -> bool:
        return False


class Opener:
    def __init__(self, response: Response) -> None:
        self.response = response
        self.requests: list[Any] = []

    def __call__(self, request: Any, timeout: float | None = None) -> Response:
        self.requests.append(request)
        return self.response


class QueueTransport:
    def __init__(self, *results: dict[str, Any]) -> None:
        self.results = list(results)
        self.calls: list[tuple[str, str, Any, dict[str, str]]] = []

    def __call__(self, method: str, url: str, payload: Any, headers: dict[str, str], timeout: float) -> Any:
        self.calls.append((method, url, payload, headers))
        return self.results.pop(0)


class SiteMonitorReportTest(unittest.TestCase):
    def send(self, receipt: object) -> Opener:
        opener = Opener(Response(200, receipt))
        with mock.patch("custd.client._NO_REDIRECT_OPENER.open", opener):
            submit_site_heartbeat(DESTINATION, REPORT)
        return opener

    def test_heartbeat_sends_only_the_write_token_and_checks_the_receipt(self) -> None:
        same_instant = {**REPORT, "scheduledFor": "2026-11-01T02:00:00+00:00"}
        opener = self.send({"receivedAt": "2026-11-01T02:00:05Z", "report": same_instant})
        request = opener.requests[0]
        self.assertEqual(BASE_URL + DESTINATION["report_path"], request.full_url)
        self.assertEqual("Bearer " + "w" * 64, request.get_header("Authorization"))
        with self.assertRaisesRegex(ValueError, "does not match"):
            self.send({"receivedAt": "2026-11-01T02:00:05Z", "report": {**REPORT, "outcome": "failed"}})

    def test_destination_is_refused_before_sending(self) -> None:
        bad = [
            {**DESTINATION, "write_token": "short"},
            {**DESTINATION, "report_path": f"/api/v1/site-private-uptime-reports/acme/{U}"},
            {**DESTINATION, "report_path": "/api/v1/site-heartbeat-reports/acme/.."},
            {**DESTINATION, "base_url": BASE_URL + "/proxy"},
            {**DESTINATION, "base_url": "http://api.custd.example"},
        ]
        for destination in bad:
            with self.subTest(destination), self.assertRaises(ValueError):
                submit_site_heartbeat(destination, REPORT)


class SiteAIOwnerSessionTest(unittest.TestCase):
    def test_redeem_posts_the_code_as_a_form_and_keeps_the_session_cookie(self) -> None:
        cookie = "__Host-custd-site-ai-owner=" + "s" * 26 + "; Path=/; Secure; HttpOnly; SameSite=Strict"
        transport = QueueTransport({"status": 303, "body": "", "headers": {"Set-Cookie": cookie}})
        handoff: Any = {"code": "c" * 26, "redeemUrl": BASE_URL + "/api/v1/site-ai-owner/redeem"}

        session = redeem_site_ai_owner_handoff(handoff, "https://hub.example", transport=transport)

        self.assertEqual({"origin": BASE_URL, "cookie": "s" * 26}, session)
        method, url, payload, headers = transport.calls[0]
        self.assertEqual(("POST", handoff["redeemUrl"], b"code=" + b"c" * 26), (method, url, payload))
        self.assertEqual("https://hub.example", headers["Origin"])
        self.assertEqual("application/x-www-form-urlencoded", headers["Content-Type"])
        self.assertNotIn("Authorization", headers)

    def test_redeem_reads_the_redirect_instead_of_following_it(self) -> None:
        paths: list[str] = []

        class Redirecting(http.server.BaseHTTPRequestHandler):
            def do_POST(self) -> None:
                paths.append(self.path)
                self.rfile.read(int(self.headers["Content-Length"]))
                self.send_response(303)
                self.send_header("Location", "/site-ai-owner")
                self.send_header("Set-Cookie", "__Host-custd-site-ai-owner=" + "s" * 26 + "; Path=/; Secure; HttpOnly")
                self.send_header("Content-Length", "0")
                self.end_headers()

            def do_GET(self) -> None:
                paths.append(self.path)
                self.send_error(500)

            def log_message(self, *_: object) -> None:
                pass

        server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Redirecting)
        threading.Thread(target=server.serve_forever, daemon=True).start()
        self.addCleanup(server.server_close)
        self.addCleanup(server.shutdown)
        origin = f"http://127.0.0.1:{server.server_address[1]}"

        handoff: Any = {"code": "c" * 26, "redeemUrl": origin + "/api/v1/site-ai-owner/redeem"}
        session = redeem_site_ai_owner_handoff(handoff, "https://hub.example")

        self.assertEqual({"origin": origin, "cookie": "s" * 26}, session)
        self.assertEqual(["/api/v1/site-ai-owner/redeem"], paths)

    def test_owner_calls_present_the_cookie_and_writes_the_binding(self) -> None:
        settings = {"aiMode": "off", "monthlyCapUsdMicros": 0, "keyConfigured": False}
        transport = QueueTransport(
            {"status": 200, "body": json.dumps({"tenantSlug": "acme", "sessionBinding": "b", "settings": settings})},
            {"status": 200, "body": json.dumps(settings)},
        )
        owner = SiteAIOwnerClient({"origin": BASE_URL, "cookie": "s" * 26}, transport=transport)

        binding = owner.get_settings()["sessionBinding"]
        owner.set_consent(binding, {"action": "revoke"})

        (_, read_url, _, read), (_, write_url, _, write) = transport.calls
        self.assertEqual(BASE_URL + "/api/v1/site-ai-owner/settings", read_url)
        self.assertEqual(BASE_URL + "/api/v1/site-ai-owner/consent", write_url)
        self.assertEqual("__Host-custd-site-ai-owner=" + "s" * 26, read["Cookie"])
        self.assertNotIn("Origin", read)
        self.assertEqual((BASE_URL, "b"), (write["Origin"], write[SITE_AI_OWNER_BINDING_HEADER]))


if __name__ == "__main__":
    unittest.main()
