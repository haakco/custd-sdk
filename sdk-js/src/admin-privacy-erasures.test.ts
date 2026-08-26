import { beforeEach, describe, expect, it, vi } from "vitest";
import { PrivacyErasureError } from "./admin-privacy-erasures";
import { CustdClient } from "./index";

const BASE_URL = "http://localhost:8080/";
const REQUEST_UUID = "pe_019ef2d5-8b4e-77d8-a8e8-9da8fc97dd10";

type ResponsePlan = { status: number; body: unknown };

function installFetch(plans: ResponsePlan[]) {
  const calls: Array<{ url: string; method: string; body: unknown; signal?: AbortSignal | null }> = [];
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const body = typeof init?.body === "string" && init.body.length > 0 ? JSON.parse(init.body) : undefined;
    calls.push({ url: String(input), method: init?.method ?? "GET", body, signal: init?.signal });
    const plan = plans[calls.length - 1];
    if (!plan) throw new Error("unexpected test request");
    return new Response(JSON.stringify(plan.body), {
      status: plan.status,
      headers: { "Content-Type": "application/json" },
    });
  }) as unknown as typeof fetch;
  return calls;
}

function request(status: string): Record<string, unknown> {
  return {
    requestUuid: REQUEST_UUID,
    status,
    selectorType: "anonymousId",
    selectorDisplay: "[redacted:anonymous_id]",
  };
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("PrivacyErasureClient", () => {
  it("uses the company-scoped idempotent request and reports bounded progress until reflected", async () => {
    const calls = installFetch([
      { status: 202, body: request("received") },
      { status: 200, body: request("segments_pending") },
      { status: 200, body: request("s3_reflected") },
    ]);
    const progress: string[] = [];
    const client = new CustdClient({ baseUrl: BASE_URL, getToken: () => "admin-token" });

    const completed = await client.admin.privacyErasures.createAndWait(
      {
        companySlug: "acme",
        selector: { type: "anonymousId", value: "opaque-selector" },
        reason: "account_deletion",
        redactionId: "tiao-job-map",
      },
      {
        maxPolls: 4,
        pollIntervalMs: 0,
        onProgress: ({ status }) => {
          progress.push(status);
        },
      },
    );

    expect(completed.status).toBe("s3_reflected");
    expect(calls[0]).toMatchObject({
      method: "POST",
      url: "http://localhost:8080/api/v1/admin/privacy/erasures",
      body: {
        companySlug: "acme",
        selector: { type: "anonymousId", value: "opaque-selector" },
        reason: "account_deletion",
        redactionId: "tiao-job-map",
      },
    });
    expect(calls.slice(1).map((call) => call.url)).toEqual([
      `http://localhost:8080/api/v1/admin/privacy/erasures/${REQUEST_UUID}?companySlug=acme`,
      `http://localhost:8080/api/v1/admin/privacy/erasures/${REQUEST_UUID}?companySlug=acme`,
    ]);
    expect(progress).toEqual(["received", "segments_pending", "s3_reflected"]);
  });

  it("forces failed work once, then polls the same request to a terminal success", async () => {
    const calls = installFetch([
      { status: 200, body: request("failed") },
      {
        status: 202,
        body: {
          request: request("segments_pending"),
          safe_next_action: "",
          safe_next_action_code: "",
        },
      },
      { status: 200, body: request("segments_pending") },
      { status: 200, body: request("s3_reflected") },
    ]);
    const client = new CustdClient({ baseUrl: BASE_URL, getToken: () => "admin-token" });

    await expect(
      client.admin.privacyErasures.waitForCompletion("acme", REQUEST_UUID, {
        maxPolls: 4,
        pollIntervalMs: 0,
      }),
    ).resolves.toMatchObject({ status: "s3_reflected" });

    expect(calls.map((call) => [call.method, call.url])).toEqual([
      ["GET", `http://localhost:8080/api/v1/admin/privacy/erasures/${REQUEST_UUID}?companySlug=acme`],
      ["POST", `http://localhost:8080/api/v1/admin/privacy/erasures/${REQUEST_UUID}/force?companySlug=acme`],
      ["GET", `http://localhost:8080/api/v1/admin/privacy/erasures/${REQUEST_UUID}?companySlug=acme`],
      ["GET", `http://localhost:8080/api/v1/admin/privacy/erasures/${REQUEST_UUID}?companySlug=acme`],
    ]);
  });

  it("surfaces a non-retryable force decision without exposing the selector", async () => {
    const calls = installFetch([
      { status: 200, body: request("failed") },
      {
        status: 202,
        body: {
          request: request("failed"),
          safe_next_action: "cancel",
          safe_next_action_code: "request_not_forceable",
        },
      },
    ]);
    const client = new CustdClient({ baseUrl: BASE_URL, getToken: () => "admin-token" });

    const failure = await client.admin.privacyErasures
      .waitForCompletion("acme", REQUEST_UUID, { pollIntervalMs: 0 })
      .catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(PrivacyErasureError);
    expect(failure).toMatchObject({
      code: "force_recovery_blocked",
      retryClassification: "non_retryable",
      retryable: false,
    });
    expect((failure as Error).message).not.toContain("opaque-selector");
    expect(calls).toHaveLength(2);
  });

  it("classifies a bounded polling timeout as retryable", async () => {
    installFetch([
      { status: 202, body: request("received") },
      { status: 200, body: request("segments_pending") },
    ]);
    const client = new CustdClient({ baseUrl: BASE_URL, getToken: () => "admin-token" });

    const failure = await client.admin.privacyErasures
      .createAndWait(
        {
          companySlug: "acme",
          selector: { type: "anonymousId", value: "opaque-selector" },
          reason: "account_deletion",
          redactionId: "tiao-job-map",
        },
        { maxPolls: 1, pollIntervalMs: 0 },
      )
      .catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(PrivacyErasureError);
    expect(failure).toMatchObject({ code: "poll_timeout", retryClassification: "retryable", retryable: true });
    expect((failure as Error).message).not.toContain("opaque-selector");
  });

  it("classifies the server retry action as retryable and forwards cancellation", async () => {
    const calls = installFetch([
      { status: 200, body: request("failed") },
      {
        status: 202,
        body: {
          request: request("failed"),
          safe_next_action: "retry",
          safe_next_action_code: "worker_unavailable",
        },
      },
    ]);
    const controller = new AbortController();
    const client = new CustdClient({ baseUrl: BASE_URL, getToken: () => "admin-token" });

    const failure = await client.admin.privacyErasures
      .waitForCompletion("acme", REQUEST_UUID, {
        pollIntervalMs: 0,
        signal: controller.signal,
      })
      .catch((error: unknown) => error);

    expect(failure).toMatchObject({
      code: "force_recovery_retry",
      retryClassification: "retryable",
      retryable: true,
    });
    expect(calls.every((call) => call.signal === controller.signal)).toBe(true);
  });
});
