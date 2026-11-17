import { describe, expect, it, vi } from "vitest";
import value from "../../contract-fixtures/site-search-value.json";
import { CustdClient, SiteFindingImpactStatus, SiteSearchGoalStatus } from "./index";

const domainUuid = value.searchValue.domainUuid;
const item = `http://localhost:8080/api/v1/site-domains/${domainUuid}`;

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
  const routes = () => fetchImpl.mock.calls.map(([url, init]) => `${(init as RequestInit).method} ${String(url)}`);
  return { domains: client.admin.siteDomains, routes };
}

describe("site finding search impact", () => {
  it("keeps an insufficient period's numbers absent and a measured 0 as 0", async () => {
    const { domains, routes } = newDomains(respond(200, value.findingImpact), respond(200, value.findingImpactOpen));

    const impact = await domains.getFindingSearchImpact(domainUuid, "f-fixed", 28);
    expect(impact).toEqual(value.findingImpact);
    const [google, bing] = impact.sources;
    expect(google?.after.clicks).toBe(0);
    expect(google?.after.ctr).toBe(0);
    expect(bing?.status).toBe(SiteFindingImpactStatus.Insufficient);
    expect(bing?.after.clicks).toBeUndefined();
    expect(bing?.after.impressions).toBeUndefined();
    expect(bing?.after.ctr).toBeUndefined();
    const open = await domains.getFindingSearchImpact(domainUuid, "f-open");
    expect(open.status).toBe(SiteFindingImpactStatus.Open);
    expect(open.fixedAt).toBeUndefined();
    expect(open.before).toBeUndefined();

    expect(routes()).toEqual([
      `GET ${item}/findings/f-fixed/search-impact?days=28`,
      `GET ${item}/findings/f-open/search-impact`,
    ]);
  });
});

describe("site search value", () => {
  it("repeats goal per event type and keeps unmatched goals absent", async () => {
    const { domains, routes } = newDomains(respond(200, value.searchValue), respond(200, value.searchValueUnavailable));

    const searchValue = await domains.getSearchValue(domainUuid, ["signup", "purchase"]);
    expect(searchValue).toEqual(value.searchValue);
    expect(searchValue.goalStatus).toBe(SiteSearchGoalStatus.Partial);
    expect(searchValue.pages[1]?.goalConversions).toBe(0);
    expect(searchValue.pages[2]?.landings).toBeUndefined();
    expect(searchValue.pages[2]?.goalConversions).toBeUndefined();
    expect(searchValue.pages[2]?.search.position).toBeUndefined();
    const unavailable = await domains.getSearchValue(domainUuid, ["signup"], 7, { companySlug: "acme" });
    expect(unavailable.goalStatus).toBe(SiteSearchGoalStatus.Unavailable);
    expect(unavailable.pages[0]?.goalConversions).toBeUndefined();

    expect(routes()).toEqual([
      `GET ${item}/search-value?goal=signup&goal=purchase`,
      `GET ${item}/search-value?goal=signup&days=7&companySlug=acme`,
    ]);
  });
});
