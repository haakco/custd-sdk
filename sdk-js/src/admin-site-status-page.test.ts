import { describe, expect, it, vi } from "vitest";
import fixture from "../../contract-fixtures/site-status-page.json";
import { CustdClient, type SiteStatusComponentStatus, siteStatusPagePublicUrl } from "./index";

const path = "http://localhost:8080/api/v1/site-domains/d-1/status-page";

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

describe("site status page", () => {
  it("reads, previews, publishes, unpublishes and posts updates", async () => {
    const { domains, calls } = newDomains(
      respond(200, fixture.statusPageSettings),
      respond(200, fixture.statusPagePreview),
      respond(200, fixture.statusPagePublication),
      respond(204),
      respond(201, fixture.statusPageUpdateHistory),
    );
    const draft = fixture.statusPageDraft;

    const settings = await domains.getStatusPageSettings("d-1", { companySlug: "acme" });
    expect(settings).toEqual(fixture.statusPageSettings);
    const page = await domains.previewStatusPage("d-1", draft);
    const statuses: SiteStatusComponentStatus[] = page.components.map((component) => component.status);
    expect(statuses).toEqual(["up", "maintenance"]);
    expect(page.components[1]?.lastCheckedAt).toBeUndefined();
    expect(page.updates[0]?.message).toBe("Service restored.");
    const publication = await domains.publishStatusPage("d-1", draft);
    expect(publication).toEqual(fixture.statusPagePublication);
    expect(siteStatusPagePublicUrl("https://custd.com//", publication)).toBe(
      `https://custd.com/status-page#${fixture.statusPagePublication.publicKey}`,
    );
    await expect(domains.unpublishStatusPage("d-1")).resolves.toBeUndefined();
    const history = await domains.postStatusPageUpdate("d-1", fixture.statusPageUpdateRequest);
    expect(history).toEqual(fixture.statusPageUpdateHistory);

    const sent = calls();
    expect(sent.map((call) => call.route)).toEqual([
      `GET ${path}?companySlug=acme`,
      `POST ${path}/preview`,
      `PUT ${path}`,
      `DELETE ${path}`,
      `POST ${path}/updates`,
    ]);
    expect(sent.map((call) => call.body)).toEqual([
      undefined,
      draft,
      draft,
      undefined,
      fixture.statusPageUpdateRequest,
    ]);
  });
});
