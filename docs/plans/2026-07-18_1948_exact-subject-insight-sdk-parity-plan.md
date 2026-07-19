# Exact-Subject SDK v1.6.5 Completion Plan

**Status:** Active; Codex final local review, reconciliation, push, and main CI
are complete. Separately authorized tag creation, publication proof, and archive
remain.

**Goal:** Release contract-compatible exact-subject insight helpers in every
public Custd SDK, prove the published surfaces from clean consumers, and archive
one truthful completion record.

**Acceptance criteria:** TypeScript, Go, Python, and PHP enforce the same closed
request and rendered-response contract; the reviewed release commit passes local
and main-CI gates; an explicitly authorized immutable `v1.6.5` drives successful
publication and mirrors; clean consumers resolve the version and helper; no
secret-bearing or temporary evidence remains; and the plan is archived with a
truthful index.

## Current State (Verified 2026-07-19)

- Before this CI-status update, local `HEAD` and `origin/main` equal `b7ba529`.
- Exact-subject implementation/remediation history includes `954f2a0`,
  `b340e26`, `58c031b`, `83a18fc`, and `7b0f46d`.
- Concurrent commit `3257e01` published the prior planning packet and Node tool
  update. Local commit `5637e93` renamed `.mise.toml` to canonical `mise.toml`.
  These commits are preserved and were not authored by this takeover review.
- `v1.6.5` is absent locally and remotely.
- Every hardcoded version owner equals `1.6.5`; tag-derived Composer manifests
  omit hardcoded versions.
- Codex independently ran `just test`,
  `just lint-workflows lint-markdown diff-check`, and `git diff --check` on
  `7b0f46d`; all passed.
- This CI-status update changes this plan, `PROGRESS.md`, and
  `docs/plans/main_plan.md`.
- `mise.toml` is now the tracked tool source in local commit `5637e93`; the
  earlier `.mise.toml` working-tree blocker no longer exists.
- Codex reconciliation commits `4ac2632` and `b7ba529` were pushed normally.
  Main CI run `29667898356` completed successfully for exact SHA `b7ba529`:
  Go, JS, Python, PHP 8.3/8.4/8.5, PHP analysis, Laravel, WordPress, and workflow
  jobs succeeded; tag-only release/publish jobs correctly skipped.

## Plan-Affecting Findings

- BUG-009 is resolved at the real Go JSON boundary by `7b0f46d`. Focused tests
  reject malformed optional `metadata`, `sources`, and `trust` structures while
  preserving legitimate zero values.
- Earlier M3 verdicts and commits are supporting history only. On the user's
  instruction, Codex owns and directly executes all remaining local and remote
  evidence work; M3 will not be invoked.
- The old repository-local `.skills/` finding was stale. Canonical catalog
  discovery is the current skills owner; no local vendor directory is required.
- No new helper, dependency, shared library, or CI gate is needed. Existing
  typed boundaries, regression tests, and `just` commands own prevention.

## Milestones

### 1. Implementation and remediation — complete

- [x] Exact-subject helpers, fixtures, docs, generated TypeScript distribution,
  and synchronized versions landed in `954f2a0`.
- [x] Go cancellation proof and main CI for `b340e26` are green.
- [x] Audit/lint ownership corrections landed in `58c031b` and `83a18fc`.
- [x] BUG-009 Red/Green fix landed in `7b0f46d`:
  - Tests: `sdk-go/reporting_test.go:287-327`.
  - Boundary fix: `sdk-go/reporting.go:396-562`.
  - Counterexamples: `"metadata": {}`, `"sources": [{}]`, `"trust": {}`.

### 2. Codex final local review and reconciliation

- Ownership: Codex only; no M3 execution.
- Spec/correctness proof:
  - Trace all four public helpers to
    `POST /api/v1/reporting/insights/subject`.
  - Compare request closure, bounds, date semantics, required/optional response
    fields, unsafe trust rejection, and transport cancellation across SDKs.
  - Confirm generated TypeScript source/declarations/runtime and version owners.
- Quality/test proof:
  - Confirm the fix lives at the owning JSON boundary, uses typed structs and
    required-field presence, preserves zero values, and adds no duplicate path.
  - Audit test names, fixtures, real client boundary, Red evidence, assertions,
    error context, and aggregate failure behavior.
- Defensive security/operations proof:
  - Confirm untrusted responses fail closed, forbidden trust values do not leak,
    auth/cancellation behavior remains covered, release guards reject mismatch,
    workflows use self-hosted runners, and no secret or force/retag path exists.
- Reconcile canonical state:
  - `PROGRESS.md` names the actual SHA/ahead state and next gate.
  - `BUGS.md` contains no unresolved release problem.
  - The M3 mailbox is explicitly inactive.
  - Old ignored receipts are disposable and not acceptance dependencies.
