# custd SDK (TypeScript)

Ingestion client with retry, batching, and optional offline queueing.

## Compatibility

Version `1.0.0` targets the canonical ingest endpoint
`POST /api/v1/events`. The legacy `POST /v1/events` path is not supported.
This SDK was not released against the legacy path, so there is no compatibility
alias or deprecation window.

## Install

Use the GitHub package path when installing into HaakCo apps:

```bash
pnpm add '@haakco/custd-sdk@github:haakco/custd-sdk#v1.4.0&path:/sdk-js'
```

Pin the tag to the SDK version you want. The package is also published to the
HaakCo Verdaccio registry during the transition. To install from Verdaccio,
point the project at that registry, then install:

```ini
# .npmrc
registry=https://verdaccio.k8.haak.co/
```

```bash
pnpm add @haakco/custd-sdk
# or: npm install @haakco/custd-sdk --registry=https://verdaccio.k8.haak.co/
```

Reads are anonymous; no token is required to install.

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
  // Batch request bodies are gzip-compressed by default once they reach
  // `thresholdBytes`. Disable with `{ enabled: false }`. Compression is skipped
  // automatically in runtimes without `CompressionStream`. (zstd is a planned
  // follow-up.)
  compression: { enabled: true, thresholdBytes: 1024 },
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

When Custd provisions a producer it returns a flat credential bundle. Pass it
straight to `fromProvisionedProducer` — no OAuth wiring required:

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

Use `redactedProvisionedProducer(credentials)` to show the bundle on a dashboard
without exposing the client secret.

The client also accepts `getToken: () => "<token>"` for existing static-token
or callback integrations. Producer clients should prefer the OAuth2
`client_credentials` config above so token refresh stays inside the SDK.

Trusted broker services can build an admin/provisioning client directly from
Custd provisioning environment variables:

```ts
const broker = CustdClient.fromBrokerEnv(env);

await broker.admin.tenants.create({
  slug: "agency-store-001",
  companyName: "Agency Store 001",
});

const credentials = await broker.provisioning.producers.provision({
  companySlug: "agency-store-001",
  producerSlug: "woocommerce",
  scopeTemplate: "managed-audit-reporting-read",
});
```

`fromBrokerEnv` reads `CUSTD_PROVISIONING_CLIENT_ID`,
`CUSTD_PROVISIONING_CLIENT_SECRET`, `CUSTD_PROVISIONING_TOKEN_URL`,
`CUSTD_PROVISIONING_AUDIENCE`, and either `CUSTD_BASE_URL` or an existing
Custd endpoint such as `CUSTD_PROVISIONING_ENDPOINT`. It defaults the OAuth
request scopes to `admin producers.provision`; pass `{ scopes: [...] }` when a
broker should request a narrower token.

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
  strictPayloadKeys: true,
});
```

`strictPayloadKeys: true` throws if the dogfood sanitizer would drop payload
keys such as `token`, `password`, `signedUrl`, `environment`, or
`sourceSystem`. Leave it off only when backward compatibility with existing
payloads is more important than surfacing dropped data.

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

tracker.installSpaTracking();
```

`installSpaTracking()` sends an initial page view by default, tracks
`pushState`, `replaceState`, and `popstate`, and is idempotent. Pass
`trackInitialPageView: false` when the application already sends the first page
view during hydration.

Script-tag installs read `data-site-uuid` and `data-write-key`, then load site
identity/origin config from `/api/v1/sites/{siteUuid}/config`. That platform
endpoint must exist before script-tag installs are usable in production. Until
then, use `createBrowserTracker()` with explicit `allowedOrigins`. When the
endpoint is available, the site config response must include the current origin
in `allowedOrigins`; the browser tracker refuses to run without an
allowed-origin match. Script attributes cannot expand the server-provided origin
list.

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
Not Track. Page-exit flushes use `fetch` with `keepalive: true` so the tracker
can keep `credentials: "omit"` on collector requests; normal flushes also use
`fetch` with bearer write-key auth and omitted credentials. Queued events are
kept in memory by default so page URLs and payloads are not persisted; pass
`persistentQueue: true` to opt into `localStorage` queueing, and `maxQueueSize`
to lower the default limit of 1000 queued events. Script-tag installs can opt
into persistent queueing with `data-persistent-queue="true"`. Calling
`setConsent("denied")` clears extended-mode identifiers and queued events.

The browser-side origin check is a guardrail, not the security boundary.
Collectors must enforce `allowedOrigins`, write-key validity, and rate limits
server-side.

## Browser Site Admin Helpers

Server-side admin code can use `client.admin.sites` to create, list, get,
delete, and rotate browser tracker Sites. `create` returns the public write key
once. `list` and `get` return Site metadata without the write key.
`rotateWriteKey` returns the replacement write key once; update tracker config
and stop using the old key after rotation.

## Schema Admin Helpers

Server-side setup code can use `client.admin.schemas`:

Supported feature parity and intentionally missing helpers are documented in the SDK
root README.

```ts
await client.admin.schemas.register({
  eventTypeSlug: "courib.delivery.created",
  version: "1.0.0",
  jsonSchema: { type: "object" },
});

await client.admin.schemas.createVersion("courib.delivery.created", {
  version: "1.1.0",
  jsonSchema: { type: "object" },
});
```

## React Native

The core client avoids browser globals for producer use. For React Native, keep
producer credentials out of mobile binaries when possible and relay through a
trusted backend. If direct mobile ingestion is appropriate, use a synchronous
MMKV-backed `QueueStorage`, disable browser online flushing with
`flushOnOnline: false`, and pass `flushTriggers` that subscribe to NetInfo or
AppState and return unsubscribe callbacks.

```ts
import { AppState } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { MMKV } from "react-native-mmkv";
import { CustdClient, type EventEnvelope, type QueueStorage } from "@haakco/custd-sdk";

class MMKVQueueStorage implements QueueStorage {
  constructor(private readonly storage: MMKV, private readonly key = "custd_queue") {}

  load(): EventEnvelope[] {
    const raw = this.storage.getString(this.key);
    return raw ? JSON.parse(raw) as EventEnvelope[] : [];
  }

  save(events: EventEnvelope[]): void {
    this.storage.set(this.key, JSON.stringify(events));
  }

  clear(): void {
    this.storage.delete(this.key);
  }
}

const client = new CustdClient({
  baseUrl: "https://custd.example.com",
  getToken: async () => fetchBackendIssuedToken(),
  queue: {
    enabled: true,
    storage: new MMKVQueueStorage(new MMKV()),
    flushOnOnline: false,
    flushTriggers: [
      (flush) => NetInfo.addEventListener((state) => {
        if (state.isConnected) void flush();
      }),
      (flush) => {
        const subscription = AppState.addEventListener("change", (state) => {
          if (state === "active") void flush();
        });
        return () => subscription.remove();
      },
    ],
  },
});
```

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
