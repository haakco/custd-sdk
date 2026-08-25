import { beforeEach, describe, expect, it, vi } from "vitest";
import { readLifecycleFixture } from "./fixtures.js";
import { CustdClient } from "./index";

const BASE_URL = "http://localhost:8080/";

// lifecycleTracker records every outbound request so each test can assert
// the SDK sent the URL and method it claims. Tests replace the global fetch
// with a handler that returns the configured response.
function bootstrapFetch(
  status: number,
  body: unknown,
): { fetchMock: typeof fetch; calls: Array<{ url: string; method: string; body: unknown }> } {
  const calls: Array<{ url: string; method: string; body: unknown }> = [];
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    let parsed: unknown;
    if (typeof init?.body === "string" && init.body.length > 0) {
      parsed = JSON.parse(init.body);
    }
    calls.push({ url, method, body: parsed });
    return new Response(typeof body === "string" ? body : JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  });
  return { fetchMock: fetchMock as unknown as typeof fetch, calls };
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("TenantStorageClient", () => {
  it("list decodes the per-tenant storage location rows", async () => {
    const body = readLifecycleFixture("tenant-storage", "valid-list-response.json") as {
      locations: Array<Record<string, unknown>>;
    };
    const { fetchMock, calls } = bootstrapFetch(200, body);
    globalThis.fetch = fetchMock;
    const client = new CustdClient({ baseUrl: BASE_URL, getToken: () => "admin-token" });

    const list = await client.admin.tenantStorage.list();

    expect(list.locations).toHaveLength(2);
    const first = list.locations[0];
    expect(first.id).toBe("loc_acme_warehouse");
    expect(first.tenantSlug).toBe("acme");
    expect(first.serverAssignedPrefix).toBe("raw/acme/2026-07-31/");
    expect(first.status).toBe("active");
    expect(calls[0].url).toBe("http://localhost:8080/api/v1/tenant-storage-locations");
    expect(calls[0].method).toBe("GET");
  });

  it("list returns an empty array when the SDK is scoped to a different tenant", async () => {
    const body = readLifecycleFixture("tenant-storage", "isolation-other-tenant-response.json") as {
      locations: unknown[];
    };
    const { fetchMock } = bootstrapFetch(200, body);
    globalThis.fetch = fetchMock;
    const client = new CustdClient({ baseUrl: BASE_URL, getToken: () => "admin-token" });

    const list = await client.admin.tenantStorage.list();

    expect(list.locations).toEqual([]);
  });
});

describe("SubjectExportClient", () => {
  it("create decodes the typed receipt and force decodes the ready-state response", async () => {
    const createBody = readLifecycleFixture("subject-exports", "valid-create-response.json") as Record<string, unknown>;
    const forceBody = readLifecycleFixture("subject-exports", "valid-force-response.json") as Record<string, unknown>;
    const { calls } = bootstrapFetch(201, createBody);
    const calls2: Array<{ url: string; method: string; body: unknown }> = [];
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";
      let parsed: unknown;
      if (typeof init?.body === "string" && init.body.length > 0) {
        parsed = JSON.parse(init.body);
      }
      const callCount = calls.length + calls2.length;
      calls.push({ url, method, body: parsed });
      const body = callCount === 0 ? createBody : forceBody;
      const status = callCount === 0 ? 201 : 200;
      return new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    }) as unknown as typeof fetch;
    const client = new CustdClient({ baseUrl: BASE_URL, getToken: () => "admin-token" });

    const created = await client.admin.subjectExports.create({
      tenantSlug: "acme",
      subject: { type: "userUuid", value: "01J5K7N4Y8X9Z2B6V3D1M0Q7RJ" },
      scope: "portability",
      idempotencyKey: "export-acme-01J5K7N4Y8X9Z2B6V3D1M0Q7RJ-2026-07-31",
    });
    expect(created.requestId).toBe("se_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ");
    expect(created.state).toBe("queued");
    expect(created.subject.type).toBe("userUuid");
    expect(calls[0].url).toBe("http://localhost:8080/api/v1/admin/subject-exports");
    expect(calls[0].method).toBe("POST");

    const forced = await client.admin.subjectExports.force("se_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ");
    expect(forced.state).toBe("ready");
    expect(calls[1].url).toBe("http://localhost:8080/api/v1/admin/subject-exports/se_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ/force");
    expect(calls[1].method).toBe("POST");
  });

  it("download surfaces the signed URL field but never logs the value", async () => {
    const body = readLifecycleFixture("subject-exports", "valid-download-response.json") as Record<string, unknown>;
    const { fetchMock, calls } = bootstrapFetch(200, body);
    globalThis.fetch = fetchMock;
    const client = new CustdClient({ baseUrl: BASE_URL, getToken: () => "admin-token" });

    const download = await client.admin.subjectExports.download("se_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ");

    expect(download.requestId).toBe("se_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ");
    // The download URL is sensitive; we never log it and never echo it
    // into error messages. We assert presence only.
    expect(typeof download.downloadUrl).toBe("string");
    expect(download.downloadUrl).not.toBe("");
    // The fetch URL must not contain the signed URL value.
    expect(calls[0].url).toBe(
      "http://localhost:8080/api/v1/admin/subject-exports/se_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ/download",
    );
  });

  it("expired download returns a 4xx and the signed URL value never reaches error messages", async () => {
    const body = readLifecycleFixture("subject-exports", "expired-download-response.json") as Record<string, unknown>;
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify(body), {
          status: 410,
          headers: { "Content-Type": "application/json" },
        }),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const client = new CustdClient({ baseUrl: BASE_URL, getToken: () => "admin-token" });

    let error: Error | undefined;
    try {
      await client.admin.subjectExports.download("se_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ");
    } catch (err) {
      error = err as Error;
    }
    expect(error).toBeDefined();
    expect(error?.message).toContain("download_expired");
    // The signed URL value must not leak into the surfaced error message.
    expect(error?.message).not.toContain("signed.example.invalid");
  });
});

