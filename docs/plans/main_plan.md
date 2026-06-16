# Custd SDK — Plan Index

Central tracker for active implementation plans. Link every active plan here with current status.

## Active

| Status | Plan | Summary |
| --- | --- | --- |
| 🚧 In progress | [SDK Package Split & Packaging Hardening](2026-06-16-sdk-package-split-and-hardening_plan.md) | Make root `haakco/custd-sdk` pure-PHP only; turn `laravel-package`/`wordpress-plugin` into split-ready standalone packages; `export-ignore` dist; Authy→Awthy BC aliases + semver; curl/backoff hygiene. Branch `fix/sdk-package-split-and-hardening`. |
| 📋 Umbrella | [Unblock CouriB Consumer](2026-06-16-cb-consumer-unblock_plan.md) | Two install blockers gating CouriB Phase 0/1. **Split into Plan A + Plan B** (below). Requested by <tim@haak.co>. |
| 🚧 Code landed | [Plan A — Version Source of Truth + Publish](2026-06-16-sdk-version-source-of-truth-and-publish_plan.md) | Root `VERSION` source of truth; bump all SDKs to `1.3.0`; `VersionSyncTest` + `release-guard` CI gate; publish `@haakco/custd-sdk` to Verdaccio. Code on this branch; live publish remains. |
| 📋 Gated | [Plan B — Subtree-Split Mirrors](2026-06-16-sdk-subtree-split-mirrors_plan.md) | `git subtree split` `laravel-package` + `wordpress-plugin` (and optionally `sdk-go`) to read-only mirror repos so they are VCS/Packagist-installable; drop the `path` shim. Outward steps coordinator-gated. |
| ✅ Implemented | [SDK Static-Analysis Rollout](2026-06-16-sdk-static-analysis-rollout_plan.md) | PHPStan+Pint / Biome / golangci-lint / Ruff+mypy gates across the four SDKs, mirroring `cb/api`, `web-gui`, `meridian`. On branch `feat/sdk-static-analysis`. |

## Deferred Work

- **PHP analysis for `laravel-package/` + `wordpress-plugin/`** — needs larastan + WordPress stubs. See [SDK Static-Analysis Rollout → Deferred Work](2026-06-16-sdk-static-analysis-rollout_plan.md#deferred-work).
- ~~**Split framework packages into separate repos**~~ — **no longer deferred; now Plan B** (subtree-split to version-synced mirrors). See [Plan B — Subtree-Split Mirrors](2026-06-16-sdk-subtree-split-mirrors_plan.md). The [SDK Repo Split](future/2026-06-16-sdk-repo-split_plan.md) future plan is superseded (archive on Plan B completion).
