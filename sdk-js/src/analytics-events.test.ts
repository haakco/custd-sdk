import { describe, expect, it, vi } from "vitest";
import { ANALYTICS_MAX_LABEL_FILTERS, AnalyticsEventClient, CustdClient } from "./index";

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
