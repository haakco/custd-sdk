import { describe, expect, it, vi } from "vitest";
import recorded from "../../contract-fixtures/site-insights.json";
import reporting from "../../contract-fixtures/site-insights-reporting.json";
import reporting346 from "../../contract-fixtures/site-insights-reporting-3.46.json";
import tools from "../../contract-fixtures/site-page-tools.json";
import {
  CustdClient,
  CustdRequestError,
  SITE_CHOICE_REQUIRED_CODE,
  SITE_PAGE_NOT_ON_DOMAIN_CODE,
  SITE_PAGE_RECHECK_LIMIT_CODE,
  SITE_PAGE_RECHECK_READ_LIMIT,
  SITE_SEARCH_INSPECTION_LIMIT_CODE,
  SITE_SEARCH_INSPECTION_NOT_CONNECTED_CODE,
  SITE_SEARCH_INSPECTION_URL_INVALID_CODE,
  type SiteFinding,
  SiteGeneratedFormat,
  type SiteRemedy,
  SiteRemedyKind,
} from "./index";

const base = "http://localhost:8080/api/v1";
const domainUuid = recorded.domain.domainUuid;
const siteUuid = tools.projectContext.siteUuid;
const item = `${base}/site-domains/${domainUuid}`;

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

describe("site insights page tools", () => {
  it("decodes remedies, empty remedies for unknown rules and generated fix code", async () => {
    const { domains } = newDomains(respond(200, recorded.findingList));
    const findings: SiteFinding[] = (await domains.listFindings(domainUuid)).findings;
    expect(findings.map((finding) => finding.remedy)).toEqual([
      { kind: SiteRemedyKind.Content, element: "<title>" },
      { kind: SiteRemedyKind.Server, element: "the web server" },
    ]);
    expect(tools.findingWithGeneratedFix.remedy.generated).toEqual({
      format: SiteGeneratedFormat.HTML,
      code: '<link rel="canonical" href="https://example.com/plans">',
    });
    const unknown: SiteRemedy = tools.remedyUnknownRule;
    expect(unknown).toEqual({ kind: "", element: "" });
    expect(unknown.generated).toBeUndefined();
  });

  it("sends the page tool routes and bodies and returns the recorded responses", async () => {
    const { domains, calls } = newDomains(
      respond(200, tools.pageFacts),
      respond(202, tools.pageRecheckQueued),
      respond(200, tools.pageRecheckChecked),
      respond(200, tools.pageCheck),
      respond(200, tools.robotsTest),
      respond(200, tools.robotsTestLiveMissing),
    );

    const facts = await domains.getPageFacts(domainUuid, "https://example.com/plans", { companySlug: "acme" });
    expect(facts.readability.fleschReadingEase).toBe(57.1);
    expect(facts.headings[0]).toEqual({ level: 1, text: "Hosting plans" });
    const queued = await domains.requestPageRecheck(domainUuid, tools.pageRecheckRequest.url);
    expect(queued.state).toBe("queued");
    expect(queued.checkedAt).toBeUndefined();
    const checked = await domains.getPageRecheck(domainUuid, queued.recheckUuid);
    expect(checked.fixedRules).toEqual(["title.missing"]);
    const draft = await domains.checkPage(domainUuid, tools.pageCheckRequest);
    expect(draft).toEqual(tools.pageCheck);
    expect(draft.findings[0]).not.toHaveProperty("findingUuid");
    const pasted = await domains.testRobots(domainUuid, tools.robotsTestRequest);
    expect(pasted.rule).toEqual({ line: 2, directive: "disallow", pattern: "/private/" });
    expect(pasted.robotsStatus).toBeUndefined();
    const live = await domains.testRobots(domainUuid, { url: "/", userAgent: "GPTBot" });
    expect(live.robotsStatus).toBe(404);
    expect(live.rule).toBeUndefined();

    const sent = calls();
    expect(sent.map((call) => call.route)).toEqual([
      `GET ${item}/page-facts?url=${encodeURIComponent("https://example.com/plans")}&companySlug=acme`,
      `POST ${item}/page-rechecks`,
      `GET ${item}/page-rechecks/${queued.recheckUuid}`,
      `POST ${item}/page-check`,
      `POST ${item}/robots-test`,
      `POST ${item}/robots-test`,
    ]);
    expect(sent[1]?.body).toEqual(tools.pageRecheckRequest);
    expect(sent[3]?.body).toEqual(tools.pageCheckRequest);
    expect(sent[4]?.body).toEqual(tools.robotsTestRequest);
    expect(sent[5]?.body).toEqual({ url: "/", userAgent: "GPTBot" });
  });

  it("reads several rechecks in one call with the ids comma-joined, and says which findings a recheck confirms", async () => {
    const { domains, calls } = newDomains(
      respond(200, tools.pageRecheckList),
      respond(200, recorded.findingList),
      respond(422, recorded.siteChoiceRequiredProblem),
    );

    const list = await domains.listPageRechecks(domainUuid, ["r-1", "r-2"]);
    expect(list.rechecks.map((recheck) => recheck.state)).toEqual(["checked", "failed"]);
    const findings = (await domains.listFindings(domainUuid)).findings;
    expect(findings.map((finding) => finding.recheckable)).toEqual([true, false]);
    const refused = await domains.create({ host: "blog.example.com" }).catch((error: unknown) => error);
    expect(refused).toBeInstanceOf(CustdRequestError);
    expect((refused as CustdRequestError).code).toBe(SITE_CHOICE_REQUIRED_CODE);
    expect(SITE_PAGE_RECHECK_READ_LIMIT).toBe(30);
    const sent = calls();
    expect(sent[0]?.route).toBe(`GET ${item}/page-rechecks?ids=r-1%2Cr-2`);
    expect(sent[2]?.body).toEqual({ host: "blog.example.com" });
  });

  it("sends the draft tools and wording compare and decodes their recorded answers", async () => {
    const { domains, calls } = newDomains(
      respond(200, tools.pageCheckDraftTools),
      respond(200, tools.pageFactsShareImage),
      respond(200, tools.wordingCompare),
      respond(200, tools.wordingCompareNotCompared),
      respond(200, {
        ...tools.pageCheckDraftTools,
        phrase: { ...tools.pageCheckDraftTools.phrase, count: 0, wordCount: 0, densityPercent: 0 },
      }),
    );

    const draft = await domains.checkPage(domainUuid, tools.pageCheckDraftToolsRequest);
    expect(draft).toEqual(tools.pageCheckDraftTools);
    expect(draft.slug).toBe("cafe-hosting-plans-for-small-teams");
    expect(draft.redirect?.format).toBe(SiteGeneratedFormat.Redirect);
    expect(draft.phrase?.densityPercent).toBe(3.85);
    const facts = await domains.getPageFacts(domainUuid, "https://example.com/plans");
    expect(facts.shareImage).toBe("https://example.com/img/team.jpg");
    expect(facts.faqSchema?.format).toBe(SiteGeneratedFormat.HTML);
    const compared = await domains.compareWording(domainUuid, tools.wordingCompareRequest);
    expect(compared.sharedPercent).toBe(91);
    expect(compared.nearDuplicate).toBe(true);
    const short = await domains.compareWording(domainUuid, { first: "a", second: "b" });
    expect(short.compared).toBe(false);
    expect(short).not.toHaveProperty("sharedPercent");
    const wordless = await domains.checkPage(domainUuid, {
      url: "https://example.com/plans",
      html: "<p></p>",
      phrase: "x",
    });
    expect(wordless.phrase).not.toHaveProperty("densityPercent");

    const sent = calls();
    expect(sent.map((call) => call.route)).toEqual([
      `POST ${item}/page-check`,
      `GET ${item}/page-facts?url=${encodeURIComponent("https://example.com/plans")}`,
      `POST ${item}/wording-compare`,
      `POST ${item}/wording-compare`,
      `POST ${item}/page-check`,
    ]);
    expect(sent[0]?.body).toEqual(tools.pageCheckDraftToolsRequest);
    expect(sent[2]?.body).toEqual(tools.wordingCompareRequest);
    expect(sent[4]?.body).toEqual({ url: "https://example.com/plans", html: "<p></p>", phrase: "x" });
    expect(tools.pageCheck).not.toHaveProperty("slug");
    expect(tools.pageFacts).not.toHaveProperty("shareImage");
  });

  it("decodes absent readability and recheck failures without inventing zeros", () => {
    expect(tools.pageFactsWithoutReadingEase.readability).not.toHaveProperty("fleschReadingEase");
    expect(tools.pageRecheckFailed.failure).toBe("the page answered HTTP 503");
  });
});

