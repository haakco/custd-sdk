# CouriB Integration — SDK Improvements Plan (2026-06-11)

**Source:** CouriB (cb monorepo) is integrating all three surfaces (Laravel API, Vike/React web, React Native driver app) against custd using this SDK at `v1.1.4`. The integration plan lives at `cb:docs/plans/2026-06-11_custd_analytics_integration_plan.md`; platform-side asks live at `custd:docs/plans/2026-06-11-courib-integration-requirements.md`. These are the SDK gaps found, prioritized for the SDK team, with the workaround CouriB ships in the meantime. Findings verified by source read at tag `v1.1.4` on 2026-06-11.

---

## P1 — Target: v1.2

### 1. `SendCustdEvent` job is unusable for real Laravel consumers

`laravel-package/src/Jobs/SendCustdEvent.php` is `final` and implements only `ShouldQueue` — no `Dispatchable`, no `Queueable`, no `InteractsWithQueue`. Consumers cannot set queue name, tries, backoff, or delay, and `SendCustdEvent::dispatch()` doesn't exist (only the global `dispatch(new ...)` form works).

**Ask:** add `Dispatchable`, `Queueable`, `InteractsWithQueue`, sensible `$tries`/`$backoff` defaults (configurable via `config/custd.php`), keep the secrets-free serialization guarantee + its test.
**CouriB workaround:** cb-owned `App\Jobs\Custd\SendCustdEventJob` duplicating the 10-line job with traits — delete it when v1.2 lands.

### 2. Laravel queue mode is an Octane/FPM footgun

With `CUSTD_QUEUE_ENABLED=true`, events buffer in an in-process `MemoryQueueStore` and only auto-flush at `batch.max_batch_size` (default 100) — sub-batch buffers die silently at request end (FPM) or accumulate per-worker (Octane). `CustdServiceProvider` has no config hook to inject a `QueueStore`, so the existing `FileQueueStore` is unreachable via config.

**Ask:** either (a) add a `queue.store` config hook (class-string resolved from the container), or (b) deprecate the in-process queue for Laravel and document "dispatch the job onto Laravel queues" as the only supported async path. Add a loud doc warning either way.
**CouriB workaround:** `CUSTD_QUEUE_ENABLED=false` pinned, everything rides Laravel queues.

### 3. Browser tracker SPA tracking is incomplete

`installSpaTracking()` (`sdk-js/src/browser-tracker.ts:103-112, 155-161`) patches `pushState`/`replaceState` only:

- **No `popstate` listener** — back/forward navigations are never tracked.
- **No initial page view** — consumers must know to call `trackPageView()` once on load.

**Ask:** add a popstate listener inside `installSpaTracking()` and an option like `trackInitialPageView: true` (or fire it from `installSpaTracking()` by default with an opt-out). Document the behavior matrix.
**CouriB workaround:** manual `trackPageView()` on hydration + own `popstate` listener.

### 4. Dogfood sanitizer silently drops payload keys

`createDogfoodEvent` (JS `index.ts:651-690`, PHP `CustdClient.php:383-412`) recursively drops payload keys whose normalized names match the forbidden list (`token`, `signedUrl`, `password`, …) **and** its own stamp names (`environment`, `sourceSystem`, `schemaVersion`, `correlationId`, `sourceCompany`) — without any error or warning. A legitimate field named `token` or `environment` vanishes from every event for months before anyone notices.

**Ask:** strict mode — either throw on dropped keys, or an `onDroppedKey` callback / returned `droppedKeys` list, opt-in via config so existing consumers don't break. The sanitizer must never be the redaction layer consumers rely on (it's a backstop), but it also must not silently eat data.
**CouriB workaround:** a pre-send assertion that fails loudly on any key matching the list (kept in sync by hand — brittle).

### 5. Publish the packages to registries + CI publish jobs

Neither package is published anywhere (verified: npmjs 404, HaakCo Verdaccio 404, Packagist 404; `ci.yml` has no publish job). Consumers install via pnpm GitHub-subdir spec (`github:haakco/custd-sdk#v1.1.4&path:sdk-js`) which depends on `prepare`-time `tsc` builds (`dist/` is gitignored), pnpm build-script allowlisting, and the `node >=24 <25` engines pin; Composer consumers need a VCS repository entry.

**Ask:** publish `@haakco/custd-sdk` to HaakCo Verdaccio (`https://verdaccio.k8.haak.co/`) with a tag-triggered CI publish job (built `dist/` included); consider Packagist (or a Composer-repo equivalent) for `haakco/custd-sdk`. This also fixes reproducibility (no install-time compilation).

### 6. README documents a token host that does not exist

README examples use `https://custd-auth.k8.haak.co/oauth2/token` — that hostname does not resolve (verified). The real host is `https://auth.k8.haak.co/oauth2/token`. Also: the Browser/script-tag section depends on `GET /api/v1/sites/{siteUuid}/config`, which is 404 in production — mark that path as not-yet-available or remove it (platform ask #2 in the custd plan).

**Ask:** fix the host in all examples; gate the script-tag docs on the platform endpoint shipping.

## P2

### 7. Schema admin helpers in the SDKs

The SDKs expose admin helpers for tenants/OAuth-clients/sites but none for schema registration, so consumers must hand-roll HTTP against `POST /api/v1/schemas` — which violates this repo's own "no one-off clients in product repos" rule. CouriB built `infra/custd/register-schemas.sh` (raw curl) as a stopgap.

**Ask:** `adminSchemas()` (list/get/register/new-version) in PHP + TS + Go, and/or a `custd-sdk-setup --register-schemas <dir>` mode for the Go CLI.

### 8. React Native support for the core client

The core `CustdClient` is *nearly* RN-clean (guards on `window`/`navigator`/`localStorage`, `crypto.randomUUID` fallback, pluggable queue storage, `getToken` avoids embedding secrets), but: the `QueueStorage` interface is **synchronous** (`load/save/clear`), so AsyncStorage can't back it (MMKV can); there are no connectivity/app-state flush hooks (browser-only `online` listener; `setInterval` keeps running backgrounded).

**Ask:** an async-capable `QueueStorage` (or documented MMKV adapter), optional flush-trigger injection (consumer passes NetInfo/AppState callbacks), and an RN section in the README.
**CouriB note:** the driver app deliberately relays through the CouriB API instead of using the SDK directly (no credentials in the binary), so this is P2 — useful for other HaakCo RN apps.

---

**Status:** Proposed — awaiting SDK-team triage. Items 1–4 each have a CouriB-side workaround that should be deleted when the SDK fix ships; item 5 removes install-time fragility for every future consumer.
