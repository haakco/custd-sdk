import { describe, expect, it, vi } from "vitest";
import { AppItemsClient } from "./app-items";
import { APP_LIVE_STATUSES } from "./app-live";
import { type AppModelRun, modelRunSummaryCsv } from "./app-models";

const API = "https://api.custd.com";
const OWNER = "o".repeat(43);

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function client(fetchMock: ReturnType<typeof vi.fn>) {
  return new AppItemsClient({ apiBaseUrl: API, siteKey: "site_pk_x", fetch: fetchMock as unknown as typeof fetch });
}

const run: AppModelRun = {
  runUuid: "r1",
  modelUuid: "m1",
  versionNumber: 2,
  trigger: "request",
  seed: 7,
  sampleCount: 5000,
  createdAt: "2026-11-18T10:00:00Z",
  quantities: [
    {
      name: "revenue",
      summary: {
        mean: 12.5,
        stdDev: 2,
        percentiles: { p5: 9, p25: 11, p50: 12.5, p75: 14, p95: 16 },
        histogram: { min: 8, max: 17, counts: [1, 2] },
      },
    },
    { name: "late", error: { code: "model_upstream_failed", detail: 'reads "=bad", which failed' } },
  ],
  boundInputs: [],
};

describe("AppItemsClient models", () => {
  it("posts versions, copies and runs to the model routes with the owner link", async () => {
    const fetchMock = vi.fn(async () => json({}, 201));
    const items = client(fetchMock);
    await items.addModelVersion(OWNER, {
      quantities: [
        {
          name: "rate",
          kind: "input",
          input: {
            shape: "bound",
            source: { kind: "counter_forecast", projectUuid: "project", field: "rate_per_day" },
          },
        },
      ],
      counterLinks: ["counter-link-token"],
    });
    await items.copyModel(OWNER);
    await items.runModel(OWNER, { seed: 1 });
    const calls = fetchMock.mock.calls as unknown as [string, RequestInit][];
    expect(calls.map(([url, init]) => `${init.method} ${url}`)).toEqual([
      `POST ${API}/api/v1/app/item/model/versions`,
      `POST ${API}/api/v1/app/item/model/copy`,
      `POST ${API}/api/v1/app/models/runs`,
    ]);
    expect(calls[0]?.[1].headers).toMatchObject({ Authorization: `Bearer ${OWNER}` });
    expect(JSON.parse(String(calls[0]?.[1].body))).toMatchObject({ counterLinks: ["counter-link-token"] });
    expect(JSON.parse(String(calls[1]?.[1].body))).toEqual({});
  });

  it("reports an empty latest run until the model has one", async () => {
    const fetchMock = vi.fn(async (_input: string) =>
      json({ status: 404, code: "app_model_run_missing", detail: "no run yet" }, 404),
    );
    const watch = client(fetchMock).watchLatestModelRun(OWNER);
    const seen = new Promise<void>((resolve) => {
      const stop = watch.subscribe(() => {
        if (watch.getState().status === APP_LIVE_STATUSES.empty) {
          stop();
          resolve();
        }
      });
    });
    await seen;
    expect(fetchMock.mock.calls[0]?.[0]).toBe(`${API}/api/v1/app/models/latest`);
  });
});

describe("modelRunSummaryCsv", () => {
  it("writes one row per quantity with units, failures and formula-safe text", () => {
    const csv = modelRunSummaryCsv(run, [{ name: "revenue", unit: "k$", kind: "formula", formula: "a" }]);
    expect(csv.split("\r\n")).toEqual([
      "quantity,unit,mean,std_dev,p5,p25,p50,p75,p95,error",
      "revenue,k$,12.5,2,9,11,12.5,14,16,",
      'late,,,,,,,,,"model_upstream_failed: reads ""=bad"", which failed"',
      "",
    ]);
    expect(
      modelRunSummaryCsv({ quantities: [{ name: "x", error: { code: "c", detail: "d" } }] }, [
        { name: "x", unit: "=cmd()", kind: "formula", formula: "1" },
      ]),
    ).toContain("x,'=cmd(),");
  });
});
