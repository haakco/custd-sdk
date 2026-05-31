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
import { CustdClient, LocalStorageQueueStorage } from "@haakco/custd-sdk";

const client = new CustdClient({
  baseUrl: "http://localhost:8087",
  getToken: () => "<token>",
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

### Manual flush

```ts
await client.flush();
```

## Dev smoke test (Hydra)

Requires dev stack running with Hydra using JWT access tokens and ingest-api configured with `AUTH_JWKS_URL`.

```bash
export AUTH_JWKS_URL="http://localhost:4444/.well-known/jwks.json"
cd packages/sdk-js
pnpm run smoke:dev
```

The smoke test uses `scripts/dev-hydra-token.sh` and `scripts/dev-seed-core.sh` to create a dev OAuth client and seed core tables (company, device type, event type, schema).

To run all SDK live smoke tests, use `just test-sdk-e2e`.
