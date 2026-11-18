import { useCustdHostedApp } from "@haakco/custd-react";
import type { AppItemsClient } from "@haakco/custd-sdk/browser";
import { CreateCounter } from "./CreateCounter";
import { pageFor } from "./links";
import { OwnerPage } from "./OwnerPage";
import { SharePage } from "./SharePage";

export function App() {
  const hosted = useCustdHostedApp();
  return (
    <main className="page">
      {hosted.status === "loading" && <p role="status">Starting…</p>}
      {hosted.status === "error" && (
        <div role="alert" className="notice error">
          <h1>This app can't reach Custd</h1>
          <p>
            {hosted.error.message} ({hosted.error.code}). The app reads its settings from{" "}
            <code>/.well-known/custd.json</code>, which Custd serves once the app is deployed with{" "}
            <code>custdctl apps deploy</code>.
          </p>
        </div>
      )}
      {hosted.status === "ready" && !hosted.app.appItems && (
        <div role="alert" className="notice error">
          <h1>App data is turned off</h1>
          <p>Turn on the app data capability for this app in Custd, then reload.</p>
        </div>
      )}
      {hosted.status === "ready" && hosted.app.appItems && <Pages items={hosted.app.appItems} />}
    </main>
  );
}

function Pages({ items }: { items: AppItemsClient }) {
  const page = pageFor(window.location.href);
  switch (page.name) {
    case "create":
      return <CreateCounter items={items} />;
    case "owner":
      return <OwnerPage items={items} ownerToken={page.token} />;
    case "share":
      return <SharePage shareToken={page.token} />;
    case "not_found":
      return (
        <div className="notice">
          <h1>Page not found</h1>
          <p>
            Check the link you were sent, or <a href="/">start a new counter</a>.
          </p>
        </div>
      );
  }
}
