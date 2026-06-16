# Deferred: Split Framework Packages into Separate Repos

**Status:** Deferred (approved: "for now monorepo, well split out later" — tim@haak.co, 2026-06-16).
**Source plan:** [SDK Package Split & Packaging Hardening](../2026-06-16-sdk-package-split-and-hardening_plan.md).

## Why deferred

The packaging hardening made the root `composer.json` a clean pure-PHP package and
gave `laravel-package/` and `wordpress-plugin/` their own standalone, split-ready
`composer.json`. The user chose to keep a single monorepo for now and physically
split into separate GitHub repos later. No code rework is required for the split —
only repo plumbing — so it is safe to defer.

## What remains

A private repo consumed via Composer VCS exposes exactly one package (its root
`composer.json`). Today only `haakco/custd-sdk` (pure PHP) is cleanly installable
from this repo root, and `publish-packagist` notifies Packagist for that one URL.
To publish/consume `haakco/custd-laravel` and `haakco/custd-wordpress` as first-class
packages, each needs its own repo (or a subtree-split mirror).

Two options when the time comes:
- **A. Three real repos** — `git filter-repo` `laravel-package/` and `wordpress-plugin/`
  into new repos; drop the `repositories: path` block (resolve `haakco/custd-sdk`
  from VCS/Packagist instead); add CI + Packagist hooks per repo.
- **B. Monorepo + subtree-split** — keep developing here; add tooling
  (`symplify/monorepo-builder` or a `git subtree split` job) that pushes each
  subtree to a read-only mirror repo Packagist watches.

## Completion criteria

- `haakco/custd-laravel` and `haakco/custd-wordpress` installable by downstreams
  without a local path repo.
- Each has independent CI (self-hosted runners) + release tagging.
- The `version` pin in `sdk-php/composer.json` (the path-repo shim) is removed
  once the path repo is gone.
- `docs/plans/main_plan.md` updated; this plan archived on completion.

## Risk until done

Laravel/WordPress packages are not cleanly VCS-installable from the monorepo root;
interim consumption is via a Composer `path` repo or the post-split repos.
