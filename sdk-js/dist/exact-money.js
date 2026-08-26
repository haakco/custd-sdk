/**
 * Format exact money for a human-facing boundary without losing fixed-point
 * digits. The default is deterministic en-US currency-code output; callers
 * can choose a locale and the symbol/code presentation when needed.
 */
export function formatExactMoney(money, options = {}) {
    const decimal = exactDecimal(money);
    const formatter = new Intl.NumberFormat(options.locale ?? "en-US", {
        style: "currency",
        currency: money.currency,
        currencyDisplay: options.currencyDisplay ?? "code",
        minimumFractionDigits: money.amountScale,
        maximumFractionDigits: money.amountScale,
    });
    // Intl accepts decimal strings at runtime. Keeping this as a string avoids
    // rounding safe integers when a scale of up to nine fractional digits is used.
    // The test covering a safe integer above Number.MAX_SAFE_INTEGER's decimal
    // boundary protects this Node/browser runtime compatibility assumption.
    return formatter.format(decimal);
}
function exactDecimal(money) {
    if (!Number.isSafeInteger(money.amountValue)) {
        throw new RangeError("exact money amountValue must be a safe integer");
    }
    if (!Number.isInteger(money.amountScale) || money.amountScale < 0 || money.amountScale > 9) {
        throw new RangeError("exact money amountScale must be an integer from 0 to 9");
    }
    if (typeof money.currency !== "string" || !/^[A-Z]{3}$/.test(money.currency)) {
        throw new RangeError("exact money currency must be an uppercase three-letter code");
    }
    const sign = money.amountValue < 0 ? "-" : "";
    const digits = String(Math.abs(money.amountValue));
    if (money.amountScale === 0) {
        return `${sign}${digits}`;
    }
    const padded = digits.padStart(money.amountScale + 1, "0");
    return `${sign}${padded.slice(0, -money.amountScale)}.${padded.slice(-money.amountScale)}`;
}
