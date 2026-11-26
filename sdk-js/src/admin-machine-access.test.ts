import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  AdminWorkflowError,
  CustdClient,
  CustdRequestError,
  MACHINE_ACCESS_PROBLEM_CODES,
  type ResponseMetadata,
} from "./index";

const BASE_URL = "http://localhost:8080";

function fixture(name: string): unknown {
  return JSON.parse(readFileSync(new URL(`../../contract-fixtures/${name}`, import.meta.url), "utf8"));
}

function answer(status: number, body: unknown, headers: Record<string, string> = {}): typeof fetch {
  return (async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json", ...headers },
    })) as typeof fetch;
}

function client(fetchImpl: typeof fetch): CustdClient {
  return new CustdClient({ baseUrl: BASE_URL, getToken: () => "admin-token", fetch: fetchImpl });
}

async function refusal(promise: Promise<unknown>): Promise<CustdRequestError> {
  const error = await promise.catch((caught: unknown) => caught);
  if (!(error instanceof CustdRequestError)) throw new Error(`want CustdRequestError, got ${String(error)}`);
  return error;
}

describe("machine access refusals", () => {
  it("a blocked machine learns which setting stopped it and the request to quote", async () => {
    const body = fixture("machine-access-blocked-problem.json");
    const custd = client(answer(403, body, { "X-Request-Id": "req-123" }));

    const error = await refusal(custd.admin.machineAccess.getEffective("ci-reporting"));

    expect(error.code).toBe(MACHINE_ACCESS_PROBLEM_CODES.blocked);
    expect(error.problem?.machineAccess).toEqual({
      area: "reporting",
      blockedBy: "machine",
      companySlug: "acme",
      clientId: "ci-reporting",
    });
    expect(error.problem?.traceId).toBe("req-machine-access-1");
    expect(error.requestId).toBe("req-123");
  });

  it("an unreadable policy is a bounded retry with no block", async () => {
    const custd = client(answer(503, fixture("machine-access-unavailable-problem.json")));

    const error = await refusal(custd.admin.machineAccess.get("acme"));

    expect(error.code).toBe(MACHINE_ACCESS_PROBLEM_CODES.unavailable);
    expect(error.retryability).toBe("bounded");
    expect(error.problem?.machineAccess).toBeUndefined();
    // Cross-origin browsers cannot read X-Request-Id, so the problem's traceId stands in.
    expect(error.requestId).toBe("req-machine-access-2");
  });
});

describe("request IDs", () => {
  it("records the request ID of an accepted answer", async () => {
    const policy = { companySlug: "acme", allowSupportAutomation: false, areas: null };
    const custd = client(answer(200, policy, { "X-Request-Id": "req-200" }));
    const metadata: ResponseMetadata = { requestId: "" };

    const read = await custd.admin.machineAccess.get("acme", { metadata });

    expect(read.areas).toEqual([]);
    expect(metadata.requestId).toBe("req-200");
  });

  it("records the request ID of a refusal, and the flat envelope carries its own", async () => {
    const body = { error: "erasure_pending", code: "erasure_pending", requestId: "req-flat" };
    const metadata: ResponseMetadata = { requestId: "" };
    const custd = client(answer(409, body, { "X-Request-Id": "req-409" }));

    const error = await custd.admin.machineAccess.get("acme", { metadata }).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(AdminWorkflowError);
    expect((error as AdminWorkflowError).requestId).toBe("req-409");
    expect(metadata.requestId).toBe("req-409");
    const flat = await client(answer(409, body))
      .admin.machineAccess.get("acme")
      .catch((caught: unknown) => caught);
    expect((flat as AdminWorkflowError).requestId).toBe("req-flat");
  });
});
