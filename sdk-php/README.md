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
    "haakco/custd-sdk": "^3.0"
  }
}
```

```bash
composer require haakco/custd-sdk:^3.0
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
// $producer is the ProvisionedProducer that provisioning()->provisionProducer() returned.
$client = CustdClient::fromProvisionedProducer($producer);
$client->track([
    "eventTypeSlug" => "order.completed",
    "schemaVersion" => "1.0.0",
    "companySlug" => $producer->companySlug,
    "context" => ["device" => ["type" => "server"]],
    "payload" => ["orderTotal" => 42],
]);
```

Use `CustdClient::redactedProvisionedProducer($producer)` to show the bundle
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
    "haakco/custd-sdk": "^3.0"
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
update, delete, and rotate browser tracker Sites. Requests and answers are typed
DTOs under `HaakCo\Custd\Admin\Site`. `create()` returns the public write key
once. `list()` and `get()` return `Site` metadata, which has no write-key field.
`rotateWriteKey()` returns the replacement write key once; update tracker config
and stop using the old key after rotation.

## Site Domain Admin Helpers

Use `$client->adminSiteDomains()` to claim a host for a Site (`create()`),
prove control of it (`verify()`), ask for an audit (`requestAudit()`), read its
findings (`listFindings()`), and remove it (`delete()`). Every result is a typed
DTO under `HaakCo\Custd\Admin\SiteDomain`. Auditing an unverified domain
throws `AdminProblemException` whose `problem->code` is
`SiteDomainClient::NOT_VERIFIED_CODE`. A system administrator passes the tenant
as the optional `$companySlug` argument.

Each domain also carries `checks`: its uptime status, last check, certificate
expiry and warming measurements, and any open outage. `setCheckMode()` takes
`SiteCheckMode::Uptime` (the default), `SiteCheckMode::Warm` (adds one home page
GET a minute) or `SiteCheckMode::Paused` (no requests at all; set it when you
stop a site, so nothing wakes it). `listIncidents()` returns the domain's recent
outages.

Each finding carries a `remedy`: what the fix changes (`SiteRemedy::KIND_*`),
the element, and for some rules `generated` code to copy, and `recheckable`
when a one-page recheck can confirm the fix. The page tools read
`getPageFacts()`, queue `requestPageRecheck()` (poll `getPageRecheck()`, or
`listPageRechecks()` for up to `PAGE_RECHECK_READ_LIMIT` at once), check
draft HTML with `checkPage()` and test crawler access with `testRobots()`
(omit `robotsTxt` to read the live file). `listSearchRows()` pages through one
search dimension; `unavailable` names providers that cannot report it, which is
not zero traffic. `requestSearchInspection()` and `listSearchInspections()`
run Google URL Inspection. `getProjectContext()` and `setProjectContext()` hold
a Site's brands, competitors and markets. Missing measurements decode as
`null`, never `0`. Refusals carry `SiteDomainClient::PAGE_NOT_ON_DOMAIN_CODE`,
`PAGE_RECHECK_LIMIT_CODE` and the `SEARCH_INSPECTION_*_CODE` constants.

`enableIndexNow()` returns the key file to serve; `verifyIndexNow()` checks it
(a failed check is `lastCheckFailure`, not an error), `submitIndexNow()` queues
changed URLs, `getIndexNow()` shows daily use and submissions, and
`disableIndexNow()` turns it off. Refusals carry the `INDEXNOW_*_CODE`
constants.

### A credential for one site (WordPress plugin, hosting environment)

A server that already holds a producer-provisioning credential (a broker) mints
one credential per site, and Custd creates the Site for it:

```php
use HaakCo\Custd\Provisioning\Client;
use HaakCo\Custd\Provisioning\ProvisionProducerRequest;

