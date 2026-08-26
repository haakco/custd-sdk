import { describe, expect, it, vi } from "vitest";
import { ClientSetupClient, type ClientSetupManifest, validateClientSetupManifest } from "./admin-client-setup.js";

const reportingPack = {
  key: "acme-pack",
  displayName: "Acme reporting",
  enabled: true,
  eventTypes: ["page-view"],
};

describe("client setup reporting-pack manifests", () => {
  it("sends reporting packs through the one manifest apply endpoint", async () => {
    const manifest: ClientSetupManifest = {
      reportingPacks: [{ definition: reportingPack, expectedRevision: 3 }],
    };
    const request = vi.fn().mockResolvedValue({ ready: false });
    const client = new ClientSetupClient(request);

    await client.apply("acme/tenant", manifest);

    expect(request).toHaveBeenCalledWith("PUT", "/tenant-manifest/acme%2Ftenant", manifest, undefined);
  });

  it("rejects duplicate pack keys, invalid revisions, and credentials before transport", async () => {
    const request = vi.fn().mockResolvedValue({ ready: false });
    const client = new ClientSetupClient(request);
    const duplicate: ClientSetupManifest = {
      reportingPacks: [{ definition: reportingPack }, { definition: reportingPack }],
    };
    const invalidRevision: ClientSetupManifest = {
      reportingPacks: [{ definition: reportingPack, expectedRevision: -1 }],
    };

    expect(() => validateClientSetupManifest(duplicate)).toThrow("duplicate reporting pack");
    await expect(client.apply("acme", duplicate)).rejects.toThrow("duplicate reporting pack");
    expect(() => validateClientSetupManifest(invalidRevision)).toThrow("non-negative integer");
    expect(() =>
      validateClientSetupManifest({
        oauthClients: [
          {
            clientId: "acme-ingest",
            purposeProfile: "ingest",
            clientSecret: "must-not-be-accepted",
          } as never,
        ],
      }),
    ).toThrow("client secrets");
    expect(request).not.toHaveBeenCalled();
  });

  it("applies once and polls readiness until the runtime activates the pack", async () => {
    const manifest: ClientSetupManifest = { reportingPacks: [{ definition: reportingPack }] };
    const applied = {
      tenantSlug: "acme",
      manifestDigest: "digest-1",
      ready: false,
      state: "attention_required",
      resources: [],
      safeNextAction: "retry",
      safeNextActionCode: "reporting_pack_activation_pending",
      observedAt: "2026-08-26T00:00:00Z",
    };
    const pending = { ...applied };
    const ready = { ...applied, ready: true, state: "ready", safeNextAction: "none", safeNextActionCode: "" };
    const request = vi.fn().mockResolvedValueOnce(applied).mockResolvedValueOnce(pending).mockResolvedValueOnce(ready);
    const client = new ClientSetupClient(request);

    const result = await client.applyAndWait("acme", manifest, { timeoutMs: 100, intervalMs: 1 });

    expect(result.apply).toEqual(applied);
    expect(result.readiness).toEqual(ready);
    expect(request).toHaveBeenCalledTimes(3);
    expect(request.mock.calls.map(([method, path]) => [method, path])).toEqual([
      ["PUT", "/tenant-manifest/acme"],
      ["GET", "/tenant-manifest/acme/readiness"],
      ["GET", "/tenant-manifest/acme/readiness"],
    ]);
  });

  it("persists one-time credentials before the first readiness poll", async () => {
    const manifest: ClientSetupManifest = {
      oauthClients: [{ clientId: "acme-reporting", purposeProfile: "reporting" }],
    };
    const applied = {
      tenantSlug: "acme",
      manifestDigest: "digest-1",
      ready: false,
      state: "attention_required",
      resources: [],
      safeNextAction: "retry",
      safeNextActionCode: "reporting_pack_activation_pending",
      observedAt: "2026-08-26T00:00:00Z",
      credentials: [{ clientId: "acme-reporting", clientSecret: "one-time", purposeProfile: "reporting" as const }],
    };
    const ready = {
      ...applied,
      credentials: [],
      ready: true,
      state: "ready",
      safeNextAction: "none",
      safeNextActionCode: "",
    };
    const order: string[] = [];
    const request = vi.fn(async (method: string) => {
      order.push(method);
      return method === "PUT" ? applied : ready;
    });
    const persistCredentials = vi.fn(async () => {
      order.push("persist");
    });

    await new ClientSetupClient(request as never).applyAndWait("acme", manifest, {
      timeoutMs: 100,
      intervalMs: 1,
      persistCredentials,
    });

    expect(order).toEqual(["PUT", "persist", "GET"]);
    expect(persistCredentials).toHaveBeenCalledWith(applied.credentials);
  });

  it("fails before polling when one-time credentials have no persistence owner", async () => {
    const manifest: ClientSetupManifest = {
      oauthClients: [{ clientId: "acme-reporting", purposeProfile: "reporting" }],
    };
    const request = vi.fn().mockResolvedValue({
      tenantSlug: "acme",
      ready: false,
      safeNextAction: "retry",
      credentials: [{ clientId: "acme-reporting", clientSecret: "one-time", purposeProfile: "reporting" }],
    });

    await expect(new ClientSetupClient(request).applyAndWait("acme", manifest)).rejects.toThrow(
      "one-time credential persistence callback",
    );
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("returns the readiness response without polling again on a fix action", async () => {
    const manifest: ClientSetupManifest = { reportingPacks: [{ definition: reportingPack }] };
    const applied = {
      tenantSlug: "acme",
      manifestDigest: "digest-1",
      ready: false,
      state: "attention_required",
      resources: [],
      safeNextAction: "retry",
      safeNextActionCode: "reporting_pack_activation_pending",
      observedAt: "2026-08-26T00:00:00Z",
    };
    const fix = {
      ...applied,
      safeNextAction: "fix",
      safeNextActionCode: "reporting_pack_revision_conflict",
    };
    const request = vi.fn().mockResolvedValueOnce(applied).mockResolvedValueOnce(fix);
    const client = new ClientSetupClient(request);

    const result = await client.applyAndWait("acme", manifest, { timeoutMs: 100, intervalMs: 1 });

    expect(result.readiness).toEqual(fix);
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("times out with the last actionable readiness code", async () => {
    const manifest: ClientSetupManifest = { reportingPacks: [{ definition: reportingPack }] };
    const pending = {
      tenantSlug: "acme",
      manifestDigest: "digest-1",
      ready: false,
      state: "attention_required",
      resources: [],
      safeNextAction: "retry",
      safeNextActionCode: "reporting_pack_activation_pending",
      observedAt: "2026-08-26T00:00:00Z",
    };
    const request = vi.fn().mockResolvedValue(pending);
    const client = new ClientSetupClient(request);

    await expect(client.applyAndWait("acme", manifest, { timeoutMs: 5, intervalMs: 1 })).rejects.toThrow(
      'timed out waiting for tenant manifest readiness for "acme" after 5ms (action=retry, code=reporting_pack_activation_pending)',
    );
  });
});
