// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ArrivalHistogram } from "./arrival-histogram.js";
import type { ArrivalHistogramData } from "./forecast-types.js";

const histogram: ArrivalHistogramData = {
  bins: [
    { start: "2026-07-20T00:00:00Z", end: "2026-07-25T00:00:00Z", count: 30 },
    { start: "2026-07-25T00:00:00Z", end: "2026-07-30T00:00:00Z", count: 50 },
    { start: "2026-07-30T00:00:00Z", end: "2026-08-04T00:00:00Z", count: 15 },
  ],
  neverCount: 5,
};

afterEach(cleanup);

describe("ArrivalHistogram", () => {
  it("draws one bar per bin, splits at the deadline and counts draws that never arrive", () => {
    const { container } = render(
      <ArrivalHistogram histogram={histogram} deadline="2026-07-30T00:00:00Z" title="Arrival" />,
    );
    expect(
      screen.getByRole("img", { name: "Arrival: 100 draws, 95 arrive between 2026-07-20 and 2026-08-04" }),
    ).toBeTruthy();
    expect(container.querySelectorAll("[data-custd-chart-bar='before']")).toHaveLength(2);
    expect(container.querySelectorAll("[data-custd-chart-bar='after']")).toHaveLength(1);
    expect(container.querySelector("[data-custd-chart-layer='deadline']")).not.toBeNull();
    expect(screen.getByText("5 of 100 draws never reach the target.")).toBeTruthy();
  });

  it("draws one bar when every draw arrives at the same instant", () => {
    const at = "2026-07-25T00:00:00Z";
    const bins = Array.from({ length: 20 }, (_, index) => ({ start: at, end: at, count: index === 0 ? 8 : 0 }));
    const { container } = render(<ArrivalHistogram histogram={{ bins, neverCount: 0 }} title="Arrival" />);
    expect(container.querySelectorAll("[data-custd-chart-bar]")).toHaveLength(1);
    expect(
      screen.getByRole("img", { name: "Arrival: 8 draws, 8 arrive between 2026-07-25 and 2026-07-25" }),
    ).toBeTruthy();
  });

  it("shows the empty state when no draw arrives", () => {
    render(
      <ArrivalHistogram histogram={{ bins: [], neverCount: 40 }} title="Arrival" labels={{ empty: "None arrive" }} />,
    );
    expect(screen.getByText("None arrive")).toBeTruthy();
    expect(screen.queryByRole("img")).toBeNull();
  });
});
