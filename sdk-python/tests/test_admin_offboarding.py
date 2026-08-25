import base64
import hashlib
import json
import pathlib
import sys
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "src"))

from custd import CustdClient

FIXTURES = pathlib.Path(__file__).resolve().parents[2] / "contract-fixtures" / "lifecycle" / "offboarding"
REQUEST_ID = "ob_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ"


class QueueAdminTransport:
    def __init__(self, responses):
        self.responses = list(responses)
        self.calls = []

    def __call__(self, method, url, payload, headers, timeout):
        self.calls.append({"method": method, "url": url, "payload": payload, "headers": headers, "timeout": timeout})
        return self.responses.pop(0)


def load_binary_fixture():
    fixture = json.loads((FIXTURES / "valid-download-binary.json").read_text())
    body = base64.b64decode(fixture["bodyBase64"])
    return fixture, body


class OffboardingClientTest(unittest.TestCase):
    def test_download_returns_authenticated_bytes_and_verified_headers(self):
        fixture, body = load_binary_fixture()
        transport = QueueAdminTransport([{
            "status": 200,
            "body": body,
            "headers": {
                "Content-Length": str(fixture["byteSize"]),
                "X-Checksum-SHA256": fixture["checksumSha256"],
            },
        }])
        client = CustdClient(base_url="http://localhost:8080", token="admin-token", admin_transport=transport)

        result = client.admin.offboarding.download(REQUEST_ID)

        self.assertEqual(body, result["bytes"])
        self.assertEqual(fixture["checksumSha256"], result["checksumSha256"])
        self.assertEqual(fixture["byteSize"], result["byteSize"])
        self.assertEqual("GET", transport.calls[0]["method"])
        self.assertEqual(
            f"http://localhost:8080/api/v1/admin/offboarding/requests/{REQUEST_ID}/download",
            transport.calls[0]["url"],
        )
        self.assertIsNone(transport.calls[0]["payload"])
        self.assertEqual("Bearer admin-token", transport.calls[0]["headers"]["Authorization"])

    def test_download_rejects_checksum_mismatch(self):
        _, body = load_binary_fixture()
        transport = QueueAdminTransport([{
            "status": 200,
            "body": body,
            "headers": {"Content-Length": str(len(body)), "X-Checksum-SHA256": hashlib.sha256(b"other").hexdigest()},
        }])
        client = CustdClient(base_url="http://localhost:8080", token="admin-token", admin_transport=transport)

        with self.assertRaisesRegex(ValueError, "checksum mismatch"):
            client.admin.offboarding.download(REQUEST_ID)

    def test_download_rejects_declared_size_above_bound(self):
        _, body = load_binary_fixture()
        transport = QueueAdminTransport([{
            "status": 200,
            "body": body,
            "headers": {
                "Content-Length": str(64 * 1024 * 1024 + 1),
                "X-Checksum-SHA256": hashlib.sha256(body).hexdigest(),
            },
        }])
        client = CustdClient(base_url="http://localhost:8080", token="admin-token", admin_transport=transport)

        with self.assertRaisesRegex(ValueError, "exceeds 64 MiB"):
            client.admin.offboarding.download(REQUEST_ID)

    def test_execute_posts_without_caller_body(self):
        transport = QueueAdminTransport([{"status": 200, "body": '{"state":"deleting"}'}])
        client = CustdClient(base_url="http://localhost:8080", token="admin-token", admin_transport=transport)

        result = client.admin.offboarding.execute(REQUEST_ID)

        self.assertEqual("deleting", result["state"])
        self.assertIsNone(transport.calls[0]["payload"])


if __name__ == "__main__":
    unittest.main()
