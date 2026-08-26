/**
 * Exact fixed-point money used by Custd APIs. The integer value represents
 * amountValue * 10^-amountScale; it must not be converted through a float.
 */
export type ExactMoney = {
    currency: string;
    amountValue: number;
    amountScale: number;
};
export type ExactMoneyFormatOptions = {
    locale?: string | string[];
    currencyDisplay?: Intl.NumberFormatOptions["currencyDisplay"];
};
/**
 * Format exact money for a human-facing boundary without losing fixed-point
 * digits. The default is deterministic en-US currency-code output; callers
 * can choose a locale and the symbol/code presentation when needed.
 */
export declare function formatExactMoney(money: ExactMoney, options?: ExactMoneyFormatOptions): string;
