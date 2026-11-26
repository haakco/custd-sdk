# SDK API Parity Automation Plan

**Goal:** Every public Custd operation has the same typed call in Go, TypeScript, Python, PHP and Rust,
or a recorded reason it is excluded, and a machine check on each side catches the next gap or drift
before a consumer does.

**Status (2026-11-26, checkpoint 3):** Active. Route parity is finished; M4 and M5 are open.

- **Done:**
  - **M1:** the snapshot, its exclusion rule, query parameters and `just surface-check`.
  - **M2:** route conformance in every SDK, asserting method, path and declared query parameters.
  - **M3:** example decoding plus strict field checks in Go, Python and PHP, a field-retention check in
    JS, and decode and re-encode round trips in Rust.
  - **M6:** Go, JS, Python, PHP and Rust each cover all 634 required operations of the Custd
    `82873e00c` snapshot.
  - **M7:** `v3.66.0` is released, and every consumer on the development server runs it.
- **Open:**
  - **M4:** a Custd change to its catalogue or OpenAPI does not yet update the SDK snapshot by itself.
    Today `just sync-api-contract ../custd`, then `just surface-check`, is the manual step. A cross-repo
    pull request needs a token decision, because Custd is private.
  - **M5:** consumers do not yet bump automatically or replay Custd's fixtures.
- **Resume:** pick M4 or M5. Consumers with no local checkout are in the
  [SDK 3.66 consumer adoption plan](./2026-11-26_0300_sdk-3-66-consumer-adoption_plan.md).

**Rule:** a change to any SDK lands in every SDK in the same release. A route present in one SDK and
absent or different in another is a defect, not a backlog preference.

## Why automation, not review

The 2026-11-25 review found two decoders that crashed on real server responses: a workflow run with no
dimensions, and reporting-pack preview, which had been broken in PHP for three months. Both were invisible
because nothing compared the SDKs with the server's generated contract. Coverage was measured once, by a
heuristic script. People cannot keep five SDKs and about 540 admin operations aligned by reading diffs.

## Current state (verified 2026-11-26, heuristic)

- Custd owns the route truth: `docs/api/generated/admin-api.openapi.yaml` (538 operations, checked by
  `just api-docs-check`) and the operation catalogue `docs/api/api-parity.json` (803 entries with CLI and
  MCP dispositions, checked by `custdctl validate api-parity`). That catalogue has no SDK disposition.
- The SDK repo has no record of which operations each language covers. `sdk-go/admin_surface_parity_test.go`
  pins a handful of routes by hand.
- A path-fragment scan (false positives and negatives both seen, for example PHP tenant storage) gives:

| Area | Gap |
| --- | --- |
| Site monitoring: heartbeats, private uptime, finding dismissals, incident acknowledgement, manual uptime check | Go only; `approval` is in no SDK |
| Auth projects | Environment releases missing in PHP and Python. Brand logo is Go only. `domain/mint`, `domain/image-override` and `app-links` are in no SDK |
| Producer provisioning | PHP has no reservations calls and uses untyped arrays (`sdk-php/src/Provisioning/Client.php:45-112`). `allowedEnvironments` on create is missing in Go |
| Admin users, notification webhooks, scheduled tasks, impersonation, support access, jobs, OAuth client admissions, environment policy, bootstrap, system status | Go only |
| Hosted apps, app items and profile | PHP and Python have none; Rust has app items only |
| Workflow timings | PHP and Go only |
| Reporting-pack preview `executive` and `presentation` | Go only |
| Campaign email welcome, runs and permissions; uncertainty models; rls; sdk-usage; email relay; event categories; error issues; notification destinations; ingest claims | In no SDK |
| Rust admin surface | Measurement and status page only |

## Milestones

### M1. SDK surface manifest (SDK repo)

- Add `contract-fixtures/api/` holding a snapshot of Custd's generated OpenAPI documents and their source
  digest.
- Add `sdk-surface.json`, one entry per OpenAPI operation, keyed by service, method and path. Each entry
  gives the method name per language, or `excluded` with a reason (for example operator-only debug
  transport).
- Seed the manifest by scanning each SDK's route strings, then correct it by hand once.
- **Proof:** `just surface-check` fails when the snapshot has an operation without a manifest entry, or an
  entry names a method that does not exist. It is fast and needs no network.

### M2. Generated route conformance tests (SDK repo)

- Each SDK gets one table-driven test that reads `sdk-surface.json`, calls every mapped method through the
  existing fake transport, and asserts the method and path.
- This replaces hand-written route lists such as the rows in `admin_surface_parity_test.go`, which are then
  deleted.
- **Proof:** renaming one route in any SDK fails exactly one row in that language's test.

### M3. Response-shape conformance (SDK repo)

- Generate one minimal and one maximal example response per operation from the OpenAPI schemas into
  `contract-fixtures/api-examples/`. Minimal means required fields only, with empty and null lists.
