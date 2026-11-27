import type { SiteUptimeHistory, SiteUptimeWindow } from "@haakco/custd-sdk";
import { type QueryKey, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { type MonitoringAppearance, MonitoringMetrics, MonitoringSection } from "./monitoring-section.js";
import {
  DailyUptimeChart,
  type DailyUptimeChartProps,
  UptimeResponseChart,
  type UptimeResponseChartProps,
  uptimePercent,
} from "./uptime-charts.js";

const defaultRanges = [
  { days: 1, label: "Last day" },
  { days: 7, label: "Last 7 days" },
  { days: 30, label: "Last 30 days" },
] as const;

const defaultLabels = {
  title: "Site uptime",
  range: "Response time range",
  daily: "Daily uptime",
  response: "Response time",
  last24h: "Last 24 hours",
  last7d: "Last 7 days",
  last30d: "Last 30 days",
  loading: "Loading uptime history…",
  error: "Couldn’t load uptime history.",
  refreshError: "Couldn’t refresh uptime history.",
  retry: "Retry",
  noData: "No data",
};

export type SiteUptimePanelProps = MonitoringAppearance & {
  /** Include the domain and the application's tenant/session scope, without any credentials. */
  queryKey: QueryKey;
  loadHistory: (responseDays: number, signal: AbortSignal) => Promise<SiteUptimeHistory>;
  ranges?: readonly { days: number; label: string }[];
  initialDays?: number;
  labels?: Partial<typeof defaultLabels>;
  formatPercent?: (percent: number) => string;
  dailyChart?: Omit<DailyUptimeChartProps, "days">;
  responseChart?: Omit<UptimeResponseChartProps, "hours">;
};

const windowKeys = ["last24h", "last7d", "last30d"] as const;

export function SiteUptimePanel({
  queryKey,
  loadHistory,
  ranges = defaultRanges,
  initialDays = 7,
  labels,
  formatPercent = (value) => `${value}%`,
  className,
  style,
  dailyChart,
  responseChart,
}: SiteUptimePanelProps) {
  const text = { ...defaultLabels, ...labels };
  const [selectedDays, setSelectedDays] = useState(initialDays);
  const days = ranges.find((range) => range.days === selectedDays)?.days ?? ranges[0]?.days ?? initialDays;
  const history = useQuery({
    queryKey: ["custd-site-uptime", queryKey, days],
    // Global keepPreviousData may otherwise carry history across a tenant or domain change.
    placeholderData: undefined,
    queryFn: ({ signal }) => loadHistory(days, signal),
  });

  const data = history.data;
  function formatWindow(window: SiteUptimeWindow) {
    const percent = uptimePercent(window);
    return percent === undefined ? text.noData : formatPercent(percent);
  }

  return (
    <MonitoringSection part="uptime-panel" title={text.title} className={className} style={style}>
      <label data-custd-part="uptime-range">
        {text.range}{" "}
        <select value={days} onChange={(event) => setSelectedDays(Number(event.currentTarget.value))}>
          {ranges.map((range) => (
            <option key={range.days} value={range.days}>
              {range.label}
            </option>
          ))}
        </select>
      </label>
      {history.isPending && <p role="status">{text.loading}</p>}
      {history.isError && (
        <div data-custd-part="uptime-error">
          <p role="alert">{history.data ? text.refreshError : text.error}</p>
          <button type="button" disabled={history.isFetching} onClick={() => void history.refetch()}>
            {text.retry}
          </button>
        </div>
      )}
      {data && (
        <>
          <MonitoringMetrics part="uptime-windows">
            {windowKeys.map((key) => (
              <div key={key}>
                <dt>{text[key]}</dt>
                <dd>{formatWindow(data.windows[key])}</dd>
              </div>
            ))}
          </MonitoringMetrics>
          <h3>{text.daily}</h3>
          <DailyUptimeChart days={data.days} label={text.daily} {...dailyChart} />
          <h3>{text.response}</h3>
          <UptimeResponseChart hours={data.hours} {...responseChart} />
        </>
      )}
    </MonitoringSection>
  );
}
