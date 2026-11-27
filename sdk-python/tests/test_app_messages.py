"""Bearer handling and the private message archive's JSON contract."""

import io
import json
import pathlib
import sys
import unittest
import urllib.error
from email.message import Message
from unittest import mock

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "src"))

from custd import AppMessageInput, AppMessagesClient, RequestError

ORIGIN = "https://api.example.test"
PATH = ORIGIN + "/api/v1/app/messages"


class AppMessagesClientTest(unittest.TestCase):
    def test_session_import_and_search_send_the_application_bearer_and_json(self) -> None:
        message: AppMessageInput = {
            "externalId": "example-1",
            "threadId": None,
            "sender": None,
            "participants": ["recipient-1"],
            "timestamp": "2026-11-27T08:00:00Z",
            "direction": "outgoing",
            "text": "Sample meeting reminder",
        }
        session = {"companySlug": "example", "principalId": "principal-1", "importAllowed": True}
        imported = {"results": [{"externalId": "example-1", "status": "accepted", "messageUuid": "message-1"}]}
        page = {"messages": [{**message, "source": "sms", "messageUuid": "message-1"}]}
        transport = mock.Mock(side_effect=[{"status": 200, "body": json.dumps(value)} for value in (
            session, imported, page,
        )])
        token = mock.Mock(side_effect=["example-token-1", "example-token-2", "example-token-3"])
        client = AppMessagesClient(ORIGIN + "/", token, timeout=5, transport=transport)

        self.assertEqual(session, client.session())
        self.assertEqual(imported, client.import_batch({"source": "sms", "messages": [message]}))
        self.assertEqual(page, client.search({"query": "meeting reminder", "sender": "recipient-1"}))

        requests = [call.args for call in transport.call_args_list]
        self.assertEqual(
            [
                ("GET", PATH + "/session", None),
                ("POST", PATH + "/batch", {"source": "sms", "messages": [message]}),
                ("POST", PATH + "/search", {"query": "meeting reminder", "sender": "recipient-1"}),
            ],
            [(method, url, body) for method, url, body, _, _ in requests],
        )
        for index, (method, _, _, headers, timeout) in enumerate(requests, 1):
            self.assertEqual(f"Bearer example-token-{index}", headers["Authorization"])
            self.assertEqual("application/json", headers["Accept"])
            self.assertEqual("application/json" if method == "POST" else None, headers.get("Content-Type"))
            self.assertNotIn("X-Custd-Site-Key", headers)
            self.assertEqual(5, timeout)

    def test_direct_read_and_source_removal_encode_only_valid_resource_paths(self) -> None:
        message_id = "cf6d72ac-c5c2-4e2f-b141-0cc4c8e2b2cd"
        read = {"message": {"messageUuid": message_id}}
        deleted = {"source": "sms", "deletedCount": 1}
        transport = mock.Mock(side_effect=[{"status": 200, "body": value} for value in (read, deleted)])
        client = AppMessagesClient(ORIGIN, "fixture-token", transport=transport)
        self.assertEqual(read, client.get_message(message_id.upper()))
        self.assertEqual(deleted, client.delete_source("sms"))
        with self.assertRaises(ValueError):
            client.get_message("../sources/sms")
        self.assertEqual(
            [("GET", PATH + "/" + message_id), ("DELETE", PATH + "/sources/sms")],
            [(method, url) for method, url, *_ in (call.args for call in transport.call_args_list)],
        )

    def test_default_transport_refuses_redirects_and_omits_error_content(self) -> None:
        response_headers = Message()
        response_headers["Location"] = "https://untrusted.example.test/"
        redirect = urllib.error.HTTPError(
            PATH + "/session", 302, "Found", response_headers, io.BytesIO(b"private example content")
        )
        with redirect, mock.patch("custd.client._NO_REDIRECT_OPENER.open", side_effect=redirect) as send:
            with self.assertRaises(RequestError) as refused:
                AppMessagesClient(ORIGIN, "example-token").session()
        self.assertEqual(302, refused.exception.status)
        self.assertNotIn("private example content", str(refused.exception))
        self.assertEqual("Bearer example-token", send.call_args.args[0].get_header("Authorization"))

    def test_insecure_origin_or_missing_bearer_sends_no_request(self) -> None:
        transport = mock.Mock()
        for origin in ("http://api.example.test", "https://api.example.test?x", "https://user@api.example.test"):
            with self.subTest(origin=origin), self.assertRaises(ValueError):
                AppMessagesClient(origin, "example-token", transport=transport)
        with self.assertRaises(ValueError):
            AppMessagesClient(ORIGIN, "invalid bearer", transport=transport).session()
        transport.assert_not_called()
