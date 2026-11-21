import { describe, expect, it, vi } from "vitest";
import { APP_REASON_CODES, APP_STATUSES, type AppCreation, type AppSummary } from "./admin-apps";
import { CustdClient } from "./index";

const appsUrl = "http://localhost:8080/api/v1/admin/apps";
const owningUserUuid = "01957abc-0000-7000-8000-0000000000aa";

const summary: AppSummary = {
  appId: "p1",
  slug: "done-when",
  name: "Done When",
  environmentId: "e1",
  host: "done-when.apps.example",
  url: "https://done-when.apps.example",
  status: APP_STATUSES.needsAttention,
  reason: { code: APP_REASON_CODES.signInNotReady, message: "m" },
  signIn: true,
};

function clientAnswering(body: unknown, status = 200) {
  const fetchImpl = vi
    .fn()
    .mockImplementation(async () =>
      status === 204
        ? new Response(null, { status })
        : new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } }),
    );
  const client = new CustdClient({
    baseUrl: "http://localhost:8080",
    getToken: () => "admin-token",
    fetch: fetchImpl as unknown as typeof fetch,
  });
  return { apps: client.admin.authProjects, fetchImpl };
}

function sent(fetchImpl: ReturnType<typeof vi.fn>) {
  const [url, init] = fetchImpl.mock.calls[0] ?? [];
  const request = init as RequestInit;
  return {
    line: `${request.method} ${String(url)}`,
    headers: request.headers as Record<string, string>,
    body: request.body,
  };
}

describe("apps", () => {
  it("creates an app with its Idempotency-Key and reads the receipt", async () => {
    const receipt: AppCreation = { app: summary, replayed: false, trafficReporting: "ready" };
    const { apps, fetchImpl } = clientAnswering(receipt);

    const created = await apps.createApp(
      { name: "Done When", signIn: true },
      { owningUserUuid, idempotencyKey: "k-create-1" },
    );

    const request = sent(fetchImpl);
    expect(created).toEqual(receipt);
    expect(request.line).toBe(`POST ${appsUrl}`);
    expect(request.body).toBe(JSON.stringify({ name: "Done When", signIn: true }));
    expect(request.headers["Idempotency-Key"]).toBe("k-create-1");
    expect(request.headers["X-Custd-Owning-User-UUID"]).toBe(owningUserUuid);
  });

  it("refuses a create without an Idempotency-Key before sending", async () => {
    const { apps, fetchImpl } = clientAnswering({});
    await expect(apps.createApp({ name: "Done When" })).rejects.toThrow(/idempotency key/);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("lists, reads and manages deploy credentials on the app routes", async () => {
    const cases = [
      { call: (c: Apps) => c.listApps(), line: `GET ${appsUrl}` },
      { call: (c: Apps) => c.listApps("p0"), line: `GET ${appsUrl}?after=p0` },
      { call: (c: Apps) => c.getApp("done when"), line: `GET ${appsUrl}/done%20when` },
      {
        call: (c: Apps) => c.createAppDeployCredential("done-when"),
        line: `POST ${appsUrl}/done-when/deploy-credentials`,
      },
      {
        call: (c: Apps) => c.deleteAppDeployCredential("done-when", "app-deploy-1"),
        line: `DELETE ${appsUrl}/done-when/deploy-credentials/app-deploy-1`,
        status: 204,
      },
    ];
    for (const testCase of cases) {
      const { apps, fetchImpl } = clientAnswering({ apps: [summary] }, testCase.status);
      await testCase.call(apps);
      expect(sent(fetchImpl).line).toBe(testCase.line);
    }
  });
});

type Apps = CustdClient["admin"]["authProjects"];
