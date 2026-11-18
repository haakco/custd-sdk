import type { AppModelQuantityResult } from "@haakco/custd-sdk/browser";
import type { CSSProperties } from "react";
export type QuantityHistogramLabels = {
    empty: string;
    failed: (detail: string) => string;
    summary: (mean: string, low: string, high: string) => string;
    bin: (low: string, high: string, count: number) => string;
    mean: string;
    interval: string;
};
export type QuantityHistogramProps = {
    result: AppModelQuantityResult;
    title: string;
    unit?: string;
    formatValue?: (value: number) => string;
    labels?: Partial<QuantityHistogramLabels>;
    width?: number;
    height?: number;
    className?: string;
    style?: CSSProperties;
};
/** One quantity's samples as bars, with its mean and its 5th–95th percentile interval marked. */
export declare function QuantityHistogram({ result, title, unit, formatValue, labels: overrides, width, height, className, style, }: QuantityHistogramProps): import("react").JSX.Element;
