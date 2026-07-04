import { beforeEach, describe, expect, it, vi } from "vitest";
import { CustdClient } from "./index";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("CustdClient provisioning", () => {
  it("creates, lists, and revokes data spaces through public provisioning APIs", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            slug: "agency-store-001",
            companyName: "Agency Store 001",
            parentCompanySlug: "agency",
            enabled: true,
          }),
          { status: 201, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            dataSpaces: [],
            entitlement: {
              enabled: true,
              activeDataSpaces: 0,
              maxActiveDataSpaces: 5,
              maxActiveProducersPerDataSpace: 3,
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const client = new CustdClient({ baseUrl: "http://localhost:8080", getToken: () => "broker-token" });

    const created = await client.provisioning.dataSpaces.create({
      slug: "agency-store-001",
      companyName: "Agency Store 001",
    });
    const list = await client.provisioning.dataSpaces.list();
    await client.provisioning.dataSpaces.revoke("agency store/001");

    expect(created.slug).toBe("agency-store-001");
    expect(list.entitlement.maxActiveDataSpaces).toBe(5);
    expect(fetchMock.mock.calls.map((call) => [call[0], call[1]?.method])).toEqual([
      ["http://localhost:8080/api/v1/data-spaces", "POST"],
      ["http://localhost:8080/api/v1/data-spaces", "GET"],
      ["http://localhost:8080/api/v1/data-spaces/agency%20store%2F001", "DELETE"],
    ]);
  });

  it("provisions, lists, rotates, and revokes producers with explicit one-time secrets", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            clientId: "custd-agency-store-001-webhook",
            clientSecret: "once",
            companySlug: "agency-store-001",
            producerSlug: "webhook",
            scopes: ["events.write"],
          }),
          { status: 201, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              clientId: "custd-agency-store-001-webhook",
              companySlug: "agency-store-001",
              producerSlug: "webhook",
              scopes: ["events.write"],
            },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ clientId: "custd-x", clientSecret: "next", scopes: ["events.write"] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const client = new CustdClient({ baseUrl: "http://localhost:8080", getToken: () => "broker-token" });

    const created = await client.provisioning.producers.provision({
      companySlug: "agency-store-001",
      producerSlug: "webhook",
      scopeTemplate: "managed-audit",
    });
    const producers = await client.provisioning.producers.list("agency-store-001");
    const rotated = await client.provisioning.producers.rotateSecret("custd/agency store");
    await client.provisioning.producers.revoke("custd/agency store");

    expect(created.clientSecret).toBe("once");
    expect(producers[0].producerSlug).toBe("webhook");
    expect(rotated.clientSecret).toBe("next");
    expect(fetchMock.mock.calls.map((call) => [call[0], call[1]?.method])).toEqual([
      ["http://localhost:8080/api/v1/producer-provisioning", "POST"],
      ["http://localhost:8080/api/v1/producer-provisioning?companySlug=agency-store-001", "GET"],
      ["http://localhost:8080/api/v1/producer-provisioning/custd%2Fagency%20store/rotate-secret", "POST"],
      ["http://localhost:8080/api/v1/producer-provisioning/custd%2Fagency%20store", "DELETE"],
    ]);
  });
});
