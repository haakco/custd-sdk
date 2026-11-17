import { type CSSProperties, type PointerEvent, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  type ChartDomain,
  DAY_MS,
  domainOf,
  formatNumber,
  formatUtcDate,
  panDomain,
  parseTime,
  sameDomain,
  scaleLinear,
  ticksOf,
  usePrefersReducedMotion,
  useTweenedDomain,
  zoomDomain,
} from "./chart-scale.js";
import type { ChartFormatters, ForecastChartData, ForecastPoint } from "./forecast-types.js";

export type ForecastChartLabels = {
  zoomIn: string;
  zoomOut: string;
  panEarlier: string;
  panLater: string;
  reset: string;
  zoomToData: string;
  fullScreen: string;
  controls: string;
  empty: string;
  noForecast: string;
  /** The visible range, read out as it changes. */
  range: (start: string, end: string) => string;
};

export type ForecastChartProps = ChartFormatters & {
  data: ForecastChartData;
  /** Names the chart; the default summary starts with it. */
  title: string;
  /** Replaces the generated text alternative. */
  summary?: string;
  labels?: Partial<ForecastChartLabels>;
  /** Drawing size in SVG units; the chart scales to its container width. */
  width?: number;
  height?: number;
  className?: string;
  style?: CSSProperties;
};

