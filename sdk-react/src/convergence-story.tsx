import type { CSSProperties } from "react";
import { DAY_MS, domainOf, formatUtcDate, parseTime, scaleLinear } from "./chart-scale.js";
import type { ConvergenceEstimate } from "./forecast-types.js";

export type ConvergenceStoryLabels = {
  empty: string;
  firstEstimate: string;
  latest: (low: string, high: string) => string;
  /** `movementDays` is positive when the estimate moved later; `widthChangeDays` is negative when it narrowed. */
  change: (movementDays: number, widthChangeDays: number) => string;
  stale: (ageDays: number) => string;
};

export type ConvergenceStoryProps = {
  /** Dated estimates, oldest first (`delivery.estimates`). */
  estimates: readonly ConvergenceEstimate[];
  /** The delivery target date (`delivery.targetDate`). */
  targetDate?: string;
  title: string;
  summary?: string;
  /** Marks the latest estimate stale once it is older than this many days. */
  staleAfterDays?: number;
  /** The time staleness is measured against; defaults to now. */
  now?: string;
  labels?: Partial<ConvergenceStoryLabels>;
  formatDate?: (epochMs: number) => string;
  width?: number;
  height?: number;
  className?: string;
  style?: CSSProperties;
};

const DEFAULT_LABELS: ConvergenceStoryLabels = {
  empty: "No estimates yet.",
  firstEstimate: "This is the first estimate.",
  latest: (low, high) => `Latest estimate: ${low} to ${high}`,
  change: (movementDays, widthChangeDays) => `${movementText(movementDays)}; ${widthText(widthChangeDays)}.`,
  stale: (ageDays) => `Last estimate is ${ageDays} days old.`,
};

const MARGIN = { top: 12, right: 12, bottom: 28, left: 80 };

const COLOR = {
  band: "var(--custd-chart-band, currentColor)",
  forecast: "var(--custd-chart-forecast, currentColor)",
  target: "var(--custd-chart-target, currentColor)",
  stale: "var(--custd-chart-stale, currentColor)",
};

export function ConvergenceStory({
  estimates,
  targetDate,
  title,
  summary,
  staleAfterDays,
  now,
  labels: labelOverrides,
  formatDate = formatUtcDate,
  width = 640,
  height = 220,
  className,
  style,
}: ConvergenceStoryProps) {
  const labels = { ...DEFAULT_LABELS, ...labelOverrides };
  const latest = estimates[estimates.length - 1];
  if (!latest) {
    return (
      <div className={className} style={style} data-custd-chart="convergence" data-custd-chart-state="empty">
        <p>{labels.empty}</p>
      </div>
    );
  }
  const previous = estimates[estimates.length - 2];
  const nowMs = now ? parseTime(now) : Date.now();
  const ageDays = Math.floor((nowMs - parseTime(latest.estimatedAt)) / DAY_MS);
  const stale = staleAfterDays !== undefined && ageDays > staleAfterDays;
  const latestText = labels.latest(formatDate(parseTime(latest.low)), formatDate(parseTime(latest.high)));
  return (
    <div className={className} style={style} data-custd-chart="convergence" data-custd-chart-stale={stale}>
      <ConvergencePlot
        estimates={estimates}
        targetDate={targetDate}
        staleAt={stale ? nowMs : undefined}
        title={title}
        summary={summary ?? `${title}: ${estimates.length} estimates. ${latestText}`}
        formatDate={formatDate}
        width={width}
        height={height}
      />
      <p>{latestText}</p>
      <p>
        {previous
          ? labels.change(
              latest.movementDays ?? midpointShiftDays(previous, latest),
              latest.widthDays - previous.widthDays,
            )
          : labels.firstEstimate}
      </p>
      {stale ? <p data-custd-chart-stale-note="">{labels.stale(ageDays)}</p> : null}
    </div>
  );
}

type PlotProps = {
  estimates: readonly ConvergenceEstimate[];
  targetDate?: string;
  staleAt?: number;
  title: string;
  summary: string;
  formatDate: (epochMs: number) => string;
  width: number;
  height: number;
};

