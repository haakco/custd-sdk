// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ForecastChart } from "./forecast-chart.js";
import type { ForecastChartData } from "./forecast-types.js";

const data: ForecastChartData = {
  observations: [
    { at: "2026-07-01T00:00:00Z", value: 0 },
    { at: "2026-07-05T00:00:00Z", value: 40 },
    { at: "2026-07-11T00:00:00Z", value: 100 },
  ],
  target: 300,
  deadline: "2026-07-31T00:00:00Z",
  completionMedian: "2026-07-25T00:00:00Z",
  completionInterval: { confidence: 0.9, lower: "2026-07-21T00:00:00Z", upper: "2026-08-10T00:00:00Z" },
  forecastFrom: "2026-07-03T00:00:00Z",
  posteriorLines: [
    {
      points: [
        { at: "2026-07-11T00:00:00Z", value: 100 },
        { at: "2026-07-26T00:00:00Z", value: 300 },
      ],
    },
  ],
  earlierRuns: [
    {
      label: "June",
      points: [
        { at: "2026-07-01T00:00:00Z", value: 0 },
        { at: "2026-07-20T00:00:00Z", value: 280 },
      ],
    },
  ],
};

function reduceMotion(matches: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches,
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
}

function view() {
  return screen.getByRole("status").textContent;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ForecastChart", () => {
  it("draws every layer and summarises the forecast for screen readers", () => {
    reduceMotion(true);
    const { container } = render(<ForecastChart data={data} title="Signups" />);
    expect(screen.getByRole("img", { name: /Signups/ }).getAttribute("aria-label")).toContain(
      "90% likely between 2026-07-21 and 2026-08-10",
    );
    for (const layer of ["observed", "dimmed", "median", "band", "target", "deadline", "posterior", "trail"]) {
      expect(container.querySelector(`[data-custd-chart-layer="${layer}"]`), layer).not.toBeNull();
    }
    expect(view()).toBe("Showing 2026-07-01 to 2026-08-10");
  });

  it("names every control and zooms, pans, resets and zooms to the data", () => {
    reduceMotion(true);
    render(<ForecastChart data={data} title="Signups" />);
    const zoomIn = screen.getByRole("button", { name: "Zoom in" });
    expect(screen.getByRole("button", { name: "Zoom out" })).toHaveProperty("disabled", true);
    expect(screen.getByRole("button", { name: "Pan earlier" })).toHaveProperty("disabled", true);

    fireEvent.click(zoomIn);
    expect(view()).toBe("Showing 2026-07-11 to 2026-07-31");
    fireEvent.click(screen.getByRole("button", { name: "Pan earlier" }));
    expect(view()).toBe("Showing 2026-07-06 to 2026-07-26");
    fireEvent.click(screen.getByRole("button", { name: "Reset view" }));
    expect(view()).toBe("Showing 2026-07-01 to 2026-08-10");
    fireEvent.click(screen.getByRole("button", { name: "Zoom to data" }));
    expect(view()).toBe("Showing 2026-07-01 to 2026-07-11");
  });

  it("toggles full screen and leaves it on Escape", () => {
    reduceMotion(true);
    const { container } = render(<ForecastChart data={data} title="Signups" />);
    const toggle = screen.getByRole("button", { name: "Full screen" });
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    expect(container.querySelector("[data-custd-chart-fullscreen='true']")).not.toBeNull();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
  });

  it("animates zoom only when motion is allowed, announcing just the destination", async () => {
    reduceMotion(false);
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => frames.push(callback));
    vi.stubGlobal("cancelAnimationFrame", () => undefined);
    const { container } = render(<ForecastChart data={data} title="Signups" />);
    const drawnEnd = () =>
      Array.from(container.querySelectorAll("[data-custd-chart-layer='axes'] text")).pop()?.textContent;
    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(view()).toBe("Showing 2026-07-11 to 2026-07-31");
    expect(drawnEnd()).toBe("2026-08-10");
    await act(async () => {
      for (let frame = frames.shift(); frame; frame = frames.shift()) frame(performance.now() + 1_000);
    });
    expect(drawnEnd()).toBe("2026-07-31");
  });

  it("keeps the reader's zoom when equal data arrives again", () => {
    reduceMotion(true);
    const { rerender } = render(<ForecastChart data={data} title="Signups" />);
    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    rerender(<ForecastChart data={{ ...data, observations: [...data.observations] }} title="Signups" />);
    expect(view()).toBe("Showing 2026-07-11 to 2026-07-31");
  });

  it("shows partial and empty states in the client's wording", () => {
    reduceMotion(true);
    const partial = render(
      <ForecastChart
        data={{ observations: data.observations }}
        title="Signups"
        labels={{ noForecast: "No forecast" }}
      />,
    );
    expect(screen.getByText("No forecast")).toBeTruthy();
    expect(partial.container.querySelector("[data-custd-chart-layer='band']")).toBeNull();
    partial.unmount();

    render(<ForecastChart data={{ observations: [] }} title="Signups" labels={{ empty: "Nothing yet" }} />);
    expect(screen.getByText("Nothing yet")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
