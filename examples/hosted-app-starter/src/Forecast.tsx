import { useAppForecast } from "@haakco/custd-react";
import type { AppForecastRun } from "@haakco/custd-sdk/browser";
import { errorText } from "./errors";

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

/** The counter's latest forecast, kept fresh by the SDK while the page is open. */
export function Forecast({ token }: { token: string }) {
  const forecast = useAppForecast(token);
  return (
    <section className="card" aria-labelledby="forecast-heading" aria-live="polite">
      <h2 id="forecast-heading">Forecast</h2>
      {forecast.status === "loading" && <p role="status">Loading the forecast…</p>}
      {(forecast.status === "empty" || ("data" in forecast && forecast.data === null)) && (
        <p>No forecast yet. It appears after the first measurements; three give a completion date.</p>
      )}
      {"data" in forecast && forecast.data && <ForecastResult run={forecast.data} />}
      {(forecast.status === "stale" || forecast.status === "offline") && (
        <p role="status" className="muted">
          Showing the last forecast received. Reconnecting…
        </p>
      )}
      {forecast.status === "error" && (
        <div role="alert" className="error">
          <p>Could not load the forecast: {errorText(forecast.error)}</p>
          <button type="button" onClick={forecast.refresh}>
            Try again
          </button>
        </div>
      )}
    </section>
  );
}

function ForecastResult({ run }: { run: AppForecastRun }) {
  const interval = run.counter?.completionInterval;
  return (
    <>
      {interval ? (
        <p className="headline">
          Likely reaches the target between <strong>{dateFormat.format(new Date(interval.lower))}</strong> and{" "}
          <strong>{dateFormat.format(new Date(interval.upper))}</strong> ({Math.round(interval.confidence * 100)}%
          range).
        </p>
      ) : (
        <p className="headline">Not enough of a trend yet for a completion date.</p>
      )}
      <p className="muted" data-testid="forecast-inputs">
        Based on {run.inputCount} {run.inputCount === 1 ? "measurement" : "measurements"}, updated{" "}
        {dateFormat.format(new Date(run.generatedAt))}.
      </p>
      {run.warnings && run.warnings.length > 0 && (
        <ul className="muted">
          {run.warnings.map((warning) => (
            <li key={warning.code}>{warning.message}</li>
          ))}
        </ul>
      )}
    </>
  );
}
