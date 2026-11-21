import { type AppModelQuantity, type AppModelRun } from "@haakco/custd-sdk/browser";
/**
 * Saves a run's per-quantity summary (mean, spread, percentiles or failure) as a CSV file the
 * browser downloads. Pass the version's quantities to include their units.
 */
export declare function downloadSummaryCsv(run: Pick<AppModelRun, "quantities" | "runUuid">, options?: {
    quantities?: AppModelQuantity[];
    filename?: string;
}): void;
