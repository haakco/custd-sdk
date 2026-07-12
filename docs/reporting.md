# Reporting Helpers

The SDK reporting helpers wrap Custd reporting endpoints:

- `GET /api/v1/reporting/dashboards/{key}`
- `POST /api/v1/reporting/query`

Dashboard keys and query templates come from server-owned reporting packs. The
examples use the generic `security_operations` dashboard and `security_events`
template. The fixture catalog also retains `awthy_managed_audit_reporting` as
one seeded product configuration, not a separate SDK code path.

The helper returns client-safe `trust` diagnostics when Custd includes them.
SDKs reject diagnostics containing raw payloads, SQL, tokens, secrets, stack
traces, email/IP/hostname/order/cart identifiers.

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
```