- Final local gates, once after reconciliation:
  1. `just test`
  2. `just lint-workflows lint-markdown diff-check`
  3. `git diff --check`
- Proof: all reviews and gates pass; only the five reconciliation files remain
  after preserving the already-committed `mise.toml` rename.

### 3. Commit, push, and main CI

- Ownership: Codex. The user's direct-completion instruction authorizes the
  normal `main` push for this plan. Force operations remain forbidden.
- Commit only the five reconciliation files. Preserve the pre-existing local
  `5637e93` commit without rewriting it.
- Push `main` normally and verify required GitHub Actions jobs for the exact
  pushed SHA.
- Proof: `origin/main` reaches the reviewed release SHA and main CI succeeds.
  The pushed history must include the already-present `5637e93` commit unless
  the user directs otherwise; no history rewrite is allowed.
- Completed 2026-07-19: pushed through `b7ba529`; CI run `29667898356`
  completed/success for `b7ba529921ed3e1772880479d493261c5e8e8ffe`.

### 4. Immutable `v1.6.5` tag — separate authorization gate

- Ownership: Codex only.
- Dependencies: Milestone 3 accepted, clean tracked worktree, and explicit user
  authorization to create and push `v1.6.5`.
- Preflight: tag absence locally/remotely, `VERSION=1.6.5`,
  `HEAD == origin/main`, main CI success, and a clean tracked tree.
- Operation: create one annotated tag at the accepted SHA and push only
  `refs/tags/v1.6.5`. Never replace, delete, or force it.
- Proof: local and source-remote tag peel to the accepted release SHA.

### 5. Publication, mirrors, and clean consumers

- Ownership: Codex direct read-only verification after tagging.
- Poll tag `CI` and `Release Mirrors` to terminal states and record run IDs,
  URLs, SHA, and job conclusions without retaining secret-bearing logs.
- Verify `v1.6.5` refs on source, Go, Laravel, and WordPress repositories.
- Verify anonymous Verdaccio metadata for `@haakco/custd-sdk@1.6.5`.
- In fresh owner-only temporary directories, install/import Go, Verdaccio
  TypeScript, Git-source TypeScript, Python Git subdirectory, root PHP VCS,
  Laravel, and WordPress; prove each public exact-subject helper exists.
- Safety: bounded polling, no credential reads or workflow reruns, no cached or
  local-path substitutes, and delete only exact task-owned temporary paths.
- Proof: every surface resolves the accepted SHA/version/helper and cleanup
  succeeds; any failure keeps the plan open.

### 6. Final completion audit and archive

- Reconcile exact commands, CI/workflow URLs, refs, versions, consumer results,
  skipped work, files, processes, bugs, and checklist cells.
- Remove disposable receipts only after durable facts are recorded. Preserve
  `.opencode/` unless separately authorized for deletion.
- Apply the completion-claim audit: real callers and publication composition,
  failure propagation, semantic validators, aggregate failure behavior,
  secret/transport/process/cleanup boundaries, and plan/handoff consistency.
- Move this plan to
  `archive/docs/plans/<archive-timestamp>_2026-07-18_1948_exact-subject-insight-sdk-parity-plan.md`
  and update `docs/plans/main_plan.md` without an active duplicate.
- Run final Markdown/link/diff checks and commit/push the archive closeout.

## Integration and Final Validation

- Local validation owner: Milestone 2, run once after reconciliation.
- Main-CI validation owner: Milestone 3 for the exact pushed SHA.
- Release validation owner: Milestone 5 after the immutable tag exists.
- Shared validation: this is the sole active release plan.
- Security gates: fail-closed response validation, safe trust errors, preserved
  auth/cancellation, secret-safe evidence, immutable exact-SHA tagging, bounded
  network/process work, and cleanup failure propagation.

## Terminal Checklist

- [x] Implementation, fixtures, generated TypeScript, and versions exist.
- [x] BUG-009 Red/Green correction is committed at `7b0f46d`.
- [x] Codex final spec, quality/test, and security/operations review passes.
- [x] Canonical plan/progress/bugs/mailbox state is reconciled.
- [x] Final local test/lint/diff gates pass on the reconciled tree.
- [x] Reconciliation is committed and `main` is pushed; exact-SHA CI passes.
- [ ] User explicitly authorizes immutable `v1.6.5` creation/push.
- [ ] Tag workflows, publication/mirrors, refs, registry, and clean consumers
  pass for the release SHA/version.
- [ ] Temporary evidence is removed and the plan is archived with a truthful
  index.

## Risks and Deferred Work

- Concurrent commits `3257e01` and `5637e93` are preserved. Their unexpected
  arrival must be disclosed before the normal push; no rewrite is permitted.
- Tag creation remains separately authorized; this direct-completion request
  does not override that explicit gate.
- External service availability may block verification but never justifies
  alternate publication or retag.
- Downstream application adoption is outside this SDK release.
