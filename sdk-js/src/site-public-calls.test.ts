import { describe, expect, it } from "vitest";
import { CustdClient, submitSiteHeartbeat } from "./index";

type Sent = { url: string; method: string; headers: Record<string, string>; body?: string };

function recorder(responses: Response[]) {
  const sent: Sent[] = [];
  const fetchImpl = (async (url: string | URL | Request, init?: RequestInit) => {
    sent.push({
      url: String(url),
      method: init?.method ?? "GET",
      headers: (init?.headers ?? {}) as Record<string, string>,
      body: init?.body as string | undefined,
    });
    const response = responses.shift();
    if (!response) throw new Error("unexpected request");
    return response;
  }) as typeof fetch;
  return { sent, fetchImpl };
}

const client = (fetchImpl: typeof fetch) =>
  new CustdClient({ baseUrl: "https://api.custd.test", getToken: () => "client-token", fetch: fetchImpl });

describe("calls without the client credential", () => {
  it("subscribes to a status page with no Authorization header", async () => {
    const { sent, fetchImpl } = recorder([new Response(null, { status: 204 })]);
    await client(fetchImpl).publicReads.subscribeToStatusPage("key-1", { email: "ops@example.com" });
    expect(sent[0]?.headers.Authorization).toBeUndefined();
    expect(sent[0]?.body).toBe(JSON.stringify({ email: "ops@example.com" }));
  });

  it("sends a heartbeat with the monitor's write token and rejects a foreign report path", async () => {
    const report = { scheduledFor: "2026-11-20T06:00:00Z", outcome: "failed" as const };
    const { sent, fetchImpl } = recorder([Response.json({ report, receivedAt: "2026-11-20T06:00:01Z" })]);
    const destination = {
      baseUrl: "https://api.custd.test",
      reportPath: "/api/v1/site-heartbeat-reports/acme/monitor-1",
      writeToken: "t".repeat(64),
      fetch: fetchImpl,
    };
    await expect(submitSiteHeartbeat(destination, report)).resolves.toMatchObject({ report });
    expect(sent[0]?.headers.Authorization).toBe(`Bearer ${"t".repeat(64)}`);
    await expect(
      submitSiteHeartbeat({ ...destination, reportPath: "/api/v1/admin/tenants/acme/monitor-1" }, report),
    ).rejects.toThrow(/report path/);
  });

  it("redeems an AI owner handoff into a session that writes with its cookie and binding", async () => {
    const { sent, fetchImpl } = recorder([
      new Response(null, { status: 303, headers: { "set-cookie": "__Host-custd-site-ai-owner=handle-1; Path=/" } }),
      Response.json({ tenantSlug: "acme", sessionBinding: "binding-1", settings: {} }),
      Response.json({ aiMode: "off" }),
    ]);
    const session = await client(fetchImpl).redeemSiteAIOwnerHandoff(
      { code: "code-1", redeemUrl: "https://api.custd.test/api/v1/site-ai-owner/redeem" },
      "https://hub.example.com",
    );
    await session.setConsent({ action: "revoke" });

    expect(sent.map((request) => `${request.method} ${new URL(request.url).pathname}`)).toEqual([
      "POST /api/v1/site-ai-owner/redeem",
      "GET /api/v1/site-ai-owner/settings",
      "PUT /api/v1/site-ai-owner/consent",
    ]);
    expect(sent[0]).toMatchObject({ body: "code=code-1", headers: { Origin: "https://hub.example.com" } });
    expect(sent[2]?.headers).toMatchObject({
      Cookie: "__Host-custd-site-ai-owner=handle-1",
      Origin: "https://api.custd.test",
      "X-Custd-Site-AI-Session": "binding-1",
    });
    expect(sent.every((request) => request.headers.Authorization === undefined)).toBe(true);
  });
});
