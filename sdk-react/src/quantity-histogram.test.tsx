// @vitest-environment jsdom
import type { AppModelQuantityResult } from "@haakco/custd-sdk/browser";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { QuantityHistogram } from "./quantity-histogram.js";

afterEach(cleanup);

function result(min: number, max: number, counts: number[] | null): AppModelQuantityResult {
  return {
    name: "revenue",
    summary: {
      mean: 12,
      stdDev: 2,
      percentiles: { p5: 9, p25: 11, p50: 12, p75: 13, p95: 15 },
      histogram: { min, max, counts },
    },
  };
}

describe("QuantityHistogram", () => {
  it("draws one bar per bin with the mean and 90% interval marked", () => {
    const { container } = render(<QuantityHistogram result={result(8, 16, [1, 4, 9, 4])} title="Revenue" unit="k$" />);
    expect(container.querySelectorAll("[data-custd-chart-bar]")).toHaveLength(4);
    expect(container.querySelector("[data-custd-chart-layer='mean']")).not.toBeNull();
    expect(container.querySelector("[data-custd-chart-layer='interval']")).not.toBeNull();
    expect(
      screen.getByRole("img", { name: "Revenue: Mean 12 k$; 90% of samples between 9 k$ and 15 k$." }),
    ).toBeTruthy();
  });

  it("draws a single centred bar when every sample is the same", () => {
    const { container } = render(<QuantityHistogram result={result(5, 5, [0, 50, 0])} title="Fixed" />);
    expect(container.querySelectorAll("[data-custd-chart-bar]")).toHaveLength(1);
  });

  it("shows an empty state without samples and the reason for a failed quantity", () => {
    const { container, rerender } = render(<QuantityHistogram result={result(0, 1, null)} title="None" />);
    expect(container.querySelector("[data-custd-chart-state='empty']")).not.toBeNull();
    rerender(
      <QuantityHistogram
        result={{ name: "x", error: { code: "model_upstream_failed", detail: "reads a failed quantity" } }}
        title="Failed"
      />,
    );
    expect(screen.getByText("Not calculated: reads a failed quantity")).toBeTruthy();
  });
});