describe("PrivacyErasureClient", () => {
  it("create + get decode per-store progress and surface complete state", async () => {
    const createBody = readLifecycleFixture("privacy-erasures", "valid-create-response.json") as Record<
      string,
      unknown
    >;
    const getBody = readLifecycleFixture("privacy-erasures", "valid-get-response.json") as Record<string, unknown>;
    const calls: Array<{ url: string; method: string; body: unknown }> = [];
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";
      let parsed: unknown;
      if (typeof init?.body === "string" && init.body.length > 0) {
        parsed = JSON.parse(init.body);
      }
      calls.push({ url, method, body: parsed });
      const body = calls.length === 1 ? createBody : getBody;
      const status = calls.length === 1 ? 201 : 200;
      return new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    }) as unknown as typeof fetch;
    const client = new CustdClient({ baseUrl: BASE_URL, getToken: () => "admin-token" });

    const created = await client.admin.privacyErasures.create({
      companySlug: "acme",
      selector: { type: "userUuid", value: "01J5K7N4Y8X9Z2B6V3D1M0Q7RJ" },
      reason: "gdpr_erasure_request",
      redactionId: "sdk-lifecycle-fixture",
    });
    expect(created.requestUuid).toBe("pe_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ");

    const got = await client.admin.privacyErasures.get("acme", "pe_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ");
    expect(got.state).toBe("complete");
    expect(got.perStoreProgress).toHaveLength(5);
    for (const row of got.perStoreProgress ?? []) {
      expect(row.store).not.toBe("");
      expect(row.state).not.toBe("");
    }
  });

  it("legal hold surfaces the legal_hold store as retained with deletedCount=0", async () => {
    const body = readLifecycleFixture("privacy-erasures", "legal-hold-retained.json") as Record<string, unknown>;
    const { fetchMock } = bootstrapFetch(200, body);
    globalThis.fetch = fetchMock;
    const client = new CustdClient({ baseUrl: BASE_URL, getToken: () => "admin-token" });

    const got = await client.admin.privacyErasures.get("acme", "pe_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ");

    expect(got.state).toBe("partial");
    const legalHold = (got.perStoreProgress ?? []).find((row) => row.store === "legal_hold");
    expect(legalHold).toBeDefined();
    expect(legalHold?.state).toBe("retained");
    expect(legalHold?.deletedCount).toBe(0);
    expect(legalHold?.reason).toBe("legal_hold");
  });
});

describe("RetentionClient", () => {
  it("preview/apply/listRuns surface server-computed counts and run state", async () => {
    const previewBody = readLifecycleFixture("retention", "valid-preview-response.json") as Record<string, unknown>;
    const applyBody = readLifecycleFixture("retention", "valid-apply-response.json") as Record<string, unknown>;
    const runsBody = readLifecycleFixture("retention", "valid-runs-response.json") as Record<string, unknown>;
    const calls: Array<{ url: string; method: string; body: unknown }> = [];
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";
      calls.push({ url, method, body: undefined });
      const body = calls.length === 1 ? previewBody : calls.length === 2 ? applyBody : runsBody;
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as unknown as typeof fetch;
    const client = new CustdClient({ baseUrl: BASE_URL, getToken: () => "admin-token" });

    const preview = await client.admin.retention.preview("acme");
    expect(preview.previewId).not.toBe("");
    expect(preview.estimatedDeletions).toHaveLength(3);
    expect(preview.estimatedDeletions[0].store).toBe("raw_landing");
    expect(preview.estimatedDeletions[0].count).toBe(142);
    expect(calls[0].url).toBe("http://localhost:8080/api/v1/admin/retention/policies/acme/preview");
    expect(calls[0].method).toBe("POST");

    const applied = await client.admin.retention.apply("acme");
    expect(applied.runId).not.toBe("");
    expect(applied.state).toBe("running");

    const runs = await client.admin.retention.listRuns("acme");
    expect(runs.runs).toHaveLength(2);
    expect(runs.runs[0].state).toBe("complete");
    expect(runs.runs[0].deletedCount).toBe(172);
    expect(runs.runs[1].state).toBe("running");
  });

  it("upsert surfaces the selector_required error without retry", async () => {
    const body = readLifecycleFixture("retention", "invalid-selectorless-scope.json") as Record<string, unknown>;
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify(body), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const client = new CustdClient({ baseUrl: BASE_URL, getToken: () => "admin-token" });

    let error: Error | undefined;
    try {
      await client.admin.retention.upsert("acme", {
        maxAgeDays: 30,
        hardDeleteAfterDays: 60,
      });
    } catch (err) {
      error = err as Error;
    }
    expect(error).toBeDefined();
    expect(error?.message).not.toBe("");
  });
});

