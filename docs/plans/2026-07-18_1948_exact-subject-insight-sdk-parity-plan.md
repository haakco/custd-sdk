# Exact-Subject SDK v1.6.5 Completion Plan

**Status:** Active; implementation exists and local gates pass, but one Go
response-validation parity defect, canonical-state reconciliation, push, release,
consumer verification, and archive remain.

**Goal:** Release contract-compatible exact-subject insight helpers in every
public Custd SDK, prove the published surfaces from clean consumers, and archive
one truthful completion record.

**Acceptance criteria:** TypeScript, Go, Python, and PHP enforce the same closed
request and rendered-response contract; required local gates pass on the reviewed
release commit; `main` and its CI are green; an explicitly authorized immutable
`v1.6.5` tag drives successful publication and mirrors; clean consumers resolve
the tag/package and expose the helper; canonical state contains no unsupported
M3 verdicts or links that require temporary receipts; final Codex review passes;
and the plan is archived with the index updated.

## Current State (Verified 2026-07-18)

- Branch `main` is two commits ahead of `origin/main`:
  - `58c031b` — first audit documentation.
  - `83a18fc` — `.opencode` ignore, Markdown-lint scope correction, and audit
    state edits.
- `origin/main` is `b340e26`. Commits `954f2a0` and `b340e26` contain the SDK
  implementation and stabilized Go cancellation proof. Main CI run
  `29661610991` passed for `b340e26`.
- The only tracked working-tree changes are this plan and
  `docs/plans/main_plan.md` before this reconciliation. `/.opencode/` is committed
  in `.gitignore`; the local directory remains present and ignored.
- Local and remote `v1.6.5` are absent. No tag-triggered publication or clean
  public-consumer proof exists.
- `VERSION`, `sdk-go/VERSION`, `sdk-js/package.json`,
  `sdk-python/pyproject.toml`, and `sdk-php/composer.json` are `1.6.5`.
- Codex independently ran `just test`,
  `just lint-workflows lint-markdown diff-check`, and `git diff --check`; all
  exited zero on `83a18fc` plus the two pre-existing plan modifications.
- M3 produced Phase A/B observations and temporary receipts, then committed
  `83a18fc` despite the plan reserving Git commits for Codex. Treat its receipts
  as supporting evidence only. M3 token capacity is currently unavailable; do
  not retry until it resets.
- Ignored receipts live under `docs/tmp/m3-runs/`. They are temporary evidence,
  not durable acceptance state, and must not be required by the final plan.

## Plan-Affecting Findings

- **Required defect fix:** Go accepts malformed optional `metadata`, `sources`,
  and structurally incomplete `trust` objects because
  `RenderedWidgetData.UnmarshalJSON` checks only five top-level fields and the
  optional structs do not enforce their required fields. TypeScript, Python, and
  PHP reject these shapes. This contradicts the changelog's cross-SDK
  malformed-response-rejection claim and blocks release.
- **Required state correction:** `PROGRESS.md` still says `HEAD=58c031b`, one
  commit ahead, `/.opencode/` uncommitted, and Milestone 2 not started. `BUGS.md`
  also retains active entries based on superseded workspace facts. Canonical
  state must be reconciled before it can support a release decision.
- **Required evidence correction:** M3 authored `PASS` verdicts, findings, bug
  closures, and a readiness label. Under the current M3 skill, those are not
  acceptance decisions. Codex grades the observations and records durable facts
  here; temporary receipt links are removed from canonical status files.
- **Required independent review:** Because M3 crossed its documented commit
  boundary, Codex must review the complete local history and rerun critical
  gates before pushing. No evidence produced by that run alone closes a cell.
- **Observed correct work:** All four SDKs expose the helper and endpoint; shared
  positive request/response fixtures exist; request closure and range validation
  are covered; unsafe trust diagnostics and transport errors are handled;
  TypeScript distributes generated declarations/runtime; TypeScript signal and
  Go context cancellation paths have focused coverage; version owners agree.
- **Non-blocking coverage limit:** The shared positive response fixture does not
  exercise valid optional metadata, sources, trust, delta, and secondary values.
  The Go malformed-optional regression tests below are the smallest required
  release correction; broader fixture expansion is unnecessary unless the fix
  exposes another parity gap.

## Milestones

### 1. Preserve and classify completed local work

- Ownership: Codex review; no implementation change.
- Completed evidence:
  - SDK implementation: `954f2a0`.
  - Go cancellation stabilization and successful main CI: `b340e26`.
  - Audit documentation: `58c031b`.
  - Narrow lint exclusions and root harness ignore: `83a18fc`.
  - Independent local gates on the current tree: all green.
- Review result: locally useful work is preserved, but M3's completion verdict
  is rejected and the broader plan remains open.