$issued = $broker->provisioning()->provisionProducer(new ProvisionProducerRequest(
    companySlug: 'acme',
    producerSlug: 'store-123-site',
    displayName: 'Store 123',
    scopeTemplate: Client::SCOPE_TEMPLATE_SITE_INSIGHTS,
));
```

The returned `$issued->clientId` and `$issued->clientSecret` (shown once) get a token with `site_domains.manage`. With
it, `create(CreateSiteDomainRequest::forOwnSite('www.example.com'))` and
`list()` work on that Site without naming it; every other domain operation works
as above, and another Site's domain answers as not found. Repeating the
provisioning call keeps the same Site; revoking the producer removes the Site and
its domains. A tenant administrator can instead bind a credential to an existing
Site with `adminOAuthClients()->create(new OAuthClientCreateRequest(...,
purposeProfile: OAuthClient::PURPOSE_SITE_INSIGHTS, siteUuid: $siteUuid), $idempotencyKey)`.

A host that proves domain ownership itself (a TXT challenge, registrar control or
managed DNS) mints with `Client::SCOPE_TEMPLATE_SITE_INSIGHTS_ATTESTING` instead,
once a Custd system administrator has granted its broker `site_domains.attest`.
That credential calls `attest($domainUuid)` to mark a domain of its Site, and its
subdomains, as verified without the Custd record (`ownership->verifiedBy` is
`attested` and `ownership->attestation` names the credential and time), and
`unattest($domainUuid)` to withdraw it.

The credential that owns a Site can enable browser collection on a verified
domain with `convergeBrowserCollector($domainUuid, SiteBrowserCollectorRequest::enable('production'))`.
Use the returned Site UUID, browser key, environment and allowed HTTPS origin in
the browser tracker. Repeating setup returns the same key. Call the same method
with `SiteBrowserCollectorRequest::disable()` to withdraw the browser key while
keeping the Site and its history.

A reseller that keeps its customers' Sites in its own tenant sends one Site's
finding and outage alerts to the customer with
`setAlertDestination($siteUuid, 'owner@customer.example')` (a site-bound
credential passes `null` for its own Site); `setAlertDestination($siteUuid, null)`
sends them back to the tenant's destinations, and `getAlertDestination()` reads it.

Search performance comes from the client's own Google Search Console and Bing
Webmaster Tools properties. `getSearchAccount()` says which providers this
deployment can import from and the Google service account email to add as a
(Restricted) user on the property. `connectSearch($domainUuid,
SiteSearchProvider::Bing, 'https://www.example.com/', $bingApiKey)` connects a
domain (Google takes no key; the key is never returned), and a provider the
deployment cannot import from throws `AdminProblemException` with
`SiteDomainClient::SEARCH_NOT_CONFIGURED_CODE`. `getSearchPerformance($domainUuid,
$days)` returns each connection's import state, per-provider totals and the top
pages and queries (28 days by default), each source's `previous` window totals
(`null` when nothing was imported before the window) and `daily` totals, and the
`strikingDistance` queries averaging position 5 to 20; `disconnectSearch()` removes
a connection and its imported numbers.

`getReport($domainUuid)` returns the client report (uptime, certificate, latest
speed per profile, search and open findings) without verification or connection
details. `getUptimeHistory($domainUuid, $responseDays)` returns the 24-hour, 7-day
and 30-day windows, ninety daily bars and hourly response times (1 to 90 days, 7
by default); `getLighthouseHistory($domainUuid, $days)` returns the scheduled
desktop and mobile runs (1 to 30 days, 7 by default), failed runs included. A
measurement Custd does not have, such as a day without checks or an unscored
category, is `null`, never zero. `createReportShare($domainUuid, new
SiteReportShareRequest(30))` returns the share and its token once;
`listReportShares()` lists live shares without tokens and
`revokeReportShare($domainUuid, $shareUuid)` ends one.

`getReport($domainUuid, template: SiteReport::TEMPLATE_EXECUTIVE, days: 14)` picks
the report layout and search window. `saveReport($domainUuid, new
SavedSiteReportRequest('November', SiteReport::TEMPLATE_EXECUTIVE, 14))` keeps a
built report under a name (`listSavedReports()`, `getSavedReport()`,
`replaceSavedReport()`, `deleteSavedReport()`; at most 20 per domain), and
`new SiteReportShareRequest(30, $reportUuid)` shares a saved report instead of the
live one. `listAuditPages($domainUuid, $offset, $limit)` pages through the crawled
URLs, `getAuditDelta()` returns the findings the latest audit raised, raised again
and found fixed, and `setLighthousePages($domainUuid, $urls)` /
`getLighthousePages()` choose up to five extra pages for Lighthouse;
`getLighthouseHistory($domainUuid, url: $pageUrl)` reads one of them.
`getFindingSearchImpact($domainUuid, $findingUuid, $days)` compares a fixed
finding's page clicks and impressions before and after the fix (an insufficient
window has `null` numbers), and `getSearchValue($domainUuid, ['signup'], $days)`
joins search pages to the analytics goals credited to their landings. A report or
Lighthouse history from a 3.46.0-era server has a `null` `template` or `url` and
no `pages`.

Focused clients hang off the same client. `rankings()` tracks keyword
positions from Search Console (`getRankings()`, `trackKeyword()`,
`updateTrackedKeyword()`, whose request keeps the stored alert position when
`notifyPosition` is null, `untrackKeyword()`); a day the domain did not rank has a
`null` position, and once the tenant joins the shared search pool a keyword the
pool holds carries its `pool` band. `accessLogs()` reads `getTraffic()` and
`getAIVisibility()` over UTC days, and a system administrator can
`replayAccessLogHour($hourStart)`. `webData()` reads a Site's `getWebDomains()`,
`listWebPages()`, `getReferringDomains($domain, $siteUuid)` (per-source link
totals, Common Crawl authority, referring and lost domains; a count a source did
not report is `null`, never zero), `getTopicTrends()` and `getContentGap()` and
keeps its keyword lists (`listKeywordLists()`, `saveKeywordList()`,
`deleteKeywordList()`, `getKeywordClusters()`); clusters carry Bing keyword
research in `demand` (`SiteKeywordDemandSet::STATE_*`) and a list its `related`
keywords, both `null` from an older server. `searchPool()` is tenant-wide:
`getSearchPool()` reports the `termsVersion` a join must accept, and
`setSearchPool(true, $setting->termsVersion)` joins (joining without a version
throws `InvalidArgumentException` before any request;
`SiteSearchPoolClient::SEARCH_POOL_TERMS_VERSION` is the version current at this
release) while `setSearchPool(false, null)` leaves the shared search
pool, and `listSearchPoolQueries($search, $limit)` reads its k-anonymous query
bands once joined (`SEARCH_POOL_NOT_JOINED_CODE` before). `campaignLinks()`
keeps a domain's saved UTM links (`listCampaignLinks()`, `createCampaignLink()`,
`archiveCampaignLink()`). `statusPage()` publishes the
public status page of a domain's Site (`getSettings()`, `preview()`, `publish()`,
`unpublish()`, `postUpdate()`); `SiteStatusPagePublication::publicUrl($panelOrigin)`
builds the shareable link, `https://custd.com/status-page#<publicKey>` in
production, and customers subscribe to updates on that page. `nextActions()` reads what to do next: `forDomain()`
returns the status, one plain headline and the three most important actions in
Custd's fixed order (`SiteNextAction::KIND_*`; show an unknown kind by its title
and why), `portfolioSummary()` every domain's status and first action, worst
first, and `SiteReport::$nextActions` are the same three.
`SCOPE_TEMPLATE_SITE_INSIGHTS_READ` provisions a credential that reads only
these two calls. `analytics()` connects a domain to GA4 (`connectGA4($domainUuid,
$propertyId)`, `disconnectGA4()`) and `getAnalytics()` reads its landing pages,
key events and channels. `export()` reads everything Custd keeps about a domain
(`getExport()`, schema `SiteInsightsExport::SCHEMA`) and pages its daily search
metric rows (`listSearchMetrics($domainUuid, $offset, $limit)`, up to 10000).
`getPageSearchQueries($domainUuid, $url)` reads what one page ranks for, title
options and pages that could link to it; `retrySearch($domainUuid, $provider)`
imports a failing search connection again; and a system administrator reads
every scheduled task's state with `getSiteInsightsTasks()`. Refusals carry the `*_CODE` constants on the client that
made the call.

