import gzip
import json
import pathlib
import sys
import unittest
from unittest import mock

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "src"))

from custd import CustdClient, make_default_transport, normalize_compression


class FakeResponse:
    status = 202

    def read(self):
        return b""

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False


class CapturedRequest:
    def __init__(self):
        self.data = None
        self.headers = None

    def capture(self, request, timeout=None):
        self.data = request.data
        self.headers = {key.lower(): value for key, value in request.headers.items()}
        return FakeResponse()


class CompressionTransportTest(unittest.TestCase):
    def setUp(self):
        self.captured = CapturedRequest()
        self.url = "http://localhost:8080/api/v1/events/batch"
        self.headers = {"Content-Type": "application/json", "Authorization": "Bearer token"}

    def _send(self, event, compression):
        transport = make_default_transport(normalize_compression(compression))
        with mock.patch("custd.client.urllib.request.urlopen", self.captured.capture):
            transport(self.url, event, dict(self.headers), 15)

    def test_body_at_or_above_threshold_is_gzip_compressed(self):
        event = {"events": [{"index": i, "filler": "x" * 50} for i in range(20)]}
        original = json.dumps(event).encode("utf-8")
        self.assertGreaterEqual(len(original), 1024)

        self._send(event, {"threshold_bytes": 1024})

        self.assertEqual("gzip", self.captured.headers["content-encoding"])
        self.assertEqual("application/json", self.captured.headers["content-type"])
        self.assertEqual(original, gzip.decompress(self.captured.data))

    def test_body_below_threshold_is_sent_raw(self):
        event = {"events": [{"index": 1}]}
        original = json.dumps(event).encode("utf-8")
        self.assertLess(len(original), 1024)

        self._send(event, {"threshold_bytes": 1024})

        self.assertNotIn("content-encoding", self.captured.headers)
        self.assertEqual(original, self.captured.data)

    def test_disabled_compression_sends_raw_regardless_of_size(self):
        event = {"events": [{"index": i, "filler": "x" * 50} for i in range(20)]}
        original = json.dumps(event).encode("utf-8")
        self.assertGreaterEqual(len(original), 1024)

        self._send(event, {"enabled": False, "threshold_bytes": 1024})

        self.assertNotIn("content-encoding", self.captured.headers)
        self.assertEqual(original, self.captured.data)

    def test_compression_enabled_by_default(self):
        self.assertTrue(normalize_compression(None)["enabled"])
        self.assertEqual(1024, normalize_compression(None)["threshold_bytes"])


class CompressionClientTest(unittest.TestCase):
    def test_client_default_transport_compresses_large_batches(self):
        captured = CapturedRequest()
        client = CustdClient(
            base_url="http://localhost:8080",
            token="token",
            batch={"max_batch_size": 1000},
            queue={"enabled": True},
            retry={"max_attempts": 1},
        )
        big_payload = "x" * 2048
        client.track({
            "eventUuid": "evt-1",
            "eventTypeSlug": "page-view",
            "schemaVersion": "1.0.0",
            "timestamp": "2026-01-23T12:00:00.000Z",
            "sessionId": "s",
            "anonymousId": "a",
            "companySlug": "acme",
            "context": {"device": {"type": "desktop"}},
            "payload": {"blob": big_payload},
        })

        with mock.patch("custd.client.urllib.request.urlopen", captured.capture):
            client.flush()

        self.assertEqual("gzip", captured.headers["content-encoding"])


if __name__ == "__main__":
    unittest.main()
