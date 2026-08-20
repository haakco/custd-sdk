# Custd SDK Progress

**Owning plans:**

- [`docs/plans/2026-07-30_1826_client-data-lifecycle-sdk-parity_plan.md`](docs/plans/2026-07-30_1826_client-data-lifecycle-sdk-parity_plan.md)
  (M1–M5 below)
- `docs/changelog/2026-08-18-v1.8.9-durable-prediction-reporting.md` (v1.8.9 release note)

**Status (2026-08-18):** v1.8.9 release preparation reconciles the local
durable selective queue commits with the public v1.8.7 prediction helpers and
the tagged v1.8.8 report-export lifecycle. The synchronized manifests are set
to `1.8.9`; tagging and pushing remain approval-gated and are not performed in
this commit.

## Current State

- Local `main` integrates durable queue commits `e53bc8a`/`aebc87c` with
  prediction helper commit `3d08c10` and report-export history ending at the
  tagged `3cc0d6e` (`v1.8.8`).
- `VERSION`, `sdk-go/VERSION`, `sdk-python/pyproject.toml`,
  `sdk-js/package.json`, `sdk-php/composer.json`, and
  `wordpress-plugin/custd.php` are all set to `1.8.9`.
- Release-guard would pass on a `v1.8.9` tag (matches `VERSION` and every
  manifest mirror).
- v1.8.4 has shipped (`v1.8.4` tag, mirror split completed). v1.8.5 and
  v1.8.6 were follow-up patches that also shipped. v1.8.7 and v1.8.8 are
  already public tags for prediction helpers and report-export lifecycle.
- v1.8.9 carries the Python-only durable selective queue alongside those
  public capabilities. PHP keeps its existing `FileQueueStore`; JS and Go
  keep their in-memory queues; the README parity table records the intentional
  asymmetry. See the v1.8.9 changelog for scope.

### v1.8.9 release prep

- `VERSION` bumped to `1.8.9` (every manifest mirrored).
- Changelog created at
  `docs/changelog/2026-08-18-v1.8.9-durable-prediction-reporting.md`.
- README parity table records the "Durable file-backed queue" row as an
  intentional v1.8.9 asymmetry.
- `release-guard` (CI) and the `release-mirrors.yml` tag guard both use the
  same `VERSION == tag` check; both would pass for `v1.8.9`.
- No new PyPI publish job is added in this release. The Python SDK stays on
  the existing `git+https` install path; no Python mirror is opened, and
  `release-mirrors.yml` continues to split only `laravel-package`,
  `wordpress-plugin`, and `sdk-go`. A `publish-python` job would require a
  PyPI project + trusted-publishing configuration that is out of scope for
  this release prep.

### Out of scope (recorded, not actioned)

- `tools/loadgen/js/package.json` (in the `custd` repository, not this SDK)
  has a stale pin mismatch. That fix lives in the `custd` repo and is not
  touched here.

## Historical record — v1.8.4 lifecycle SDK parity (M1–M5)

The following milestones describe the v1.8.4 work that shipped on 2026-08-01.
They are kept as the durable record of how the lifecycle SDK parity landed;
the Current State section above is the headline that matters now.

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

### M5 — Release

- v1.8.4: VERSION bumped to 1.8.4 across root `VERSION`, `sdk-go/VERSION`,
  `sdk-js/package.json`, `sdk-php/composer.json`,
  `sdk-python/pyproject.toml`, `wordpress-plugin/custd.php`. Release approval
  was provided on 2026-08-01. Version `v1.8.4` follows the immutable
  `v1.8.3` tag and supplies the maintained containerd runner's required
  pinned job container.
- v1.8.5 / v1.8.6: small follow-up patches (browser script pageviews,
  Dependabot security fixes). Tags `v1.8.5` and `v1.8.6` were both cut and
  mirrored through the same flow.
- v1.8.7: public prediction admin helper tag at `3d08c10`.
- v1.8.8: public report-export lifecycle tag at `3cc0d6e`.
- v1.8.9: VERSION is prepared across the same six files. Python-only durable
  selective queue is combined with the v1.8.7/v1.8.8 capabilities in this
  local release cut; tag + push remain approval-gated.

## Test totals (M1–M4)

| SDK       | Tests GREEN             |
| --------- | ----------------------- |
| Go        | 13 lifecycle + existing |
| JS        | 138 lifecycle           |
| Python    | 22 lifecycle            |
| PHP       | 147 lifecycle           |
| **Total** | **320**                 |

Python `sdk-python/tests/` grew by the durable-queue tests committed at
`e53bc8a` (queue overflow, selective ack, file-backed storage survival); the
counts above describe the M1–M4 lifecycle baseline.

## Next

- After operator approval, push the reconciled `main`, tag `v1.8.9`, and push
  the tag:
  `git tag v1.8.9 && git push origin main && git push origin v1.8.9`.
- Wait for `release-mirrors.yml` to split `laravel-package`,
  `wordpress-plugin`, `sdk-go` to their mirrors; verify the published
  artifacts; then pin Custd consumers to `v1.8.9`.

## Blockers

None.

## Last Useful Commands

- `bash scripts/test-bump-version.sh` — passes (bumps a tmp tree to `9.8.7`
  and asserts every manifest matches).
- `git diff --check` — passed on the bump diff.
- `bash scripts/bump-version.sh 1.8.9` — produces the current `1.8.9`
  bump; committed in this prep change set.
- `bash scripts/test-publish-release-mirror.sh` — passes.
