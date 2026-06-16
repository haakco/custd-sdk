# Plan B — Subtree-Split All SDKs to Mirror Repos

**Goal:** Make every SDK package installable through its own ecosystem's standard path — without a machine-local Composer `path` repo — while keeping a single monorepo as the source of truth. This is the VCS-forced half of the [CouriB consumer unblock](2026-06-16-cb-consumer-unblock_plan.md) (R2). It unblocks CouriB Phase 0 (API), which needs `composer require haakco/custd-laravel`.

**Background:** A private repo consumed via Composer VCS exposes exactly **one** package — the root `composer.json`. Today that is `haakco/custd-sdk` (pure PHP). `haakco/custd-laravel` and `haakco/custd-wordpress` live in subtrees, so they are invisible to a VCS repo pointed at the monorepo root, and consumers fall back to a `path` shim that only works on one machine. The fix is to give each package a repo root of its own.

**Architecture (chosen):** **Monorepo + `git subtree split` to read-only mirror repos.** We keep developing, testing, and tagging in this one repo. A release CI job (on `v*` tag push) splits each package subtree to its own mirror repo and copies the **same** tag onto it. Packagist / Go module proxy / git consumers watch the mirrors. Versions cannot drift because every mirror tag derives from one monorepo tag, and [Plan A](2026-06-16-sdk-version-source-of-truth-and-publish_plan.md)'s `release-guard` + `VersionSyncTest` already enforce tag == `VERSION` == every manifest.

**Why subtree-split over the alternatives:** it is the only language-agnostic option that needs **zero new infrastructure** — `git subtree split` is built into git and runs as a plain job on the existing self-hosted ARC runners. `symplify/monorepo-builder` is PHP-only (would not split `sdk-go`/`sdk-js`/`sdk-python`); Copybara is language-agnostic but JVM-based and hand-wires lockstep. Read-only mirrors mean the dev workflow does not change at all.

**Tech Stack:** `git subtree`, GitHub Actions (self-hosted runners), `gh` CLI, Composer/Packagist, Go module proxy, Verdaccio/PyPI (JS/Python keep their registries — see note below).

**Parallel Work Model:** Repo-plumbing change. Single implementer owns `.github/workflows/release-mirrors.yml` and the manifest cleanups (drop `path` shims). Other agents must not edit those files concurrently. The outward steps (repo creation, deploy secret, Packagist registration) are coordinator-gated — do not run them without explicit approval. No `git stash` / `git reset`.

---

## Scope note: which SDKs actually need a mirror?

| Package | Standard install path | Mirror needed? |
| --- | --- | --- |
| `sdk-js` (`@haakco/custd-sdk`) | Verdaccio registry | **No** — handled by [Plan A](2026-06-16-sdk-version-source-of-truth-and-publish_plan.md). |
| `sdk-python` (`custd-sdk`) | PyPI/registry | **No** — registry, not VCS. (Add a publish job if/when a downstream needs it.) |
| `sdk-go` | Go modules resolve subdir modules via `sdk-go/vX.Y.Z` tags **today** | **Yes (decided)** — mirror to `haakco/custd-sdk-go` for a clean `github.com/haakco/custd-sdk-go` import path. |
| `haakco/custd-sdk` (root, pure PHP) | Composer VCS = root package | **No** — it is already the root. |
| `haakco/custd-laravel` | Composer VCS/Packagist | **YES — the blocker.** |
| `haakco/custd-wordpress` | Composer VCS/Packagist | **YES.** |

**Bottom line:** the only packages *forced* into a mirror are the two PHP framework packages (the CouriB must-haves). `sdk-go` is also mirrored (decided) for a clean import path; JS/Python stay on their registries (Verdaccio/PyPI). The "split all the SDKs" mechanism below is uniform — one job loops the matrix.

---

## Current State (Verified 2026-06-16)

**Files examined:**

- `laravel-package/composer.json` — name `haakco/custd-laravel`; carries `repositories: [{type: path, url: ../sdk-php, symlink: true}]` shim; requires `haakco/custd-sdk: ^1.1`. The `path` block is what must go once the mirror exists.
- `wordpress-plugin/composer.json` — name `haakco/custd-wordpress`; same `path` shim; requires `haakco/custd-sdk: ^1.1`.
- `.gitattributes` — `/laravel-package`, `/wordpress-plugin`, `/sdk-go`, `/sdk-js`, `/sdk-python` all `export-ignore` (correct: keeps the root PHP dist clean; unrelated to the split, which uses `git subtree`, not `git archive`).
- `.github/workflows/ci.yml` — `publish-packagist` currently notifies Packagist for **one** URL (`github.com/haakco/custd-sdk`). Must add the two mirror URLs after the split.
- `sdk-php/composer.json` — version-pinned `1.3.0`; this pin exists for the `path` shim and is removed once the shims are gone (the framework packages then resolve `haakco/custd-sdk` from Packagist).

**Deferred Work:** None deferred from this plan. This plan itself *supersedes* the earlier deferral — see [`future/2026-06-16-sdk-repo-split_plan.md`](future/2026-06-16-sdk-repo-split_plan.md) (to be archived on completion).

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

