# Exact-Subject Insight SDK Parity Plan

**Status:** Active; implementation, local validation, push, and main CI are
complete. The `v1.6.5` tag-triggered release, publication verification, and
archive closeout remain.

**Goal:** Release the contract-compatible exact-subject reporting helper in
every public Custd SDK under the single shared `v1.6.5` version, verify every
consumer-visible release surface, and archive this completed plan.

**Acceptance criteria:** The exact-subject implementation remains green on the
release commit; `v1.6.5` points to that commit; tag CI and every required
publication workflow succeed; the source repository, Verdaccio package, Go,
Laravel, and WordPress mirrors, root PHP VCS package, and Python/TypeScript Git
subdirectory installs resolve `v1.6.5`; no credentials enter retained evidence;
and the archived plan plus plan index truthfully record the final state.

## Current State (Verified)

- Before this plan update, `main`, `origin/main`, and `origin/HEAD` pointed to
  release commit `b340e26dbfbb297fd0651760f5111d0a87efb3ec` with a clean working
  tree. This plan update and its M3 mailbox are the only expected planning
  deltas until closeout.
- `VERSION`, `sdk-go/VERSION`, `sdk-js/package.json`,
  `sdk-python/pyproject.toml`, and `sdk-php/composer.json` declare `1.6.5`.
- Commit `954f2a0` implements the shared fixtures, documentation, changelog,
  generated TypeScript distribution, and TypeScript, Go, Python, and PHP
  helpers. Commit `b340e26` stabilizes the Go cancellation proof.
- GitHub Actions CI run `29661610991` passed for `b340e26` on `main` on
  2026-07-18.
- Neither the local repository nor `origin` currently has `v1.6.5`.
- `.github/workflows/ci.yml` gates tag/version equality, runs all SDK checks,
  publishes `@haakco/custd-sdk` to Verdaccio, and optionally notifies
  Packagist. PHP consumers use the public root VCS repository rather than
  requiring Packagist.
- `.github/workflows/release-mirrors.yml` publishes the same tag to
  `haakco/custd-sdk-go`, `haakco/custd-sdk-laravel`, and
  `haakco/custd-sdk-wordpress` through Infisical-backed credentials.
- Python and the preferred TypeScript install path use the source repository
  tag with their package subdirectory. Python has no separate PyPI publication.
- OpenCode exposes `minimax-coding-plan/MiniMax-M3`; the coordinator must still
  verify that its `thinking` variant resolves to M3 adaptive reasoning before
  dispatch.

## Plan-Affecting Findings

- The implementation and version bump are already committed and pushed, so no
  source change, new dependency, release commit, or additional version bump is
  required.
- Tag creation and push mutate GitHub and trigger secret-bearing release jobs.
  MiniMax-M3 must not perform or approve them. The primary coordinator performs
  the exact tag operation only after explicit user authority and a clean
  pre-release audit.
- Publication surfaces are not equivalent. Verdaccio needs a registry query;
  mirror packages need remote tag and package-manager resolution checks; root
  PHP, Python, and TypeScript Git consumers need clean temporary installs from
  the source tag. A workflow success alone is supporting evidence, not the
  consumer-visible acceptance proof.
- `publish-packagist` may intentionally exit successfully when its secrets are
  absent. This is not a blocker because repository documentation declares the
  root PHP package VCS-installed; the acceptance proof is a Composer VCS
  resolution of `v1.6.5`, not a Packagist listing.
- The stale mirror-token warning in `docs/plans/main_plan.md` is already marked
  resolved by `v1.6.4`. Closeout must preserve that truthful resolved state and
  remove only the active-plan entry.
- This is Tier D for the external tag/publication boundary and Tier A for M3's
  read-only audits and command evidence. There is no remaining behavior edit,
  so Red/Green TDD is complete and must not be fabricated for release work.