- Every SDK decodes both examples for each mapped operation.
- This is the check that would have caught the preview and dimensions bugs.
- **Proof:** reverting the 3.65.1 preview fix fails the PHP, JS and Python decode tests.

### M4. Contract update without a person (both sides)

- **Custd:** when `docs/api/generated/*` changes on `main`, a workflow opens or updates one pull request on
  `haakco/custd-sdk` that refreshes the snapshot. M1 then lists the new or changed operations as failures
  on that pull request.
- **Custd:** `api-parity.json` gains an `sdk` disposition read from the released `sdk-surface.json`, so
  `custdctl validate api-parity` reports SDK coverage beside CLI and MCP.
- **SDK:** a released tag records the snapshot digest it was checked against in `docs/changelog/`.
- **Proof:** a no-op OpenAPI change in Custd produces an SDK pull request with a green `surface-check`.

### M5. Consumer adoption without a person (consumer side)

- Publish a machine-readable release note per tag: added, changed or removed operations from the manifest
  diff, and the fixture digest.
- Give consumers a Renovate rule (or the existing Dependabot setup) for the SDK tag.
- Give them a fixture check: their fakes replay `contract-fixtures/` at the pinned tag, so a fake that
  disagrees with Custd fails their CI, not production.
- `contract-fixtures/` is `export-ignore`d, so it is not in the Composer dist. Ship the fixtures a consumer
  replays in a form the package manager delivers (for example under `sdk-php/fixtures/`), or give consumers
  a pinned fetch command. Until then, Hosting copies `site-status-page.json` at `v3.65.1`.
- Pin first: Hosting PHP `^3.65`. Vorrent JS is at `v3.43.3`, Vorrent media cache Go at `v3.59.0`, and
  done-when-app at `v3.64.4`.
- **Proof:** Hosting's CI fails on a deliberately wrong fake and passes on the released fixture.

### M6. Close the gaps (SDK repo, batches)

- Implement every `missing` manifest entry in all five languages, one feature area per release, in the
  order of the gap table above (consumer use first).
- **Proof:** `surface-check --mode complete` reports zero missing operations. Each batch ships as one
  synchronized tag with its route and shape conformance tests green.

### M7. Release and adopt on every consumer on the development server

`v3.66.0` breaks public shapes on purpose (pre-live, no compatibility layers), so the release is not
done until every consumer on the development server runs it with its own checks green. Each consumer
bumps through its normal dependency command, never a local path replacement. The changes go in using
that repository's own rules, and each item below records its commit.

- [x] Resync the snapshot from Custd `82873e00c`, then run the final pass in every SDK, then
  `just check`, then tag and push `v3.66.0` (`8642f02`). Release Mirrors run `45746963763` succeeded, the
  Go mirror carries the tag and the JS tarball is attached. CI's only failure was a blank line at the end
  of a Python file, fixed in `a658030`.
- [x] **Custd** (`84368c5a4`, `6414bea46`; `just lint` and `just test` pass; release `v1.7.139`): custdctl, loadgen (Go, JS and PHP), the frontend and the lifecycle-m6 proof, bumped
  with `scripts/dev/update-custd-sdk.sh v3.66.0`. Then `just lint` and `just test`, commit, push,
  release and deploy. Before deploying, check production for queued cleanup jobs, because the
  approval key change invalidates their scope hash.
- [x] **Hosting API** (`5f2fe006d`; Plan 247 in `d6b3020bc`): PHP `^3.66`. Move provisioning to the typed DTOs
  (`HostingSiteInsightCredentials`), give `FakeSiteDomainTransport::provisioning()` the full server
  shape, and update Plan 247 with the changes.
- [x] **Hosting frontend:** JS, from `v3.35.2` to `v3.66.0` (`5f2fe006d`).
- [x] **Vorrent** (`07c87d0d`): Go root module and media cache, plus JS frontend, mobile and shared.
- [x] **done-when-app** (`f4ccd51`, `7b09fc3`): JS and React, plus the Rust CLI.
- [x] **dzine-canvas** (`3a3de6c`): JS release tarball.
- [x] Consumers with no checkout on this server are handed to the
  [SDK 3.66 consumer adoption plan](./2026-11-26_0300_sdk-3-66-consumer-adoption_plan.md).

## Acceptance

- `just surface-check --mode complete`, the M2 route tests and the M3 shape tests pass in all five SDKs
  against the current Custd OpenAPI.
- The Custd workflow from M4 has opened at least one real snapshot pull request.
- Every M7 item is checked with its commit.
- Hosting's CI consumes the fixture check from M5.

## Deferred, not dropped

- Generating SDK types from OpenAPI is not planned. The hand-written typed clients stay; M3 checks them.
  Revisit only if M3 keeps finding drift in the same places.
