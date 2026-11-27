# custd SDK (Python)

Ingestion client with retry, batching, and bounded queueing.

## Compatibility

Version `1.0.0` targets the canonical ingest endpoint
`POST /api/v1/events`. The legacy `POST /v1/events` path is not supported.

## Install

Install the `custd-sdk` package from the public GitHub repo (subdir; not on
PyPI):

```bash
pip install "custd-sdk @ git+https://github.com/haakco/custd-sdk.git@v3.0.0#subdirectory=sdk-python"
```

Pin `@v3.0.0` (or a later tag) to the release you want.

## Usage

```python
from custd import CustdClient, FileQueueStorage, create_dogfood_event

client = CustdClient(
    base_url="http://localhost:8087",
    oauth={
        "client_id": "producer-client",
        "client_secret": "<secret>",
        "token_url": "http://localhost:4444/oauth2/token",
        "audience": "custd",
        "scopes": ["events.write"],
    },
    retry={"max_attempts": 3},
    batch={"max_batch_size": 25},
    queue={
        "enabled": True,
        "storage": FileQueueStorage("/var/lib/custd/events.json", max_bytes=10 * 1024 * 1024),
        "max_queue_size": 1000,
    },
)

client.track({
    "eventTypeSlug": "page-view",
    "schemaVersion": "1.0.0",
    "timestamp": "2026-01-23T12:00:00.000Z",
    "companySlug": "acme",
    "context": {
        "page": {"url": "https://example.com"},
        "device": {"type": "desktop"},
    },
    "payload": {"example": True},
})

client.flush()
```

`MemoryQueueStorage` is the default. `FileQueueStorage` writes an atomic,
private JSON replacement so queued event UUIDs survive process restart. Its
`max_bytes` bound raises `QueueFullError` instead of silently losing events;
the client raises the same error when `max_queue_size` is reached, preserving
the queued events for an explicit backpressure decision. Use one queue file
per process and protect the file as it contains event payloads.

When Custd provisions a producer it returns a flat credential bundle. Pass it
straight to `from_provisioned_producer` — no OAuth wiring required:

```python
from custd import CustdClient

client = CustdClient.from_provisioned_producer(credentials)
client.track({
    "eventTypeSlug": "order.completed",
    "schemaVersion": "1.0.0",
    "companySlug": credentials["companySlug"],
    "context": {"device": {"type": "server"}},
    "payload": {"orderTotal": 42},
})
```

Use `redacted_provisioned_producer(credentials)` to show the bundle on a
dashboard without exposing the client secret.

The client also accepts `token="<token>"` for existing static-token
integrations. Producer clients should prefer the OAuth2 `client_credentials`
config above so token refresh stays inside the SDK.

## Schema Admin Helpers

Use `client.admin.schemas` for setup-time schema registration. It calls the schema
registry's `/api/v1/schemas` routes on the same base URL:

```python
from custd import CustdClient

client = CustdClient(
    base_url="http://localhost:8087",
    oauth={
        "client_id": "producer-client",
        "client_secret": "<secret>",
        "token_url": "http://localhost:4444/oauth2/token",
        "audience": "custd",
        "scopes": ["events.write", "schemas.write"],
    },
)

client.admin.schemas.list()
client.admin.schemas.list_versions("checkout.started")
client.admin.schemas.get("checkout.started", "1.0.0")
client.admin.schemas.register({
    "slug": "checkout.started",
    "name": "Checkout started",
    "version": "1.0.0",
    "jsonSchema": '{"type": "object"}',
    "enabled": True,
    "isActive": True,
})
# A new version registers under the same slug.
client.admin.schemas.register({
    "slug": "checkout.started",
    "name": "Checkout started",
    "version": "1.1.0",
    "jsonSchema": '{"type": "object"}',
    "enabled": True,
    "isActive": True,
})
```

`validate`, `dry_run` and `infer` check a schema without registering it;
`activate`, `enable`, `disable` and `disable_event_type` change a version's or an
event type's state. Operators act on another tenant's schemas through
`client.admin.schema_actions`.

Supported feature parity and intentionally missing helpers are documented in the SDK
root README.

Dogfood producers can use `create_dogfood_event`:

