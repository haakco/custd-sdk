# Go SDK reporting-pack reshape (canonical contract)

Branch: `feat/reusable-log-contracts` · base HEAD `39f38f7`
Scope: `sdk-go/` only. Module path, `VERSION` and package manifests are the
parent's separate step and were **not** touched. No commit, tag or publish.

## 1. Breaking changes — removed / renamed / reshaped exported identifiers

This is the CHANGELOG breaking list for the Go SDK.

### Removed

| Removed identifier | Replacement |
| --- | --- |
| `PackDashboard` (bespoke `{key,title,hidden,defaultRange,refreshSeconds,requiredScopes,widgets}`) | Canonical `DashboardDefinition` (and `WidgetDefinition`) |

### Reshaped (same name, breaking shape — no compatibility shim retained)

| Identifier | Old shape | New shape |
| --- | --- | --- |
| `Pack` | `key, displayName, owner(omitempty), enabled, eventTypes, metrics, dimensions, dashboards` | Canonical `reporting.Pack`: `key, displayName, owner(required), version, enabled, eventTypes, metrics, dimensions, templates, flowRules, rollupRules, dashboards, exportFormats, trust, redactionRules, proof, identity, transitionRules, activationRules, retentionRules, activityRules, observation, reconciliations, assetHierarchy, accounting` |
| `PackMetric` | `key, displayName, template, metrics, dimensions` | Canonical `PackMetric` = embedded `MetricDefinition` + `calculation`, `match`, `flowResult`, `numeric`, `distinct`, `measurementKind`, embedded `PackMetricCounter`, `PackMetricRatio`, `PackMetricHierarchy` |
| `PackDimension` | `key, displayName` | Canonical `PackDimension` = embedded `DimensionDefinition` + `selector`, `allowedValuePattern`, `fallback`, `maxCardinality` |

No deprecated aliases were added (pre-live policy: the superseded shape is deleted
in the same pass).

## 2. New exported surface (`sdk-go/reporting_pack_contract.go`)

### Canonical definition root

- `Pack` (25 JSON fields, mirrors `reporting.Pack`).

### Definition nested types

`PackMetric`, `PackDimension`, `PackTemplate`, `MetricDefinition`,
`DimensionDefinition`, `FilterDefinition`, `QueryTemplate`, `SubjectScopeRule`,
`SelectorDefinition`, `NumericSelector`, `MatchPredicate`, `PackMetricCounter`,
`PackMetricRatio`, `PackMetricHierarchy`, `FlowRule`, `RollupDimension`,
`RollupRule`, `TrustDiagnostics`, `RedactionRule`, `ProofProfile`,
`IdentitySelectors`, `TransitionRule`, `ActivationRule`, `RetentionRule`,
`ActivityRule`, `DashboardDefinition`, `WidgetDefinition`,
`PresentationPresetSelection`, `DashboardInteractionRule`, `DashboardSharePolicy`,
`ReportSectionDefinition`, `NarrativeBlock`, `NarrativeValueReference`,
`ExecutiveRecipeSelection`, `ExecutiveReportDefinition`, `ObservationSource`,
`ObservationAsset`, `SourceSeries`, `SemanticSeries`, `ObservationContract`,
`SourceReconciliation`, `AssetNode`, `AssetHierarchyEdge`, `AssetHierarchy`,
`RateTier`, `RoundingPolicy`, `SteppedRateSchedule`, `AllocationTarget`,
`AllocationRule`, `AccountingContract`.

### Closed unions (named types + canonical constants, each rejects unknown values)

`CalculationType` (23 values), `AggregationMode` (7), `FlowResult` (6),
`SelectorType` (3), `MetricKind` (13), `MeasurementKind` (4), `Unit` (10),
`NumericUnit` (15), `CounterResetPolicy` (3), `FilterOperator` (4),
`SourceMode` (3), `WidgetKind` (18), `ExportFormat` (8),
`DashboardInteraction` (2), `DashboardComparisonPreset` (2),
`InteractionResetBehavior` (2), `SectionLayoutPreset` (3), `NarrativeValue` (2),
`IdentityRole` (3), `AssetEdgeMode` (3), `SourceSelectionMode` (4),
`BillingBoundary` (2), `RoundingMode` (4), `ExecutiveRecipe` (4),
`ExecutiveComparisonBasis` (3). Constant names mirror the canonical source
(e.g. `CalculationCount`, `MetricKindCount`, `WidgetTimeSeries`, `FormatCSV`,
`RoundingHalfUp`). The `reporting:read/query/subject-insight/export` scopes are
re-exported as `ScopeReporting*`.

### Setup-template operations (`sdk-go/admin_reporting_packs.go`)

- Types: `ReportingPackSetupBindingField`, `ReportingPackSetupTemplate`,
  `ReportingPackSetupTemplateListResponse`, `LogObservabilityBindings`,
  `ReportingPackSetupTemplateBindRequest`, `ReportingPackSetupTemplateBindResponse`.
- Methods on `ReportingPacksAdminClient`:
  - `ListSetupTemplates(ctx) (*ReportingPackSetupTemplateListResponse, error)` → `GET /reporting-packs/setup-templates`
  - `BindSetupTemplate(ctx, kind, req) (*ReportingPackSetupTemplateBindResponse, error)` → `POST /reporting-packs/setup-templates/{kind}/bind`

These match `internal/dto/reporting_pack_setup_templates.go` and the routes in
`cmd/api/admin_reporting_pack_setup_templates.go` (route param is `{kind}`, not
`{packKey}` as the task sketch said; PHP/Python/JS all use `kind`).

