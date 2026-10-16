import { describe, expect, it, vi } from "vitest";
import { CustdClient, type DataScopeGrant } from "./index";

function mockFetch(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue(
    new Response(status === 204 ? null : JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    }),
  );
}

function client(fetchImpl: ReturnType<typeof mockFetch>) {
  return new CustdClient({ baseUrl: "http://localhost:8080", getToken: () => "token", fetch: fetchImpl });
}

const scopeFixture = {
  uuid: "11111111-1111-1111-1111-111111111111",
  code: "acme-store",
  name: "Acme Store",
  status: "active",
  createdAt: "2026-10-15T00:00:00Z",
  updatedAt: "2026-10-15T00:00:00Z",
};

const resourceFixture = { ...scopeFixture, scopeUuid: scopeFixture.uuid, code: "srv-01" };

const grantFixture: DataScopeGrant = {
  principal: { kind: "machine", clientId: "custd-producer" },
  target: { kind: "sub_client", scopeUuid: scopeFixture.uuid },
  action: "read",
};

describe("data scope admin client", () => {
  it("creates a scope on the admin route and validates the code", async () => {
    const fetchImpl = mockFetch(scopeFixture, 201);
    const scope = await client(fetchImpl).admin.dataScopes.createScope({ code: "acme-store", name: "Acme Store" });

    const [url, init] = fetchImpl.mock.calls[0] ?? [];
    expect(String(url)).toBe("http://localhost:8080/api/v1/admin/data-scopes");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual({ code: "acme-store", name: "Acme Store" });
    expect(scope.uuid).toBe(scopeFixture.uuid);

    const rejectFetch = mockFetch(scopeFixture, 201);
    await expect(client(rejectFetch).admin.dataScopes.createScope({ code: "bad code", name: "x" })).rejects.toThrow(
      RangeError,
    );
    expect(rejectFetch).not.toHaveBeenCalled();
  });

  it("lists scopes with the includeDisabled flag", async () => {
    const fetchImpl = mockFetch({ scopes: [scopeFixture] });
    const list = await client(fetchImpl).admin.dataScopes.listScopes(true);

    expect(String(fetchImpl.mock.calls[0]?.[0])).toBe(
      "http://localhost:8080/api/v1/admin/data-scopes?includeDisabled=true",
    );
    expect(list.scopes[0]?.code).toBe("acme-store");
  });

  it("addresses scope detail, update and disable by UUID", async () => {
    const uuid = scopeFixture.uuid;
    const detailFetch = mockFetch(scopeFixture);
    await client(detailFetch).admin.dataScopes.getScope(uuid);
    expect(String(detailFetch.mock.calls[0]?.[0])).toBe(`http://localhost:8080/api/v1/admin/data-scopes/${uuid}`);

    const updateFetch = mockFetch(scopeFixture);
    await client(updateFetch).admin.dataScopes.updateScope(uuid, { status: "disabled" });
    expect(updateFetch.mock.calls[0]?.[1]?.method).toBe("PATCH");
    expect(JSON.parse(String(updateFetch.mock.calls[0]?.[1]?.body))).toEqual({ status: "disabled" });

    const disableFetch = mockFetch(null, 204);
    await client(disableFetch).admin.dataScopes.disableScope(uuid);
    expect(String(disableFetch.mock.calls[0]?.[0])).toBe(
      `http://localhost:8080/api/v1/admin/data-scopes/${uuid}/disable`,
    );

    const emptyUpdate = mockFetch(scopeFixture);
    await expect(client(emptyUpdate).admin.dataScopes.updateScope(uuid, {})).rejects.toThrow(RangeError);
    expect(emptyUpdate).not.toHaveBeenCalled();
  });

  it("creates, lists, gets, updates and disables resources under a scope", async () => {
    const scope = scopeFixture.uuid;
    const resource = resourceFixture.uuid;

    const createFetch = mockFetch(resourceFixture, 201);
    await client(createFetch).admin.dataScopes.createResource(scope, { code: "srv-01", name: "Server 1" });
    expect(String(createFetch.mock.calls[0]?.[0])).toBe(
      `http://localhost:8080/api/v1/admin/data-scopes/${scope}/resources`,
    );

    const listFetch = mockFetch({ resources: [resourceFixture] });
    await client(listFetch).admin.dataScopes.listResources(scope, true);
    expect(String(listFetch.mock.calls[0]?.[0])).toBe(
      `http://localhost:8080/api/v1/admin/data-scopes/${scope}/resources?includeDisabled=true`,
    );

    const getFetch = mockFetch(resourceFixture);
    await client(getFetch).admin.dataScopes.getResource(scope, resource);
    expect(String(getFetch.mock.calls[0]?.[0])).toBe(
      `http://localhost:8080/api/v1/admin/data-scopes/${scope}/resources/${resource}`,
    );

    const updateFetch = mockFetch(resourceFixture);
    await client(updateFetch).admin.dataScopes.updateResource(scope, resource, { name: "Server One" });
    expect(updateFetch.mock.calls[0]?.[1]?.method).toBe("PATCH");

    const disableFetch = mockFetch(null, 204);
    await client(disableFetch).admin.dataScopes.disableResource(scope, resource);
    expect(String(disableFetch.mock.calls[0]?.[0])).toBe(
      `http://localhost:8080/api/v1/admin/data-scopes/${scope}/resources/${resource}/disable`,
    );
  });

  it("creates, lists and revokes grants with the closed human/machine shape", async () => {
    const fetchImpl = mockFetch(grantFixture, 201);
    const grant = await client(fetchImpl).admin.dataScopes.createGrant(grantFixture);
    expect(String(fetchImpl.mock.calls[0]?.[0])).toBe("http://localhost:8080/api/v1/admin/data-scope-grants");
    expect(grant.principal.kind).toBe("machine");

    const listFetch = mockFetch({ grants: [grantFixture] });
    await client(listFetch).admin.dataScopes.listGrants({
      kind: "human",
      userUuid: "22222222-2222-2222-2222-222222222222",
    });
    const listUrl = String(listFetch.mock.calls[0]?.[0]);
    expect(listUrl).toContain("/api/v1/admin/data-scope-grants?");
    expect(listUrl).toContain("kind=human");
    expect(listUrl).toContain("userUuid=22222222-2222-2222-2222-222222222222");

    const revokeFetch = mockFetch(null, 204);
    await client(revokeFetch).admin.dataScopes.revokeGrant(grantFixture);
    expect(String(revokeFetch.mock.calls[0]?.[0])).toBe("http://localhost:8080/api/v1/admin/data-scope-grants/revoke");
    expect(revokeFetch.mock.calls[0]?.[1]?.method).toBe("POST");
  });

  it("rejects an invalid grant shape without sending", async () => {
    const fetchImpl = mockFetch(grantFixture, 201);
    await expect(
      client(fetchImpl).admin.dataScopes.createGrant({
        principal: { kind: "human", userUuid: "22222222-2222-2222-2222-222222222222", clientId: "x" },
        target: { kind: "parent" },
        action: "read",
      }),
    ).rejects.toThrow(RangeError);
    await expect(
      client(fetchImpl).admin.dataScopes.createGrant({
        principal: { kind: "machine", clientId: "custd-producer" },
        target: { kind: "parent", scopeUuid: scopeFixture.uuid },
        action: "read",
      }),
    ).rejects.toThrow(RangeError);
    await expect(
      client(fetchImpl).admin.dataScopes.createGrant({
        principal: { kind: "machine", clientId: "custd-producer" },
        target: { kind: "parent" },
        action: "admin" as unknown as "read",
      }),
    ).rejects.toThrow(RangeError);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
