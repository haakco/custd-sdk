# custd SDK (TypeScript)

Ingestion client with retry, batching, and optional offline queueing.

## Compatibility

Version `1.0.0` targets the canonical ingest endpoint
`POST /api/v1/events`. The legacy `POST /v1/events` path is not supported.
This SDK was not released against the legacy path, so there is no compatibility
alias or deprecation window.

## Install

```bash
npm install @haakco/custd-sdk
```

## Usage

```ts
import { createDogfoodEvent, CustdClient, LocalStorageQueueStorage } from "@haakco/custd-sdk";

const client = new CustdClient({
  baseUrl: "http://localhost:8087",
  oauth: {
    clientId: "producer-client",
    clientSecret: process.env.CUSTD_CLIENT_SECRET ?? "",
    tokenUrl: "http://localhost:4444/oauth2/token",
    audience: "custd",
    scopes: ["events.write"],
  },
  retry: { maxAttempts: 3 },
  batch: { maxBatchSize: 25, flushIntervalMs: 5000 },
  queue: {
    enabled: true,
    storage: new LocalStorageQueueStorage("custd_queue"),
    maxQueueSize: 1000,
  },
});

await client.track({
  eventUuid: "...",
  eventTypeSlug: "page-view",
  schemaVersion: "1.0.0",
  timestamp: new Date().toISOString(),
  sessionId: "...",
  anonymousId: "...",
  companySlug: "acme",
  context: {
    page: { url: "https://example.com" },
    device: { type: "desktop" },
    locale: "en-US",
    timezone: "UTC",
    ip: "127.0.0.1",
  },
  payload: { example: true },
});
```

The client also accepts `getToken: () => "<token>"` for existing static-token
or callback integrations. Producer clients should prefer the OAuth2
`client_credentials` config above so token refresh stays inside the SDK.

Dogfood producers can use `createDogfoodEvent`:

```ts
const event = createDogfoodEvent({
  eventTypeSlug: "dogfood.producer.metric",
  schemaVersion: "1.0.0",
  companySlug: "haakco",
  sourceSystem: "vorrent",
  sourceCompany: "haakco",
  environment: "production",
  correlationId: "run-123",
  payload: { metric: "media_cache.queue_depth", value: 7 },
});
```

The SDK requires `companySlug` and rejects plaintext non-local Custd/token URLs.
Localhost HTTP is allowed for development.

### Manual flush

```ts
await client.flush();
```

## Dev smoke test (Hydra)

Requires dev stack running with Hydra using JWT access tokens and ingest-api configured with `AUTH_JWKS_URL`.

```bash
export AUTH_JWKS_URL="http://localhost:4444/.well-known/jwks.json"
cd sdk-js
pnpm run smoke:dev
```

The smoke test uses `scripts/dev-hydra-token.sh` and `scripts/dev-seed-core.sh` to create a dev OAuth client and seed core tables (company, device type, event type, schema).

To run all SDK checks, use `mise exec -- just check` from the repository root.
