import { describe, expect, it, vi } from "vitest";
import audit from "../../contract-fixtures/site-audit-pages.json";
import {
  CustdClient,
  CustdRequestError,
  SITE_LIGHTHOUSE_PAGE_NOT_EXTRA_CODE,
  SiteAuditPageIndexability,
  SiteAuditRun,
  SiteRule,
} from "./index";

const domainUuid = audit.auditPages.domainUuid;
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
  const calls = () =>
    fetchImpl.mock.calls.map(([url, init]) => {
      const request = init as RequestInit;
      const body = typeof request.body === "string" ? JSON.parse(request.body) : undefined;
      return { route: `${request.method} ${String(url)}`, body };
    });
  return { domains: client.admin.siteDomains, calls };
}

describe("site audit pages and delta", () => {
  it("pages through crawled URLs keeping absent depth apart from a present 0", async () => {
    const { domains, calls } = newDomains(
      respond(200, audit.auditPages),
      respond(200, audit.auditPagesTruncated),
      respond(200, audit.auditPagesNotAudited),
    );

    const pages = await domains.listAuditPages(domainUuid);
    expect(pages).toEqual(audit.auditPages);
    expect(pages.pages[0]?.depth).toBe(0);
    expect(pages.pages[1]?.indexability).toBe(SiteAuditPageIndexability.Redirected);
    expect(pages.pages[2]?.depth).toBeUndefined();
    expect(pages.pages[2]?.inboundLinks).toBe(0);
    const truncated = await domains.listAuditPages(domainUuid, 50, 50, { companySlug: "acme" });
    expect(truncated.truncated).toBe(true);
    expect(truncated.pages[0]?.inboundLinks).toBeUndefined();
    expect(truncated.pages[0]?.indexability).toBe(SiteAuditPageIndexability.Error);
    expect((await domains.listAuditPages(domainUuid, 0, 200)).auditedAt).toBeUndefined();

    expect(calls().map((call) => call.route)).toEqual([
      `GET ${item}/audit-pages`,
      `GET ${item}/audit-pages?offset=50&limit=50&companySlug=acme`,
      `GET ${item}/audit-pages?offset=0&limit=200`,
    ]);
  });

  it("decodes the complete, failed and not-audited deltas with finding remedies", async () => {
    const { domains, calls } = newDomains(
      respond(200, audit.auditDelta),
      respond(200, audit.auditDeltaFailed),
      respond(200, audit.auditDeltaNotAudited),
    );

    const delta = await domains.getAuditDelta(domainUuid);
    expect(delta).toEqual(audit.auditDelta);
    expect(delta.run).toBe(SiteAuditRun.Complete);
    expect(delta.new[0]?.rule).toBe(SiteRule.BrokenFragment);
    expect(delta.reopened[0]?.rule).toBe(SiteRule.SitemapBlockedURL);
    expect(delta.fixed[0]?.history.fixedAt).toBe("2026-11-17T06:00:00Z");
    const failed = await domains.getAuditDelta(domainUuid);
    expect(failed.run).toBe(SiteAuditRun.Failed);
    expect(failed.failure).toBe("the home page did not answer");
    const none = await domains.getAuditDelta(domainUuid);
    expect(none.run).toBe(SiteAuditRun.NotAudited);
    expect(none.auditedAt).toBeUndefined();
    expect(calls()[0]?.route).toBe(`GET ${item}/audit-delta`);
  });
});

describe("site Lighthouse pages", () => {
  it("reads one page's history and sets and clears the extra pages", async () => {
    const { domains, calls } = newDomains(
      respond(200, audit.lighthousePageHistory),
      respond(200, audit.lighthousePagesEmpty),
      respond(200, audit.lighthousePages),
      respond(200, audit.lighthousePagesEmpty),
    );

    const history = await domains.getLighthouseHistory(domainUuid, 7, { url: "https://example.com/pricing" });
    expect(history).toEqual(audit.lighthousePageHistory);
    expect(history.pages?.[0]?.previousScore).toBe(95);
    expect(history.pages?.[1]?.previousAt).toBeUndefined();
    expect(history.pages?.[1]?.previousScore).toBeUndefined();
    expect(history.pages?.[1]?.regressionOpen).toBe(true);
    expect((await domains.getLighthousePages(domainUuid)).urls).toEqual([]);
    const set = await domains.setLighthousePages(domainUuid, audit.lighthousePagesRequest.urls);
    expect(set.maxPages).toBe(5);
    await domains.setLighthousePages(domainUuid, []);

    const sent = calls();
    expect(sent.map((call) => call.route)).toEqual([
      `GET ${item}/lighthouse?days=7&url=${encodeURIComponent("https://example.com/pricing")}`,
      `GET ${item}/lighthouse/pages`,
      `PUT ${item}/lighthouse/pages`,
      `PUT ${item}/lighthouse/pages`,
    ]);
    expect(sent[2]?.body).toEqual(audit.lighthousePagesRequest);
    expect(sent[3]?.body).toEqual(audit.lighthousePagesClearRequest);
  });

  it("surfaces the recorded page-not-extra problem code", async () => {
    const problem = audit.lighthousePageNotExtraProblem;
    const { domains } = newDomains(respond(problem.status, problem));
    const refusal = domains.setLighthousePages(domainUuid, ["https://example.com/"]);
    await expect(refusal).rejects.toBeInstanceOf(CustdRequestError);
    await expect(refusal).rejects.toMatchObject({ status: 400, code: SITE_LIGHTHOUSE_PAGE_NOT_EXTRA_CODE });
  });
});
