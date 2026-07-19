# Custd SDK v1.6.5 Progress

**Owning plan:**
[`docs/plans/2026-07-18_1948_exact-subject-insight-sdk-parity-plan.md`](docs/plans/2026-07-18_1948_exact-subject-insight-sdk-parity-plan.md)
**Status:** Pre-tag work complete; waiting for explicit `v1.6.5` authorization.
M3 will not be used.

## Current State (verified 2026-07-19)

- `HEAD=origin/main=30a3c7e` before this cleanup.
- Local and remote `v1.6.5` are absent.
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

## Current

- Waiting for separate user authorization to create and push immutable
  `v1.6.5`.

## Next

1. After explicit authorization, re-run the clean-tree/tag/version/SHA preflight.
2. Create and push immutable `v1.6.5` exactly once.
3. Verify release workflows, publication, mirrors, and clean consumers.
4. Archive the completed plan.

## Blockers

- Explicit tag authorization is required before the next external mutation.

## Last Useful Commands

- `just test` — passed.
- `just lint-workflows lint-markdown diff-check` — passed.
- `git diff --check` — passed.
- `gh run view 29668016923` — completed/success for `30a3c7e`.
