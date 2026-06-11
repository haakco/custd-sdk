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

  it("manages browser sites through the admin API", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        siteUuid: "site-123",
        companySlug: "acme",
        name: "Docs",
        identityMode: "cookieless",
        allowedOrigins: ["https://example.com"],
        rateLimitPerMinute: 600,
        retentionDays: 365,
        enabled: true,
        writeKey: "site_pk_test",
      }), { status: 201, headers: { "Content-Type": "application/json" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ writeKey: "site_pk_next" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const client = new CustdClient({ baseUrl: "http://localhost:8080", getToken: () => "admin-token" });

    const created = await client.admin.sites.create({
      companySlug: "acme",
      name: "Docs",
      identityMode: "cookieless",
      allowedOrigins: ["https://example.com"],
    });
    const rotated = await client.admin.sites.rotateWriteKey("site-123");

    expect(created.writeKey).toBe("site_pk_test");
    expect(rotated.writeKey).toBe("site_pk_next");
    expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:8080/api/v1/admin/sites");
    expect(fetchMock.mock.calls[1][0]).toBe("http://localhost:8080/api/v1/admin/sites/site-123/rotate-write-key");
  });

  it("lists, gets, and deletes browser sites without exposing write keys", async () => {
    const site = {
      siteUuid: "site-123",
      companySlug: "acme",
      name: "Docs",
      identityMode: "cookieless",
      allowedOrigins: ["https://example.com"],
      rateLimitPerMinute: 600,
      retentionDays: 365,
      enabled: true,
      writeKey: "site_pk_should_not_leak",
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ sites: [site] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify(site), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const client = new CustdClient({ baseUrl: "http://localhost:8080", getToken: () => "admin-token" });

    const listed = await client.admin.sites.list();
    const got = await client.admin.sites.get("site-123");
    await client.admin.sites.delete("site-123");

    expect(listed.sites[0]).not.toHaveProperty("writeKey");
    expect(got).not.toHaveProperty("writeKey");
    expect(fetchMock.mock.calls.map((call) => [call[0], call[1]?.method])).toEqual([
      ["http://localhost:8080/api/v1/admin/sites", "GET"],
      ["http://localhost:8080/api/v1/admin/sites/site-123", "GET"],
      ["http://localhost:8080/api/v1/admin/sites/site-123", "DELETE"],
    ]);
  });

  it("registers and versions schemas through the admin API", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        schemas: [{ eventTypeSlug: "courib.delivery.created", version: "1.0.0" }],
      }), { status: 200, headers: { "Content-Type": "application/json" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        eventTypeSlug: "courib.delivery.created",
        version: "1.0.0",
        jsonSchema: { type: "object" },
      }), { status: 201, headers: { "Content-Type": "application/json" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        eventTypeSlug: "courib.delivery.created",
        version: "1.1.0",
        jsonSchema: { type: "object" },
      }), { status: 201, headers: { "Content-Type": "application/json" } }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const client = new CustdClient({ baseUrl: "http://localhost:8080", getToken: () => "admin-token" });

    const list = await client.admin.schemas.list();
    const registered = await client.admin.schemas.register({
      eventTypeSlug: "courib.delivery.created",
      version: "1.0.0",
      jsonSchema: { type: "object" },
    });
    const next = await client.admin.schemas.createVersion("courib.delivery.created", {
      version: "1.1.0",
      jsonSchema: { type: "object" },
    });

    expect(list.schemas[0].eventTypeSlug).toBe("courib.delivery.created");
    expect(registered.version).toBe("1.0.0");
    expect(next.version).toBe("1.1.0");
    expect(fetchMock.mock.calls.map((call) => [call[0], call[1]?.method])).toEqual([
      ["http://localhost:8080/api/v1/admin/schemas", "GET"],
      ["http://localhost:8080/api/v1/admin/schemas", "POST"],
      ["http://localhost:8080/api/v1/admin/schemas/courib.delivery.created/versions", "POST"],
    ]);
  });
});
