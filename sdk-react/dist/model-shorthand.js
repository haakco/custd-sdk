import { APP_MODEL_INPUT_SHAPES, APP_MODEL_QUANTITY_KINDS, APP_MODEL_RANGE_DISTRIBUTIONS, } from "@haakco/custd-sdk/browser";
const NUMBER = String.raw `[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?`;
const POINT = new RegExp(`^${NUMBER}$`, "i");
const RANGE = new RegExp(`^(${NUMBER})\\s*(?:to|\\.\\.|–|—)\\s*(${NUMBER})$`, "i");
const PROPORTION = /^(\d+)\s*(?:of|\/)\s*(\d+)$/i;
const SAMPLE_SEPARATOR = /[\s,;]+/;
/**
 * Reads the value shorthand: `=a * b` is a formula, `5 to 10` a 90% range shaped by `distribution`,
 * `1 of 5` a proportion, several numbers pasted data, and one number a point. The server checks
 * the result again; this only gives the editor an early, local message.
 */
export function parseModelValue(text, distribution = APP_MODEL_RANGE_DISTRIBUTIONS.normal) {
    const value = text.trim();
    if (value.startsWith("=")) {
        const formula = value.slice(1).trim();
        if (formula === "")
            return { ok: false, message: "Write a formula after =." };
        return { ok: true, value: { kind: APP_MODEL_QUANTITY_KINDS.formula, formula } };
    }
    if (value === "")
        return { ok: false, message: "Enter a value, a range like 5 to 10, k of n or =formula." };
    if (POINT.test(value))
        return input({ shape: APP_MODEL_INPUT_SHAPES.point, value: Number(value) });
    const range = RANGE.exec(value);
    if (range)
        return parseRange(Number(range[1]), Number(range[2]), distribution);
    const proportion = PROPORTION.exec(value);
    if (proportion)
        return parseProportion(Number(proportion[1]), Number(proportion[2]));
    const samples = value.split(SAMPLE_SEPARATOR).filter((part) => part !== "");
    if (samples.length >= 2 && samples.every((part) => POINT.test(part))) {
        return input({ shape: APP_MODEL_INPUT_SHAPES.samples, samples: samples.map(Number) });
    }
    return { ok: false, message: "Use a number, a range like 5 to 10, k of n, pasted numbers or =formula." };
}
function parseRange(low, high, distribution) {
    if (!(low < high))
        return { ok: false, message: "The low end of a range must be below the high end." };
    if (distribution === APP_MODEL_RANGE_DISTRIBUTIONS.lognormal && low <= 0) {
        return { ok: false, message: "A lognormal range needs a low end above 0." };
    }
    return input({ shape: APP_MODEL_INPUT_SHAPES.range, low, high, distribution });
}
function parseProportion(successes, trials) {
    if (trials < 1 || successes > trials)
        return { ok: false, message: "k of n needs n at least 1 and k at most n." };
    return input({ shape: APP_MODEL_INPUT_SHAPES.proportion, successes, trials });
}
function input(value) {
    return { ok: true, value: { kind: APP_MODEL_QUANTITY_KINDS.input, input: value } };
}
/** Writes a stored quantity back as shorthand. A bound input has none: it is shown, not typed. */
export function formatModelValue(quantity) {
    if (quantity.kind === APP_MODEL_QUANTITY_KINDS.formula)
        return `=${quantity.formula}`;
    const value = quantity.input;
    switch (value.shape) {
        case APP_MODEL_INPUT_SHAPES.point:
            return String(value.value);
        case APP_MODEL_INPUT_SHAPES.range:
            return `${value.low} to ${value.high}`;
        case APP_MODEL_INPUT_SHAPES.proportion:
            return `${value.successes} of ${value.trials}`;
        case APP_MODEL_INPUT_SHAPES.samples:
            return value.samples.join(", ");
        case APP_MODEL_INPUT_SHAPES.bound:
            return "";
    }
}
/** The range shape a stored quantity uses, or the default for a new one. */
export function rangeDistributionOf(quantity) {
    if (quantity?.kind === APP_MODEL_QUANTITY_KINDS.input && quantity.input.shape === APP_MODEL_INPUT_SHAPES.range) {
        return quantity.input.distribution;
    }
    return APP_MODEL_RANGE_DISTRIBUTIONS.normal;
}
/** Shows a number compactly for labels and tables. */
export function formatModelNumber(value) {
    if (!Number.isFinite(value))
        return String(value);
    const magnitude = Math.abs(value);
    if (magnitude !== 0 && (magnitude >= 1e6 || magnitude < 1e-3))
        return value.toExponential(2);
    return value.toLocaleString("en-US", { maximumSignificantDigits: 4 });
}
