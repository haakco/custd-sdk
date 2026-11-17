// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ConvergenceStory } from "./convergence-story.js";
import type { ConvergenceEstimate } from "./forecast-types.js";

const estimates: ConvergenceEstimate[] = [
  { estimatedAt: "2026-06-01T00:00:00Z", low: "2026-07-01T00:00:00Z", high: "2026-08-30T00:00:00Z", widthDays: 60 },
  {
    estimatedAt: "2026-06-15T00:00:00Z",
    low: "2026-07-10T00:00:00Z",
    high: "2026-08-09T00:00:00Z",
    widthDays: 30,
    movementDays: -10.5,
  },
];

afterEach(cleanup);

describe("ConvergenceStory", () => {
  it("draws the converging band and states the change since the last estimate", () => {
    const { container } = render(
      <ConvergenceStory estimates={estimates} targetDate="2026-07-31T00:00:00Z" title="Delivery" />,
    );
    expect(screen.getByRole("img", { name: /Delivery: 2 estimates/ })).toBeTruthy();
    for (const layer of ["band", "midpoint", "target"]) {
      expect(container.querySelector(`[data-custd-chart-layer="${layer}"]`), layer).not.toBeNull();
    }
    expect(screen.getByText("Latest estimate: 2026-07-10 to 2026-08-09")).toBeTruthy();
    expect(screen.getByText("Moved 11 days earlier; range narrowed by 30 days.")).toBeTruthy();
    expect(container.querySelector("[data-custd-chart-layer='stale']")).toBeNull();
  });

  it("marks a stale latest estimate", () => {
    const { container } = render(
      <ConvergenceStory estimates={estimates} title="Delivery" now="2026-06-25T00:00:00Z" staleAfterDays={7} />,
    );
    expect(screen.getByText("Last estimate is 10 days old.")).toBeTruthy();
    expect(container.querySelector("[data-custd-chart-layer='stale']")).not.toBeNull();
  });

  it("handles a first estimate and no estimates in the client's wording", () => {
    const first = render(
      <ConvergenceStory estimates={estimates.slice(0, 1)} title="Delivery" labels={{ firstEstimate: "First one" }} />,
    );
    expect(screen.getByText("First one")).toBeTruthy();
    first.unmount();
    render(<ConvergenceStory estimates={[]} title="Delivery" labels={{ empty: "Nothing yet" }} />);
    expect(screen.getByText("Nothing yet")).toBeTruthy();
    expect(screen.queryByRole("img")).toBeNull();
  });
});
