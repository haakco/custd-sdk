# Exact-Subject Insight SDK Parity Plan

**Status:** Active; implementation and local validation complete, release pending.

**Goal:** Add one contract-compatible exact-subject reporting helper to every
public Custd SDK and release the shared version without client-specific code.

**Acceptance criteria:** TypeScript, Go, Python, and PHP send the closed request
for `POST /api/v1/reporting/insights/subject`, decode the typed rendered-widget
response, preserve cancellation where supported, reject no server-owned
authorization boundary, pass shared fixtures and package tests, and ship under
one verified release tag.

## Current State (Verified)

- `VERSION` and all published packages are `1.6.4` on clean `main`.
- Ingestion, schema, generic reporting, and Expo relay helpers already exist.
- No SDK contains `SubjectInsight` or `/insights/subject` support.
- Custd owns the server endpoint; SDKs must consume rather than redefine it.

## Plan-Affecting Findings

- The request is exactly `{template, subject, from?, to?, rangeDays?}`.
- The response is `{data: RenderedWidgetData}`; the legacy
  `ReportingWidgetData` shape is not an acceptable substitute.
- The helper must not accept arbitrary filters, tenant identifiers, or
  credentials beyond the existing client configuration.
- Cross-language parity and shared fixtures are required by repository policy.
- The old plan-index claim that mirror publishing is blocked is stale; `v1.6.4`
  mirrors succeeded. Release still requires push/tag authority and credentials.
- The authoritative request and rendered response DTOs are owned by the sibling
  Custd server under `libs/go/reporting/`; SDK contracts mirror those definitions.

## Milestones

### 1. Freeze shared fixtures and public contract

- Ownership: `contract-fixtures/` and each package's existing reporting types.
- Red: add positive optional-range fixtures plus invalid/malformed response
  fixtures; focused tests fail because the helper and typed response are absent.
- Proof: every package consumes the same semantic fixture cases.

### 2. Implement TypeScript and generated distribution

- Ownership: `sdk-js/src/index.ts`, `sdk-js/src/reporting.test.ts`, and generated
  `sdk-js/dist/index.{js,d.ts}`.
- Red/Green: `pnpm -C sdk-js exec vitest run src/reporting.test.ts -t "subject insight"`.
- Preserve `AbortSignal`; reuse the existing request/auth/error owner.

### 3. Implement Go, Python, and PHP parity

- Go: `sdk-go/reporting.go` and `reporting_test.go`; preserve `context.Context`.
- Python: `sdk-python/src/custd/client.py` and `tests/test_reporting.py`.
- PHP: `sdk-php/src/Reporting/Client.php` and `tests/ReportingClientTest.php`.
- Use existing transport/error conventions; no new dependency or parallel client.

### 4. Document, validate, and release

- Update reporting documentation and language READMEs where their public helper
  inventories are explicit.
- Run focused suites, JS distribution generation/drift proof, root `just test`,
  and `git diff --check`.
- After primary review, bump the shared version to `1.6.5`, update changelog,
  commit and push. Tag/release only with explicit authority after main CI.
- Verify tag CI, JS publication, and Go/PHP/WordPress mirror tags before Tiao pins
  `github:haakco/custd-sdk#v1.6.5&path:/sdk-js`.

## MiniMax-M3 Execution Contract

Use the repository MiniMax-M3 skill. Split shared fixtures, TypeScript,
Go/Python/PHP, generated distribution, and checks into serialized or disjoint
bounded roles. Workers do not decide the API, dependency, version, release, or
completion and do not commit, push, tag, publish, or edit this plan.

## Integration and Final Validation

- Exact focused Red/Green commands are package-local; root `just test` is the
  final shared parity gate.
- Local acceptance passed on 2026-07-18: `just test`, `just lint-workflows
  lint-markdown diff-check`, TypeScript distribution idempotence, and independent
  specification and security/quality reviews.
- Review request serialization, optional dates/range, typed response decoding,
  cancellation, auth/error propagation, secrets, and fixture parity.
- Mutation proof: wrong endpoint, omitted subject, or malformed rendered data
  must make the owning focused test fail.

## Terminal Checklist

- [x] Shared exact-subject fixtures cover required, optional, and invalid cases.
- [x] TypeScript, Go, Python, and PHP helpers pass focused Red/Green tests.
- [x] JS generated distribution matches source and declarations.
- [x] Root tests, diff check, quality, security, and parity reviews pass.
- [ ] `1.6.5` is committed, pushed, tagged, published, and verified when authorized.
- [ ] Plan is archived and index plus stale mirror-token status are updated.

## Risks and Deferred Work

- Release/tag/publication and downstream dependency adoption are explicit
  external gates. No client-specific convenience method belongs here.
