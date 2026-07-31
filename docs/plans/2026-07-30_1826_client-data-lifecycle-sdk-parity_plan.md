# Client Data Lifecycle SDK Parity Implementation Plan

**Goal:** Publish one shared Custd SDK release that provides contract-compatible
tenant storage, subject access/export, persistent physical erasure, retention,
and offboarding clients across Go, TypeScript, Python, and PHP.

**Acceptance criteria:** All four SDKs expose equivalent typed lifecycle
operations and errors against shared contract fixtures; offboarding methods and
paths match the current server; obsolete paths are removed; package tests,
clean-consumer tests, version sync, release guard, tag publication, and mirror
verification pass; Custd and Tiao consume only the released public version.

**Original branch:** `main`
**Work branch:** `feat/client-data-lifecycle-sdk-parity` (created from current `main`).
**External owner:** [Custd client data lifecycle plan](../../../custd/docs/plans/sub_plans/2026-07-30_1826_client-data-lifecycle-and-sdk-parity_plan.md)

## Executor Order and Handoff

This is the third implementation file.

### Pre-start gate

Do not create the SDK work branch or write client methods until both prior
Custd plans are merged and pushed and the handoff records:

- parent D1-D2 acceptance, including the frozen tenant-storage contract and
  real data-path proof;
- lifecycle Milestone 0's accepted store inventory and versioned shared
  request/response/error fixtures;
- lifecycle Milestones 1-4 server API, OpenAPI/schema, CLI, GUI, migrations,
  workers, restart/retry/cancel, isolation, non-resurrection, legal-hold,
  artifact, and hard-cleanup tests passing;
- obsolete singular erasure and drifting offboarding contracts removed rather
  than retained as aliases;
- exact Custd source SHA and contract digest available to SDK tests;
- explicit authority to publish the one synchronized SDK release when
  Milestone 5 is reached.

If any server contract or proof is missing, return to the Custd lifecycle plan.
The SDK must not guess the endpoint, invent a temporary model, preserve a stale
path, or defer one language.

### Why this plan starts here

One synchronized public release can remain forward-only only after every
server-owned lifecycle state is stable. Starting earlier would create SDK/API
drift or force prohibited compatibility paths.

1. Confirm the Custd parent D2 and lifecycle Milestones 0-4 are merged; record
   their source SHA and frozen contract version.
2. Execute Milestones 1-4 in this file in order.
3. With explicit release approval already supplied for the implementation
   closeout, execute Milestone 5 and verify the immutable release and mirrors.
4. Stop and return the executor to
   `/home/timhaak/Dev/HaakCo/AiProjects/custd/docs/plans/sub_plans/2026-07-30_1826_client-data-lifecycle-and-sdk-parity_plan.md`
   for its Milestones 5-6 and the Custd MVP final gate.
5. Only after that Custd gate passes, start the Tiao order recorded in
   `/home/timhaak/Dev/Jo/TiaoTiao/docs/plans/main_plan.md`.

Do not implement against guessed or unmerged endpoints, publish different
language versions, or hand downstream consumers a source branch/local path.

## Current State (Verified)

- Custd parent D1/D2 accepted at `0edfd3a0`; lifecycle M0–M4 Green + P1/P2
  proof driver fixes on `feat/client-data-lifecycle-d3-d5` at `35e6a3e1`.
- Go and TypeScript have offboarding clients, but schedule method/path and
  one-off request lookup drift from current Custd server routes.
- Public SDKs do not provide complete tenant-storage, subject export, persistent
  physical-erasure, or runtime-retention administration parity.
- One `VERSION` and one `v<VERSION>` tag release all SDKs; every hardcoded
  package version must move together.
- Tenant-storage depends on the Custd Phase D2 server contract. Export,
  erasure, retention, and offboarding depend on the corresponding server
  milestones; the SDK must not invent endpoints ahead of those owners.
- **Spec drift resolved:** the SDK plan's physical-erasure and retention op
  lists were reconciled against the server's actual endpoints (no
  cancel/retry on erasure; retention uses `listRuns` rather than a dedicated
  `status`).

