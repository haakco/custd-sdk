import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CustdClient,
  createVerifiedOffboardingExportReceiver,
  type ReceiveAndVerifyOffboardingExport,
} from "./index.js";
import { OFFBOARDING_REQUEST_UUID, offboardingBodies } from "./offboarding-bodies.test-helper";

const BASE_URL = "http://localhost:8080";
const REQUEST_UUID = OFFBOARDING_REQUEST_UUID;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function binaryResponse(bytes: Uint8Array, checksumSha256: string, status = 200): Response {
  return new Response(bytes as unknown as BodyInit, {
    status,
    headers: {
      "Content-Length": String(bytes.byteLength),
      "X-Checksum-SHA256": checksumSha256,
    },
  });
}

function readDownloadFixture() {
  return offboardingBodies.download;
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
  it("downloads, verifies, and persists an offboarding export in the shared SDK", async () => {
    const bytes = new TextEncoder().encode("artifact");
    const checksumSha256 = "c7c5c1d70c5dec4416ab6158afd0b223ef40c29b1dc1f97ed9428b94d4cadb1c";
    const persist = vi.fn(async () => "file:test-export");
    const receive = createVerifiedOffboardingExportReceiver({
      persist,
    });

    await expect(
      receive({
        tenantSlug: "acme",
        requestUuid: REQUEST_UUID,
        download: { bytes, checksumSha256, byteSize: bytes.byteLength },
        export: {
          requestUuid: REQUEST_UUID,
          checksumSha256,
          byteSize: bytes.byteLength,
          recordCount: 1,
          generatedAt: "2026-08-26T00:00:00Z",
          expiresAt: "2026-08-27T00:00:00Z",
          previewInventoryDigest: "a".repeat(64),
        },
      }),
    ).resolves.toEqual({ verified: true, evidence: "file:test-export" });
    expect(persist).toHaveBeenCalledWith({
      tenantSlug: "acme",
      requestUuid: REQUEST_UUID,
      bytes,
      checksumSha256,
    });
  });

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
    const request = offboardingBodies.created;
    const preview = offboardingBodies.preview;
    const downloadFixture = readDownloadFixture();
    const exported = {
      ...offboardingBodies.export,
      checksumSha256: downloadFixture.checksumSha256,
      byteSize: downloadFixture.byteSize,
    };
    const downloadBytes = downloadFixture.bytes;
    const acknowledged = offboardingBodies.acknowledged;
    const executed = offboardingBodies.receipt;
    const receipt = offboardingBodies.receipt;
    const { client, fetchMock } = clientFor([
      jsonResponse(request),
      jsonResponse(preview),
      jsonResponse(exported),
      binaryResponse(downloadBytes, downloadFixture.checksumSha256),
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
    const receiveAndVerifyExport: ReceiveAndVerifyOffboardingExport = vi.fn(async (input) => {
      expect(input.export?.checksumSha256).toBe(downloadFixture.checksumSha256);
      expect(input.export?.byteSize).toBe(downloadFixture.byteSize);
      expect(input.export?.recordCount).toBe(1357);
      expect(input.download.byteSize).toBe(25);
      return { verified: true as const, evidence: "stored:test" };
    });

    const result = await client.admin.lifecycle.completeOffboarding({
      tenantSlug: "acme",
      requestUuid: REQUEST_UUID,
      receiveAndVerifyExport,
      verifyZeroState,
    });

    expect(result.requestUuid).toBe(REQUEST_UUID);
    expect(result.receipt.finalState).toBe("complete");
    expect(result.zeroState).toEqual({ zero: true });
    expect(result.exportDelivery).toEqual({ verified: true, evidence: "stored:test" });
    expect(receiveAndVerifyExport).toHaveBeenCalledTimes(1);
    expect(verifyZeroState).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls.map(([input, init]) => [String(input), init?.method])).toEqual([
      [`${BASE_URL}/api/v1/admin/offboarding/${REQUEST_UUID}`, "GET"],
      [`${BASE_URL}/api/v1/admin/offboarding/requests/${REQUEST_UUID}/preview`, "POST"],
      [`${BASE_URL}/api/v1/admin/offboarding/requests/${REQUEST_UUID}/export`, "POST"],
      [`${BASE_URL}/api/v1/admin/offboarding/requests/${REQUEST_UUID}/download`, "GET"],
      [`${BASE_URL}/api/v1/admin/offboarding/requests/${REQUEST_UUID}/acknowledge`, "POST"],
      [`${BASE_URL}/api/v1/admin/offboarding/${REQUEST_UUID}/confirm`, "POST"],
      [`${BASE_URL}/api/v1/admin/offboarding/requests/${REQUEST_UUID}/execute`, "POST"],
      [`${BASE_URL}/api/v1/admin/offboarding/requests/${REQUEST_UUID}/receipt`, "GET"],
    ]);
  });

  it("resumes an exported request from its durable binary download", async () => {
    const downloadFixture = readDownloadFixture();
    const downloadBytes = downloadFixture.bytes;
    const download = {
      bytes: downloadBytes,
      checksumSha256: downloadFixture.checksumSha256,
      byteSize: downloadFixture.byteSize,
    };
    const acknowledged = offboardingBodies.acknowledged;
    const executed = offboardingBodies.receipt;
    const receipt = offboardingBodies.receipt;
    const { client, fetchMock } = clientFor([
      jsonResponse(offboardingBodies.exported),
      binaryResponse(downloadBytes, downloadFixture.checksumSha256),
      jsonResponse(acknowledged),
      jsonResponse({ requestUuid: REQUEST_UUID, state: "confirmed" }),
      jsonResponse(executed),
      jsonResponse(receipt),
    ]);
    const receiveAndVerifyExport: ReceiveAndVerifyOffboardingExport = vi.fn(async (input) => {
      expect(input.download.checksumSha256).toBe(download.checksumSha256);
      expect(input.download.byteSize).toBe(download.byteSize);
      expect(input.export).toBeUndefined();
      return { verified: true as const };
    });

    const result = await client.admin.lifecycle.completeOffboarding({
      tenantSlug: "acme",
      requestUuid: REQUEST_UUID,
      receiveAndVerifyExport,
      verifyZeroState: async () => ({ zero: true }),
    });

    expect(result.preview).toBeUndefined();
    expect(result.export).toBeUndefined();
    expect(result.download).toEqual(download);
    expect(fetchMock.mock.calls.map(([input, init]) => [String(input), init?.method])).toEqual([
      [`${BASE_URL}/api/v1/admin/offboarding/${REQUEST_UUID}`, "GET"],
      [`${BASE_URL}/api/v1/admin/offboarding/requests/${REQUEST_UUID}/download`, "GET"],
      [`${BASE_URL}/api/v1/admin/offboarding/requests/${REQUEST_UUID}/acknowledge`, "POST"],
      [`${BASE_URL}/api/v1/admin/offboarding/${REQUEST_UUID}/confirm`, "POST"],
      [`${BASE_URL}/api/v1/admin/offboarding/requests/${REQUEST_UUID}/execute`, "POST"],
      [`${BASE_URL}/api/v1/admin/offboarding/requests/${REQUEST_UUID}/receipt`, "GET"],
    ]);
  });

  it("fails closed before mutation for an unsupported current state", async () => {
    const { client, fetchMock } = clientFor([
      jsonResponse({ requestUuid: REQUEST_UUID, state: "requested", requestedAt: "2026-08-26T00:00:00Z" }),
    ]);

    await expect(
      client.admin.lifecycle.completeOffboarding({
        tenantSlug: "acme",
        requestUuid: REQUEST_UUID,
        receiveAndVerifyExport: async () => ({ verified: true }),
        verifyZeroState: async () => ({ zero: true }),
      }),
    ).rejects.toThrow("cannot complete offboarding from state requested");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("fails closed when fresh export metadata disagrees with the download", async () => {
    const downloadFixture = readDownloadFixture();
    const exported = {
      ...offboardingBodies.export,
      checksumSha256: "0".repeat(64),
    };
    const { client, fetchMock } = clientFor([
      jsonResponse({ requestUuid: REQUEST_UUID, state: "preview", requestedAt: "2026-08-26T00:00:00Z" }),
      jsonResponse(offboardingBodies.preview),
      jsonResponse(exported),
      binaryResponse(downloadFixture.bytes, downloadFixture.checksumSha256),
    ]);

    await expect(
      client.admin.lifecycle.completeOffboarding({
        tenantSlug: "acme",
        requestUuid: REQUEST_UUID,
        receiveAndVerifyExport: async () => ({ verified: true }),
        verifyZeroState: async () => ({ zero: true }),
      }),
    ).rejects.toThrow("export metadata did not match the download");
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("fails closed on an incomplete preview before export", async () => {
    const { client, fetchMock } = clientFor([
      jsonResponse({ requestUuid: REQUEST_UUID, state: "preview", requestedAt: "2026-08-26T00:00:00Z" }),
      jsonResponse({
        requestUuid: REQUEST_UUID,
        generatedAt: "2026-08-26T00:00:00Z",
        expiresAt: "2026-08-27T00:00:00Z",
        stores: [],
        previewInventoryDigest: "sha256:test",
        complete: false,
        partial: true,
      }),
    ]);

    await expect(
      client.admin.lifecycle.completeOffboarding({
        tenantSlug: "acme",
        requestUuid: REQUEST_UUID,
        receiveAndVerifyExport: async () => ({ verified: true }),
        verifyZeroState: async () => ({ zero: true }),
      }),
    ).rejects.toThrow("offboarding preview is incomplete");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not acknowledge until the downloaded export is persisted and verified", async () => {
    const downloadFixture = readDownloadFixture();
    const exported = {
      ...offboardingBodies.export,
      checksumSha256: downloadFixture.checksumSha256,
      byteSize: downloadFixture.byteSize,
    };
    const { client, fetchMock } = clientFor([
      jsonResponse({ requestUuid: REQUEST_UUID, state: "preview", requestedAt: "2026-08-26T00:00:00Z" }),
      jsonResponse(offboardingBodies.preview),
      jsonResponse(exported),
      binaryResponse(downloadFixture.bytes, downloadFixture.checksumSha256),
    ]);

    await expect(
      client.admin.lifecycle.completeOffboarding({
        tenantSlug: "acme",
        requestUuid: REQUEST_UUID,
        receiveAndVerifyExport: async () => ({ verified: false }),
        verifyZeroState: async () => ({ zero: true }),
      }),
    ).rejects.toThrow("export delivery was not verified");
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("fails closed when zero-state reconciliation reports residual data", async () => {
    const preview = offboardingBodies.preview;
    const downloadFixture = readDownloadFixture();
    const exported = {
      ...offboardingBodies.export,
      checksumSha256: downloadFixture.checksumSha256,
      byteSize: downloadFixture.byteSize,
    };
    const downloadBytes = downloadFixture.bytes;
    const acknowledged = offboardingBodies.acknowledged;
    const executed = offboardingBodies.receipt;
    const receipt = offboardingBodies.receipt;
    const { client } = clientFor([
      jsonResponse({ requestUuid: REQUEST_UUID, state: "preview", requestedAt: "2026-08-26T00:00:00Z" }),
      jsonResponse(preview),
      jsonResponse(exported),
      binaryResponse(downloadBytes, downloadFixture.checksumSha256),
      jsonResponse(acknowledged),
      jsonResponse({ requestUuid: REQUEST_UUID, state: "confirmed" }),
      jsonResponse(executed),
      jsonResponse(receipt),
    ]);

    await expect(
      client.admin.lifecycle.completeOffboarding({
        tenantSlug: "acme",
        requestUuid: REQUEST_UUID,
        receiveAndVerifyExport: async () => ({ verified: true }),
        verifyZeroState: async () => ({ zero: false, remaining: ["tenant-row"] }),
      }),
    ).rejects.toThrow("zero-state reconciliation did not confirm an empty tenant");
  });
});
