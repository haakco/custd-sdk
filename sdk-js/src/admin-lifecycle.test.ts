import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminWorkflowError, CustdClient, CustdRequestError } from "./index";
import { OFFBOARDING_REQUEST_UUID, offboardingBodies, offboardingReceipt } from "./offboarding-bodies.test-helper";

const BASE_URL = "http://localhost:8080/";

/** The maximal server example for one operation, from contract-fixtures/api/examples. */
function apiExample(operationId: string): Record<string, unknown> & Record<"id" | "requestUuid", string> {
  const url = new URL(`../../contract-fixtures/api/examples/${operationId}.json`, import.meta.url);
  return (
    JSON.parse(readFileSync(url, "utf8")) as { maximal: Record<string, unknown> & Record<"id" | "requestUuid", string> }
  ).maximal;
}

type RecordedCall = { url: string; method: string; body: unknown };

/** A fetch that answers each call with the next queued JSON response and records what was sent. */
function sequenceFetch(responses: Array<{ status: number; body: unknown }>) {
  const calls: RecordedCall[] = [];
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const next = responses[calls.length];
    calls.push({
      url: String(input),
      method: init?.method ?? "GET",
      body: typeof init?.body === "string" && init.body.length > 0 ? JSON.parse(init.body) : undefined,
    });
    if (!next) throw new Error("unexpected request");
    return new Response(JSON.stringify(next.body), {
      status: next.status,
      headers: { "Content-Type": "application/json" },
    });
  });
  return { fetchMock: fetchMock as unknown as typeof fetch, calls };
}

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

