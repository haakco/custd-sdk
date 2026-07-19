# Exact-Subject SDK v1.6.5 Completion Plan

**Status:** Active; implementation and BUG-009 remediation are committed and
locally green at `7b0f46d`. Fresh M3 pre-push evidence, Codex acceptance, push
and main CI, separately authorized release, publication proof, and archive
remain.

**Goal:** Release contract-compatible exact-subject insight helpers in every
public Custd SDK, prove the published surfaces from clean consumers, and archive
one truthful completion record.

**Acceptance criteria:** TypeScript, Go, Python, and PHP enforce the same closed
request and rendered-response contract; the reviewed release commit passes all
required local and main-CI gates; an explicitly authorized immutable `v1.6.5`
tag drives successful publication and mirrors; clean consumers resolve the
version and public helper; no secret-bearing or temporary evidence remains; and
Codex archives the reconciled plan and index.

## Current State (Verified 2026-07-19)

- Before this plan-only packet, branch `main` was clean and three commits ahead
  of `origin/main`.
- `HEAD` is `7b0f46d`; `origin/main` is `b340e26`.
- Local commits not yet pushed:
  - `58c031b` — first audit documentation.
  - `83a18fc` — root `.opencode` ignore, narrow Markdown-lint exclusions, and
    audit-state remediation.
  - `7b0f46d` — Go malformed optional response-contract correction plus the
    prior plan/progress update.
- Local and remote `v1.6.5` are absent.
- `VERSION`, `sdk-go/VERSION`, `sdk-js/package.json`,
  `sdk-python/pyproject.toml`, and `sdk-php/composer.json` equal `1.6.5`.
- Main CI run `29661610991` passed for `b340e26`, before the three local commits.
  No main CI evidence exists for `7b0f46d`.
- Codex independently ran `just test`,
  `just lint-workflows lint-markdown diff-check`, and `git diff --check` on
  `7b0f46d`; all exited zero. This is supporting evidence, not a substitute for
  the fresh M3 run and post-push CI required below.
- Ignored `.opencode/` and `docs/tmp/m3-runs/` exist locally. They are not
  tracked acceptance evidence. Old receipts are disposable after Codex confirms
  their durable facts are represented here.
- Current packet deltas are this plan, `PROGRESS.md`, `BUGS.md`, the M3 mailbox,
  and `docs/plans/main_plan.md`.
- A concurrent/user-owned `.mise.toml` delta changed `node = "24.15.0"` to
  `node = "24"`. It is outside this plan, conflicts with the repository's
  reproducible-pin rule until explained, and must be resolved or explicitly
  included by the user before M3 pre-push evidence can run.

## Plan-Affecting Findings

- **BUG-009 resolved:** Go previously accepted malformed optional `metadata`,
  `sources`, and incomplete `trust` objects. Commit `7b0f46d` added focused Red
  tests and required-field validation at the JSON unmarshal boundary. The
  focused and full Go suites pass.
- **M3 ownership correction:** Earlier M3 runs authored verdicts and committed
  despite coordinator-only boundaries. Their observations remain supporting
  evidence only. The fresh packet mechanically forbids Git mutation and limits
  M3 to factual `OBSERVED` / `NOT OBSERVED` / `NOT RUN` output.
- **State reconciliation required:** The version committed in `7b0f46d` still
  described pre-commit Git state. This plan packet supersedes it with the actual
  clean `7b0f46d` state.
- **Skill routing:** `haakco-opencode-minimax-m3` governs execution and evidence
  ownership. Applicable `haakco-code-excellence` rules are converted below into
  explicit owner/boundary/test rows. Go backend, typed-contract, boundary-test,
  package-tooling, and Just workflow guidance apply. Database, UI/accessibility,
  browser, and schema skills are not applicable because the remaining local diff
  changes none of those boundaries.
- **Stale local-skill finding dismissed:** A repository-local `.skills/`
  directory is not required. The canonical skills catalog and compiled skill
  paths are the current discovery owners.
- **No new reusable tooling needed:** The defect is protected by focused Go
  regression tests and the existing `just` gates. A new helper, dependency, or
  skill would duplicate existing owners.

## Ownership and Run Packet

- Canonical plan and acceptance decisions: Codex only.
- User-managed persistent M3 state:
  - Owning plan: this file.
  - Progress: `PROGRESS.md`.
  - Mailbox: `docs/plans/sub_agent/m3.md`.
- Active run ID: `exact-subject-v165-prepush-r1`.
- M3 may update only factual execution rows in this plan, current state in
  `PROGRESS.md`, and append its response to the mailbox.