```python
event = create_dogfood_event({
    "eventTypeSlug": "dogfood.producer.metric",
    "schemaVersion": "1.0.0",
    "companySlug": "haakco",
    "sourceSystem": "vorrent",
    "sourceCompany": "haakco",
    "environment": "production",
    "correlationId": "run-123",
    "payload": {"metric": "media_cache.queue_depth", "value": 7},
})
```

The SDK requires `companySlug` and rejects plaintext non-local Custd/token URLs.
Localhost HTTP is allowed for development.

## Browser Site Admin Helpers

Server-side admin code can use `client.admin.sites` to create, list, get,
delete, and rotate browser tracker Sites. `create` returns the public write key
once. `list` and `get` return Site metadata without the write key.
`rotate_write_key` returns the replacement write key once; update tracker config
and stop using the old key after rotation.

## Site Insights (site domains)

Server-side code can use `client.admin.site_domains` to claim a host for a
Site, prove control (`verify`, or `attest` from a site-bound broker
credential), queue an audit, read findings and outages, choose the check mode,
set the alert address and connect Google or Bing search numbers. The routes are
under `/api/v1/site-domains`; a system administrator names the tenant with the
`company_slug=` keyword.

```python
from custd import SITE_DOMAIN_NOT_VERIFIED_CODE, SITE_RULE_TITLE_MISSING, RequestError

domains = client.admin.site_domains
domain = domains.create({"siteUuid": site_uuid, "host": "example.com"})
# Or omit siteUuid: Custd places the host (SITE_CHOICE_REQUIRED_CODE when it cannot tell).
# Publish domain["ownership"]["instructions"] (DNS TXT or well-known file), then:
domains.verify(domain["domainUuid"])
try:
    domains.request_audit(domain["domainUuid"])
except RequestError as error:
    if error.code != SITE_DOMAIN_NOT_VERIFIED_CODE:
        raise

findings = domains.list_findings(domain["domainUuid"], "open")["findings"]
missing_titles = [f for f in findings if f["rule"] == SITE_RULE_TITLE_MISSING]
```

`SITE_RULE_*` constants (all of them in `SITE_RULE_IDS`) are the stable rule
IDs a finding carries in `rule`; key any client-side fix on them. Each finding's
`remedy` says what the fix changes (`kind`, `element`) and, for some rules,
carries ready-to-copy `generated` code; `recheckable` says a one-page recheck
can confirm the fix.

Page tools: `get_page_facts`, `request_page_recheck` / `get_page_recheck` /
`list_page_rechecks` (one-page rechecks, up to `SITE_PAGE_RECHECK_READ_LIMIT`
read at once, `SITE_PAGE_RECHECK_LIMIT_CODE` past the hourly allowance),
`check_page` (draft HTML, never stored) and `test_robots` (pasted or live
robots.txt). Search: `list_search_rows` pages one dimension and names
providers that cannot report it in `unavailable`; `request_search_inspection`
and `list_search_inspections` run Search Console URL Inspection. A Site's
brands, competitors and markets are `get_project_context` /
`set_project_context`. Client reporting: `get_report`, `get_uptime_history`,
`get_lighthouse_history` and `list_report_shares` / `create_report_share` /
`revoke_report_share`. IndexNow: `enable_indexnow` names the key file to host,
`verify_indexnow` checks it, `submit_indexnow` queues URLs, and
`get_indexnow` / `disable_indexnow` read or turn it off. An unmeasured value (a score, `position`,
`upPercent`, `fleschReadingEase`) is absent from the dict, never 0.