describe("SubjectExportClient", () => {
  it("create sends the server body and decodes the export status; force returns the same shape", async () => {
    const createBody = apiExample("createSubjectExport");
    const forceBody = { ...apiExample("forceSubjectExport"), state: "running", perStoreProgress: null };
    const { fetchMock, calls } = sequenceFetch([
      { status: 201, body: createBody },
      { status: 202, body: forceBody },
    ]);
    const client = new CustdClient({ baseUrl: BASE_URL, getToken: () => "admin-token", fetch: fetchMock });

    const created = await client.admin.subjectExports.create({
      opaqueSubjectId: "subject-01J5K7N4Y8X9Z2B6V3D1M0Q7RJ",
      scope: "portability",
      idempotencyKey: "export-acme-2026-07-31",
    });
    expect(created.id).toBe(createBody.id);
    expect(created.perStoreProgress[0]?.retainedExceptions).toBe(1);
    expect(calls[0]).toEqual({
      url: "http://localhost:8080/api/v1/admin/subject-exports",
      method: "POST",
      body: {
        opaqueSubjectId: "subject-01J5K7N4Y8X9Z2B6V3D1M0Q7RJ",
        scope: "portability",
        idempotencyKey: "export-acme-2026-07-31",
      },
    });

    const forced = await client.admin.subjectExports.force("se-1");
    expect(forced.state).toBe("running");
    expect(forced.perStoreProgress).toEqual([]);
    expect(calls[1]?.url).toBe("http://localhost:8080/api/v1/admin/subject-exports/se-1/force");
  });

  it("download asks for one artifact scope and returns its integrity metadata", async () => {
    const body = apiExample("downloadSubjectExport");
    const { fetchMock, calls } = sequenceFetch([{ status: 200, body }]);
    const client = new CustdClient({ baseUrl: BASE_URL, getToken: () => "admin-token", fetch: fetchMock });

    const artifact = await client.admin.subjectExports.download("se-1", "access");

    expect(artifact.checksumSha256).toBe(body.checksumSha256);
    expect(artifact.byteSize).toBe(body.byteSize);
    expect(calls[0]?.url).toBe("http://localhost:8080/api/v1/admin/subject-exports/se-1/download?scope=access");
  });

  // The server has no dedicated problem for an expired artifact yet: it answers with its internal problem.
  it("an expired download surfaces the server's problem without retrying", async () => {
    const problem = {
      type: "internal",
      title: "Internal Server Error",
      status: 500,
      detail: "An internal error occurred.",
      retryability: "none",
      nextAction: { action: "escalate" },
    };
    const { fetchMock } = sequenceFetch([{ status: 500, body: problem }]);
    const client = new CustdClient({ baseUrl: BASE_URL, getToken: () => "admin-token", fetch: fetchMock });

    const refusal = client.admin.subjectExports.download("se-1", "portability");

    await expect(refusal).rejects.toBeInstanceOf(CustdRequestError);
    await expect(refusal).rejects.toMatchObject({ status: 500, retryability: "none" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("PrivacyErasureClient", () => {
  it("create + get decode the erasure read model", async () => {
    const created = apiExample("createPrivacyErasure");
    const read = apiExample("getPrivacyErasure");
    const { fetchMock, calls } = sequenceFetch([
      { status: 202, body: created },
      { status: 200, body: { ...read, status: "s3_reflected" } },
    ]);
    const client = new CustdClient({ baseUrl: BASE_URL, getToken: () => "admin-token", fetch: fetchMock });

    const request = await client.admin.privacyErasures.create({
      companySlug: "acme",
      selector: { type: "userUuid", values: ["user-1", "user-2"] },
      reason: "gdpr_erasure_request",
      redactionId: "sdk-erasure-proof",
    });
    expect(request.requestUuid).toBe(created.requestUuid);
    expect(request.matchedEventCount).toBe(1);
    expect(calls[0]?.body).toMatchObject({ selector: { type: "userUuid", values: ["user-1", "user-2"] } });

    const got = await client.admin.privacyErasures.get("acme", "pe-1");
    expect(got.status).toBe("s3_reflected");
    expect(got.slaState).toBe(read.slaState);
    expect(calls[1]?.url).toBe("http://localhost:8080/api/v1/admin/privacy/erasures/pe-1?companySlug=acme");
  });

  it("another tenant's erasure is refused as not found", async () => {
    const problem = {
      type: "not_found",
      title: "Not Found",
      status: 404,
      detail: "privacy erasure not found",
      retryability: "none",
      nextAction: { action: "none" },
    };
    const { fetchMock } = sequenceFetch([{ status: 404, body: problem }]);
    const client = new CustdClient({ baseUrl: BASE_URL, getToken: () => "admin-token", fetch: fetchMock });

    await expect(client.admin.privacyErasures.get("other-tenant", "pe-1")).rejects.toMatchObject({
      code: "get_request_failed",
      retryable: false,
    });
  });
});

describe("RetentionClient", () => {
  it("preview/apply/listRuns surface server-computed counts and run state", async () => {
    const preview = {
      perStore: [
        {
          store: "raw",
          retentionClass: "raw",
          candidateCount: 142,
          estimatedAffected: 142,
          sampleSubjects: null,
          legalHoldCount: 0,
        },
        {
          store: "archive",
          retentionClass: "archive",
          candidateCount: 0,
          estimatedAffected: 0,
          sampleSubjects: [],
          legalHoldCount: 1,
        },
      ],
      lastResult: "preview",
      safeNextAction: "apply",
      startedAt: "2026-07-31T08:00:00Z",
      completedAt: "2026-07-31T08:00:01Z",
    };
    const applied = { ...preview, lastResult: "applied", lastAffectedCounts: { raw: 142 }, safeNextAction: "none" };
    const runs = {
      runs: [
        {
          startAt: "2026-07-30T00:00:00Z",
          endAt: "2026-07-31T00:00:00Z",
          lastResult: "applied",
          lastAffectedCounts: { raw: 172 },
        },
      ],
      nextOffset: 1,
      hasMore: true,
    };
    const { fetchMock, calls } = sequenceFetch([
      { status: 200, body: preview },
      { status: 200, body: applied },
      { status: 200, body: runs },
    ]);
    const client = new CustdClient({ baseUrl: BASE_URL, getToken: () => "admin-token", fetch: fetchMock });

    const previewed = await client.admin.retention.preview("acme");
    expect(previewed.perStore[0]?.estimatedAffected).toBe(142);
    expect(previewed.perStore[0]?.sampleSubjects).toEqual([]);
    // A legal hold blocks its whole class: the server reports it, and the SDK keeps it verbatim.
    expect(previewed.perStore[1]).toMatchObject({ retentionClass: "archive", legalHoldCount: 1, estimatedAffected: 0 });
    expect(calls[0]).toMatchObject({
      url: "http://localhost:8080/api/v1/admin/retention/policies/acme/preview",
      method: "POST",
    });

    const result = await client.admin.retention.apply("acme");
    expect(result.lastAffectedCounts).toEqual({ raw: 142 });

    const page = await client.admin.retention.listRuns("acme", { limit: 1, offset: 0 });
    expect(page.runs[0]?.lastAffectedCounts.raw).toBe(172);
    expect(page.hasMore).toBe(true);
    expect(calls[2]?.url).toBe("http://localhost:8080/api/v1/admin/retention/policies/acme/runs?limit=1&offset=0");
  });

  it("a legal hold upsert surfaces the server refusal without retry", async () => {
    const problem = {
      type: "conflict",
      title: "Conflict",
      status: 409,
      detail: "retention: legal hold conflict",
      retryability: "none",
      nextAction: { action: "none" },
    };
    const { fetchMock } = sequenceFetch([{ status: 409, body: problem }]);
    const client = new CustdClient({ baseUrl: BASE_URL, getToken: () => "admin-token", fetch: fetchMock });

    await expect(
      client.admin.retention.upsert("acme", {
        scope: "tenant",
        retentionClass: "raw",
        maxAgeSeconds: 86_400,
        precedence: 100,
        legalHold: true,
        legalHoldUntil: "2027-01-01T00:00:00Z",
        legalHoldReference: "case-1",
      }),
    ).rejects.toThrow(/legal hold conflict/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("OffboardingClient", () => {
  it("full lifecycle decodes request, preview, export, download, acknowledge, execute, receipt", async () => {
    const downloadFixture = offboardingBodies.download;
    const downloadBytes = downloadFixture.bytes;
    const sequence = [
      offboardingBodies.created,
      offboardingBodies.preview,
      offboardingBodies.export,
      undefined,
      offboardingBodies.acknowledged,
      offboardingBodies.receipt,
      offboardingBodies.receipt,
    ];
    const calls: Array<{
      url: string;
      method: string;
      body: unknown;
      authorization: string | null;
      idempotencyKey: string | null;
    }> = [];
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";
      let parsed: unknown;
      if (typeof init?.body === "string" && init.body.length > 0) {
        parsed = JSON.parse(init.body);
      }
      calls.push({
        url,
        method,
        body: parsed,
        authorization: new Headers(init?.headers).get("Authorization"),
        idempotencyKey: new Headers(init?.headers).get("Idempotency-Key"),
      });
      if (calls.length === 4) {
        return new Response(downloadBytes, {
          status: 200,
          headers: {
            "Content-Length": String(downloadFixture.byteSize),
            "X-Checksum-SHA256": downloadFixture.checksumSha256,
          },
        });
      }
      const body = sequence[calls.length - 1];
      const status = calls.length === 1 ? 201 : 200;
      return new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    }) as unknown as typeof fetch;
    const client = new CustdClient({ baseUrl: BASE_URL, getToken: () => "admin-token" });

    const created = await client.admin.offboarding.requestOffboarding(
      { confirmation: "acme" },
      { idempotencyKey: "tiao-offboarding-proof-1" },
    );
    expect(created.requestUuid).toBe(OFFBOARDING_REQUEST_UUID);
    expect(calls[0].url).toBe("http://localhost:8080/api/v1/admin/offboarding");
    expect(calls[0].method).toBe("POST");
    expect(calls[0].idempotencyKey).toBe("tiao-offboarding-proof-1");

    const preview = await client.admin.offboarding.preview(OFFBOARDING_REQUEST_UUID);
    expect(preview.previewInventoryDigest).not.toBe("");
    expect(preview.stores).toHaveLength(3);
    expect(preview.stores[0]?.retentionClass).toBe("operational");
    expect(calls[1].url).toBe(
      "http://localhost:8080/api/v1/admin/offboarding/requests/ob_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ/preview",
    );

    const exportReceipt = await client.admin.offboarding.export(OFFBOARDING_REQUEST_UUID);
    expect(exportReceipt.recordCount).toBe(1357);
    expect(exportReceipt.checksumSha256).not.toBe("");

    const download = await client.admin.offboarding.download(OFFBOARDING_REQUEST_UUID);
    expect(download.bytes).toEqual(downloadBytes);
    expect(download.checksumSha256).toBe(downloadFixture.checksumSha256);
    expect(download.byteSize).toBe(downloadFixture.byteSize);
    expect(calls[3].authorization).toBe("Bearer admin-token");

    const ack = await client.admin.offboarding.acknowledge(OFFBOARDING_REQUEST_UUID);
    expect(ack.state).toBe("requested");

    const exec = await client.admin.offboarding.execute(OFFBOARDING_REQUEST_UUID);
    expect(exec.finalState).toBe("complete");
    expect(calls[5].body).toBeUndefined();

    const receipt = await client.admin.offboarding.receipt(OFFBOARDING_REQUEST_UUID);
    expect(receipt.finalState).toBe("complete");
    expect(receipt.requestedByKind).toBe("human");
    expect(receipt.waiver).toEqual({ role: "client_owner", timestamp: "2026-07-31T09:04:00Z" });
    expect(receipt.sha256).not.toBe("");
    expect(receipt.perStore).toHaveLength(3);
    for (const row of receipt.perStore) {
      expect(row.store).not.toBe("");
      expect(row.retentionClass).not.toBe("");
    }
  });

  it("decodes a machine-requested receipt", async () => {
    const { fetchMock } = bootstrapFetch(200, offboardingReceipt("machine"));
    globalThis.fetch = fetchMock;
    const client = new CustdClient({ baseUrl: BASE_URL, getToken: () => "admin-token" });

    const receipt = await client.admin.offboarding.receipt(OFFBOARDING_REQUEST_UUID);

    expect(receipt.requestedByKind).toBe("machine");
  });

  it.each([
    ["missing checksum", { "Content-Length": "3" }],
    ["wrong checksum", { "Content-Length": "3", "X-Checksum-SHA256": "0".repeat(64) }],
    ["length mismatch", { "Content-Length": "2", "X-Checksum-SHA256": "0".repeat(64) }],
    ["declared oversize", { "Content-Length": String(64 * 1024 * 1024 + 1), "X-Checksum-SHA256": "0".repeat(64) }],
  ])("download rejects %s", async (_name, headers) => {
    globalThis.fetch = vi.fn(
      async () => new Response(new Uint8Array([1, 2, 3]), { status: 200, headers }),
    ) as unknown as typeof fetch;
    const client = new CustdClient({ baseUrl: BASE_URL, getToken: () => "admin-token" });
    await expect(client.admin.offboarding.download("request-1")).rejects.toThrow(/offboarding download/);
  });

  it("streams the bundle with the response metadata and errors a body that ends short", async () => {
    const checksum = "a".repeat(64);
    const respond = (length: string) =>
      new Response(new Uint8Array([1, 2, 3]), {
        status: 200,
        headers: {
          "Content-Length": length,
          "Content-Type": "application/octet-stream",
          "X-Checksum-SHA256": checksum,
          "X-Request-Id": "req-download",
        },
      });
    let length = "3";
    globalThis.fetch = vi.fn(async () => respond(length)) as unknown as typeof fetch;
    const client = new CustdClient({ baseUrl: BASE_URL, getToken: () => "admin-token" });

    const stream = await client.admin.offboarding.downloadStream("request-1");
    expect(stream).toMatchObject({
      byteSize: 3,
      checksumSha256: checksum,
      contentType: "application/octet-stream",
      requestId: "req-download",
    });
    expect(new Uint8Array(await new Response(stream.body).arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));

    length = "4";
    const short = await client.admin.offboarding.downloadStream("request-1");
    await expect(new Response(short.body).arrayBuffer()).rejects.toThrow(/content length mismatch/);
  });

  it("confirmRequest surfaces the erasure-incomplete safeNextAction guidance", async () => {
    // OffboardingWorkflowConflictResponse: the workflow guidance a refused transition carries.
    const body = {
      error:
        "Cannot confirm destructive offboarding while a related erasure request is not in terminal complete state.",
      code: "erasure_incomplete",
      safe_next_action: "retry_erasure",
    };
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
      await client.admin.offboarding.confirmRequest(OFFBOARDING_REQUEST_UUID);
    } catch (err) {
      error = err as Error;
    }
    expect(error).toBeDefined();
    expect(error?.message).toContain("retry_erasure");
    expect(error).toBeInstanceOf(AdminWorkflowError);
    expect((error as AdminWorkflowError).code).toBe("erasure_incomplete");
    expect((error as AdminWorkflowError).safeNextAction).toBe("retry_erasure");
  });
});