- Batch 1 completed all four serialized M3 roles, but its fresh verifier recorded
  7 `OBSERVED` and 3 `NOT OBSERVED` rows. The failed rows were: unexpected
  audit-harness/work-log paths beyond the declared starting delta; an overly
  literal changelog row requiring the word `parity` even though the changelog
  describes the contract-compatible helper across every SDK; and the combined
  lint/diff gate, where repository-wide Markdown lint included `.opencode/` and
  temporary receipts, failed, and prevented `diff-check` from running.
- The failed Batch 1 audit is not release authorization. Before Milestone 2,
  remove or relocate the repository-local OpenCode harness and temporary
  receipts, retain only approved durable planning evidence, correct the Markdown
  in any retained `PROGRESS.md`/`BUGS.md` files, replace the changelog row with a
  semantic check for exact-subject helper coverage, and run a fresh complete M3
  audit plus Codex's independent rerun. Both `just test` and
  `just lint-workflows lint-markdown diff-check` must exit zero, with an ending
  delta matching the reviewed start state.

## MiniMax-M3 Execution Contract

Use the canonical
`haakco-opencode-minimax-m3` skill from
`~/Dev/HaakCo/AiProjects/skills/skills/haakco-opencode-minimax-m3/`.
The primary coordinator owns decisions, authorization, grading, plan updates,
release mutation, and archival. M3 executes the exact bounded evidence batches
first and reports facts without a completion verdict.

- Mailbox: `docs/plans/sub_agent/m3.md`. It contains exactly one active batch.
  M3 appends its factual response and receipt reference; it never clears the
  mailbox or edits this plan.
- Receipts: one immutable, single-writer ignored path per non-trivial run under
  `docs/tmp/m3-runs/`. Codex promotes verified facts here, then removes the
  temporary receipt.
- Harness: resolve the model with `opencode models`, verify
  `minimax-coding-plan/MiniMax-M3` plus `--variant thinking` maps to adaptive
  M3 reasoning, and omit `--auto` for every release batch.
- Command integrity: run literal commands unchanged. No appended shell
  operators, pipes, redirects, helpers, exit probes, unlisted commands,
  unrelated skills/MCP servers, dependency installation outside named clean
  consumer probes, or Git mutation.
- Recovery: preserve exact evidence, inspect partial filesystem and child
  process state, and use a fresh tightened contract after a classified failure.
  Stop after three failed correction loops. Confirm the prior OpenCode PID and
  children exited before retry or coordinator takeover.
- Unknowns: return `NEEDS_HELP` with the unknown, evidence checked, completed
  work, changed files/processes, and smallest required fact. Never guess.

## Milestones

### 1. Read-only pre-release acceptance audit

- Ownership: M3 thin dispatcher with fresh, serialized read-only roles; no role
  may write tracked files or contact a package registry.
- Dependencies: clean `main` at `b340e26`; mailbox Batch 1; model/variant
  preflight.
- Roles:
  - Release-state role verifies starting status, commit/ref equality, absence of
    `v1.6.5`, version-manifest equality, changelog presence, and successful main
    CI evidence.
  - Validation role runs `just test`, then
    `just lint-workflows lint-markdown diff-check`, with no command mutation.
  - Release-contract role reads only the two workflows, install documentation,
    and version-sync test and inventories the exact tag-triggered jobs and
    consumer surfaces. It does not assess readiness.
  - Fresh evidence verifier receives acceptance rows and receipts, not producer
    reasoning, and reports `OBSERVED`, `NOT OBSERVED`, or `NOT RUN` only.
- Proof: exact command receipts, starting/ending status, process inventory, no
  delta beyond the pre-existing plan/index files and the required mailbox
  append, and all pre-release rows observed.
- Review: Codex independently inspects the evidence and repeats `just test` and
  `just lint-workflows lint-markdown diff-check`. Any source/test failure or
  unexpected delta keeps the release open and is diagnosed before tagging.
