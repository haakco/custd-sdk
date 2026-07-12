import { describe, expect, it, vi } from "vitest";
import dashboardFixture from "../../contract-fixtures/reporting-dashboard-security.json";
import requestFixture from "../../contract-fixtures/reporting-query-max-rows.json";
import trustFixture from "../../contract-fixtures/reporting-query-security-trust.json";
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
    const client = new CustdClient({ baseUrl: "http://localhost:8080", getToken: () => "token", fetch: fetchImpl });

    const dashboard = await client.reporting.dashboard("security_operations");

    expect(dashboard.key).toBe("security_operations");
    expect(dashboard.defaultRange).toBe("14d");
    expect(dashboard.refreshSeconds).toBe(300);
    expect(dashboard.requiredScopes).toEqual(["reporting:read"]);
    expect(dashboard.widgets[0]).toMatchObject({
      template: "security_events",
      metrics: ["event_count"],
      dimensions: ["severity"],
    });
    expect(fetchImpl.mock.calls[0][0]).toBe("http://localhost:8080/api/v1/reporting/dashboards/security_operations");
  });

  it("runs a reporting query and returns trust diagnostics", async () => {
    const fetchImpl = mockFetch(trustFixture);
    const client = new CustdClient({ baseUrl: "http://localhost:8080", getToken: () => "token", fetch: fetchImpl });

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
      secondaryLabel: "reviewed events",
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
      schemaVersion: "security-event/1.0.0",
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
    const client = new CustdClient({
      baseUrl: "http://localhost:8080",
      getToken: () => "token",
      fetch: mockFetch(unsafeTrustFixture),
    });

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

  it("uses the configured fetch implementation and forwards abort signals through token and reporting requests", async () => {
    const controller = new AbortController();
    const calls: Array<{ url: string; signal: AbortSignal | null | undefined }> = [];
    const fetchImpl = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), signal: init?.signal });
      if (String(url) === "https://auth.custd.test/token") {
        return Response.json({ access_token: "token", expires_in: 300 });
      }
      return Response.json(dashboardFixture);
    });
    const client = new CustdClient({
      baseUrl: "https://api.custd.test",
      oauth: {
        clientId: "client",
        clientSecret: "secret",
        tokenUrl: "https://auth.custd.test/token",
      },
      fetch: fetchImpl,
    });

    await client.reporting.dashboard("security_operations", { signal: controller.signal });

    expect(calls).toEqual([
      { url: "https://auth.custd.test/token", signal: controller.signal },
      {
        url: "https://api.custd.test/api/v1/reporting/dashboards/security_operations",
        signal: controller.signal,
      },
    ]);
  });

  it("calls an injected fetch implementation without changing its receiver", async () => {
    let receiver: unknown = "not called";
    const fetchImpl = vi.fn(function (this: unknown): Promise<Response> {
      receiver = this;
      return Promise.resolve(Response.json(dashboardFixture));
    });
    const client = new CustdClient({
      baseUrl: "https://api.custd.test",
      getToken: () => "token",
      fetch: fetchImpl,
    });

    await client.reporting.dashboard("security_operations");

    expect(receiver).toBeUndefined();
  });

  it("keeps configured fetch implementations isolated between clients", async () => {
    const firstFetch = mockFetch({ ...dashboardFixture, key: "security_operations" });
    const secondFetch = mockFetch({ ...dashboardFixture, key: "commerce_operations" });
    const firstClient = new CustdClient({
      baseUrl: "https://first.custd.test",
      getToken: () => "first-token",
      fetch: firstFetch,
    });
    const secondClient = new CustdClient({
      baseUrl: "https://second.custd.test",
      getToken: () => "second-token",
      fetch: secondFetch,
    });

    const [first, second] = await Promise.all([
      firstClient.reporting.dashboard("security_operations"),
      secondClient.reporting.dashboard("commerce_operations"),
    ]);

    expect(first.key).toBe("security_operations");
    expect(second.key).toBe("commerce_operations");
    expect(firstFetch).toHaveBeenCalledOnce();
    expect(secondFetch).toHaveBeenCalledOnce();
    expect(firstFetch.mock.calls[0][0]).toBe(
      "https://first.custd.test/api/v1/reporting/dashboards/security_operations",
    );
    expect(secondFetch.mock.calls[0][0]).toBe(
      "https://second.custd.test/api/v1/reporting/dashboards/commerce_operations",
    );
  });

  it("uses the global fetch fallback when no implementation is configured", async () => {
    const fallback = mockFetch({ ...dashboardFixture, key: "security_operations" });
    vi.stubGlobal("fetch", fallback);
    try {
      const client = new CustdClient({ baseUrl: "https://api.custd.test", getToken: () => "token" });

      const dashboard = await client.reporting.dashboard("security_operations");

      expect(dashboard.key).toBe("security_operations");
      expect(fallback).toHaveBeenCalledOnce();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("cancels in-flight OAuth token acquisition without leaving a detached request", async () => {
    const pending = abortAwareFetch();
    const controller = new AbortController();
    const client = new CustdClient({
      baseUrl: "https://api.custd.test",
      oauth: {
        clientId: "client",
        clientSecret: "secret",
        tokenUrl: "https://auth.custd.test/token",
      },
      fetch: pending.fetch,
    });

    const dashboard = client.reporting.dashboard("security_operations", { signal: controller.signal });
    await vi.waitFor(() => expect(pending.fetch).toHaveBeenCalledTimes(1));
    controller.abort();

    await expect(dashboard).rejects.toMatchObject({ name: "AbortError" });
    expect(pending.urls).toEqual(["https://auth.custd.test/token"]);
    expect(pending.activeRequests()).toBe(0);
    expect(pending.abortedRequests()).toBe(1);
    expect(pending.resolvedRequests()).toBe(0);
  });

  it("cancels in-flight dashboard and query API fetches when a token is already available", async () => {
    const pending = abortAwareFetch();
    const client = new CustdClient({
      baseUrl: "https://api.custd.test",
      getToken: () => "token",
      fetch: pending.fetch,
    });

    const dashboardController = new AbortController();
    const dashboard = client.reporting.dashboard("security_operations", { signal: dashboardController.signal });
    await vi.waitFor(() => expect(pending.fetch).toHaveBeenCalledTimes(1));
    dashboardController.abort();
    await expect(dashboard).rejects.toMatchObject({ name: "AbortError" });

    const queryController = new AbortController();
    const query = client.reporting.query(
      { template: "security_events", metrics: ["event_count"], maxRows: 25 },
      { signal: queryController.signal },
    );
    await vi.waitFor(() => expect(pending.fetch).toHaveBeenCalledTimes(2));
    queryController.abort();
    await expect(query).rejects.toMatchObject({ name: "AbortError" });

    expect(pending.urls).toEqual([
      "https://api.custd.test/api/v1/reporting/dashboards/security_operations",
      "https://api.custd.test/api/v1/reporting/query",
    ]);
    expect(pending.activeRequests()).toBe(0);
    expect(pending.abortedRequests()).toBe(2);
    expect(pending.resolvedRequests()).toBe(0);
  });
});

function abortAwareFetch() {
  let active = 0;
  let aborted = 0;
  let resolved = 0;
  const urls: string[] = [];
  const fetchImpl = vi.fn((url: string | URL | Request, init?: RequestInit): Promise<Response> => {
    urls.push(String(url));
    active += 1;

    return new Promise<Response>((_resolve, reject) => {
      const signal = init?.signal;
      const abort = () => {
        active -= 1;
        aborted += 1;
        reject(signal?.reason ?? new DOMException("The operation was aborted", "AbortError"));
      };
      if (signal?.aborted) {
        abort();
        return;
      }
      signal?.addEventListener("abort", abort, { once: true });
    }).then((response) => {
      resolved += 1;
      return response;
    });
  });

  return {
    fetch: fetchImpl,
    urls,
    activeRequests: () => active,
    abortedRequests: () => aborted,
    resolvedRequests: () => resolved,
  };
}
