# Unblock CouriB Consumer (Verdaccio Publish + Laravel Package Install)

**Goal:** Make `@haakco/custd-sdk` (JS) and `haakco/custd-laravel` (Composer) installable by downstream consumers so the CouriB analytics integration can start. Two hard install blockers currently gate CouriB Phase 0 (API) and Phase 1 (web).

**Background:** CouriB's custd analytics integration plan (`cb/docs/plans/2026-06-11_custd_analytics_integration_plan.md`, Findings #8 and #14) is blocked at the install step. The v1.3.0 package split made the root Composer package pure-PHP and `export-ignore`d the framework subtrees — correct for hygiene, but it broke both ways CouriB used to pull the SDK. Requested by <tim@haak.co> (2026-06-16): "add the requirements, team will fix."

**Scope:** Umbrella plan for the custd-sdk team. It documents exactly what CouriB needs and the verification each fix must pass.

> **This plan is split into two executable sub-plans** (the registry half needs no repo work; the VCS half needs new repo plumbing, so they ship independently):
>
> - **[Plan A — Version Source of Truth + Registry Publish](2026-06-16-sdk-version-source-of-truth-and-publish_plan.md)** — covers **R1** (+ the version-sync source of truth and CI gate). Code landed on this branch; only the live Verdaccio publish remains.
> - **[Plan B — Subtree-Split All SDKs to Mirror Repos](2026-06-16-sdk-subtree-split-mirrors_plan.md)** — covers **R2**. Chosen mechanism: **monorepo + `git subtree split` to read-only mirrors** (language-agnostic, zero new infra, dev workflow unchanged). Outward steps (mirror repos, push secret, Packagist) are coordinator-gated.

**Tech Stack:** pnpm 10 / Node 24, HaakCo Verdaccio (`https://verdaccio.k8.haak.co/`), Composer VCS/path repos, GitHub Actions (self-hosted runners).

---

## Current State (Verified 2026-06-16)

- **Repo:** `main` at tag `v1.3.0` + 1 doc commit (`a4f24ba`), working tree clean.
- **JS package:** `sdk-js/package.json` → name `@haakco/custd-sdk`, **version `1.2.1`** (stale — repo is tagged `v1.3.0`). `publishConfig.registry` already points at Verdaccio; `files: ["dist"]`; not marked `private`.
- **Verdaccio:** `npm view @haakco/custd-sdk --registry=https://verdaccio.k8.haak.co/` → **404, package never published.**
- **CI:** `.github/workflows/ci.yml` has a `publish-js` job (`runs-on: self-hosted`, `needs: [js]`, `if: push && refs/tags/v*`) that builds and runs `pnpm -C sdk-js publish --no-git-checks --access restricted` with `NODE_AUTH_TOKEN: secrets.VERDACCIO_TOKEN`. So the pipeline exists but has not produced a published package.
- **`.gitattributes`:** `/sdk-js export-ignore` (line 16) — confirmed. The `github:…&path:sdk-js` tarball install CouriB used at ≤v1.2.x no longer ships `sdk-js/`.
- **Laravel package:** `laravel-package/composer.json` → name `haakco/custd-laravel`, requires `haakco/custd-sdk ^1.1` + `laravel/framework ^11||^12||^13`, and carries a `repositories: [{type: path}]` shim to resolve `haakco/custd-sdk` locally. A Composer **VCS** repo on this monorepo exposes only the **root** package (`haakco/custd-sdk`, pure PHP), so `composer require haakco/custd-laravel` cannot resolve from VCS.
- **Repo-split:** explicitly deferred by <tim@haak.co> 2026-06-16 — `docs/plans/future/2026-06-16-sdk-repo-split_plan.md` ("monorepo for now, split later").

---

## R1 — Publish `@haakco/custd-sdk` to Verdaccio (unblocks CouriB Phase 1 / web)

> **Now tracked in [Plan A](2026-06-16-sdk-version-source-of-truth-and-publish_plan.md).** The stale-version blocker below is fixed (single `VERSION` source of truth, `release-guard` gate); only the live publish remains.

**Why:** With `/sdk-js export-ignore`d, the GitHub tarball install no longer contains the JS SDK. A real registry is now the only supported install path for downstream JS consumers. CouriB web-gui needs `pnpm add @haakco/custd-sdk` to resolve from `https://verdaccio.k8.haak.co/`.

**Blocker sub-issue (must fix first):** `sdk-js/package.json` version is `1.2.1` but the repo is tagged `v1.3.0`. The `publish-js` job publishes whatever `package.json` declares — so a `v1.3.0`-triggered run would publish a **stale 1.2.1**, and the npm version would not match the git tag.

**Requirements:**

- [ ] Bump `sdk-js/package.json` `version` to match the release tag (`1.3.0`), and decide on a versioning rule that keeps `sdk-js` in lockstep with git tags going forward (the `publish-js` trigger is `refs/tags/v*`, so the two must agree).
- [ ] Confirm the `publish-js` job actually runs and succeeds on a tag push (check whether prior `v*` tags fired it; the 404 implies it never published successfully — diagnose: missing `VERDACCIO_TOKEN`? job skipped? `js` dependency failed?).
- [ ] Publish `@haakco/custd-sdk@1.3.0` (or next tag) to Verdaccio, restricted access.
- [ ] Verify the published tarball **contains `dist/`** and the three documented entrypoints (`.`, `./browser`, `./browser-script`) resolve.

**Verification:**