describe("site insights search rows, inspections and project context", () => {
  it("sends the routes and bodies and returns the recorded responses", async () => {
    const { domains, calls } = newDomains(
      respond(200, tools.searchRows),
      respond(200, tools.searchRowsNoPosition),
      respond(202, tools.searchInspectionQueued),
      respond(200, tools.searchInspectionList),
      respond(200, tools.projectContext),
      respond(200, tools.projectContextEmpty),
    );

    const rows = await domains.listSearchRows(domainUuid, { dimension: "country", days: 28 });
    expect(rows.unavailable).toEqual([tools.searchRows.unavailable[0]]);
    expect(rows.provider).toBeUndefined();
    expect(rows.rows[0]?.totals.position).toBe(6.5);
    const bing = await domains.listSearchRows(domainUuid, {
      dimension: "query",
      provider: "bing",
      days: 7,
      offset: 100,
      limit: 50,
    });
    expect(bing.rows[0]?.totals.position).toBeUndefined();
    expect(bing.rows[0]?.totals.ctr).toBe(0);
    const queued = await domains.requestSearchInspection(domainUuid, tools.searchInspectionRequest.url);
    expect(queued.inspectedAt).toBeUndefined();
    const inspections = await domains.listSearchInspections(domainUuid);
    expect(inspections.dailyLimit).toBe(200);
    expect(inspections.inspections[0]?.lastCrawlAt).toBe("2026-11-15T03:00:00Z");
    expect(inspections.inspections[1]?.lastCrawlAt).toBeUndefined();
    const context = await domains.getProjectContext(siteUuid);
    expect(context.markets).toEqual([{ country: "ZA", language: "en" }]);
    const cleared = await domains.setProjectContext({});
    expect(cleared.updatedAt).toBeUndefined();

    const sent = calls();
    expect(sent.map((call) => call.route)).toEqual([
      `GET ${item}/search/rows?dimension=country&days=28`,
      `GET ${item}/search/rows?dimension=query&provider=bing&days=7&offset=100&limit=50`,
      `POST ${item}/search/inspections`,
      `GET ${item}/search/inspections`,
      `GET ${base}/site-domains/project-context?siteUuid=${siteUuid}`,
      `PUT ${base}/site-domains/project-context`,
    ]);
    expect(sent[2]?.body).toEqual(tools.searchInspectionRequest);
    expect(sent[5]?.body).toEqual({ brandNames: [], competitorDomains: [], markets: [] });
  });

  it("sends the full project context for a named Site", async () => {
    const { domains, calls } = newDomains(respond(200, tools.projectContext));
    await domains.setProjectContext({ siteUuid, ...tools.projectContextRequest });
    expect(calls()[0]).toEqual({
      route: `PUT ${base}/site-domains/project-context?siteUuid=${siteUuid}`,
      body: tools.projectContextRequest,
    });
  });

  it.each([
    [tools.pageNotOnDomainProblem, SITE_PAGE_NOT_ON_DOMAIN_CODE],
    [tools.pageRecheckLimitProblem, SITE_PAGE_RECHECK_LIMIT_CODE],
    [tools.searchInspectionUrlInvalidProblem, SITE_SEARCH_INSPECTION_URL_INVALID_CODE],
    [tools.searchInspectionNotConnectedProblem, SITE_SEARCH_INSPECTION_NOT_CONNECTED_CODE],
    [tools.searchInspectionLimitProblem, SITE_SEARCH_INSPECTION_LIMIT_CODE],
  ])("surfaces the recorded %s problem code", async (problem, code) => {
    const { domains } = newDomains(respond(problem.status, problem));
    const refusal = domains.requestSearchInspection(domainUuid, "https://example.com/plans");
    await expect(refusal).rejects.toBeInstanceOf(CustdRequestError);
    await expect(refusal).rejects.toMatchObject({ status: problem.status, code });
  });
});

