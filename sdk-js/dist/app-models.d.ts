export declare const APP_MODEL_QUANTITY_KINDS: {
    readonly input: "input";
    readonly formula: "formula";
};
export type AppModelQuantityKind = (typeof APP_MODEL_QUANTITY_KINDS)[keyof typeof APP_MODEL_QUANTITY_KINDS];
export declare const APP_MODEL_INPUT_SHAPES: {
    /** One known value. */
    readonly point: "point";
    /** A low and high read as a 90% interval. */
    readonly range: "range";
    /** k successes of n trials, read as a beta distribution. */
    readonly proportion: "proportion";
    /** Pasted data used as an empirical distribution. */
    readonly samples: "samples";
    /** A live input read from its source when the model runs. */
    readonly bound: "bound";
};
export type AppModelInputShape = (typeof APP_MODEL_INPUT_SHAPES)[keyof typeof APP_MODEL_INPUT_SHAPES];
export declare const APP_MODEL_RANGE_DISTRIBUTIONS: {
    readonly normal: "normal";
    readonly lognormal: "lognormal";
    readonly uniform: "uniform";
};
export type AppModelRangeDistribution = (typeof APP_MODEL_RANGE_DISTRIBUTIONS)[keyof typeof APP_MODEL_RANGE_DISTRIBUTIONS];
export declare const APP_MODEL_SOURCE_KINDS: {
    /** The latest completed counter forecast of a measurement project. */
    readonly counterForecast: "counter_forecast";
};
export type AppModelSourceKind = (typeof APP_MODEL_SOURCE_KINDS)[keyof typeof APP_MODEL_SOURCE_KINDS];
export declare const APP_MODEL_FORECAST_FIELDS: {
    readonly completionDays: "completion_days";
    readonly deadlineProbability: "deadline_probability";
    readonly ratePerDay: "rate_per_day";
};
export type AppModelForecastField = (typeof APP_MODEL_FORECAST_FIELDS)[keyof typeof APP_MODEL_FORECAST_FIELDS];
/** Problem codes of the model routes, beside the app item codes. */
export declare const APP_MODEL_ERROR_CODES: {
    readonly versionLimit: "app_item_model_version_limit";
    readonly runMissing: "app_model_run_missing";
    readonly runInvalid: "uncertainty_model_run_invalid";
    /** The quantities reference each other in a loop; `fieldErrors` names each one in it. */
    readonly formulaCycle: "formula_cycle";
    /** Too many calculations from this caller; wait and try again. */
    readonly calculateLimited: "app_model_calculate_limited";
};
export declare const APP_MODEL_RUN_TRIGGERS: {
    readonly request: "request";
    readonly sourceChanged: "source_changed";
};
export type AppModelRunTrigger = (typeof APP_MODEL_RUN_TRIGGERS)[keyof typeof APP_MODEL_RUN_TRIGGERS];
export declare const APP_MODEL_BOUND_STATES: {
    readonly resolved: "resolved";
    readonly sourceMissing: "source_missing";
    readonly valueMissing: "value_missing";
};
export type AppModelBoundState = (typeof APP_MODEL_BOUND_STATES)[keyof typeof APP_MODEL_BOUND_STATES];
export type AppModelInputSource = {
    kind: AppModelSourceKind;
    /** Lowercase UUID of the bound measurement project. */
    projectUuid: string;
    field: AppModelForecastField;
};
/** An input's shorthand; only the fields of its shape are sent. */
export type AppModelInput = {
    shape: typeof APP_MODEL_INPUT_SHAPES.point;
    value: number;
} | {
    shape: typeof APP_MODEL_INPUT_SHAPES.range;
    low: number;
    high: number;
    distribution: AppModelRangeDistribution;
} | {
    shape: typeof APP_MODEL_INPUT_SHAPES.proportion;
    successes: number;
    trials: number;
} | {
    shape: typeof APP_MODEL_INPUT_SHAPES.samples;
    samples: number[];
} | {
    shape: typeof APP_MODEL_INPUT_SHAPES.bound;
    source: AppModelInputSource;
};
type AppModelQuantityBase = {
    /** A letter or underscore, then letters, digits or underscores; formulas refer to it. */
    name: string;
    /** Markdown. */
    description?: string;
    unit?: string;
};
/** One cell of a version. A formula is stored without a leading `=`. */
export type AppModelQuantity = (AppModelQuantityBase & {
    kind: typeof APP_MODEL_QUANTITY_KINDS.input;
    input: AppModelInput;
}) | (AppModelQuantityBase & {
    kind: typeof APP_MODEL_QUANTITY_KINDS.formula;
    formula: string;
});
export type AppModelVersion = {
    versionUuid: string;
    versionNumber: number;
    note: string;
    quantities: AppModelQuantity[];
    createdAt: string;
};
/** The model an `uncertainty_model` item wraps, with its latest version when one was saved. */
export type AppUncertaintyModel = {
    modelUuid: string;
    name: string;
    description: string;
    /** 0 until a version is saved. */
    latestVersion: number;
    createdAt: string;
    updatedAt: string;
    version?: AppModelVersion;
    queuedRunFailure?: AppModelQueuedRunFailure;
};
/** The model of a new item; its quantities, when given, are saved as version 1. */
export type AppModelCreate = {
    name: string;
    description?: string;
    quantities?: AppModelQuantity[];
    note?: string;
};
/** A new immutable version: the whole quantity list, 1 to 100 quantities. */
export type AppModelVersionCreateRequest = {
    quantities: AppModelQuantity[];
    note?: string;
};
/** Copies one version into a new item. 0 or absent copies the latest; no name gives "Copy of …". */
export type AppModelCopyRequest = {
    name?: string;
    versionNumber?: number;
};
/** Acting is worth valuePerUnit × (output − threshold); holding is worth zero. */
export type AppModelDecision = {
    output: string;
    threshold: number;
    /** Above 0. */
    valuePerUnit: number;
    /** What a measurement must be worth before it is suggested. */
    minimumWorthwhile?: number;
};
/** One run. 0 or absent runs the latest version with the default sample count (max 10000). */
export type AppModelRunRequest = {
    versionNumber?: number;
    seed: number;
    sampleCount?: number;
    /** The quantity inputs are ranked against; with a decision it defaults to the decision output. */
    sensitivityOutput?: string;
    decision?: AppModelDecision;
};
/** A calculator run: some inputs set to other values, only the named outputs back. Never stored. */
export type AppModelCalculateRequest = {
    /** 0 or absent: the latest version. */
    versionNumber?: number;
    seed?: number;
    sampleCount?: number;
    inputs?: {
        name: string;
        input: AppModelInput;
    }[];
    outputs: string[];
};
export type AppModelCalculateResult = {
    modelUuid: string;
    versionNumber: number;
    seed: number;
    sampleCount: number;
    quantities: AppModelQuantityResult[] | null;
};
/** Why the run a live input's source change queued has not landed; it stays until one succeeds. */
export type AppModelQueuedRunFailure = {
    error: string;
    failedAt: string;
    attempts: number;
};
export type AppModelPercentiles = {
    p5: number;
    p25: number;
    p50: number;
    p75: number;
    p95: number;
};
/** Sample counts in equal-width bins from min to max. */
export type AppModelHistogram = {
    min: number;
    max: number;
    counts: number[] | null;
};
export type AppModelQuantitySummary = {
    mean: number;
    stdDev: number;
    percentiles: AppModelPercentiles;
    histogram: AppModelHistogram;
};
/** `code` is an uncertainty error code such as `model_input_source_missing` or `model_upstream_failed`. */
export type AppModelQuantityError = {
    code: string;
    detail: string;
};
/** One quantity's summary, or the reason it failed. */
export type AppModelQuantityResult = {
    name: string;
    summary?: AppModelQuantitySummary;
    error?: AppModelQuantityError;
};
export type AppModelScatterPoint = {
    input: number;
    output: number;
};
/** Spearman rank correlation with the output; only the strongest ten inputs keep a scatter sample. */
export type AppModelInputSensitivity = {
    name: string;
    rankCorrelation: number;
    share: number;
    scatter?: AppModelScatterPoint[] | null;
};
export type AppModelSensitivity = {
    output: string;
    inputs: AppModelInputSensitivity[] | null;
};
export type AppModelInputInformation = {
    name: string;
    expectedValueOfPerfectInformation: number;
};
/** "What to measure next" for the run's decision. */
export type AppModelInformation = {
    recommended: "act" | "hold";
    actProbability: number;
    expectedValueOfPerfectInformation: number;
    /** Empty when no measurement is worth its minimum. */
    suggestedNextMeasurement?: string;
    inputs: AppModelInputInformation[] | null;
};
export type AppModelBoundInput = {
    quantity: string;
    source: AppModelInputSource;
    state: AppModelBoundState;
    value?: number;
    forecastRunUuid?: string;
    forecastGeneratedAt?: string;
    detail?: string;
};
/** One stored run with its results, in model order. */
export type AppModelRun = {
    runUuid: string;
    modelUuid: string;
    versionNumber: number;
    trigger: AppModelRunTrigger;
    sourceForecastRunUuid?: string;
    seed: number;
    sampleCount: number;
    createdAt: string;
    sensitivityOutput?: string;
    decision?: AppModelDecision;
    quantities: AppModelQuantityResult[] | null;
    sensitivity?: AppModelSensitivity;
    information?: AppModelInformation;
    boundInputs: AppModelBoundInput[] | null;
    /** On the latest-run read only: a queued run failed after this run was made. */
    queuedRunFailure?: AppModelQueuedRunFailure;
};
/**
 * One row per quantity of a run: mean, spread and percentiles, or the reason it failed. Units come
 * from the model's quantities when given. Text cells are quoted and cells a spreadsheet would read
 * as a formula are prefixed with `'`.
 */
export declare function modelRunSummaryCsv(run: Pick<AppModelRun, "quantities">, quantities?: AppModelQuantity[]): string;
export {};
