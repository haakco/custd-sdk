"""Lifecycle matrix tests for the Python SDK.

These tests load the same shared fixtures every SDK consumes
(see contract-fixtures/lifecycle/) and assert the typed decode for each
namespace. No network calls; the goal is to prove the SDK surface matches
the server contract before any HTTP layer is exercised.
"""

from __future__ import annotations

import base64
import json
import unittest
from pathlib import Path

from custd.admin_subject_exports import SubjectExportDownloadResponse  # noqa: F401
from custd.admin_tenant_storage import TenantStorageLocation  # noqa: F401

FIXTURE_ROOT = Path(__file__).resolve().parents[2] / "contract-fixtures" / "lifecycle"


def _load(namespace: str, name: str) -> dict:
    path = FIXTURE_ROOT / namespace / name
    return json.loads(path.read_text())


class CapturingAdminTransport:
    def __init__(self, responses: list[tuple[int, object] | dict[str, object]]) -> None:
        self.responses = list(responses)
        self.calls: list[dict] = []

    def __call__(self, method, url, payload, headers, timeout):
        self.calls.append(
            {
                "method": method,
                "url": url,
                "payload": payload,
                "headers": headers,
                "timeout": timeout,
            }
        )
        response = self.responses.pop(0)
        if isinstance(response, dict):
            return response
        status, body = response
        return {"status": status, "body": body}


class TestTenantStorage(unittest.TestCase):
    def test_list_parses(self) -> None:
        payload = _load("tenant-storage", "valid-list-response.json")
        locations: list[TenantStorageLocation] = payload["locations"]
        self.assertEqual(len(locations), 2)
        self.assertEqual(locations[0]["tenantSlug"], "acme")
        self.assertIn("serverAssignedPrefix", locations[0])
        self.assertEqual(locations[0]["status"], "active")

    def test_isolation(self) -> None:
        payload = _load("tenant-storage", "isolation-other-tenant-response.json")
        self.assertEqual(payload["locations"], [])

    def test_create_round_trip(self) -> None:
        req = _load("tenant-storage", "valid-create-request.json")
        resp = _load("tenant-storage", "valid-create-response.json")
        self.assertEqual(req["tenantSlug"], resp["tenantSlug"])
        self.assertEqual(resp["status"], "active")


class TestSubjectExport(unittest.TestCase):
    def test_create_and_force(self) -> None:
        created = _load("subject-exports", "valid-create-response.json")
        forced = _load("subject-exports", "valid-force-response.json")
        self.assertEqual(created["state"], "queued")
        self.assertEqual(forced["state"], "ready")

    def test_download_includes_url_and_expiry(self) -> None:
        resp: SubjectExportDownloadResponse = _load("subject-exports", "valid-download-response.json")
        self.assertIn("downloadUrl", resp)
        self.assertIn("expiresAt", resp)

    def test_expired_download_surfaces_error(self) -> None:
        resp = _load("subject-exports", "expired-download-response.json")
        self.assertEqual(resp["error"], "download_expired")

    def test_cancel_response(self) -> None:
        resp = _load("subject-exports", "valid-cancel-response.json")
        self.assertEqual(resp["state"], "cancelled")


class TestPrivacyErasure(unittest.TestCase):
    def test_happy_path_progress(self) -> None:
        resp = _load("privacy-erasures", "valid-get-response.json")
        self.assertEqual(resp["state"], "complete")
        self.assertGreater(len(resp["perStoreProgress"]), 0)

    def test_legal_hold_preserved(self) -> None:
        resp = _load("privacy-erasures", "legal-hold-retained.json")
        self.assertEqual(resp["state"], "partial")
        stores = {row["store"]: row for row in resp["perStoreProgress"]}
        self.assertEqual(stores["legal_hold"]["state"], "retained")

    def test_invalid_selector(self) -> None:
        resp = _load("privacy-erasures", "invalid-selector.json")
        self.assertEqual(resp["error"], "invalid_selector")

    def test_isolation(self) -> None:
        payload = _load("privacy-erasures", "isolation-other-tenant.json")
        self.assertEqual(payload["erasures"], [])


