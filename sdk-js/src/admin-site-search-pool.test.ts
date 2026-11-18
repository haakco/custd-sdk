import { describe, expect, it, vi } from "vitest";
import pool from "../../contract-fixtures/site-search-pool.json";
import {
  CustdClient,
  CustdRequestError,
  SEARCH_POOL_MIN_CONTRIBUTORS,
  SEARCH_POOL_MIN_IMPRESSIONS,
  SEARCH_POOL_WINDOW_DAYS,
  SearchPoolDemandBand,
  SITE_SEARCH_POOL_NOT_JOINED_CODE,
  SITE_SEARCH_POOL_QUERY_INVALID_CODE,
  SITE_SEARCH_POOL_SETTING_INVALID_CODE,
  SITE_SEARCH_POOL_SITE_BOUND_CODE,
} from "./index";

const path = "http://localhost:8080/api/v1/site-domains/search-pool";

function respond(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function newDomains(...responses: Response[]) {
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
  return { domains: client.admin.siteDomains, calls };
}

describe("site shared search pool", () => {
  it("reads, joins, leaves and lists the pool", async () => {
    const { domains, calls } = newDomains(
      respond(200, pool.settingNotJoined),
      respond(200, pool.settingJoined),
      respond(200, pool.settingNotJoined),
      respond(200, pool.queries),
      respond(200, pool.queriesBeforeRollup),
    );

    const setting = await domains.getSearchPool();
    expect(setting).toEqual(pool.settingNotJoined);
    expect(setting.joined).toBe(false);
    expect(setting.joinedAt).toBeUndefined();
    expect(setting.minContributors).toBe(SEARCH_POOL_MIN_CONTRIBUTORS);
    expect(setting.minImpressions).toBe(SEARCH_POOL_MIN_IMPRESSIONS);
    expect(setting.windowDays).toBe(SEARCH_POOL_WINDOW_DAYS);
    expect((await domains.setSearchPool(true)).joinedAt).toBe("2026-11-17T09:30:00Z");
    expect((await domains.setSearchPool(false)).joined).toBe(false);
    const page = await domains.listSearchPoolQueries("pricing", 10);
    expect(page).toEqual(pool.queries);
    expect(page.queries[0]?.demandBand).toBe(SearchPoolDemandBand.TensOfThousands);
    expect(page.queries[1]?.positions.top3).toBe(0);
    expect(page.queries[1]?.positions.top10).toBe(0);
    const empty = await domains.listSearchPoolQueries();
    expect(empty.queries).toEqual([]);
    expect(empty.from).toBeUndefined();
    expect(empty.computedAt).toBeUndefined();

    const sent = calls();
    expect(sent.map((call) => call.route)).toEqual([
      `GET ${path}`,
      `PUT ${path}`,
      `PUT ${path}`,
      `GET ${path}/queries?limit=10&search=pricing`,
      `GET ${path}/queries`,
    ]);
    expect(sent[1]?.body).toEqual(pool.joinRequest);
    expect(sent[2]?.body).toEqual(pool.leaveRequest);
  });

  it.each([
    [pool.notJoinedProblem, SITE_SEARCH_POOL_NOT_JOINED_CODE],
    [pool.siteBoundProblem, SITE_SEARCH_POOL_SITE_BOUND_CODE],
    [pool.settingInvalidProblem, SITE_SEARCH_POOL_SETTING_INVALID_CODE],
    [pool.queryInvalidProblem, SITE_SEARCH_POOL_QUERY_INVALID_CODE],
  ])("surfaces the recorded %s problem code", async (problem, code) => {
    const { domains } = newDomains(respond(problem.status, problem));
    const refusal = domains.listSearchPoolQueries();
    await expect(refusal).rejects.toBeInstanceOf(CustdRequestError);
    await expect(refusal).rejects.toMatchObject({ status: problem.status, code });
  });
});
