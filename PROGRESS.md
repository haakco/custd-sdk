# Custd SDK — Dev Loop Progress

**Started:** 2026-07-18
**Owner:** MiniMax-M3 dev loop campaign
**Owning plan:**
[`docs/plans/2026-07-18_1948_exact-subject-insight-sdk-parity-plan.md`](docs/plans/2026-07-18_1948_exact-subject-insight-sdk-parity-plan.md)
**Campaign mailbox / role ledger:**
[`docs/plans/sub_agent/m3.md`](docs/plans/sub_agent/m3.md)
**Audit commit (Milestone 1):** `58c031b`

## Workspace Starting State (verified, Milestone 1)

- Branch: `main`, 1 commit ahead of `origin/main`.
- `HEAD` = `58c031b`; `origin/main` = `b340e26` (matches owning plan).
- `.gitignore` carries an uncommitted `/.opencode/` entry (preserved; the
  directory is not a deletion target).
- `v1.6.5` tag absent locally and remotely. Tag creation is Milestone 4,
  coordinator-only, and requires explicit user authority.

## Milestone Status

Tracked against the owning plan. Each milestone has its own acceptance path and
verification recorded there.

- [x] **Milestone 1 — Repair local audit ownership and state.** `PROGRESS.md`
      names audit commit `58c031b` (not `6386f25`, which does not exist in
      history). `.gitignore` retains the single `/.opencode/` root entry.
      `lint-markdown` recipe narrowly excludes `.opencode/**` and `docs/tmp/**`
      while retaining normal documentation lint. Tooling role receipt:
      [`docs/tmp/m3-runs/2026-07-18_exact-subject-v165-completion-tooling.md`](docs/tmp/m3-runs/2026-07-18_exact-subject-v165-completion-tooling.md).
      State role receipt (this run):
      [`docs/tmp/m3-runs/2026-07-18_exact-subject-v165-completion-state.md`](docs/tmp/m3-runs/2026-07-18_exact-subject-v165-completion-state.md).
- [ ] **Milestone 2 — Run one complete pre-release M3 audit.** Serialized
      Validation, Release-contract inventory, and Fresh evidence verifier
      roles. Required receipts:
      `docs/tmp/m3-runs/2026-07-18_exact-subject-v165-completion-validation.md`,
      `…-contract.md`, `…-verifier.md`. **Not started.**
- [ ] **Milestone 3 — Codex final local review, correction, commit, and
      push.** Codex-only. M3 hands off with `READY_FOR_CODEX_LOCAL_REVIEW`
      only when every Milestone 2 row is `OBSERVED`. **Not started.**
- [ ] **Milestone 4 — Create the immutable release tag `v1.6.5`.**
      Coordinator-only; requires explicit user authority. **Not started.**
- [ ] **Milestone 5 — Verify release workflows and public consumer
      surfaces.** Read-only GitHub workflow, Ref, Verdaccio, and Consumer
      roles. Depends on Milestone 4. **Not started.**
- [ ] **Milestone 6 — Final completion audit and archive.** Coordinator
      reviews, archival, and plan-index reconciliation. **Not started.**

## Historical Evidence (pre-Milestone-1 dev-loop batch)

Milestone 1 supersedes the earlier dev-loop batch. The earlier batch was a
separate read-only audit pass against `b340e26`. The facts below remain
relevant to the historical record only and are not the active campaign state.

- Branch was `main` aligned with `origin/main` at `b340e26` at the start of
  the earlier batch.
- Four role receipts and one verifier landed under
  `docs/tmp/m3-runs/2026-07-18_exact-subject-release-b1-{state,validation,contract,verifier}.md`.
- Verifier totals: 7 `OBSERVED`, 3 `NOT OBSERVED`, 0 `NOT RUN`. The three
  `NOT OBSERVED` rows were the `parity` literal-word check (verifier contract
  defect — see BUG-001 resolution), extra untracked paths, and the failed
  combined lint/diff gate.
- `just test` passed in the earlier batch; the combined
  `just lint-workflows lint-markdown diff-check` failed (470 environmental
  errors in `.opencode/node_modules/**` plus 13 in batch-introduced files).
  `diff-check` never executed because `just` aborted on the `lint-markdown`
  failure.
- Three sibling reviewers produced code-quality (0/5/4/2/0), security
  (0/0/0/0/0), and standards (0/0/2/1/0) reports under
  `docs/tmp/m3-runs/review-{code-quality,security,standards}-b1.md`.
- The earlier batch's `PROGRESS.md` and `BUGS.md` listed commit `6386f25` as
  the audit commit. **No such commit exists** in the repository history; the
  real Milestone 1 audit commit is `58c031b`. That wrong-commit reference is
  corrected in Milestone 1.

## Sequential Constraints

- Roles run serialized within each phase; no parallelism.
- M3 may make bounded local documentation/tooling fixes and run prescribed
  checks. It may not commit, push, create or delete tags, publish, read
  secrets, rerun remote workflows, decide readiness, mark the owning plan, or
  archive it.
- Codex owns final review, findings, checklist decisions, commits, normal
  pushes, the separately authorized tag mutation, final acceptance, and
  archival.

## Scope Boundaries (per m3.md)

- No tag create/push (Milestone 4 is coordinator-only with explicit user
  authority).
- No installs, registry queries, credential reads, MCP server starts, helper
  scripts, log redirects, or unrelated skill use.
- Run literal commands unchanged (no `;`, `&&`, `||`, pipes, redirects,
  `echo`, or exit probes).

## Completion Gates

The campaign is complete only when all of the following hold:

- All five Phase A/B role receipts produced and stored under
  `docs/tmp/m3-runs/`.
- Mailbox append written to `docs/plans/sub_agent/m3.md`.
- `PROGRESS.md` and `BUGS.md` reflect final factual state.
- `just test`, `just lint-workflows lint-markdown diff-check`, and
  `git diff --check` all pass on the final reviewed tree.
- No tracked file changed outside the reviewed local campaign scope.
- Codex accepts Milestone 2 rows, commits the local completion delta, and
  pushes `main`.
- The immutable `v1.6.5` tag is created and pushed; release verification
  surfaces are observed; archival completes with the plan index reconciled.
