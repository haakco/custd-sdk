import { describe, expect, it } from "vitest";
import { formatExactMoney } from "./exact-money.js";

describe("formatExactMoney", () => {
  it("passes exact decimal strings through Intl without floating-point drift", () => {
    expect(
      formatExactMoney({
        currency: "USD",
        amountValue: 9_007_199_254_740_001,
        amountScale: 9,
      }),
    ).toBe("USD 9,007,199.254740001");
    expect(formatExactMoney({ currency: "USD", amountValue: 1, amountScale: 9 })).toBe("USD 0.000000001");
  });

  it("uses the exact-money scale while respecting currency defaults", () => {
    expect(formatExactMoney({ currency: "USD", amountValue: 999, amountScale: 2 })).toBe("USD 9.99");
    expect(formatExactMoney({ currency: "USD", amountValue: 1, amountScale: 0 })).toBe("USD 1");
    expect(formatExactMoney({ currency: "JPY", amountValue: 1000, amountScale: 0 })).toBe("JPY 1,000");
    expect(formatExactMoney({ currency: "USD", amountValue: -1234, amountScale: 2 })).toBe("-USD 12.34");
  });

  it("allows the two presentation controls needed by consumers", () => {
    expect(
      formatExactMoney(
        { currency: "USD", amountValue: 999, amountScale: 2 },
        { locale: "de-DE", currencyDisplay: "symbol" },
      ),
    ).toBe("9,99 $");
  });

  it.each([
    [{ currency: "usd", amountValue: 1, amountScale: 2 }, "currency"],
    [{ currency: "USD", amountValue: 1.5, amountScale: 2 }, "amountValue"],
    [{ currency: "USD", amountValue: 1, amountScale: 10 }, "amountScale"],
  ])("rejects an invalid %s", (money, field) => {
    expect(() => formatExactMoney(money)).toThrow(new RegExp(field));
  });
});
