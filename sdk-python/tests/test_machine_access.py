"""Machine access refusals and the request ID a caller quotes.

The refusal fixtures are the bodies Custd's machine access gate writes, shared by every SDK.
"""

import json
import pathlib
import sys
import unittest
from typing import Any

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "src"))

from custd import (
    MACHINE_ACCESS_BLOCKED_CODE,
    MACHINE_ACCESS_UNAVAILABLE_CODE,
    CustdClient,
    RequestError,
    record_metadata,
)

FIXTURES = pathlib.Path(__file__).resolve().parents[2] / "contract-fixtures"


def fixture(name: str) -> str:
    return (FIXTURES / name).read_text(encoding="utf-8")


def client_answering(status: int, body: str) -> CustdClient:
    def transport(method: str, url: str, payload: Any, headers: dict[str, str], timeout: float) -> dict[str, Any]:
        return {"status": status, "body": body, "headers": {"X-Request-Id": "req-header-1"}}

    return CustdClient(base_url="http://localhost:8080", token="token", admin_transport=transport)


class MachineAccessRefusalTest(unittest.TestCase):
    def test_blocked_refusal_names_the_area_and_setting_on_every_route_family(self) -> None:
        body = fixture("machine-access-blocked-problem.json")
        calls = {
            "admin request": lambda c: c.admin.request("GET", "/reporting/packs"),
            "typed /api/v1 route": lambda c: c.admin.machine_access.get(),
            "reporting": lambda c: c.reporting.list_dashboards(),
        }
        for name, call in calls.items():
            with self.subTest(name), self.assertRaises(RequestError) as raised:
                call(client_answering(403, body))
            error = raised.exception
            self.assertEqual(403, error.status)
            self.assertEqual(MACHINE_ACCESS_BLOCKED_CODE, error.code)
            self.assertEqual("none", error.retryability)
            self.assertEqual("req-machine-access-1", error.trace_id)
            self.assertEqual(
                {"area": "reporting", "blockedBy": "machine", "companySlug": "acme", "clientId": "ci-reporting"},
                error.machine_access,
            )
            self.assertIn("blocked for client", str(error))

    def test_unavailable_refusal_is_a_bounded_retry_without_a_block(self) -> None:
        with self.assertRaises(RequestError) as raised:
            client_answering(503, fixture("machine-access-unavailable-problem.json")).admin.request("GET", "/x")
        error = raised.exception
        self.assertEqual(MACHINE_ACCESS_UNAVAILABLE_CODE, error.code)
        self.assertEqual("bounded", error.retryability)
        self.assertEqual("req-machine-access-2", error.trace_id)
        self.assertIsNone(error.machine_access)

    def test_flat_envelope_keeps_its_request_id(self) -> None:
        body = json.dumps({"error": "erasure refused", "code": "erasure_locked", "requestId": "req-flat-1"})
        with self.assertRaises(RequestError) as raised:
            client_answering(409, body).admin.request("POST", "/privacy/erasures")
        self.assertEqual("req-flat-1", raised.exception.request_id)
        self.assertEqual("erasure_locked", raised.exception.code)


class MetadataRecorderTest(unittest.TestCase):
    def test_recorder_captures_the_request_id_of_answers_and_refusals(self) -> None:
        policy = json.dumps({"companySlug": "acme", "allowSupportAutomation": True, "areas": None})
        with record_metadata() as recorder:
            self.assertEqual([], client_answering(200, policy).admin.machine_access.get()["areas"])
        self.assertEqual("req-header-1", recorder.request_id)

        with record_metadata() as refused, self.assertRaises(RequestError):
            client_answering(403, fixture("machine-access-blocked-problem.json")).admin.machine_access.get()
        self.assertEqual("req-header-1", refused.request_id)

    def test_nothing_is_recorded_outside_a_recorder(self) -> None:
        with record_metadata() as recorder:
            pass
        client_answering(200, "{}").admin.request("GET", "/x")
        self.assertEqual("", recorder.request_id)


if __name__ == "__main__":
    unittest.main()
