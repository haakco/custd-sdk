// Uncertainty model items: a named set of quantities, each an input estimate or a formula over
// other quantities, saved as immutable numbered versions (Admin API /api/v1/app/item/model) and
// run as seeded Monte Carlo (Analytics API /api/v1/app/models). The JSON names match the routes.
export const APP_MODEL_QUANTITY_KINDS = {
    input: "input",
    formula: "formula",
};
export const APP_MODEL_INPUT_SHAPES = {
    /** One known value. */
    point: "point",
    /** A low and high read as a 90% interval. */
    range: "range",
    /** k successes of n trials, read as a beta distribution. */
    proportion: "proportion",
    /** Pasted data used as an empirical distribution. */
    samples: "samples",
    /** A live input read from its source when the model runs. */
    bound: "bound",
};
export const APP_MODEL_RANGE_DISTRIBUTIONS = {
    normal: "normal",
    lognormal: "lognormal",
    uniform: "uniform",
};
export const APP_MODEL_SOURCE_KINDS = {
    /** The latest completed counter forecast of a measurement project. */
    counterForecast: "counter_forecast",
};
export const APP_MODEL_FORECAST_FIELDS = {
    completionDays: "completion_days",
    deadlineProbability: "deadline_probability",
    ratePerDay: "rate_per_day",
};
/** Problem codes of the model routes, beside the app item codes. */
export const APP_MODEL_ERROR_CODES = {
    versionLimit: "app_item_model_version_limit",
    runMissing: "app_model_run_missing",
    runInvalid: "uncertainty_model_run_invalid",
    /** The quantities reference each other in a loop; `fieldErrors` names each one in it. */
    formulaCycle: "formula_cycle",
    /** Too many calculations from this caller; wait and try again. */
    calculateLimited: "app_model_calculate_limited",
};
export const APP_MODEL_RUN_TRIGGERS = {
    request: "request",
    sourceChanged: "source_changed",
};
export const APP_MODEL_BOUND_STATES = {
    resolved: "resolved",
    sourceMissing: "source_missing",
    valueMissing: "value_missing",
};
// ---- Summary CSV ----
const CSV_COLUMNS = ["quantity", "unit", "mean", "std_dev", "p5", "p25", "p50", "p75", "p95", "error"];
/**
 * One row per quantity of a run: mean, spread and percentiles, or the reason it failed. Units come
 * from the model's quantities when given. Text cells are quoted and cells a spreadsheet would read
 * as a formula are prefixed with `'`.
 */
export function modelRunSummaryCsv(run, quantities = []) {
    const units = new Map(quantities.map((quantity) => [quantity.name, quantity.unit ?? ""]));
    const rows = (run.quantities ?? []).map((result) => {
        const summary = result.summary;
        const numbers = summary
            ? [
                summary.mean,
                summary.stdDev,
                summary.percentiles.p5,
                summary.percentiles.p25,
                summary.percentiles.p50,
                summary.percentiles.p75,
                summary.percentiles.p95,
            ].map(String)
            : ["", "", "", "", "", "", ""];
        const error = result.error ? `${result.error.code}: ${result.error.detail}` : "";
        return [csvText(result.name), csvText(units.get(result.name) ?? ""), ...numbers, csvText(error)].join(",");
    });
    return `${[CSV_COLUMNS.join(","), ...rows].join("\r\n")}\r\n`;
}
function csvText(value) {
    const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
    return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}
