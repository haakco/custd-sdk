import type { RenderedWidgetData } from "@haakco/custd-sdk";
import { QueryClient, QueryClientProvider, type UseQueryResult } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  CustdReportingState,
  type CustdReportingViewState,
  getCustdReportingDisplayState,
  getCustdReportingViewState,
  useCustdReportingQuery,
  useCustdReportingViewState,
} from "./index.js";

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

function query(overrides: Partial<UseQueryResult<RenderedWidgetData, Error>> = {}) {
  return {
    data: undefined,
    dataUpdatedAt: 0,
    error: null,
    errorUpdatedAt: 0,
    failureCount: 0,
    failureReason: null,
    fetchStatus: "idle",
    isError: false,
    isFetched: false,
    isFetchedAfterMount: false,
    isFetching: false,
    isInitialLoading: false,
    isLoading: false,
    isLoadingError: false,
    isPaused: false,
    isPending: true,
    isPlaceholderData: false,
    isRefetchError: false,
    isRefetching: false,
    isStale: true,
    isSuccess: false,
    refetch: vi.fn(),
    status: "pending",
    ...overrides,
  } as UseQueryResult<RenderedWidgetData, Error>;
}

function Probe({ result }: { result: UseQueryResult<RenderedWidgetData, Error> }) {
  const view = useCustdReportingViewState(result);
  return <span data-phase={view.phase} data-state={getCustdReportingDisplayState(view)} />;
}

function QueryProbe({ queryFn }: { queryFn: () => Promise<RenderedWidgetData> }) {
  const result = useCustdReportingQuery({ queryKey: ["report"], queryFn });
  return <span data-phase={result.view.phase} />;
}

describe("Custd React reporting helpers", () => {
  it("maps an initial TanStack query to loading", () => {
    const view = getCustdReportingViewState(query());

    expect(view).toMatchObject({ phase: "loading", data: undefined, retryable: false });
  });

  it("exposes the view state through a React hook", () => {
    const markup = renderToStaticMarkup(<Probe result={query()} />);

    expect(markup).toContain('data-phase="loading"');
    expect(markup).toContain('data-state="loading"');
  });

  it("preserves data while TanStack refetches", () => {
    const previous = data({ trust: trust({ dataFreshness: "stale" }) });
    const view = getCustdReportingViewState(
      query({
        data: previous,
        isFetching: true,
        isPending: false,
        isSuccess: true,
        status: "success",
      }),
    );

    expect(view).toMatchObject({ phase: "loading", data: previous, dataState: "stale" });
  });

  it("keeps previous data on a query error", () => {
    const previous = data();
    const view = getCustdReportingViewState(
      query({
        data: previous,
        error: new Error("temporary outage"),
        isError: true,
        isFetched: true,
        isPending: false,
        status: "error",
      }),
    );

    expect(view).toMatchObject({ phase: "error", data: previous, dataState: "ready" });
  });

  it("treats an active retry as loading even after an error", () => {
    const view = getCustdReportingViewState(
      query({
        error: new Error("temporary outage"),
        isError: true,
        isFetching: true,
        isPending: false,
        status: "error",
      }),
    );

    expect(view.phase).toBe("loading");
  });

  it("maps every display state without requiring client inference", () => {
    const views = [
      getCustdReportingViewState(query()),
      getCustdReportingViewState(query({ error: new Error("down"), isError: true, isPending: false, status: "error" })),
      getCustdReportingViewState(
        query({
          data: data({ trust: trust({ status: "unavailable", dataFreshness: "unavailable" }) }),
          isPending: false,
          isSuccess: true,
          status: "success",
        }),
      ),
      getCustdReportingViewState(
        query({
          data: data({ buckets: [], value: { ...data().value, sampleCount: 0, value: 0, dataSufficiency: "none" } }),
          isPending: false,
          isSuccess: true,
          status: "success",
        }),
      ),
      getCustdReportingViewState(
        query({
          data: data({ trust: trust({ dataFreshness: "stale" }) }),
          isPending: false,
          isSuccess: true,
          status: "success",
        }),
      ),
      getCustdReportingViewState(
        query({
          data: data({ value: { ...data().value, complete: false } }),
          isPending: false,
          isSuccess: true,
          status: "success",
        }),
      ),
      getCustdReportingViewState(
        query({
          data: data(),
          isPending: false,
          isSuccess: true,
          status: "success",
        }),
      ),
    ];

    const displayStates = views.map(getCustdReportingDisplayState);
    expect(displayStates).toEqual(["loading", "error", "unavailable", "empty", "stale", "partial", "ready"]);

    for (const [view, state] of views.map((view) => [view, getCustdReportingDisplayState(view)] as const)) {
      const markup = renderToStaticMarkup(<CustdReportingState view={view} />);
      expect(markup).toContain(`data-custd-reporting-state="${state}"`);
      if (state === "ready") {
        expect(markup).not.toContain('role="status"');
      } else {
        expect(markup).toContain(`role="${state === "error" ? "alert" : "status"}"`);
      }
    }
  });

  it("renders accessible state feedback and ready content", () => {
    const ready = getCustdReportingViewState(
      query({ data: data(), isPending: false, isSuccess: true, status: "success" }),
    );
    const markup = renderToStaticMarkup(
      <CustdReportingState view={ready} className="report">
        {(value) => <strong>{value.value.value}</strong>}
      </CustdReportingState>,
    );

    expect(markup).toContain('data-custd-reporting-state="ready"');
    expect(markup).toContain("<strong>4</strong>");
  });

  it("renders a retry control for an error without leaking error details", () => {
    const view = getCustdReportingViewState(
      query({
        data: data({
          trust: trust({ retryability: "bounded", nextAction: { action: "retry", maxRetries: 2 } }),
        }),
        error: new Error("secret backend detail"),
        isError: true,
        isPending: false,
        status: "error",
      }),
    );
    const markup = renderToStaticMarkup(<CustdReportingState view={view} onRetry={() => undefined} />);

    expect(markup).toContain('role="alert"');
    expect(markup).toContain("Report unavailable right now.");
    expect(markup).toContain("Try again");
    expect(markup).not.toContain("secret backend detail");
  });

  it("allows consumer labels and state rendering", () => {
    const view = getCustdReportingViewState(query());
    const labelledMarkup = renderToStaticMarkup(
      <CustdReportingState view={view} labels={{ loading: "Loading from Tiao" }} />,
    );
    const renderedMarkup = renderToStaticMarkup(
      <CustdReportingState view={view} renderState={(state) => <em>{state}</em>} />,
    );

    expect(labelledMarkup).toContain("Loading from Tiao");
    expect(renderedMarkup).toContain("<em>loading</em>");
    expect(renderedMarkup).not.toContain("Loading report");
  });

  it("accepts a consumer-owned query function", () => {
    const client = new QueryClient();
    const queryFn = vi.fn(async () => data());
    const markup = renderToStaticMarkup(
      <QueryClientProvider client={client}>
        <QueryProbe queryFn={queryFn} />
      </QueryClientProvider>,
    );

    expect(markup).toContain('data-phase="loading"');
  });
});

type _ViewTypeCheck = CustdReportingViewState<RenderedWidgetData>;
