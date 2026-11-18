import { describe, expect, it, vi } from "vitest";
import links from "../../contract-fixtures/site-campaign-links.json";
import {
  CustdClient,
  CustdRequestError,
  SITE_CAMPAIGN_LINK_LIMIT_CODE,
  SITE_CAMPAIGN_LINK_TAKEN_CODE,
  SITE_CAMPAIGN_LINKS_MAX,
} from "./index";

const path = "http://localhost:8080/api/v1/site-domains/d-1/campaign-links";

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

describe("site campaign links", () => {
  it("lists, creates and archives links", async () => {
    const { domains, calls } = newDomains(
      respond(200, links.campaignLinkListWithArchived),
      respond(201, links.campaignLink),
      respond(201, links.campaignLink),
      respond(200, links.campaignLinkArchived),
      respond(200, links.campaignLinkListWithArchived),
    );

    const list = await domains.listCampaignLinks("d-1", true);
    expect(list).toEqual(links.campaignLinkListWithArchived);
    expect(list.maxLinks).toBe(SITE_CAMPAIGN_LINKS_MAX);
    expect(list.links[0]?.archivedAt).toBeUndefined();
    expect(list.links[1]?.term).toBe("");
    const link = await domains.createCampaignLink("d-1", links.campaignLinkRequest);
    expect(link.term).toBe("hosting_plans");
    await domains.createCampaignLink("d-1", {
      url: "https://example.com/",
      source: "google",
      medium: "cpc",
      campaign: "sale",
    });
    expect((await domains.archiveCampaignLink("d-1", "l-2")).archivedAt).toBe("2026-11-18T06:00:00Z");
    await domains.listCampaignLinks("d-1");

    const sent = calls();
    expect(sent.map((call) => call.route)).toEqual([
      `GET ${path}?archived=true`,
      `POST ${path}`,
      `POST ${path}`,
      `POST ${path}/l-2/archive`,
      `GET ${path}`,
    ]);
    expect(sent[1]?.body).toEqual(links.campaignLinkRequest);
    expect(sent[2]?.body).toEqual({ url: "https://example.com/", source: "google", medium: "cpc", campaign: "sale" });
  });

  it.each([
    [links.campaignLinkTakenProblem, SITE_CAMPAIGN_LINK_TAKEN_CODE],
    [links.campaignLinkLimitProblem, SITE_CAMPAIGN_LINK_LIMIT_CODE],
  ])("surfaces the recorded %s problem code", async (problem, code) => {
    const { domains } = newDomains(respond(problem.status, problem));
    const refusal = domains.createCampaignLink("d-1", links.campaignLinkRequest);
    await expect(refusal).rejects.toBeInstanceOf(CustdRequestError);
    await expect(refusal).rejects.toMatchObject({ status: problem.status, code });
  });
});
