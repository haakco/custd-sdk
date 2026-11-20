import { readFileSync } from "node:fs";
import { expect, it, vi } from "vitest";
import { CustdClient, type SiteAIOwnerHandoff, type SiteAIOwnerHandoffRequest, type SiteAIProduct } from "./index.js";

it("uses the AI settings, consent, tenant and platform routes", async () => {
  const fixture = JSON.parse(readFileSync(new URL("../../contract-fixtures/site-ai.json", import.meta.url), "utf8"));
  const fetchImpl = vi.fn((url: string, init: RequestInit) => {
    const pathname = new URL(url).pathname;
    let reply = fixture.settings;
    if (pathname.endsWith("/ai-usage")) {
      reply = pathname.startsWith("/api/v1/admin/") ? fixture.platformUsage : fixture.tenantUsage;
    } else if (init.body === JSON.stringify({ action: "revoke" })) {
      reply = fixture.revoked;
    }
    return Promise.resolve(Response.json(reply));
  });
  const { admin } = new CustdClient({
    baseUrl: "http://localhost:8080",
    getToken: () => "admin-token",
    fetch: fetchImpl as unknown as typeof fetch,
  });
  const settings = { aiMode: "own-key", monthlyCapUsdMicros: 10_000_000, apiKey: "test-only-key" } as const;
  const consent = { action: "grant", termsVersion: "terms-v1" } as const;
  const response = await admin.siteDomains.getAISettings();
  expect(response.keyRefused).toBe(true);
  await admin.siteDomains.setAISettings(settings);
  await admin.siteDomains.setAIConsent(consent);
  const revoked = await admin.siteDomains.setAIConsent({ action: "revoke" });
  expect(revoked.keyRefused).toBeUndefined();
  const tenant = await admin.siteDomains.getAIUsage();
  expect(tenant.rows[0].samplingProduct).toBeUndefined();
  const platform = await admin.siteInsights.getAIUsage("previous-month");
  const product: SiteAIProduct | undefined = platform.rows[0].samplingProduct;
  expect(product).toBe("hosting");
  expect(platform.period).toBe("previous-month");
  expect(
    fetchImpl.mock.calls.map(([url, init]) => [new URL(url).pathname + new URL(url).search, init.method, init.body]),
  ).toEqual([
    ["/api/v1/site-domains/ai-settings", "GET", undefined],
    ["/api/v1/site-domains/ai-settings", "PUT", JSON.stringify(settings)],
    ["/api/v1/site-domains/ai-settings/consent", "PUT", JSON.stringify(consent)],
    ["/api/v1/site-domains/ai-settings/consent", "PUT", JSON.stringify({ action: "revoke" })],
    ["/api/v1/site-domains/ai-usage", "GET", undefined],
    ["/api/v1/admin/site-insights/ai-usage?period=previous-month", "GET", undefined],
  ]);
});

it("creates an AI owner handoff through the site-domain API", async () => {
  const request: SiteAIOwnerHandoffRequest = { tenantSlug: "example-tenant", ownerSubject: "example-owner" };
  const handoff: SiteAIOwnerHandoff = {
    code: "test-code",
    redeemUrl: "https://custd.example/api/v1/site-ai-owner/redeem",
  };
  const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(Response.json(handoff));
  const client = new CustdClient({
    baseUrl: "https://custd.example",
    getToken: () => "broker-token",
    fetch: fetchImpl,
  });
  const { signal } = new AbortController();

  await expect(client.admin.siteDomains.createAIOwnerHandoff(request, { signal })).resolves.toEqual(handoff);
  expect(fetchImpl).toHaveBeenCalledExactlyOnceWith(
    "https://custd.example/api/v1/site-domains/ai-owner-handoffs",
    expect.objectContaining({ method: "POST", body: JSON.stringify(request), signal }),
  );
});
