import type { AppModelQuantityResult } from "@haakco/custd-sdk/browser";
import type { CSSProperties } from "react";
import { scaleLinear } from "./chart-scale.js";
import { formatModelNumber } from "./model-shorthand.js";

export type QuantityHistogramLabels = {
  empty: string;
  failed: (detail: string) => string;
  summary: (mean: string, low: string, high: string) => string;
  bin: (low: string, high: string, count: number) => string;
  mean: string;
  interval: string;
};

export type QuantityHistogramProps = {
  result: AppModelQuantityResult;
  title: string;
  unit?: string;
  formatValue?: (value: number) => string;
  labels?: Partial<QuantityHistogramLabels>;
  width?: number;
  height?: number;
  className?: string;
  style?: CSSProperties;
};

const DEFAULT_LABELS: QuantityHistogramLabels = {
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
export function QuantityHistogram({
  result,
  title,
  unit,
  formatValue = formatModelNumber,
  labels: overrides,
  width = 480,
  height = 140,
  className,
  style,
}: QuantityHistogramProps) {
  const labels = { ...DEFAULT_LABELS, ...overrides };
  const withUnit = (value: number) => (unit ? `${formatValue(value)} ${unit}` : formatValue(value));
  if (result.error) {
    return (
      <div className={className} style={style} data-custd-chart="quantity-histogram" data-custd-chart-state="failed">
        <p>{labels.failed(result.error.detail)}</p>
      </div>
    );
  }
  const summary = result.summary;
  const counts = (summary?.histogram.counts ?? []).slice(0, MAX_BINS);
  const total = counts.reduce((sum, count) => sum + count, 0);
  if (!summary || total === 0) {
    return (
      <div className={className} style={style} data-custd-chart="quantity-histogram" data-custd-chart-state="empty">
        <p>{labels.empty}</p>
      </div>
    );
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
  const text: CSSProperties = { fill: "currentColor", fontSize: 11, fontVariantNumeric: "tabular-nums" };
  const described = labels.summary(withUnit(summary.mean), withUnit(p5), withUnit(p95));
  const clamp = (value: number) => Math.min(width - MARGIN.right, Math.max(MARGIN.left, px(value)));
  return (
    <figure className={className} style={{ margin: 0, ...style }} data-custd-chart="quantity-histogram">
      <svg
        role="img"
        aria-label={`${title}: ${described}`}
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        style={{ display: "block" }}
      >
        <title>{title}</title>
        {bins.map(({ low, high, count }) => {
          const left = single ? px(min) - 3 : px(low) + 0.5;
          return (
            <rect
              key={low}
              data-custd-chart-bar=""
              x={left}
              y={py(count)}
              width={single ? 6 : Math.max(0, px(high) - px(low) - 1)}
              height={baseline - py(count)}
              style={{ fill: COLOR.bar, fillOpacity: 0.75 }}
            >
              <title>{labels.bin(withUnit(low), withUnit(high), count)}</title>
            </rect>
          );
        })}
        <g data-custd-chart-layer="interval">
          <title>{`${labels.interval}: ${withUnit(p5)} to ${withUnit(p95)}`}</title>
          <rect
            x={clamp(p5)}
            y={baseline + 6}
            width={Math.max(2, clamp(p95) - clamp(p5))}
            height={5}
            rx={2.5}
            style={{ fill: COLOR.interval, fillOpacity: 0.6 }}
          />
          <circle cx={clamp(p50)} cy={baseline + 8.5} r={3.5} style={{ fill: COLOR.median }} />
        </g>
        <line
          data-custd-chart-layer="mean"
          x1={clamp(summary.mean)}
          x2={clamp(summary.mean)}
          y1={MARGIN.top}
          y2={baseline}
          style={{ stroke: COLOR.mean, strokeWidth: 1.5, strokeDasharray: "4 3" }}
        >
          <title>{`${labels.mean}: ${withUnit(summary.mean)}`}</title>
        </line>
        <text x={MARGIN.left} y={height - 4} style={text}>
          {withUnit(domain.start)}
        </text>
        <text x={width - MARGIN.right} y={height - 4} textAnchor="end" style={text}>
          {withUnit(domain.end)}
        </text>
      </svg>
      <figcaption>{described}</figcaption>
    </figure>
  );
}
