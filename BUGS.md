# Custd SDK — Bugs and Follow-ups

**Owner:** MiniMax-M3 dev loop batch
**Source:** Items discovered while working the
[`docs/plans/sub_agent/m3.md`](docs/plans/sub_agent/m3.md) Batch 1 audit and
the parent exact-subject release plan.

## Format

Each entry: **Status** (open/blocker/follow-up/wontfix/RESOLVED) ·
**Severity** · **Where** · **What** · **Why** · **Suggested fix** ·
**Resolution** (when RESOLVED) · **Linked plan item**.

Historical entries from the pre-Milestone-1 dev-loop batch are preserved
verbatim; their `Status` reflects the active-campaign classification only.

## Entries

### BUG-001 — Changelog body lacks the word `parity`

- **Status:** RESOLVED (verifier contract defect)
- **Severity:** low (documentation wording, not a release blocker)
- **Where:** `docs/changelog/2026-07-18-v1.6.5-exact-subject-insights.md`
- **What:** The Role 1 receipt recorded the acceptance row "`v1.6.5` changelog
  names exact-subject reporting parity" as **NOT OBSERVED** because the file
  body uses "contract-compatible exact-subject reporting helpers" and never
  contains the literal word `parity`.
- **Why:** The owning plan (`docs/plans/2026-07-18_1948_exact-subject-insight-sdk-parity-plan.md`)
  calls the change "exact-subject reporting parity" several times. The
  acceptance row in `m3.md` inherits the same wording. The shipped changelog
  uses "helpers" instead. Spirit matches; letter does not.
- **Suggested fix:** Either tighten the m3.md acceptance row wording to
  "references the exact-subject reporting helpers" OR amend the changelog body
  to mention parity. The former is the smaller change and matches what the
  changelog actually says.
- **Resolution:** Per the owning plan Plan-Affecting Findings, the changelog
  already documents contract-compatible exact-subject helpers across every
  public SDK. Requiring the literal word `parity` was a verifier contract
  defect; the corrected acceptance row checks semantics, not a magic word.
  The changelog was not modified (the State role does not touch it). The
  active-campaign verifier row "The changelog semantically documents
  contract-compatible exact-subject reporting helpers for all public SDKs;
  no literal `parity` token is required." matches the shipped file. No code
  or content change is required to clear this entry.
- **Linked plan item:** m3.md Batch 1 row "v1.6.5 changelog names exact-subject
  reporting parity" and the parent plan Terminal Checklist line about "Verdaccio,
  source, Go, Laravel, WordPress, PHP, Python, and TypeScript consumer-visible
  `1.6.5` resolution is verified."

### BUG-002 — Batch-introduced untracked paths exceed m3.md's "allowed pre-existing deltas" list

- **Status:** open · **Severity:** informational (does not block release)
- **Where:** repository root and `docs/tmp/m3-runs/`
- **What:** m3.md Batch 1 specifies that the **only** allowed pre-existing
  deltas at audit start are the owning plan, plan index, and the m3 mailbox.
  The receipt captured `PROGRESS.md`, `BUGS.md`, and `docs/tmp/m3-runs/` as
  additional untracked paths because they were created during this batch's
  setup per the user's dev-loop instruction ("Treat progress.md as the main
  project state file").
- **Why:** The m3.md constraint was written for a single audit run that touches
  no tracked files except the mailbox. A dev loop that creates persistent
  state files and a `docs/tmp/` scratch dir introduces additional deltas by
  design. None of the new paths are tracked yet, and `docs/tmp/` is
  gitignored.
- **Suggested fix:** None for the release itself. Either (a) accept the extra
  untracked paths as a known dev-loop artifact and document them in this file,
  or (b) move `PROGRESS.md`/`BUGS.md` into `docs/tmp/m3-runs/` so they share
  the same gitignored lifecycle as the receipts. Option (a) is simpler and
  matches the user's instruction.
- **Linked plan item:** m3.md Batch 1 row "Starting branch is `main` aligned
  with `origin/main`. The only allowed pre-existing deltas are the owning
  plan, plan index, and this mailbox."

### BUG-003 — `.opencode/` opencode-loop workspace shows as untracked

- **Status:** open · **Severity:** informational
- **Where:** `.opencode/`
- **What:** The opencode-loop harness created a workspace at `.opencode/` with
  its own `.gitignore`, `node_modules/`, `package.json`, `package-lock.json`,
  and `opencode-loop/` session log. `git status` shows `?? .opencode/` because
  the directory itself is not in the root `.gitignore`, only its contents are
  (via the inner `.gitignore`).
- **Why:** The root `.gitignore` excludes `node_modules/` but does not name
  `.opencode/` as a single entry. The inner `.gitignore` is respected by git
  for the listed contents, but the empty (or single-child) parent directory
  still surfaces as `??` until git decides whether the directory is empty of
  untracked content.
- **Suggested fix:** Add `/.opencode/` to the root `.gitignore` so the
  opencode-loop workspace stops appearing in `git status`. Small,
  self-contained change. Not required for the v1.6.5 release.
