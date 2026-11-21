import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useId, useMemo, useRef, useState, } from "react";
import { DAY_MS, domainOf, formatNumber, formatUtcDate, panDomain, parseTime, sameDomain, scaleLinear, ticksOf, usePrefersReducedMotion, useTweenedDomain, zoomDomain, } from "./chart-scale.js";
const DEFAULT_LABELS = {
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    panEarlier: "Pan earlier",
    panLater: "Pan later",
    reset: "Reset view",
    zoomToData: "Zoom to data",
    fullScreen: "Full screen",
    controls: "Chart view",
    empty: "No measurements yet.",
    noForecast: "No forecast yet.",
    range: (start, end) => `Showing ${start} to ${end}`,
};
const MARGIN = { top: 12, right: 12, bottom: 28, left: 48 };
const MIN_SPAN_MS = DAY_MS / 24;
const ZOOM_FACTOR = 0.5;
const PAN_FRACTION = 0.25;
/** Colours come from these CSS variables, so the client's theme owns them. */
const COLOR = {
    observed: "var(--custd-chart-observed, currentColor)",
    forecast: "var(--custd-chart-forecast, currentColor)",
    band: "var(--custd-chart-band, currentColor)",
    target: "var(--custd-chart-target, currentColor)",
    deadline: "var(--custd-chart-deadline, currentColor)",
    trail: "var(--custd-chart-trail, currentColor)",
    grid: "var(--custd-chart-grid, currentColor)",
    surface: "var(--custd-chart-surface, Canvas)",
};
export function ForecastChart({ data, title, summary, labels: labelOverrides, formatDate = formatUtcDate, formatValue = formatNumber, width = 640, height = 280, className, style, }) {
    const labels = { ...DEFAULT_LABELS, ...labelOverrides };
    const domains = useMemo(() => chartDomains(data), [data]);
    if (!domains) {
        return (_jsx("div", { className: className, style: style, "data-custd-chart": "forecast", "data-custd-chart-state": "empty", children: _jsx("p", { children: labels.empty }) }));
    }
    return (_jsx(ForecastChartView, { data: data, domains: domains, title: title, summary: summary ?? forecastSummary(title, data, formatDate, formatValue), labels: labels, formatDate: formatDate, formatValue: formatValue, width: width, height: height, className: className, style: style }));
}
function ForecastChartView({ data, domains, labels, formatDate, ...props }) {
    const { full } = domains;
    const [selection, setSelection] = useState(null);
    const view = selection ? zoomDomain(selection, 1, full, MIN_SPAN_MS) : full;
    const [fullScreen, setFullScreen] = useState(false);
    const reducedMotion = usePrefersReducedMotion();
    const shown = useTweenedDomain(view, reducedMotion);
    useEffect(() => {
        if (!fullScreen)
            return;
        const exit = (event) => event.key === "Escape" && setFullScreen(false);
        document.addEventListener("keydown", exit);
        return () => document.removeEventListener("keydown", exit);
    }, [fullScreen]);
    const changeView = (update) => {
        setSelection((current) => {
            const bounded = current ? zoomDomain(current, 1, full, MIN_SPAN_MS) : full;
            const next = update(bounded);
            return sameDomain(next, full) ? null : next;
        });
    };
    const zoom = (factor) => changeView((current) => zoomDomain(current, factor, full, MIN_SPAN_MS));
    const pan = (fraction) => changeView((current) => panDomain(current, fraction, full));
    const atFull = sameDomain(view, full);
    return (_jsxs("div", { className: props.className, style: fullScreen ? { ...props.style, ...FULL_SCREEN_STYLE } : props.style, "data-custd-chart": "forecast", "data-custd-chart-fullscreen": fullScreen, "data-reduced-motion": reducedMotion, children: [_jsxs("fieldset", { "data-custd-chart-controls": "", style: { border: 0, margin: 0, padding: 0 }, children: [_jsx("legend", { style: VISUALLY_HIDDEN, children: labels.controls }), _jsx(ChartButton, { label: labels.zoomIn, onClick: () => zoom(ZOOM_FACTOR), disabled: view.end - view.start <= MIN_SPAN_MS }), _jsx(ChartButton, { label: labels.zoomOut, onClick: () => zoom(1 / ZOOM_FACTOR), disabled: atFull }), _jsx(ChartButton, { label: labels.panEarlier, onClick: () => pan(-PAN_FRACTION), disabled: view.start <= full.start }), _jsx(ChartButton, { label: labels.panLater, onClick: () => pan(PAN_FRACTION), disabled: view.end >= full.end }), _jsx(ChartButton, { label: labels.reset, onClick: () => setSelection(null), disabled: atFull }), _jsx(ChartButton, { label: labels.zoomToData, onClick: () => changeView(() => domains.observed), disabled: sameDomain(view, domains.observed) }), _jsx(ChartButton, { label: labels.fullScreen, pressed: fullScreen, onClick: () => setFullScreen((on) => !on) })] }), _jsx("p", { role: "status", "aria-live": "polite", style: VISUALLY_HIDDEN, children: labels.range(formatDate(view.start), formatDate(view.end)) }), _jsx(ForecastPlot, { data: data, x: shown, y: domains.y, formatDate: formatDate, onPan: pan, ...props }), data.completionMedian === undefined && data.completionInterval === undefined ? _jsx("p", { children: labels.noForecast }) : null] }));
}
function ChartButton({ label, onClick, disabled, pressed, }) {
    return (_jsx("button", { type: "button", "data-custd-chart-action": "", onClick: onClick, disabled: disabled, "aria-pressed": pressed, children: label }));
}
function ForecastPlot({ data, x, y, title, summary, width, height, formatDate, formatValue, onPan }) {
    const clipId = `custd-forecast-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
    const drag = useRef(undefined);
    const px = scaleLinear(x, MARGIN.left, width - MARGIN.right);
    const py = scaleLinear(y, height - MARGIN.bottom, MARGIN.top);
    const line = (points) => points.map((point) => `${px(parseTime(point.at))},${py(point.value)}`).join(" ");
    const forecastFrom = data.forecastFrom ? parseTime(data.forecastFrom) : Number.NEGATIVE_INFINITY;
    const fitted = data.observations.filter((point) => parseTime(point.at) >= forecastFrom);
    const dimmed = data.observations.filter((point) => parseTime(point.at) < forecastFrom);
    const last = data.observations[data.observations.length - 1];
    const onPointerDown = (event) => {
        const rendered = event.currentTarget.getBoundingClientRect().width;
        if (rendered > 0)
            drag.current = { clientX: event.clientX, width: rendered };
    };
    const onWheel = (event) => {
        const delta = event.shiftKey && event.deltaX === 0 ? event.deltaY : event.deltaX;
        if (delta === 0 || (!event.shiftKey && Math.abs(delta) < Math.abs(event.deltaY)))
            return;
        const distance = event.deltaMode === 1 ? delta * 16 : delta;
        const rendered = event.currentTarget.getBoundingClientRect().width;
        if (rendered > 0)
            onPan(event.deltaMode === 2 ? delta : distance / rendered);
    };
    const endDrag = () => {
        drag.current = undefined;
    };
    const onPointerUp = (event) => {
        const start = drag.current;
        drag.current = undefined;
        if (!start || event.clientX === start.clientX)
            return;
        const plotShare = (width - MARGIN.left - MARGIN.right) / width;
        onPan((start.clientX - event.clientX) / (start.width * plotShare));
    };
    return (_jsxs("svg", { role: "img", "aria-label": summary, viewBox: `0 0 ${width} ${height}`, width: "100%", style: { display: "block", touchAction: "pan-y" }, onWheel: onWheel, onPointerDown: onPointerDown, onPointerUp: onPointerUp, onPointerLeave: endDrag, onPointerCancel: endDrag, children: [_jsx("title", { children: title }), _jsx("defs", { children: _jsx("clipPath", { id: clipId, children: _jsx("rect", { x: MARGIN.left, y: 0, width: width - MARGIN.left - MARGIN.right, height: height }) }) }), _jsx(Axes, { x: x, y: y, width: width, height: height, formatDate: formatDate, formatValue: formatValue }), _jsxs("g", { clipPath: `url(#${clipId})`, children: [(data.earlierRuns ?? []).map((run) => (_jsx("polyline", { "data-custd-chart-layer": "trail", points: line(run.points), style: trailStyle, children: _jsx("title", { children: run.label }) }, run.label))), last && data.target !== undefined && data.completionInterval ? (_jsx("polygon", { "data-custd-chart-layer": "band", points: line([
                            last,
                            { at: data.completionInterval.lower, value: data.target },
                            { at: data.completionInterval.upper, value: data.target },
                        ]), style: { fill: COLOR.band, fillOpacity: 0.18, stroke: "none" } })) : null, data.posteriorLines && data.posteriorLines.length > 0 ? (_jsx("path", { "data-custd-chart-layer": "posterior", d: data.posteriorLines.map((posterior) => `M${line(posterior.points).split(" ").join("L")}`).join(" "), style: { fill: "none", stroke: COLOR.forecast, strokeOpacity: 0.2, strokeWidth: 1 } })) : null, last && data.target !== undefined && data.completionMedian ? (_jsx("polyline", { "data-custd-chart-layer": "median", points: line([last, { at: data.completionMedian, value: data.target }]), style: { fill: "none", stroke: COLOR.forecast, strokeWidth: 2, strokeDasharray: "6 4" } })) : null, dimmed.length > 0 ? _jsx(Observations, { layer: "dimmed", points: dimmed, px: px, py: py, opacity: 0.35 }) : null, _jsx(Observations, { layer: "observed", points: fitted, px: px, py: py, opacity: 1 })] }), data.target !== undefined ? (_jsx("line", { "data-custd-chart-layer": "target", x1: MARGIN.left, x2: width - MARGIN.right, y1: py(data.target), y2: py(data.target), style: { stroke: COLOR.target, strokeDasharray: "2 3" } })) : null, data.deadline !== undefined ? (_jsx(DeadlineLine, { at: px(parseTime(data.deadline)), width: width, height: height })) : null] }));
}
const trailStyle = { fill: "none", stroke: COLOR.trail, strokeOpacity: 0.25, strokeWidth: 1.5 };
function DeadlineLine({ at, width, height }) {
    if (at < MARGIN.left || at > width - MARGIN.right)
        return null;
    return (_jsx("line", { "data-custd-chart-layer": "deadline", x1: at, x2: at, y1: MARGIN.top, y2: height - MARGIN.bottom, style: { stroke: COLOR.deadline, strokeWidth: 1.5 } }));
}
function Observations({ layer, points, px, py, opacity, }) {
    return (_jsxs("g", { "data-custd-chart-layer": layer, style: { opacity }, children: [_jsx("polyline", { points: points.map((point) => `${px(parseTime(point.at))},${py(point.value)}`).join(" "), style: { fill: "none", stroke: COLOR.observed, strokeWidth: 2 } }), points.map((point) => (_jsx("circle", { cx: px(parseTime(point.at)), cy: py(point.value), r: 3, style: { fill: COLOR.observed } }, point.at)))] }));
}
function Axes({ x, y, width, height, formatDate, formatValue, }) {
    const px = scaleLinear(x, MARGIN.left, width - MARGIN.right);
    const py = scaleLinear(y, height - MARGIN.bottom, MARGIN.top);
    const text = { fill: "currentColor", fontSize: 11, fontVariantNumeric: "tabular-nums" };
    return (_jsxs("g", { "data-custd-chart-layer": "axes", children: [ticksOf(y, 4).map((tick) => (_jsxs("g", { children: [_jsx("line", { x1: MARGIN.left, x2: width - MARGIN.right, y1: py(tick), y2: py(tick), style: GRID }), _jsx("text", { x: MARGIN.left - 6, y: py(tick), dy: "0.32em", textAnchor: "end", style: text, children: formatValue(tick) })] }, `y${tick}`))), ticksOf(x, 4).map((tick, index) => (_jsx("text", { x: px(tick), y: height - MARGIN.bottom + 18, textAnchor: index === 0 ? "start" : index === 3 ? "end" : "middle", style: text, children: formatDate(tick) }, `x${tick}`)))] }));
}
const GRID = { stroke: COLOR.grid, strokeOpacity: 0.2 };
const VISUALLY_HIDDEN = {
    position: "absolute",
    width: 1,
    height: 1,
    overflow: "hidden",
    clip: "rect(0 0 0 0)",
    whiteSpace: "nowrap",
};
const FULL_SCREEN_STYLE = {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    overflow: "auto",
    padding: 16,
    background: COLOR.surface,
};
function chartDomains(data) {
    const observedTimes = data.observations.map((point) => parseTime(point.at));
    const observed = domainOf(observedTimes, DAY_MS);
    if (!observed)
        return undefined;
    const lines = [...(data.posteriorLines ?? []), ...(data.earlierRuns ?? [])].flatMap((line) => line.points);
    const times = [
        ...observedTimes,
        ...lines.map((point) => parseTime(point.at)),
        ...[data.deadline, data.completionMedian, data.completionInterval?.lower, data.completionInterval?.upper]
            .filter((value) => value !== undefined)
            .map(parseTime),
    ];
    const values = [0, ...data.observations.map((point) => point.value), ...lines.map((point) => point.value)];
    if (data.target !== undefined)
        values.push(data.target);
    const y = domainOf(values, 1) ?? { start: 0, end: 1 };
    return { full: domainOf(times, DAY_MS) ?? observed, observed, y: { start: y.start, end: y.end * 1.05 } };
}
function forecastSummary(title, data, formatDate, formatValue) {
    const parts = [`${title}: ${data.observations.length} measurements`];
    if (data.target !== undefined)
        parts.push(`target ${formatValue(data.target)}`);
    if (data.completionMedian)
        parts.push(`expected ${formatDate(parseTime(data.completionMedian))}`);
    const interval = data.completionInterval;
    if (interval) {
        const confidence = Math.round(interval.confidence * 100);
        parts.push(`${confidence}% likely between ${formatDate(parseTime(interval.lower))} and ${formatDate(parseTime(interval.upper))}`);
    }
    if (data.deadline)
        parts.push(`deadline ${formatDate(parseTime(data.deadline))}`);
    return parts.join("; ");
}
