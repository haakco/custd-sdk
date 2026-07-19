# Custd SDK — Active Run Problems

**Run ID:** `exact-subject-v165-prepush-r1`
**Owner:** Codex

Record only problems discovered during the active M3 run that are not already
owned by the exact-subject completion plan. M3 may report observations in the
mailbox but must not edit this file or decide severity, blocking status, or
resolution.

## Open

None.

## Reconciled Before This Run

- BUG-009 is resolved by `7b0f46d`; durable evidence is in the owning plan.
- Earlier audit-state and `.opencode` findings are resolved or superseded.
- The old repository-local `.skills/` finding is stale: canonical catalog skill
  discovery is the current owner and no local vendor directory is required.
