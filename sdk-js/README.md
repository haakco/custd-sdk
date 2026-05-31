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

## Browser Tracker

Use the browser entrypoint for public website analytics. It sends to the
collector endpoints, not the producer OAuth endpoint:

```ts
import { createBrowserTracker } from "@haakco/custd-sdk/browser";

const tracker = createBrowserTracker({
  baseUrl: "https://custd.example.com",
  siteUuid: "site-uuid",
  writeKey: "site_pk_public_write_key",
  allowedOrigins: ["https://www.example.com"],
  batchSize: 25,
});

await tracker.trackPageView();
tracker.installSpaTracking();
```

Script-tag installs read `data-site-uuid` and `data-write-key`, load site
identity/origin config from `/api/v1/sites/{siteUuid}/config`, and expose
`window.custd`. The site config response must include the current origin in
`allowedOrigins`; the browser tracker refuses to run without an allowed-origin
match. Script attributes cannot expand the server-provided origin list.

```html
<script
  type="module"
  src="https://custd.example.com/browser-script.js"
  data-site-uuid="site-uuid"
  data-write-key="site_pk_public_write_key"
></script>
```

```ts
await window.custd.track("purchase", { amount: 12.99 });
await window.custd.trackPageView();
```

The default mode is cookieless: `anonymousId` and `sessionId` are sent as empty
strings. For consented identity, opt in explicitly:

```ts
const tracker = createBrowserTracker({
  baseUrl: "https://custd.example.com",
  siteUuid: "site-uuid",
  writeKey: "site_pk_public_write_key",
  allowedOrigins: ["https://www.example.com"],
  identityMode: "extended",
  consent: "required",
});

tracker.setConsent("granted");
```

Extended mode starts with consent required for script-tag installs unless
`data-consent="granted"` is present. It stores an anonymous ID in
`localStorage`, a session ID in `sessionStorage`, and all modes honor browser Do
Not Track. Page-exit flushes use `navigator.sendBeacon` when available; because
beacons cannot set request headers, the public write key is included in the
beacon JSON body. Normal flushes use `fetch` with bearer write-key auth. Queued
events are kept in memory by default so page URLs and payloads are not persisted;
pass `persistentQueue: true` to opt into `localStorage` queueing, and
`maxQueueSize` to lower the default limit of 1000 queued events. Script-tag
installs can opt into persistent queueing with `data-persistent-queue="true"`.

### Manual flush

```ts
await tracker.flush();
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
