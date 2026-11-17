import { describe, expect, it, vi } from "vitest";
import web from "../../contract-fixtures/site-web-data.json";
import {
  CustdClient,
  CustdRequestError,
  SITE_KEYWORD_LIST_LIMIT_CODE,
  SITE_KEYWORD_LIST_NOT_FOUND_CODE,
  SiteContentGapCoverage,
  SiteTopicTrendStatus,
  SiteTrancoBand,
  SiteWebDomainRole,
  SiteWebInventoryStatus,
} from "./index";

const siteUuid = web.webDomains.siteUuid;
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
  const calls = () =>
    fetchImpl.mock.calls.map(([url, init]) => {
      const request = init as RequestInit;
      const body = typeof request.body === "string" ? JSON.parse(request.body) : undefined;
      return { route: `${request.method} ${String(url)}`, body };
    });
  return { domains: client.admin.siteDomains, calls };
}

describe("site public web data", () => {
  it("reads web domains, pages, trends and the content gap", async () => {
    const { domains, calls } = newDomains(
      respond(200, web.webDomains),
      respond(200, web.webPages),
      respond(200, web.webPagesLast),
      respond(200, web.topicTrends),
      respond(200, web.contentGap),
      respond(200, web.contentGapUnavailable),
    );

    const inventory = await domains.getWebDomains(siteUuid);
    expect(inventory).toEqual(web.webDomains);
    expect(inventory.domains[0]?.role).toBe(SiteWebDomainRole.Own);
    expect(inventory.domains[1]?.trancoBand).toBe(SiteTrancoBand.Unranked);
    expect(inventory.domains[1]?.trancoRank).toBeUndefined();
    expect(inventory.domains[2]?.sitemapStatus).toBe(SiteWebInventoryStatus.Pending);
    expect(inventory.domains[2]?.pageCount).toBe(0);
    expect(inventory.domains[2]?.inventoryAt).toBeUndefined();
    const pages = await domains.listWebPages("rival.example", { siteUuid, limit: 2 });
    expect(pages.next).toBe("https://rival.example/pricing");
    const last = await domains.listWebPages("rival.example", { after: pages.next });
    expect(last.next).toBeUndefined();
    const trends = await domains.getTopicTrends();
    expect(trends.trends[0]?.months[1]?.views).toBe(0);
    expect(trends.trends[1]?.status).toBe(SiteTopicTrendStatus.NoArticle);
    expect(trends.trends[2]?.checkedAt).toBeUndefined();
    const gap = await domains.getContentGap(siteUuid, "seo checklist");
    expect(gap).toEqual(web.contentGap);
    const unavailable = await domains.getContentGap();
    expect(unavailable.ownCoverage).toBe(SiteContentGapCoverage.Unavailable);
    expect(unavailable.seed).toBeUndefined();

    expect(calls().map((call) => call.route)).toEqual([
      `GET ${base}/web-domains?siteUuid=${siteUuid}`,
      `GET ${base}/web-pages?siteUuid=${siteUuid}&domain=rival.example&limit=2`,
      `GET ${base}/web-pages?domain=rival.example&after=${encodeURIComponent("https://rival.example/pricing")}`,
      `GET ${base}/topic-trends`,
      `GET ${base}/content-gap?siteUuid=${siteUuid}&seed=seo+checklist`,
      `GET ${base}/content-gap`,
    ]);
  });
});

describe("site keyword lists", () => {
  it("lists, saves, clusters and deletes keyword lists", async () => {
    const { domains, calls } = newDomains(
      respond(200, web.keywordLists),
      respond(200, web.keywordList),
      respond(200, web.keywordClusters),
      respond(204),
    );

    const lists = await domains.listKeywordLists(siteUuid);
    expect(lists.lists[0]?.seedTerm).toBeUndefined();
    expect(await domains.saveKeywordList(web.keywordListRequest, siteUuid)).toEqual(web.keywordList);
    const clusters = await domains.getKeywordClusters("Pricing", siteUuid);
    expect(clusters).toEqual(web.keywordClusters);
    expect(clusters.clusters[0]?.avgPosition).toBe(6.5);
    expect(clusters.clusters[1]?.measuredKeywords).toBe(0);
    expect(clusters.clusters[1]?.clicks).toBeUndefined();
    await expect(domains.deleteKeywordList("Pricing")).resolves.toBeUndefined();

    const sent = calls();
    expect(sent.map((call) => call.route)).toEqual([
      `GET ${base}/keyword-lists?siteUuid=${siteUuid}`,
      `PUT ${base}/keyword-lists?siteUuid=${siteUuid}`,
      `GET ${base}/keyword-clusters?siteUuid=${siteUuid}&name=Pricing`,
      `DELETE ${base}/keyword-lists?name=Pricing`,
    ]);
    expect(sent[1]?.body).toEqual(web.keywordListRequest);
  });

  it("leaves an empty seed term out of the saved list", async () => {
    const { domains, calls } = newDomains(respond(200, web.keywordLists.lists[0]));
    await domains.saveKeywordList({ name: "Brand", seedTerm: "", keywords: ["example"] });
    expect(calls()[0]?.body).toEqual({ name: "Brand", keywords: ["example"] });
  });

  it.each([
    [web.keywordListNotFoundProblem, SITE_KEYWORD_LIST_NOT_FOUND_CODE],
    [web.keywordListLimitProblem, SITE_KEYWORD_LIST_LIMIT_CODE],
  ])("surfaces the recorded %s problem code", async (problem, code) => {
    const { domains } = newDomains(respond(problem.status, problem));
    const refusal = domains.saveKeywordList(web.keywordListRequest);
    await expect(refusal).rejects.toBeInstanceOf(CustdRequestError);
    await expect(refusal).rejects.toMatchObject({ status: problem.status, code });
  });
});
