import type { AppModelDecision, AppModelInformation } from "@haakco/custd-sdk/browser";
import type { CSSProperties } from "react";
export type MeasureNextPanelLabels = {
    title: string;
    noDecision: string;
    recommendation: (recommended: "act" | "hold", actProbability: string) => string;
    decision: (output: string, threshold: string) => string;
    suggested: (input: string) => string;
    nothingWorthwhile: string;
    certaintyWorth: (value: string) => string;
    inputWorth: (value: string) => string;
};
export type MeasureNextPanelProps = {
    /** `run.information`; absent when the run had no decision. */
    information: AppModelInformation | undefined;
    /** `run.decision`, to say what was decided. */
    decision?: AppModelDecision;
    formatValue?: (value: number) => string;
    labels?: Partial<MeasureNextPanelLabels>;
    className?: string;
    style?: CSSProperties;
};
/** The decision's recommendation and the inputs ranked by what knowing each exactly is worth. */
export declare function MeasureNextPanel({ information, decision, formatValue, labels: overrides, className, style, }: MeasureNextPanelProps): import("react").JSX.Element;
