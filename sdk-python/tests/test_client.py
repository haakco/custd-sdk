import http.server
import json
import pathlib
import sys
import tempfile
import threading
import unittest
import urllib.parse

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "src"))

from custd import (
    CustdClient,
    FileQueueStorage,
    MemoryQueueStorage,
    QueueFullError,
    RequestError,
    RetryableError,
    ValidationError,
    create_dogfood_event,
    redacted_provisioned_producer,
    validate_event,
)
from custd.client import fetch_oauth_token

FIXTURE_ROOT = pathlib.Path(__file__).resolve().parents[2] / "contract-fixtures"


def load_fixture(name):
    with (FIXTURE_ROOT / name).open(encoding="utf-8") as handle:
        return json.load(handle)


class CapturingTransport:
    def __init__(self, statuses, bodies=None):
        self.statuses = list(statuses)
        self.bodies = list(bodies) if bodies is not None else None
        self.calls = []

    def __call__(self, url, event, headers, timeout):
        self.calls.append({
            "url": url,
            "event": event,
            "headers": headers,
            "timeout": timeout,
        })
        body = self.bodies.pop(0) if self.bodies is not None else ""
        return {"status": self.statuses.pop(0), "body": body}


class CustdClientTest(unittest.TestCase):
    def setUp(self):
        self.base_event = load_fixture("valid-event.json")

    def test_validate_event_accepts_canonical_valid_fixture(self):
        validate_event(load_fixture("valid-event.json"))

    def test_validate_event_rejects_canonical_missing_device_type_fixture(self):
        with self.assertRaisesRegex(ValidationError, "context.device.type"):
            validate_event(load_fixture("invalid-missing-device-type.json"))

    def test_validate_event_rejects_canonical_missing_company_slug_fixture(self):
        with self.assertRaisesRegex(ValidationError, "companySlug"):
            validate_event(load_fixture("invalid-missing-company-slug.json"))

    def test_validate_event_accepts_canonical_dogfood_fixture(self):
        validate_event(load_fixture("valid-dogfood-event.json"))

    def test_validate_event_accepts_canonical_labelled_fixture(self):
        validate_event(load_fixture("valid-labelled-event.json"))

    def test_validate_event_rejects_invalid_label_shapes_and_server_fields(self):
        cases = [
            {f"app.key{i}": "ok" for i in range(17)},
            {"App Plan": "paid"},
            {"a." + "b" * 63: "paid"},
            {"custd.internal": "reserved"},
            {"app.plan": ""},
            {"app.plan": " paid "},
            {"app.plan": "é" * 65},
        ]
        for labels in cases:
            with self.subTest(labels=labels), self.assertRaisesRegex(ValidationError, "labels"):
                validate_event({**self.base_event, "labels": labels})
        with self.assertRaisesRegex(ValidationError, "labels"):
            validate_event({**self.base_event, "labels": None})
        with self.assertRaisesRegex(ValidationError, "server-owned"):
            validate_event({**self.base_event, "resolvedLabels": [], "vocabularyFingerprint": "server"})

    def test_create_dogfood_event_builds_canonical_shape(self):
        event = create_dogfood_event({
            "eventTypeSlug": "dogfood.producer.metric",
            "schemaVersion": "1.0.0",
            "companySlug": "haakco",
            "sourceSystem": "vorrent",
            "sourceCompany": "haakco",
            "environment": "production",
            "correlationId": "run-123",
            "payload": {
                "metric": "media_cache.queue_depth",
                "value": 7,
                "token": "secret",
                "sourceSystem": "wrong",
            },
        })

        self.assertEqual("haakco", event["companySlug"])
        self.assertEqual("server", event["context"]["device"]["type"])
        self.assertEqual("vorrent", event["payload"]["sourceSystem"])
        self.assertEqual("haakco", event["payload"]["sourceCompany"])
        self.assertEqual("production", event["payload"]["environment"])
        self.assertEqual("run-123", event["payload"]["correlationId"])
        self.assertEqual("media_cache.queue_depth", event["payload"]["metric"])
        self.assertNotIn("token", event["payload"])

    def test_ingest_event_generates_missing_envelope_identities_before_sending(self):
        transport = CapturingTransport([202])
        client = CustdClient(
            base_url="http://localhost:8080",
            token="token",
            retry={"max_attempts": 1},
            transport=transport,
        )
        event = dict(self.base_event)
        event.pop("eventUuid")
        event.pop("sessionId")
        event.pop("anonymousId")

        client.ingest_event(event)

        sent = transport.calls[0]["event"]
        self.assertEqual("http://localhost:8080/api/v1/events", transport.calls[0]["url"])
        self.assertEqual("Bearer token", transport.calls[0]["headers"]["Authorization"])
        self.assertRegex(sent["eventUuid"], r"^[0-9a-f-]{36}$")
        self.assertRegex(sent["sessionId"], r"^[0-9a-f-]{36}$")
        self.assertRegex(sent["anonymousId"], r"^[0-9a-f-]{36}$")

    def test_retries_retryable_statuses(self):
        transport = CapturingTransport([503, 202])
        client = CustdClient(
            base_url="http://localhost:8080",
            token="token",
            retry={"max_attempts": 2, "base_delay_ms": 0, "max_delay_ms": 0, "jitter": 0},
            transport=transport,
        )

        client.ingest_event(self.base_event)

        self.assertEqual(2, len(transport.calls))

    def test_track_flushes_when_max_batch_size_is_reached(self):
        transport = CapturingTransport([202])
        client = CustdClient(
            base_url="http://localhost:8080",
            token="token",
            batch={"max_batch_size": 2},
            queue={"enabled": True},
            retry={"max_attempts": 1},
            transport=transport,
        )

        client.track({**self.base_event, "eventUuid": "evt-1", "labels": {"app.plan": "paid"}})
        client.track({**self.base_event, "eventUuid": "evt-2"})

        self.assertEqual(1, len(transport.calls))
        self.assertEqual("http://localhost:8080/api/v1/events/batch", transport.calls[0]["url"])
        self.assertEqual(2, len(transport.calls[0]["event"]["events"]))
        self.assertEqual({"app.plan": "paid"}, transport.calls[0]["event"]["events"][0]["labels"])

    def test_flush_requeues_and_reports_failed_send(self):
        storage = MemoryQueueStorage()
        client = CustdClient(
            base_url="http://localhost:8080",
            token="token",
            batch={"max_batch_size": 10},
            queue={"enabled": True, "storage": storage},
            retry={"max_attempts": 1},
            transport=CapturingTransport([503]),
        )

        client.track(self.base_event)

        with self.assertRaisesRegex(RetryableError, "503"):
            client.flush()

        queued = storage.load()
        self.assertEqual(1, len(queued))
        self.assertEqual(self.base_event["eventUuid"], queued[0]["eventUuid"])

    def test_file_queue_restart_retains_stable_event_uuid(self):
        with tempfile.TemporaryDirectory() as directory:
            path = pathlib.Path(directory) / "events.json"
            storage = FileQueueStorage(path)
            failed_transport = CapturingTransport([503])
            client = CustdClient(
                base_url="http://localhost:8080",
                token="token",
                batch={"max_batch_size": 10},
                queue={"enabled": True, "storage": storage},
                retry={"max_attempts": 1},
                transport=failed_transport,
            )
            event = dict(self.base_event)
            event.pop("eventUuid")
            client.track(event)

            with self.assertRaises(RetryableError):
                client.flush()

            self.assertEqual(0o600, path.stat().st_mode & 0o777)
            queued = storage.load()
            stable_uuid = queued[0]["eventUuid"]
            restarted_transport = CapturingTransport([202])
            restarted = CustdClient(
                base_url="http://localhost:8080",
                token="token",
                batch={"max_batch_size": 10},
                queue={"enabled": True, "storage": FileQueueStorage(path)},
                retry={"max_attempts": 1},
                transport=restarted_transport,
            )

            restarted.flush()

            self.assertEqual(stable_uuid, restarted_transport.calls[0]["event"]["events"][0]["eventUuid"])
            self.assertEqual([], storage.load())

    def test_file_queue_retains_poison_event_after_repeated_rejection(self):
        with tempfile.TemporaryDirectory() as directory:
            path = pathlib.Path(directory) / "events.json"
            poison_uuid = "evt-poison"
            body = json.dumps({
                "results": [{
                    "eventUuid": poison_uuid,
                    "success": False,
                    "status": 422,
                    "error": "invalid payload",
                }],
            })
            transport = CapturingTransport([202, 202], [body, body])
            client = CustdClient(
                base_url="http://localhost:8080",
                token="token",
                batch={"max_batch_size": 10},
                queue={"enabled": True, "storage": FileQueueStorage(path)},
                retry={"max_attempts": 1},
                transport=transport,
            )
            client.track({**self.base_event, "eventUuid": poison_uuid})

            with self.assertRaises(RequestError):
                client.flush()
            with self.assertRaises(RequestError):
                client.flush()

            queued = FileQueueStorage(path).load()
            self.assertEqual([poison_uuid], [event["eventUuid"] for event in queued])
            self.assertEqual([poison_uuid, poison_uuid], [
                call["event"]["events"][0]["eventUuid"] for call in transport.calls
            ])

    def test_file_queue_selectively_acknowledges_partial_batch_results(self):
        with tempfile.TemporaryDirectory() as directory:
            path = pathlib.Path(directory) / "events.json"
            body = json.dumps({
                "success": False,
                "results": [
                    {"eventUuid": "evt-ok", "success": True, "status": 202},
                    {"eventUuid": "evt-bad", "success": False, "status": 422, "error": "poison"},
                ],
            })
            transport = CapturingTransport([202], [body])
            storage = FileQueueStorage(path)
            client = CustdClient(
                base_url="http://localhost:8080",
                token="token",
                batch={"max_batch_size": 10},
                queue={"enabled": True, "storage": storage},
                retry={"max_attempts": 1},
                transport=transport,
            )
            client.track({**self.base_event, "eventUuid": "evt-ok"})
            client.track({**self.base_event, "eventUuid": "evt-bad"})

            with self.assertRaisesRegex(RequestError, "evt-bad"):
                client.flush()

            self.assertEqual(["evt-bad"], [event["eventUuid"] for event in storage.load()])

    def test_file_queue_rejects_events_that_exceed_disk_bound(self):
        with tempfile.TemporaryDirectory() as directory:
            path = pathlib.Path(directory) / "events.json"
            storage = FileQueueStorage(path, max_bytes=16)

            with self.assertRaises(QueueFullError):
                storage.save([self.base_event])

            self.assertFalse(path.exists())

    def test_queue_count_bound_fails_without_dropping_oldest_event(self):
        with tempfile.TemporaryDirectory() as directory:
            path = pathlib.Path(directory) / "events.json"
            storage = FileQueueStorage(path)
            client = CustdClient(
                base_url="http://localhost:8080",
                token="token",
                batch={"max_batch_size": 10},
                queue={"enabled": True, "storage": storage, "max_queue_size": 1},
                retry={"max_attempts": 1},
                transport=CapturingTransport([202]),
            )
            client.track({**self.base_event, "eventUuid": "evt-existing"})

            with self.assertRaisesRegex(QueueFullError, "max_queue_size"):
                client.track({**self.base_event, "eventUuid": "evt-new"})

            self.assertEqual(["evt-existing"], [event["eventUuid"] for event in client.queue])
            self.assertEqual(["evt-existing"], [event["eventUuid"] for event in storage.load()])

    def test_uses_oauth_producer_credentials_for_bearer_auth(self):
        token_requests = []

        def token_transport(url, form, timeout):
            token_requests.append({"url": url, "form": form, "timeout": timeout})
            return {"access_token": "oauth-token", "expires_in": 300}

        transport = CapturingTransport([202])
        client = CustdClient(
            base_url="http://localhost:8080",
            oauth={
                "client_id": "producer",
                "client_secret": "secret",
                "token_url": "http://localhost:4444/oauth2/token",
                "audience": "custd",
                "scopes": ["events.write"],
                "transport": token_transport,
            },
            retry={"max_attempts": 1},
            transport=transport,
        )

        client.ingest_event(self.base_event)

        self.assertEqual("http://localhost:4444/oauth2/token", token_requests[0]["url"])
        self.assertEqual("client_credentials", token_requests[0]["form"]["grant_type"])
        self.assertEqual("Bearer oauth-token", transport.calls[0]["headers"]["Authorization"])

    def test_default_oauth_transport_uses_basic_auth(self):
        captured = {}

        class Handler(http.server.BaseHTTPRequestHandler):
            def do_POST(self):  # noqa: N802
                captured["authorization"] = self.headers.get("Authorization")
                length = int(self.headers.get("Content-Length", "0"))
                captured["body"] = self.rfile.read(length).decode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(b'{"access_token":"token"}')

            def log_message(self, *_args):
                return

        server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            result = fetch_oauth_token(
                f"http://127.0.0.1:{server.server_port}/oauth2/token",
                {"client_id": "client", "client_secret": "secret", "scope": "events.write"},
                2,
            )
        finally:
            server.shutdown()
            thread.join()
            server.server_close()

        self.assertEqual({"access_token": "token"}, result)
        self.assertEqual("Basic Y2xpZW50OnNlY3JldA==", captured["authorization"])
        self.assertEqual("scope=events.write", urllib.parse.unquote(captured["body"]))

    def test_rejects_plaintext_non_local_urls(self):
        with self.assertRaisesRegex(ValueError, "base_url must use https"):
            CustdClient(base_url="http://custd.example.com", token="token")

        with self.assertRaisesRegex(ValueError, "token_url must use https"):
            CustdClient(
                base_url="https://custd.example.com",
                oauth={
                    "client_id": "producer",
                    "client_secret": "secret",
                    "token_url": "http://auth.example.com/oauth2/token",
                },
            )

    def test_allows_plaintext_localhost_urls(self):
        CustdClient(
            base_url="http://localhost:8080",
            oauth={
                "client_id": "producer",
                "client_secret": "secret",
                "token_url": "http://127.0.0.1:4444/oauth2/token",
                "transport": lambda url, form, timeout: {"access_token": "token", "expires_in": 300},
            },
        )

    def test_allows_plaintext_docker_host_gateway_urls(self):
        CustdClient(
            base_url="http://host.docker.internal:4456",
            oauth={
                "client_id": "producer",
                "client_secret": "secret",
                "token_url": "http://host.docker.internal:4444/oauth2/token",
                "transport": lambda url, form, timeout: {"access_token": "token", "expires_in": 300},
            },
        )


