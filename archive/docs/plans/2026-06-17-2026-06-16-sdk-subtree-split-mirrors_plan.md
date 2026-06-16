# Plan B — Subtree-Split All SDKs to Mirror Repos

> **✅ ARCHIVED 2026-06-17 — complete.** The 3 public mirrors (`custd-sdk-laravel`,
> `custd-sdk-wordpress`, `custd-sdk-go`) are populated with `main` + the `v1.3.2`
> tag, and `release-mirrors.yml` is committed. Task 4 (drop the `path` shims → VCS)
> shipped in `v1.3.2`, along with the Go module rename to `github.com/haakco/custd-sdk-go`
> (the split now vendors `contract-fixtures/` so the standalone module is
> self-contained). `go get github.com/haakco/custd-sdk-go@v1.3.2` verified working.
> **Only deferred item (user-owned, tracked in `main_plan.md`):** the
> `MIRROR_PUSH_TOKEN` secret in Infisical (`/custd-sdk` `prod`) still holds the
> literal placeholder, so CI auto-mirroring 401s — set a fine-grained PAT
> (`Contents: write` on the 3 mirrors). Until then, mirrors are pushed manually
> (as for v1.3.1 and v1.3.2). The split + extraheader push mechanism is otherwise
> verified working.

**Goal:** Make every SDK package installable through its own ecosystem's standard path — without a machine-local Composer `path` repo — while keeping a single monorepo as the source of truth. This is the VCS-forced half of the [CouriB consumer unblock](2026-06-17-2026-06-16-cb-consumer-unblock_plan.md) (R2). It unblocks CouriB Phase 0 (API), which needs `composer require haakco/custd-laravel`.

**Background:** A private repo consumed via Composer VCS exposes exactly **one** package — the root `composer.json`. Today that is `haakco/custd-sdk` (pure PHP). `haakco/custd-laravel` and `haakco/custd-wordpress` live in subtrees, so they are invisible to a VCS repo pointed at the monorepo root, and consumers fall back to a `path` shim that only works on one machine. The fix is to give each package a repo root of its own.

**Architecture (chosen):** **Monorepo + `git subtree split` to read-only mirror repos.** We keep developing, testing, and tagging in this one repo. A release CI job (on `v*` tag push) splits each package subtree to its own mirror repo and copies the **same** tag onto it. Consumers point Composer **VCS** repos (and Go modules) directly at the GitHub mirrors — **no Packagist**. Versions cannot drift because every mirror tag derives from one monorepo tag, and [Plan A](2026-06-16-2026-06-16-sdk-version-source-of-truth-and-publish_plan.md)'s `release-guard` + `VersionSyncTest` already enforce tag == `VERSION` == every manifest.

**Why subtree-split over the alternatives:** it is the only language-agnostic option that needs **zero new infrastructure** — `git subtree split` is built into git and runs as a plain job on the existing self-hosted ARC runners. `symplify/monorepo-builder` is PHP-only (would not split `sdk-go`/`sdk-js`/`sdk-python`); Copybara is language-agnostic but JVM-based and hand-wires lockstep. Read-only mirrors mean the dev workflow does not change at all.

**Tech Stack:** `git subtree`, GitHub Actions (self-hosted runners), `gh` CLI, Composer **VCS** (private GitHub mirrors, no Packagist), Go module proxy, Verdaccio/PyPI (JS/Python keep their registries — see note below).

**Parallel Work Model:** Repo-plumbing change. Single implementer owns `.github/workflows/release-mirrors.yml` and the manifest cleanups (drop `path` shims). Other agents must not edit those files concurrently. The outward steps (repo creation, push secret) are coordinator-gated — do not run them without explicit approval. No `git stash` / `git reset`.

---

## Scope note: which SDKs actually need a mirror?

| Package | Standard install path | Mirror needed? |
| --- | --- | --- |
| `sdk-js` (`@haakco/custd-sdk`) | Verdaccio registry | **No** — handled by [Plan A](2026-06-16-2026-06-16-sdk-version-source-of-truth-and-publish_plan.md). |
| `sdk-python` (`custd-sdk`) | PyPI/registry | **No** — registry, not VCS. (Add a publish job if/when a downstream needs it.) |
| `sdk-go` | Go modules resolve subdir modules via `sdk-go/vX.Y.Z` tags **today** | **Yes (decided)** — mirror to `haakco/custd-sdk-go` for a clean `github.com/haakco/custd-sdk-go` import path. |
| `haakco/custd-sdk` (root, pure PHP) | Composer VCS = root package | **No** — it is already the root. |
| `haakco/custd-laravel` | Composer VCS (GitHub mirror, no Packagist) | **YES — the blocker.** |
| `haakco/custd-wordpress` | Composer VCS (GitHub mirror, no Packagist) | **YES.** |