### 2. Fix Go malformed optional response validation

- Ownership: `sdk-go/reporting_test.go`, `sdk-go/reporting.go`.
- Dependencies: M3 token capacity reset. M3 executes the bounded Red/Green task
  first under the current skill. If the provider remains unavailable, record the
  terminal provider error; Codex may take over only after the skill's bounded
  failure rule is satisfied.
- Red:
  1. Add table-driven cases proving subject-insight decoding rejects
     `"metadata": {}`, `"sources": [{}]`, and `"trust": {}`.
  2. Run `cd sdk-go && go test ./... -run SubjectInsight`.
  3. Record failures showing those malformed optional contracts are accepted.
- Green:
  1. Add the smallest custom validation at the owning Go unmarshal boundary.
  2. Require the same declared fields already enforced by TypeScript, Python,
     and PHP; preserve forbidden trust-key rejection and existing error context.
  3. Run `cd sdk-go && go test ./... -run SubjectInsight` and
     `cd sdk-go && go test ./...`.
- Review: Codex audits test intent, required-field parity, zero-value behavior,
  unsafe-key handling, and error propagation. No other SDK behavior changes.
- Completed 2026-07-18 (Codex takeover after M3 capacity stall). Evidence:
  - Red added: `sdk-go/reporting_test.go:287-327`
    (`TestReportingSubjectInsightRejectsMalformedOptionalMetadata`,
    `TestReportingSubjectInsightRejectsMalformedOptionalSources`,
    `TestReportingSubjectInsightRejectsMalformedOptionalTrust`). Before Green,
    all three failed with `unexpected success`-style messages, proving the bug.
  - Green landed: `sdk-go/reporting.go:396-562`.
    `RenderedReportingTrust.UnmarshalJSON` now enforces the seven required
    string fields after `rejectUnsafeReportingTrust` (forbidden-key defense
    preserved), `ReportingQueryMetadata.UnmarshalJSON` enforces the required
    `resolvedTemplate` plus the four required ints, and the new
    `ReportingSourceSummary.UnmarshalJSON` enforces the required `kind`,
    `count`, and `completeness`. Field-presence is detected via the existing
    `map[string]json.RawMessage` pattern at `reporting.go:326-394`, so
    `returnedRows: 0` and `returnedBuckets: 0` remain valid inputs, matching
    TS / Python / PHP parity.
  - Proof: `cd sdk-go && go test ./... -run
    TestReportingSubjectInsightRejectsMalformedOptional -v` → 3 PASS;
    `cd sdk-go && go test ./...` → `ok github.com/haakco/custd-sdk-go
    2.144s`. Code-quality and security reviews (parallel sub-agents) returned
    no blockers.

### 3. Reconcile canonical audit and planning state

- Ownership: `PROGRESS.md`, `BUGS.md`, this plan,
  `docs/plans/sub_agent/m3.md`, and `docs/plans/main_plan.md`.
- Dependencies: Milestone 2 locally green.
- Implementation:
  1. Make `PROGRESS.md` a concise current-state handoff: current SHA/ahead count,
     completed work, current blocker/task, next action, last useful commands,
     changed files, and mailbox state.
  2. Reclassify stale `BUGS.md` entries from current Git facts and add the Go
     malformed-optional parity defect with its final Red/Green evidence.
  3. Remove canonical dependence on ignored receipts. Promote only necessary
     command results and review facts into this plan.
  4. Replace the mailbox with exactly one fresh M3 instruction only when M3 can
     run again. M3 may update factual execution state but not acceptance cells,
     findings, final status, or Git history.
  5. Classify ignored receipts as disposable after their verified facts are
     represented here; retain them until final local acceptance, then remove
     only those task-owned files.
- Proof: plan, progress, bugs, mailbox, Git status, commits, commands, and
  remaining work agree without relying on ignored artifacts.

### 4. Codex final local acceptance, commit, push, and main CI

- Ownership: Codex only for findings, acceptance, commit, and push.
- Dependencies: Milestones 2-3 complete.
- Review:
  1. Fresh isolated spec/correctness review of the full exact-subject diff.
  2. Fresh isolated quality/test review, including mutation strength and
     cross-language request/response parity.
  3. Fresh defensive security/operations review of trust diagnostics, auth,
     cancellation, release guards, secrets, and immutable-tag handling.
  4. Fresh evidence integration and adversarial review following the current
     M3 skill. M3 reports observations only; Codex grades them.
- Final local commands, once after the tree stabilizes:
  - `just test`
  - `just lint-workflows lint-markdown diff-check`
  - `git diff --check`
- Operation: Codex commits only reviewed in-scope changes, pushes `main`
  normally, and verifies main CI for the pushed release SHA. Never force.