class RfcProblemErrorTest(unittest.TestCase):
    def setUp(self):
        self.base_event = load_fixture("valid-event.json")

    def _client(self, statuses, bodies):
        return CustdClient(
            base_url="http://localhost:8080",
            token="token",
            retry={"max_attempts": 1},
            transport=CapturingTransport(statuses, bodies),
        )

    def test_single_send_surfaces_rfc9457_problem_detail(self):
        problem = json.dumps({
            "type": "validation-failed",
            "title": "Validation Failed",
            "status": 400,
            "detail": "schemaVersion is required",
        })
        client = self._client([400], [problem])

        with self.assertRaises(RequestError) as ctx:
            client.ingest_event(self.base_event)

        message = str(ctx.exception)
        self.assertIn("Validation Failed", message)
        self.assertIn("schemaVersion is required", message)
        self.assertIn("400", message)

    def test_single_send_handles_problem_without_optional_fields(self):
        problem = json.dumps({"type": "about:blank", "title": "Bad Request", "status": 400})
        client = self._client([400], [problem])

        with self.assertRaisesRegex(RequestError, "Bad Request"):
            client.ingest_event(self.base_event)

    def test_single_send_falls_back_when_body_is_not_a_problem(self):
        client = self._client([500], ["upstream exploded"])

        with self.assertRaisesRegex(RetryableError, "500"):
            client.ingest_event(self.base_event)

    def test_batch_surfaces_failed_per_event_result(self):
        body = json.dumps({
            "success": True,
            "results": [
                {"eventUuid": "evt-ok", "success": True, "status": 202},
                {
                    "eventUuid": "evt-bad",
                    "success": False,
                    "status": 422,
                    "error": {
                        "type": "schema-mismatch",
                        "title": "Schema Mismatch",
                        "status": 422,
                        "detail": "payload.value must be a number",
                    },
                },
            ],
        })
        client = CustdClient(
            base_url="http://localhost:8080",
            token="token",
            batch={"max_batch_size": 10},
            queue={"enabled": True},
            retry={"max_attempts": 1},
            transport=CapturingTransport([202], [body]),
        )
        client.track({**self.base_event, "eventUuid": "evt-ok"})
        client.track({**self.base_event, "eventUuid": "evt-bad"})

        with self.assertRaises(RequestError) as ctx:
            client.flush()

        message = str(ctx.exception)
        self.assertIn("evt-bad", message)
        self.assertIn("422", message)
        self.assertIn("Schema Mismatch", message)
        self.assertNotIn("evt-ok", message)

    def test_batch_accepts_snake_case_event_uuid(self):
        body = json.dumps({
            "results": [
                {"event_uuid": "evt-bad", "success": False, "status": 400, "error": "boom"},
            ],
        })
        client = CustdClient(
            base_url="http://localhost:8080",
            token="token",
            batch={"max_batch_size": 10},
            queue={"enabled": True},
            retry={"max_attempts": 1},
            transport=CapturingTransport([202], [body]),
        )
        client.track(self.base_event)

        with self.assertRaisesRegex(RequestError, "evt-bad"):
            client.flush()

    def test_batch_all_success_does_not_raise(self):
        body = json.dumps({
            "success": True,
            "results": [{"eventUuid": self.base_event["eventUuid"], "success": True, "status": 202}],
        })
        client = CustdClient(
            base_url="http://localhost:8080",
            token="token",
            batch={"max_batch_size": 10},
            queue={"enabled": True},
            retry={"max_attempts": 1},
            transport=CapturingTransport([202], [body]),
        )
        client.track(self.base_event)
        client.flush()  # must not raise

    def test_batch_http_error_surfaces_rfc9457_problem(self):
        problem = json.dumps({
            "type": "unauthorized",
            "title": "Unauthorized",
            "status": 401,
            "detail": "token expired",
        })
        client = CustdClient(
            base_url="http://localhost:8080",
            token="token",
            batch={"max_batch_size": 10},
            queue={"enabled": True},
            retry={"max_attempts": 1},
            transport=CapturingTransport([401], [problem]),
        )
        client.track(self.base_event)

        with self.assertRaises(RequestError) as ctx:
            client.flush()

        message = str(ctx.exception)
        self.assertIn("Unauthorized", message)
        self.assertIn("token expired", message)


class FromProvisionedProducerTest(unittest.TestCase):
    def test_creates_client_from_bundle_without_manual_mapping(self):
        credentials = load_fixture("valid-provisioned-producer.json")
        client = CustdClient.from_provisioned_producer(credentials)
        self.assertIsInstance(client, CustdClient)

    def test_rejects_bundle_missing_client_secret(self):
        credentials = load_fixture("invalid-provisioned-producer-missing-secret.json")
        with self.assertRaisesRegex(ValueError, "client secret"):
            CustdClient.from_provisioned_producer(credentials)

    def test_redacts_secret_for_dashboards(self):
        credentials = load_fixture("valid-provisioned-producer.json")
        redacted = redacted_provisioned_producer(credentials)
        self.assertEqual(redacted["clientId"], credentials["clientId"])
        self.assertNotIn("clientSecret", redacted)
        self.assertNotIn(credentials["clientSecret"], json.dumps(redacted))


if __name__ == "__main__":
    unittest.main()