- Batch 1 evidence (2026-07-18): all four roles and the mailbox append completed;
  `just test` passed, while the verifier reported rows 1, 5, and 8 as
  `NOT OBSERVED`. Codex independently repeated `just test` successfully and the
  combined lint/diff command unsuccessfully; Markdown lint reported 650 errors
  from repository-local harness/receipt/work-log files and `diff-check` did not
  run.
- Required remediation and rerun:
  1. Classify the Batch 1 artifacts as durable evidence, next-batch input, or
     disposable; remove disposable receipts after promoting their facts here.
  2. Move or remove `.opencode/` from the repository worktree so third-party
     dependency Markdown cannot enter repository lint or starting-state scope.
  3. Fix Markdown violations in any retained `PROGRESS.md`, `BUGS.md`, mailbox,
     or other durable audit artifact.
  4. Change the fresh verifier's changelog acceptance row to require semantic
     evidence that the changelog documents contract-compatible exact-subject
     reporting helpers across all public SDKs; do not require a magic word.
  5. Dispatch a fresh M3 pre-release audit from the corrected, explicitly
     inventoried start state. Require every acceptance row to be `OBSERVED` and
     require both validation commands to exit zero, including an actually run
     `diff-check`.
  6. Codex independently reruns both commands after inspecting the fresh
     evidence and records the final starting/ending delta. Milestone 1 remains
     open until this succeeds.

### 2. Create and push the immutable release tag

- Ownership: primary coordinator only; M3 has no Git mutation or external-state
  authority.
- Dependencies: Milestone 1 accepted and explicit user authority to create and
  push `v1.6.5`.
- Starting-state checks:
  - `git status --short --branch` is aligned with `origin/main`; only the
    reviewed plan/index/mailbox evidence deltas may be present.
  - `git rev-parse HEAD`, `git rev-parse origin/main`, and the recorded release
    SHA all equal `b340e26dbfbb297fd0651760f5111d0a87efb3ec`.
  - `git tag -l v1.6.5` and
    `git ls-remote --tags origin refs/tags/v1.6.5` confirm the tag is
    absent. An existing mismatched tag is a blocker; do not overwrite it.
  - `VERSION` and every hardcoded manifest still equal `1.6.5`.
- Implementation after authority: create an annotated `v1.6.5` tag at the
  verified release SHA and push only `refs/tags/v1.6.5` to `origin`. Never
  force, retag, push `main`, or expose credentials.
- Proof: local and remote `v1.6.5` resolve to the recorded release SHA.
- Recovery: if push fails before the remote ref exists, preserve the local tag
  and diagnose authentication/network state. If the remote ref exists, treat it
  as immutable and verify its SHA before any retry. Never delete or overwrite a
  published tag without new explicit authority.

### 3. Verify tag CI and publication surfaces

- Ownership: M3 read-only evidence roles run only after the coordinator confirms
  the tag exists. External-state reads are serialized; no worker triggers,
  reruns, cancels, publishes, installs credentials, or changes GitHub state.
- Dependencies: Milestone 2; GitHub workflows have reached terminal state.
- Readiness and bounded wait: query the tag-triggered `CI` and
  `Release Mirrors` runs every 30 seconds for at most 20 minutes. Continue only
  when both are completed. On timeout or failure, record run URLs and failed job
  names and stop with `NEEDS_HELP`; do not rerun remotely.
- Roles and proofs:
  - GitHub role verifies tag CI jobs, including `release-guard`, SDK checks,
    `publish-js`, the PHP publication job's actual skip/publish message, and all
    three mirror matrix jobs. It records run IDs, URLs, conclusions, head SHA,
    and head branch without logs containing secrets.
  - Remote-ref role verifies `v1.6.5` on the source, Go, Laravel, and WordPress
    repositories. The source tag must resolve to `b340e26`; mirror tags must
    exist. It records object/commit IDs for reproducibility.
  - Verdaccio role runs an anonymous metadata query for
    `@haakco/custd-sdk@1.6.5` against
    `https://verdaccio.k8.haak.co/` and confirms the returned package version is
    exactly `1.6.5`.
  - Consumer-probe role uses one fresh `mktemp -d` workspace per ecosystem and
    verifies clean, pinned installs/resolution for Go from
    `github.com/haakco/custd-sdk-go@v1.6.5`; root PHP from the source VCS tag;
    Laravel and WordPress from their mirror tags; Python from the source Git
    subdirectory; and TypeScript from the source Git `path:/sdk-js`. It imports
    or resolves each exact-subject public helper/type using public package
    entrypoints. It removes only its exact temporary directories after recording
    redacted results.
  - Fresh evidence verifier receives only the acceptance rows, exact command
    results, ref IDs, workflow URLs, and consumer probe receipts. It reports
    facts without findings or a verdict.
