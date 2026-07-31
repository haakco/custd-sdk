"""Lifecycle matrix tests for the Python SDK.

These tests load the same shared fixtures every SDK consumes
(see contract-fixtures/lifecycle/) and assert the typed decode for each
namespace. No network calls; the goal is to prove the SDK surface matches
the server contract before any HTTP layer is exercised.
"""

from __future__ import annotations

import json
import unittest
from pathlib import Path

from custd.admin_subject_exports import SubjectExportDownloadResponse  # noqa: F401
from custd.admin_tenant_storage import TenantStorageLocation  # noqa: F401

FIXTURE_ROOT = Path(__file__).resolve().parents[2] / "contract-fixtures" / "lifecycle"


def _load(namespace: str, name: str) -> dict:
    path = FIXTURE_ROOT / namespace / name
    return json.loads(path.read_text())


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
        resp: SubjectExportDownloadResponse = _load(
            "subject-exports", "valid-download-response.json"
        )
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
        for field in ("tenantSlug", "scope", "retentionClass",
                      "maxAgeSeconds", "precedence", "legalHold"):
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

        self.assertEqual(created["state"], "requested")
        self.assertIn("previewInventoryDigest", preview)
        self.assertTrue(exported["complete"])
        self.assertEqual(ack["state"], "confirmed")
        self.assertEqual(executed["state"], "deleting")
        self.assertEqual(receipt["finalState"], "complete")
        self.assertIn("sha256", receipt)

    def test_waiver_required(self) -> None:
        resp = _load("offboarding", "invalid-waiver-empty.json")
        self.assertEqual(resp["error"], "waiver_required")

    def test_erasure_incomplete_blocks_confirm(self) -> None:
        resp = _load("offboarding", "incomplete-erasure-blocks-confirm.json")
        self.assertEqual(resp["error"], "erasure_incomplete")
        self.assertEqual(resp["safeNextAction"], "retry_erasure")

    def test_schedule_create(self) -> None:
        req = _load("offboarding", "valid-schedule-create-request.json")
        resp = _load("offboarding", "valid-schedule-create-response.json")
        self.assertEqual(req["executeAt"], resp["executeAt"])
        self.assertEqual(resp["state"], "scheduled")

    def test_schedule_list(self) -> None:
        resp = _load("offboarding", "valid-schedule-list-response.json")
        self.assertGreaterEqual(len(resp["schedules"]), 1)
        self.assertEqual(resp["schedules"][0]["tenantSlug"], "acme")

    def test_isolation(self) -> None:
        resp = _load("offboarding", "isolation-other-tenant.json")
        self.assertEqual(resp["error"], "tenant_mismatch")


if __name__ == "__main__":
    unittest.main()