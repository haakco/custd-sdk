import json
import pathlib
import sys
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "src"))

from custd import (
    CustdClient,
    MemoryQueueStorage,
    RetryableError,
    ValidationError,
    create_dogfood_event,
    redacted_provisioned_producer,
    validate_event,
)


FIXTURE_ROOT = pathlib.Path(__file__).resolve().parents[2] / "contract-fixtures"


def load_fixture(name):
    with (FIXTURE_ROOT / name).open(encoding="utf-8") as handle:
        return json.load(handle)


class CapturingTransport:
    def __init__(self, statuses):
        self.statuses = list(statuses)
        self.calls = []

    def __call__(self, url, event, headers, timeout):
        self.calls.append({
            "url": url,
            "event": event,
            "headers": headers,
            "timeout": timeout,
        })
        return {"status": self.statuses.pop(0), "body": ""}


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

        client.track({**self.base_event, "eventUuid": "evt-1"})
        client.track({**self.base_event, "eventUuid": "evt-2"})

        self.assertEqual(1, len(transport.calls))
        self.assertEqual("http://localhost:8080/api/v1/events/batch", transport.calls[0]["url"])
        self.assertEqual(2, len(transport.calls[0]["event"]["events"]))

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
