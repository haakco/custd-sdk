# Browser tracker page context and delivery

The JavaScript browser tracker now accepts two optional config hooks.

- `pageContext({ path, title })` returns the page context to send, so an
  application can send a normalized route template such as
  `/companies/:companySlug/board` instead of the address bar path and can omit
  `document.title`. A path that is not a safe route path is replaced with the
  built-in sanitized path, so a full URL or a path carrying a query never
  reaches the collector. A provider that throws sends no page context.
- `onFailure(failure)` observes automatic tracking failures as sanitized
  descriptions (`source`, `status`, `rejectedEvents`), because those call sites
  absorb their own rejections instead of raising them into the host page.

SPA tracking sends a page view only when the route path changes, so a
`pushState` or `replaceState` that rewrites only the query string no longer
counts as a new page.

The tracker now reads the collector's per-event batch results. Events the
collector permanently rejects are dropped instead of being retried forever and
are reported through `onFailure`; events that failed with a retryable status
stay queued. A 2xx batch answer whose body does not match the collector contract
is not treated as delivered, so its events remain queued.
