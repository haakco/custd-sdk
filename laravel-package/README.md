# Custd Laravel Package

First-party Laravel integration for Custd: a service provider, the `Custd`
facade, a queued `SendCustdEvent` job, and a publishable `config/custd.php`,
all wrapping the shared `haakco/custd-sdk` PHP client.

## Compatibility

Targets the canonical ingest endpoint `POST /api/v1/events`. Requires PHP `>=8.3`
and Laravel `^11 || ^12 || ^13`.

## Install

`haakco/custd-laravel` ships from its own public mirror repo
(`haakco/custd-sdk-laravel`), split from the monorepo on each release. We do
**not** use Packagist — install from GitHub via Composer VCS. The repos are
public, so no Composer auth token is required. Add the mirror **and** the SDK
repo so the transitive `haakco/custd-sdk` dependency resolves:

```json
{
  "repositories": [
    { "type": "vcs", "url": "https://github.com/haakco/custd-sdk-laravel" },
    { "type": "vcs", "url": "https://github.com/haakco/custd-sdk" }
  ],
  "require": {
    "haakco/custd-laravel": "^1.3"
  }
}
```

```bash
composer require haakco/custd-laravel:^1.3
```

The service provider and `Custd` facade are auto-discovered. Publish the config:

```bash
php artisan vendor:publish --tag=custd-config
```

## Configure

`config/custd.php` reads from env. A typical OAuth2 producer setup:

```php
// config/custd.php (published)
return [
    'base_url' => env('CUSTD_BASE_URL'),
    'token'    => env('CUSTD_TOKEN'), // static-token alternative to oauth
    'oauth' => [
        'client_id'     => env('CUSTD_CLIENT_ID'),
        'client_secret' => env('CUSTD_CLIENT_SECRET'),
        'token_url'     => env('CUSTD_TOKEN_URL'),
        'audience'      => env('CUSTD_AUDIENCE', 'custd'),
        'scopes'        => ['events.write'],
    ],
    'batch' => ['max_batch_size' => 25],
    'queue' => ['enabled' => true, 'max_size' => 1000, 'store' => 'file', 'path' => storage_path('custd-queue')],
    'job'   => ['tries' => 3, 'backoff' => 10],
];
```

## Usage

Send an event synchronously via the facade:

```php
use HaakCo\LaravelCustd\Facades\Custd;

Custd::track([
    'eventTypeSlug' => 'page-view',
    'schemaVersion' => '1.0.0',
    'timestamp'     => now()->toIso8601String(),
    'companySlug'   => 'acme',
    'context'       => ['page' => ['url' => 'https://example.com']],
    'payload'       => ['example' => true],
]);
```

Or off-load to the queue with the bundled job:

```php
use HaakCo\LaravelCustd\Jobs\SendCustdEvent;

SendCustdEvent::dispatch([
    'eventTypeSlug' => 'page-view',
    'schemaVersion' => '1.0.0',
    'timestamp'     => now()->toIso8601String(),
    'companySlug'   => 'acme',
    'context'       => ['page' => ['url' => 'https://example.com']],
    'payload'       => ['example' => true],
]);
```

`SendCustdEvent` honours `custd.job.tries` / `custd.job.backoff` and resolves the
shared `CustdClient` from the container, so retries and queue backpressure are
handled by the SDK. The container also binds `HaakCo\Custd\CustdClient` directly
if you prefer constructor injection over the facade.