describe("site insights reporting", () => {
  it("sends the report, history and share routes and returns the recorded responses", async () => {
    const { domains, calls } = newDomains(
      respond(200, reporting.report),
      respond(200, reporting.uptime),
      respond(200, reporting.lighthouse),
      respond(200, reporting.shares),
      respond(201, reporting.created),
      respond(204),
    );

    const report = await domains.getReport(domainUuid);
    expect(report).toEqual(reporting.report);
    expect(report.uptime.windows.last24h.upPercent).toBeUndefined();
    expect(report.speed[0]?.scores.accessibility).toBeUndefined();
    const uptime = await domains.getUptimeHistory(domainUuid, 7);
    expect(uptime.windows.last7d.upPercent).toBe(90);
    expect(uptime.hours[0]?.avgMs).toBeUndefined();
    const lighthouse = await domains.getLighthouseHistory(domainUuid, 7);
    expect(lighthouse.runs[1]?.scores.performance).toBeUndefined();
    expect(lighthouse.runs[1]?.failure).toBe("timeout");
    expect((await domains.listReportShares(domainUuid)).shares[0]?.shareUuid).toBe("share-1");
    expect((await domains.createReportShare(domainUuid, { expiresInDays: 14 })).token).toBe("test-only-share-token");
    await expect(domains.revokeReportShare(domainUuid, "share-1")).resolves.toBeUndefined();

    const sent = calls();
    expect(sent.map((call) => call.route)).toEqual([
      `GET ${item}/report`,
      `GET ${item}/uptime-history?responseDays=7`,
      `GET ${item}/lighthouse?days=7`,
      `GET ${item}/report-shares`,
      `POST ${item}/report-shares`,
      `DELETE ${item}/report-shares/share-1`,
    ]);
    expect(sent[4]?.body).toEqual({ expiresInDays: 14 });
  });
});

describe("site insights reporting from a 3.46.0 server", () => {
  it("decodes a report without a template and Lighthouse history without url or pages", async () => {
    const { domains } = newDomains(respond(200, reporting346.report), respond(200, reporting346.lighthouse));

    const report = await domains.getReport(domainUuid);
    expect(report.template).toBeUndefined();
    expect(report.host).toBe(reporting346.report.host);
    const lighthouse = await domains.getLighthouseHistory(domainUuid, 7);
    expect(lighthouse.url).toBeUndefined();
    expect(lighthouse.pages ?? []).toEqual([]);
    expect(lighthouse.runs).toEqual(reporting346.lighthouse.runs);
  });
});
