import type { SiteResponseHour, SiteUptimeDay, SiteUptimeWindow } from "@haakco/custd-sdk";
import type { CSSProperties } from "react";
import { scaleLinear } from "./chart-scale.js";

/** Round down so a missed check never displays as 100%. */
export function uptimePercent({ checks, upChecks }: SiteUptimeWindow): number | undefined {
  return checks === 0 ? undefined : Math.floor((upChecks * 10000) / checks) / 100;
}

export type DailyUptimeChartProps = {
  days: readonly SiteUptimeDay[];
  className?: string;
  style?: CSSProperties;
  label?: string;
  emptyLabel?: string;
  formatDayLabel?: (day: SiteUptimeDay) => string;
};

export function DailyUptimeChart({
  days,
  className,
  style,
  label = "Daily uptime",
  emptyLabel = "No uptime checks in this range.",
  formatDayLabel,
}: DailyUptimeChartProps) {
  if (!days.some((day) => day.checks > 0))
    return (
      <p className={className} style={style}>
        {emptyLabel}
      </p>
    );

  return (
    <ul
      aria-label={label}
      className={className}
      data-custd-part="daily-chart"
      style={{ display: "flex", gap: 1, margin: 0, padding: 0, listStyle: "none", ...style }}
    >
      {days.map((day) => {
        const { date, checks, upChecks } = day;
        const share = checks ? upChecks / checks : null;
        const percent = uptimePercent(day);
        const detail = percent === undefined ? "No data" : `${percent}% up (${checks} checks)`;
        const dayLabel = formatDayLabel?.(day) ?? `${date}: ${detail}`;
        const tone = share === null ? "no-data" : share >= 0.999 ? "up" : share >= 0.99 ? "degraded" : "down";
        const color = dailyColors[tone];
        return (
          <li
            key={date}
            aria-label={dayLabel}
            title={dayLabel}
            data-custd-part="uptime-day"
            data-state={tone}
            style={{ flex: 1, minWidth: 0, height: "var(--custd-uptime-bar-height, 1.5rem)", backgroundColor: color }}
          />
        );
      })}
    </ul>
  );
}

const dailyColors = {
  "no-data": "var(--custd-uptime-no-data, #94a3b8)",
  up: "var(--custd-uptime-up, #15803d)",
  degraded: "var(--custd-uptime-degraded, #a16207)",
  down: "var(--custd-uptime-down, #b91c1c)",
};

export type UptimeResponseChartProps = {
  hours: readonly SiteResponseHour[];
  className?: string;
  style?: CSSProperties;
  emptyLabel?: string;
  averageLabel?: string;
  slowestLabel?: string;
  formatSummary?: (metrics: { averageMs: number; slowestMs: number }) => string;
  formatTime?: (timestamp: string) => string;
};

const HOUR_MS = 3_600_000;
const WIDTH = 640;
const HEIGHT = 160;

export function UptimeResponseChart({
  hours,
  className,
  style,
  emptyLabel = "No passing checks in this range.",
  averageLabel = "Average",
  slowestLabel = "Slowest",
  formatSummary,
  formatTime,
}: UptimeResponseChartProps) {
  const passing = hours.filter((hour) => hour.avgMs != null && hour.upChecks > 0);
  if (passing.length === 0)
    return (
      <p className={className} style={style}>
        {emptyLabel}
      </p>
    );

  const maximum = Math.max(...passing.map((hour) => hour.maxMs ?? hour.avgMs ?? 0));
  const checks = passing.reduce((sum, hour) => sum + hour.upChecks, 0);
  const average = Math.round(passing.reduce((sum, hour) => sum + (hour.avgMs ?? 0) * hour.upChecks, 0) / checks);
  const start = Date.parse(hours[0].hourStart);
  const end = Date.parse(hours[hours.length - 1].hourStart);
  const x = scaleLinear({ start: start - HOUR_MS / 2, end: end + HOUR_MS / 2 }, 4, WIDTH - 4);
  const y = scaleLinear({ start: 0, end: Math.max(1, maximum) }, HEIGHT - 4, 4);
  const summary =
    formatSummary?.({ averageMs: average, slowestMs: maximum }) ??
    `Response time: ${average} ms on average, slowest ${maximum} ms.`;

  return (
    <figure className={className} data-custd-part="response-chart" style={{ margin: 0, ...style }}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        style={{ display: "block", width: "100%" }}
        role="img"
        aria-label={summary}
      >
        {(["avgMs", "maxMs"] as const).map((field) => {
          const color =
            field === "avgMs" ? "var(--custd-chart-primary, #2563eb)" : "var(--custd-chart-secondary, #9333ea)";
          return (
            <g key={field} data-series={field} fill={color} stroke={color}>
              {passing.map((hour, index) => {
                const value = hour[field];
                if (value == null) return null;
                const time = Date.parse(hour.hourStart);
                const previous = passing[index - 1];
                const previousValue = previous?.[field];
                const joined = previousValue != null && time - Date.parse(previous.hourStart) === HOUR_MS;
                return (
                  <g key={hour.hourStart}>
                    <title>{`${formatTime?.(hour.hourStart) ?? hour.hourStart} · ${field === "avgMs" ? averageLabel : slowestLabel} ${value} ms`}</title>
                    {joined && (
                      <line
                        x1={x(time - HOUR_MS)}
                        y1={y(previousValue)}
                        x2={x(time)}
                        y2={y(value)}
                        strokeDasharray={field === "maxMs" ? "5 3" : undefined}
                      />
                    )}
                    <circle cx={x(time)} cy={y(value)} r={2} />
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
      <figcaption>{summary}</figcaption>
    </figure>
  );
}