### Validation behaviour

Each closed-union type implements `UnmarshalJSON` through one shared generic
helper (`unmarshalClosedUnion`) that rejects a non-empty value outside the
canonical set. Empty string is accepted as the zero value so an unfilled
definition still round-trips.

## 3. Cross-language parity gaps found (reported, not silently patched)

Per the task, no other language was edited and no alignment test was added; these
need a parent decision because canonical source (truth order #1) and the
PHP/Python precedents disagree. Go follows canonical in both cases.

1. **`ExecutiveReportDefinition`.** Canonical embeds `ExecutiveRecipeSelection`,
   adding required JSON fields `recipe`, `primaryWidgetKey`, `primaryMetricKey`,
   `primaryLabel`, `primaryUnit`, `scopeLabel`. `sdk-php`
   (`ExecutiveReportDefinition.php`) and `sdk-python` only carry
   `comparisonBasis, comparisonLabel, targetValue, targetUnit, findings, actions,
   supportingWidgetKeys` — they cannot round-trip a canonical executive recipe.
2. **Accounting `rounding`.** Canonical types it as the object
   `RoundingPolicy{mode, decimalPlaces}` on both `SteppedRateSchedule` and
   `AllocationRule`. `sdk-php` and `sdk-python` model `rounding` as a plain
   string, so a canonical accounting contract does not round-trip there.
3. **Root type name.** Canonical Go (and this SDK) call the root `Pack`;
   `sdk-php`/`sdk-python` call it `PackDefinition`. Same field set, different name.
4. **`identity` optionality.** Canonical declares
   `Identity IdentitySelectors json:"identity,omitempty"` (value type; Go's
   `omitempty` is ineffective on a struct, so it always serialises as `{}`).
   The SDK uses `*IdentitySelectors` so the field is genuinely optional and
   matches the nullable PHP/Python precedent — a Go representation detail, the
   JSON field name/type is unchanged.

## 4. Lint-budget conflict (reported, no suppression added)

The task's style budget states `<=10 struct fields` and `<=12 methods per
receiver`. Both are exceeded by the canonical shape and were left intact:

- `Pack` has **25** fields (canonical), `DashboardDefinition` 14,
  `ExecutiveReportDefinition`/`PackMetric` 14.
- `ReportingPacksAdminClient` now has **14** methods (12 pre-existing + the 2
  required setup-template methods).

The repo's actual `sdk-go/.golangci.yml` enables only `errcheck, govet,
ineffassign, staticcheck, unused, errorlint, misspell, unconvert, whitespace`
plus `gofmt`/`goimports`. **None of these enforce a struct-field or
methods-per-receiver limit**, so there is no enforced conflict and no
suppression directive is present. If a `custd-structure`-style linter is run
against this module later, `Pack` would need the canonical
`// custd-structure: allow-fields` annotation rather than a redesign.

## 5. Verification results

| Command (in `sdk-go/`) | Result |
| --- | --- |
| `gofmt -l reporting_pack_contract.go admin_reporting_packs.go reporting_pack_contract_test.go admin_reporting_packs_test.go` | clean (no files listed) |
| `mise exec -- go vet ./...` | **passed** (exit 0) |
| `mise exec -- go test ./...` | **passed** (`ok github.com/haakco/custd-sdk-go/v2`) |
| `mise exec -- go build ./...` for `./examples/... ./cmd/...` | **passed** |
| `git diff --check` | **passed** (no whitespace errors) |
| `mise exec -- golangci-lint run ./...` | **failed — environment toolchain incompatibility, not this change** |

`golangci-lint` result detail: version `2.13.2` built with `go1.27.0` cannot
decode the installed `go1.27.2` stdlib export data
(`cannot decode "encoding", export data version 5 is greater than maximum
supported version 4`). It fails identically on untouched files (`client.go`,
`errors.go`, `retry.go`, `setup.go`, `workflow_timings.go`, all of `cmd/` and
`examples/`), including false-positive `missing type in composite literal`
reports on unmodified code, so it never reaches analysis of the changed files.
No lint issue is attributable to this change; the tool/toolchain mismatch is
pre-existing.

Tests added (`sdk-go/reporting_pack_contract_test.go`):
- `TestReportingPackContractRoundTripsCanonicalDefinition` — full canonical
  `Pack` fixture marshals, required top-level field names are asserted present,
  the JSON unmarshals and re-marshals byte-identically, and nested canonical
  field names are pinned (`calculation`, `numeric`, `category` knobs, the
  `rounding` object, the executive `recipe`).
- `TestReportingPackContractOmitsUnsetOptionalFields` — a required-only `Pack`
  omits `flowRules, rollupRules, dashboards, exportFormats, redactionRules,
  identity, transitionRules, activationRules, retentionRules, activityRules,
  observation, reconciliations, assetHierarchy, accounting`.
- `TestReportingPackContractRejectsInvalidClosedUnion` — `"count"` decodes and
  `"not_a_calculation"` is rejected.

`sdk-go/admin_reporting_packs_test.go`: added
`TestReportingPacksAdminClientSetupTemplates` covering `ListSetupTemplates` and
`BindSetupTemplate` (response decoding + exact request URLs).

## 6. Files changed

- `sdk-go/reporting_pack_contract.go` (new)
- `sdk-go/reporting_pack_contract_test.go` (new)
- `sdk-go/admin_reporting_packs.go` (rewritten: canonical types + setup ops)
- `sdk-go/admin_reporting_packs_test.go` (setup-template test added)
