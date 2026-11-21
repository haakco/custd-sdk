// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SensitivityView } from "./sensitivity-view.js";

afterEach(cleanup);

const scatter = [
  { input: 1, output: 2 },
  { input: 2, output: 3 },
];

describe("SensitivityView", () => {
  it("ranks inputs by the strength of their correlation, keeping the sign, and plots the top ones", () => {
    const { container } = render(
      <SensitivityView
        scatterInputs={2}
        sensitivity={{
          output: "profit",
          inputs: [
            { name: "price", rankCorrelation: 0.3, share: 0.2, scatter },
            { name: "cost", rankCorrelation: -0.8, share: 0.6, scatter },
            { name: "fees", rankCorrelation: 0.1, share: 0.1 },
            { name: "visits", rankCorrelation: 0.5, share: 0.3 },
          ],
        }}
      />,
    );
    const order = [...container.querySelectorAll("li[data-custd-sensitivity-input]")].map((row) =>
      row.getAttribute("data-custd-sensitivity-input"),
    );
    expect(order).toEqual(["cost", "visits", "price", "fees"]);
    expect(screen.getByText("rank correlation -0.8, lowers it")).toBeTruthy();
    const plots = [...container.querySelectorAll("[data-custd-chart='sensitivity-scatter']")];
    expect(plots.map((plot) => plot.getAttribute("data-custd-sensitivity-input"))).toEqual(["cost", "price"]);
    expect(screen.getByRole("img", { name: "cost against profit, one dot per sampled trial" })).toBeTruthy();
  });

  it("asks for an output when the run has no sensitivity", () => {
    render(<SensitivityView sensitivity={undefined} />);
    expect(screen.getByText("Choose an output to see which inputs drive it.")).toBeTruthy();
  });
});
