import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { scaleLinear } from "./chart-scale.js";
import { formatModelNumber } from "./model-shorthand.js";
const DEFAULT_LABELS = {
    empty: "No samples to show.",
    failed: (detail) => `Not calculated: ${detail}`,
    summary: (mean, low, high) => `Mean ${mean}; 90% of samples between ${low} and ${high}.`,
    bin: (low, high, count) => `${low} to ${high}: ${count} samples`,
    mean: "Mean",
    interval: "90% interval",
};
/** The server sends 20 bins; anything past this is not drawn, so a bad payload stays cheap. */
const MAX_BINS = 100;
const MARGIN = { top: 8, right: 8, bottom: 34, left: 8 };
const COLOR = {
    bar: "var(--custd-chart-forecast, currentColor)",
    interval: "var(--custd-chart-band, currentColor)",
    mean: "var(--custd-chart-target, currentColor)",
    median: "var(--custd-chart-observed, currentColor)",
};
/** One quantity's samples as bars, with its mean and its 5th–95th percentile interval marked. */
export function QuantityHistogram({ result, title, unit, formatValue = formatModelNumber, labels: overrides, width = 480, height = 140, className, style, }) {
    const labels = { ...DEFAULT_LABELS, ...overrides };
    const withUnit = (value) => (unit ? `${formatValue(value)} ${unit}` : formatValue(value));
    if (result.error) {
        return (_jsx("div", { className: className, style: style, "data-custd-chart": "quantity-histogram", "data-custd-chart-state": "failed", children: _jsx("p", { children: labels.failed(result.error.detail) }) }));
    }
    const summary = result.summary;
    const counts = (summary?.histogram.counts ?? []).slice(0, MAX_BINS);
    const total = counts.reduce((sum, count) => sum + count, 0);
    if (!summary || total === 0) {
        return (_jsx("div", { className: className, style: style, "data-custd-chart": "quantity-histogram", "data-custd-chart-state": "empty", children: _jsx("p", { children: labels.empty }) }));
    }
    const { min, max } = summary.histogram;
    const { p5, p50, p95 } = summary.percentiles;
    // Every sample the same value gives zero-width bins: draw one centred bar.
    const single = !(max > min);
    const domain = single ? { start: min - 1, end: min + 1 } : { start: min, end: max };
    const binWidth = (max - min) / (summary.histogram.counts?.length ?? counts.length);
    const bins = single
        ? [{ low: min, high: min, count: total }]
        : counts.map((count, index) => ({ low: min + binWidth * index, high: min + binWidth * (index + 1), count }));
    const px = scaleLinear(domain, MARGIN.left, width - MARGIN.right);
    const baseline = height - MARGIN.bottom;
    const py = scaleLinear({ start: 0, end: Math.max(...bins.map((bin) => bin.count)) }, baseline, MARGIN.top);
    const text = { fill: "currentColor", fontSize: 11, fontVariantNumeric: "tabular-nums" };
    const described = labels.summary(withUnit(summary.mean), withUnit(p5), withUnit(p95));
    const clamp = (value) => Math.min(width - MARGIN.right, Math.max(MARGIN.left, px(value)));
    return (_jsxs("figure", { className: className, style: { margin: 0, ...style }, "data-custd-chart": "quantity-histogram", children: [_jsxs("svg", { role: "img", "aria-label": `${title}: ${described}`, viewBox: `0 0 ${width} ${height}`, width: "100%", style: { display: "block" }, children: [_jsx("title", { children: title }), bins.map(({ low, high, count }) => {
                        const left = single ? px(min) - 3 : px(low) + 0.5;
                        return (_jsx("rect", { "data-custd-chart-bar": "", x: left, y: py(count), width: single ? 6 : Math.max(0, px(high) - px(low) - 1), height: baseline - py(count), style: { fill: COLOR.bar, fillOpacity: 0.75 }, children: _jsx("title", { children: labels.bin(withUnit(low), withUnit(high), count) }) }, low));
                    }), _jsxs("g", { "data-custd-chart-layer": "interval", children: [_jsx("title", { children: `${labels.interval}: ${withUnit(p5)} to ${withUnit(p95)}` }), _jsx("rect", { x: clamp(p5), y: baseline + 6, width: Math.max(2, clamp(p95) - clamp(p5)), height: 5, rx: 2.5, style: { fill: COLOR.interval, fillOpacity: 0.6 } }), _jsx("circle", { cx: clamp(p50), cy: baseline + 8.5, r: 3.5, style: { fill: COLOR.median } })] }), _jsx("line", { "data-custd-chart-layer": "mean", x1: clamp(summary.mean), x2: clamp(summary.mean), y1: MARGIN.top, y2: baseline, style: { stroke: COLOR.mean, strokeWidth: 1.5, strokeDasharray: "4 3" }, children: _jsx("title", { children: `${labels.mean}: ${withUnit(summary.mean)}` }) }), _jsx("text", { x: MARGIN.left, y: height - 4, style: text, children: withUnit(domain.start) }), _jsx("text", { x: width - MARGIN.right, y: height - 4, textAnchor: "end", style: text, children: withUnit(domain.end) })] }), _jsx("figcaption", { children: described })] }));
}
