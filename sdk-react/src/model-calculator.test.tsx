// @vitest-environment jsdom
import { AppItemsClient, type AppModelVersion } from "@haakco/custd-sdk/browser";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ModelCalculator } from "./model-calculator.js";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const version: AppModelVersion = {
  versionUuid: "v",
  versionNumber: 3,
  note: "",
  createdAt: "2026-11-18T10:00:00Z",
  quantities: [
    { name: "price", unit: "$", kind: "input", input: { shape: "point", value: 10 } },
    { name: "units", kind: "input", input: { shape: "range", low: 100, high: 200, distribution: "lognormal" } },
    { name: "revenue", unit: "$", kind: "formula", formula: "price * units" },
  ],
};

const summary = (mean: number) => ({
  mean,
  stdDev: 1,
  percentiles: { p5: mean - 10, p25: mean, p50: mean, p75: mean, p95: mean + 10 },
  histogram: { min: 0, max: 1, counts: [1] },
});

describe("ModelCalculator", () => {
  it("runs the chosen values through its runner and never touches the model's routes", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const calculate = vi.fn(async () => ({ quantities: [{ name: "revenue", summary: summary(3000) }] }));
    render(
      <ModelCalculator
        version={version}
        inputs={["price", "units"]}
        outputs={["revenue"]}
        baseline={{ quantities: [{ name: "revenue", summary: summary(1500) }] }}
        calculate={calculate}
      />,
    );
    expect(screen.getByText("1,500 $ (90%: 1,490 $ to 1,510 $)")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("price ($)"), { target: { value: "20" } });
    fireEvent.click(screen.getByRole("button", { name: "Calculate" }));
    expect(await screen.findByText("3,000 $ (90%: 2,990 $ to 3,010 $)")).toBeTruthy();
    expect(calculate).toHaveBeenCalledWith({
      versionNumber: 3,
      inputs: [
        { name: "price", input: { shape: "point", value: 20 } },
        { name: "units", input: { shape: "range", low: 100, high: 200, distribution: "lognormal" } },
      ],
      outputs: ["revenue"],
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("refuses a formula and stays read-only without a runner", async () => {
    const calculate = vi.fn();
    const { rerender } = render(
      <ModelCalculator version={version} inputs={["price"]} outputs={["revenue"]} calculate={calculate} />,
    );
    fireEvent.change(screen.getByLabelText("price ($)"), { target: { value: "=units" } });
    fireEvent.click(screen.getByRole("button", { name: "Calculate" }));
    await waitFor(() =>
      expect(screen.getByText("A calculator takes a value, a range or k of n, not a formula.")).toBeTruthy(),
    );
    expect(calculate).not.toHaveBeenCalled();
    rerender(<ModelCalculator version={version} inputs={["price"]} outputs={["revenue"]} />);
    expect(screen.queryByRole("button", { name: "Calculate" })).toBeNull();
    expect(screen.getByText("Calculating with other values is not available here yet.")).toBeTruthy();
  });

  it("calculates through the client by default, says when it is rate-limited, and flags a failed queued run", async () => {
    const answers = [
      new Response(JSON.stringify({ code: "app_model_calculate_limited" }), { status: 429 }),
      new Response(JSON.stringify({ quantities: [{ name: "revenue", summary: summary(3000) }] }), { status: 200 }),
    ];
    const fetchMock = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => answers.shift() as Response);
    const client = new AppItemsClient({
      apiBaseUrl: "https://api.custd.com",
      siteKey: "site_pk_key",
      fetch: fetchMock,
    });
    render(
      <ModelCalculator
        version={version}
        inputs={["price"]}
        outputs={["revenue"]}
        baseline={{
          quantities: [],
          queuedRunFailure: { error: "boom", failedAt: "2026-11-18T10:00:00Z", attempts: 3 },
        }}
        access={"s".repeat(43)}
        client={client}
      />,
    );
    expect(screen.getByRole("status").textContent).toMatch(/after 3 tries .*: boom\./);

    fireEvent.click(screen.getByRole("button", { name: "Calculate" }));
    expect((await screen.findByRole("alert")).textContent).toBe(
      "Too many calculations just now. Try again in a minute.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Calculate" }));
    expect(await screen.findByText("3,000 $ (90%: 2,990 $ to 3,010 $)")).toBeTruthy();
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe("https://api.custd.com/api/v1/app/models/calculate");
    expect(screen.queryByRole("status")).toBeNull();
  });
});