- Proof: all workflows succeed or have an explicitly accepted non-publication
  status consistent with the documented VCS contract, every required tag and
  registry version exists, and every clean consumer probe resolves `1.6.5` and
  the intended public API.
- Review: Codex grades the evidence, independently repeats the source/mirror ref
  checks, Verdaccio metadata query, and representative clean consumer probes,
  then records exact evidence here. Any missing package, mismatched tag,
  failed/expired workflow, credential exposure, or substituted/cached install
  keeps the plan open.

### 4. Independent completion audit and archive

- Ownership: fresh isolated review roles are read-only; Codex integrates their
  observations and is the only completion grader/editor.
- Dependencies: Milestone 3 accepted; no unresolved release failure.
- Reviews:
  - Spec/correctness traces the canonical release commit, shared version, tag,
    workflow results, and every documented consumer install surface.
  - Quality/evidence checks exact commands, clean-install strength, cached or
    substituted results, skipped checks, changed-file inventory, and truthful
    plan/checklist state.
  - Defensive security/operations checks secret absence from argv, environment
    evidence, logs and files; HTTPS transport; bounded polling/network work;
    temporary directory modes and cleanup; immutable tag handling; and external
    mutation scope.
  - Evidence integration reconciles starting/ending status, workflow URLs,
    registry/ref data, temporary artifacts, receipts, failures, and checklist
    cells without making an acceptance decision.
  - Final adversarial review uses a fresh isolated OpenCode `general` task with
    a direct read-only contract; it does not depend on unavailable
    `requesting-code-review` or `verification-before-completion` skills. The
    contract enumerates tag/SHA mismatch, false-green workflow, unavailable
    package, cached install, missing public API, secret retention, and plan-state
    contradiction counterexamples and requires command/evidence observations
    only. Codex independently applies this plan's Completion-Claim Audit and
    makes the completion decision.
- Proof: Codex applies the completion-claim audit below using fresh evidence,
  reruns `just test` and `git diff --check` once after the tree stabilizes, and
  confirms no temporary receipts or unexpected processes/files remain.
- Archive implementation: update all checklist cells and final evidence; obtain
  the local archive timestamp; move this file to
  `archive/docs/plans/<YYYY-MM-DD_HHMM>_2026-07-18_1948_exact-subject-insight-sdk-parity-plan.md`;
  remove its Active entry from `docs/plans/main_plan.md`; add it under a dated
  Archived heading with the verified release summary and relative link; keep
  the resolved mirror-token status; and ensure no active duplicate remains.
- Archive proof: `rg` finds no stale active link or pending-release claim,
  `just lint-markdown diff-check` passes, and the final diff contains only the
  archive move, plan index update, and any previously approved durable evidence.

## Integration and Final Validation

- Test readiness: local tooling is exercised by `just`; GitHub access is
  read-only through `gh`; Verdaccio supports anonymous reads; package-manager
  probes use public repositories and fresh temporary directories. Any probe that
  requires a new credential stops rather than placing a secret in the command,
  environment evidence, or filesystem.
- Acceptance run: M3 runs the exact bounded batch first; Codex independently
  repeats the critical commands. Required local gates are `just test`,
  `just lint-workflows lint-markdown diff-check`, and final `git diff --check`.
  Required operational evidence is the source tag SHA, terminal tag CI and
  mirror-workflow results, anonymous Verdaccio `1.6.5` metadata, all four remote
  repository tags, and clean pinned consumer resolution for every SDK surface.
