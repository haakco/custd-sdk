import type { SiteUptimeHistory } from "@haakco/custd-sdk";
import { type QueryKey } from "@tanstack/react-query";
import { type MonitoringAppearance } from "./monitoring-section.js";
import { type DailyUptimeChartProps, type UptimeResponseChartProps } from "./uptime-charts.js";
declare const defaultLabels: {
    title: string;
    range: string;
    daily: string;
    response: string;
    last24h: string;
    last7d: string;
    last30d: string;
    loading: string;
    error: string;
    refreshError: string;
    retry: string;
    noData: string;
};
export type SiteUptimePanelProps = MonitoringAppearance & {
    /** Include the domain and the application's tenant/session scope, without any credentials. */
    queryKey: QueryKey;
    loadHistory: (responseDays: number, signal: AbortSignal) => Promise<SiteUptimeHistory>;
    ranges?: readonly {
        days: number;
        label: string;
    }[];
    initialDays?: number;
    labels?: Partial<typeof defaultLabels>;
    formatPercent?: (percent: number) => string;
    dailyChart?: Omit<DailyUptimeChartProps, "days">;
    responseChart?: Omit<UptimeResponseChartProps, "hours">;
};
export declare function SiteUptimePanel({ queryKey, loadHistory, ranges, initialDays, labels, formatPercent, className, style, dailyChart, responseChart, }: SiteUptimePanelProps): import("react").JSX.Element;
export {};
