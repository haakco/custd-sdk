# Plan A — SDK Version Source of Truth + Registry Publish

> **✅ COMPLETE (archived 2026-06-16).** `@haakco/custd-sdk@1.3.1` published to
> Verdaccio; `VERSION` single source of truth + `VersionSyncTest` + `release-guard`
> CI gate are live. Root cause of the prior 404 (no `VERDACCIO_TOKEN`) fixed via
> Infisical Universal Auth. CouriB Phase 1 unblocked.

**Goal:** Give every SDK one shared version driven by a single source of truth, enforce it in CI, and publish `@haakco/custd-sdk` to Verdaccio so CouriB's web-gui can install it. No repo split required — this is the registry/in-repo half of the [CouriB consumer unblock](2026-06-16-cb-consumer-unblock_plan.md).

**Background:** The v1.3.0 package split `export-ignore`d `/sdk-js`, so the old `github:…&path:sdk-js` tarball install no longer ships the JS SDK. A registry is now the only supported JS install path. Separately, three manifests had drifted to `1.2.1` while the repo was tagged `v1.3.0`. Both are fixed here.

**Architecture:** A root `VERSION` file is the single source of truth. Packages that must hardcode a version (registry- and path-shim-published: `sdk-js`, `sdk-python`, `sdk-php`) equal it; Packagist-derived packages (root, `laravel`, `wordpress`) omit `version` and inherit the git tag; `sdk-go` is tag-driven (`sdk-go/vX.Y.Z`). A PHPUnit gate (`VersionSyncTest`) checks manifests on every run; a `release-guard` CI job checks the tag on every `v*` push.

**Tech Stack:** pnpm 10 / Node 24, HaakCo Verdaccio (`https://verdaccio.k8.haak.co/`), PHPUnit 12, GitHub Actions (self-hosted runners).

**Parallel Work Model:** Small, coupled change set — single implementer. Other agents on this branch must not touch `VERSION`, the SDK manifests, `.github/workflows/ci.yml`, or `sdk-php/tests/VersionSyncTest.php` concurrently. No `git stash` / `git reset`.

---

## Current State (Verified 2026-06-16)

**Files examined:**

- `VERSION` — created, `1.3.0` (single source of truth).
- `sdk-js/package.json:3` — was `1.2.1`, bumped to `1.3.0`. `publishConfig.registry` → Verdaccio; `files: ["dist"]`; not `private`.
- `sdk-python/pyproject.toml:7` — was `1.2.1`, bumped to `1.3.0`.
- `sdk-php/composer.json:6` — was `1.2.1`, bumped to `1.3.0` (path-shim package consumed by the framework packages).
- `composer.json`, `laravel-package/composer.json`, `wordpress-plugin/composer.json` — correctly carry **no** `version` (tag-derived).
- `sdk-go/go.mod` — module `github.com/haakco/custd-sdk/sdk-go`; no version constant (subdir module, tag-driven).
- `.github/workflows/ci.yml` — `publish-js` (Verdaccio, `needs: [js]`) and `publish-packagist` exist, gated on `refs/tags/v*`, `runs-on: self-hosted`.
- `sdk-php/tests/ComposerMetadataTest.php`, `PackageBoundaryTest.php` — existing cross-cutting gate pattern that `VersionSyncTest` follows.

**Key findings:**

- Verdaccio probe: `npm view @haakco/custd-sdk --registry=https://verdaccio.k8.haak.co/` → **404, never published.** The pipeline exists but has never produced a published package — diagnose before assuming it works.
- The `publish-js` job publishes whatever `package.json` declares, so the stale `1.2.1` would have published a tag/version mismatch. Fixed by the source-of-truth bump + `release-guard`.

**Deferred Work:** None.

---

## Status

### Done (implemented + verified on this branch)

- [x] **Root `VERSION` = `1.3.0`** — single source of truth.
- [x] **Bumped** `sdk-js/package.json`, `sdk-python/pyproject.toml`, `sdk-php/composer.json` to `1.3.0`.
- [x] **Version-sync gate** `sdk-php/tests/VersionSyncTest.php` (TDD: red on stale manifests → green after bump). Asserts: `VERSION` is bare semver; the three hardcoded manifests equal it; the three Packagist-derived manifests omit `version`; CI carries `release-guard`. Runs in the existing `php` CI job. Verified: `vendor/bin/phpunit --filter VersionSyncTest` → 8 tests green; full suite 74 green.
- [x] **`release-guard` CI job** — on `v*` tag push, fails when `${GITHUB_REF_NAME#v}` ≠ `VERSION` (env-var form, no `${{ }}` injection). `publish-js` and `publish-packagist` now `needs` it.
- [x] **AGENTS.md / CLAUDE.md "Version Sync" rule** documenting the source of truth, the bump-together list, and the gate.

### Remaining (needs live registry / CI run — not doable from a dev laptop)

- [x] **Root cause of the 404 found (2026-06-16):** `gh secret list --repo haakco/custd-sdk` is **empty** — the repo has **no secrets at all**, so `secrets.VERDACCIO_TOKEN` is unset and `publish-js` could never authenticate (and `publish-packagist`'s `PACKAGIST_*` are likewise unset). Not a pipeline bug.
- [x] **`VERDACCIO_TOKEN` wired (2026-06-16).** `INFISICAL_CLIENT_ID`/`INFISICAL_CLIENT_SECRET` set on the repo; `VERDACCIO_TOKEN` stored in Infisical (`/custd-sdk`, env `prod`, confirmed present). Auth is via committed **`sdk-js/.npmrc`** (`//verdaccio.k8.haak.co/:_auth=${VERDACCIO_TOKEN}`); `publish-js` pulls the token at runtime with `infisical run` (Universal Auth, `runs-on: [self-hosted, haakco]`) — never a GitHub secret. Added `.github/actionlint.yaml` to register the `haakco`/`htz-containerd` runner labels (matches custd).
- [ ] **Publish `@haakco/custd-sdk@1.3.0`** to Verdaccio (restricted) — fires on the next `v1.3.x` tag. `publish-js` only runs on tags, so this path is validated for real at first release (the `js` job already exercises the new `.npmrc` install path on every run).
- [ ] **Verify the published tarball contains `dist/`** and the three entrypoints (`.`, `./browser`, `./browser-script`) resolve.

**Verification (post-publish, from a scratch dir):**

```bash
npm view @haakco/custd-sdk version --registry=https://verdaccio.k8.haak.co/   # expect 1.3.0, not 404
pnpm add @haakco/custd-sdk@latest --registry=https://verdaccio.k8.haak.co/
node -e "import('@haakco/custd-sdk/browser').then(m => console.log(Object.keys(m)))"
```

**Done when:** a clean `pnpm add @haakco/custd-sdk` against Verdaccio installs a build with `dist/`, and the published version equals the git tag. Unblocks CouriB Phase 1 (web).

---

## Links

- Umbrella: [Unblock CouriB Consumer](2026-06-16-cb-consumer-unblock_plan.md) (R1).
- Companion: [Plan B — Subtree-Split Mirrors](2026-06-16-sdk-subtree-split-mirrors_plan.md) (the VCS-forced PHP split).
- Version-sync rule: `AGENTS.md` → "Version Sync".

**Last verified:** 2026-06-16 (repo reads + live Verdaccio probe + local test runs).
