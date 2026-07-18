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