Audit pages: `list_audit_pages` (offset/limit paging), `get_audit_delta`
(new, reopened and fixed findings), `get_lighthouse_history(domain, days, url)`
for an extra page, and `get_lighthouse_pages` / `set_lighthouse_pages`.
Saved reports: `get_report(domain, template=..., days=...)`,
`list_saved_reports`, `save_report`, `get_saved_report`,
`replace_saved_report`, `delete_saved_report`, and
`create_report_share(domain, days, report_uuid=...)` to share one. Public web
data (Site-scoped; a site-bound credential may omit `site_uuid`):
`get_web_domains`, `list_web_pages`, `get_topic_trends`, `get_content_gap`,
`list_keyword_lists`, `save_keyword_list`, `delete_keyword_list` and
`get_keyword_clusters`. Links: `get_referring_domains(domain, site_uuid)` lists
the domains linking to an own or competitor domain by source (Bing, Common
Crawl, Custd's crawl) with its graph authority and lost links; an unmeasured
count or rank is absent, a real 0 stays 0. Access logs: `get_traffic`, `get_ai_visibility` and,
for system administrators, `replay_access_log_hour(hour_start)`. Rank tracking:
`get_rankings`, `track_keyword`, `update_tracked_keyword` and
`untrack_keyword` (`update_tracked_keyword(..., paused=True)` without
`notify_position` keeps the stored alert position); a day the keyword did not
rank has no `position`. Search value: `get_finding_search_impact(domain,
finding, days)` compares a fixed finding's page before and after the fix, and
`get_search_value(domain, goals, days)` credits goal events to search landing
pages. Shared search pool (tenant-wide; a site-bound credential is refused):
`get_search_pool`, `set_search_pool(joined, terms_version)` to join or leave, and
`list_search_pool_queries(search, limit)` for pooled queries' demand and
position bands (403 `SITE_SEARCH_POOL_NOT_JOINED_CODE` before joining). Joining
is the organisation's acceptance of the pool terms: pass the setting's
`termsVersion` (or `SITE_SEARCH_POOL_TERMS_VERSION`, current at this release);
a join without one raises `ValueError` before any request, a stale one is a
plain 400, and leaving sends only `{"joined": false}`.
`get_rankings` carries the rankings' `pool` state and each keyword's pool
band when there is one. Draft tools: `check_page(..., previous_url=, phrase=)`
adds `slug`, `redirect` and `phrase`, page facts carry `shareImage` and
`faqSchema`, and `compare_wording(domain, first, second)` measures shared wording
(`sharedPercent` absent when not compared). `check_page(..., scope=SITE_PAGE_CHECK_SCOPE_CONTENT)`
checks body content only and lists the rules it ran in `checkedRules` (a listed
rule without a finding passed); `get_page_facts` answers 404
`SITE_PAGE_NOT_READ_CODE` until an audit or recheck has read the page.
`compare_page_wording(domain, first_url, second_url)` compares two saved page observations on the
verified domain, with their observation states and times. Unread or unavailable pages have no
comparison.
`get_page_search_queries(domain, url)` returns the Google queries a page ranks
for, title options built from them and the Site's pages that mention them
(`window` absent until an import). Keyword research: `get_keyword_clusters`
carries Bing `demand` and each cluster's `bingWeeklyImpressions`, and a keyword
list its `related` keywords; a number Bing did not report is absent, and an older
server omits `demand`. GA4: `get_analytics`, `connect_analytics(domain,
property_id)` and `disconnect_analytics` (`SITE_ANALYTICS_PROPERTY_INVALID_CODE`,
`SITE_ANALYTICS_CONNECTION_NOT_FOUND_CODE`). Export: `export(domain)` returns
everything Site Insights keeps for a domain (`SITE_INSIGHTS_EXPORT_SCHEMA`) and
`export_search_metrics(domain, offset, limit)` pages its daily search metrics
(limit 1 to 10000). `retry_search_import(domain, provider)` makes a failing
import due now (409 `SITE_SEARCH_RETRY_NOT_FAILING_CODE`), and system
administrators read every task's state and backlog with
`list_site_insights_tasks()` (`SITE_INSIGHTS_TASK_*`). Campaign links:
`list_campaign_links(domain, include_archived)`, `create_campaign_link` and
`archive_campaign_link` (409 `SITE_CAMPAIGN_LINK_TAKEN_CODE` or
`SITE_CAMPAIGN_LINK_LIMIT_CODE`). Status page: `get_status_page_settings(domain)`,
`preview_status_page(domain, draft)`, `publish_status_page(domain, draft)`,
`unpublish_status_page(domain)` and `post_status_page_update(domain, request)`;
`site_status_page_public_url(publication, "https://custd.com")` builds the
customer link. Next actions: `get_next_actions(domain)`
returns the status, one plain `headline` and the three most important actions in
Custd's fixed order (`SITE_NEXT_ACTION_*`; show an unknown kind by its `title`
and `why`), `get_portfolio_summary()` every domain's status and `firstAction`,
worst first, and a report's `nextActions` are the same three;
`SCOPE_TEMPLATE_SITE_INSIGHTS_READ` provisions a credential that reads only
these two calls. Older servers (the Custd that SDK 3.46.0 targeted) send no report `template` (the default is full) and
no Lighthouse `url` / `pages`; those keys are then absent.

