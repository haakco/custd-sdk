# custd SDK (PHP)

Ingestion client with retry, batching, and optional queue storage.

`FileQueueStore` is safe for a single PHP process per queue file path. Do not share the same queue file between concurrent workers; use one queue file per worker or `MemoryQueueStore` for request-local buffering.

## Compatibility

Release `v1.0.0` targets the canonical ingest endpoint
`POST /api/v1/events`. The legacy `POST /v1/events` path is not supported.
This SDK was not released against the legacy path, so there is no compatibility
alias or deprecation window.

## Install

```bash
composer require haakco/custd-sdk
```

## Usage

```php
<?php

use HaakCo\Custd\CustdClient;
use HaakCo\Custd\FileQueueStore;

$client = new CustdClient("http://localhost:8087", "<token>", [
    "retry" => ["max_attempts" => 3],
    "batch" => ["max_batch_size" => 25],
    "queue" => [
        "enabled" => true,
        "store" => new FileQueueStore(__DIR__ . "/custd-queue.json"),
    ],
]);

$client->track([
    "eventUuid" => "...",
    "eventTypeSlug" => "page-view",
    "schemaVersion" => "1.0.0",
    "timestamp" => gmdate(DATE_RFC3339),
    "sessionId" => "...",
    "anonymousId" => "...",
    "companySlug" => "acme",
    "context" => [
        "page" => ["url" => "https://example.com"],
        "device" => ["type" => "desktop"],
        "locale" => "en-US",
        "timezone" => "UTC",
        "ip" => "127.0.0.1",
    ],
    "payload" => ["example" => true],
]);

$client->flush();
```

OAuth2 producer client:

```php
$client = new CustdClient("http://localhost:8087", null, [
    "oauth" => [
        "client_id" => "producer-client",
        "client_secret" => getenv("CUSTD_CLIENT_SECRET"),
        "token_url" => "http://localhost:4444/oauth2/token",
        "audience" => "custd",
        "scopes" => ["events.write"],
    ],
]);
```

Dogfood producers can use `CustdClient::createDogfoodEvent`:

```php
$event = CustdClient::createDogfoodEvent([
    "eventTypeSlug" => "dogfood.producer.metric",
    "schemaVersion" => "1.0.0",
    "companySlug" => "haakco",
    "sourceSystem" => "vorrent",
    "sourceCompany" => "haakco",
    "environment" => "production",
    "correlationId" => "run-123",
    "payload" => ["metric" => "media_cache.queue_depth", "value" => 7],
]);
```

The SDK requires `companySlug` and rejects plaintext non-local Custd/token URLs.
Localhost HTTP is allowed for development.

## Dev smoke test (Hydra)

Requires dev stack running with Hydra using JWT access tokens and ingest-api configured with `AUTH_JWKS_URL`.

```bash
export AUTH_JWKS_URL="http://localhost:4444/.well-known/jwks.json"
cd sdk-php
composer run smoke:dev
```

The smoke test uses `scripts/dev-hydra-token.sh` and `scripts/dev-seed-core.sh` to create a dev OAuth client and seed core tables (company, device type, event type, schema).

To run all SDK checks, use `mise exec -- just check` from the repository root.
