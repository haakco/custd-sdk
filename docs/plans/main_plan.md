# Custd SDK — Plan Index

Central tracker for active implementation plans. Link every active plan here with current status.

## Active

| Status | Plan | Summary |
| --- | --- | --- |
| 🚧 In progress | [SDK Package Split & Packaging Hardening](2026-06-16-sdk-package-split-and-hardening_plan.md) | Make root `haakco/custd-sdk` pure-PHP only; turn `laravel-package`/`wordpress-plugin` into split-ready standalone packages; `export-ignore` dist; Authy→Awthy BC aliases + semver; curl/backoff hygiene. |
| 🟢 Mostly done | [Unblock CouriB Consumer](2026-06-16-cb-consumer-unblock_plan.md) (umbrella) | R1 (JS→Verdaccio) and R2 (Laravel/WordPress via mirrors) **both published at v1.3.1**. Tracks Plan B's remaining tail. |
| 🟢 Published, small tail | [Plan B — Subtree-Split Mirrors](2026-06-16-sdk-subtree-split-mirrors_plan.md) | 3 public mirrors (`custd-sdk-laravel/-wordpress/-go`) created + populated; `release-mirrors.yml` committed. Task 4 (drop `path` shims → VCS) and the Go module rename (`custd-sdk-go`, split-time fixture vendoring) shipped in `v1.3.2`. **Remaining:** set a real `MIRROR_PUSH_TOKEN` in Infisical (current value is a placeholder, so CI auto-mirror is blocked). |

## Archived (2026-06-16)

Completed plans moved to `archive/docs/plans/`:

- [Plan A — Version Source of Truth + Publish](../../archive/docs/plans/2026-06-16-2026-06-16-sdk-version-source-of-truth-and-publish_plan.md) — ✅ shipped: `@haakco/custd-sdk@1.3.1` published to Verdaccio; `VERSION` source of truth + `VersionSyncTest` + `release-guard` live.
- [SDK Static-Analysis Rollout](../../archive/docs/plans/2026-06-16-2026-06-16-sdk-static-analysis-rollout_plan.md) — ✅ implemented: PHPStan+Pint / Biome / golangci-lint / Ruff+mypy gates in CI.
- [SDK Repo Split (future)](../../archive/docs/plans/2026-06-16-2026-06-16-sdk-repo-split_plan.md) — superseded by Plan B (subtree-split mirrors).

## Deferred Work

- **Real `MIRROR_PUSH_TOKEN`** — the Infisical secret at `/custd-sdk` `prod` currently holds a placeholder, so the `release-mirrors` CI job can't push. Set a fine-grained GitHub PAT (`Contents: write` on the 3 mirrors). Until then, mirrors are populated manually. See [Plan B](2026-06-16-sdk-subtree-split-mirrors_plan.md).
- ✅ **Done in `v1.3.2`** — dropped the `path` shims (now a VCS repo at `https://github.com/haakco/custd-sdk`); renamed the Go module to `github.com/haakco/custd-sdk-go` (the release split vendors `contract-fixtures/` so the standalone module is self-contained); added `sdk-go/VERSION` to the version-sync gate. Removed the now-duplicate root-boundary tests from the split packages (owned by `sdk-php/tests/PackageBoundaryTest.php`). Mirrors pick this up on the next successful `release-mirrors` run (needs the token below).
- **PHP analysis for `laravel-package/` + `wordpress-plugin/`** — needs larastan + WordPress stubs. See the archived [SDK Static-Analysis Rollout → Deferred Work](../../archive/docs/plans/2026-06-16-2026-06-16-sdk-static-analysis-rollout_plan.md#deferred-work).