`checkPage()` takes an optional `previousUrl` and `phrase` on
`SitePageCheckRequest` and then returns the draft's `slug`, `redirect` and
`phrase`; `scope: SitePageCheckRequest::SCOPE_CONTENT` checks body content only
and returns the `checkedRules`; page facts carry `shareImage` and `faqSchema`. `compareWording()`
measures two drafts as the `content.near-duplicate` rule does; `sharedPercent` is
`null` when the texts were too short to compare. `comparePageWording(domain, firstUrl, secondUrl)`
reads the last saved observations of two pages on the verified domain. It includes each page's
state and observation time when known, and omits a comparison for unread or unavailable pages.

## Event schemas

`$client->schemas()` registers and manages the tenant's event schemas on the schema registry
(`/api/v1/schemas`). The credential names the tenant, so no slug is supplied:

```php
use HaakCo\Custd\Schemas\EventSchemaCheckRequest;
use HaakCo\Custd\Schemas\EventSchemaRegisterRequest;

$check = $client->schemas()->dryRun(new EventSchemaCheckRequest(
    "courib.delivery.created", "1.1.0", '{"type":"object"}',
));
$client->schemas()->register(new EventSchemaRegisterRequest(
    "courib.delivery.created", "Delivery created", "1.1.0", '{"type":"object"}',
));
$client->schemas()->listVersions("courib.delivery.created");
```

