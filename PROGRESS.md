# Custd SDK v1.8.0 Progress

**Owning plan:**
[`docs/plans/2026-07-30_1826_client-data-lifecycle-sdk-parity_plan.md`](docs/plans/2026-07-30_1826_client-data-lifecycle-sdk-parity_plan.md)
**Status:** Milestones 1–5 complete on `feat/client-data-lifecycle-sdk-parity`;
version bumped to `1.8.0`; release tag + publication **pending explicit
release approval** per the plan's release rule.

## Current State (verified 2026-07-31)

- Work branch `feat/client-data-lifecycle-sdk-parity` is ahead of `main` by
  7 commits; branch is pushed to origin and tracked.
- The lifecycle M0–M4 server contracts are merged on Custd
  `feat/client-data-lifecycle-d3-d5` at `fb2b0cec` (admin suite ALL GREEN).
- The pre-start gate in the SDK plan is open: server is the source of
  truth, spec drift (no erasure cancel/retry, no retention status) is
  reconciled against the actual server endpoints, and shared lifecycle
  contract fixtures match the server shape.

## Completed

### M1 — Lifecycle contract fixtures
- 5 namespaces populated under `contract-fixtures/lifecycle/`:
  - `tenant-storage/` (6 fixtures)
  - `subject-exports/` (9 fixtures)
  - `privacy-erasures/` (8 fixtures)
  - `retention/` (8 fixtures)
  - `offboarding/` (17 fixtures)
- Shared matrix at `contract-fixtures/lifecycle/matrix.json` declares
  per-namespace assertions shared by Go, JS, Python, PHP test suites.
- README documents namespace + filename convention.

### M2 — Offboarding + tenant-storage parity
- Go: `TenantStorageAdminClient`, `OffboardingAdminClient` schedule +
  full request lifecycle.
- JS: `TenantStorageClient`, `OffboardingClient` with full request
  lifecycle + schedules.
- Python: same.
- PHP: same.

### M3 — Subject export, physical erasure, retention parity
- Go: `SubjectExportAdminClient` (create/list/get/cancel/download/force),
  `PrivacyErasureAdminClient` (create/list/get/force — NO cancel/retry;
  server has none), `RetentionAdminClient` (+ preview/apply/listRuns;
  no dedicated status).
- JS, Python, PHP: same surface; no deprecated aliases.
- Forward-only: removed-removed paths are not preserved.

### M4 — Packaging + clean consumers
- README lifecycle administration sections in all four SDK READMEs
  (Go, JS, Python, PHP).
- `just test` passes for all four SDKs:
  - Go: vet + golangci-lint + tests
  - JS: 12 test files, 138 tests, lint + typecheck + build
  - Python: ruff + mypy + 22 lifecycle tests
  - PHP: composer analyse + format-check + 147 tests
- `bash scripts/test-publish-release-mirror.sh` passes locally.

### M5 — Release prep (awaiting approval)
- VERSION bumped: 1.7.1 → 1.8.0 across root `VERSION`, `sdk-go/VERSION`,
  `sdk-js/package.json`, `sdk-php/composer.json`,
  `sdk-python/pyproject.toml`, `wordpress-plugin/custd.php`.
- Plan's release rule: "This plan does not authorize a release;
  tagging/publication requires the normal explicit release decision."
  Awaiting the explicit "publish v1.8.0" instruction before
  creating `v1.8.0`, running `release-mirrors.yml`, and finalizing
  the Verdaccio + Composer sources.

## Test totals (M1–M4)

| SDK       | Tests GREEN |
| --------- | ----------- |
| Go        | 13 lifecycle + existing |
| JS        | 138 lifecycle |
| Python    | 22 lifecycle |
| PHP       | 147 lifecycle |
| **Total** | **320**     |

## Next

- Explicit release approval → tag `v1.8.0` → wait for `ci.yml` and
  `release-mirrors.yml` on the tag → verify Verdaccio resolves
  `@haakco/custd-sdk@1.8.0` → hand off to Custd M5 (consumer pinning)
  and Tiao.

## Blockers

None on the SDK side. The plan stops here and resumes Custd-side only
after an explicit release decision.

## Last Useful Commands

- `just test` — passed.
- `git diff --check` — passed.
- `bash scripts/test-bump-version.sh` — passed.
- `bash scripts/bump-version.sh 1.8.0` — applied; see commit `c5d97a7`.