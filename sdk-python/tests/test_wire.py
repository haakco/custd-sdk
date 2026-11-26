"""Behaviour shared by the typed operation clients: problem errors and the error relay's limits."""

import json
import pathlib
import sys
import unittest
from typing import Any

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "src"))

from custd import CustdClient, RequestError
from custd.ingest_operations import EFFECTIVE_COMPANY_HEADER, ErrorCaptureClient


class RecordingTransport:
    def __init__(self, status: int, body: object) -> None:
        self.status = status
        self.body = body
        self.calls: list[tuple[str, str]] = []
        self.headers: list[dict[str, str]] = []

    def __call__(self, method: str, url: str, payload: Any, headers: dict[str, str], timeout: float) -> dict[str, Any]:
        self.calls.append((method, url))
        self.headers.append(headers)
        return {"status": self.status, "body": self.body}


class WireTest(unittest.TestCase):
    def test_problem_answer_becomes_request_error_with_its_detail_and_code(self) -> None:
        problem = {"title": "Conflict", "status": 409, "detail": "plan already executed", "code": "plan_executed"}
        transport = RecordingTransport(409, json.dumps(problem))
        client = CustdClient(base_url="http://localhost:8080", token="token", admin_transport=transport)

        with self.assertRaises(RequestError) as raised:
            client.admin.rls.get_plan_proof("plan-1")

        self.assertEqual(409, raised.exception.status)
        self.assertEqual("plan_executed", raised.exception.code)
        self.assertIn("plan already executed", str(raised.exception))

    def test_error_capture_rejects_unsafe_metadata_without_sending(self) -> None:
        transport = RecordingTransport(200, "{}")
        capture = ErrorCaptureClient(
            "http://localhost:8080", write_key="site_pk_" + "k" * 32, environment="production", transport=transport
        )
        event: Any = {"platform": "javascript", "exceptionType": "TypeError", "mode": "handled"}

        result = capture.capture_event({**event, "frames": [{"filename": "/home/user/app.js", "lineno": 1}]})

        self.assertEqual("rejected", result["outcome"])
        self.assertEqual([], transport.calls)
        accepted = capture.capture_event({**event, "frames": [{"filename": "app.js", "lineno": 1}]})
        self.assertEqual({"outcome": "accepted", "status": 200}, accepted)

    def test_acting_company_names_the_cleanup_job_tenant_only_when_set(self) -> None:
        job = {"jobUuid": "job-1", "items": [], "approval": {}}
        calls = (
            lambda c: c.admin.ingest.list_cleanup_jobs(),
            lambda c: c.admin.ingest.get_cleanup_job("job-1"),
            lambda c: c.admin.ingest.get_cleanup_job_proof("job-1"),
            lambda c: c.admin.ingest.cancel_cleanup_job("job-1"),
        )
        for acting, expected in (("acme", "acme"), (None, None)):
            transport = RecordingTransport(200, json.dumps({**job, "jobs": []}))
            client = CustdClient(
                base_url="http://localhost:8080",
                token="token",
                admin_transport=transport,
                acting_company_slug=acting,
            )
            for call in calls:
                call(client)
            client.admin.rls.status()
            with self.subTest(acting=acting):
                sent = [headers.get(EFFECTIVE_COMPANY_HEADER) for headers in transport.headers]
                self.assertEqual([expected] * len(calls) + [None], sent)


    def test_acting_company_names_the_tenant_on_admin_routes_a_call_leaves_unnamed(self) -> None:
        body = json.dumps({"users": [], "requests": [], "domains": [], "dataSpaces": [], "entitlement": {}})
        transport = RecordingTransport(200, body)
        client = CustdClient(
            base_url="http://localhost:8080", token="token", admin_transport=transport, acting_company_slug="acme"
        )

        client.admin.users.list()
        client.admin.privacy_erasures.list()
        client.admin.privacy_erasures.list(company_slug="other")
        client.admin.site_domains.list()
        client.provisioning.data_spaces.list()

        self.assertEqual(
            [
                "http://localhost:8080/api/v1/admin/users?companySlug=acme",
                "http://localhost:8080/api/v1/admin/privacy/erasures?companySlug=acme",
                "http://localhost:8080/api/v1/admin/privacy/erasures?companySlug=other",
                "http://localhost:8080/api/v1/site-domains?companySlug=acme",
                "http://localhost:8080/api/v1/data-spaces",
            ],
            [url for _, url in transport.calls],
        )
        self.assertTrue(all(EFFECTIVE_COMPANY_HEADER not in headers for headers in transport.headers))

        download = RecordingTransport(200, b"[]")
        CustdClient(
            base_url="http://localhost:8080", token="token", admin_transport=download, acting_company_slug="acme"
        ).admin.audit.export_events()
        self.assertEqual(
            [("GET", "http://localhost:8080/api/v1/admin/audit/events/export?format=json&companySlug=acme")],
            download.calls,
        )


if __name__ == "__main__":
    unittest.main()
