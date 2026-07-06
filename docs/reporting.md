# Reporting Helpers

The SDK reporting helpers wrap Custd reporting endpoints:

- `GET /api/v1/reporting/dashboards/{key}`
- `POST /api/v1/reporting/query`

Awthy managed reporting uses dashboard key `awthy_managed_audit_reporting`
and templates such as `awthy_secure_checkout_flow`.

The helper returns client-safe `trust` diagnostics when Custd includes them.
SDKs reject diagnostics containing raw payloads, SQL, tokens, secrets, stack
traces, email/IP/hostname/order/cart identifiers.

## TypeScript

```ts
const dashboard = await client.reporting.dashboard("awthy_managed_audit_reporting");
const widget = await client.reporting.query({
  template: "awthy_secure_checkout_flow",
  metrics: ["flow_completion_rate"],
  rangeDays: 7,
});
console.log(widget.trust?.status);
```

## Go

```go
dashboard, err := client.Reporting.Dashboard(ctx, "awthy_managed_audit_reporting")
widget, err := client.Reporting.Query(ctx, custd.ReportingQueryRequest{
	Template: "awthy_secure_checkout_flow",
	Metrics: []string{"flow_completion_rate"},
	RangeDays: 7,
})
```

## PHP

```php
$dashboard = $client->reporting()->dashboard("awthy_managed_audit_reporting");
$widget = $client->reporting()->query([
    "template" => "awthy_secure_checkout_flow",
    "metrics" => ["flow_completion_rate"],
    "rangeDays" => 7,
]);
```

## Python

```python
dashboard = client.reporting.dashboard("awthy_managed_audit_reporting")
widget = client.reporting.query({
    "template": "awthy_secure_checkout_flow",
    "metrics": ["flow_completion_rate"],
    "rangeDays": 7,
})
```
