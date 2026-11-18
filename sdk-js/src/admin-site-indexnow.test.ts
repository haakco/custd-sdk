import { describe, expect, it, vi } from "vitest";
import indexNow from "../../contract-fixtures/site-indexnow.json";
import recorded from "../../contract-fixtures/site-insights.json";
import {
  CustdClient,
  CustdRequestError,
  IndexNowSubmissionStatus,
  SITE_INDEXNOW_DOMAIN_UNVERIFIED_CODE,
  SITE_INDEXNOW_KEY_UNVERIFIED_CODE,
  SITE_INDEXNOW_LIMIT_CODE,
  SITE_INDEXNOW_NOT_ENABLED_CODE,
  SITE_INDEXNOW_URLS_INVALID_CODE,
} from "./index";

const domainUuid = recorded.domain.domainUuid;
const item = `http://localhost:8080/api/v1/site-domains/${domainUuid}/indexnow`;

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
      return { route: `${request.method} ${String(url)}`, body: request.body ?? undefined };
    });
  return { domains: client.admin.siteDomains, calls };
}

describe("site IndexNow", () => {
  it("sends every IndexNow route and decodes the recorded states", async () => {
    const { domains, calls } = newDomains(
      respond(200, indexNow.disabled),
      respond(200, indexNow.enabledUnverified),
      respond(200, indexNow.verified),
      respond(202, indexNow.submissionQueued),
      respond(204),
    );

    const disabled = await domains.getIndexNow(domainUuid);
    expect(disabled.key).toBeUndefined();
    expect(disabled.verifiedAt).toBeUndefined();
    expect(disabled.submissions).toEqual([]);
    const enabled = await domains.enableIndexNow(domainUuid);
    expect(enabled.keyLocation).toBe(indexNow.enabledUnverified.keyLocation);
    expect(enabled.lastCheckFailure).toBe("the key file answered HTTP 404");
    const verified = await domains.verifyIndexNowKey(domainUuid);
    expect(verified).toEqual(indexNow.verified);
    expect(verified.lastCheckFailure).toBeUndefined();
    expect(verified.submissions[0]?.providerStatus).toBeUndefined();
    expect(verified.submissions[0]?.submittedAt).toBeUndefined();
    expect(verified.submissions[1]?.status).toBe(IndexNowSubmissionStatus.Accepted);
    expect(verified.submissions[1]?.providerStatus).toBe(202);
    const queued = await domains.submitIndexNow(domainUuid, indexNow.submissionRequest);
    expect(queued.status).toBe(IndexNowSubmissionStatus.Queued);
    expect(queued.submittedAt).toBeUndefined();
    await expect(domains.disableIndexNow(domainUuid)).resolves.toBeUndefined();

    const sent = calls();
    expect(sent.map((call) => call.route)).toEqual([
      `GET ${item}`,
      `PUT ${item}`,
      `POST ${item}/verify`,
      `POST ${item}/submissions`,
      `DELETE ${item}`,
    ]);
    expect(sent[1]?.body).toBeUndefined();
    expect(sent[2]?.body).toBeUndefined();
    expect(JSON.parse(String(sent[3]?.body))).toEqual(indexNow.submissionRequest);
  });

  it.each([
    [indexNow.domainUnverifiedProblem, SITE_INDEXNOW_DOMAIN_UNVERIFIED_CODE],
    [indexNow.notEnabledProblem, SITE_INDEXNOW_NOT_ENABLED_CODE],
    [indexNow.keyUnverifiedProblem, SITE_INDEXNOW_KEY_UNVERIFIED_CODE],
    [indexNow.urlsInvalidProblem, SITE_INDEXNOW_URLS_INVALID_CODE],
    [indexNow.limitProblem, SITE_INDEXNOW_LIMIT_CODE],
  ])("surfaces the recorded %s problem code", async (problem, code) => {
    const { domains } = newDomains(respond(problem.status, problem));
    const refusal = domains.submitIndexNow(domainUuid, indexNow.submissionRequest);
    await expect(refusal).rejects.toBeInstanceOf(CustdRequestError);
    await expect(refusal).rejects.toMatchObject({ status: problem.status, code });
  });
});
