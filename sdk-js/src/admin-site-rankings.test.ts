import { describe, expect, it, vi } from "vitest";
import ranks from "../../contract-fixtures/site-rankings.json";
import {
  CustdClient,
  CustdRequestError,
  SITE_RANKINGS_DAYS_INVALID_CODE,
  SITE_TRACKED_KEYWORD_ALL,
  SITE_TRACKED_KEYWORD_DUPLICATE_CODE,
  SITE_TRACKED_KEYWORD_INVALID_CODE,
  SITE_TRACKED_KEYWORD_LIMIT_CODE,
  SITE_TRACKED_KEYWORD_NOT_FOUND_CODE,
  SITE_TRACKED_KEYWORDS_MAX,
  SiteRankingsSource,
  SiteRankState,
  SiteTrackedKeywordStatus,
} from "./index";

const domainUuid = "8f14e45f-ceea-4e7b-9a37-2f1c5e0b7a11";
const keywordUuid = ranks.updatedTrackedKeyword.keywordUuid;
const item = `http://localhost:8080/api/v1/site-domains/${domainUuid}/rankings`;

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

describe("site rank tracking", () => {
  it("reads rankings and tracks, updates and untracks keywords", async () => {
    const { domains, calls } = newDomains(
      respond(200, ranks.rankings),
      respond(200, ranks.rankingsNotConnected),
      respond(200, ranks.rankingsFailing),
      respond(201, ranks.trackedKeyword),
      respond(200, ranks.updatedTrackedKeyword),
      respond(204),
    );

    const rankings = await domains.getRankings(domainUuid, 3);
    expect(rankings).toEqual(ranks.rankings);
    expect(rankings.maxKeywords).toBe(SITE_TRACKED_KEYWORDS_MAX);
    const [notRanking, ranking] = rankings.keywords[0]?.observations.slice(1) ?? [];
    expect(notRanking?.state).toBe(SiteRankState.NotRanking);
    expect(notRanking?.position).toBeUndefined();
    expect(ranking?.position).toBe(7.4);
    expect(rankings.keywords[1]?.status).toBe(SiteTrackedKeywordStatus.Paused);
    expect(rankings.keywords[1]?.device).toBe(SITE_TRACKED_KEYWORD_ALL);
    expect((await domains.getRankings(domainUuid)).source).toBe(SiteRankingsSource.NotConnected);
    expect((await domains.getRankings(domainUuid)).sourceFailure).toBe("Search Console refused the token");
    const tracked = await domains.trackKeyword(domainUuid, ranks.trackKeywordRequest);
    expect(tracked.latest.state).toBe(SiteRankState.NoData);
    const updated = await domains.updateTrackedKeyword(domainUuid, keywordUuid, ranks.updateTrackedKeywordRequest);
    expect(updated.notifyPosition).toBe(5);
    await expect(domains.untrackKeyword(domainUuid, keywordUuid)).resolves.toBeUndefined();

    const sent = calls();
    expect(sent.map((call) => call.route)).toEqual([
      `GET ${item}?days=3`,
      `GET ${item}`,
      `GET ${item}`,
      `POST ${item}/keywords`,
      `PUT ${item}/keywords/${keywordUuid}`,
      `DELETE ${item}/keywords/${keywordUuid}`,
    ]);
    expect(sent[3]?.body).toEqual(ranks.trackKeywordRequest);
    expect(sent[4]?.body).toEqual(ranks.updateTrackedKeywordRequest);
  });

  it("pauses a keyword without sending an alert position", async () => {
    const { domains, calls } = newDomains(respond(200, ranks.updatedTrackedKeyword));
    await domains.updateTrackedKeyword(domainUuid, keywordUuid, { paused: true });
    expect(calls()[0]?.body).toEqual(ranks.updateTrackedKeywordPauseRequest);
  });

  it.each([
    [ranks.trackedKeywordInvalidProblem, SITE_TRACKED_KEYWORD_INVALID_CODE],
    [ranks.trackedKeywordLimitProblem, SITE_TRACKED_KEYWORD_LIMIT_CODE],
    [ranks.trackedKeywordDuplicateProblem, SITE_TRACKED_KEYWORD_DUPLICATE_CODE],
    [ranks.trackedKeywordNotFoundProblem, SITE_TRACKED_KEYWORD_NOT_FOUND_CODE],
    [ranks.rankingsDaysInvalidProblem, SITE_RANKINGS_DAYS_INVALID_CODE],
  ])("surfaces the recorded %s problem code", async (problem, code) => {
    const { domains } = newDomains(respond(problem.status, problem));
    const refusal = domains.trackKeyword(domainUuid, { keyword: "pricing tool" });
    await expect(refusal).rejects.toBeInstanceOf(CustdRequestError);
    await expect(refusal).rejects.toMatchObject({ status: problem.status, code });
  });
});
