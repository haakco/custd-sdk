import { describe, expect, it, vi } from "vitest";
import exported from "../../contract-fixtures/site-export.json";
import {
  CustdClient,
  CustdRequestError,
  SITE_INSIGHTS_EXPORT_SCHEMA,
  SITE_INSIGHTS_EXPORT_SEARCH_METRICS_MAX_LIMIT,
  SiteSearchMetricDimension,
} from "./index";

const domainUuid = exported.searchMetrics.domainUuid;
const item = `http://localhost:8080/api/v1/site-domains/${domainUuid}`;

function respond(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function newClient(...responses: Response[]) {
  const fetchImpl = vi.fn();
  for (const response of responses) fetchImpl.mockResolvedValueOnce(response);
  const client = new CustdClient({
    baseUrl: "http://localhost:8080",
    getToken: () => "admin-token",
    fetch: fetchImpl as unknown as typeof fetch,
  });
  const calls = () =>
    fetchImpl.mock.calls.map(([url, init]) => {
      const request = init as RequestInit;
      const body = typeof request.body === "string" ? JSON.parse(request.body) : undefined;
      return { route: `${request.method} ${String(url)}`, body };
    });
  return { domains: client.admin.siteDomains, admin: client.admin, calls };
}

describe("site insights export", () => {
  it("reads the export and pages its search metrics", async () => {
    const { domains, calls } = newClient(
      respond(200, exported.export),
      respond(200, exported.searchMetrics),
      respond(200, exported.searchMetrics),
    );

    const snapshot = await domains.getExport(domainUuid);
    expect(snapshot).toEqual(exported.export);
    expect(snapshot.schema).toBe(SITE_INSIGHTS_EXPORT_SCHEMA);
    expect(snapshot.search.metricRows).toBe(2);
    const page = await domains.listExportSearchMetrics(domainUuid, {
      offset: 0,
      limit: SITE_INSIGHTS_EXPORT_SEARCH_METRICS_MAX_LIMIT,
    });
    expect(page).toEqual(exported.searchMetrics);
    expect(page.rows[0]?.dimension).toBe(SiteSearchMetricDimension.Total);
    await domains.listExportSearchMetrics(domainUuid);

    expect(calls().map((call) => call.route)).toEqual([
      `GET ${item}/export`,
      `GET ${item}/export/search-metrics?offset=0&limit=10000`,
      `GET ${item}/export/search-metrics`,
    ]);
  });

  it("surfaces an out-of-range page as a plain 400", async () => {
    const problem = exported.searchMetricsInvalidProblem;
    const { domains } = newClient(respond(problem.status, problem));
    const refusal = domains.listExportSearchMetrics(domainUuid, { limit: 20000 });
    await expect(refusal).rejects.toBeInstanceOf(CustdRequestError);
    await expect(refusal).rejects.toMatchObject({ status: 400 });
  });
});
