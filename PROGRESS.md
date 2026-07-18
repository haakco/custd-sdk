# Custd SDK — Dev Loop Progress

**Started:** 2026-07-18
**Owner:** MiniMax-M3 dev loop batch
**Active plan:** [`docs/plans/sub_agent/m3.md`](docs/plans/sub_agent/m3.md) (Batch 1 of
[`docs/plans/2026-07-18_1948_exact-subject-insight-sdk-parity-plan.md`](docs/plans/2026-07-18_1948_exact-subject-insight-sdk-parity-plan.md))

## Workspace Starting State (verified)

- Branch: `main`, aligned with `origin/main` (no ahead/behind).
- `HEAD` = `origin/main` = `b340e26dbfbb297fd0651760f5111d0a87efb3ec` (matches owning plan).
- Pre-existing tracked deltas vs `origin/main`:
  - `M  docs/plans/2026-07-18_1948_exact-subject-insight-sdk-parity-plan.md`
  - `M  docs/plans/main_plan.md`
  - `?? docs/plans/sub_agent/m3.md` (the new M3 mailbox)
  - `?? .opencode/` (local opencode-loop state; contents gitignored)
- Tag `v1.6.5`: not present locally or on `origin` (to be confirmed in Role 1).

## Work Queue (m3.md Batch 1)

- [x] **Role 1 — Release-state evidence.** Six exact git/gh commands run;
  receipt written to
  `docs/tmp/m3-runs/2026-07-18_exact-subject-release-b1-state.md`.
  Findings: see BUG-001 (changelog "parity" wording),
  BUG-002 (extra untracked paths), BUG-003 (`.opencode/` surfaces),
  BUG-004 (CI jobs skipped — RESOLVED, false alarm; gated by tag-only
  condition), BUG-005 (timestamp NEEDS_HELP).
- [x] **Role 2 — Local validation.** Five exact commands run; receipt
  written to
  `docs/tmp/m3-runs/2026-07-18_exact-subject-release-b1-validation.md`.
  Findings: BUG-006 (lint-markdown 470 environmental errors in
  `.opencode/node_modules/**`, plus 13 in batch files); BUG-007
  (`diff-check` did not run because `just` aborted on lint-markdown failure);
  BUG-008 (Role 1 receipt has 11 markdown violations — gitignored, does not
  affect tracked state). Plus a contract deviation: receipt-metadata
  `date -Iseconds` invocation not enumerated by m3.md; covered by the
  extended BUG-005 note.
- [x] **Role 3 — Release-contract inventory.** Read only the named source
  material; receipt written to
  `docs/tmp/m3-runs/2026-07-18_exact-subject-release-b1-contract.md`.
  Inventory: 2 workflows (ci.yml, release-mirrors.yml), 11 ci.yml jobs
  (8 always-run and 3 tag-only) plus 1 release-mirrors matrix job, 4 SDK
  and 2 framework install surfaces, VersionSyncTest assertions enumerated.
  BUG-004 false alarm confirmed (tag-only gating is correct). Contract
  deviation: one out-of-scope `ls -la docs/tmp/m3-runs/` shell call,
  self-recorded in the contract receipt; also noted in the extended
  BUG-005.
- [x] **Role 4 — Fresh evidence verifier.** Receive only acceptance rows and
  receipts from Roles 1–3; report `OBSERVED` / `NOT OBSERVED` / `NOT RUN` per
  row. No findings, no verdict. Receipt:
  `docs/tmp/m3-runs/2026-07-18_exact-subject-release-b1-verifier.md`.
  Verdicts: 7 OBSERVED, 3 NOT OBSERVED (Row 1, Row 5, Row 8), 0 NOT RUN.
- [x] **Mailbox append.** Append integrated factual response + receipt paths
  to `docs/plans/sub_agent/m3.md`. No other tracked file edits.
- [x] **Primary code-quality and plan-state review.** Codex inspected the
  implementation diff, all four role receipts, mailbox, progress/bug logs, plan,
  index, and workspace state; independently reran `just test` successfully and
  reproduced the combined lint/diff failure. Findings and remediation are
  recorded in the parent plan.
