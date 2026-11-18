import { describe, expect, it, vi } from "vitest";
import queries from "../../contract-fixtures/site-page-queries.json";
import { CustdClient, SitePageLinkSourceWhere, SitePageQueriesState, SiteTitleTemplate } from "./index";

const domainUuid = queries.pageSearchQueries.domainUuid;
const pageUrl = queries.pageSearchQueries.url;
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

describe("site page search queries", () => {
  it("reads one page's queries, title options and link sources for an acting company", async () => {
    const { domains, calls } = newClient(
      respond(200, queries.pageSearchQueries),
      respond(200, queries.pageSearchQueriesNotConnected),
    );

    const page = await domains.getPageSearchQueries(domainUuid, pageUrl, { companySlug: "shop" });
    expect(page).toEqual(queries.pageSearchQueries);
    expect(page.state).toBe(SitePageQueriesState.Available);
    expect(page.titleOptions[1]?.template).toBe(SiteTitleTemplate.Guide);
    expect(page.linkSources[0]?.where).toBe(SitePageLinkSourceWhere.Title);
    const unconnected = await domains.getPageSearchQueries(domainUuid, pageUrl);
    expect(unconnected.state).toBe(SitePageQueriesState.NotConnected);
    expect(unconnected.window).toBeUndefined();
    expect(unconnected.queries).toEqual([]);

    expect(calls().map((call) => call.route)).toEqual([
      `GET ${item}/page-search-queries?url=${encodeURIComponent(pageUrl)}&companySlug=shop`,
      `GET ${item}/page-search-queries?url=${encodeURIComponent(pageUrl)}`,
    ]);
  });
});
