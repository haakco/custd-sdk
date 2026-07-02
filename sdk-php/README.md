# custd SDK (PHP)

Ingestion client with retry, batching, and optional queue storage.

`FileQueueStore` is safe for a single PHP process per queue file path. Do not share the same queue file between concurrent workers; use one queue file per worker or `MemoryQueueStore` for request-local buffering.

## Compatibility

Release `v1.0.0` targets the canonical ingest endpoint
`POST /api/v1/events`. The legacy `POST /v1/events` path is not supported.
This SDK was not released against the legacy path, so there is no compatibility
alias or deprecation window.

## Install

`haakco/custd-sdk` is the root package of the public monorepo. We do **not** use
Packagist — install via a Composer VCS repository pointing at the GitHub repo:

```json
{
  "repositories": [
    { "type": "vcs", "url": "https://github.com/haakco/custd-sdk" }
  ],
  "require": {
    "haakco/custd-sdk": "^1.3"
  }
}
```

```bash
composer require haakco/custd-sdk:^1.3
```

The repo is public, so no Composer auth token is required.

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

Provisioned producer bundle (no manual OAuth mapping):

```php
$client = CustdClient::fromProvisionedProducer($credentials);
$client->track([
    "eventTypeSlug" => "order.completed",
    "schemaVersion" => "1.0.0",
    "companySlug" => $credentials["companySlug"],
    "context" => ["device" => ["type" => "server"]],
    "payload" => ["orderTotal" => 42],
]);
```

Use `CustdClient::redactedProvisionedProducer($credentials)` to show the bundle
on a dashboard without exposing the client secret.

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
    "strictPayloadKeys" => true,
]);
```

`strictPayloadKeys` throws if the dogfood sanitizer would drop payload keys such
as `token`, `password`, `signedUrl`, `environment`, or `sourceSystem`.

Awthy managed-audit producers should use the dedicated DTOs so event shape,
server context, and redaction payloads stay consistent across consumers:

```php
use HaakCo\Custd\Awthy\AwthyAuditEvent;
use HaakCo\Custd\Awthy\AwthyAuditRedactionRequest;

$client->track(AwthyAuditEvent::fromArray("acme", "store-123", [
    "storeHostnameHash" => "sha256:1111111111111111111111111111111111111111111111111111111111111111",
    "localAuditEventId" => "evt-local-1",
    "localAuditEventUuid" => "01957abc-0000-0000-0000-000000000001",
    "eventType" => "totp_enabled",
    "actor" => ["type" => "admin", "wordpressUserIdHash" => "sha256:2222222222222222222222222222222222222222222222222222222222222222", "anonymized" => true],
    "action" => "totp_enabled",
    "target" => ["type" => "wordpress_user", "referenceHash" => "sha256:2222222222222222222222222222222222222222222222222222222222222222", "anonymized" => true],
    "outcome" => "success",
    "source" => "wpauth",
    "reasonCategory" => "account_security",
    "stream" => "interactive",
    "severity" => "info",
    "occurredAt" => "2026-06-10T00:00:00Z",
])->toArray());

