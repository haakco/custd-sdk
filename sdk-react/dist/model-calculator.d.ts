import { type AppItemAccess, type AppItemsClient, type AppModelInput, type AppModelQuantityResult, type AppModelQueuedRunFailure, type AppModelVersion } from "@haakco/custd-sdk/browser";
import { type CSSProperties } from "react";
/** One input value the calculator tries, in place of the saved one, for this run only. */
export type ModelCalculatorInput = {
    name: string;
    input: AppModelInput;
};
/** A run over a saved version with some inputs replaced. It must never save a version. */
export type ModelCalculatorRequest = {
    versionNumber: number;
    inputs: ModelCalculatorInput[];
    outputs: string[];
};
/** A calculation's results, or a latest run's, which may say its queued live-input run failed. */
export type ModelCalculatorResult = {
    quantities: AppModelQuantityResult[] | null;
    queuedRunFailure?: AppModelQueuedRunFailure;
};
export type ModelCalculatorLabels = {
    inputs: string;
    outputs: string;
    calculate: string;
    calculating: string;
    unavailable: string;
    failed: string;
    limited: string;
    queuedRunFailed: (failure: AppModelQueuedRunFailure) => string;
    notCalculated: string;
    formulaRefused: string;
    output: (mean: string, low: string, high: string) => string;
};
export type ModelCalculatorProps = {
    version: AppModelVersion;
    /** The input quantities the form offers; bound and formula quantities are skipped. */
    inputs: string[];
    /** The quantities whose results it shows. */
    outputs: string[];
    /** Results shown before the first calculation, such as the latest run. */
    baseline?: ModelCalculatorResult;
    /**
     * Runs the version with the form's values without saving anything. Defaults to the client's
     * `calculateModel` when `access` is given; absent both, the form is read-only.
     */
    calculate?: (request: ModelCalculatorRequest) => Promise<ModelCalculatorResult>;
    /** The item's link token, or `{ item }` for a signed-in owner; any link may calculate. */
    access?: AppItemAccess;
    /** Defaults to the `CustdHostedAppProvider` app's `appItems`. */
    client?: AppItemsClient;
    labels?: Partial<ModelCalculatorLabels>;
    className?: string;
    style?: CSSProperties;
};
/** A form over chosen inputs and outputs of a saved version. Calculating never changes the model. */
export declare function ModelCalculator({ version, inputs, outputs, baseline, calculate: given, access, client, labels: overrides, className, style, }: ModelCalculatorProps): import("react").JSX.Element;
