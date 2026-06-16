# custd SDK (Python)

Ingestion client with retry, batching, and in-memory queueing.

## Compatibility

Version `1.0.0` targets the canonical ingest endpoint
`POST /api/v1/events`. The legacy `POST /v1/events` path is not supported.

## Install

Install the `custd-sdk` package from the public GitHub repo (subdir; not on
PyPI):

```bash
pip install "custd-sdk @ git+https://github.com/haakco/custd-sdk.git@v1.3.1#subdirectory=sdk-python"
```

Pin `@v1.3.0` (or a later tag) to the release you want.

## Usage

```python
from custd import CustdClient, create_dogfood_event

client = CustdClient(
    base_url="http://localhost:8087",
    oauth={
        "client_id": "producer-client",
        "client_secret": "<secret>",
        "token_url": "http://localhost:4444/oauth2/token",
        "audience": "custd",
        "scopes": ["events.write"],
    },
    retry={"max_attempts": 3},
    batch={"max_batch_size": 25},
    queue={"enabled": True, "max_queue_size": 1000},
)

client.track({
    "eventTypeSlug": "page-view",
    "schemaVersion": "1.0.0",
    "timestamp": "2026-01-23T12:00:00.000Z",
    "companySlug": "acme",
    "context": {
        "page": {"url": "https://example.com"},
        "device": {"type": "desktop"},
    },
    "payload": {"example": True},
})

client.flush()
```

When Custd provisions a producer it returns a flat credential bundle. Pass it
straight to `from_provisioned_producer` — no OAuth wiring required:

```python
from custd import CustdClient

client = CustdClient.from_provisioned_producer(credentials)
client.track({
    "eventTypeSlug": "order.completed",
    "schemaVersion": "1.0.0",
    "companySlug": credentials["companySlug"],
    "context": {"device": {"type": "server"}},
    "payload": {"orderTotal": 42},
})
```

Use `redacted_provisioned_producer(credentials)` to show the bundle on a
dashboard without exposing the client secret.

The client also accepts `token="<token>"` for existing static-token
integrations. Producer clients should prefer the OAuth2 `client_credentials`
config above so token refresh stays inside the SDK.

Dogfood producers can use `create_dogfood_event`:

```python
event = create_dogfood_event({
    "eventTypeSlug": "dogfood.producer.metric",
    "schemaVersion": "1.0.0",
    "companySlug": "haakco",
    "sourceSystem": "vorrent",
    "sourceCompany": "haakco",
    "environment": "production",
    "correlationId": "run-123",
    "payload": {"metric": "media_cache.queue_depth", "value": 7},
})
```

The SDK requires `companySlug` and rejects plaintext non-local Custd/token URLs.
Localhost HTTP is allowed for development.

## Browser Site Admin Helpers

Server-side admin code can use `client.admin.sites` to create, list, get,
delete, and rotate browser tracker Sites. `create` returns the public write key
once. `list` and `get` return Site metadata without the write key.
`rotate_write_key` returns the replacement write key once; update tracker config
and stop using the old key after rotation.

## Dev smoke test

Requires the dev stack running with Hydra using JWT access tokens and ingest-api
configured with `AUTH_JWKS_URL`.

```bash
cd sdk-python
python3 scripts/smoke-dev.py
```

To run all SDK checks, use `mise exec -- just check` from the repository root.
