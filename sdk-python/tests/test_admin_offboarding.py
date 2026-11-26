import hashlib
import io
import pathlib
import sys
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "src"))

from custd import CustdClient, RequestError
from custd.client import AdminStream

REQUEST_ID = "ob_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ"


class QueueAdminTransport:
    def __init__(self, responses):
        self.responses = list(responses)
        self.calls = []

    def __call__(self, method, url, payload, headers, timeout):
        self.calls.append({"method": method, "url": url, "payload": payload, "headers": headers, "timeout": timeout})
        return self.responses.pop(0)


EXPORT_BODY = b"custd offboarding export\n"
CHECKSUM = hashlib.sha256(EXPORT_BODY).hexdigest()


class TrackedBody(io.BytesIO):
    def __init__(self, data: bytes) -> None:
        super().__init__(data)
        self.reads: list[int] = []

    def read(self, size: int | None = -1, /) -> bytes:
        self.reads.append(-1 if size is None else size)
        return super().read(size)


class StreamTransport:
    def __init__(self, status: int, body: bytes, headers: dict[str, str]) -> None:
        self.body = TrackedBody(body)
        self.answer = AdminStream(status, {key.lower(): value for key, value in headers.items()}, self.body)
        self.calls: list[dict[str, object]] = []

    def __call__(self, method, url, headers, timeout):
        self.calls.append({"method": method, "url": url, "headers": headers})
        return self.answer


def download_client(status: int, body: bytes, headers: dict[str, str]) -> tuple[CustdClient, StreamTransport]:
    stream = StreamTransport(status, body, headers)
    client = CustdClient(base_url="http://localhost:8080", token="admin-token", admin_stream_transport=stream)
    return client, stream


class OffboardingClientTest(unittest.TestCase):
    def test_download_streams_the_verified_bundle_into_the_writer(self):
        client, stream = download_client(200, EXPORT_BODY, {
            "Content-Type": "application/octet-stream",
            "Content-Length": str(len(EXPORT_BODY)),
            "X-Checksum-SHA256": CHECKSUM,
            "X-Request-Id": "req-1",
        })
        writer = io.BytesIO()

        result = client.admin.offboarding.download(REQUEST_ID, writer)

        self.assertEqual(EXPORT_BODY, writer.getvalue())
        self.assertEqual(
            {
                "contentType": "application/octet-stream", "checksumSha256": CHECKSUM,
                "byteSize": len(EXPORT_BODY), "requestId": "req-1",
            },
            result,
        )
        self.assertEqual("GET", stream.calls[0]["method"])
        self.assertEqual(
            f"http://localhost:8080/api/v1/admin/offboarding/requests/{REQUEST_ID}/download", stream.calls[0]["url"]
        )
        self.assertEqual("Bearer admin-token", stream.calls[0]["headers"]["Authorization"])
        self.assertTrue(stream.body.closed)

    def test_download_refuses_bytes_that_do_not_match_the_headers(self):
        cases = {
            "checksum mismatch": {"Content-Length": str(len(EXPORT_BODY)), "X-Checksum-SHA256": "b" * 64},
            "content length mismatch": {"Content-Length": "4", "X-Checksum-SHA256": CHECKSUM},
            "checksum header is invalid": {"Content-Length": str(len(EXPORT_BODY))},
            "content length is invalid": {"X-Checksum-SHA256": CHECKSUM},
        }
        for message, headers in cases.items():
            with self.subTest(message):
                client, stream = download_client(200, EXPORT_BODY, headers)
                with self.assertRaisesRegex(ValueError, message):
                    client.admin.offboarding.download(REQUEST_ID, io.BytesIO())
                self.assertTrue(stream.body.closed)
                if message == "content length mismatch":
                    self.assertEqual([5], stream.body.reads, "read one byte past the declared length, no more")

    def test_download_error_answer_raises_the_admin_error_and_closes(self):
        client, stream = download_client(409, b'{"error": "export not ready", "code": "export_pending"}', {})

        with self.assertRaises(RequestError) as raised:
            client.admin.offboarding.download(REQUEST_ID, io.BytesIO())

        self.assertEqual((409, "export_pending"), (raised.exception.status, raised.exception.code))
        self.assertTrue(stream.body.closed)

    def test_execute_posts_without_caller_body(self):
        transport = QueueAdminTransport([{"status": 200, "body": '{"state":"deleting"}'}])
        client = CustdClient(base_url="http://localhost:8080", token="admin-token", admin_transport=transport)

        result = client.admin.offboarding.execute(REQUEST_ID)

        self.assertEqual("deleting", result["state"])
        self.assertIsNone(transport.calls[0]["payload"])


if __name__ == "__main__":
    unittest.main()
