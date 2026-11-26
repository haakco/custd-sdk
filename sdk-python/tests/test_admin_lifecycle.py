"""Lifecycle client behaviour the route and field conformance tests do not observe.

The response shapes themselves are proven against the Custd operation snapshot in
test_response_fields.py; these tests cover what a client does with them: surfacing workflow
errors, tenant isolation, legal holds, an expired download, and the offboarding workflow's
idempotency and verified binary download. Bodies are inline and server-shaped.
"""

from __future__ import annotations

import hashlib
import io
import pathlib
import sys
import unittest
from typing import Any

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "src"))

from custd import CustdClient, RequestError
from custd.client import AdminStream

REQUEST_UUID = "11111111-1111-4111-8111-111111111111"
RECEIPT: dict[str, Any] = {
    "company_id": 42,
    "requested_by_kind": "human",
    "requested_at": "2026-07-31T08:00:00Z",
    "completed_at": "2026-07-31T09:05:00Z",
    "final_state": "complete",
    "per_store": [
        {
            "store": "postgres_rows",
            "retention_class": "operational",
            "deleted_count": 12,
            "retained_exceptions_count": 0,
        }
    ],
    "waiver": {"role": "client_owner", "timestamp": "2026-07-31T09:04:00Z"},
    "sha256": "a" * 64,
}


class CapturingAdminTransport:
    def __init__(self, responses: list[dict[str, Any]]) -> None:
        self.responses = list(responses)
        self.calls: list[dict[str, Any]] = []

    def __call__(self, method: str, url: str, payload: Any, headers: dict[str, str], timeout: float) -> Any:
        self.calls.append({"method": method, "url": url, "payload": payload, "headers": headers})
        return self.responses.pop(0)


def admin_client(*responses: dict[str, Any]) -> tuple[CustdClient, CapturingAdminTransport]:
    transport = CapturingAdminTransport(list(responses))
    return CustdClient(base_url="http://localhost:8080", token="admin-token", admin_transport=transport), transport


def problem(status: int, code: str, detail: str) -> dict[str, Any]:
    """An RFC 9457 answer as httpx.WriteError writes it."""
    body = {"type": "about:blank", "title": "Not Found", "status": status, "detail": detail, "code": code}
    return {"status": status, "body": {**body, "retryability": "none", "nextAction": {"action": "none"}}}


class SubjectExportTest(unittest.TestCase):
    def test_an_expired_and_removed_artifact_surfaces_the_problem(self) -> None:
        client, transport = admin_client(problem(404, "not_found", "subject export artifact not found"))

        with self.assertRaises(RequestError) as raised:
            client.admin.subject_exports.download(REQUEST_UUID, "access", company_slug="acme")

        self.assertEqual((404, "not_found"), (raised.exception.status, raised.exception.code))
        self.assertIn("artifact not found", str(raised.exception))
        self.assertEqual(
            f"http://localhost:8080/api/v1/admin/subject-exports/{REQUEST_UUID}/download?scope=access&companySlug=acme",
            transport.calls[0]["url"],
        )


class PrivacyErasureTest(unittest.TestCase):
    def test_another_tenants_erasure_is_not_found(self) -> None:
        client, transport = admin_client(problem(404, "not_found", "privacy erasure not found"))

        with self.assertRaises(RequestError) as raised:
            client.admin.privacy_erasures.get(REQUEST_UUID, company_slug="other")

        self.assertEqual(404, raised.exception.status)
        self.assertTrue(transport.calls[0]["url"].endswith("?companySlug=other"))

    def test_an_unforceable_erasure_returns_the_next_step(self) -> None:
        client, _ = admin_client({
            "status": 202,
            "body": {"request": None, "safe_next_action": "cancel", "safe_next_action_code": "request_not_forceable"},
        })

        forced = client.admin.privacy_erasures.force(REQUEST_UUID)

        self.assertIsNone(forced["request"])
        self.assertEqual("request_not_forceable", forced["safe_next_action_code"])


class RetentionTest(unittest.TestCase):
    def test_a_legal_hold_is_kept_through_preview(self) -> None:
        client, _ = admin_client({
            "status": 200,
            "body": {
                "perStore": [{
                    "store": "raw", "retentionClass": "raw", "candidateCount": 9, "estimatedAffected": 0,
                    "sampleSubjects": None, "legalHoldCount": 1,
                }],
                "lastResult": "preview",
                "safeNextAction": "release_legal_hold",
                "startedAt": "2026-07-31T08:00:00Z",
                "completedAt": "2026-07-31T08:00:01Z",
            },
        })

        preview = client.admin.retention.preview("acme")

        self.assertEqual(1, preview["perStore"][0]["legalHoldCount"])
        self.assertEqual(0, preview["perStore"][0]["estimatedAffected"])
        self.assertEqual([], preview["perStore"][0]["sampleSubjects"])


class OffboardingTest(unittest.TestCase):
    def test_workflow_sends_idempotency_once_and_verifies_the_download(self) -> None:
        archive = b"offboarding export archive"
        checksum = hashlib.sha256(archive).hexdigest()
        transport = CapturingAdminTransport([
            {
                "status": 202,
                "body": {"requestUuid": REQUEST_UUID, "state": "preview", "requestedAt": "2026-07-31T08:00:00Z"},
            },
            {"status": 200, "body": RECEIPT},
        ])
        headers = {"content-length": str(len(archive)), "x-checksum-sha256": checksum}
        client = CustdClient(
            base_url="http://localhost:8080",
            token="admin-token",
            admin_transport=transport,
            admin_stream_transport=lambda *_: AdminStream(200, headers, io.BytesIO(archive)),
        )
        offboarding = client.admin.offboarding
        bundle = io.BytesIO()

        created = offboarding.request_offboarding({"confirmation": "acme"}, {"idempotency_key": "offboarding-proof-1"})
        downloaded = offboarding.download(REQUEST_UUID, bundle)
        receipt = offboarding.execute(REQUEST_UUID)

        self.assertEqual(REQUEST_UUID, created["requestUuid"])
        self.assertEqual(archive, bundle.getvalue())
        self.assertEqual((checksum, len(archive)), (downloaded["checksumSha256"], downloaded["byteSize"]))
        self.assertEqual("complete", receipt["final_state"])
        self.assertEqual("offboarding-proof-1", transport.calls[0]["headers"]["Idempotency-Key"])
        self.assertNotIn("Idempotency-Key", transport.calls[1]["headers"])
        self.assertIsNone(transport.calls[1]["payload"])

    def test_confirm_surfaces_the_workflow_conflict(self) -> None:
        client, _ = admin_client({
            "status": 409,
            "body": {
                "error": "Cannot confirm destructive offboarding while erasure is incomplete",
                "code": "erasure_incomplete",
                "safe_next_action": "retry_erasure",
            },
        })

        with self.assertRaises(RequestError) as raised:
            client.admin.offboarding.confirm_request(REQUEST_UUID)

        self.assertEqual((409, "erasure_incomplete"), (raised.exception.status, raised.exception.code))
        self.assertEqual("retry_erasure", raised.exception.safe_next_action)
        self.assertIn("Cannot confirm destructive offboarding", raised.exception.reason or "")


if __name__ == "__main__":
    unittest.main()
