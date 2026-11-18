import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { domainOf, scaleLinear } from "./chart-scale.js";
import { formatModelNumber } from "./model-shorthand.js";
const DEFAULT_LABELS = {
    empty: "Choose an output to see which inputs drive it.",
    heading: (output) => `What drives ${output}`,
    correlation: (value) => `rank correlation ${value}`,
    direction: (positive) => (positive ? "raises it" : "lowers it"),
    scatter: (input, output) => `${input} against ${output}, one dot per sampled trial`,
};
/** The server keeps up to 500 scatter points per input; draw no more than that. */
const MAX_SCATTER_POINTS = 500;
const BAR = { width: 160, height: 12 };
const SCATTER = { width: 160, height: 120, margin: 6 };
const COLOR = {
    raises: "var(--custd-chart-forecast, currentColor)",
    lowers: "var(--custd-chart-late, currentColor)",
    axis: "var(--custd-chart-grid, currentColor)",
    dot: "var(--custd-chart-observed, currentColor)",
};
/** Orders inputs by the strength of their rank correlation with the output, strongest first. */
export function rankSensitivityInputs(inputs) {
    return [...inputs].sort((left, right) => Math.abs(right.rankCorrelation) - Math.abs(left.rankCorrelation));
}
/** The inputs that move one output most, as signed bars, with small scatter plots for the top few. */
export function SensitivityView({ sensitivity, scatterInputs = 3, labels: overrides, className, style, }) {
    const labels = { ...DEFAULT_LABELS, ...overrides };
    const ranked = rankSensitivityInputs(sensitivity?.inputs ?? []);
    if (!sensitivity || ranked.length === 0) {
        return (_jsx("div", { className: className, style: style, "data-custd-chart": "sensitivity", "data-custd-chart-state": "empty", children: _jsx("p", { children: labels.empty }) }));
    }
    const scattered = ranked.filter((input) => (input.scatter?.length ?? 0) > 0).slice(0, scatterInputs);
    return (_jsxs("section", { className: className, style: style, "data-custd-chart": "sensitivity", children: [_jsx("h3", { children: labels.heading(sensitivity.output) }), _jsx("ol", { style: { listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "0.25rem" }, children: ranked.map((input) => (_jsx(SensitivityRow, { input: input, labels: labels }, input.name))) }), scattered.length > 0 ? (_jsx("div", { style: { display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "0.75rem" }, children: scattered.map((input) => (_jsx(ScatterPlot, { points: input.scatter ?? [], label: labels.scatter(input.name, sensitivity.output), name: input.name }, input.name))) })) : null] }));
}
function SensitivityRow({ input, labels }) {
    const positive = input.rankCorrelation >= 0;
    const centre = BAR.width / 2;
    const length = Math.min(1, Math.abs(input.rankCorrelation)) * centre;
    return (_jsxs("li", { "data-custd-sensitivity-input": input.name, style: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem" }, children: [_jsx("span", { style: { minWidth: "8rem", fontWeight: 600 }, children: input.name }), _jsxs("svg", { viewBox: `0 0 ${BAR.width} ${BAR.height}`, width: BAR.width, height: BAR.height, "aria-hidden": "true", children: [_jsx("line", { x1: centre, x2: centre, y1: 0, y2: BAR.height, style: { stroke: COLOR.axis, strokeWidth: 1 } }), _jsx("rect", { x: positive ? centre : centre - length, y: 2, width: length, height: BAR.height - 4, style: { fill: positive ? COLOR.raises : COLOR.lowers } })] }), _jsxs("span", { style: { fontVariantNumeric: "tabular-nums" }, children: [labels.correlation(formatSigned(input.rankCorrelation)), ", ", labels.direction(positive)] })] }));
}
function ScatterPlot({ points, label, name }) {
    const drawn = points.slice(0, MAX_SCATTER_POINTS);
    const x = domainOf(drawn.map((point) => point.input), 1e-9);
    const y = domainOf(drawn.map((point) => point.output), 1e-9);
    if (!x || !y)
        return null;
    const { width, height, margin } = SCATTER;
    const px = scaleLinear(x, margin, width - margin);
    const py = scaleLinear(y, height - margin, margin);
    return (_jsxs("figure", { style: { margin: 0 }, "data-custd-chart": "sensitivity-scatter", "data-custd-sensitivity-input": name, children: [_jsxs("svg", { role: "img", "aria-label": label, viewBox: `0 0 ${width} ${height}`, width: width, height: height, children: [_jsx("rect", { x: 0.5, y: 0.5, width: width - 1, height: height - 1, style: { fill: "none", stroke: COLOR.axis, strokeOpacity: 0.5 } }), _jsx("path", { "data-custd-chart-layer": "scatter", d: drawn.map((point) => dot(px(point.input), py(point.output))).join(""), style: { fill: COLOR.dot, fillOpacity: 0.45 } })] }), _jsx("figcaption", { children: name })] }));
}
const DOT_RADIUS = 1.75;
/** One dot as a path segment, so a plot of hundreds of trials is one element. */
function dot(cx, cy) {
    const r = DOT_RADIUS;
    return `M${cx - r},${cy}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0`;
}
function formatSigned(value) {
    return `${value > 0 ? "+" : ""}${formatModelNumber(Math.round(value * 100) / 100)}`;
}