## Plan-Affecting Findings

- **Required — server first:** consume frozen OpenAPI/schema and shared example
  fixtures from the merged Custd contract. SDK code does not choose lifecycle,
  privacy, destructive-action, or authorization semantics.
- **Required — cross-language parity:** every supported operation, state,
  validation rule, error, redaction rule, and cancellation/retry behavior has
  one fixture consumed by all four language suites where technically practical.
- **Required — forward-only correction:** fix offboarding drift and remove old
  methods/paths in the same release. No deprecated aliases or dual requests.
- **Required — secret-safe clients:** SDKs accept opaque credential/subject/job
  references but never log tokens, resolved credentials, export bytes, signed
  URLs, raw personal data, or internal object keys.
- **Release dependency:** downstream consumers update only after tag, package,
  and mirror artifacts are verified.

## Milestones

### 1. Freeze the shared lifecycle contract fixtures

- Ownership: `contract-fixtures/`, package-local fixture adapters, this plan.
- Dependencies: merged Custd server contracts and versioned OpenAPI/schema.
- Red: cross-language fixture matrix fails for the five lifecycle namespaces
  and records current offboarding drift.
- Implementation: define request/response/error fixtures for list/create/get/
  execute/status/cancel/retry/download/revoke as applicable,
  including tenant isolation, partial failure, expiry, legal hold, and redaction.
  Tenant-storage fixtures expose separate client locations and server-assigned
  prefixes on shared environment credentials; they contain no credential
  reference, credential value, or tenant rotation operation.
- Green: all languages parse the fixtures and reject invalid/unknown states
  consistently before network implementations land.
- Review: contract accuracy, privacy/security, naming, and minimality.

### 2. Correct offboarding and add tenant-storage parity

- Ownership: Go, TypeScript, Python, and PHP admin clients and tests.
- Dependencies: Milestone 1; Custd Phase D2 and offboarding routes frozen.
- Red: exact request tests fail on current Go/TypeScript methods and missing
  Python/PHP/tenant-storage namespaces.
- Implementation: match current server methods/paths and typed payloads; add
  tenant-storage list/get/create/revoke/status/history operations; remove
  obsolete offboarding paths/names and every tenant credential or rotation
  model/method. Location creation cannot accept a bucket, raw prefix, or
  credential; the server returns the assigned location/prefix metadata.
- Green: shared request-capture tests show identical semantics in all languages.
- Review: API parity, credential redaction, language quality.

### 3. Add export, physical-erasure, and retention parity

- Ownership: all four admin clients, typed models, docs/examples, tests.
- Dependencies: Custd export, consolidated erasure, and retention contracts merged.
- Red: fixtures fail because namespaces and terminal/partial states are absent.
- Implementation (server contract is source of truth; per Custd `feat/client-data-lifecycle-d3-d5` @ `35e6a3e1`):
  - subject access/export `create`/`list`/`get`/`cancel`/`download`/`force` operations
    (`POST /api/v1/admin/subject-exports`, `GET /api/v1/admin/subject-exports`,
    `GET /api/v1/admin/subject-exports/{requestId}`,
    `POST /api/v1/admin/subject-exports/{requestId}/cancel`,
    `GET /api/v1/admin/subject-exports/{requestId}/download`,
    `POST /api/v1/admin/subject-exports/{requestId}/force`);
  - one persistent physical-erasure `create`/`list`/`get`/`force` operation set
    (`POST /api/v1/admin/privacy/erasures`, `GET /api/v1/admin/privacy/erasures`,
    `GET /api/v1/admin/privacy/erasures/{requestUuid}`,
    `POST /api/v1/admin/privacy/erasures/{requestUuid}/force`); no `cancel` or
    `retry` server endpoints exist — the SDK must not invent them;
  - retention `list`/`get`/`upsert`/`delete`/`preview`/`apply`/`listRuns`
    operations (no dedicated `status` endpoint; the per-tenant `/runs`
    endpoint serves that role);
  Download helpers return an authorized response/stream using platform-native
  primitives without buffering unbounded artifacts or logging content.
