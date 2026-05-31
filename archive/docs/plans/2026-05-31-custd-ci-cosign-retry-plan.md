# Custd CI Cosign Retry Harness Fix Plan

**Goal:** Fix the failing Custd `ci-policy` check so the SDK producer parity work can be validated without blocking on the cosign retry fixture.

**Background:** Custd main run `26709977081` has `ci-policy` failed while the overall run remains queued. The failing job is `78718285346` at <https://github.com/haakco/custd/actions/runs/26709977081/job/78718285346>. The failed step is `scripts/test-ci-optimizations.sh`, specifically the nested `scripts/test-cosign-attest-with-retry.sh` fixture.

**Architecture:** This is a Custd repository CI-harness fix, not an SDK behavior fix. The SDK team should open a focused branch in `/Volumes/Dev/HaakCo/AiProjects/custd`, fix the retry test/wrapper there, and leave SDK package code unchanged unless a separate SDK issue is discovered.

**Tech Stack:** Bash, GitHub Actions, self-hosted HaakCo runners, cosign retry wrapper.

**Parallel Work Model:** One small CI team can own this end to end. Do not mix this with SDK producer API work or ingest cleanup work.

Last verified: 2026-05-31

## Completion Note

Archived after the Custd CI retry harness fix was implemented in `/Volumes/Dev/HaakCo/AiProjects/custd`.
The SDK package code did not need changes. Local validation passed in both repositories:

- Custd: `scripts/test-cosign-attest-with-retry.sh`, `scripts/test-ci-optimizations.sh`, `just test`, `just lint`, `git diff --check`.
- Custd SDK: `just test`, `just check`, `git diff --check`.

---

## Current State (Verified)

**Files examined in Custd:**

- `scripts/test-ci-optimizations.sh` — calls `scripts/test-cosign-attest-with-retry.sh` as part of the `ci-policy` guard.
- `scripts/test-cosign-attest-with-retry.sh` — creates a fake `cosign` binary, makes the first call emit `Error: signing image: stream error: stream ID 1; INTERNAL_ERROR; received from peer`, and expects the wrapper to retry once.
- `scripts/cosign-attest-with-retry.sh` — captures `cosign attest` output through process substitution and greps a temp log for retryable text.

**Observed CI failure:**

```text
Run scripts/test-ci-optimizations.sh
Error: signing image: stream error: stream ID 1; INTERNAL_ERROR; received from peer
Process completed with exit code 1.
```

**Key finding:**

- The emitted error matches the retryable regex in `scripts/cosign-attest-with-retry.sh`.
- Local context previously showed `scripts/test-ci-optimizations.sh` passing, so the likely bug is a CI timing/harness issue around process substitution log capture. The retry classifier may grep the temp log before the `tee` process has flushed the fake `cosign` stderr.

**Branch safety:**

- Work in the Custd repo, not this SDK repo, for implementation.
- Do not use `git stash`, `git reset`, or worktrees.
- Keep the fix scoped to CI scripts/tests unless investigation proves otherwise.

---

## Success Criteria

- `scripts/test-cosign-attest-with-retry.sh` reliably retries the fake retryable cosign error in CI and locally.
- `scripts/test-ci-optimizations.sh` passes locally in `/Volumes/Dev/HaakCo/AiProjects/custd`.
- The Custd `ci-policy` job passes on GitHub Actions.
- The fix preserves non-retry behavior for permanent cosign errors.
- No GitHub-hosted runners are introduced; HaakCo workflows remain self-hosted only.

---

## Task 1: Reproduce and Inspect

**Files:**

- Read: `/Volumes/Dev/HaakCo/AiProjects/custd/scripts/cosign-attest-with-retry.sh`
- Read: `/Volumes/Dev/HaakCo/AiProjects/custd/scripts/test-cosign-attest-with-retry.sh`
- Read: `/Volumes/Dev/HaakCo/AiProjects/custd/scripts/test-ci-optimizations.sh`

