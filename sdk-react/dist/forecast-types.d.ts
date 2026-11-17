/**
 * Props DTOs for the forecast building blocks. Field names match the Custd analytics API
 * forecast run (`counter` result) and forecast story (`delivery`) JSON, so a response can be
 * passed through with at most a rename. Times are ISO-8601 strings.
 */
/** One value at one time: a measurement, or a point on a projected line (`MeasurementForecastPoint`). */
export type ForecastPoint = {
    at: string;
    value: number;
};
/** A completion-date interval at a stated confidence (`counter.completionInterval`). */
export type ForecastInterval = {
    confidence: number;
    lower: string;
    upper: string;
};
/** One posterior draw projected from the latest measurement (`counter.detail.posteriorLines[]`). */
export type ForecastPosteriorLine = {
    points: readonly ForecastPoint[];
};
/** An earlier run of the same work, drawn as a faint trail. */
export type ForecastEarlierRun = {
    label: string;
    points: readonly ForecastPoint[];
};
export type ForecastChartData = {
    /** The run's measurements, oldest first. */
    observations: readonly ForecastPoint[];
    /** The value the run is counting towards. */
    target?: number;
    /** The deadline the run must reach the target by. */
    deadline?: string;
    /** Median completion date (`percentiles.p50`). */
    completionMedian?: string;
    /** Central completion interval (`counter.completionInterval`, 90%). */
    completionInterval?: ForecastInterval;
    /** Measurements before this time were left out of the fit and are drawn dimmed (`forecastFrom`). */
    forecastFrom?: string;
    /** `counter.detail.posteriorLines`. */
    posteriorLines?: readonly ForecastPosteriorLine[];
    earlierRuns?: readonly ForecastEarlierRun[];
};
/** One arrival-time bin (`counter.detail.arrivalHistogram.bins[]`). */
export type ArrivalHistogramBin = {
    start: string;
    end: string;
    count: number;
};
/** Posterior draws counted by arrival time (`counter.detail.arrivalHistogram`). */
export type ArrivalHistogramData = {
    bins: readonly ArrivalHistogramBin[];
    neverCount: number;
};
/** One dated 90% estimate of the completion date (`delivery.estimates[]`). */
export type ConvergenceEstimate = {
    estimatedAt: string;
    low: string;
    high: string;
    note?: string;
    /** Spread of the estimate in days; a narrowing width is the estimate converging. */
    widthDays: number;
    /** How far the midpoint moved from the previous estimate, in days; positive is later. */
    movementDays?: number;
};
/** Formatters let the client own date and number wording. */
export type ChartFormatters = {
    formatDate?: (epochMs: number) => string;
    formatValue?: (value: number) => string;
};
