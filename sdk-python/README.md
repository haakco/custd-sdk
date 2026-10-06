# custd SDK (Python)

Ingestion client with retry, batching, and bounded queueing.

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
from custd import CustdClient, FileQueueStorage, create_dogfood_event

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
    queue={
        "enabled": True,
        "storage": FileQueueStorage("/var/lib/custd/events.json", max_bytes=10 * 1024 * 1024),
        "max_queue_size": 1000,
    },
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

`MemoryQueueStorage` is the default. `FileQueueStorage` writes an atomic,
private JSON replacement so queued event UUIDs survive process restart. Its
`max_bytes` bound raises `QueueFullError` instead of silently losing events;
the client raises the same error when `max_queue_size` is reached, preserving
the queued events for an explicit backpressure decision. Use one queue file
per process and protect the file as it contains event payloads.

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

## Schema Admin Helpers

Use `client.admin.schemas` for setup-time schema registration:

```python
from custd import CustdClient

client = CustdClient(
    base_url="http://localhost:8087",
    oauth={
        "client_id": "producer-client",
        "client_secret": "<secret>",
        "token_url": "http://localhost:4444/oauth2/token",
        "audience": "custd",
        "scopes": ["events.write", "schemas.write"],
    },
)

client.admin.schemas.list()
client.admin.schemas.get("page-view")
client.admin.schemas.register({
    "eventTypeSlug": "checkout.started",
    "version": "1.0.0",
    "jsonSchema": {"type": "object"},
})
client.admin.schemas.create_version("checkout.started", {
    "version": "1.1.0",
    "jsonSchema": {"type": "object"},
})
```

Supported feature parity and intentionally missing helpers are documented in the SDK
root README.

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

## Lifecycle administration

The Python SDK exposes typed admin clients for the five lifecycle
namespaces. Forward-only: no deprecated aliases.

```python
admin = client.admin()

# Tenant storage: list/create/get/revoke.
loc = admin.tenant_storage.create({
    "tenantSlug": "acme",
    "clientLocation": "s3://acme-prod-warehouse/events/",
})

# Subject exports: full request lifecycle.
exp = admin.subject_exports.create({
    "tenantSlug": "acme",
    "subject": {"type": "userUuid", "value": "01J5..."},
    "scope": "portability",
    "idempotencyKey": "acme-2026-07-31",
})

# Physical erasures: NO cancel/retry.
force = admin.privacy_erasures.force("pe_01J5...")

# Retention policies: list/get/upsert/delete + preview/apply/list_runs.
runs = admin.retention.list_runs("acme")

# Offboarding: full request lifecycle + schedules.
sched = admin.offboarding.schedule({
    "tenantSlug": "acme",
    "effectiveAt": "2026-12-31T00:00:00Z",
    "gracePeriodDays": 7,
    "reason": "contract_end",
})
```

## Time-plan administration

`client.admin.time_plans` exposes typed `TimePlan*` dataclasses for plan
drafts/revisions, previews, publication and retirement, runs, commands,
history, and annotation correction/redaction. Every call takes a company slug;
the server remains authoritative for allocations and command results.

```python
from custd import TimePlanDefinition, TimePlanDefinitionBlock, TimePlanDraftRequest

definition = TimePlanDefinition(
    horizonMs=60_000,
    blocks=[TimePlanDefinitionBlock(
        uuid="block-1", semanticKey="focus", title="Focus", basis="absolute"
    )],
)

preview = client.admin.time_plans.preview("acme", definition)
plan = client.admin.time_plans.create(
    "acme", TimePlanDraftRequest(planKey="focus", name="Focus", definition=definition)
)
```

The typed clients are available in `v1.8.25` and later.

## Usage reporting

`client.admin.usage` reads the attributed usage for the authenticated tenant
through `GET /api/v1/admin/usage/me`. The tenant comes from the credential, so
the call never names a company slug. The system-admin `/usage` and `/usage/export`
surfaces are deliberately not exposed.

```python
report = client.admin.usage.get({
    "meterSlug": "events.ingested",
    "start": "2026-09-01T00:00:00Z",
    "end": "2026-10-01T00:00:00Z",
    "limit": 200,
})
```

`report["totals"]` carries the per-meter totals and `report["rows"]` the
per-window detail. `containsProvisional` and `containsIncomplete` are the
server's own assessment, so a caller deciding whether a number is settled reads
them rather than assuming every row is final. An omitted `start`/`end` uses the
service default (the trailing 30 days) and an omitted `limit` uses
`USAGE_DEFAULT_LIMIT`; a limit outside `1..USAGE_MAX_LIMIT` raises before a
request is sent.

## Analytics range query

`client.analytics.query_range` reads a tenant's own events across an inclusive
date range of at most `ANALYTICS_MAX_RANGE_DAYS` days, with
`groupBy="day"`. `buckets` carries each day's `count`/`source`/`complete` and
`rows` the capped detail. The per-day completeness is the server's assessment
and is surfaced unchanged.

```python
response = client.analytics.query_range({
    "from": "2026-02-23",
    "to": "2026-05-23",
    "eventType": "page-view",
    "limit": 10000,
    "source": "auto",
    "groupBy": "day",
})
```

SDKs never log signed URLs, raw personal data, export bytes, or
subject identifiers outside opaque IDs.
