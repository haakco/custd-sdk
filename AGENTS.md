# Custd SDK Agent Instructions

This repository owns the public Custd SDKs.

## Prime Directive

Improve the shared SDKs instead of creating one-off clients in product repositories. When Vorrent, TrackLab, Custd, or another project needs producer behavior, add it here, release it, then update the consumer to use the released SDK.

## Repository Map

| Path | Contents |
| --- | --- |
| `sdk-go/` | Go SDK module `github.com/haakco/custd-sdk-go` (published to the `custd-sdk-go` mirror on release). |
| `sdk-js/` | TypeScript SDK package `@haakco/custd-sdk`. |
| `sdk-python/` | Python package `custd-sdk`. |
| `sdk-php/` | Composer package `haakco/custd-sdk`. |
| `contract-fixtures/` | Shared JSON fixtures used by all SDK tests. |
| `.github/workflows/` | CI for all SDK packages. Use self-hosted runners only. |

## Development Rules

- Search existing SDK implementations before adding new helpers.
- Keep behavior contract-compatible across all languages.
- Add or update shared fixtures when changing event envelope behavior.
- Preserve backward-compatible constructor options unless a breaking release is planned.
- Do not commit generated dependency directories such as `node_modules/` or `vendor/`.
- Do not commit local filesystem replacements in downstream projects.

## Version Sync (one tag drives every SDK)

All SDKs release on a **single shared version**. The root `VERSION` file is the
source of truth; the git release tag is `v<VERSION>` (e.g. `v1.3.0`). Mirror repos
created by the subtree split inherit that same tag.

- **Bump every package together.** When you change `VERSION`, update the same value
  in every package that hardcodes it: `sdk-js/package.json`, `sdk-python/pyproject.toml`,
  and `sdk-php/composer.json`.
- **Never hardcode a version in the Packagist-derived manifests.** The root
  `composer.json`, `laravel-package/composer.json`, and `wordpress-plugin/composer.json`
  take their version from the git tag on their split mirror — adding a `version` key
  there reintroduces drift.
- **Tag must equal `VERSION`.** The `release-guard` CI job fails any `v*` tag push
  whose tag does not match `VERSION`.
- **The gate is enforced, not advisory.** `sdk-php/tests/VersionSyncTest.php` checks
  every manifest against `VERSION` on each run. If you add a new published package,
  add it to that test.

## Required Checks

Run before committing:

```bash
just test
git diff --check
```

For CI changes, all GitHub Actions jobs must use `runs-on: self-hosted`.
