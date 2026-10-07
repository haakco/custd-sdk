import { describe, expect, it, vi } from "vitest";
import { ANALYTICS_MAX_LABEL_FILTERS, ANALYTICS_MAX_RANGE_DAYS, AnalyticsEventClient, CustdClient } from "./index";

function mockFetch(body: unknown) {
  return vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  );
}

const responseBody = {
  results: [{ eventTypeSlug: "page_view", payload: { path: "/" } }],
  count: 1,
  sources: [
    {
      name: "postgres",
      count: 1,
      complete: true,
      fresh: true,
      queryDurationMs: 4,
      freshnessLagMs: 12,
    },
  ],
  timing: {
    eventLagP50Ms: 10,
    eventLagP95Ms: 20,
    eventLagMaxMs: 30,
    queryDurationMs: 4,
    snapshotAgeMs: 100,
  },
};

describe("analytics event query", () => {
  it("queries the tenant analytics route, not an admin route", async () => {
    const fetchImpl = mockFetch(responseBody);
    const client = new CustdClient({ baseUrl: "http://localhost:8080", getToken: () => "token", fetch: fetchImpl });

    const response = await client.analytics.query({ date: "2026-09-14", eventType: "page_view", limit: 50 });

    expect(fetchImpl.mock.calls.map(([url]) => String(url))).toEqual(["http://localhost:8080/api/v1/analytics/query"]);
    // The server's own completeness and freshness assessment is surfaced verbatim; the
    // client must not substitute a confidence judgement of its own.
    expect(response.sources[0]?.complete).toBe(true);
    expect(response.sources[0]?.fresh).toBe(true);
    expect(response.timing.eventLagP95Ms).toBe(20);
    expect(response.results[0]).toEqual({ eventTypeSlug: "page_view", payload: { path: "/" } });
    const payload: Record<string, unknown> = response.results[0]?.payload ?? {};
    expect(payload.path).toBe("/");
  });

  it("serialises only documented public fields", async () => {
    const fetchImpl = mockFetch(responseBody);
    const client = new CustdClient({ baseUrl: "http://localhost:8080", getToken: () => "token", fetch: fetchImpl });

    // `anonymousId` is an internal exact-subject predicate and `countOnly` is an internal
    // flag. Both are absent from the service's public JSON contract, so a caller must not
    // be able to smuggle them onto the wire by passing extra properties.
    await client.analytics.query({
      date: "2026-09-14",
      labelFilters: [{ key: "plan", value: "pro" }],
      ...({ anonymousId: "subject-1", countOnly: true } as Record<string, unknown>),
    });

    const body = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body)) as Record<string, unknown>;
    expect(body).toEqual({ date: "2026-09-14", labelFilters: [{ key: "plan", value: "pro" }] });
    expect(body).not.toHaveProperty("anonymousId");
    expect(body).not.toHaveProperty("countOnly");
  });

  it("rejects more label filters than the service accepts, without sending a request", async () => {
    const request = vi.fn();
    const client = new AnalyticsEventClient(request);

    const overLimit = Array.from({ length: ANALYTICS_MAX_LABEL_FILTERS + 1 }, (_, index) => ({
      key: `k${index}`,
      value: `v${index}`,
    }));

    await expect(client.query({ date: "2026-09-14", labelFilters: overLimit })).rejects.toThrow(RangeError);
    expect(request).not.toHaveBeenCalled();
  });
});