- Green: success, partial, expiry, cancellation, wrong-tenant, legal-hold,
  malformed-response, and retry tests pass identically.
- Review: authorization assumptions, artifact safety, bounds, parity, quality.

### 4. Prove packaging and clean consumers

- Ownership: package manifests, READMEs/examples, clean-consumer fixtures, CI.
- Dependencies: Milestones 1-3.
- Red: clean consumers cannot import and execute every new namespace.
- Implementation: update public exports, type declarations, package metadata,
  README examples, and clean consumers. Use server-only examples with opaque
  references and secret-safe error output.
- Green: `just test`, package/static-analysis gates, clean consumers, version
  sync, and `git diff --check` pass.
- Review: packaging, dependency/security, documentation, CI cost.

### 5. Release and downstream handoff

- Ownership: root `VERSION`, every hardcoded package version, release workflow,
  mirror verification, Custd/Tiao handoff.
- Dependencies: Milestone 4 and explicit release approval.
- Implementation: select the next version, update all synchronized manifests,
  commit, tag, publish, and verify primary plus split-mirror artifacts.
- Proof: tag equals `VERSION`; release guard passes; Go/JS/Python/PHP artifacts
  are installable by clean consumers; source/tag/package checksums are retained.
- Handoff: provide exact version, API matrix, upgrade steps, removed paths, and
  consumer acceptance commands. Do not add local filesystem replacements.
- Review: release evidence and downstream compatibility with the approved
  forward-only pre-live contract.

## Integration and Final Validation

- **Test readiness:** self-hosted release workflows are available; publication
  credentials remain in Infisical; the version bump script and mirror
  publication test pass before selecting a version. Use a fresh temporary
  directory for every clean consumer and remove it on exit.
- **Preflight commands:** `just check`,
  `bash scripts/test-bump-version.sh`, and
  `bash scripts/test-publish-release-mirror.sh`. The shared lifecycle contract
  matrix runs before package-specific implementation and is part of
  `just test`.
- **Release run:** after explicit release approval, run
  `scripts/bump-version.sh <version>`, review the version-only diff, commit and
  push it, create/push `v<version>`, then wait with
  `gh run watch --exit-status` for both `ci.yml` and
  `release-mirrors.yml` tag runs. Polling is bounded by the workflow timeout;
  a missing or failed artifact is a failed release, not an indefinite retry.
- **Published-artifact proof:** install `@haakco/custd-sdk@<version>` from the
  configured Verdaccio registry; install PHP packages from their public
  Composer source; create a temporary Go module requiring
  `github.com/haakco/custd-sdk-go@v<version>`; and install the Python artifact
  from its published package endpoint once that endpoint is frozen in
  Milestone 1. Each clean consumer imports every lifecycle namespace and runs
  the shared request fixture without a repository-local path replacement.
- **Retained evidence:** record source SHA, tag, workflow run URLs and
  conclusions, package endpoints, resolved versions, artifact checksums, and
  clean-consumer commands/results in the archived completion receipt beside
  this plan. Delete temporary consumers after their logs/checksums are
  retained.
- **Shared validation:** Custd owns the live two-tenant lifecycle proof; this
  repository owns client request/response parity and packaging proof.

## Terminal Checklist

- [ ] Shared lifecycle fixtures are accepted.
- [ ] Offboarding drift is fixed with obsolete paths removed.
- [ ] Tenant storage is parity-complete in all four SDKs.
- [ ] Subject export, physical erasure, and retention are parity-complete.
- [ ] All package, static-analysis, clean-consumer, and version gates pass.
- [ ] One synchronized version is published and every artifact/mirror verified.
- [ ] Custd/Tiao handoff names the released version and exact acceptance commands.
- [ ] Work branch is merged to `main`, pushed, and deleted locally/remotely.
- [ ] This plan is archived with the required timestamp prefix.

## Risks and Deferred Work

- No SDK implementation begins before its server contract is merged.
- This plan does not authorize a release; tagging/publication requires the
  normal explicit release decision.
- Direct end-user privacy UI remains consumer-owned; SDKs expose server-to-server
  capabilities only.
