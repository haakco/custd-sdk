# Workflow timing reference journey

One released-SDK journey that proves the external workflow timing contract works end to end from a consuming
application. It is deliberately Hosting-shaped but provider-neutral: the workflow key, the phase keys and the dimension
key describe hosting work in general, so a different provider or product maps the same contract without changing a
primitive.

Nothing here is Custd-internal. The journey consumes `haakco/custd-sdk` from its GitHub repository at a released
version — never a local checkout, `path` repository or workspace link — so it is a real adoption test rather than a
mirror of the implementation.

## What it proves

| Proof | Why a consumer depends on it |
| --- | --- |
| The declaration is idempotent | A redeploy that repeats the same shape must not fork the duration series |
| The run is readable with both attempts of a retried phase | A retry is a separate attempt, never a rewrite of the first |
| A first run is described without an interval | A cold start must not look like a supported forecast |
| Redelivery adds no duration fact | A retry after an outage must not inflate history |
| Reporting survives Custd being unreachable | The consumer's own work must not depend on Custd's availability |
| Recovery drains the projection | The supported repair path is a bounded rebuild, and it needs no SQL |

## Run it

The consumer needs a machine credential holding `measurement.prediction.read` and `measurement.prediction.admin` for
its tenant.

```bash
composer install
CUSTD_BASE_URL=https://custd.example \
CUSTD_TOKEN=<machine credential> \
CUSTD_COMPANY_SLUG=<tenant slug> \
php reference-journey.php
```

`CUSTD_UNAVAILABLE_BASE_URL` overrides the unreachable endpoint used by the outage proof (default `http://127.0.0.1:1`);
`CUSTD_ACTOR_REF` overrides the reported actor reference. Exit status is `0` only when every proof passed, and the
banner names the released package version the run exercised.

The Go collector example lives next to the Go SDK: `sdk-go/examples/workflow-timing`.

## Layout

| Path | Purpose |
| --- | --- |
| `hosting-reconcile.json` | The declared shape and the phase plan the run observes |
| `src/HostingFixture.php` | Loads the fixture and derives the reported facts from it |
| `src/PendingTimingReport.php` | Spools facts locally so a Custd outage does not fail the consumer's work |
| `src/ReferenceJourney.php` | The proofs |
| `src/Proofs.php` | Named assertions that report every failure and set the exit status |

## What this journey is not

It is not the consumer integration. Hosting owns its own job graph, scheduling, authorization and UI; this example only
demonstrates the Custd-facing slice, and it runs as a single process rather than as a queued worker. The Laravel
package's `RecordWorkflowTimingObservations` job is the queue-safe form of the reporting step for a Laravel consumer.
