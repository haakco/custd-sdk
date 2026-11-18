import { APP_MODEL_QUANTITY_KINDS, type AppModelInput, type AppModelQuantity, type AppModelRangeDistribution } from "@haakco/custd-sdk/browser";
/** What a value cell holds once read: an input or a formula (without its `=`). */
export type ModelValue = {
    kind: typeof APP_MODEL_QUANTITY_KINDS.input;
    input: AppModelInput;
} | {
    kind: typeof APP_MODEL_QUANTITY_KINDS.formula;
    formula: string;
};
export type ModelValueParse = {
    ok: true;
    value: ModelValue;
} | {
    ok: false;
    message: string;
};
/**
 * Reads the value shorthand: `=a * b` is a formula, `5 to 10` a 90% range shaped by `distribution`,
 * `1 of 5` a proportion, several numbers pasted data, and one number a point. The server checks
 * the result again; this only gives the editor an early, local message.
 */
export declare function parseModelValue(text: string, distribution?: AppModelRangeDistribution): ModelValueParse;
/** Writes a stored quantity back as shorthand. A bound input has none: it is shown, not typed. */
export declare function formatModelValue(quantity: AppModelQuantity): string;
/** The range shape a stored quantity uses, or the default for a new one. */
export declare function rangeDistributionOf(quantity: AppModelQuantity | undefined): AppModelRangeDistribution;
/** Shows a number compactly for labels and tables. */
export declare function formatModelNumber(value: number): string;
