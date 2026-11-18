import type { AppModelInputSensitivity, AppModelSensitivity } from "@haakco/custd-sdk/browser";
import type { CSSProperties } from "react";
export type SensitivityViewLabels = {
    empty: string;
    heading: (output: string) => string;
    correlation: (value: string) => string;
    direction: (positive: boolean) => string;
    scatter: (input: string, output: string) => string;
};
export type SensitivityViewProps = {
    sensitivity: AppModelSensitivity | undefined;
    /** How many of the strongest inputs get a scatter plot. Default 3. */
    scatterInputs?: number;
    labels?: Partial<SensitivityViewLabels>;
    className?: string;
    style?: CSSProperties;
};
/** Orders inputs by the strength of their rank correlation with the output, strongest first. */
export declare function rankSensitivityInputs(inputs: readonly AppModelInputSensitivity[]): AppModelInputSensitivity[];
/** The inputs that move one output most, as signed bars, with small scatter plots for the top few. */
export declare function SensitivityView({ sensitivity, scatterInputs, labels: overrides, className, style, }: SensitivityViewProps): import("react").JSX.Element;
