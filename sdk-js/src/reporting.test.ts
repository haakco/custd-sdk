import { describe, expect, it, vi } from "vitest";
import dashboardFixture from "../../contract-fixtures/reporting-dashboard-awthy.json";
import trustFixture from "../../contract-fixtures/reporting-query-awthy-trust.json";
import unsafeTrustFixture from "../../contract-fixtures/reporting-query-unsafe-trust.json";
import { CustdClient } from "./index";

function mockFetch(body: unknown) {
  return vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  );
}

describe("reporting helpers", () => {
  it("reads a reporting dashboard", async () => {
    const fetchImpl = mockFetch(dashboardFixture);
    globalThis.fetch = fetchImpl as unknown as typeof fetch;
    const client = new CustdClient({ baseUrl: "http://localhost:8080", getToken: () => "token" });

    const dashboard = await client.reporting.dashboard("awthy_managed_audit_reporting");

    expect(dashboard.key).toBe("awthy_managed_audit_reporting");
    expect(fetchImpl.mock.calls[0][0]).toBe(
      "http://localhost:8080/api/v1/reporting/dashboards/awthy_managed_audit_reporting",
    );
  });

  it("runs a reporting query and returns trust diagnostics", async () => {
    globalThis.fetch = mockFetch(trustFixture) as unknown as typeof fetch;
    const client = new CustdClient({ baseUrl: "http://localhost:8080", getToken: () => "token" });

    const widget = await client.reporting.query({
      template: "awthy_secure_checkout_flow",
      metrics: ["flow_completion_rate"],
      from: "2026-07-06",
      to: "2026-07-06",
      maxRows: 50,
    });

    expect(widget.trust?.status).toBe("healthy");
    expect(widget.trust?.rollupState).toBe("healthy");
  });

  it("rejects unsafe reporting trust diagnostics", async () => {
    globalThis.fetch = mockFetch(unsafeTrustFixture) as unknown as typeof fetch;
    const client = new CustdClient({ baseUrl: "http://localhost:8080", getToken: () => "token" });

    await expect(
      client.reporting.query({
        template: "awthy_secure_checkout_flow",
        metrics: ["flow_completion_rate"],
        rangeDays: 1,
      }),
    ).rejects.toThrow("unsafe reporting trust diagnostics");
  });
});
