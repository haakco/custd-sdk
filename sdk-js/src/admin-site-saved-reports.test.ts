import { describe, expect, it, vi } from "vitest";
import saved from "../../contract-fixtures/site-saved-reports.json";
import {
  CustdClient,
  CustdRequestError,
  SAVED_SITE_REPORT_LIMIT_CODE,
  SAVED_SITE_REPORT_NAME_TAKEN_CODE,
  type SavedSiteReportRequest,
  SITE_SAVED_REPORTS_MAX,
  SiteReportTemplate,
} from "./index";

const domainUuid = "8f14e45f-ceea-4e7b-9a37-2f1c5e0b7a11";
const reportUuid = saved.savedReport.reportUuid;
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

describe("site saved reports", () => {
  it("reads the executive template and saves, lists, replaces and deletes reports", async () => {
    const { domains, calls } = newDomains(
      respond(200, saved.executiveReport),
      respond(200, saved.savedReportListEmpty),
      respond(201, saved.savedReport),
      respond(200, saved.savedReportList),
      respond(200, saved.savedReport),
      respond(200, saved.savedReport),
      respond(204),
    );

    const executive = await domains.getReport(domainUuid, { template: SiteReportTemplate.Executive, days: 14 });
    expect(executive).toEqual(saved.executiveReport);
    expect(executive.template).toBe(SiteReportTemplate.Executive);
    expect((await domains.listSavedReports(domainUuid)).reports).toEqual([]);
    const created = await domains.saveReport(domainUuid, saved.savedReportRequest as SavedSiteReportRequest);
    expect(created).toEqual(saved.savedReport);
    expect(created.report.template).toBe(SiteReportTemplate.Executive);
    const list = await domains.listSavedReports(domainUuid);
    expect(list.maxReports).toBe(SITE_SAVED_REPORTS_MAX);
    expect(list.reports[1]?.liveShares).toBe(0);
    expect((await domains.getSavedReport(domainUuid, reportUuid)).liveShares).toBe(1);
    await domains.replaceSavedReport(domainUuid, reportUuid, { name: "November client summary" });
    await expect(domains.deleteSavedReport(domainUuid, reportUuid)).resolves.toBeUndefined();

    const sent = calls();
    expect(sent.map((call) => call.route)).toEqual([
      `GET ${item}/report?template=executive&days=14`,
      `GET ${item}/saved-reports`,
      `POST ${item}/saved-reports`,
      `GET ${item}/saved-reports`,
      `GET ${item}/saved-reports/${reportUuid}`,
      `PUT ${item}/saved-reports/${reportUuid}`,
      `DELETE ${item}/saved-reports/${reportUuid}`,
    ]);
    expect(sent[2]?.body).toEqual(saved.savedReportRequest);
    expect(sent[5]?.body).toEqual({ name: "November client summary" });
  });

  it("shares a saved report and lists shares with and without one", async () => {
    const { domains, calls } = newDomains(respond(201, saved.reportShareCreated), respond(200, saved.reportShares));

    const created = await domains.createReportShare(domainUuid, saved.reportShareRequest);
    expect(created.share.reportUuid).toBe(reportUuid);
    const shares = await domains.listReportShares(domainUuid);
    expect(shares.shares[0]?.reportUuid).toBe(reportUuid);
    expect(shares.shares[1]?.reportUuid).toBeUndefined();
    expect(calls()[0]).toEqual({ route: `POST ${item}/report-shares`, body: saved.reportShareRequest });
  });

  it.each([
    [saved.savedReportNameTakenProblem, SAVED_SITE_REPORT_NAME_TAKEN_CODE],
    [saved.savedReportLimitProblem, SAVED_SITE_REPORT_LIMIT_CODE],
  ])("surfaces the recorded %s problem code", async (problem, code) => {
    const { domains } = newDomains(respond(problem.status, problem));
    const refusal = domains.saveReport(domainUuid, saved.savedReportRequest as SavedSiteReportRequest);
    await expect(refusal).rejects.toBeInstanceOf(CustdRequestError);
    await expect(refusal).rejects.toMatchObject({ status: 409, code });
  });
});
