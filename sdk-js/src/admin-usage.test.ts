import { beforeEach, describe, expect, it, vi } from "vitest";
import { CustdClient, USAGE_MAX_LIMIT } from "./index";

beforeEach(() => {
  vi.restoreAllMocks();
});

function mockFetch(body: unknown): ReturnType<typeof vi.fn> {
  return vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  );
}

function newClient(fetchImpl: ReturnType<typeof vi.fn>): CustdClient {
  return new CustdClient({
    baseUrl: "http://localhost:8080",
    getToken: () => "admin-token",
    fetch: fetchImpl as unknown as typeof fetch,
  });
}

const usageReportBody = {
  schemaVersion: "usage.v1",
  companySlug: "acme",
  start: "2026-09-01T00:00:00Z",
  end: "2026-10-01T00:00:00Z",
  rows: [
    {
      accountCompanySlug: "acme",
      dataSpaceCompanySlug: "acme-web",
      meterSlug: "events.ingested",
      meterVersion: 1,
      unit: "event",
      windowStart: "2026-09-01T00:00:00Z",
      windowEnd: "2026-09-02T00:00:00Z",
      quantity: 42,
      sourceWatermark: 100,
      completenessState: "final",
      correctionGeneration: 0,
      calculationVersion: 1,
    },
  ],
  totals: [
    {
      accountCompanySlug: "acme",
      dataSpaceCompanySlug: "acme-web",
      meterSlug: "events.ingested",
      unit: "event",
      quantity: 42,
    },
  ],
  sourceWatermark: 100,
  containsProvisional: false,
  containsIncomplete: false,
};

describe("admin usage", () => {
  it("reads the current tenant usage without a window", async () => {
    const fetchImpl = mockFetch(usageReportBody);
    const client = newClient(fetchImpl);

    const report = await client.admin.usage.get();

    const [url, init] = fetchImpl.mock.calls[0] ?? [];
    expect(String(url)).toBe("http://localhost:8080/api/v1/admin/usage/me");
    expect((init as RequestInit).method).toBe("GET");
    expect((init as RequestInit).headers).toMatchObject({ Authorization: "Bearer admin-token" });
    expect(report.schemaVersion).toBe("usage.v1");
    expect(report.companySlug).toBe("acme");
    expect(report.rows[0]?.quantity).toBe(42);
    expect(report.rows[0]?.completenessState).toBe("final");
    expect(report.totals[0]?.meterSlug).toBe("events.ingested");
    expect(report.containsProvisional).toBe(false);
  });

  it("encodes the meter, window, and limit", async () => {
    const fetchImpl = mockFetch(usageReportBody);
    const client = newClient(fetchImpl);

    await client.admin.usage.get({
      meterSlug: "events.ingested",
      start: "2026-09-01T00:00:00Z",
      end: "2026-10-01T00:00:00Z",
      limit: 100,
    });

    expect(String(fetchImpl.mock.calls[0]?.[0])).toBe(
      "http://localhost:8080/api/v1/admin/usage/me?end=2026-10-01T00%3A00%3A00Z&limit=100&meter=events.ingested&start=2026-09-01T00%3A00%3A00Z",
    );
  });

  it("rejects an invalid window or limit before sending", async () => {
    const cases = [
      { start: "2026-10-01T00:00:00Z", end: "2026-10-01T00:00:00Z" },
      { start: "not-a-timestamp" },
      { limit: 0 },
      { limit: USAGE_MAX_LIMIT + 1 },
      { limit: 1.5 },
    ];

    for (const query of cases) {
      const fetchImpl = mockFetch(usageReportBody);
      const client = newClient(fetchImpl);
      await expect(client.admin.usage.get(query)).rejects.toThrow(RangeError);
      expect(fetchImpl).not.toHaveBeenCalled();
    }
  });
});
