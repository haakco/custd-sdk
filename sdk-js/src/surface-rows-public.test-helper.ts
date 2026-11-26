// Calls that carry no Custd client credential: a public status page and its subscriptions, a
// monitor's own reports, and the AI settings session a data-space owner opens from a handoff.
import {
  CustdClient,
  getPrivateUptimeWork,
  type SiteAIOwnerSession,
  submitPrivateUptime,
  submitSiteHeartbeat,
} from "./index";
import type { Clients, RowArea } from "./surface-conformance.test-helper";

const token = { token: "token-1" };
const scheduledFor = "2026-11-20T06:00:00Z";

function monitor(c: Clients, prefix: string) {
  return {
    baseUrl: "http://localhost:8080",
    reportPath: `${prefix}acme/monitor-1`,
    writeToken: "a".repeat(64),
    fetch: c.fetch,
  };
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

const redeemed = () =>
  new Response(null, {
    status: 303,
    headers: { location: "/site-ai-owner", "set-cookie": "__Host-custd-site-ai-owner=handle-1; Path=/; Secure" },
  });
const handoff = { code: "code-1", redeemUrl: "http://localhost:8080/api/v1/site-ai-owner/redeem" };

/**
 * An owner session opened outside the recording, so the row records only its own call. A bound session
 * has also read its write binding, so a write sends one recorded request.
 */
function ownerSession(c: Clients, bound: boolean): Promise<SiteAIOwnerSession> {
  const unrecorded = [redeemed, ...(bound ? [() => json({ sessionBinding: "binding-1" })] : [])];
  const fetchImpl = (async (url: string | URL | Request, init?: RequestInit) =>
    unrecorded.shift()?.() ?? c.fetch(url, init)) as typeof fetch;
  const client = new CustdClient({ baseUrl: "http://localhost:8080", getToken: () => "unused", fetch: fetchImpl });
  return client.redeemSiteAIOwnerHandoff(handoff, "https://hub.example.com");
}

export const publicRows: RowArea = {
  rows: [
    {
      id: "admin-api GET /api/v1/public-status-pages/{key}",
      params: { key: "key-1" },
      call: (c) => c.custd.publicReads.statusPage("key-1"),
    },
    {
      id: "admin-api POST /api/v1/public-status-pages/{key}/subscribe",
      params: { key: "key-1" },
      call: (c) => c.custd.publicReads.subscribeToStatusPage("key-1", { email: "ops@example.com" }),
      response: () => new Response(null, { status: 204 }),
    },
    {
      id: "admin-api POST /api/v1/public-status-pages/{key}/confirm-subscription",
      params: { key: "key-1" },
      call: (c) => c.custd.publicReads.confirmStatusPageSubscription("key-1", token),
      response: () => new Response(null, { status: 204 }),
    },
    {
      id: "admin-api POST /api/v1/public-status-pages/{key}/unsubscribe",
      params: { key: "key-1" },
      call: (c) => c.custd.publicReads.unsubscribeFromStatusPage("key-1", token),
      response: () => new Response(null, { status: 204 }),
    },
    {
      id: "admin-api POST /api/v1/site-heartbeat-reports/{companySlug}/{monitorUuid}",
      params: { companySlug: "acme", monitorUuid: "monitor-1" },
      call: (c) =>
        submitSiteHeartbeat(monitor(c, "/api/v1/site-heartbeat-reports/"), { scheduledFor, outcome: "succeeded" }),
      response: () => json({ report: { scheduledFor, outcome: "succeeded" }, receivedAt: scheduledFor }),
    },
    {
      id: "admin-api POST /api/v1/site-private-uptime-reports/{companySlug}/{monitorUuid}",
      params: { companySlug: "acme", monitorUuid: "monitor-1" },
      call: (c) =>
        submitPrivateUptime(monitor(c, "/api/v1/site-private-uptime-reports/"), {
          reportUuid: "report-1",
          observedAt: scheduledFor,
          statusCode: 200,
          responseMs: 40,
        }),
      response: () => new Response(null, { status: 204 }),
    },
    {
      id: "admin-api GET /api/v1/site-private-uptime-reports/{companySlug}/{monitorUuid}",
      params: { companySlug: "acme", monitorUuid: "monitor-1" },
      call: (c) => getPrivateUptimeWork(monitor(c, "/api/v1/site-private-uptime-reports/")),
      response: () => json({ requestedAt: scheduledFor }),
    },
    {
      id: "admin-api POST /api/v1/site-domains/ai-owner-handoffs",
      call: (c) => c.custd.admin.siteDomains.createAIOwnerHandoff({ tenantSlug: "acme", ownerSubject: "owner-1" }),
    },
    {
      id: "admin-api POST /api/v1/site-ai-owner/redeem",
      call: (c) => c.custd.redeemSiteAIOwnerHandoff(handoff, "https://hub.example.com"),
      response: redeemed,
    },
    {
      id: "admin-api GET /api/v1/site-ai-owner/settings",
      call: async (c) => (await ownerSession(c, false)).getSettings(),
      response: () => json({ tenantSlug: "acme", sessionBinding: "binding-1", settings: {} }),
    },
    {
      id: "admin-api PUT /api/v1/site-ai-owner/settings",
      call: async (c) => (await ownerSession(c, true)).setSettings({ aiMode: "off", monthlyCapUsdMicros: 0 }),
    },
    {
      id: "admin-api PUT /api/v1/site-ai-owner/consent",
      call: async (c) => (await ownerSession(c, true)).setConsent({ action: "revoke" }),
    },
  ],
  decoded: ["admin-api POST /api/v1/site-domains/ai-owner-handoffs"],
};
