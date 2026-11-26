"""Credentials, conditional reads, photo bytes and nested null lists of the hosted-app clients.

The route conformance test proves method and path only; this proves what each call sends and
how its answer decodes, through the default urllib transport with urlopen patched.
"""

import io
import json
import pathlib
import sys
import unittest
import urllib.error
from email.message import Message
from typing import Any
from unittest import mock

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "src"))

from custd import RequestError
from custd.app_items import AppClient, read_app_discovery, unsubscribe_alert_email_by_token
from custd.app_profile import AppAccountEntryRequest, CurrentAppProfileClient
from custd.version import IDENTITY

BASE_URL = "https://api.example.com"
ORIGIN = "https://app.example.com"


class FakeResponse:
    status = 200

    def __init__(self, body: bytes, headers: dict[str, str]) -> None:
        self.body = body
        self.headers = headers

    def read(self, *_: object) -> bytes:
        return self.body

    def __enter__(self) -> "FakeResponse":
        return self

    def __exit__(self, *_: object) -> bool:
        return False


class Urlopen:
    """Answers every request with one body, or with 304 when ``not_modified``."""

    def __init__(self, body: object = None, headers: dict[str, str] | None = None, not_modified: bool = False) -> None:
        self.body = body if isinstance(body, bytes) else json.dumps(body or {}).encode("utf-8")
        self.headers = headers or {}
        self.not_modified = not_modified
        self.requests: list[Any] = []

    def __call__(self, request: Any, timeout: float | None = None) -> FakeResponse:
        self.requests.append(request)
        if self.not_modified:
            raise urllib.error.HTTPError(request.full_url, 304, "Not Modified", Message(), io.BytesIO(b""))
        return FakeResponse(self.body, self.headers)

    def headers_sent(self) -> dict[str, str]:
        return {key.lower(): value for key, value in self.requests[0].header_items()}


def patched(urlopen: Urlopen) -> Any:
    return mock.patch("custd.client.urllib.request.urlopen", urlopen)


class AppClientTest(unittest.TestCase):
    def test_link_call_sends_site_key_origin_link_and_user_tokens(self) -> None:
        urlopen = Urlopen({"item": {}})
        with patched(urlopen):
            AppClient(BASE_URL, "site_pk_1", ORIGIN, user_token="user-1").link("link-1").cancel()
        headers = urlopen.headers_sent()
        self.assertEqual("site_pk_1", headers["x-custd-site-key"])
        self.assertEqual(ORIGIN, headers["origin"])
        self.assertEqual("Bearer link-1", headers["authorization"])
        self.assertEqual("user-1", headers["x-custd-user-token"])

    def test_owned_item_names_the_item_and_sends_no_link(self) -> None:
        urlopen = Urlopen({"item": {}})
        with patched(urlopen):
            AppClient(BASE_URL, "site_pk_1", ORIGIN, user_token="user-1").owned_item("item-1").read()
        self.assertEqual(f"{BASE_URL}/api/v1/app/item?item=item-1", urlopen.requests[0].full_url)
        self.assertNotIn("authorization", urlopen.headers_sent())

    def test_unchanged_read_answers_not_modified(self) -> None:
        urlopen = Urlopen(not_modified=True)
        with patched(urlopen):
            read = AppClient(BASE_URL, "site_pk_1", ORIGIN).link("link-1").latest_forecast(etag='"e1"')
        self.assertEqual({"status": "not_modified", "etag": '"e1"'}, read)
        self.assertEqual('"e1"', urlopen.headers_sent()["if-none-match"])

    def test_nested_null_lists_decode_as_empty(self) -> None:
        body = {"item": {}, "links": None, "measurementRuns": {"runs": None}, "linkCollection": {"entries": None}}
        with patched(Urlopen(body)):
            read = AppClient(BASE_URL, "site_pk_1", ORIGIN).link("link-1").claim()
        self.assertEqual([], read["links"])
        self.assertEqual([], read["measurementRuns"]["runs"])
        self.assertEqual([], read["linkCollection"]["entries"])

    def test_public_routes_send_no_credential(self) -> None:
        urlopen = Urlopen({"capabilities": None, "allowedOrigins": None})
        with patched(urlopen):
            discovery = read_app_discovery(BASE_URL, "app.example.com")
            unsubscribe_alert_email_by_token(BASE_URL, "sealed")
        self.assertEqual([], discovery["capabilities"])
        for request in urlopen.requests:
            sent = {key.lower() for key, _ in request.header_items()}
            self.assertFalse(sent & {"authorization", "x-custd-site-key", "x-custd-user-token"})