$client->flush();
```

Use `AwthyAuditEvent::managedReportingPayload()` for WooCommerce/business-flow
events. It enforces the 1.1 reporting allow-list for `flow`, `woocommerce`,
`actor`, `target`, `targets`, and `correlations` before the event leaves the
SDK.

```php
$client->track(AwthyAuditEvent::managedReportingPayload("acme", "store-123", [
    "storeHostnameHash" => "sha256:1111111111111111111111111111111111111111111111111111111111111111",
    "localAuditEventId" => "evt-local-1",
    "localAuditEventUuid" => "01957abc-0000-0000-0000-000000000001",
    "eventType" => "woocommerce_checkout_step",
    "actor" => ["type" => "customer", "wordpressUserIdHash" => "sha256:2222222222222222222222222222222222222222222222222222222222222222", "anonymized" => true],
    "action" => "checkout_payment_method_selected",
    "target" => ["type" => "woocommerce_checkout", "referenceHash" => "sha256:3333333333333333333333333333333333333333333333333333333333333333", "anonymized" => true],
    "outcome" => "success",
    "source" => "awthy_woocommerce",
    "reasonCategory" => "account_security",
    "stream" => "interactive",
    "severity" => "info",
    "occurredAt" => "2026-06-10T00:00:00Z",
    "flow" => ["family" => "secure_checkout", "step" => "payment_method_selected", "correlationHash" => "sha256:4444444444444444444444444444444444444444444444444444444444444444", "sequence" => 3],
    "woocommerce" => ["checkoutFlow" => "classic", "paymentGatewayHash" => "sha256:5555555555555555555555555555555555555555555555555555555555555555"],
])->toArray());
```

Use the redaction DTO for privacy-erasure propagation:

```php
$client->redactAwthyAuditEvents(AwthyAuditRedactionRequest::fromArray("store-123", [
    "redactionId" => "01957abc-0000-0000-0000-000000000099",
    "reason" => "privacy_erasure",
    "events" => [
        [
            "localAuditEventId" => "evt-local-1",
            "fields" => ["actor", "target", "sanitizedContext"],
        ],
    ],
]));
```

The SDK requires `companySlug` and rejects plaintext non-local Custd/token URLs.
Localhost HTTP is allowed for development.

### Deprecations

- **Synchronous retry backoff.** The retry loop sleeps in-thread by default. In
  request-time contexts that must not stall (e.g. a WordPress page hook), pass a
  non-blocking sleeper to opt out of in-thread backoff:

  ```php
  new CustdClient($baseUrl, $token, [
      "retry" => ["sleeper" => static fn (int $delayMs) => null],
  ]);
  ```

## WordPress Plugin

WordPress sites can use the first-party plugin under `wordpress-plugin/`. It
wraps this PHP SDK, registers redacted login/registration/post-status/heartbeat
events, and consumes the `CUSTD_WP_*` env block printed by the SDK setup helper.

Install the root SDK package through Composer VCS. The WordPress plugin is
included under `vendor/haakco/custd-sdk/wordpress-plugin/`:

```json
{
  "repositories": [
    {
      "type": "vcs",
      "url": "https://github.com/haakco/custd-sdk"
    }
  ],
  "require": {
    "haakco/custd-sdk": "^1.1"
  }
}
```

For Composer installs, symlink `vendor/haakco/custd-sdk/wordpress-plugin/` into
`wp-content/plugins/custd/` before activating the plugin so it can still reach
the root `vendor/autoload.php`. Raw GitHub source ZIPs are not standalone plugin
artifacts; ZIP installs need a built release artifact with Composer dependencies
included.

Authy/WPAuth managed audit reporting uses the dedicated Awthy DTOs above and
Authy's export subsystem. The generic WordPress plugin does not implement
Authy paid gates, audit export destinations, or privacy-erasure propagation.

## Browser Site Admin Helpers

Server-side admin code can use `$client->adminSites()` to create, list, get,
delete, and rotate browser tracker Sites. `create()` returns the public write
key once. `list()` and `get()` return Site metadata without the write key.
`rotateWriteKey()` returns the replacement write key once; update tracker config
and stop using the old key after rotation.

## Schema Admin Helpers

Use `$client->adminSchemas()` from setup code:

Supported feature parity and intentionally missing helpers are documented in the SDK
root README.

```php
$client->adminSchemas()->register([
    "eventTypeSlug" => "courib.delivery.created",
    "version" => "1.0.0",
    "jsonSchema" => ["type" => "object"],
]);

$client->adminSchemas()->createVersion("courib.delivery.created", [
    "version" => "1.1.0",
    "jsonSchema" => ["type" => "object"],
]);
```

## Dev smoke test (Hydra)

Requires dev stack running with Hydra using JWT access tokens and ingest-api configured with `AUTH_JWKS_URL`.

```bash
export AUTH_JWKS_URL="http://localhost:4444/.well-known/jwks.json"
cd sdk-php
composer run smoke:dev
```

The smoke test uses `scripts/dev-hydra-token.sh` and `scripts/dev-seed-core.sh` to create a dev OAuth client and seed core tables (company, device type, event type, schema).

To run all SDK checks, use `mise exec -- just check` from the repository root.