**Bottom line:** the only packages *forced* into a mirror are the two PHP framework packages (the CouriB must-haves). `sdk-go` is also mirrored (decided) for a clean import path; JS/Python stay on their registries (Verdaccio/PyPI). The "split all the SDKs" mechanism below is uniform — one job loops the matrix.

---

## Current State (Verified 2026-06-16)

**Files examined:**

- `laravel-package/composer.json` — name `haakco/custd-laravel`; carries `repositories: [{type: path, url: ../sdk-php, symlink: true}]` shim; requires `haakco/custd-sdk: ^1.1`. The `path` block is what must go once the mirror exists.
- `wordpress-plugin/composer.json` — name `haakco/custd-wordpress`; same `path` shim; requires `haakco/custd-sdk: ^1.1`.
- `.gitattributes` — `/laravel-package`, `/wordpress-plugin`, `/sdk-go`, `/sdk-js`, `/sdk-python` all `export-ignore` (correct: keeps the root PHP dist clean; unrelated to the split, which uses `git subtree`, not `git archive`).
- `.github/workflows/ci.yml` — has a `publish-packagist` job that notifies packagist.org. **Unused — we consume via Composer VCS, not Packagist; remove it** (see [Open cleanup](#open-cleanup)).
- `sdk-php/composer.json` — version-pinned `1.3.0`; this pin exists for the `path` shim and is removed once the shims are gone (the framework packages then resolve `haakco/custd-sdk` via Composer VCS from the GitHub mirror).

**Deferred Work:** None deferred from this plan. This plan itself *supersedes* the earlier deferral — see [`future/2026-06-16-sdk-repo-split_plan.md`](2026-06-16-2026-06-16-sdk-repo-split_plan.md) (to be archived on completion).

---

## Task 1 — Create the mirror repos (✅ DONE 2026-06-16)

All three created **private**: [`haakco/custd-sdk-laravel`](https://github.com/haakco/custd-sdk-laravel), [`haakco/custd-sdk-wordpress`](https://github.com/haakco/custd-sdk-wordpress), [`haakco/custd-sdk-go`](https://github.com/haakco/custd-sdk-go). (README + branch-protection still to add.)

**Naming convention (decided):** `haakco/custd-sdk-<type>`, **private** (matches the restricted Verdaccio/Composer-auth posture). The repo name is independent of the Composer **package** name — `composer require haakco/custd-laravel` keeps working because the package name comes from the mirror's `composer.json`, not its URL.

| Source subtree | Mirror repo | Composer/Go name (unchanged) |
| --- | --- | --- |
| `laravel-package/` | `haakco/custd-sdk-laravel` (private) | `haakco/custd-laravel` |
| `wordpress-plugin/` | `haakco/custd-sdk-wordpress` (private) | `haakco/custd-wordpress` |
| `sdk-go/` | `haakco/custd-sdk-go` (private) | `github.com/haakco/custd-sdk-go` |

```bash
gh repo create haakco/custd-sdk-laravel   --private --description "Laravel integration for Custd (read-only mirror of custd-sdk/laravel-package)"
gh repo create haakco/custd-sdk-wordpress --private --description "WordPress integration for Custd (read-only mirror of custd-sdk/wordpress-plugin)"
gh repo create haakco/custd-sdk-go        --private --description "Go SDK for Custd (read-only mirror of custd-sdk/sdk-go)"
```

Add a one-line `README` to each mirror stating it is **generated — do not push directly; edit in `haakco/custd-sdk`**.

## Task 2 — Add the mirror push secret (⚠️ outward, coordinator-gated)

The split job pushes to other repos, so the default `GITHUB_TOKEN` (scoped to this repo) is insufficient. **Matching custd + cb (unanimous org convention), CI authenticates to the self-hosted Infisical via Universal Auth, and the actual push token lives in Infisical — not as a GitHub secret.**

**Create a dedicated machine identity — do NOT reuse another repo's.** Per the HaakCo `haakco-infisical-secrets` convention, each repo gets its own CI identity (scoped permissions + audit trail). The SDK's push/publish tokens are *app build secrets*, so use the `<app>-app-ci` type (Member role), e.g. **`custd-sdk-app-ci`** with Universal Auth, granted Member/read on the project that holds the SDK secrets — the project `.infisical.json` points at (`952c94fb…`, shared with custd). Confirm that project's org + name in the Infisical UI first (it is absent from the skill's tables — the doc is stale).

Then set the identity's credentials as the only two GitHub repo secrets on `haakco/custd-sdk`:

```bash
gh secret set INFISICAL_CLIENT_ID     --repo haakco/custd-sdk
gh secret set INFISICAL_CLIENT_SECRET --repo haakco/custd-sdk
```

Store the push token **in Infisical** at the SDK path (`/custd-sdk`, env `prod`) as `MIRROR_PUSH_TOKEN`:

```bash
infisical secrets set MIRROR_PUSH_TOKEN=<github-PAT> --env=prod --path=/custd-sdk --domain=https://secrets.k8.haak.co/api
```

**Least privilege for the PAT value (do not use a classic/broad token):** a **fine-grained PAT** scoped to **only** the three mirror repos, `Contents: read and write`, nothing else, short expiry. The blast radius of a compromised runner must be the three mirrors only.

## Task 3 — `release-mirrors.yml` workflow (✅ DONE 2026-06-16 — committed)

Committed as **`.github/workflows/release-mirrors.yml`** (that file is authoritative; the block below is the design reference). A tag-triggered, self-hosted job that pulls `MIRROR_PUSH_TOKEN` from Infisical (Universal Auth, mirroring custd/cb), splits each subtree, and pushes it + the tag. The push token is passed via `http.extraheader` (base64 in a git config value git never prints) — **not** in the remote URL — so it never lands in `argv`/process list or logs. Fires for real on the next `v*` tag.

```yaml
name: Release Mirrors

on:
  push:
    tags: ["v*"]

permissions:
  contents: read

jobs:
  split:
    runs-on: [self-hosted, haakco]
    strategy:
      fail-fast: false
      matrix:
        include:
          - prefix: laravel-package
            mirror: haakco/custd-sdk-laravel
          - prefix: wordpress-plugin
            mirror: haakco/custd-sdk-wordpress
          - prefix: sdk-go
            mirror: haakco/custd-sdk-go
    steps:
      - uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5 # v4
        with:
          fetch-depth: 0
      - name: Guard tag == VERSION
        run: |
          version="$(tr -d '[:space:]' < VERSION)"
          tag="${GITHUB_REF_NAME#v}"
          [ "$tag" = "$version" ] || { echo "tag v$tag != VERSION $version" >&2; exit 1; }
      - name: Split subtree and push to mirror
        env:
          INFISICAL_CLIENT_ID: ${{ secrets.INFISICAL_CLIENT_ID }}
          INFISICAL_CLIENT_SECRET: ${{ secrets.INFISICAL_CLIENT_SECRET }}
          PREFIX: ${{ matrix.prefix }}
          MIRROR: ${{ matrix.mirror }}
          TAG: ${{ github.ref_name }}
        run: |
          # Universal Auth → pull MIRROR_PUSH_TOKEN from Infisical (never a GH secret).
          token="$(infisical login --method=universal-auth \
            --client-id="$INFISICAL_CLIENT_ID" --client-secret="$INFISICAL_CLIENT_SECRET" \
            --domain=https://secrets.k8.haak.co/api --silent --plain)"
          MIRROR_PUSH_TOKEN="$(INFISICAL_TOKEN="$token" infisical secrets get MIRROR_PUSH_TOKEN \
            --env=prod --path=/custd-sdk --domain=https://secrets.k8.haak.co/api --plain --silent)"
          split_sha="$(git subtree split --prefix="$PREFIX")"
          auth_header="AUTHORIZATION: basic $(printf 'x-access-token:%s' "$MIRROR_PUSH_TOKEN" | base64 | tr -d '\n')"
          git -c http."https://github.com/".extraheader="$auth_header" \
            push "https://github.com/${MIRROR}.git" "${split_sha}:refs/heads/main" --force
          git -c http."https://github.com/".extraheader="$auth_header" \
            push "https://github.com/${MIRROR}.git" "${split_sha}:refs/tags/${TAG}"
```

> `runs-on: [self-hosted, haakco]` matches custd. Refs use the env-var form (`$GITHUB_REF_NAME`), so no `${{ }}` injection. The push token is fetched at runtime from Infisical and never stored as a GitHub secret. The matrix is the single source of which subtrees mirror.

## Task 4 — Drop the `path` shims (ship only after the mirrors are live + VCS-resolvable)

Once `haakco/custd-sdk` is resolvable via Composer VCS (its GitHub repo) and the two framework mirrors exist:

- Remove the `repositories: [{type: path, ...}]` block from `laravel-package/composer.json` and `wordpress-plugin/composer.json`.
- Bump their `require.haakco/custd-sdk` from `^1.1` to `^1.3` to match the released line.
- **Move `sdk-php` in `VersionSyncTest` from the hardcoded list to the tag-derived list.** The `version` pin in `sdk-php/composer.json` exists only so the `path` shim can resolve it; once the shim is gone, `sdk-php` and the root `composer.json` are two manifests of the **same** package (`haakco/custd-sdk`) whose version is tag-derived. Concretely: delete the `sdk-php` line from `VersionSyncTest::hardcodedVersionManifests()`, add `sdk-php/composer.json` to `tagDerivedManifests()`, and remove the `version` key from `sdk-php/composer.json`. Re-run the gate (red → green).

**TDD:** the existing `laravel-package/tests/PackagingTest.php` + `wordpress-plugin/tests/PackagingTest.php` assert packaging shape — extend them to assert the `path` repository block is **absent** before deleting it (red → green).

## Task 5 — Consume via Composer VCS from the GitHub mirrors (no Packagist)

**We are not using Packagist.** Downstreams install the framework packages directly from the private GitHub mirror repos via a Composer **VCS** repository, authenticating with their existing GitHub Composer credentials (`composer config --global github-oauth.github.com <token>`). Each downstream `composer.json` adds:

```json
"repositories": [
  { "type": "vcs", "url": "https://github.com/haakco/custd-sdk-laravel" },
  { "type": "vcs", "url": "https://github.com/haakco/custd-sdk-wordpress" }
]
```

Then `composer require haakco/custd-laravel:^1.3` resolves from the mirror's tags (the package *name* comes from the mirror's `composer.json`; the repo URL is just where Composer reads it). `haakco/custd-sdk` resolves transitively the same way (add its VCS repo too, or its mirror, since the root package is the monorepo itself).

**Remove the now-unused `publish-packagist` job** from `.github/workflows/ci.yml` (it notifies packagist.org, which we don't use) — see [Open cleanup](#open-cleanup).

---

## Verification (from a scratch Laravel/PHP project, not this repo)

```bash
composer require haakco/custd-laravel:^1.3   # resolves haakco/custd-sdk transitively, no local path
php -r "require 'vendor/autoload.php'; class_exists(HaakCo\\LaravelCustd\\CustdServiceProvider::class) || exit(1);"
```

**Done when:** a downstream installs `haakco/custd-laravel` (with `haakco/custd-sdk` pulled transitively) via Composer VCS from the GitHub mirror with **no** machine-local `path`, the service provider autoloads, the mirrors carry the same `vX.Y.Z` tag as the monorepo, and `release-guard` is green. Confirm it installs in **CI and shared agent workspaces**, not just one laptop.

---

## Open cleanup

- **Remove the `publish-packagist` job** from `.github/workflows/ci.yml` and drop the `PACKAGIST_USERNAME`/`PACKAGIST_TOKEN` references — we consume via Composer VCS, not Packagist. (Deferred per <tim@haak.co> — "not doing this now"; the job currently no-ops when its secrets are absent, so it is harmless until removed.)

---

## Links

- Umbrella: [Unblock CouriB Consumer](2026-06-17-2026-06-16-cb-consumer-unblock_plan.md) (R2).
- Companion: [Plan A — Version Source of Truth + Publish](2026-06-16-2026-06-16-sdk-version-source-of-truth-and-publish_plan.md) (archived — shipped at v1.3.1).
- Superseded: [SDK Repo Split](2026-06-16-2026-06-16-sdk-repo-split_plan.md) (archived).
- Version-sync rule: `AGENTS.md` → "Version Sync".

**Last verified:** 2026-06-16. Task 1 done (3 private mirrors created). Remaining: Task 2 (add `MIRROR_PUSH_TOKEN` — needs a human token paste), then commit `release-mirrors.yml` (Task 3), then Tasks 4–5.
