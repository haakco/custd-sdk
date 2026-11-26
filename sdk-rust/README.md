# custd SDK (Rust)

A blocking, typed client for the Custd API. It covers the public Custd operations in the
operation snapshot (`contract-fixtures/api/operations.json`), all but `POST
/api/v1/cleanup/jobs/{uuid}/proof`, which the ingest API answers by cancelling the job:

- the Admin API: tenants, users and roles, OAuth clients and admissions, impersonation and support
  access, apps, auth projects, producers, data spaces and scopes, data labels, event types, Sites,
  measurement, time plans, workflow timings, reporting packs, jobs and scheduled tasks, storage,
  usage, audit, accounting, privacy, retention, offboarding, subject exports, campaign email,
  notifications, error issues and the tenant manifest;
- the Analytics API: reporting, event queries, measurement reads and prepared data;
- the schema registry (event schemas and parsers) and the ingest API (events, raw lines,
  monitoring, diagnostics and cleanup plans and jobs);
- the hosted-app item routes under `/api/v1/app/` (items, meetings, alerts and forecasts);
- RFC 8628 device-code login, which works the same way as `custdctl login --method device`.

`contract-fixtures/api/coverage/rust.json` lists the operations the route conformance test proves.

## Install

The crate is not on crates.io. Add it as a git dependency, pinned to a release tag:

```toml
[dependencies]
custd-sdk = { git = "https://github.com/haakco/custd-sdk", tag = "v3.52.0" }
```

It uses `ureq` with rustls (ring), `serde` and `serde_json`. It has no async runtime and no
OpenSSL. Size settings such as `opt-level = "z"`, `lto`, `strip` and `panic = "abort"` belong in
the consuming binary's `[profile.release]`.

## Usage

```rust
use custd_sdk::{CustdClient, DeviceLogin, MeasurementForecastRunRequest};

let login = DeviceLogin {
    issuer_url: "https://auth.custd.com".into(),
    client_id: "<public client id>".into(),
    scopes: vec!["openid".into(), "offline_access".into()],
    audience: Some("custd".into()),
};
let token = login.run(|code| {
    println!("Open {} and enter {}", code.verification_uri, code.user_code);
})?;

let client = CustdClient::new("https://api.custd.com", token.access_token);
let projects = client.list_measurement_projects(None)?;
let forecast = client.run_measurement_forecast(
    &projects.projects[0].project_uuid,
    &MeasurementForecastRunRequest::default(),
)?;
```

`base_url` is the API edge origin, such as `https://api.custd.com` (or `https://api.dev.custd.com`
locally), which routes both the Admin and Analytics API paths.

Hosted-app links need no login, only the app's Site key and one of its allowed origins:

```rust
use custd_sdk::{AppClient, AppReadOptions, Conditional};

let app = AppClient::new("https://api.custd.com", "<site key>", "https://counter.apps.custd.com");
let link = app.link("<owner or share token>");
if let Conditional::Modified { etag, value } = link.read(&AppReadOptions::default())? {
    println!("version {} (etag {etag:?})", value.item.version);
}
```

`AppClient::with_user_token` adds the signed-in user's access token (`X-Custd-User-Token`) to every
call: `list_my_items()` reads "my items", `link(owner_token).claim()` takes ownership, and
`owned_item(item_uuid)` reaches an owned item with no link. Links also cover `forecast_story`,
meetings (`start_meeting`, `advance_meeting(block_uuid)`, `end_meeting`) and alerts
(`alert_settings`, `add_alert_rule`, `add_alert_webhook`, `subscribe_alert_email`,
`alert_deliveries` and their removals). `ApiError::code()` names a refusal, such as
`APP_ITEM_MEETING_STEP_REFUSED` or `APP_ALERT_NO_VERIFIED_EMAIL`.
`read_hosted_app_discovery(app_origin)` reads `/.well-known/custd.json`, and
`AppClient::from_discovery` builds a client from it.

A Site's public write key collects events and captures errors without a login:

```rust
use custd_sdk::{EventEnvelope, SiteCollector};

let site = SiteCollector::new("https://api.custd.com", "<site_pk_ key>", "https://www.example.com")?;
let receipt = site.collect_event(&EventEnvelope { /* … */ ..Default::default() })?;
```

A system administrator acting for a client company on the ingest cleanup-job routes names it with
`CustdClient::with_acting_company(slug)`; it is sent as `X-Custd-Effective-Company` on those calls
only, and the server requires an active support grant for that company.

Event batches check that every sent event has exactly one result and that `success` agrees with
the results. Observation imports check that every row has a result and that every accepted row
has an `observationUuid`. An HTTP 202 on its own is not treated as success. A non-success answer
becomes `Error::Api`, carrying its RFC 9457 problem details.

## Develop

```bash
just test-rust   # cargo fmt --check, clippy -D warnings, cargo test
```

The crate version is the release version. `scripts/bump-version.sh` moves it, and
`X-Custd-Sdk: rust/<version>` is derived from it at compile time.
