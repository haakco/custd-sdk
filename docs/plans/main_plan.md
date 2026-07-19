# Custd SDK — Plan Index

Central tracker for active implementation plans. Link every active plan here with current status.

## Active

- [Exact-Subject Insight SDK Parity](./2026-07-18_1948_exact-subject-insight-sdk-parity-plan.md) — active; Codex direct
  takeover. Implementation and BUG-009 remediation are committed and locally
  green at `7b0f46d`; final review/reconciliation, push and main CI, separately
  authorized immutable tagging, publication/consumer proof, and archive remain.

## Archived (2026-06-17)

Completed plans moved to `archive/docs/plans/`:

- [SDK Package Split & Packaging Hardening](../../archive/docs/plans/2026-06-17-2026-06-16-sdk-package-split-and-hardening_plan.md) — ✅ shipped in `v1.3.0`: root `haakco/custd-sdk` pure-PHP only; `laravel-package`/`wordpress-plugin` standalone + `export-ignore` dist; Authy→Awthy BC aliases; curl/backoff hygiene.
- [Unblock CouriB Consumer](../../archive/docs/plans/2026-06-17-2026-06-16-cb-consumer-unblock_plan.md) (umbrella) — ✅ both blockers cleared: R1 (JS→Verdaccio) and R2 (Laravel/WordPress via mirrors), current at `v1.3.2`.
- [Plan B — Subtree-Split Mirrors](../../archive/docs/plans/2026-06-17-2026-06-16-sdk-subtree-split-mirrors_plan.md) — ✅ 3 public mirrors populated + tagged `v1.3.2`; `path` shims dropped → VCS; Go module renamed to `github.com/haakco/custd-sdk-go` (split vendors `contract-fixtures/`). Only the `MIRROR_PUSH_TOKEN` infra item remains (see Deferred Work).

## Archived (2026-06-16)

- [Plan A — Version Source of Truth + Publish](../../archive/docs/plans/2026-06-16-2026-06-16-sdk-version-source-of-truth-and-publish_plan.md) — ✅ shipped: `@haakco/custd-sdk` published to Verdaccio; `VERSION` source of truth + `VersionSyncTest` + `release-guard` live.
- [SDK Static-Analysis Rollout](../../archive/docs/plans/2026-06-16-2026-06-16-sdk-static-analysis-rollout_plan.md) — ✅ implemented: PHPStan+Pint / Biome / golangci-lint / Ruff+mypy gates in CI.
- [SDK Repo Split (future)](../../archive/docs/plans/2026-06-16-2026-06-16-sdk-repo-split_plan.md) — superseded by Plan B (subtree-split mirrors).

## Deferred Work

- ✅ **Resolved by `v1.6.4`** — automated mirror publication succeeded; the
  historical placeholder `MIRROR_PUSH_TOKEN` warning is no longer current. See
  [Plan B](../../archive/docs/plans/2026-06-17-2026-06-16-sdk-subtree-split-mirrors_plan.md).
- ✅ **Done in `v1.3.2`** — dropped the `path` shims (now a VCS repo at `https://github.com/haakco/custd-sdk`); renamed the Go module to `github.com/haakco/custd-sdk-go` (the release split vendors `contract-fixtures/` so the standalone module is self-contained); added `sdk-go/VERSION` to the version-sync gate. Removed the now-duplicate root-boundary tests from the split packages (owned by `sdk-php/tests/PackageBoundaryTest.php`). Mirrors pick this up on the next successful `release-mirrors` run (needs the token below).
- **PHP analysis for `laravel-package/` + `wordpress-plugin/`** — needs larastan + WordPress stubs. See the archived [SDK Static-Analysis Rollout → Deferred Work](../../archive/docs/plans/2026-06-16-2026-06-16-sdk-static-analysis-rollout_plan.md#deferred-work).
