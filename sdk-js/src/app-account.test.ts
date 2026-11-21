import { describe, expect, it } from "vitest";
import {
  appAccountNavigation,
  CurrentAppProfileClient,
  CurrentAppProfileError,
  createAppAccountEntry,
} from "./app-account.js";

describe("app account navigation", () => {
  it("builds the same-tab entry without sending the return destination as request data", () => {
    expect(
      appAccountNavigation({ issuer: "https://auth.canvas.test/", applicationHome: "https://canvas.test/" }),
    ).toEqual({ settingsUrl: "https://auth.canvas.test/settings", returnUrl: "https://canvas.test/" });
    expect(() =>
      appAccountNavigation({
        issuer: "https://auth.canvas.test/?return=https://elsewhere.test",
        applicationHome: "https://canvas.test/",
      }),
    ).toThrow(TypeError);
  });
});

it("issues an account entry for the exact issuer and refuses a different form action", async () => {
  const actionUrl = "https://auth.canvas.test/settings/entry";
  const applicationOrigin = "https://canvas.test";
  const ticket = "A".repeat(43);
  const options = { issuer: "https://auth.canvas.test/", applicationOrigin, accessToken: "test-token" };
  const entry = await createAppAccountEntry({
    ...options,
    fetch: async (input, init) => {
      const request = new Request(input, init);
      expect(request.method).toBe("POST");
      expect(request.url).toBe(`${actionUrl}/ticket`);
      expect(await request.json()).toEqual({ applicationOrigin });
      expect(request.headers.get("Authorization")).toBe("Bearer test-token");
      expect(request.redirect).toBe("error");
      expect(request.cache).toBe("no-store");
      expect(request.credentials).toBe("omit");
      return Response.json({ actionUrl, ticket });
    },
  });
  expect(entry).toEqual({ actionUrl, ticket });
  await expect(
    createAppAccountEntry({
      ...options,
      fetch: async () => Response.json({ actionUrl: `${actionUrl}?ticket=${ticket}`, ticket }),
    }),
  ).rejects.toThrow("invalid app account entry response");
});

describe("current application profile", () => {
  it("uses only a fresh scoped bearer token for each typed profile and photo operation", async () => {
    const calls: Request[] = [];
    const profile = {
      fields: [
        {
          fieldKey: "display_name",
          value: "Canvas Member",
          present: true,
          initialized: true,
          required: false,
          editable: true,
          editableBy: "user",
        },
      ],
      managedPhoto: true,
    };
    const photo = new Blob([new Uint8Array([1, 2])], { type: "image/png" });
    let tokenNumber = 0;
    const client = new CurrentAppProfileClient({
      apiBaseUrl: "https://api.custd.test",
      accessToken: () => `test-token-${++tokenNumber}`,
      fetch: async (input, init) => {
        const request = new Request(input, init);
        calls.push(request);
        if (request.url.endsWith("/photo") && request.method === "GET") {
          return new Response(photo, { headers: { "Content-Type": "image/png" } });
        }
        return Response.json(profile);
      },
    });
    const update = { values: [{ fieldKey: "display_name", value: "Canvas Member" }] };
    expect(await client.read()).toEqual(profile);
    expect(await client.update(update)).toEqual(profile);
    expect(new Uint8Array(await (await client.readPhoto()).arrayBuffer())).toEqual(new Uint8Array([1, 2]));
    expect(await client.uploadPhoto(photo)).toEqual(profile);
    expect(await client.removePhoto()).toEqual(profile);
    expect(calls.map((request) => [request.method, new URL(request.url).pathname])).toEqual([
      ["GET", "/api/v1/app/profile"],
      ["PATCH", "/api/v1/app/profile"],
      ["GET", "/api/v1/app/profile/photo"],
      ["PUT", "/api/v1/app/profile/photo"],
      ["DELETE", "/api/v1/app/profile/photo"],
    ]);
    expect(calls.map((request) => request.headers.get("Authorization"))).toEqual([
      "Bearer test-token-1",
      "Bearer test-token-2",
      "Bearer test-token-3",
      "Bearer test-token-4",
      "Bearer test-token-5",
    ]);
    expect(calls.every((request) => request.credentials === "omit" && request.redirect === "error")).toBe(true);
    expect(await calls[1]?.json()).toEqual(update);
    expect(await calls[3]?.blob()).toEqual(photo);
  });

  it("initializes by POST and preserves the server's winning value or explicit clear", async () => {
    const requests: Request[] = [];
    const cleared = {
      fieldKey: "picture_url",
      present: false,
      initialized: true,
      required: false,
      editableBy: "user",
      editable: true,
    };
    const initialized = { ...cleared, fieldKey: "display_name", present: true, value: "Saved name" };
    const client = new CurrentAppProfileClient({
      apiBaseUrl: "https://api.custd.test",
      accessToken: () => "test-token",
      fetch: async (input, init) => {
        requests.push(new Request(input, init));
        return Response.json({ fields: [initialized, cleared] });
      },
    });
    const name = { values: [{ fieldKey: "display_name", value: "Imported name" }] };
    const photo = new Blob([new Uint8Array([1, 2])], { type: "image/png" });

    expect((await client.initialize(name)).fields[0]).toEqual(initialized);
    expect((await client.initializePhoto(photo)).fields[1]).toEqual(cleared);
    expect(requests.map((req) => [req.method, new URL(req.url).pathname])).toEqual([
      ["POST", "/api/v1/app/profile"],
      ["POST", "/api/v1/app/profile/photo"],
    ]);
    expect(await requests[0]?.json()).toEqual(name);
    expect(await requests[1]?.blob()).toEqual(photo);
  });

  it("preserves status for rejected grants and refuses malformed successful profile bodies", async () => {
    const config = { apiBaseUrl: "https://api.custd.test", accessToken: () => "test-token" };
    const rejected = new CurrentAppProfileClient({
      ...config,
      fetch: async () => new Response("private details", { status: 403 }),
    });
    await expect(rejected.read()).rejects.toEqual(new CurrentAppProfileError(403));
    const malformed = new CurrentAppProfileClient({ ...config, fetch: async () => Response.json({ fields: [null] }) });
    await expect(malformed.read()).rejects.toThrow(TypeError);
  });
});
