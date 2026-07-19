# Custd SDK v1.6.5 Progress

**Owning plan:**
[`archive/docs/plans/2026-07-19_0135_2026-07-18_1948_exact-subject-insight-sdk-parity-plan.md`](archive/docs/plans/2026-07-19_0135_2026-07-18_1948_exact-subject-insight-sdk-parity-plan.md)
**Status:** Complete and archived; released as `v1.6.5`.

## Current State (verified 2026-07-19)

- The release tag `v1.6.5` peels to `ea0e350`.
- BUG-009 is fixed and committed.
- Current in-scope cleanup deltas: owning plan, this file, resolved bug-ledger
  archive, inactive-mailbox archive, and removal of disposable M3 receipts.
- Concurrent history preserved: `3257e01` published the prior packet/tool
  update; `5637e93` renamed `.mise.toml` to `mise.toml`.

## Completed

- SDK implementation, versions, Go cancellation proof, audit/lint remediation,
  and BUG-009 correction through `7b0f46d`.
- Prior Codex full local gates on `7b0f46d` passed.
- Codex final review and reconciliation committed through `30a3c7e`.
- `main` pushed normally through `30a3c7e`.
- Main CI run `29668016923` completed/success for exact SHA `30a3c7e`; all
  required main jobs succeeded and tag-only jobs correctly skipped.
- Tag CI `29668667152` and Release Mirrors `29668667174` passed.
- Verdaccio resolves `@haakco/custd-sdk@1.6.5`.

## Current

- Release and archive closeout complete.

## Next

None for this release.

## Blockers

None.

## Last Useful Commands

- `just test` — passed.
- `just lint-workflows lint-markdown diff-check` — passed.
- `git diff --check` — passed.
- `gh run view 29668016923` — completed/success for `30a3c7e`.
