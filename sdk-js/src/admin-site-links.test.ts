import { describe, expect, it, vi } from "vitest";
import links from "../../contract-fixtures/site-links.json";
import { CustdClient, SiteLinkSource, SiteLinkSourceStatus, SiteWebDomainRole } from "./index";

const base = "http://localhost:8080/api/v1/site-domains";

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

describe("site referring domains", () => {
  it("keeps unreported counts and ranks absent and a real 0 or false as is", async () => {
    const { domains, routes } = newDomains(
      respond(200, links.referringDomains),
      respond(200, links.referringDomainsPending),
      respond(200, links.referringDomainsOutsideGraph),
    );

    const own = await domains.getReferringDomains("example.com", "s-1");
    expect(own).toEqual(links.referringDomains);
    expect(own.role).toBe(SiteWebDomainRole.Own);
    const commonCrawl = own.sources[1];
    expect(commonCrawl?.source).toBe(SiteLinkSource.CommonCrawl);
    expect(commonCrawl?.complete).toBe(false);
    expect(commonCrawl?.referringDomains).toBe(1843);
    expect(commonCrawl?.links).toBeUndefined();
    expect(own.referringDomains[0]?.followed).toBe(false);
    expect(own.referringDomains[1]?.crawlLinks).toBeUndefined();
    expect(own.referringDomains[1]?.followed).toBeUndefined();
    expect(own.lost.domains[1]?.harmonicRank).toBeUndefined();

    const pending = await domains.getReferringDomains("rival.example");
    expect(pending.role).toBe(SiteWebDomainRole.Competitor);
    expect(pending.sources.map((total) => total.status)).toEqual([
      SiteLinkSourceStatus.Unavailable,
      SiteLinkSourceStatus.Pending,
      SiteLinkSourceStatus.Unavailable,
    ]);
    expect(pending.sources.every((total) => total.referringDomains === undefined && total.links === undefined)).toBe(
      true,
    );
    expect(pending.authority).toBeUndefined();
    expect(pending.referringDomains).toEqual([]);
    expect(pending.lost.status).toBe(SiteLinkSourceStatus.Pending);
    expect(pending.lost.release).toBeUndefined();

    const outside = await domains.getReferringDomains("shop.example.dev", "s-1", { companySlug: "acme" });
    const [bing, , crawl] = outside.sources;
    expect(bing?.status).toBe(SiteLinkSourceStatus.Failed);
    expect(bing?.lastFailure).toBe("bing GetLinkCounts: 401 Unauthorized");
    expect(bing?.referringDomains).toBeUndefined();
    expect(outside.sources[1]?.asOf).toBe("cc-main-2026-aug-sep-oct");
    expect(outside.authority?.inGraph).toBe(false);
    expect(outside.authority?.harmonicRank).toBeUndefined();
    expect(outside.authority?.pageRank).toBeUndefined();
    expect(outside.authority?.hosts).toBeUndefined();
    expect(crawl?.referringDomains).toBe(0);
    expect(crawl?.links).toBe(0);
    expect(outside.lost.status).toBe(SiteLinkSourceStatus.Unavailable);

    expect(routes()).toEqual([
      `GET ${base}/referring-domains?domain=example.com&siteUuid=s-1`,
      `GET ${base}/referring-domains?domain=rival.example`,
      `GET ${base}/referring-domains?domain=shop.example.dev&siteUuid=s-1&companySlug=acme`,
    ]);
  });
});
