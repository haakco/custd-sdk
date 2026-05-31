# custd SDK (Python)

Ingestion client with retry, batching, and in-memory queueing.

## Compatibility

Version `1.0.0` targets the canonical ingest endpoint
`POST /api/v1/events`. The legacy `POST /v1/events` path is not supported.

## Usage

```python
from custd import CustdClient

client = CustdClient(
    base_url="http://localhost:8087",
    token="<token>",
    retry={"max_attempts": 3},
    batch={"max_batch_size": 25},
    queue={"enabled": True, "max_queue_size": 1000},
)

client.track({
    "eventTypeSlug": "page-view",
    "schemaVersion": "1.0.0",
    "timestamp": "2026-01-23T12:00:00.000Z",
    "context": {
        "page": {"url": "https://example.com"},
        "device": {"type": "desktop"},
    },
    "payload": {"example": True},
})

client.flush()
```

## Dev smoke test

Requires the dev stack running with Hydra using JWT access tokens and ingest-api
configured with `AUTH_JWKS_URL`.

```bash
cd packages/sdk-python
python3 scripts/smoke-dev.py
```

To run all SDK live smoke tests, use `just test-sdk-e2e`.
