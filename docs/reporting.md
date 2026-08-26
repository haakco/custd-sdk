# Reporting Helpers

The SDK reporting helpers wrap Custd reporting endpoints:

- `GET /api/v1/reporting/dashboards/{key}`
- `POST /api/v1/reporting/query`
- `POST /api/v1/reporting/insights/subject`

Dashboard keys and query templates come from server-owned reporting packs. The
examples use the generic `security_operations` dashboard and `security_events`
template. The fixture catalog also retains `awthy_managed_audit_reporting` as
one seeded product configuration, not a separate SDK code path.

The helper returns client-safe `trust` diagnostics when Custd includes them.
SDKs reject diagnostics containing raw payloads, SQL, tokens, secrets, stack
traces, email/IP/hostname/order/cart identifiers.

Exact-subject insights accept only a server-owned template, one pseudonymous
subject, and either `rangeDays` or a complete `from`/`to` window. They do not
accept arbitrary filters or tenant identifiers.

## TypeScript

```ts
const dashboard = await client.reporting.dashboard("security_operations");
const widget = await client.reporting.query({
  template: "security_events",
  metrics: ["event_count"],
  dimensions: ["severity"],
  rangeDays: 7,
});
console.log(widget.trust?.status);

const insight = await client.reporting.subjectInsight({
  template: "subject_insight_subject",
  subject: "subject-42",
  rangeDays: 14,
});
console.log(insight.data.value.value);
```

`reporting.query()` returns the server-rendered `RenderedWidgetData` contract.
It includes the summary value, bounded buckets, comparison values, and safe
trust diagnostics; clients do not need to rebuild aggregation or freshness
rules. Use the dependency-free state helpers when adapting a query library or
UI:

```ts
import {
  getReportingViewState,
  reportingQueryKey,
} from "@haakco/custd-sdk";

const request = {
  template: "security_events",
  metrics: ["event_count"],
  rangeDays: 7,
};
const queryKey = reportingQueryKey(request);
const widget = await client.reporting.query(request);
const view = getReportingViewState({
  status: "success",
  data: widget,
});
```

The view state preserves previous data while a refresh or bounded retry is in
flight and distinguishes `empty`, `ready`, `stale`, `partial`,
`stale_partial`, and `unavailable`. A React application owns placement,
wording, and theme; it should pass this state to the optional
`@haakco/custd-react` display component instead of adding its own polling,
cache, aggregation, or recovery rules. The core SDK deliberately has no React
dependency, so the same state model can be used by web, native, and server
consumers. The React package accepts an app-owned query function or existing
TanStack Query result and never receives Custd browser credentials.

Install the optional package alongside the core SDK and your existing React
Query/React versions:

```bash
pnpm add @haakco/custd-sdk @haakco/custd-react @tanstack/react-query react
```

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

`CustdReportingState` renders accessible status/alert feedback for loading,
error, unavailable, empty, stale, partial, stale/partial, and ready results.
Use `labels`, `renderState`, and `className` for consumer wording and styling.

## Go

```go
dashboard, err := client.Reporting.Dashboard(ctx, "security_operations")
widget, err := client.Reporting.Query(ctx, custd.ReportingQueryRequest{
    Template: "security_events",
    Metrics: []string{"event_count"},
    Dimensions: []string{"severity"},
    RangeDays: 7,
})

insight, err := client.Reporting.SubjectInsight(ctx, custd.SubjectInsightRequest{
    Template: "subject_insight_subject",
    Subject: "subject-42",
    RangeDays: 14,
})
```

## PHP

```php
$dashboard = $client->reporting()->dashboard("security_operations");
$widget = $client->reporting()->query([
    "template" => "security_events",
    "metrics" => ["event_count"],
    "dimensions" => ["severity"],
    "rangeDays" => 7,
]);

$insight = $client->reporting()->subjectInsight([
    "template" => "subject_insight_subject",
    "subject" => "subject-42",
    "rangeDays" => 14,
]);
```

## Python

```python
dashboard = client.reporting.dashboard("security_operations")
widget = client.reporting.query({
    "template": "security_events",
    "metrics": ["event_count"],
    "dimensions": ["severity"],
    "rangeDays": 7,
})

insight = client.reporting.subject_insight({
    "template": "subject_insight_subject",
    "subject": "subject-42",
    "rangeDays": 14,
})
```
