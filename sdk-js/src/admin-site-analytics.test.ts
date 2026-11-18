import { describe, expect, it, vi } from "vitest";
import analytics from "../../contract-fixtures/site-analytics.json";
import {
  CustdClient,
  CustdRequestError,
  SITE_ANALYTICS_CONNECTION_NOT_FOUND_CODE,
  SITE_ANALYTICS_PROPERTY_INVALID_CODE,
  SITE_ANALYTICS_PROVIDER_GA4,
  SiteAnalyticsUnavailableReport,
} from "./index";

const domainUuid = analytics.report.domainUuid;
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

describe("site GA4 analytics", () => {
  it("reads the report and connects and disconnects GA4", async () => {
    const { domains, calls } = newClient(
      respond(200, analytics.report),
      respond(200, analytics.connectionPending),
      respond(204),
    );

    const report = await domains.getAnalytics(domainUuid);
    expect(report).toEqual(analytics.report);
    expect(report.connection?.provider).toBe(SITE_ANALYTICS_PROVIDER_GA4);
    expect(report.landingPages[1]?.keyEvents).toBeUndefined();
    expect(report.unavailable[0]?.report).toBe(SiteAnalyticsUnavailableReport.Ecommerce);
    const connection = await domains.connectAnalytics(domainUuid, analytics.connectionRequest);
    expect(connection).toEqual(analytics.connectionPending);
    expect(connection.lastImportedAt).toBeUndefined();
    await expect(domains.disconnectAnalytics(domainUuid)).resolves.toBeUndefined();

    const sent = calls();
    expect(sent.map((call) => call.route)).toEqual([
      `GET ${item}/analytics`,
      `PUT ${item}/analytics/ga4`,
      `DELETE ${item}/analytics/ga4`,
    ]);
    expect(sent[1]?.body).toEqual(analytics.connectionRequest);
  });

  it("decodes a report without key events or a connection", async () => {
    const { domains } = newClient(
      respond(200, analytics.reportNoKeyEvents),
      respond(200, analytics.reportNotConnected),
    );

    const noKeyEvents = await domains.getAnalytics(domainUuid);
    expect(noKeyEvents.keyEventsRecorded).toBe(false);
    expect(noKeyEvents.landingPages[0]).not.toHaveProperty("keyEvents");
    const notConnected = await domains.getAnalytics(domainUuid);
    expect(notConnected.connection).toBeUndefined();
    expect(notConnected.windowFrom).toBeUndefined();
    expect(notConnected.windowTo).toBeUndefined();
    expect(notConnected.landingPages).toEqual([]);
  });

  it.each([
    [analytics.propertyInvalidProblem, SITE_ANALYTICS_PROPERTY_INVALID_CODE],
    [analytics.connectionNotFoundProblem, SITE_ANALYTICS_CONNECTION_NOT_FOUND_CODE],
  ])("surfaces the recorded %s problem code", async (problem, code) => {
    const { domains } = newClient(respond(problem.status, problem));
    const refusal = domains.connectAnalytics(domainUuid, { propertyId: "x" });
    await expect(refusal).rejects.toBeInstanceOf(CustdRequestError);
    await expect(refusal).rejects.toMatchObject({ status: problem.status, code });
  });
});