- Safety limits: no force operations, tag replacement, workflow reruns,
  credential reads, package publication commands, production traffic, or
  persistent consumer changes. Poll for at most 20 minutes. Temporary probes
  may delete only their exact `mktemp -d` paths.
- Shared validation: this plan owns the release acceptance run; no dependent
  plan currently shares it. Downstream adoption is outside this repository's
  release completion unless separately requested.
- Retained artifacts: the archived plan retains command summaries, run URLs,
  commit/tag IDs, package versions, and redacted failures. Raw logs, credentials,
  temporary install trees, and task receipts are not retained.

## Completion-Claim Audit

### Canonical behavior

- [x] The exact release commit and every version owner are traced.
- [ ] The tag-triggered release composition ran without substituting main CI.
- [ ] Clean consumer installs use pinned `v1.6.5` and public package entrypoints.
- [ ] No duplicate, overwritten, cached-only, or already-drained publication is
  substituted for the real release.

### Failure and validation semantics

- [x] Tag/version mismatch and failed workflow states are known to fail closed.
- [ ] Workflow/job failure propagates to the final release decision.
- [x] Verifiers inspect semantic SHA/version/API results, not artifact presence.
- [x] Local aggregate tests have prior mutation evidence and pass on the exact
  release commit; any unverified regression keeps this plan open.
- [ ] Cached or partial results are identified and not used as sole proof.

### Security and operational boundary

- [ ] External reads and publication use the repository's HTTPS/GitHub paths.
- [ ] Secrets are absent from argv, retained environment/log evidence, plans,
  receipts, temporary files after cleanup, and committed files.
- [ ] Retained evidence is redacted and temporary consumer trees are inventoried
  and removed.
- [ ] Network polling, waits, retries, and child-process cleanup are bounded.
- [ ] External mutation is limited to the explicitly authorized source tag and
  its workflow-owned publications.
- [ ] A cleanup or publication failure keeps the release incomplete and remains
  recorded.

### Plan and handoff consistency

- [ ] Starting/ending deltas classify every tracked, generated, temporary, and
  token-like file.
- [ ] Exact final gates ran; substitutions, failures, and skips are listed.
- [ ] Plan cells, blockers, deferred work, archive path, and index agree.
- [ ] Every remaining milestone has its required evidence and review.
- [ ] Codex, not M3, permits the completion claim.

## Terminal Checklist

- [x] Shared exact-subject fixtures cover required, optional, and invalid cases.
- [x] TypeScript, Go, Python, and PHP helpers pass focused Red/Green tests.
- [x] JS generated distribution matches source and declarations.
- [x] `1.6.5` is committed and pushed on `main`.
- [x] Main CI passed for release commit `b340e26`.
- [ ] M3 pre-release audit and Codex independent rerun pass with no delta.
- [ ] Explicit authority is recorded and immutable `v1.6.5` is pushed once.
- [ ] Tag CI and all required publication/mirror jobs reach accepted terminal
  states for the release SHA.
- [ ] Verdaccio, source, Go, Laravel, WordPress, PHP, Python, and TypeScript
  consumer-visible `1.6.5` resolution is verified.
- [ ] Independent spec, quality/evidence, security/operations, integration, and
  adversarial completion audits pass.
- [ ] Temporary receipts/probe trees are removed and final local gates pass.
- [ ] The plan is timestamp-archived and `docs/plans/main_plan.md` has no stale
  active or mirror-token status.

## Risks and Deferred Work

- Release tag creation is intentionally blocked until explicit user authority.
- GitHub/Infisical/Verdaccio availability can block publication without
  justifying a second tag or alternate release path.
- Downstream application adoption, including any Tiao pin, is not required to
  release or archive this SDK plan and needs separate repository scope.
