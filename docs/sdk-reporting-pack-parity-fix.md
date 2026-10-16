# Reporting-pack canonical parity fix — PHP + Python

Branch: `feat/reusable-log-contracts`. Scope: `sdk-php/` and `sdk-python/` reporting-pack
code plus their tests. `sdk-go` was not touched.

## Defect 1 — executive report definition recipe selection

Canonical `ExecutiveReportDefinition` (`/home/coder/project/libs/go/reporting/executive_definition.go`)
embeds `ExecutiveRecipeSelection`, so the canonical JSON carries `recipe`, `primaryWidgetKey`,
`primaryMetricKey`, `primaryLabel`, `primaryUnit`, `scopeLabel` (all non-`omitempty`, i.e.
required) ahead of `comparisonBasis` (required) and the `omitempty` optional fields.
PHP and Python only carried the latter subset.

### PHP
`sdk-php/src/Admin/ReportingPack/ExecutiveReportDefinition.php` now declares the six missing
fields as required constructor parameters in canonical order, decoded with `Fields::string`
(throws when absent — required) and serialised with the exact canonical JSON names. The
optional `comparisonLabel`, `targetValue`, `targetUnit`, `findings`, `actions`,
`supportingWidgetKeys` are unchanged.

### Python
`sdk-python/src/custd/admin_reporting_packs.py` adds `ExecutiveRecipeSelection(TypedDict)`
(the six required string keys, mirroring Go's embed) and `ExecutiveReportDefinition` now
inherits it, with `comparisonBasis` required and the remaining fields `NotRequired[...]`.
This matches the canonical required/optional split and the module's existing
`MetricDefinition` convention (required base + `NotRequired` extras).

## Defect 2 — accounting rounding policy object

Canonical models `rounding` as `RoundingPolicy{mode, decimalPlaces}` with `mode` the closed
`RoundingMode` union (`half_up`, `half_even`, `down`, `up`). PHP and Python modelled it as a
plain string.

### PHP
New DTO `sdk-php/src/Admin/ReportingPack/RoundingPolicy.php`:
- `mode` validated in the constructor against `RoundingPolicy::MODES` so decode rejects an
  unknown member (same convention as `Admin/DataScope/Grant::ACTIONS`).
- `fromPayload` decodes a required nested object (`Fields::object`) with `mode`/`decimalPlaces`.
- `serialise` emits `{mode, decimalPlaces}`.
`SteppedRateSchedule.php` and `AllocationRule.php` now type `rounding` as `RoundingPolicy`,
decode via `RoundingPolicy::fromPayload(Fields::object($payload, 'rounding'))`, and serialise
`$this->rounding->serialise()`.

### Python
`admin_reporting_packs.py` adds `RoundingMode = Literal["half_up", "half_even", "down", "up"]`
and `RoundingPolicy(TypedDict)` (`mode: RoundingMode`, `decimalPlaces: int`).
`SteppedRateSchedule.rounding` and `AllocationRule.rounding` are now `RoundingPolicy`.

No other PHP/Python source reads or writes `rounding` (grepped both trees; only the two DTOs
and tests). No shared `contract-fixtures/` payload contains `rounding` or `executive`, so no
fixture changes were required.

## Tests added (focused on the two defects)

- `sdk-php/tests/ReportingPackSetupTest.php`
  - `testExecutiveDefinitionRoundTripsRecipeSelection` — canonical payload with an executive
    definition carrying the recipe fields decodes and re-serialises equal, and asserts the
    exact 13 JSON keys in order.
  - `testAccountingRoundTripsRoundingPolicyObject` — schedule and allocation `rounding`
    objects round-trip; asserts exact `["mode","decimalPlaces"]` keys.
  - `testRoundingPolicyRejectsUnknownModeOnDecode` — `RoundingPolicy::fromPayload` with
    `mode = "bankers"` throws `\InvalidArgumentException`.
- `sdk-python/tests/test_admin_reporting_packs.py`
  - `test_definition_round_trips_recipe_selection_and_rounding_policy` — full canonical
    definition (executive recipe selection + schedule/allocation `RoundingPolicy`) passes
    through the client unchanged; asserts the exact executive key set and the rounding
    objects.

## Verification (exact commands + results)

PHP (run from `sdk-php/`; `vendor/` already present so `composer install` was not needed):
- `composer analyse` (PHPStan level 6, paths `src` + `tests`) → **OK, no errors**.
- `composer format-check` (Pint) → **passed**.
- `vendor/bin/phpunit` (the runner behind root `just test-php` → `composer test`) →
  **OK (523 tests, 1763 assertions)**.
Python (run from `sdk-python/`):
- `ruff check` → **All checks passed!**
- `mypy` → **Success: no issues found in 19 source files**.
- `python3 -m unittest discover -s tests` → **Ran 202 tests … OK**.
Repo: `git diff --check` → clean (exit 0).

### Important toolchain note (pre-existing, out of scope)

`sdk-php/src/Fields.php` is committed at HEAD with `optionalBoolean()` declared **twice**
(≈line 95 and ≈line 218). That is a hard PHP fatal "Cannot redeclare" and makes
`composer analyse` and *any* PHP run fail at HEAD, independent of this change (PHPStan reports
`class.duplicateMethod`). `Fields.php` is not reporting-pack code and was not edited. To obtain
the PHP evidence above I temporarily removed the duplicate block, ran PHPStan + the full
PHPUnit suite, then restored the committed file byte-for-byte (`git diff HEAD -- src/Fields.php`
empty afterwards). This blocker must be fixed separately before PHP CI can pass.

## Third language: JavaScript disagrees with canonical (reported, not edited)

`sdk-js/src/index.ts` (out of scope, untouched):
- `ExecutiveReportDefinition` (≈line 1228) lacks `recipe`, `primaryWidgetKey`,
  `primaryMetricKey`, `primaryLabel`, `primaryUnit`, `scopeLabel`.
- `SteppedRateSchedule` / `AllocationRule` (≈lines 1356, 1363) type `rounding` as `string`,
  not the `RoundingPolicy` object.
So `sdk-js` needs the same two-defect fix as a follow-up.

## Canonical details not fully determinable / interpretation notes

- Canonical types `recipe` as the closed `ExecutiveRecipe` union and `comparisonBasis` as the
  closed `ExecutiveComparisonBasis` union. The existing PHP/Python convention already carries
  `comparisonBasis` as a plain string, so the new `recipe` field was added as a required string
  to mirror that sibling field. Only the explicitly authorized closed union (`RoundingMode` on
  the rounding policy, Defect 2) is validated. If the intent is to also enforce the recipe /
  comparison-basis unions, that is a separate change.
- Canonical `ValidateRoundingPolicy` additionally bounds `decimalPlaces` to 0..6 and the tiers
  to 64. Per the task, only the closed-union `mode` is enforced here; no range validation was
  added.
