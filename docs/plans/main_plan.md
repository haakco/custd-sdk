# Custd SDK — Plan Index

Central tracker for active implementation plans. Link every active plan here with current status.

## Active

| Status | Plan | Summary |
| --- | --- | --- |
| 🚧 In progress | [SDK Package Split & Packaging Hardening](2026-06-16-sdk-package-split-and-hardening_plan.md) | Make root `haakco/custd-sdk` pure-PHP only; turn `laravel-package`/`wordpress-plugin` into split-ready standalone packages; `export-ignore` dist; Authy→Awthy BC aliases + semver; curl/backoff hygiene. Branch `fix/sdk-package-split-and-hardening`. |
| ✅ Implemented | [SDK Static-Analysis Rollout](2026-06-16-sdk-static-analysis-rollout_plan.md) | PHPStan+Pint / Biome / golangci-lint / Ruff+mypy gates across the four SDKs, mirroring `cb/api`, `web-gui`, `meridian`. On branch `feat/sdk-static-analysis`. |

## Deferred Work

- **PHP analysis for `laravel-package/` + `wordpress-plugin/`** — needs larastan + WordPress stubs. See [SDK Static-Analysis Rollout → Deferred Work](2026-06-16-sdk-static-analysis-rollout_plan.md#deferred-work).
- **Split framework packages into separate repos** — `haakco/custd-laravel` + `haakco/custd-wordpress` as standalone repos/Packagist packages. See [SDK Repo Split](future/2026-06-16-sdk-repo-split_plan.md).
