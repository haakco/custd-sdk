import json
import pathlib
import sys
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "src"))

from custd import CustdClient

PARSER_UUID = "11111111-1111-1111-1111-111111111111"

_UNSET = object()


class RecordingTransport:
    def __init__(self, body=_UNSET, status=202):
        self.body = {"success": True, "processed": 0, "failed": 0} if body is _UNSET else body
        self.status = status
        self.calls = []

    def __call__(self, url, event, headers, timeout):
        self.calls.append((url, event, headers, timeout))
        return {"status": self.status, "body": json.dumps(self.body)}


def make_client(transport):
    return CustdClient(base_url="http://localhost:8080", token="token", transport=transport)


class RawIngestTest(unittest.TestCase):
    def test_posts_the_raw_body_with_the_parser_binding(self) -> None:
        transport = RecordingTransport({"success": True, "processed": 2, "failed": 0})
        result = make_client(transport).ingest_raw_lines(
            {"content": "first line\nsecond line\n", "parserUuid": PARSER_UUID}
        )

        url, body, headers, _ = transport.calls[0]
        self.assertEqual(url, "http://localhost:8080/api/v1/raw")
        self.assertEqual(headers["X-Parser-UUID"], PARSER_UUID)
        self.assertEqual(headers["Content-Type"], "text/plain; charset=utf-8")
        self.assertEqual(body, b"first line\nsecond line\n")
        # A 202 alone is not success: the body carries the per-record counts.
        self.assertEqual(result, {"success": True, "processed": 2, "failed": 0})

    def test_appends_the_paired_source_target(self) -> None:
        transport = RecordingTransport({"success": True, "processed": 3, "failed": 1})
        result = make_client(transport).ingest_raw_lines(
            {
                "content": "line\n",
                "parserUuid": PARSER_UUID,
                "target": {"subClient": "acme-store", "resource": "srv-01"},
            }
        )

        url = transport.calls[0][0]
        self.assertIn("subClient=acme-store", url)
        self.assertIn("resource=srv-01", url)
        # A partial failure is surfaced, not swallowed by the 202 status.
        self.assertEqual(result["failed"], 1)

    def test_rejects_missing_or_malformed_inputs_before_sending(self) -> None:
        cases = [
            {"content": "x", "parserUuid": "not-a-uuid"},
            {"content": "x", "parserUuid": ""},
            {"content": "x", "parserUuid": PARSER_UUID, "target": {"subClient": "acme-store"}},
            {
                "content": "x",
                "parserUuid": PARSER_UUID,
                "target": {"subClient": "bad code", "resource": "srv-01"},
            },
        ]
        for case in cases:
            transport = RecordingTransport()
            with self.assertRaises(ValueError):
                make_client(transport).ingest_raw_lines(case)  # type: ignore[arg-type]
            self.assertEqual([], transport.calls)

    def test_accepts_an_empty_raw_body(self) -> None:
        transport = RecordingTransport()
        result = make_client(transport).ingest_raw_lines({"content": "", "parserUuid": PARSER_UUID})
        self.assertEqual(transport.calls[0][1], b"")
        self.assertEqual(result["processed"], 0)


if __name__ == "__main__":
    unittest.main()


class FailingTransport:
    def __init__(self, error=None):
        self.error = error or RuntimeError("connection reset")

    def __call__(self, url, event, headers, timeout):
        raise self.error