- M3 must not create separate receipts for this persistent run, edit `BUGS.md`,
  author findings/verdicts, mark Codex acceptance cells, commit, push, tag,
  publish, rerun workflows, read credentials, or mutate external state.

## Milestones

### 1. Completed implementation and BUG-009 remediation

- [x] Exact-subject helpers, shared fixtures, documentation, generated
  TypeScript distribution, and synchronized `1.6.5` versions landed in
  `954f2a0`.
- [x] Go cancellation proof stabilized in `b340e26`; main CI passed for that
  SHA.
- [x] Audit/lint ownership corrections landed in `58c031b` and `83a18fc`.
- [x] BUG-009 Red/Green correction landed in `7b0f46d`:
  - Red owner: `sdk-go/reporting_test.go:287-327`.
  - Green owner: `sdk-go/reporting.go:396-562`.
  - Boundary: real `ReportingClient.SubjectInsight` response decoding.
  - Counterexamples: `"metadata": {}`, `"sources": [{}]`, `"trust": {}`.
  - Required zero values such as `returnedRows: 0` remain valid because field
    presence, rather than non-zero value, is enforced.

### 2. Fresh M3 pre-push evidence campaign

- Ownership: M3 thin dispatcher with fresh isolated read-only subagents.
- Dependencies: `HEAD=7b0f46d`; exact tag absence; only the five named packet
  deltas; no concurrent editor. The unrelated `.mise.toml` delta must be absent
  or explicitly authorized into scope before dispatch.
- Preflight commands, run literally and serially by the dispatcher:
  1. `git status --short --branch`
  2. `git rev-parse HEAD`
  3. `git rev-parse origin/main`
  4. `git tag -l v1.6.5`
  5. `git ls-remote --tags origin refs/tags/v1.6.5`
- Expected: `main` three commits ahead, `HEAD=7b0f46d`,
  `origin/main=b340e26`, empty local/remote tag output, and exactly the five
  named packet deltas. The preflight records those files byte-for-byte so the
  ending scope comparison can distinguish M3 ledger/mailbox updates.
- Stop: any mismatch, dirty tracked state, unexpected process, unavailable
  command, credential request, or external mutation returns `NEEDS_HELP` before
  further work.

#### 2.1 Spec/correctness observation role

- Inspect only: this plan; `docs/changelog/2026-07-18-v1.6.5-exact-subject-insights.md`;
  shared subject-insight fixtures; the subject-insight implementation and tests
  in `sdk-js`, `sdk-go`, `sdk-python`, and `sdk-php`; generated JS declarations
  and runtime entrypoint.
- Must report only factual rows:
  - All four public helpers call `POST /api/v1/reporting/insights/subject`.
  - Request closure, template/subject bounds, mutually exclusive range forms,
    RFC3339/date ordering, and maximum 366-day range agree.
  - Required and optional rendered-response fields agree across SDKs.
  - The three BUG-009 malformed optional counterexamples are rejected by Go at
    the real client decode boundary.
  - Unsafe trust diagnostics are rejected without including unsafe values in
    errors.
  - TypeScript signal and Go context cancellation reach the real transport.
  - Generated TypeScript exports match source declarations/runtime.
- Output: `OBSERVED`, `NOT OBSERVED`, or `NOT RUN` per row with file/line or
  literal-command evidence; no findings, fixes, or verdict.

#### 2.2 Quality/test and skill-conformance observation role

- Inspect only: the complete diff `b340e26..7b0f46d`, subject-insight tests,
  `justfile`, repository instructions, and the applicable code-excellence rows
  copied here.
- Must report only factual rows:
  - Existing owners and public callers were used; no duplicate client path,
    dependency, or speculative abstraction was added.
  - Go validation is at the JSON boundary and uses typed structs plus explicit
    required-field presence checks.
  - BUG-009 tests name the malformed scenario, exercise the real client,
    assert rejection, and have recorded Red evidence.
  - Positive zero-value behavior remains representable.
  - Error context identifies the malformed nested contract without exposing
    response values.
  - Focused checks guided the fix; broad gates are reserved for the integrated
    final command role below.
  - Package versions, generated JS, and `just` command ownership remain aligned.
- Output: factual rows only; no quality verdict or canonical finding.

#### 2.3 Defensive security/operations observation role

- Inspect only: exact-subject request/response validation, trust-key rejection,
  auth/cancellation tests, `.github/workflows/ci.yml`,
  `.github/workflows/release-mirrors.yml`, `VERSION`, and Git/tag state evidence.
