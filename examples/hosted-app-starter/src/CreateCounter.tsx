import {
  APP_FORECAST_METHODS,
  APP_ITEM_KINDS,
  APP_MEASUREMENT_PROJECT_KINDS,
  type AppItemCreateRequest,
  type AppItemsClient,
} from "@haakco/custd-sdk/browser";
import { type FormEvent, useState } from "react";
import { errorText } from "./errors";
import { ownerUrl, rememberShareToken } from "./links";

/** The forecast method the owner page asks for after each measurement. */
export const FORECAST_METHOD = APP_FORECAST_METHODS.bayesianLinearRegression;

export function counterRequest(name: string, target: number): AppItemCreateRequest {
  return {
    kind: APP_ITEM_KINDS.measurementProject,
    measurementProject: {
      kind: APP_MEASUREMENT_PROJECT_KINDS.deadlineForecast,
      name,
      series: [{ seriesCode: "value", name, unitSlug: "unitless", completionDirection: "increase", source: "manual" }],
      target: { targetCode: "done", name, targetValue: target, state: "active" },
    },
  };
}

export function CreateCounter({ items }: { items: AppItemsClient }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    try {
      const created = await items.createItem(
        counterRequest(String(form.get("name")).trim(), Number(form.get("target"))),
      );
      rememberShareToken(created.item.item.itemUuid, created.shareToken);
      window.location.assign(ownerUrl(created.ownerToken));
    } catch (failure) {
      setError(errorText(failure));
      setBusy(false);
    }
  }

  return (
    <form className="card" onSubmit={create} aria-describedby={error ? "create-error" : undefined}>
      <h1>New counter</h1>
      <p>Count towards a target and get a live forecast of when you will reach it.</p>
      <label htmlFor="name">What are you counting?</label>
      <input id="name" name="name" required maxLength={120} autoComplete="off" />
      <label htmlFor="target">Target</label>
      <input id="target" name="target" type="number" required min={1} step="any" inputMode="decimal" />
      <button type="submit" disabled={busy}>
        {busy ? "Creating…" : "Create counter"}
      </button>
      {error && (
        <p id="create-error" role="alert" className="error">
          Could not create the counter: {error}
        </p>
      )}
    </form>
  );
}
