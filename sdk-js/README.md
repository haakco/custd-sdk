# custd SDK (TypeScript)

Ingestion client with retry, batching, and optional offline queueing.

## Compatibility

The supported 3.x SDK sends events to `POST /api/v1/events` and batches to
`POST /api/v1/events/batch`. Installation examples below were verified against
release **3.49.0** on 2026-11-17, including Node 26, pnpm 12 and Expo 58 consumers.

## Install

Use the GitHub package path when installing into HaakCo apps:

```bash
pnpm add '@haakco/custd-sdk@github:haakco/custd-sdk#v3.49.0&path:/sdk-js'
```

Pin the tag to the SDK version you want. The package is no longer published to
HaakCo's Verdaccio registry; the last version there is 3.35.2, kept for installs
that already pin it.

## Server-side producer usage

Producer OAuth credentials belong only in trusted backend processes. Browser
applications use the [Browser Tracker](#browser-tracker) or native error client;
Expo/React Native applications use their own authenticated application relay.
Keep the existing company and provision project-owned resources; an application
is not a new tenant. See the root [onboarding/setup guidance](../README.md#producer-setup-helper).

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
    page: { path: "/start" },
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
`pushState`, `replaceState`, and `popstate`, and is idempotent. It sends a page
view only when the route path changes, so a history update that rewrites the
query string alone does not count as a new page. Pass
`trackInitialPageView: false` when the application already sends the first page
view during hydration.

By default a page view carries the sanitized `location.pathname` and
`document.title`. Pass `pageContext` to send a route template instead of the
address bar path and to omit the title, for example when a path segment or the
title names a private tenant page:

```ts
const tracker = createBrowserTracker({
  baseUrl: "https://custd.example.com",
  siteUuid: "site-uuid",
  writeKey: "site_pk_public_write_key",
  allowedOrigins: ["https://www.example.com"],
  pageContext: () => ({ path: "/companies/:companySlug/board" }),
});
```

The provider receives the default `{ path, title }` and a field it leaves out is
not sent. A `path` that is not a safe route path, such as a full URL or one
carrying a query or fragment, is replaced with the default sanitized path, and a
provider that throws sends no page context rather than falling back to page
content.

Every tracked event declares a schema version, `1.0.0` by default. Pass
`schemaVersion` when this Site's collector has a different version enabled: the
collector accepts an event only under a version it has enabled for that event
type, so the configured value and the collector's enabled schema version must
match. A value that is not a dotted numeric version such as `1.0.1` is refused
at construction instead of being sent.

Pass `labels` to stamp every tracked event, including the automatic page views,
with controlled deployment metadata such as the cluster and region this build
runs in:

```ts
const tracker = createBrowserTracker({
  baseUrl: "https://custd.example.com",
  siteUuid: "site-uuid",
  writeKey: "site_pk_public_write_key",
  allowedOrigins: ["https://www.example.com"],
  environment: "production",
  labels: { cluster: "eu-central", region: "eu" },
});
```

These are deployment labels, not visitor data: use build-time configuration
rather than anything derived from the person browsing. Every key and value must
already exist in the tenant's label catalogue, and the reserved `custd.`
namespace stays with the SDK, so `custd.environment` still comes only from
`environment` and a configured label that tries to set it is rejected. The
tracker copies the object at construction, so mutating it afterwards changes
nothing. Without `labels` the envelope carries no labels of its own.

Automatic tracking calls, namely the initial page view, the history hooks,
`popstate`, and background flushes, absorb their own failures so they never
surface as unhandled rejections in the host page. Pass `onFailure` to observe
them as sanitized descriptions:

```ts
onFailure: (failure) => {
  // { source: "page-view" | "flush", status?, rejectedEvents? }
  report(failure);
},
```

The collector answers a batch with one result per event. Events it rejects
permanently are dropped instead of retried and are reported through `onFailure`
as `rejectedEvents`; events that failed with a retryable status stay queued for
the next flush. A batch answer that does not match the collector contract is not
treated as delivered, so the queue keeps its events.

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
  src="https://custd.com/custd-sdk/browser-script.js"
  data-site-uuid="site-uuid"
  data-write-key="site_pk_public_write_key"
></script>
```

Load the stable entry, not a content-hashed artifact name.
`browser-script.js` aliases whatever build the deployed manifest
(`/custd-sdk/browser-manifest.json`) names and is served with a one-hour bounded
cache, so a host picks up new SDK builds without editing its markup, and it can
never be left pointing at a retired artifact. A pinned
`browser-script-<content-hash>.js` URL changes on every release: the markup has
to be edited by hand to upgrade, and the old name stops resolving once the
artifact is gone.

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

A page view also carries its sanitized path in the payload, so reporting can
group page views by page. When the first page view of a document arrives from
an AI assistant (the hostnames in `aiAssistantReferrers`, such as `chatgpt.com`,
`perplexity.ai`, `claude.ai`, `gemini.google.com` and `copilot.microsoft.com`),
it carries `referrerClass: "ai-assistant"` and the assistant name as
`aiAssistant`. The referrer URL itself is never sent.

Pass `webVitals: true` (script tag: `data-web-vitals="true"`) to capture
real-user Core Web Vitals with the browser's `PerformanceObserver`. When the page
is first hidden, the tracker sends one `web-vitals` event for the landing path
with `lcp`, `inp`, `fcp` and `ttfb` in milliseconds and `cls` as a score. A
metric the browser does not report, such as INP on a visit with no interaction,
is omitted rather than sent as zero. Single-page route changes do not send
further vitals events, because LCP, FCP and TTFB describe the document load.

The browser-side origin check is a guardrail, not the security boundary.
Collectors must enforce `allowedOrigins`, write-key validity, and rate limits
server-side.

## Hosted apps

An app Custd hosts starts tracking, error capture and sign-in with one call and
no copied configuration. `startHostedApp` reads `/.well-known/custd.json` from
the page's own origin and starts each capability the file enables:

```ts
import { startHostedApp } from "@haakco/custd-sdk/browser";

type AppEvents = {
  "item-created": { kind: string };
  "measurement-added": { value: number };
};

const started = await startHostedApp<AppEvents>({ release: import.meta.env.VITE_COMMIT });
if (started.status === "ready") {
  const { app } = started;
  await app.signIn?.restore(); // only when sign_in is enabled
  await app.trackAppEvent("item-created", { kind: "counter" }); // "tracked" | "tracking_off" | "failed"
  // app.tracker, app.errorCapture, app.problems, app.stop()
} else {
  console.warn(started.error.code); // HOSTED_APP_ERROR_CODES; the app keeps working without Custd
}
```

- `tracking` starts the browser tracker with SPA page views for the app's Site.
  Consent follows the Site's identity mode: a cookieless Site tracks at once, an
  extended Site waits for `app.tracker.setConsent("granted")`. Pass `consent` to
  override that default.
- `error_capture` installs browser error capture with the app's key.
- `sign_in` creates a `BrowserSignIn` for the environment's directory using the
  discovery `redirectUri`.

`startHostedApp` never rejects. A missing or malformed discovery file returns
`{ status: "error", error }`; an enabled capability that cannot start is listed
in `app.problems` while the others keep running. App events must be registered
event types with flat scalar properties; `trackAppEvent` never rejects either.

### App items

With `app_data` enabled, `app.appItems` is an `AppItemsClient` for the app's
items. Creating one needs only the Site key; every other call takes the item's
owner link token (reads and changes) or share link token (reads only). Tokens
travel only in the `Authorization` header and are never logged.

```ts
import { appItemOwnerUrl, appItemShareUrl, parseAppItemLink } from "@haakco/custd-sdk/browser";

const items = app.appItems!; // or AppItemsClient.fromDiscovery(discovery)
const created = await items.createItem({
  kind: "measurement_project",
  measurementProject: { kind: "deadline_forecast", name: "Launch", series: [series], target },
});
const ownerUrl = appItemOwnerUrl({ host: app.discovery.host, kindPath: "c", token: created.ownerToken });
const shareUrl = appItemShareUrl({ host: app.discovery.host, kindPath: "c", token: created.shareToken });

await items.addMeasurements(created.ownerToken, { rows: [{ observedAt: new Date().toISOString(), value: 12 }] });
await items.runForecast(created.ownerToken);

const pasted = parseAppItemLink(input); // owner URL, share URL or bare token; null otherwise
const watch = items.watchItem(created.shareToken); // { getState, subscribe, refresh }
const stop = watch.subscribe(() => render(watch.getState()));
```

Reads (`readItem`, `latestForecast`, `forecastRun`, `forecastStory`) take
`{ item, etag }` and return `{ status: "modified", data, etag }` or
`{ status: "not_modified", etag }`. `item` reads an entry of a dashboard through
the dashboard's own link. Failures throw `AppItemError` with the server's
`code` (`APP_ITEM_ERROR_CODES`); `terminal` is true when retrying cannot help.

`watchItem`, `watchLatestForecast` and `watchForecastStory` poll with
`If-None-Match` every 5 s (`intervalMs`), pause while the tab is hidden, poll at
once when it is shown or the browser comes back online, and back off up to 60 s
while requests fail. Watchers of the same read and link share one poller. State
is `loading`, `fresh`, `stale` (earlier data, the last poll failed), `offline`
or `error` (`retrying: false` once the link or key is refused, until
`refresh()`); `lastUpdatedAt` is when the server last confirmed the data,
including an unchanged answer. A write through the client polls that link's
watchers at once. The latest forecast is `empty` until a first run exists.
Watchers share a poller on the same client. A Site key refused for the page's
origin gets no CORS header, so the browser reports it as `network`/`offline`.

A signed-in user's access token travels in `X-Custd-User-Token` beside the
link: `startHostedApp` wires it from `app.signIn`, or pass `userToken` to the
client. `listMyItems()` reads "my items", `claim(ownerToken)` takes ownership of
an unowned item, and `{ item: itemUuid }` in place of a token reaches an item
the user owns without a link. Reads carry `item.ownership` (`unowned`, `yours`,
`other`). `error.signInNeeded` means sign in again; `app_user_check_unavailable`
is retried and keeps the session.

Model items add `addModelVersion`, `copyModel`, `runModel`, `latestModelRun`,
`watchLatestModelRun` and `calculateModel(token, { versionNumber, inputs,
outputs })`, which any link may call and which stores nothing.

## Browser app user sign-in

`BrowserSignIn` signs a hosted app's users in through the environment's Custd
directory with OAuth 2.0 authorization code and PKCE (S256). The app is a
public client: no client secret is involved. Pending sign-in state and the
token set live in `sessionStorage`; tokens never appear in errors.

```ts
import { BrowserSignIn, signInConfigFromDiscovery } from "@haakco/custd-sdk";

const discovery = await (await fetch("/.well-known/custd.json")).json();
const signIn = new BrowserSignIn(
  signInConfigFromDiscovery(discovery, { redirectUri: `${location.origin}/callback` }),
);

await signIn.restore(); // completes a /callback redirect or refreshes an expired session
await signIn.signIn({ returnTo: "/items" }); // sends the browser to the authorize URL
const session = signIn.currentSession(); // { accessToken, tokenType, expiresAtMs, refreshToken?, idToken?, scopes }
signIn.signOut({ postLogoutRedirectUri: location.origin }); // clears state, then visits end-session
```

The discovery `signIn` block holds `issuer`, `authorizationEndpoint`,
`tokenEndpoint`, `endSessionEndpoint` (optional) and `clientId`. Scopes
default to `openid profile offline_access`. `startSignIn`, `completeSignIn`
and `refreshSession` are the lower-level steps when the app owns navigation.
A redirect whose `state` does not match is refused, and each pending sign-in
is single-use. Failures throw `SignInError` with a `code` from
`SIGN_IN_ERROR_CODES`.

## Browser Site Admin Helpers

Server-side admin code can use `client.admin.sites` to create, list, get,
delete, and rotate browser tracker Sites. `create` returns the public write key
once. `list` and `get` return Site metadata without the write key.
`rotateWriteKey` returns the replacement write key once; update tracker config
and stop using the old key after rotation.

## Site Insights (site domains)

Server-side code can use `client.admin.siteDomains` to claim a host for a Site,
prove control (`verify`, or `attest` from a site-bound broker credential), queue
an audit, read findings and outages, choose the check mode, set the alert
address and connect Google or Bing search numbers. The routes are under
`/api/v1/site-domains`; a system administrator names the tenant with
`{ companySlug }` in the last argument.

```ts
import { SITE_DOMAIN_NOT_VERIFIED_CODE, SiteRule } from "@haakco/custd-sdk";

const domain = await client.admin.siteDomains.create({ siteUuid, host: "example.com" });
// Publish domain.ownership.instructions (DNS TXT or well-known file), then:
await client.admin.siteDomains.verify(domain.domainUuid);
await client.admin.siteDomains.requestAudit(domain.domainUuid);

const { findings } = await client.admin.siteDomains.listFindings(domain.domainUuid, "open");
const missingTitles = findings.filter((finding) => finding.rule === SiteRule.TitleMissing);
```

`SiteRule` holds the stable rule IDs a finding carries in `rule`; key any
client-side fix on them. A refused audit of an unverified domain is a
`CustdRequestError` whose `code` is `SITE_DOMAIN_NOT_VERIFIED_CODE`.

Each finding carries a `remedy` (`kind`, `element`, and ready-to-copy
`generated` code for some rules). The page tools are `getPageFacts`,
`requestPageRecheck` / `getPageRecheck` (refusals: `SITE_PAGE_NOT_ON_DOMAIN_CODE`,
`SITE_PAGE_RECHECK_LIMIT_CODE`), `checkPage` for draft HTML and `testRobots`.
Search adds `listSearchRows` (its `unavailable` list names providers that cannot
report a dimension) and Search Console URL inspection
(`requestSearchInspection`, `listSearchInspections`). `getProjectContext` /
`setProjectContext` keep a Site's brands, competitors and markets. The client
report reads are `getReport`, `getUptimeHistory`, `getLighthouseHistory` and
`listReportShares` / `createReportShare` / `revokeReportShare`. IndexNow is
`getIndexNow`, `enableIndexNow`, `verifyIndexNowKey`, `submitIndexNow` and
`disableIndexNow`, with `SITE_INDEXNOW_*_CODE` refusals. A measurement
Custd did not take is absent, never `0`.

More reads and controls on the same client:

- Audit pages: `listAuditPages(domainUuid, offset?, limit?)` and `getAuditDelta`
  (new, reopened and fixed findings).
- Lighthouse pages: `getLighthousePages` / `setLighthousePages(domainUuid, urls)`
  (at most five extra pages; `[]` clears them). `getLighthouseHistory(domainUuid, days, { url })`
  reads one extra page.
- Reports: `getReport(domainUuid, { template, days })` (`SiteReportTemplate.Executive`
  or `Full`), and saved reports with `listSavedReports`, `saveReport`, `getSavedReport`,
  `replaceSavedReport`, `deleteSavedReport`. `createReportShare(domainUuid, { reportUuid })`
  shares a saved report.
- Public web data per Site (`siteUuid` optional for a site-bound credential):
  `getWebDomains`, `listWebPages(domain, { after })`, `getTopicTrends`, `getContentGap`,
  and keyword lists with `listKeywordLists`, `saveKeywordList`, `deleteKeywordList`,
  `getKeywordClusters`.
- Referring domains: `getReferringDomains(domain, siteUuid?)` lists the domains linking to one
  of the Site's web domains per source (`SiteLinkSource` bing, commoncrawl, crawl), its Common
  Crawl authority and lost links. A count a source did not report is absent, never `0`.
- Shared search pool (tenant-wide; a site-bound credential is refused with
  `SITE_SEARCH_POOL_SITE_BOUND_CODE`): `getSearchPool`, `setSearchPool(joined)` and
  `listSearchPoolQueries(search?, limit?)` (refused with `SITE_SEARCH_POOL_NOT_JOINED_CODE`
  before joining). `getRankings` then carries `pool` and each keyword's pooled `pool` band.
- Access logs: `getTraffic(domainUuid, from?, to?)`, `getAIVisibility`, and
  `replayAccessLogHour(hourStart)` for system administrators.
- Rank tracking: `getRankings(domainUuid, days?)`, `trackKeyword`,
  `updateTrackedKeyword` (always sends `paused`; an omitted `notifyPosition` keeps the
  stored one), `untrackKeyword`. A day that did not rank has no `position`.
- Search value: `getFindingSearchImpact(domainUuid, findingUuid, days?)` compares a fixed
  finding's page in search before and after the fix, and `getSearchValue(domainUuid, goals, days?)`
  credits up to five goal event types to search landing pages. Unmeasured numbers are absent.
- Older servers (3.46.0) send no report `template` or Lighthouse `url` / `pages`; those fields
  are then absent (no pages).

Each refusal code is a named constant, such as `SAVED_SITE_REPORT_NAME_TAKEN_CODE`,
`SITE_KEYWORD_LIST_LIMIT_CODE`, `ACCESS_LOG_HOUR_INVALID_CODE` or
`SITE_TRACKED_KEYWORD_DUPLICATE_CODE`.

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

Mobile applications must not contain Custd producer credentials, provisioned
producer bundles, or tenant-wide `reporting:read` tokens. Send events to an
application-authenticated relay instead. The relay owns its Custd client and
producer credentials; the app sends only allowlisted, pseudonymous event data.
Likewise, have the relay render or authorize reporting results rather than
shipping a tenant-wide reporting token to the app.

The SDK provides dependency-free async queue and lifecycle primitives for Expo
or React Native. Pass your installed AsyncStorage-, AppState-, and
NetInfo-shaped implementations in; the SDK does not import or require those
packages. The queue keeps event IDs and ordering across storage restarts,
evicts oldest events at its configured bound, and retains unacknowledged events
after a partial batch response.

Use `createMobileEvent()` for app-originated events. It accepts only iOS or
Android platform context, a semantic app version, BCP 47 locale, IANA timezone,
network state, and exactly one explicit anonymous or authenticated subject.
The helper rejects unknown context fields and credential-shaped payload fields
such as producer secrets, client secrets, or reporting tokens. Mobile apps send
these allowlisted event envelopes to an application-authenticated relay; they
must not contain Custd producer credentials or reporting-read credentials.

```ts
import { AppState } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  AsyncEventQueue,
  createMobileAsyncQueueStorage,
  createMobileFlushTriggers,
} from "@haakco/custd-sdk";

const queue = new AsyncEventQueue(
  createMobileAsyncQueueStorage(AsyncStorage, "custd.mobile.events"),
  1_000,
);
await queue.load();

const removeLifecycleTriggers = createMobileFlushTriggers({
  appState: AppState,
  network: NetInfo,
})(async () => {
  // Send a bounded `await queue.peek(limit)` batch to the authenticated
  // application relay. Acknowledge only event UUIDs accepted by that relay.
  const events = await queue.peek(50);
  const acceptedIDs = await sendEventsToApplicationRelay(events);
  await queue.acknowledge(acceptedIDs);
});
```

Call `removeLifecycleTriggers()` during application shutdown. A manual flush
uses the same bounded relay path; do not call a Custd producer endpoint from
the app or persist credentials alongside queued events.

```ts
const events = await queue.peek(50);
await queue.acknowledge(await sendEventsToApplicationRelay(events));
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

## Lifecycle administration

The TypeScript SDK exposes typed admin clients for the five lifecycle
namespaces. Forward-only: no deprecated aliases.

```ts
const admin = client.admin();

// Tenant storage: list/get/create/revoke.
const loc = await admin.tenantStorage.create({
  tenantSlug: "acme",
  clientLocation: "s3://acme-prod-warehouse/events/",
});

// Subject exports: full request lifecycle.
const exp = await admin.subjectExports.create({
  tenantSlug: "acme",
  subject: { type: "userUuid", value: "01J5..." },
  scope: "portability",
  idempotencyKey: "acme-2026-07-31",
});

// Physical erasures: NO cancel/retry.
const force = await admin.privacyErasures.force("pe_01J5...");

// Retention policies: list/get/upsert/delete + preview/apply/listRuns.
const runs = await admin.retention.listRuns("acme");

// Offboarding: full request lifecycle + schedules.
const sched = await admin.offboarding.schedule({
  tenantSlug: "acme",
  effectiveAt: "2026-12-31T00:00:00Z",
  gracePeriodDays: 30,
  reason: "contract_end",
  status: "scheduled",
});

const request = await admin.offboarding.requestOffboarding(
  { confirmation: "acme" },
  { idempotencyKey: "acme-offboarding-2026-12-31" },
);
```

## Time-plan administration

`client.admin.timePlans` exposes typed `TimePlan*` types for plan
drafts/revisions, previews, publication and retirement, runs, commands,
history, and annotation correction/redaction. Every call takes a company slug;
the server remains authoritative for allocations and command results.

```ts
import { type TimePlanDefinition } from "@haakco/custd-sdk";

const definition: TimePlanDefinition = {
  horizonMs: 60_000,
  blocks: [{ uuid: "block-1", semanticKey: "focus", title: "Focus", basis: "absolute" }],
};

const preview = await client.admin.timePlans.preview("acme", definition);
const plan = await client.admin.timePlans.create("acme", {
  planKey: "focus",
  name: "Focus",
  definition,
});
```

The typed clients are available in `v1.8.25` and later.

## Usage reporting

`client.admin.usage` reads the attributed usage for the authenticated tenant
through `GET /api/v1/admin/usage/me`. The tenant comes from the credential, so
the call never names a company slug. The system-admin `/usage` and `/usage/export`
surfaces are deliberately not exposed.

```ts
const report = await client.admin.usage.get({
  meterSlug: "events.ingested",
  start: "2026-09-01T00:00:00Z",
  end: "2026-10-01T00:00:00Z",
  limit: 200,
});
```

`report.totals` carries the per-meter totals and `report.rows` the per-window
detail. `report.containsProvisional` and `report.containsIncomplete` are the
server's own assessment, so a caller deciding whether a number is settled reads
them rather than assuming every row is final. An omitted `start`/`end` uses the
service default (the trailing 30 days) and an omitted `limit` uses
`USAGE_DEFAULT_LIMIT`; a limit outside `1..USAGE_MAX_LIMIT` rejects before a
request is sent.

## Auth-project admin helpers

`client.admin.authProjects` manages Custd projects, their environments, and the
application principals a directory holds, through `/api/v1/admin/auth-projects`:

- `createProject` / `listProjects` (pass the previous `nextAfter` as the `after` cursor)
- `createEnvironment`
- `listPrincipalSessions`, `revokePrincipalSession`, `revokePrincipalSessions`
- `revokePrincipalMembership`
- Hosted app releases: `createAppRelease` (manifest files and routing),
  `uploadAppReleaseFile` (one file's raw bytes, sent as `application/octet-stream`),
  `verifyAppRelease`, `promoteAppRelease` and `listAppReleases`

An environment is served as a hosted app by the optional `hosting` section of
its desired state (`mode`, `capabilities`, `ingestTarget`); leaving it out keeps
the stored section. `getEnvironmentStatus` reports the derived `hosting.host`,
`hosting.origin` and, with `sign_in`, the `hosting.signIn` client.

Every call takes `RequestOptions`. A machine credential must name the platform
user it acts for in `owningUserUuid`, sent as `X-Custd-Owning-User-UUID`; Custd
validates the named user as a live member of the machine's own company. A human
administrator's own token subject is the actor and leaves it unset. The
operations Custd makes retry-safe (`createProject`, `revokePrincipalSession`,
`revokePrincipalSessions`) require `idempotencyKey` and reject an empty value
before a request is sent.

```ts
const creation = await client.admin.authProjects.createProject(
  { slug: "hosting-eu", name: "Hosting EU", environmentSlug: "production", identityMode: "isolated" },
  { owningUserUuid, idempotencyKey: "create-hosting-eu" },
);
```

Responses are typed: `AuthProjectCreation`, `AuthProjectListResponse`,
`ApplicationSessionInventory`, `ApplicationSessionRevocation` and
`ApplicationMembershipRevocation`.

## Analytics range query

`client.analytics.queryRange` reads a tenant's own events across an inclusive
date range of at most `ANALYTICS_MAX_RANGE_DAYS` days, with
`groupBy: "day"`. `buckets` carries each day's `count`/`source`/`complete` and
`rows` the capped detail. The per-day completeness is the server's assessment
and is surfaced unchanged.

```ts
const range = await client.analytics.queryRange({
  from: "2026-02-23",
  to: "2026-05-23",
  eventType: "page-view",
  limit: 10000,
  source: "auto",
  groupBy: "day",
});
```

SDKs never log signed URLs, raw personal data, export bytes, or
subject identifiers outside opaque IDs.

## Error capture in Expo and React Native

Use `createErrorCaptureEvent({ error, mode }, { environment, release })` to
format a sanitized `ErrorCaptureEvent` for an application-authenticated relay.
It keeps only the exception type and bounded code basenames/line/column locations,
including Hermes and Metro bundle locations. Messages, full paths, request data,
and user context are excluded. Without `eventId`, it needs no `crypto`, DOM,
`TextEncoder`, or fetch globals; the relay's Go `CaptureEvent` generates the ID
and supplies its own server-only Site credential. Never put that credential in
the app or construct a collector envelope in application code.

`installNativeErrorCapture(errorUtils, capture)` accepts an injected React Native
`ErrorUtils`-shaped object and a capture callback. It chains the original handler
even if capture fails and returns cleanup that restores only its own handler.
The callback owns authenticated relay delivery and its session/concurrency bounds;
the installer does not create a queue, retry, persist, or modify native globals.
Caught React errors still belong in the application's error boundary. Native OS
crash capture is not provided by this JavaScript handler.
