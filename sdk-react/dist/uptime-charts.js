import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { scaleLinear } from "./chart-scale.js";
/** Round down so a missed check never displays as 100%. */
export function uptimePercent({ checks, upChecks }) {
    return checks === 0 ? undefined : Math.floor((upChecks * 10000) / checks) / 100;
}
export function DailyUptimeChart({ days, className, style, label = "Daily uptime", emptyLabel = "No uptime checks in this range.", formatDayLabel, }) {
    if (!days.some((day) => day.checks > 0))
        return (_jsx("p", { className: className, style: style, children: emptyLabel }));
    return (_jsx("ul", { "aria-label": label, className: className, "data-custd-part": "daily-chart", style: { display: "flex", gap: 1, margin: 0, padding: 0, listStyle: "none", ...style }, children: days.map((day) => {
            const { date, checks, upChecks } = day;
            const share = checks ? upChecks / checks : null;
            const percent = uptimePercent(day);
            const detail = percent === undefined ? "No data" : `${percent}% up (${checks} checks)`;
            const dayLabel = formatDayLabel?.(day) ?? `${date}: ${detail}`;
            const tone = share === null ? "no-data" : share >= 0.999 ? "up" : share >= 0.99 ? "degraded" : "down";
            const color = dailyColors[tone];
            return (_jsx("li", { "aria-label": dayLabel, title: dayLabel, "data-custd-part": "uptime-day", "data-state": tone, style: { flex: 1, minWidth: 0, height: "var(--custd-uptime-bar-height, 1.5rem)", backgroundColor: color } }, date));
        }) }));
}
const dailyColors = {
    "no-data": "var(--custd-uptime-no-data, #94a3b8)",
    up: "var(--custd-uptime-up, #15803d)",
    degraded: "var(--custd-uptime-degraded, #a16207)",
    down: "var(--custd-uptime-down, #b91c1c)",
};
const HOUR_MS = 3600000;
const WIDTH = 640;
const HEIGHT = 160;
const plotInset = 4;
const chartColors = {
    avgMs: "var(--custd-chart-primary, #2563eb)",
    maxMs: "var(--custd-chart-secondary, #9333ea)",
};
const utcHour = new Intl.DateTimeFormat("en", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hourCycle: "h23",
});
const formatUtcHour = (timestamp) => `${utcHour.format(Date.parse(timestamp))} UTC`;
export function UptimeResponseChart({ hours, className, style, emptyLabel = "No passing checks in this range.", averageLabel = "Average", slowestLabel = "Slowest", formatSummary, formatTime = formatUtcHour, dataLabel = "Hourly data", }) {
    const [showData, setShowData] = useState(false);
    const passing = hours.filter((hour) => hour.avgMs != null && hour.upChecks > 0);
    if (passing.length === 0)
        return (_jsx("p", { className: className, style: style, children: emptyLabel }));
    const maximum = Math.max(...passing.map((hour) => hour.maxMs ?? hour.avgMs ?? 0));
    const checks = passing.reduce((sum, hour) => sum + hour.upChecks, 0);
    const average = Math.round(passing.reduce((sum, hour) => sum + (hour.avgMs ?? 0) * hour.upChecks, 0) / checks);
    const start = Date.parse(hours[0].hourStart);
    const end = Date.parse(hours[hours.length - 1].hourStart);
    const x = scaleLinear({ start: start - HOUR_MS / 2, end: end + HOUR_MS / 2 }, plotInset, WIDTH - plotInset);
    const yMax = Math.max(1, maximum);
    const y = scaleLinear({ start: 0, end: yMax }, HEIGHT - plotInset, plotInset);
    const summary = formatSummary?.({ averageMs: average, slowestMs: maximum }) ??
        `Response time: ${average} ms on average, slowest ${maximum} ms.`;
    return (_jsxs("figure", { className: className, "data-custd-chart": "", "data-custd-part": "response-chart", style: { margin: 0, minWidth: 0, ...style }, children: [_jsx("figcaption", { children: summary }), _jsxs("div", { style: { display: "flex", flexWrap: "wrap", gap: "0.75rem" }, children: [_jsxs("span", { children: [_jsxs("span", { "aria-hidden": "true", style: { color: chartColors.avgMs }, children: ["\u2501", " "] }), averageLabel] }), _jsxs("span", { children: [_jsxs("span", { "aria-hidden": "true", style: { color: chartColors.maxMs }, children: ["\u2504", " "] }), slowestLabel] })] }), _jsxs("div", { style: { display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", alignItems: "stretch", gap: "0.5rem" }, children: [_jsxs("div", { "aria-hidden": "true", style: { display: "flex", flexDirection: "column", justifyContent: "space-between", fontSize: "0.75rem" }, children: [_jsxs("span", { children: [yMax, " ms"] }), _jsx("span", { children: "0 ms" })] }), _jsx("svg", { viewBox: `0 0 ${WIDTH} ${HEIGHT}`, style: { display: "block", width: "100%", height: HEIGHT }, preserveAspectRatio: "none", role: "img", "aria-label": summary, children: ["avgMs", "maxMs"].map((field) => {
                            const color = chartColors[field];
                            return (_jsx("g", { "data-series": field, fill: color, stroke: color, children: passing.map((hour, index) => {
                                    const value = hour[field];
                                    if (value == null)
                                        return null;
                                    const time = Date.parse(hour.hourStart);
                                    const previous = passing[index - 1];
                                    const previousValue = previous?.[field];
                                    const joined = previousValue != null && time - Date.parse(previous.hourStart) === HOUR_MS;
                                    return (_jsxs("g", { children: [_jsx("title", { children: `${formatTime(hour.hourStart)} · ${field === "avgMs" ? averageLabel : slowestLabel} ${value} ms` }), joined && (_jsx("line", { x1: x(time - HOUR_MS), y1: y(previousValue), x2: x(time), y2: y(value), vectorEffect: "non-scaling-stroke", strokeWidth: 2, strokeDasharray: field === "maxMs" ? "5 3" : undefined })), _jsx("circle", { cx: x(time), cy: y(value), r: 2 })] }, hour.hourStart));
                                }) }, field));
                        }) })] }), _jsxs("div", { "aria-hidden": "true", style: {
                    display: "flex",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                    fontSize: "0.75rem",
                }, children: [_jsx("span", { children: formatTime(hours[0].hourStart) }), start !== end && _jsx("span", { children: formatTime(hours[hours.length - 1].hourStart) })] }), _jsxs("details", { onToggle: (event) => setShowData(event.currentTarget.open), children: [_jsx("summary", { children: dataLabel }), showData && (_jsx("div", { style: { maxHeight: "16rem", overflow: "auto" }, children: _jsxs("table", { "aria-label": dataLabel, style: { width: "100%" }, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { scope: "col", children: "Hour" }), _jsxs("th", { scope: "col", children: [averageLabel, " (ms)"] }), _jsxs("th", { scope: "col", children: [slowestLabel, " (ms)"] })] }) }), _jsx("tbody", { children: hours.map((hour) => (_jsxs("tr", { children: [_jsx("th", { scope: "row", children: formatTime(hour.hourStart) }), _jsx("td", { children: hour.avgMs ?? "—" }), _jsx("td", { children: hour.maxMs ?? "—" })] }, hour.hourStart))) })] }) }))] })] }));
}
