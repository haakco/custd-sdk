import { beforeEach, describe, expect, it, vi } from "vitest";
import { CustdClient } from "./index";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("CustdClient admin", () => {
  it("creates tenants through the admin API", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ slug: "acme", companyName: "Acme Inc", enabled: true }),
      { status: 201, headers: { "Content-Type": "application/json" } },
    ));
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const client = new CustdClient({
      baseUrl: "http://localhost:8080/",
      getToken: () => "admin-token",
    });

    const tenant = await client.admin.tenants.create({ slug: "acme", companyName: "Acme Inc" });

    expect(tenant).toEqual({ slug: "acme", companyName: "Acme Inc", enabled: true });
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8080/api/v1/admin/tenants", expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({ Authorization: "Bearer admin-token" }),
      body: JSON.stringify({ slug: "acme", companyName: "Acme Inc" }),
    }));
  });

  it("does not expose clientSecret on listed OAuth clients", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        clientId: "custd-acme",
        companySlug: "acme",
        scopes: ["events.write"],
        clientSecret: "secret",
      }), { status: 201, headers: { "Content-Type": "application/json" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        clients: [{ clientId: "custd-acme", companySlug: "acme", scopes: ["events.write"] }],
      }), { status: 200, headers: { "Content-Type": "application/json" } }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const client = new CustdClient({
      baseUrl: "http://localhost:8080",
      getToken: () => "admin-token",
    });

    const created = await client.admin.oauthClients.create({
      clientId: "custd-acme",
      companySlug: "acme",
      scopes: ["events.write"],
    });
    const list = await client.admin.oauthClients.list();

    expect(created.clientSecret).toBe("secret");
    expect(list.clients[0]).not.toHaveProperty("clientSecret");
  });
});