class TestRetention(unittest.TestCase):
    def test_list_includes_required_fields(self) -> None:
        resp = _load("retention", "valid-list-response.json")
        policy = resp["policies"][0]
        for field in ("tenantSlug", "scope", "retentionClass", "maxAgeSeconds", "precedence", "legalHold"):
            self.assertIn(field, policy)

    def test_preview_apply_runs(self) -> None:
        preview = _load("retention", "valid-preview-response.json")
        applied = _load("retention", "valid-apply-response.json")
        runs = _load("retention", "valid-runs-response.json")
        self.assertIn("previewId", preview)
        self.assertEqual(applied["state"], "running")
        self.assertGreaterEqual(len(runs["runs"]), 1)

    def test_selectorless_scope_rejected(self) -> None:
        resp = _load("retention", "invalid-selectorless-scope.json")
        self.assertEqual(resp["error"], "selector_required")

    def test_negative_max_age_rejected(self) -> None:
        resp = _load("retention", "invalid-negative-max-age.json")
        self.assertEqual(resp["error"], "invalid_max_age")

    def test_upsert_request_matches_response(self) -> None:
        req = _load("retention", "valid-upsert-request.json")
        resp = _load("retention", "valid-upsert-response.json")
        self.assertEqual(req["scope"], resp["scope"])
        self.assertEqual(req["maxAgeSeconds"], resp["maxAgeSeconds"])


