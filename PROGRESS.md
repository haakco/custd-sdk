# Custd SDK v1.6.5 Progress

**Owning plan:**
[`docs/plans/2026-07-18_1948_exact-subject-insight-sdk-parity-plan.md`](docs/plans/2026-07-18_1948_exact-subject-insight-sdk-parity-plan.md)
**Status:** Codex direct takeover; final local review and reconciliation in
progress. M3 will not be used.

## Current State (verified 2026-07-19)

- `HEAD=5637e93`; `origin/main=3257e01`; `main` is one commit ahead before the
  reconciliation commit.
- Local and remote `v1.6.5` are absent.
- BUG-009 is fixed and committed.
- Current in-scope deltas: owning plan, this file, `BUGS.md`, inactive mailbox,
  and plan index.
- Concurrent history preserved: `3257e01` published the prior packet/tool
  update; `5637e93` renamed `.mise.toml` to `mise.toml`.

## Completed

- SDK implementation, versions, Go cancellation proof, audit/lint remediation,
  and BUG-009 correction through `7b0f46d`.
- Prior Codex full local gates on `7b0f46d` passed.

## Current

- Codex final spec, quality/test, security/operations, state reconciliation, and
  one final local gate run.

## Next

1. Commit only the five reconciliation files.
2. Push `main` normally and verify CI for the exact SHA.
3. Stop for separate `v1.6.5` authorization and `.mise.toml` resolution.
4. Verify release/public consumers and archive.

## Blockers

- None for final local review, reconciliation, or commit.
- Normal push would also publish pre-existing local commit `5637e93`; disclose
  that exact scope before pushing.
- Tag preflight requires explicit tag authorization and a clean tracked tree.

## Last Useful Commands

- `just test` — passed.
- `just lint-workflows lint-markdown diff-check` — passed.
- `git diff --check` — passed.

## Mailbox Status

- Inactive by user instruction; no M3 execution is authorized or required.