function ConvergencePlot({ estimates, targetDate, staleAt, title, summary, formatDate, width, height }: PlotProps) {
  const estimatedTimes = estimates.map((estimate) => parseTime(estimate.estimatedAt));
  const x = domainOf(staleAt === undefined ? estimatedTimes : [...estimatedTimes, staleAt], DAY_MS);
  const completionTimes = estimates.flatMap((estimate) => [parseTime(estimate.low), parseTime(estimate.high)]);
  const y = domainOf(targetDate ? [...completionTimes, parseTime(targetDate)] : completionTimes, DAY_MS);
  if (!x || !y) return null;
  const px = scaleLinear(x, MARGIN.left, width - MARGIN.right);
  const py = scaleLinear(y, height - MARGIN.bottom, MARGIN.top);
  const at = (estimate: ConvergenceEstimate, value: string) =>
    `${px(parseTime(estimate.estimatedAt))},${py(parseTime(value))}`;
  const band = [
    ...estimates.map((estimate) => at(estimate, estimate.high)),
    ...[...estimates].reverse().map((estimate) => at(estimate, estimate.low)),
  ];
  const midpoints = estimates.map(
    (estimate) =>
      `${px(parseTime(estimate.estimatedAt))},${py((parseTime(estimate.low) + parseTime(estimate.high)) / 2)}`,
  );
  const text: CSSProperties = { fill: "currentColor", fontSize: 11, fontVariantNumeric: "tabular-nums" };
  return (
    <svg role="img" aria-label={summary} viewBox={`0 0 ${width} ${height}`} width="100%" style={{ display: "block" }}>
      <title>{title}</title>
      <polygon data-custd-chart-layer="band" points={band.join(" ")} style={{ fill: COLOR.band, fillOpacity: 0.18 }} />
      <polyline
        data-custd-chart-layer="midpoint"
        points={midpoints.join(" ")}
        style={{ fill: "none", stroke: COLOR.forecast, strokeWidth: 2 }}
      />
      {targetDate ? (
        <line
          data-custd-chart-layer="target"
          x1={MARGIN.left}
          x2={width - MARGIN.right}
          y1={py(parseTime(targetDate))}
          y2={py(parseTime(targetDate))}
          style={{ stroke: COLOR.target, strokeDasharray: "2 3" }}
        />
      ) : null}
      {staleAt !== undefined ? (
        <line
          data-custd-chart-layer="stale"
          x1={px(staleAt)}
          x2={px(staleAt)}
          y1={MARGIN.top}
          y2={height - MARGIN.bottom}
          style={{ stroke: COLOR.stale, strokeDasharray: "4 4" }}
        />
      ) : null}
      <text x={MARGIN.left - 6} y={py(y.end)} dy="0.7em" textAnchor="end" style={text}>
        {formatDate(y.end)}
      </text>
      <text x={MARGIN.left - 6} y={py(y.start)} textAnchor="end" style={text}>
        {formatDate(y.start)}
      </text>
      <text x={MARGIN.left} y={height - 8} style={text}>
        {formatDate(x.start)}
      </text>
      <text x={width - MARGIN.right} y={height - 8} textAnchor="end" style={text}>
        {formatDate(x.end)}
      </text>
    </svg>
  );
}

function midpointShiftDays(previous: ConvergenceEstimate, latest: ConvergenceEstimate): number {
  const midpoint = (estimate: ConvergenceEstimate) => (parseTime(estimate.low) + parseTime(estimate.high)) / 2;
  return (midpoint(latest) - midpoint(previous)) / DAY_MS;
}

function movementText(days: number): string {
  const rounded = Math.round(Math.abs(days));
  if (rounded === 0) return "Did not move";
  return `Moved ${rounded} ${rounded === 1 ? "day" : "days"} ${days > 0 ? "later" : "earlier"}`;
}

function widthText(days: number): string {
  const rounded = Math.round(Math.abs(days));
  if (rounded === 0) return "range unchanged";
  return `range ${days < 0 ? "narrowed" : "widened"} by ${rounded} ${rounded === 1 ? "day" : "days"}`;
}
