import { beforeEach, describe, expect, it, vi } from "vitest";
import { checkRuntimeReadiness } from "./runtime-readiness.js";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("checkRuntimeReadiness", () => {
  it("checks health, named credentials, tenant binding, and the active schema", async () => {
    const fetchMock = vi.fn(async (input: string | URL, _init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/health")) return new Response("ok");
      if (url.endsWith("/oauth2/token")) {
        return new Response(JSON.stringify({ access_token: "opaque-token" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (url.endsWith("/account/me")) {
        return new Response(JSON.stringify({ companySlug: "tiao-local" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify([{ version: "1.0.0", isActive: true }]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    const result = await checkRuntimeReadiness({
      baseUrl: "http://127.0.0.1:8087",
      tenantSlug: "tiao-local",
      eventTypeSlug: "card-review",
      schemaVersion: "1.0.0",
      oauth: [
        {
          name: "ingest",
          clientId: "ingest-client",
          clientSecret: "ingest-secret",
          tokenUrl: "http://127.0.0.1:4444/oauth2/token",
          scopes: ["events.write"],
        },
        {
          name: "lifecycle",
          clientId: "lifecycle-client",
          clientSecret: "lifecycle-secret",
          tokenUrl: "http://127.0.0.1:4444/oauth2/token",
          scopes: ["privacy.erasure"],
        },
      ],
      fetch: fetchMock as unknown as typeof fetch,
    });

    expect(result).toEqual({
      ready: true,
      tenantSlug: "tiao-local",
      eventTypeSlug: "card-review",
      schemaVersion: "1.0.0",
      credentials: [
        { name: "ingest", tenantSlug: "tiao-local", tokenIssued: true },
        { name: "lifecycle", tenantSlug: "tiao-local", tokenIssued: true },
      ],
    });
    expect(JSON.stringify(result)).not.toContain("secret");
    expect(fetchMock.mock.calls.map(([input, init]) => [String(input), init?.method ?? "GET"])).toEqual([
      ["http://127.0.0.1:8087/health", "GET"],
      ["http://127.0.0.1:4444/oauth2/token", "POST"],
      ["http://127.0.0.1:8087/api/v1/account/me", "GET"],
      ["http://127.0.0.1:4444/oauth2/token", "POST"],
      ["http://127.0.0.1:8087/api/v1/account/me", "GET"],
      ["http://127.0.0.1:8087/api/v1/schemas/card-review/versions", "GET"],
    ]);
    const tokenCalls = fetchMock.mock.calls.filter(([input]) => String(input).endsWith("/oauth2/token"));
    for (const [, init] of tokenCalls) {
      expect(init?.headers).toMatchObject({
        Authorization: expect.stringMatching(/^Basic [A-Za-z0-9+/]+=*$/u),
      });
      const body = new URLSearchParams(String(init?.body ?? ""));
      expect(body.has("client_id")).toBe(false);
      expect(body.has("client_secret")).toBe(false);
    }
  });

  it("uses an explicit schema URL when the registry is separate", async () => {
    const fetchMock = vi.fn(async (input: string | URL) => {
      const url = String(input);
      if (url.endsWith("/health")) return new Response("ok");
      if (url.endsWith("/oauth2/token")) {
        return new Response(JSON.stringify({ access_token: "opaque-token" }));
      }
      if (url.endsWith("/account/me")) {
        return new Response(JSON.stringify({ tenant: { slug: "acme" } }));
      }
      return new Response(JSON.stringify({ versions: [{ version: "2.0.0", enabled: true }] }));
    });

    const result = await checkRuntimeReadiness({
      baseUrl: "https://api.custd.example",
      schemaUrl: "https://schema.custd.example",
      tenantSlug: "acme",
      eventTypeSlug: "card-review",
      schemaVersion: "2.0.0",
      oauth: [
        {
          name: "reporting",
          clientId: "reporting-client",
          clientSecret: "reporting-secret",
          tokenUrl: "https://identity.custd.example/oauth2/token",
        },
      ],
      fetch: fetchMock as unknown as typeof fetch,
    });

    expect(result.ready).toBe(true);
    expect(fetchMock.mock.calls[fetchMock.mock.calls.length - 1]?.[0]).toBe(
      "https://schema.custd.example/api/v1/schemas/card-review/versions",
    );
  });

  it("fails without exposing a secret when token issuance fails", async () => {
    const fetchMock = vi.fn(async (input: string | URL) => {
      if (String(input).endsWith("/health")) return new Response("ok");
      return new Response("unauthorized", { status: 401 });
    });

    await expect(
      checkRuntimeReadiness({
        baseUrl: "http://127.0.0.1:8087",
        tenantSlug: "tiao-local",
        eventTypeSlug: "card-review",
        schemaVersion: "1.0.0",
        oauth: [
          {
            name: "ingest",
            clientId: "ingest-client",
            clientSecret: "super-secret",
            tokenUrl: "http://127.0.0.1:4444/oauth2/token",
          },
        ],
        fetch: fetchMock as unknown as typeof fetch,
      }),
    ).rejects.toThrow(/credential "ingest" token issuance failed \(HTTP 401\)/u);
  });

  it("fails when a named credential is bound to another tenant", async () => {
    const fetchMock = vi.fn(async (input: string | URL) => {
      const url = String(input);
      if (url.endsWith("/health")) return new Response("ok");
      if (url.endsWith("/oauth2/token")) {
        return new Response(JSON.stringify({ access_token: "opaque-token" }));
      }
      return new Response(JSON.stringify({ companySlug: "other-tenant" }));
    });

    await expect(
      checkRuntimeReadiness({
        baseUrl: "https://api.custd.example",
        tenantSlug: "acme",
        eventTypeSlug: "card-review",
        schemaVersion: "1.0.0",
        oauth: [
          {
            name: "ingest",
            clientId: "ingest-client",
            clientSecret: "ingest-secret",
            tokenUrl: "https://identity.custd.example/oauth2/token",
          },
        ],
        fetch: fetchMock as unknown as typeof fetch,
      }),
    ).rejects.toThrow(/credential "ingest" tenant binding failed/u);
  });

  it("fails closed when the requested schema version is not active", async () => {
    const fetchMock = vi.fn(async (input: string | URL) => {
      const url = String(input);
      if (url.endsWith("/health")) return new Response("ok");
      if (url.endsWith("/oauth2/token")) {
        return new Response(JSON.stringify({ access_token: "opaque-token" }));
      }
      if (url.endsWith("/account/me")) {
        return new Response(JSON.stringify({ companySlug: "acme" }));
      }
      return new Response(JSON.stringify([{ version: "1.0.0", isActive: false }]));
    });

    await expect(
      checkRuntimeReadiness({
        baseUrl: "https://api.custd.example",
        tenantSlug: "acme",
        eventTypeSlug: "card-review",
        schemaVersion: "1.0.0",
        oauth: [
          {
            name: "ingest",
            clientId: "ingest-client",
            clientSecret: "ingest-secret",
            tokenUrl: "https://identity.custd.example/oauth2/token",
          },
        ],
        fetch: fetchMock as unknown as typeof fetch,
      }),
    ).rejects.toThrow(/active schema "card-review@1\.0\.0" is not active/u);
  });
});
