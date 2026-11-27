// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { DailyUptimeChart, UptimeResponseChart } from "./index.js";

it("shows daily failures and leaves gaps in the passing response time", () => {
  const { container } = render(
    <>
      <DailyUptimeChart
        days={[
          { date: "2026-11-26", checks: 0, upChecks: 0 },
          { date: "2026-11-27", checks: 12, upChecks: 11 },
        ]}
      />
      <UptimeResponseChart
        hours={[
          { hourStart: "2026-11-27T00:00:00Z", checks: 12, upChecks: 12, avgMs: 100, maxMs: 120 },
          { hourStart: "2026-11-27T01:00:00Z", checks: 12, upChecks: 0 },
          { hourStart: "2026-11-27T03:00:00Z", checks: 12, upChecks: 3, avgMs: 200, maxMs: 250 },
          { hourStart: "2026-11-27T04:00:00Z", checks: 12, upChecks: 5, avgMs: 200, maxMs: 260 },
        ]}
      />
    </>,
  );
  const daily = within(screen.getByRole("list", { name: "Daily uptime" }));
  expect(daily.getByRole("listitem", { name: "2026-11-26: No data" })).toBeTruthy();
  expect(daily.getByRole("listitem", { name: "2026-11-27: 91.66% up (12 checks)" })).toBeTruthy();
  expect(screen.getByRole("img", { name: "Response time: 140 ms on average, slowest 260 ms." })).toBeTruthy();
  expect(container.querySelectorAll("svg line")).toHaveLength(2);
});
