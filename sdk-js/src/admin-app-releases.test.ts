import { describe, expect, it, vi } from "vitest";
import type { AppReleaseCreateRequest } from "./admin-app-releases";
import type { AuthProjectDesiredState, AuthProjectStatus } from "./admin-auth-projects";
import { CustdClient } from "./index";

const releasesUrl = "http://localhost:8080/api/v1/admin/auth-projects/project-1/environments/environment-1/releases";
const options = { owningUserUuid: "01957abc-0000-7000-8000-0000000000aa" };

function clientAnswering(body: unknown): { client: CustdClient; fetchImpl: ReturnType<typeof vi.fn> } {
  const fetchImpl = vi
    .fn()
    .mockImplementation(
      async () => new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } }),
    );
  const client = new CustdClient({
    baseUrl: "http://localhost:8080",
    getToken: () => "admin-token",
    fetch: fetchImpl as unknown as typeof fetch,
  });
  return { client, fetchImpl };
}

function sent(fetchImpl: ReturnType<typeof vi.fn>): { url: string; init: RequestInit } {
  const [url, init] = fetchImpl.mock.calls[0] ?? [];
  return { url: String(url), init: init as RequestInit };
}

function header(init: RequestInit, name: string): string | undefined {
  return (init.headers as Record<string, string>)[name];
}

describe("app release operations", () => {
  it("lists, creates, verifies and promotes on the environment's release routes", async () => {
    const createRequest: AppReleaseCreateRequest = {
      files: [{ path: "index.html", size: 4, sha256: "ab", contentType: "text/html" }],
      routing: {
        spaFallbacks: [{ prefix: "/", file: "index.html" }],
        cache: [{ match: "assets/*", mode: "immutable" }],
      },
    };
    const cases: { call: (c: CustdClient) => Promise<unknown>; method: string; url: string; body?: string }[] = [
      {
        call: (c) => c.admin.authProjects.listAppReleases("project-1", "environment-1", 5, options),
        method: "GET",
        url: `${releasesUrl}?limit=5`,
      },
      {
        call: (c) => c.admin.authProjects.createAppRelease("project-1", "environment-1", createRequest, options),
        method: "POST",
        url: releasesUrl,
        body: JSON.stringify(createRequest),
      },
      {
        call: (c) => c.admin.authProjects.verifyAppRelease("project-1", "environment-1", "r 1", options),
        method: "POST",
        url: `${releasesUrl}/r%201/verify`,
      },
      {
        call: (c) => c.admin.authProjects.promoteAppRelease("project-1", "environment-1", "r1", options),
        method: "POST",
        url: `${releasesUrl}/r1/promote`,
      },
    ];
    for (const testCase of cases) {
      const { client, fetchImpl } = clientAnswering({ releaseId: "r1" });
      await testCase.call(client);
      const { url, init } = sent(fetchImpl);
      expect({ method: init.method, url, body: init.body }).toEqual({
        method: testCase.method,
        url: testCase.url,
        body: testCase.body,
      });
      expect(header(init, "X-Custd-Owning-User-UUID")).toBe(options.owningUserUuid);
    }
  });

  it("uploads a file as its raw bytes with the manifest path in the query", async () => {
    const { client, fetchImpl } = clientAnswering({ path: "assets/a b.js", size: 3, sha256: "cd" });
    const bytes = new Uint8Array([0, 1, 104]);
    const uploaded = await client.admin.authProjects.uploadAppReleaseFile(
      "project-1",
      "environment-1",
      "r1",
      "assets/a b.js",
      bytes,
      options,
    );
    const { url, init } = sent(fetchImpl);
    expect(url).toBe(`${releasesUrl}/r1/files?path=assets%2Fa%20b.js`);
    expect(init.method).toBe("POST");
    expect(header(init, "Content-Type")).toBe("application/octet-stream");
    expect(init.body).toEqual(bytes);
    expect(uploaded.sha256).toBe("cd");
  });
});

describe("hosting desired state", () => {
  it("types the hosting section and the hosted serving identity", () => {
    const desired: AuthProjectDesiredState = {
      identityMode: "isolated",
      registrationPolicy: "invite_only",
      loginPaused: false,
      audiences: null,
      profileFields: null,
      hosting: {
        mode: "enabled",
        capabilities: ["tracking", "sign_in"],
        ingestTarget: { scopeUuid: "scope-1", resourceUuid: "resource-1" },
      },
    };
    const status: Pick<AuthProjectStatus, "hosting"> = {
      hosting: {
        host: "shop.apps.example",
        origin: "https://shop.apps.example",
        signIn: { clientId: "c1", audience: "shop", redirectUri: "https://shop.apps.example/auth/callback" },
      },
    };
    expect(JSON.parse(JSON.stringify(desired)).hosting.ingestTarget.scopeUuid).toBe("scope-1");
    expect(status.hosting?.signIn?.audience).toBe("shop");
  });
});