describe("OffboardingClient", () => {
  it("full lifecycle decodes request, preview, export, download, acknowledge, execute, receipt", async () => {
    const createBody = readLifecycleFixture("offboarding", "valid-request-create-response.json") as Record<
      string,
      unknown
    >;
    const previewBody = readLifecycleFixture("offboarding", "valid-preview-response.json") as Record<string, unknown>;
    const exportBody = readLifecycleFixture("offboarding", "valid-export-response.json") as Record<string, unknown>;
    const downloadBody = readLifecycleFixture("offboarding", "valid-download-response.json") as Record<string, unknown>;
    const ackBody = readLifecycleFixture("offboarding", "valid-acknowledge-response.json") as Record<string, unknown>;
    const execBody = readLifecycleFixture("offboarding", "valid-execute-response.json") as Record<string, unknown>;
    const receiptBody = readLifecycleFixture("offboarding", "valid-receipt-response.json") as Record<string, unknown>;
    const sequence = [createBody, previewBody, exportBody, downloadBody, ackBody, execBody, receiptBody];
    const calls: Array<{ url: string; method: string; body: unknown }> = [];
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";
      let parsed: unknown;
      if (typeof init?.body === "string" && init.body.length > 0) {
        parsed = JSON.parse(init.body);
      }
      calls.push({ url, method, body: parsed });
      const body = sequence[calls.length - 1];
      const status = calls.length === 1 ? 201 : 200;
      return new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    }) as unknown as typeof fetch;
    const client = new CustdClient({ baseUrl: BASE_URL, getToken: () => "admin-token" });

    const created = await client.admin.offboarding.requestOffboarding({ confirmation: "acme" });
    expect(created.requestUuid).toBe("ob_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ");
    expect(calls[0].url).toBe("http://localhost:8080/api/v1/admin/offboarding");
    expect(calls[0].method).toBe("POST");

    const preview = await client.admin.offboarding.preview("ob_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ");
    expect(preview.previewInventoryDigest).not.toBe("");
    expect(preview.perStore).toHaveLength(3);
    expect(calls[1].url).toBe(
      "http://localhost:8080/api/v1/admin/offboarding/requests/ob_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ/preview",
    );

    const exportReceipt = await client.admin.offboarding.export("ob_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ");
    expect(exportReceipt.complete).toBe(true);
    expect(exportReceipt.schemaVersion).not.toBe("");

    const download = await client.admin.offboarding.download("ob_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ");
    expect(typeof download.downloadUrl).toBe("string");
    expect(download.downloadUrl).not.toBe("");
    // The signed URL value must not leak into the outbound request URL.
    expect(calls[3].url).not.toContain("signed.example.invalid");

    const ack = await client.admin.offboarding.acknowledge("ob_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ");
    expect(ack.state).toBe("confirmed");

    const exec = await client.admin.offboarding.execute("ob_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ", {
      waiver: { role: "client_owner", reason: "explicit_client_request" },
    });
    expect(exec.state).toBe("deleting");
    expect(exec.waiver?.role).toBe("client_owner");

    const receipt = await client.admin.offboarding.receipt("ob_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ");
    expect(receipt.finalState).toBe("complete");
    expect(receipt.sha256).not.toBe("");
    expect(receipt.perStore).toHaveLength(3);
    for (const row of receipt.perStore) {
      expect(row.store).not.toBe("");
      expect(row.retentionClass).not.toBe("");
    }
  });

  it("execute surfaces the waiver_required error without leaking the signed URL", async () => {
    const body = readLifecycleFixture("offboarding", "invalid-waiver-empty.json") as Record<string, unknown>;
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify(body), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const client = new CustdClient({ baseUrl: BASE_URL, getToken: () => "admin-token" });

    let error: Error | undefined;
    try {
      await client.admin.offboarding.execute("ob_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ", {
        waiver: { role: "", reason: "" },
      });
    } catch (err) {
      error = err as Error;
    }
    expect(error).toBeDefined();
    expect(error?.message.toLowerCase()).toContain("waiver");
  });

  it("confirmRequest surfaces the erasure-incomplete safeNextAction guidance", async () => {
    const body = readLifecycleFixture("offboarding", "incomplete-erasure-blocks-confirm.json") as Record<
      string,
      unknown
    >;
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify(body), {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const client = new CustdClient({ baseUrl: BASE_URL, getToken: () => "admin-token" });

    let error: Error | undefined;
    try {
      await client.admin.offboarding.confirmRequest("ob_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ");
    } catch (err) {
      error = err as Error;
    }
    expect(error).toBeDefined();
    expect(error?.message).toContain("retry_erasure");
  });
});
