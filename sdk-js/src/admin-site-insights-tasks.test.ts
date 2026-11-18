import { describe, expect, it, vi } from "vitest";
import tasks from "../../contract-fixtures/site-insights-tasks.json";
import { CustdClient, CustdRequestError, SITE_SEARCH_RETRY_NOT_FAILING_CODE, SiteInsightsTaskName } from "./index";

const domainUuid = "8b6f0c2e-4a1d-4f3b-9c7e-2d5a6b8c9e01";

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

describe("site insights tasks and search import retry", () => {
  it("reads the operator task list on the admin route and retries a failing import", async () => {
    const { admin, domains, calls } = newClient(respond(200, tasks.tasks), respond(200, tasks.searchConnectionRetried));

    const list = await admin.siteInsights.listTasks();
    expect(list).toEqual(tasks.tasks);
    expect(list.tasks[0]?.taskName).toBe(SiteInsightsTaskName.SiteChecks);
    expect(list.tasks[2]?.registered).toBe(false);
    expect(list.tasks[2]?.nextRunAt).toBeUndefined();
    expect(list.tasks[2]?.lastRunStatus).toBeUndefined();
    const retried = await domains.retrySearchImport(domainUuid, "google", { companySlug: "shop" });
    expect(retried).toEqual(tasks.searchConnectionRetried);

    const sent = calls();
    expect(sent.map((call) => call.route)).toEqual([
      "GET http://localhost:8080/api/v1/admin/site-insights/tasks",
      `POST http://localhost:8080/api/v1/site-domains/${domainUuid}/search/google/retry?companySlug=shop`,
    ]);
    expect(sent[1]?.body).toBeUndefined();
  });

  it("surfaces the recorded retry-not-failing problem code", async () => {
    const problem = tasks.retryNotFailingProblem;
    const { domains } = newClient(respond(problem.status, problem));
    const refusal = domains.retrySearchImport(domainUuid, "bing");
    await expect(refusal).rejects.toBeInstanceOf(CustdRequestError);
    await expect(refusal).rejects.toMatchObject({ status: 409, code: SITE_SEARCH_RETRY_NOT_FAILING_CODE });
  });
});
