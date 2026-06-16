# SDK Package Split & Packaging Hardening Implementation Plan

**Goal:** Stop shipping three frameworks' code in one Composer package; make `haakco/custd-sdk` a clean pure-PHP package and turn the Laravel and WordPress subtrees into self-contained, split-ready packages — plus fix the semver/BC and hygiene fallout.

**Background:** A code review of the SDK as consumed inside Awthy found the single `haakco/custd-sdk` package autoloads three PSR-4 roots and ships all of them in the dist. Source of the findings: review pasted into the custd session 2026-06-16.

**Architecture:** Keep one private monorepo for now (split into separate GitHub repos later). The repo is consumed privately via Composer VCS by released tags, so the **root `composer.json` is the contract every consumer pulls**. Make that root the pure-PHP SDK only; give `laravel-package/` and `wordpress-plugin/` their own standalone `composer.json` so they are split-ready with no future code rework.

**Tech Stack:** PHP 8.3+, Composer, PHPUnit 12, PHPStan 2, Pint, GitHub Actions (self-hosted runners).

**Branch:** `fix/sdk-package-split-and-hardening` (already created in `custd-sdk`).

---

## Current State (Verified)

**Files examined (in `custd-sdk`):**

- `composer.json` (root) — name `haakco/custd-sdk`; autoloads **three** PSR-4 roots (`HaakCo\LaravelCustd\` → `laravel-package/src/`, `HaakCo\Custd\WordPress\` → `wordpress-plugin/src/`, `HaakCo\Custd\` → `sdk-php/src/`); `require` is only `php >=8.3` + `ext-curl`; `require-dev` has `orchestra/testbench` + `phpunit`; `autoload-dev` registers all three test namespaces; `extra.laravel.providers` auto-registers `CustdServiceProvider`; `suggest` mentions `laravel/framework`.
- `sdk-php/composer.json` (nested) — already a clean pure-PHP definition: name `haakco/custd-sdk`, autoload `HaakCo\Custd\` → `src/`, require `php`+`ext-curl`, require-dev phpunit/phpstan/pint. **Name collides with root.**
- `.gitattributes` — only `* text=auto eol=lf`; **no `export-ignore`**, so dist ships everything (tests + `sdk-php/scripts/smoke-dev.php` confirmed present in installed dist).
- `laravel-package/src/` — `CustdServiceProvider.php`, `Jobs/SendCustdEvent.php`, `Facades/Custd.php`; import `Illuminate\Support\ServiceProvider`, `Illuminate\Bus\Queueable`, `Illuminate\Contracts\Queue\ShouldQueue`, `Illuminate\Foundation\Bus\Dispatchable`, `Illuminate\Queue\InteractsWithQueue`. None of `illuminate/*` is declared anywhere → **dangling references as shipped**.
- `wordpress-plugin/src/` — `Plugin.php`, `Settings.php`, `CustdClientFactory.php`; namespace `HaakCo\Custd\WordPress\`; depends only on `HaakCo\Custd\CustdClient`.
- `sdk-php/src/CustdClient.php` — `redactAwthyAuditEvents()` (was `redactAuthyAuditEvents()`), references `Awthy\AwthyAuditRedactionRequest`; in-thread retry via `usleep($delayMs * 1000)` at three sites (lines ~363/386/409), `backoffDelayMs()` at ~603; `curl_init` at 5 sites (435/480/523/651) with **no `curl_close`**.
- `sdk-php/src/Awthy/` — `AwthyAuditEvent.php`, `AwthyAuditRedactionRequest.php` (renamed from `Authy` in v1.2.1, a patch — the breaking change that turned downstream builds red).
- `sdk-php/src/Admin/Http.php` — `curl_init` at line 43, no `curl_close`.
- `sdk-php/tests/ComposerMetadataTest.php` — **packaging gate**; already asserts php constraints on BOTH `sdk-php/composer.json` and root `../../composer.json`, and asserts the CI php matrix. This is the spec to extend.
- `sdk-php/tests/Psr4ComplianceTest.php` — gate: one PSR-4 type per file under `sdk-php/src`.
- `.github/workflows/ci.yml` — `php` job (`runs-on: self-hosted`, matrix `8.3/8.4/8.5`) runs `composer install` + `composer test` at **root**; `php-analysis` job runs `cd sdk-php && composer analyse` + `format-check`; both on self-hosted runners (HaakCo policy ✅).
- `docs/plans/main_plan.md` — plan index; has a Deferred Work entry for laravel/wordpress static analysis.

**Key findings:**

- One repo root = one VCS package. Fixing the root `composer.json` fixes every consumer at once.
- `laravel-package`/`wordpress-plugin` are recent additions (commit `51e8b6b`); no local sibling consumes them today → making root pure-PHP is safe for the urgent Awthy (pure-PHP) path.
- The nested `sdk-php/composer.json` and root currently both claim `haakco/custd-sdk`. After this work the **root** is the published pure-PHP package; the nested one is kept only as the in-repo dev/test manifest for the `sdk-php/` subtree (or removed if redundant — decided in Task 2).

**Parallelization opportunities:** Tasks 3 (laravel), 4 (wordpress), and 5 (sdk-php BC/hygiene) touch disjoint subtrees and can run concurrently once Task 2 lands the root contract + shared gate expectations.

**Shared branch coordination:** Single branch `fix/sdk-package-split-and-hardening`. No `git stash`/`git reset`. Each task owns its file set below; CI + root gate tests are owned solely by Task 2.

**Deferred Work:**

- **Split into separate GitHub repos** (`haakco/custd-laravel`, `haakco/custd-wordpress`) — out of scope for this branch per "monorepo now, split later." Tracked in `docs/plans/future/2026-06-16-sdk-repo-split_plan.md` (created in Task 6) and linked from `main_plan.md`. Risk until done: Laravel/WordPress packages are not cleanly VCS-installable from the monorepo root (interim consumption is via path/subdir repo or post-split repos).

---

## Task 1: Define target manifests (shared contract — do first)

**Files:** this plan only (no code). Locks the three `composer.json` shapes so Tasks 2–4 don't drift.

- **Root `composer.json` → `haakco/custd-sdk`**
  - `autoload.psr-4`: `{ "HaakCo\\Custd\\": "sdk-php/src/" }` only.
  - `require`: `php >=8.3`, `ext-curl`.
  - `require-dev`: `phpunit/phpunit ^12.0` only (no `orchestra/testbench`).
  - `autoload-dev.psr-4`: `{ "HaakCo\\Custd\\Tests\\": "sdk-php/tests/" }` only.
  - **Remove** `extra.laravel`, **remove** `laravel/framework` suggest.
  - `scripts.test`: target only the pure-PHP suite.
- **`laravel-package/composer.json` → `haakco/custd-laravel`**
  - `require`: `php >=8.3`, `haakco/custd-sdk` (self-ref via path repo for in-repo dev), `laravel/framework` (`^11.0 || ^12.0 || ^13.0`).
  - **Why the full framework, not granular `illuminate/*`:** the provider/facade/config helpers and `SendCustdEvent`'s `Illuminate\Foundation\Bus\Dispatchable` trait live in `Illuminate\Foundation`, which Laravel does **not** publish as a granular package (the Packagist `illuminate/foundation` is an unrelated abandoned v1.x). Declaring granular `illuminate/*` left `Dispatchable` satisfied only transitively via the dev-only `orchestra/testbench`, so a production `--no-dev` install fataled on the missing trait — the dangling-dep bug this split set out to kill. Caught by the security reviewer; guarded by `PackagingTest`.
  - `require-dev`: `orchestra/testbench`, `phpunit/phpunit ^12.0`.
  - `autoload`: `HaakCo\\LaravelCustd\\` → `src/`; `autoload-dev`: `HaakCo\\LaravelCustd\\Tests\\` → `tests/`.
  - `extra.laravel.providers`: `["HaakCo\\LaravelCustd\\CustdServiceProvider"]`; `extra.laravel.aliases`: `{ "Custd": "HaakCo\\LaravelCustd\\Facades\\Custd" }`.
  - `repositories`: path repo pointing at `../sdk-php` for local install.
- **`wordpress-plugin/composer.json` → `haakco/custd-wordpress`**
  - `require`: `php >=8.3`, `haakco/custd-sdk` (path repo for in-repo dev).
  - `require-dev`: `phpunit/phpunit ^12.0`.
  - `autoload`: `HaakCo\\Custd\\WordPress\\` → `src/`; `autoload-dev`: `HaakCo\\Custd\\WordPress\\Tests\\` → `tests/`.
  - `repositories`: path repo pointing at `../sdk-php`.

**Verify:** the three shapes have no overlapping PSR-4 roots and each declares exactly its own runtime deps. → done when written here.

---

## Task 2: Root pure-PHP package + export-ignore + gate tests

**Files:**

- Modify: `composer.json` (root)
- Create/modify: `.gitattributes`
- Modify: `phpunit.xml` (root — scope to sdk-php suite) — verify path first
- Modify: `sdk-php/tests/ComposerMetadataTest.php` (extend gate)
- Modify: `.github/workflows/ci.yml` (root `composer test` still green; add laravel/wordpress steps in Task 3/4 — coordinate)

**Team ownership:** Task 2 owns root `composer.json`, `.gitattributes`, root `phpunit.xml`, both gate tests, and `ci.yml`. **Runs first.**

**Step 1 — Write failing gate tests (RED).** Extend `ComposerMetadataTest`:

- root `composer.json` autoload has exactly one PSR-4 root `HaakCo\Custd\` → `sdk-php/src/`.
- root `composer.json` has **no** `extra.laravel`.
- root `composer.json` `require` keys are exactly `php`, `ext-curl`.
- `.gitattributes` contains `export-ignore` for `laravel-package/`, `wordpress-plugin/`, `/*/tests/`, `/*/scripts/` (assert on file contents).
Run: `cd sdk-php && composer test` → Expected: FAIL.

**Step 2 — Make green.** Rewrite root `composer.json` per Task 1; add `.gitattributes` `export-ignore` rules; scope root `phpunit.xml`. Run gate → PASS. Verify dist with `git archive HEAD | tar -t` excludes tests/scripts/framework subtrees.

**Step 3 — CI.** Keep `php` job's root `composer test` working (now pure-PHP). Update `ComposerMetadataTest` CI assertion if the matrix/string changes.

**Step 4 — Commit:** `refactor(sdk): make root package pure-PHP; export-ignore non-SDK subtrees`

---

## Task 3: Laravel package standalone manifest + CI

**Files:**

- Create: `laravel-package/composer.json`, `laravel-package/phpunit.xml`
- Keep: `laravel-package/src/*`, `laravel-package/tests/CustdServiceProviderTest.php`
- Modify: `.github/workflows/ci.yml` (add `cd laravel-package && composer install && composer test` step) — **coordinate with Task 2 owner**

**Can run in parallel with:** Task 4, Task 5 (disjoint files; only `ci.yml` is shared — Task 2 owner integrates CI edits).

**Step 1 — RED:** add a manifest test asserting `laravel-package/composer.json` declares `illuminate/*` and `extra.laravel.providers`. Run `cd laravel-package && composer install && composer test` → FAIL (no manifest yet).
**Step 2 — GREEN:** write `composer.json` (path repo → `../sdk-php`) + `phpunit.xml`; `composer install`; existing provider test passes.
**Step 3 — Commit:** `feat(sdk): make laravel-package a standalone haakco/custd-laravel package`

---

## Task 4: WordPress package standalone manifest + CI

**Files:**

- Create: `wordpress-plugin/composer.json`, `wordpress-plugin/phpunit.xml`
- Keep: `wordpress-plugin/src/*`, `wordpress-plugin/tests/*`
- Modify: `.github/workflows/ci.yml` (add wordpress install+test step) — coordinate with Task 2 owner

**Can run in parallel with:** Task 3, Task 5.

**Step 1 — RED:** manifest test asserts `wordpress-plugin/composer.json` = `haakco/custd-wordpress`, requires `haakco/custd-sdk`. FAIL.
**Step 2 — GREEN:** write `composer.json` (path repo → `../sdk-php`) + `phpunit.xml`; `composer install`; tests pass.
**Step 3 — Commit:** `feat(sdk): make wordpress-plugin a standalone haakco/custd-wordpress package`

---

## Task 5: Authy→Awthy BC aliases + sdk-php hygiene

**Files:**

- Create: `sdk-php/src/Authy/AuthyAuditEvent.php`, `sdk-php/src/Authy/AuthyAuditRedactionRequest.php` (deprecated BC shims via `class_alias`/thin subclass) — verify PSR-4 gate tolerance (one type per file).
- Modify: `sdk-php/src/CustdClient.php` (add `redactAuthyAuditEvents()` delegating to `redactAwthyAuditEvents()`; `curl_close` after each `curl_exec`; opt-out for in-thread backoff)
- Modify: `sdk-php/src/Admin/Http.php` (`curl_close`)
- Create: `sdk-php/tests/AwthyBcAliasTest.php`
- Modify: `README.md` / `sdk-php/README.md` — semver note (next release is **major**), deprecation note.

**Can run in parallel with:** Tasks 3, 4 (sdk-php-only files; no `ci.yml` edit).

**Step 1 — RED:** test that old FQCN `HaakCo\Custd\Authy\AuthyAuditEvent` resolves and `CustdClient::redactAuthyAuditEvents()` delegates. FAIL.
**Step 2 — GREEN:** add BC aliases + delegating method.
**Step 3 — Hygiene:**

- **Inline backoff opt-out:** added a `retry.sleeper` callable seam (default = blocking `usleep`). Synchronous callers (WordPress hooks) pass a no-op `static fn (int $ms) => null` to retry without stalling render. The three duplicated `usleep` blocks collapse into one `maybeBackoff()`. Regression-tested by `RetryBackoffTest`.
- **curl_close — NOT applied (obsolete).** Verified on PHP 8.5: `curl_close()` is **deprecated since 8.5** and "has no effect since PHP 8.0" (PHPUnit surfaced the `E_DEPRECATED`; PHPStan did not). Curl handles are GC'd objects, so explicit close is unnecessary *and* now deprecated. The review item is resolved by documenting this rather than adding a deprecated call. No code change at the 5 curl sites.

**Step 4 — Semver:** Because the BC aliases (class + method) **restore** the old names, the Authy→Awthy break is healed, so the next release is a **minor** (v1.3.0), not a major. Policy recorded: genuine, non-aliased breaking renames must be a major. The framework packages require `haakco/custd-sdk: ^1.1` (stays valid through v1.x).
**Step 5 — Commit:** `fix(sdk): restore Authy BC aliases; close curl handles; allow non-blocking inline retry`

**Note:** keep the security-careful `FileQueueStore` (atomic tempnam+rename, 0600/0700, LOCK_EX/SH, TOCTOU lstat/fstat guard) untouched — flagged as good work to preserve.

---

## Task 6: Review gauntlet + deferred-repo-split plan + finalize

**Files:** Create `docs/plans/future/2026-06-16-sdk-repo-split_plan.md`; update `docs/plans/main_plan.md` index.

- Run 3-stage review (spec compliance → code quality → security) + Codex pass per HaakCo pipeline.
- Run full gates: each package `composer test` + `composer analyse` + `format-check`; `mise exec -- just check` if available.
- Verify `git archive` dist excludes non-SDK subtrees.
- Record the repo-split as a tracked deferred plan; link from `main_plan.md`.

---

## Review outcome (3-stage gauntlet, 2026-06-16)

Spec / Code-Quality / Security reviewers ran in parallel, each finding adversarially verified.

- **1 confirmed HIGH** (security): `laravel-package` declared granular `illuminate/*` but
  `SendCustdEvent` uses `Illuminate\Foundation\Bus\Dispatchable` (ships only in
  `laravel/framework`), so a `--no-dev` install fataled. **Fixed** by requiring `laravel/framework`
  - a `PackagingTest` regression guard; verified `--no-dev` now resolves with the trait present.
- 1 other raw finding rejected on adversarial verification.

Final gates: sdk-php 66 tests + PHPStan + Pint; root 66; Laravel 10; WordPress 13; no PHP
deprecations; `git archive` shows no non-SDK leaks.

## Completion criteria

- [ ] Root `composer.json` autoloads only pure PHP; no `extra.laravel`.
- [ ] `.gitattributes` `export-ignore` strips tests/scripts/framework subtrees from dist (verified via `git archive`).
- [ ] `laravel-package` + `wordpress-plugin` each have standalone `composer.json` declaring their own require; `illuminate/*` no longer dangling.
- [ ] Authy→Awthy BC aliases present (lazy autoloader); old method delegates; deprecation + minor-version (v1.3.0) policy documented.
- [ ] Inline backoff opt-out (`retry.sleeper`) added + caveat documented; `curl_close` confirmed obsolete on PHP 8.5 (no change).
- [ ] All package test suites + static analysis green; CI uses self-hosted runners only.
- [ ] Repo-split follow-up plan created and linked from `main_plan.md`.
