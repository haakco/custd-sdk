# Custd SDK

Public SDKs for sending events to Custd.

## Packages

- `sdk-go` — Go ingestion, admin, OAuth2 producer auth, batching, retry, queueing, and dogfood helpers.
- `sdk-js` — TypeScript ingestion SDK and browser tracker.
- `sdk-python` — Python ingestion SDK.
- `sdk-php` — PHP ingestion SDK.
- `laravel-package` — Laravel provider, facade, config, and queue job wrapping the PHP SDK.
- `wordpress-plugin` — WordPress plugin package wrapping the PHP SDK for product/activity hooks.
- `contract-fixtures` — shared event fixtures used by every SDK test suite.

## Rule

SDK functionality belongs in this repository. Product repositories must consume released SDK versions instead of creating one-off clients or committing local filesystem replacements.

Local path replacements are allowed only for uncommitted experiments while actively changing the SDK. They must not be committed to downstream projects.

## Validation

Install the pinned local toolchain:

```bash
mise install
```

```bash
mise exec -- just check
```

Run a single SDK:

```bash
mise exec -- just test-go
mise exec -- just test-js
mise exec -- just test-python
mise exec -- just test-php
```

## Go Usage

```go
client := custd.NewClient(&custd.ClientConfig{
    BaseURL:      "https://ingest.example.com",
    ClientID:     "producer-client",
    ClientSecret: os.Getenv("CUSTD_CLIENT_SECRET"),
    TokenURL:     "https://auth.example.com/oauth2/token",
    Audience:     "custd",
    Scopes:       []string{"events.write"},
})
```

Go module:

```bash
go get github.com/haakco/custd-sdk/sdk-go@latest
```

## Provisioned Producer Quickstart

When Custd provisions a producer, it returns a flat credential bundle. Pass it
straight to the SDK — no Hydra or OAuth wiring required.

```ts
const client = CustdClient.fromProvisionedProducer(credentials);
await client.track({
  eventTypeSlug: "order.completed",
  schemaVersion: "1.0.0",
  companySlug: credentials.companySlug,
  context: { device: { type: "server" } },
  payload: { orderTotal: 42 }
});
```

Equivalent entry points per SDK:

- Go: `custd.NewClientFromProvisionedProducer(creds)`
- TypeScript: `CustdClient.fromProvisionedProducer(credentials)`
- Python: `CustdClient.from_provisioned_producer(credentials)`
- PHP: `CustdClient::fromProvisionedProducer($credentials)`

To display the bundle on a dashboard without leaking the secret, use the
matching redaction helper (`RedactedProvisionedProducer` /
`redactedProvisionedProducer` / `redacted_provisioned_producer` /
`redactedProvisionedProducer`).

## Producer Setup Helper

Use the SDK-owned setup CLI to create a tenant-bound OAuth2 producer client and
print the env vars each consumer needs. The CLI calls Custd admin APIs through
the Go SDK; it does not maintain a separate HTTP client.

```bash
go run github.com/haakco/custd-sdk/sdk-go/cmd/custd-sdk-setup@latest \
  --base-url=https://custd.k8.haak.co \
  --admin-url=https://custd.k8.haak.co \
  --admin-token="$CUSTD_ADMIN_TOKEN" \
  --token-url=https://auth.k8.haak.co/oauth2/token \
  --tenant=vorrent \
  --company-name="Vorrent" \
  --client-id=vorrent-media-cache \
  --scope=events.write \
  --environment=production \
  --env-prefix=VORRENT_MEDIA_CACHE
```

Output includes env blocks for:

- Generic SDK consumers.
- Go / TypeScript / Python / PHP SDK usage.
- Laravel package config.
- WordPress plugin config.

Required admin input:

- `--admin-token` or `CUSTD_ADMIN_TOKEN`: bearer token with permission to create
  tenants and OAuth clients.
- `--base-url`: Custd API base URL used by producers.
- `--token-url`: OAuth2 token endpoint producers use for `client_credentials`.
- `--tenant`: tenant/company slug.
- `--client-id`: producer OAuth client ID.

## Browser Site Admin Helpers

Each SDK exposes admin Site helpers for browser tracker setup:

