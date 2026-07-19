# Custd SDK v1.6.5 Progress

**Run ID:** `exact-subject-v165-prepush-r1`
**Owning plan:**
[`docs/plans/2026-07-18_1948_exact-subject-insight-sdk-parity-plan.md`](docs/plans/2026-07-18_1948_exact-subject-insight-sdk-parity-plan.md)
**Mailbox:** [`docs/plans/sub_agent/m3.md`](docs/plans/sub_agent/m3.md)
**Status:** Ready for a fresh M3 pre-push factual evidence run.

## Current State (verified 2026-07-19)

- Before this packet: clean `main`, three commits ahead of `origin/main`.
- `HEAD`: `7b0f46d`; `origin/main`: `b340e26`.
- Local and remote `v1.6.5`: absent.
- BUG-009 is fixed and committed at `7b0f46d`.
- Last Codex commands: `just test`,
  `just lint-workflows lint-markdown diff-check`, and `git diff --check` all
  passed on `7b0f46d`.
- Ignored `.opencode/` and old `docs/tmp/m3-runs/` receipts are classified local
  artifacts, not canonical acceptance evidence.
- Expected packet deltas: owning plan, `PROGRESS.md`, `BUGS.md`, mailbox, and
  plan index.
- Unexpected concurrent delta: `.mise.toml` changes the pinned Node version
  from `24.15.0` to `24`. It is outside this plan and blocks dispatch until the
  user resolves or explicitly authorizes it.

## Completed

- Exact-subject implementation and versions: `954f2a0`.
- Go cancellation stabilization and main CI for `b340e26`.
- Audit/lint ownership corrections: `58c031b`, `83a18fc`.
- Go malformed optional contract Red/Green correction: `7b0f46d`.
- Canonical completed facts promoted into the owning plan.

## Current

- M3 run `exact-subject-v165-prepush-r1`: execute Milestone 2 exactly, update
  factual ledger/progress, append mailbox response, then stop.

## Next

1. Codex grades M3 observations and independently repeats critical/final gates.
2. Codex reconciles and commits any final plan-state delta, pushes `main`, and
   verifies CI after explicit push direction.
3. Stop for separate tag authorization.
4. Resume the same owning plan with a fresh post-tag evidence mailbox.

## Blockers

- `.mise.toml` is an unresolved unrelated delta and currently blocks M3
  preflight.
- Push and immutable tag mutations remain coordinator/user authorization gates.

## Last Useful Command

- `git status --short --branch` → `main` three commits ahead; packet files plus
  unrelated `.mise.toml` modified.

## Changed Files

- This plan-only packet changes the owning plan, `PROGRESS.md`, `BUGS.md`,
  `docs/plans/sub_agent/m3.md`, and `docs/plans/main_plan.md`.
- M3 may update only the owning plan's factual ledger, this progress file, and
  append its mailbox response.

## Mailbox Status

- Fresh instruction installed for `exact-subject-v165-prepush-r1`.
- No M3 response yet.