### Step 1: Confirm the Failing CI Log

Run in Custd:

```bash
gh run view 26709977081 --repo haakco/custd --json status,conclusion,jobs --jq '{status, conclusion, failed: [.jobs[] | select(.conclusion != "" and .conclusion != "success") | {name,status,conclusion,databaseId,url}]}'
gh api repos/haakco/custd/actions/jobs/78718285346/logs | tail -n 120
```

Expected: `ci-policy` failed at `scripts/test-ci-optimizations.sh` with the fake cosign stream error.

### Step 2: Run the Local Fixture

```bash
scripts/test-cosign-attest-with-retry.sh
scripts/test-ci-optimizations.sh
```

Expected: likely PASS locally. If it fails locally, fix from that concrete failure.

---

## Task 2: Fix the Retry Wrapper Capture

**Files:**

- Modify: `/Volumes/Dev/HaakCo/AiProjects/custd/scripts/cosign-attest-with-retry.sh`
- Test: `/Volumes/Dev/HaakCo/AiProjects/custd/scripts/test-cosign-attest-with-retry.sh`

**Recommended fix:**

Avoid process substitution for the retry decision path. Capture `cosign attest` output into a variable or file synchronously, then print it and classify it. A safe shape:

```bash
set +e
output="$(cosign attest "$@" 2>&1)"
status=$?
set -e
printf '%s\n' "$output" | tee "$log_file"
```

Then keep the existing retryability check against `$log_file`.

**Why:** process substitution can leave the log file write racing the next shell statement. The retry decision must not depend on an asynchronously written log.

**Keep unchanged:**

- Retryable regex semantics unless investigation shows a missing known retryable class.
- `COSIGN_ATTEST_ATTEMPTS`
- `COSIGN_ATTEST_RETRY_DELAY_SECONDS`
- `COSIGN_ATTEST_SUPPRESS_RETRY_WARNING`
- Permanent error behavior.

---

## Task 3: Strengthen Tests

**Files:**

- Modify: `/Volumes/Dev/HaakCo/AiProjects/custd/scripts/test-cosign-attest-with-retry.sh`

Add assertions that prove:

- retryable stream error is retried exactly once and succeeds on attempt 2;
- permanent `invalid predicate type` fails after exactly one attempt;
- wrapper preserves the original failing exit status for permanent errors.

If practical, add a fake cosign mode that emits a large stderr payload before the retryable line to make buffering/race behavior harder to miss.

---

## Task 4: Validate

Run in Custd:

```bash
scripts/test-cosign-attest-with-retry.sh
scripts/test-ci-optimizations.sh
git diff --check
```

If CI workflows are touched, also run:

```bash
rg -n "runs-on:" .github/workflows .github/actions
```

Expected: every HaakCo job remains on `self-hosted`; no `ubuntu-latest`, `ubuntu-*`, `macos-latest`, or `windows-latest`.

---

## Task 5: Ship and Monitor

Commit in Custd:

```bash
git add scripts/cosign-attest-with-retry.sh scripts/test-cosign-attest-with-retry.sh scripts/test-ci-optimizations.sh
git commit -m "fix(ci): make cosign retry test deterministic"
git push
```

Then monitor:

```bash
gh run list --repo haakco/custd --limit 10
gh run view <new-run-id> --repo haakco/custd --json status,conclusion,jobs
```

Expected: `ci-policy` passes.

---

## Handoff Notes

- This plan exists in `custd-sdk` only to unblock SDK parity coordination. The implementation belongs in the Custd repo.
- Do not mark `docs/plans/2026-05-31-sdk-producer-parity-plan.md` complete until the Custd CI run is green.
- After this is green, continue checking Custd plans:
  - `/Volumes/Dev/HaakCo/AiProjects/custd/docs/plans/2026-05-31-sdk-producer-parity-plan.md`
  - `/Volumes/Dev/HaakCo/AiProjects/custd/docs/plans/2026-05-31-ingest-api-internal-cleanup-plan.md`