```bash
npm view @haakco/custd-sdk version --registry=https://verdaccio.k8.haak.co/   # expect 1.3.0 (or newer), not 404
# fresh-install smoke from a scratch dir against Verdaccio:
pnpm add @haakco/custd-sdk@latest --registry=https://verdaccio.k8.haak.co/
node -e "import('@haakco/custd-sdk/browser').then(m => console.log(Object.keys(m)))"
```

**Done when:** a clean `pnpm add @haakco/custd-sdk` against Verdaccio installs a build with `dist/`, and the published version equals the git tag.

---

## R2 — Make `haakco/custd-laravel` installable downstream without a local path repo (unblocks CouriB Phase 0 / API)

> **Now tracked in [Plan B](2026-06-16-sdk-subtree-split-mirrors_plan.md).** Mechanism decided: **`git subtree split` to read-only mirrors** (the "Preferred" option below). Version lockstep is enforced by Plan A's `release-guard` + `VersionSyncTest`.

**Why:** CouriB's API consumes `haakco/custd-laravel ^1.3` (the Laravel package — service provider, `Custd` facade, queued `SendCustdEvent`, `config/custd.php`). A Composer VCS repo on the monorepo root exposes only the pure-PHP `haakco/custd-sdk`, so the Laravel package is not VCS-installable today.

**The split is now REQUIRED (no longer deferred).** Per <tim@haak.co> (2026-06-16): do the split now so `haakco/custd-laravel` (and `haakco/custd-wordpress`) are first-class VCS/Packagist-installable packages — supersedes the "monorepo for now" decision in [`future/2026-06-16-sdk-repo-split_plan.md`](future/2026-06-16-sdk-repo-split_plan.md). A short-lived Composer `path` workaround is acceptable **only** as a bridge while the split lands, not as the destination.

**Hard constraint — keep all SDKs in sync:** the split must NOT let the packages drift. Every SDK (`sdk-php`/`haakco/custd-sdk`, `laravel-package`/`haakco/custd-laravel`, `wordpress-plugin`/`haakco/custd-wordpress`, plus `sdk-js`, `sdk-go`, `sdk-python`) must release on a **single shared version** from one source of truth — one tag drives all package versions, and a CI gate fails the release if any package's declared version diverges from the tag. Choose a split mechanism that enforces this:

- **Preferred: monorepo + subtree-split mirrors.** Keep developing in the one repo (so the SDKs stay co-located and co-tested); a release job `git subtree split`s each framework package to a read-only mirror repo and tags every mirror with the **same** version. Packagist/VCS watch the mirrors. Versions can't drift because they all derive from one monorepo tag.
- **Alternative: three real repos** only if a release-orchestration tool (e.g. `symplify/monorepo-builder` semantics, or a release script) guarantees lockstep version bumps + tags across all repos. Avoid if it means hand-bumping N repos — that is exactly the drift this constraint forbids.

**Requirements:**

- [ ] **Execute the split** so `haakco/custd-laravel` (and `haakco/custd-wordpress`) resolve via VCS/Packagist without a machine-local `path` repo.
- [ ] **Enforce version sync:** one source-of-truth version per release; CI gate rejects any release where a package's declared version ≠ the release tag (extend the existing `ComposerMetadataTest`/packaging-gate pattern to cover all SDK package manifests, including `sdk-js/package.json` from R1).
- [ ] **Bridge (optional, time-boxed):** if CouriB must start before the split lands, document the exact interim Composer `path` `repositories` block + `require` line for `cb/api/composer.json`, and note it is temporary — confirm the laravel-package's own `path` shim to `haakco/custd-sdk` resolves correctly when nested under a downstream consumer.
- [ ] Confirm installs cleanly in **CI and shared agent workspaces**, not just one dev laptop (per CouriB's Composer-auth policy: private HaakCo packages must stay installable locally, in shared agent workspaces, and in CI).

**Verification (from a scratch Laravel/PHP project, not this repo):**

```bash
composer require haakco/custd-laravel:^1.3   # resolves haakco/custd-sdk transitively
php -r "require 'vendor/autoload.php'; class_exists(HaakCo\\LaravelCustd\\CustdServiceProvider::class) || exit(1);"
```

**Done when:** the split has landed, a downstream project installs `haakco/custd-laravel` (with `haakco/custd-sdk` pulled transitively) via VCS/Packagist without a machine-local `path`, the service provider autoloads, and the version-sync CI gate is green for a release.

---

## Out of Scope

- The previously-deferred [`future/2026-06-16-sdk-repo-split_plan.md`](future/2026-06-16-sdk-repo-split_plan.md) is now **superseded by R2** (split required, not deferred) — archive that future plan once R2 lands.
- Browser-tracker SPA gaps (popstate / initial page view), dogfood sanitizer silent-drop, schema admin helpers — separate upstream findings in the CouriB plan's Findings table (#6, #7, #12); not install blockers.

## Links

- CouriB integration plan: `cb/docs/plans/2026-06-11_custd_analytics_integration_plan.md` (Findings #8, #14).
- Deferred repo-split: [`future/2026-06-16-sdk-repo-split_plan.md`](future/2026-06-16-sdk-repo-split_plan.md).
- Source of the package split: [`2026-06-16-sdk-package-split-and-hardening_plan.md`](2026-06-16-sdk-package-split-and-hardening_plan.md).

**Last verified:** 2026-06-16 (repo reads + live Verdaccio probe).
