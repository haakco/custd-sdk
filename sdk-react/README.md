# Custd React reporting helpers

`@haakco/custd-react` is the optional React layer for Custd reporting. It
adapts TanStack Query results to the core SDK's server-owned reporting state
model and provides a small accessible state display.

The core `@haakco/custd-sdk` remains framework-neutral. This package does not
create a Custd client, make requests, or receive browser credentials. The
consumer owns authentication and supplies a query function or existing
`UseQueryResult`.

## Install

```bash
pnpm add '@haakco/custd-sdk@github:haakco/custd-sdk#v3.43.3&path:/sdk-js' \
  '@haakco/custd-react@github:haakco/custd-sdk#v3.43.3&path:/sdk-react'
```

Use the same released tag for both packages. These examples were verified on
2026-11-15 against **3.43.3**. Keep the application's installed React 18/19 and
TanStack Query 5 peers; do not install a different React copy for this helper.
GitHub tags with checked-in distributions are the publication owner, not a
private registry. The state-display component renders DOM elements and is for
web applications; native apps use the core SDK and authenticated backend relay.

## Query and display

```tsx
import { CustdReportingState, useCustdReportingQuery } from "@haakco/custd-react";

const report = useCustdReportingQuery({
  queryKey: ["report", request],
  queryFn: () => appApi.reporting.query(request),
});

return (
  <CustdReportingState view={report.view} onRetry={() => report.refetch()}>
    {(data) => <ReportChart data={data} />}
  </CustdReportingState>
);
```

Use `getCustdReportingViewState(query)` or
`useCustdReportingViewState(query)` when the application already owns the
TanStack Query call. `getCustdReportingDisplayState(view)` returns one of
`loading`, `error`, `unavailable`, `empty`, `stale`, `partial`,
`stale_partial`, or `ready`.

`CustdReportingState` preserves useful stale/partial data for the consumer's
content renderer, renders semantic `status` or `alert` feedback, and only
shows the retry button when Custd marks the result retryable. Consumers own
placement, wording, and styling through `labels`, `renderState`, and
`className`.
