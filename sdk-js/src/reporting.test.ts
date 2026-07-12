import { describe, expect, it, vi } from "vitest";
import dashboardFixture from "../../contract-fixtures/reporting-dashboard-awthy.json";
import trustFixture from "../../contract-fixtures/reporting-query-awthy-trust.json";
import requestFixture from "../../contract-fixtures/reporting-query-max-rows.json";
import unsafeTrustFixture from "../../contract-fixtures/reporting-query-unsafe-trust.json";
import { CustdClient, type ReportingQueryRequest } from "./index";

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
    expect(dashboard.defaultRange).toBe("14d");
    expect(dashboard.refreshSeconds).toBe(300);
    expect(dashboard.requiredScopes).toEqual(["reporting:read"]);
    expect(dashboard.widgets[0]).toMatchObject({
      template: "awthy_secure_checkout_flow",
      metrics: ["flow_completion_rate"],
      dimensions: ["flow_step"],
    });
    expect(fetchImpl.mock.calls[0][0]).toBe(
      "http://localhost:8080/api/v1/reporting/dashboards/awthy_managed_audit_reporting",
    );
  });

  it("runs a reporting query and returns trust diagnostics", async () => {
    const fetchImpl = mockFetch(trustFixture);
    globalThis.fetch = fetchImpl as unknown as typeof fetch;
    const client = new CustdClient({ baseUrl: "http://localhost:8080", getToken: () => "token" });

    const request: ReportingQueryRequest = requestFixture;
    const widget = await client.reporting.query(request);

    expect(widget).toMatchObject({
      count: 2,
      complete: true,
      truncated: false,
      queryDurationMs: 42,
      parquetUriCount: 1,
      snapshotAgeMs: 120000,
      eventLagP95Ms: 8000,
      deltaCount: 1,
      deltaPercent: 100,
      deltaLabel: "vs previous period",
      secondaryLabel: "completed checkouts",
    });
    expect(widget.buckets[0]).toMatchObject({
      source: "auto",
      complete: true,
      queryDurationMs: 42,
      parquetUriCount: 1,
    });
    expect(widget.trust).toMatchObject({
      status: "healthy",
      rollupState: "healthy",
      schemaVersion: "awthy-audit-event/1.0.0",
      coverage: "complete",
      permissionClass: "reporting.read",
      queryWarnings: [],
    });
    const requestBody = JSON.parse(fetchImpl.mock.calls[0][1]?.body as string) as Record<string, unknown>;
    expect(requestBody).toEqual(requestFixture);
    expect(requestBody.maxRows).toBe(50);
    expect(requestBody).not.toHaveProperty("rowLimit");
  });

  it("rejects unsafe reporting trust diagnostics", async () => {
    globalThis.fetch = mockFetch(unsafeTrustFixture) as unknown as typeof fetch;
    const client = new CustdClient({ baseUrl: "http://localhost:8080", getToken: () => "token" });

    let thrown: unknown;
    try {
      await client.reporting.query({
        template: "awthy_secure_checkout_flow",
        metrics: ["flow_completion_rate"],
        rangeDays: 1,
      });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(Error);
    const message = (thrown as Error).message;
    expect(message).toBe("custd: unsafe reporting trust diagnostics");
    for (const unsafeValue of [
      "customer@example.test",
      "unknown",
      "failed",
      "none",
      "not_enough_data",
      "enabled",
      "present",
    ]) {
      expect(message).not.toContain(unsafeValue);
    }
  });
});
