# Review Fixes and Status-Page Parity Plan

**Status:** Complete and archived 2026-11-26. Released as `v3.65.0` and `v3.65.1`. Follow-up work is owned
by the [SDK API parity automation plan](../../../docs/plans/2026-11-26_0006_sdk-api-parity-automation_plan.md).

**Goal:**

- Give Hosting the Site status-page calls in the PHP SDK.
- Make the same calls available in every SDK.
- Fix every runtime defect and maintenance problem found by the 2026-11-25 review of the SDKs against the
  live Custd API.

## Delivered

| Item | SDKs | Release | Proof |
| --- | --- | --- | --- |
| Status page: settings, preview, publish, unpublish, post update; component status with `maintenance`; public link helper (`<panel>/status-page#<publicKey>`) | PHP | `v3.65.0` (`47b8789`) | `SiteStatusPageClientTest` replays `contract-fixtures/site-status-page.json` |
| Status page, same contract | JS, Python, Rust | `v3.65.1` (`e15edef`) | Each SDK's status-page test replays the same fixture |
| A workflow run with no dimensions (`{}`) crashed `getRun()` | PHP | `v3.65.1` | `WorkflowTimingClientTest::testRunWithoutDimensionsReadsAsAnEmptyMap` |
| Reporting-pack preview read top-level `value`; the server returns `data` | PHP (threw), JS and Python (mistyped) | `v3.65.1` | `ReportingPackPreviewTest`; JS `admin-stage1.test.ts` |
| Go encodes an empty nil slice as `null`, which every PHP list reader rejected | PHP | `v3.65.1` | `FieldsTest` |
| Removed the Go user-update `email` (the server rejects it) and producer `metadata` (the server drops it) | Go | `v3.65.1` | `go vet`, `golangci-lint`, `go test` |
| Deleted the dead `publish-packagist` job (the package is not on Packagist) | CI | `v3.65.1` | `actionlint` |
| CI now runs the JS source-archive, release-mirror publisher and Infisical wrapper checks, and uses the same markdown excludes as `just lint-markdown` | CI | `v3.65.1` | `actionlint`; CI run on `e15edef` |
| `just lint-markdown` skips every `node_modules` | justfile | `v3.65.0` (`7b40f1f`) | `just check` |
| README install pins moved from `3.54.0` to `3.65.1`; AGENTS.md names the `haakco-build` runner group | Docs | `v3.65.1` | `just check` |

## Evidence

- `mise exec -- just check` passed on `e15edef`, the tagged tree. That covers Go, JS, React, Python, PHP
  (903 tests), the Laravel and WordPress suites, Rust, release mirrors, the SDK identity check, actionlint,
  markdownlint and the diff check.
- `v3.65.0`: CI run `45701276339` and Release Mirrors run `45701282431` succeeded. The Go, Laravel and
  WordPress mirrors carry the tag.
- `v3.65.1`: CI run `45710246933` and Release Mirrors run `45710250643` succeeded on `e15edef`. The Go,
  Laravel and WordPress mirrors carry `v3.65.1`.
- Production: `https://custd.com/api/v1/public-status-pages/<key>` answers the "this status page is
  unavailable" problem for an unknown key, so the route is deployed. notification-api has
  `CUSTD_PANEL_BASE_URL=https://custd.com`, which the subscriber update emails need. No Custd server change
  was required.

## Not in scope here

These items are owned by the parity automation plan:

- full route parity across the five SDKs;
- the reporting-pack `executive` and `presentation` fields outside Go;
- automated drift detection.
