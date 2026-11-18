import { describe, expect, it, vi } from "vitest";
import recorded from "../../contract-fixtures/site-next-actions.json";
import { CustdClient, SITE_NEXT_ACTIONS_MAX, SiteNextActionKind, SiteNextActionPlace, SiteNotChecked } from "./index";

const base = "http://localhost:8080/api/v1/site-domains";

function respond(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
}

function newDomains(...bodies: unknown[]) {
  const fetchImpl = vi.fn();
  for (const body of bodies) fetchImpl.mockResolvedValueOnce(respond(body));
  const client = new CustdClient({
    baseUrl: "http://localhost:8080",
    getToken: () => "admin-token",
    fetch: fetchImpl as unknown as typeof fetch,
  });
  const routes = () => fetchImpl.mock.calls.map(([url, init]) => `${(init as RequestInit).method} ${String(url)}`);
  return { domains: client.admin.siteDomains, routes };
}

describe("site next actions", () => {
  it("reads a domain's next actions and the portfolio in the server's shapes", async () => {
    const unknownKind = structuredClone(recorded.nextActionsPending);
    unknownKind.actions[0].kind = "suggestion-ready";
    const { domains, routes } = newDomains(
      recorded.nextActions,
      recorded.nextActionsFindings,
      recorded.portfolioSummary,
      unknownKind,
    );

    const next = await domains.getNextActions("d-1");
    expect(next.actions).toHaveLength(SITE_NEXT_ACTIONS_MAX);
    expect(next.actionCount).toBe(6);
    expect(next.actions.map((action) => action.kind)).toEqual([
      SiteNextActionKind.Outage,
      SiteNextActionKind.Certificate,
      SiteNextActionKind.ReconnectSearch,
    ]);
    expect(next.notChecked).toEqual([SiteNotChecked.Search]);

    const findings = await domains.getNextActions("d-1");
    expect(findings.actions[0]).toMatchObject({ affectedCount: 2, target: { place: SiteNextActionPlace.Finding } });
    expect(findings.actions[1]).toMatchObject({ recheckable: true, target: { place: SiteNextActionPlace.Page } });

    const portfolio = await domains.getPortfolioSummary({ companySlug: "acme" });
    expect(portfolio.domains.map((row) => row.firstAction?.kind)).toEqual([
      SiteNextActionKind.Verify,
      SiteNextActionKind.Outage,
      SiteNextActionKind.Finding,
      undefined,
    ]);
    expect(portfolio.domains[1].openFindings.high).toBe(4);

    expect((await domains.getNextActions("d-1")).actions[0].kind).toBe("suggestion-ready");
    expect(routes()).toEqual([
      `GET ${base}/d-1/next-actions`,
      `GET ${base}/d-1/next-actions`,
      `GET ${base}/portfolio-summary?companySlug=acme`,
      `GET ${base}/d-1/next-actions`,
    ]);
  });

  it("reads the report's next actions, which equal the read's first three", async () => {
    const { domains } = newDomains(recorded.reportWithNextActions);
    const report = await domains.getReport("d-1");
    expect(report.nextActions).toEqual(recorded.nextActions.actions);
  });
});