`validate()`, `infer()`, `activate()`, `enable()`, `disable()` and `disableEventType()` cover the
rest of the routes.

## Workflow timing imports

With a client configured for the Admin API and an authorized tenant credential:

```php
$result = $client->adminWorkflowTimings()->appendBatch('acme', $observations);
$result->requireAccepted();
```

Pass the complete import, including histories larger than 512 facts. The SDK
splits requests at 10,000 observations or 1 MiB of encoded JSON, whichever comes
first, and keeps result indexes relative to the original input. Each chunk
commits independently. If a request fails, replay with the same idempotency keys;
do not regenerate keys or discard already-observed history.

## Declaring an environment

One credential serves every environment, so sending from `dev`, a preview build,
or a local machine needs no extra provisioning:

```php
$client = new CustdClient($baseUrl, $token, ["environment" => "dev"]);

// Per event, when this one came from somewhere else.
$client->track([...$event, "environment" => "preview-pr-9"]);
```

The value is sent as the reserved `custd.environment` label; writing that label
through `labels` is rejected. It must be lowercase letters, digits and hyphens, at
most 32 characters, and `unclassified` is reserved. A tenant may restrict a
credential to a set of environments, in which case a declaration outside that set
is rejected by the API.

## Dev smoke test (Hydra)

Requires dev stack running with Hydra using JWT access tokens and ingest-api configured with `AUTH_JWKS_URL`.

```bash
export AUTH_JWKS_URL="http://localhost:4444/.well-known/jwks.json"
cd sdk-php
composer run smoke:dev
```

The smoke test uses `scripts/dev-hydra-token.sh` and `scripts/dev-seed-core.sh` to create a dev OAuth client and seed core tables (company, device type, event type, schema).

To run all SDK checks, use `mise exec -- just check` from the repository root.

## Lifecycle administration

The PHP SDK exposes typed admin clients for the five lifecycle
namespaces. Forward-only: no deprecated aliases.

