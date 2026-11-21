import { useAppItem } from "@haakco/custd-react";
import { errorText } from "./errors";
import { Forecast } from "./Forecast";

/** The read-only page a share link opens. */
export function SharePage({ shareToken }: { shareToken: string }) {
  const item = useAppItem(shareToken);
  if (item.status === "loading" || item.status === "idle") return <p role="status">Loading the counter…</p>;
  if (!("data" in item) || !item.data) {
    return (
      <div role="alert" className="notice error">
        <h1>This link does not open a counter</h1>
        <p>{item.status === "error" ? errorText(item.error) : "Custd did not answer."}</p>
        <p>The link may have been replaced, or the counter removed after a long time without changes.</p>
      </div>
    );
  }
  const project = item.data.measurementProject;
  return (
    <>
      <header>
        <h1>{project?.name}</h1>
        <p className="muted">Target: {project?.target?.targetValue}. This page updates by itself.</p>
      </header>
      <Forecast token={shareToken} />
    </>
  );
}
