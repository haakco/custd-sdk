# Custd React reporting helpers

`@haakco/custd-react` is the optional React layer for Custd reporting. It
adapts TanStack Query results to the core SDK's server-owned reporting state
model and provides a small accessible state display.

It also shares an app user's browser sign-in session (see below).

The core `@haakco/custd-sdk` remains framework-neutral. The reporting helpers
do not create a Custd client or make requests: the consumer supplies a query
function or existing `UseQueryResult`. The session helpers wrap a core
`BrowserSignIn`, which holds the signed-in user's tokens in `sessionStorage`.

## Install

```bash
pnpm add @haakco/custd-sdk@^3.72.0 @haakco/custd-react@^3.72.0
```

Use the same released version for both packages; both are public on npmjs. These examples were verified on
2026-11-17 against **3.52.0**. Keep the application's installed React 18/19 and
TanStack Query 5 peers; do not install a different React copy for this helper.
GitHub tags with checked-in distributions are the publication owner, not a
private registry. The state-display component renders DOM elements and is for
web applications; native apps use the core SDK and authenticated backend relay.

## Site monitoring templates

Use the [site monitoring templates](../README.md#site-monitoring-templates) for
drop-in uptime history, Lighthouse scores, and a public status view. Each can
use your site's CSS and display copy.

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

## App user sign-in

```tsx
import { BrowserSignIn } from "@haakco/custd-sdk";
import { CustdSessionProvider, useCustdSession } from "@haakco/custd-react";

const signIn = new BrowserSignIn(config); // see the core SDK README

<CustdSessionProvider client={signIn}>
  <App />
</CustdSessionProvider>;

function Account() {
  const { status, session, error, signIn, signOut } = useCustdSession();
  if (status === "signing_in") return <p role="status">Signing in…</p>;
  if (status === "error") return <p role="alert">Sign-in failed ({error?.code}). <button onClick={() => signIn()}>Try again</button></p>;
  if (status === "signed_in") return <button onClick={() => signOut()}>Sign out</button>;
  return <button onClick={() => signIn()}>Sign in</button>;
}
```

The provider calls `restore()` on mount, which completes a sign-in redirect
and then replaces the URL with the saved `returnTo` path (override with
`onSignInComplete`), or refreshes an expired session. `status` is one of
`signed_out`, `signing_in`, `signed_in` or `error`; `session` is set only when
signed in. The consumer owns placement, wording and styling.

## Application account settings

Put the account button in the signed-in application menu. It asks the issuer for
a one-use ticket and opens hosted settings in the same tab, and settings shows a
verified **Back to <app>** link. Pass `returnPath` to choose the page that link
opens; it is recommended, and without it the link opens the app's home. Use a
fixed path such as `/mine`, never the current URL: apps keep link tokens in paths
and fragments.

```tsx
import { CustdAccountMenuItem, useCustdSession } from "@haakco/custd-react";

function AccountMenu({ issuer }: { issuer: string }) {
  const { session } = useCustdSession();
  if (!session) return null;
  return <CustdAccountMenuItem issuer={issuer} accessToken={() => session.accessToken} returnPath="/mine" />;
}
```

The page's origin must be registered for the application, which a hosted app's
is. Without React, call `openAppAccountSettings` from `@haakco/custd-sdk/browser`
with the same options.

Read and change the signed-in member's profile with the current app profile client:

```tsx
import { CurrentAppProfileClient } from "@haakco/custd-sdk/browser";

const profile = new CurrentAppProfileClient({
  apiBaseUrl: "https://api.custd.com",
  accessToken: getCurrentAppAccessToken,
});
const { fields, managedPhoto } = await profile.read();
const photo = managedPhoto ? await profile.readPhoto() : null;
```

The access token getter returns the signed-in member's current application
grant with the `profile` scope. On a gateway-owned session, keep the forwarded
grant on the app server and read the profile there. The field policy reports
which values can be edited. Use `uploadPhoto` and `removePhoto` for a managed
photo, and release any object URL the app creates from a returned blob. When importing
existing app data, `initialize` and `initializePhoto` fill only fields that
have never been written. Use the returned profile, which includes any current
value saved concurrently. A cleared value remains initialized.

A gateway-owned session keeps the app bearer on the server. There the backend
calls `createAppAccountEntry` (or Go's `CreateAppAccountEntry`) with the
forwarded bearer, the configured issuer, the registered app origin and an
optional `returnPath`. It renders the returned action and ticket as an escaped
native form on the app origin: a top-level, same-tab POST. Keep the ticket out of
URLs, logs, browser storage and cached responses.

```tsx
<form action={entry.actionUrl} method="post" target="_self">
  <input type="hidden" name="ticket" value={entry.ticket} />
  <button type="submit">Account settings</button>
</form>
```

## Hosted apps

An app Custd hosts wraps its root once. The provider calls the core
`startHostedApp` on mount, which reads `/.well-known/custd.json` and starts
tracking, error capture and sign-in as the file enables them, and stops them on
unmount.

```tsx
import { CustdHostedAppProvider, useCustdHostedApp, useCustdSession } from "@haakco/custd-react";

<CustdHostedAppProvider options={{ release: import.meta.env.VITE_COMMIT }}>
  <App />
</CustdHostedAppProvider>;

function Header() {
  const hosted = useCustdHostedApp();
  if (hosted.status !== "ready") return null; // "loading", or "error" with a typed `error.code`
  return hosted.app.signIn ? <Account /> : null; // Account calls useCustdSession()
}
```

Children render while discovery loads and when it fails, so the app never
waits on Custd. When `sign_in` is enabled the children are wrapped in
`CustdSessionProvider` once ready; call `useCustdSession` only below a ready
app with `app.signIn`. Send typed app events with
`hosted.app.trackAppEvent(name, properties)`.

### Live items and forecasts

`useAppItem(token, options)`, `useAppForecast(token, options)` (latest run,
`empty` until the first run), `useAppForecastStory(token, options)` and
`useAppModelRun(token, options)` read through the provider's `app.appItems`, or
`options.client`. `token` is a link token, or `{ item }` for an item the
signed-in user owns. They return the core watched state (`loading`, `fresh`,
`empty`, `stale`, `offline`, `error`), `idle` while the token is empty, and
`refresh()`. Components watching the same item and link on the same client
share one poller.

`useAppMeeting(token, options)` reads a meeting item's `meeting` through the
same item poller, so it adds no request beside `useAppItem` on that link; an
item of another kind is an `error` with code `app_item_wrong_kind`.

```tsx
import { useAppForecast, useAppItem } from "@haakco/custd-react";

function Counter({ shareToken }: { shareToken: string }) {
  const item = useAppItem(shareToken);
  const forecast = useAppForecast(shareToken);
  if (item.status === "error" && !item.data) return <p role="alert">{item.error.code}</p>;
  if (!("data" in item) || !item.data) return <p role="status">Loading…</p>; // idle, loading, offline first read
  return (
    <CounterView
      item={item.data}
      forecast={"data" in forecast ? forecast.data : undefined}
      stale={item.status !== "fresh"}
      updatedAt={item.lastUpdatedAt}
    />
  );
}
```

### Uncertainty models

`ModelEditor` edits a model's quantities (values, ranges, k of n, samples or
formulas) and saves a version through `onSave`; the server's `fieldErrors` land
on the quantity they name, and a cycle marks every quantity in it.
`ModelCalculator` tries other input values against a saved version: given
`access` (a link token) it calculates with `appItems.calculateModel`, which
stores nothing, and it says when the caller is rate-limited. Pass the latest run
as `baseline`; its `queuedRunFailure` shows when live inputs changed but the
queued run failed. `QuantityHistogram`, `SensitivityView` and `MeasureNextPanel`
draw a run's results, sensitivity and value of information, and
`downloadSummaryCsv` saves its summary.

```tsx
const run = useAppModelRun(shareToken);
const baseline = "data" in run ? run.data : undefined;
<ModelCalculator version={version} inputs={["price"]} outputs={["revenue"]} access={shareToken} baseline={baseline} />;
```

In tests, `CustdFakeHostedAppProvider` from `@haakco/custd-react/testing`
starts the provider against a `FakeCustd` from `@haakco/custd-sdk/testing`, so
the hooks above run with no network:

```tsx
const fake = new FakeCustd();
render(<CustdFakeHostedAppProvider fake={fake}><App /></CustdFakeHostedAppProvider>);
```

## Forecast charts

`ForecastChart`, `ConvergenceStory` and `ArrivalHistogram` draw Custd
measurement forecasts as plain SVG with no chart library. Their props use the
analytics API's forecast field names, so a response passes straight through:

```tsx
import { ArrivalHistogram, ConvergenceStory, ForecastChart } from "@haakco/custd-react";

<ForecastChart
  title="Signups"
  data={{
    observations,                                   // [{ at, value }]
    target: project.targetValue,
    deadline: project.deadline,
    completionMedian: run.percentiles.p50,
    completionInterval: run.counter?.completionInterval,
    forecastFrom: run.forecastFrom,
    posteriorLines: run.counter?.detail.posteriorLines,
  }}
/>
<ArrivalHistogram title="Arrival" histogram={run.counter.detail.arrivalHistogram} deadline={project.deadline} />
<ConvergenceStory title="Delivery" estimates={story.delivery.estimates} targetDate={story.delivery.targetDate} staleAfterDays={7} />
```

- `ForecastChart` has zoom, pan, reset, zoom-to-data and full-screen buttons,
  plus drag-to-pan. Escape leaves full screen. The visible range
  is announced politely, and zoom animates only when the user has not asked for
  reduced motion. The median line and the band run from the latest
  measurement to the target at the median date and at the interval ends.
- Clients own the wording and the theme. Wording comes through `labels`,
  `formatDate` and `formatValue`. The theme comes through `className`, `style`
  and these CSS variables, which fall back to `currentColor`:
  `--custd-chart-observed`, `--custd-chart-forecast`, `--custd-chart-band`,
  `--custd-chart-target`, `--custd-chart-deadline`, `--custd-chart-trail`,
  `--custd-chart-grid`, `--custd-chart-late`, `--custd-chart-stale` and
  `--custd-chart-surface` (the full-screen background).
- Each chart has an empty state, and `ForecastChart` also shows a
  measurements-only state. Each has a `role="img"` text alternative that can be
  overridden with `summary`.