## Dev smoke test

Requires the dev stack running with Hydra using JWT access tokens and ingest-api
configured with `AUTH_JWKS_URL`.

```bash
cd sdk-python
python3 scripts/smoke-dev.py
```

To run all SDK checks, use `mise exec -- just check` from the repository root.

## Lifecycle administration

The Python SDK exposes typed admin clients for the five lifecycle
namespaces. Forward-only: no deprecated aliases.

```python
admin = client.admin

# Deleted tenants: historical_cleanup (needs idempotency_key) then finalize, both by company id.
admin.tenants.historical_cleanup("acme", company_id, {"idempotency_key": "cleanup-acme"})
admin.tenants.finalize("acme", company_id)

# Tenant storage: list/create/get/revoke. Custd assigns every field, so create takes none.
loc = admin.tenant_storage.create()
admin.tenant_storage.get(loc["id"])

# Subject exports: full request lifecycle; download reads one scope's artifact.
exp = admin.subject_exports.create({
    "opaqueSubjectId": "subject-01J5...",
    "scope": "both",
    "idempotencyKey": "acme-2026-07-31",
})
artifact = admin.subject_exports.download(exp["id"], "portability")

# Physical erasures: NO cancel/retry. force answers the erasure, or the next safe step.
forced = admin.privacy_erasures.force("pe_01J5...")

# Retention policies: list/get/upsert/delete + preview/apply/list_runs (paged by offset).
runs = admin.retention.list_runs("acme", limit=25)

# Offboarding: full request lifecycle + schedules.
sched = admin.offboarding.schedule({
    "tenantSlug": "acme",
    "effectiveAt": "2026-12-31T00:00:00Z",
    "gracePeriodDays": 7,
    "reason": "contract_end",
})
```

## Time-plan administration

`client.admin.time_plans` exposes typed `TimePlan*` dataclasses for plan
drafts/revisions, previews, publication and retirement, runs, commands,
history, and annotation correction/redaction. Every call takes a company slug;
the server remains authoritative for allocations and command results.

```python
from custd import TimePlanDefinition, TimePlanDefinitionBlock, TimePlanDraftRequest

definition = TimePlanDefinition(
    horizonMs=60_000,
    blocks=[TimePlanDefinitionBlock(
        uuid="block-1", semanticKey="focus", title="Focus", basis="absolute"
    )],
)

preview = client.admin.time_plans.preview("acme", definition)
plan = client.admin.time_plans.create(
    "acme", TimePlanDraftRequest(planKey="focus", name="Focus", definition=definition)
)
```

The typed clients are available in `v1.8.25` and later.

## Usage reporting

`client.admin.usage.get` reads the attributed usage for the authenticated tenant
through `GET /api/v1/admin/usage/me`. The tenant comes from the credential, so
the call never names a company slug. System administrators use `list_usage` and
`export_usage` with an optional `company_slug`, and `list_storage_usage` /
`get_retained_usage` for retained storage against each tenant's limit.

```python
report = client.admin.usage.get({
    "meterSlug": "events.ingested",
    "start": "2026-09-01T00:00:00Z",
    "end": "2026-10-01T00:00:00Z",
    "limit": 200,
})
```

`report["totals"]` carries the per-meter totals and `report["rows"]` the
per-window detail. `containsProvisional` and `containsIncomplete` are the
server's own assessment, so a caller deciding whether a number is settled reads
them rather than assuming every row is final. An omitted `start`/`end` uses the
service default (the trailing 30 days) and an omitted `limit` uses
`USAGE_DEFAULT_LIMIT`; a limit outside `1..USAGE_MAX_LIMIT` raises before a
request is sent.

## Operations, measurement and notifications

These surfaces have typed calls. Responses are named `TypedDict` DTOs and a JSON
null list always comes back as `[]`.