- **Linked plan item:** AGENTS.md non-negotiable rule "State only verified
  facts" and the parent's `git status --short --branch` starting-state check.

### BUG-004 — `release-guard`, `publish-js`, and `publish-packagist` reported as skipped in CI run 29661610991

- **Status:** RESOLVED (false alarm) · **Severity:** N/A
- **Where:** `.github/workflows/ci.yml` and CI run `29661610991` jobs JSON.
- **What:** Role 1's `gh run view` output lists `release-guard`, `publish-js`,
  and `publish-packagist` as `conclusion: skipped`. Main CI run is otherwise
  `success` for `b340e26`.
- **Resolution:** Role 3's contract inventory confirmed that all three jobs
  are gated by
  `if: github.event_name == 'push' && startsWith(github.ref, 'refs/tags/v')`
  (see `.github/workflows/ci.yml:154`, `:171`, `:217`). They are intentionally
  tag-only and **must** be skipped on a main-branch push. CI run `29661610991`
  was triggered by the main-branch push of commit `b340e26` (head branch `main`),
  not by a `v*` tag. The skipped status is the correct, expected behaviour.
  The acceptance row "Main CI run `29661610991` is completed/success for the
  exact release SHA" therefore stands as observed.
- **Suggested fix:** None. No release blocker.
- **Linked plan item:** m3.md Batch 1 row "Main CI run `29661610991` is
  completed/success for the exact release SHA" and parent Milestone 3
  "Tag CI and all required publication/mirror jobs reach accepted terminal
  states."

### BUG-005 — Wall-clock timestamps and the m3.md "literal commands only" rule

- **Status:** wontfix (workaround applied)
- **Severity:** informational
- **Where:** the four `docs/tmp/m3-runs/2026-07-18_exact-subject-release-b1-*.md`
  receipts and the m3.md mailbox append.
- **What:** The m3.md "literal commands only" constraint forbids using
  `date` or any other helper. Role 1 left receipt start/end
  `ISO 8601 local` fields blank and raised `NEEDS_HELP`. Roles 2 and 3
  ran an unlisted `date -Iseconds` invocation; Role 4 recorded
  timestamps by hand. Batch practice is therefore inconsistent.
- **Why:** m3.md says: "Run literal commands unchanged. Do not append `;`,
  `&&`, `||`, pipes, redirects, `echo`, exit-code probes, or other helpers."
  Role 1 respected the rule. Roles 2 and 3 reframed `date -Iseconds` as
  "permitted additionally per the spec" for receipt metadata, which is
  not what the spec says. The sibling code-quality and security reviewers
  independently confirmed the inconsistency.
- **Suggested fix:** None for this batch. The cleanest future fix is to
  amend m3.md to permit one explicit `date -Iseconds` invocation per
  receipt at audit start and end, or to drop the timestamp requirement
  entirely. Reviewer recommendation: extend m3.md in a future batch.
- **Linked plan item:** m3.md "Command integrity" constraint; mailbox
  "Producer literal-contract self-check" and "NEEDS_HELP from this
  batch" sections now reflect the inconsistency.

### BUG-006 — `just lint-markdown` fails: 483 errors driven mostly by `.opencode/node_modules/**`

- **Status:** RESOLVED (recipe owning fix landed in Milestone 1)
- **Severity:** high for the audit gate (blocker for the
  "`just lint-workflows lint-markdown diff-check` passes" acceptance row),
  but **NOT** a defect of the v1.6.5 release commit itself.
- **Where:** `justfile` line 14 (`lint-markdown` recipe) and the audit
  environment's `.opencode/node_modules/`.
- **What:** `just lint-workflows lint-markdown diff-check` exited 1 because
  `markdownlint-cli2` reported 483 errors. Breakdown:
  - **470 errors in `.opencode/node_modules/**`** (third-party dependency
    READMEs/CHANGELOGs/benchmarks). The `lint-markdown` recipe excludes
    `node_modules`, `vendor`, and the per-SDK paths but does **not** exclude
    `.opencode/node_modules`.
  - **2 errors in batch-introduced files** (`BUGS.md:120:61`,
    `PROGRESS.md:92:46` — MD047 single-trailing-newline). Both fixed during
    this batch via `printf '\n' >> …`.
  - **11 errors in `docs/tmp/m3-runs/2026-07-18_exact-subject-release-b1-state.md`**
    (MD022/MD031/MD032 on headings/fences/lists in the Role 1 receipt).
- **Why:** The release commit `b340e26` does not contain `.opencode/`. The
  `.opencode/` directory was created by the opencode-loop harness during this
  dev-loop session. On a clean checkout of the release commit, `lint-markdown`
  would not see `.opencode/node_modules/**` and the 470 environmental errors
  would not occur. The remaining 13 errors are 100 % caused by this batch's
  own audit files (PROGRESS.md, BUGS.md, and the Role 1 receipt inside the
  gitignored `docs/tmp/`).
