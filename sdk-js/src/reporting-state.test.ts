import { describe, expect, it } from "vitest";
import type { RenderedWidgetData } from "./index.js";
import {
  classifyReportingData,
  getReportingViewState,
  type ReportingQueryState,
  reportingQueryKey,
} from "./reporting-state.js";

function data(overrides: Partial<RenderedWidgetData> = {}): RenderedWidgetData {
  return {
    buckets: [
      {
        date: "2026-08-26",
        value: { value: 4, unit: "count", sampleCount: 1, dataSufficiency: "sufficient", complete: true },
        source: "postgres",
        queryDurationMs: 4,
      },
    ],
    value: { value: 4, unit: "count", sampleCount: 1, dataSufficiency: "sufficient", complete: true },
    queryDurationMs: 4,
    snapshotAgeMs: 100,
    eventLagP95Ms: 200,
    trust: {
      status: "healthy",
      dataFreshness: "current",
      retryability: "none",
      nextAction: { action: "none" },
      rollupState: "complete",
      coverage: "complete",
      captureState: "enabled",
      consentState: "present",
      exportState: "available",
    },
    ...overrides,
  };
}

function trust(overrides: Partial<NonNullable<RenderedWidgetData["trust"]>> = {}) {
  const value = data().trust;
  if (!value) throw new Error("test trust fixture is missing");
  return { ...value, ...overrides };
}

describe("reporting state", () => {
  it.each([
    [
      "empty",
      data({
        buckets: [],
        value: { value: 0, unit: "count", sampleCount: 0, dataSufficiency: "none", complete: true },
      }),
    ],
    ["stale", data({ trust: trust({ dataFreshness: "stale" }) })],
    ["partial", data({ value: { ...data().value, complete: false }, trust: trust({ status: "partial" }) })],
    [
      "stale_partial",
      data({
        value: { ...data().value, complete: false },
        trust: trust({ status: "partial", dataFreshness: "stale" }),
      }),
    ],
    ["unavailable", data({ trust: trust({ status: "unavailable", dataFreshness: "unavailable" }) })],
    ["ready", data()],
  ] as const)("classifies %s without client-side inference", (expected, response) => {
    expect(classifyReportingData(response)).toBe(expected);
  });

  it("keeps the last data while a retryable request is loading", () => {
    const previous = data({
      trust: {
        ...trust(),
        retryability: "bounded",
        nextAction: { action: "retry", maxRetries: 2 },
      },
    });
    const state = getReportingViewState({ status: "loading", data: previous });

    expect(state).toMatchObject({ phase: "loading", data: previous, dataState: "ready", retryable: true });
    expect(state.nextAction).toEqual({ action: "retry", maxRetries: 2 });
  });

  it("exposes an error and preserves stale data for recoverable failures", () => {
    const previous = data({ trust: trust({ dataFreshness: "stale" }) });
    const query: ReportingQueryState<RenderedWidgetData> = {
      status: "error",
      error: new Error("temporary outage"),
      data: previous,
    };

    expect(getReportingViewState(query)).toMatchObject({
      phase: "error",
      data: previous,
      dataState: "stale",
      retryable: false,
    });
  });

  it("normalizes filter order in cache keys", () => {
    const first = reportingQueryKey({
      template: "learning",
      metrics: ["reviews"],
      filters: [
        { dimension: "track", operator: "eq", value: "a" },
        { dimension: "language", operator: "eq", value: "zh" },
      ],
    });
    const second = reportingQueryKey({
      template: "learning",
      metrics: ["reviews"],
      filters: [
        { dimension: "language", operator: "eq", value: "zh" },
        { dimension: "track", operator: "eq", value: "a" },
      ],
    });

    expect(first).toEqual(second);
  });
});