- `client.measurement` reads the analytics API: `overview()`, `projects` forecast and
  decision-simulation runs, `predictions` reads and `uncertainty_models` runs.
  `client.admin.measurement.projects` and `client.admin.uncertainty_models` manage them.
- `client.admin.ingest` covers ingest-api reprocessing, redaction, monitoring,
  diagnostics and generated-data cleanup plans and jobs; `client.admin.get_account()`
  reads the caller's account.
  A system administrator names a tenant with `CustdClient(..., acting_company_slug="acme")`:
  every admin route call that names no `companySlug` then sends that one, and the cleanup-job
  list, get, proof and cancel name it in `X-Custd-Effective-Company`, the only place
  ingest-api reads it.
- Operator areas: `system` (jobs, scheduled tasks, status), `rls`, `environment_policy`,
  `sdk_usage`, `storage_alerts`, `accounting_evidence`, `event_types`, `ingest_claims`,
  `tenant_manifest`, `error_issues`, `managed_audit`, `privacy`, `webhooks`,
  `notification_destinations`, `email_relay` and `campaign_email`, all on `client.admin`.
- Credential-free routes are module functions in `custd.ingest_operations`:
  `collect_event` / `collect_events` (a Site's public write key), `ErrorCaptureClient`
  (error metadata relay), `read_shared_site_report` and
  `read_auth_domain_monitoring_inventory`. A published status page's own calls are
  `read_public_status_page`, `subscribe_to_public_status_page`,
  `confirm_public_status_page_subscription` and `unsubscribe_from_public_status_page`
  in `custd.admin_site_status_page` (the page's public key is their authority). A
  monitored job or private probe reports with `submit_site_heartbeat`,
  `submit_private_uptime` and `get_private_uptime_work` in `custd.site_monitor_reports`,
  given a `SiteMonitorDestination` built from the monitor's `reportPath` and one-time
  token; they send only that token and never follow a redirect. All are also exported
  from `custd`.
- A data-space broker issues an owner a one-minute AI settings code with
  `client.admin.site_domains.create_ai_owner_handoff`; `redeem_site_ai_owner_handoff`
  opens that owner's session and `SiteAIOwnerClient` reads and changes its settings and
  consent (`custd.site_ai_owner`).

## Machine access and request IDs

`client.admin.machine_access` sets what the company's machine credentials may do per feature
area. The policy only narrows a client's scopes, never widens them:

```python
from custd import MACHINE_ACCESS_BLOCKED_CODE, RequestError, record_metadata

client.admin.machine_access.update({"areas": [{"area": "privacy_erasure", "state": "blocked"}]})
client.admin.machine_access.update_override("ci-deploy", {"areas": [{"area": "reporting", "state": "allowed"}]})
effective = client.admin.machine_access.get_effective("ci-deploy")  # per area: allowed, decidedBy

with record_metadata() as recorder:
    try:
        client.admin.request("GET", "/reporting/packs")
    except RequestError as error:
        if error.code == MACHINE_ACCESS_BLOCKED_CODE:
            print(error.machine_access)  # area, blockedBy (company, machine or support_automation)
        print(error.request_id)  # quote it in a support request
print(recorder.request_id)
```

`record_metadata()` records the `X-Request-Id` of every answer inside the block, refusals
included. A `RequestError` carries `request_id` (the `X-Request-Id`, else the flat envelope's
`requestId`, else the problem's `traceId`) and the problem's `trace_id`.

## Auth-project admin helpers

`client.admin.auth_projects` manages Custd projects, their environments, and the
application principals a directory holds, through `/api/v1/admin/auth-projects`:

- `create_project` / `list_projects` (pass the previous `nextAfter` as the `after` cursor)
- `create_environment`
- `list_principal_sessions`, `revoke_principal_session`, `revoke_principal_sessions`
- `revoke_principal_membership`

Every call takes an `AdminRequestOptions`. A machine credential must name the
platform user it acts for in `owning_user_uuid`, sent as
`X-Custd-Owning-User-UUID`; Custd validates the named user as a live member of
the machine's own company. A human administrator's own token subject is the actor
and leaves it unset. The operations Custd makes retry-safe (`create_project`,
`revoke_principal_session`, `revoke_principal_sessions`) require
`idempotency_key` and raise before a request is sent when it is empty.

```python
creation = client.admin.auth_projects.create_project(
    {
        "slug": "hosting-eu",
        "name": "Hosting EU",
        "environmentSlug": "production",
        "identityMode": "isolated",
    },
    {"owning_user_uuid": owning_user_uuid, "idempotency_key": "create-hosting-eu"},
)
```

Responses are typed: `AuthProjectCreation`, `AuthProjectListResponse`,
`ApplicationSessionInventory`, `ApplicationSessionRevocation` and
`ApplicationMembershipRevocation`.

### Hosted apps

`client.admin.auth_projects` also creates and operates hosted apps under
`/api/v1/admin/apps`: `create_app`, `list_apps(after=...)`, `get_app`,
`pause_app`, `resume_app`, `repair_app`, `set_app_sign_in`, and
`create_app_deploy_credential` / `list_app_deploy_credentials` /
`delete_app_deploy_credential`. Create, pause, resume, repair and sign-in
require `idempotency_key`.

## Hosted-app items and profile

`AppClient` calls the item routes under `/api/v1/app/` as a hosted app: its
Site key, one of its allowed origins, and a link token or the signed-in user's
access token. `read_app_discovery(api_base_url, host)` reads the app's public
discovery document.

```python
from custd.app_items import AppClient, read_app_discovery

discovery = read_app_discovery("https://api.custd.com", "counter.apps.custd.com")
app = AppClient.from_discovery(discovery, "https://counter.apps.custd.com")
created = app.create_item({"kind": "measurement_project", "measurementProject": project})
owner = app.link(created["ownerToken"])
owner.add_measurements({"rows": rows})
read = owner.read(etag=previous_etag)  # {"status": "not_modified"} while unchanged
```

`app.with_user_token(token).owned_item(item_uuid)` reaches a signed-in owner's
item with no link. Alert-email links use `read_alert_unsubscribe_page` and
`unsubscribe_alert_email_by_token`. `CurrentAppProfileClient(api_base_url,
access_token)` reads and changes the signed-in user's own profile and photo.

`create_account_entry` obtains a one-use ticket that opens hosted account
settings, with a link back to `return_path` on the app. POST the ticket as a
form field to `action_url` in the same tab; keep it out of URLs and logs.

```python
from custd import AppAccountEntryRequest, CurrentAppProfileClient

entry = CurrentAppProfileClient("https://api.custd.com", access_token).create_account_entry(
    AppAccountEntryRequest(
        issuer="https://auth.example.com",
        application_origin="https://app.example.com",
        return_path="/mine",
    )
)
# Render <form method="post" action={entry.action_url}> with a hidden "ticket" field.
```

## Private app messages

`AppMessagesClient` uses the signed-in user's application access token and the
HTTPS API origin. Pass a token callback when the application refreshes tokens.
It sends search terms in the JSON body and stops on HTTP redirects.

```python
from custd import AppMessagesClient

messages = AppMessagesClient("https://api.custd.com", access_token)
session = messages.session()
if session["importAllowed"]:
    batch = messages.import_batch({"source": "imessage", "messages": imported_messages})
    # Apply each result to the corresponding external ID before advancing the import.
page = messages.search({"query": "meeting", "limit": 25})
```

Search continues by passing `nextCursor` as `cursor` with the same filters.
Keep returned message content and bearer tokens out of logs. An HTTP refusal
raises `RequestError` with its status and omits the response body.

## Analytics range query

`client.analytics.query_range` reads a tenant's own events across an inclusive
date range of at most `ANALYTICS_MAX_RANGE_DAYS` days, with
`groupBy="day"`. `buckets` carries each day's `count`/`source`/`complete` and
`rows` the capped detail. The per-day completeness is the server's assessment
and is surfaced unchanged.

```python
response = client.analytics.query_range({
    "from": "2026-02-23",
    "to": "2026-05-23",
    "eventType": "page-view",
    "limit": 10000,
    "source": "auto",
    "groupBy": "day",
})
```

SDKs never log signed URLs, raw personal data, export bytes, or
subject identifiers outside opaque IDs.
