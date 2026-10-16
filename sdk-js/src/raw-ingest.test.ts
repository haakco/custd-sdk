import { describe, expect, it, vi } from "vitest";
import { CustdClient, CustdRawAcceptanceUnknownError, createRawIngestRequest } from "./index";

const PARSER_UUID = "11111111-1111-1111-1111-111111111111";

function mockFetch(body: unknown, status = 202) {
  return vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    }),
  );
}

function client(fetchImpl: ReturnType<typeof mockFetch>) {
  return new CustdClient({ baseUrl: "http://localhost:8080", getToken: () => "token", fetch: fetchImpl });
}

describe("raw line ingest", () => {
  it("posts the raw body to the raw endpoint with the parser binding", async () => {
    const fetchImpl = mockFetch({ success: true, processed: 2, failed: 0 });
    const result = await client(fetchImpl).ingestRawLines({
      content: "first line\nsecond line\n",
      parserUuid: PARSER_UUID,
    });

    const [url, init] = fetchImpl.mock.calls[0] ?? [];
    expect(String(url)).toBe("http://localhost:8080/api/v1/raw");
    expect(init?.method).toBe("POST");
    const headers = init?.headers as Record<string, string>;
    expect(headers["X-Parser-UUID"]).toBe(PARSER_UUID);
    expect(headers["Content-Type"]).toBe("text/plain; charset=utf-8");
    expect(init?.body).toBe("first line\nsecond line\n");
    // A 202 alone is not success: the body carries the per-record counts.
    expect(result).toEqual({ success: true, processed: 2, failed: 0 });
  });

  it("appends the paired subClient/resource query params", async () => {
    const fetchImpl = mockFetch({ success: true, processed: 3, failed: 1 });
    const result = await client(fetchImpl).ingestRawLines({
      content: "line\n",
      parserUuid: PARSER_UUID,
      target: { subClient: "acme-store", resource: "srv-01" },
    });

    const url = new URL(String(fetchImpl.mock.calls[0]?.[0]));
    expect(url.searchParams.get("subClient")).toBe("acme-store");
    expect(url.searchParams.get("resource")).toBe("srv-01");
    // A partial failure is surfaced, not swallowed by the 202 status.
    expect(result.failed).toBe(1);
  });

  it("rejects a missing/malformed parser and a partial or malformed target without sending", async () => {
    const cases = [
      { content: "x", parserUuid: "not-a-uuid" },
      { content: "x", parserUuid: "" },
      { content: "x", parserUuid: PARSER_UUID, target: { subClient: "acme-store" } },
      { content: "x", parserUuid: PARSER_UUID, target: { subClient: "bad code", resource: "srv-01" } },
    ];
    for (const request of cases) {
      const fetchImpl = mockFetch({ success: true, processed: 0, failed: 0 });
      await expect(
        client(fetchImpl).ingestRawLines(request as unknown as Parameters<CustdClient["ingestRawLines"]>[0]),
      ).rejects.toThrow(RangeError);
      expect(fetchImpl).not.toHaveBeenCalled();
    }
  });
});