- Proof: clean tracked tree, `HEAD == origin/main`, required main CI jobs are
  successful for that exact SHA, and no unresolved release finding remains.

### 5. Create the immutable release tag

- Ownership: Codex only.
- Dependencies: Milestone 4 accepted and explicit user authorization to create
  and push `v1.6.5`.
- Preflight: prove tag absence locally/remotely, `VERSION=1.6.5`, clean tracked
  tree, `HEAD == origin/main`, and main CI success for the release SHA.
- Operation: create one annotated `v1.6.5` at that SHA and push only
  `refs/tags/v1.6.5`. Never replace, delete, or force the tag.
- Proof: local and source-remote tag peel to the accepted release SHA.

### 6. Verify publication, mirrors, and clean consumers

- Dependencies: Milestone 5 and terminal tag workflows.
- M3 may perform bounded read-only evidence collection after token reset:
  - Tag `CI` and `Release Mirrors` run IDs, URLs, SHA, job conclusions.
  - Source, Go, Laravel, and WordPress `v1.6.5` ref equality.
  - Anonymous Verdaccio metadata for `@haakco/custd-sdk@1.6.5`.
  - Fresh owner-only temporary installs/imports for Go, Verdaccio TypeScript,
    Git-source TypeScript, Python Git subdirectory, root PHP VCS, Laravel, and
    WordPress, proving the public exact-subject helper exists.
- Safety: bounded polling, no credential reads or retained secret-bearing logs,
  no workflow reruns, no external mutation, no cached/local-path substitutes,
  and removal only of task-owned temporary directories.
- Codex independently repeats ref, registry, and representative consumer proofs.
- Proof: every required surface resolves the accepted SHA/version and helper;
  failures and cleanup failures propagate as non-success.

### 7. Final completion audit and archive

- Dependencies: Milestone 6 accepted with no unresolved defect.
- Codex reconciles exact commands, skips, failures, reviews, external evidence,
  bugs, checkboxes, ignored artifacts, and task-owned processes.
- Remove disposable M3 receipts after their durable facts are recorded. Preserve
  the ignored `.opencode/` directory unless separately authorized to delete it.
- Run final Markdown lint, link/path checks, and `git diff --check` after moving
  this plan to
  `archive/docs/plans/<archive-timestamp>_2026-07-18_1948_exact-subject-insight-sdk-parity-plan.md`.
- Update `docs/plans/main_plan.md`; leave no active duplicate or stale link.

## Integration and Final Validation

- Test readiness: local toolchain is installed and the current full suite is
  green. M3 execution is paused only by provider token capacity. GitHub,
  Verdaccio, and public VCS checks require network availability after tagging.
- Acceptance run: Milestone 4 owns the single final local validation; Milestone
  6 owns post-tag operational evidence; Milestone 7 owns archive reconciliation.
- Shared validation: this plan is the sole validation owner; no linked active
  plan requires a duplicate run.
- Security gates: reject forbidden trust diagnostics without exposing values;
  preserve auth and cancellation behavior; keep credentials out of argv/logs;
  require immutable exact-SHA tag/ref evidence and bounded cleanup.

## Terminal Checklist

- [x] Exact-subject implementation, shared fixtures, generated TypeScript
  distribution, and package tests exist in local `main` history.
- [x] Version owners equal `1.6.5`; main CI passed for implementation commit
  `b340e26`.
- [x] `/.opencode/` is ignored and Markdown lint excludes only the ignored
  harness and temporary receipt workspace.
- [x] Codex independently reran the current full local test/lint/diff gates.
- [x] Go rejects malformed optional metadata, source, and trust contracts with
  focused Red/Green evidence.
- [ ] Canonical plan/progress/bugs/mailbox state is truthful and independent of
  temporary receipts or M3 acceptance verdicts.
- [ ] Fresh final reviews and adversarial completion audit pass on the corrected
  tree.
- [ ] Codex commits and pushes the reviewed completion delta; main CI passes for
  the exact release SHA.
- [ ] User authorizes and Codex creates/pushes immutable `v1.6.5` exactly once.
- [ ] Tag CI, Verdaccio, optional Packagist disposition, mirrors, and every named
  clean consumer surface pass for the release SHA/version.
- [ ] Temporary evidence is removed, final state is reconciled, and the plan is
  archived with a truthful index.

## Risks and Deferred Work

- M3 provider tokens are temporarily exhausted. Do not retry unchanged until
  capacity resets; the remaining bounded Go task and later evidence tasks stay
  queued here.
- Tag creation remains a separate explicit user authorization; this plan does
  not grant it.
- GitHub, Infisical-backed workflows, Verdaccio, or public VCS availability may
  block release verification but never justify alternate publication or retag.
- Downstream application adoption is outside this SDK release.
