import { describe, expect, it, vi } from "vitest";
import logs from "../../contract-fixtures/site-access-logs.json";
import {
  ACCESS_LOG_HOUR_INVALID_CODE,
  AccessLogHourStatus,
  CustdClient,
  CustdRequestError,
  SiteCrawlerIdentity,
  SiteReferrerClass,
  SiteTrafficDayCoverage,
  TRAFFIC_OTHER_KEY,
} from "./index";

const domainUuid = logs.traffic.domainUuid;
const item = `http://localhost:8080/api/v1/site-domains/${domainUuid}`;
const replay = "http://localhost:8080/api/v1/admin/access-log-hours/replay";

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

describe("site access-log traffic", () => {
  it("reads traffic and AI visibility keeping unread days apart from a present 0", async () => {
    const { domains, calls } = newDomains(
      respond(200, logs.traffic),
      respond(200, logs.trafficEmpty),
      respond(200, logs.aiVisibility),
    );

    const traffic = await domains.getTraffic(domainUuid, "2026-11-15", "2026-11-16");
    expect(traffic).toEqual(logs.traffic);
    expect(traffic.days[0]?.coverage).toBe(SiteTrafficDayCoverage.Missing);
    expect(traffic.days[0]?.notFound).toBeUndefined();
    expect(traffic.days[1]?.notFound).toBe(0);
    expect(traffic.notFoundPaths[1]?.key).toBe(TRAFFIC_OTHER_KEY);
    expect(traffic.referrers[1]?.class).toBe(SiteReferrerClass.AI);
    expect(traffic.crawlers[1]?.identity).toBe(SiteCrawlerIdentity.ClaimsToBe);
    const empty = await domains.getTraffic(domainUuid);
    expect(empty.totals).toBeUndefined();
    const ai = await domains.getAIVisibility(domainUuid, "2026-11-15");
    expect(ai).toEqual(logs.aiVisibility);
    expect(ai.crawlers[1]?.notFound).toBe(0);

    expect(calls().map((call) => call.route)).toEqual([
      `GET ${item}/traffic?from=2026-11-15&to=2026-11-16`,
      `GET ${item}/traffic`,
      `GET ${item}/ai-visibility?from=2026-11-15`,
    ]);
  });

  it("replays one hour from a Date or a string as RFC 3339 UTC seconds", async () => {
    const { domains, calls } = newDomains(
      respond(202, logs.accessLogHourReplay),
      respond(202, logs.accessLogHourReplay),
    );

    const replayed = await domains.replayAccessLogHour(new Date(Date.UTC(2026, 10, 17, 10)));
    expect(replayed.previousStatus).toBe(AccessLogHourStatus.Failed);
    await domains.replayAccessLogHour(logs.accessLogHourReplayRequest.hourStart);

    expect(calls()).toEqual([
      { route: `POST ${replay}`, body: logs.accessLogHourReplayRequest },
      { route: `POST ${replay}`, body: logs.accessLogHourReplayRequest },
    ]);
  });

  it("surfaces the recorded hour-invalid problem code", async () => {
    const problem = logs.accessLogHourInvalidProblem;
    const { domains } = newDomains(respond(problem.status, problem));
    const refusal = domains.replayAccessLogHour("2026-11-17T10:30:00Z");
    await expect(refusal).rejects.toBeInstanceOf(CustdRequestError);
    await expect(refusal).rejects.toMatchObject({ status: 400, code: ACCESS_LOG_HOUR_INVALID_CODE });
  });
});
