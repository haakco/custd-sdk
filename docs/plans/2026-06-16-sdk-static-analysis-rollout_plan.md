# SDK Static-Analysis Rollout Implementation Plan

**Goal:** Bring the four custd SDKs up to HaakCo's standard static-analysis gates (lint, format, type analysis) so packaging/quality defects like the v1.2.0 PSR-4 bug are caught in CI, not by consumers.

**Status:** ✅ Implemented on branch `feat/sdk-static-analysis` (2026-06-16). All four language gates pass locally and are wired into `just test-*` and CI. Two PHP sub-packages deferred — see **Deferred Work**.

**Background:** v1.2.1 added zero-dependency gates (`go vet`, `tsc typecheck`, per-language packaging tests). This plan adds the heavier analyzers the reference repos (`cb/api`, `web-gui`, `meridian`) already enforce, mapped to each SDK language.

**Architecture:** One static-analysis stack per language, wired into both the language's `just test-<lang>` target and its CI job. No SDK behavior changes — config plus a handful of type-narrowing fixes the analyzers surfaced.

**Tech stack (grounded in reference repos):** PHP → PHPStan + Laravel Pint · TypeScript → Biome · Go → golangci-lint v2 · Python → Ruff + mypy. Tool versions are pinned in `.mise.toml` (the canonical local source); CI installs matching versions.

---

## As-built summary

| Language | Tooling | Config | Result |
| --- | --- | --- | --- |
| Go | golangci-lint v2.11.4 (lean linter set) | `sdk-go/.golangci.yml` | 0 issues |
| TypeScript | Biome 2.5 (lint + format) | `sdk-js/biome.json` | clean (1 documented inline suppression) |
| Python | Ruff 0.9.2 + mypy 2.1.0 (`--strict`) | `[tool.ruff]` / `[tool.mypy]` in `sdk-python/pyproject.toml` | clean (3 type-narrowing fixes) |
| PHP | PHPStan level 6 + Pint psr12 | `sdk-php/phpstan.neon` / `sdk-php/pint.json` | 0 errors (8 type-hint fixes) |

**Version pinning (`.mise.toml`):** added `golangci-lint = "2.11.4"`, `ruff = "0.9.2"`, `"pipx:mypy" = "2.1.0"`. Biome is intentionally pinned via `sdk-js/package.json` + `pnpm-lock.yaml` (JS-native source), not mise.

---

## Decisions resolved during implementation

- **PHP PHPStan level:** level 6 (not the aspirational "max"). Level 6 matches the actual reference standard in `cb/api` and gives full type coverage without the mixed-heavy noise of levels 7+. No baseline file and no `@phpstan-ignore` — all 8 findings fixed at source (missing array value-types, one stat-array key-type).
- **PHP Pint preset:** `psr12` (matches existing `declare(strict_types=1)` / 4-space style; first run was a no-op).
- **Go golangci-lint set:** lean, not a copy of meridian's. Enabled `errcheck, govet, ineffassign, staticcheck, unused, errorlint, misspell, unconvert, whitespace` + formatters `gofmt, goimports`. Meridian's config carries suppressions for ent/gqlgen/seeders that do not exist here.
- **Python dev deps:** versions pinned via mise (`.mise.toml`); `pyproject.toml [project.optional-dependencies].dev` lists `ruff`/`mypy` for pip users. mypy is provided to mise through the `pipx:` backend (no native registry entry).
- **CI PHP analysis:** runs in a dedicated single-version `php-analysis` job (PHP 8.4) rather than the 3-version test matrix — analysis is version-independent, so this avoids running it three times. `publish-packagist` now gates on `[php, php-analysis]`.

---

## Files changed

- Create: `sdk-go/.golangci.yml`, `sdk-js/biome.json`, `sdk-php/phpstan.neon`, `sdk-php/pint.json`
- Modify config: `.mise.toml`, `justfile`, `.github/workflows/ci.yml`, `sdk-js/package.json`, `sdk-php/composer.json`, `sdk-php/composer.lock`, `sdk-python/pyproject.toml`
- Modify source (analyzer-surfaced, behavior-preserving): `sdk-python/src/custd/client.py`, `sdk-js/src/index.ts` (+ Biome auto-format across `sdk-js/src`), `sdk-php/src/CustdClient.php`, `sdk-php/src/FileQueueStore.php`, `sdk-php/tests/CustdClientTest.php`, `sdk-php/tests/ComposerMetadataTest.php`

---

## Verification

Every gate was run locally before any push:

- `just test-go` — vet, golangci-lint (0 issues), tests
- `just test-js` — Biome lint, typecheck, 54 tests, build (dist free of test files)
- `just test-python` — Ruff, mypy `--strict`, 21 tests
- `just test-php` — PHPStan level 6 (0 errors), Pint (passed), 71 tests
- `actionlint` clean; all 8 CI jobs `runs-on: self-hosted`; no GitHub-hosted labels

---

## Deferred Work

**PHP static analysis for `laravel-package/` and `wordpress-plugin/`.**

- **What:** PHPStan + Pint currently cover `sdk-php/` only. The repo's root `composer.json` also ships `laravel-package/` (5 files) and `wordpress-plugin/` (8 files); their tests run in the root suite but they are not yet statically analyzed.
- **Why deferred:** clean analysis of these needs framework stubs — `larastan/larastan` for the Laravel service provider, `php-stubs/wordpress-stubs` for the plugin — plus per-package config. That is a materially larger lift than the SDK-core gate and was out of the scoped plan.
- **Risk until done:** type/contract regressions in the Laravel and WordPress adapters are caught only by their unit tests, not by static analysis.
- **To finish:** add larastan + WordPress stubs, a root or per-package `phpstan.neon` covering `laravel-package/src` and `wordpress-plugin/src`, extend Pint paths, and add the steps to the `php-analysis` CI job. Track from `docs/plans/main_plan.md` when picked up.

---

## Out of scope (v1)

- Duplication scanners (jscpd), unused-export detection (knip), phpmd/mago. Promote to a follow-up plan if desired.
