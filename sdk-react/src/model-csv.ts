import { type AppModelQuantity, type AppModelRun, modelRunSummaryCsv } from "@haakco/custd-sdk/browser";

/**
 * Saves a run's per-quantity summary (mean, spread, percentiles or failure) as a CSV file the
 * browser downloads. Pass the version's quantities to include their units.
 */
export function downloadSummaryCsv(
  run: Pick<AppModelRun, "quantities" | "runUuid">,
  options: { quantities?: AppModelQuantity[]; filename?: string } = {},
): void {
  const blob = new Blob([modelRunSummaryCsv(run, options.quantities)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = options.filename ?? `model-run-${run.runUuid}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  // Revoke after the click has been handled, or some browsers cancel the download.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