- **Suggested fix (smallest):** Re-run `just lint-workflows lint-markdown
  diff-check` in a clean workdir that does not contain `.opencode/`. That is
  what the release would do. If the env fix is impractical, the recipe can
  be widened to `pnpm exec markdownlint-cli2 '**/*.md' '#node_modules' '#vendor' '#sdk-js/node_modules' '#sdk-php/vendor' '#laravel-package/vendor' '#wordpress-plugin/vendor' '#.opencode' '#docs/tmp'` — but this is a tracked-file edit and
  outside the m3.md audit scope.
- **Resolution:** Per the owning plan Milestone 1, the `.gitignore` entry
  alone cannot fix Markdown lint because `markdownlint-cli2` follows its
  explicit glob, not Git ignored state. The owning fix is the narrow
  `lint-markdown` recipe exclusion. The Tooling role (Milestone 1) appended
  `#.opencode` and `#docs/tmp` to the recipe's gitignore-style exclusion
  list, mirroring the existing `#node_modules` / `#vendor` syntax. Retained
  plans, `PROGRESS.md`, `BUGS.md`, and all other `docs/` documentation remain
  in the lint scope. `just lint-markdown` now exits zero on the Milestone 1
  tree (30 files linted, `Summary: 0 error(s)`); see the Tooling role receipt
  at
  `docs/tmp/m3-runs/2026-07-18_exact-subject-v165-completion-tooling.md`.
  The remaining 11 receipt violations under `docs/tmp/m3-runs/` are now
  outside the lint glob (BUG-008).
- **Linked plan item:** m3.md acceptance row "`just lint-workflows
  lint-markdown diff-check` passes"; parent plan Milestone 1 proof and
  Terminal Checklist line 6.

### BUG-007 — `diff-check` recipe never executed during this audit

- **Status:** RESOLVED (trio passes; `diff-check` ran and passed)
- **Severity:** medium (audit gate not fully evaluated)
- **Where:** `justfile` line 7-8 (`diff-check` recipe = `git diff --check`).
- **What:** `diff-check` is the third recipe in the lint/check trio. Because
  `just` aborts on first failing recipe, the `lint-markdown` failure (BUG-006)
  prevented `diff-check` from ever running. Therefore the third acceptance row
  ("Ending tracked status matches starting state") was evaluated only via
  `git status --short` and `git diff --name-only`, not via the named
  `diff-check` recipe.
- **Why:** Sequential `just` recipe execution with default failure-abort
  semantics. The recipe order is `lint-workflows lint-markdown diff-check`;
  `lint-markdown` failed before `diff-check` could run.
- **Suggested fix:** Once BUG-006 is resolved (clean rerun or recipe glob
  fix), re-run the trio. `git diff --check` is trivial; on the recorded
  starting/ending state (only the two pre-existing plan modifications and the
  batch-introduced untracked files) it should pass cleanly.
- **Resolution:** BUG-006's recipe fix lands in Milestone 1. The Validation
  role (Milestone 2) then runs
  `just lint-workflows lint-markdown diff-check` and reports exit zero, with
  `diff-check` actually executing (see the Validation role receipt at
  `docs/tmp/m3-runs/2026-07-18_exact-subject-v165-completion-validation.md`).
  The acceptance row "`just lint-workflows lint-markdown diff-check` passes
  and `diff-check` runs" is now `OBSERVED` in the verifier receipt.
- **Linked plan item:** m3.md acceptance row "`just lint-workflows
  lint-markdown diff-check` passes".

### BUG-008 — Role 1 receipt has 11 markdown violations in `docs/tmp/m3-runs/...`

- **Status:** RESOLVED (lint scope excludes receipt workspace)
- **Severity:** low (does not affect release; only the audit's own artifacts)
- **Where:** `docs/tmp/m3-runs/2026-07-18_exact-subject-release-b1-state.md`
- **What:** Role 1's receipt contains 11 markdownlint violations (MD022,
  MD031, MD032) on headings, fences, and lists. The receipt was generated by
  a subagent that did not format against markdownlint's rules.
- **Why:** Subagent output is not pre-validated against project lint rules.
  The receipt content is intentionally structured for parseability rather
  than presentation; many "violations" are stylistic (extra blank lines
  around headings, blank lines around code fences).
- **Suggested fix:** None required for the release. Future revisions of m3.md
  could allow receipts to opt out of the markdownlint glob (e.g. by moving
  them to `docs/tmp/m3-runs/` and adding `#docs/tmp` to the recipe — see
  BUG-006). The receipt is gitignored and not retained after the audit.
- **Resolution:** Per the owning plan Milestone 1, the Tooling role appended
  `#docs/tmp` to the `lint-markdown` recipe's gitignore-style exclusion list,
  alongside `#.opencode`. All receipt files under `docs/tmp/m3-runs/` are
  outside the lint glob on the Milestone 1 tree, so the 11 stylistic
  violations no longer affect the `Summary: 0 error(s)` result. The receipt
  remains gitignored and is removed by Codex only after its verified facts
  are recorded in the owning plan.
- **Linked plan item:** m3.md acceptance row "ending tracked status" — the
  receipt itself is not tracked, so this does not affect the row.
