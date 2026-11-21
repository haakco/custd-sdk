import { useAppItem } from "@haakco/custd-react";
import type { AppItemRead, AppItemsClient } from "@haakco/custd-sdk/browser";
import { type FormEvent, useState } from "react";
import { FORECAST_METHOD } from "./CreateCounter";
import { errorText } from "./errors";
import { Forecast } from "./Forecast";
import { rememberedShareToken, rememberShareToken, shareUrl } from "./links";

type Props = { items: AppItemsClient; ownerToken: string };

/** The page only the owner link opens: add measurements and share a read-only link. */
export function OwnerPage({ items, ownerToken }: Props) {
  const item = useAppItem(ownerToken);
  if (item.status === "loading" || item.status === "idle") return <p role="status">Loading the counter…</p>;
  if (!("data" in item) || !item.data) {
    return (
      <div role="alert" className="notice error">
        <h1>This owner link does not open a counter</h1>
        <p>{item.status === "error" ? errorText(item.error) : "Custd did not answer."}</p>
        <p>
          <a href="/">Start a new counter</a>
        </p>
      </div>
    );
  }
  const project = item.data.measurementProject;
  return (
    <>
      <header>
        <h1>{project?.name}</h1>
        <p className="muted">
          Target: {project?.target?.targetValue}. Keep this page's address private: it can change the counter.
        </p>
      </header>
      <AddMeasurement items={items} ownerToken={ownerToken} />
      <Forecast token={ownerToken} />
      <ShareLink items={items} ownerToken={ownerToken} read={item.data} />
    </>
  );
}

function AddMeasurement({ items, ownerToken }: { items: AppItemsClient; ownerToken: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const value = Number(new FormData(formElement).get("value"));
    setBusy(true);
    setMessage(null);
    try {
      const result = await items.addMeasurements(ownerToken, {
        rows: [{ observedAt: new Date().toISOString(), value }],
      });
      const refused = result.results?.find((row) => !row.success);
      if (result.rejected > 0 || refused) {
        setMessage({ text: `Custd did not keep it: ${refused?.detail ?? refused?.title ?? "refused"}`, error: true });
        return;
      }
      formElement.reset();
      setMessage({ text: `Saved ${value}.`, error: false });
      await items.runForecast(ownerToken, { method: FORECAST_METHOD }).catch((failure: unknown) => {
        setMessage({ text: `Saved ${value}, but the forecast did not update: ${errorText(failure)}`, error: true });
      });
    } catch (failure) {
      setMessage({ text: `Could not save it: ${errorText(failure)}`, error: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card" onSubmit={add}>
      <h2>Add a measurement</h2>
      <label htmlFor="value">Count now</label>
      <input id="value" name="value" type="number" required step="any" inputMode="decimal" />
      <button type="submit" disabled={busy}>
        {busy ? "Saving…" : "Add measurement"}
      </button>
      {message && (
        <p role={message.error ? "alert" : "status"} className={message.error ? "error" : "muted"}>
          {message.text}
        </p>
      )}
    </form>
  );
}

function ShareLink({ items, ownerToken, read }: { items: AppItemsClient; ownerToken: string; read: AppItemRead }) {
  const itemUuid = read.item.itemUuid;
  const [token, setToken] = useState(() => rememberedShareToken(itemUuid));
  const [status, setStatus] = useState<string | null>(null);
  const url = token ? shareUrl(token) : null;

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setStatus("Link copied.");
    } catch {
      setStatus("Copying was blocked. Select the link and copy it yourself.");
    }
  }

  // The share token is shown once, at create. A new one replaces it; the old link stops working.
  async function replace() {
    const shareLink = read.links?.find((link) => link.role === "share");
    if (!shareLink) return setStatus("This counter has no share link to replace.");
    try {
      const rotated = await items.rotateLink(ownerToken, shareLink.linkUuid);
      rememberShareToken(itemUuid, rotated.token);
      setToken(rotated.token);
      setStatus("New share link made. The old one no longer works.");
    } catch (failure) {
      setStatus(`Could not make a new link: ${errorText(failure)}`);
    }
  }

  return (
    <section className="card" aria-labelledby="share-heading">
      <h2 id="share-heading">Share</h2>
      {url ? (
        <>
          <label htmlFor="share-url">Read-only link</label>
          <div className="row">
            <input id="share-url" readOnly value={url} onFocus={(event) => event.currentTarget.select()} />
            <button type="button" onClick={copy}>
              Copy link
            </button>
          </div>
        </>
      ) : (
        <>
          <p>This browser does not have the share link. Making a new one turns off the old one.</p>
          <button type="button" onClick={replace}>
            Make a new share link
          </button>
        </>
      )}
      {status && (
        <p role="status" className="muted">
          {status}
        </p>
      )}
    </section>
  );
}
