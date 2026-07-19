# Custd SDK v1.6.5 Progress

**Owning plan:**
[`docs/plans/2026-07-18_1948_exact-subject-insight-sdk-parity-plan.md`](docs/plans/2026-07-18_1948_exact-subject-insight-sdk-parity-plan.md)
**Status:** Pre-tag work complete; waiting for explicit `v1.6.5` authorization.
M3 will not be used.

## Current State (verified 2026-07-19)

- Before this CI-status update, `HEAD=origin/main=b7ba529`.
- Local and remote `v1.6.5` are absent.
- BUG-009 is fixed and committed.
- Current in-scope deltas: owning plan, this file, and plan index.
- Concurrent history preserved: `3257e01` published the prior packet/tool
  update; `5637e93` renamed `.mise.toml` to `mise.toml`.

## Completed

- SDK implementation, versions, Go cancellation proof, audit/lint remediation,
  and BUG-009 correction through `7b0f46d`.
- Prior Codex full local gates on `7b0f46d` passed.
- Codex final review and reconciliation committed as `4ac2632` and `b7ba529`.
- `main` pushed normally through `b7ba529`.
- Main CI run `29667898356` completed/success for exact SHA `b7ba529`; all
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
- `gh run view 29667898356` — completed/success for `b7ba529`.

## Mailbox Status

- Inactive by user instruction; no M3 execution is authorized or required.