describe("raw line ingest acceptance", () => {
  const request = { content: "line\n", parserUuid: PARSER_UUID };

  it("rejects malformed acceptance bodies as unknown acceptance", async () => {
    const bodies: Record<string, unknown> = {
      null: null,
      "empty object": {},
      "missing failed": { success: true, processed: 2 },
      "missing processed": { success: true, failed: 0 },
      "missing success": { processed: 2, failed: 0 },
      "null failed": { success: true, processed: 2, failed: null },
      "wrong success type": { success: "yes", processed: 2, failed: 0 },
      "wrong processed type": { success: true, processed: "2", failed: 0 },
      "negative processed": { success: true, processed: -1, failed: 0 },
      "negative failed": { success: true, processed: 2, failed: -1 },
      "fractional processed": { success: true, processed: 2.5, failed: 0 },
    };
    for (const [name, body] of Object.entries(bodies)) {
      const fetchImpl = mockFetch(body);
      await expect(client(fetchImpl).ingestRawLines(request), name).rejects.toBeInstanceOf(
        CustdRawAcceptanceUnknownError,
      );
    }
  });

  it("preserves legitimate partial counts", async () => {
    const fetchImpl = mockFetch({ success: true, processed: 3, failed: 1 });
    const result = await client(fetchImpl).ingestRawLines(request);
    expect(result).toEqual({ success: true, processed: 3, failed: 1 });
  });

  it("classifies a transport failure as unknown acceptance with no retry guidance", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError("connection reset"));
    const error = await client(fetchImpl)
      .ingestRawLines(request)
      .catch((thrown: unknown) => thrown);
    expect(error).toBeInstanceOf(CustdRawAcceptanceUnknownError);
    const typed = error as CustdRawAcceptanceUnknownError;
    expect(typed.retryability).toBe("none");
    expect(typed.nextAction.action).not.toBe("retry");
  });

  it("classifies a retryable status as unknown acceptance", async () => {
    const fetchImpl = mockFetch({ title: "unavailable", status: 503 }, 503);
    await expect(client(fetchImpl).ingestRawLines(request)).rejects.toBeInstanceOf(CustdRawAcceptanceUnknownError);
  });

  it("keeps a non-retryable status a definite rejection", async () => {
    const fetchImpl = mockFetch({ title: "invalid", status: 400 }, 400);
    const error = await client(fetchImpl)
      .ingestRawLines(request)
      .catch((thrown: unknown) => thrown);
    expect(error).not.toBeInstanceOf(CustdRawAcceptanceUnknownError);
  });
});

describe("raw idempotency key", () => {
  const keyRequest = createRawIngestRequest({ content: "line\n", parserUuid: PARSER_UUID });

  it("mints one key and retains it across a resend of the same request object", async () => {
    const fetchImpl = vi.fn().mockImplementation(
      async () =>
        new Response(JSON.stringify({ success: true, processed: 1, failed: 0 }), {
          status: 202,
          headers: { "content-type": "application/json" },
        }),
    );
    const target = client(fetchImpl);
    await target.ingestRawLines(keyRequest);
    await target.ingestRawLines(keyRequest);

    const first = (fetchImpl.mock.calls[0]?.[1]?.headers as Record<string, string>)["Idempotency-Key"];
    const second = (fetchImpl.mock.calls[1]?.[1]?.headers as Record<string, string>)["Idempotency-Key"];
    expect(first).toBe(keyRequest.idempotencyKey);
    expect(first).toBe(second);
    expect(first).toMatch(/^\d+:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it("mints a fresh key for a new request object even for identical text", () => {
    const other = createRawIngestRequest({ content: "line\n", parserUuid: PARSER_UUID });
    expect(other.idempotencyKey).not.toBe(keyRequest.idempotencyKey);
  });

  it("sends no key when the request does not carry one", async () => {
    const fetchImpl = mockFetch({ success: true, processed: 1, failed: 0 });
    await client(fetchImpl).ingestRawLines({ content: "line\n", parserUuid: PARSER_UUID });
    expect(fetchImpl.mock.calls[0]?.[1]?.headers as Record<string, string>).not.toHaveProperty("Idempotency-Key");
  });

  it("keeps a conflict and an expiry a definite rejection", async () => {
    for (const status of [409, 400]) {
      const fetchImpl = mockFetch({ title: "idempotency conflict", status }, status);
      const error = await client(fetchImpl)
        .ingestRawLines(keyRequest)
        .catch((thrown: unknown) => thrown);
      expect(error).not.toBeInstanceOf(CustdRawAcceptanceUnknownError);
    }
  });

  it("surfaces the operation key on unknown acceptance", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError("connection reset"));
    const error = await client(fetchImpl)
      .ingestRawLines(keyRequest)
      .catch((thrown: unknown) => thrown);
    expect(error).toBeInstanceOf(CustdRawAcceptanceUnknownError);
    expect((error as CustdRawAcceptanceUnknownError).operationKey).toBe(keyRequest.idempotencyKey);
  });
});
