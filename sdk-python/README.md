# custd SDK (Python)

Ingestion client with retry, batching, and in-memory queueing.

## Compatibility

Version `1.0.0` targets the canonical ingest endpoint
`POST /api/v1/events`. The legacy `POST /v1/events` path is not supported.

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

## Dev smoke test

Requires the dev stack running with Hydra using JWT access tokens and ingest-api
configured with `AUTH_JWKS_URL`.

```bash
cd sdk-python
python3 scripts/smoke-dev.py
```

To run all SDK checks, use `mise exec -- just check` from the repository root.