- Must report only factual rows:
  - Untrusted responses are validated before returning typed data.
  - Forbidden trust keys fail closed and their values are absent from errors.
  - Existing auth propagation and cancellation behavior remain covered.
  - No secret value or credential-bearing artifact is present in the tracked
    diff or prescribed output.
  - Tag/version guards fail on mismatch; release jobs use self-hosted runners;
    no force-push/retag path is introduced.
  - M3 performed no external mutation and started no unrelated MCP/process.
- Output: factual rows only; no security verdict or remediation.

#### 2.4 Integrated command role

- Run literally, serially, with no operators, pipes, redirects, helpers, exit
  probes, temporary logs, or retries with changed commands:
  1. `just test`
  2. `just lint-workflows lint-markdown diff-check`
  3. `git diff --check`
  4. `git status --short --branch`
  5. `git diff --name-only origin/main..HEAD`
- Expected: commands 1-3 exit zero; status remains clean and three commits
  ahead; the final diff inventory contains only the reviewed release/audit files.
- Ordinary package-manager caches are allowed. Any tracked/generated delta,
  helper command, background process, or skipped command is `NOT OBSERVED` and
  returns `NEEDS_HELP`.

#### 2.5 Fresh factual verifier

- Receives only this milestone's rows, final diff inventory, and objective role
  outputs—not producer reasoning or prior verdicts.
- Reports every row as `OBSERVED`, `NOT OBSERVED`, or `NOT RUN` with exact
  evidence. It must not author findings, fixes, blockers, checklist marks, or a
  completion decision.

#### 2.6 Final adversarial evidence role

- After ordinary observation roles have returned, the dispatcher must:
  1. Use OpenCode's native skill tool to load `requesting-code-review`.
  2. Use OpenCode's native skill tool to load
     `verification-before-completion`.
  3. Use OpenCode's task tool with `subagent_type: "general"` to create one
     fresh isolated read-only adversarial reviewer.
- Give it only canonical requirements, `b340e26..7b0f46d`, final command
  evidence, and allowed read-only commands. Do not provide implementation
  history, prior observations, findings, fixes, or a desired answer.
- It must attempt and report objective outcomes for:
  - a malformed optional nested response that current tests would accept;
  - a missing required field represented by a legitimate zero value;
  - unsafe trust data leaking into an error;
  - a stub/mock path substituted for the real public client;
  - generated JS drift or a mismatched version owner;
  - aggregate tests staying green when a required case is forced to fail;
  - stale plan/progress/tag/SHA state or an unexpected tracked file.
- It reports attempts and observations only, never findings or readiness.

#### 2.7 M3 factual handoff

- Update the factual execution ledger below and `PROGRESS.md` after every
  material state change.
- Append exactly one mailbox response containing run ID, start/end state, roles
  and subagent IDs, exact commands/results, changed/generated/process inventory,
  every `OBSERVED` / `NOT OBSERVED` / `NOT RUN` row, producer self-check
  mismatches, skipped work, and next safe action.
- Return `READY_FOR_PRIMARY_REVIEW` only as a transport status when all literal
  work ran; it is not an acceptance verdict. Otherwise return `NEEDS_HELP`.
- Stop. Do not commit or push.

### 3. Codex final local acceptance, reconciliation, push, and main CI

- Dependencies: Milestone 2 factual handoff.
- Codex actions:
  1. Grade every observation and adversarial counterexample against this plan.
  2. Inspect the actual diff, tests, generated JS, manifests, process state, and
     temporary artifacts; classify any M3 miss through the skill-improvement
     loop.
  3. Route a demonstrated bounded correction to a fresh M3 contract; take over
     only after the applicable failure threshold.
  4. Independently repeat the critical changed-boundary test and the final
     repository gates after the tree stabilizes.
  5. Reconcile plan, progress, bugs, mailbox, checks, and ignored receipts.
  6. Commit only reviewed reconciliation/fix files, push `main` normally, and
     verify required main CI jobs for the exact pushed SHA.
- Proof: clean tree, `HEAD == origin/main`, successful main CI for that SHA, no
  unresolved finding, and Codex-checked acceptance cells.

### 4. Immutable release tag — coordinator gate

- Ownership: Codex only.
- Dependencies: Milestone 3 accepted and explicit user authorization to create
  and push `v1.6.5`.
- Preflight: local/remote tag absence, `VERSION=1.6.5`, clean tracked tree,
  `HEAD == origin/main`, and main CI success for the release SHA.