const rangeResponseBody = {
  rows: [{ eventTypeSlug: "page_view", payload: { path: "/" } }],
  count: 3,
  buckets: [
    { date: "2026-09-14", count: 1, source: "duckdb", complete: true, queryDurationMs: 4, parquetUriCount: 2 },
    { date: "2026-09-15", count: 2, source: "duckdb", complete: true, queryDurationMs: 5 },
  ],
  sources: [{ name: "duckdb", count: 3, complete: true, fresh: false, queryDurationMs: 9, freshnessLagMs: 0 }],
  timing: { eventLagP50Ms: 10, eventLagP95Ms: 20, eventLagMaxMs: 30, queryDurationMs: 9, snapshotAgeMs: 100 },
};
describe("analytics event range query", () => {
  it("queries the range route and surfaces per-day buckets", async () => {
    const fetchImpl = mockFetch(rangeResponseBody);
    const client = new CustdClient({ baseUrl: "http://localhost:8080", getToken: () => "token", fetch: fetchImpl });

    const response = await client.analytics.queryRange({
      from: "2026-09-14",
      to: "2026-09-15",
      eventType: "page_view",
      limit: 10000,
      source: "auto",
      groupBy: "day",
    });

    expect(fetchImpl.mock.calls.map(([url]) => String(url))).toEqual([
      "http://localhost:8080/api/v1/analytics/query-range",
    ]);
    const body = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body)) as Record<string, unknown>;
    expect(body).toEqual({
      from: "2026-09-14",
      to: "2026-09-15",
      eventType: "page_view",
      limit: 10000,
      source: "auto",
      groupBy: "day",
    });
    // The per-day completeness belongs to the server; it is surfaced unchanged.
    expect(response.buckets).toHaveLength(2);
    expect(response.buckets[0]?.complete).toBe(true);
    expect(response.buckets[0]?.parquetUriCount).toBe(2);
    expect(response.count).toBe(3);
    expect(response.timing.queryDurationMs).toBe(9);
  });

  it("serialises only documented public fields", async () => {
    const fetchImpl = mockFetch(rangeResponseBody);
    const client = new CustdClient({ baseUrl: "http://localhost:8080", getToken: () => "token", fetch: fetchImpl });

    await client.analytics.queryRange({
      from: "2026-09-14",
      to: "2026-09-15",
      ...({ anonymousId: "subject-1", countOnly: true } as Record<string, unknown>),
    });

    const body = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body)) as Record<string, unknown>;
    expect(body).toEqual({ from: "2026-09-14", to: "2026-09-15" });
    expect(body).not.toHaveProperty("anonymousId");
    expect(body).not.toHaveProperty("countOnly");
  });

  it("rejects invalid ranges and requests before sending", async () => {
    const overLimit = Array.from({ length: ANALYTICS_MAX_LABEL_FILTERS + 1 }, (_, index) => ({
      key: `k${index}`,
      value: `v${index}`,
    }));
    const cases = [
      { from: "14-09-2026", to: "2026-09-15" },
      { from: "2026-02-30", to: "2026-03-01" },
      { from: "20260914", to: "2026-09-15" },
      { from: "2026-09-15", to: "2026-09-14" },
      { from: "2026-01-01", to: "2026-05-02" },
      { from: "2026-09-14", to: "2026-09-15", groupBy: "week" as unknown as "day" },
      { from: "2026-09-14", to: "2026-09-15", labelFilters: overLimit },
    ];

    for (const request of cases) {
      const fetchImpl = mockFetch(rangeResponseBody);
      const client = new CustdClient({ baseUrl: "http://localhost:8080", getToken: () => "token", fetch: fetchImpl });
      await expect(client.analytics.queryRange(request)).rejects.toThrow(RangeError);
      expect(fetchImpl).not.toHaveBeenCalled();
    }
  });

  it("rejects retired sources before sending", async () => {
    for (const source of ["postgres", "rollup", "materialized"] as const) {
      const fetchImpl = mockFetch(rangeResponseBody);
      const client = new CustdClient({ baseUrl: "http://localhost:8080", getToken: () => "token", fetch: fetchImpl });
      await expect(
        client.analytics.queryRange({
          from: "2026-09-14",
          to: "2026-09-15",
          source: source as unknown as "auto",
        }),
      ).rejects.toThrow(RangeError);
      expect(fetchImpl).not.toHaveBeenCalled();
    }
  });

  it("rejects a malformed success body", async () => {
    const malformed: unknown[] = [
      {},
      { ...rangeResponseBody, rows: undefined },
      { ...rangeResponseBody, rows: { unexpected: rangeResponseBody.rows } },
      { ...rangeResponseBody, sources: { unexpected: rangeResponseBody.sources } },
      { ...rangeResponseBody, timing: undefined },
      { ...rangeResponseBody, timing: { ...rangeResponseBody.timing, snapshotAgeMs: undefined } },
      { ...rangeResponseBody, buckets: [{ ...rangeResponseBody.buckets[0], complete: undefined }] },
      { ...rangeResponseBody, sources: [{ ...rangeResponseBody.sources[0], fresh: undefined }] },
      { ...rangeResponseBody, count: "3" },
      // A present optional field must satisfy its declared type; only an absent
      // one is allowed to be omitted.
      { ...rangeResponseBody, timing: { ...rangeResponseBody.timing, oldestEventTimestamp: null } },
      { ...rangeResponseBody, sources: [{ ...rangeResponseBody.sources[0], message: null }] },
      {
        ...rangeResponseBody,
        sources: [{ ...rangeResponseBody.sources[0], parquetUriCount: "2" }],
      },
      // A row declares `payload` as an object, so a present null or array must
      // not pass as one.
      { ...rangeResponseBody, rows: [{ eventTypeSlug: "page_view", payload: null }] },
      { ...rangeResponseBody, rows: [{ eventTypeSlug: "page_view", payload: [] }] },
    ];

    for (const body of malformed) {
      const fetchImpl = mockFetch(body);
      const client = new CustdClient({ baseUrl: "http://localhost:8080", getToken: () => "token", fetch: fetchImpl });
      await expect(client.analytics.queryRange({ from: "2026-09-14", to: "2026-09-15" })).rejects.toThrow(TypeError);
    }
  });

  it("accepts empty collections and absent optional fields", async () => {
    const fetchImpl = mockFetch({
      rows: [{ eventTypeSlug: "page_view" }],
      count: 0,
      buckets: [],
      sources: [],
      timing: { eventLagP50Ms: 0, eventLagP95Ms: 0, eventLagMaxMs: 0, queryDurationMs: 1, snapshotAgeMs: 0 },
    });
    const client = new CustdClient({ baseUrl: "http://localhost:8080", getToken: () => "token", fetch: fetchImpl });

    const response = await client.analytics.queryRange({ from: "2026-09-14", to: "2026-09-15" });

    // A row with an absent payload, and optional fields omitted entirely, stay valid.
    expect(response.rows).toEqual([{ eventTypeSlug: "page_view" }]);
    expect(response.buckets).toEqual([]);
    expect(response.sources).toEqual([]);
  });

  it("accepts an empty source as the default", async () => {
    const fetchImpl = mockFetch(rangeResponseBody);
    const client = new CustdClient({ baseUrl: "http://localhost:8080", getToken: () => "token", fetch: fetchImpl });

    await expect(
      client.analytics.queryRange({ from: "2026-09-14", to: "2026-09-15", source: "" }),
    ).resolves.toBeDefined();
    const body = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body)) as Record<string, unknown>;
    // An empty source is normalized to an omitted one, matching the Go SDK's
    // omitempty wire tag.
    expect(body).toEqual({ from: "2026-09-14", to: "2026-09-15" });
  });

  it("accepts a range at exactly the day cap", async () => {
    const fetchImpl = mockFetch(rangeResponseBody);
    const client = new CustdClient({ baseUrl: "http://localhost:8080", getToken: () => "token", fetch: fetchImpl });

    // 2026-01-01..2026-04-30 is 120 inclusive days, the documented maximum.
    await expect(client.analytics.queryRange({ from: "2026-01-01", to: "2026-04-30" })).resolves.toBeDefined();
    expect(ANALYTICS_MAX_RANGE_DAYS).toBe(120);
  });
});
