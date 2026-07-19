# Custd SDK v1.6.5 Progress

**Owning plan:**
[`docs/plans/2026-07-18_1948_exact-subject-insight-sdk-parity-plan.md`](docs/plans/2026-07-18_1948_exact-subject-insight-sdk-parity-plan.md)
**Mailbox:** [`docs/plans/sub_agent/m3.md`](docs/plans/sub_agent/m3.md)
**Status:** Active; Milestone 2 (Go parity fix) is green on the working tree;
state reconciliation and final review remain before push and `v1.6.5`.

## Current State (verified 2026-07-18)

- Branch: `main`, two commits ahead of `origin/main`.
- `HEAD`: `83a18fc`; `origin/main`: `b340e26`.
- Local and remote `v1.6.5`: absent.
- Working tree changes pending commit: `BUGS.md` (BUG-009 RESOLVED +
  FINDING-001 informational), `PROGRESS.md` (this update), and the owning plan
  (Milestone 2 completion note). `sdk-go/reporting.go` and
  `sdk-go/reporting_test.go` carry the Red/Green change.
- `/.opencode/` is committed in `.gitignore`; the local harness remains ignored.
- M3 Phase A/B receipts exist under ignored `docs/tmp/m3-runs/`. They are
  temporary supporting evidence, not acceptance records.
- M3 execution is paused until provider tokens reset.

## Completed

- Exact-subject helpers, shared fixtures, generated TypeScript distribution,
  package versions, documentation, and tests landed in `954f2a0`.
- Go cancellation proof was stabilized in `b340e26`; main CI run `29661610991`
  passed for that SHA.
- Audit documentation landed in `58c031b`.
- Root `/.opencode/` ignore and narrow Markdown-lint exclusions landed in
  `83a18fc`.
- BUG-009 (Go malformed optional subcontracts) RESOLVED 2026-07-18:
  - Red: `sdk-go/reporting_test.go:287-327` — three cases (`metadata:{}`,
    `sources:[{}]`, `trust:{}`) initially failed, proving the bug.
  - Green: `sdk-go/reporting.go:396-562` — custom `UnmarshalJSON` on
    `ReportingQueryMetadata`, `ReportingSourceSummary`, and the required-field
    half of `RenderedReportingTrust`. Forbidden-key rejection preserved.
  - Proof: `cd sdk-go && go test ./... -run
    TestReportingSubjectInsightRejectsMalformedOptional -v` 3 PASS; `cd sdk-go
    && go test ./...` `ok 2.144s`. Parallel code-quality and security reviews
    returned no blockers. See `BUGS.md` BUG-009 and the owning plan Milestone 2.
- Codex independently ran successfully on the prior tree:
  - `just test`
  - `just lint-workflows lint-markdown diff-check`
  - `git diff --check`
- Independent review confirmed the helper endpoint, request closure, shared
  required response contract, auth/error behavior, unsafe trust rejection,
  TypeScript signal handling, Go cancellation, generated distribution, and
  version synchronization.

## Current Work

- Required state reconciliation: `BUGS.md` updated for BUG-009 RESOLVED plus
  FINDING-001 (informational, `.skills/` absence). `PROGRESS.md` and the
  owning plan reflect Milestone 2 completion.
- Required next step: Codex independent final reviews on the corrected tree,
  full local gate run, commit, push, main CI verification.

## Next Actions

1. Codex runs the final isolated quality, security, and adversarial reviews on
   the corrected tree.
2. Codex runs the full local gates once: `just test`, `just lint-workflows
   lint-markdown diff-check`, `git diff --check`.
3. Codex commits the reviewed completion delta and pushes `main`; verify
   main CI for the pushed SHA.
4. Stop for explicit user authorization before creating or pushing `v1.6.5`.
5. Verify tag workflows, mirrors, registry, clean consumers, then archive.

## Blockers

- Release mutation dependency: explicit user authorization is required for the
  immutable tag after the corrected release commit is pushed and green.

## Mailbox State

- The current mailbox contains the completed Phase A/B response and is retained
  for this Codex review only.
- Before the next fresh M3 session, Codex must preserve verified facts in the
  owning plan, then clear/replace the mailbox with exactly one bounded Go
  follow-up task if any remains.
