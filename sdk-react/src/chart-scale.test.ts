import { describe, expect, it } from "vitest";
import { domainOf, formatUtcDate, panDomain, scaleLinear, ticksOf, zoomDomain } from "./chart-scale.js";

const DAY = 86_400_000;
const bounds = { start: 0, end: 10 * DAY };

describe("chart scale helpers", () => {
  it("maps a domain onto a range", () => {
    const scale = scaleLinear({ start: 0, end: 10 }, 100, 200);
    expect(scale(0)).toBe(100);
    expect(scale(5)).toBe(150);
    expect(scale(10)).toBe(200);
  });

  it("pads a single value into a visible span", () => {
    expect(domainOf([5 * DAY], DAY)).toEqual({ start: 4.5 * DAY, end: 5.5 * DAY });
    expect(domainOf([], DAY)).toBeUndefined();
  });

  it("zooms around the centre and never past the bounds or below the minimum span", () => {
    expect(zoomDomain(bounds, 0.5, bounds, DAY)).toEqual({ start: 2.5 * DAY, end: 7.5 * DAY });
    expect(zoomDomain({ start: 2 * DAY, end: 8 * DAY }, 4, bounds, DAY)).toEqual(bounds);
    const tight = zoomDomain({ start: 4 * DAY, end: 6 * DAY }, 0.1, bounds, DAY);
    expect(tight.end - tight.start).toBe(DAY);
  });

  it("pans by a fraction of the span and stops at the bounds", () => {
    const view = { start: 2 * DAY, end: 4 * DAY };
    expect(panDomain(view, 0.5, bounds)).toEqual({ start: 3 * DAY, end: 5 * DAY });
    expect(panDomain(view, -5, bounds)).toEqual({ start: 0, end: 2 * DAY });
    expect(panDomain({ start: 8 * DAY, end: 10 * DAY }, 1, bounds)).toEqual({ start: 8 * DAY, end: 10 * DAY });
  });

  it("spreads ticks evenly and formats UTC dates", () => {
    expect(ticksOf({ start: 0, end: 4 }, 5)).toEqual([0, 1, 2, 3, 4]);
    expect(formatUtcDate(Date.parse("2026-07-03T23:30:00Z"))).toBe("2026-07-03");
  });
});
