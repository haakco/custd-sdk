# Custd SDK Agent Instructions

This repository owns the public Custd SDKs.

## Prime Directive

Improve the shared SDKs instead of creating one-off clients in product repositories. When Vorrent, TrackLab, Custd, or another project needs producer behavior, add it here, release it, then update the consumer to use the released SDK.

## Repository Map

| Path | Contents |
| --- | --- |
| `sdk-go/` | Go SDK module `github.com/haakco/custd-sdk/sdk-go`. |
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

## Required Checks

Run before committing:

```bash
just test
git diff --check
```

For CI changes, all GitHub Actions jobs must use `runs-on: self-hosted`.
