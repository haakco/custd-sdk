# SDK 3.66 Consumer Adoption Plan

**Status (2026-11-26):** Proposed, for another team.

**Goal:** Every project that uses a Custd SDK runs on the release that closes route parity (`v3.66.0`,
published by the [SDK API parity automation plan](./2026-11-26_0006_sdk-api-parity-automation_plan.md)),
with its own checks green and no local copy of an SDK.

**Already handled in the parity delivery:** every consumer with a checkout on the shared
development server. That covers Custd (custdctl, loadgen, the frontend and the lifecycle proof),
Hosting (API and frontend), Vorrent, done-when-app and dzine-canvas, tracked as M7 of the parity
plan. This plan
covers what that server cannot see: consumers with no local checkout, and an organisation-wide
check that nothing was missed.

## Why this is needed

`v3.66.0` breaks public shapes on purpose, because Custd is pre-live and keeps no compatibility layers:

- Subject exports, privacy erasures and retention had invented shapes in every SDK. They now match
  the server, and their methods changed.
- Prediction lists, privacy identifier mappings, producer lists and report exports return envelopes.
- Some methods gained parameters: subject-export `limit` and `scope`, `companySlug` on erasures,
  `parentCompanySlug` on data spaces, and a typed options struct for admin user lists.
- Producer `metadata` is removed in every SDK, because the server never had it.
- The offboarding receipt carries `requested_by_kind`.
- PHP `Provisioning\Client` takes and returns typed DTOs.
- Python's `read_lifecycle_fixture` and the shared `contract-fixtures/lifecycle/` are removed.

The full list per SDK is in that release's changelog entry under `docs/changelog/`.

## Known consumers (checked 2026-11-26 from local checkouts)

| Project | SDK | Pinned at | Notes |
| --- | --- | --- | --- |
| Vorrent | Go | `v3.64.8` | Auth-domain calls |
| Vorrent media cache | Go | `v3.59.0` | Error capture |
| Vorrent frontend, mobile, shared | JS | `v3.43.3` | Error capture only; very stale |
| done-when-app | JS + React | `v3.64.4` | Missing UTM capture (3.64.6) |
| done-when-app CLI | Rust | `v3.64.3` | App items |
| dzine-canvas | JS (release tarball) | `v3.64.8` | |
| TrackLab | unknown | unknown | No local checkout; this team's first job |
| Awthy | PHP (via Strauss) and others | unknown | No local checkout; uses audit and provisioning |
| `laravel-package`, `wordpress-plugin` | PHP | follow the tag | In the custd-sdk repository; check their `haakco/custd-sdk` constraint admits `^3.66` |

## Steps

1. **Find every consumer.** Search the HaakCo GitHub organisation for `custd-sdk`,
   `haakco/custd-sdk`, `custd-sdk-go`, `@haakco/custd-sdk` and `@haakco/custd-react`. Add anything
   missing to the table above.
2. **For each consumer:**
   - Read its own `AGENTS.md`.
   - Bump to `v3.66.0` using its normal dependency command; never a local `file:` or path replacement.
   - Fix the call sites the changes above hit.
   - Run its focused checks, then commit and push using that repository's delivery rules.
3. **Record the result here:** the project, the commit, the checks run and anything blocked.

**Proof:** each consumer's own focused checks pass on the bumped version. For a deployed consumer,
its normal deployment smoke test also passes.

## Done when

- Every row above names a commit on `v3.66.0`, or a recorded reason it does not use the SDK.
- This plan is archived.
