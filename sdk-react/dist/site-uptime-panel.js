import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { MonitoringMetrics, MonitoringSection } from "./monitoring-section.js";
import { DailyUptimeChart, UptimeResponseChart, uptimePercent, } from "./uptime-charts.js";
const defaultRanges = [
    { days: 1, label: "Last day" },
    { days: 7, label: "Last 7 days" },
    { days: 30, label: "Last 30 days" },
];
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
const windowKeys = ["last24h", "last7d", "last30d"];
export function SiteUptimePanel({ queryKey, loadHistory, ranges = defaultRanges, initialDays = 7, labels, formatPercent = (value) => `${value}%`, className, style, dailyChart, responseChart, }) {
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
    function formatWindow(window) {
        const percent = uptimePercent(window);
        return percent === undefined ? text.noData : formatPercent(percent);
    }
    return (_jsxs(MonitoringSection, { part: "uptime-panel", title: text.title, className: className, style: style, children: [_jsxs("label", { "data-custd-part": "uptime-range", children: [text.range, " ", _jsx("select", { value: days, onChange: (event) => setSelectedDays(Number(event.currentTarget.value)), children: ranges.map((range) => (_jsx("option", { value: range.days, children: range.label }, range.days))) })] }), history.isPending && _jsx("p", { role: "status", children: text.loading }), history.isError && (_jsxs("div", { "data-custd-part": "uptime-error", children: [_jsx("p", { role: "alert", children: history.data ? text.refreshError : text.error }), _jsx("button", { type: "button", disabled: history.isFetching, onClick: () => void history.refetch(), children: text.retry })] })), data && (_jsxs(_Fragment, { children: [_jsx(MonitoringMetrics, { part: "uptime-windows", children: windowKeys.map((key) => (_jsxs("div", { children: [_jsx("dt", { children: text[key] }), _jsx("dd", { children: formatWindow(data.windows[key]) })] }, key))) }), _jsx("h3", { children: text.daily }), _jsx(DailyUptimeChart, { days: data.days, label: text.daily, ...dailyChart }), _jsx("h3", { children: text.response }), _jsx(UptimeResponseChart, { hours: data.hours, ...responseChart })] }))] }));
}