const DEFAULT_LABELS: ForecastChartLabels = {
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

export function ForecastChart({
  data,
  title,
  summary,
  labels: labelOverrides,
  formatDate = formatUtcDate,
  formatValue = formatNumber,
  width = 640,
  height = 280,
  className,
  style,
}: ForecastChartProps) {
  const labels = { ...DEFAULT_LABELS, ...labelOverrides };
  const domains = useMemo(() => chartDomains(data), [data]);
  if (!domains) {
    return (
      <div className={className} style={style} data-custd-chart="forecast" data-custd-chart-state="empty">
        <p>{labels.empty}</p>
      </div>
    );
  }
  return (
    <ForecastChartView
      data={data}
      domains={domains}
      title={title}
      summary={summary ?? forecastSummary(title, data, formatDate, formatValue)}
      labels={labels}
      formatDate={formatDate}
      formatValue={formatValue}
      width={width}
      height={height}
      className={className}
      style={style}
    />
  );
}

type ChartDomains = { full: ChartDomain; observed: ChartDomain; y: ChartDomain };

type ViewProps = Required<ChartFormatters> & {
  data: ForecastChartData;
  domains: ChartDomains;
  title: string;
  summary: string;
  labels: ForecastChartLabels;
  width: number;
  height: number;
  className?: string;
  style?: CSSProperties;
};

function ForecastChartView({ data, domains, labels, formatDate, ...props }: ViewProps) {
  const { full } = domains;
  const [view, setView] = useState(full);
  const [fullScreen, setFullScreen] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const shown = useTweenedDomain(view, reducedMotion);
  // New data with the same extent keeps the reader's zoom; a changed extent resets it.
  useEffect(() => setView({ start: full.start, end: full.end }), [full.start, full.end]);
  useEffect(() => {
    if (!fullScreen) return;
    const exit = (event: KeyboardEvent) => event.key === "Escape" && setFullScreen(false);
    document.addEventListener("keydown", exit);
    return () => document.removeEventListener("keydown", exit);
  }, [fullScreen]);

  const zoom = (factor: number) => setView((current) => zoomDomain(current, factor, full, MIN_SPAN_MS));
  const pan = (fraction: number) => setView((current) => panDomain(current, fraction, full));
  const atFull = sameDomain(view, full);
  return (
    <div
      className={props.className}
      style={fullScreen ? { ...props.style, ...FULL_SCREEN_STYLE } : props.style}
      data-custd-chart="forecast"
      data-custd-chart-fullscreen={fullScreen}
      data-reduced-motion={reducedMotion}
    >
      <fieldset data-custd-chart-controls="" style={{ border: 0, margin: 0, padding: 0 }}>
        <legend style={VISUALLY_HIDDEN}>{labels.controls}</legend>
        <ChartButton
          label={labels.zoomIn}
          onClick={() => zoom(ZOOM_FACTOR)}
          disabled={view.end - view.start <= MIN_SPAN_MS}
        />
        <ChartButton label={labels.zoomOut} onClick={() => zoom(1 / ZOOM_FACTOR)} disabled={atFull} />
        <ChartButton label={labels.panEarlier} onClick={() => pan(-PAN_FRACTION)} disabled={view.start <= full.start} />
        <ChartButton label={labels.panLater} onClick={() => pan(PAN_FRACTION)} disabled={view.end >= full.end} />
        <ChartButton label={labels.reset} onClick={() => setView(full)} disabled={atFull} />
        <ChartButton label={labels.zoomToData} onClick={() => setView(domains.observed)} />
        <ChartButton label={labels.fullScreen} pressed={fullScreen} onClick={() => setFullScreen((on) => !on)} />
      </fieldset>
      <p role="status" aria-live="polite" style={VISUALLY_HIDDEN}>
        {labels.range(formatDate(view.start), formatDate(view.end))}
      </p>
      <ForecastPlot data={data} x={shown} y={domains.y} formatDate={formatDate} onPan={pan} {...props} />
      {data.completionMedian === undefined && data.completionInterval === undefined ? <p>{labels.noForecast}</p> : null}
    </div>
  );
}

function ChartButton({
  label,
  onClick,
  disabled,
  pressed,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  pressed?: boolean;
}) {
  return (
    <button type="button" data-custd-chart-action="" onClick={onClick} disabled={disabled} aria-pressed={pressed}>
      {label}
    </button>
  );
}

type PlotProps = Required<ChartFormatters> & {
  data: ForecastChartData;
  x: ChartDomain;
  y: ChartDomain;
  title: string;
  summary: string;
  width: number;
  height: number;
  onPan: (fraction: number) => void;
};

function ForecastPlot({ data, x, y, title, summary, width, height, formatDate, formatValue, onPan }: PlotProps) {
  const clipId = `custd-forecast-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const drag = useRef<{ clientX: number; width: number } | undefined>(undefined);
  const px = scaleLinear(x, MARGIN.left, width - MARGIN.right);
  const py = scaleLinear(y, height - MARGIN.bottom, MARGIN.top);
  const line = (points: readonly ForecastPoint[]) =>
    points.map((point) => `${px(parseTime(point.at))},${py(point.value)}`).join(" ");
  const forecastFrom = data.forecastFrom ? parseTime(data.forecastFrom) : Number.NEGATIVE_INFINITY;
  const fitted = data.observations.filter((point) => parseTime(point.at) >= forecastFrom);
  const dimmed = data.observations.filter((point) => parseTime(point.at) < forecastFrom);
  const last = data.observations[data.observations.length - 1];

  const onPointerDown = (event: PointerEvent<SVGSVGElement>) => {
    const rendered = event.currentTarget.getBoundingClientRect().width;
    if (rendered > 0) drag.current = { clientX: event.clientX, width: rendered };
  };
  const endDrag = () => {
    drag.current = undefined;
  };
  const onPointerUp = (event: PointerEvent<SVGSVGElement>) => {
    const start = drag.current;
    drag.current = undefined;
    if (!start || event.clientX === start.clientX) return;
    const plotShare = (width - MARGIN.left - MARGIN.right) / width;
    onPan((start.clientX - event.clientX) / (start.width * plotShare));
  };

  return (
    <svg
      role="img"
      aria-label={summary}
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      style={{ display: "block", touchAction: "pan-y" }}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={endDrag}
      onPointerCancel={endDrag}
    >
      <title>{title}</title>
      <defs>
        <clipPath id={clipId}>
          <rect x={MARGIN.left} y={0} width={width - MARGIN.left - MARGIN.right} height={height} />
        </clipPath>
      </defs>
      <Axes x={x} y={y} width={width} height={height} formatDate={formatDate} formatValue={formatValue} />
      <g clipPath={`url(#${clipId})`}>
        {(data.earlierRuns ?? []).map((run) => (
          <polyline key={run.label} data-custd-chart-layer="trail" points={line(run.points)} style={trailStyle}>
            <title>{run.label}</title>
          </polyline>
        ))}
        {last && data.target !== undefined && data.completionInterval ? (
          <polygon
            data-custd-chart-layer="band"
            points={line([
              last,
              { at: data.completionInterval.lower, value: data.target },
              { at: data.completionInterval.upper, value: data.target },
            ])}
            style={{ fill: COLOR.band, fillOpacity: 0.18, stroke: "none" }}
          />
        ) : null}
        {data.posteriorLines && data.posteriorLines.length > 0 ? (
          <path
            data-custd-chart-layer="posterior"
            d={data.posteriorLines.map((posterior) => `M${line(posterior.points).split(" ").join("L")}`).join(" ")}
            style={{ fill: "none", stroke: COLOR.forecast, strokeOpacity: 0.2, strokeWidth: 1 }}
          />
        ) : null}
        {last && data.target !== undefined && data.completionMedian ? (
          <polyline
            data-custd-chart-layer="median"
            points={line([last, { at: data.completionMedian, value: data.target }])}
            style={{ fill: "none", stroke: COLOR.forecast, strokeWidth: 2, strokeDasharray: "6 4" }}
          />
        ) : null}
        {dimmed.length > 0 ? <Observations layer="dimmed" points={dimmed} px={px} py={py} opacity={0.35} /> : null}
        <Observations layer="observed" points={fitted} px={px} py={py} opacity={1} />
      </g>
      {data.target !== undefined ? (
        <line
          data-custd-chart-layer="target"
          x1={MARGIN.left}
          x2={width - MARGIN.right}
          y1={py(data.target)}
          y2={py(data.target)}
          style={{ stroke: COLOR.target, strokeDasharray: "2 3" }}
        />
      ) : null}
      {data.deadline !== undefined ? (
        <DeadlineLine at={px(parseTime(data.deadline))} width={width} height={height} />
      ) : null}
    </svg>
  );
}

const trailStyle: CSSProperties = { fill: "none", stroke: COLOR.trail, strokeOpacity: 0.25, strokeWidth: 1.5 };

function DeadlineLine({ at, width, height }: { at: number; width: number; height: number }) {
  if (at < MARGIN.left || at > width - MARGIN.right) return null;
  return (
    <line
      data-custd-chart-layer="deadline"
      x1={at}
      x2={at}
      y1={MARGIN.top}
      y2={height - MARGIN.bottom}
      style={{ stroke: COLOR.deadline, strokeWidth: 1.5 }}
    />
  );
}

function Observations({
  layer,
  points,
  px,
  py,
  opacity,
}: {
  layer: string;
  points: readonly ForecastPoint[];
  px: (value: number) => number;
  py: (value: number) => number;
  opacity: number;
}) {
  return (
    <g data-custd-chart-layer={layer} style={{ opacity }}>
      <polyline
        points={points.map((point) => `${px(parseTime(point.at))},${py(point.value)}`).join(" ")}
        style={{ fill: "none", stroke: COLOR.observed, strokeWidth: 2 }}
      />
      {points.map((point) => (
        <circle
          key={point.at}
          cx={px(parseTime(point.at))}
          cy={py(point.value)}
          r={3}
          style={{ fill: COLOR.observed }}
        />
      ))}
    </g>
  );
}

function Axes({
  x,
  y,
  width,
  height,
  formatDate,
  formatValue,
}: Required<ChartFormatters> & { x: ChartDomain; y: ChartDomain; width: number; height: number }) {
  const px = scaleLinear(x, MARGIN.left, width - MARGIN.right);
  const py = scaleLinear(y, height - MARGIN.bottom, MARGIN.top);
  const text: CSSProperties = { fill: "currentColor", fontSize: 11, fontVariantNumeric: "tabular-nums" };
  return (
    <g data-custd-chart-layer="axes">
      {ticksOf(y, 4).map((tick) => (
        <g key={`y${tick}`}>
          <line x1={MARGIN.left} x2={width - MARGIN.right} y1={py(tick)} y2={py(tick)} style={GRID} />
          <text x={MARGIN.left - 6} y={py(tick)} dy="0.32em" textAnchor="end" style={text}>
            {formatValue(tick)}
          </text>
        </g>
      ))}
      {ticksOf(x, 4).map((tick, index) => (
        <text
          key={`x${tick}`}
          x={px(tick)}
          y={height - MARGIN.bottom + 18}
          textAnchor={index === 0 ? "start" : index === 3 ? "end" : "middle"}
          style={text}
        >
          {formatDate(tick)}
        </text>
      ))}
    </g>
  );
}

const GRID: CSSProperties = { stroke: COLOR.grid, strokeOpacity: 0.2 };

const VISUALLY_HIDDEN: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
};