```php
// Tenant storage: list/create/get/revoke, typed under Admin\TenantStorage; create takes no fields.
$locations = $client->adminTenantStorage()->list();

// Subject exports: queue, read, cancel and download one artifact scope (an expired one answers 410 Gone).
$exp = $client->adminSubjectExports()->create(new SubjectExportCreateRequest(
    idempotencyKey: "acme-2026-07-31",
    opaqueSubjectId: "subject-7f3b",
    scope: SubjectExportClient::SCOPE_BOTH,
), companySlug: "acme");
$artifact = $client->adminSubjectExports()->download($exp->id, SubjectExportClient::SCOPE_PORTABILITY, "acme");

// Physical erasures: NO cancel/retry. A force that could not run names the safe next action.
$force = $client->adminPrivacyErasures()->force($erasureUuid);
$next = $force->safeNextAction;

// Retention policies: list/get/upsert/delete + preview/apply/listRuns (page with limit/offset).
$runs = $client->adminRetention()->listRuns("acme", limit: 50);

// Offboarding: full request lifecycle + schedules, typed under Admin\Offboarding.
$sched = $client->adminOffboarding()->schedule(new OffboardingScheduleRequest(
    effectiveAt: "2026-12-31T00:00:00Z",
    gracePeriodDays: 7,
    reason: "contract_end",
    tenantSlug: "acme",
));
```

## Typed operator, app and ingest clients

Each client below takes and returns named DTOs from the namespace beside it, and
a system administrator names the tenant with the optional `companySlug` argument
where the route accepts one.

