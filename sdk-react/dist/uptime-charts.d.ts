import type { SiteResponseHour, SiteUptimeDay, SiteUptimeWindow } from "@haakco/custd-sdk";
import type { CSSProperties } from "react";
/** Round down so a missed check never displays as 100%. */
export declare function uptimePercent({ checks, upChecks }: SiteUptimeWindow): number | undefined;
export type DailyUptimeChartProps = {
    days: readonly SiteUptimeDay[];
    className?: string;
    style?: CSSProperties;
    label?: string;
    emptyLabel?: string;
    formatDayLabel?: (day: SiteUptimeDay) => string;
};
export declare function DailyUptimeChart({ days, className, style, label, emptyLabel, formatDayLabel, }: DailyUptimeChartProps): import("react").JSX.Element;
export type UptimeResponseChartProps = {
    hours: readonly SiteResponseHour[];
    className?: string;
    style?: CSSProperties;
    emptyLabel?: string;
    averageLabel?: string;
    slowestLabel?: string;
    formatSummary?: (metrics: {
        averageMs: number;
        slowestMs: number;
    }) => string;
    formatTime?: (timestamp: string) => string;
};
export declare function UptimeResponseChart({ hours, className, style, emptyLabel, averageLabel, slowestLabel, formatSummary, formatTime, }: UptimeResponseChartProps): import("react").JSX.Element;
