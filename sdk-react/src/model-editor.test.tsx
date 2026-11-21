// @vitest-environment jsdom
import { AppItemError, type AppModelQuantity } from "@haakco/custd-sdk/browser";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ModelEditor } from "./model-editor.js";

afterEach(cleanup);

const quantities: AppModelQuantity[] = [
  { name: "price", unit: "$", kind: "input", input: { shape: "point", value: 12.5 } },
  {
    name: "visitors",
    description: "Monthly, from **analytics**",
    kind: "input",
    input: { shape: "range", low: 1000, high: 5000, distribution: "lognormal" },
  },
  { name: "conversion", kind: "input", input: { shape: "proportion", successes: 3, trials: 40 } },
  { name: "churn", kind: "input", input: { shape: "samples", samples: [0.1, 0.25, 0.2] } },
  {
    name: "days_left",
    kind: "input",
    input: {
      shape: "bound",
      source: {
        kind: "counter_forecast",
        projectUuid: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
        field: "completion_days",
      },
    },
  },
  { name: "revenue", kind: "formula", formula: "price * visitors * conversion" },
];

function save() {
  fireEvent.click(screen.getByRole("button", { name: "Save version" }));
}

describe("ModelEditor", () => {
  it("saves every shorthand back unchanged, carrying a live input through", async () => {
    const onSave = vi.fn(async () => undefined);
    render(<ModelEditor quantities={quantities} onSave={onSave} />);
    expect(screen.getAllByLabelText("Value").map((field) => (field as HTMLInputElement).value)).toEqual([
      "12.5",
      "1000 to 5000",
      "3 of 40",
      "0.1, 0.25, 0.2",
      "Live from completion days",
      "=price * visitors * conversion",
    ]);
    save();
    await waitFor(() => expect(onSave).toHaveBeenCalledWith({ quantities }));
    expect(await screen.findByText("Saved.")).toBeTruthy();
  });

  it("reads typed shorthand, the range shape picker and a new formula quantity", async () => {
    const onSave = vi.fn(async () => undefined);
    render(<ModelEditor quantities={quantities.slice(0, 1)} onSave={onSave} />);
    fireEvent.change(screen.getByLabelText("Value"), { target: { value: "5 to 10" } });
    fireEvent.change(screen.getByLabelText("Range shape"), { target: { value: "uniform" } });
    fireEvent.click(screen.getByRole("button", { name: "Add quantity" }));
    const names = screen.getAllByLabelText("Name");
    const values = screen.getAllByLabelText("Value");
    fireEvent.change(names[1] as HTMLElement, { target: { value: "double" } });
    fireEvent.change(values[1] as HTMLElement, { target: { value: "= price * 2" } });
    save();
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        quantities: [
          {
            name: "price",
            unit: "$",
            kind: "input",
            input: { shape: "range", low: 5, high: 10, distribution: "uniform" },
          },
          { name: "double", kind: "formula", formula: "price * 2" },
        ],
      }),
    );
  });

  it("shows local and server validation on the quantity it names", async () => {
    const problem = {
      detail: "uncertainty model: invalid: formula cycle",
      code: "formula_cycle",
      fieldErrors: [
        { subject: "b", field: "formula", code: "formula_cycle", message: "b and c refer to each other" },
        { subject: "c", field: "formula", code: "formula_cycle", message: "b and c refer to each other" },
      ],
    };
    const onSave = vi.fn(async () => {
      throw new AppItemError(400, "formula_cycle", problem);
    });
    const two: AppModelQuantity[] = [
      { name: "a", kind: "input", input: { shape: "point", value: 1 } },
      { name: "b", kind: "formula", formula: "c" },
      { name: "c", kind: "formula", formula: "b" },
    ];
    render(<ModelEditor quantities={two} onSave={onSave} />);
    const first = screen.getAllByLabelText("Value")[0] as HTMLElement;
    fireEvent.change(first, { target: { value: "10 to 1" } });
    save();
    expect(first.getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByText("The low end of a range must be below the high end.")).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();

    fireEvent.change(first, { target: { value: "1 to 10" } });
    save();
    const [, second, third] = screen.getAllByLabelText("Value") as HTMLElement[];
    await waitFor(() => expect(second?.getAttribute("aria-invalid")).toBe("true"));
    expect(third?.getAttribute("aria-invalid")).toBe("true");
    expect(screen.getAllByText("b and c refer to each other")).toHaveLength(2);
    expect(screen.getByRole("alert").textContent).toBe("The version was not saved.");
  });

  it("renders descriptions as safe Markdown", () => {
    const description = 'See [docs](https://custd.com) and [x](javascript:alert(1)) <img src=x onerror="alert(1)">';
    const { container } = render(
      <ModelEditor
        quantities={[{ name: "a", description, kind: "input", input: { shape: "point", value: 1 } }]}
        onSave={async () => undefined}
      />,
    );
    const markdown = container.querySelector("[data-custd-markdown]");
    expect(markdown?.querySelector("img")).toBeNull();
    expect([...(markdown?.querySelectorAll("a") ?? [])].map((link) => link.getAttribute("href"))).toEqual([
      "https://custd.com",
    ]);
    expect(markdown?.textContent).toContain('<img src=x onerror="alert(1)">');
  });

  it("keeps formulas and snake_case names in descriptions as written", () => {
    const description = "Uses days_left and rate_per_day: price * units + cost * 2, not *this*";
    const { container } = render(
      <ModelEditor
        quantities={[{ name: "a", description, kind: "input", input: { shape: "point", value: 1 } }]}
        onSave={async () => undefined}
      />,
    );
    const markdown = container.querySelector("[data-custd-markdown]");
    expect(markdown?.textContent).toBe("Uses days_left and rate_per_day: price * units + cost * 2, not this");
    expect([...(markdown?.querySelectorAll("em") ?? [])].map((em) => em.textContent)).toEqual(["this"]);
  });

  it("keeps pasted lines apart and moves focus with added and removed rows", () => {
    render(<ModelEditor quantities={quantities.slice(0, 2)} onSave={async () => undefined} />);
    const first = screen.getAllByLabelText("Value")[0] as HTMLInputElement;
    first.setSelectionRange(0, first.value.length);
    fireEvent.paste(first, { clipboardData: { getData: () => "4\r\n5\n\n6\n" } });
    expect(first.value).toBe("4, 5, 6");

    fireEvent.click(screen.getByRole("button", { name: "Add quantity" }));
    expect(document.activeElement).toBe(screen.getAllByLabelText("Name")[2]);
    fireEvent.click(screen.getByRole("button", { name: "Remove price" }));
    expect(document.activeElement).toBe(screen.getAllByLabelText("Name")[0]);
    expect((document.activeElement as HTMLInputElement).value).toBe("visitors");
  });
});