class RawAcceptanceTest(unittest.TestCase):
    def test_rejects_malformed_acceptance_bodies(self) -> None:
        from custd import RawAcceptanceUnknownError

        bodies = {
            "null": None,
            "empty object": {},
            "missing failed": {"success": True, "processed": 2},
            "missing processed": {"success": True, "failed": 0},
            "missing success": {"processed": 2, "failed": 0},
            "null failed": {"success": True, "processed": 2, "failed": None},
            "wrong success type": {"success": "yes", "processed": 2, "failed": 0},
            "wrong processed type": {"success": True, "processed": "2", "failed": 0},
            "boolean processed": {"success": True, "processed": True, "failed": 0},
            "negative processed": {"success": True, "processed": -1, "failed": 0},
            "negative failed": {"success": True, "processed": 2, "failed": -1},
            "fractional processed": {"success": True, "processed": 2.5, "failed": 0},
        }
        for name, body in bodies.items():
            with self.subTest(name=name):
                transport = RecordingTransport(body)
                with self.assertRaises(RawAcceptanceUnknownError):
                    make_client(transport).ingest_raw_lines({"content": "x", "parserUuid": PARSER_UUID})

    def test_preserves_legitimate_partial_counts(self) -> None:
        transport = RecordingTransport({"success": True, "processed": 3, "failed": 1})
        result = make_client(transport).ingest_raw_lines({"content": "x", "parserUuid": PARSER_UUID})
        self.assertEqual(result, {"success": True, "processed": 3, "failed": 1})

    def test_classifies_a_transport_failure_as_unknown_acceptance(self) -> None:
        from custd import RawAcceptanceUnknownError

        with self.assertRaises(RawAcceptanceUnknownError) as raised:
            make_client(FailingTransport()).ingest_raw_lines({"content": "x", "parserUuid": PARSER_UUID})
        self.assertEqual(raised.exception.retryability, "none")
        self.assertFalse(raised.exception.unavailable)
        self.assertNotEqual(raised.exception.next_action, {"action": "retry"})

    def test_classifies_a_retryable_status_as_unknown_acceptance(self) -> None:
        from custd import RawAcceptanceUnknownError

        transport = RecordingTransport({"title": "unavailable"}, status=503)
        with self.assertRaises(RawAcceptanceUnknownError):
            make_client(transport).ingest_raw_lines({"content": "x", "parserUuid": PARSER_UUID})

    def test_keeps_a_non_retryable_status_a_definite_rejection(self) -> None:
        from custd import RawAcceptanceUnknownError, RequestError

        transport = RecordingTransport({"title": "invalid"}, status=400)
        with self.assertRaises(RequestError) as raised:
            make_client(transport).ingest_raw_lines({"content": "x", "parserUuid": PARSER_UUID})
        self.assertNotIsInstance(raised.exception, RawAcceptanceUnknownError)


class RawIdempotencyKeyTest(unittest.TestCase):
    KEY_PATTERN = r"^\d+:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"

    def test_factory_mints_a_key_that_is_retained_across_a_resend(self) -> None:
        import re

        from custd import create_raw_ingest_request

        request = create_raw_ingest_request("line\n", PARSER_UUID)
        self.assertRegex(request["idempotencyKey"], self.KEY_PATTERN)
        transport = RecordingTransport({"success": True, "processed": 1, "failed": 0})
        client = make_client(transport)
        client.ingest_raw_lines(request)
        client.ingest_raw_lines(request)
        first = transport.calls[0][2]["Idempotency-Key"]
        second = transport.calls[1][2]["Idempotency-Key"]
        self.assertEqual(first, request["idempotencyKey"])
        self.assertEqual(first, second)
        self.assertIsNotNone(re.match(self.KEY_PATTERN, first))

    def test_factory_mints_a_new_key_per_object(self) -> None:
        from custd import create_raw_ingest_request

        first = create_raw_ingest_request("line\n", PARSER_UUID)
        second = create_raw_ingest_request("line\n", PARSER_UUID)
        self.assertNotEqual(first["idempotencyKey"], second["idempotencyKey"])

    def test_no_key_sends_no_header(self) -> None:
        transport = RecordingTransport({"success": True, "processed": 1, "failed": 0})
        make_client(transport).ingest_raw_lines({"content": "line\n", "parserUuid": PARSER_UUID})
        self.assertNotIn("Idempotency-Key", transport.calls[0][2])

    def test_conflict_and_expiry_stay_definite_rejections(self) -> None:
        from custd import RawAcceptanceUnknownError, create_raw_ingest_request

        for status in (409, 400):
            transport = RecordingTransport({"title": "idempotency conflict"}, status=status)
            with self.assertRaises(Exception) as raised:
                make_client(transport).ingest_raw_lines(create_raw_ingest_request("line\n", PARSER_UUID))
            self.assertNotIsInstance(raised.exception, RawAcceptanceUnknownError)

    def test_unknown_acceptance_surfaces_the_operation_key(self) -> None:
        from custd import RawAcceptanceUnknownError, create_raw_ingest_request

        request = create_raw_ingest_request("line\n", PARSER_UUID)
        with self.assertRaises(RawAcceptanceUnknownError) as raised:
            make_client(FailingTransport()).ingest_raw_lines(request)
        self.assertEqual(raised.exception.operation_key, request["idempotencyKey"])
