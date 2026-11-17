import { type CSSProperties } from "react";
import type { ChartFormatters, ForecastChartData } from "./forecast-types.js";
export type ForecastChartLabels = {
    zoomIn: string;
    zoomOut: string;
    panEarlier: string;
    panLater: string;
    reset: string;
    zoomToData: string;
    fullScreen: string;
    controls: string;
    empty: string;
    noForecast: string;
    /** The visible range, read out as it changes. */
    range: (start: string, end: string) => string;
};
export type ForecastChartProps = ChartFormatters & {
    data: ForecastChartData;
    /** Names the chart; the default summary starts with it. */
    title: string;
    /** Replaces the generated text alternative. */
    summary?: string;
    labels?: Partial<ForecastChartLabels>;
    /** Drawing size in SVG units; the chart scales to its container width. */
    width?: number;
    height?: number;
    className?: string;
    style?: CSSProperties;
};
export declare function ForecastChart({ data, title, summary, labels: labelOverrides, formatDate, formatValue, width, height, className, style, }: ForecastChartProps): import("react").JSX.Element;