- create: `POST /api/v1/admin/sites`
- list: `GET /api/v1/admin/sites`
- get: `GET /api/v1/admin/sites/{siteUuid}`
- delete: `DELETE /api/v1/admin/sites/{siteUuid}`
- rotate write key: `POST /api/v1/admin/sites/{siteUuid}/rotate-write-key`

`create` returns the public browser write key once. `list` and `get` return
site metadata without the write key. `rotate write key` returns the replacement
write key once; after rotation, update browser tracker config and stop using the
old key.

## Schema Admin Helpers

Go, TypeScript, and PHP expose schema admin helpers so producer repositories do
not need raw `curl` scripts for `POST /api/v1/admin/schemas`:

- list: `GET /api/v1/admin/schemas`
- get: `GET /api/v1/admin/schemas/{eventTypeSlug}`
- register: `POST /api/v1/admin/schemas`
- create version: `POST /api/v1/admin/schemas/{eventTypeSlug}/versions`

The setup CLI can also register a directory of schema JSON files after producer
credential creation:

```bash
custd-sdk-setup --register-schemas ./infra/custd/schemas ...
```

## WordPress Plugin Usage

Install the root SDK package through Composer VCS; the plugin lives under
`vendor/haakco/custd-sdk/wordpress-plugin/`:

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

Create producer credentials with the SDK-owned setup helper and use the
generated `CUSTD_WP_*` block:

```bash
go run github.com/haakco/custd-sdk/sdk-go/cmd/custd-sdk-setup@latest \
  --base-url=https://custd.k8.haak.co \
  --admin-url=https://custd.k8.haak.co \
  --admin-token="$CUSTD_ADMIN_TOKEN" \
  --token-url=https://auth.k8.haak.co/oauth2/token \
  --tenant=my-wordpress-site \
  --company-name="My WordPress Site" \
  --client-id=my-wordpress-site \
  --scope=events.write \
  --environment=production
```

The plugin records redacted WordPress login, registration, post-status, and
heartbeat events through the shared PHP SDK. Authy/WPAuth managed audit export
uses the SDK Awthy DTOs and Authy's export subsystem instead of this generic
plugin path.

## Laravel Usage

Install the SDK package with Composer:

```bash
composer require haakco/custd-sdk
```

Publish the Laravel config:

```bash
php artisan vendor:publish --tag=custd-config
```

Create producer credentials with the SDK-owned setup helper:

```bash
go run github.com/haakco/custd-sdk/sdk-go/cmd/custd-sdk-setup@latest \
  --base-url=https://custd.k8.haak.co \
  --admin-url=https://custd.k8.haak.co \
  --admin-token="$CUSTD_ADMIN_TOKEN" \
  --token-url=https://auth.k8.haak.co/oauth2/token \
  --tenant=my-app \
  --company-name="My App" \
  --client-id=my-app-producer \
  --scope=events.write \
  --environment=production \
  --env-prefix=MY_APP
```

Configure Laravel with the generated env block:

```dotenv
CUSTD_BASE_URL=https://custd.k8.haak.co
CUSTD_CLIENT_ID=my-app-producer
CUSTD_CLIENT_SECRET=...
CUSTD_TOKEN_URL=https://auth.k8.haak.co/oauth2/token
CUSTD_AUDIENCE=custd
CUSTD_SCOPES=events.write
CUSTD_BATCH_MAX_SIZE=100
CUSTD_QUEUE_ENABLED=false
CUSTD_QUEUE_MAX_SIZE=1000
```

Use the facade for immediate sends or dispatch the queue-safe job when the event
should run through Laravel queues. The job resolves `CustdClient` in `handle()`,
so queued payloads contain event data only, not OAuth secrets or SDK clients.

```php
use HaakCo\LaravelCustd\Facades\Custd;
use HaakCo\LaravelCustd\Jobs\SendCustdEvent;

Custd::track($event);
SendCustdEvent::dispatch($event)->onQueue("analytics");
```

For Laravel async delivery, prefer Laravel queues through `SendCustdEvent`.
`CUSTD_QUEUE_ENABLED=true` uses the PHP SDK queue inside the Laravel worker
process; configure `CUSTD_QUEUE_STORE` and `CUSTD_QUEUE_PATH` if you need a
durable store. Do not rely on the default in-memory store for FPM or Octane
request-end durability.