class CurrentAppProfileClientTest(unittest.TestCase):
    def test_profile_sends_only_the_bearer_token(self) -> None:
        urlopen = Urlopen({"fields": None})
        with patched(urlopen):
            profile = CurrentAppProfileClient(BASE_URL, lambda: "app-token").read()
        self.assertEqual([], profile["fields"])
        headers = urlopen.headers_sent()
        self.assertEqual("Bearer app-token", headers["authorization"])
        self.assertNotIn("x-custd-site-key", headers)

    def test_photo_reads_back_as_bytes(self) -> None:
        png = b"\x89PNG\r\n\x1a\n\xff"
        with patched(Urlopen(png, {"Content-Type": "image/png"})):
            photo = CurrentAppProfileClient(BASE_URL, "app-token").read_photo()
        self.assertEqual({"contentType": "image/png", "data": png}, photo)


ISSUER = "https://auth.canvas.test"
ACTION = ISSUER + "/settings/entry"
TICKET = "A" * 43


class EntryTransport:
    def __init__(self, status: int = 200, body: object = None) -> None:
        self.status = status
        self.body = json.dumps({"actionUrl": ACTION, "ticket": TICKET} if body is None else body)
        self.requests: list[tuple[str, str, Any, dict[str, str]]] = []

    def __call__(self, method: str, url: str, payload: Any, headers: dict[str, str], timeout: float) -> Any:
        self.requests.append((method, url, payload, headers))
        return {"status": self.status, "body": self.body}


def _entry(transport: EntryTransport, return_path: str = "", origin: str = "https://canvas.test") -> Any:
    client = CurrentAppProfileClient(BASE_URL, "app-token", transport=transport)
    return client.create_account_entry(AppAccountEntryRequest(ISSUER + "/", origin, return_path))


class AppAccountEntryTest(unittest.TestCase):
    def test_entry_posts_to_the_issuer_with_the_app_token(self) -> None:
        for return_path, body in (
            ("", {"applicationOrigin": "https://canvas.test"}),
            ("/mine", {"applicationOrigin": "https://canvas.test", "returnPath": "/mine"}),
        ):
            transport = EntryTransport()
            entry = _entry(transport, return_path)
            self.assertEqual((ACTION, TICKET), (entry.action_url, entry.ticket))
            self.assertNotIn(TICKET, repr(entry))
            method, url, payload, headers = transport.requests[0]
            self.assertEqual(("POST", ACTION + "/ticket", body), (method, url, payload))
            self.assertEqual("Bearer app-token", headers["Authorization"])
            self.assertEqual(IDENTITY, headers["X-Custd-Sdk"])

    def test_entry_refuses_untrusted_input_and_answers(self) -> None:
        other_action = {"actionUrl": "https://other.test/settings/entry", "ticket": TICKET}
        cases: list[tuple[str, str, str, object, bool]] = [
            # name, origin, return path, answer, whether the request is sent
            ("origin with path", "https://canvas.test/app", "", None, False),
            ("origin with :443", "https://canvas.test:443", "", None, False),
            ("backslash host", "https://canvas.test\\evil", "", None, False),
            ("scheme-relative", ORIGIN, "//evil", None, False),
            ("fragment", ORIGIN, "/a#b", None, False),
            ("relative", ORIGIN, "mine", None, False),
            ("backslash", ORIGIN, "/\\x", None, False),
            ("513 bytes", ORIGIN, "/" + "a" * 512, None, False),
            ("other action", ORIGIN, "", other_action, True),
            ("short ticket", ORIGIN, "", {"actionUrl": ACTION, "ticket": "A" * 42}, True),
            ("non-canonical ticket", ORIGIN, "", {"actionUrl": ACTION, "ticket": "A" * 42 + "B"}, True),
        ]
        for name, origin, return_path, answer, sent in cases:
            transport = EntryTransport(body=answer)
            with self.subTest(name), self.assertRaises(ValueError) as refused:
                _entry(transport, return_path, origin)
            self.assertNotIn("A" * 42, str(refused.exception))
            self.assertEqual(sent, bool(transport.requests))

    def test_entry_error_carries_the_status_only(self) -> None:
        with self.assertRaises(RequestError) as refused:
            _entry(EntryTransport(403, {"detail": TICKET}))
        self.assertEqual(403, refused.exception.status)
        self.assertNotIn(TICKET, str(refused.exception))


if __name__ == "__main__":
    unittest.main()