class TestOffboarding(unittest.TestCase):
    def test_full_lifecycle(self) -> None:
        created = _load("offboarding", "valid-request-create-response.json")
        preview = _load("offboarding", "valid-preview-response.json")
        exported = _load("offboarding", "valid-export-response.json")
        ack = _load("offboarding", "valid-acknowledge-response.json")
        executed = _load("offboarding", "valid-execute-response.json")
        receipt = _load("offboarding", "valid-receipt-response.json")

        self.assertEqual(created["state"], "preview")
        self.assertIn("previewInventoryDigest", preview)
        self.assertEqual(len(preview["stores"]), 3)
        self.assertEqual(exported["recordCount"], 1357)
        self.assertEqual(ack["state"], "requested")
        self.assertEqual(executed["final_state"], "complete")
        self.assertEqual(receipt["final_state"], "complete")
        self.assertIn("sha256", receipt)

    def test_client_maps_wire_shapes_and_sends_idempotency_header(self) -> None:
        download_fixture = _load("offboarding", "valid-download-binary.json")
        download_body = base64.b64decode(download_fixture["bodyBase64"])
        responses = [
            (202, _load("offboarding", "valid-request-create-response.json")),
            (200, _load("offboarding", "valid-preview-response.json")),
            (200, _load("offboarding", "valid-export-response.json")),
            {
                "status": 200,
                "body": download_body,
                "headers": {
                    "Content-Length": str(download_fixture["byteSize"]),
                    "X-Checksum-SHA256": download_fixture["checksumSha256"],
                },
            },
            (200, _load("offboarding", "valid-acknowledge-response.json")),
            (200, _load("offboarding", "valid-execute-response.json")),
            (200, _load("offboarding", "valid-receipt-response.json")),
        ]
        transport = CapturingAdminTransport(responses)
        from custd import CustdClient

        client = CustdClient(
            base_url="http://localhost:8080",
            token="admin-token",
            admin_transport=transport,
        )
        offboarding = client.admin.offboarding
        request_uuid = "ob_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ"

        created = offboarding.request_offboarding(
            {"confirmation": "acme"},
            {"idempotency_key": "offboarding-proof-1"},
        )
        preview = offboarding.preview(request_uuid)
        exported = offboarding.export(request_uuid)
        downloaded = offboarding.download(request_uuid)
        acknowledged = offboarding.acknowledge(request_uuid)
        executed = offboarding.execute(request_uuid)
        receipt = offboarding.receipt(request_uuid)

        self.assertEqual("preview", created["state"])
        self.assertEqual("operational", preview["stores"][0]["retention_class"])
        self.assertEqual(1357, exported["record_count"])
        self.assertEqual(download_body, downloaded["bytes"])
        self.assertEqual(download_fixture["checksumSha256"], downloaded["checksumSha256"])
        self.assertEqual(download_fixture["byteSize"], downloaded["byteSize"])
        self.assertIsNone(transport.calls[3]["payload"])
        self.assertEqual("requested", acknowledged["state"])
        self.assertEqual("complete", executed["final_state"])
        self.assertEqual(7, receipt["requested_by_user_id"])
        self.assertEqual("complete", receipt["final_state"])
        self.assertIsNone(transport.calls[5]["payload"])
        self.assertEqual("offboarding-proof-1", transport.calls[0]["headers"]["Idempotency-Key"])
        self.assertNotIn("Idempotency-Key", transport.calls[1]["headers"])

    def test_client_preserves_machine_receipt_without_user_id(self) -> None:
        receipt = _load("offboarding", "valid-receipt-response.json")
        receipt["requested_by_actor"] = "client:tiao-lifecycle"
        receipt["requested_by_user_id"] = None
        transport = CapturingAdminTransport([(200, receipt)])
        from custd import CustdClient

        client = CustdClient(
            base_url="http://localhost:8080",
            token="admin-token",
            admin_transport=transport,
        )

        result = client.admin.offboarding.receipt("ob_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ")

        self.assertEqual("client:tiao-lifecycle", result["requested_by_actor"])
        self.assertIsNone(result["requested_by_user_id"])

    def test_binary_download_fixture_contains_integrity_metadata(self) -> None:
        fixture = _load("offboarding", "valid-download-binary.json")
        body = base64.b64decode(fixture["bodyBase64"])
        self.assertEqual(fixture["byteSize"], len(body))
        self.assertEqual(len(fixture["checksumSha256"]), 64)

    def test_erasure_incomplete_blocks_confirm(self) -> None:
        resp = _load("offboarding", "incomplete-erasure-blocks-confirm.json")
        self.assertEqual(resp["code"], "erasure_incomplete")
        self.assertEqual(resp["safe_next_action"], "retry_erasure")

    def test_client_preserves_workflow_error_recovery_fields(self) -> None:
        from custd import CustdClient, RequestError

        transport = CapturingAdminTransport(
            [
                (409, _load("offboarding", "incomplete-erasure-blocks-confirm.json")),
            ]
        )
        client = CustdClient(
            base_url="http://localhost:8080",
            token="admin-token",
            admin_transport=transport,
        )

        with self.assertRaises(RequestError) as raised:
            client.admin.offboarding.confirm_request("ob_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ")

        self.assertEqual(raised.exception.status, 409)
        self.assertEqual(raised.exception.code, "erasure_incomplete")
        self.assertEqual(raised.exception.safe_next_action, "retry_erasure")
        self.assertIn("Cannot confirm destructive offboarding", raised.exception.reason or "")

    def test_schedule_create(self) -> None:
        req = _load("offboarding", "valid-schedule-create-request.json")
        resp = _load("offboarding", "valid-schedule-create-response.json")
        self.assertEqual(req["effectiveAt"], resp["effectiveAt"])
        self.assertEqual(req["gracePeriodDays"], resp["gracePeriodDays"])
        self.assertEqual(resp["status"], "scheduled")
        self.assertEqual(resp["updatedAt"], "2026-07-31T08:00:00Z")

    def test_schedule_list(self) -> None:
        resp = _load("offboarding", "valid-schedule-list-response.json")
        self.assertGreaterEqual(len(resp["schedules"]), 1)
        schedule = resp["schedules"][0]
        self.assertEqual(schedule["tenantSlug"], "acme")
        self.assertEqual(schedule["effectiveAt"], "2026-12-31T00:00:00Z")
        self.assertEqual(schedule["gracePeriodDays"], 30)
        self.assertEqual(schedule["status"], "scheduled")

    def test_isolation(self) -> None:
        resp = _load("offboarding", "isolation-other-tenant.json")
        self.assertEqual(resp["error"], "tenant_mismatch")


if __name__ == "__main__":
    unittest.main()
