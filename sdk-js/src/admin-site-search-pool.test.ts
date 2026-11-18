import { describe, expect, it, vi } from "vitest";
import pool from "../../contract-fixtures/site-search-pool.json";
import {
  CustdClient,
  CustdRequestError,
  SEARCH_POOL_MIN_CONTRIBUTORS,
  SEARCH_POOL_MIN_IMPRESSIONS,
  SEARCH_POOL_TERMS_VERSION,
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
    expect(setting.termsVersion).toBe(SEARCH_POOL_TERMS_VERSION);
    expect(setting.acceptedTermsVersion).toBeUndefined();
    const joined = await domains.setSearchPool(true, setting.termsVersion);
    expect(joined.joinedAt).toBe("2026-11-18T09:00:00Z");
    expect(joined.acceptedTermsVersion).toBe(SEARCH_POOL_TERMS_VERSION);
    expect((await domains.setSearchPool(false, SEARCH_POOL_TERMS_VERSION)).joined).toBe(false);
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

  it("refuses to join without a terms version before sending anything", async () => {
    const { domains, calls } = newDomains();
    await expect(domains.setSearchPool(true)).rejects.toThrow(/termsVersion/);
    await expect(domains.setSearchPool(true, " ")).rejects.toThrow(/termsVersion/);
    expect(calls()).toEqual([]);
  });

  it("surfaces the server's refusal of missing or stale terms as a plain 400", async () => {
    const problem = pool.termsNotAcceptedProblem;
    const { domains } = newDomains(respond(problem.status, problem));
    await expect(domains.setSearchPool(true, "2026-01-01")).rejects.toMatchObject({ status: 400 });
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
