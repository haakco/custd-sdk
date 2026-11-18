import { expect, it, vi } from "vitest";
import { CustdClient } from "./index.js";

it("uses the AI settings, consent, tenant and platform routes", async () => {
  const fetchImpl = vi.fn((url: string, init: RequestInit) => Promise.resolve(Response.json({ url, body: init.body })));
  const { admin } = new CustdClient({
    baseUrl: "http://localhost:8080",
    getToken: () => "admin-token",
    fetch: fetchImpl as unknown as typeof fetch,
  });
  const settings = { aiMode: "own-key", monthlyCapUsdMicros: 10_000_000, apiKey: "test-only-key" } as const;
  const consent = { action: "grant", termsVersion: "test-v1" } as const;
  const response = await admin.siteDomains.getAISettings();
  expect(response).toEqual({ url: "http://localhost:8080/api/v1/site-domains/ai-settings" });
  await admin.siteDomains.setAISettings(settings);
  await admin.siteDomains.setAIConsent(consent);
  await admin.siteDomains.getAIUsage();
  await admin.siteInsights.getAIUsage("day");
  expect(
    fetchImpl.mock.calls.map(([url, init]) => [new URL(url).pathname + new URL(url).search, init.method, init.body]),
  ).toEqual([
    ["/api/v1/site-domains/ai-settings", "GET", undefined],
    ["/api/v1/site-domains/ai-settings", "PUT", JSON.stringify(settings)],
    ["/api/v1/site-domains/ai-settings/consent", "PUT", JSON.stringify(consent)],
    ["/api/v1/site-domains/ai-usage", "GET", undefined],
    ["/api/v1/admin/site-insights/ai-usage?period=day", "GET", undefined],
  ]);
});
