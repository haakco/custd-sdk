import { beforeEach, describe, expect, it, vi } from "vitest";
import { readLifecycleFixture } from "./fixtures.js";
import { CustdClient } from "./index.js";

const BASE_URL = "http://localhost:8080";
const REQUEST_UUID = "ob_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function clientFor(responses: Response[]) {
  const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit): Promise<Response> => {
    const response = responses.shift();
    if (!response) throw new Error("unexpected request");
    return response;
  });
  return {
    client: new CustdClient({ baseUrl: BASE_URL, getToken: () => "admin-token", fetch: fetchMock as typeof fetch }),
    fetchMock,
  };
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("BackendLifecycleClient", () => {
  it("rotates an owned credential and delivers the one-time secret once", async () => {
    const secret = "rotated-secret";
    const { client, fetchMock } = clientFor([
      jsonResponse({ clientId: "acme-ingest", companySlug: "acme", scopes: ["events.write"] }),
      jsonResponse({ clientSecret: secret }),
    ]);
    const persistSecret = vi.fn();

    const result = await client.admin.lifecycle.rotateCredential({
      tenantSlug: "acme",
      clientId: "acme-ingest",
      purposeProfile: "ingest",
      persistSecret,
    });

    expect(result).toEqual({
      tenantSlug: "acme",
      clientId: "acme-ingest",
      purposeProfile: "ingest",
      secretPersisted: true,
    });
    expect(persistSecret).toHaveBeenCalledTimes(1);
    expect(persistSecret).toHaveBeenCalledWith({
      tenantSlug: "acme",
      clientId: "acme-ingest",
      purposeProfile: "ingest",
      clientSecret: secret,
    });
    expect(JSON.stringify(result)).not.toContain(secret);
    expect(fetchMock.mock.calls.map(([input, init]) => [String(input), init?.method])).toEqual([
      [`${BASE_URL}/api/v1/admin/oauth-clients/acme-ingest`, "GET"],
      [`${BASE_URL}/api/v1/admin/oauth-clients/acme-ingest/rotate-secret`, "POST"],
    ]);
  });

  it("rejects a cross-tenant rotation before issuing a new secret", async () => {
    const { client, fetchMock } = clientFor([
      jsonResponse({ clientId: "acme-ingest", companySlug: "other", scopes: ["events.write"] }),
    ]);

    await expect(
      client.admin.lifecycle.rotateCredential({
        tenantSlug: "acme",
        clientId: "acme-ingest",
        purposeProfile: "ingest",
        persistSecret: () => {},
      }),
    ).rejects.toThrow("does not belong to the requested tenant");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rejects rotation when secret persistence fails without exposing the secret", async () => {
    const secret = "rotated-secret";
    const { client } = clientFor([
      jsonResponse({ clientId: "acme-ingest", companySlug: "acme", scopes: ["events.write"] }),
      jsonResponse({ clientSecret: secret }),
    ]);

    await expect(
      client.admin.lifecycle.rotateCredential({
        tenantSlug: "acme",
        clientId: "acme-ingest",
        purposeProfile: "ingest",
        persistSecret: () => {
          throw new Error(`secret store rejected ${secret}`);
        },
      }),
    ).rejects.toThrow("secret persistence failed");
  });

  it("delegates readiness verification to the bounded runtime probe", async () => {
    const { client, fetchMock } = clientFor([
      jsonResponse({ ok: true }),
      jsonResponse({ access_token: "access-token" }),
      jsonResponse({ companySlug: "acme" }),
      jsonResponse([{ version: "1.0.0", isActive: true }]),
    ]);

    await expect(
      client.admin.lifecycle.verifyReadiness({
        baseUrl: BASE_URL,
        tenantSlug: "acme",
        eventTypeSlug: "card-review",
        schemaVersion: "1.0.0",
        fetch: fetchMock,
        oauth: [
          {
            name: "ingest",
            clientId: "acme-ingest",
            clientSecret: "secret",
            tokenUrl: `${BASE_URL}/oauth2/token`,
          },
        ],
      }),
    ).resolves.toMatchObject({ ready: true, tenantSlug: "acme", schemaVersion: "1.0.0" });
  });

  it("runs the complete offboarding workflow and requires a zero-state proof", async () => {
    const preview = readLifecycleFixture("offboarding", "valid-preview-response.json");
    const exported = readLifecycleFixture("offboarding", "valid-export-response.json");
    const acknowledged = readLifecycleFixture("offboarding", "valid-acknowledge-response.json");
    const executed = readLifecycleFixture("offboarding", "valid-execute-response.json");
    const receipt = readLifecycleFixture("offboarding", "valid-receipt-response.json");
    const { client, fetchMock } = clientFor([
      jsonResponse(preview),
      jsonResponse(exported),
      jsonResponse(acknowledged),
      jsonResponse({ requestUuid: REQUEST_UUID, state: "confirmed" }),
      jsonResponse(executed),
      jsonResponse(receipt),
    ]);
    const verifyZeroState = vi.fn(async (input: { tenantSlug: string; requestUuid: string }) => {
      expect(input.tenantSlug).toBe("acme");
      expect(input.requestUuid).toBe(REQUEST_UUID);
      return { zero: true };
    });

    const result = await client.admin.lifecycle.completeOffboarding({
      tenantSlug: "acme",
      requestUuid: REQUEST_UUID,
      waiver: { role: "client_owner", reason: "explicit_client_request" },
      verifyZeroState,
    });

    expect(result.requestUuid).toBe(REQUEST_UUID);
    expect(result.receipt.finalState).toBe("complete");
    expect(result.zeroState).toEqual({ zero: true });
    expect(verifyZeroState).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls.map(([input, init]) => [String(input), init?.method])).toEqual([
      [`${BASE_URL}/api/v1/admin/offboarding/requests/${REQUEST_UUID}/preview`, "POST"],
      [`${BASE_URL}/api/v1/admin/offboarding/requests/${REQUEST_UUID}/export`, "POST"],
      [`${BASE_URL}/api/v1/admin/offboarding/requests/${REQUEST_UUID}/acknowledge`, "POST"],
      [`${BASE_URL}/api/v1/admin/offboarding/${REQUEST_UUID}/confirm`, "POST"],
      [`${BASE_URL}/api/v1/admin/offboarding/requests/${REQUEST_UUID}/execute`, "POST"],
      [`${BASE_URL}/api/v1/admin/offboarding/requests/${REQUEST_UUID}/receipt`, "GET"],
    ]);
  });

  it("fails closed on an explicitly incomplete export", async () => {
    const { client, fetchMock } = clientFor([
      jsonResponse({ requestUuid: REQUEST_UUID, perStore: [] }),
      jsonResponse({ requestUuid: REQUEST_UUID, complete: false }),
    ]);

    await expect(
      client.admin.lifecycle.completeOffboarding({
        tenantSlug: "acme",
        requestUuid: REQUEST_UUID,
        waiver: { role: "client_owner", reason: "explicit_client_request" },
        verifyZeroState: async () => ({ zero: true }),
      }),
    ).rejects.toThrow("offboarding export is incomplete");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("fails closed when zero-state reconciliation reports residual data", async () => {
    const preview = readLifecycleFixture("offboarding", "valid-preview-response.json");
    const exported = readLifecycleFixture("offboarding", "valid-export-response.json");
    const acknowledged = readLifecycleFixture("offboarding", "valid-acknowledge-response.json");
    const executed = readLifecycleFixture("offboarding", "valid-execute-response.json");
    const receipt = readLifecycleFixture("offboarding", "valid-receipt-response.json");
    const { client } = clientFor([
      jsonResponse(preview),
      jsonResponse(exported),
      jsonResponse(acknowledged),
      jsonResponse({ requestUuid: REQUEST_UUID, state: "confirmed" }),
      jsonResponse(executed),
      jsonResponse(receipt),
    ]);

    await expect(
      client.admin.lifecycle.completeOffboarding({
        tenantSlug: "acme",
        requestUuid: REQUEST_UUID,
        waiver: { role: "client_owner", reason: "explicit_client_request" },
        verifyZeroState: async () => ({ zero: false, remaining: ["tenant-row"] }),
      }),
    ).rejects.toThrow("zero-state reconciliation did not confirm an empty tenant");
  });
});