- Hosted apps: `adminApps()`. App data from a hosted app's server side:
  `appItems($siteKey, $origin, $userToken)` (Site key, link token or signed-in
  user token; never this client's credential), `appProfile($accessToken)` and the
  credential-free `publicReads()`.
- People and access: `adminUsers()`, `adminSupportAccess()`, `adminClientSetup()`,
  `adminStorage()`, `adminOAuthClientAdmissions()`.
- Measurement, plans and models: `adminMeasurementWork()`, `measurement()`,
  `adminTimePlanOperations()`, `adminUncertaintyModels()`.
- Reporting and analytics: `adminReportingGenerations()`, `reportingData()`,
  `adminAccountingEvidence()`, `analyticsReads()`, `reporting()->previewDraft()`.
- Operations: `adminOperations()`, `adminSchemaActions()`, `adminEventConfig()`,
  `adminEnvironmentPolicy()`, `adminPrivacy()`, `adminErrorIssues()`,
  `adminManagedAudit()`, `adminSystemUsage()`.
- Email and notifications: `adminEmailRelay()`, `adminNotifications()`,
  `adminCampaignEmail()`.
- Ingest: `ingestOperations()` (monitoring, diagnostics, cleanup plans and jobs)
  and `collectEvent()` / `collectEvents()` for the public browser collector. A
  system administrator's cleanup jobs act for the `acting_company_slug` client
  option, which is sent as `X-Custd-Effective-Company` on the cleanup-job list,
  read, proof and cancel calls only.

## Time-plan administration

`$client->adminTimePlans()` exposes typed, readonly `TimePlan` DTO classes for
plan drafts/revisions, previews, publication and retirement, runs, commands,
history, and annotation correction/redaction. Every call takes a company slug;
the server remains authoritative for allocations and command results.

```php
use HaakCo\Custd\Admin\TimePlan\Definition;
use HaakCo\Custd\Admin\TimePlan\DefinitionBlock;
use HaakCo\Custd\Admin\TimePlan\DraftRequest;

$definition = new Definition(
    horizonMs: 60_000,
    blocks: [new DefinitionBlock(
        uuid: "block-1", semanticKey: "focus", title: "Focus", basis: "absolute",
    )],
);

$preview = $client->adminTimePlans()->preview("acme", $definition);
$plan = $client->adminTimePlans()->create("acme", new DraftRequest(
    planKey: "focus", name: "Focus", definition: $definition,
));
```

The typed clients are available in `v1.8.25` and later.

## Usage reporting

`$client->adminUsage()` reads the attributed usage for the authenticated tenant
through `GET /api/v1/admin/usage/me`. The tenant comes from the credential, so
the call never names a company slug. The system-admin `/usage` and `/usage/export`
surfaces are deliberately not exposed.

```php
$report = $client->adminUsage()->get(new \HaakCo\Custd\Admin\Usage\Query(
    meterSlug: "events.ingested",
    start: "2026-09-01T00:00:00Z",
    end: "2026-10-01T00:00:00Z",
    limit: 200,
));
```

`$report` is a typed `HaakCo\Custd\Admin\Usage\Report`; `->totals` carries the
per-meter totals and `->rows` the per-window detail. `->containsProvisional` and
`->containsIncomplete` are the server's own assessment, so a caller deciding
whether a number is settled reads them rather than assuming every row is final.
The window is a named `HaakCo\Custd\Admin\Usage\Query` and is validated when it
is built: an omitted `start`/`end` uses the service default (the trailing 30
days), an omitted `limit` uses `UsageClient::DEFAULT_LIMIT`, and a limit outside
`1..UsageClient::MAX_LIMIT` or an invalid RFC3339 window throws before a request
is sent.

## Auth-project admin helpers

`$client->adminAuthProjects()` manages Custd projects, their environments, and
the application principals a directory holds, through
`/api/v1/admin/auth-projects`:

- `createProject` / `listProjects` (pass the previous `nextAfter` as the `$after` cursor)
- `createEnvironment`
- `listPrincipalSessions`, `revokePrincipalSession`, `revokePrincipalSessions`
- `revokePrincipalMembership`

Every call takes an `AuthProject\RequestOptions`. A machine credential must name
the platform user it acts for in `owningUserUuid`, sent as
`X-Custd-Owning-User-UUID`; Custd validates the named user as a live member of
the machine's own company. A human administrator's own token subject is the actor
and leaves it unset. The operations Custd makes retry-safe (`createProject`,
`revokePrincipalSession`, `revokePrincipalSessions`) require `idempotencyKey` and
throw before a request is sent when it is blank.

```php
$creation = $client->adminAuthProjects()->createProject(
    new \HaakCo\Custd\Admin\AuthProject\CreateRequest(
        slug: "hosting-eu",
        name: "Hosting EU",
        environmentSlug: "production",
        identityMode: \HaakCo\Custd\Admin\AuthProjectClient::IDENTITY_ISOLATED,
    ),
    new \HaakCo\Custd\Admin\AuthProject\RequestOptions(
        owningUserUuid: $owningUserUuid,
        idempotencyKey: "create-hosting-eu",
    ),
);
```

Responses are typed `HaakCo\Custd\Admin\AuthProject` DTOs: `Creation`,
`ListResponse`, `ApplicationSessionInventory`, `SessionRevocation` and
`MembershipRevocation`.

## Analytics range query

`$client->analytics()->queryRange()` reads a tenant's own events across an
inclusive date range of at most `Client::MAX_RANGE_DAYS` days, with
`groupBy => "day"`. It returns a typed `RangeQueryResponse` whose `buckets`
carry each day's `count`/`source`/`complete` and whose `rows` are the capped
detail. The per-day completeness is the server's assessment and is surfaced
unchanged.

```php
$range = $client->analytics()->queryRange(new \HaakCo\Custd\Analytics\RangeQueryRequest(
    from: "2026-02-23",
    to: "2026-05-23",
    eventType: "page-view",
    limit: 10000,
    source: "auto",
    groupBy: "day",
));
```

The request is a named `HaakCo\Custd\Analytics\RangeQueryRequest`; `source` accepts
only omitted/empty, `auto`, or `duckdb`.

SDKs never log signed URLs, raw personal data, export bytes, or
subject identifiers outside opaque IDs.
