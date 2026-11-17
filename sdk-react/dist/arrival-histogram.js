import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { DAY_MS, formatUtcDate, parseTime, scaleLinear } from "./chart-scale.js";
const DEFAULT_LABELS = {
    empty: "No draw reaches the target.",
    never: (neverCount, total) => `${neverCount} of ${total} draws never reach the target.`,
    bin: (start, end, count) => `${start} to ${end}: ${count} draws`,
};
const MARGIN = { top: 8, right: 8, bottom: 24, left: 8 };
const COLOR = {
    before: "var(--custd-chart-forecast, currentColor)",
    after: "var(--custd-chart-late, currentColor)",
    deadline: "var(--custd-chart-deadline, currentColor)",
};
export function ArrivalHistogram({ histogram, deadline, title, summary, labels: labelOverrides, formatDate = formatUtcDate, width = 640, height = 160, className, style, }) {
    const labels = { ...DEFAULT_LABELS, ...labelOverrides };
    const { bins, neverCount } = histogram;
    const first = bins[0];
    const last = bins[bins.length - 1];
    const arrived = bins.reduce((sum, bin) => sum + bin.count, 0);
    const total = arrived + neverCount;
    if (!first || !last || arrived === 0) {
        return (_jsxs("div", { className: className, style: style, "data-custd-chart": "arrival-histogram", "data-custd-chart-state": "empty", children: [_jsx("p", { children: labels.empty }), neverCount > 0 ? _jsx("p", { children: labels.never(neverCount, total) }) : null] }));
    }
    const arrivals = { start: parseTime(first.start), end: parseTime(last.end) };
    // Every draw arriving at one instant gives zero-width bins; draw them as one centred bar.
    const instant = arrivals.end <= arrivals.start;
    const drawn = instant ? [{ start: first.start, end: first.start, count: arrived }] : bins;
    const x = instant ? { start: arrivals.start - DAY_MS / 2, end: arrivals.start + DAY_MS / 2 } : arrivals;
    const px = scaleLinear(x, MARGIN.left, width - MARGIN.right);
    const py = scaleLinear({ start: 0, end: Math.max(...drawn.map((bin) => bin.count)) }, height - MARGIN.bottom, MARGIN.top);
    const deadlineMs = deadline ? parseTime(deadline) : undefined;
    const text = { fill: "currentColor", fontSize: 11, fontVariantNumeric: "tabular-nums" };
    const range = `${formatDate(arrivals.start)} and ${formatDate(arrivals.end)}`;
    return (_jsxs("div", { className: className, style: style, "data-custd-chart": "arrival-histogram", children: [_jsxs("svg", { role: "img", "aria-label": summary ?? `${title}: ${total} draws, ${arrived} arrive between ${range}`, viewBox: `0 0 ${width} ${height}`, width: "100%", style: { display: "block" }, children: [_jsx("title", { children: title }), drawn.map((bin) => {
                        const late = deadlineMs !== undefined && parseTime(bin.end) > deadlineMs;
                        const left = px(parseTime(bin.start));
                        return (_jsx("rect", { "data-custd-chart-bar": late ? "after" : "before", x: instant ? left - 2 : left + 0.5, y: py(bin.count), width: instant ? 4 : Math.max(0, px(parseTime(bin.end)) - left - 1), height: height - MARGIN.bottom - py(bin.count), style: { fill: late ? COLOR.after : COLOR.before, fillOpacity: late ? 0.45 : 0.8 }, children: _jsx("title", { children: labels.bin(formatDate(parseTime(bin.start)), formatDate(parseTime(bin.end)), bin.count) }) }, bin.start));
                    }), deadlineMs !== undefined && deadlineMs >= x.start && deadlineMs <= x.end ? (_jsx("line", { "data-custd-chart-layer": "deadline", x1: px(deadlineMs), x2: px(deadlineMs), y1: MARGIN.top, y2: height - MARGIN.bottom, style: { stroke: COLOR.deadline, strokeWidth: 1.5 } })) : null, _jsx("text", { x: MARGIN.left, y: height - 6, style: text, children: formatDate(x.start) }), _jsx("text", { x: width - MARGIN.right, y: height - 6, textAnchor: "end", style: text, children: formatDate(x.end) })] }), neverCount > 0 ? _jsx("p", { children: labels.never(neverCount, total) }) : null] }));
}