- Operation: create one annotated `v1.6.5` at the accepted SHA and push only
  `refs/tags/v1.6.5`. Never replace, delete, or force the tag.
- Proof: local and source-remote tag peel to the accepted release SHA.

### 5. Post-tag publication and clean-consumer evidence

- Dependencies: Milestone 4 and terminal tag workflows.
- This remains in the same owning plan. Codex will replace the mailbox with one
  fresh read-only M3 batch after the tag exists; no new plan is created.
- Required M3 evidence:
  - Tag `CI` and `Release Mirrors` run IDs, URLs, SHA, and job conclusions.
  - Source, Go, Laravel, and WordPress `v1.6.5` ref equality.
  - Anonymous Verdaccio metadata for `@haakco/custd-sdk@1.6.5`.
  - Fresh owner-only temporary installs/imports for Go, Verdaccio TypeScript,
    Git-source TypeScript, Python Git subdirectory, root PHP VCS, Laravel, and
    WordPress, proving the public exact-subject helper exists.
- Safety: bounded polling; no credential reads, workflow reruns, retained
  secret-bearing logs, cached/local substitutes, or deletion outside exact
  task-owned temporary directories.
- Codex independently repeats representative ref, registry, and consumer proofs.

### 6. Final completion audit and archive

- Dependencies: Milestone 5 accepted with no unresolved failure.
- Codex applies the completion-claim audit, removes disposable receipts after
  durable promotion, confirms no task-owned process/artifact remains, and runs
  final Markdown/diff checks.
- Archive this plan under
  `archive/docs/plans/<archive-timestamp>_2026-07-18_1948_exact-subject-insight-sdk-parity-plan.md`
  and update `docs/plans/main_plan.md` with no active duplicate or stale link.

## Factual Execution Ledger

M3 may update only this section; entries are observations for Codex to grade.

| Run | Role | State | Exact evidence | Files/processes |
| --- | --- | --- | --- | --- |
| `exact-subject-v165-prepush-r1` | Dispatcher preflight | `not_started` | None | None |
| `exact-subject-v165-prepush-r1` | Spec/correctness observations | `not_started` | None | None |
| `exact-subject-v165-prepush-r1` | Quality/test observations | `not_started` | None | None |
| `exact-subject-v165-prepush-r1` | Security/operations observations | `not_started` | None | None |
| `exact-subject-v165-prepush-r1` | Integrated commands | `not_started` | None | None |
| `exact-subject-v165-prepush-r1` | Fresh factual verifier | `not_started` | None | None |
| `exact-subject-v165-prepush-r1` | Adversarial evidence | `not_started` | None | None |

## Integration and Final Validation

- Test readiness: required local tools are installed; the last Codex run was
  green. M3 must still run the literal Milestone 2 commands first.
- Final local validation owner: Milestone 3 after all fixes/reconciliation.
- Post-tag validation owner: Milestone 5 after the immutable tag exists.
- Shared validation: this is the only active plan and owns the release run.
- Security gates: fail-closed response validation, safe trust errors, preserved
  auth/cancellation, secret-safe evidence, immutable exact-SHA tagging, bounded
  network/process work, and cleanup failure propagation.

## Primary-Agent Acceptance Checklist

M3 must not edit these cells.

- [x] Implementation, shared fixtures, generated TypeScript distribution, and
  synchronized `1.6.5` versions exist in local history.
- [x] BUG-009 focused Red/Green correction is committed at `7b0f46d`.
- [ ] Codex accepts the fresh pre-push spec, quality/test, security/operations,
  integrated-command, verifier, and adversarial evidence.
- [ ] Canonical plan/progress/bugs/mailbox state is truthful; old temporary
  evidence is classified and no M3 verdict substitutes for Codex grading.
- [ ] Codex independently repeats critical/final gates on the stabilized tree.
- [ ] Reviewed changes are committed and pushed; main CI passes for the exact
  release SHA.
- [ ] User explicitly authorizes and Codex creates/pushes immutable `v1.6.5`.
- [ ] Tag CI, publication/mirrors, refs, Verdaccio, and every named clean
  consumer surface pass for the release SHA/version.
- [ ] Temporary evidence is removed and the plan is archived with a truthful
  index.

## Risks and Deferred Work

- Push authorization is not granted by this plan-only request.
- Tag creation requires a separate explicit user authorization after main CI.
- GitHub, Infisical-backed workflows, Verdaccio, or public VCS availability may
  block release verification but never justify alternate publication or retag.
- Downstream application adoption is outside this SDK release.