const FULL_SCREEN_STYLE: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 1000,
  overflow: "auto",
  padding: 16,
  background: COLOR.surface,
};

function chartDomains(data: ForecastChartData): ChartDomains | undefined {
  const observedTimes = data.observations.map((point) => parseTime(point.at));
  const observed = domainOf(observedTimes, DAY_MS);
  if (!observed) return undefined;
  const lines = [...(data.posteriorLines ?? []), ...(data.earlierRuns ?? [])].flatMap((line) => line.points);
  const times = [
    ...observedTimes,
    ...lines.map((point) => parseTime(point.at)),
    ...[data.deadline, data.completionMedian, data.completionInterval?.lower, data.completionInterval?.upper]
      .filter((value): value is string => value !== undefined)
      .map(parseTime),
  ];
  const values = [0, ...data.observations.map((point) => point.value), ...lines.map((point) => point.value)];
  if (data.target !== undefined) values.push(data.target);
  const y = domainOf(values, 1) ?? { start: 0, end: 1 };
  return { full: domainOf(times, DAY_MS) ?? observed, observed, y: { start: y.start, end: y.end * 1.05 } };
}

function forecastSummary(
  title: string,
  data: ForecastChartData,
  formatDate: (epochMs: number) => string,
  formatValue: (value: number) => string,
): string {
  const parts = [`${title}: ${data.observations.length} measurements`];
  if (data.target !== undefined) parts.push(`target ${formatValue(data.target)}`);
  if (data.completionMedian) parts.push(`expected ${formatDate(parseTime(data.completionMedian))}`);
  const interval = data.completionInterval;
  if (interval) {
    const confidence = Math.round(interval.confidence * 100);
    parts.push(
      `${confidence}% likely between ${formatDate(parseTime(interval.lower))} and ${formatDate(parseTime(interval.upper))}`,
    );
  }
  if (data.deadline) parts.push(`deadline ${formatDate(parseTime(data.deadline))}`);
  return parts.join("; ");
}