The split job pushes to other repos, so the default `GITHUB_TOKEN` (scoped to this repo) is insufficient. Add `MIRROR_PUSH_TOKEN` as a repo secret on `haakco/custd-sdk`.

**Least privilege (do not use a classic PAT or a broad token):** use a **fine-grained PAT** scoped to **only** the three mirror repos, with **`Contents: read and write`** and nothing else, and a **short expiry** (rotate on expiry). A classic org-wide token would let a compromised runner write to every HaakCo repo — the blast radius must be the three mirrors only.

```bash
gh secret set MIRROR_PUSH_TOKEN --repo haakco/custd-sdk   # paste the fine-grained token
```

## Task 3 — `release-mirrors.yml` workflow (commit after the secret in Task 2 exists)

A tag-triggered, self-hosted job that splits each subtree and pushes it + the tag to its mirror. The token is passed via `http.extraheader` (base64 in a git config value git never prints) — **not** embedded in the remote URL, so it never lands in `argv`/process list or logs:

```yaml
name: Release Mirrors

on:
  push:
    tags: ["v*"]

permissions:
  contents: read

jobs:
  split:
    runs-on: self-hosted
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
          MIRROR_PUSH_TOKEN: ${{ secrets.MIRROR_PUSH_TOKEN }}
          PREFIX: ${{ matrix.prefix }}
          MIRROR: ${{ matrix.mirror }}
          TAG: ${{ github.ref_name }}
        run: |
          split_sha="$(git subtree split --prefix="$PREFIX")"
          auth_header="AUTHORIZATION: basic $(printf 'x-access-token:%s' "$MIRROR_PUSH_TOKEN" | base64 | tr -d '\n')"
          git -c http."https://github.com/".extraheader="$auth_header" \
            push "https://github.com/${MIRROR}.git" "${split_sha}:refs/heads/main" --force
          git -c http."https://github.com/".extraheader="$auth_header" \
            push "https://github.com/${MIRROR}.git" "${split_sha}:refs/tags/${TAG}"
```

> `runs-on: self-hosted` per HaakCo policy. Refs use the env-var form (`$GITHUB_REF_NAME`), so no `${{ }}` injection. The matrix is the single source of which subtrees mirror.

## Task 4 — Drop the `path` shims (ship only after mirrors are live + Packagist-registered)

Once `haakco/custd-sdk` is resolvable on Packagist and the two framework mirrors exist:

- Remove the `repositories: [{type: path, ...}]` block from `laravel-package/composer.json` and `wordpress-plugin/composer.json`.
- Bump their `require.haakco/custd-sdk` from `^1.1` to `^1.3` to match the released line.
- **Move `sdk-php` in `VersionSyncTest` from the hardcoded list to the tag-derived list.** The `version` pin in `sdk-php/composer.json` exists only so the `path` shim can resolve it; once the shim is gone, `sdk-php` and the root `composer.json` are two manifests of the **same** package (`haakco/custd-sdk`) whose version is tag-derived. Concretely: delete the `sdk-php` line from `VersionSyncTest::hardcodedVersionManifests()`, add `sdk-php/composer.json` to `tagDerivedManifests()`, and remove the `version` key from `sdk-php/composer.json`. Re-run the gate (red → green).

**TDD:** the existing `laravel-package/tests/PackagingTest.php` + `wordpress-plugin/tests/PackagingTest.php` assert packaging shape — extend them to assert the `path` repository block is **absent** before deleting it (red → green).

## Task 5 — Wire Packagist for the two framework mirrors

Extend `publish-packagist` in `ci.yml` to POST the two new mirror URLs (`github.com/haakco/custd-sdk-laravel`, `github.com/haakco/custd-sdk-wordpress`) alongside the existing root URL, and register each mirror on Packagist once.

---

## Verification (from a scratch Laravel/PHP project, not this repo)

```bash
composer require haakco/custd-laravel:^1.3   # resolves haakco/custd-sdk transitively, no local path
php -r "require 'vendor/autoload.php'; class_exists(HaakCo\\LaravelCustd\\CustdServiceProvider::class) || exit(1);"
```

**Done when:** a downstream installs `haakco/custd-laravel` (with `haakco/custd-sdk` pulled transitively) via VCS/Packagist with **no** machine-local `path`, the service provider autoloads, the mirrors carry the same `vX.Y.Z` tag as the monorepo, and `release-guard` is green. Confirm it installs in **CI and shared agent workspaces**, not just one laptop.

---

## Links

- Umbrella: [Unblock CouriB Consumer](2026-06-16-cb-consumer-unblock_plan.md) (R2).
- Companion: [Plan A — Version Source of Truth + Publish](2026-06-16-sdk-version-source-of-truth-and-publish_plan.md).
- Superseded: [`future/2026-06-16-sdk-repo-split_plan.md`](future/2026-06-16-sdk-repo-split_plan.md) — archive on completion.
- Version-sync rule: `AGENTS.md` → "Version Sync".

**Last verified:** 2026-06-16. Task 1 done (3 private mirrors created). Remaining: Task 2 (add `MIRROR_PUSH_TOKEN` — needs a human token paste), then commit `release-mirrors.yml` (Task 3), then Tasks 4–5.
