import type { CSSProperties } from "react";
import type { ArrivalHistogramData } from "./forecast-types.js";
export type ArrivalHistogramLabels = {
    empty: string;
    never: (neverCount: number, total: number) => string;
    bin: (start: string, end: string, count: number) => string;
};
export type ArrivalHistogramProps = {
    /** `counter.detail.arrivalHistogram`. */
    histogram: ArrivalHistogramData;
    /** Bins ending on or before the deadline are drawn as on time. */
    deadline?: string;
    title: string;
    summary?: string;
    labels?: Partial<ArrivalHistogramLabels>;
    formatDate?: (epochMs: number) => string;
    width?: number;
    height?: number;
    className?: string;
    style?: CSSProperties;
};
export declare function ArrivalHistogram({ histogram, deadline, title, summary, labels: labelOverrides, formatDate, width, height, className, style, }: ArrivalHistogramProps): import("react").JSX.Element;