- [x] **Batch-1 review-agent reports.** Code-quality, security, and
  standards-compliance reviews landed under
  `docs/tmp/m3-runs/review-{code-quality,security,standards}-b1.md`. Code
  quality: 0/5/4/2/0 (blocker/high/medium/low/none). Security: 0/0/0/0/0.
  Standards: 0/0/2/1/0.
- [x] **Batch-1 documentation commit.** PROGRESS.md, BUGS.md, the m3.md
  mailbox append, the parent-plan remediation, and the plan-index update
  landed as commit `6386f25` on `main`. Review reports under
  `docs/tmp/m3-runs/review-*.b1.md` are gitignored and remain a local-only
  audit trail. Markeddown-lint clean on the 5 retained files; `git diff
  --check` clean.
- [ ] **Fresh post-remediation review.** After the failed Batch 1 rows are fixed
  and rerun, use fresh isolated read-only spec/correctness,
  quality/evidence, and defensive security/operations reviews.

## Role 1 Outcome Summary

- Branch aligned with `origin/main`: **observed** (both `b340e26…`).
- v1.6.5 tag absent locally and remotely: **observed** (empty stdout, exit 0).
- Hardcoded version owners all `1.6.5`; tag-derived Composer manifests omit
  `version`: **observed**.
- v1.6.5 changelog names exact-subject reporting parity: **NOT observed**
  (body says "contract-compatible exact-subject reporting helpers"; see
  BUG-001).
- Main CI run `29661610991` completed/success for release SHA:
  **observed** (head SHA `b340e26…`, status `completed`, conclusion
  `success`).

## Role 2 Outcome Summary

- `just test`: **PASS** (exit 0). All five sub-recipes (test-go, test-js,
  test-python, test-php, test-release-mirrors) green. The
  `git diff --exit-code -- sdk-js/dist` step inside test-js confirmed the
  committed TypeScript distribution matches the source build.
- `just lint-workflows`: **PASS** (actionlint clean).
- `just lint-markdown`: **FAIL** (exit 1, 483 errors).
  - 470/483 in `.opencode/node_modules/**` (environmental; not present on the
    release commit `b340e26`).
  - 2/483 in batch-introduced `BUGS.md` / `PROGRESS.md` (MD047 — already
    fixed in this batch via `printf '\n'`).
  - 11/483 in `docs/tmp/m3-runs/...state.md` (Role 1 receipt; gitignored).
- `just diff-check`: **NOT RUN** (just aborted after lint-markdown failure).
- Starting vs. ending `git status --short`: byte-identical; `git diff
  --name-only` lists only the two pre-existing plan modifications, no new
  tracked-file changes from `just`.

## Role 3 Outcome Summary

- Workflow inventory:
  - `ci.yml` (234 lines, triggers: `push` to `main`, all tags, all PRs) — 11
    jobs: `go`, `js`, `python`, `php` (matrix 8.3/8.4/8.5), `php-analysis`,
    `php-laravel`, `php-wordpress`, `workflows`, plus tag-only `release-guard`,
    `publish-js`, `publish-packagist` (always-run 8 + tag-only 3).
  - `release-mirrors.yml` (99 lines, trigger: `push` to `v*` tags) — single
    `split` job with 3-row matrix over `(laravel-package, wordpress-plugin,
    sdk-go)`.
- Tag/version guard: `release-guard` job in `ci.yml` and inline
  `Guard tag == VERSION` step in `release-mirrors.yml`. Both compare
  `tr -d '[:space:]' < VERSION` against `GITHUB_REF_NAME` minus `v` prefix;
  exit 1 on mismatch.
- Verdaccio publication: `publish-js` job pulls token from Infisical
  (`INFISICAL_CLIENT_ID`, `INFISICAL_CLIENT_SECRET`) and runs
  `npm publish --registry=https://verdaccio.k8.haak.co/`.
- Packagist: `publish-packagist` job emits
  `echo "Packagist secrets are not configured; skipping." exit 0`
  (`exit 0` after an explicit skip message) when `PACKAGIST_USERNAME` or
  `PACKAGIST_TOKEN` are absent.
- Mirror jobs use `MIRROR_PUSH_TOKEN` from Infisical via `http.extraheader`
  (never in argv). Go split vendors `contract-fixtures/` for the standalone
  module.
- Install surfaces documented:
  - JS: Verdaccio tarball or `github:haakco/custd-sdk#v1.6.5&path:/sdk-js`.
  - Go: `go get github.com/haakco/custd-sdk-go@v1.6.5`.
  - Python: `pip install "custd-sdk @ git+https://github.com/haakco/custd-sdk.git@v1.6.5#subdirectory=sdk-python"`.
  - PHP: Composer VCS against the monorepo (`dev-main`); no Packagist.
  - Laravel: mirror install at `haakco/custd-sdk-laravel`; WordPress:
    `haakco/custd-sdk-wordpress`.
- `VersionSyncTest.php` asserts every hardcoded manifest equals root
  `VERSION`, asserts tag-derived Composer manifests omit a `version` key,
  asserts the `release-guard` job exists and reads VERSION correctly, and
  asserts no workflow force-pushes `main`.
- BUG-004 confirmed false alarm: skipped jobs in main-CI run are correct
  for a `main` push.

## Role 4 Outcome Summary

Acceptance-row verdict table (verifier receipt:
`docs/tmp/m3-runs/2026-07-18_exact-subject-release-b1-verifier.md`):

| # | Acceptance row | Verdict | Notes |
| --- | --- | --- | --- |
| 1 | Starting branch `main` aligned with `origin/main`; only listed deltas | NOT OBSERVED | `.opencode/`, `BUGS.md`, `PROGRESS.md`, `docs/plans/sub_agent/` added by dev loop |
| 2 | `HEAD == origin/main == b340e26…` | OBSERVED | per Role 1 commands 2 and 3 |
| 3 | No local or remote `v1.6.5` tag | OBSERVED | empty stdout, exit 0 |
| 4 | All hardcoded version owners = `1.6.5`; tag-derived Composer manifests omit `version` | OBSERVED | per Role 1 commands 4 plus `cat` of root/Go/JS/Python/PHP manifests |
| 5 | `v1.6.5` changelog names exact-subject reporting parity | NOT OBSERVED | body uses "helpers", not "parity" (BUG-001) |
| 6 | Main CI run `29661610991` completed/success for release SHA | OBSERVED | gh run view JSON, BUG-004 false alarm |
| 7 | `just test` passes without modifying tracked TypeScript distribution | OBSERVED | exit 0, no tracked changes |
| 8 | `just lint-workflows lint-markdown diff-check` passes | NOT OBSERVED | `lint-markdown` failed 483 errors (470 environmental); `diff-check` not run |
| 9 | Ending tracked status matches starting state | OBSERVED | `git status --short` byte-identical before/after Role 2 commands |
| 10 | Release-contract inventory lists required surfaces without claiming v1.6.5 ran them | OBSERVED | per Role 3 receipt |

Verdict totals: 7 OBSERVED, 3 NOT OBSERVED, 0 NOT RUN.

## Sequential Constraints

- Roles run serialized in the order above; no parallelism.
- Role 2 may produce ordinary ignored dependency/build caches; no tracked
  edits.
- All roles are read-only except Role 2's transient caches.

## Scope Boundaries (per m3.md)

- No tag create/push (excluded — primary coordinator authority required,
  per parent plan Milestone 2).
- No installs, registry queries, credential reads, MCP server starts, helper
  scripts, log redirects, or unrelated skill use.
- Run literal commands unchanged (no `;`, `&&`, `||`, pipes, redirects, `echo`,
  or exit probes).

## Completion Gates

- All four role receipts produced and stored under
  `docs/tmp/m3-runs/`.
- Mailbox append written.
- `PROGRESS.md` and `BUGS.md` reflect final factual state.
- No tracked file changed outside the pre-existing plan/index/mailbox deltas
  plus the final mailbox append.

## Outstanding Items Beyond Batch 1 (NOT in this batch)

Per the parent plan, these remain after the M3 audit:

- Milestone 2: create and push immutable `v1.6.5` tag (primary coordinator
  only; requires explicit user authority).
- Milestone 3: verify tag CI and publication surfaces (M3 read-only roles
  after coordinator confirms tag exists).
- Milestone 4: independent completion audit and archive.

These are deliberately out of scope for this M3 batch and must wait for
coordinator authorization per the parent plan.
